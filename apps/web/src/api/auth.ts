import { apiFetch } from './client';

export type UserRole = 'user' | 'agent';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface LoginResult {
  accessToken: string;
  user: User;
}

const json = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });

export const loginRequest = (email: string, password: string) =>
  apiFetch<LoginResult>('/api/auth/login', json({ email, password }));

export const registerRequest = (email: string, password: string) =>
  apiFetch<User>('/api/auth/register', json({ email, password }));

export const meRequest = () => apiFetch<User>('/api/auth/me');
