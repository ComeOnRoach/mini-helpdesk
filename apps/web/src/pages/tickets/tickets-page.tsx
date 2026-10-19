import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PAGE_LIMIT, TICKET_PRIORITIES, TICKET_STATUSES, listTickets } from '../../api/tickets';
import type { Paginated, Ticket } from '../../api/tickets';
import { Pagination } from '../../components/pagination';
import { EmptyState, ErrorState, LoadingState } from '../../components/state-views';
import { errorMessage } from './validation';

const SEARCH_DEBOUNCE_MS = 300;

export function TicketsPage() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const priority = params.get('priority') ?? '';
  const tag = params.get('tag') ?? '';
  const q = params.get('q') ?? '';
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1);

  // Text inputs keep local state so typing is instant; the URL is updated after a pause.
  const [tagInput, setTagInput] = useState(tag);
  const [searchInput, setSearchInput] = useState(q);
  const [data, setData] = useState<Paginated<Ticket> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const updateParams = useCallback(
    (changes: Record<string, string>, resetPage = true) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(changes)) {
            if (value === '') next.delete(key);
            else next.set(key, value);
          }
          if (resetPage) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  useEffect(() => {
    setTagInput(tag);
  }, [tag]);
  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  useEffect(() => {
    if (tagInput.trim() === tag && searchInput.trim() === q) return;
    const timer = window.setTimeout(
      () => updateParams({ tag: tagInput.trim(), q: searchInput.trim() }),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [tagInput, searchInput, tag, q, updateParams]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listTickets({ page, status, priority, tag, q })
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(errorMessage(caught));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, status, priority, tag, q, reloadKey]);

  const onSelect = (key: 'status' | 'priority') => (event: ChangeEvent<HTMLSelectElement>) =>
    updateParams({ [key]: event.target.value });

  const hasFilters = status !== '' || priority !== '' || tag !== '' || q !== '';

  return (
    <section>
      <div className="page-header">
        <h1 data-testid="tickets-title">Tickets</h1>
        <Link to="/tickets/new" className="button" data-testid="tickets-new">
          New ticket
        </Link>
      </div>

      <div className="filters" data-testid="tickets-filters">
        <label>
          Search
          <input
            type="search"
            value={searchInput}
            placeholder="Title or description"
            onChange={(event) => setSearchInput(event.target.value)}
            data-testid="tickets-filter-search"
          />
        </label>
        <label>
          Status
          <select value={status} onChange={onSelect('status')} data-testid="tickets-filter-status">
            <option value="">All</option>
            {TICKET_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          Priority
          <select
            value={priority}
            onChange={onSelect('priority')}
            data-testid="tickets-filter-priority"
          >
            <option value="">All</option>
            {TICKET_PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tag
          <input
            type="text"
            value={tagInput}
            maxLength={30}
            onChange={(event) => setTagInput(event.target.value)}
            data-testid="tickets-filter-tag"
          />
        </label>
        {hasFilters && (
          <button
            type="button"
            className="secondary"
            onClick={() => setParams({}, { replace: true })}
            data-testid="tickets-filter-reset"
          >
            Reset
          </button>
        )}
      </div>

      {loading && <LoadingState prefix="tickets" />}
      {!loading && error && (
        <ErrorState prefix="tickets" message={error} onRetry={() => setReloadKey((k) => k + 1)} />
      )}
      {!loading && !error && data && data.items.length === 0 && (
        <>
          <EmptyState
            prefix="tickets"
            message={hasFilters || page > 1 ? 'No tickets match the filters.' : 'No tickets yet.'}
          />
          {page > 1 && data.total > 0 && (
            <button
              type="button"
              className="secondary"
              onClick={() => updateParams({ page: '' }, false)}
              data-testid="tickets-first-page"
            >
              Back to first page
            </button>
          )}
        </>
      )}
      {!loading && !error && data && data.items.length > 0 && (
        <>
          <table className="table" data-testid="tickets-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Tags</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((ticket) => (
                <tr key={ticket.id} data-testid="ticket-row" data-ticket-id={ticket.id}>
                  <td data-testid="ticket-row-id">{ticket.id}</td>
                  <td>
                    <Link to={`/tickets/${ticket.id}`} data-testid="ticket-row-title">
                      {ticket.title}
                    </Link>
                  </td>
                  <td data-testid="ticket-row-status">{ticket.status}</td>
                  <td data-testid="ticket-row-priority">{ticket.priority}</td>
                  <td data-testid="ticket-row-tags">{ticket.tags.join(', ')}</td>
                  <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            prefix="tickets"
            page={data.page}
            limit={data.limit || PAGE_LIMIT}
            total={data.total}
            onChange={(next) =>
              setParams(
                (current) => {
                  const nextParams = new URLSearchParams(current);
                  nextParams.set('page', String(next));
                  return nextParams;
                },
                { replace: false },
              )
            }
          />
        </>
      )}
    </section>
  );
}
