#!/bin/sh
set -eu

UPLOAD_PATH="${UPLOAD_DIR:-/app/storage}"

mkdir -p "$UPLOAD_PATH"

npx prisma db push --skip-generate

if [ -n "${SEED_SUPER_ADMIN_EMAIL:-}" ] && [ -n "${SEED_SUPER_ADMIN_PASSWORD:-}" ]; then
  npm run db:seed
fi

exec npx next start -H 0.0.0.0 -p "${PORT:-3000}"
