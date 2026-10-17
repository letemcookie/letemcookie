'use strict';
// Local stand-in only. Replace with the real provider's start/stop APIs.
// No fetch, pixel, external SDK or network timer is involved here.
let running = false;
window.demoService = { starts: 0, stops: 0, get running() { return running; } };
function startOptionalService() {
  if (running) return;
  running = true;
  window.demoService.starts++;
  try { localStorage.setItem('letemcookie-sample-service', 'running'); } catch (_) {}
  document.getElementById('state').textContent = 'Service: on';
}
function stopOptionalService() {
  if (running) window.demoService.stops++;
  running = false;
  try { localStorage.removeItem('letemcookie-sample-service'); } catch (_) {}
  document.getElementById('state').textContent = 'Service: off';
}
const cookies = window.LetEmCookie;
// Default off matters: onConsent does not call immediately without a saved choice.
stopOptionalService();
cookies.onConsent(choice => {
  if (choice === 'all') startOptionalService();
  else stopOptionalService();
});
document.getElementById('choices').addEventListener('click', () => cookies.showPreferences());
