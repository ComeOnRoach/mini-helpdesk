# Repository setup (T0.1)

## What it is

Monorepo base shared by all later tasks: npm workspaces, ESLint and Prettier with one root config.

## Layout

- `apps/api` — NestJS (workspace `@helpdesk/api`, placeholder until T0.3)
- `apps/web` — React + Vite (workspace `@helpdesk/web`, placeholder until T0.4)

## Root scripts

| Script           | Command                                   | Purpose                                                                                      |
| ---------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| `npm run lint`   | `eslint .`                                | ESLint 9 flat config (`eslint.config.mjs`) with typescript-eslint and eslint-config-prettier |
| `npm run format` | `prettier --write .`                      | Prettier (`.prettierrc`)                                                                     |
| `npm run build`  | `npm run build --workspaces --if-present` | Builds every workspace                                                                       |

## Conventions

- `.editorconfig` and `.gitattributes`: UTF-8, LF, 2 spaces.
- `.gitignore` excludes `node_modules`, `dist`, `.env*` (except `.env.example`), `uploads/`, `coverage`.
- Branches: `main` plus `feat/T<number>-<name>`; commits like `feat(T0.1): ...`.
