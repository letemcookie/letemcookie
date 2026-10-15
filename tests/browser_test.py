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
 source=(ROOT/'extension/content.js').read_text()
 for kind,handler,want in [('remove','this.remove()',1),('hide',"this.style.display='none'",1),('disabled','this.disabled=true',0),('unchanged','void 0',0)]:
  html='<button id="onetrust-accept-btn-handler" onclick="'+handler+'">Accept all cookies</button>'
  call('Page.navigate',{'url':'data:text/html,'+urllib.parse.quote(html)});time.sleep(.15)
  js('window.events=[];window.chrome={runtime:{lastError:null,sendMessage:(x,cb)=>{events.push(x);if(cb)cb()}}};')
  js(source);time.sleep(2.3)
  got=js("events.filter(x=>x.type==='LEC_BANNER_GONE').length")
  assert got==want,(kind,got,want)
  print('PASS banner',kind)
 # Translated accept-all workflows must enable every category before save.
 fixtures=[]
 cats=['functional','statistic','marketing']
 inputs=''.join(f'<span id="switch-cookie_cat_{n}"><input id="c{i}" type="checkbox"><label for="c{i}">Allow {n}</label></span>' for i,n in enumerate(cats))
 fixtures.append(('CookieInformation','<div id="coiOverlay"><button class="coi-banner__nextpage">Options</button>'+inputs+'<button class="coi-banner__accept" onclick="window.saved=[...document.querySelectorAll(\'input\')].map(x=>x.checked);document.getElementById(\'coiOverlay\').remove()">Save</button></div>',3))
 inputs=''.join(f'<input type="checkbox" id="toggle_cat{i}"><label for="toggle_cat{i}">Allow {i}</label>' for i in range(1,12))
 fixtures.append(('Tealium','<div id="__tealiumGDPRecModal"><button class="consent_prefs_button">Options</button><div id="__tealiumGDPRcpPrefs">'+inputs+'<button id="preferences_prompt_submit" onclick="window.saved=[...document.querySelectorAll(\'input\')].map(x=>x.checked);document.getElementById(\'__tealiumGDPRecModal\').remove()">Save</button></div></div>',11))
 for name,html,count in fixtures:
  call('Page.navigate',{'url':'data:text/html,'+urllib.parse.quote(html)});time.sleep(.15)
  js('window.events=[];window.chrome={runtime:{lastError:null,sendMessage:(x,cb)=>{events.push(x);if(cb)cb()}}};')
  js(source);time.sleep(3)
  assert js('window.saved')==[True]*count,(name,js('window.saved'))
  assert js("events.filter(x=>x.type==='LEC_BANNER_GONE').length")==1,name
  print('PASS full consent saved',name,count,'categories')
 ws.close()
finally:p.terminate();p.wait(timeout=10)
