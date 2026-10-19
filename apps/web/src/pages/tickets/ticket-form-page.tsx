import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { TICKET_PRIORITIES, createTicket, getTicket, updateTicket } from '../../api/tickets';
import type { Ticket, TicketPriority, TicketUpdate } from '../../api/tickets';
import { ErrorState, LoadingState } from '../../components/state-views';
import { useToast } from '../../components/use-toast';
import {
  errorMessage,
  parseTags,
  validateDescription,
  validateTags,
  validateTitle,
} from './validation';

interface FieldErrors {
  title?: string;
  description?: string;
  tags?: string;
}

// Serves both /tickets/new and /tickets/:id/edit.
export function TicketFormPage() {
  const { id } = useParams();
  const isEdit = id !== undefined;
  const navigate = useNavigate();
  const toast = useToast();

  const [original, setOriginal] = useState<Ticket | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [tags, setTags] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (id === undefined) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    getTicket(id)
      .then((ticket) => {
        if (cancelled) return;
        setOriginal(ticket);
        setTitle(ticket.title);
        setDescription(ticket.description);
        setPriority(ticket.priority);
        setTags(ticket.tags.join(', '));
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

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next: FieldErrors = {
      title: validateTitle(title),
      description: validateDescription(description),
      tags: validateTags(tags),
    };
    setErrors(next);
    setFormError(null);
    if (next.title || next.description || next.tags) return;

    const values = {
      title: title.trim(),
      description: description.trim(),
      priority,
      tags: parseTags(tags),
    };
    setSubmitting(true);
    try {
      if (id !== undefined && original) {
        const changes: TicketUpdate = {};
        if (values.title !== original.title) changes.title = values.title;
        if (values.description !== original.description) changes.description = values.description;
        if (values.priority !== original.priority) changes.priority = values.priority;
        if (values.tags.join(',') !== original.tags.join(',')) changes.tags = values.tags;
        if (Object.keys(changes).length > 0) await updateTicket(id, changes);
        toast.success(Object.keys(changes).length > 0 ? 'Ticket updated' : 'No changes to save');
        navigate(`/tickets/${id}`);
      } else {
        const created = await createTicket(values);
        toast.success('Ticket created');
        navigate(`/tickets/${created.id}`);
      }
    } catch (caught) {
      const message = errorMessage(caught);
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState prefix="ticket-form" />;
  if (loadError) {
    return loadError.status === 404 ? (
      <section>
        <h1 data-testid="ticket-form-not-found">Ticket not found</h1>
        <Link to="/tickets" data-testid="ticket-form-back">
          Back to tickets
        </Link>
      </section>
    ) : (
      <ErrorState
        prefix="ticket-form"
        message={loadError.message}
        onRetry={() => setReloadKey((k) => k + 1)}
      />
    );
  }

  return (
    <section>
      <h1 data-testid="ticket-form-title-heading">
        {isEdit ? `Edit ticket #${id}` : 'New ticket'}
      </h1>
      <form className="form form-wide" onSubmit={onSubmit} noValidate data-testid="ticket-form">
        {formError && (
          <p className="form-error" role="alert" data-testid="ticket-form-error">
            {formError}
          </p>
        )}
        <label>
          Title
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            data-testid="ticket-form-title"
          />
        </label>
        {errors.title && (
          <p className="field-error" data-testid="ticket-form-title-error">
            {errors.title}
          </p>
        )}
        <label>
          Description
          <textarea
            rows={6}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            data-testid="ticket-form-description"
          />
        </label>
        {errors.description && (
          <p className="field-error" data-testid="ticket-form-description-error">
            {errors.description}
          </p>
        )}
        <label>
          Priority
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as TicketPriority)}
            data-testid="ticket-form-priority"
          >
            {TICKET_PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tags (comma-separated)
          <input
            type="text"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            data-testid="ticket-form-tags"
          />
        </label>
        {errors.tags && (
          <p className="field-error" data-testid="ticket-form-tags-error">
            {errors.tags}
          </p>
        )}
        <div className="form-actions">
          <button type="submit" disabled={submitting} data-testid="ticket-form-submit">
            {submitting ? 'Please wait...' : isEdit ? 'Save changes' : 'Create ticket'}
          </button>
          <Link
            to={isEdit ? `/tickets/${id}` : '/tickets'}
            className="button secondary"
            data-testid="ticket-form-cancel"
          >
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
