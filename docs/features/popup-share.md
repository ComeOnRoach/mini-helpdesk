# Share pop-up: `/share/:id` (T6.2)

A scenario for multi-window automation: a button on the ticket page opens a separate browser window. Web only; no API change, no new package, no new variable.

## Behavior

- Ticket page: button "Share" (`ticket-details-share`) calls `window.open('/share/<id>', 'share', 'width=500,height=600')` and focuses the window. The window name is `share`, so a second click reuses the open pop-up. The main window stays active.
- If the browser blocks the pop-up (`window.open` returns `null`), an error toast says "Pop-up blocked. Allow pop-ups for this site."
- `/share/:id` is routed outside `Layout` (no header or navigation), inside its own `ProtectedRoute`, like the print page. The token in `localStorage` is shared between same-origin windows, so the pop-up is already signed in; without a token it redirects to `/login`.
- The page shows: the title (`share-title`), the link in a read-only input (`share-link`, value `<origin>/tickets/<id>`, the ticket page), "Copy link" (`share-copy`) and "Close" (`share-close`).
- "Copy link" calls `navigator.clipboard.writeText` and shows "Copied" (`share-copied`, `role="status"`). If the clipboard is unavailable or denied, `share-copy-error` appears and the link text is selected.
- "Close" calls `window.close()` (works because the window was opened by a script).
- States: `share-loading`, `share-error` (+ `share-retry`), `share-not-found` (404; with a Close button).

## Test ids

Ticket page: `ticket-details-share`. Pop-up: `share-page` (`data-ticket-id`), `share-title`, `share-link`, `share-copy`, `share-copied`, `share-copy-error`, `share-close`, `share-loading`, `share-error`, `share-retry`, `share-not-found`.

## Playwright notes

```ts
const [popup] = await Promise.all([
  page.waitForEvent('popup'),
  page.getByTestId('ticket-details-share').click(),
]);
await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
await popup.getByTestId('share-copy').click();
await popup.evaluate(() => navigator.clipboard.readText());
```

`context.waitForEvent('page')` works as well. The clipboard needs a secure context (localhost counts) and permission.

## Files

`apps/web/src/pages/tickets/share-page.tsx` (new), `ticket-details-page.tsx` (button and `openShare`), `app.tsx` (route), `styles.css` (`.share-page`).

## Verified

With Playwright (Chromium, real API and DB, own test ticket deleted afterwards): the button opens a popup at `/share/<id>` named `share`, size 500x600, `window.opener` set; title and `data-ticket-id` are correct; the link equals `<origin>/tickets/<id>`; Copy shows "Copied" and the clipboard holds the link; the main window stays on the ticket page and responsive; a second click does not open another window; Close closes the popup (`close` event); a rejected clipboard shows `share-copy-error`; `/share/999999` shows `share-not-found`; an unauthenticated visit redirects to `/login`; a blocked pop-up (`window.open` returning `null`) shows the toast. `npm run lint`, `tsc -b` and `vite build` pass.
Not covered: a real browser pop-up blocker, Firefox/WebKit, real (non-headless) window sizing.
