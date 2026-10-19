# Ticket print page / Save as PDF (T4.4)

`/tickets/:id/print` is a print-friendly view of one ticket. It is web-only: no API change, no migration, no new environment variables.

## Route

- `/tickets/:id/print`, behind the same login check as the other ticket pages (no token redirects to `/login`).
- It is declared **outside** `Layout` in `app.tsx`, so the header and the navigation are never rendered, not just hidden.
- Same access rule as the ticket itself: a `user` opens only their own tickets, an agent any. A foreign or missing ticket shows the "Ticket not found" state (`ticket-print-not-found`).
- Loading and error states (with Retry) use the shared state components, prefix `ticket-print`.

## Content

Title, then status, priority, tags, created and updated dates, the description (line breaks kept), the attachment list (name, size, MIME type; no buttons) and **all** comments with author and date. Comments are fetched in pages of 50 (`listAllComments` in `api/comments.ts`), so a printout is complete even with more than 10 comments. A footer shows the print time.

## Buttons

- Ticket page: link **Print / Save as PDF** (`ticket-details-print`) opens the print route.
- Print page: a screen-only toolbar with **Print / Save as PDF** (`ticket-print-button`, calls `window.print()`) and a back link (`ticket-print-back`). The page does not print by itself on load, so automated runs stay deterministic.
- Save as PDF: choose "Save as PDF" as the printer in the browser's print dialog.

## Print styles (`@media print` in `styles.css`)

- `@page { size: A4; margin: 15mm }`.
- `.no-print` (the toolbar) and the toast container are hidden. No interactive element is visible in print.
- Black text on a white background, serif 12 pt, no colours or shadows, links not underlined.
- `break-inside: avoid` for comments, attachment rows and the details block; headings do not end a page (`break-after: avoid`); long unbroken words wrap.

## Test ids

`ticket-print` (with `data-ticket-id`), `ticket-print-title`, `-status`, `-priority`, `-tags`, `-created`, `-updated`, `-description`, `ticket-print-attachments` / `ticket-print-attachment` (rows), `ticket-print-comments` / `ticket-print-comment` (rows with `data-comment-id`), `ticket-print-toolbar`, `ticket-print-button`, `ticket-print-back`.

## Code

- Web: `pages/tickets/ticket-print-page.tsx`, route in `app.tsx`, link in `ticket-details-page.tsx`, `listAllComments` in `api/comments.ts`, `formatSize` moved to `lib/format-size.ts` (shared with the attachments section).

## Verification done

API on port 3100 and the web dev server on 5174, browser through playwright-cli, ticket with a multi-line Cyrillic description, 12 comments (one with a 200-character word) and two attachments:

- The link opens `/tickets/24/print`; no `header`/`nav` in the DOM; title, status, priority, tags, description, 2 attachments and 12 comments match the API.
- The button calls `window.print()` once (stubbed).
- With `emulateMedia({ media: 'print' })`: zero visible buttons, inputs or links, toolbar hidden, body black on white. A screenshot shows the A4-width layout.
- `page.pdf({ format: 'A4' })`: 2 pages, size 595 x 842 pt; the text of the title, comments 1 to 12, both attachments and the Cyrillic line is in the PDF.
- Another user's ticket and a missing id show "not found"; without a token the app redirects to `/login`; an agent sees all 12 comments.
- Test ticket deleted afterwards.
- Not run: a real browser print dialog (cannot be driven here).
