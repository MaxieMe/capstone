# 1. BUILD STAGE
FROM php:8.3-apache AS build

RUN apt-get update && apt-get install -y \
    git libzip-dev unzip nodejs npm libpng-dev libjpeg-dev libfreetype6-dev zlib1g-dev libonig-dev

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .

RUN composer install --no-dev --prefer-dist --ignore-platform-reqs
RUN docker-php-ext-install pdo pdo_mysql zip opcache exif bcmath pcntl mbstring \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd

# 2. FINAL STAGE
FROM php:8.3-apache AS final

RUN apt-get update && apt-get install -y nodejs npm

WORKDIR /var/www/html
COPY --from=build /var/www/html /var/www/html
COPY --from=build /usr/bin/composer /usr/bin/composer

RUN npm install && npm run build

RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

RUN a2enmod rewrite
COPY 000-default.conf /etc/apache2/sites-available/000-default.conf
RUN a2ensite 000-default.conf

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["apache2-foreground"]
