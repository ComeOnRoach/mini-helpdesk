# NestJS API, health check and Swagger (T0.3)

## What it is

The API skeleton in `apps/api`: NestJS with strict TypeScript, validated configuration, a health endpoint and Swagger UI.

## Layout

- `src/main.ts` — bootstrap: global prefix, CORS, Swagger
- `src/app.module.ts` — `ConfigModule` (global) + `HealthModule`
- `src/config/env.validation.ts` — fails startup with a readable message if a required variable is missing or invalid
- `src/health/` — controller, DTO and DB indicator

## Endpoints

| Route         | Purpose                                    |
| ------------- | ------------------------------------------ |
| `GET /health` | API and database status (no `/api` prefix) |
| `GET /docs`   | Swagger UI (OpenAPI JSON at `/docs-json`)  |

All future business endpoints live under the `/api` prefix; only `/health` is excluded.

### `GET /health`

- `200` → `{ "status": "ok", "db": "up" }`
- `503` → `{ "status": "error", "db": "down" }` when MySQL is unreachable (2 s connect timeout, 3 s overall)

The DB check is a custom Terminus indicator that opens a `mysql2` connection and runs `SELECT 1`.
It is temporary: T1.1 replaces it with `TypeOrmHealthIndicator`.

## Configuration

Read only through `ConfigService`. Required: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`.
Optional: `NODE_ENV` (`development` | `test` | `production`), `PORT` (default 3000), `WEB_ORIGIN` (CORS origin, default `http://localhost:5173`).
Outside Docker the repo-root `.env` is loaded.

## Running

```bash
docker compose up                  # api runs `nest start --watch`
npm run start:dev -w apps/api      # without Docker (needs a reachable MySQL)
```

## Notes

- Hot reload inside Docker on Windows needs polling: `docker-compose.override.yml` sets `TSC_WATCHFILE` and `TSC_WATCHDIRECTORY`. `CHOKIDAR_USEPOLLING` alone does not affect the Nest/TypeScript watcher.
- The API workspace uses TypeScript `~6.0.3` (required by `@nestjs/schematics` 12); the root keeps 5.9 for linting.
- Nest CLI 12 crashes on Node 22.14.0 (`ERR_REQUIRE_CYCLE_MODULE` from `ora`). It works on Node 20.20 (the Docker image). Build and run via Docker, or use a newer Node locally.
