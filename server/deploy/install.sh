#!/usr/bin/env bash
#
# Sets the hub up on a fresh Debian or Ubuntu box. Run it on the server.
#
#   sudo bash install.sh
#
# Idempotent: run it again after a code change and it re-installs the unit and
# restarts the service without touching the database.
#
# What it does
#   - installs Node 22 from nodesource, if node is missing or too old
#   - makes a `screenless` system user that owns nothing but its own data
#   - copies the service into /opt/screenless-hub
#   - puts the database in /var/lib/screenless, which is the only path the
#     unit is allowed to write
#   - installs and starts the systemd unit
#   - installs the nginx site if nginx is present
#
# It does not open the firewall and it does not fetch a certificate. Both are
# one command each and both are decisions rather than steps; see README.md.

set -euo pipefail

APP_DIR=/opt/screenless-hub
DATA_DIR=/var/lib/screenless
SERVICE=screenless-hub
USER_NAME=screenless
NEEDS_NODE_MAJOR=22

say() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

if [[ $EUID -ne 0 ]]; then
  echo "run this with sudo" >&2
  exit 1
fi

# The directory this script lives in is the payload.
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

say "checking node"
node_major=0
if command -v node >/dev/null 2>&1; then
  node_major=$(node -p 'process.versions.node.split(".")[0]')
fi
if (( node_major < NEEDS_NODE_MAJOR )); then
  echo "node $NEEDS_NODE_MAJOR or newer is needed (node:sqlite ships with it); installing"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
else
  echo "node $(node --version) is fine"
fi

say "service user"
if ! id -u "$USER_NAME" >/dev/null 2>&1; then
  useradd --system --home "$DATA_DIR" --shell /usr/sbin/nologin "$USER_NAME"
  echo "created $USER_NAME"
else
  echo "$USER_NAME already exists"
fi

say "files"
mkdir -p "$APP_DIR" "$DATA_DIR"
# --delete keeps a removed source file from lingering on the server, but the
# database lives outside APP_DIR precisely so this cannot reach it.
rsync -a --delete \
  --exclude 'data/' \
  --exclude 'node_modules/' \
  --exclude '.git/' \
  "$SRC"/ "$APP_DIR"/
chown -R root:root "$APP_DIR"
chown -R "$USER_NAME":"$USER_NAME" "$DATA_DIR"
chmod 750 "$DATA_DIR"

say "systemd"
install -m 644 "$APP_DIR/deploy/$SERVICE.service" "/etc/systemd/system/$SERVICE.service"
systemctl daemon-reload
systemctl enable "$SERVICE"
systemctl restart "$SERVICE"

if command -v nginx >/dev/null 2>&1; then
  say "nginx"
  install -m 644 "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/screenless-hub
  ln -sf /etc/nginx/sites-available/screenless-hub /etc/nginx/sites-enabled/screenless-hub
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx
else
  say "nginx is not installed; the service is on 127.0.0.1:8080 only"
  echo "install it with: apt-get install -y nginx, then run this script again"
fi

say "health"
sleep 1
if curl -fsS http://127.0.0.1:8080/v1/health; then
  printf '\n\nhub is up. logs: journalctl -u %s -f\n' "$SERVICE"
else
  printf '\n\nthe service did not answer. journalctl -u %s -n 50 --no-pager\n' "$SERVICE"
  exit 1
fi
