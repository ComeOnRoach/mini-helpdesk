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

const MAX_COMMENTS_LIMIT = 50;

// Every comment of a ticket (for the print page), fetched in pages of the API maximum.
export async function listAllComments(ticketId: number | string): Promise<TicketComment[]> {
  const all: TicketComment[] = [];
  for (let page = 1; ; page += 1) {
    const result = await apiFetch<Paginated<TicketComment>>(
      `/api/tickets/${ticketId}/comments?page=${page}&limit=${MAX_COMMENTS_LIMIT}`,
    );
    all.push(...result.items);
    if (result.items.length === 0 || all.length >= result.total) return all;
  }
}

export const addComment = (ticketId: number | string, body: string) =>
  apiFetch<TicketComment>(`/api/tickets/${ticketId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
