# Hostinger VPS Go-Live Checklist
## LocalWheels Enterprise v1.0

**Date:** _(fill on go-live day)_  
**VPS IP:** _______________  
**Domain:** _______________  
**Operator:** _______________

Work through this checklist top to bottom. Do not skip items.

---

## Phase 1 — Infrastructure

| # | Item | Command / Action | ✓ |
|---|------|-----------------|---|
| 1.1 | VPS accessible via SSH | `ssh root@<ip>` | ☐ |
| 1.2 | Ubuntu 22.04 confirmed | `lsb_release -a` | ☐ |
| 1.3 | DNS A record → VPS IP (api subdomain) | `dig api.yourdomain.com` | ☐ |
| 1.4 | DNS A record → VPS IP (app subdomain) | `dig app.yourdomain.com` | ☐ |
| 1.5 | Repo cloned | `ls /var/www/localwheels/` | ☐ |
| 1.6 | setup-vps.sh completed | `node -v && pm2 -v && nginx -v` | ☐ |
| 1.7 | Node.js version ≥ 18 | `node -v` | ☐ |
| 1.8 | PM2 installed globally | `pm2 -v` | ☐ |
| 1.9 | Nginx installed + enabled | `systemctl status nginx` | ☐ |
| 1.10 | Redis running | `redis-cli ping` | ☐ |
| 1.11 | UFW firewall active | `ufw status` | ☐ |
| 1.12 | Port 80 open | `ufw status \| grep 80` | ☐ |
| 1.13 | Port 443 open | `ufw status \| grep 443` | ☐ |
| 1.14 | Port 5000 blocked externally | `curl http://<ip>:5000/api/health` → connection refused | ☐ |
| 1.15 | Fail2Ban running | `systemctl status fail2ban` | ☐ |

---

## Phase 2 — Configuration

| # | Item | Command / Action | ✓ |
|---|------|-----------------|---|
| 2.1 | .env file created | `ls /var/www/localwheels/backend/.env` | ☐ |
| 2.2 | NODE_ENV=production | `grep NODE_ENV /var/www/localwheels/backend/.env` | ☐ |
| 2.3 | MONGODB_URI set | `grep MONGODB_URI /var/www/localwheels/backend/.env` | ☐ |
| 2.4 | JWT_SECRET set (≥64 chars) | `grep JWT_SECRET /var/www/localwheels/backend/.env \| wc -c` | ☐ |
| 2.5 | REDIS_URL set | `grep REDIS_URL /var/www/localwheels/backend/.env` | ☐ |
| 2.6 | ALLOWED_ORIGINS set | `grep ALLOWED_ORIGINS /var/www/localwheels/backend/.env` | ☐ |
| 2.7 | METRICS_TOKEN set | `grep METRICS_TOKEN /var/www/localwheels/backend/.env` | ☐ |
| 2.8 | Clerk keys set (if using Clerk) | `grep CLERK_SECRET_KEY /var/www/localwheels/backend/.env` | ☐ |

---

## Phase 3 — Database

| # | Item | Command / Action | ✓ |
|---|------|-----------------|---|
| 3.1 | MongoDB Atlas M10+ cluster running | Atlas Dashboard → Clusters | ☐ |
| 3.2 | VPS IP whitelisted in Atlas | Atlas → Security → Network Access | ☐ |
| 3.3 | DB user created with readWrite | Atlas → Security → Database Access | ☐ |
| 3.4 | Connection test from VPS | `node -e "require('./backend/src/db/connection')"`  | ☐ |
| 3.5 | Atlas continuous backup enabled | Atlas → Backup | ☐ |

---

## Phase 4 — SSL & Nginx

| # | Item | Command / Action | ✓ |
|---|------|-----------------|---|
| 4.1 | Nginx config deployed | `ls /etc/nginx/sites-enabled/localwheels` | ☐ |
| 4.2 | Domain names updated in nginx.conf | `grep server_name /etc/nginx/sites-available/localwheels` | ☐ |
| 4.3 | Nginx config test passes | `nginx -t` | ☐ |
| 4.4 | SSL certificate issued | `certbot certificates` | ☐ |
| 4.5 | SSL expiry ≥ 60 days | `certbot certificates \| grep Expiry` | ☐ |
| 4.6 | Auto-renewal configured | `certbot renew --dry-run` | ☐ |
| 4.7 | HTTPS redirect active | `curl -I http://api.yourdomain.com` → 301 | ☐ |

---

## Phase 5 — Frontend Build

| # | Item | Command / Action | ✓ |
|---|------|-----------------|---|
| 5.1 | .env.production created in frontend/ | `ls /var/www/localwheels/frontend/.env.production` | ☐ |
| 5.2 | VITE_API_URL set correctly | `grep VITE_API_URL frontend/.env.production` | ☐ |
| 5.3 | Frontend npm ci succeeds | `cd frontend && npm ci` | ☐ |
| 5.4 | Frontend build succeeds | `npm run build` | ☐ |
| 5.5 | dist/ folder populated | `ls /var/www/localwheels/dist/` | ☐ |
| 5.6 | index.html present | `ls /var/www/localwheels/dist/index.html` | ☐ |

---

## Phase 6 — Backend + PM2

| # | Item | Command / Action | ✓ |
|---|------|-----------------|---|
| 6.1 | Backend npm ci succeeds | `cd backend && npm ci --omit=dev` | ☐ |
| 6.2 | PM2 process started | `pm2 start deploy/ecosystem.config.js --env production` | ☐ |
| 6.3 | PM2 shows "online" status | `pm2 status` | ☐ |
| 6.4 | No startup errors in PM2 logs | `pm2 logs localwheels-api --lines 20` | ☐ |
| 6.5 | Local health check passes | `curl http://127.0.0.1:5000/api/health` | ☐ |
| 6.6 | PM2 saved | `pm2 save` | ☐ |
| 6.7 | PM2 startup configured | `pm2 startup` (run generated command) | ☐ |
| 6.8 | Auto-restart verified | `pm2 restart localwheels-api && sleep 5 && pm2 status` | ☐ |

---

## Phase 7 — Production Validation

| # | Item | Command / Action | ✓ |
|---|------|-----------------|---|
| 7.1 | HTTPS health endpoint | `curl https://api.yourdomain.com/api/health` | ☐ |
| 7.2 | env=production in health | `curl .../api/health \| jq .env` → "production" | ☐ |
| 7.3 | db.ready=true in health | `curl .../api/health \| jq .db.ready` → true | ☐ |
| 7.4 | redis.connected in health | `curl .../api/health \| jq .redis.connected` → true | ☐ |
| 7.5 | Frontend loads over HTTPS | Open `https://app.yourdomain.com` in browser | ☐ |
| 7.6 | SPA routing works | Navigate to `https://app.yourdomain.com/login` directly | ☐ |
| 7.7 | Smoke test 17/17 | `node backend/smoke-test.js https://api.yourdomain.com admin pass` | ☐ |
| 7.8 | Full validation 27/27 | `node backend/production-validate.js https://api.yourdomain.com admin pass` | ☐ |
| 7.9 | Login works in browser | Log in with admin credentials | ☐ |
| 7.10 | Dashboard loads | Navigate to Dashboard, verify KPIs | ☐ |
| 7.11 | Metrics endpoint gated | `curl https://api.yourdomain.com/api/metrics` → 401 | ☐ |
| 7.12 | CORS rejects unknown origin | See smoke-test.js CORS check (no --dev flag) | ☐ |

---

## Phase 8 — Customer Onboarding

| # | Item | Command / Action | ✓ |
|---|------|-----------------|---|
| 8.1 | Seed script run | `node backend/src/db/seed-production.js` | ☐ |
| 8.2 | Company ID recorded | _(paste here)_ | ☐ |
| 8.3 | Branch IDs recorded | _(paste here)_ | ☐ |
| 8.4 | Admin login tested | Login with seeded credentials | ☐ |
| 8.5 | SEED_* vars removed from .env | _(after seeding — security)_ | ☐ |

---

## Phase 9 — Monitoring & Backups

| # | Item | Command / Action | ✓ |
|---|------|-----------------|---|
| 9.1 | Daily backup cron configured | `crontab -l \| grep backup` | ☐ |
| 9.2 | First backup successful | `bash deploy/backup.sh` | ☐ |
| 9.3 | Log rotation configured | `cat /etc/logrotate.d/localwheels` | ☐ |
| 9.4 | UptimeRobot monitor created | Monitor `https://api.yourdomain.com/api/health` every 5min | ☐ |
| 9.5 | UptimeRobot alert email set | vinofyx@gmail.com | ☐ |

---

## Phase 10 — Go-Live Sign-Off

| # | Item | ✓ |
|---|------|---|
| 10.1 | All 9 phases above complete | ☐ |
| 10.2 | Production validation 27/27 | ☐ |
| 10.3 | Customer login credentials shared | ☐ |
| 10.4 | 30-day pilot tracker started | ☐ |
| 10.5 | Week 1 report template ready | ☐ |

**Go-Live Authorized By:** _______________  
**Date & Time:** _______________  
**VPS IP:** _______________  
**Backend URL:** _______________  
**Frontend URL:** _______________
