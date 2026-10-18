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

| Variable           | Default                 | Purpose                                                 |
| ------------------ | ----------------------- | ------------------------------------------------------- |
| `DB_HOST`          | `localhost`             | MySQL host (compose overrides it to `db` for the api)   |
| `DB_PORT`          | `3306`                  | MySQL port                                              |
| `DB_USER`          | `helpdesk`              | MySQL application user                                  |
| `DB_PASSWORD`      | `helpdesk`              | MySQL application password                              |
| `DB_ROOT_PASSWORD` | `root`                  | MySQL root password (used by the image and healthcheck) |
| `DB_NAME`          | `helpdesk`              | Database name                                           |
| `JWT_SECRET`       | `change-me`             | JWT signing secret                                      |
| `NODE_ENV`         | `development`           | Runtime environment                                     |
| `PORT`             | `3000`                  | API listen port                                         |
| `VITE_API_URL`     | `http://localhost:3000` | API base URL used by the web app                        |
| `WEB_ORIGIN`       | `http://localhost:5173` | Origin allowed by API CORS                              |

Never commit `.env`.

## Troubleshooting

- **Port already in use** (3000, 3306 or 5173): stop the other process, or change `PORT` / `DB_PORT` in `.env`.
- **`api` keeps waiting:** it starts only after MySQL is healthy, which can take about 30 seconds on the first run.
- **First start fails during `npm install`:** `api` and `web` share one `node_modules` volume; run `docker compose up` again.
- **No hot reload on Windows:** file watchers poll through `docker-compose.override.yml`; make sure the override file is not deleted.
