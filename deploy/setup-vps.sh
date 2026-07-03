#!/bin/bash
# LocalWheels Enterprise v1.0 — Hostinger VPS Setup Script
#
# Run as root ONCE on a fresh Ubuntu 22.04 VPS.
# After this script completes, use deploy.sh for all future deploys.
#
# Usage:
#   chmod +x deploy/setup-vps.sh
#   sudo bash deploy/setup-vps.sh

set -euo pipefail

DOMAIN_API="api.yourdomain.com"
DOMAIN_APP="app.yourdomain.com"
APP_DIR="/var/www/localwheels"
LOG_DIR="/var/log/localwheels"
APP_USER="localwheels"
NODE_VERSION="20"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   LocalWheels VPS Setup — Ubuntu 22.04                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ── 1. System update ──────────────────────────────────────────────────────────
echo "── [1/12] System update ─────────────────────────────────────────"
apt-get update -q && apt-get upgrade -y -q
apt-get install -y -q curl git wget unzip build-essential ufw fail2ban

# ── 2. Node.js LTS ───────────────────────────────────────────────────────────
echo "── [2/12] Node.js ${NODE_VERSION} LTS ──────────────────────────────────────"
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt-get install -y -q nodejs
echo "  Node: $(node -v)   npm: $(npm -v)"

# ── 3. PM2 ───────────────────────────────────────────────────────────────────
echo "── [3/12] PM2 ───────────────────────────────────────────────────"
npm install -g pm2
echo "  PM2: $(pm2 -v)"

# ── 4. Nginx ─────────────────────────────────────────────────────────────────
echo "── [4/12] Nginx ─────────────────────────────────────────────────"
apt-get install -y -q nginx
systemctl enable nginx
echo "  Nginx: $(nginx -v 2>&1)"

# ── 5. Certbot ───────────────────────────────────────────────────────────────
echo "── [5/12] Certbot ───────────────────────────────────────────────"
apt-get install -y -q certbot python3-certbot-nginx
echo "  Certbot: $(certbot --version)"

# ── 6. Redis ─────────────────────────────────────────────────────────────────
echo "── [6/12] Redis ─────────────────────────────────────────────────"
apt-get install -y -q redis-server

# Configure Redis persistence and password
REDIS_PASS=$(openssl rand -base64 32)
cat >> /etc/redis/redis.conf << REDIS
requirepass ${REDIS_PASS}
appendonly yes
appendfsync everysec
save 900 1
save 300 10
save 60 10000
maxmemory 256mb
maxmemory-policy allkeys-lru
REDIS

systemctl enable redis-server
systemctl restart redis-server
echo "  Redis password set (save to .env as REDIS_URL=redis://:${REDIS_PASS}@127.0.0.1:6379)"

# ── 7. Firewall ───────────────────────────────────────────────────────────────
echo "── [7/12] UFW Firewall ──────────────────────────────────────────"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
# Block direct Node.js port from outside (only Nginx proxies to it)
ufw deny 5000
ufw --force enable
ufw status
echo "  Firewall configured. Port 5000 internal only."

# ── 8. Fail2Ban ───────────────────────────────────────────────────────────────
echo "── [8/12] Fail2Ban ──────────────────────────────────────────────"
cat > /etc/fail2ban/jail.local << 'FAIL2BAN'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5
destemail = root@localhost
action = %(action_mw)s

[sshd]
enabled = true
port    = ssh
logpath = %(sshd_log)s

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
filter  = nginx-limit-req
logpath = /var/log/nginx/localwheels-api-error.log
FAIL2BAN

systemctl enable fail2ban
systemctl restart fail2ban
echo "  Fail2Ban active"

# ── 9. App user + directories ─────────────────────────────────────────────────
echo "── [9/12] App user + directories ───────────────────────────────"
id -u ${APP_USER} &>/dev/null || useradd -r -s /bin/bash -m -d /home/${APP_USER} ${APP_USER}
mkdir -p ${APP_DIR} ${LOG_DIR}
chown -R ${APP_USER}:${APP_USER} ${APP_DIR} ${LOG_DIR}
chmod 750 ${APP_DIR}
echo "  App dir: ${APP_DIR}"
echo "  Log dir: ${LOG_DIR}"

# ── 10. Log rotation ─────────────────────────────────────────────────────────
echo "── [10/12] Logrotate ────────────────────────────────────────────"
cat > /etc/logrotate.d/localwheels << LOGROTATE
${LOG_DIR}/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 ${APP_USER} ${APP_USER}
    postrotate
        pm2 reloadLogs
    endscript
}

/var/log/nginx/localwheels-*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 \$(cat /var/run/nginx.pid)
    endscript
}
LOGROTATE
echo "  Logrotate configured (14-day retention)"

# ── 11. SSH hardening ─────────────────────────────────────────────────────────
echo "── [11/12] SSH hardening ────────────────────────────────────────"
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/'           /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/'  /etc/ssh/sshd_config
systemctl restart sshd
echo "  Root login disabled. Password auth disabled. (Ensure SSH key is in authorized_keys before logging out!)"

# ── 12. Summary ───────────────────────────────────────────────────────────────
echo ""
echo "── [12/12] Setup complete ───────────────────────────────────────"
echo ""
echo "  Next steps:"
echo "  1. Add SSH public key to /root/.ssh/authorized_keys"
echo "  2. Clone repo: git clone <repo-url> ${APP_DIR}"
echo "  3. Create ${APP_DIR}/backend/.env (see deploy/env.example)"
echo "  4. Add REDIS_URL=redis://:${REDIS_PASS}@127.0.0.1:6379 to .env"
echo "  5. Install SSL: certbot --nginx -d ${DOMAIN_API} -d ${DOMAIN_APP}"
echo "  6. Copy nginx config: cp ${APP_DIR}/deploy/nginx.conf /etc/nginx/sites-available/localwheels"
echo "  7. Enable site: ln -sf /etc/nginx/sites-available/localwheels /etc/nginx/sites-enabled/"
echo "  8. Reload nginx: nginx -t && systemctl reload nginx"
echo "  9. Start app: cd ${APP_DIR} && pm2 start deploy/ecosystem.config.js --env production"
echo "  10. Save PM2: pm2 save && pm2 startup"
echo "  11. Run validation: node backend/production-validate.js https://${DOMAIN_API} admin pass"
echo ""
echo "  ⚠️  Save the Redis password above — add it to backend/.env"
echo ""
