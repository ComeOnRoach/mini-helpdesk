# Analytics events: `POST /api/analytics/events` (T6.5)

"Extra" network requests that automation can count, block or inspect. The API accepts and discards them; the web app sends them on key actions and never lets a failure reach the UI.

## API

- `POST /api/analytics/events`, public (no token needed, so the login event works), answers `204 No Content`, stores nothing.
- Body (validated, unknown fields rejected by `forbidNonWhitelisted`): `{ "event": "...", "page": "/tickets/3", "ts": 1767603600000 }`.
  - `event`: one of `login`, `ticket_create`, `ticket_open`, `search`, `export`.
  - `page`: string, at most 200 characters (the route path).
  - `ts`: integer, epoch milliseconds.
- Invalid body: `400` in the standard error format. Documented in Swagger under the `analytics` tag. No migration, no DB.

## Web

- `apps/web/src/lib/analytics.ts`: `track(event)`, fire-and-forget. It uses a plain `fetch` (not `apiFetch`) with `keepalive`, so there is no auth header, no 401 redirect and no toast; every error is swallowed.
- Switch: `VITE_ANALYTICS_ENABLED`. Only the value `true` enables it; unset or anything else sends nothing. `.env.example` and docker-compose default to `true`.
- Events and where they fire:

| event           | fires                                                                                                          | `page` at that moment   |
| --------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `login`         | after a successful login (also the auto-login after register)                                                  | `/login` or `/register` |
| `ticket_create` | after the ticket was created                                                                                   | `/tickets/new`          |
| `ticket_open`   | after the ticket details loaded                                                                                | `/tickets/<id>`         |
| `search`        | when the debounced `q` in the URL changes to a non-empty value (not on mount, not per keystroke, not on clear) | `/tickets`              |
| `export`        | after the CSV export succeeded                                                                                 | `/tickets`              |

## Playwright notes

```ts
await page.route('**/analytics/**', (route) => route.abort()); // or route.fulfill({ status: 500 })
const req = await page.waitForRequest((r) => r.url().includes('/analytics/events'));
req.postDataJSON(); // { event, page, ts }
```

With the route blocked or answering 500 the app behaves exactly as before. Count requests with `page.on('request', ...)`.

## Verified

- API (curl): valid body gives 204; unknown `event`, extra field and non-integer `ts` give 400 in the unified format; no token needed; endpoint is in `/docs-json`.
- Browser (Playwright, agent account), three runs: requests passed through, aborted, and answered 500. Each run sent `login`, `search`, `ticket_create`, `ticket_open`, `export`, `ticket_open` with correct `event`, `page` and numeric `ts`; no page errors; login, create, export and open all worked in every run.
- Loading `/tickets?q=...` directly sends no `search` event (also under React StrictMode).
- `VITE_ANALYTICS_ENABLED=false`: 0 analytics requests over the same flow.
- `npm run lint`, web `tsc -b` + `vite build`, API `tsc -p tsconfig.build.json` pass.
