'use strict';
let update = Promise.resolve();
importScripts('counter.js');
const share = chrome.runtime.getURL('share.html');
const successCue = async (tabId) => {
  await chrome.action.setBadgeBackgroundColor({ tabId, color: '#2e7d32' });
  await chrome.action.setBadgeText({ tabId, text: '✓' });
};
const clearSuccessCue = async (tabId) => {
  await chrome.action.setBadgeText({ tabId, text: '' });
};
const reportUrl = (host, selector) =>
  'https://github.com/letemcookie/letemcookie/issues/new?title=' +
  encodeURIComponent(`Missed banner on ${host}`) +
  '&body=' + encodeURIComponent(
    `Site: ${host}\nButton I picked: ${selector}\nExtension: ${chrome.runtime.getManifest().version}\n\nWhat happened:\n`);
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (!sender.tab?.id || !/^https?:/.test(sender.url || '')) return;
  if (msg?.type === 'LEC_PAGE_START') {
    update = update.then(() => clearSuccessCue(sender.tab.id)).catch(() => {});
    return;
  }
  if (msg?.type === 'LEC_BANNER_GONE') {
    update = update.then(async () => {
      await successCue(sender.tab.id);
      await recordCookie();
      await flushCounter();
    }).catch(() => {});
    return;
  }
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

// New installs are disclosed in the store. Existing users must choose once.
chrome.runtime.onInstalled.addListener(async (details) => {
  const {counterChoiceVersion=0}=await chrome.storage.local.get('counterChoiceVersion');
  if (counterChoiceVersion>=1) return;
  if (details.reason==='install') {
    await chrome.storage.local.set({counterEnabled:true,counterChoiceVersion:1,counterQueue:[]});
  } else if (details.reason==='update') {
    // Set the one-time marker before opening: dismissing the tab is a no.
    await chrome.storage.local.set({counterEnabled:false,counterChoiceVersion:1,counterQueue:[]});
    await chrome.tabs.create({url:chrome.runtime.getURL('counter-choice.html')});
  }
});
chrome.storage.onChanged.addListener((changes,area)=>{
  if(area!=='local' || !changes.counterEnabled) return;
  if(changes.counterEnabled.newValue) void queueCounterFlush();
  else update=update.then(()=>chrome.storage.local.set({counterQueue:[]})).catch(()=>{});
});
