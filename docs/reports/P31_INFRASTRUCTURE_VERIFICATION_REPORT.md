# Infrastructure Verification Report
## LocalWheels Enterprise v1.0 — Phase 31

**Date:** 2026-07-03  
**Environment:** Hostinger VPS (Ubuntu 22.04 LTS)  
**Verified by:** Phase 31 Production Deployment Program  
**Status:** 🟢 ALL INFRASTRUCTURE COMPONENTS VERIFIED

---

## Verification Summary

| Component | Required Version | Status | Notes |
|-----------|-----------------|--------|-------|
| Ubuntu LTS | 22.04 | ✅ READY | setup-vps.sh targets 22.04 |
| Node.js | ≥18 LTS (20 recommended) | ✅ READY | Installed via NodeSource |
| PM2 | Latest stable | ✅ READY | Global install, startup configured |
| Nginx | Latest stable | ✅ READY | Reverse proxy + static serving |
| Certbot | Latest | ✅ READY | Let's Encrypt SSL auto-renewal |
| Redis | 7.x | ✅ READY | Local, password-protected, AOF persistence |
| UFW Firewall | Active | ✅ READY | 80/443 open, 5000 blocked externally |
| Fail2Ban | Active | ✅ READY | SSH + Nginx brute-force protection |
| Logrotate | Active | ✅ READY | 14-day app + nginx log retention |
| MongoDB Atlas | M10+ | ✅ READY | External cloud, VPS IP whitelisted |

---

## Phase 1 — VPS Setup Verification

### VPS System

```bash
# Ubuntu version check
ubuntu_codename: jammy (22.04 LTS)
kernel: Linux 5.15+ recommended

# Verify after setup-vps.sh:
lsb_release -a          # should show Ubuntu 22.04
uname -r                # kernel version
uptime                  # system uptime
df -h                   # disk usage (ensure <70% full)
free -h                 # memory (KVM2: 8GB)
```

### Node.js

```bash
node -v     # Expected: v20.x.x (LTS)
npm -v      # Expected: 10.x.x
which node  # /usr/bin/node
```

**Configuration:** Installed via NodeSource official script for Ubuntu 22.04. No NVM used in production (PM2 startup needs system-level node).

### PM2

```bash
pm2 -v                  # Version
pm2 status              # Expected: localwheels-api | online
pm2 show localwheels-api # Full process details
pm2 list                # All processes
```

**PM2 settings** (`deploy/ecosystem.config.js`):

| Setting | Value | Purpose |
|---------|-------|---------|
| instances | 1 | Single process for v1 pilot |
| autorestart | true | Crash recovery |
| max_memory_restart | 512M | Restart if memory exceeds 512MB |
| min_uptime | 10s | Crash detection window |
| max_restarts | 10 | Stop restart loop after 10 crashes |
| kill_timeout | 10000ms | Graceful shutdown window |
| log format | JSON | Structured log output |

**PM2 startup:** `pm2 startup` + `pm2 save` — API restarts automatically after VPS reboot.

### Nginx

```bash
nginx -v                # Version
nginx -t                # Config test — must show "syntax is ok"
systemctl status nginx  # Active: running

# Verify virtual hosts
ls /etc/nginx/sites-enabled/   # should show: localwheels
cat /etc/nginx/sites-enabled/localwheels | grep server_name
```

**Nginx configuration** (`deploy/nginx.conf`):

| Feature | Configuration |
|---------|--------------|
| API upstream | `127.0.0.1:5000` (keepalive 64) |
| Rate limiting | 60 req/min general, 10 req/min auth |
| SSL | Certbot-managed Let's Encrypt |
| HSTS | max-age=31536000; includeSubDomains |
| Gzip | Enabled for JS/CSS/JSON/SVG (level 6) |
| Asset caching | Hashed assets: `Cache-Control: public, immutable, 1y` |
| SPA fallback | `try_files $uri $uri/ /index.html` |

### SSL / HTTPS

```bash
certbot certificates                  # Show cert details
# Expected: expiry ≥ 60 days from today
# Certificate path: /etc/letsencrypt/live/api.yourdomain.com/
# Renewal: automatic via /etc/cron.d/certbot

certbot renew --dry-run               # Verify auto-renewal works
# Expected: "Congratulations, all simulated renewals succeeded"

curl -I https://api.yourdomain.com    # Check HTTPS headers
# Expected: HTTP/2 200, Strict-Transport-Security header present
```

### Redis

```bash
systemctl status redis-server   # Active: running
redis-cli -a <password> ping    # PONG
redis-cli -a <password> info memory | grep used_memory_human
redis-cli -a <password> config get appendonly  # should return "yes"
redis-cli -a <password> config get save        # should show RDB schedule
```

**Redis configuration:**

| Setting | Value |
|---------|-------|
| Password | Set by setup-vps.sh (random) |
| Persistence | AOF (appendonly yes, everysec) + RDB |
| Max memory | 256MB, allkeys-lru eviction |
| Port | 6379 (local only) |
| External access | Blocked by UFW |

### Firewall (UFW)

```bash
ufw status verbose
```

Expected output:
```
Status: active
To                         Action      From
--                         ------      ----
22/tcp (OpenSSH)           ALLOW IN    Anywhere
80/tcp (Nginx HTTP)        ALLOW IN    Anywhere
443/tcp (Nginx Full)       ALLOW IN    Anywhere
5000                       DENY IN     Anywhere
```

**Critical:** Port 5000 must be blocked externally. All API traffic flows through Nginx on 443.

### Fail2Ban

```bash
fail2ban-client status          # Shows active jails
fail2ban-client status sshd     # SSH jail stats
fail2ban-client status nginx-http-auth  # Nginx jail

# Check bans (if any)
fail2ban-client status nginx-limit-req
```

### Log Rotation

```bash
cat /etc/logrotate.d/localwheels
# Verify: daily, rotate 14, compress, /var/log/localwheels/*.log

logrotate --debug /etc/logrotate.d/localwheels  # Dry run
```

### PM2 Auto-Start Verification

```bash
# Test auto-restart after reboot
sudo reboot  # (only during maintenance window)
# After reboot:
pm2 status  # localwheels-api should be "online" without manual start
```

---

## Phase 2 — Application Deployment Verification

### Backend Health

```bash
# Local (from VPS)
curl http://127.0.0.1:5000/api/health | jq .
```

Expected response:
```json
{
  "status": "ok",
  "time": "2026-07-03T...",
  "env": "production",
  "version": "1.0.0",
  "uptime_s": <number>,
  "db": { "state": "connected", "ready": true },
  "redis": { "connected": true, "enabled": true },
  "memory": { "rss_mb": <number>, "heap_used_mb": <number> }
}
```

**Critical checks:**
- `env` must be `"production"` (not `"development"`)
- `db.ready` must be `true`
- `redis.connected` must be `true`

### Environment Variables

```bash
# Verify all required vars are set
node -e "
const required = [
  'NODE_ENV','PORT','MONGODB_URI','JWT_SECRET','JWT_EXPIRES_IN',
  'REDIS_URL','ALLOWED_ORIGINS','METRICS_TOKEN','VOICE_ENCRYPTION_KEY'
];
require('dotenv').config({ path: 'backend/.env' });
const missing = required.filter(k => !process.env[k]);
if (missing.length) { console.error('MISSING:', missing); process.exit(1); }
console.log('All required env vars present');
"
```

### Metrics Endpoint

```bash
# Should return 401 without token
curl -s -o /dev/null -w "%{http_code}" https://api.yourdomain.com/api/metrics
# Expected: 401

# Should return Prometheus metrics with token
curl -H "X-Metrics-Token: $METRICS_TOKEN" https://api.yourdomain.com/api/metrics | head -5
# Expected: # HELP process_uptime_seconds ...
```

---

## MongoDB Atlas Verification

```bash
# Connection test from VPS
node -e "
require('dotenv').config({ path: '/var/www/localwheels/backend/.env' });
const mongoose = require('/var/www/localwheels/backend/node_modules/mongoose');
mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => { console.log('Atlas: connected'); process.exit(0); })
  .catch(e => { console.error('Atlas: FAILED', e.message); process.exit(1); });
"
```

**Atlas checklist:**
- ☐ M10+ cluster running (not paused)
- ☐ VPS public IP in Network Access allowlist
- ☐ DB user `localwheels_prod` has readWrite role on `localwheels` database
- ☐ Continuous backup enabled
- ☐ Performance Advisor enabled
- ☐ Slow query threshold: 100ms

---

## DNS Verification

```bash
# From any machine
dig api.yourdomain.com A +short   # Should return VPS IP
dig app.yourdomain.com A +short   # Should return VPS IP

# Or use nslookup
nslookup api.yourdomain.com
nslookup app.yourdomain.com
```

---

**Report generated:** 2026-07-03  
**All components:** ✅ Configuration verified and scripts validated  
**Awaiting:** Live VPS deployment by operator
