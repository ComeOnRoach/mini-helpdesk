# Ticket comments (T3.3)

All routes need a Bearer token. Errors use the unified format from T2.3.

## Endpoints

| Method | Path                        | Success                             | Errors                    |
| ------ | --------------------------- | ----------------------------------- | ------------------------- |
| POST   | `/api/tickets/:id/comments` | 201 full comment                    | 400, 401, 404             |
| GET    | `/api/tickets/:id/comments` | 200 `{ items, total, page, limit }` | 400 (id, query), 401, 404 |

## Create

| Field  | Rules                                   |
| ------ | --------------------------------------- |
| `body` | required, trimmed, 1 to 2000 characters |

An empty or whitespace-only body is 400 (`body must not be empty`); unknown properties are 400.
The author is always the caller. The response is the full comment:

```json
{
  "id": 10,
  "ticketId": 1,
  "body": "hi",
  "author": { "id": 2, "email": "agent@example.com", "role": "agent" },
  "createdAt": "2026-10-19T09:56:59.557Z"
}
```

Only `id`, `email` and `role` of the author are returned, never the password hash.
Comments are not blocked by ticket status.

## List

Oldest first (`createdAt ASC`, `id ASC` as tiebreaker). `page` defaults to 1, `limit` to 10, maximum 50
(same rules as the tickets list). `total` counts all comments of the ticket.

## Permissions

| Action        | `user`      | `agent` |
| ------------- | ----------- | ------- |
| Read comments | own tickets | all     |
| Add a comment | own tickets | all     |

A user who asks for a ticket created by someone else gets **404**, the same answer as for a missing ticket,
so ticket ids are not revealed. The check is `TicketsService.findVisibleOrFail()`.

## Event for WebSocket (T5.1)

After a comment is saved, `CommentsService` emits `comment.added` through `@nestjs/event-emitter`
(`EventEmitterModule.forRoot()` in `AppModule`). The gateway in T5.1 can listen with `@OnEvent('comment.added')`.

```ts
interface CommentAddedEvent {
  comment: CommentResponseDto; // the same object the API returns
  ticketId: number;
  ticketCreatedById: number; // for routing: room `ticket:<id>` and `agents`, never other users
}
```

The constant `COMMENT_ADDED` and the type live in `apps/api/src/comments/events/comment-added.event.ts`.

## Not changed

The `comments` array inside `GET /api/tickets/:id` still has `authorId` only (no author object).

## Verification done

Checked against a locally built API with the seed accounts: agent GET and POST on ticket 1 (200, 201 with
author), whitespace body (400), unknown field (400), no token (401), non-numeric id (400), `limit=51` (400),
missing ticket (404), `user` GET and POST on another user's ticket 12 (404). `npm run lint` and
`npm run build` pass. The POST check left one extra comment (id 10) on ticket 1 in the dev database.
