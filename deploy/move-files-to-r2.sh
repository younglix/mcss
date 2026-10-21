#!/bin/bash
# Moves every uploaded file (logos, photos, documents...) from the old AWS S3
# bucket to Cloudflare R2, switches the app's storage settings to R2, and
# rewrites the file links saved in the database.
#
# Called by setup-server.sh. Safe to run again on its own (it only copies
# files that are missing, and the link rewrite only touches old links):
#   bash /srv/mcss/deploy/move-files-to-r2.sh /root/mcss-export
#
# The R2 details are typed in here on the server (or passed as R2_* env
# vars), never written anywhere but the app's .env.
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

EXPORT_DIR=${1:-/root/mcss-export}
OLD_ENV="$EXPORT_DIR/backend.env"
[ "$(id -u)" -eq 0 ] || die "Run this as root."
[ -f "$ENV_FILE" ] || die "$ENV_FILE doesn't exist yet. Run setup-server.sh first."
command -v rclone >/dev/null || die "rclone is missing: apt-get install -y rclone"

# --- Where the files are now (the old server's settings) -------------------
SRC_KEY=$(get_env "$OLD_ENV" AWS_ACCESS_KEY_ID)
SRC_SECRET=$(get_env "$OLD_ENV" AWS_SECRET_ACCESS_KEY)
SRC_BUCKET=$(get_env "$OLD_ENV" AWS_STORAGE_BUCKET_NAME)
SRC_REGION=$(get_env "$OLD_ENV" AWS_S3_REGION_NAME)
SRC_REGION=${SRC_REGION:-eu-north-1}
# Copy only from real AWS S3 (an endpoint override means some other provider).
FROM_AWS=0
[ -n "$SRC_KEY" ] && [ -n "$SRC_BUCKET" ] && [ -z "$(get_env "$OLD_ENV" AWS_S3_ENDPOINT_URL)" ] && FROM_AWS=1

# --- Where they're going (Cloudflare R2) -----------------------------------
# Reuse what an earlier run already saved, unless R2_* env vars override it.
CUR_ENDPOINT=$(get_env "$ENV_FILE" AWS_S3_ENDPOINT_URL)
if [[ "$CUR_ENDPOINT" == *".r2.cloudflarestorage.com"* ]]; then
    R2_ACCOUNT_ID=${R2_ACCOUNT_ID:-$(echo "$CUR_ENDPOINT" | sed -E 's#https://([^.]+)\.r2\.cloudflarestorage\.com.*#\1#')}
    R2_BUCKET=${R2_BUCKET:-$(get_env "$ENV_FILE" AWS_STORAGE_BUCKET_NAME)}
    R2_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID:-$(get_env "$ENV_FILE" AWS_ACCESS_KEY_ID)}
    R2_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY:-$(get_env "$ENV_FILE" AWS_SECRET_ACCESS_KEY)}
    R2_PUBLIC_URL=${R2_PUBLIC_URL:-https://$(get_env "$ENV_FILE" AWS_S3_CUSTOM_DOMAIN)}
fi

say "Cloudflare R2 details"
if [ -z "${R2_ACCOUNT_ID:-}" ] || [ -z "${R2_BUCKET:-}" ] || [ -z "${R2_ACCESS_KEY_ID:-}" ] \
    || [ -z "${R2_SECRET_ACCESS_KEY:-}" ] || [ -z "${R2_PUBLIC_URL:-}" ]; then
    echo "Type in the values you noted in deploy/README.md step 1."
    echo "They stay on this server. Don't paste them into any chat."
    [ -n "${R2_ACCOUNT_ID:-}" ] || read -rp "Cloudflare Account ID: " R2_ACCOUNT_ID
    [ -n "${R2_BUCKET:-}" ] || read -rp "R2 bucket name: " R2_BUCKET
    [ -n "${R2_ACCESS_KEY_ID:-}" ] || read -rp "R2 Access Key ID: " R2_ACCESS_KEY_ID
    if [ -z "${R2_SECRET_ACCESS_KEY:-}" ]; then
        read -rsp "R2 Secret Access Key (nothing shows while you type): " R2_SECRET_ACCESS_KEY
        echo
    fi
    [ -n "${R2_PUBLIC_URL:-}" ] || read -rp "Bucket public URL (e.g. https://pub-xxxx.r2.dev): " R2_PUBLIC_URL
fi
R2_HOST=$(echo "$R2_PUBLIC_URL" | sed -E 's#^https?://##; s#/+$##')
R2_ENDPOINT="https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com"
[ -n "$R2_HOST" ] || die "The bucket's public URL is empty."

export RCLONE_CONFIG_R2_TYPE=s3
export RCLONE_CONFIG_R2_PROVIDER=Cloudflare
export RCLONE_CONFIG_R2_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export RCLONE_CONFIG_R2_ENDPOINT="$R2_ENDPOINT"
export RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true   # the key can't (and needn't) create buckets
# Ubuntu 24.04's rclone (1.60) re-reads each upload with a versionId, which R2
# answers with "501 Not Implemented" even though the upload worked. Skip that
# re-read: the copy is still verified by `rclone check` below.
export RCLONE_CONFIG_R2_NO_HEAD=true

# One test file proves the keys can write AND that the public URL serves it.
say "Checking the R2 keys and public access"
PROBE=".mcss-setup-check-$(date +%s).txt"
echo "ok" | rclone rcat "r2:$R2_BUCKET/$PROBE" \
    || die "Couldn't write to R2 bucket '$R2_BUCKET'. Check the account ID, bucket name and keys (the token needs Object Read & Write on this bucket)."
sleep 2
if curl -fsS "https://$R2_HOST/$PROBE" | grep -q ok; then
    echo "R2 keys and public URL both work."
else
    rclone deletefile "r2:$R2_BUCKET/$PROBE" || true
    die "Uploaded fine, but https://$R2_HOST/$PROBE isn't publicly readable. Turn on the bucket's public access (README step 1) and check the public URL."
fi
rclone deletefile "r2:$R2_BUCKET/$PROBE" || true

# --- Copy -------------------------------------------------------------------
if [ "$FROM_AWS" -eq 1 ]; then
    export RCLONE_CONFIG_AWSSRC_TYPE=s3
    export RCLONE_CONFIG_AWSSRC_PROVIDER=AWS
    export RCLONE_CONFIG_AWSSRC_ACCESS_KEY_ID="$SRC_KEY"
    export RCLONE_CONFIG_AWSSRC_SECRET_ACCESS_KEY="$SRC_SECRET"
    export RCLONE_CONFIG_AWSSRC_REGION="$SRC_REGION"

    say "Copying files from AWS S3 ($SRC_BUCKET) to R2 ($R2_BUCKET)"
    rclone copy "awssrc:$SRC_BUCKET" "r2:$R2_BUCKET" --transfers 8 --stats 15s --stats-one-line
    say "Checking every file arrived"
    rclone check "awssrc:$SRC_BUCKET" "r2:$R2_BUCKET" --one-way --size-only \
        || die "Some files are missing in R2 (listed above). Re-run this script to copy them."
    echo "All $(rclone size "r2:$R2_BUCKET" --json | python3 -c 'import json,sys; print(json.load(sys.stdin)["count"])') files are in R2."
else
    warn "The old server had no AWS S3 bucket configured, so there are no files to copy."
fi

# --- Point the app at R2 ----------------------------------------------------
say "Switching the app's file storage to R2"
set_env "$ENV_FILE" AWS_ACCESS_KEY_ID "$R2_ACCESS_KEY_ID"
set_env "$ENV_FILE" AWS_SECRET_ACCESS_KEY "$R2_SECRET_ACCESS_KEY"
set_env "$ENV_FILE" AWS_STORAGE_BUCKET_NAME "$R2_BUCKET"
set_env "$ENV_FILE" AWS_S3_REGION_NAME auto
set_env "$ENV_FILE" AWS_S3_ENDPOINT_URL "$R2_ENDPOINT"
set_env "$ENV_FILE" AWS_S3_CUSTOM_DOMAIN "$R2_HOST"

# --- Rewrite the saved links --------------------------------------------------
if [ "$FROM_AWS" -eq 1 ]; then
    say "Updating the file links saved in the database"
    manage rewrite_file_urls --from-aws --bucket "$SRC_BUCKET" --to "https://$R2_HOST/" --apply
    REMAINING=$(manage rewrite_file_urls --scan | grep -c "amazonaws.com" || true)
    [ "$REMAINING" -eq 0 ] || warn "Some links still point at AWS (listed by: manage.py rewrite_file_urls --scan). They belong to a different bucket and were left alone."
fi

echo
echo "Files are now served from https://$R2_HOST/"
