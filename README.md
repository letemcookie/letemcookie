# Let 'Em Cookie 🍪

Never see a cookie banner again.

## For normal humans

The Chrome extension tries to click accept-all before you have to see the banner. It knows the common consent managers and cautiously looks for accept-all buttons in banners it doesn't recognize. The first click opens your share screen, ready to copy or post. The popup keeps a local count of how many times you've been saved.

A banner that gets through? Open the popup, hit **Pick missed banner**, and click the real accept-all button. The extension clicks only that. It can also open a prefilled GitHub issue draft for you to review and submit yourself - nothing is sent automatically.

**Install locally:** Download this repository, visit `chrome://extensions`, enable Developer mode, click **Load unpacked**, and select the `extension/` folder. Or install from the [Chrome Web Store](https://chromewebstore.google.com/detail/let-em-cookie/gcngilgdbfbghagejgjependcpbckdig).

**Honest limits:** Clicking isn't proof the site saved consent. Some banners load in closed shadow DOM or unfamiliar markup and escape. The "cookies eaten" counter counts observed banner dismissals, not literal cookies or proof of saved consent. This is accept-all, not a privacy tool. The extension sends no browsing history, URLs, or page data anywhere. X or Substack open only if you choose to share. A missed-banner report is a GitHub draft you submit by hand.

## For coding agents building sites

Start with [the library guide](LIBRARY.md). The existing `letemcookie.js` now has equal Accept all / Necessary only choices, local choice storage, a direct extension-store upsell, `getConsent()`, `onConsent()`, `showPreferences()` and `resetConsent()`.

Keep optional scripts off until consent. Add a persistent Cookie choices button and implement real service shutdown/cleanup on withdrawal. Do not add a banner to a site that does not need one. No tracker scanning, purpose manager, remote audit receipt or worldwide compliance guarantee. Use the hosted script or `npm install letemcookie`.

## Build notes

Plain JavaScript, Manifest V3. A content script at `document_start` with a debounced MutationObserver, local-only storage, and a toolbar popup with the one-shot missed-banner picker. Test with `node --check extension/*.js letemcookie.js`. The site is hosted from this repository's root by GitHub Pages.

[letemcookie.com](https://letemcookie.com) · [Star the repo](https://github.com/letemcookie/letemcookie)

## Cookie census (0.3.0)

New installs contribute to the homepage counter by default, as disclosed in the store. Existing installs get a one-time choice tab and contribute only if they agree. Turn counting off in extension Settings. Events contain only a random retry ID; the Cloudflare Worker hashes the network IP for daily approximate connection estimates and spam limits. No visited URLs, hostnames, cookie contents, or persistent install ID. See [privacy](https://letemcookie.com/privacy/) and [counter setup](counter/README.md).

Tests: `node --test tests/*.test.mjs` and `python3 tests/schema_test.py`.

The certificate is also available without installing: https://letemcookie.com/share/ . Sharing opens a draft or copies text; it never posts for you.

Optional real-browser checks: with Google Chrome and Python's `websocket-client` available, run `python3 tests/browser_test.py`. This exercises removed, hidden, disabled and unchanged banners, plus all consent categories saved by both multi-step workflows. It uses only local fixture pages and never sends live counter events.

Library browser checks: `python3 tests/library_browser_test.py`. Licensed under [MIT](LICENSE).
