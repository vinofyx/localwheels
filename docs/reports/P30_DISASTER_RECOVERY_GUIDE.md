# Disaster Recovery Guide
## LocalWheels Enterprise v1.0 — Hostinger VPS

**Date:** 2026-07-03  
**RTO (Recovery Time Objective):** 4 hours  
**RPO (Recovery Point Objective):** 24 hours (nightly backup) / real-time (Atlas continuous)

---

## Disaster Scenarios

### Scenario 1 — VPS Unreachable / Crashed

**Symptoms:** SSH fails, all endpoints timeout, UptimeRobot alerts.

**Recovery:**

```bash
# 1. Hostinger panel → Reboot VPS (takes ~2 min)
# 2. SSH back in after reboot
ssh user@<vps-ip>

# 3. Check services
pm2 status
systemctl status nginx
systemctl status redis-server

# 4. If PM2 didn't auto-start:
pm2 resurrect  # restores last saved process list
# or
cd /var/www/localwheels && pm2 start deploy/ecosystem.config.js --env production

# 5. If Nginx didn't auto-start:
systemctl start nginx

# 6. If Redis didn't auto-start:
systemctl start redis-server

# 7. Verify
curl http://127.0.0.1:5000/api/health
```

**Why PM2 should auto-restart:** `pm2 startup` + `pm2 save` ensures PM2 starts on boot.  
**Why services should auto-restart:** `systemctl enable nginx redis-server` ensures auto-start.

---

### Scenario 2 — VPS Disk Full

**Symptoms:** API returns 500, PM2 logs show ENOSPC, `df -h` shows 100%.

```bash
# Check disk usage
df -h
du -sh /var/log/localwheels/* | sort -hr
du -sh /var/backups/localwheels/* | sort -hr

# Clear old logs (logrotate should handle this automatically)
find /var/log/localwheels -name "*.log" -mtime +7 -delete

# Clear old backups
find /var/backups/localwheels -maxdepth 1 -type d -mtime +7 -exec rm -rf {} +

# Clear PM2 logs
pm2 flush

# Clear npm cache
npm cache clean --force

# Restart API
pm2 restart localwheels-api
```

---

### Scenario 3 — MongoDB Atlas Outage

**Symptoms:** `/api/health` returns `db.ready: false`, login fails.

```bash
# 1. Check Atlas status
# Visit: https://status.mongodb.com

# 2. Check health response
curl https://api.yourdomain.com/api/health | jq .db

# 3. If Atlas is up but connection fails — check IP whitelist
# Atlas → Security → Network Access → verify VPS IP is listed

# 4. Test connection directly
node -e "const m=require('mongoose'); m.connect(process.env.MONGODB_URI).then(()=>console.log('ok')).catch(e=>console.log('fail',e.message));" 

# 5. If Atlas is down — wait for Atlas SLA restoration
# Atlas M10+ SLA: 99.95% uptime
# Monitor: https://status.mongodb.com
```

---

### Scenario 4 — SSL Certificate Expired

**Symptoms:** Browser shows "Your connection is not private", HTTPS fails.

```bash
# Check expiry
certbot certificates

# Manual renewal
certbot renew

# Force renewal if within 30 days
certbot renew --force-renewal

# Reload Nginx
systemctl reload nginx

# Verify
curl -I https://api.yourdomain.com
```

**Prevention:** Certbot auto-renews via cron at `/etc/cron.d/certbot`. Verify with:
```bash
cat /etc/cron.d/certbot
```

---

### Scenario 5 — VPS Destroyed / Unrecoverable

**Full recovery to a new Hostinger VPS.**

**Time to recovery: 2–4 hours**

```bash
# Step 1: Provision new VPS on Hostinger (same region, same specs)

# Step 2: SSH into new VPS
ssh root@<new-ip>

# Step 3: Clone repo
git clone https://github.com/vinofyx/localwheels /var/www/localwheels

# Step 4: Run setup script
bash /var/www/localwheels/deploy/setup-vps.sh

# Step 5: Restore .env from backup
# Copy env.enc from your backup storage (Dropbox/S3/USB)
scp backup/env.enc root@<new-ip>:/tmp/
openssl enc -d -aes-256-cbc -pbkdf2 \
    -in /tmp/env.enc \
    -out /var/www/localwheels/backend/.env \
    -pass env:BACKUP_PASSPHRASE

# Step 6: Update MongoDB Atlas IP whitelist
# Atlas → Network Access → Replace old IP with new VPS IP

# Step 7: Update DNS A records to new VPS IP
# Domain registrar → DNS → A records for api. and app. subdomains
# DNS propagation: 5–60 minutes

# Step 8: Issue new SSL certs
certbot --nginx -d api.yourdomain.com -d app.yourdomain.com \
    --non-interactive --agree-tos --email admin@yourdomain.com

# Step 9: Build and start
cd /var/www/localwheels
cd backend && npm ci --omit=dev && cd ..
cd frontend && npm ci && npm run build && cd ..
pm2 start deploy/ecosystem.config.js --env production
pm2 save && pm2 startup

# Step 10: Reload Nginx
cp deploy/nginx.conf /etc/nginx/sites-available/localwheels
ln -sf /etc/nginx/sites-available/localwheels /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Step 11: Validate
node backend/production-validate.js https://api.yourdomain.com admin pass
```

---

### Scenario 6 — Data Corruption / Accidental Delete

**Use MongoDB Atlas Point-in-Time Recovery.**

```
1. Log into MongoDB Atlas
2. Clusters → <cluster> → ... → Restore
3. Select "Restore from a point in time"
4. Choose timestamp BEFORE corruption event
5. Restore to a new cluster (never overwrite production directly)
6. Verify data in new cluster
7. Rename / promote new cluster to production
8. Update MONGODB_URI in /var/www/localwheels/backend/.env
9. pm2 restart localwheels-api
10. Verify: curl https://api.yourdomain.com/api/health
```

---

## Backup Inventory

| Backup Type | Frequency | Location | Retention |
|-------------|-----------|----------|-----------|
| MongoDB Atlas continuous | Real-time | Atlas cloud | 7 days (M10+) |
| MongoDB dump (mongodump) | Nightly 2am | /var/backups/localwheels/ | 7 days |
| Application code | Nightly 2am | /var/backups/localwheels/ | 7 days |
| .env (encrypted) | Nightly 2am | /var/backups/localwheels/ | 7 days |
| Off-site copy | Weekly | Manual → Dropbox/USB | 4 weeks |

**Off-site backup:** Copy `/var/backups/localwheels/<latest>/` to Dropbox or external drive weekly. Include:
- `env.enc` (encrypted .env)
- `app.tar.gz`
- Note the `BACKUP_PASSPHRASE` in a secure password manager

---

## DR Test Schedule

Test disaster recovery procedures quarterly.

| Test | Frequency | Last Tested | Result |
|------|-----------|------------|--------|
| PM2 auto-restart after kill | Monthly | ⏳ | |
| SSL renewal dry-run | Monthly | ⏳ | |
| Backup restore (local) | Monthly | ⏳ | |
| Full VPS recovery simulation | Quarterly | ⏳ | |
| Atlas PIT restore test | Quarterly | ⏳ | |

---

## Emergency Contacts

| Role | Contact | When to call |
|------|---------|-------------|
| Engineering | vinofyx@gmail.com | Any P1/P2 incident |
| Hostinger Support | https://hostinger.com/support | VPS hardware/network issues |
| MongoDB Atlas Support | https://support.mongodb.com | Database unavailability |
| Clerk Support | https://clerk.com/support | Auth provider issues |

---

**Owner:** vinofyx@gmail.com  
**Last reviewed:** 2026-07-03  
**Next review:** 2026-08-03
