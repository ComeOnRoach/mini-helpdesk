# WebSocket gateway (T5.1)

Real-time notifications over Socket.IO. API only: no REST change, no migration, no new environment variable. The web client comes in T5.2.

## Connection

- Same HTTP server and port as the API, path `/socket.io/` (`ws://localhost:3000/socket.io/?EIO=4&transport=websocket`). Both polling and websocket transports are allowed; a client may force `transports: ['websocket']`.
- CORS origin is `WEB_ORIGIN` (set in `RealtimeIoAdapter`, because gateway decorator options cannot read the env).
- **Authentication** happens in a Socket.IO middleware (`RealtimeGateway.afterInit`), so a bad handshake never becomes a connection. The token is read from `handshake.auth.token`, or from the `Authorization: Bearer` header. It is verified with the same secret as REST, and the user is loaded from the database (so the role is current and a deleted user is refused). Any failure gives `connect_error` with the message `Unauthorized`.
- The global `JwtAuthGuard` skips non-HTTP contexts (a passport strategy cannot read a socket); the handshake is the authentication for sockets.

## Rooms

| Room          | Who is in it                                         |
| ------------- | ---------------------------------------------------- |
| `user:<id>`   | every socket of that user (joined on connect)        |
| `agents`      | every agent socket (joined on connect)               |
| `ticket:<id>` | sockets that sent `ticket.subscribe` for that ticket |

`user:<id>` goes beyond the task text: it lets an owner receive events about their tickets without subscribing to each one (needed for notifications in T5.2).

## Client messages

- `ticket.subscribe` `{ ticketId }` joins `ticket:<ticketId>` after the same access check as REST (`TicketsService.findVisibleOrFail`): a user can subscribe only to their own tickets, an agent to any.
- `ticket.unsubscribe` `{ ticketId }` leaves the room.
- Both answer through the Socket.IO ack: `{ ok: true }` or `{ ok: false, message }`. Messages: `ticketId must be an integer`, `Ticket not found` (also for someone else's ticket, so ids are not revealed). The REST error format does not apply to sockets.

## Server events

| Event            | Rooms                                            | Payload                              |
| ---------------- | ------------------------------------------------ | ------------------------------------ |
| `ticket.created` | `agents`, `user:<createdById>`                   | `{ ticket }`                         |
| `ticket.updated` | `agents`, `user:<createdById>`, `ticket:<id>`    | `{ ticket, changedFields, actorId }` |
| `comment.added`  | `ticket:<id>`, `agents`, `user:<ticket creator>` | `{ ticketId, comment }`              |

- `ticket` has the shape of `TicketResponseDto` (`id, title, description, status, priority, tags, createdById, assigneeId, createdAt, updatedAt`).
- `changedFields` lists the fields the request sent (for example `["status"]`); `actorId` is the user who made the change (so a client can skip its own change).
- `comment` has the shape of `CommentResponseDto` (`id, ticketId, body, author { id, email, role }, createdAt`).
- Delivery uses `server.to([rooms]).emit(...)`, so a socket that is in several of the rooms gets one message. A user's socket is in none of the rooms of someone else's ticket and cannot join `ticket:<id>` of one.
- Events are sent only for successful changes: a rejected request (403, 404, 400) emits nothing.

## How events are produced

Services emit internal events through `EventEmitter2` (`ticket.created` and `ticket.updated` in `TicketsService`, `comment.added` in `CommentsService`), and the gateway listens with `@OnEvent`. Services know nothing about sockets and there is no module cycle. Event types: `tickets/events/ticket-events.ts`, `comments/events/comment-added.event.ts`. Room and message names: `realtime/realtime-events.ts`.

## Code

`apps/api/src/realtime/` (`realtime.module.ts`, `realtime.gateway.ts`, `socket-io.adapter.ts`, `realtime-events.ts`), `tickets/events/ticket-events.ts`, emits in `tickets.service.ts`, `useWebSocketAdapter` in `main.ts`, `AuthModule` exports `JwtModule`. New packages: `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`.

## Not covered

- A token that expires while the socket stays open is not re-checked.
- No `ticket.deleted` event (not in the task).
- Agents all share the `agents` room; there is no routing by assignee.

## Verification done

API on port 3100; Node scripts with `socket.io-client` (kept outside the repo; no automated tests in this project), users `user@example.com`, `agent@example.com` and a temporary second user. 29 checks passed:

- Rejected with `Unauthorized`: no token, garbage token, expired token, token of an unknown user. Accepted: a valid token in `auth`, and in the `Authorization` header over polling.
- `ticket.created`: owner and agent once, the other user nothing.
- `ticket.subscribe`: own ticket ok; someone else's ticket, a missing ticket, a non-integer id and a null body refused; an agent can subscribe to any ticket.
- `comment.added`: a subscribed owner (in three rooms) and an agent each get exactly one message with the right payload; the other user gets nothing; an owner who unsubscribed still gets it through `user:<id>`.
- `ticket.updated`: agent changing `status` and owner changing `title` reach the owner and the agent once, with `changedFields` and `actorId`; the other user gets nothing; a forbidden update (403) emits nothing.
- Playwright (`page.on('websocket')`, client loaded from the server's `/socket.io/socket.io.js`): the frames show the open packet, the auth packet `40{"token":...}`, the connect answer and the pushed `42["ticket.created",{...}]`.
- Test tickets and the extra user were removed afterwards.
