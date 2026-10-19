import { apiFetch } from './client';

export type TicketStatus = 'open' | 'in_progress' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';

export const TICKET_STATUSES: TicketStatus[] = ['open', 'in_progress', 'closed'];
export const TICKET_PRIORITIES: TicketPriority[] = ['low', 'medium', 'high'];

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  tags: string[];
  createdById: number;
  assigneeId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface TicketListQuery {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  tag?: string;
  q?: string;
}

export interface TicketInput {
  title: string;
  description: string;
  priority: TicketPriority;
  tags: string[];
}

export type TicketUpdate = Partial<TicketInput> & { status?: TicketStatus };

export const PAGE_LIMIT = 10;

function toQueryString(query: TicketListQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

export const listTickets = (query: TicketListQuery) =>
  apiFetch<Paginated<Ticket>>(`/api/tickets${toQueryString({ limit: PAGE_LIMIT, ...query })}`);

export const getTicket = (id: number | string) => apiFetch<Ticket>(`/api/tickets/${id}`);

export const createTicket = (input: TicketInput) =>
  apiFetch<Ticket>('/api/tickets', { method: 'POST', body: JSON.stringify(input) });

export const updateTicket = (id: number | string, changes: TicketUpdate) =>
  apiFetch<Ticket>(`/api/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(changes) });

export const deleteTicket = (id: number | string) =>
  apiFetch<void>(`/api/tickets/${id}`, { method: 'DELETE' });
