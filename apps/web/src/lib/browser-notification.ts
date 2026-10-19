import type { CommentAddedPayload } from '../api/realtime';

export type NotificationPermissionState = NotificationPermission | 'unsupported';

const BODY_LIMIT = 80;

export function readNotificationPermission(): NotificationPermissionState {
  return 'Notification' in window ? Notification.permission : 'unsupported';
}

// Shows a system notification for a new comment. Nothing happens (and nothing throws) when the
// browser has no Notification API, the permission is not granted, or the tab is in front.
export function showCommentNotification(
  { ticketId, comment }: CommentAddedPayload,
  onOpen: (ticketId: number) => void,
): void {
  if (readNotificationPermission() !== 'granted') return;
  if (document.visibilityState === 'visible') return;
  try {
    const text =
      comment.body.length > BODY_LIMIT ? `${comment.body.slice(0, BODY_LIMIT)}…` : comment.body;
    const notification = new Notification(`New comment on ticket #${ticketId}`, {
      body: `${comment.author.email}: ${text}`,
      // One notification per ticket: a newer comment replaces the older one.
      tag: `ticket-${ticketId}`,
    });
    notification.onclick = () => {
      window.focus();
      onOpen(ticketId);
      notification.close();
    };
  } catch {
    // Some browsers (e.g. Chrome on Android) throw from the constructor; the toast still shows.
  }
}
