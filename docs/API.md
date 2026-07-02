# LocalWheels API Reference

**Base URL (production):** `https://<your-render-subdomain>.onrender.com`  
**Base URL (development):** `http://localhost:5000`  
**Version:** 1.0.0  
**Auth scheme:** Bearer JWT (`Authorization: Bearer <token>`)

---

## Contents

1. [Global conventions](#1-global-conventions)
2. [Authentication](#2-authentication)
3. [Branches](#3-branches)
4. [Users](#4-users)
5. [Shipments](#5-shipments)
6. [POD (Proof of Delivery)](#6-pod-proof-of-delivery)
7. [Payments](#7-payments)
8. [Route Expenses](#8-route-expenses)
9. [Dashboard](#9-dashboard)
10. [Health](#10-health)
11. [Error responses](#11-error-responses)
12. [Rate limits](#12-rate-limits)

---

## 1. Global conventions

### Authentication
All endpoints except `POST /api/auth/login`, `GET /api/health`, and `GET /api/shipments/track/:lr` require a valid JWT in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…
```

Tokens expire after **7 days**. Re-login to obtain a fresh token.

### Multi-tenancy
Every authenticated request is scoped to the `company_id` embedded in the JWT. Users can only read and write data belonging to their own company.

### Branch scoping
Endpoints that operate on branch-level data (shipments, payments, POD, dashboard) require a `branch_id` query parameter. The middleware validates:
- The `branch_id` is a valid MongoDB ObjectId
- The authenticated user has access to that branch (via their `branch_ids` array, or admin/superadmin role which grants access to all branches)

### Role hierarchy

| Role | Can access |
|---|---|
| `superadmin` | Everything — cross-company admin |
| `admin` | All branches within their company |
| `manager` | Assigned branches only |
| `staff` | Assigned branches only |

### Pagination
List endpoints accept `page` (default: 1) and `limit` (default: 20, max: 100) query params.  
Response includes a `pagination` object: `{ total, page, limit, pages }`.

### Date format
Input dates: ISO 8601 (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ssZ`)  
Output dates: `DD/MM/YYYY`

---

## 2. Authentication

### POST /api/auth/login

Authenticate a user and receive a JWT.

**Rate limit:** 10 requests per 15 minutes per IP (in production).

**Request body**
```json
{
  "username": "admin",
  "password": "your_password"
}
```

**Response 200**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…",
  "user": {
    "id": "64abc…",
    "username": "admin",
    "full_name": "Admin User",
    "email": "admin@example.com",
    "role": "admin",
    "company_id": "64abc…",
    "company_name": "Acme Logistics",
    "subscription_plan": "pro"
  }
}
```

**Errors**
| Code | Meaning |
|---|---|
| 400 | username or password missing |
| 401 | Invalid credentials |
| 429 | Rate limit exceeded |

---

### GET /api/auth/me

Returns the currently authenticated user's profile.

**Auth:** Required  
**Response 200** — same shape as `user` object from login, plus full profile fields.

---

## 3. Branches

### GET /api/branches

Returns all branches for the company with per-branch user counts.  
**Auth:** Required | **Role:** `admin`, `superadmin`

**Response 200**
```json
[
  {
    "_id": "64abc…",
    "branch_name": "HYDERABAD",
    "location": "Hyderabad",
    "address": "123 Main St",
    "phone": "9000000000",
    "is_active": true,
    "user_count": 5,
    "company_id": "64abc…"
  }
]
```

---

### GET /api/branches/user

Returns only the branches the current user can access (respects `is_active` filter, excludes soft-deleted branches).  
**Auth:** Required | **Role:** all

---

### GET /api/branches/users/:branchId

Returns users assigned to a specific branch.  
**Auth:** Required | **Role:** `admin`, `superadmin`

**Response 200**
```json
[
  {
    "_id": "…",
    "username": "staff1",
    "full_name": "Staff One",
    "role": "staff",
    "email": "staff1@example.com"
  }
]
```

---

### POST /api/branches

Creates a new branch.  
**Auth:** Required | **Role:** `admin`, `superadmin`

**Request body**
```json
{
  "branch_name": "MUMBAI",
  "location": "Mumbai",
  "address": "456 Bandra St",
  "phone": "9111111111"
}
```

**Notes**
- `branch_name` is required; stored uppercase.
- Returns the created document.

**Response 201**
```json
{
  "_id": "64abc…",
  "branch_name": "MUMBAI",
  "company_id": "…",
  "is_active": true
}
```

---

### PUT /api/branches/:id

Updates branch fields. Also used to **restore** a soft-deleted branch (`{ "is_active": true }`).  
**Auth:** Required | **Role:** `admin`, `superadmin`

**Request body** — include only fields to update:
```json
{
  "branch_name": "MUMBAI HQ",
  "location": "Mumbai",
  "address": "789 Colaba St",
  "phone": "9222222222",
  "is_active": true
}
```

**Response 200** `{ "success": true }`

**Errors**
| Code | Meaning |
|---|---|
| 400 | Invalid ObjectId |
| 404 | Branch not found |

---

### DELETE /api/branches/:id — **Soft delete**

> **Design: branches are never hard-deleted.**  
> Removing a branch document would orphan all historical shipments, PODs, payments, and route expenses that reference it, breaking financial reports and LR audit trails.

**What this endpoint does:**
- Sets `is_active = false` on the branch document.
- The branch disappears from `GET /api/branches/user` (the frontend branch selector).
- The branch still appears in `GET /api/branches` (admin list) with `is_active: false`.
- All historical data (shipments, PODs, payments) remains fully intact and queryable.

**Restoration:** `PUT /api/branches/:id` with `{ "is_active": true }`.

**Auth:** Required | **Role:** `admin`, `superadmin`

**Response 200**
```json
{ "success": true, "soft_deleted": true }
```

**Errors**
| Code | Meaning |
|---|---|
| 400 | Invalid ObjectId |
| 404 | Branch not found |

---

## 4. Users

### GET /api/users

Returns all users for the company (passwords excluded, branch names populated).  
**Auth:** Required | **Role:** `admin`, `superadmin`

---

### POST /api/users

Creates a user in the current company.  
**Auth:** Required | **Role:** `admin`, `superadmin`

**Request body**
```json
{
  "username": "newstaff",
  "password": "secure_password",
  "full_name": "New Staff",
  "email": "newstaff@example.com",
  "phone": "9000000001",
  "role": "staff",
  "branch_ids": ["64abc…", "64def…"]
}
```

**Roles:** `superadmin` | `admin` | `manager` | `staff`  
**Response 201** `{ "id": "…", "_id": "…", "username": "newstaff" }`

**Errors**
| Code | Meaning |
|---|---|
| 400 | username/password missing or invalid role |
| 409 | Username already exists |

---

### PUT /api/users/:id

Updates a user's profile, role, branch assignments, or password.  
**Auth:** Required | **Role:** `admin`, `superadmin`

**Request body** — include only fields to update:
```json
{
  "full_name": "Updated Name",
  "role": "manager",
  "branch_ids": ["64abc…"],
  "password": "new_password",
  "is_active": true
}
```

**Response 200** `{ "success": true }`

---

### DELETE /api/users/:id — Soft delete

Sets `is_active = false`. The user can no longer log in. Same rationale as branch soft-delete — preserves audit trails for shipments created by that user.

**Auth:** Required | **Role:** `admin`, `superadmin`  
**Constraint:** Cannot delete your own account.  
**Response 200** `{ "success": true }`

---

## 5. Shipments

### GET /api/shipments

Paginated list of shipments for a branch.  
**Auth:** Required | **Query:** `branch_id` required

**Query parameters**
| Param | Type | Description |
|---|---|---|
| `branch_id` | ObjectId | **Required** |
| `status` | string | Filter by status (see values below) |
| `payment_type` | string | `paid` \| `topay` \| `fob` |
| `search` | string | Search LR number, sender name, receiver name |
| `date_from` | date | Filter booking date from (YYYY-MM-DD) |
| `date_to` | date | Filter booking date to (YYYY-MM-DD) |
| `page` | int | Default: 1 |
| `limit` | int | Default: 20, max: 100 |

**Shipment statuses:** `booked` | `in_transit` | `out_for_delivery` | `delivered` | `hold` | `lost` | `returned`

**Response 200**
```json
{
  "data": [
    {
      "_id": "…",
      "lr_number": "LW00000001",
      "sender_name": "Sender Co",
      "receiver_name": "Receiver Co",
      "destination": "Chennai",
      "status": "in_transit",
      "booking_date": "01/01/2025",
      "freight_amount": 1500,
      "payment_type": "topay",
      "pod_status": null
    }
  ],
  "pagination": { "total": 150, "page": 1, "limit": 20, "pages": 8 }
}
```

---

### GET /api/shipments/track/:lr — **Public**

Track a shipment by LR number. **No authentication required.**

**Response 200**
```json
{
  "lr_number": "LW00000001",
  "sender_name": "…",
  "receiver_name": "…",
  "destination": "Chennai",
  "status": "delivered",
  "booking_date": "01/01/2025",
  "packages": 2,
  "weight": 15.5,
  "origin_branch": "HYDERABAD",
  "delivery_date": "05/01/2025",
  "pod_status": "verified"
}
```

---

### GET /api/shipments/:id

Full detail for a single shipment including POD and payment info.  
**Auth:** Required

---

### POST /api/shipments

Creates a shipment and auto-generates an LR number (`LWxxxxxxxx`).  
For `topay`/`fob` shipments with `freight_amount > 0`, a Payment record is automatically created.  
**Auth:** Required | **Query:** `branch_id` required

**Request body**
```json
{
  "sender_name": "Sender Co",
  "sender_phone": "9000000000",
  "sender_address": "123 Sender St",
  "receiver_name": "Receiver Co",
  "receiver_phone": "9111111111",
  "receiver_address": "456 Receiver Ave",
  "destination": "Chennai",
  "weight": 15.5,
  "packages": 2,
  "description": "Electronics",
  "freight_amount": 1500,
  "payment_type": "topay",
  "eway_bill": "EWB123456789",
  "eway_bill_expiry": "2025-01-15"
}
```

**Required:** `sender_name`, `receiver_name`, `destination`  
**Response 201** `{ "id": "…", "lr_number": "LW00000001" }`

---

### PATCH /api/shipments/:id/status

Updates shipment status. When status → `delivered`, a POD record is automatically created with `status: pending`.  
**Auth:** Required

**Request body** `{ "status": "delivered" }`

---

### PUT /api/shipments/:id

Updates exception fields (short/damage quantities, e-way bill).  
**Auth:** Required

**Request body**
```json
{
  "short_qty": 1,
  "damage_qty": 0,
  "eway_bill": "EWB999",
  "eway_bill_expiry": "2025-02-01"
}
```

---

## 6. POD (Proof of Delivery)

### GET /api/pod

Paginated POD list for a branch.  
**Auth:** Required | **Query:** `branch_id` required

**Query parameters:** `status` (filter), `page`, `limit`

**POD statuses:** `pending` | `uploaded` | `verified`

**Response 200**
```json
{
  "data": [
    {
      "id": "…",
      "shipment_id": "…",
      "lr_number": "LW00000001",
      "sender_name": "Sender Co",
      "receiver_name": "Receiver Co",
      "status": "uploaded",
      "receiver_name": "John Doe",
      "delivery_date": "05/01/2025",
      "uploaded_at": "05/01/2025",
      "uploaded_file": "/uploads/pod_abc_1735084800000.jpg"
    }
  ],
  "pagination": { "total": 10, "page": 1, "limit": 20 }
}
```

---

### POST /api/pod/:shipmentId/upload

Upload a POD file for a delivered shipment.  
**Auth:** Required | **Content-Type:** `multipart/form-data`

**Allowed file types:** JPG, PNG, PDF (validated by both extension and MIME type)  
**Max file size:** 5 MB

**Form fields**
| Field | Type | Description |
|---|---|---|
| `file` | File | The POD document |
| `receiver_name` | string | Name of person who received the shipment |
| `delivery_date` | date | Actual delivery date |

**Response 200** `{ "success": true, "file": "/uploads/pod_abc_1735084800000.jpg" }`

---

### PATCH /api/pod/:shipmentId/verify

Marks a POD as verified (reviewed and approved by office staff).  
**Auth:** Required

**Response 200** `{ "success": true }`

---

## 7. Payments

### GET /api/payments

Paginated payment list with outstanding summary for a branch.  
**Auth:** Required | **Query:** `branch_id` required

**Query parameters:** `status`, `payment_type`, `page`, `limit`

**Payment statuses:** `pending` | `partial` | `paid` | `overdue`  
**Payment types:** `paid` | `topay` | `fob`

**Response 200**
```json
{
  "data": [
    {
      "id": "…",
      "shipment_id": "…",
      "lr_number": "LW00000001",
      "sender_name": "Sender Co",
      "amount": 1500,
      "payment_type": "topay",
      "status": "pending",
      "due_date": "16/01/2025",
      "paid_date": null
    }
  ],
  "summary": {
    "paid_outstanding": 5000,
    "topay_outstanding": 12000,
    "overdue": 3000,
    "collected": 45000
  },
  "pagination": { "total": 50, "page": 1, "limit": 20 }
}
```

---

### PATCH /api/payments/:id/collect

Marks a payment as collected (sets `status: "paid"`, `paid_date: now`).  
**Auth:** Required

**Response 200** `{ "success": true }`

---

## 8. Route Expenses

### GET /api/route-expenses

List all route expenses. **Auth:** Required

---

### GET /api/route-expenses/:id

Single route expense detail. **Auth:** Required

---

### POST /api/route-expenses

Create a route expense entry. **Auth:** Required

---

### PUT /api/route-expenses/:id

Update a route expense. **Auth:** Required

---

### DELETE /api/route-expenses/:id

Delete a route expense. **Auth:** Required

---

## 9. Dashboard

### GET /api/dashboard

Branch KPI metrics and alert counters.  
**Auth:** Required | **Query:** `branch_id` required

**Query parameters**
| Param | Type | Description |
|---|---|---|
| `branch_id` | ObjectId | **Required** |
| `from_date` | date | Start of date range (booking_date) |
| `to_date` | date | End of date range (inclusive) |

**Response 200**
```json
{
  "eway_expiry":      3,
  "hold_cn":          1,
  "short_qty":        5,
  "damage_qty":       2,
  "excess_qty":       0,
  "undelivered_lr":   8,
  "pod_submit":       10,
  "pod_send":         3,
  "pod_received":     7,
  "pod_reject":       0,
  "paid_outstanding": 15000,
  "to_pay":           45000,
  "overdue":          8000,
  "bill_pending":     0,
  "cash":             0
}
```

**Field descriptions**
| Field | Description |
|---|---|
| `eway_expiry` | Shipments with e-way bill expiring today, not yet delivered |
| `hold_cn` | Shipments in `hold` or `lost` status |
| `short_qty` | Total short (missing) package quantity |
| `damage_qty` | Total damaged package quantity |
| `undelivered_lr` | Shipments with status `returned` |
| `pod_submit` | Delivered shipments with no POD or POD in `pending` state (awaiting upload) |
| `pod_send` | PODs uploaded but not yet verified |
| `pod_received` | PODs verified (received and confirmed at office) |
| `paid_outstanding` | Sum of `paid`-type payments still in `pending` status |
| `to_pay` | Sum of `topay` payments in `pending` or `partial` status |
| `overdue` | Sum of payments in `overdue` status |

---

## 10. Health

### GET /api/health

Health check — no authentication required. Used by Render and uptime monitors.

**Response 200**
```json
{
  "status": "ok",
  "time": "2026-05-29T11:00:00.000Z",
  "env": "production",
  "version": "1.0.0",
  "uptime": 3600
}
```

---

## 11. Error responses

All errors follow a consistent shape:

```json
{ "error": "Human-readable error message" }
```

| HTTP Code | Meaning |
|---|---|
| 400 | Bad request (missing required field, invalid ID format, invalid file type) |
| 401 | Unauthenticated — missing, invalid, or expired JWT |
| 403 | Forbidden — authenticated but insufficient role, or CORS origin blocked |
| 404 | Resource not found |
| 409 | Conflict — duplicate value (e.g., username already exists) |
| 429 | Rate limit exceeded |
| 500 | Internal server error (stack trace hidden in production) |

In production, 5xx responses always return `{ "error": "Internal server error" }` — details are logged server-side only.

---

## 12. Rate limits

| Endpoint | Limit | Window | Behaviour |
|---|---|---|---|
| `POST /api/auth/login` | 10 requests | 15 minutes | Per IP — applies in production only |
| All `/api/*` routes | 300 requests | 15 minutes | Per IP — applies in production only |

Rate limit headers are included in every response:
- `RateLimit-Limit` — max requests in window
- `RateLimit-Remaining` — requests left
- `RateLimit-Reset` — window reset timestamp

When limit is exceeded, the server responds with **429 Too Many Requests**.
