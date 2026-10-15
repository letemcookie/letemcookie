'use strict';
chrome.storage.local.get('reportMiss').then(({ reportMiss = false }) => {
  document.getElementById('report').checked = reportMiss;
});
document.getElementById('report').addEventListener('change', (event) => {
  chrome.storage.local.set({ reportMiss: event.target.checked });
});
document.getElementById('pick').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id && /^https?:/.test(tab.url || '')) {
    try { await chrome.tabs.sendMessage(tab.id, { type: 'LEC_PICK_START' }); } catch (_) {}
  }
  window.close();
});

chrome.storage.local.get(['counterEnabled','eatenCount']).then(({counterEnabled=false,eatenCount=0})=>{
 document.getElementById('count').textContent=`${eatenCount} ${eatenCount===1?'cookie':'cookies'} eaten.`;
});
