import { useState } from 'react';

type Theme = 'light' | 'dark';

const THEME_KEY = 'theme';

// The inline script in index.html has already set data-theme before React mounts.
function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme);
  const next: Theme = theme === 'dark' ? 'light' : 'dark';

  function onToggle() {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage may be blocked: the theme still applies for this page view.
    }
    setTheme(next);
  }

  return (
    <div className="header-actions">
      <button
        type="button"
        className="secondary"
        onClick={onToggle}
        aria-label={`Switch to ${next} theme`}
        aria-pressed={theme === 'dark'}
        data-theme-current={theme}
        data-testid="nav-theme-toggle"
      >
        {theme === 'dark' ? 'Light' : 'Dark'}
      </button>
    </div>
  );
}
