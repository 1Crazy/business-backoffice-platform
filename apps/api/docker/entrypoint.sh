#!/bin/sh
set -eu

cd /app

echo "Generating Prisma client..."
pnpm --filter @scrm/api prisma generate

echo "Applying database migrations..."
pnpm --filter @scrm/api prisma migrate deploy

echo "Seeding base data..."
pnpm --filter @scrm/api prisma db seed

echo "Starting SCRM API..."
exec pnpm --filter @scrm/api start

