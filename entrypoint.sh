#!/bin/sh
set -e

echo "Clearing and caching configuration..."
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Running database migrations..."
php artisan migrate --force || echo "⚠️ Migration failed (check DB connection)."

echo "Creating storage link..."
php artisan storage:link || true

echo "Starting Apache..."
exec "$@"
