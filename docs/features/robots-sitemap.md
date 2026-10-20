# robots.txt and sitemap.xml (T7.1)

Two static service files served by the web app (Vite serves `apps/web/public/` at the site root). No API code is involved.

| URL            | File                            | Content-Type (Vite dev) |
| -------------- | ------------------------------- | ----------------------- |
| `/robots.txt`  | `apps/web/public/robots.txt`    | `text/plain`            |
| `/sitemap.xml` | `apps/web/public/sitemap.xml`   | `text/xml`              |

## robots.txt

```
User-agent: *
Disallow: /admin
Disallow: /tickets
Sitemap: http://localhost:5173/sitemap.xml
```

`/admin` has no route today; the rule is kept on purpose. `/share/:id` and the print page are not disallowed (outside the task).

## sitemap.xml

Standard `urlset` (sitemaps.org namespace) with five absolute URLs: `/`, `/login`, `/register`, `/help`, `/contacts`. Private pages (`/tickets*`, `/share/:id`, print) are not listed.

## Host limitation

Sitemap URLs must be absolute and static files cannot read env, so the host `http://localhost:5173` is hardcoded in both files. For another host edit both files. No new env variable was added.

## Playwright hints

- `request.get('/robots.txt')` and `request.get('/sitemap.xml')` against the web baseURL: status, `content-type`, body.
- `page.goto('/robots.txt')` shows the plain text, not the SPA.
- `context.route('**/robots.txt', route => route.fulfill({ body: 'MOCK' }))` overrides the file.

## Verified

Vite dev server on a spare port, checked with curl and Playwright:
- `GET /robots.txt` -> 200, `text/plain`, expected body.
- `GET /sitemap.xml` -> 200, `text/xml`, parsed by `DOMParser` without `parsererror`, exactly five `<loc>`, none under `/tickets`.
- `page.goto('/robots.txt')` renders the text; a `context.route` mock replaced it; `/login` still renders the app.
- `npm run lint`, `tsc -b` and `vite build` pass; `dist/` contains both files.

Not covered: production hosting (the Content-Type there depends on the web server).
