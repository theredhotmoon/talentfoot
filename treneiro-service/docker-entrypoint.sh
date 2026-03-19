#!/bin/bash
set -e

# Always generate .env from environment variables to ensure fresh config
cat > /app/.env <<EOF
APP_NAME="${APP_NAME:-TalentFoot}"
APP_ENV="${APP_ENV:-production}"
APP_KEY="${APP_KEY}"
APP_DEBUG="${APP_DEBUG:-false}"
APP_URL="${APP_URL:-http://localhost:8000}"

LOG_CHANNEL="${LOG_CHANNEL:-stack}"
LOG_LEVEL="${LOG_LEVEL:-warning}"

DB_CONNECTION="${DB_CONNECTION:-mysql}"
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-3306}"
DB_DATABASE="${DB_DATABASE:-talentfoot}"
DB_USERNAME="${DB_USERNAME:-root}"
DB_PASSWORD="${DB_PASSWORD:-secret}"

CACHE_DRIVER="${CACHE_DRIVER:-file}"
SESSION_DRIVER="${SESSION_DRIVER:-file}"
SESSION_LIFETIME="${SESSION_LIFETIME:-120}"
QUEUE_CONNECTION="${QUEUE_CONNECTION:-sync}"

FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-}"
GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-}"
GOOGLE_REDIRECT_URI="${GOOGLE_REDIRECT_URI:-}"
EOF

chown www-data:www-data /app/.env
echo "Generated .env from environment variables"

# Run migrations
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
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
