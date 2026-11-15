# LocalWheels Logistics Platform — REST API Documentation

**API Version:** `1.0.0`  
**Base URL (Local/Dev):** `http://localhost:5000`  
**Base URL (Production):** `https://api.localwheels.com` (or hosted reverse proxy domain)  
**Protocol:** HTTPS / JSON REST  

---

## Table of Contents

1. [Architectural Overview & Standards](#1-architectural-overview--standards)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Multi-Tenancy & Branch Scoping](#3-multi-tenancy--branch-scoping)
4. [Authentication Endpoints](#4-authentication-endpoints)
5. [Company Management](#5-company-management)
6. [Branch Management](#6-branch-management)
7. [Booking & Pickup Automation](#7-booking--pickup-automation)
8. [Shipment & Parcel Management](#8-shipment--parcel-management)
9. [Inter-Branch Transfer Protocol](#9-inter-branch-transfer-protocol)
10. [Dispatch, LHS & Touching LR](#10-dispatch-lhs--touching-lr)
11. [FasTag Toll Import](#11-fastag-toll-import)
12. [Proof of Delivery (POD)](#12-proof-of-delivery-pod)
13. [Invoicing & Taxation](#13-invoicing--taxation)
14. [Payment Collection & Reconciliation](#14-payment-collection--reconciliation)
15. [Route Expenses & Fleet Economics](#15-route-expenses--fleet-economics)
16. [Executive Dashboard & Analytics](#16-executive-dashboard--analytics)
17. [Public Tracking & Webhooks](#17-public-tracking--webhooks)
18. [System Health & Monitoring](#18-system-health--monitoring)
19. [Standard Error Codes & Handling](#19-standard-error-codes--handling)

---

## 1. Architectural Overview & Standards

All LocalWheels API endpoints adhere to strict REST conventions:
- Request bodies are formatted in `application/json` (except file uploads using `multipart/form-data`).
- Responses return standard JSON envelopes containing payload data and pagination metadata.
- Dates follow ISO 8601 formatting: `YYYY-MM-DDTHH:mm:ss.sssZ`.
- Currency values are represented in INR (`₹`) as standard numerical values.
- Weights are calculated in Kilograms (`kg`).

---

## 2. Authentication & Authorization

LocalWheels uses a dual-authentication strategy:
1. **System JWT Authentication:** Standard HMAC-SHA256 tokens issued by `/api/auth/login`.
2. **Clerk SSO:** Integrated via `@clerk/backend` with fallback decoding.

### Authorization Header
Every protected endpoint requires the bearer token in the HTTP request headers:
```http
Authorization: Bearer <jwt_access_token>
```

### Role-Based Access Control (RBAC)
| Role | Global Permissions | Branch Scoping |
| :--- | :--- | :--- |
| `superadmin` | Unrestricted platform-wide access, multi-tenant creation | Unrestricted |
| `admin` | Full CRUD within company | All branches within tenant |
| `manager` | Operations, approvals, POD verification, dispatch | Assigned branches only |
| `staff` | Bookings, pickup entries, LR creation, expense logging | Assigned branch only |
| `driver` | Delivery updates, POD upload | Assigned trip / vehicle |

---

## 3. Multi-Tenancy & Branch Scoping

### Tenant Isolation
All database collections contain a `company_id` foreign key. The authentication middleware automatically injects `req.user.company_id` into all database filters. Cross-company access is strictly denied with HTTP 403.

### Branch Header & Query Parameter
Branch-sensitive resources (Shipments, LHS, Expenses, Dashboard) evaluate the active branch using the following priority:
1. `x-branch-id` HTTP Request Header
2. `branch_id` Query parameter (`?branch_id=...`)
3. `branch_id` Request Body parameter
4. `req.user.branch_id` Fallback

---

## 4. Authentication Endpoints

### 4.1 System User Login
Authenticates an employee and returns a 7-day signed JWT token.

* **Endpoint:** `POST /api/auth/login`
* **Access:** Public (Rate-limited: 10 attempts/15 min in prod)
* **Request Body:**
```json
{
  "username": "admin",
  "password": "your_secure_password"
}
```
* **Success Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "6740ad2f12a149001b2c45e1",
    "username": "admin",
    "name": "Platform Administrator",
    "role": "admin",
    "company_id": "6740ad2f12a149001b2c45e0",
    "branch_id": "6740ad2f12a149001b2c45d0",
    "branch_ids": ["6740ad2f12a149001b2c45d0", "6740ad2f12a149001b2c45d1"]
  }
}
```

### 4.2 Current User Context
Returns the verified identity, company, and assigned branches.

* **Endpoint:** `GET /api/auth/me`
* **Access:** Authenticated
* **Success Response (200 OK):**
```json
{
  "user": {
    "_id": "6740ad2f12a149001b2c45e1",
    "username": "admin",
    "role": "admin",
    "company_id": "6740ad2f12a149001b2c45e0",
    "branch_id": "6740ad2f12a149001b2c45d0"
  }
}
```

---

## 5. Company Management

### 5.1 List Companies
* **Endpoint:** `GET /api/companies`
* **Access:** Admin / Superadmin
* **Success Response (200 OK):** Array of tenant companies.

### 5.2 Create Company
* **Endpoint:** `POST /api/companies`
* **Access:** Superadmin
* **Request Body:**
```json
{
  "company_name": "Apex Logistics Private Limited",
  "company_code": "APEX",
  "gst_number": "36AAACA1234A1Z5",
  "contact_email": "admin@apexlogistics.com",
  "phone": "+919876543210"
}
```

---

## 6. Branch Management

### 6.1 List Branches for Current User
* **Endpoint:** `GET /api/branches/user`
* **Access:** Authenticated
* **Success Response (200 OK):**
```json
[
  {
    "_id": "6740ad2f12a149001b2c45d0",
    "branch_name": "HYDERABAD",
    "branch_code": "HYD",
    "city": "Hyderabad",
    "state": "Telangana",
    "is_active": true
  }
]
```

### 6.2 Create Branch
* **Endpoint:** `POST /api/branches`
* **Access:** Admin only
* **Request Body:**
```json
{
  "branch_name": "BENGALURU HUB",
  "branch_code": "BLR",
  "address": "Electronic City Phase 1",
  "city": "Bengaluru",
  "state": "Karnataka",
  "pincode": "560100",
  "phone": "080-12345678"
}
```

---

## 7. Booking & Pickup Automation

### 7.1 Create Pickup Request
* **Endpoint:** `POST /api/bookings`
* **Access:** Authenticated (Staff / Manager)
* **Headers:** `x-branch-id: <origin_branch_id>`
* **Request Body:**
```json
{
  "sender_name": "Industrial Fasteners Ltd",
  "sender_phone": "+919876543210",
  "pickup_address": "Plot 42, IDA Cherlapally, Hyderabad",
  "receiver_name": "Metro Infra Tech",
  "receiver_phone": "+919876543211",
  "delivery_address": "Whitefield, Bengaluru",
  "packages": 5,
  "weight": 120.5,
  "commodity": "Steel Bolts",
  "pickup_type": "scheduled",
  "branch_id": "6740ad2f12a149001b2c45d0"
}
```

### 7.2 Update Pickup Status (Field Pickup Automation)
When a field executive marks status as `pickup_done`, the system **automatically instantiates a live Shipment record**, assigns a unique tracking LR number (`LWxxxxxxxx`), links the shipment ID back to the booking, and creates an associated payment ledger entry.

* **Endpoint:** `PATCH /api/bookings/:id/status`
* **Access:** Authenticated
* **Request Body:**
```json
{
  "status": "pickup_done",
  "notes": "Picked up from factory loading bay 2"
}
```
* **Success Response (200 OK):**
```json
{
  "_id": "6740ad2f12a149001b2c45b5",
  "status": "pickup_done",
  "shipment_id": "6740ad2f12a149001b2c45c9",
  "tracking_number": "LW00000021",
  "message": "Pickup completed. Shipment LW00000021 auto-created successfully."
}
```

---

## 8. Shipment & Parcel Management

### 8.1 List Shipments
* **Endpoint:** `GET /api/shipments`
* **Access:** Authenticated
* **Query Parameters:**
  * `branch_id` (string): Filter by branch
  * `status` (string): `booked`, `in_transit`, `out_for_delivery`, `delivered`, `cancelled`
  * `search` (string): Search tracking number, sender, receiver
  * `page` (number): Default `1`
  * `limit` (number): Default `20`

### 8.2 Create Direct Consignment (LR)
* **Endpoint:** `POST /api/shipments`
* **Access:** Authenticated
* **Request Body:**
```json
{
  "sender_name": "Hyd Castings Corp",
  "sender_phone": "+919812345678",
  "sender_address": "Jeedimetla, Hyderabad",
  "receiver_name": "Bangalore Auto Hub",
  "receiver_phone": "+919812345679",
  "receiver_address": "Peenya, Bengaluru",
  "packages": 10,
  "weight": 350,
  "declared_value": 50000,
  "freight_charges": 4500,
  "payment_type": "to_pay",
  "branch_id": "6740ad2f12a149001b2c45d0",
  "destination_branch_id": "6740ad2f12a149001b2c45d1"
}
```

### 8.3 Update Shipment Status
* **Endpoint:** `PATCH /api/shipments/:id/status`
* **Request Body:**
```json
{
  "status": "in_transit",
  "location": "Kurnool Toll Plaza",
  "notes": "Passing through intermediate hub"
}
```

---

## 9. Inter-Branch Transfer Protocol

Transfers custody of a consignment between branches. Atomically updates:
1. `shipment.branch_id` set to destination branch.
2. `shipment.status` transitioned to `in_transit`.
3. `shipment.current_hub` set to destination hub name.
4. Appends transfer record to `shipment.tracking_history`.
5. **Reassigns payment collection obligation** in `Payment` collection so the destination branch can collect COD/To-Pay amounts.

* **Endpoint:** `POST /api/shipments/:id/transfer`
* **Access:** Authenticated (Manager / Admin)
* **Request Body:**
```json
{
  "to_branch_id": "6740ad2f12a149001b2c45d1",
  "notes": "Transferred via Line Haul LHS-2026-0041"
}
```
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Shipment transferred successfully to BENGALURU HUB",
  "shipment": {
    "_id": "6740ad2f12a149001b2c45c9",
    "tracking_number": "LW00000021",
    "status": "in_transit",
    "branch_id": "6740ad2f12a149001b2c45d1",
    "current_hub": "BENGALURU HUB"
  }
}
```

---

## 10. Dispatch, LHS & Touching LR

### 10.1 Save Line Haul Sheet (LHS)
Creates a formal Line Haul manifest binding vehicles, drivers, route hubs, and consigned LRs.

* **Endpoint:** `POST /api/dispatch/lhs`
* **Access:** Authenticated
* **Request Body:**
```json
{
  "lhs_number": "LHS-2026-0891",
  "vehicle_no": "TS09UA1234",
  "driver_name": "Ramesh Kumar",
  "driver_phone": "+919876500001",
  "from_branch": "HYDERABAD",
  "to_branch": "BENGALURU HUB",
  "scheduled_departure": "2026-11-16T04:00:00.000Z",
  "total_weight": 4200,
  "shipments": ["6740ad2f12a149001b2c45c9"],
  "notes": "Night line haul dispatch"
}
```
* **Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "6740ad2f12a149001b2c45f5",
    "lhs_number": "LHS-2026-0891",
    "status": "dispatched"
  }
}
```

### 10.2 Touching LR Verification & Cross-Dock Scan
Allows field operators at transit centres to scan consignment bar codes, verify manifest association, and log touching actions.

* **Endpoint:** `GET /api/dispatch/touching-lr?branch_name=HYDERABAD&doc_no=LW00000021`
* **Access:** Authenticated
* **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "lr_number": "LW00000021",
    "sender": "Industrial Fasteners Ltd",
    "receiver": "Metro Infra Tech",
    "packages": 5,
    "weight": 120.5,
    "status": "in_transit",
    "from_branch": "HYDERABAD",
    "to_branch": "BENGALURU HUB"
  }
}
```

* **Record Touching Action:**
* **Endpoint:** `POST /api/dispatch/touching-lr`
* **Request Body:**
```json
{
  "lr_number": "LW00000021",
  "centre_name": "Kurnool Transit Hub",
  "action": "verified_and_passed",
  "remarks": "Seal intact, loaded onto connecting vehicle TS08UB5678"
}
```

---

## 11. FasTag Toll Import

Facilitates toll expense reconciliation from NHAI/bank FasTag electronic toll collection statements.

### 11.1 Upload / Post FasTag Toll Record
* **Endpoint:** `POST /api/import/fastag`
* **Access:** Authenticated
* **Request Body:**
```json
{
  "tag_id": "TAG992817263",
  "vehicle_no": "TS09UA1234",
  "toll_plaza": "Raichur Toll Plaza",
  "amount": 285.00,
  "transaction_time": "2026-11-15T18:45:00.000Z",
  "status": "posted",
  "branch_id": "6740ad2f12a149001b2c45d0"
}
```

### 11.2 Retrieve FasTag Entries
* **Endpoint:** `GET /api/import/fastag?branch_id=6740ad2f12a149001b2c45d0`
* **Success Response (200 OK):**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "6740ad2f12a149001b2c4601",
      "tag_id": "TAG992817263",
      "vehicle_no": "TS09UA1234",
      "toll_plaza": "Raichur Toll Plaza",
      "amount": 285.00,
      "status": "posted"
    }
  ]
}
```

---

## 12. Proof of Delivery (POD)

Complete chain of custody verification including mobile delivery agent image capture, timestamp logging, GPS coordinates, and manager auditing.

### 12.1 Upload POD Evidence File
* **Endpoint:** `POST /api/pod/:id/upload`
* **Access:** Authenticated (Staff / Driver)
* **Content-Type:** `multipart/form-data`
* **Form Fields:**
  * `pod`: Binary file (`image/jpeg`, `image/png`, `application/pdf`, max 10MB)
  * `received_by`: Person accepting delivery (e.g. `Suresh Kumar`)
  * `relationship`: (e.g. `Warehouse Incharge`, `Security`, `Self`)
  * `latitude`: Optional decimal coordinate
  * `longitude`: Optional decimal coordinate
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "POD file uploaded successfully",
  "file_url": "/uploads/pod-1731690000000-8819.jpg",
  "pod_status": "uploaded"
}
```

### 12.2 Manager POD Verification
Audits the signature and stamped physical paper. Transitions the consignment to final `delivered` status and releases delivery hold.

* **Endpoint:** `PATCH /api/pod/:id/verify`
* **Access:** Authenticated (Manager / Admin)
* **Request Body:**
```json
{
  "status": "verified",
  "verification_notes": "Official company stamp and receiver signature verified"
}
```
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "POD verified successfully. Shipment status updated to delivered."
}
```

---

## 13. Invoicing & Taxation

Generates compliant GST tax invoices for consigned logistics services.

* **Endpoint:** `POST /api/invoices`
* **Access:** Authenticated
* **Request Body:**
```json
{
  "shipment_id": "6740ad2f12a149001b2c45c9",
  "customer_name": "Industrial Fasteners Ltd",
  "customer_gst": "36AAACA1234A1Z5",
  "base_amount": 4000.00,
  "gst_rate": 18,
  "sgst": 360.00,
  "cgst": 360.00,
  "igst": 0.00,
  "total_amount": 4720.00,
  "payment_terms": "net_30"
}
```
* **Success Response (201 Created):**
```json
{
  "_id": "6740ad2f12a149001b2c4610",
  "invoice_number": "INV-2026-00412",
  "total_amount": 4720.00,
  "status": "issued"
}
```

---

## 14. Payment Collection & Reconciliation

Tracks payment balances across `prepaid`, `to_pay` (at delivery), and `billed` (monthly ledger).

### 14.1 Retrieve Branch Payment Summary
* **Endpoint:** `GET /api/payments?branch_id=6740ad2f12a149001b2c45d0`
* **Success Response (200 OK):**
```json
{
  "payments": [...],
  "summary": {
    "total_collected": 184500.00,
    "pending_collection": 24300.00,
    "to_pay_balance": 18200.00
  }
}
```

### 14.2 Collect Payment
* **Endpoint:** `PATCH /api/payments/:id/collect`
* **Request Body:**
```json
{
  "collected_amount": 4720.00,
  "payment_mode": "upi",
  "reference_no": "UPI/432190827391/AXIS",
  "notes": "Collected at branch delivery counter"
}
```

---

## 15. Route Expenses & Fleet Economics

Audits en-route trip expenses including driver bata, diesel fuel receipts, toll plaza payments, and loading/unloading charges.

* **Endpoint:** `POST /api/route-expenses`
* **Request Body:**
```json
{
  "vehicle_no": "TS09UA1234",
  "expense_category": "fuel",
  "amount": 3500.00,
  "odometer_reading": 128450,
  "fuel_litres": 38.5,
  "fuel_rate": 90.90,
  "petrol_pump": "HPCL Highway Oasis, Kurnool",
  "receipt_no": "REC-99482",
  "branch_id": "6740ad2f12a149001b2c45d0"
}
```

---

## 16. Executive Dashboard & Analytics

Calculates real-time KPIs filtered by tenant and active branch scope.

* **Endpoint:** `GET /api/dashboard?branch_id=6740ad2f12a149001b2c45d0`
* **Access:** Authenticated
* **Success Response (200 OK):**
```json
{
  "stats": {
    "total_shipments": 1420,
    "booked": 45,
    "in_transit": 128,
    "delivered": 1247,
    "pending_pod": 12,
    "revenue": 1485000.00
  },
  "financials": {
    "collected_revenue": 1390000.00,
    "outstanding_balance": 95000.00,
    "operational_expenses": 312000.00
  },
  "branch_performance": [
    {
      "branch_name": "HYDERABAD",
      "outbound_count": 820,
      "inbound_count": 600
    }
  ]
}
```

---

## 17. Public Tracking & Webhooks

### 17.1 Public Consignment Tracking
Unauthenticated public tracking endpoint for end-customers.

* **Endpoint:** `GET /api/shipments/track/:lr`
* **Access:** Public (No token required)
* **Example:** `GET /api/shipments/track/LW00000021`
* **Success Response (200 OK):**
```json
{
  "tracking_number": "LW00000021",
  "status": "in_transit",
  "current_location": "BENGALURU HUB",
  "origin": "HYDERABAD",
  "destination": "BENGALURU",
  "packages": 5,
  "weight": 120.5,
  "history": [
    { "status": "booked", "timestamp": "2026-11-15T10:00:00.000Z", "location": "HYDERABAD" },
    { "status": "pickup_done", "timestamp": "2026-11-15T12:30:00.000Z", "location": "Factory Cherlapally" },
    { "status": "in_transit", "timestamp": "2026-11-15T18:00:00.000Z", "location": "Kurnool Transit" }
  ]
}
```

### 17.2 WhatsApp Inbound Webhook
* **Endpoint:** `POST /api/whatsapp/webhook`
* **Behavior:** Processes automated bot commands:
  * `TRACK <LR>`: Sends real-time status and expected delivery.
  * `QUOTE <origin> <dest> <weight>`: Calculates instant freight quote.

---

## 18. System Health & Monitoring

### 18.1 Health Status
* **Endpoint:** `GET /api/health`
* **Access:** Public
* **Success Response (200 OK):**
```json
{
  "status": "ok",
  "time": "2026-11-15T22:50:00.000Z",
  "env": "development",
  "version": "1.0.0",
  "uptime_s": 8420,
  "db": {
    "state": "connected",
    "ready": true
  },
  "redis": {
    "connected": false,
    "enabled": false
  },
  "memory": {
    "rss_mb": 112,
    "heap_used_mb": 64,
    "heap_total_mb": 96
  }
}
```

### 18.2 Prometheus Metrics
* **Endpoint:** `GET /api/metrics`
* **Access:** Restricted in production (Header `x-metrics-token: <METRICS_TOKEN>`)

---

## 19. Standard Error Codes & Handling

| HTTP Code | Error Code | Description | Corrective Action |
| :--- | :--- | :--- | :--- |
| `400` | `INVALID_INPUT` | Missing or malformed request parameters | Verify JSON schema and required fields |
| `401` | `UNAUTHORIZED` | Token missing, expired, or invalid signature | Log in again via `/api/auth/login` |
| `403` | `FORBIDDEN` | Insufficient permissions or wrong tenant/branch | Check assigned branch IDs and role |
| `404` | `NOT_FOUND` | Resource ID does not exist | Verify object ID or LR tracking number |
| `429` | `TOO_MANY_REQUESTS` | Rate limit threshold exceeded | Back off and retry after cooldown window |
| `500` | `INTERNAL_SERVER_ERROR` | Unexpected backend runtime exception | Inspect server error logs for root cause |
