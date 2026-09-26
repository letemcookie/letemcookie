(() => {
  'use strict';
  // Let our own library get out of the way before it renders its banner.
  const mark = () => { if (document.documentElement && !document.documentElement.hasAttribute('data-letemcookie-extension')) document.documentElement.setAttribute('data-letemcookie-extension', '1'); };
  mark();
  if (!document.documentElement) document.addEventListener('DOMContentLoaded', mark, { once: true });

  const known = [
    ['OneTrust', '#onetrust-accept-btn-handler'],
    ['Cookiebot', '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll'],
    ['Quantcast', '.qc-cmp2-summary-buttons button[mode="primary"], .qc-cmp2-footer button[mode="primary"], button[aria-label="Accept All"]'],
    ['Didomi', '#didomi-notice-agree-button, .didomi-continue-with-agreeing, button[data-testid="didomi-notice-agree-button"]'],
    ['TrustArc', '#truste-consent-button, .trustarc-banner-accept-all'],
    ['Osano', '.osano-cm-accept-all, .osano-cm-accept'],
    ['CookieYes', '#wt-cli-accept-all-btn, .cky-btn-accept, .cky-btn-accept-all'],
    ['Termly', 'button[data-tid="banner-accept-all-button"], .termly-styles-button-accept-all, button[data-test="accept-all-button"]'],
    ['LetEmCookie', '[data-letemcookie-accept]']
  ];
  const bannerHint = /cookie|consent|privacy|gdpr|ccpa|tracking|cmp|onetrust|osano|termly|didomi|cybot|truste|qc-cmp|cky|wt-cli/i;
  const acceptText = /^(?:accept(?: all(?: cookies)?)?|allow all(?: cookies)?|agree(?: to all)?|i agree|accept and continue|allow cookies|accept all & close|yes, i (?:agree|accept)|got it)$/i;
  const rejectHint = /reject|decline|deny|necessary only|essential only|settings|manage|customi[sz]e/i;
  const tried = new WeakSet();
  let timer = 0, observer, attempts = 0;
  const visible = (el) => {
    const box = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return box.width > 0 && box.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && !el.disabled && el.getAttribute('aria-hidden') !== 'true';
  };
  const click = (el, cmp) => {
    if (tried.has(el) || !visible(el)) return false;
    tried.add(el);
    try {
      el.click();
      attempts++;
      // A click is an attempt, not proof that the site's CMP saved consent.
      chrome.runtime.sendMessage({ type: 'LEC_ACCEPT_ATTEMPT', cmp }, () => { void chrome.runtime.lastError; });
      return true;
    } catch (_) { return false; }
  };
  function scan() {
    if (!document.documentElement || attempts >= 8) return;
    mark();
    for (const [cmp, selector] of known) {
      for (const el of document.querySelectorAll(selector)) {
        if (click(el, cmp)) return;
      }
    }
    // Only press generic accept buttons inside a likely cookie/consent container.
    const nodes = document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]');
    for (let i = 0; i < Math.min(nodes.length, 400); i++) {
      const el = nodes[i];
      const text = (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ');
      if (!acceptText.test(text) || rejectHint.test(text)) continue;
      let container = el.parentElement, matched = false;
      for (let depth = 0; container && depth < 5; depth++, container = container.parentElement) {
        if (bannerHint.test([container.id, container.className, container.getAttribute('role'), container.getAttribute('aria-label')].join(' '))) { matched = true; break; }
      }
      if (matched && click(el, 'generic')) return;
    }
  }
  function queue() {
    if (timer) return;
    timer = setTimeout(() => { timer = 0; scan(); }, 60);
  }
  observer = new MutationObserver(queue);
  observer.observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'hidden', 'aria-hidden'] });
  document.addEventListener('DOMContentLoaded', queue, { once: true });
  queue();
  // Do not keep scanning forever on long-lived pages; page load and mutations do the work.
  setTimeout(() => { observer.disconnect(); if (timer) clearTimeout(timer); }, 120000);
})();
