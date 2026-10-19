# Export tickets to CSV (T4.3)

`GET /api/tickets/export` returns the tickets that match the filters as a CSV file. It needs a Bearer token and uses the unified error format.

## Endpoint

| Method | Path                  | Success | Errors   |
| ------ | --------------------- | ------- | -------- |
| GET    | `/api/tickets/export` | 200     | 400, 401 |

Query parameters are the list filters: `status`, `priority`, `tag`, `q` and `sort` (same rules and defaults as `GET /api/tickets`, see `tickets-list.md`). `page` and `limit` are **not** accepted (400): the export always contains every matching ticket, not one page. The route is declared before `/api/tickets/:id`, so `export` is not read as a ticket id.

## File

- Name: `tickets-YYYY-MM-DD.csv` (UTC date), sent as `Content-Disposition: attachment`.
- `Content-Type: text/csv; charset=utf-8`, `X-Content-Type-Options: nosniff`.
- UTF-8 **with BOM** (`EF BB BF`), so Excel shows Cyrillic and other non-ASCII text correctly. Lines end with CRLF.
- Columns: `id,title,status,priority,tags,createdBy,createdAt`.

| Column      | Value                                            |
| ----------- | ------------------------------------------------ |
| `tags`      | tags joined with `;` (`ui;bug`)                  |
| `createdBy` | e-mail of the creator                            |
| `createdAt` | ISO 8601, for example `2026-01-15T09:00:00.000Z` |

No tickets match: the file contains only the header row.

## Escaping

- A field with a comma, a double quote, a CR or an LF is wrapped in double quotes, and quotes inside it are doubled (`"He said ""hi"", ok"`). Line breaks inside a field stay inside the quotes.
- **Formula protection:** a text field that starts with `=`, `+`, `-`, `@`, a tab or a CR gets a leading `'`, so Excel and similar programs do not run ticket titles or tags as formulas (CSV injection). The cell shows `'=1+1` instead of calculating it.

## Permissions

Same rule as the list: a `user` exports only their own tickets, an agent all tickets. The filters never widen a user's scope. The number of rows always equals `total` of `GET /api/tickets` for the same filters.

## Web UI

Tickets page: the **Export CSV** button (`tickets-export`) next to "New ticket". It sends the current filters from the URL (`status`, `priority`, `tag`, `q`), but not the page, so a filtered list on page 2 still exports all its pages. While it runs the button shows "Exporting..."; success and failure show toasts.

The browser cannot attach the token to a plain link, so the file is fetched as a blob and saved with the name from `Content-Disposition`. For that the API now exposes the header through CORS (`exposedHeaders: ['Content-Disposition']`). The shared helper `lib/save-blob.ts` is also used by the attachment download.

## Code

- API: `TicketsController.export`, `TicketsService.exportCsv` (shares `filteredQuery()` with `list`), `common/csv.ts`, `dto/export-tickets-query.dto.ts`, `common/content-disposition.ts` (moved from `attachments/`).
- Web: `exportTickets()` in `api/tickets.ts`, `apiFetchBlob` returns `{ blob, filename }`, button in `pages/tickets/tickets-page.tsx`.

## Not changed

No migration, no new environment variables. The whole file is built in memory, which is fine for this app's size; a very large ticket table would need streaming.

## Verification done

Fresh API build on port 3100 and the browser (playwright-cli):

- As `user` and as `agent`, for no filter, `status`, `priority`, `tag`, `q`, combined filters, an empty result and `sort=title:asc`: the CSV row count equals `total` of the list endpoint every time. An empty result has only the header.
- Headers: `text/csv; charset=utf-8`, file name with today's date, `Access-Control-Expose-Headers: Content-Disposition`. The body starts with the bytes `EF BB BF`.
- Escaping round trip with Python `csv`: a title with a comma and quotes, a title and a description with line breaks, a tag with a comma, a Cyrillic title and tag, and titles starting with `=`, `@` and a tag starting with `-` (all come back as written, formula ones with the leading `'`).
- `page=1`, `limit=5`, an invalid `status` and an invalid `sort` give 400; no token gives 401; `GET /api/tickets/1` still works.
- Browser: with `?status=open`, with `?priority=high&q=refund` and with no filter (14 tickets over two pages) the download's `suggestedFilename()` is `tickets-2026-10-19.csv` and the saved file has 9, 1 and 14 rows, matching the filtered total. With the export request forced to fail, the error toast appears and the button is enabled again. The attachment download still returns an identical file after the shared-code change.
- Not run: Excel itself (not available here); the BOM and the escaping were checked at byte level.
