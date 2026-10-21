#!/bin/bash
# STEP 1 of the move, run ON THE OLD (AWS) SERVER:
#
#   sudo bash /srv/mcss/deploy/export-from-aws.sh               # real move: stops the app first
#   sudo bash /srv/mcss/deploy/export-from-aws.sh --keep-running # practice run: app stays up
#
# Produces /root/mcss-export.tar.gz: a database dump, the backend .env (the
# app's secrets: treat this file like a password and delete it after the
# move), any locally stored uploads, this deploy kit, and reference copies
# of how this server was wired. Nothing on this server is deleted.
set -euo pipefail

APP_DIR=/srv/mcss
WORK=/root/mcss-export
OUT=/root/mcss-export.tar.gz
KEEP_RUNNING=0
[ "${1:-}" = "--keep-running" ] && KEEP_RUNNING=1

[ "$(id -u)" -eq 0 ] || { echo "Run this with sudo."; exit 1; }
ENV_FILE="$APP_DIR/backend/.env"
[ -f "$ENV_FILE" ] || { echo "Can't find $ENV_FILE. Is the app at $APP_DIR?"; exit 1; }
command -v pg_dump >/dev/null || { echo "pg_dump is missing: apt-get install -y postgresql-client"; exit 1; }

# libpq understands postgres:// and postgresql:// but not django-environ's
# other spellings (psql://, pgsql://), so normalise the scheme.
DB_URL=$(grep -E '^MCSS_DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2- | sed -e 's/^["'"'"']//' -e 's/["'"'"']$//')
[ -n "$DB_URL" ] || { echo "MCSS_DATABASE_URL isn't set in $ENV_FILE."; exit 1; }
PG_URL=$(echo "$DB_URL" | sed -E 's#^[a-z]+://#postgresql://#')

UNITS="mcss-daphne mcss-celery-worker mcss-celery-beat"
if [ "$KEEP_RUNNING" -eq 0 ]; then
    echo "--- stopping the app so no new data is written during the move ---"
    # shellcheck disable=SC2086
    systemctl stop $UNITS || true
    # Keep it down: until GitHub's deploy secrets point at the new server, a
    # push still deploys HERE, and that deploy restarts these services. A
    # failed start condition makes those restarts quietly do nothing, so this
    # stale copy can't come back up and start taking logins and payments.
    for unit in $UNITS; do
        mkdir -p "/etc/systemd/system/$unit.service.d"
        printf '[Unit]\n# Moved to the new server; see deploy/README.md.\nConditionPathExists=/nonexistent-moved-to-new-server\n' \
            > "/etc/systemd/system/$unit.service.d/moved.conf"
    done
    systemctl daemon-reload
    echo "    The app here is now stopped and won't restart. To undo (only if the move fails):"
    echo "    sudo rm /etc/systemd/system/mcss-*.service.d/moved.conf && sudo systemctl daemon-reload && sudo systemctl start $UNITS"
else
    echo "--- practice run: the app keeps running; data written after this won't be in the copy ---"
fi

rm -rf "$WORK"
mkdir -p "$WORK/reference"
chmod 700 "$WORK"

echo "--- dumping the database ---"
pg_dump --dbname="$PG_URL" --format=custom --no-owner --no-privileges --file "$WORK/db.dump"
echo "    $(du -h "$WORK/db.dump" | cut -f1) written"

cp "$ENV_FILE" "$WORK/backend.env"

if [ -d "$APP_DIR/backend/media" ] && [ -n "$(ls -A "$APP_DIR/backend/media" 2>/dev/null)" ]; then
    echo "--- packing locally stored uploads ---"
    tar -C "$APP_DIR/backend" -czf "$WORK/media.tar.gz" media
fi

echo "--- packing the deploy kit and reference copies of this server's setup ---"
cp -r "$APP_DIR/deploy" "$WORK/deploy-kit"
cp -L /etc/nginx/sites-enabled/* "$WORK/reference/" 2>/dev/null || true
cp /etc/systemd/system/mcss-*.service "$WORK/reference/" 2>/dev/null || true
cp "$APP_DIR/deploy.sh" "$WORK/reference/deploy.sh.old" 2>/dev/null || true
psql --version > "$WORK/reference/versions.txt" 2>&1 || true
pg_dump --version >> "$WORK/reference/versions.txt" 2>&1 || true

tar -C /root -czf "$OUT" "$(basename "$WORK")"
chmod 600 "$OUT"
rm -rf "$WORK"

cat <<EOF

Export complete: $OUT ($(du -h "$OUT" | cut -f1))

Next, copy it to the new server (you'll be asked for the new server's root password):
  scp $OUT root@169.58.243.48:/root/

Then continue with step 3 in deploy/README.md on the new server.
EOF
