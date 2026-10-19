import { createContext } from 'react';
import type { CommentAddedPayload } from '../api/realtime';

export type ConnectionStatus = 'connecting' | 'online' | 'reconnecting' | 'offline';

// `reconnected` is local: it fires after every connect except the first, so pages can reload
// what they may have missed while the socket was down.
export interface RealtimeEvents {
  'comment.added': CommentAddedPayload;
  reconnected: undefined;
}

export interface RealtimeContextValue {
  status: ConnectionStatus;
  // Comments by other users on tickets that were not open when they arrived.
  unreadTotal: number;
  subscribe: <E extends keyof RealtimeEvents>(
    event: E,
    handler: (payload: RealtimeEvents[E]) => void,
  ) => () => void;
}

export const RealtimeContext = createContext<RealtimeContextValue | null>(null);
