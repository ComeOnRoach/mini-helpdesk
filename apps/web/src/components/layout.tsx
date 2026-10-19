import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/use-auth';
import { NotificationControl } from './notification-control';
import { useRealtime } from './use-realtime';

const STATUS_LABELS = {
  connecting: 'Connecting...',
  online: 'Online',
  reconnecting: 'Reconnecting...',
  offline: 'Offline',
} as const;

const commonLinks = [
  { to: '/', label: 'Home', testId: 'nav-home' },
  { to: '/tickets', label: 'Tickets', testId: 'nav-tickets' },
  { to: '/help', label: 'Help', testId: 'nav-help' },
  { to: '/contacts', label: 'Contacts', testId: 'nav-contacts' },
];

const guestLinks = [
  { to: '/login', label: 'Login', testId: 'nav-login' },
  { to: '/register', label: 'Register', testId: 'nav-register' },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { status, unreadTotal } = useRealtime();
  const links = user ? commonLinks : [...commonLinks, ...guestLinks];

  function onLogout() {
    logout();
    navigate('/login');
  }

  return (
    <>
      <header className="header">
        <span className="brand">Mini Helpdesk</span>
        <nav className="nav" aria-label="Main">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end data-testid={link.testId}>
              {link.label}
              {link.testId === 'nav-tickets' && unreadTotal > 0 && (
                <span className="badge" data-testid="nav-unread-badge">
                  {unreadTotal > 99 ? '99+' : unreadTotal}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        {user && (
          <div className="session">
            <NotificationControl />
            <span className="connection" data-status={status} data-testid="nav-connection">
              {STATUS_LABELS[status]}
            </span>
            <span data-testid="nav-user">{user.email}</span>
            <button type="button" onClick={onLogout} data-testid="nav-logout">
              Logout
            </button>
          </div>
        )}
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
