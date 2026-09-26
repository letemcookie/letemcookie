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
      // A one-time certificate tab is the first-accept moment. No page overlay or recurring prompt.
      await chrome.tabs.create({ url: certificate });
    }
  }).catch(() => {});
});
