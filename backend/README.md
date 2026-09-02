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

## S3 file storage (optional in dev, required in production)

Uploaded assets (branding logos, staff/HR documents, student resources — see
`STORAGES` / `AWS_*` in `config/settings/base.py`) fall back to local disk
automatically whenever `AWS_ACCESS_KEY_ID`/`AWS_STORAGE_BUCKET_NAME` are unset,
so local dev needs nothing here. Outside `DEBUG`, `AssetUploadView` refuses
uploads until real credentials are set, since nothing serves local disk files
in production. To configure a real bucket:

1. **Create the bucket** (any region) — leave Object Ownership at its default,
   "Bucket owner enforced" (ACLs disabled; this app never uses object ACLs).
2. **Allow public read.** Under the bucket's *Permissions* tab, turn off "Block
   all public access" for just the two "public bucket policies" checkboxes,
   then add this bucket policy (replace `YOUR-BUCKET-NAME`) — uploaded files
   are served back as plain public URLs, so every object in this bucket is
   intentionally public:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Sid": "PublicReadGetObject",
       "Effect": "Allow",
       "Principal": "*",
       "Action": "s3:GetObject",
       "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
     }]
   }
   ```
3. **Create an IAM user for the app** — IAM → Users → Create user, *no* console
   access, just "Access key - Programmatic access". Attach an inline policy
   scoped to only this bucket (least privilege — don't reuse root account keys):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"],
       "Resource": ["arn:aws:s3:::YOUR-BUCKET-NAME", "arn:aws:s3:::YOUR-BUCKET-NAME/*"]
     }]
   }
   ```
   Then IAM → that user → *Security credentials* → *Create access key* → choose
   "Application running outside AWS" → this is the only time the **Secret
   Access Key** is ever shown — copy both values immediately.
4. **Set the four env vars** in `.env` (or the server's `.env` in production):
   `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_STORAGE_BUCKET_NAME`,
   `AWS_S3_REGION_NAME` (e.g. `eu-north-1` — must match the bucket's actual
   region, shown on the bucket's *Properties* tab). Leave `AWS_S3_ENDPOINT_URL`
   unset — that's only for S3-compatible non-AWS providers (e.g. Cloudflare R2).
5. Restart the app (`mcss-daphne` in production) so Django picks up the new
   settings.

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
