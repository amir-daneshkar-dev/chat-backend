<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

# Chat Application

## Installation

You can install and run this Laravel project using either [Laravel Sail](https://laravel.com/docs/sail) (a Docker-based local development environment) or a traditional PHP environment.

### Using Laravel Sail

1. **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```
2. **Copy the example environment file and install dependencies:**

    ```bash
    docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v "$(pwd):/var/www/html" \
    -w /var/www/html \
    laravelsail/php83-composer:latest \
    composer install --ignore-platform-reqs

    cp .env.example .env
    ```

3. **Generate application key:**
    ```bash
    ./vendor/bin/sail artisan key:generate
    ./vendor/bin/sail artisan storage:link
    ```
4. **Run migrations (optional):**

    ```bash
    ./vendor/bin/sail artisan migrate
    ./vendor/bin/sail artisan db:seed --class=ApplicationSetupSeeder # required for production server, optional for local
    ./vendor/bin/sail artisan db:seed # for local test env

    ```

5. **Run the application:**

    ```bash
    php artisan serve
    php artisan queue:listen
    php artisan reverb:start --host=0.0.0.0 --port=7789
    ```
