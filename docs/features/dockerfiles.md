# Production Dockerfiles (T8.3)

## What it is

Reproducible production images for the API and the web app, plus `docker-compose.prod.yml` to run
the whole stack from them. `docker compose up` is unchanged and stays the hot-reload dev stack.

## Files

| File                                | Purpose                                                              |
| ----------------------------------- | -------------------------------------------------------------------- |
| `apps/api/Dockerfile`               | NestJS image                                                         |
| `apps/api/Dockerfile.dockerignore`  | Ignore rules for the API build                                       |
| `apps/web/Dockerfile`               | Vite build + nginx image                                             |
| `apps/web/Dockerfile.dockerignore`  | Ignore rules for the web build                                       |
| `apps/web/docker/nginx.conf`        | SPA `try_files`, content types, cache headers                        |
| `apps/web/docker/15-csp.sh`         | Entrypoint hook that renders the CSP header from env                 |
| `docker-compose.prod.yml`           | `db` + `api` + `web` built from the Dockerfiles                      |
| `.github/workflows/ci.yml`          | job `docker`: build both images, size and non-root checks            |

## Build context and .dockerignore

The context is the **repository root** because npm workspaces share one `package-lock.json`
(`npm ci -w apps/<x>` needs the root manifests). One root `.dockerignore` would be shared by both
images, so each image has `<Dockerfile>.dockerignore` next to its Dockerfile; BuildKit picks it up
automatically. Each one excludes `node_modules`, `dist`, `.env*`, `uploads`, `.git`, docs and the
other app (keeping only its `package.json`, which the workspace lockfile needs).

```bash
docker build -f apps/api/Dockerfile -t helpdesk-api .
docker build -f apps/web/Dockerfile --build-arg VITE_API_URL=http://localhost:3000 -t helpdesk-web .
```

## API image

- Stages: `build` (full deps, `nest build`), `deps` (`npm ci --omit=dev`, trimmed), `runtime`.
- Runtime is bare `alpine:3.23` plus the `node` binary copied from `node:20-alpine` (same musl libc),
  without npm/yarn/corepack. This keeps the image around 234 MB (the plain `node:20-alpine` runtime
  was about 380 MB).
- `bcrypt` 6 ships prebuilt musl binaries, so no compiler is needed. Verified with a register and login.
- npm nests some workspace-specific packages (for example `@nestjs/terminus`) in
  `apps/api/node_modules`; the runtime copies both `node_modules` folders.
- Runs as user `node` (uid 1000). `/app/uploads` is owned by `node`; a named volume mounted there
  inherits that ownership.
- Migrations run on start (`migrationsRun: true`), so no separate migration step is needed.

## Web image

- Vite build, then `nginxinc/nginx-unprivileged` (uid 101, port **8080**).
- `VITE_API_URL` and `VITE_ANALYTICS_ENABLED` are build args (baked into the bundle).
- `nginx.conf`: SPA fallback to `index.html`, `robots.txt` as `text/plain`, `sitemap.xml` as `text/xml`
  (same as Vite preview), immutable cache for `/assets/`, `no-cache` for the document.
- CSP: at container start `15-csp.sh` writes `conf.d/csp.inc` from `CSP_ENABLED`, `CSP_REPORT_ONLY` and
  `VITE_API_URL` (runtime default equals the build arg). The policy mirrors the strict `preview`
  policy of the Vite plugin from T7.2 (`script-src 'self'`, `connect-src 'self' <api> <ws api>`,
  `report-uri <api>/api/csp-report`). With `CSP_ENABLED` not `true` no header is sent.

## docker-compose.prod.yml

```bash
docker compose -f docker-compose.prod.yml up --build
```

Standalone file (it does not merge with `docker-compose.yml` or the override). Web is on
`${WEB_PORT:-5173}`, API on `${PORT:-3000}`. `WEB_ORIGIN` must match the web URL for CORS, and
`VITE_API_URL` must be the API address as seen by the browser.

## Verified

- Both images build; API image 234 MB; `id` shows `uid=1000(node)` (api) and `uid=101(nginx)` (web).
- Prod stack: `/health` returns `{"status":"ok","db":"up"}`, register and login work (bcrypt).
- `/tickets/1` returns `index.html` (200); unknown `/assets/*` returns 404.
- `robots.txt` is `text/plain`, `sitemap.xml` is `text/xml`; CSP header present when enabled,
  `Report-Only` variant works, no header when disabled.

## CI job `docker`

`.github/workflows/ci.yml` job `docker` (runs in parallel with `api` and `web`): `docker/setup-buildx-action`,
then `docker/build-push-action` for each image (context `.`, `file: apps/<x>/Dockerfile`, `load: true`, no push,
GitHub Actions layer cache), then a step that fails if the api image is 300 MB or larger or if either image
runs as uid 0 (`docker run --rm --entrypoint id <img> -u`).

## Not covered

- The `docker` job has not been run on GitHub Actions yet (branch is not pushed); the same commands were run locally.
- `robots.txt`, `sitemap.xml` and the CSP-ready `theme-init.js` come from T7.1/T7.2; the strict CSP
  blocks the inline theme script in `index.html` until T7.2 is merged.
