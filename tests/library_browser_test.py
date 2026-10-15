import subprocess,time,json,urllib.request,websocket,base64,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
p=subprocess.Popen(['/usr/bin/google-chrome','--headless','--no-sandbox','--disable-gpu','--remote-debugging-port=9222','--remote-allow-origins=*','--user-data-dir=/tmp/cookie-test-profile','about:blank'],stdout=open('/tmp/cookie-test-chrome.log','w'),stderr=subprocess.STDOUT)
try:
 for _ in range(60):
  try: targets=json.load(urllib.request.urlopen('http://127.0.0.1:9222/json'));break
  except:time.sleep(.1)
 ws=websocket.create_connection(next(t['webSocketDebuggerUrl'] for t in targets if t['type']=='page'));seq=0
 def call(method,params={}):
  global seq
  seq+=1;ws.send(json.dumps({'id':seq,'method':method,'params':params}))
  while True:
   r=json.loads(ws.recv())
   if r.get('id')==seq:
    if 'error'in r:raise Exception(r['error'])
    return r.get('result',{})
 def js(code):return call('Runtime.evaluate',{'expression':code,'awaitPromise':True,'returnByValue':True}).get('result',{}).get('value')
 source=(ROOT/'letemcookie.js').read_text()
 call('Page.navigate',{'url':'about:blank'});time.sleep(.2)
 # Route a clean same-origin fixture without visiting an external website.
 call('Page.setDocumentContent',{'frameId':call('Page.getFrameTree')['frameTree']['frame']['id'],'html':'<html><body><button id="prefs">Cookie choices</button></body></html>'})
 # A simple storage object makes fixture state deterministic.
 js("window.store={};Object.defineProperty(window,'localStorage',{value:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]},configurable:true});void 0")
 js(source)
 assert js("document.querySelectorAll('[data-letemcookie-banner]').length")==1
 js("window.calls=[];LetEmCookie.onConsent((c,r)=>calls.push([c,r.source]));document.querySelectorAll('[data-letemcookie-banner] button')[1].click()")
 assert js('LetEmCookie.consent')=='necessary'
 assert js('calls')==[['necessary','user']]
 js("LetEmCookie.showPreferences();document.querySelectorAll('[data-letemcookie-banner] button')[0].click()")
 assert js('LetEmCookie.consent')=='all'
 js('LetEmCookie.resetConsent()')
 assert js('LetEmCookie.consent')=='necessary'
 js("document.documentElement.setAttribute('data-letemcookie-extension','1')")
 time.sleep(.05)
 assert js('LetEmCookie.consent')=='necessary'
 js('LetEmCookie.showPreferences();void 0')
 js("window.chrome={runtime:{sendMessage:(m,cb)=>cb&&cb(),onMessage:{addListener(){}}}}")
 js((ROOT/'extension/content.js').read_text());time.sleep(.2)
 assert js("document.querySelectorAll('[data-letemcookie-manual]').length")==1
 assert js("document.querySelector('[data-letemcookie-manual] button').textContent")=='Allow optional cookies'
 print('PASS library accept/reject, callbacks, withdrawal, explicit choice precedence, manual controls')
 ws.close()
finally:p.terminate();p.wait(timeout=10)
