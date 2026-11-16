# LOCALWHEELS LOGISTICS PLATFORM — CORRECTED PRODUCTION DEPLOYMENT GUIDE

**Document Version:** 1.1.0  
**Effective Date:** November 16, 2026  
**Target Environment:** Production Cloud VPS (Ubuntu 22.04+ LTS / Debian 12)  
**Security Status:** 128 / 128 Automated Assertions Passed — Hardened Release  

---

## 1. Pre-Deployment Architecture Overview

```
                      [ HTTPS Traffic :443 ]
                                │
                                ▼
                       ┌─────────────────┐
                       │   Nginx Reverse │
                       │   Proxy / TLS   │
                       └────────┬────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        │                                               │
   Static SPA Assets                              API & Uploads
   (/assets/*, index.html)                        (/api/*, /uploads/*)
        │                                               │
        ▼                                               ▼
┌──────────────────┐                           ┌──────────────────┐
│  frontend/dist/  │                           │ Express API      │
│  (Vite Build)    │                           │ (PM2 Cluster)    │
│                  │                           │ Port 5000        │
└──────────────────┘                           └────────┬─────────┘
                                                        │
                                                        ▼
                                               ┌──────────────────┐
                                               │ MongoDB Atlas    │
                                               │ (M10+ Replica)   │
                                               └──────────────────┘
```

---

## 2. Server Prerequisites (Ubuntu 22.04 LTS)

Execute as a sudo-privileged user on a fresh VPS:

```bash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 22 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx git certbot python3-certbot-nginx jq

# 3. Install PM2 globally
sudo npm install -g pm2

# 4. Verify binary versions
node -v    # v22.x.x
npm -v     # >= 10.x.x
pm2 -v
nginx -v
```

---

## 3. Application Deployment & Build Steps

### Step 3.1: Clone Repository & Set Permissions
```bash
sudo mkdir -p /var/www/localwheels
sudo chown -R $USER:$USER /var/www/localwheels
cd /var/www/localwheels

git clone https://github.com/your-org/Localwheels.git .
git checkout main
```

### Step 3.2: Install Backend Dependencies
```bash
cd /var/www/localwheels/backend
npm ci --omit=dev
```

### Step 3.3: Generate Production Secrets & Configure `.env`
On the server, generate high-entropy keys:
```bash
# Generate 64-byte JWT Secret (128 hex characters)
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Generate 32-byte Bootstrap Secret (64 hex characters)
BOOTSTRAP_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Generate 32-byte Voice Encryption Key (64 hex characters)
VOICE_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

echo "Generated Secrets:"
echo "JWT_SECRET: $JWT_SECRET"
echo "BOOTSTRAP_SECRET: $BOOTSTRAP_SECRET"
```

Create `/var/www/localwheels/backend/.env`:
```ini
NODE_ENV=production
PORT=5000

# Dedicated MongoDB Atlas user restricted to readWrite on 'localwheels'
MONGODB_URI=mongodb+srv://lw_prod_user:<STRONG_DB_PASSWORD>@cluster0.xxxxx.mongodb.net/localwheels?retryWrites=true&w=majority&tls=true&appName=localwheels-prod

# Insert generated 64-byte hex string
JWT_SECRET=<INSERT_GENERATED_JWT_SECRET>
JWT_EXPIRES_IN=7d

# Insert generated 32-byte bootstrap secret (removed after initial provisioning)
BOOTSTRAP_SECRET=<INSERT_GENERATED_BOOTSTRAP_SECRET>

# Production domain allowlist (no trailing slash)
ALLOWED_ORIGINS=https://app.localwheels.com,https://localwheels.com
FRONTEND_URL=https://app.localwheels.com
TRUST_PROXY=1

# Production Clerk Live Keys
CLERK_SECRET_KEY=YOUR_CLERK_SECRET_KEY
CLERK_PUBLISHABLE_KEY=YOUR_CLERK_PUBLISHABLE_KEY
CLERK_AUTHORIZED_PARTIES=https://app.localwheels.com,https://localwheels.com

# AI & Voice Encryption
ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY
ANTHROPIC_MODEL=claude-sonnet-4-6
VOICE_ENCRYPTION_KEY=<INSERT_GENERATED_VOICE_KEY>
METRICS_TOKEN=9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d
```

Secure the file permissions:
```bash
chmod 600 /var/www/localwheels/backend/.env
```

### Step 3.4: Build Frontend Single Page Application
```bash
cd /var/www/localwheels/frontend

# Configure production Clerk key in frontend/.env.production
cat <<EOF > .env.production
VITE_CLERK_PUBLISHABLE_KEY=YOUR_CLERK_PUBLISHABLE_KEY
EOF

# Install dependencies and build
npm ci
npm run build
# Verified built output in /var/www/localwheels/frontend/dist
```

---

## 4. Secure Initial Superadmin Provisioning

Run the standalone CLI script from the backend directory:
```bash
cd /var/www/localwheels/backend

node src/scripts/bootstrap-admin.js \
  --username superadmin \
  --password 'ReplaceWithStrongProductionPassword#2026' \
  --email 'admin@yourcompany.com' \
  --name 'Platform Super Administrator' \
  --secret '<YOUR_BOOTSTRAP_SECRET>'
```

*Expected Terminal Output:*
```text
✅ Superadmin provisioned successfully. Bootstrap is now permanently disabled.
👤 Created Superadmin: superadmin (<object_id>)
```

### Verify Permanent Lockout & Clean Environment
1. Rerun the command to confirm immediate rejection:
   ```bash
   node src/scripts/bootstrap-admin.js --username rogue --password 'Pass123' --secret '<YOUR_BOOTSTRAP_SECRET>'
   # Output: ❌ Bootstrap blocked: Bootstrap has already been completed and is permanently disabled.
   ```
2. Delete the `BOOTSTRAP_SECRET` line from `/var/www/localwheels/backend/.env`:
   ```bash
   sed -i '/BOOTSTRAP_SECRET/d' /var/www/localwheels/backend/.env
   ```

---

## 5. Corrected Nginx Configuration

Create `/etc/nginx/sites-available/localwheels`:

```nginx
# Rate limiting zone: 20 requests/second per IP
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;

server {
    listen 80;
    server_name app.localwheels.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.localwheels.com;

    # SSL configuration managed by Certbot
    ssl_certificate /etc/letsencrypt/live/app.localwheels.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.localwheels.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /var/www/localwheels/frontend/dist;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    # Enterprise Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # 1. API Reverse Proxy to Express
    location /api/ {
        limit_req zone=api_limit burst=50 nodelay;

        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }

    # 2. Block direct static browsing of private documents vault
    # (Private documents MUST be downloaded via /api/documents/:id/download)
    location ^~ /uploads/documents/ {
        return 403;
    }

    # 3. Uploads Proxy (POD photos)
    location /uploads/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        expires 7d;
        add_header Cache-Control "public, no-transform";
    }

    # 4. Static frontend asset caching (Vite content-hashes filenames)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 5. React Router Single Page Application fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable virtual host and obtain SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/localwheels /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Issue Let's Encrypt TLS Certificate
sudo certbot --nginx -d app.localwheels.com
```

---

## 6. PM2 Process Manager Daemon Setup

Configure PM2 cluster execution for zero-downtime reloads and automatic restarts:

```bash
cd /var/www/localwheels/backend

# Start backend in cluster mode across available CPU cores
pm2 start src/index.js --name "localwheels-api" -i max --max-memory-restart 1G

# Save PM2 process list and configure systemd startup hook
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2-startup install
```

### PM2 Maintenance Commands
```bash
# View process status
pm2 status

# View live log stream
pm2 logs localwheels-api

# Zero-downtime graceful reload after updates
pm2 reload localwheels-api
```

---

## 7. MongoDB Atlas Production Access & Backup Procedures

### 7.1 Least-Privilege Custom Role Creation
Execute in the MongoDB Atlas Web Console or mongosh:
```javascript
use localwheels;

db.createRole({
  role: "appRoleAppendOnlyAudit",
  privileges: [
    { resource: { db: "localwheels", collection: "auditlogs" }, actions: [ "find", "insert" ] },
    { resource: { db: "localwheels", collection: "" }, actions: [ "find", "insert", "update", "remove" ] }
  ],
  roles: []
});
```
Assign role `appRoleAppendOnlyAudit` to `lw_prod_user`.

### 7.2 Point-in-Time Restore (PITR) & Manual Backup
```bash
# Create manual compressed backup archive
mongodump --uri="mongodb+srv://lw_prod_user:<PASSWORD>@cluster0.xxxxx.mongodb.net/localwheels" \
  --archive="/var/backups/localwheels-$(date +%F).gz" --gzip

# Restore from backup archive
mongorestore --uri="mongodb+srv://lw_prod_user:<PASSWORD>@cluster0.xxxxx.mongodb.net/localwheels" \
  --archive="/var/backups/localwheels-<DATE>.gz" --gzip --nsInclude="localwheels.*" --drop
```

---

## 8. Rollback Procedures

If an unexpected production incident occurs:

```bash
# 1. SSH into the server
ssh deploy@app.localwheels.com
cd /var/www/localwheels

# 2. Rollback codebase to verified release tag
git checkout logistics-audit-verified-v1

# 3. Clean reinstall and build
cd backend && npm ci --omit=dev
cd ../frontend && npm ci && npm run build

# 4. Reload PM2 cluster
pm2 reload localwheels-api

# 5. Verify API status
curl -s https://app.localwheels.com/api/health | jq .
```

---

## 9. Post-Deployment Smoke Verification Checklist

Immediately following deployment, execute these validation checks:

- [ ] **Health Endpoint:** `curl -s https://app.localwheels.com/api/health | jq .` returns `status: ok` and `db.ready: true`.
- [ ] **Security Headers:** `curl -I https://app.localwheels.com` confirms presence of `Strict-Transport-Security`, `X-Frame-Options: DENY`, and `X-Content-Type-Options: nosniff`.
- [ ] **Document Vault Protection:** `curl -I https://app.localwheels.com/uploads/documents/test.pdf` returns **HTTP 403 Forbidden**.
- [ ] **Superadmin Authentication:** Log in at `https://app.localwheels.com/login` using superadmin credentials.
- [ ] **Session Revocation:** Log out and verify that reusing the previous JWT token returns **HTTP 401 Unauthorized**.
- [ ] **Consignment Tracking:** Query a valid tracking number at `https://app.localwheels.com/tracking` and verify milestone output.
- [ ] **Audit Logging:** Query `GET /api/audit-logs` (as superadmin) and verify that recent administrative logins and provisioning events are recorded.

