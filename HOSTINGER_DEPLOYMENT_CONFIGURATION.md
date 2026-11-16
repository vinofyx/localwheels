# LOCALWHEELS — HOSTINGER DEPLOYMENT CONFIGURATION MANUAL

**Target Domain:** `localwheels.vinofyx.com`  
**Hosting Environment:** Hostinger Business Web Hosting  
**Runtime Engine:** CloudLinux OS + LiteSpeed Web Server + Phusion Passenger  
**Node.js Engine:** Node.js 22.x LTS (Application Root: `backend`)

---

## 1. ARCHITECTURE OPTIONS OVERVIEW

Hostinger Business Web Hosting supports two production architectures:

### Option 1: Unified Passenger Application (Recommended & Simplest)
In this architecture, CloudLinux Passenger manages the application at `Application URL: /`. Express serves all `/api/*` REST endpoints, all `/uploads/*` static assets, and serves the Vite-built React SPA from `FRONTEND_DIST` for all client-side routes.
- **Benefits:** Zero risk of proxy misconfiguration, no `.htaccess` rewrite conflicts, same-origin API calls, zero CORS preflight overhead.
- **Archive to use:** `localwheels-vinofyx-deployment.zip` (or `public_html.zip`).

### Option 2: Separated Frontend + Backend Application
LiteSpeed Web Server serves the static React frontend from `public_html/`. The Node.js Express backend is deployed in `backend/` and mapped to a dedicated subdomain (e.g. `api.localwheels.vinofyx.com`) or sub-URI.
- **Benefits:** LiteSpeed serves static assets directly at web server speed; backend runs independently.
- **Archives to use:** `localwheels-frontend-hostinger.zip` (for `public_html/`) and `localwheels-backend-hostinger.zip` (for `backend/`).

---

## 2. STEP-BY-STEP DEPLOYMENT PROCEDURE (OPTION 1 — UNIFIED)

### Step 1: Upload and Extract Application Package
1. Log in to **Hostinger hPanel**.
2. Navigate to **Websites → Manage → File Manager**.
3. Go to the root directory for your domain: `domains/localwheels.vinofyx.com/public_html/`.
4. Upload `public_html.zip` (or `localwheels-vinofyx-deployment.zip`).
5. Right-click and choose **Extract**.
6. Verify directory structure inside `public_html/`:
   ```
   public_html/
   ├── index.html
   ├── favicon.svg
   ├── .htaccess
   ├── assets/
   │   ├── index-*.js
   │   └── ...
   └── backend/
       ├── package.json
       ├── package-lock.json
       ├── .env.example
       ├── src/
       │   └── index.js
       └── uploads/
           └── documents/
   ```
7. Delete the uploaded `.zip` archive to save disk space.

---

### Step 2: Configure Node.js Application in hPanel
1. In hPanel, go to **Websites → Manage → Advanced → Node.js** (or search "Node.js").
2. Click **Create Application** (or Edit if already created):
   - **Node.js version:** `22.x` (or `20.x LTS`)
   - **Application mode:** `Production`
   - **Application root:** `public_html/backend` (or `backend` if placed outside `public_html`)
   - **Application URL:** `/`
   - **Application startup file:** `src/index.js`
3. Click **Create** / **Save**.

---

### Step 3: Configure Production Environment Variables
In the hPanel Node.js dashboard, click the **Environment Variables** tab and enter:

| Variable Name | Required Value / Description | Example Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Must be `production` | `production` |
| `MONGODB_URI` | Full MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/localwheels?retryWrites=true&w=majority` |
| `JWT_SECRET` | 64-byte random hex string | *Generate via command below* |
| `JWT_EXPIRES_IN` | Session duration | `7d` |
| `BOOTSTRAP_SECRET` | 32-byte high-entropy provisioning secret | *Generate via command below* |
| `ALLOWED_ORIGINS` | Comma-separated allowed frontend domains | `https://localwheels.vinofyx.com,https://www.localwheels.vinofyx.com` |
| `FRONTEND_URL` | Primary domain URL | `https://localwheels.vinofyx.com` |
| `MAX_FILE_SIZE` | Maximum upload size in bytes (10MB default) | `10485760` |
| `STORAGE_PROVIDER` | `local` (or `s3` for Cloudflare R2 / AWS S3) | `local` |

#### How to Generate Cryptographic Secrets
Run this in PowerShell or Node terminal:
```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('BOOTSTRAP_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

---

### Step 4: Install Dependencies & Build
1. In the hPanel Node.js dashboard, click **Run NPM Install** (or connect via SSH and execute `npm install --omit=dev`).
2. Verify dependency installation completes cleanly with 0 errors.
3. Click **Run NPM Build** (or execute `npm run build`). The build logs will confirm:
   `LocalWheels Express backend ready (no compilation step required)`.

---

### Step 5: Start & Restart Application
1. In the hPanel Node.js dashboard, click **Restart Application**.
2. Passenger will launch `src/index.js`.
3. Check the application logs in hPanel or via SSH to confirm:
   ```
   ✅ LocalWheels API listening on port / socket
      Health check: /api/health
      Environment : production
   ```

---

## 3. STATIC ROUTING & `.HTACCESS` SPECIFICATION

The `.htaccess` file in `public_html/` ensures that LiteSpeed never rewrites API requests or upload paths to `index.html`:

```apache
# LocalWheels — Production .htaccess for Hostinger Shared Hosting
Options +FollowSymLinks -Indexes
RewriteEngine On
RewriteBase /

# ── API & Uploads Pass-Through ────────────────────────────────────────────────
# Ensure /api and /uploads are NEVER rewritten to index.html
RewriteCond %{REQUEST_URI} ^/api [NC,OR]
RewriteCond %{REQUEST_URI} ^/uploads [NC]
RewriteRule ^ - [L]

# ── SPA Fallback (Client-Side React Router) ───────────────────────────────────
# Direct non-file requests to index.html so React Router handles them
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [QSA,L]

# ── Performance & Compression (GZIP) ──────────────────────────────────────────
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml
</IfModule>

# ── Browser Cache Headers ─────────────────────────────────────────────────────
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html              "access plus 0 seconds"
  ExpiresByType text/css               "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/svg+xml          "access plus 1 year"
  ExpiresByType font/woff2             "access plus 1 year"
  ExpiresByType font/woff              "access plus 1 year"
</IfModule>

# ── MIME Types ────────────────────────────────────────────────────────────────
<IfModule mod_mime.c>
  AddType application/javascript .js .mjs
  AddType text/css .css
</IfModule>
```

---

## 4. LOCAL FILE STORAGE & PERSISTENCE CONFIGURATION

### Local Directory Structure
- Uploads Root: `backend/uploads/`
- Document Vault: `backend/uploads/documents/`

### Preserving Uploads During Future Updates
When uploading future software updates to Hostinger:
1. **Never delete the `uploads/` directory.**
2. If uploading a new backend ZIP, extract into a temporary directory, copy updated code into `backend/src/` and `backend/package.json`, and leave `backend/uploads/` untouched.
3. **Optional Symlink Architecture (Best Practice for Local Storage):**
   Create a persistent directory outside `public_html`:
   ```bash
   mkdir -p ~/persistent_data/uploads/documents
   ln -s ~/persistent_data/uploads ~/domains/localwheels.vinofyx.com/public_html/backend/uploads
   ```
   This ensures application updates inside `public_html/` can never accidentally overwrite customer uploads.

---

## 5. MONGODB ATLAS CONNECTIVITY SETUP

1. **Obtain Hostinger Outbound IP:**
   - In hPanel, open **Advanced → SSH Access** and run:
     ```bash
     curl -s https://api.ipify.org
     ```
2. **Add to Atlas Network Access:**
   - Go to **cloud.mongodb.com → Security → Network Access**.
   - Click **Add IP Address**.
   - Enter the discovered IP (e.g. `185.xxx.xxx.xxx/32`).
   - Add comment: `Hostinger Production Web App`.
   - Click **Confirm**.
3. **Atlas Least-Privilege User:**
   - Go to **Database Access → Add New Database User**.
   - Authentication Method: Password (SCRAM-SHA-256).
   - Database User Privileges: Select **Built-in Role: `readWrite`**.
   - Specific Database: `localwheels`.
   - Click **Add User**.

