// Socket.IO message names sent by the client.
export const SUBSCRIBE_TICKET = 'ticket.subscribe';
export const UNSUBSCRIBE_TICKET = 'ticket.unsubscribe';

// Room names. An agent is in AGENTS_ROOM, every socket is in its own user room.
export const AGENTS_ROOM = 'agents';
export const userRoom = (userId: number): string => `user:${userId}`;
export const ticketRoom = (ticketId: number): string => `ticket:${ticketId}`;

// Answer to a subscribe / unsubscribe message.
export type RoomAck = { ok: true } | { ok: false; message: string };
