import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const expected='I hereby accept all cookies, forever. No need to ask me ever again. letemcookie.com';
for (const path of ['extension/share.js','share/share.js']) {
 function setup(fail=false) {
  const handlers={},opens=[],copies=[],hint={textContent:''};
  const ctx=vm.createContext({navigator:{clipboard:{writeText:async text=>{if(fail)throw Error('blocked');copies.push(text);}}},document:{getElementById:id=>id==='hint'?hint:{addEventListener:(event,fn)=>handlers[id]=fn},createElement:()=>({value:'',select(){},remove(){}}),body:{append(){}},execCommand:()=>false},window:{open:(...args)=>opens.push(args)}});
  vm.runInContext(fs.readFileSync(new URL('../'+path,import.meta.url),'utf8'),ctx);
  return {handlers,opens,copies,hint};
 }
 test(path+': copy uses exactly approved text',async()=>{const c=setup();await c.handlers.copy();assert.deepEqual(c.copies,[expected]);assert.equal(c.hint.textContent,'Copied.');assert.deepEqual(c.opens,[]);});
 test(path+': X opens a draft, never submits',()=>{const c=setup();c.handlers.x();assert.equal(c.opens.length,1);const url=new URL(c.opens[0][0]);assert.equal(url.origin,'https://x.com');assert.equal(url.pathname,'/intent/post');assert.equal(url.searchParams.get('text'),expected);assert.equal(c.opens[0][2],'noopener');});
 test(path+': Substack copies before opening note composer',async()=>{const c=setup();await c.handlers.substack();assert.deepEqual(c.copies,[expected]);assert.equal(c.opens[0][0],'https://substack.com/notes');});
 test(path+': Substack clipboard failure is honest',async()=>{const c=setup(true);await c.handlers.substack();assert.equal(c.hint.textContent,'Copy the text above into your new note.');assert.equal(c.opens.length,1);});
 test(path+': clipboard failure is not claimed as success',async()=>{const c=setup(true);await c.handlers.copy();assert.match(c.hint.textContent,/Select the text/);});
}
