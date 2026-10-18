import { TicketPriority, TicketStatus, UserRole } from '../common/enums';

// Fixed data: no clock and no randomness, so every seeded database looks the same.
// Dev-only credentials; they are documented in the README.
export const SEED_USERS = [
  { email: 'user@example.com', password: 'User123!', role: UserRole.User },
  { email: 'agent@example.com', password: 'Agent123!', role: UserRole.Agent },
] as const;

const USER = SEED_USERS[0].email;
const AGENT = SEED_USERS[1].email;

const BASE_DATE = Date.UTC(2026, 0, 5, 9, 0, 0);
const DAY_MS = 24 * 60 * 60 * 1000;

// Day offset from the base date, 09:00 UTC.
export function seedDate(dayOffset: number): Date {
  return new Date(BASE_DATE + dayOffset * DAY_MS);
}

export interface SeedTicket {
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  tags: string[];
  createdBy: string;
  assignee: string | null;
  day: number;
}

export const SEED_TICKETS: SeedTicket[] = [
  {
    title: 'Cannot log in after password reset',
    description: 'The reset link works, but the new password is rejected on the login page.',
    status: TicketStatus.Open,
    priority: TicketPriority.High,
    tags: ['bug'],
    createdBy: USER,
    assignee: null,
    day: 0,
  },
  {
    title: 'Add dark theme to the dashboard',
    description:
      'It would be easier on the eyes in the evening. A switcher in the header is enough.',
    status: TicketStatus.Open,
    priority: TicketPriority.Low,
    tags: ['feature', 'ui'],
    createdBy: USER,
    assignee: null,
    day: 1,
  },
  {
    title: 'Invoice PDF shows the wrong VAT rate',
    description: 'The March invoice lists 20% VAT instead of 23%. Please correct it and resend.',
    status: TicketStatus.InProgress,
    priority: TicketPriority.High,
    tags: ['billing', 'bug'],
    createdBy: USER,
    assignee: AGENT,
    day: 2,
  },
  {
    title: 'Export to CSV is missing the tags column',
    description: 'The exported file has id, title and status, but no tags.',
    status: TicketStatus.InProgress,
    priority: TicketPriority.Medium,
    tags: ['feature'],
    createdBy: USER,
    assignee: AGENT,
    day: 3,
  },
  {
    title: 'Typo on the pricing page',
    description: 'The word "subscribtion" is misspelled in the second paragraph.',
    status: TicketStatus.Closed,
    priority: TicketPriority.Low,
    tags: ['docs'],
    createdBy: USER,
    assignee: AGENT,
    day: 4,
  },
  {
    title: 'Не відображається аватар у профілі 🙂',
    description:
      'Після завантаження фото аватар залишається порожнім. Кирилиця та емодзі: їжак, ґанок.',
    status: TicketStatus.Open,
    priority: TicketPriority.Medium,
    tags: ['bug', 'ui'],
    createdBy: USER,
    assignee: null,
    day: 5,
  },
  {
    title: 'Slow response when opening a ticket with many comments',
    description: 'Tickets with more than 50 comments take several seconds to open.',
    status: TicketStatus.InProgress,
    priority: TicketPriority.High,
    tags: ['bug'],
    createdBy: AGENT,
    assignee: AGENT,
    day: 6,
  },
  {
    title: 'Update the onboarding guide for new agents',
    description: 'The guide still describes the old assignment flow.',
    status: TicketStatus.Open,
    priority: TicketPriority.Low,
    tags: ['docs'],
    createdBy: AGENT,
    assignee: null,
    day: 7,
  },
  {
    title: 'Notification email arrives twice',
    description: 'Each status change sends two identical emails to the ticket author.',
    status: TicketStatus.Closed,
    priority: TicketPriority.Medium,
    tags: ['bug'],
    createdBy: USER,
    assignee: AGENT,
    day: 8,
  },
  {
    title: 'Refund request for a duplicated charge',
    description: 'I was charged twice on the 2nd. Please refund one of the payments.',
    status: TicketStatus.InProgress,
    priority: TicketPriority.High,
    tags: ['billing'],
    createdBy: USER,
    assignee: AGENT,
    day: 9,
  },
  {
    title: 'Keyboard navigation does not reach the filter bar',
    description:
      'Tab skips the filter inputs on the tickets page, so they cannot be used without a mouse.',
    status: TicketStatus.Open,
    priority: TicketPriority.Medium,
    tags: ['ui', 'bug', 'feature'],
    createdBy: USER,
    assignee: null,
    day: 10,
  },
  {
    title:
      'Request to extend the maximum ticket title length so that long descriptive titles from the support team fit in all views',
    description: 'Titles are cut at 120 characters; this one is exactly 120 characters long.',
    status: TicketStatus.Closed,
    priority: TicketPriority.Low,
    tags: [],
    createdBy: AGENT,
    assignee: AGENT,
    day: 11,
  },
];

export interface SeedComment {
  ticket: string;
  author: string;
  body: string;
  day: number;
}

export const SEED_COMMENTS: SeedComment[] = [
  {
    ticket: SEED_TICKETS[0].title,
    author: USER,
    body: 'Tried two browsers, same result.',
    day: 0,
  },
  {
    ticket: SEED_TICKETS[2].title,
    author: AGENT,
    body: 'Confirmed. The rate is hardcoded in the invoice template.',
    day: 3,
  },
  {
    ticket: SEED_TICKETS[2].title,
    author: USER,
    body: 'Thanks, please send the corrected invoice by email.',
    day: 3,
  },
  {
    ticket: SEED_TICKETS[3].title,
    author: AGENT,
    body: 'Working on it, the tags column will be added to the export.',
    day: 4,
  },
  {
    ticket: SEED_TICKETS[4].title,
    author: AGENT,
    body: 'Fixed and deployed.',
    day: 5,
  },
  {
    ticket: SEED_TICKETS[4].title,
    author: USER,
    body: 'Looks good now, thank you!',
    day: 5,
  },
  {
    ticket: SEED_TICKETS[6].title,
    author: AGENT,
    body: 'Profiling shows the comments are loaded one by one.',
    day: 7,
  },
  {
    ticket: SEED_TICKETS[9].title,
    author: AGENT,
    body: 'Escalated to the billing team.',
    day: 10,
  },
];
