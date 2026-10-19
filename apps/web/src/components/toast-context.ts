import { createContext } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastLink {
  to: string;
  label: string;
}

export interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string, link?: ToastLink) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
