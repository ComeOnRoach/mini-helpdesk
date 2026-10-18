# Frontend authentication (T2.4)

## Pages and flow

- `/login` and `/register` share `auth/auth-form.tsx`. Client checks (email format, password length) show inline
  errors under the fields; errors from the API (wrong password, duplicate email) show in a form-level alert.
- Register creates the account, then logs in and opens `/tickets`. Login opens `/tickets`.
- A logged-in visitor opening `/login` or `/register` is sent to `/tickets`.
- `/tickets` is wrapped in `ProtectedRoute`: no token goes to `/login`. With a stored token the app calls
  `GET /api/auth/me` first; if the token is invalid or expired it is removed and the visitor is sent to `/login`.
- The navigation bar shows Login/Register to guests and the user's email with a Logout button to logged-in users.

## Token

Stored in `localStorage` under the key `token`. `apiFetch` adds `Authorization: Bearer <token>`. A 401 clears the token
and redirects to `/login`, except for the login and register calls themselves, where 401 means wrong credentials and
is shown on the form.

## Code

| File                           | Role                                            |
| ------------------------------ | ----------------------------------------------- |
| `auth/auth-context.ts`         | Context type                                    |
| `auth/auth-provider.tsx`       | State, login, register, logout, session restore |
| `auth/use-auth.ts`             | `useAuth()` hook                                |
| `auth/protected-route.tsx`     | Route guard                                     |
| `auth/validation.ts`           | Client-side rules matching the API              |
| `api/auth.ts`, `api/client.ts` | Requests and the shared fetch wrapper           |

## data-testid

`login-title`, `login-form`, `login-email`, `login-password`, `login-submit`, `login-error`, `login-email-error`,
`login-password-error`, `login-switch`; the same set with the `register-` prefix; `nav-user`, `nav-logout`,
`auth-loading`. Forms use `noValidate` so the app's own error messages appear instead of the browser's.

## Verification done (browser)

Anonymous `/tickets` redirects to `/login`; a wrong password shows the error without leaving the page and sets no
token; successful login stores `token` and survives a reload; logout removes it; a garbage token is cleared and
redirects; register shows a duplicate-email error and a short-password error, and a new account is signed in.
