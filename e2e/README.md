# e2e - Playwright placeholder

This folder is intentionally empty (T8.4). The project is built without test automation; the suite will be written later as a separate stage. The folder, the table below, the commented `e2e` job in `.github/workflows/ci.yml` and the shared variables are the extension point.

Rules: no tests, and no `package.json` or Playwright config changes are part of the application project (see `CLAUDE.md`, "Do NOT").

## Plans

1. Add `@playwright/test` and a `playwright.config.ts` (here in `e2e/` or at the repo root; if `e2e/` is used, adjust the paths in the CI job).
2. Read `BASE_URL` (`use.baseURL`) and `API_URL` (`request` fixture) from the environment.
3. Reset state before tests via the Test API (`POST {API_URL}/api/test/reset` with the `x-test-key` header).
4. Locate elements by `data-testid` only (`docs/features/data-testid.md`).
5. Uncomment the `e2e` job in `.github/workflows/ci.yml`.

## Environment variables

| Variable       | Local default           | Purpose                                                     |
| -------------- | ----------------------- | ----------------------------------------------------------- |
| `BASE_URL`     | `http://localhost:5173` | Web app URL (CI: `http://127.0.0.1:4173`, the Vite preview) |
| `API_URL`      | `http://localhost:3000` | API base URL, for the `request` fixture and the Test API    |
| `TEST_API_KEY` | none                    | Value of the `x-test-key` header; must equal the API's key  |

The API must run with `ENABLE_TEST_API=true` (or `NODE_ENV=test`) and the same `TEST_API_KEY`. The Test API is task T7.3 (branch `feat/T7.3-test-endpoints-reset-seed`); until it is merged, these two API variables have no effect.

## Running once tests exist

```bash
docker compose up                 # or run db + api + web locally; seed: npm run seed -w apps/api
npx playwright install --with-deps
BASE_URL=http://localhost:5173 API_URL=http://localhost:3000 TEST_API_KEY=<key> npx playwright test
npx playwright show-report
```

Seeded accounts and passwords are in the root `README.md` (`user@example.com`, `agent@example.com`).

## Feature -> Playwright topic

| Feature                                 | Playwright topic                                | Task                                                                                                 | Feature doc                                                                                                |
| --------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Register / login, JWT in `localStorage` | forms, `storageState`, API login via `request`  | [T2.4](../docs/tasks/T2.4-frontend-auth-pages.md)                                                    | [frontend-auth](../docs/features/frontend-auth.md)                                                         |
| Roles and access                        | multiple contexts, 401/403 checks               | [T2.2](../docs/tasks/T2.2-jwt-and-role-guards.md)                                                    | [jwt-and-role-guards](../docs/features/jwt-and-role-guards.md)                                             |
| Validation and error format             | API response assertions                         | [T2.3](../docs/tasks/T2.3-dto-validation-error-format.md)                                            | [validation-error-format](../docs/features/validation-error-format.md)                                     |
| Ticket list, filters, pagination        | query string, `toHaveURL`, tables               | [T3.4](../docs/tasks/T3.4-frontend-tickets-ui.md)                                                    | [tickets-ui](../docs/features/tickets-ui.md)                                                               |
| Ticket create form draft                | `sessionStorage`, reload                        | [T3.5](../docs/tasks/T3.5-draft-in-sessionstorage.md)                                                | [ticket-draft](../docs/features/ticket-draft.md)                                                           |
| Locators                                | `getByTestId`                                   | [T3.6](../docs/tasks/T3.6-data-testid.md)                                                            | [data-testid](../docs/features/data-testid.md)                                                             |
| Attachments upload / download           | `setInputFiles`, `waitForEvent('download')`     | [T4.1](../docs/tasks/T4.1-attachments-upload.md), [T4.2](../docs/tasks/T4.2-attachments-download.md) | [attachments](../docs/features/attachments.md)                                                             |
| CSV export                              | download and file content                       | [T4.3](../docs/tasks/T4.3-export-csv.md)                                                             | [tickets-export-csv](../docs/features/tickets-export-csv.md)                                               |
| Print page / PDF                        | `page.pdf()`, print media                       | [T4.4](../docs/tasks/T4.4-print-page-pdf.md)                                                         | [ticket-print](../docs/features/ticket-print.md)                                                           |
| WebSocket, toasts, badge                | `page.on('websocket')`, two contexts            | [T5.1](../docs/tasks/T5.1-websocket-gateway.md), [T5.2](../docs/tasks/T5.2-realtime-ui-toast.md)     | [websocket-gateway](../docs/features/websocket-gateway.md), [realtime-ui](../docs/features/realtime-ui.md) |
| Browser notifications                   | permissions, stubbing `Notification`            | [T5.3](../docs/tasks/T5.3-browser-notifications.md)                                                  | [browser-notifications](../docs/features/browser-notifications.md)                                         |
| `/help` iframe in iframe                | `frameLocator` chains                           | [T6.1](../docs/tasks/T6.1-nested-iframes.md)                                                         | [nested-iframes](../docs/features/nested-iframes.md)                                                       |
| `/share/:id` pop-up                     | `waitForEvent('popup')`, clipboard              | [T6.2](../docs/tasks/T6.2-popup-share.md)                                                            | [popup-share](../docs/features/popup-share.md)                                                             |
| `/contacts` geolocation                 | `geolocation` and `permissions` context options | [T6.3](../docs/tasks/T6.3-geolocation-nearest-office.md)                                             | [contacts-geolocation](../docs/features/contacts-geolocation.md)                                           |
| Mobile layout                           | viewport, `devices`                             | [T6.4](../docs/tasks/T6.4-responsive-mobile.md)                                                      | [responsive-mobile](../docs/features/responsive-mobile.md)                                                 |
| Analytics requests                      | `page.route`, `waitForRequest`                  | [T6.5](../docs/tasks/T6.5-analytics-requests.md)                                                     | [analytics-events](../docs/features/analytics-events.md)                                                   |
| Light/dark theme                        | `colorScheme`, `localStorage`                   | [T6.6](../docs/tasks/T6.6-theme-switcher.md)                                                         | [theme-switcher](../docs/features/theme-switcher.md)                                                       |
| `robots.txt`, `sitemap.xml`             | `request` fixture, content checks               | [T7.1](../docs/tasks/T7.1-robots-sitemap.md)                                                         | -                                                                                                          |
| CSP and violation reports               | response headers, console, `/api/csp-report`    | [T7.2](../docs/tasks/T7.2-csp-helmet.md)                                                             | -                                                                                                          |
| Test API (reset / seed / users)         | `beforeEach` setup, `x-test-key`                | [T7.3](../docs/tasks/T7.3-test-endpoints-reset-seed.md)                                              | -                                                                                                          |
| Slow / flaky API                        | timeouts, auto-wait, retries                    | [T7.4](../docs/tasks/T7.4-slow-api-flaky-mode.md)                                                    | -                                                                                                          |
| `/dashboard` and `/api/stats`           | network mocking, data-driven checks             | [T7.5](../docs/tasks/T7.5-stats-dashboard.md)                                                        | -                                                                                                          |

Rows with "-" have a feature doc on their own branch that is not part of this one. The final map is task [T9.3](../docs/tasks/T9.3-feature-to-playwright-map.md).
