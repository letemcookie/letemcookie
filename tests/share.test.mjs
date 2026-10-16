import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const expected='I hereby accept all cookies, forever. No need to ask me ever again. letemcookie.com';
for (const path of ['extension/share.js','share/share.js']) {
 function setup(fail=false) {
  const handlers={},copies=[],hint={textContent:''};
  const ctx=vm.createContext({navigator:{clipboard:{writeText:async text=>{if(fail)throw Error('blocked');copies.push(text);}}},document:{getElementById:id=>id==='hint'?hint:{addEventListener:(event,fn)=>handlers[id]=fn},createElement:()=>({value:'',select(){},remove(){}}),body:{append(){}},execCommand:()=>false}});
  vm.runInContext(fs.readFileSync(new URL('../'+path,import.meta.url),'utf8'),ctx);
  return {handlers,copies,hint};
 }
 test(path+': copy includes Substack handle',async()=>{const c=setup();await c.handlers.copy();assert.deepEqual(c.copies,[expected+' @cb']);assert.equal(c.hint.textContent,'Copied. Paste into your note.');});
 test(path+': Substack copy starts in tap without canceling navigation',async()=>{const c=setup();assert.equal(c.handlers.substack(),undefined);assert.deepEqual(c.copies,[expected+' @cb']);await new Promise(r=>setImmediate(r));assert.match(c.hint.textContent,/Copied/);});
 test(path+': clipboard failure is not claimed as success',async()=>{const c=setup(true);await c.handlers.copy();assert.match(c.hint.textContent,/Select the text/);});
}
for(const path of ['index.html','share/index.html','extension/share.html']) {
 test(path+': native current Substack compose route and channel handle',()=>{
 const html=fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
 const anchor=html.match(/<a id="substack"[^>]+>/)[0];
 const url=new URL(anchor.match(/href="([^"]+)"/)[1].replaceAll('&amp;','&'));
 assert.equal(url.origin,'https://substack.com');assert.equal(url.pathname,'/');assert.equal(url.searchParams.get('action'),'compose');assert.equal(url.searchParams.get('message'),expected+' @cb');assert.match(anchor,/target="_blank"/);assert.match(anchor,/rel="noopener noreferrer"/);
 if(path==='extension/share.html') assert.match(html,/Substack opens empty\? Copy, then paste\./);
 else {assert.doesNotMatch(html,/Substack opens empty/);assert.match(html, /id="hint" role="status"><\/p>/);assert.match(html,/Never see a cookie banner again:/);assert.match(html,/Developers, never worry about cookies:/);}
 });
 test(path+': X native intent and channel handle',()=>{
 const html=fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');const anchor=html.match(/<a id="x"[^>]+>/)[0];const url=new URL(anchor.match(/href="([^"]+)"/)[1]);
 assert.equal(url.origin,'https://twitter.com');assert.equal(url.pathname,'/intent/tweet');assert.equal(url.searchParams.get('text'),expected+' @chrisbest');
 });
}
