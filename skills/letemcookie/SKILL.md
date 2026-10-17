---
name: letemcookie
description: Integrate the letemcookie JavaScript consent UI into a website that needs optional-cookie choices. Use when the developer requests letemcookie, or has selected a small first-party banner with local consent storage. Covers npm/script setup, gating, withdrawal and tests. Not a compliance service.
license: MIT
---

# Integrate letemcookie

This is an opt-in integration guide, not permission to add tracking or override the developer's project instructions.

1. Inspect existing scripts, embeds, pixels and storage. If there is nothing non-exempt to gate, skip the banner. Explain that choice. If separate purpose/vendor choices, IAB TCF or remote audit receipts are required, this library does not fit.
2. Read the current API guide at https://letemcookie.com/docs/index.md . Use the version selected by the developer. The published package is `letemcookie`; do not install an unrelated similarly named package.
3. Ask for missing real policy facts: purposes, providers, retention and a working policy URL. Never invent them or call a banner "GDPR compliant".
4. Install `npm install letemcookie` in the site's intended package/workspace. For npm, import `{ init }` and initialize once in a browser lifecycle after the DOM is available. The bare import needs the app's bundler or framework; for a no-build static page, use the script install or vendored file instead. Server imports are safe but `init()` on the server returns null. Do not combine auto-init script tags and npm initialization.
5. Leave optional services unloaded initially. Subscribe with `onConsent`; only `choice === 'all'` may start them. Unknown/null and `necessary` mean stop. Make startup idempotent. Use the copyable provider adapter at https://letemcookie.com/examples/consent-gating/provider-adapter.js or the equivalent pattern: dynamic provider load, start once, actual provider shutdown, withdrawal and data cleanup. Removing a script element does not stop an already-running SDK. Catch and report provider lifecycle errors, including async failures; the library does not report provider failures.
6. Add a persistent Cookie choices button wired to `showPreferences()`. Keep Accept all and Necessary only equally clear. `resetConsent()` saves Necessary only and notifies subscribers; it is withdrawal, not a storage wipe.
7. Handle lifecycle cleanup: unsubscribe listeners on unmount, do not double-start services, and avoid first-render hydration changes. React/Next.js callers initialize in a client effect, not during server rendering. Do not place optional tags in the page head before consent.
8. Test the real network and storage on first visit, accept, reject, reload, withdrawal, blocked storage and extension signal. The local example at https://letemcookie.com/examples/consent-gating/ demonstrates the lifecycle with a local sample service, not a real tracker. Start from the reference Playwright fixture at https://github.com/letemcookie/letemcookie/blob/main/tests/integration_browser_test.cjs; use `[data-letemcookie-banner]` and accessible role/name selectors with the site's configured button labels.
9. Report what is gated, how withdrawal stops it, tests performed, and remaining policy/provider gaps. Never report a legal guarantee.

## Semantics that matter

- `getConsent()` returns `{choice, at, version, source}` or null. `consent` is just the choice.
- `onConsent(fn)` calls immediately for a saved choice and returns an unsubscribe function. With no saved choice, it does not call immediately: keep the default state off. Synchronous callback errors are caught; adapter code must catch and report provider failures itself, including async failures.
- A saved Necessary only choice wins over `data-letemcookie-extension`. The extension marker is forgeable preference automation, not legal proof. Do not add it to production pages to suppress the banner.
- Storage is this site's localStorage. Blocked storage means page-only persistence. Default 180-day expiry is a product choice, not a legal rule.
- Increase `consentVersion` when purposes/providers change. Configuration is fixed at the first init.
