# Light/dark theme switcher (T6.6)

A header button switches the whole UI between a light and a dark theme. The choice is stored in `localStorage` under the key `theme`.

## How it works

- The theme is the `data-theme="light|dark"` attribute on `<html>`.
- `apps/web/src/styles.css` defines colour tokens (`--bg`, `--surface`, `--text`, `--muted`, `--border`, ...) in `:root`. The dark values live in `:root[data-theme='dark']` at the end of the file. Existing rules use `var(--...)` instead of hardcoded colours. Fixed-colour elements (primary/danger buttons, toasts, badge) are unchanged because they use white text on both themes.
- Initial value: a saved `theme` (`light` or `dark`) wins; otherwise `prefers-color-scheme`. Nothing is written to storage until the user presses the button. An invalid stored value is ignored.
- No flash: a synchronous external script (`apps/web/public/theme-init.js`, loaded from `<head>` of `apps/web/index.html`; not inline, because of CSP, see `csp.md`) sets `data-theme` before the first paint and before React mounts.
- `ThemeToggle` (`apps/web/src/components/theme-toggle.tsx`) is rendered in the header for guests and logged-in users. No provider or context is used.
- The static widgets of `/help` (`/widgets/faq.html`, `/widgets/feedback.html`, including the nested iframe) load `/widgets/theme-init.js` and use their own `--w-*` tokens in `widgets.css`. They listen to the `storage` event, so an open Help page updates live when the button is pressed.
- Print: the print page stays black on white. In `@media print` the dark tokens are overridden with white/black, so printing from dark mode gives the same result as from light mode.

## Locators

| Element         | Locator                                                         |
| --------------- | --------------------------------------------------------------- |
| Toggle button   | `data-testid="nav-theme-toggle"`                                |
| Accessible name | `aria-label="Switch to dark theme"` / `"Switch to light theme"` |
| State           | `aria-pressed` (`true` = dark), `data-theme-current="light      | dark"` |

Playwright hints: `browser.newContext({ colorScheme: 'dark' })` or `page.emulateMedia({ colorScheme })` for the default; `localStorage.setItem('theme', 'dark')` before reload for a saved choice; check `document.documentElement.dataset.theme` and computed `background-color` of `body` (light `rgb(245, 247, 250)`, dark `rgb(17, 24, 39)`).

## Verified (browser, Playwright CLI)

- Dark and light emulated schemes without a saved value: correct initial theme, `localStorage.theme` is null; at `DOMContentLoaded` the attribute is already set while the React root is still empty (no flash).
- Toggle flips `data-theme`, the `body` colour, `localStorage.theme`, `aria-label` and `aria-pressed`; the choice survives reload; a saved `dark` wins over a light scheme; an invalid value (`purple`) falls back to `prefers-color-scheme`.
- The toggle is present for guests (`/login`) and logged-in users, once per page.
- `/tickets`, `/tickets/:id`, `/tickets/new`, `/contacts`, `/help`: dark computed colours for header, table, inputs, selects and text; screenshots checked for ticket detail and Help.
- Help iframes (FAQ and nested feedback) are dark in dark mode and switch live to light and back after pressing the button.
- Print page with `emulateMedia({ media: 'print' })` in light and dark schemes with `data-theme=dark`: body and `.print-page` background `rgb(255, 255, 255)`, text `rgb(0, 0, 0)`.
- `npm run lint`, `tsc -b` and `vite build` pass.

Not covered: delete confirmation modal and toasts in dark mode (styles use the same tokens, not inspected visually), `/share/:id` pop-up, browsers other than Chromium.
