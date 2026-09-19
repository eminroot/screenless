#!/usr/bin/env bash
#
# Pushes this folder to the server and runs the installer there. Run it here,
# not on the box.
#
#   bash deploy/push.sh root@<server-ip>
#   bash deploy/push.sh root@hub.your-domain.tld
#
# Needs nothing on the server but ssh and rsync. Everything else the installer
# fetches for itself.

set -euo pipefail

TARGET="${1:-}"
if [[ -z "$TARGET" ]]; then
  echo "usage: bash deploy/push.sh user@host" >&2
  exit 1
fi

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> tests first"
( cd "$HERE" && npm test >/dev/null ) || {
  echo "tests failed; not deploying" >&2
  exit 1
}

echo "==> copying to $TARGET:/tmp/screenless-hub"
rsync -az --delete \
  --exclude 'data/' \
  --exclude 'node_modules/' \
  --exclude '.git/' \
  "$HERE"/ "$TARGET":/tmp/screenless-hub/

echo "==> installing"
ssh "$TARGET" 'sudo bash /tmp/screenless-hub/deploy/install.sh'

echo
echo "done. check it from here:"
echo "  curl http://${TARGET#*@}/v1/health"
