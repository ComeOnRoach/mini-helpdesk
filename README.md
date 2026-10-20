# Mini Helpdesk

A learning pet project: a ticketing system (NestJS + React + MySQL), built in an npm-workspaces monorepo.

## Requirements

| Tool                        | Needed for                                   |
| --------------------------- | -------------------------------------------- |
| Git                         | Cloning the repository                       |
| Docker Desktop (Compose v2) | Quick start (runs the database, API and web) |
| Node.js 20 LTS and npm 10+  | Development without Docker only              |

Use Node 20 for local work. The API build (Nest CLI 12) fails on Node 22.14 with
`ERR_REQUIRE_CYCLE_MODULE`; the Docker images use Node 20, so the quick start is not affected.

## Quick start

```bash
git clone https://github.com/ComeOnRoach/mini-helpdesk.git
cd mini-helpdesk
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
docker compose up
```

The first start takes a few minutes: the `api` and `web` containers run `npm install` into a shared
`node_modules` volume. The stack is ready when the logs show the API listening on port 3000 and
Vite serving on port 5173. Source changes are picked up automatically (hot reload).

Stop and reset:

```bash
docker compose down        # stop, keep the database
docker compose down -v     # stop and wipe the database and node_modules volumes
```

## Addresses

| What    | URL                          | Expected                                |
| ------- | ---------------------------- | --------------------------------------- |
| Web     | http://localhost:5173        | The app with the navigation bar         |
| API     | http://localhost:3000        | Base URL for the web client             |
| Swagger | http://localhost:3000/docs   | Interactive API documentation           |
| Health  | http://localhost:3000/health | `{"status":"ok","db":"up"}`             |
| MySQL   | `localhost:3306`             | User, password and database from `.env` |

## Local development without Docker

Run only the database in Docker and the apps on the host (Node 20):

```bash
cp .env.example .env                 # DB_HOST=localhost is the default
docker compose up -d db              # MySQL on localhost:3306
npm install                          # dependencies for all workspaces
npm run start:dev -w apps/api        # API with hot reload on :3000
npm run dev -w apps/web              # web dev server on :5173
```

Vite reads env files from `apps/web`, not from the repository root. To point the web app at the API,
create `apps/web/.env` (git-ignored) with `VITE_API_URL=http://localhost:3000`.

Other commands:

```bash
npm run lint       # ESLint
npm run format     # Prettier
npm run build      # build api and web
```

## Repository structure

```
mini-helpdesk/
├─ apps/
│  ├─ api/                    NestJS API (config validation, /health, Swagger)
│  └─ web/                    React + Vite app (routes, layout, API client)
├─ docs/
│  ├─ tasks/                  task files T0.1–T9.3 and 00-INDEX.md
│  └─ features/               one document per finished feature
├─ docker-compose.yml         db + api + web
├─ docker-compose.override.yml  dev file watching (polling) for Windows bind mounts
├─ .env.example               all environment variables with defaults
├─ eslint.config.mjs          ESLint (flat config), Prettier settings in .prettierrc
├─ CLAUDE.md                  project rules
├─ e2e/                       (planned) Playwright placeholder
└─ .github/workflows/         (planned) CI
```

## Environment variables

| Variable           | Default                 | Purpose                                                        |
| ------------------ | ----------------------- | -------------------------------------------------------------- |
| `DB_HOST`          | `localhost`             | MySQL host (compose overrides it to `db` for the api)          |
| `DB_PORT`          | `3306`                  | MySQL port                                                     |
| `DB_USER`          | `helpdesk`              | MySQL application user                                         |
| `DB_PASSWORD`      | `helpdesk`              | MySQL application password                                     |
| `DB_ROOT_PASSWORD` | `root`                  | MySQL root password (used by the image and healthcheck)        |
| `DB_NAME`          | `helpdesk`              | Database name                                                  |
| `JWT_SECRET`       | `change-me`             | JWT signing secret                                             |
| `JWT_EXPIRES_IN`   | `1h`                    | Access token lifetime (`15m`, `1h`, `7d`)                      |
| `NODE_ENV`         | `development`           | Runtime environment                                            |
| `PORT`             | `3000`                  | API listen port                                                |
| `VITE_API_URL`     | `http://localhost:3000` | API base URL used by the web app                               |
| `VITE_ANALYTICS_ENABLED` | `true` | `true` sends `POST /api/analytics/events` on key actions; any other value turns it off |
| `WEB_ORIGIN`       | `http://localhost:5173` | Origin allowed by API CORS                                     |
| `UPLOAD_DIR`       | `<api cwd>/uploads`     | Folder for ticket attachments (compose: `/app/uploads` volume) |
| `MAX_UPLOAD_BYTES` | `5242880`               | Attachment size limit in bytes (5 MB)                          |
| `CSP_ENABLED` | `false` | `true` sends a `Content-Security-Policy` header from the API (helmet) and from the web dev/preview server |
| `CSP_REPORT_ONLY` | `false` | With `CSP_ENABLED=true`, `true` sends `Content-Security-Policy-Report-Only` instead (violations are reported, not blocked) |
| `ENABLE_TEST_API` | `false` | `true` (or `NODE_ENV=test`) registers `/api/test/*`; ignored when `NODE_ENV=production` |
| `TEST_API_KEY` | _(empty)_ | Secret for the `x-test-key` header; required when the Test API is on |

Never commit `.env`.

## Troubleshooting

- **Port already in use** (3000, 3306 or 5173): stop the other process, or change `PORT` / `DB_PORT` in `.env`.
- **`api` keeps waiting:** it starts only after MySQL is healthy, which can take about 30 seconds on the first run.
- **First start fails during `npm install`:** `api` and `web` share one `node_modules` volume; run `docker compose up` again.
- **No hot reload on Windows:** file watchers poll through `docker-compose.override.yml`; make sure the override file is not deleted.

## Database migrations

The API applies pending migrations on startup. Manual control (inside the container use
`docker compose exec api <command>`):

```bash
npm run migration:generate -w apps/api -- src/migrations/<Name>
npm run migration:run -w apps/api
npm run migration:revert -w apps/api
```

See `docs/features/typeorm-mysql-migrations.md`. The data model and ER diagram are in `docs/features/entities.md`.

## Seed data

```bash
npm run seed -w apps/api                          # or: docker compose exec api npm run seed -w apps/api
```

Creates 2 users and 12 tickets with comments; running it again changes nothing. Development accounts:

| Email               | Password    | Role    |
| ------------------- | ----------- | ------- |
| `user@example.com`  | `User123!`  | `user`  |
| `agent@example.com` | `Agent123!` | `agent` |

Details: `docs/features/seed.md`. You can log in with them at http://localhost:5173/login.

## Authentication

| Method | Path                 | Auth   | Result                                    |
| ------ | -------------------- | ------ | ----------------------------------------- |
| POST   | `/api/auth/register` | public | Creates a `user`; 409 if the email exists |
| POST   | `/api/auth/login`    | public | `{ accessToken, user }`; 401 on bad login |
| GET    | `/api/auth/me`       | Bearer | The current user                          |

Send the token as `Authorization: Bearer <token>`. Lifetime is set by `JWT_EXPIRES_IN`. The API uses
the `/api` prefix (only `/health` and `/docs` are outside it). Details: `docs/features/auth-register-login.md`.

Errors always look like `{ statusCode, error, message, path, timestamp }` (`/health` 503 is the one exception). See `docs/features/validation-error-format.md`.

## Roles and access

Every route requires a valid Bearer token unless it is marked `@Public()` (`/api/auth/register`,
`/api/auth/login`, `/health`). A missing, invalid or expired token gives 401; a valid token without the
required role gives 403.

| Action                              | `user`         | `agent` |
| ----------------------------------- | -------------- | ------- |
| Register, log in, `GET /auth/me`    | yes            | yes     |
| See and edit tickets                | only their own | all     |
| Change ticket `status` and assignee | no             | yes     |

The ticket rules are enforced by the ticket endpoints (`canAccessTicket()`, `canDeleteTicket()`). A user asking for someone else's ticket gets 404.
Details: `docs/features/jwt-and-role-guards.md`.

Web: `/login` and `/register`; `/tickets` needs a login. The token is kept in `localStorage` (`token`). See `docs/features/frontend-auth.md`.

Print page: `/tickets/:id/print` (web route without header or navigation; all comments and attachments; `Print / Save as PDF` button calls `window.print()`, A4 `@media print` styles). See `docs/features/ticket-print.md`.

CSV export: `GET /api/tickets/export?status=open&priority=high&tag=bug&q=text&sort=createdAt:desc` (the list filters, no paging; UTF-8 with BOM, file `tickets-YYYY-MM-DD.csv`; users export their own tickets, agents all). See `docs/features/tickets-export-csv.md`.

Attachments: `POST /api/tickets/:id/attachments` (multipart field `file`; png, jpg, pdf, txt, csv; up to `MAX_UPLOAD_BYTES`, 5 MB by default) `DELETE /api/tickets/:id/attachments/:attachmentId` and `GET /api/attachments/:id/download` (original file name, `Content-Disposition: attachment`). A user works only with their own tickets (others answer 404), an agent with any. Too large gives 413, a wrong type 415. Files live in `UPLOAD_DIR` (compose volume `uploads_data`). See `docs/features/attachments.md`.

Tickets: `GET /api/tickets?page=1&limit=10&status=open&priority=high&tag=bug&q=text&sort=createdAt:desc` (login required; users see their own tickets, agents all). See `docs/features/tickets-list.md`.

| Method | Path               | Who                                                                        |
| ------ | ------------------ | -------------------------------------------------------------------------- |
| POST   | `/api/tickets`     | any logged-in user; the ticket starts `open`, created by the caller        |
| GET    | `/api/tickets/:id` | owner or agent; includes comments and attachments                          |
| PATCH  | `/api/tickets/:id` | owner or agent; only an agent may send `status` or `assigneeId` (else 403) |
| DELETE | `/api/tickets/:id` | agent, or the author while the ticket is `open`                            |

See `docs/features/tickets-crud.md`.

Comments:

| Method | Path                        | Who                                                                       |
| ------ | --------------------------- | ------------------------------------------------------------------------- |
| POST   | `/api/tickets/:id/comments` | owner or agent; body 1 to 2000 characters; returns the full comment       |
| GET    | `/api/tickets/:id/comments` | owner or agent; `?page=&limit=`, oldest first; `{items,total,page,limit}` |

Another user's ticket answers 404. Each new comment emits the internal event `comment.added` (payload in `docs/features/comments.md`) for the WebSocket gateway (T5.1). See `docs/features/comments.md`.

## Real-time (WebSocket)

Socket.IO on the API port (`ws://localhost:3000/socket.io/`). Full description: `docs/features/websocket-gateway.md`.

**Connect** with the login token: `io(url, { auth: { token } })` (an `Authorization: Bearer <token>` header also works). A missing, invalid or expired token, or a deleted user, is rejected before the connection exists: the client gets `connect_error` with the message `Unauthorized`.

**Rooms.** Every socket is in `user:<id>`; an agent is also in `agents`. Send `ticket.subscribe` `{ "ticketId": 5 }` to join `ticket:5` (and `ticket.unsubscribe` to leave). Both answer with an ack: `{ "ok": true }` or `{ "ok": false, "message": "..." }`. Someone else's ticket answers `Ticket not found`, like a missing one.

**Server events** (a `user` only receives events of their own tickets; an agent receives all):

| Event            | Sent to                                          | Payload                                                                 |
| ---------------- | ------------------------------------------------ | ----------------------------------------------------------------------- |
| `ticket.created` | `agents`, `user:<creator>`                       | `{ ticket }` (the ticket as `POST /api/tickets` returns it)             |
| `ticket.updated` | `agents`, `user:<creator>`, `ticket:<id>`        | `{ ticket, changedFields: string[], actorId: number }`                  |
| `comment.added`  | `ticket:<id>`, `agents`, `user:<ticket creator>` | `{ ticketId, comment }` (the comment as `POST .../comments` returns it) |

A socket in several of these rooms gets the event once.

**In the web app** (`docs/features/realtime-ui.md`): the socket opens after login and closes on logout; a toast "New comment on ticket #N" with a link, an unread badge on the Tickets link (`nav-unread-badge`, reset when the ticket is opened), live comments on the open ticket page, and a connection indicator (`nav-connection`, `data-status` = `connecting` / `online` / `reconnecting` / `offline`).

**Browser notifications** (`docs/features/browser-notifications.md`): the header shows the permission (`nav-notifications`, `data-permission` = `default` / `granted` / `denied` / `unsupported`) with an "Enable notifications" button (`nav-notifications-enable`) and a hint when blocked (`nav-notifications-hint`). With permission, a comment from someone else while the tab is hidden shows a system notification; clicking it opens the ticket.

## Help page: iframe in iframe (`/help`)

`/help` embeds `/widgets/faq.html` in `<iframe id="faq-frame" title="FAQ">`, and that page embeds `/widgets/feedback.html` in `<iframe id="feedback-frame" title="Feedback">`. All three levels are the same origin; the widgets are static files in `apps/web/public/widgets/`. Playwright: `page.frameLocator('#faq-frame').frameLocator('#feedback-frame')`. Test ids: page `help-title`, `help-faq-frame`, `help-faq-loading`, `help-faq-open`; FAQ `faq-search`, `faq-count`, `faq-item`, `faq-question`, `faq-answer`, `faq-empty`; feedback `feedback-helpful-yes`, `feedback-helpful-no`, `feedback-comment`, `feedback-submit`, `feedback-error`, `feedback-thanks` (`data-answer`). Full description: `docs/features/nested-iframes.md`.

## Share pop-up (`/share/:id`)

The ticket page has a "Share" button (`ticket-details-share`) that runs `window.open('/share/<id>', 'share', 'width=500,height=600')`. The pop-up page (outside the main layout, login required) shows the ticket title (`share-title`), a read-only input with the ticket link `<origin>/tickets/<id>` (`share-link`), "Copy link" (`share-copy`, writes to the clipboard and shows `share-copied`; on failure `share-copy-error`) and "Close" (`share-close`, `window.close()`). If the browser blocks the pop-up, a toast explains it. Other test ids: `share-page` (`data-ticket-id`), `share-loading`, `share-error`, `share-retry`, `share-not-found`. Playwright: `page.waitForEvent('popup')`. Full description: `docs/features/popup-share.md`.

## Contacts page: geolocation (`/contacts`)

`/contacts` lists three static offices (Lisbon, Kyiv, Berlin). The "Nearest office" button (`contacts-locate`) calls `navigator.geolocation.getCurrentPosition`, computes Haversine distances, highlights the nearest office row (`data-nearest="true"`) and shows `Nearest office: <name>, <km> km` (rounded to 1 decimal, `contacts-result`). Errors have separate messages (`contacts-error`, `data-error-kind` = `denied` / `unavailable` / `timeout` / `unsupported`) and a retry button; `contacts-loading` shows while locating. The position is never stored. Playwright: `context.grantPermissions(['geolocation'])` and `context.setGeolocation(...)`. Test ids: `contacts-title`, `contacts-locate`, `contacts-loading`, `contacts-error`, `contacts-error-message`, `contacts-retry`, `contacts-result`, `contacts-result-office`, `contacts-result-distance`, rows `contacts-office` (`data-office-id`, `data-nearest`). Full description: `docs/features/contacts-geolocation.md`.

## Mobile layout (<= 768px)

At 768px and below the navigation collapses behind a burger button (`nav-burger`, `aria-expanded`, `aria-controls="main-nav"`). The panel holds the links, the notification control, the email and Logout; the connection pill (`nav-connection`) and an unread badge (`nav-burger-badge`) stay in the bar. The menu closes on link click, route change, Escape and logout. The tickets table becomes cards (`data-label` per cell, row testids unchanged), forms and modals use the full width, and buttons and inputs are at least 44px high. The desktop layout (>= 769px) is unchanged. Playwright: `devices['iPhone 13']`, `tap()`. Full description: `docs/features/responsive-mobile.md`.

## Analytics requests (`/api/analytics/events`)

With `VITE_ANALYTICS_ENABLED=true` the web app sends `POST /api/analytics/events` (`{ event, page, ts }`, `ts` = epoch ms; public; API answers 204 and stores nothing) for `login`, `ticket_create`, `ticket_open`, `search` (debounced, non-empty) and `export`. Failures are swallowed and never affect the UI; any other value of the variable sends nothing. Playwright: `page.route('**/analytics/**', route => route.abort())`, `page.waitForRequest`, `request.postDataJSON()`. Full description: `docs/features/analytics-events.md`.

## Test locators (data-testid)

Every interactive element in the web app has a `data-testid`, so future Playwright tests do not depend on text or CSS. Playwright reads `data-testid` by default (`getByTestId`).

- **Format:** `kebab-case`, `<page>-<element>`: `login-email`, `login-submit`, `ticket-form-title`, `ticket-details-delete`.
- **List rows:** `data-testid="ticket-row"` plus `data-ticket-id="<id>"` (comments: `comment-item` plus `data-comment-id`).
- **No duplicates** on one page, except list rows.
- **Do not rename** existing testids without a reason; tests will depend on them.
- **Shared widgets:** toast `toast` (`data-toast-type`), modal `confirm-modal`, `confirm-modal-confirm`, `confirm-modal-cancel`; states `<prefix>-loading`, `<prefix>-empty`, `<prefix>-error`, `<prefix>-retry`; pagination `<prefix>-page-prev`, `<prefix>-page-next`.
- **Enforced by lint:** `npm run lint` fails if a `button`, `input`, `select`, `textarea`, `form`, `Link` or `NavLink` in `apps/web/src` has no `data-testid`.
- **Pull requests:** use the checklist in `.github/pull_request_template.md`.

More detail: `docs/features/data-testid.md`.

## Theme switcher (`nav-theme-toggle`)

The header button switches light/dark (`data-theme` on `<html>`, saved in `localStorage` key `theme`, default from `prefers-color-scheme`, print stays black on white); the Help widgets follow it. Details: `docs/features/theme-switcher.md`.

## Service files: robots.txt and sitemap.xml

Static files in `apps/web/public/`, served by the web origin at the site root: `/robots.txt` (`text/plain`; `Disallow: /admin`, `Disallow: /tickets`, `Sitemap: http://localhost:5173/sitemap.xml`) and `/sitemap.xml` (XML; `/`, `/login`, `/register`, `/help`, `/contacts`; no private pages). The host is hardcoded as `http://localhost:5173`; edit both files for another host. Playwright: `request.get`, `page.goto`, `context.route('**/robots.txt', ...)`. Details: `docs/features/robots-sitemap.md`.

## Content-Security-Policy (`CSP_ENABLED`, `CSP_REPORT_ONLY`)

Off by default. `CSP_ENABLED=true` adds a `Content-Security-Policy` header to API responses (helmet, CSP only) and to the web dev/preview server (Vite plugin); `CSP_REPORT_ONLY=true` switches both to `Content-Security-Policy-Report-Only`. Violations are POSTed to `POST /api/csp-report` (logged, `204`). Swagger `/docs` gets a relaxed policy. Details and limitations: `docs/features/csp.md`.

## Test API (`/api/test`)

For future automated tests. Registered **only** when `ENABLE_TEST_API=true` or `NODE_ENV=test`, and never when `NODE_ENV=production` (routes do not exist, so they answer 404 and are absent from Swagger). Every call needs the header `x-test-key: <TEST_API_KEY>` (missing or wrong gives 401); the API will not start with the Test API on and no `TEST_API_KEY`.

- `POST /api/test/reset` empties comments, attachments, tickets and users (ids restart at 1), deletes uploaded files, then re-runs the deterministic seed. It refuses to run unless `DB_NAME` contains `test`: use a dedicated database.
- `POST /api/test/seed` `{ "tickets": 5, "status": "open" }` adds deterministic `Test ticket N` tickets (optional `priority`, `createdBy`); needs the base users (otherwise 409: call reset first).
- `POST /api/test/users` `{ "email", "password", "role" }` creates a user (409 if the email exists).

Details and curl examples: `docs/features/test-api.md`.
