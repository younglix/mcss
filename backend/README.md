# Mount Carmel ERP — Backend

Django + DRF + PostgreSQL + Channels/Redis + Celery/Redis. Phase 1 (Foundation):
auth engine, RBAC, school configuration, system settings, real-time layer,
background jobs, audit logging, and the Super Admin dashboard aggregation layer.

## Local setup

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate        # Windows; `source .venv/bin/activate` on macOS/Linux
pip install -r requirements.txt

cp .env.example .env          # then edit MCSS_DATABASE_URL / SECRET_KEY as needed
```

**Database.** Needs a Postgres role + database matching `MCSS_DATABASE_URL` in `.env`
(defaults to `postgres://mcss:mcss@localhost:5432/mcss_erp`). Create it once:

```sql
CREATE ROLE mcss LOGIN PASSWORD 'mcss';
CREATE DATABASE mcss_erp OWNER mcss;
```

**Redis.** Optional for local dev. If `REDIS_URL` is unset in `.env`, the app
automatically falls back to Django Channels' in-memory layer and Celery's eager
(synchronous) mode — everything still runs and is fully testable, just without
a real broker. Set `REDIS_URL=redis://localhost:6379/0` once Redis is available
(needed for real background jobs and for the WebSocket layer to work across
more than one process).

```bash
python manage.py migrate
python manage.py seed_rbac       # permission registry + default roles (spec §33)
python manage.py seed_settings   # default system-setting keys (empty/off)
python manage.py createsuperuser # prompts for email + full_name; is_superadmin=True
python manage.py runserver
```

API is served at `http://localhost:8000/api/v1/`. WebSocket notifications at
`ws://localhost:8000/ws/notifications/?token=<jwt access token>`.

## Conventions

- Every endpoint returns the standard envelope: `{success, message, data, errors, meta}`.
- Auth: `Authorization: Bearer <access_token>`.
- Permission gating is by string, never by role name — see `apps/rbac/constants.py`
  for the registry and `apps/rbac/permissions.py` for `HasPermission("module.action")`.
- `apps.is_superadmin` bypasses RBAC entirely; every other role goes through the
  permission registry.
- New modules (students, academics, finance, …) follow the same pattern: app →
  models (inherit `common.models.BaseModel`) → serializers → views with an explicit
  permission mapping → register new permission strings in `apps/rbac/constants.py`
  → seed them via `seed_rbac` → optionally call `apps.audit.services.log(...)` /
  `apps.notifications.services.dispatch(...)` for sensitive actions and live updates.

## Running the async worker (once Redis is set up)

```bash
celery -A config worker -l info      # background jobs
celery -A config beat -l info        # scheduled cleanup (expired OTPs / tokens)
daphne -b 0.0.0.0 -p 8000 config.asgi:application   # production ASGI server (WS + HTTP)
```
