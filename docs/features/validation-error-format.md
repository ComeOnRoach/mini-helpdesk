# Validation and unified error format (T2.3)

## Validation

`setupApp()` (`apps/api/src/common/app-setup.ts`) registers a global `ValidationPipe` with `whitelist`,
`forbidNonWhitelisted` and `transform`. Unknown properties are rejected with 400, and DTO values are transformed
(for example email is trimmed and lowercased). Auth rules: email must be a valid address; password 8 to 72 characters.
Messages are written for people, for example `password must be at least 8 characters`.

## Error format

Every error from the API, including unknown routes and unexpected failures, has one shape:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["email must be a valid email address"],
  "path": "/api/auth/login",
  "timestamp": "2026-01-05T09:00:00.000Z"
}
```

`message` is a string, or an array for validation errors. It is documented in Swagger as `ErrorResponseDto`.

| Case              | Status | `message`                          |
| ----------------- | ------ | ---------------------------------- |
| Validation        | 400    | list of rule messages              |
| Malformed JSON    | 400    | parser message                     |
| Missing/bad token | 401    | for example `Missing bearer token` |
| Forbidden         | 403    | message of the exception           |
| Unknown route     | 404    | `Cannot GET /api/nope`             |
| Unexpected error  | 500    | always `Internal server error`     |

## Stack traces

`AllExceptionsFilter` never puts a stack or the original error text into a response, in any environment.
Unexpected errors are logged on the server with the stack.

## Exception: `/health`

When the database is down `/health` returns 503 with its documented `{ "status": "error", "db": "down" }`
(thrown as `HealthUnavailableException`) so monitors and healthchecks keep a stable contract.
