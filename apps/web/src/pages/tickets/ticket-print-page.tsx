import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { listAllComments } from '../../api/comments';
import type { TicketComment } from '../../api/comments';
import { getTicket } from '../../api/tickets';
import type { TicketDetails } from '../../api/tickets';
import { ErrorState, LoadingState } from '../../components/state-views';
import { formatSize } from '../../lib/format-size';
import { errorMessage } from './validation';

interface PrintData {
  ticket: TicketDetails;
  comments: TicketComment[];
}

// Print-friendly ticket view. It is routed outside Layout, so there is no header or navigation;
// the toolbar is screen-only (`no-print`).
export function TicketPrintPage() {
  const { id = '' } = useParams();
  const [data, setData] = useState<PrintData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    Promise.all([getTicket(id), listAllComments(id)])
      .then(([ticket, comments]) => {
        if (!cancelled) setData({ ticket, comments });
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setLoadError(caught instanceof ApiError ? caught : new ApiError(0, errorMessage(caught)));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  if (loading) {
    return (
      <main className="print-page">
        <LoadingState prefix="ticket-print" />
      </main>
    );
  }
  if (loadError) {
    return (
      <main className="print-page">
        {loadError.status === 404 ? (
          <>
            <h1 data-testid="ticket-print-not-found">Ticket not found</h1>
            <Link to="/tickets" data-testid="ticket-print-back">
              Back to tickets
            </Link>
          </>
        ) : (
          <ErrorState
            prefix="ticket-print"
            message={loadError.message}
            onRetry={() => setReloadKey((k) => k + 1)}
          />
        )}
      </main>
    );
  }
  if (!data) return null;

  const { ticket, comments } = data;

  return (
    <main className="print-page">
      <div className="print-toolbar no-print" data-testid="ticket-print-toolbar">
        <Link to={`/tickets/${ticket.id}`} data-testid="ticket-print-back">
          ← Back to ticket
        </Link>
        <button type="button" onClick={() => window.print()} data-testid="ticket-print-button">
          Print / Save as PDF
        </button>
      </div>

      <article data-testid="ticket-print" data-ticket-id={ticket.id}>
        <p className="print-kicker">Mini Helpdesk · Ticket #{ticket.id}</p>
        <h1 data-testid="ticket-print-title">{ticket.title}</h1>

        <dl className="details">
          <dt>Status</dt>
          <dd data-testid="ticket-print-status">{ticket.status}</dd>
          <dt>Priority</dt>
          <dd data-testid="ticket-print-priority">{ticket.priority}</dd>
          <dt>Tags</dt>
          <dd data-testid="ticket-print-tags">{ticket.tags.join(', ') || '—'}</dd>
          <dt>Created</dt>
          <dd data-testid="ticket-print-created">{new Date(ticket.createdAt).toLocaleString()}</dd>
          <dt>Updated</dt>
          <dd data-testid="ticket-print-updated">{new Date(ticket.updatedAt).toLocaleString()}</dd>
        </dl>

        <h2>Description</h2>
        <p className="description" data-testid="ticket-print-description">
          {ticket.description}
        </p>

        <h2>Attachments</h2>
        {ticket.attachments.length === 0 ? (
          <p data-testid="ticket-print-attachments-empty">No attachments.</p>
        ) : (
          <ul className="print-list" data-testid="ticket-print-attachments">
            {ticket.attachments.map((item) => (
              <li key={item.id} data-testid="ticket-print-attachment" data-attachment-id={item.id}>
                {item.filename}{' '}
                <span className="attachment-meta">
                  ({formatSize(item.size)}, {item.mime})
                </span>
              </li>
            ))}
          </ul>
        )}

        <h2>Comments ({comments.length})</h2>
        {comments.length === 0 ? (
          <p data-testid="ticket-print-comments-empty">No comments.</p>
        ) : (
          <ul className="comments print-comments" data-testid="ticket-print-comments">
            {comments.map((comment) => (
              <li key={comment.id} data-testid="ticket-print-comment" data-comment-id={comment.id}>
                <p className="comment-meta">
                  {comment.author.email} · {new Date(comment.createdAt).toLocaleString()}
                </p>
                <p>{comment.body}</p>
              </li>
            ))}
          </ul>
        )}

        <p className="print-footer">Printed {new Date().toLocaleString()}</p>
      </article>
    </main>
  );
}
