# Ticket attachments: upload and delete (T4.1)

Files can be attached to a ticket. All calls need a Bearer token and use the unified error format `{ statusCode, error, message, path, timestamp }`. Download is a separate task (T4.2).

## Endpoints

| Method | Path                                         | Success | Errors                  |
| ------ | -------------------------------------------- | ------- | ----------------------- |
| POST   | `/api/tickets/:id/attachments`               | 201     | 400, 401, 404, 413, 415 |
| DELETE | `/api/tickets/:id/attachments/:attachmentId` | 204     | 400, 401, 404           |

The list of attachments is part of `GET /api/tickets/:id` (`attachments: [{ id, filename, mime, size, createdAt }]`).

## Upload

`multipart/form-data` with exactly one file in the field `file`.

| Rule      | Value                                                                                                                                              | Error                                           |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Size      | up to `MAX_UPLOAD_BYTES` (default 5 MB = 5242880)                                                                                                  | 413 `File too large`                            |
| Type      | `.png`, `.jpg`/`.jpeg`, `.pdf`, `.txt`, `.csv`; the file extension and the sent MIME type must match (CSV also accepts `application/vnd.ms-excel`) | 415 `File type is not allowed. Allowed: ...`    |
| File sent | field `file` is required                                                                                                                           | 400 `File is required (multipart field "file")` |

Response:

```json
{
  "id": 1,
  "ticketId": 3,
  "filename": "screenshot.png",
  "mime": "image/png",
  "size": 20480,
  "createdAt": "2026-01-05T09:00:00.000Z"
}
```

## Storage

- Files are written to `UPLOAD_DIR` (default `<api working dir>/uploads`) under a generated name `<uuid><extension>`. The name sent by the client is never used as a path; it is stored only as `filename` (base name, UTF-8, max 255 characters).
- The `attachments` row keeps `filename`, `path` (generated name), `mime`, `size`. The server path is not returned by the API.
- Docker Compose mounts the named volume `uploads_data` at `/app/uploads` (`UPLOAD_DIR=/app/uploads`), so files survive container restarts and re-creation.
- Deleting an attachment removes the row and the file. Deleting a ticket removes its files too (rows go through `ON DELETE CASCADE`). A file that is already missing is ignored.
- If saving fails after the file was written (for example the ticket is not visible), the file is removed again.

## Permissions

| Action               | `user`                    | `agent`    |
| -------------------- | ------------------------- | ---------- |
| Upload to a ticket   | only their own tickets    | any ticket |
| Delete an attachment | only on their own tickets | any ticket |

Same rule as comments (`TicketsService.findVisibleOrFail()`): someone else's ticket answers 404. An attachment id that does not belong to the ticket in the URL also answers 404.

## Web UI

Ticket details page, section "Attachments":

- list with name, size, MIME type (`attachment-item` + `data-attachment-id`, `attachment-name`, `attachment-size`, `attachment-mime`);
- file input `attachment-input`, button `attachment-submit` (shows "Uploading..." while the request runs; `fetch` gives no byte progress), error text `attachment-error`;
- the same type and size checks run in the browser first, the API answer is shown if the server rejects the file;
- delete uses the confirmation modal; success and failure show toasts.

## Configuration

| Variable           | Default                     | Purpose                   |
| ------------------ | --------------------------- | ------------------------- |
| `UPLOAD_DIR`       | `<api working dir>/uploads` | Folder for uploaded files |
| `MAX_UPLOAD_BYTES` | `5242880`                   | Size limit in bytes       |

## Not changed

No migration (the `attachments` table existed). No seed attachments.

## Verification done

Against a fresh build on port 3100 with the seed accounts, and in the browser with playwright-cli:

- png, txt, csv (Excel MIME), pdf and a Cyrillic file name upload with 201 and appear in the ticket details; a 5.3 MB file gives 413; `.exe`, `.svg` and a `.png` sent as `text/plain` give 415; no file gives 400; no token gives 401.
- A user uploading to ticket 12 (not theirs) gets 404 and no file is left on disk; an agent can upload to it.
- Delete: 204 and the file disappears; deleting the same id again, or with the wrong ticket id, gives 404.
- Deleting a ticket with two attachments removes both files.
- UI: upload, list after reload, client-side messages for forbidden type and large file, server 413 message in the toast (limit lowered to 5 bytes), delete modal cancel and confirm, agent upload and delete.
- Not run: Docker Compose (not available in this environment), so the volume was checked by configuration only. Node 22.14 breaks `nest build` here (an ESM error inside the Nest CLI, also on a clean checkout), so the API was compiled with `tsc -p apps/api/tsconfig.build.json`.
