# Tickets CRUD (T3.2)

All routes need a Bearer token. Errors use the unified format from T2.3.

## Endpoints

| Method | Path               | Success                                   | Errors                                |
| ------ | ------------------ | ----------------------------------------- | ------------------------------------- |
| POST   | `/api/tickets`     | 201 ticket                                | 400, 401                              |
| GET    | `/api/tickets/:id` | 200 ticket with `comments`, `attachments` | 400 (bad id), 401, 404                |
| PATCH  | `/api/tickets/:id` | 200 updated ticket                        | 400, 401, 403 (status/assignee), 404  |
| DELETE | `/api/tickets/:id` | 204 no body                               | 400, 401, 403 (author, not open), 404 |

The list endpoint is described in `tickets-list.md`.

## Create

| Field         | Rules                                                                               |
| ------------- | ----------------------------------------------------------------------------------- |
| `title`       | required, trimmed, 3 to 120 characters                                              |
| `description` | required, trimmed, 1 to 5000 characters                                             |
| `priority`    | optional `low` / `medium` / `high`, default `medium`                                |
| `tags`        | optional, up to 10 tags of 1 to 30 characters; stored trimmed, lowercase and unique |

The server sets `status = open`, `createdById` = the caller and `assigneeId = null`. Sending `status` or
`assigneeId` when creating is rejected with 400 (unknown property).

## Read one

Returns the ticket plus `comments` and `attachments`, both oldest first. Comments contain
`id, ticketId, authorId, body, createdAt`. Attachments contain `id, filename, mime, size, createdAt`; the
server-side file path is never returned.

## Update

Send any of `title`, `description`, `priority`, `tags` (same rules as create), and, for agents only, `status`
and `assigneeId`. At least one field is required. Order of checks: the ticket exists and is visible (404), a user
sending `status` or `assigneeId` (403), an empty body (400), then the assignee check.

- `assigneeId` must be the id of an agent, or `null` to unassign; anything else is 400.
- Any status can be set to any other (no workflow rules yet).
- `updatedAt` changes on every update.

## Delete

An agent can delete any ticket. The author can delete only while the status is `open`; otherwise 403.
Comments and attachment rows are removed by the database (`ON DELETE CASCADE`).
Attachment files on disk do not exist yet; the attachments task (T4.x) must remove them too.

## Permissions

| Action                                  | `user`                  | `agent` |
| --------------------------------------- | ----------------------- | ------- |
| Create                                  | yes                     | yes     |
| Read                                    | own tickets             | all     |
| Edit title, description, priority, tags | own tickets             | all     |
| Change `status`, `assigneeId`           | no (403)                | yes     |
| Delete                                  | own ticket while `open` | all     |

A user who asks for a ticket created by someone else gets **404**, the same answer as for a missing ticket,
so other tickets' ids are not revealed.

## Verification done

A script ran 47 checks against the running API with both seeded accounts and compared the database with SQL:
creation and tag normalization, every validation error, reading with comments and attachments, 404 for foreign
and missing tickets, 403 for status/assignee changes by a user (nothing changed in the database), assignee rules,
delete rules and cascade. Test data was removed afterwards; the seed state (12 tickets, 8 comments) was unchanged.
