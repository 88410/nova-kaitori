#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
LIVE_DIR="${LIVE_DIR:-/var/www/novakai}"
STAMP="${STAMP:-$(TZ=Asia/Shanghai date '+%Y-%m-%d %H:%M CST')}"
PUBLIC_URL="${PUBLIC_URL:-https://novakai.net}"

if [[ ! -d "$FRONTEND_DIR" ]]; then
  echo "Frontend directory not found: $FRONTEND_DIR" >&2
  exit 1
fi

if [[ ! -d "$LIVE_DIR" ]]; then
  echo "Live directory not found: $LIVE_DIR" >&2
  exit 1
fi

echo "Building frontend with version timestamp: $STAMP"
cd "$FRONTEND_DIR"
VITE_APP_VERSION_UPDATED_AT="$STAMP" npm run build

echo "Syncing dist/ to $LIVE_DIR"
rsync -a --delete "$FRONTEND_DIR/dist/" "$LIVE_DIR/"

echo "Deployment completed."
echo "Version timestamp: $STAMP"
echo "Live directory: $LIVE_DIR"
echo "Suggested verification:"
echo "  curl -s $PUBLIC_URL | sed -n '1,40p'"
