# Hostinger VPS Deployment Guide
## LocalWheels Enterprise v1.0

**Date:** 2026-07-03  
**Target:** Hostinger VPS (Ubuntu 22.04 LTS)  
**Stack:** Node.js + PM2 + Nginx + Certbot + Redis + MongoDB Atlas

---

## Architecture

```
Internet
   │  HTTPS 443
   ▼
Nginx (reverse proxy + static files)
   │  HTTP 127.0.0.1:5000
   ▼
PM2 → Node.js API (backend/src/index.js)
   │                    │
   ▼                    ▼
MongoDB Atlas       Redis (localhost)
(cloud, M10+)       (session cache)
```

**Domains:**
- Frontend SPA: `https://app.yourdomain.com` — served directly by Nginx from `/var/www/localwheels/dist`
- Backend API:  `https://api.yourdomain.com` — Nginx proxies to Node.js on port 5000

---

## Prerequisites

- Hostinger VPS plan (KVM 2 minimum: 2 vCPU, 8GB RAM, 100GB NVMe)
- Ubuntu 22.04 LTS installed
- Domain pointing to VPS IP (A records for `app.` and `api.` subdomains)
- MongoDB Atlas M10+ cluster provisioned
- SSH key pair generated

---

## Step-by-Step Deployment

### Phase 1 — Initial VPS Setup (run once)

```bash
# 1. SSH into VPS as root
ssh root@<vps-ip>

# 2. Clone the repo
git clone https://github.com/vinofyx/localwheels /var/www/localwheels
cd /var/www/localwheels

# 3. Run setup script (installs Node.js, PM2, Nginx, Certbot, Redis, UFW, Fail2Ban)
chmod +x deploy/setup-vps.sh
bash deploy/setup-vps.sh

# Script output will show the Redis password — copy it immediately.
```

### Phase 2 — Configure Environment

```bash
# Create production .env from template
cp /var/www/localwheels/deploy/env.example /var/www/localwheels/backend/.env

# Edit with actual values
nano /var/www/localwheels/backend/.env
```

**Required values to fill in:**

| Variable | How to get it |
|----------|--------------|
| `MONGODB_URI` | MongoDB Atlas → Connect → Drivers → Node.js |
| `JWT_SECRET` | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `REDIS_URL` | Use password printed by setup-vps.sh |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys |
| `CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys |
| `ALLOWED_ORIGINS` | `https://app.yourdomain.com` |
| `METRICS_TOKEN` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

### Phase 3 — MongoDB Atlas: Whitelist VPS IP

```bash
# Get VPS public IP
curl -s https://api.ipify.org

# In MongoDB Atlas:
# Security → Network Access → Add IP Address → paste VPS IP
# Comment: "Hostinger VPS production"
```

### Phase 4 — SSL Certificates

```bash
# Copy Nginx config
cp /var/www/localwheels/deploy/nginx.conf /etc/nginx/sites-available/localwheels
# Edit: replace yourdomain.com with actual domain
nano /etc/nginx/sites-available/localwheels

# Enable site (remove default)
ln -sf /etc/nginx/sites-available/localwheels /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
nginx -t

# Get SSL certificates
certbot --nginx -d api.yourdomain.com -d app.yourdomain.com \
  --non-interactive --agree-tos --email admin@yourdomain.com

# Verify auto-renewal
certbot renew --dry-run
```

### Phase 5 — Build Frontend

```bash
cd /var/www/localwheels/frontend

# Set production env for Vite build
cat > .env.production << 'ENV'
VITE_API_URL=https://api.yourdomain.com/api
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxx
ENV

npm ci
npm run build
# Output goes to /var/www/localwheels/dist (Vite outDir: '../dist')

# Verify
ls -lh /var/www/localwheels/dist/
```

### Phase 6 — Start Backend with PM2

```bash
cd /var/www/localwheels

# Install backend dependencies
cd backend && npm ci --omit=dev && cd ..

# Start with PM2
pm2 start deploy/ecosystem.config.js --env production

# Watch startup logs
pm2 logs localwheels-api --lines 20

# Save PM2 process list
pm2 save

# Configure PM2 to start on server reboot
pm2 startup
# Copy and run the command PM2 outputs

# Verify
pm2 status
```

### Phase 7 — Reload Nginx

```bash
nginx -t && systemctl reload nginx
echo "Nginx reloaded"
```

### Phase 8 — Seed First Customer

```bash
cd /var/www/localwheels
node backend/src/db/seed-production.js
```

### Phase 9 — Production Validation

```bash
# Smoke test (17 checks)
node backend/smoke-test.js https://api.yourdomain.com rajdhani_admin "password" 

# Full validation (27 checks)
node backend/production-validate.js https://api.yourdomain.com rajdhani_admin "password"
# Expected: 27/27 ALL CLEAR
```

---

## Configure Daily Backups

```bash
# Add cron job for nightly backup at 2am
crontab -e

# Add this line:
0 2 * * * BACKUP_PASSPHRASE="your-passphrase" /var/www/localwheels/deploy/backup.sh >> /var/log/localwheels/backup.log 2>&1

# Set backup passphrase also in .env:
echo "BACKUP_PASSPHRASE=your-passphrase" >> /var/www/localwheels/backend/.env
```

---

## Configure Prometheus + Grafana (optional)

```bash
# Install Prometheus
apt install -y prometheus
cp /var/www/localwheels/monitoring/prometheus.yml /etc/prometheus/prometheus.yml
# Edit: add METRICS_TOKEN in authorization section
systemctl restart prometheus

# Install Grafana
apt-get install -y adduser libfontconfig1
wget https://dl.grafana.com/oss/release/grafana_10.0.0_amd64.deb
dpkg -i grafana_10.0.0_amd64.deb
systemctl enable grafana-server
systemctl start grafana-server
# Access: http://your-vps-ip:3000 (user: admin / admin)
```

---

## Useful Commands

```bash
# PM2 process management
pm2 status                          # Process list + CPU/memory
pm2 logs localwheels-api --lines 50 # Recent logs
pm2 reload localwheels-api          # Zero-downtime restart
pm2 restart localwheels-api         # Hard restart
pm2 monit                           # Real-time dashboard

# Nginx
nginx -t                            # Test config
systemctl reload nginx              # Reload config (no downtime)
systemctl status nginx              # Service status
tail -f /var/log/nginx/localwheels-api-error.log

# Logs
tail -f /var/log/localwheels/api-out.log    # App stdout
tail -f /var/log/localwheels/api-err.log    # App stderr
journalctl -u nginx -f                      # Nginx system logs

# Health check
curl https://api.yourdomain.com/api/health | jq .

# SSL renewal
certbot renew                       # Manual renewal (auto via cron)
certbot certificates                # Check expiry

# Redis
redis-cli -a <password> ping        # Should return PONG
redis-cli -a <password> info memory # Memory usage

# Backup
bash /var/www/localwheels/deploy/backup.sh
ls -lh /var/backups/localwheels/
```

---

## Future Deploys (after initial setup)

Every subsequent deploy is one command:

```bash
ssh user@your-vps-ip "bash /var/www/localwheels/deploy/deploy.sh"
```

Or via git push if you configure a post-receive hook.

---

## Environment Variables Reference

See `deploy/env.example` for the full annotated list.  
Live file location on VPS: `/var/www/localwheels/backend/.env`

---

**Prepared by:** LocalWheels Engineering  
**Last updated:** 2026-07-03
