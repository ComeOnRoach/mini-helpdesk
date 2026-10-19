import { apiFetch } from './client';
import type { UserRole } from './auth';
import type { Paginated } from './tickets';

export interface TicketComment {
  id: number;
  ticketId: number;
  body: string;
  author: { id: number; email: string; role: UserRole };
  createdAt: string;
}

export const COMMENTS_LIMIT = 10;

export const listComments = (ticketId: number | string, page: number) =>
  apiFetch<Paginated<TicketComment>>(
    `/api/tickets/${ticketId}/comments?page=${page}&limit=${COMMENTS_LIMIT}`,
  );

export const addComment = (ticketId: number | string, body: string) =>
  apiFetch<TicketComment>(`/api/tickets/${ticketId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
