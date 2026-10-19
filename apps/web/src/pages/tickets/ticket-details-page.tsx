import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { COMMENTS_LIMIT, addComment, listComments } from '../../api/comments';
import type { TicketComment } from '../../api/comments';
import { TICKET_STATUSES, deleteTicket, getTicket, updateTicket } from '../../api/tickets';
import type { Paginated, Ticket, TicketStatus } from '../../api/tickets';
import { useAuth } from '../../auth/use-auth';
import { ConfirmModal } from '../../components/confirm-modal';
import { Pagination } from '../../components/pagination';
import { EmptyState, ErrorState, LoadingState } from '../../components/state-views';
import { useToast } from '../../components/use-toast';
import { errorMessage, validateCommentBody } from './validation';

export function TicketDetailsPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const isAgent = user?.role === 'agent';

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [statusBusy, setStatusBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [commentPage, setCommentPage] = useState(1);
  const [comments, setComments] = useState<Paginated<TicketComment> | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentsKey, setCommentsKey] = useState(0);
  const [body, setBody] = useState('');
  const [bodyError, setBodyError] = useState<string | undefined>();
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    getTicket(id)
      .then((result) => {
        if (!cancelled) setTicket(result);
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

  useEffect(() => {
    if (!ticket) return;
    let cancelled = false;
    setCommentsLoading(true);
    setCommentsError(null);
    listComments(id, commentPage)
      .then((result) => {
        if (!cancelled) setComments(result);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setCommentsError(errorMessage(caught));
      })
      .finally(() => {
        if (!cancelled) setCommentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // Depend on the ticket id, not the object, so a status change does not reload comments.
  }, [id, commentPage, commentsKey, ticket?.id]);

  const onStatusChange = useCallback(
    async (status: TicketStatus) => {
      setStatusBusy(true);
      try {
        const updated = await updateTicket(id, { status });
        setTicket(updated);
        toast.success(`Status changed to ${status}`);
      } catch (caught) {
        toast.error(errorMessage(caught));
      } finally {
        setStatusBusy(false);
      }
    },
    [id, toast],
  );

  async function onDelete() {
    setDeleting(true);
    try {
      await deleteTicket(id);
      toast.success('Ticket deleted');
      navigate('/tickets', { replace: true });
    } catch (caught) {
      toast.error(errorMessage(caught));
      setConfirmDelete(false);
      setDeleting(false);
    }
  }

  async function onAddComment(event: FormEvent) {
    event.preventDefault();
    const problem = validateCommentBody(body);
    setBodyError(problem);
    if (problem) return;
    setPosting(true);
    try {
      await addComment(id, body.trim());
      setBody('');
      toast.success('Comment added');
      // New comments land on the last page (oldest first).
      const refreshed = await listComments(id, 1);
      const lastPage = Math.max(1, Math.ceil(refreshed.total / COMMENTS_LIMIT));
      setCommentPage(lastPage);
      setCommentsKey((k) => k + 1);
    } catch (caught) {
      toast.error(errorMessage(caught));
    } finally {
      setPosting(false);
    }
  }

  if (loading) return <LoadingState prefix="ticket-details" />;
  if (loadError) {
    return loadError.status === 404 ? (
      <section>
        <h1 data-testid="ticket-details-not-found">Ticket not found</h1>
        <Link to="/tickets" data-testid="ticket-details-back">
          Back to tickets
        </Link>
      </section>
    ) : (
      <ErrorState
        prefix="ticket-details"
        message={loadError.message}
        onRetry={() => setReloadKey((k) => k + 1)}
      />
    );
  }
  if (!ticket) return null;

  // The API lets an author delete only open tickets; agents can delete any.
  const canDelete = isAgent || ticket.status === 'open';

  return (
    <section data-testid="ticket-details" data-ticket-id={ticket.id}>
      <p>
        <Link to="/tickets" data-testid="ticket-details-back">
          ← Back to tickets
        </Link>
      </p>
      <div className="page-header">
        <h1 data-testid="ticket-details-title">{ticket.title}</h1>
        <div className="form-actions">
          <Link
            to={`/tickets/${ticket.id}/edit`}
            className="button"
            data-testid="ticket-details-edit"
          >
            Edit
          </Link>
          {canDelete && (
            <button
              type="button"
              className="danger"
              onClick={() => setConfirmDelete(true)}
              data-testid="ticket-details-delete"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <dl className="details">
        <dt>Status</dt>
        <dd>
          {isAgent ? (
            <select
              value={ticket.status}
              disabled={statusBusy}
              onChange={(event) => onStatusChange(event.target.value as TicketStatus)}
              data-testid="ticket-details-status-select"
            >
              {TICKET_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          ) : (
            <span data-testid="ticket-details-status">{ticket.status}</span>
          )}
        </dd>
        <dt>Priority</dt>
        <dd data-testid="ticket-details-priority">{ticket.priority}</dd>
        <dt>Tags</dt>
        <dd data-testid="ticket-details-tags">{ticket.tags.join(', ') || '—'}</dd>
        <dt>Created</dt>
        <dd>{new Date(ticket.createdAt).toLocaleString()}</dd>
      </dl>
      <p className="description" data-testid="ticket-details-description">
        {ticket.description}
      </p>

      <h2>Comments</h2>
      {commentsLoading && <LoadingState prefix="comments" />}
      {!commentsLoading && commentsError && (
        <ErrorState
          prefix="comments"
          message={commentsError}
          onRetry={() => setCommentsKey((k) => k + 1)}
        />
      )}
      {!commentsLoading && !commentsError && comments && comments.items.length === 0 && (
        <EmptyState prefix="comments" message="No comments yet." />
      )}
      {!commentsLoading && !commentsError && comments && comments.items.length > 0 && (
        <>
          <ul className="comments" data-testid="comments-list">
            {comments.items.map((comment) => (
              <li key={comment.id} data-testid="comment-item" data-comment-id={comment.id}>
                <p className="comment-meta">
                  <span data-testid="comment-author">{comment.author.email}</span>{' '}
                  <time dateTime={comment.createdAt}>
                    {new Date(comment.createdAt).toLocaleString()}
                  </time>
                </p>
                <p data-testid="comment-body">{comment.body}</p>
              </li>
            ))}
          </ul>
          {comments.total > comments.limit && (
            <Pagination
              prefix="comments"
              page={comments.page}
              limit={comments.limit}
              total={comments.total}
              onChange={setCommentPage}
            />
          )}
        </>
      )}

      <form
        className="form form-wide"
        onSubmit={onAddComment}
        noValidate
        data-testid="comment-form"
      >
        <label>
          Add a comment
          <textarea
            rows={3}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            data-testid="comment-form-body"
          />
        </label>
        {bodyError && (
          <p className="field-error" data-testid="comment-form-body-error">
            {bodyError}
          </p>
        )}
        <button type="submit" disabled={posting} data-testid="comment-form-submit">
          {posting ? 'Please wait...' : 'Add comment'}
        </button>
      </form>

      {confirmDelete && (
        <ConfirmModal
          title="Delete ticket?"
          message={`Ticket "${ticket.title}" and its comments will be permanently deleted.`}
          confirmLabel="Delete"
          busy={deleting}
          onConfirm={onDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </section>
  );
}
