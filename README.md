# LocalWheels — Multi-Branch Logistics SaaS Platform

Enterprise-grade logistics management platform featuring end-to-end booking, field pickup automation, inter-branch shipment transfer, Line Haul Sheet (LHS) dispatch, Touching LR tracking, FasTag toll import, Proof of Delivery (POD) image verification, automated GST invoicing, and real-time dashboard analytics.

---

## 🚀 Tech Stack

* **Backend:** Node.js (>=20.0.0, v22 LTS verified), Express 4, MongoDB Atlas (Mongoose 8), Multer, Bcrypt, Helmet, JSON Web Tokens.
* **Frontend:** React 18, Vite 7, Tailwind CSS, Lucide Icons, Recharts, Leaflet, Axios, React Hot Toast.
* **Authentication:** Dual-mode authentication supporting:
  * **System Login:** Standard HMAC-SHA256 JWT tokens with Bcrypt password hashing.
  * **Clerk SSO:** Single Sign-On via `@clerk/react` and `@clerk/backend`.
* **Testing & QA:** Comprehensive automated test harness including unit tests, E2E API tests, business workflow validation, production audit suite, smoke tests, real-world functional suite, and Chromium/Edge browser automation via Puppeteer-Core.

---

## 📂 Project Architecture

```
Localwheels/
├── backend/
│   ├── src/
│   │   ├── index.js                  # Express API server entry point & security middleware
│   │   ├── db/
│   │   │   ├── seed.js               # Database seeding script (admin, branches, users)
│   │   │   └── seed-production.js    # Production bootstrap script
│   │   ├── middleware/
│   │   │   └── auth.js               # Dual-auth verification (Clerk + LocalWheels JWT) & RBAC
│   │   ├── models/                   # Mongoose schemas (Shipment, POD, Trip, FasTag, etc.)
│   │   ├── routes/                   # API endpoint controllers
│   │   └── utils/                    # Manifest generators, pricing algorithms, audit loggers
│   ├── tests/
│   │   └── freightCalc.test.js       # Freight calculation & pricing unit tests
│   ├── uploads/                      # Uploaded POD files (auto-created)
│   ├── .env.example                  # Environment configuration template
│   ├── final-validation-test.js      # Real-world functional validation suite (pickup, transfer, POD)
│   ├── browser-validation.js         # Real browser UI & responsive automation suite
│   ├── workflow-test.js              # Business workflow validation suite (WF1 – WF13)
│   ├── production-validate.js        # Infrastructure & latency validation suite
│   └── smoke-test.js                 # Smoke testing suite
├── frontend/
│   ├── src/
│   │   ├── api/client.js             # Axios client with auto-token sync & interceptors
│   │   ├── context/AuthContext.jsx   # Auth state orchestrator (Local + Clerk SSO)
│   │   ├── pages/                    # React routes and views
│   │   │   ├── Login.jsx             # Dual-mode login interface (System + SSO)
│   │   │   ├── Dashboard.jsx         # Executive KPI dashboard
│   │   │   ├── entries/              # LHS, Touching LR, FasTag Import
│   │   │   └── ...
│   │   └── App.jsx                   # Route guards & lazy-loaded application routing
│   ├── vite.config.js                # Optimized rollup chunk splitting & reverse proxy
│   ├── nginx.conf                    # Nginx reverse proxy configuration for production
│   └── Dockerfile                    # Multi-stage production container build
├── e2e_test.js                       # End-to-end API test suite (CRUD & tracking)
└── package.json                      # Monorepo scripts
```

---

## 🛠️ Installation & Setup

### Prerequisites
* **Node.js:** v20.0.0 or higher (Node 22 LTS recommended)
* **npm:** v9.0.0 or higher
* **MongoDB Atlas** or local MongoDB instance (MongoDB 6.0+)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-org/localwheels.git
cd localwheels

# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

---

## ⚙️ Environment Configuration

1. Copy the example environment file in `backend`:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Configure `backend/.env`:
   ```ini
   PORT=5000
   NODE_ENV=development

   # MongoDB Connection String
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/localwheels?retryWrites=true&w=majority

   # Cryptographically Random JWT Secret (at least 64 hex characters)
   JWT_SECRET=your_super_secret_jwt_key_at_least_64_characters_long
   JWT_EXPIRES_IN=7d

   # Allowed Frontend Origins (comma-separated)
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8080,http://localhost:8081,http://localhost:8085

   # Clerk Authentication (Optional for Clerk SSO)
   # CLERK_SECRET_KEY=sk_test_...
   # CLERK_PUBLISHABLE_KEY=pk_test_...

   # External Notifications (Supply for live WhatsApp / SMS delivery)
   # WHATSAPP_ACCESS_TOKEN=EAAB...
   # WHATSAPP_PHONE_NUMBER_ID=100...
   # WHATSAPP_VERIFY_TOKEN=localwheels_wa_token
   # SMS_GATEWAY_KEY=your_sms_key
   # SMS_SENDER_ID=LCLWHL

   # Redis (Optional for distributed caching)
   # REDIS_URL=redis://localhost:6379
   ```

3. Configure `frontend/.env` (Optional, defaults to `/api` proxy):
   ```ini
   VITE_API_URL=/api
   # VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

---

## 📦 Database Seeding

Initialize standard company, branches, and administrative accounts:

```bash
npm run seed --prefix backend
```

**Default Seed Credentials:**
* **Administrator:** `admin` / `admin123` (Admin role, access to all branches)
* **Operations Admin:** `dayakar` / `admin123`
* **Branch Manager:** `manager1` / `password123`
* **Branch Staff:** `staff1` / `password123`

---

## 💻 Running in Development

### Option A: Run Both Simultaneously (from root)
```bash
npm run dev
```

### Option B: Run Services Individually
```bash
# Terminal 1 - Backend Server (Port 5000)
npm run dev:backend

# Terminal 2 - Frontend Server (Port 8081 or 8085)
npm run dev:frontend
```

---

## 🧪 Comprehensive Test Suites (204 Tests)

All 7 test suites can be executed independently. Ensure the backend server is running on `http://localhost:5000`:

```bash
# 1. Freight Engine Unit Tests (28 tests)
node backend/tests/freightCalc.test.js

# 2. E2E API & CRUD Test Suite (56 tests)
node e2e_test.js

# 3. Business Workflow Suite (WF1 – WF13, 18 tests)
node backend/workflow-test.js http://localhost:5000 admin admin123

# 4. Production Validation Suite (27 tests)
node backend/production-validate.js http://localhost:5000 admin admin123 --dev

# 5. Smoke Test Suite (17 tests)
node backend/smoke-test.js http://localhost:5000 admin admin123 --dev

# 6. Real-World Functional Validation (Pickup, Transfer, POD, FasTag, 43 tests)
node backend/final-validation-test.js

# 7. Real Browser UI & Responsive Automation (Desktop & Mobile, 15 tests)
node backend/browser-validation.js
```

---

## 🚢 Production Deployment

### Option A: Hostinger / VPS Node.js Deployment
1. Set Node.js version to **20.x or 22.x** in hPanel.
2. Set Application Root: `d:/Localwheels/backend` (or server path).
3. Set Startup File: `src/index.js`.
4. Run Build in `frontend/`:
   ```bash
   cd frontend && npm run build
   ```
5. Configure reverse proxy to route `/api/*` to `localhost:5000` and static routes to `frontend/dist`.

### Option B: Docker Container Deployment
```bash
# Build backend container
docker build -t localwheels-backend:latest ./backend

# Build frontend container with Nginx
docker build -t localwheels-frontend:latest ./frontend
```

---

## 🔒 Security Best Practices
* **No Plaintext Passwords:** Bcrypt salt rounds = 10 on all passwords.
* **Dual-Auth Protocol:** JWT validation rejects tampered tokens; Clerk tokens verified against Clerk JWKS.
* **Strict Multi-Tenancy:** All queries scoped to `req.user.company_id`.
* **Branch Permissions:** `requireBranchAccess` middleware enforces branch boundaries.
* **Input Sanitization:** Regex inputs escaped to prevent ReDoS attacks.
* **Zero Secret Leakage:** `.env` and uploaded binary artifacts are strictly gitignored.
