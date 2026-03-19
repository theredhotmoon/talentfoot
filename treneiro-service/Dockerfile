# ============================================================
# Stage 1: Install Composer dependencies
# ============================================================
FROM php:8.2-cli AS deps

# Install system deps needed by Composer and PHP extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        unzip \
        libzip-dev \
        libsqlite3-dev \
    && docker-php-ext-install zip \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --no-interaction

COPY . .

RUN composer dump-autoload --optimize --no-dev

# ============================================================
# Stage 2: Production image — PHP 8.2 + Apache
# ============================================================
FROM php:8.2-apache AS production

# Install system deps & PHP extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
        libsqlite3-dev \
        libzip-dev \
        unzip \
        curl \
        ffmpeg \
    && docker-php-ext-install \
        pdo_sqlite \
        pdo_mysql \
        zip \
        bcmath \
        fileinfo \
    && apt-get purge -y --auto-remove \
    && rm -rf /var/lib/apt/lists/*

# PHP upload & execution limits for video uploads
COPY docker-php-uploads.ini /usr/local/etc/php/conf.d/uploads.ini

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Configure Apache — serve from /app/public on port 8000
ENV APACHE_DOCUMENT_ROOT=/app/public
RUN sed -ri -e 's!80!8000!g' /etc/apache2/ports.conf \
    && sed -ri -e 's!:80>!:8000>!g' /etc/apache2/sites-available/000-default.conf \
    && sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
        /etc/apache2/sites-available/000-default.conf \
        /etc/apache2/apache2.conf

# Add AllowOverride for .htaccess
RUN echo '<Directory /app/public>\n\
    Options Indexes FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' >> /etc/apache2/apache2.conf

WORKDIR /app

# Copy application from deps stage
COPY --from=deps /app/vendor ./vendor
COPY . .

# Create storage directories & set permissions
RUN mkdir -p \
        storage/app/public/clips \
        storage/app/public/subclips \
        storage/app/public/captions \
        storage/app/public/thumbnails \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        bootstrap/cache \
        database \
    && chown -R www-data:www-data storage bootstrap/cache database \
    && chmod -R 775 storage bootstrap/cache

# Create SQLite database if it doesn't exist
RUN touch database/database.sqlite \
    && chown www-data:www-data database/database.sqlite

# Create storage symlink
RUN php artisan storage:link 2>/dev/null || true

# Copy and prepare entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
    CMD curl -f http://localhost:8000/ || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
