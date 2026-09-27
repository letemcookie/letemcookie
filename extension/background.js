'use strict';
let update = Promise.resolve();
const share = chrome.runtime.getURL('share.html');
const reportUrl = (host, selector) =>
  'https://github.com/letemcookie/letemcookie/issues/new?title=' +
  encodeURIComponent(`Missed banner on ${host}`) +
  '&body=' + encodeURIComponent(
    `Site: ${host}\nButton I picked: ${selector}\nExtension: ${chrome.runtime.getManifest().version}\n\nWhat happened:\n`);
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (!sender.tab?.id || !/^https?:/.test(sender.url || '')) return;
  if (msg?.type !== 'LEC_ACCEPT_ATTEMPT' && msg?.type !== 'LEC_PICKED') return;
  // Serialize increments across frames and tabs in one service-worker lifetime.
  update = update.then(async () => {
    const { acceptedCount = 0, firstNoticeShown = false, reportMiss = false } =
      await chrome.storage.local.get(['acceptedCount', 'firstNoticeShown', 'reportMiss']);
    await chrome.storage.local.set({ acceptedCount: acceptedCount + 1, firstNoticeShown: true });
    // First acceptance opens the one-time share screen. No page overlay, ever.
    if (!firstNoticeShown) await chrome.tabs.create({ url: share });
    // A picked banner can also open a prefilled GitHub issue draft for the user
    // to review and submit by hand. Nothing is sent automatically.
    if (msg.type === 'LEC_PICKED' && reportMiss && msg.host && msg.selector) {
      await chrome.tabs.create({ url: reportUrl(msg.host, msg.selector), active: false });
    }
  }).catch(() => {});
});
