# Contacts page: nearest office (T6.3)

`/contacts` lists three offices and finds the one nearest to the visitor with the browser Geolocation API. Web only: no API, no migration, no env variable.

Code: `apps/web/src/pages/contacts-page.tsx`, `contacts/offices.ts` (static list), `contacts/geo.ts` (Haversine).

## Offices (deterministic, hardcoded)

| id       | Name   | Coordinates (lat, lng) |
| -------- | ------ | ---------------------- |
| `lisbon` | Lisbon | 38.7223, -9.1393       |
| `kyiv`   | Kyiv   | 50.4501, 30.5234       |
| `berlin` | Berlin | 52.5200, 13.4050       |

## Behaviour

- The list is always shown. Button `contacts-locate` ("Nearest office") calls `getCurrentPosition` with `timeout: 10000`, `maximumAge: 0`. It is disabled while locating.
- Distance: Haversine, Earth radius 6371 km. The nearest office is the smallest distance; ties go to the first office in list order. The distance is rounded to 1 decimal.
- Success: the row of the nearest office gets `data-nearest="true"` (others `false`) and a green border; the result block shows `Nearest office: Kyiv, 0.2 km`.
- The position is not stored anywhere.

## States and messages

| State                                    | Test id                                      | Message                                                                      |
| ---------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------- |
| loading                                  | `contacts-loading`                           | Loading...                                                                   |
| denied (code 1)                          | `contacts-error`, `data-error-kind="denied"` | Location access was denied. Allow it in your browser settings and try again. |
| unavailable (code 2)                     | `data-error-kind="unavailable"`              | Your location is unavailable. Check your device settings and try again.      |
| timeout (code 3)                         | `data-error-kind="timeout"`                  | Locating took too long. Please try again.                                    |
| unsupported (no `navigator.geolocation`) | `data-error-kind="unsupported"`              | Geolocation is not supported by this browser.                                |

Errors show `contacts-error-message` and a `contacts-retry` button (not for unsupported). There is no empty state because the list is static.

## Test ids

`contacts-title`, `contacts-locate`, `contacts-loading`, `contacts-error`, `contacts-error-message`, `contacts-retry`, `contacts-result`, `contacts-result-office`, `contacts-result-distance`; list rows `contacts-office` with `data-office-id` and `data-nearest`.

## Playwright

```ts
const context = await browser.newContext({
  permissions: ['geolocation'],
  geolocation: { latitude: 50.45, longitude: 30.52 },
});
await page.goto('/contacts');
await page.getByTestId('contacts-locate').click();
await expect(page.locator('[data-testid=contacts-office][data-nearest=true]')).toHaveAttribute(
  'data-office-id',
  'kyiv',
);
await context.setGeolocation({ latitude: 52.5, longitude: 13.4 }); // change position
```

A context without the permission gives the `denied` error. For unavailable, timeout, unsupported and slow responses, stub `navigator.geolocation` with `addInitScript` (to remove it, `delete Navigator.prototype.geolocation`).

## Verified (Playwright, Vite dev server)

- Near Lisbon, Kyiv (twice, identical result) and Berlin: correct office highlighted, distance with one decimal; `setGeolocation` after load changes the result; a point between Berlin and Kyiv gives Berlin, 598.7 km.
- Denied (context without permission), codes 2 and 3 (stub), unsupported: distinct messages and `data-error-kind`, list still shown with three rows, no highlight; retry present except for unsupported.
- Slow stub: `contacts-loading` shown, button disabled, loading removed after the result. No page errors.
- `npm run lint`, `tsc -b`, `vite build` pass.
