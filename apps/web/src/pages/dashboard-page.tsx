import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStats } from '../api/stats';
import type { Stats } from '../api/stats';
import { EmptyState, ErrorState, LoadingState } from '../components/state-views';
import { useRealtimeEvent } from '../components/use-realtime';
import { errorMessage } from './tickets/validation';

interface Counter {
  key: string;
  label: string;
  value: number;
}

function CounterGroup({
  title,
  name,
  counters,
  total,
}: {
  title: string;
  name: string;
  counters: Counter[];
  total: number;
}) {
  return (
    <section className="dashboard-group" data-testid={`dashboard-${name}`}>
      <h2>{title}</h2>
      <div className="dashboard-cards">
        {counters.map((counter) => (
          <div
            key={counter.key}
            className="stat-card"
            data-testid={`stat-${counter.key}`}
            data-value={counter.value}
          >
            <span className="stat-label">{counter.label}</span>
            <strong className="stat-value" data-testid={`stat-${counter.key}-value`}>
              {counter.value}
            </strong>
            <div className="stat-track">
              <div
                className="stat-bar"
                data-testid={`stat-bar-${counter.key}`}
                data-value={counter.value}
                style={{ width: total > 0 ? `${(counter.value / total) * 100}%` : '0%' }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // Reload what may have changed while the socket was down.
  useRealtimeEvent('reconnected', () => setReloadKey((key) => key + 1));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getStats()
      .then((result) => {
        if (!cancelled) setStats(result);
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
  }, [reloadKey]);

  return (
    <section data-testid="dashboard-page">
      <div className="dashboard-head">
        <h1>Dashboard</h1>
        <button
          type="button"
          onClick={() => setReloadKey((key) => key + 1)}
          disabled={loading}
          data-testid="dashboard-refresh"
        >
          Refresh
        </button>
      </div>

      {loading && <LoadingState prefix="dashboard" />}
      {!loading && error && (
        <ErrorState
          prefix="dashboard"
          message={error}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      )}
      {!loading && !error && stats && stats.total === 0 && (
        <>
          <EmptyState prefix="dashboard" message="No tickets yet." />
          <Link to="/tickets/new" data-testid="dashboard-create-ticket">
            Create a ticket
          </Link>
        </>
      )}
      {!loading && !error && stats && stats.total > 0 && (
        <div data-testid="dashboard-content">
          <div className="stat-card stat-total" data-testid="stat-total" data-value={stats.total}>
            <span className="stat-label">Total</span>
            <strong className="stat-value" data-testid="stat-total-value">
              {stats.total}
            </strong>
          </div>
          <CounterGroup
            title="By status"
            name="status"
            total={stats.total}
            counters={[
              { key: 'open', label: 'Open', value: stats.open },
              { key: 'in-progress', label: 'In progress', value: stats.in_progress },
              { key: 'closed', label: 'Closed', value: stats.closed },
            ]}
          />
          <CounterGroup
            title="By priority"
            name="priority"
            total={stats.total}
            counters={[
              { key: 'priority-low', label: 'Low', value: stats.byPriority.low },
              { key: 'priority-medium', label: 'Medium', value: stats.byPriority.medium },
              { key: 'priority-high', label: 'High', value: stats.byPriority.high },
            ]}
          />
        </div>
      )}
    </section>
  );
}
