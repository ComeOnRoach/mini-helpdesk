import { TicketStatus, UserRole } from '../common/enums';
import { Ticket } from './ticket.entity';
import { User } from '../users/user.entity';

// Role rule for tickets: an agent sees all tickets, a user only their own.
// The ticket endpoints call this before returning or changing a ticket.
export function canAccessTicket(
  user: Pick<User, 'id' | 'role'>,
  ticket: Pick<Ticket, 'createdById'>,
): boolean {
  return user.role === UserRole.Agent || ticket.createdById === user.id;
}

// An agent may delete any ticket; the author only while it is still open.
export function canDeleteTicket(
  user: Pick<User, 'id' | 'role'>,
  ticket: Pick<Ticket, 'createdById' | 'status'>,
): boolean {
  return (
    user.role === UserRole.Agent ||
    (ticket.createdById === user.id && ticket.status === TicketStatus.Open)
  );
}
