# LOCALWHEELS LOGISTICS PLATFORM — ROLE-BASED ACCESS CONTROL (RBAC) PERMISSION MATRIX

**Document Version:** 1.0.0  
**Effective Date:** November 16, 2026  
**Security Model:** Role-Based Access Control with Multi-Tenant Scoping & Default Deny  

---

## 1. Role Definitions & Hierarchy

| Role Code | Role Name | Scope & Authority |
| :--- | :--- | :--- |
| `superadmin` / `super_admin` | **Platform Super Administrator** | Platform-wide administrative authority across all tenants. Can provision initial administrative users, manage global settings, and audit platform events. |
| `admin` | **Company Administrator** | Full administrative authority within assigned company (`req.user.company_id`). Can manage company users, branches, settings, masters, and financial configurations. |
| `manager` / `branch_manager` | **Branch / Operations Manager** | Operational and management authority scoped strictly to assigned branches (`req.user.branch_ids`). Can manage branch staff, oversee dispatch, verify PODs, and authorize transfers. |
| `operations_manager` | **Operations Lead** | Operational authority across assigned hubs for fleet dispatch, load planning (LHS), and route operations. |
| `staff` | **Branch Staff / Operator** | Front-desk operations: LR generation, shipment booking, cash/To-Pay collection, and customer inquiries within assigned branch. |
| `field_executive` | **Field Agent / Pickup Executive** | Mobile operational tasks: pickup confirmation, package barcode scanning, and field delivery updates. |
| `driver` | **Fleet Driver** | Route execution, trip log entries, GPS updates, and mobile POD image capture. |
| `customer` | **Client / Shipper Portal User** | Restricted to own consignments, public tracking, booking requests, and support tickets. |

---

## 2. Comprehensive RBAC Permission Matrix

**Legend:**
- `●` = **Full Permission (Read, Write, Manage)**
- `◐` = **Scoped / Read-Only / Branch-Restricted**
- `○` = **No Access (Default Deny - HTTP 403 Forbidden)**

| Functional Area & Action | Endpoint(s) | `superadmin` | `admin` | `manager` | `operations_manager` | `staff` | `field_executive` | `driver` | `customer` |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **System & Bootstrap** | | | | | | | | | |
| Bootstrap Superadmin | `POST /api/auth/bootstrap-superadmin` | ● (One-time) | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| Check Bootstrap Status | `GET /api/auth/bootstrap-status` | ● | ● | ● | ● | ● | ● | ● | ● |
| **Company Administration** | | | | | | | | | |
| View Company Details | `GET /api/companies/mine` | ● | ● | ◐ | ◐ | ◐ | ○ | ○ | ○ |
| Update Company Settings | `PUT /api/companies/mine` | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| Manage App Configuration | `PUT /api/companies/settings` | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| Manage Master Lists | `POST/PUT /api/companies/master-config` | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| **User & Access Management** | | | | | | | | | |
| List Company Users | `GET /api/users` | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| Create User (`staff`/`manager`/`admin`) | `POST /api/users` | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| Create Superadmin | `POST /api/users` (role: superadmin) | ● | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| Update User Profile / Password | `PUT /api/users/:id` | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| Self-Promotion / Self-Branch Change | `PUT /api/users/:id` (own user) | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| Deactivate User | `DELETE /api/users/:id` | ● | ● (non-super) | ○ | ○ | ○ | ○ | ○ | ○ |
| **Branch Management** | | | | | | | | | |
| List All Company Branches | `GET /api/branches` | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| List Assigned Branches | `GET /api/branches/user` | ● | ● | ● | ● | ● | ● | ● | ○ |
| Create / Update Branch | `POST/PUT /api/branches` | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| Soft-Delete Branch | `DELETE /api/branches/:id` | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| **Shipments & Consignments (LR)** | | | | | | | | | |
| List Shipments (Scoped) | `GET /api/shipments` | ● | ● | ◐ (Assigned) | ◐ (Assigned) | ◐ (Assigned) | ○ | ○ | ○ |
| Create Shipment + LR | `POST /api/shipments` | ● | ● | ● | ● | ● | ○ | ○ | ○ |
| View Shipment Detail | `GET /api/shipments/:id` | ● | ● | ● | ● | ● | ◐ | ◐ | ◐ (Own) |
| Public Tracking (By LR) | `GET /api/shipments/track/:lr` | ● | ● | ● | ● | ● | ● | ● | ● |
| Update Shipment Status | `PATCH /api/shipments/:id/status` | ● | ● | ● | ● | ● | ◐ | ◐ | ○ |
| Inter-Branch Shipment Transfer | `POST /api/shipments/:id/transfer` | ● | ● | ◐ (Origin) | ◐ (Origin) | ◐ (Origin) | ○ | ○ | ○ |
| **Bookings & Pickups** | | | | | | | | | |
| List Bookings | `GET /api/bookings` | ● | ● | ● | ● | ● | ◐ | ○ | ◐ (Own) |
| Create Booking Request | `POST /api/bookings` | ● | ● | ● | ● | ● | ● | ○ | ● |
| Complete Pickup (`pickup_done`) | `PATCH /api/bookings/:id/status` | ● | ● | ● | ● | ● | ● | ○ | ○ |
| **Proof of Delivery (POD)** | | | | | | | | | |
| List POD Records | `GET /api/pod` | ● | ● | ◐ (Assigned) | ◐ (Assigned) | ◐ (Assigned) | ○ | ○ | ○ |
| Upload POD Image / PDF | `POST /api/pod/:id/upload` | ● | ● | ● | ● | ● | ● | ● | ○ |
| Verify POD Sign-off | `PATCH /api/pod/:id/verify` | ● | ● | ● | ○ | ○ | ○ | ○ | ○ |
| **Financial & Invoicing** | | | | | | | | | |
| List Invoices | `GET /api/invoices` | ● | ● | ◐ (Assigned) | ○ | ○ | ○ | ○ | ◐ (Own) |
| Generate Invoice | `POST /api/invoices` | ● | ● | ● | ○ | ○ | ○ | ○ | ○ |
| Cancel / Delete Invoice | `DELETE /api/invoices/:id` | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| View Payments List | `GET /api/payments` | ● | ● | ◐ (Assigned) | ○ | ◐ (Assigned) | ○ | ○ | ○ |
| Mark Payment Collected | `PATCH /api/payments/:id/collect` | ● | ● | ◐ (Assigned) | ○ | ◐ (Assigned) | ○ | ○ | ○ |
| General Ledger & Accounting | `GET/POST /api/general-ledger` | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| Accounts Payable / Receivable | `GET/POST /api/accounts-payable` | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| Banking & Cashflow | `GET/POST /api/banking` | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| Cost Centers & Budgets | `GET/POST /api/cost-centers` | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| **Warehouse & WMS Operations** | | | | | | | | | |
| Manage Warehouses, Zones & Bins | `POST/PUT /api/warehouses` | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| Inbound / Outbound Operations | `GET/POST /api/inbound`, `/api/outbound` | ● | ● | ● | ● | ● | ○ | ○ | ○ |
| Dock & Bay Scheduling | `GET/POST /api/docks` | ● | ● | ● | ● | ● | ○ | ○ | ○ |
| Inventory & Stock Auditing | `GET /api/inventory` | ● | ● | ● | ● | ● | ○ | ○ | ○ |
| Barcode & RFID Scanning | `POST /api/barcode`, `/api/rfid` | ● | ● | ● | ● | ● | ● | ○ | ○ |
| **Fleet, Telemetry & Maintenance** | | | | | | | | | |
| Manage Fleet Vehicles | `POST/PUT /api/vehicles` | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| Manage Drivers | `POST/PUT /api/drivers` | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| Telemetry & IoT Ingestion | `POST /api/telemetry` | ● | ● | ● | ● | ● | ○ | ● | ○ |
| Maintenance Work Orders | `POST/PUT /api/workorders` | ● | ● | ● | ● | ○ | ○ | ○ | ○ |
| **Enterprise Automation & Digital Workers** | | | | | | | | | |
| Create / Edit Automation Rules | `POST/PUT /api/automation` | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| Digital Workers & RPA Tasks | `POST/PUT /api/digital-workers` | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| Automation Job Scheduler | `POST/PUT /api/scheduler` | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| **Customer & Shipper Portal** | | | | | | | | | |
| Shipper Bookings & Consignments | `GET/POST /api/customer-portal` | ● | ● | ◐ | ◐ | ◐ | ○ | ○ | ● (Own) |
| Consignment Tracking (Public) | `GET /api/shipments/track/:lr` | ● | ● | ● | ● | ● | ● | ● | ● |
| Customer Invoices (Own) | `GET /api/invoices` | ● | ● | ◐ | ○ | ○ | ○ | ○ | ◐ (Own) |
| **Document Vault & AI** | | | | | | | | | |
| Upload Documents | `POST /api/documents/upload` | ● | ● | ● | ● | ● | ○ | ○ | ○ |
| Download Document (Scoped) | `GET /api/documents/:id/download` | ● | ● | ● | ● | ● | ○ | ○ | ○ |
| View Security Audit Logs | `GET /api/audit-logs` | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| **Analytics, Control Tower & Exports** | | | | | | | | | |
| Control Tower Live Monitoring | `GET /api/control-tower` | ● | ● | ◐ | ◐ | ○ | ○ | ○ | ○ |
| Business Intelligence & Reports | `GET /api/reports` | ● | ● | ◐ | ◐ | ○ | ○ | ○ | ○ |
| Data Export Operations | `POST /api/reports/export` | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |

---

## 3. Enforcement Architecture & Policy Rules

1. **Default Deny:**  
   Every endpoint not explicitly designated as public (`/api/auth/login`, `/api/health`, `/api/shipments/track/:lr`) enforces `authenticate` middleware. If no credentials or an invalid token is provided, the API denies access with HTTP `401 Unauthorized`.
2. **Strict Server-Side Derivation:**  
   `req.user.company_id` and `req.user.role` are populated strictly from validated server-side tokens and database records. The API rejects any attempt to override company context via request bodies (`req.body.company_id`), headers, or query parameters.
3. **Role Normalization:**  
   Aliases such as `super_admin` are automatically normalized to `superadmin`, and `branch_manager` to `manager`, guaranteeing consistent evaluation across all route guards.
4. **Self-Escalation Safeguards:**  
   Users cannot modify their own `role` or `branch_ids` via user management routes (`403 Cannot modify your own role`).
5. **Administrative Segregation:**  
   Company administrators cannot create, promote, modify, or deactivate `superadmin` users (`403 Only superadmin can manage superadmin accounts`).

