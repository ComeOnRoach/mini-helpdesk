import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/', label: 'Home', testId: 'nav-home' },
  { to: '/tickets', label: 'Tickets', testId: 'nav-tickets' },
  { to: '/help', label: 'Help', testId: 'nav-help' },
  { to: '/contacts', label: 'Contacts', testId: 'nav-contacts' },
  { to: '/login', label: 'Login', testId: 'nav-login' },
  { to: '/register', label: 'Register', testId: 'nav-register' },
];

export function Layout() {
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
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
