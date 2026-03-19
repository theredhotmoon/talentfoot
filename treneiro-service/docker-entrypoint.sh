#!/bin/bash
set -e

# Generate .env file from environment variables if it doesn't exist
if [ ! -f /app/.env ]; then
    cat > /app/.env <<EOF
APP_NAME="${APP_NAME:-TalentFoot}"
APP_ENV="${APP_ENV:-production}"
APP_KEY="${APP_KEY}"
APP_DEBUG="${APP_DEBUG:-false}"
APP_URL="${APP_URL:-http://localhost:8000}"

LOG_CHANNEL="${LOG_CHANNEL:-stack}"
LOG_LEVEL="${LOG_LEVEL:-warning}"

DB_CONNECTION="${DB_CONNECTION:-sqlite}"

CACHE_DRIVER="${CACHE_DRIVER:-file}"
SESSION_DRIVER="${SESSION_DRIVER:-file}"
SESSION_LIFETIME="${SESSION_LIFETIME:-120}"
QUEUE_CONNECTION="${QUEUE_CONNECTION:-sync}"

FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-}"
GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-}"
GOOGLE_REDIRECT_URI="${GOOGLE_REDIRECT_URI:-}"
EOF

    # Only append database config if explicitly provided by user,
    # otherwise Laravel defaults handle it perfectly (esp. for SQLite)
    if [ -n "${DB_HOST:-}" ]; then echo "DB_HOST=\"${DB_HOST}\"" >> /app/.env; fi
    if [ -n "${DB_PORT:-}" ]; then echo "DB_PORT=\"${DB_PORT}\"" >> /app/.env; fi
    if [ -n "${DB_DATABASE:-}" ]; then echo "DB_DATABASE=\"${DB_DATABASE}\"" >> /app/.env; fi
    if [ -n "${DB_USERNAME:-}" ]; then echo "DB_USERNAME=\"${DB_USERNAME}\"" >> /app/.env; fi
    if [ -n "${DB_PASSWORD:-}" ]; then echo "DB_PASSWORD=\"${DB_PASSWORD}\"" >> /app/.env; fi

    chown www-data:www-data /app/.env
    echo "Generated .env from environment variables"
fi

# Ensure SQLite database exists and is writable if using SQLite
if [ "${DB_CONNECTION:-sqlite}" = "sqlite" ]; then
    mkdir -p /app/database
    if [ ! -f /app/database/database.sqlite ]; then
        echo "Creating missing database.sqlite..."
        touch /app/database/database.sqlite
    fi
    # Ensure Apache can write to the DB and its directory (for journal files)
    chown -R www-data:www-data /app/database
    chmod -R 775 /app/database
fi

# Run migrations if database exists
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    echo "Running migrations..."
    php artisan migrate --force
fi

# Cache config for production
if [ "${APP_ENV}" = "production" ]; then
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
fi

# Start Apache
exec apache2-foreground
