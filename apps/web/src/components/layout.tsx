import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/use-auth';

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
            </NavLink>
          ))}
        </nav>
        {user && (
          <div className="session">
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
