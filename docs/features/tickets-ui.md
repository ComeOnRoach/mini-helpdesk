# Tickets UI (T3.4)

Web screens for working with tickets. Code: `apps/web/src/pages/tickets/`, shared widgets in `apps/web/src/components/`, API clients in `apps/web/src/api/tickets.ts` and `comments.ts`.

## Routes (all behind `ProtectedRoute`)

| Route | Screen |
| --- | --- |
| `/tickets` | List with filters, search and pagination |
| `/tickets/new` | Create form |
| `/tickets/:id` | Details, comments, add-comment form, Edit / Delete |
| `/tickets/:id/edit` | Edit form (same component as create) |

## List

- Filters: `status`, `priority`, `tag`, search `q`. Text inputs update the URL after 300 ms.
- Filters and page live in the query string, e.g. `?status=open&page=2`. Changing a filter resets the page. Reload keeps the state.
- States: `tickets-loading`, `tickets-empty`, `tickets-error` (with Retry).
- Rows: `data-testid="ticket-row"` plus `data-ticket-id`.

## Forms

Client validation mirrors the API: title 3–120, description 1–5000, up to 10 tags of 1–30 characters (comma-separated, lowercased and de-duplicated). Edit sends only changed fields. API messages are shown in the form and as an error toast.

## Details and roles

- Status select (`ticket-details-status-select`) is shown to agents only; users see plain text.
- Delete: agents always; users only while the ticket is `open` (API rule). Confirmation is a modal (`confirm-modal*`).
- A ticket that is missing or belongs to another user shows a "Ticket not found" state (the API returns 404).
- Comments are loaded from `GET /api/tickets/:id/comments` (10 per page, oldest first); a new comment moves to the last page.

## Toasts

`useToast()` gives `success(msg)` / `error(msg)`. Toast: `data-testid="toast"`, `data-toast-type="success|error"`, auto-dismiss after 4 s.

## Known limits

- No assignee editing: the API has no endpoint to list agents.
- The create-form draft in `sessionStorage` (`ticketDraft`) belongs to T3.5.
