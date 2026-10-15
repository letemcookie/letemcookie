/* Let 'Em Cookie. No trackers, no dependencies, no compliance guarantee. */
(function (root) {
  'use strict';
  const STORE = 'https://chromewebstore.google.com/detail/let-em-cookie/gcngilgdbfbghagejgjependcpbckdig';
  function init(options) {
    if (!root || !root.document) return null; // Safe to import during server rendering.
    if (root.LetEmCookie) return root.LetEmCookie;
    const doc = root.document;
    const config = Object.assign({
      storageKey: 'letemcookie-consent-v1', consentVersion: '1', maxAgeDays: 180,
      message: 'This site uses optional cookies only if you allow them.',
      acceptLabel: 'Accept all', necessaryLabel: 'Necessary only',
      privacyUrl: '', privacyLabel: 'Cookie policy'
    }, options || {});
    const handlers = new Set();
    const maxAge = (Number(config.maxAgeDays) > 0 ? Number(config.maxAgeDays) : 180) * 86400000;
    let consent = null, bar = null, returnFocus = null;
    const valid = value => value && ['all', 'necessary'].includes(value.choice) &&
      String(value.version || '1') === String(config.consentVersion) &&
      Number.isFinite(Date.parse(value.at)) && Date.parse(value.at) <= Date.now() &&
      Date.now() - Date.parse(value.at) < maxAge;
    try { const stored = JSON.parse(root.localStorage.getItem(config.storageKey)); if (valid(stored)) consent = stored; } catch (_) {}
    const extensionPresent = () => doc.documentElement?.hasAttribute('data-letemcookie-extension');
    function close() {
      if (bar) { bar.remove(); bar = null; }
      if (returnFocus?.isConnected) returnFocus.focus();
      returnFocus = null;
    }
    function notify() {
      for (const fn of handlers) { try { fn(consent ? consent.choice : null, consent ? Object.assign({}, consent) : null); } catch (_) {} }
    }
    function choose(choice, source) {
      consent = { choice, source, at: new Date().toISOString(), version: String(config.consentVersion) };
      try { root.localStorage.setItem(config.storageKey, JSON.stringify(consent)); } catch (_) {}
      close(); notify();
    }
    function render(manual) {
      if (!doc.body || bar) return;
      if (!manual && (consent || extensionPresent())) return;
      bar = doc.createElement('aside');
      bar.setAttribute('data-letemcookie-banner', '');
      bar.setAttribute('role', 'region');
      bar.setAttribute('aria-label', 'Cookie choices');
      if (manual) bar.setAttribute('data-letemcookie-manual', '');
      bar.style.cssText = 'position:fixed;z-index:2147483646;bottom:12px;left:12px;right:12px;max-width:720px;margin:auto;box-sizing:border-box;background:#fffaf0;color:#2b251c;border:1px solid #bfaa87;border-radius:8px;box-shadow:0 3px 16px #0002;padding:14px 16px;font:14px/1.5 system-ui,sans-serif;text-align:left';
      const sentence = doc.createElement('p');
      sentence.style.cssText = 'margin:0 0 8px'; sentence.textContent = config.message;
      bar.append(sentence);
      const accept = doc.createElement('button'); accept.textContent = manual ? 'Allow optional cookies' : config.acceptLabel;
      if (!manual) accept.setAttribute('data-letemcookie-accept', '');
      const necessary = doc.createElement('button'); necessary.textContent = config.necessaryLabel;
      for (const button of [accept, necessary]) {
        button.type = 'button';
        button.style.cssText = 'margin:4px 8px 4px 0;padding:8px 12px;background:#fff;color:#40270e;border:1px solid #a18055;border-radius:5px;cursor:pointer;font:inherit';
        bar.append(button);
      }
      accept.addEventListener('click', () => choose('all', 'user'));
      necessary.addEventListener('click', () => choose('necessary', 'user'));
      const note = doc.createElement('p'); note.style.cssText = 'font:12px/1.5 system-ui,sans-serif;margin:8px 0 0;color:#5a4128';
      if (config.privacyUrl) {
        const policy = doc.createElement('a');
        try { const url = new URL(config.privacyUrl, doc.baseURI); if (['https:', 'http:'].includes(url.protocol)) policy.href = url.href; } catch (_) {}
        if (policy.href) { policy.textContent = config.privacyLabel; policy.style.color = '#5a4128'; note.append(policy, ' · '); }
      }
      const link = doc.createElement('a'); link.href = STORE; link.textContent = 'Never ask me again';
      link.target = '_blank'; link.rel = 'noopener noreferrer'; link.style.color = '#5a4128';
      note.append(link); bar.append(note);
      const withdrawal = doc.createElement('p'); withdrawal.style.cssText = 'font:12px/1.5 system-ui,sans-serif;margin:6px 0 0;color:#5a4128';
      withdrawal.textContent = 'Change or withdraw consent using Cookie choices on this site.'; bar.append(withdrawal);
      doc.body.append(bar);
      if (manual) { returnFocus = doc.activeElement; necessary.focus(); }
    }
    const api = {
      get consent() { return consent ? consent.choice : null; },
      getConsent() { return consent ? Object.assign({}, consent) : null; },
      onConsent(fn) {
        if (typeof fn !== 'function') return () => {};
        handlers.add(fn);
        if (consent) { try { fn(consent.choice, Object.assign({}, consent)); } catch (_) {} }
        return () => handlers.delete(fn);
      },
      showPreferences() { if (doc.body) render(true); else doc.addEventListener('DOMContentLoaded', () => render(true), { once: true }); },
      // Withdrawal is a saved rejection, not an invitation to auto-accept again.
      resetConsent() { choose('necessary', 'user'); }
    };
    root.LetEmCookie = api;
    function syncExtension() {
      // A prior explicit site choice always wins over the extension marker.
      if (!consent && extensionPresent()) choose('all', 'extension');
    }
    function ready() { syncExtension(); render(false); }
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
    if (typeof root.MutationObserver === 'function' && doc.documentElement) {
      const observer = new root.MutationObserver(syncExtension);
      observer.observe(doc.documentElement, { attributes: true, attributeFilter: ['data-letemcookie-extension'] });
    }
    root.addEventListener('storage', event => {
      if (event.key !== config.storageKey) return;
      try { const next = JSON.parse(event.newValue); consent = valid(next) ? next : null; } catch (_) { consent = null; }
      close(); notify(); render(false);
    });
    return api;
  }
  if (typeof module === 'object' && module.exports) module.exports = { init };
  else init(root.LetEmCookieConfig);
})(typeof window !== 'undefined' ? window : null);
