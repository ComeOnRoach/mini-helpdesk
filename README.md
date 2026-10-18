# Mini Helpdesk

A learning pet project: a ticketing system (NestJS + React + MySQL).

## Quick start

```bash
cp .env.example .env
docker compose up
```

Web `:5173`, API `:3000`, Swagger `:3000/docs`, health `:3000/health`, MySQL `:3306`.

## Environment variables

| Variable           | Default                 | Purpose                                                 |
| ------------------ | ----------------------- | ------------------------------------------------------- |
| `DB_HOST`          | `localhost`             | MySQL host (compose overrides it to `db` for the api)   |
| `DB_PORT`          | `3306`                  | MySQL port                                              |
| `DB_USER`          | `helpdesk`              | MySQL application user                                  |
| `DB_PASSWORD`      | `helpdesk`              | MySQL application password                              |
| `DB_ROOT_PASSWORD` | `root`                  | MySQL root password (used by the image and healthcheck) |
| `DB_NAME`          | `helpdesk`              | Database name                                           |
| `JWT_SECRET`       | `change-me`             | JWT signing secret                                      |
| `NODE_ENV`         | `development`           | Runtime environment                                     |
| `PORT`             | `3000`                  | API listen port                                         |
| `VITE_API_URL`     | `http://localhost:3000` | API base URL used by the web app                        |
| `WEB_ORIGIN`       | `http://localhost:5173` | Origin allowed by API CORS                              |

Never commit `.env`.
