import { useContext, useEffect, useRef } from 'react';
import { RealtimeContext } from './realtime-context';
import type { RealtimeEvents } from './realtime-context';

export function useRealtime() {
  const value = useContext(RealtimeContext);
  if (!value) throw new Error('useRealtime must be used inside RealtimeProvider');
  return value;
}

// Runs `handler` for every event while the component is mounted. The latest handler is used,
// so it may close over state without re-subscribing.
export function useRealtimeEvent<E extends keyof RealtimeEvents>(
  event: E,
  handler: (payload: RealtimeEvents[E]) => void,
): void {
  const { subscribe } = useRealtime();
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });
  useEffect(() => subscribe(event, (payload) => latest.current(payload)), [event, subscribe]);
}
