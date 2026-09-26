'use strict';
let update = Promise.resolve();
const certificate = chrome.runtime.getURL('certificate.html');
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type !== 'LEC_ACCEPT_ATTEMPT' || !sender.tab?.id || !/^https?:/.test(sender.url || '')) return;
  // Serialize increments across frames and tabs in one service-worker lifetime.
  update = update.then(async () => {
    const { acceptedCount = 0, firstNoticeShown = false } = await chrome.storage.local.get(['acceptedCount', 'firstNoticeShown']);
    await chrome.storage.local.set({ acceptedCount: acceptedCount + 1, firstNoticeShown: true });
    if (!firstNoticeShown) {
      await chrome.notifications.create('letemcookie-first', {
        type: 'basic', iconUrl: chrome.runtime.getURL('icon.png'),
        title: 'Certificate of Spiritual Informedness',
        message: 'Your first cookie banner has been accepted. You are saved. Click to see your certificate and share it.'
      });
    }
  }).catch(() => {});
});
chrome.notifications.onClicked.addListener((id) => {
  if (id === 'letemcookie-first') {
    chrome.tabs.create({ url: certificate });
    chrome.notifications.clear(id);
  }
});
