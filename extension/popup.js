'use strict';
chrome.storage.local.get(['acceptedCount', 'reportMiss']).then(({ acceptedCount = 0, reportMiss = false }) => {
  document.getElementById('count').textContent = `You have been saved ${acceptedCount} ${acceptedCount === 1 ? 'time' : 'times'}.`;
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
