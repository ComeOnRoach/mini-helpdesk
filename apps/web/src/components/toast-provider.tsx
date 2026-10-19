import { useCallback, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ToastContext } from './toast-context';
import type { ToastLink, ToastType } from './toast-context';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  link?: ToastLink;
}

const TOAST_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastType, message: string, link?: ToastLink) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, type, message, link }]);
      window.setTimeout(() => dismiss(id), TOAST_MS);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      success: (message: string) => push('success', message),
      error: (message: string) => push('error', message),
      info: (message: string, link?: ToastLink) => push('info', message, link),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" aria-live="polite" data-testid="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            role={toast.type === 'error' ? 'alert' : 'status'}
            data-testid="toast"
            data-toast-type={toast.type}
          >
            <span data-testid="toast-message">{toast.message}</span>
            {toast.link && (
              <Link to={toast.link.to} onClick={() => dismiss(toast.id)} data-testid="toast-link">
                {toast.link.label}
              </Link>
            )}
            <button
              type="button"
              className="toast-close"
              aria-label="Dismiss"
              onClick={() => dismiss(toast.id)}
              data-testid="toast-close"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
