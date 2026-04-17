# Hostinger VPS Setup Guide — TalentFoot / Trenejro

## Stack overview
| Layer | Technology |
|---|---|
| OS | Ubuntu 22.04 LTS |
| Web server | Nginx |
| Backend | Laravel 9 (PHP 8.1) |
| Database | MySQL 8.0 |
| Frontend | Vue 3 (served as static files by Nginx) |
| SSL | Let's Encrypt (Certbot) |
| Process manager | Supervisor (Laravel queue worker) |

---

## 1. Initial server access

Log in to your VPS from your local machine:
```bash
ssh root@YOUR_VPS_IP
```

Update all packages:
```bash
apt update && apt upgrade -y
```

---

## 2. Create a deploy user (recommended)

Running everything as `root` is risky. Create a dedicated user:
```bash
adduser deploy
usermod -aG sudo deploy
# Copy root's SSH keys to the new user
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

From now on, SSH as `deploy`:
```bash
ssh deploy@YOUR_VPS_IP
```

---

## 3. Install required software

### PHP 8.1 + extensions
```bash
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y php8.1 php8.1-fpm php8.1-mysql php8.1-xml \
  php8.1-mbstring php8.1-bcmath php8.1-curl php8.1-zip \
  php8.1-tokenizer php8.1-fileinfo php8.1-ctype php8.1-json \
  php8.1-intl php8.1-gd

php -v   # should print PHP 8.1.x
```

### Composer
```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
composer --version
```

### MySQL 8.0
```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation
# Follow prompts: set root password, remove anonymous users, disable remote root login
```

Create the application database and user:
```bash
sudo mysql -u root -p
```
```sql
CREATE DATABASE talentfoot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'talentfoot'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON talentfoot.* TO 'talentfoot'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Node.js 20 (needed for any frontend build tooling on VPS — optional)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # should print v20.x.x
```

### Nginx
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Certbot (SSL)
```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

## 4. Configure firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'   # allows both HTTP (80) and HTTPS (443)
sudo ufw enable
sudo ufw status
```

---

## 5. Deploy the backend (Laravel)

### Clone the repository
```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git talentfoot
sudo chown -R deploy:deploy /var/www/talentfoot
```

If your repo is **private**, you'll need a GitHub deploy key:
```bash
# On VPS, generate a key pair
ssh-keygen -t ed25519 -C "vps-deploy" -f ~/.ssh/github_deploy

# Print the public key and add it to GitHub:
# GitHub repo → Settings → Deploy keys → Add deploy key (read-only)
cat ~/.ssh/github_deploy.pub

# Tell SSH to use this key for GitHub
cat >> ~/.ssh/config << 'EOF'
Host github.com
  IdentityFile ~/.ssh/github_deploy
  StrictHostKeyChecking no
EOF
```

### Install PHP dependencies
```bash
cd /var/www/talentfoot/talentfoot/treneiro-service
composer install --no-dev --optimize-autoloader
```

### Configure environment
```bash
cp .env.example .env
nano .env
```

Set these values in `.env`:
```dotenv
APP_NAME=TalentFoot
APP_ENV=production
APP_KEY=          # leave empty for now, generated below
APP_DEBUG=false
APP_URL=https://api.yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=talentfoot
DB_USERNAME=talentfoot
DB_PASSWORD=STRONG_PASSWORD_HERE

# CORS — allow requests from your frontend domain
SANCTUM_STATEFUL_DOMAINS=yourdomain.com,www.yourdomain.com
SESSION_DOMAIN=.yourdomain.com
```

Generate app key and run migrations:
```bash
php artisan key:generate
php artisan migrate --force
php artisan db:seed --force    # only if you have seeders for initial data
```

### Set permissions
```bash
sudo chown -R www-data:www-data /var/www/talentfoot/talentfoot/treneiro-service/storage
sudo chown -R www-data:www-data /var/www/talentfoot/talentfoot/treneiro-service/bootstrap/cache
sudo chmod -R 775 /var/www/talentfoot/talentfoot/treneiro-service/storage
sudo chmod -R 775 /var/www/talentfoot/talentfoot/treneiro-service/bootstrap/cache
```

### Optimize for production
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 6. Configure Nginx

Create the site configuration:
```bash
sudo nano /etc/nginx/sites-available/talentfoot
```

Paste the following (replace domain names):
```nginx
# ─── BACKEND (Laravel API) ───────────────────────────────────────
server {
    listen 80;
    server_name api.yourdomain.com;
    root /var/www/talentfoot/talentfoot/treneiro-service/public;
    index index.php;

    client_max_body_size 100M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }
}

# ─── FRONTEND (Vue static files) ─────────────────────────────────
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/talentfoot-frontend;
    index index.html;

    # Vue Router — send all paths to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets aggressively
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site and test:
```bash
sudo ln -s /etc/nginx/sites-available/talentfoot /etc/nginx/sites-enabled/
sudo nginx -t      # must print "syntax is ok"
sudo systemctl reload nginx
```

---

## 7. Create frontend directory

The GitHub Actions pipeline will rsync the built Vue app here:
```bash
sudo mkdir -p /var/www/talentfoot-frontend
sudo chown -R deploy:www-data /var/www/talentfoot-frontend
sudo chmod -R 755 /var/www/talentfoot-frontend
```

---

## 8. SSL with Let's Encrypt

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

Certbot will automatically update your Nginx config to redirect HTTP → HTTPS. Certificates auto-renew every 90 days.

Test auto-renewal:
```bash
sudo certbot renew --dry-run
```

---

## 9. PHP-FPM configuration

Ensure PHP-FPM is running and set to start on boot:
```bash
sudo systemctl enable php8.1-fpm
sudo systemctl start php8.1-fpm
sudo systemctl status php8.1-fpm   # should say "active (running)"
```

---

## 10. Set up GitHub Actions secrets

Now that the server is configured, add these secrets to your GitHub repo
(Settings → Secrets and variables → Actions):

| Secret | Value |
|---|---|
| `VPS_HOST` | Your VPS IP address |
| `VPS_USER` | `deploy` (or whichever user you set up) |
| `VPS_SSH_KEY` | Contents of your local `~/.ssh/id_rsa` (or deploy key private key) |
| `VPS_FRONTEND_PATH` | `/var/www/talentfoot-frontend` |
| `VPS_BACKEND_PATH` | `/var/www/talentfoot/talentfoot/treneiro-service` |
| `VPS_API_URL` | `https://api.yourdomain.com` |

---

## 11. Verify the setup

Check everything is running:
```bash
sudo systemctl status nginx          # web server
sudo systemctl status php8.1-fpm     # PHP processor
sudo systemctl status mysql          # database

# Test that Laravel responds
curl -I http://api.yourdomain.com/api/

# Check Nginx error logs if something goes wrong
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/www/talentfoot/talentfoot/treneiro-service/storage/logs/laravel.log
```

---

## 12. (Optional) Supervisor for queue workers

If you use Laravel queues, keep workers running with Supervisor:
```bash
sudo apt install -y supervisor
```

Create a config:
```bash
sudo nano /etc/supervisor/conf.d/talentfoot-worker.conf
```
```ini
[program:talentfoot-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/talentfoot/talentfoot/treneiro-service/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/log/supervisor/talentfoot-worker.log
stopwaitsecs=3600
```
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start talentfoot-worker:*
```

---

## Quick reference — useful commands on VPS

```bash
# Reload Nginx after config changes
sudo systemctl reload nginx

# Manually redeploy backend (same as what CI does)
cd /var/www/talentfoot/talentfoot/treneiro-service
git pull origin main
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache && php artisan route:cache && php artisan view:cache

# View live Laravel logs
tail -f storage/logs/laravel.log

# View live Nginx access logs
sudo tail -f /var/log/nginx/access.log
```
