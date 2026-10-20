# CI: MySQL service, migrations, seed, health check (T8.2)

Workflow: `.github/workflows/ci.yml`. Builds on [ci-lint-build](ci-lint-build.md).

## Jobs

The T8.1 matrix job was split into two jobs, still named `api` and `web`. `web` is unchanged (install, lint, build). `api` additionally runs the app against a real database.

## `api` job

- `services.mysql`: image `mysql:8`, user/database `helpdesk` (`utf8mb4` is the default charset of MySQL 8); health check `mysqladmin ping` every 5 s (20 retries); port 3306 published to the runner.
- Job env: `NODE_ENV=test`, `DB_HOST=127.0.0.1`, `DB_PORT/USER/PASSWORD/NAME`, `JWT_SECRET` (CI-only value), `PORT=3000`, `WEB_ORIGIN=http://127.0.0.1:4173`, `VITE_API_URL=http://127.0.0.1:3000`. No new variables were introduced, so `.env.example` is unchanged. `NODE_ENV=test` is accepted by `env.validation.ts`; only `production` changes behaviour (the seed refuses to run).
- Steps after install, lint and `npm run build -w apps/api`:
  1. `npm run migration:run -w apps/api`
  2. `npm run seed -w apps/api` (known data: 2 users, 12 tickets, 8 comments)
  3. start `node apps/api/dist/main` in the background, log to `api.log`, PID in `api.pid`
  4. wait for `/health`: up to 30 tries, 2 s apart; fails the step if the API process dies, if the 60 s timeout passes, or if the response does not contain `"db":"up"`
  5. `npm run build -w apps/web`, then `vite preview` in the background on `127.0.0.1:4173` (log `web.log`), curl until it answers
  6. on failure, upload `api.log` and `web.log` as artifact `api-logs` (`actions/upload-artifact@v4`)

## Verified locally

Using a throwaway MySQL 8 container and a `node:20` container (same commands as the workflow): install, lint, API build, migration, seed, `/health` returned `{"status":"ok","db":"up"}`, web build and preview returned 200. With the API not started (or killed) the wait loop exits non-zero. The real GitHub Actions run is not verified yet.
