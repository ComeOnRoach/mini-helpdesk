import { Navigate, Outlet } from 'react-router-dom';
import { TOKEN_KEY } from '../api/client';
import { useAuth } from './use-auth';

// Without a token the visitor goes to /login; with one we wait until /me confirms it.
export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (localStorage.getItem(TOKEN_KEY) === null) {
    return <Navigate to="/login" replace />;
  }
  if (loading) {
    return <p data-testid="auth-loading">Loading...</p>;
  }
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
