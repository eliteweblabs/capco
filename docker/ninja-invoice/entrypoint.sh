#!/bin/bash

# Ninja Invoice Entrypoint Script

# Set proper permissions
chown -R www-data:www-data /var/www
chmod -R 755 /var/www/storage
chmod -R 755 /var/www/bootstrap/cache

# Generate application key if not exists
if [ ! -f /var/www/.env ]; then
    cp /var/www/.env.example /var/www/.env
    php artisan key:generate
fi

# Run database migrations
php artisan migrate --force

# Clear and cache config
php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start supervisor
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
