import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/use-auth';
import { NotificationControl } from './notification-control';
import { ThemeToggle } from './theme-toggle';
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
  { to: '/dashboard', label: 'Dashboard', testId: 'nav-dashboard' },
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
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const links = user ? commonLinks : [...commonLinks, ...guestLinks];

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  function onLogout() {
    setMenuOpen(false);
    logout();
    navigate('/login');
  }

  return (
    <>
      <header className="header" data-menu-open={menuOpen}>
        <span className="brand">Mini Helpdesk</span>
        <button
          type="button"
          className="burger"
          aria-expanded={menuOpen}
          aria-controls="main-nav"
          aria-label="Menu"
          onClick={() => setMenuOpen((open) => !open)}
          data-testid="nav-burger"
        >
          Menu
          {unreadTotal > 0 && (
            <span className="badge burger-badge" data-testid="nav-burger-badge">
              {unreadTotal > 99 ? '99+' : unreadTotal}
            </span>
          )}
        </button>
        <nav className="nav" id="main-nav" aria-label="Main">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              onClick={() => setMenuOpen(false)}
              data-testid={link.testId}
            >
              {link.label}
              {link.testId === 'nav-tickets' && unreadTotal > 0 && (
                <span className="badge" data-testid="nav-unread-badge">
                  {unreadTotal > 99 ? '99+' : unreadTotal}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <ThemeToggle />
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
