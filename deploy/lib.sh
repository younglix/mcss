# Shared helpers for the deploy/ scripts. Source it; don't run it.
# (The variables below are used by the scripts that source this file.)
# shellcheck disable=SC2034

APP_DIR=/srv/mcss
APP_USER=mcss
DB_NAME=mcss_erp
ENV_FILE=$APP_DIR/backend/.env

say() { printf '\n\033[1m--- %s ---\033[0m\n' "$*"; }
warn() { printf '\033[33m%s\033[0m\n' "$*"; }
die() { printf '\n\033[31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

# get_env FILE KEY  -> prints the value (quotes stripped), or nothing.
get_env() {
    KEY="$2" python3 - "$1" <<'PY'
import os, sys
key = os.environ["KEY"]
try:
    lines = open(sys.argv[1]).read().splitlines()
except FileNotFoundError:
    sys.exit(0)
for line in lines:
    if line.startswith(key + "="):
        print(line.split("=", 1)[1].strip().strip('"').strip("'"))
        break
PY
}

# set_env FILE KEY VALUE  -> replaces KEY's line, or appends it. The value
# goes through the environment, not argv, so secrets never show up in `ps`.
set_env() {
    KEY="$2" VAL="$3" python3 - "$1" <<'PY'
import os, sys
path, key, val = sys.argv[1], os.environ["KEY"], os.environ["VAL"]
lines = open(path).read().splitlines() if os.path.exists(path) else []
out, done = [], False
for line in lines:
    if line.startswith(key + "="):
        if not done:
            out.append(f"{key}={val}")
            done = True
    else:
        out.append(line)
if not done:
    out.append(f"{key}={val}")
with open(path, "w") as f:  # rewrites in place: owner and mode are kept
    f.write("\n".join(out) + "\n")
PY
}

# set_env_if_missing FILE KEY VALUE  -> only when KEY isn't set at all.
set_env_if_missing() {
    grep -qE "^$2=" "$1" 2>/dev/null || set_env "$1" "$2" "$3"
}

# add_to_list FILE KEY ITEM  -> adds ITEM to a comma-separated list value.
add_to_list() {
    local current
    current=$(get_env "$1" "$2")
    case ",$current," in
        *",$3,"*) return 0 ;;
    esac
    set_env "$1" "$2" "${current:+$current,}$3"
}

# manage ARGS...  -> runs manage.py as the app user with production settings.
manage() {
    (cd "$APP_DIR/backend" && sudo -u "$APP_USER" -H env DJANGO_SETTINGS_MODULE=config.settings.prod \
        "$APP_DIR/backend/.venv/bin/python" manage.py "$@")
}
