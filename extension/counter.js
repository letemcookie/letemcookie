'use strict';
// Pending URLs are never recorded: events contain only a random retry ID and age.
// Set this to the observed deployed Worker URL before packaging.
const COUNTER_API = 'https://letemcookie-counter.chrisbest.workers.dev';
let sending = false;
async function flushCounter() {
  if (sending || !COUNTER_API.startsWith('https://')) return;
  sending = true;
  try {
    let {counterEnabled=false, counterQueue=[]}=await chrome.storage.local.get(['counterEnabled','counterQueue']);
    if (!counterEnabled) { await chrome.storage.local.set({counterQueue:[]}); return; }
    const live=counterQueue.filter(e=>Date.now()-e.at<24*3600*1000).slice(-500);
    await chrome.storage.local.set({counterQueue:live});
    for (const event of live) {
      const state=await chrome.storage.local.get('counterEnabled');
      if (!state.counterEnabled) break;
      let result;
      try {
        result=await fetch(COUNTER_API+'/eat',{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({event:event.id}), credentials:'omit',referrerPolicy:'no-referrer',
          signal:AbortSignal.timeout(8000)
        });
      } catch { break; }
      if (!result.ok) break;
      // Read latest queue so concurrently added events cannot be overwritten.
      const current=await chrome.storage.local.get('counterQueue');
      await chrome.storage.local.set({counterQueue:(current.counterQueue||[]).filter(e=>e.id!==event.id)});
    }
  } finally { sending=false; }
}
async function recordCookie() {
  const {eatenCount=0,counterEnabled=false,counterQueue=[]}=await chrome.storage.local.get(['eatenCount','counterEnabled','counterQueue']);
  const next={eatenCount:eatenCount+1};
  if (counterEnabled) next.counterQueue=[...counterQueue,{id:crypto.randomUUID(),at:Date.now()}].slice(-500);
  await chrome.storage.local.set(next);
}
chrome.alarms.create('lec-counter-retry',{periodInMinutes:5});
chrome.alarms.onAlarm.addListener(alarm=>{if(alarm.name==='lec-counter-retry') void queueCounterFlush();});
chrome.runtime.onStartup.addListener(()=>{void queueCounterFlush();});
// All queue writes share background's serial update chain, including retries.
function queueCounterFlush() {
  update=update.then(flushCounter).catch(()=>{});
  return update;
}
