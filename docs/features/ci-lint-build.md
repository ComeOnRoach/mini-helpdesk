# CI: install, lint, build (T8.1)

Workflow: `.github/workflows/ci.yml`. Badge: top of `README.md`.

## Triggers

- `push` to `main`
- every `pull_request`

A `concurrency` group (`ci-<workflow>-<ref>`) cancels stale runs of the same ref when a newer commit is pushed.

## Jobs

One job definition `build` with a matrix over the workspace (`api`, `web`). The two jobs run in parallel and show as `api` and `web` in the checks list. `fail-fast` is off so a failure in one does not hide the other.

Steps in each job:

1. `actions/checkout@v4`
2. `actions/setup-node@v4` with Node 20 and `cache: npm` (keyed on `package-lock.json`)
3. `npm ci`
4. `npm run lint` (root ESLint over the whole repo)
5. `npm run build -w apps/<workspace>`

A failing lint or build step fails the job and therefore the pipeline.

## Notes

- Node 20 is required: the API build (Nest CLI) fails on Node 22.14.
- The first run fills the npm cache; later runs restore it, so `npm ci` is faster.
- Planned extensions of the same file: MySQL service and health check in the api job (T8.2), a docker build job (T8.3), a commented e2e job (T8.4).
