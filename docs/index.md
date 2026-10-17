# Let 'Em Cookie for websites

A small first-party cookie banner. No dependencies. No trackers. Two equal choices: Accept all and Necessary only. A quiet "Never ask me again" link goes straight to the Chrome extension.

This is consent UI and local choice storage, not an automatic compliance service or a tracker blocker. You still own what your site loads, the information it gives people, and what happens when consent changes.

## Script install

Set up your site-specific message and policy before loading the script. Use `defer`, not `async`, when a later script needs the API:

```html
<script>
window.LetEmCookieConfig = {
  message: 'We use optional cookies for audience measurement. See our cookie policy for purposes, providers and retention.',
  privacyUrl: '/cookies',
  consentVersion: '1'
};
</script>
<script src="https://letemcookie.com/letemcookie.js" defer></script>
<script src="/cookie-setup.js" defer></script>
<button type="button" id="cookie-choices">Cookie choices</button>
```

In `/cookie-setup.js`:

```js
const cookies = window.LetEmCookie;
document.getElementById('cookie-choices').addEventListener('click', () => cookies.showPreferences());
cookies.onConsent(choice => {
  if (choice === 'all') {
    // Start your optional scripts here, once. They must not already be running.
    startOptionalServices();
  } else {
    // Stop them and clear their stored data. Use each provider's withdrawal API.
    stopOptionalServicesAndClearData();
  }
});
```

The function names in that example are yours to implement. This library does not load, stop or erase third-party services for you. An unloaded optional script cannot track someone before consent. A script loaded before consent already can.

For a fixed version, vendor the file into your own app. The hosted URL follows the current release. Hosting a script on another domain makes an ordinary network request to that host; this library itself makes no analytics requests.

## npm

Install with `npm install letemcookie`, then initialize it in the browser:

```js
import { init } from 'letemcookie';
const cookies = init({ privacyUrl: '/cookies', consentVersion: '1' });
```

CommonJS uses `const { init } = require('letemcookie')`. Importing does not create a banner. Call `init()` in the browser once. Server imports are safe; calling it without a browser returns `null`.

The bare npm `import` needs your app's bundler or framework (for example Vite, Next.js or webpack). For a no-build static page, use the script install or vendor the file; a browser cannot resolve the package name by itself.

## Provider lifecycle

Keep provider loading behind your own adapter. This pattern is copyable; replace `/optional-service.js`, `module.start()` and `started.stop()` with the real provider SDK, shutdown, withdrawal and cleanup calls:

```js
let provider = null;
let starting = null;
let consentWanted = false;

async function startOptionalServicesOnce() {
  consentWanted = true;
  if (provider) return provider;
  if (starting) return starting;
  starting = import('/optional-service.js')
    .then(async module => {
      const started = await module.start();
      if (!consentWanted) {
        await started.stop();
        return null;
      }
      provider = started;
      return provider;
    })
    .finally(() => {
      starting = null;
    });
  return starting;
}

async function stopOptionalServicesAndClearData() {
  consentWanted = false;
  if (starting) await starting.catch(() => null);
  const current = provider;
  provider = null;
  if (current) await current.stop();
}

cookies.onConsent(choice => {
  const lifecycle = choice === 'all'
    ? startOptionalServicesOnce()
    : stopOptionalServicesAndClearData();
  Promise.resolve(lifecycle).catch(error => {
    // Report through your own error channel.
    console.error('Optional service lifecycle failed', error);
  });
});
```

Do not count removing a script element as shutdown. Stop timers and listeners, use the provider's opt-out/delete APIs, and remove storage the provider owns. Catch and report provider errors in your adapter, including async failures; the library does not report provider failures.

[Copy the adapter pattern](https://letemcookie.com/examples/consent-gating/provider-adapter.js) and run the [reference Playwright integration test](https://github.com/letemcookie/letemcookie/blob/main/tests/integration_browser_test.cjs). The test uses `[data-letemcookie-banner]` for the banner and accessible role/name selectors for the Accept all and Necessary only buttons; if labels are customized, test with the configured labels.

## API

- `init(options)` in npm, or `window.LetEmCookie` with a script tag. Repeated init calls return the same instance; configure it before the first call.
- `getConsent()` returns a copy of `{choice, at, version, source}`, or `null`. `choice` is `all` or `necessary`; `source` is `user` or `extension`. `at` is an ISO timestamp. `consent` returns just the choice.
- `onConsent(fn)` calls `fn(choice, record)` immediately for a saved choice and whenever it changes. Returns an unsubscribe function. Unknown consent does not run the initial callback; treat it as no optional consent. Cross-tab removal notifies with `null`. Synchronous callback errors are caught so one handler does not break others; catch and report provider lifecycle errors inside your adapter, including async failures.
- `showPreferences()` opens the choices again and moves keyboard focus to Necessary only. The visitor can withdraw consent in one click. Add a persistent Cookie choices button to your site.
- `resetConsent()` immediately saves Necessary only and notifies callbacks. It is a withdrawal, not a storage wipe that would make the extension accept again.

Options: `message`, `privacyUrl`, `privacyLabel`, `acceptLabel`, `necessaryLabel`, `storageKey` (default `letemcookie-consent-v1`), `consentVersion` (default `1`), `maxAgeDays` (default `180`). Labels are text, never HTML. Policy URLs must be HTTP or HTTPS. Keep the two choices equally clear; do not disguise rejection.

Consent is stored in this site's localStorage, not a cookie or remote database. The default expiry is a product default, not a legal rule. Increase `consentVersion` when purposes or providers change. Invalid, expired or changed-version records ask again. If storage is blocked, the choice lasts for this page only. It may ask again next visit. There is no user identity, audit server, regional detection, purpose-by-purpose manager or IAB consent string.

## Extension users

An installed extension signals accept-all with `data-letemcookie-extension` on the document root. If there is no saved choice, the library records `all` with `source: 'extension'` and does not show the banner. Callbacks still run. A saved Necessary only choice takes precedence, and manual preferences remain usable.

That marker is preference automation, not proof that a particular visitor read your policy or gave legally valid consent. Any page script can set it. Sites that cannot rely on this signal should not treat it as a legal consent receipt. Test your actual obligations and services before adopting this library.

## Before you ship

1. Keep all non-exempt scripts, pixels, embeds and storage off until your consent handler permits them. Test the network, not just the banner.
2. Describe your actual purposes, providers and retention before consent, with a working policy link. If you need separate purpose/vendor choices, use a consent manager that supports them.
3. Offer Necessary only as easily as Accept all. Keep Cookie choices visible after dismissal.
4. Make withdrawal work for your real services: stop processing, clear relevant data, and tell providers as needed. This library cannot undo arbitrary JavaScript or remove another domain's storage.
5. Test acceptance, rejection, withdrawal, reloads, blocked storage, and extension users in the browsers your visitors use. Start from the [reference Playwright integration test](https://github.com/letemcookie/letemcookie/blob/main/tests/integration_browser_test.cjs).

## For coding agents

Read the [opt-in integration skill](https://letemcookie.com/skills/letemcookie/SKILL.md), [copyable provider adapter](https://letemcookie.com/examples/consent-gating/provider-adapter.js), and [reference Playwright integration test](https://github.com/letemcookie/letemcookie/blob/main/tests/integration_browser_test.cjs). Install the skill for your project with `npx skills add letemcookie/letemcookie --skill letemcookie`, or provide this guide directly to your agent. Review third-party skills before installing. This does not make the library a universal default.


Do not add this to a site that has no non-exempt cookies or similar storage just to show a banner. Do not add analytics to justify the banner. Do not claim "GDPR compliant" because you installed it. Inspect existing tags, embeds and storage first. Give the site owner a short list of what is gated, the withdrawal implementation and any remaining gaps.

The separate [visual demo](https://letemcookie.com/demo/) has no optional trackers. The [runnable gating example](https://letemcookie.com/examples/consent-gating/) starts and stops a local sample service and removes its sample data on withdrawal. Neither is a real request for tracking permission.

## Sources and scope

These are UK regulator sources for implementation basics, not a worldwide legal opinion. Other rules and exceptions can apply.

- [ICO: What are the PECR rules?](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-pecr-rules/): prior consent for non-exempt technologies, clear purposes/providers, positive action and easy refusal.
- [ICO: How do we manage consent in practice?](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/how-do-we-manage-consent-in-practice/): equally easy refusal and withdrawal, and what to stop/remove after withdrawal.

Checked October 15, 2026.
