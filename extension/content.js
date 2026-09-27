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
    ['LetEmCookie', '[data-letemcookie-accept]'],
    // Curated from Consent-O-Matic rules (MIT, see THIRD_PARTY_NOTICES.md):
    // CMPs whose own accept-all button applies full consent directly.
    ['OIL', '.as-oil__btn-optin'],
    ['EZCookie', '#ez-ok-cookies'],
    ['Autodesk', '#adsk-eprivacy-continue-btn'],
    ['Chefcookie', '.chefcookie__button--accept']
  ];
  // Curated accept-all workflows translated from Consent-O-Matic preference
  // workflows (MIT, see THIRD_PARTY_NOTICES.md). Each entry: detect the CMP,
  // open its options, switch every consent toggle ON, save. Steps only ever
  // turn consent on and press the CMP's own save button - accept-all by design.
  const workflows = [
    {
      name: 'CookieInformation',
      detect: '#coiOverlay, #coiSummery',
      open: '.coi-banner__nextpage, .summary-texts__show-details',
      enable: [
        ['#switch-cookie_cat_functional input', '#switch-cookie_cat_functional label'],
        ['#switch-cookie_cat_statistic input', '#switch-cookie_cat_statistic label'],
        ['#switch-cookie_cat_marketing input', '#switch-cookie_cat_marketing label']
      ],
      save: '.coi-banner__accept, .coi-save-btn'
    },
    {
      name: 'Tealium',
      detect: '#__tealiumGDPRecModal',
      open: '#__tealiumGDPRecModal .consent_prefs_button, #sliding-popup .popup-actions .eu-cookie-change-settings',
      enable: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => [`#__tealiumGDPRcpPrefs #toggle_cat${n}`, `#__tealiumGDPRcpPrefs label[for=toggle_cat${n}]`]),
      save: '#__tealiumGDPRcpPrefs #preferences_prompt_submit'
    }
  ];
  let workflowRan = false;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  async function runWorkflow(wf) {
    if (workflowRan) return;
    workflowRan = true;
    try {
      if (wf.open) {
        const openBtn = document.querySelector(wf.open);
        if (openBtn && visible(openBtn)) { openBtn.click(); await sleep(500); }
      }
      // Turn every consent toggle ON. Never turns anything off.
      for (const [inputSel, toggleSel] of wf.enable) {
        for (const input of document.querySelectorAll(inputSel)) {
          if (input.checked) continue;
          const toggle = document.querySelector(toggleSel);
          if (toggle) toggle.click(); else input.click();
          await sleep(40);
        }
      }
      await sleep(250);
      const saveBtn = document.querySelector(wf.save);
      if (saveBtn && visible(saveBtn)) {
        saveBtn.click();
        attempts++;
        chrome.runtime.sendMessage({ type: 'LEC_ACCEPT_ATTEMPT', cmp: wf.name }, () => { void chrome.runtime.lastError; });
      }
    } catch (_) { /* a broken workflow leaves the banner for the user */ }
  }
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
    // CMPs that need their options opened before full consent can be saved.
    if (!workflowRan) {
      for (const wf of workflows) {
        const marker = document.querySelector(wf.detect);
        if (marker && visible(marker)) { runWorkflow(wf); return; }
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

  // --- Missed-banner picker: one-shot, started from the popup. ---
  // The user points at the real accept button; we click only that element.
  // The highlight outline exists only while picking and is removed on use or Escape.
  let picking = false, hovered = null, previousOutline = '';
  const cssEscape = (value) => (window.CSS && CSS.escape) ? CSS.escape(value) : value.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  const describe = (el) => {
    const parts = [];
    for (let node = el; node && node.nodeType === 1 && parts.length < 5; node = node.parentElement) {
      let part = node.tagName.toLowerCase();
      if (node.id) { part += '#' + cssEscape(node.id); parts.unshift(part); break; }
      const cls = [...node.classList].slice(0, 2).map((c) => '.' + cssEscape(c)).join('');
      part += cls;
      if (!cls && node.parentElement) {
        const same = [...node.parentElement.children].filter((s) => s.tagName === node.tagName);
        if (same.length > 1) part += `:nth-of-type(${same.indexOf(node) + 1})`;
      }
      parts.unshift(part);
    }
    return parts.join(' > ');
  };
  const restore = () => { if (hovered) { hovered.style.outline = previousOutline; hovered = null; } };
  const stopPicking = () => {
    picking = false;
    restore();
    document.documentElement.style.cursor = '';
    document.removeEventListener('mouseover', onHover, true);
    document.removeEventListener('click', onPick, true);
    document.removeEventListener('keydown', onKey, true);
  };
  const onHover = (event) => {
    if (!picking) return;
    restore();
    hovered = event.target;
    previousOutline = hovered.style.outline;
    hovered.style.outline = '3px solid #b65d15';
  };
  const onPick = (event) => {
    if (!picking) return;
    event.preventDefault();
    event.stopPropagation();
    const target = event.target.closest('button, [role="button"], a, input[type="button"], input[type="submit"], summary') || event.target;
    const selector = describe(target);
    stopPicking();
    // The user chose this element; clicking it is the whole point of the picker.
    // Counted once via LEC_PICKED, not again via LEC_ACCEPT_ATTEMPT.
    if (!tried.has(target)) { tried.add(target); try { target.click(); attempts++; } catch (_) {} }
    chrome.runtime.sendMessage({ type: 'LEC_PICKED', host: location.hostname, selector }, () => { void chrome.runtime.lastError; });
  };
  const onKey = (event) => { if (picking && event.key === 'Escape') { event.preventDefault(); stopPicking(); } };
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type !== 'LEC_PICK_START' || picking) return;
    picking = true;
    document.documentElement.style.cursor = 'crosshair';
    document.addEventListener('mouseover', onHover, true);
    document.addEventListener('click', onPick, true);
    document.addEventListener('keydown', onKey, true);
  });
})();
