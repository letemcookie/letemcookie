/*
 * Copy this pattern into your app and replace the provider-specific pieces.
 * It keeps the provider unloaded until consent, starts it once, handles a
 * consent change while loading, and calls the provider's real stop API on
 * withdrawal. Removing a script element is not enough for a running SDK.
 */
(() => {
  'use strict';

  let provider = null;
  let starting = null;
  let consentWanted = false;

  async function startOptionalServicesOnce() {
    consentWanted = true;
    if (provider) return provider;
    if (starting) return starting;

    starting = import('/optional-service.js')
      .then(async module => {
        // Replace module.start() with the provider's real start API.
        const started = await module.start();
        if (!consentWanted) {
          // Consent changed while the provider was loading.
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
    if (!current) return;

    // Replace current.stop() with the provider's withdrawal/delete APIs.
    // Also stop timers/listeners and remove storage owned by the provider.
    await current.stop();
  }

  function wireLetEmCookie(cookies, reportError = console.error) {
    return cookies.onConsent(choice => {
      const lifecycle = choice === 'all'
        ? startOptionalServicesOnce()
        : stopOptionalServicesAndClearData();

      Promise.resolve(lifecycle).catch(error => {
        // The library does not report provider failures. Send them to your
        // own monitoring so a failed shutdown is visible.
        reportError('Optional service lifecycle failed', error);
      });
    });
  }

  globalThis.LetEmCookieProviderAdapter = {
    startOptionalServicesOnce,
    stopOptionalServicesAndClearData,
    wireLetEmCookie
  };
})();
