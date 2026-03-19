#!/bin/bash
set -e

# ============================================================
# Dependency & Environment Health Check
# ============================================================
echo "========================================"
echo "  Dependency Health Check"
echo "========================================"

CHECKS_PASSED=true

# --- Required PHP Extensions ---
REQUIRED_EXTENSIONS="fileinfo pdo_mysql zip bcmath mbstring tokenizer json openssl"
for ext in $REQUIRED_EXTENSIONS; do
    if php -m 2>/dev/null | grep -qi "^${ext}$"; then
        echo "  [PASS] PHP ext: $ext"
    else
        echo "  [FAIL] PHP ext: $ext is NOT loaded!"
        CHECKS_PASSED=false
    fi
done

# --- PHP Upload / Memory Limits ---
check_php_limit() {
    local setting_name=$1
    local min_bytes=$2
    local label=$3

    local raw_value
    raw_value=$(php -r "echo ini_get('${setting_name}');" 2>/dev/null)

    # Convert shorthand (e.g. 64M) to bytes
    local numeric_value
    numeric_value=$(php -r "
        \$v = trim('${raw_value}');
        \$unit = strtolower(substr(\$v, -1));
        \$n = (int)\$v;
        switch(\$unit) {
            case 'g': \$n *= 1073741824; break;
            case 'm': \$n *= 1048576; break;
            case 'k': \$n *= 1024; break;
        }
        echo \$n;
    " 2>/dev/null)

    if [ "$numeric_value" -ge "$min_bytes" ] 2>/dev/null; then
        echo "  [PASS] $label = $raw_value"
    else
        echo "  [FAIL] $label = $raw_value (need >= $3)"
        CHECKS_PASSED=false
    fi
}

check_php_limit "upload_max_filesize" 52428800 "upload_max_filesize (min 50M)"
check_php_limit "post_max_size"       52428800 "post_max_size (min 50M)"
check_php_limit "memory_limit"        134217728 "memory_limit (min 128M)"

# --- Required Writable Directories ---
WRITABLE_DIRS="/app/storage/app/public/clips /app/storage/app/public/subclips /app/storage/app/public/thumbnails /app/storage/app/public/captions /app/storage/logs /app/bootstrap/cache"
for dir in $WRITABLE_DIRS; do
    if [ -d "$dir" ] && [ -w "$dir" ]; then
        echo "  [PASS] Writable: $dir"
    elif [ ! -d "$dir" ]; then
        echo "  [WARN] Dir missing: $dir (creating...)"
        mkdir -p "$dir"
        chown www-data:www-data "$dir"
        chmod 775 "$dir"
    else
        echo "  [FAIL] Not writable: $dir"
        CHECKS_PASSED=false
    fi
done

echo "========================================"
if [ "$CHECKS_PASSED" = true ]; then
    echo "  All dependency checks PASSED ✓"
else
    echo "  WARNING: Some checks FAILED!"
    echo "  The application may not work correctly."
    echo "  Review the failures above and fix the Docker image."
fi
echo "========================================\n"

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

# Ensure storage symlink exists (volumes may override the one created at build time)
php artisan storage:link --force 2>/dev/null || true

# Run migrations and seed
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "Running migrations..."
    php artisan migrate --force
    echo "Seeding database..."
    php artisan db:seed --force
fi

# Cache config for production
if [ "${APP_ENV}" = "production" ]; then
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
fi

# Fix permissions after artisan commands (entrypoint runs as root, Apache as www-data)
mkdir -p /app/storage/framework/sessions \
         /app/storage/framework/views \
         /app/storage/framework/cache/data \
         /app/storage/logs \
         /app/bootstrap/cache
chown -R www-data:www-data /app/storage /app/bootstrap/cache
chmod -R 775 /app/storage /app/bootstrap/cache

# Start Apache
exec apache2-foreground
