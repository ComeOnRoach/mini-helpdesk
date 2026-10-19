import { useNotificationPermission } from './use-notification-permission';

const LABELS = {
  default: 'Notifications off',
  granted: 'Notifications on',
  denied: 'Notifications blocked',
  unsupported: 'Notifications not supported',
} as const;

export function NotificationControl() {
  const { permission, request } = useNotificationPermission();

  return (
    <span className="notifications" data-permission={permission} data-testid="nav-notifications">
      {permission === 'default' ? (
        <button
          type="button"
          className="secondary"
          onClick={request}
          data-testid="nav-notifications-enable"
        >
          Enable notifications
        </button>
      ) : (
        LABELS[permission]
      )}
      {permission === 'denied' && (
        <small className="notifications-hint" data-testid="nav-notifications-hint">
          Notifications are blocked. Allow them in your browser&apos;s site settings, then reload.
        </small>
      )}
    </span>
  );
}
