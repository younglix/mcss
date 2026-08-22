#!/bin/bash
# Runs ON the server after /srv/mcss/deploy.sh has already fetched and reset
# to the latest origin/main. This half lives in git so deploy steps can
# evolve via normal commits; the bootstrap wrapper that invokes it does not
# (it has to exist before there's anything to pull).
set -euo pipefail

cd /srv/mcss

echo "--- backend ---"
cd backend
./.venv/bin/pip install -q -r requirements.txt
./.venv/bin/python manage.py migrate --noinput
./.venv/bin/python manage.py collectstatic --noinput
cd ..

echo "--- frontend ---"
cd frontend
npm install --no-audit --no-fund --silent
npm run build
cd ..

echo "--- restarting services ---"
sudo systemctl restart mcss-daphne mcss-celery-worker mcss-celery-beat
sudo systemctl reload nginx

echo "Deploy complete: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
