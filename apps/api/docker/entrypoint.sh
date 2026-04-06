#!/bin/sh
set -eu

cd /app

echo "Generating Prisma client..."
pnpm --filter platform-api prisma generate

echo "Applying database migrations..."
pnpm --filter platform-api prisma migrate deploy

echo "Seeding base data..."
pnpm --filter platform-api prisma db seed

echo "Starting business platform API..."
exec pnpm --filter platform-api start
