#!/bin/sh
# Apply Prisma migrations to the persisted SQLite DB, then start the server.
set -e

echo "[entrypoint] applying database migrations..."
npx prisma migrate deploy --schema=prisma/schema.prisma || \
  echo "[entrypoint] migrate deploy skipped/failed (continuing)"

# Optional: seed only when SEED=true (mock data)
if [ "${SEED:-false}" = "true" ]; then
  echo "[entrypoint] seeding mock data..."
  npm run db:seed --workspace=server || echo "[entrypoint] seed skipped"
fi

echo "[entrypoint] starting: $*"
exec "$@"
