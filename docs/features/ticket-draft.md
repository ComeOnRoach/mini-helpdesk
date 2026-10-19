# Ticket form draft (T3.5)

The create-ticket form (`/tickets/new`) keeps unfinished input in `sessionStorage` under the key `ticketDraft`, so a page reload does not lose it. `sessionStorage` is per tab: a new tab starts with an empty form.

Code: `apps/web/src/pages/tickets/ticket-draft.ts` (storage helpers) and `ticket-form-page.tsx`.

## Behaviour

- **Autosave:** 500 ms after the last change. Stored value: `{ "title", "description", "priority", "tags" }` (tags as the raw comma-separated text). If every field is at its default, the key is removed instead.
- **Restore:** on opening the create form a valid draft fills the fields and `Draft restored` is shown (`data-testid="ticket-form-draft-restored"`).
- **Clear draft:** button `ticket-form-draft-clear` removes the key and resets the fields and the indicator.
- **After a successful create** the key is removed and no further autosave happens.
- **Edit form** (`/tickets/:id/edit`) never reads or writes the draft.
- **Robustness:** blocked storage, invalid JSON, or a value with wrong types is ignored; the form simply starts empty.
