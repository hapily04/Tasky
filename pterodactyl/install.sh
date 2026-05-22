#!/bin/bash
# Tasky install — runs in Pterodactyl's *install* container (path is usually /mnt/server).
set -e

# Install/Reinstall uses /mnt/server; SFTP and the running server use /home/container (same files).
if [ -f /mnt/server/package.json ]; then
  SERVER_ROOT=/mnt/server
elif [ -f /home/container/package.json ]; then
  SERVER_ROOT=/home/container
elif [ -d /mnt/server ]; then
  SERVER_ROOT=/mnt/server
else
  SERVER_ROOT=/home/container
fi

cd "${SERVER_ROOT}"
echo "[tasky] Installing in $(pwd) ..."

if [ "${USER_UPLOAD}" = "1" ]; then
  if [ ! -f package.json ]; then
    echo "[tasky] No package.json here yet."
    echo "[tasky] Upload your project via SFTP to /home/container (package.json at the root)."
    echo "[tasky] Then click Reinstall again."
    echo "[tasky] Contents of $(pwd):"
    ls -la
    exit 0
  fi
  echo "[tasky] USER_UPLOAD=1 — using your uploaded files (no git)."
else
  if [ -z "${GIT_ADDRESS}" ]; then
    echo "[tasky] ERROR: Set GIT_ADDRESS, or set USER_UPLOAD=1 and upload files via SFTP."
    exit 1
  fi
  ADDR="${GIT_ADDRESS}"
  if [[ "${ADDR}" != *.git ]]; then ADDR="${ADDR}.git"; fi

  CLONE_URL="${ADDR}"
  if [ -n "${GIT_TOKEN}" ]; then
    HOST_PATH="$(echo "${ADDR}" | sed -E 's#^https?://##')"
    GIT_USER="${GIT_USERNAME:-x-access-token}"
    CLONE_URL="https://${GIT_USER}:${GIT_TOKEN}@${HOST_PATH}"
    echo "[tasky] Cloning private repository..."
  else
    echo "[tasky] Cloning repository..."
  fi

  if [ -z "$(ls -A . 2>/dev/null | grep -v '^\.')" ]; then
    if [ -n "${GIT_BRANCH}" ]; then
      git clone --single-branch --branch "${GIT_BRANCH}" "${CLONE_URL}" .
    else
      git clone --depth 1 "${CLONE_URL}" .
    fi
  else
    echo "[tasky] Directory not empty — skipping clone."
  fi
fi

npm install

if [ -z "${AUTH_SECRET}" ]; then
  echo "[tasky] WARNING: AUTH_SECRET not set — using temporary build secret. Set AUTH_SECRET in Variables before starting."
  export AUTH_SECRET="temporary-build-secret-change-in-panel"
fi

export DATABASE_URL="${DATABASE_URL:-file:./prisma/tasky.db}"
export BIND_HOST="0.0.0.0"

echo "[tasky] Building production app (this may take a few minutes)..."
npm run build

echo "[tasky] Setting up database..."
npx prisma db push --skip-generate

echo "[tasky] Install complete. Set AUTH_URL to your public URL (with port {{SERVER_PORT}}) then Start the server."
