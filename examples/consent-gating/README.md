# Runnable consent gating example

Serve the repository root, then open `/examples/consent-gating/`. No optional network requests or real trackers. The local stand-in service starts only after `all`, uses one localStorage value, and stops/removes that value on withdrawal. Read `setup.js` for the lifecycle.

Production integrations must replace the sample start/stop functions with the provider's real APIs. Removing a script tag does not undo running code. This example proves the library callback wiring, not arbitrary providers' shutdown behavior.

Use [provider-adapter.js](provider-adapter.js) as the copyable dynamic-load/start/stop pattern, and the [reference Playwright integration test](https://github.com/letemcookie/letemcookie/blob/main/tests/integration_browser_test.cjs) for the browser checks. The fixture uses `[data-letemcookie-banner]` and accessible role/name selectors rather than DOM positions.

Test first visit off, reject off, accept on, reload persistence, repeated preferences, withdrawal off plus data removal, and saved rejection winning over the extension marker.
