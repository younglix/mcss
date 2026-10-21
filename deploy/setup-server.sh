#!/bin/bash
# STEP 3 of the move, run ON THE NEW (CONTABO) SERVER as root, after
# unpacking the export from step 1:
#
#   tar -xzf /root/mcss-export.tar.gz -C /root
#   bash /root/mcss-export/deploy-kit/setup-server.sh /root/mcss-export
#
# Installs everything the app needs, restores the database, moves the
# uploaded files to Cloudflare R2, and starts the site on http://<this IP>/.
# Safe to run again, e.g. after a practice run with a fresh export: it
# brings everything up to date and REPLACES the database with the export's.
set -euo pipefail
KIT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
. "$KIT_DIR/lib.sh"

EXPORT_DIR=${1:-/root/mcss-export}
REPO=git@github.com:younglix/mcss.git
REPO_KEYS_URL=https://github.com/younglix/mcss/settings/keys/new

[ "$(id -u)" -eq 0 ] || die "Run this as root."
[ -f "$EXPORT_DIR/db.dump" ] && [ -f "$EXPORT_DIR/backend.env" ] \
    || die "No export in $EXPORT_DIR. Unpack it first: tar -xzf /root/mcss-export.tar.gz -C /root"
# shellcheck disable=SC1091
. /etc/os-release
[ "${ID:-}" = ubuntu ] || die "This script is written for Ubuntu (this is ${PRETTY_NAME:-unknown})."
[ "${VERSION_ID:-}" = "24.04" ] || warn "Written for Ubuntu 24.04; this is $PRETTY_NAME. Continuing anyway."

PUBLIC_HOST=${PUBLIC_HOST:-$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for (i = 1; i < NF; i++) if ($i == "src") print $(i + 1)}')}
[ -n "$PUBLIC_HOST" ] || die "Couldn't detect this server's IP. Re-run as: PUBLIC_HOST=<ip> bash $0 $EXPORT_DIR"
echo "The site will be at: http://$PUBLIC_HOST/"

# ---------------------------------------------------------------------------
say "1/10  Installing system packages (a few minutes)"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -y -q git curl ca-certificates openssl build-essential pkg-config \
    python3 python3-venv python3-dev libpq-dev libcairo2-dev \
    postgresql redis-server nginx ufw rclone certbot python3-certbot-nginx
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y -q nodejs
fi
systemctl enable --now postgresql redis-server nginx >/dev/null

say "2/10  Firewall: SSH, HTTP and HTTPS only"
ufw allow OpenSSH >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null
ufw status | sed -n '1,8p'

say "3/10  App user '$APP_USER'"
id "$APP_USER" >/dev/null 2>&1 \
    || useradd --system --create-home --home-dir "/home/$APP_USER" --shell /bin/bash "$APP_USER"
# '*' = no password login at all, but (unlike a locked '!') SSH keys still work,
# which the GitHub Actions deploy needs.
usermod -p '*' "$APP_USER"
APP_HOME=$(getent passwd "$APP_USER" | cut -d: -f6)
install -d -o "$APP_USER" -g "$APP_USER" -m 700 "$APP_HOME/.ssh"

say "4/10  GitHub access (read-only deploy key)"
GIT_KEY="$APP_HOME/.ssh/github_deploy"
[ -f "$GIT_KEY" ] || sudo -u "$APP_USER" ssh-keygen -q -t ed25519 -N '' -C "mcss-server-$PUBLIC_HOST" -f "$GIT_KEY"
cat > "$APP_HOME/.ssh/config" <<EOF
Host github.com
    IdentityFile $GIT_KEY
    IdentitiesOnly yes
EOF
chown "$APP_USER:$APP_USER" "$APP_HOME/.ssh/config"
chmod 600 "$APP_HOME/.ssh/config"
if ! grep -q '^github.com ' "$APP_HOME/.ssh/known_hosts" 2>/dev/null; then
    ssh-keyscan -t ed25519 github.com 2>/dev/null >> "$APP_HOME/.ssh/known_hosts"
    chown "$APP_USER:$APP_USER" "$APP_HOME/.ssh/known_hosts"
fi
until sudo -u "$APP_USER" -H git ls-remote "$REPO" HEAD >/dev/null 2>&1; do
    echo
    echo "This server needs permission to download the code from GitHub:"
    echo "  1. Open $REPO_KEYS_URL"
    echo "  2. Title: Contabo server"
    echo "  3. Key: paste the whole line below. Leave 'Allow write access' UNticked."
    echo
    cat "$GIT_KEY.pub"
    echo
    read -rp "Press Enter after you've clicked 'Add key'... " _
done
echo "GitHub access works."

say "5/10  Getting the code"
install -d -o "$APP_USER" -g "$APP_USER" "$APP_DIR"
if [ ! -d "$APP_DIR/.git" ]; then
    sudo -u "$APP_USER" -H git clone --quiet "$REPO" "$APP_DIR"
else
    sudo -u "$APP_USER" -H git -C "$APP_DIR" fetch --quiet origin main
    sudo -u "$APP_USER" -H git -C "$APP_DIR" reset --hard --quiet origin/main
fi
echo "Code at $(sudo -u "$APP_USER" git -C "$APP_DIR" log -1 --format='%h %s')"

say "6/10  Database (replacing it with the export)"
systemctl stop mcss-celery-beat mcss-celery-worker mcss-daphne 2>/dev/null || true
PW_FILE=/root/.mcss-db-password
[ -f "$PW_FILE" ] || { openssl rand -hex 24 > "$PW_FILE"; chmod 600 "$PW_FILE"; }
DB_PASS=$(cat "$PW_FILE")
if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname = '$APP_USER'" | grep -q 1; then
    sudo -u postgres psql -qc "ALTER ROLE $APP_USER WITH LOGIN PASSWORD '$DB_PASS'"
else
    sudo -u postgres psql -qc "CREATE ROLE $APP_USER WITH LOGIN PASSWORD '$DB_PASS'"
fi
sudo -u postgres dropdb --if-exists "$DB_NAME"
sudo -u postgres createdb -O "$APP_USER" "$DB_NAME"
set +e
# Root reads the dump (postgres can't see /root) and feeds it to pg_restore.
# shellcheck disable=SC2024
sudo -u postgres pg_restore --no-owner --role="$APP_USER" --dbname="$DB_NAME" < "$EXPORT_DIR/db.dump"
RESTORE_RC=$?
set -e
USERS=$(sudo -u postgres psql -tAd "$DB_NAME" -c "SELECT count(*) FROM accounts_user" 2>/dev/null || echo 0)
[ "${USERS:-0}" -gt 0 ] || die "The database restore failed (no user accounts found). See the messages above."
[ "$RESTORE_RC" -eq 0 ] || warn "pg_restore printed warnings above, but the data is there ($USERS user accounts), so continuing."
echo "Restored: $USERS user accounts."

say "7/10  App settings (.env)"
if [ ! -f "$ENV_FILE" ]; then
    install -o "$APP_USER" -g "$APP_USER" -m 600 "$EXPORT_DIR/backend.env" "$ENV_FILE"
fi
set_env "$ENV_FILE" DJANGO_SETTINGS_MODULE config.settings.prod
set_env "$ENV_FILE" MCSS_DATABASE_URL "postgres://$APP_USER:$DB_PASS@127.0.0.1:5432/$DB_NAME"
set_env "$ENV_FILE" REDIS_URL redis://127.0.0.1:6379/0
add_to_list "$ENV_FILE" ALLOWED_HOSTS "$PUBLIC_HOST"
add_to_list "$ENV_FILE" CORS_ALLOWED_ORIGINS "http://$PUBLIC_HOST"
add_to_list "$ENV_FILE" CSRF_TRUSTED_ORIGINS "http://$PUBLIC_HOST"
# Plain HTTP until there's a domain (see deploy/README.md, "When the domain is ready").
set_env_if_missing "$ENV_FILE" MCSS_HTTPS false
if [ -f "$EXPORT_DIR/media.tar.gz" ]; then
    tar -C "$APP_DIR/backend" -xzf "$EXPORT_DIR/media.tar.gz"
    chown -R "$APP_USER:$APP_USER" "$APP_DIR/backend/media"
fi

say "8/10  Python packages and database migrations"
[ -x "$APP_DIR/backend/.venv/bin/python" ] || sudo -u "$APP_USER" -H python3 -m venv "$APP_DIR/backend/.venv"
sudo -u "$APP_USER" -H "$APP_DIR/backend/.venv/bin/pip" install -q --upgrade pip wheel
sudo -u "$APP_USER" -H "$APP_DIR/backend/.venv/bin/pip" install -q -r "$APP_DIR/backend/requirements.txt"
manage migrate --noinput

say "9/10  Uploaded files -> Cloudflare R2"
bash "$APP_DIR/deploy/move-files-to-r2.sh" "$EXPORT_DIR"

say "10/10  Web server, services, deploys and backups"
install -m 644 "$APP_DIR/deploy/templates/nginx-mcss.conf" /etc/nginx/sites-available/mcss
ln -sf /etc/nginx/sites-available/mcss /etc/nginx/sites-enabled/mcss
rm -f /etc/nginx/sites-enabled/default
nginx -t
for unit in mcss-daphne mcss-celery-worker mcss-celery-beat; do
    install -m 644 "$APP_DIR/deploy/templates/$unit.service" "/etc/systemd/system/$unit.service"
done
systemctl daemon-reload
systemctl enable mcss-daphne mcss-celery-worker mcss-celery-beat >/dev/null

install -m 440 "$APP_DIR/deploy/templates/sudoers-mcss" /etc/sudoers.d/mcss
visudo -cf /etc/sudoers.d/mcss >/dev/null || { rm -f /etc/sudoers.d/mcss; die "sudoers file failed validation."; }
install -m 755 "$APP_DIR/deploy/templates/mcss-deploy" /usr/local/bin/mcss-deploy
ln -sf /usr/local/bin/mcss-deploy "$APP_DIR/deploy.sh"   # the familiar `sudo /srv/mcss/deploy.sh`
install -m 755 "$APP_DIR/deploy/templates/mcss-backup" /usr/local/bin/mcss-backup
echo "30 2 * * * root /usr/local/bin/mcss-backup" > /etc/cron.d/mcss-backup

# The full deploy: pip, migrate, collectstatic, seeds, frontend build, restart.
/usr/local/bin/mcss-deploy

# GitHub Actions deploys over SSH with this key; its authorized_keys entry
# can ONLY run mcss-deploy, whatever the workflow sends.
ACTIONS_KEY=/root/mcss-actions-deploy-key
[ -f "$ACTIONS_KEY" ] || ssh-keygen -q -t ed25519 -N '' -C "github-actions-deploy" -f "$ACTIONS_KEY"
AUTH="$APP_HOME/.ssh/authorized_keys"
touch "$AUTH"
if ! grep -qF "$(cut -d' ' -f2 "$ACTIONS_KEY.pub")" "$AUTH"; then
    echo "command=\"/usr/local/bin/mcss-deploy\",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty $(cat "$ACTIONS_KEY.pub")" >> "$AUTH"
fi
chown "$APP_USER:$APP_USER" "$AUTH"
chmod 600 "$AUTH"

# ---------------------------------------------------------------------------
say "Checking the site"
sleep 3
for unit in mcss-daphne mcss-celery-worker mcss-celery-beat nginx postgresql redis-server; do
    printf '  %-20s %s\n' "$unit" "$(systemctl is-active "$unit")"
done
HEALTH=$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $PUBLIC_HOST" http://127.0.0.1/api/v1/health || true)
HOME_PAGE=$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $PUBLIC_HOST" http://127.0.0.1/ || true)
echo "  API health check     HTTP $HEALTH"
echo "  Home page            HTTP $HOME_PAGE"
[ "$HEALTH" = 200 ] && [ "$HOME_PAGE" = 200 ] || die "The site isn't answering yet. Check: journalctl -u mcss-daphne -n 50"

cat <<EOF

=====================================================================
 Done. The site is live at:  http://$PUBLIC_HOST/
 Everyone logs in with the same accounts and passwords as before.
=====================================================================

LAST STEP: point GitHub's automatic deploys at this server.
On GitHub open: https://github.com/younglix/mcss/settings/secrets/actions
and update these three repository secrets:
    EC2_HOST     $PUBLIC_HOST
    EC2_USER     $APP_USER
    EC2_SSH_KEY  everything between the two lines below, including
                 the BEGIN and END lines
-----------------------------------------------------------------------
$(cat "$ACTIONS_KEY")
-----------------------------------------------------------------------
Then delete it from this server:   rm $ACTIONS_KEY $ACTIONS_KEY.pub
Keep that key private. Don't paste it into any chat or email.

Then carry on with deploy/README.md, step 4.
EOF
