# TypeORM, MySQL and migrations (T1.1)

## What it is

The API connects to MySQL through TypeORM. The schema is changed only through migrations.

## Layout (`apps/api/src`)

- `database/database.config.ts` — `buildDataSourceOptions()`: the single source of connection options (`mysql`, `utf8mb4`, `synchronize: false`, entity and migration globs). Used by both the app and the CLI so they cannot drift.
- `database/database.module.ts` — `TypeOrmModule.forRootAsync` reading `DB_*` through `ConfigService`; adds `autoLoadEntities` and `migrationsRun: true`.
- `database/data-source.ts` — the `DataSource` used by the TypeORM CLI. Reads the environment (Docker) or the repo-root `.env` (host).
- `migrations/` — migration files. `InitSchema` is intentionally empty; it proves the run/revert chain. Real tables arrive in T1.2.

## Behaviour

- On startup the API applies all pending migrations (`migrationsRun: true`). `synchronize` is never enabled.
- `/health` now uses `TypeOrmHealthIndicator`: 200 `{status:"ok",db:"up"}`, 503 `{status:"error",db:"down"}` within about 3 s when MySQL is stopped; it recovers on its own when MySQL returns.
- Tables use `utf8mb4` / `utf8mb4_unicode_ci` (set server-wide in `docker-compose.yml`).

## Commands

Run from the repo root (inside the container: `docker compose exec api <command>`):

```bash
npm run migration:generate -w apps/api -- src/migrations/<Name>   # diff entities vs. database
npm run migration:run -w apps/api
npm run migration:revert -w apps/api                              # reverts the last migration
```

`migration:generate` exits with "No changes in database schema were found" when entities and database match.
To create an empty migration: `npx typeorm-ts-node-commonjs migration:create src/migrations/<Name>` from `apps/api`.

## Rules

- Never edit a migration after it has been merged; add a new one.
- No new environment variables: the existing `DB_*` are used.
