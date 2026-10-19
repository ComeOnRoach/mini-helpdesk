import { useCallback, useEffect, useState } from 'react';
import { readNotificationPermission } from '../lib/browser-notification';
import type { NotificationPermissionState } from '../lib/browser-notification';

export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermissionState>(
    readNotificationPermission,
  );

  // The user can change the permission in the browser settings while the page is open.
  useEffect(() => {
    if (!('permissions' in navigator)) return;
    let status: PermissionStatus | undefined;
    let cancelled = false;
    const sync = () => setPermission(readNotificationPermission());
    navigator.permissions
      .query({ name: 'notifications' })
      .then((result) => {
        if (cancelled) return;
        status = result;
        status.addEventListener('change', sync);
      })
      .catch(() => {
        // Not supported for notifications in this browser: the state is refreshed on request().
      });
    return () => {
      cancelled = true;
      status?.removeEventListener('change', sync);
    };
  }, []);

  const request = useCallback(async () => {
    if (!('Notification' in window)) return;
    try {
      await Notification.requestPermission();
    } catch {
      // Ignore: the state below is read from the browser anyway.
    }
    setPermission(readNotificationPermission());
  }, []);

  return { permission, request };
}
