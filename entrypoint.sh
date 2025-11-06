#!/bin/sh

echo "Clearing and caching configuration..."
# Para ma-clear ang lumang config (cache.php) na nag-error kanina
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 🚨 RUN DATABASE MIGRATIONS
echo "Running database migrations..."
# --force: Kailangan ito para tumakbo ang migration sa production environment
php artisan migrate --force

echo "Creating storage link..."
php artisan storage:link

echo "Starting application..."
# Ito ang magpapatuloy sa pangunahing proseso ng container (e.g., php-fpm)
exec "$@"