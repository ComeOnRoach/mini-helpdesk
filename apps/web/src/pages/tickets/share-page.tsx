import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { getTicket } from '../../api/tickets';
import type { TicketDetails } from '../../api/tickets';
import { ErrorState, LoadingState } from '../../components/state-views';
import { errorMessage } from './validation';

// Pop-up opened from the ticket page with window.open('/share/:id', 'share', ...). It is routed
// outside Layout (no header or navigation) and shows the link to the ticket page.
export function SharePage() {
  const { id = '' } = useParams();
  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const linkRef = useRef<HTMLInputElement>(null);

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

  if (loading) {
    return (
      <main className="share-page">
        <LoadingState prefix="share" />
      </main>
    );
  }
  if (loadError) {
    return (
      <main className="share-page">
        {loadError.status === 404 ? (
          <>
            <h1 data-testid="share-not-found">Ticket not found</h1>
            <button type="button" onClick={() => window.close()} data-testid="share-close">
              Close
            </button>
          </>
        ) : (
          <ErrorState
            prefix="share"
            message={loadError.message}
            onRetry={() => setReloadKey((k) => k + 1)}
          />
        )}
      </main>
    );
  }
  if (!ticket) return null;

  const link = `${window.location.origin}/tickets/${ticket.id}`;

  async function onCopy() {
    setCopied(false);
    setCopyFailed(false);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      // Clipboard needs a secure context and permission; fall back to selecting the text.
      setCopyFailed(true);
      linkRef.current?.select();
    }
  }

  return (
    <main className="share-page">
      <section data-testid="share-page" data-ticket-id={ticket.id}>
        <p className="print-kicker">Share ticket #{ticket.id}</p>
        <h1 data-testid="share-title">{ticket.title}</h1>
        <label htmlFor="share-link">Link</label>
        <input
          id="share-link"
          ref={linkRef}
          type="text"
          readOnly
          value={link}
          data-testid="share-link"
        />
        <div className="form-actions">
          <button type="button" onClick={onCopy} data-testid="share-copy">
            Copy link
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => window.close()}
            data-testid="share-close"
          >
            Close
          </button>
        </div>
        {copied && (
          <p className="share-copied" role="status" data-testid="share-copied">
            Copied
          </p>
        )}
        {copyFailed && (
          <p className="form-error" role="alert" data-testid="share-copy-error">
            Could not copy automatically. The link is selected; press Ctrl+C.
          </p>
        )}
      </section>
    </main>
  );
}
