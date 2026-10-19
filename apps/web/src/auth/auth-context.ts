import { createContext } from 'react';
import type { User } from '../api/auth';

export interface AuthContextValue {
  user: User | null;
  // True while a stored token is being checked against /api/auth/me.
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
