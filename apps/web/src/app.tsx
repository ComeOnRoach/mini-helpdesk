import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout';
import { ContactsPage } from './pages/contacts-page';
import { HelpPage } from './pages/help-page';
import { HomePage } from './pages/home-page';
import { LoginPage } from './pages/login-page';
import { NotFoundPage } from './pages/not-found-page';
import { RegisterPage } from './pages/register-page';
import { TicketsPage } from './pages/tickets-page';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
