# Swagger API documentation (T9.1)

Interactive docs: `http://localhost:3000/docs` (JSON: `/docs-json`). Built in `apps/api/src/main.ts`.

## What is documented

- Every controller has `@ApiTags`, `@ApiOperation` and `@ApiResponse` for success and the typical errors (400/401/403/404, plus 409, 413, 415, 500 where they apply).
- All error responses use the shared `ErrorResponseDto` (`apps/api/src/common/error-response.dto.ts`), the T2.3 format `{ statusCode, error, message, path, timestamp }`.
- DTOs have `@ApiProperty` / `@ApiPropertyOptional` with description, enum and `example`. `ExportTicketsQueryDto` inherits the list filters through `OmitType`, so its query parameters are documented too.
- Attachment upload uses `@ApiConsumes('multipart/form-data')` and `@ApiBody` with a `file` binary field.
- Endpoints in the docs: auth, tickets (incl. CSV export), comments, attachments (upload, delete, download), stats, analytics, csp-report, health, and the Test API.

## Authorization

- Press **Authorize**, paste the `accessToken` from `POST /api/auth/login` (no `Bearer ` prefix). `persistAuthorization` keeps it after a page reload.
- Seeded accounts: `user@example.com` / `User123!`, `agent@example.com` / `Agent123!`.

## Test API

- Documented under the `test` tag with the `x-test-key` header; the **Authorize** dialog has a second scheme `test-key` for it.
- The Test API module is registered only when `NODE_ENV=test` or `ENABLE_TEST_API=true` (never in production). When it is off, `/api/test/*` and the `test-key` scheme are absent from `/docs` and `/docs-json`, and the routes answer 404.

## How it was verified

- Lint and API build on Node 20 (Docker).
- `/docs-json` lists all public endpoints; production run (`NODE_ENV=production`, `ENABLE_TEST_API=true`) has no `/api/test/*`, no `test-key`, and `POST /api/test/reset` is 404.
- In Swagger UI: login via the login operation, Authorize with the token, then create, read, update (status) and delete a ticket (201, 200, 200, 204).
