# 1. BUILD STAGE (Gumagamit ng PHP-Apache base image para sa unified setup)
FROM php:8.3-apache AS composer

# Install System Dependencies (para sa Composer, Node, at Extensions BUILD)
RUN apt-get update && apt-get install -y \
    git \
    libzip-dev \
    unzip \
    # Node/NPM ay kailangan dito para makita ng mga NPM packages ang Node sa build process
    nodejs \
    npm \
    # 🚨 FIX PARA SA 'libpng' ERROR: DEVELOPMENT PACKAGES NG GD
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    zlib1g-dev \
    # Iba pang karaniwang kailangan
    libonig-dev

# Install Composer globally
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy application code
COPY . /var/www/html

# Run Composer installation
RUN composer install --no-dev --prefer-dist --ignore-platform-reqs

# 🚨 I-INSTALL ANG PHP EXTENSIONS (FIX PARA SA 'could not find driver')
RUN docker-php-ext-install pdo pdo_mysql zip opcache exif bcmath pcntl mbstring \
    # I-configure at I-install ang GD Extension
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd

# ----------------------------------------------------------------------------------------------------

# 2. APPLICATION STAGE (Ang Final, Optimized Image)
FROM php:8.3-apache AS final

# 🚨 FIX PARA SA 'npm: not found' ERROR: I-INSTALL ULIT ANG NODE/NPM SA FINAL STAGE
# Dahil ang final stage ay nag-uumpisa sa "clean slate" at hindi kasama ang Node/NPM
RUN apt-get update && apt-get install -y nodejs npm

# Copy code and vendor from build stage
WORKDIR /var/www/html
COPY --from=composer /var/www/html /var/www/html

# I-copy ang Composer executable (para sa artisan commands)
COPY --from=composer /usr/bin/composer /usr/bin/composer

# 🚨 Frontend Build (Vite/NPM) - GAGANA NA ITO NGAYON
RUN npm install
RUN npm run build

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# 🚨 APACHE CONFIGURATION (FIX PARA SA 'No open HTTP ports')
RUN a2enmod rewrite
# I-copy ang custom VHost config
COPY 000-default.conf /etc/apache2/sites-available/000-default.conf
# Tiyakin na ang 000-default.conf ay nasa root folder mo!
RUN a2dissite 000-default.conf
RUN a2ensite 000-default.conf

# 🚨 COPY ENTRYPOINT SCRIPT (Para sa Migrations)
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Expose standard HTTP port 80
EXPOSE 80

# Run the entrypoint script
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Default command (Ito ang magpapatakbo ng Apache)
CMD ["apache2-foreground"]
