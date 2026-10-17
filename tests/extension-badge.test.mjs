import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

function setup(initial={}) {
  const state=structuredClone(initial),badge=[],tabsCreated=[],listeners={};
  const context=vm.createContext({
    chrome:{
      runtime:{getURL:x=>'chrome-extension://test/'+x,onMessage:{addListener:f=>listeners.message=f},onInstalled:{addListener(){}},onStartup:{addListener(){}}},
      tabs:{create:async x=>tabsCreated.push(x)},
      action:{
        setBadgeBackgroundColor:async value=>badge.push(['color',value]),
        setBadgeText:async value=>badge.push(['text',value])
      },
      storage:{local:{get:async keys=>Object.fromEntries((Array.isArray(keys)?keys:[keys]).map(k=>[k,structuredClone(state[k])])),set:async x=>Object.assign(state,structuredClone(x))},onChanged:{addListener(){}}}
    },
    importScripts(){},
    recordCookie:async()=>{state.recorded=(state.recorded||0)+1;},
    flushCounter:async()=>{state.flushed=(state.flushed||0)+1;},
    console
  });
  vm.runInContext(fs.readFileSync(new URL('../extension/background.js',import.meta.url),'utf8'),context);
  return {state,badge,tabsCreated,listeners,update:()=>vm.runInContext('update',context)};
}

test('successful dismissal shows a subtle per-tab tick',async()=>{
  const c=setup();
  c.listeners.message({type:'LEC_BANNER_GONE'},{tab:{id:42},url:'https://example.test/'});
  await c.update();
  assert.deepEqual(JSON.parse(JSON.stringify(c.badge)),[['color',{tabId:42,color:'#2e7d32'}],['text',{tabId:42,text:'✓'}]]);
  assert.equal(c.state.recorded,1);
  assert.equal(c.state.flushed,1);
});

test('a new page clears the success tick for that tab',async()=>{
  const c=setup();
  c.listeners.message({type:'LEC_PAGE_START'},{tab:{id:42},url:'https://example.test/next'});
  await c.update();
  assert.deepEqual(JSON.parse(JSON.stringify(c.badge)),[['text',{tabId:42,text:''}]]);
  assert.equal(c.state.recorded,undefined);
});
