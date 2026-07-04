# LocalWheels — Hostinger Business Hosting Deployment Guide

## Architecture (why this works)

On Hostinger Business Hosting there is no PM2, no Nginx, and no persistent shell.
The only way to run Node.js is through **hPanel → Node.js**.

When hPanel Node.js is configured, LiteSpeed hands ALL requests to Express via Passenger.
Express then serves:
- `/api/*`      → JSON API responses  
- `/uploads/*`  → uploaded files
- `/assets/*`   → React JS/CSS bundles (1-year cache)
- `/*`          → React `index.html` (SPA fallback)

The `.htaccess` in `public_html/` is a safety net that returns 503 for `/api/*` if
Passenger is not running, instead of silently returning `index.html`.

---

## Step 1 — File Structure on Hostinger

Your `public_html/` directory must look like this:

```
public_html/
├── index.html              ← React app shell
├── favicon.svg
├── .htaccess               ← from frontend/public/.htaccess
├── assets/                 ← React JS/CSS bundles (from dist/assets/)
│   ├── index-JJwLQ4yb.js
│   ├── vendor-BWF6wOPc.js
│   └── ...
└── backend/                ← Node.js application root
    ├── package.json
    ├── .env                ← production env (see Step 3)
    ├── src/
    │   ├── index.js        ← startup file
    │   ├── routes/
    │   ├── models/
    │   ├── middleware/
    │   └── db/
    ├── uploads/            ← created automatically on first start
    └── node_modules/       ← install via hPanel or upload
```

Upload the frontend build files (`dist/*`) to `public_html/` (not inside `backend/`).
Upload the backend source to `public_html/backend/`.

---

## Step 2 — Configure Node.js in hPanel

1. Log in to **hPanel** → [hpanel.hostinger.com](https://hpanel.hostinger.com)
2. Click **Manage** on your website (`localwheels.vinofyx.com`)
3. In the left sidebar, find **Node.js** (under "Advanced" or search for it)
4. Click **Create Application**
5. Fill in:

| Field | Value |
|---|---|
| Node.js version | **20.x** (or highest LTS available) |
| Application mode | **Production** |
| Application root | `public_html/backend` |
| Application URL | `/` (root — serves everything) |
| Application startup file | `src/index.js` |

6. Click **Create** — Hostinger starts the Node.js process
7. Note the **port number** Hostinger assigns (shown after creation)

---

## Step 3 — Set Environment Variables in hPanel

In the Node.js app screen → **Environment Variables** tab, add these exactly:

```
NODE_ENV=production
PORT=<assigned by Hostinger — shown in the app panel>
MONGODB_URI=<your Atlas connection string from backend/.env>
JWT_SECRET=<your JWT secret from backend/.env>
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=https://localwheels.vinofyx.com,https://www.localwheels.vinofyx.com
ANTHROPIC_API_KEY=<your key from console.anthropic.com>
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
```

**Note on PORT:** If Hostinger does not assign a port or requires a specific one (e.g. 3000),
also add `PORT=3000`. The Express server reads `process.env.PORT || 5000`.

**Note on Clerk:** Both Clerk keys are left empty intentionally. The test keys do not work
on production domains. The frontend already has `VITE_CLERK_PUBLISHABLE_KEY=` set so Clerk
is disabled on the frontend too. Legacy username/password login works normally.

---

## Step 4 — Install Dependencies

In the hPanel Node.js screen, click **Run NPM Install** (or "Install Dependencies").
This installs `node_modules/` inside `public_html/backend/`.

If the button is not available, upload `node_modules/` via File Manager (not recommended
for large installs) or use the SSH-accessible npm command if Hostinger provides it.

---

## Step 5 — MongoDB Atlas — Whitelist Hostinger IP

MongoDB Atlas only allows connections from whitelisted IPs.

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Your project → **Network Access** → **Add IP Address**
3. Add `217.21.85.191` (the Hostinger server IP)
4. Or click **Allow Access from Anywhere** (`0.0.0.0/0`) for simplicity

Without this, the backend starts but MongoDB connection fails → startup exits with code 1.

---

## Step 6 — Restart and Verify

After setting env vars:
1. Click **Restart** in the hPanel Node.js app screen
2. Wait 10–15 seconds for the process to start

Then verify:
```bash
# Health check — must return JSON, NOT index.html
curl https://localwheels.vinofyx.com/api/health

# Expected:
# {"status":"ok","env":"production","db":{"state":"connected","ready":true},...}

# Auth (no token) — must return 401 JSON
curl https://localwheels.vinofyx.com/api/auth/me
# Expected: {"error":"No token provided"} or similar

# Login
curl -X POST https://localwheels.vinofyx.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"vinofyx@gmail.com","password":"YOUR_PASSWORD"}'
# Expected: {"token":"eyJ...","user":{...}}
```

---

## Step 7 — DNS (if localwheels.vinofyx.com doesn't resolve)

`localwheels.vinofyx.com` currently does NOT resolve in public DNS.

In your domain registrar (Hostinger Domains or wherever `vinofyx.com` is managed):
1. Add a **CNAME** record: `localwheels` → `localwheels.vinofyx.com.` (your hosting)
   OR add an **A record**: `localwheels` → `217.21.85.191`
2. Wait for DNS propagation (up to 24 hours, usually 15 minutes on Hostinger)

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `/api/health` returns `index.html` | Node.js app not configured in hPanel | Complete Step 2 |
| `/api/health` returns 503 | Node.js app crashed or not started | Check hPanel logs, verify env vars |
| "Missing required env vars" in logs | Env vars not set in hPanel | Complete Step 3 |
| "Failed to connect to MongoDB" in logs | Atlas IP not whitelisted | Complete Step 5 |
| Login returns 500 | JWT_SECRET missing or weak | Check Step 3 |
| "Something went wrong" screen | Clerk test key active | Verify `CLERK_PUBLISHABLE_KEY=` is empty in frontend build |

---

## Files Changed in This Deployment

| File | Change |
|---|---|
| `backend/src/index.js` | Added static file serving + SPA fallback for production |
| `backend/src/index.js` | Fixed "Render dashboard" message → "Hostinger hPanel" |
| `frontend/public/.htaccess` | Returns 503 for /api/* if Passenger not active (prevents silent HTML-as-JSON) |
