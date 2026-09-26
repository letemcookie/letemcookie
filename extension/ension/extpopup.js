chrome.storage.local.get(['acceptedCount']).then(({ acceptedCount = 0 }) => {
  document.getElementById('count').textContent = `You have been saved ${acceptedCount} ${acceptedCount === 1 ? 'time' : 'times'}.`;
  document.getElementById('certificate').hidden = acceptedCount < 1;
  document.getElementById('view').hidden = acceptedCount < 1;
});
document.getElementById('view').addEventListener('click', () => chrome.tabs.create({ url: chrome.runtime.getURL('certificate.html') }));
