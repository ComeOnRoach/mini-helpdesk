# Real-time UI (T5.2)

The web side of the T5.1 gateway: live comments, toasts, an unread badge and a connection indicator. Web only (new package `socket.io-client`); no API change.

## Connection lifecycle

- `RealtimeProvider` (`components/realtime-provider.tsx`) sits inside `ToastProvider`, below `AuthProvider` and the router (`main.tsx`).
- When a user is logged in it opens `io(VITE_API_URL, { transports: ['websocket'] })`. `auth` is a function that reads the token from `localStorage` (`token`) at every (re)connect, so a reconnect never uses a stale token. Only the websocket transport is used, so the frames are easy to follow in Playwright (`page.on('websocket')`).
- Logout (the user becomes `null`), a different login and unmount close the socket (`socket.disconnect()`); the next login opens a new one.

## Connection indicator

`nav-connection` in the header (only when logged in) with `data-status`:

| Status         | Meaning                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------- |
| `connecting`   | first connection in progress                                                                   |
| `online`       | connected                                                                                      |
| `reconnecting` | the connection dropped or failed, Socket.IO retries                                            |
| `offline`      | the server refused the handshake (`Unauthorized`) or closed the socket for good; no retry loop |

A lost connection never throws into the UI: only the indicator changes, and REST calls, forms and navigation keep working.

## Toast and unread badge

- A `comment.added` event from someone else shows the toast **New comment on ticket #N** with an **Open** link (`toast-link`) to `/tickets/N`. The toast API got `toast.info(message, link?)` (type `info`, blue).
- `nav-unread-badge` inside the Tickets link shows the number of unread comments (`99+` above 99); it is hidden at 0.
- Not counted and no toast: my own comments, and comments on the ticket whose page is open (`/tickets/N`, `/edit`, `/print`).
- Opening a ticket resets its count: an effect on the route clears the count of the ticket in the URL, so the details page needs no extra code.
- The count lives in memory only: a page reload resets it. It is cleared when the user changes.

## Live comments on the ticket page

`TicketDetailsPage` listens with `useRealtimeEvent('comment.added', ...)` and reloads the current page of comments when the event is for this ticket. The author is not filtered, so a comment written in the same user's other tab appears too, and pagination shows the new total. A local `reconnected` event (fired after every connect except the first) also reloads the comments, so anything that arrived while the socket was down shows up after reconnecting. The hook `useRealtimeEvent` (`components/use-realtime.ts`) always calls the latest handler.

Subscribing to `ticket:<id>` is not needed here: the owner (`user:<id>`) and agents (`agents`) already receive `comment.added`.

## Test ids

`nav-connection` (with `data-status`), `nav-unread-badge`, `toast` (existing, now also `data-toast-type="info"`), `toast-message`, `toast-link`.

## Code

`components/realtime-provider.tsx`, `realtime-context.ts`, `use-realtime.ts`, `api/realtime.ts` (payload type), `toast-context.ts` / `toast-provider.tsx` (`info`), `layout.tsx` (badge, indicator), `ticket-details-page.tsx`, `styles.css`.

## Not covered

- `ticket.created` / `ticket.updated` are received by the gateway but have no UI yet.
- Browser notifications are T5.3.
- The unread count is not kept across reloads.

## Verification done

API on port 3100, web dev server on 5174, two browser contexts and extra pages through playwright-cli. 19 checks passed:

- Indicator `online` after login; exactly one `/socket.io/` websocket; no badge at the start.
- An agent comment while the user sits on `/tickets`: the toast with the right text and link appears and the badge goes 1, then 2. The user's own comment does not change the badge.
- The toast link opens the ticket and the badge disappears. A new comment on the open page appears without a reload (a marker on `window` survives), with no toast and no badge.
- The same user's comment from another tab appears in both tabs; with more than 10 comments the pagination appears.
- Logout closes the websocket and removes the indicator; the next login opens a new socket.
- Socket dropped on purpose (`page.routeWebSocket`, reconnects blocked): indicator `reconnecting`, text typed in the comment form stays, a comment sent meanwhile is missing, and it appears after reconnect while the indicator returns to `online`.
- API stopped and restarted: `reconnecting`, in-app navigation works, then `online` again and a new comment arrives live.
- The socket's token made invalid, then the connection dropped: one reconnect attempt, indicator `offline`, no retry loop, UI still alive.
- Test tickets were deleted afterwards.
