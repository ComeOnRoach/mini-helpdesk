# Content-Security-Policy (T7.2)

A configurable CSP for the API and for the web app. Off by default.

## Switches

| Variable          | Default | Meaning                                                                                  |
| ----------------- | ------- | ---------------------------------------------------------------------------------------- |
| `CSP_ENABLED`     | `false` | `true` sends the `Content-Security-Policy` header. Anything else sends no CSP header.    |
| `CSP_REPORT_ONLY` | `false` | With `CSP_ENABLED=true`, `true` sends `Content-Security-Policy-Report-Only` instead (violations are reported but nothing is blocked). |

Both variables are in `.env.example` and are passed to the `api` and `web` services in `docker-compose.yml`.

## Where the header is set (important limitation)

`helmet` in NestJS only sets headers on **API responses** (port 3000). The browser enforces the CSP of the *document it loaded*, i.e. the web origin (port 5173), so helmet alone would not protect the React app or the Help iframes. Therefore the policy is applied in two places:

- **API:** `apps/api/src/common/csp.ts` (`applyCsp`, called once from `main.ts`). Only helmet's `contentSecurityPolicy` middleware is used (no HSTS, no other helmet headers). Swagger `/docs` gets a relaxed policy (`'unsafe-inline'` for scripts and styles) because Swagger UI needs it.
- **Web:** a small Vite plugin in `apps/web/vite.config.ts` sets `server.headers` (dev server) and `preview.headers` (`vite preview`) from the same env variables. There is no nginx yet (Dockerfiles come later), so a production static server must send an equivalent header itself.

Consequence: CSP is only enforced on the web app while it is served by the Vite dev server or `vite preview`. `vite build` output served by any other static server has no CSP until that server is configured.

## Policy

Web origin (preview, strict): `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' <API> <API as ws://>; frame-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; report-uri <API>/api/csp-report`.

Web dev server: the same, plus `'unsafe-inline'` in `script-src` (React Refresh preamble injected by Vite) and `style-src` (Vite injects `<style>`), plus `ws://localhost:*` in `connect-src` (HMR). `<API>` comes from `VITE_API_URL`.

API origin: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' <WEB_ORIGIN>; frame-src 'self'; frame-ancestors 'self' <WEB_ORIGIN>; object-src 'none'; base-uri 'self'; report-uri /api/csp-report`.

What it allows for the app: the same-origin Help widgets in iframes (`/widgets/*.html`, nested iframe), Socket.IO (`ws://` to the API) and `fetch` to the API (analytics, tickets), blob downloads (CSV, attachments).

### Theme script

The theme-init script used to be inline in `apps/web/index.html`, which `script-src 'self'` would block. It now lives in `apps/web/public/theme-init.js` and is loaded synchronously from `<head>`, so there is still no flash of the wrong theme.

## Violation reports: `POST /api/csp-report`

- Public, no JWT. Swagger: tag `csp`.
- Accepts `application/csp-report` (`report-uri`), `application/reports+json` and `application/json`. The two CSP content types are parsed by a body parser registered inside `CspModule`.
- The violated directive, blocked URI and document URI are logged as a warning (`[CSP] Violation: ...`). Nothing is stored. Response: `204`. A malformed body of a CSP type gives the standard `400` error format.

## Locators and Playwright notes

No UI was added. Useful checks:

- Response header: `response.headers()['content-security-policy']` (or `-report-only`) on the document request of the web origin and on API requests (`page.request.get(apiUrl + '/health')`).
- Blocked inline script: inject a `<script>` with `page.evaluate`; in enforce mode it does not run and the `securitypolicyviolation` event / console error "Executing inline script violates the following Content Security Policy directive" appears. In report-only mode it runs and `page.waitForRequest(r => r.url().includes('csp-report'))` catches the report.
- `browser.newContext({ bypassCSP: true })` disables enforcement (contrast test).
- Note: the browser may cache the document; use a fresh URL or context after switching the env mode.

## How it was verified (ports API 3112, web 5182)

- `CSP_ENABLED` unset: no CSP header. `CSP_ENABLED=true`: header on `/health`, `/docs`, and on the web document (`vite preview` and `vite` dev). `CSP_REPORT_ONLY=true`: `content-security-policy-report-only` only, on both origins.
- Strict `vite build` + `vite preview`: login, tickets list, theme toggle (light to dark), `/tickets/new`, `/help` with its iframes, Socket.IO websocket connected; no CSP console errors. An injected inline script was blocked (`script-src-elem|inline`) and the browser POSTed a report to `/api/csp-report` (logged by the API).
- Report-only: injected inline script ran, report was sent as `application/csp-report`. `bypassCSP: true` context: inline script ran.
- Dev server: header with `unsafe-inline`, HMR websocket works, CSV export download works, no console errors. Swagger `/docs` renders (7 tags) with no console errors.
- `curl` to `/api/csp-report` with `application/csp-report`, `application/reports+json`, `application/json` gives `204`; invalid CSP body gives `400`.
- `npm run lint`, API `tsc -p tsconfig.build.json`, web `tsc -b` and `vite build` pass.

Not covered: attachment upload/download in the browser under CSP, ticket print page under CSP, Docker Compose run, one unattributed 404 console message seen once in the first strict run (not reproducible in later runs, no CSP violation attached).
