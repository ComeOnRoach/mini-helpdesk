import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './auth/protected-route';
import { Layout } from './components/layout';
import { ContactsPage } from './pages/contacts-page';
import { HelpPage } from './pages/help-page';
import { HomePage } from './pages/home-page';
import { LoginPage } from './pages/login-page';
import { NotFoundPage } from './pages/not-found-page';
import { RegisterPage } from './pages/register-page';
import { TicketDetailsPage } from './pages/tickets/ticket-details-page';
import { TicketFormPage } from './pages/tickets/ticket-form-page';
import { TicketPrintPage } from './pages/tickets/ticket-print-page';
import { TicketsPage } from './pages/tickets/tickets-page';

export function App() {
  return (
    <Routes>
      {/* The print page has no Layout: no header or navigation. */}
      <Route element={<ProtectedRoute />}>
        <Route path="tickets/:id/print" element={<TicketPrintPage />} />
      </Route>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="tickets/new" element={<TicketFormPage />} />
          <Route path="tickets/:id" element={<TicketDetailsPage />} />
          <Route path="tickets/:id/edit" element={<TicketFormPage />} />
        </Route>
        <Route path="help" element={<HelpPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
