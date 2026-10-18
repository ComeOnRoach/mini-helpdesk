# CLAUDE.md — Mini Helpdesk

A learning pet project: a ticketing system. It is built **without test automation** and will later be covered with Playwright.
So the application must be deterministic, with stable locators and built-in testing aids.

## Stack

- **API:** NestJS + TypeScript (strict) + TypeORM + MySQL 8
- **Web:** React + Vite + TypeScript + React Router
- **Infra:** Docker Compose, GitHub Actions
- **Layout:** npm workspaces (monorepo)

```
helpdesk/
├─ apps/api            NestJS
├─ apps/web            React + Vite
├─ e2e/                placeholder for Playwright (empty for now)
├─ docs/tasks/         task files T0.1–T9.3 and 00-INDEX.md
├─ docker-compose.yml
├─ .github/workflows/ci.yml
└─ CLAUDE.md
```

## Working with tasks

- Plan and tasks: `docs/tasks/00-INDEX.md`; each task lives in its own file `T<epic>.<number>-*.md`.
- Before starting, read the task file: goal, "What to do", acceptance criteria, dependencies.
- Do not start a task until its dependencies are done.
- One task = one branch `feat/T<number>-<name>` = one PR.
- Commits: `feat(T3.2): short description` (types: feat, fix, chore, docs, refactor).
- A task is done when all its acceptance criteria are met. Tick `[x]` in the task file checklist.
- Do not add functionality outside the task. If you notice something extra, mention it in the PR or in notes.

## Commands

```bash
docker compose up                 # whole stack (db + api + web)
npm install                       # dependencies for all workspaces
npm run lint                      # ESLint
npm run format                    # Prettier
npm run build                     # build api and web
npm run start:dev -w apps/api     # API with hot reload
npm run dev -w apps/web           # web dev server
npm run migration:generate -w apps/api -- src/migrations/<Name>
npm run migration:run -w apps/api
npm run migration:revert -w apps/api
npm run seed -w apps/api
```

URLs: web `:5173`, api `:3000`, Swagger `/docs`, health `/health`.

## API rules

- TypeORM: `synchronize: false`; schema changes only through migrations.
- Tables: `utf8mb4`, collation `utf8mb4_unicode_ci`.
- All DTOs are validated (`class-validator`, `ValidationPipe` with `whitelist` and `forbidNonWhitelisted`).
- One error format: `{ statusCode, error, message, path, timestamp }`. Never return stack traces in production.
- Passwords only via `bcrypt`; neither the hash nor the password is ever returned in responses.
- Roles: `user` sees and edits only their own tickets; `agent` has access to all; only `agent` can change `status` and `assignee`.
- Config only via `ConfigService` and env; no hardcoded secrets or addresses.
- Every new endpoint is documented in Swagger (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, DTOs with `@ApiProperty`).
- Business logic lives in services; controllers stay thin.

## Web rules

- Token in `localStorage` (key `token`), theme in `localStorage` (`theme`), form draft in `sessionStorage` (`ticketDraft`).
- The API client adds `Authorization: Bearer`; on 401 it clears the token and redirects to `/login`.
- Every screen has loading / empty / error states.
- List filters and the current page live in the query string.
- Interactive elements have a `data-testid` (see below).
- An analytics failure must never break the UI.

## data-testid

- Format: `kebab-case`, `<page>-<element>`: `login-email`, `login-submit`, `ticket-row`, `ticket-create-submit`.
- For list rows: `data-testid="ticket-row"` plus `data-ticket-id="<id>"`.
- No duplicate testids on a page, except list rows.
- Do not rename existing testids without a reason: automated tests will depend on them.

## Features for future testing

- **Deterministic seed:** no `Math.random`. Accounts: `user@example.com` (user), `agent@example.com` (agent). Keep passwords in the README.
- **Test API** (`/test/reset`, `/test/seed`, `/test/users`): only when `NODE_ENV=test` or `ENABLE_TEST_API=true`, protected by the `x-test-key` header. Unavailable in production (404).
- **Instability modes** (off by default): `SLOW_API_MS`, `FLAKY_RATE`, the `x-delay-ms` header.
- **Special pages:** `/help` (iframe inside iframe), `/share/:id` (pop-up), `/contacts` (geolocation), `/dashboard` (`/stats`), the ticket print page.
- **Service files:** `robots.txt`, `sitemap.xml`, CSP via env `CSP_ENABLED` / `CSP_REPORT_ONLY`.

## Environment variables

All variables from `.env.example`: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `NODE_ENV`, `SLOW_API_MS`, `FLAKY_RATE`, `CSP_ENABLED`, `CSP_REPORT_ONLY`, `ENABLE_TEST_API`, `TEST_API_KEY`, `VITE_API_URL`, `VITE_ANALYTICS_ENABLED`.
When adding a new variable, add it to `.env.example` and the README right away. Never commit `.env`.

## Code quality

- TypeScript strict; no `any` without a reason.
- Before committing, `npm run lint` and `npm run build` must pass.
- File names: `kebab-case`; classes: `PascalCase`; variables and functions: `camelCase`.
- Do not edit existing migrations after merge; create a new one.
- Do not commit `node_modules`, `dist`, `.env`, `uploads/`.

## Do NOT

- Do not write automated tests (unit/e2e) within this project. The `e2e/` folder stays empty with a README, and the `e2e` job in CI stays commented out.
- Do not enable `synchronize` in TypeORM.
- Do not expose test endpoints in production.
- Do not change the error format or roles without updating Swagger and the README.

## Documentaion

Should be created after task will finished and verified. Separate file for each feature in English.
