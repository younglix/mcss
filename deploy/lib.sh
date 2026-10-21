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

# dump_pg_major FILE  -> the PostgreSQL major version (e.g. 17) needed to
# restore a custom-format pg_dump file: the newer of the server it was dumped
# from and the pg_dump that wrote it. Prints nothing if the header can't be
# read. It's read straight from the file, because an older pg_restore can't
# open a newer dump at all ("unsupported version (1.16) in file header").
dump_pg_major() {
    python3 - "$1" <<'PY'
import re, sys
try:
    f = open(sys.argv[1], "rb")
    if f.read(5) != b"PGDMP":
        sys.exit(0)
    vmaj, vmin, _vrev, int_size, _off_size, _fmt = f.read(6)
    version = (vmaj, vmin)

    def read_int():  # a sign byte, then int_size bytes, least significant first
        sign = f.read(1)[0]
        value = int.from_bytes(f.read(int_size), "little")
        return -value if sign else value

    def read_str():
        n = read_int()
        return f.read(n) if n > 0 else b""

    if version >= (1, 15):
        f.read(1)          # compression algorithm
    else:
        read_int()         # compression level
    for _ in range(7):     # creation time
        read_int()
    read_str()             # database name
    if version >= (1, 10):
        # The server's version, then pg_dump's, e.g. b"17.2" or b"16.4 (Ubuntu ...)"
        majors = [re.match(rb"(\d+)", read_str()) for _ in range(2)]
        majors = [int(m.group(1)) for m in majors if m]
        if majors:
            print(max(majors))
except Exception:
    pass
PY
}
