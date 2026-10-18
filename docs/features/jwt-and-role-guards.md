# JWT guard and role guard (T2.2)

## How it works

- `JwtAuthGuard` (Passport `jwt` strategy) and `RolesGuard` are registered globally as `APP_GUARD` in `AuthModule`, in that order.
- `JwtStrategy` reads the Bearer token, checks signature and expiry, then loads the user from the database.
  The role therefore comes from the database, and a deleted user's token stops working immediately.
- `@Public()` skips authentication: `POST /api/auth/register`, `POST /api/auth/login` and `GET /health`.
- `@Roles(UserRole.Agent)` limits a route or controller to the listed roles; without it any logged-in user may call it.
- `@CurrentUser()` injects the authenticated `User` into a handler. `GET /api/auth/me` uses it.

## Responses

| Case                           | Status | message                                             |
| ------------------------------ | ------ | --------------------------------------------------- |
| No `Authorization` header      | 401    | `Missing bearer token`                              |
| Bad, tampered or expired token | 401    | `Invalid or expired token`                          |
| Role not allowed               | 403    | `You do not have permission to perform this action` |

All errors use the unified format from T2.3.

## Ticket rule

`canAccessTicket(user, ticket)` in `apps/api/src/tickets/ticket-access.ts`: an agent may access every ticket,
a user only tickets they created. The ticket endpoints (T3.1, T3.2) will call it; there are no ticket endpoints yet,
so the "user opens someone else's ticket" criterion is checked in those tasks.

## Verification done

Without a token protected routes return 401 while `/health`, register and login stay open; a `user` token on an
agent-only route gets 403 and an `agent` token gets 200 (checked with a temporary route that was removed).
