export type AnalyticsEvent = 'login' | 'ticket_create' | 'ticket_open' | 'search' | 'export';

// Fire-and-forget: an analytics failure must never break the UI, so nothing here throws,
// is awaited, shows an error or touches the session (no apiFetch, no 401 redirect).
export function track(event: AnalyticsEvent): void {
  try {
    if (import.meta.env.VITE_ANALYTICS_ENABLED !== 'true') return;
    fetch(`${import.meta.env.VITE_API_URL}/api/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, page: window.location.pathname, ts: Date.now() }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // ignore
  }
}
