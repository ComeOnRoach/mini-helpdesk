# React + Vite web (T0.4)

## What it is

The SPA skeleton in `apps/web`: React 19, Vite 8, TypeScript (strict) and React Router, with a shared layout and an API client.

## Routes

| Path        | Page            | `data-testid` of the title |
| ----------- | --------------- | -------------------------- |
| `/`         | Home            | `home-title`               |
| `/login`    | Login (stub)    | `login-title`              |
| `/register` | Register (stub) | `register-title`           |
| `/tickets`  | Tickets (stub)  | `tickets-title`            |
| `/help`     | Help (stub)     | `help-title`               |
| `/contacts` | Contacts (stub) | `contacts-title`           |
| `*`         | Not found       | `not-found-title`          |

All routes render inside `Layout` (header, navigation, container). Navigation links carry `nav-home`, `nav-tickets`, `nav-help`, `nav-contacts`, `nav-login`, `nav-register` and are client-side (no page reload).

## API client

`src/api/client.ts` exports `apiFetch<T>(path, init)`:

- base URL from `VITE_API_URL`
- adds `Authorization: Bearer <token>` when `localStorage['token']` is set
- on `401` it removes the token and redirects to `/login`
- other non-2xx responses throw `ApiError(status, message)`; `204` resolves to `undefined`

It is not used by any page yet.

## Running

```bash
docker compose up                 # web on http://localhost:5173
npm run dev -w apps/web           # without Docker
npm run build -w apps/web         # type-check + production build
```

## Notes

- `VITE_API_URL` (default `http://localhost:3000`) is read at build/dev-server start; see the root `README.md`.
- In Docker on Windows, file watching needs polling: `vite.config.ts` enables it when `CHOKIDAR_USEPOLLING=true` (set in `docker-compose.override.yml`).
- The web workspace pins TypeScript `~5.9.3`; the API workspace uses `~6.0.3`. Avoid TypeScript 7.0 until its compiler API returns.
- The theme, analytics and special-page behaviour come in later tasks.
