# Nested iframes: `/help` (T6.1)

A page built for iframe automation: `/help` (level 1) embeds a FAQ widget in an iframe (level 2), and the FAQ embeds a feedback form in a second iframe (level 3). Web only; no API change, no new package, no new variable.

## Structure

| Level | URL                      | Frame                                                          |
| ----- | ------------------------ | -------------------------------------------------------------- |
| 1     | `/help` (React page)     | the page itself                                                |
| 2     | `/widgets/faq.html`      | `<iframe id="faq-frame" title="FAQ">` on `/help`               |
| 3     | `/widgets/feedback.html` | `<iframe id="feedback-frame" title="Feedback">` inside the FAQ |

Playwright: `page.frameLocator('#faq-frame').frameLocator('#feedback-frame')`.

- Levels 2 and 3 are static files in `apps/web/public/widgets/` (`faq.html`, `faq.js`, `feedback.html`, `feedback.js`, `widgets.css`): plain HTML and vanilla JS, no React and no dependency on the app CSS. Vite serves `public/` at the site root and `vite build` copies it to `dist/widgets/`.
- All frames are the same origin (served by the same web server) and have no `sandbox` attribute, so a script can reach from the top page into both frames.
- The widgets can also be opened directly (`/widgets/faq.html`, `/widgets/feedback.html`); `/help` has a link `help-faq-open` for the FAQ in a new tab.
- The scripts are external files (no inline script), so a future CSP does not need `'unsafe-inline'` for them. A strict CSP (`CSP_ENABLED`) must still allow same-origin frames (`frame-src 'self'` / `child-src 'self'`).

## `/help` page (level 1)

`help-title`, a short intro with the link `help-faq-open`, a loading line `help-faq-loading` until the iframe `load` event, and the iframe `faq-frame` (test id `help-faq-frame`). React does not read into the frames.

## FAQ widget (level 2)

- Search `faq-search` filters on every input, case-insensitive, over the question and the answer; `faq-count` shows "N of 6 questions"; `faq-empty` appears when nothing matches.
- Accordion of 6 fixed items (deterministic text): `faq-item` (`data-faq-id`) with a button `faq-question-N` (`data-testid="faq-question"`, `aria-expanded`, `aria-controls`) and a panel `faq-answer-N` (`data-testid="faq-answer"`, `hidden` when closed). Several items can be open at once.
- The nested frame `feedback-frame` (test id `faq-feedback-frame`) sits under the list.

## Feedback form (level 3)

- Radios `feedback-helpful-yes` / `feedback-helpful-no`, optional textarea `feedback-comment` (max 500), submit `feedback-submit`.
- Submit without a choice shows `feedback-error` ("Please choose Yes or No.") and sends nothing. Choosing an answer clears it.
- A valid submit hides the form and shows `feedback-thanks` ("Thank you for your feedback!") with `data-answer="yes|no"`, inside the nested frame only. Nothing is sent to the API or stored, so reloading the frame brings the form back. The task text says «Дякуємо»; the message is English like the rest of the UI.

## Stable locators

Every interactive element inside the frames has both an `id` and a `data-testid`, and ids are unique per document. The lint rule for `data-testid` covers only `apps/web/src/**/*.tsx`, so the static HTML was checked by hand (and by the verification script).

## Not covered

- Feedback is not sent to an API.
- No dark theme inside the widgets (T6.6).
- No i18n.

## Verification done

Vite dev server on port 5174 (no API needed), a browser context through playwright-cli. 37 checks passed:

- Three levels: `/help` through the nav link and as a direct URL; the FAQ title, search and 6 items through `frameLocator('#faq-frame')`; the form through the nested `frameLocator`.
- Loading line disappears after the frame loads; the new-tab link points at `/widgets/faq.html`.
- Accordion: expand, two open at once, collapse. Search: case-insensitive filter, matching counter, empty state, clearing restores 6.
- Feedback: error without a choice, error cleared on choice, thanks with `data-answer` `no` and later `yes`, form hidden after submit.
- Independence: the FAQ search text and the outer page (a `window` marker) are unchanged after submit; no frame navigation happened; reloading only the nested frame resets the form while the FAQ keeps its state.
- Same origin at all three levels, and the nested document is reachable from the top page.
- Standalone widget pages: no duplicate ids, every button/input/textarea/link/iframe has an `id` and a `data-testid`. No page errors.
- `npm run lint`, `tsc -b` and `vite build` pass (`dist/widgets/` contains the five files).
