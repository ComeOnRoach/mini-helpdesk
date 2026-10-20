# Stats endpoint and dashboard (T7.5)

## API

`GET /api/stats` (JWT required, documented in Swagger under `stats`).

```json
{
  "total": 10,
  "open": 4,
  "in_progress": 3,
  "closed": 3,
  "byPriority": { "low": 3, "medium": 5, "high": 2 }
}
```

- An `agent` gets the numbers for all tickets, a `user` only for tickets they created.
- Missing groups are returned as `0`; `total` is the sum of all groups, so without filters it equals `total` of `GET /api/tickets`.
- One `GROUP BY status, priority` query in `apps/api/src/stats/stats.service.ts`. No migration (both columns were already indexed).
- No token: `401` in the standard error format.

## Web: `/dashboard`

- Protected route, nav link `nav-dashboard`.
- Loads on every visit, on the Refresh button (`dashboard-refresh`) and when the websocket reconnects. There is no dedicated websocket event for ticket changes.
- States: `dashboard-loading`, `dashboard-error` (+ `dashboard-error-message`, `dashboard-retry`), `dashboard-empty` (no tickets, with link `dashboard-create-ticket`).
- Cards: `stat-total`, `stat-open`, `stat-in-progress`, `stat-closed`, `stat-priority-low|medium|high`. Each card has `data-value="<n>"` and its number in `<id>-value` (for example `stat-open-value`). CSS bars `stat-bar-<name>` also carry `data-value`; width is the share of `total`. No chart library.

## Playwright idea

```ts
await page.route('**/stats', (route) =>
  route.fulfill({
    json: {
      total: 3,
      open: 1,
      in_progress: 1,
      closed: 1,
      byPriority: { low: 1, medium: 1, high: 1 },
    },
  }),
);
await expect(page.getByTestId('stat-open')).toHaveAttribute('data-value', '1');
```

## Verification

Passed: `npm run lint`, API `tsc -p tsconfig.build.json`, web `tsc -b` and `vite build`; Prettier on the new files.

Against the real API and dev database (API on 3115, web on 5185):

- No token gives `401` in the unified error format (`Missing bearer token`, `/api/stats`).
- As `user` (9 tickets) and `agent` (14 tickets) the response has the documented shape; the agent total equals `GET /api/tickets?limit=1` total, and every per-status and per-priority count equals the list total with `?status=` / `?priority=`. The user's numbers (9) exclude other users' tickets.
- Swagger `/docs-json` contains `StatsResponseDto`.
- UI as user and as agent: card values and `data-value` equal the API numbers.
- Created a ticket as user: after Refresh total +1, open +1, high +1. Closed it as agent: after revisiting the page open -1, closed +1. The test ticket was deleted afterwards.
- Screenshots checked: light desktop, dark desktop, dark 375px mobile.
- With the API mocked via `page.route('**/stats')`: loading, empty (all zeros), error and Retry states, bar width (40% for 4 of 10).

Not covered: a real all-zero account (zero-fill is checked by code and the mocked empty state only), and the realtime `reconnected` refetch.
