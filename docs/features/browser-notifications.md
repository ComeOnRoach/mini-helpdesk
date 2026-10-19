# Browser notifications (T5.3)

System notifications for new comments when the tab is not in front, plus a header control that shows and requests the permission. Web only; no API change, no new package, no new variable.

## Permission control

`NotificationControl` (`components/notification-control.tsx`) sits in the header next to the connection indicator (logged in only). The wrapper `nav-notifications` has `data-permission`:

| `data-permission` | What the user sees                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `default`         | button `nav-notifications-enable` "Enable notifications"                                                                  |
| `granted`         | text "Notifications on"                                                                                                   |
| `denied`          | text "Notifications blocked" and the hint `nav-notifications-hint` (allow it in the browser's site settings, then reload) |
| `unsupported`     | text "Notifications not supported" (no `Notification` API in this browser)                                                |

- The browser prompt appears only after a click on the button (a user gesture), never automatically.
- `useNotificationPermission` (`components/use-notification-permission.ts`) reads `Notification.permission` and refreshes it after the request. It also listens to the Permissions API `change` event when available, so changing the setting in the browser updates the header without a reload.

## Showing the notification

`showCommentNotification` (`lib/browser-notification.ts`) is called from the `comment.added` handler in `RealtimeProvider`, after the T5.2 guard (no own comments, no ticket that is open). It shows a notification only when all of these are true:

- the `Notification` API exists and the permission is `granted`;
- `document.visibilityState` is not `visible` (the tab is hidden or in the background).

Content: title `New comment on ticket #N`, body `<author email>: <first 80 characters>`, `tag` `ticket-N` (a newer comment on the same ticket replaces the older notification). Click: the window is focused, the app navigates to `/tickets/N` (the T5.2 route effect then clears the unread badge) and the notification is closed.

The toast and the unread badge from T5.2 are unchanged and still appear. Without permission, with no API, or when the constructor throws (some mobile browsers do), nothing is shown and nothing throws.

## Test ids

`nav-notifications` (with `data-permission`), `nav-notifications-enable`, `nav-notifications-hint`.

## Code

`components/notification-control.tsx`, `components/use-notification-permission.ts`, `lib/browser-notification.ts`, `components/realtime-provider.tsx` (call, with `navigate` held in a ref so the socket is not reopened on route changes), `components/layout.tsx`, `styles.css`.

## Not covered

- No settings page; the control lives in the header.
- No notifications for `ticket.created` / `ticket.updated` (no UI for them yet).
- The unread count is still lost on reload (T5.2).

## Verification done

API on port 3100, web on 5174, separate browser contexts with playwright-cli. Real OS notifications cannot be observed, so an init script replaced `window.Notification` with a recording stub, and `document.visibilityState` was switched with a flag. 33 checks passed:

- Granted: status and no button; with the tab hidden an agent comment gives exactly one notification with the right title, `tag` and body (author, cut at 80 characters) while toast and badge still appear; no notification with the tab visible, for my own comment, or for the open ticket.
- Click: calling `onclick` opens `/tickets/N`, clears the badge, closes the notification; the socket stays `online` after in-app navigation.
- Default: no notification before permission; the button click gives `granted`, the button disappears, and the next hidden comment shows a notification.
- Denied: hint visible, no button, no notification, toast still works. Unsupported: status `unsupported`, UI alive. Throwing constructor: toast and badge fine, no page error.
- Real API: `context.grantPermissions(['notifications'])` gives `granted`; without a grant the status is `default`.
- Test tickets were deleted, servers stopped.
