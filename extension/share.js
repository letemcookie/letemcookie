'use strict';
const text = 'I hereby accept all cookies, forever. No need to ask me ever again. letemcookie.com';
const hint = document.getElementById('hint');
const copy = async () => {
  try { await navigator.clipboard.writeText(text); return true; }
  catch (_) {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.append(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) {}
    area.remove();
    return ok;
  }
};
document.getElementById('copy').addEventListener('click', async () => {
  hint.textContent = await copy() ? 'Copied.' : 'Select the text and copy it yourself.';
});
document.getElementById('x').addEventListener('click', () => {
  window.open('https://x.com/intent/post?text=' + encodeURIComponent(text), '_blank', 'noopener');
});
document.getElementById('substack').addEventListener('click', async () => {
  await copy();
  hint.textContent = 'Copied. Paste it into your new note.';
  window.open('https://substack.com/notes', '_blank', 'noopener');
});
