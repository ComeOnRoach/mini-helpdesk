# Seed script (T1.3)

## What it is

`npm run seed -w apps/api` fills the database with fixed, deterministic data for manual checks and future tests.
There is no `Math.random` and no clock: dates are offsets from a fixed base date (2026-01-05 09:00 UTC).

## What is seeded

| Data     | Count | Notes                                                                                                                         |
| -------- | ----- | ----------------------------------------------------------------------------------------------------------------------------- |
| Users    | 2     | `user@example.com` (role `user`, password `User123!`), `agent@example.com` (role `agent`, password `Agent123!`)               |
| Tickets  | 12    | 5 `open`, 4 `in_progress`, 3 `closed`; 4 of each priority; tags `bug`, `feature`, `billing`, `ui`, `docs` (0 to 3 per ticket) |
| Comments | 8     | On 5 tickets, authors alternate between the user and the agent                                                                |

Open tickets are unassigned; `in_progress` and `closed` tickets are assigned to the agent.
One ticket has Cyrillic text and an emoji (checks `utf8mb4`); one has a 120-character title (the limit).
Passwords are stored as `bcrypt` hashes (cost 10). The credentials are for development only.

## Running

```bash
npm run seed -w apps/api                         # on the host (Node 20+, DB reachable)
docker compose exec api npm run seed -w apps/api  # inside the running stack
```

The seed runs pending migrations first, so it also works on an empty database.
It refuses to run when `NODE_ENV=production`, because the accounts have known passwords.

## Idempotency

The seed inserts only what is missing, matched by a natural key: user email, ticket title, comment (ticket + body).
A second run creates nothing and never overwrites rows that were edited or added since.
To return the database to the exact original state, the test API (T7.3, `/test/reset`) will truncate the tables and call the seed again;
an empty database always gets the same ids and timestamps.

## Code (`apps/api/src/seed`)

- `seed.data.ts` — the fixed data.
- `seed.service.ts` — `SeedService.run()` returns how many users, tickets and comments it created. Reused by T7.3.
- `seed.module.ts` — exports `SeedService`.
- `run-seed.ts` — the CLI entry point.

Logging in with both accounts becomes possible after T2.1.
