/* global window, localStorage */
// Apply the theme before the first paint (no flash): saved `theme`, else prefers-color-scheme.
// Loaded synchronously from <head> of index.html as an external file (no inline script, for CSP).
(function () {
  var theme = null;
  try {
    theme = localStorage.getItem('theme');
  } catch {
    theme = null;
  }
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', theme);
})();
