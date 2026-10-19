import { TICKET_PRIORITIES } from '../../api/tickets';
import type { TicketPriority } from '../../api/tickets';

// Create-form draft, kept per tab in sessionStorage.
export const DRAFT_KEY = 'ticketDraft';

export interface TicketDraft {
  title: string;
  description: string;
  priority: TicketPriority;
  tags: string;
}

export const EMPTY_DRAFT: TicketDraft = {
  title: '',
  description: '',
  priority: 'medium',
  tags: '',
};

export function isEmptyDraft(draft: TicketDraft): boolean {
  return (
    draft.title === EMPTY_DRAFT.title &&
    draft.description === EMPTY_DRAFT.description &&
    draft.priority === EMPTY_DRAFT.priority &&
    draft.tags === EMPTY_DRAFT.tags
  );
}

function isDraft(value: unknown): value is TicketDraft {
  if (typeof value !== 'object' || value === null) return false;
  const draft = value as Record<string, unknown>;
  return (
    typeof draft.title === 'string' &&
    typeof draft.description === 'string' &&
    typeof draft.tags === 'string' &&
    typeof draft.priority === 'string' &&
    (TICKET_PRIORITIES as string[]).includes(draft.priority)
  );
}

// Storage can be blocked or hold garbage; a draft problem must never break the form.
export function loadDraft(): TicketDraft | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return isDraft(parsed) && !isEmptyDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveDraft(draft: TicketDraft): void {
  try {
    if (isEmptyDraft(draft)) window.sessionStorage.removeItem(DRAFT_KEY);
    else window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // ignore
  }
}

export function clearDraft(): void {
  try {
    window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}
