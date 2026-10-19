import { apiFetch, apiFetchBlob } from './client';

export interface Attachment {
  id: number;
  filename: string;
  mime: string;
  size: number;
  createdAt: string;
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.pdf', '.txt', '.csv'];

export const uploadAttachment = (ticketId: number | string, file: File) => {
  const body = new FormData();
  body.append('file', file);
  return apiFetch<Attachment>(`/api/tickets/${ticketId}/attachments`, { method: 'POST', body });
};

export const deleteAttachment = (ticketId: number | string, attachmentId: number) =>
  apiFetch<void>(`/api/tickets/${ticketId}/attachments/${attachmentId}`, { method: 'DELETE' });

export const downloadAttachment = async (attachmentId: number) =>
  (await apiFetchBlob(`/api/attachments/${attachmentId}/download`)).blob;
