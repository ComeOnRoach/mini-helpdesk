# Ticket attachments: upload, delete, download (T4.1, T4.2)

Files can be attached to a ticket. All calls need a Bearer token and use the unified error format `{ statusCode, error, message, path, timestamp }`.

## Endpoints

| Method | Path                                         | Success | Errors                  |
| ------ | -------------------------------------------- | ------- | ----------------------- |
| POST   | `/api/tickets/:id/attachments`               | 201     | 400, 401, 404, 413, 415 |
| DELETE | `/api/tickets/:id/attachments/:attachmentId` | 204     | 400, 401, 404           |
| GET    | `/api/attachments/:id/download`              | 200     | 400, 401, 404           |

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

## Download

`GET /api/attachments/:id/download` streams the stored file.

- `Content-Type` is the type the file was uploaded with; `Content-Length` is the file size.
- `Content-Disposition: attachment; filename="<ASCII fallback>"; filename*=UTF-8''<encoded original name>`, so the browser saves the file under its original name (Cyrillic, spaces and quotes included). The file is always a download, never shown inline, and `X-Content-Type-Options: nosniff` is set.
- A missing attachment, and an attachment on someone else's ticket, both answer 404 `Attachment not found` (the id is not revealed). If the row exists but the file is gone from the disk: 404 `File not found`.
- The browser cannot send the `Authorization` header with a plain link, so the web app fetches the file as a blob and saves it through a temporary link (`download=<original name>`).

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
| Download a file      | only on their own tickets | any ticket |

Same rule as comments (`TicketsService.findVisibleOrFail()`): someone else's ticket answers 404. An attachment id that does not belong to the ticket in the URL also answers 404.

## Web UI

Ticket details page, section "Attachments":

- list with name, size, MIME type (`attachment-item` + `data-attachment-id`, `attachment-name`, `attachment-size`, `attachment-mime`);
- file input `attachment-input`, button `attachment-submit` (shows "Uploading..." while the request runs; `fetch` gives no byte progress), error text `attachment-error`;
- the same type and size checks run in the browser first, the API answer is shown if the server rejects the file;
- `attachment-download` button next to each item (shows "Downloading..." while it runs; a failure shows an error toast);
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

### T4.2 checks

Fresh build on port 3100 and the browser (playwright-cli):

- png, txt and pdf downloaded with curl: 200, correct `Content-Type`, `Content-Disposition` with the original name, and the bytes are identical (`cmp`).
- Another user's file gives 404 for a `user` and 200 (identical bytes) for an agent; unknown id 404; `abc` 400; no token 401; file removed from the disk 404 `File not found`.
- Browser: clicking Download fires a download event with `suggestedFilename()` equal to the original name (including a name with Cyrillic letters, spaces, brackets and quotes), and the saved file is byte-identical. A missing file shows the error toast and no download.
