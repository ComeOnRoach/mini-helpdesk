# Slow / flaky API mode (T7.4)

Instability modes for practising auto-waiting, timeouts and retries. Everything is **off by default** and is switched on only through configuration.

## Configuration

| Variable | Default | Meaning |
| --- | --- | --- |
| `SLOW_API_MS` | `0` | Delay (integer, 0-60000 ms) added to every API response |
| `FLAKY_RATE` | `0` | Probability (0-1) that `GET /api/tickets` fails with a 500 |

Both values are validated at startup in `env.validation.ts`; a bad value (`-1`, `abc`, `60001`, `FLAKY_RATE=2`) stops the API with a clear message. Empty means the default. They are also passed through `docker-compose.yml` and listed in `.env.example` and the README.

## Behaviour

Implemented by one global interceptor, `apps/api/src/common/instability.interceptor.ts`, registered with `APP_INTERCEPTOR` in `AppModule`.

- **Delay:** `SLOW_API_MS` is applied before the handler runs, to every HTTP route except the exempt ones below. WebSocket traffic is untouched.
- **Flaky failures:** only the list request `GET /api/tickets` (any query string). Each request is an independent coin flip using `Math.random()`: `FLAKY_RATE=0` never fails, `1` always fails. **It is random on purpose.** For exactly reproducible runs use `0` or `1`, or write retry-tolerant tests. The random source is one small function, `shouldFail(rate, random)`.
- **Failure shape:** HTTP 500 in the unified format, `{ statusCode: 500, error: "Internal Server Error", message: "Simulated failure (FLAKY_RATE)", path, timestamp }`. Delay and failure combine (the delay is applied first).
- **`x-delay-ms` header:** a one-off delay in ms that *replaces* `SLOW_API_MS` for that request (`0` disables the delay for it). Capped at 10000 ms; non-numeric values are ignored. Honoured only when `NODE_ENV=test` or `ENABLE_TEST_API=true`, and never in production.
- **Exempt routes** (never delayed or failed): `/health`, `/api/analytics/*`, `/api/test/*`. `GET /api/tickets/:id` and `/api/tickets/export` are delayed but never fail.
- **Production:** the header is ignored; if `SLOW_API_MS` or `FLAKY_RATE` is above 0 a warning is logged at startup.

Swagger: `GET /api/tickets` documents the 500 response and the optional `x-delay-ms` header.

## Web

No code change was needed: the tickets page already shows a loading state, then an error state with a Retry button (`tickets-retry`) which refetches the list.

## Playwright hints

```ts
// SLOW_API_MS=2000: loading state is visible while the request is pending
const response = page.waitForResponse((r) => r.url().includes('/api/tickets') && r.request().method() === 'GET');
await expect(page.getByTestId('tickets-loading')).toBeVisible();
await response;
// FLAKY_RATE=1: error state and Retry; FLAKY_RATE between 0 and 1: click Retry until the rows appear
await page.getByTestId('tickets-retry').click();
```

## Verification

### Real API and UI (compiled API on port 3114 against the dev MySQL, web on 5184)

Timings are from `curl`; on this Windows machine every localhost call carries a constant ~0.22 s connect overhead, so compare against the baseline.

- Defaults: `/health`, `GET /api/tickets` (list, with query), `/api/tickets/1`, `/api/tickets/export` all 200 at the baseline; no 500 in 40 list calls.
- `SLOW_API_MS=2000`: list, `:id` and export about 2.23-2.26 s; `/health` and an unauthenticated list (401, rejected by the guard before the interceptor) stay at the baseline; `x-delay-ms` is ignored in development.
- `NODE_ENV=test`, `SLOW_API_MS=500`: delayed routes about 0.73 s; `x-delay-ms: 1500` gives about 1.72 s (replaces, does not add); `x-delay-ms: 0` returns at the baseline; `/health` and 401 are not delayed.
- `FLAKY_RATE=1`: list 40/40 failures with `{statusCode:500,error:"Internal Server Error",message:"Simulated failure (FLAKY_RATE)",path:"/api/tickets",timestamp}`; `:id` 0/20, export and `/health` fine. `FLAKY_RATE=0`: 0/40. `FLAKY_RATE=0.5`: 91/200 list failures (45.5%), `:id` 0/20.
- CORS preflight (`OPTIONS /api/tickets` from `Origin: http://localhost:5184` asking for `authorization,x-delay-ms`): 204 with `Access-Control-Allow-Headers: authorization,x-delay-ms`.
- UI with Playwright (`waitForResponse`): with `SLOW_API_MS=2000` `tickets-loading` is visible while the list request is pending, then the response is 200, the loading state disappears and 10 `ticket-row` appear. With `FLAKY_RATE=1` the page shows `tickets-error` (message "Simulated failure (FLAKY_RATE)") and `tickets-retry`; clicking Retry sends a new request (500) and the error stays. After restarting the API with `FLAKY_RATE=0`, clicking Retry gives 200, the rows render and the error state is gone.
- No test data was created in the database.

### No-database harness (earlier run)

A throwaway Node harness (outside the repo) mounted the compiled real `InstabilityInterceptor`, `validateEnv` and `AllExceptionsFilter` on a minimal Nest app with dummy routes. Results (measured with `fetch`):

- Defaults: all routes answer in a few ms, no errors.
- `SLOW_API_MS=1000`: delayed routes about 1010-1070 ms; `/health`, analytics and test routes about 5 ms.
- `NODE_ENV=test` or `ENABLE_TEST_API=true`: `x-delay-ms: 1500` gives about 1510 ms, `0` gives about 1 ms, `999999` is capped at about 10010 ms, `abc` is ignored. With `NODE_ENV=development` and no flag the header is ignored.
- `NODE_ENV=production` plus `ENABLE_TEST_API=true`: header ignored; startup warning logged.
- `FLAKY_RATE=0`: 0/200 list failures; `1`: 200/200; `0.5`: 104/200. `/api/tickets/:id` 0/50 failures in every case. The 500 body matches the unified format.
- Bad `SLOW_API_MS` (`-1`, `abc`, `60001`) and `FLAKY_RATE` (`2`, `abc`, `-0.1`) abort startup with the expected messages; empty values are accepted.
- `npm run lint`, `tsc -p tsconfig.build.json` (api) and `tsc -b` (web) pass.

Not covered: the production-mode behaviour (header ignored, startup warning) and the startup validation of bad values were checked only in the harness, not on the real API; `ENABLE_TEST_API=true` is not defined by this task (T7.3), so it was exercised only in the harness; the `x-delay-ms` header was not sent from the browser UI (only by `curl` and the preflight check).
