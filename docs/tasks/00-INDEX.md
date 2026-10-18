# Mini Helpdesk — індекс задач

**Стек:** NestJS + TypeScript + TypeORM + MySQL 8, React + Vite, Docker Compose, GitHub Actions.
**Мета:** пет-проєкт без автотестів, який потім покривається Playwright.

Оцінка: S ≈ до пів дня, M ≈ 1 день, L ≈ 2+ дні.

## Епік 0. Каркас і інфраструктура
- [T0.1](T0.1-repo-setup.md) — Репозиторій, лінтери, workspaces (S)
- [T0.2](T0.2-docker-compose.md) — docker-compose: MySQL + api + web (M)
- [T0.3](T0.3-nestjs-init-health-swagger.md) — NestJS, /health, Swagger (S)
- [T0.4](T0.4-react-vite-init.md) — React + Vite (S)
- [T0.5](T0.5-readme-quickstart.md) — README: швидкий старт (S)

## Епік 1. База даних
- [T1.1](T1.1-typeorm-mysql-migrations.md) — TypeORM + міграції (M)
- [T1.2](T1.2-entities.md) — Сутності (M)
- [T1.3](T1.3-seed-script.md) — Seed-скрипт (S)

## Епік 2. Автентифікація
- [T2.1](T2.1-register-login-jwt.md) — Реєстрація та логін, JWT (M)
- [T2.2](T2.2-jwt-and-role-guards.md) — Guards: JWT і ролі (S)
- [T2.3](T2.3-dto-validation-error-format.md) — Валідація та формат помилок (S)
- [T2.4](T2.4-frontend-auth-pages.md) — Фронт: auth, localStorage (M)

## Епік 3. CRUD тікетів
- [T3.1](T3.1-tickets-list-filters.md) — Список: пагінація, фільтри (M)
- [T3.2](T3.2-tickets-crud.md) — CRUD тікета (M)
- [T3.3](T3.3-comments-api.md) — Коментарі (S)
- [T3.4](T3.4-frontend-tickets-ui.md) — Фронт: тікети (L)
- [T3.5](T3.5-draft-in-sessionstorage.md) — Чернетка в sessionStorage (S)
- [T3.6](T3.6-data-testid.md) — data-testid (S)

## Епік 4. Файли
- [T4.1](T4.1-attachments-upload.md) — Завантаження вкладень (M)
- [T4.2](T4.2-attachments-download.md) — Скачування вкладень (S)
- [T4.3](T4.3-export-csv.md) — Експорт CSV (S)
- [T4.4](T4.4-print-page-pdf.md) — Друк / PDF (S)

## Епік 5. Real-time
- [T5.1](T5.1-websocket-gateway.md) — WebSocket gateway (M)
- [T5.2](T5.2-realtime-ui-toast.md) — Тости та бейдж (M)
- [T5.3](T5.3-browser-notifications.md) — Browser notifications (S)

## Епік 6. Складні UI-сценарії
- [T6.1](T6.1-nested-iframes.md) — iframe у iframe (M)
- [T6.2](T6.2-popup-share.md) — Pop-up Share (S)
- [T6.3](T6.3-geolocation-nearest-office.md) — Геолокація (M)
- [T6.4](T6.4-responsive-mobile.md) — Мобільна верстка (M)
- [T6.5](T6.5-analytics-requests.md) — Аналітика (S)
- [T6.6](T6.6-theme-switcher.md) — Тема light/dark (S)

## Епік 7. Службові можливості
- [T7.1](T7.1-robots-sitemap.md) — robots.txt, sitemap (S)
- [T7.2](T7.2-csp-helmet.md) — CSP (M)
- [T7.3](T7.3-test-endpoints-reset-seed.md) — /test/reset, /test/seed (M)
- [T7.4](T7.4-slow-api-flaky-mode.md) — Slow / flaky режим (S)
- [T7.5](T7.5-stats-dashboard.md) — /stats і дашборд (S)

## Епік 8. CI/CD
- [T8.1](T8.1-ci-lint-build.md) — CI: lint + build (S)
- [T8.2](T8.2-ci-mysql-service.md) — CI: MySQL, міграції, seed (M)
- [T8.3](T8.3-dockerfiles.md) — Dockerfiles (M)
- [T8.4](T8.4-e2e-placeholder.md) — Місце під Playwright (S)

## Епік 9. Фіналізація
- [T9.1](T9.1-swagger-docs.md) — Swagger (M)
- [T9.2](T9.2-final-readme.md) — Фінальний README (M)
- [T9.3](T9.3-feature-to-playwright-map.md) — Фіча → Playwright-тема (S)

## Рекомендований порядок
1. **Фаза 1 (MVP):** Е0 → Е1 → Е2 → Е3 → T8.1–T8.2
2. **Фаза 2:** Е4 → Е5
3. **Фаза 3:** Е6 → Е7
4. **Фаза 4:** T8.3–T8.4 → Е9

## Як працювати з задачами
- Одна задача = одна гілка `feat/T<номер>-<коротка-назва>` = один PR
- Коміти: `feat(T3.2): ...`
- Задача готова, коли виконані всі пункти «Що зробити» та «Acceptance criteria»
