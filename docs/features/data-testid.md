# data-testid conventions (T3.6)

Stable locators for future Playwright tests.

## Convention

- `kebab-case`, `<page>-<element>`: `login-email`, `tickets-filter-status`, `ticket-form-submit`.
- List rows: `ticket-row` + `data-ticket-id`; comments: `comment-item` + `data-comment-id`.
- Unique per page, except list rows. Do not rename existing ids.
- Components shared between pages take a prefix: `LoadingState`/`EmptyState`/`ErrorState` (`<prefix>-loading|empty|error|retry`), `Pagination` (`<prefix>-pagination|page-prev|page-next|page-info`).

## Enforcement

`eslint.config.mjs` applies `no-restricted-syntax` to `apps/web/src/**/*.tsx`: `button`, `input`, `select`, `textarea`, `form`, `Link` and `NavLink` without a `data-testid` attribute are lint errors. Dynamic ids such as ``data-testid={`${mode}-email`}`` satisfy the rule. Uniqueness cannot be linted statically; it is covered by the PR checklist (`.github/pull_request_template.md`).

## Audit result (T3.6)

All main pages (`/login`, `/register`, `/tickets`, `/tickets/new`, `/tickets/:id`, `/tickets/:id/edit`, `/help`, `/contacts`, `/`, delete modal, toasts) were checked in a browser: no interactive element without a testid, no duplicates outside list rows, all ids are kebab-case.
