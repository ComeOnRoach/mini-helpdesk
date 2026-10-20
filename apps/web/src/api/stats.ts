import { apiFetch } from './client';

// GET /api/stats: counters for the tickets the current user can see.
export interface Stats {
  total: number;
  open: number;
  in_progress: number;
  closed: number;
  byPriority: { low: number; medium: number; high: number };
}

export const getStats = () => apiFetch<Stats>('/api/stats');
