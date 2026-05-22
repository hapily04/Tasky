#!/bin/sh
# Pterodactyl startup — must use LF line endings (not CRLF).
APP_DIR="${APP_DIR:-/home/container/app}"
CONTAINER_ROOT="$(cd "$APP_DIR/.." && pwd)"
DATA_DIR="$CONTAINER_ROOT/data"

cd "$APP_DIR" || exit 1

ln -sf ../.env .env 2>/dev/null || true

mkdir -p "$DATA_DIR"
export DATABASE_URL="file:${DATA_DIR}/tasky.db"
rm -f "$APP_DIR/prisma/tasky.db" "$APP_DIR/prisma/tasky.db-journal" 2>/dev/null || true

export NPM_CONFIG_CACHE="$APP_DIR/.npm"
export npm_config_cache="$APP_DIR/.npm"
export XDG_CACHE_HOME="$APP_DIR/.cache"

echo "[tasky] Database: ${DATA_DIR}/tasky.db"

npm install || exit 1
npm run build || exit 1
npx prisma db push --skip-generate || exit 1

exec node "$APP_DIR/scripts/next-start.mjs"
