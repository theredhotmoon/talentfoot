# GitHub Actions CI/CD Setup Guide

## Overview

The pipeline (`.github/workflows/ci-cd.yml`) runs automatically on every push to `master`:

1. **test-backend** — PHPUnit tests (Laravel)
2. **test-frontend** — Playwright E2E tests (Vue + real backend)
3. **build-frontend** — `npm run build` → Vue production bundle
4. **deploy** — rsync frontend + SSH backend deploy to your Hostinger VPS

PRs to master run only jobs 1 & 2 (tests only, no deploy).

---

## Step 1 — Add GitHub Secrets

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**.

Add these 5 secrets:

| Secret name          | Value                                                      |
|----------------------|------------------------------------------------------------|
| `VPS_HOST`           | Your VPS IP address (e.g. `123.45.67.89`)                 |
| `VPS_USER`           | SSH username (e.g. `root` or `ubuntu`)                     |
| `VPS_SSH_KEY`        | Your **private** SSH key (full contents of `id_rsa`)       |
| `VPS_FRONTEND_PATH`  | Absolute path on VPS for frontend (e.g. `/var/www/treneiro-web-app/dist`) |
| `VPS_BACKEND_PATH`   | Absolute path on VPS for backend (e.g. `/var/www/treneiro-service`)       |
| `VPS_API_URL`        | Your backend public URL (e.g. `https://api.yourdomain.com`)               |

---

## Step 2 — Set up SSH access on your VPS

On your **local machine**, generate a dedicated deploy key (or reuse an existing one):

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/talentfoot_deploy
```

Then add the **public key** to your VPS:

```bash
ssh-copy-id -i ~/.ssh/talentfoot_deploy.pub your-user@your-vps-ip
# or manually:
cat ~/.ssh/talentfoot_deploy.pub | ssh your-user@your-vps-ip "cat >> ~/.ssh/authorized_keys"
```

Copy the **private key** (`talentfoot_deploy`) into the `VPS_SSH_KEY` GitHub secret.

---

## Step 3 — Prepare the VPS

### Backend (Laravel)
Your backend directory on the VPS should already be a git clone of the repo:

```bash
cd /var/www
git clone https://github.com/YOUR_USER/YOUR_REPO.git treneiro-service
cd treneiro-service/talentfoot/treneiro-service
cp .env.example .env
# Edit .env with real DB credentials, APP_KEY, etc.
php artisan key:generate
composer install --no-dev
php artisan migrate
```

### Frontend (Nginx)
Create the directory and configure Nginx to serve it:

```bash
mkdir -p /var/www/treneiro-web-app/dist
```

Example Nginx config (`/etc/nginx/sites-available/talentfoot`):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/treneiro-web-app/dist;
    index index.html;

    # Vue Router — send all requests to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to Laravel backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Step 4 — Push the workflow

```bash
git add .github/
git commit -m "Add GitHub Actions CI/CD pipeline"
git push origin master
```

The pipeline will trigger immediately. Watch it at: **GitHub repo → Actions tab**.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| E2E tests fail on DB seed | Make sure your Laravel seeders create `admin@admin.com` and `testuser@talentfoot.com` |
| SSH permission denied | Check VPS `~/.ssh/authorized_keys` contains the public key; check `VPS_SSH_KEY` secret has no extra whitespace |
| Frontend build fails | Check `VITE_API_BASE_URL` secret matches your actual API URL |
| `git pull` fails on VPS | Ensure the VPS user has read access to the repo (use a GitHub deploy key if private repo) |

---

## Optional: Skip E2E in CI temporarily

If E2E tests are too slow or flaky, you can comment them out in the workflow and run only PHPUnit:

```yaml
# test-frontend:   ← comment out this entire job
```

And in the `build-frontend` job change:
```yaml
needs: [test-backend]   # remove test-frontend dependency
```
