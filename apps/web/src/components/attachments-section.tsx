import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  ALLOWED_EXTENSIONS,
  deleteAttachment,
  downloadAttachment,
  uploadAttachment,
} from '../api/attachments';
import type { Attachment } from '../api/attachments';
import { saveBlob } from '../lib/save-blob';
import { errorMessage, validateFile } from '../pages/tickets/validation';
import { ConfirmModal } from './confirm-modal';
import { EmptyState } from './state-views';
import { useToast } from './use-toast';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AttachmentsSectionProps {
  ticketId: number;
  initial: Attachment[];
}

export function AttachmentsSection({ ticketId, initial }: AttachmentsSectionProps) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState(initial);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [toDelete, setToDelete] = useState<Attachment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  async function onUpload(event: FormEvent) {
    event.preventDefault();
    const problem = file ? validateFile(file) : 'Choose a file first';
    setFileError(problem);
    if (problem || !file) return;
    setUploading(true);
    try {
      const created = await uploadAttachment(ticketId, file);
      setItems((current) => [...current, created]);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      toast.success('File attached');
    } catch (caught) {
      const message = errorMessage(caught);
      setFileError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }

  async function onDownload(item: Attachment) {
    setDownloadingId(item.id);
    try {
      const blob = await downloadAttachment(item.id);
      // The file needs the token, so it is fetched as a blob and saved from the browser.
      saveBlob(blob, item.filename);
    } catch (caught) {
      toast.error(errorMessage(caught));
    } finally {
      setDownloadingId(null);
    }
  }

  async function onDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteAttachment(ticketId, toDelete.id);
      setItems((current) => current.filter((item) => item.id !== toDelete.id));
      toast.success('Attachment deleted');
    } catch (caught) {
      toast.error(errorMessage(caught));
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  }

  return (
    <div data-testid="attachments">
      <h2>Attachments</h2>
      {items.length === 0 ? (
        <EmptyState prefix="attachments" message="No attachments yet." />
      ) : (
        <ul className="attachments" data-testid="attachments-list">
          {items.map((item) => (
            <li key={item.id} data-testid="attachment-item" data-attachment-id={item.id}>
              <span data-testid="attachment-name">{item.filename}</span>{' '}
              <span className="attachment-meta">
                <span data-testid="attachment-size">{formatSize(item.size)}</span>,{' '}
                <span data-testid="attachment-mime">{item.mime}</span>
              </span>
              <button
                type="button"
                className="secondary attachment-download"
                disabled={downloadingId === item.id}
                onClick={() => onDownload(item)}
                data-testid="attachment-download"
              >
                {downloadingId === item.id ? 'Downloading...' : 'Download'}
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => setToDelete(item)}
                data-testid="attachment-delete"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="form form-wide" onSubmit={onUpload} noValidate data-testid="attachment-form">
        <label>
          Attach a file ({ALLOWED_EXTENSIONS.join(', ')}; up to 5 MB)
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_EXTENSIONS.join(',')}
            disabled={uploading}
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setFileError(undefined);
            }}
            data-testid="attachment-input"
          />
        </label>
        {fileError && (
          <p className="field-error" role="alert" data-testid="attachment-error">
            {fileError}
          </p>
        )}
        <button type="submit" disabled={uploading} data-testid="attachment-submit">
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>

      {toDelete && (
        <ConfirmModal
          title="Delete attachment?"
          message={`File "${toDelete.filename}" will be permanently deleted.`}
          confirmLabel="Delete"
          busy={deleting}
          onConfirm={onDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
