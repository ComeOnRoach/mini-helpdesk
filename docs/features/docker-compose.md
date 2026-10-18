# Docker Compose (T0.2)

## What it is

One command brings up the local environment: `cp .env.example .env && docker compose up`.

## Services

| Service | Image     | Port | Notes                                                                     |
| ------- | --------- | ---- | ------------------------------------------------------------------------- |
| `db`    | `mysql:8` | 3306 | utf8mb4 / `utf8mb4_unicode_ci`, volume `db_data`, healthcheck             |
| `api`   | `node:20` | 3000 | starts only after `db` is healthy; `DB_HOST` is forced to `db` in compose |
| `web`   | `node:20` | 5173 | dev server                                                                |

- **Healthcheck:** `mysqladmin ping` as root; `api` uses `depends_on: condition: service_healthy`.
- **Persistence:** MySQL data lives in the named volume `db_data`. `docker compose down` keeps it; `docker compose down -v` wipes it.
- **Source mount:** the repo is bind-mounted to `/app`; `node_modules` is a separate named volume so host modules do not leak in.
- **Override:** `docker-compose.override.yml` is loaded automatically and enables polling file watchers (needed on Windows bind mounts).

## Placeholders

`api` and `web` run placeholder commands because NestJS (T0.3) and Vite (T0.4) do not exist yet.
Replace them with `npm run start:dev -w apps/api` and `npm run dev -w apps/web -- --host`.
Dockerfiles come in T8.3.

## Variables

See the table in the root `README.md`. `DB_ROOT_PASSWORD` was added here because the MySQL image requires it.
