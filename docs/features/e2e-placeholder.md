# Playwright placeholder (T8.4)

Prepares the extension point for the future Playwright suite without adding any test (see `CLAUDE.md`, "Do NOT").

## What exists

- `e2e/README.md`: purpose, plans, environment variables, how to run once tests exist, and the table "Feature -> Playwright topic" linking task files and feature docs.
- `.github/workflows/ci.yml`: a fully commented-out `e2e` job at the bottom. The active job set is still `api` and `web`, so CI results are unchanged.
- Variables `BASE_URL`, `API_URL`, `TEST_API_KEY` added to `.env.example` and the README environment table. They are read only by the future Playwright config/tests, not by the API or web app.

## The commented `e2e` job

Same setup as the `api` job (MySQL service, migrations, seed, API in the background with a `/health` wait, web build and `vite preview` on 4173), followed by `npx playwright install --with-deps`, `npx playwright test`, and `actions/upload-artifact@v4` for `playwright-report/` and `test-results/` (plus API/web logs on failure). It sets `BASE_URL=http://127.0.0.1:4173`, `API_URL=http://127.0.0.1:3000`, `ENABLE_TEST_API=true`, `TEST_API_KEY=ci-test-key`, and uses database `helpdesk_test` because the Test API reset refuses database names without "test".

## To enable it

1. Add `@playwright/test`, a `playwright.config.ts` (using `BASE_URL`) and the tests. No application change is needed.
2. The Test API (T7.3) is already in the API; it needs `ENABLE_TEST_API=true` (or `NODE_ENV=test`) and a non-empty `TEST_API_KEY`, otherwise the API does not start.
3. Remove the leading `# ` from every line of the block.

## Verification

The workflow parses as YAML with jobs `api` and `web`; with the block uncommented it parses with `api`, `web`, `e2e`. The step list was compared with the `api` job. The real Actions run is not verified.
