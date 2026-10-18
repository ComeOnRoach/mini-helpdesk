# Mini Helpdesk

A learning pet project: a ticketing system (NestJS + React + MySQL).

## Quick start

```bash
cp .env.example .env
docker compose up
```

Web `:5173`, API `:3000`, MySQL `:3306`.

## Environment variables

| Variable           | Default       | Purpose                                                 |
| ------------------ | ------------- | ------------------------------------------------------- |
| `DB_HOST`          | `localhost`   | MySQL host (compose overrides it to `db` for the api)   |
| `DB_PORT`          | `3306`        | MySQL port                                              |
| `DB_USER`          | `helpdesk`    | MySQL application user                                  |
| `DB_PASSWORD`      | `helpdesk`    | MySQL application password                              |
| `DB_ROOT_PASSWORD` | `root`        | MySQL root password (used by the image and healthcheck) |
| `DB_NAME`          | `helpdesk`    | Database name                                           |
| `JWT_SECRET`       | `change-me`   | JWT signing secret                                      |
| `NODE_ENV`         | `development` | Runtime environment                                     |

Never commit `.env`.
