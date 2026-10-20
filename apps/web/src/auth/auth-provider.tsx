import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { track } from '../lib/analytics';
import { loginRequest, meRequest, registerRequest } from '../api/auth';
import type { User } from '../api/auth';
import { ApiError, TOKEN_KEY } from '../api/client';
import { AuthContext } from './auth-context';
import type { AuthContextValue } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => localStorage.getItem(TOKEN_KEY) !== null);

  // Restore the session when the page loads with a stored token.
  useEffect(() => {
    if (localStorage.getItem(TOKEN_KEY) === null) {
      return;
    }
    let active = true;
    meRequest()
      .then((me) => active && setUser(me))
      .catch((error: unknown) => {
        // Only an invalid or expired token is dropped. A network error, or a request cut off by
        // navigating away, must keep the token (otherwise a quick reload logs the user out).
        if (error instanceof ApiError && error.status === 401) localStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email, password);
    localStorage.setItem(TOKEN_KEY, result.accessToken);
    setUser(result.user);
    track('login');
  }, []);

  const register = useCallback(
    async (email: string, password: string) => {
      await registerRequest(email, password);
      await login(email, password);
    },
    [login],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
