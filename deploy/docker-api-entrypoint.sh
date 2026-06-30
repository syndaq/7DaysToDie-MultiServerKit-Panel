#!/bin/sh
set -e
cd /app
npx prisma db push --schema=./prisma/schema.prisma
cd /app/apps/api
exec "$@"
