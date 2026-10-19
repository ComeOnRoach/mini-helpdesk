# Responsive (mobile) layout (T6.4)

Single breakpoint: `max-width: 768px`. At 769px and wider nothing changes. All new CSS is one block appended at the end of `apps/web/src/styles.css` (`/* T6.4 responsive layout */`).

## Burger menu (`apps/web/src/components/layout.tsx`)
- `nav-burger` (`<button>`, label "Menu"): hidden on desktop, shown at <= 768px. It has `aria-expanded`, `aria-controls="main-nav"`.
- State is React state (`menuOpen`), mirrored on `<header data-menu-open="true|false">`.
- The panel contains the nav links (`nav-home`, ...), the notification control, `nav-user` and `nav-logout`. When closed they are `display: none` on mobile. The connection pill `nav-connection` always stays in the bar.
- `nav-burger-badge`: unread counter shown on the burger while the menu is closed (the existing `nav-unread-badge` inside the Tickets link is visible when the panel is open).
- Closes on: link click (also the current link), route change, Escape, Logout.
- Existing testids are unchanged.

## Tickets table as cards
`<td>` cells got `data-label` (ID, Title, Status, Priority, Tags, Created). At <= 768px `thead` is visually hidden (clip, still in the accessibility tree) and each row is a bordered card with `label: value` lines via `td::before { content: attr(data-label) }`. Row testids (`ticket-row`, `data-ticket-id`, `ticket-row-*`) are unchanged.

## Forms, modals, other
- Forms, filters and selects use the full width, 16px font (no iOS zoom); action rows wrap; modal has `max-height: 90vh` with scroll; details list is a single column; toasts are limited to the viewport width; container padding is 16px with `overflow-wrap: anywhere`.
- Touch targets: buttons, `a.button`, nav links, inputs and selects have `min-height: 44px`; `toast-close` has `min-width: 44px`.

## Verification (Playwright CLI, iPhone 13 emulation 390x664, `isMobile`, `hasTouch`, `tap()`)
- Desktop 1280: burger hidden, links visible, table renders as `display: table`.
- Mobile: burger visible, links hidden; tap opens (`aria-expanded=true`), link tap navigates and closes, Escape closes, Logout from the panel works, guest links (Login/Register) work.
- No horizontal scroll (`scrollWidth <= innerWidth`) at 390px on `/`, `/tickets`, `/tickets/new`, ticket details, print page, `/help`, `/contacts`, and at 320px on `/login`.
- Measured heights are 44px for burger, nav links, logout, New ticket, search, status filter and the row title link.
- Boundary: burger visible at 768px, hidden at 769px.
- Delete-confirm modal fits without horizontal scroll.
- `npm run lint`, `tsc -b`, `vite build` pass.
- Not covered: real devices, landscape orientation, a long list of cards beyond one page, visual check of every page.

## Notes
- Playwright `isVisible()` returns true for the visually hidden `thead` (1px clipped box); assert on card CSS or row labels rather than thead visibility.
