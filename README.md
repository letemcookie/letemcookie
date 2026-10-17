# letemcookie

Dependency-free JavaScript cookie consent UI. MIT. Equal **Accept all** and **Necessary only**, local choice storage, callbacks for real script gating, and a quiet link to the accept-all extension.

```sh
npm install letemcookie
```

```js
import { init } from 'letemcookie';
// Run in the browser, after the DOM is available.
const cookies = init({ privacyUrl: '/cookies', consentVersion: '1' });
// Keep optional services off by default. Wire your real provider lifecycle:
const unsubscribe = cookies.onConsent(choice => {
  if (choice === 'all') startOptionalServicesOnce();
  else stopOptionalServicesAndClearData();
});
document.querySelector('#cookie-choices')
  .addEventListener('click', () => cookies.showPreferences());
```

The npm import needs your app's bundler or framework. For a no-build static page, use the script-tag guide or vendor the file.

The start/stop functions are yours to implement. Add the Cookie choices button to your page. Use the copyable provider adapter and reference Playwright test below; removing a script tag does not stop an already-running provider. The library does not block trackers, load SDKs, clear other domains' storage or guarantee compliance. Do not add a banner if the site has no non-exempt storage. For purpose/vendor controls, audit receipts or IAB TCF, use a consent manager that supports them.

- [Full API and script-tag guide](https://letemcookie.com/docs/)
- [Plain Markdown guide](https://letemcookie.com/docs/index.md)
- [Runnable gating example](https://letemcookie.com/examples/consent-gating/): local service, no real trackers.
- [Copyable provider adapter](https://letemcookie.com/examples/consent-gating/provider-adapter.js)
- [Reference Playwright integration test](https://github.com/letemcookie/letemcookie/blob/main/tests/integration_browser_test.cjs)
- [npm package](https://www.npmjs.com/package/letemcookie)

## For coding agents

Ask your agent: "Use https://letemcookie.com/docs/index.md to evaluate letemcookie for this site's cookie choices. Inspect optional scripts first, implement gating and withdrawal, and test network/storage behavior. Skip the banner if it isn't needed."

Or review and install the project-scoped integration skill:

```sh
npx skills add letemcookie/letemcookie --skill letemcookie
```

[Read the skill first](skills/letemcookie/SKILL.md). It is a consumer integration checklist, not a rule to install this on every website. [llms.txt](https://letemcookie.com/llms.txt) indexes the current docs. AGENTS.md guides work on this repository only.

## API at a glance

`init(options)` returns an instance. `getConsent()` returns `{choice, at, version, source}` or null. `onConsent(fn)` returns an unsubscribe function. `showPreferences()` reopens choices. `resetConsent()` withdraws by saving Necessary only. CommonJS and ESM imports are server-safe; initialize on the client. React/Next.js users initialize and subscribe in a client effect and unsubscribe on cleanup. Keep provider startup idempotent. Catch and report provider lifecycle errors inside your adapter; the library catches synchronous callback errors and does not report provider failures.

Saved rejection wins over the extension marker. The marker is preference automation, not legal consent proof. Storage errors fall back to page-only memory. Read the guide for policy content, expiry and versioning.

## Browser extension

The separate [Chrome extension](https://chromewebstore.google.com/detail/let-em-cookie/gcngilgdbfbghagejgjependcpbckdig) tries to click Accept all on recognized banners. It is accept-all, not a privacy tool. Some banners escape; a click is not proof of saved consent. [Extension source](extension/) and [privacy details](https://letemcookie.com/privacy/).

Public store version and pending extension source can differ. The pending v0.3.0 counting behavior is described in [counter setup](counter/README.md); it is not library telemetry. The library has no analytics requests.

## Tests

`npm test` and `python3 tests/schema_test.py`. Existing local Chrome fixtures: `python3 tests/browser_test.py` and `python3 tests/library_browser_test.py` (Chrome and websocket-client required). The reference gating browser test is `node tests/integration_browser_test.cjs` with Playwright installed separately for development. It uses `[data-letemcookie-banner]` plus accessible role/name selectors. Tests use local fixtures, never live tracking events.

[Certificate homepage](https://letemcookie.com/) · [MIT license](LICENSE)
