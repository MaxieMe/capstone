echo "install dependencies..."

composer install
npm install
composer require tightenco/ziggy

npm run build
npm i rechart
npm install recharts @types/recharts

php artisan key:generate
yes | php artisan storage:link

php artisan migrate:fresh
yes | php artisan migrate
php artisan db:seed
php artisan config:clear
php artisan cache:clear

composer run dev


echo "installation completed!"
