# Feature to Playwright map (T9.3)

A table that tells the future test author which project feature to use for each Playwright topic.

## Where it lives

The same table, with the same 18 rows, is in two places:

- `README.md`, section "Feature to Playwright map" (between "Testing features" and "How to run");
- `e2e/README.md`, section "Feature to Playwright map" (links are relative to `e2e/`).

It replaces the shorter "Feature -> Playwright topic" table added in T8.4, so there is one layout only.

## Columns

| Column           | Meaning                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| Playwright topic | The topic from the task list (POM, upload, download, geolocation, ...). |
| Project feature  | The screen, route or endpoint that exercises the topic.                 |
| Task             | Task file(s) in `docs/tasks/`.                                          |
| What to check    | A short hint (API or option to use), kept from the T8.4 table.          |
| Feature doc      | Document(s) in `docs/features/`; `-` when the row spans all features.   |
| Status           | State of the automated tests themselves: `not started` or `done`.       |

All rows start as `not started`. When a topic gets tests, change the value in both files.

## Verification

Each row was checked against the code: routes in `apps/web/src/app.tsx` (`/login`, `/tickets`, `/tickets/:id`, `/tickets/:id/print`, `/share/:id`, `/help`, `/contacts`, `/dashboard`), storage keys (`token`, `theme`, `ticketDraft`), the attachment input, the Socket.IO provider, `Notification` use, `GET /api/stats`, the analytics client, `robots.txt` and `sitemap.xml` in `apps/web/public`, helmet in `apps/api/src/main.ts` and the CSP Vite plugin, the Test API controller and the instability interceptor. All relative links in both files resolve.

Correction to the task text: the CSP row says "helmet / nginx", but the project has no nginx config; CSP is set by helmet on the API and a Vite plugin on the web, so the row says that.

## Maintenance

Keep both tables identical. Add a row (and a feature doc link) when a new testable feature appears.
