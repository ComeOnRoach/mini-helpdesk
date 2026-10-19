# Register, login and JWT (T2.1)

## Endpoints

| Method | Path                 | Body                                   | Success                     | Errors                            |
| ------ | -------------------- | -------------------------------------- | --------------------------- | --------------------------------- |
| POST   | `/api/auth/register` | `{ email, password }`                  | 201 user (no token)         | 400 validation, 409 duplicate     |
| POST   | `/api/auth/login`    | `{ email, password }`                  | 200 `{ accessToken, user }` | 400, 401 wrong email or password  |
| GET    | `/api/auth/me`       | header `Authorization: Bearer <token>` | 200 user                    | 401 missing/invalid/expired token |

The user object is `{ id, email, role, createdAt }`. The password and the hash are never returned
(`User.passwordHash` is `select: false`; login loads it explicitly in `UsersService`).

## Rules

- New users always get role `user`. Email is trimmed and lowercased.
- Passwords: 8 to 72 characters (bcrypt reads only 72 bytes), hashed with bcrypt, cost 10.
- Unknown email and wrong password return the same 401 message; an unknown email still runs a bcrypt compare so response times are alike.
- Duplicate email is checked first; the unique index is the final guard against two simultaneous registrations (both map to 409).
- Token payload: `{ sub: userId, role }`, signed with `JWT_SECRET`, lifetime `JWT_EXPIRES_IN` (default `1h`).

## Notes

- `GET /auth/me` is protected by the global guard from T2.2 (`docs/features/jwt-and-role-guards.md`).
- Validation and the error format: `docs/features/validation-error-format.md`.
- The `@nestjs/swagger` Nest CLI plugin was removed from `nest-cli.json`: with TypeScript 6 it generated wrong
  metadata (`number` as `BigInt`) and crashed on startup. All DTOs use explicit `@ApiProperty`.
