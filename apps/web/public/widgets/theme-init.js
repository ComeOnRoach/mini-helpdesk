/* global window, localStorage */
// Theme for the static widgets. Loaded synchronously in <head>, so there is no flash.
// Same rule as the app: a saved `theme` wins, otherwise prefers-color-scheme.
(function () {
  function resolve() {
    var saved = null;
    try {
      saved = localStorage.getItem('theme');
    } catch {
      saved = null;
    }
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  document.documentElement.setAttribute('data-theme', resolve());

  // The toggle lives in the parent app: follow it live (storage fires in other same-origin documents).
  window.addEventListener('storage', function (event) {
    if (event.key === 'theme' || event.key === null) {
      document.documentElement.setAttribute('data-theme', resolve());
    }
  });
})();
