import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {webcrypto} from 'node:crypto';
const source=fs.readFileSync(new URL('../extension/counter.js',import.meta.url),'utf8').replace('PENDING_COUNTER_ENDPOINT','https://counter.example');
function setup(initial={},responses=[]) {
 const state=structuredClone(initial),calls=[];
 const context=vm.createContext({crypto:webcrypto,Date,AbortSignal,
  chrome:{storage:{local:{get:async(keys)=>Object.fromEntries((Array.isArray(keys)?keys:[keys]).map(k=>[k,structuredClone(state[k])])),set:async(value)=>Object.assign(state,structuredClone(value))}},alarms:{create(){},onAlarm:{addListener(){}}},runtime:{onStartup:{addListener(){}}}},
  fetch:async(url,options)=>{calls.push({url,options});if(responses[0] instanceof Error)throw responses.shift();return responses.shift()||{ok:true};}
 });
 vm.runInContext('let update=Promise.resolve();\n'+source,context);
 return {state,calls,run:expr=>vm.runInContext(expr,context)};
}
test('disabled counting stays local and emits nothing',async()=>{const c=setup();await c.run('recordCookie()');await c.run('flushCounter()');assert.equal(c.state.eatenCount,1);assert.deepEqual(c.calls,[]);assert.deepEqual(c.state.counterQueue,[]);});
test('enabled events contain only random retry ID and timestamp',async()=>{const c=setup({counterEnabled:true});await c.run('recordCookie()');assert.equal(c.state.eatenCount,1);assert.deepEqual(Object.keys(c.state.counterQueue[0]).sort(),['at','id']);await c.run('flushCounter()');assert.equal(c.calls.length,1);assert.deepEqual(Object.keys(JSON.parse(c.calls[0].options.body)),['event']);assert.equal(c.calls[0].options.credentials,'omit');assert.deepEqual(c.state.counterQueue,[]);});
test('failed delivery preserves same UUID for retry',async()=>{const c=setup({counterEnabled:true},[new Error('offline')]);await c.run('recordCookie()');const id=c.state.counterQueue[0].id;await c.run('flushCounter()');assert.equal(c.state.counterQueue[0].id,id);await c.run('flushCounter()');assert.equal(JSON.parse(c.calls[1].options.body).event,id);assert.deepEqual(c.state.counterQueue,[]);});
test('turning counting off deletes pending events',async()=>{const c=setup({counterEnabled:false,counterQueue:[{id:webcrypto.randomUUID(),at:Date.now()}]});await c.run('flushCounter()');assert.deepEqual(c.state.counterQueue,[]);assert.equal(c.calls.length,0);});
test('old events expire and queue is bounded',async()=>{const c=setup({counterEnabled:true,counterQueue:[{id:'old',at:Date.now()-25*3600*1000}]});await c.run('flushCounter()');assert.equal(c.calls.length,0);assert.deepEqual(c.state.counterQueue,[]);c.state.counterQueue=Array.from({length:500},()=>({id:webcrypto.randomUUID(),at:Date.now()}));await c.run('recordCookie()');assert.equal(c.state.counterQueue.length,500);});
function installSetup(initial={}) {
 const listeners={},tabs=[],state=structuredClone(initial);
 const noop={addListener(){}};
 const context=vm.createContext({chrome:{runtime:{getURL:x=>'chrome-extension://test/'+x,onMessage:noop,onInstalled:{addListener:f=>listeners.install=f}},tabs:{create:async x=>tabs.push(x)},storage:{local:{get:async keys=>Object.fromEntries((Array.isArray(keys)?keys:[keys]).map(k=>[k,state[k]])),set:async x=>Object.assign(state,x)},onChanged:noop}},importScripts(){},console});
 vm.runInContext(fs.readFileSync(new URL('../extension/background.js',import.meta.url),'utf8'),context);
 return {state,tabs,install:listeners.install};
}
test('new installs count by default without a choice tab',async()=>{const c=installSetup();await c.install({reason:'install'});assert.equal(c.state.counterEnabled,true);assert.equal(c.state.counterChoiceVersion,1);assert.deepEqual(c.tabs,[]);});
test('existing installs stay off and get a choice once, including when dismissed',async()=>{const c=installSetup();await c.install({reason:'update'});assert.equal(c.state.counterEnabled,false);assert.equal(c.tabs.length,1);await c.install({reason:'update'});assert.equal(c.tabs.length,1);});
test('a previous opt-out is never reset on update',async()=>{const c=installSetup({counterEnabled:false,counterChoiceVersion:1});await c.install({reason:'update'});assert.equal(c.state.counterEnabled,false);assert.equal(c.tabs.length,0);});
test('missed picks queue a kind:miss event flushed to /miss',async()=>{const c=setup({counterEnabled:true});await c.run('recordMiss()');assert.equal(c.state.missedCount,1);assert.equal(c.state.counterQueue[0].kind,'miss');await c.run('flushCounter()');assert.equal(c.calls.length,1);assert.ok(c.calls[0].url.endsWith('/miss'));assert.deepEqual(c.state.counterQueue,[]);});
test('eat and miss events flush to their own endpoints',async()=>{const c=setup({counterEnabled:true});await c.run('recordCookie()');await c.run('recordMiss()');await c.run('flushCounter()');assert.deepEqual(c.calls.map(x=>x.url.split('/').pop()),['eat','miss']);});
test('disabled counting keeps misses local',async()=>{const c=setup();await c.run('recordMiss()');await c.run('flushCounter()');assert.equal(c.state.missedCount,1);assert.deepEqual(c.calls,[]);assert.deepEqual(c.state.counterQueue,[]);});
function messageSetup(initial={},responses=[]) {
 const listeners={},tabs=[],state=structuredClone(initial),calls=[];
 const context=vm.createContext({crypto:webcrypto,Date,AbortSignal,console,
  chrome:{runtime:{getURL:x=>'chrome-extension://test/'+x,onMessage:{addListener:f=>listeners.message=f},onInstalled:{addListener(){}},onStartup:{addListener(){}},getManifest:()=>({version:'0.3.1'})},
   tabs:{create:async x=>tabs.push(x)},
   action:{setBadgeBackgroundColor:async()=>{},setBadgeText:async()=>{}},
   alarms:{create(){},onAlarm:{addListener(){}}},
   storage:{local:{get:async keys=>Object.fromEntries((Array.isArray(keys)?keys:[keys]).map(k=>[k,structuredClone(state[k])])),set:async x=>Object.assign(state,structuredClone(x))},onChanged:{addListener(){}}}},
  fetch:async(url,options)=>{calls.push({url,options});if(responses[0] instanceof Error)throw responses.shift();return responses.shift()||{ok:true};},
  importScripts:file=>{vm.runInContext(fs.readFileSync(new URL('../extension/'+file,import.meta.url),'utf8'),context);}
 });
 vm.runInContext(fs.readFileSync(new URL('../extension/background.js',import.meta.url),'utf8'),context);
 return {state,calls,tabs,run:expr=>vm.runInContext(expr,context),msg:(m,sender)=>listeners.message(m,sender||{tab:{id:1},url:'https://example.test/page'})};
}
test('a picked missed banner counts one anonymous miss',async()=>{const c=messageSetup({counterEnabled:true,counterChoiceVersion:1,firstNoticeShown:true});c.msg({type:'LEC_PICKED',host:'example.test',selector:'#accept'});await c.run('update');assert.equal(c.state.missedCount,1);assert.equal(c.calls.length,1);assert.ok(c.calls[0].url.endsWith('/miss'));assert.deepEqual(c.state.counterQueue,[]);assert.deepEqual(c.tabs,[]);});
test('a pick with reportMiss still opens only the manual GitHub draft',async()=>{const c=messageSetup({counterEnabled:false,counterChoiceVersion:1,firstNoticeShown:true,reportMiss:true});c.msg({type:'LEC_PICKED',host:'example.test',selector:'#accept'});await c.run('update');assert.equal(c.state.missedCount,1);assert.deepEqual(c.calls,[]);assert.equal(c.tabs.length,1);assert.ok(c.tabs[0].url.startsWith('https://github.com/letemcookie/letemcookie/issues/new'));});
