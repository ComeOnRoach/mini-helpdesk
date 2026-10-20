# Final README (T9.2)

`README.md` is the single source of truth for a new person: what the project is, how to start it,
how it is built and what the test aids are.

## What it contains

- Description and screenshots (`docs/screenshots/`: login, tickets list, ticket details, dashboard, mobile). They were captured with Playwright CLI against the running stack with the seeded agent account; keep them small (about 15-55 KB each).
- Quick start with Docker, including the seed step: the database starts empty, so without `npm run seed` nobody can log in with the test accounts.
- Mermaid architecture diagram (web, API, Socket.IO gateway, MySQL, uploads volume) and an `erDiagram` taken from the entities in `apps/api/src/*/*.entity.ts`.
- Roles and permissions table, test accounts (from `apps/api/src/seed/seed.data.ts`), pages table (from `apps/web/src/app.tsx`), API overview, WebSocket protocol.
- Environment variable table covering every variable in `.env.example`.
- `data-testid` convention, testing features (Test API, `SLOW_API_MS`, `FLAKY_RATE`, `x-delay-ms`, CSP, special pages).
- How to run: Docker dev, Docker production-like, local, and what each CI job does.
- Troubleshooting and links to every document in `docs/features/`.

Not included on purpose: the Feature to Playwright mapping table (task T9.3).

## How it was verified

- A full dev stack was started from the working tree with `docker compose` (project name `t92`, other ports so the existing stack was untouched), seeded with `docker compose exec api npm run seed -w apps/api` (`Created 2 users, 12 tickets, 8 comments`), and both seeded accounts logged in via the API and the UI.
- `/health`, `/docs`, `/docs-json`, `/robots.txt`, `/sitemap.xml`, `/login`, `/dashboard`, `/help`, `/contacts` answered 200; `/api/stats` and `/api/tickets` without a token answered 401; `/api/test/users` answered 404 (Test API off) and is absent from `/docs-json`.
- The production compose file was built and run (`docker compose -f docker-compose.prod.yml up --build`): health `db: up`, web 200, `/docs` 200, Test API 404, registration at `/register` gave a `user` account that could log in.
- The first dev start failed during the concurrent `npm install` of `api` and `web`; restarting the `api` container fixed it, as the troubleshooting section says.
- All relative links in the README were checked to resolve; the file is formatted with Prettier.

## Maintenance

When a variable is added, update `.env.example` and the table in the README together. When a route is added to `apps/web/src/app.tsx`, add it to the pages table.
