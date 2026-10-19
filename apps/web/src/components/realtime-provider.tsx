import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { TOKEN_KEY } from '../api/client';
import type { CommentAddedPayload } from '../api/realtime';
import { useAuth } from '../auth/use-auth';
import { RealtimeContext } from './realtime-context';
import type { ConnectionStatus, RealtimeContextValue, RealtimeEvents } from './realtime-context';
import { useToast } from './use-toast';

type Handler = (payload: never) => void;

// The id of the ticket whose page is open (/tickets/5, /tickets/5/edit, /tickets/5/print), or null.
function openTicketId(pathname: string): number | null {
  const match = /^\/tickets\/(\d+)(\/|$)/.exec(pathname);
  return match ? Number(match[1]) : null;
}

// Both pieces of state remember which user they belong to, so a logout (or another login)
// starts from a clean state without resetting state inside an effect.
interface Owned<T> {
  userId: number | null;
  value: T;
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const toast = useToast();
  const { pathname } = useLocation();
  const userId = user?.id ?? null;

  const [statusState, setStatusState] = useState<Owned<ConnectionStatus>>({
    userId: null,
    value: 'connecting',
  });
  const [unreadState, setUnreadState] = useState<Owned<Record<number, number>>>({
    userId: null,
    value: {},
  });
  const listeners = useRef(new Map<keyof RealtimeEvents, Set<Handler>>());
  const viewing = useRef<number | null>(null);

  const status = statusState.userId === userId ? statusState.value : 'connecting';
  const unread = unreadState.userId === userId ? unreadState.value : {};

  const subscribe = useCallback<RealtimeContextValue['subscribe']>((event, handler) => {
    const set = listeners.current.get(event) ?? new Set<Handler>();
    set.add(handler as Handler);
    listeners.current.set(event, set);
    return () => {
      set.delete(handler as Handler);
    };
  }, []);

  // Opening a ticket marks its comments as read, and comments arriving meanwhile are not counted.
  useEffect(() => {
    const ticketId = openTicketId(pathname);
    viewing.current = ticketId;
    if (ticketId === null) return;
    setUnreadState((current) => {
      if (!current.value[ticketId]) return current;
      const rest = { ...current.value };
      delete rest[ticketId];
      return { userId: current.userId, value: rest };
    });
  }, [pathname]);

  useEffect(() => {
    if (userId === null) return;

    const setStatus = (value: ConnectionStatus) => setStatusState({ userId, value });
    const emit = <E extends keyof RealtimeEvents>(event: E, payload: RealtimeEvents[E]) => {
      listeners.current
        .get(event)
        ?.forEach((handler) => (handler as (p: typeof payload) => void)(payload));
    };

    // `auth` is a function so every reconnect sends the current token.
    const socket = io(import.meta.env.VITE_API_URL, {
      auth: (send) => send({ token: localStorage.getItem(TOKEN_KEY) }),
      transports: ['websocket'],
    });
    let connectedBefore = false;

    // A lost connection never throws into the UI: the status changes and Socket.IO retries.
    const retrying = () => setStatus(socket.active ? 'reconnecting' : 'offline');
    socket.on('connect', () => {
      setStatus('online');
      if (connectedBefore) emit('reconnected', undefined);
      connectedBefore = true;
    });
    socket.on('disconnect', (reason) => {
      if (reason !== 'io client disconnect') retrying();
    });
    socket.on('connect_error', retrying);
    socket.io.on('reconnect_attempt', () => setStatus('reconnecting'));

    socket.on('comment.added', (payload: CommentAddedPayload) => {
      emit('comment.added', payload);
      const { ticketId, comment } = payload;
      // No toast or badge for my own comments, or for the ticket I am looking at.
      if (comment.author.id === userId || viewing.current === ticketId) return;
      setUnreadState((current) => {
        const counts = current.userId === userId ? current.value : {};
        return { userId, value: { ...counts, [ticketId]: (counts[ticketId] ?? 0) + 1 } };
      });
      toast.info(`New comment on ticket #${ticketId}`, {
        to: `/tickets/${ticketId}`,
        label: 'Open',
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, toast]);

  const unreadTotal = useMemo(
    () => Object.values(unread).reduce((sum, count) => sum + count, 0),
    [unread],
  );
  const value = useMemo<RealtimeContextValue>(
    () => ({ status, unreadTotal, subscribe }),
    [status, unreadTotal, subscribe],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}
