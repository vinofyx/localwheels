# LOCALWHEELS — POST-DEPLOYMENT VERIFICATION TEST PLAN

**Target Domain:** `https://localwheels.vinofyx.com`  
**Execution Context:** Production Verification immediately following Hostinger deployment  
**Target Audience:** DevOps / Release Engineer / QA Lead

---

## 1. TEST SUITE OVERVIEW

This test plan provides step-by-step verification commands and expected responses to validate the live deployment across 10 mission-critical domains:

1. Website Homepage & Static Assets
2. API Health & Database Connectivity
3. Authentication (Login & Logout Invalidation)
4. Superadmin Bootstrap Immutability
5. Multi-Tenant Company & Branch Isolation
6. Shipment Lifecycle & Public Tracking
7. Proof of Delivery (POD) Upload, Storage & Verification
8. Secure Document Vault Upload & Download Protection
9. Invoicing Calculations & Payment Reconciliation
10. React SPA Navigation & Client-Side Routing

---

## 2. DETAILED TEST SPECIFICATIONS

### TEST 1: Website Homepage & Asset Delivery
- **Objective:** Verify that LiteSpeed / Express serves `index.html` and that hashed JS/CSS bundles load with HTTP 200.
- **Verification Command (cURL):**
  ```bash
  curl -I https://localwheels.vinofyx.com/
  ```
- **Expected Status:** `HTTP/2 200`
- **Expected Headers:**
  - `Content-Type: text/html; charset=UTF-8`
  - `Cache-Control: no-cache, no-store, must-revalidate`
- **Browser Check:** Open `https://localwheels.vinofyx.com` in Chrome/Edge DevTools (F12). Ensure zero console red errors and that `assets/index-*.js` and `assets/index-*.css` load with status 200 (or 304).

---

### TEST 2: API Health & MongoDB Atlas Connectivity
- **Objective:** Confirm Express backend is running and actively communicating with MongoDB Atlas.
- **Verification Command (cURL):**
  ```bash
  curl -s https://localwheels.vinofyx.com/api/health
  ```
- **Expected Status:** `HTTP/2 200`
- **Expected Response JSON:**
  ```json
  {
    "status": "ok",
    "db": {
      "connected": true
    },
    "environment": "production"
  }
  ```
- **Pass Criteria:** `db.connected` is strictly `true`. If `false` or connection timeout, MongoDB Atlas network whitelist or credentials are invalid.

---

### TEST 3: Initial Superadmin Bootstrap & Lockout Behavior
- **Objective:** Verify initial superadmin creation and confirm the endpoint is permanently locked against replay attacks.
- **Step 3A (First-Time Provisioning):**
  ```bash
  curl -s -X POST https://localwheels.vinofyx.com/api/auth/bootstrap-superadmin \
    -H "Content-Type: application/json" \
    -d '{
      "secret": "<YOUR_BOOTSTRAP_SECRET>",
      "username": "root_superadmin",
      "password": "StrongPassword#2026!",
      "name": "Root Administrator"
    }'
  ```
  - **Expected Status:** `HTTP 201 Created`
  - **Expected Response:** `{"status":"success","message":"SuperAdmin provisioned successfully"}`
- **Step 3B (Replay Lockout Test):**
  Execute the exact same curl command a second time.
  - **Expected Status:** `HTTP 403 Forbidden`
  - **Expected Response:**
    ```json
    {
      "error": "SuperAdmin already provisioned. Initial bootstrap is permanently disabled."
    }
    ```
- **Pass Criteria:** Second attempt returns 403 Forbidden even when providing the correct secret.

---

### TEST 4: Authentication, JWT Issuance & Session Invalidation
- **Objective:** Verify login returns a valid JWT, and verify logout invalidates subsequent requests with that token.
- **Step 4A (Login):**
  ```bash
  curl -s -X POST https://localwheels.vinofyx.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username": "root_superadmin", "password": "StrongPassword#2026!"}'
  ```
  - **Expected Status:** `HTTP 200 OK`
  - **Extract Token:** Save `token` value as `TOKEN`.
- **Step 4B (Authenticated /me Check):**
  ```bash
  curl -s https://localwheels.vinofyx.com/api/auth/me \
    -H "Authorization: Bearer $TOKEN"
  ```
  - **Expected Status:** `HTTP 200 OK`
  - **Response:** Contains `username: "root_superadmin"`, `role: "superadmin"`.
- **Step 4C (Logout):**
  ```bash
  curl -s -X POST https://localwheels.vinofyx.com/api/auth/logout \
    -H "Authorization: Bearer $TOKEN"
  ```
  - **Expected Status:** `HTTP 200 OK`
- **Step 4D (Post-Logout Invalidation Check):**
  Repeat Step 4B with the exact same `$TOKEN`.
  - **Expected Status:** `HTTP 401 Unauthorized`
  - **Expected Response:** `{"error": "Session has been invalidated. Please sign in again."}`
- **Pass Criteria:** Expired or logged-out token is strictly rejected.

---

### TEST 5: Multi-Tenant Company & Branch Isolation
- **Objective:** Prove that Company A cannot read or modify Company B's data (IDOR defense).
- **Test Command:**
  Query a known shipment ID belonging to Company A using a token from Company B:
  ```bash
  curl -s https://localwheels.vinofyx.com/api/shipments/<COMPANY_A_SHIPMENT_ID> \
    -H "Authorization: Bearer $TOKEN_COMPANY_B"
  ```
- **Expected Status:** `HTTP 404 Not Found` (or `HTTP 403 Forbidden`)
- **Pass Criteria:** Cross-tenant resource returns 404/403 and never returns Company A's shipment data.

---

### TEST 6: Shipment Creation & Public Tracking
- **Objective:** Verify creation of an LR (Lorry Receipt) and ensure unauthenticated tracking works without data leaks.
- **Step 6A (Create Shipment):**
  ```bash
  curl -s -X POST https://localwheels.vinofyx.com/api/shipments \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "sender_name": "Test Sender Ltd",
      "receiver_name": "Test Receiver Corp",
      "origin": "Delhi",
      "destination": "Mumbai",
      "packages": 10,
      "weight_kg": 250,
      "goods_description": "Electronics",
      "freight_amount": 5000
    }'
  ```
  - **Expected Status:** `HTTP 201 Created`
  - **Extract LR:** Save `lr_number` (e.g. `LW00000035`).
- **Step 6B (Public Tracking):**
  ```bash
  curl -s "https://localwheels.vinofyx.com/api/tracking/public/$LR_NUMBER"
  ```
  - **Expected Status:** `HTTP 200 OK`
  - **Response:** Returns current tracking status, origin, destination, and milestone timeline.

---

### TEST 7: POD Image Upload, Local Disk Storage & Verification
- **Objective:** Verify Multer 2.5.0 handles multipart file upload, saves file to local disk, and prevents execution of disallowed types.
- **Step 7A (Upload Disallowed .sh or .exe File):**
  ```bash
  curl -s -X POST "https://localwheels.vinofyx.com/api/pod/$SHIPMENT_ID/upload" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -F "file=@test.exe;type=application/octet-stream"
  ```
  - **Expected Status:** `HTTP 400 Bad Request`
  - **Expected Response:** `{"error": "Invalid file type. Allowed: JPG, PNG, PDF"}`
- **Step 7B (Upload Legitimate POD Image):**
  ```bash
  curl -s -X POST "https://localwheels.vinofyx.com/api/pod/$SHIPMENT_ID/upload" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -F "file=@pod_receipt.jpg;type=image/jpeg"
  ```
  - **Expected Status:** `HTTP 200 OK`
  - **Verify Disk File:** File URL starts with `/uploads/pod_...`. File is physically written to `backend/uploads/`.

---

### TEST 8: Document Vault Upload & Path Traversal Defense
- **Objective:** Verify private documents are protected against static web browsing and directory traversal.
- **Step 8A (Direct Static Browsing Block):**
  ```bash
  curl -s -I "https://localwheels.vinofyx.com/uploads/documents/private_doc.pdf"
  ```
  - **Expected Status:** `HTTP/2 403 Forbidden`
  - **Response:** `{"error": "Direct access to documents directory is forbidden. Use /api/documents/:id/download"}`
- **Step 8B (Authorized Download):**
  ```bash
  curl -s "https://localwheels.vinofyx.com/api/documents/$DOC_ID/download" \
    -H "Authorization: Bearer $ADMIN_TOKEN" -I
  ```
  - **Expected Status:** `HTTP/2 200 OK`
  - **Headers:** `Content-Type: application/pdf`
- **Step 8C (Directory Traversal Attack):**
  Attempt to download with `../` path:
  ```bash
  curl -s "https://localwheels.vinofyx.com/api/documents/..%2f..%2fpackage.json/download" \
    -H "Authorization: Bearer $ADMIN_TOKEN"
  ```
  - **Expected Status:** `HTTP 400` or `HTTP 403 Forbidden`
  - **Pass Criteria:** Express route rejects traversal. `package.json` is never returned.

---

### TEST 9: Invoicing Calculations & Payment Reconciliation
- **Objective:** Verify GST tax calculation (CGST 9% + SGST 9%) and payment reconciliation.
- **Step 9A (Generate Invoice):**
  Generate invoice for a Rs 5,000 shipment.
  - **Expected Subtotal:** `5000.00`
  - **Expected CGST (9%):** `450.00`
  - **Expected SGST (9%):** `450.00`
  - **Expected Total:** `5900.00`
- **Step 9B (Collect Payment):**
  Record collection of Rs 5,900.
  - **Expected Status:** Transitions payment status from `pending` to `paid`.

---

### TEST 10: React SPA Client-Side Routing & Page Refresh
- **Objective:** Verify that direct URL access and browser refresh on non-root paths load the React SPA instead of a 404 error.
- **Verification Commands:**
  ```bash
  curl -s -I https://localwheels.vinofyx.com/shipments
  curl -s -I https://localwheels.vinofyx.com/dashboard
  curl -s -I https://localwheels.vinofyx.com/login
  ```
- **Expected Status on All Paths:** `HTTP/2 200`
- **Expected Content:** Serves `index.html` with `Content-Type: text/html`.
- **Pass Criteria:** Refreshing `/shipments` in the browser renders the React Shipments view without an Apache/LiteSpeed 404 page.

---

## 3. SUMMARY OF PASS / FAIL CRITERIA

| Test Domain | Target Status | Primary Success Indicator |
| :--- | :---: | :--- |
| **Homepage** | HTTP 200 | React SPA root HTML returned |
| **API Health** | HTTP 200 | `{"status":"ok","db":{"connected":true}}` |
| **Bootstrap Lockout** | HTTP 403 | Endpoint permanently disabled after first run |
| **Login / Logout** | HTTP 200 / 401 | Tokens invalidated on logout |
| **Multi-Tenant Isolation** | HTTP 404 / 403 | Cross-tenant access blocked |
| **Public Tracking** | HTTP 200 | Live shipment status returned |
| **POD Upload** | HTTP 200 | File stored on NVMe SSD |
| **Direct Document Access** | HTTP 403 | Private document vault protected |
| **Invoicing GST** | HTTP 200 | Correct 9% + 9% calculation |
| **SPA Route Refresh** | HTTP 200 | Direct URL access serves `index.html` |

