/* Let 'Em Cookie v0.1 - small first-party consent UI, not a legal-compliance guarantee. */
(() => {
  'use strict';
  if (window.LetEmCookie) return;
  const key = 'letemcookie-consent-v1';
  let consent;
  try { consent = JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { consent = null; }
  const handlers = [];
  const valid = (value) => value && (value.choice === 'all' || value.choice === 'necessary');
  const api = {
    get consent() { return valid(consent) ? consent.choice : null; },
    // Put optional scripts in this callback, not in the page before consent.
    onConsent(fn) {
      if (typeof fn !== 'function') return;
      handlers.push(fn);
      if (valid(consent)) fn(consent.choice);
    }
  };
  window.LetEmCookie = api;
  if (valid(consent)) return;
  const saved = () => document.documentElement?.hasAttribute('data-letemcookie-extension');
  const choose = (choice, bar) => {
    consent = { choice, at: new Date().toISOString() };
    try { localStorage.setItem(key, JSON.stringify(consent)); } catch (_) { /* still remember this page */ }
    bar.remove();
    for (const fn of handlers) { try { fn(choice); } catch (_) {} }
  };
  function render() {
    if (!document.body || saved() || valid(consent) || document.querySelector('[data-letemcookie-banner]')) return;
    const bar = document.createElement('aside');
    bar.setAttribute('data-letemcookie-banner', '');
    bar.setAttribute('aria-label', 'Cookie choices');
    bar.style.cssText = 'position:fixed;z-index:2147483646;bottom:12px;left:12px;right:12px;max-width:720px;margin:auto;background:#fffaf0;color:#2b251c;border:1px solid #bfaa87;border-radius:8px;box-shadow:0 3px 16px #0002;padding:12px 16px;font:14px/1.5 system-ui,sans-serif';
    const sentence = document.createElement('span');
    sentence.textContent = 'This site uses optional cookies only if you allow them. ';
    bar.append(sentence);
    const accept = document.createElement('button');
    accept.textContent = 'Accept all';
    accept.setAttribute('data-letemcookie-accept', '');
    const necessary = document.createElement('button');
    necessary.textContent = 'Necessary only';
    for (const button of [accept, necessary]) {
      button.style.cssText = 'margin:4px 8px 4px 0;padding:6px 10px;background:#fff;color:#40270e;border:1px solid #a18055;border-radius:5px;cursor:pointer;font:inherit';
      bar.append(button);
    }
    accept.addEventListener('click', () => choose('all', bar));
    necessary.addEventListener('click', () => choose('necessary', bar));
    const note = document.createElement('div');
    note.style.cssText = 'font-size:12px;color:#6c6255;margin-top:3px';
    const link = document.createElement('a');
    link.href = 'https://letemcookie.com/#how';
    link.textContent = 'Never see cookie banners again';
    link.style.color = '#75501d';
    note.append(link);
    bar.append(note);
    if (!saved()) document.body.append(bar);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, { once: true }); else render();
})();
