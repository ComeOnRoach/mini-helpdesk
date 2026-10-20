# Test API: reset, seed, users (T7.3)

Endpoints that put the database into a known state before automated tests. They exist only in test setups.

> **Safety warning.** `POST /api/test/reset` truncates the `users`, `tickets`, `comments` and `attachments` tables and deletes uploaded files. Never enable the Test API against a real or shared database. As a guard, reset refuses to run unless `DB_NAME` contains `test` (for example `helpdesk_test`).

## When it is available

| Condition                                                    | Result                                             |
| ------------------------------------------------------------ | -------------------------------------------------- |
| `NODE_ENV=production`                                        | Never registered, always 404 (even with the flag)  |
| `NODE_ENV=test`, or `ENABLE_TEST_API=true`                   | Registered                                         |
| anything else (default)                                      | Not registered, 404                                |

`AppModule` imports `TestApiModule` only when `isTestApiEnabled()` (`apps/api/src/test-api/test-api.config.ts`) is true. When it is not registered the routes do not exist, so they answer the normal 404 error and are absent from Swagger (`/docs`). When the Test API is on, `TEST_API_KEY` is required (startup fails without it; there is no default).

## Authentication

Send `x-test-key: <TEST_API_KEY>` on every call. A missing or wrong key gives `401`. The comparison is constant-time. No JWT is needed (the routes are `@Public`). Routes live under the global prefix: `/api/test/...`.

## Endpoints

### `POST /api/test/reset` (200)

Truncates `comments`, `attachments`, `tickets`, `users` (foreign key checks off during the truncate, so ids restart at 1), deletes the uploaded files referenced by `attachments`, then runs the deterministic seed (same as `npm run seed`: `user@example.com`, `agent@example.com`, 12 tickets, 8 comments).

Response: `{ "users": 2, "tickets": 12, "comments": 8, "filesRemoved": 0 }`. A database name without `test` gives `400` in the unified error format.

### `POST /api/test/seed` (201)

Body (all optional): `{ "tickets": 5, "status": "open", "priority": "medium", "createdBy": "user@example.com" }`. `tickets` is 1..100 (default 5). Adds tickets titled `Test ticket N` (N continues after the existing ones; dates are fixed, no randomness). The base users must exist, otherwise `409` ("call POST /api/test/reset first"). Response: `{ "created": 5, "ticketIds": [13, 14, 15, 16, 17] }`. Unknown fields or out-of-range values give `400`.

### `POST /api/test/users` (201)

Body: `{ "email": "qa@example.com", "password": "Qa12345!", "role": "agent" }` (`role` defaults to `user`, password 8..72 chars). Creates the user (bcrypt hash). Response: `{ id, email, role, createdAt }`. Existing email gives `409`.

## Examples

```bash
curl -X POST http://localhost:3000/api/test/reset -H "x-test-key: $TEST_API_KEY"
curl -X POST http://localhost:3000/api/test/seed  -H "x-test-key: $TEST_API_KEY" -H "content-type: application/json" -d '{"tickets":5,"status":"open"}'
curl -X POST http://localhost:3000/api/test/users -H "x-test-key: $TEST_API_KEY" -H "content-type: application/json" -d '{"email":"qa@example.com","password":"Qa12345!","role":"agent"}'
```

## Verification done

Run against a throwaway database `mini_helpdesk_test_t73` (dropped afterwards), API on a separate port:

- Test API off (no flag), and `NODE_ENV=production` with `ENABLE_TEST_API=true`: `POST /api/test/reset` gives 404 and Swagger has no `/api/test` paths.
- Test API on without `TEST_API_KEY`: the API does not start. `NODE_ENV=test` alone registers the routes.
- No key and wrong key: 401. Right key: 200.
- Reset twice, with an uploaded attachment between: the file is removed from disk (`filesRemoved: 1`), and the agent's ticket list plus all comments are byte-identical after both resets (ids and dates).
- Seed before reset on an empty DB: 409. Seed `{tickets:5,status:"open"}`: ids 13..17. Invalid body: 400.
- Users: 201 and login works with the new password; duplicate email 409; no hash in the response.
- A database called `mini_helpdesk_t73` (no `test` in the name) is refused by reset with 400.

Not covered: `docker compose` run (the compose file does not pass `ENABLE_TEST_API` / `TEST_API_KEY` to the api service; add them to `environment` to use the Test API in compose).
