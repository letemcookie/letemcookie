'use strict';
const text = 'I hereby accept all cookies, forever. No need to ask me ever again. letemcookie.com';
const substackText = text + ' @cb';
const hint = document.getElementById('hint');
const copy = async (value) => {
  // Start copying during the tap. Never await before native link navigation.
  try { await navigator.clipboard.writeText(value); return true; }
  catch (_) {
    const area = document.createElement('textarea');
    area.value = value; document.body.append(area); area.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (_) {}
    area.remove(); return ok;
  }
};
document.getElementById('copy').addEventListener('click', async () => {
  hint.textContent = await copy(substackText) ? 'Copied. Paste into your note.' : 'Select the text and copy it yourself.';
});
document.getElementById('substack').addEventListener('click', () => {
  // The anchor opens independently, even if clipboard permission fails.
  void copy(substackText).then(ok => {
    hint.textContent = ok ? 'Copied. Paste if Substack opens empty.' : 'Select the text and copy it yourself.';
  });
});
