# Release Notes
**LocalWheels Enterprise Platform**
**Format:** Newest release first

---

## v1.0.0 — Production Release
**Release Date:** 2026-07-02  
**Deployment:** Rajdhani Cargo Services Pvt Ltd (Pilot)  
**Certification:** LW-CERT-2026-001  
**Validation:** 48/48 PASS

---

### What's in v1.0.0

This is the first production release of LocalWheels Enterprise. It is a complete, multi-tenant logistics SaaS platform built for Indian surface transport and logistics companies.

---

### Core Modules

**Operations**
- Shipment management with auto-numbered LR (LW00000001+)
- Proof of Delivery (POD) upload and confirmation
- Multi-branch operations (Company → Branch → User hierarchy)
- E-way bill tracking and expiry alerts

**Sales & CRM**
- Lead → Opportunity → Quote → Booking pipeline
- Customer master management with GST/GSTIN
- Credit limit management per customer
- Customer portal

**Fleet**
- Vehicle master (12 types: mini truck to container)
- Driver management with license expiry tracking
- Vehicle assignment to shipments
- Maintenance scheduling

**Finance**
- GST-compliant invoice generation (CGST/SGST/IGST)
- Chart of Accounts (42 standard logistics accounts)
- Payment recording
- Financial dashboard

**Warehouse**
- Inbound / outbound management
- Inventory tracking with barcode/RFID
- Dock management
- Warehouse analytics

**Customer Support**
- Complaint management with SLA
- Knowledge base
- Live agent routing
- Complaint sentiment analysis

**Analytics & BI**
- Executive dashboard (54 KPIs)
- MIS dashboards per module
- AI-powered business intelligence
- Fleet intelligence
- Financial analytics

**AI & Automation**
- Voice assistant for dispatch
- OCR for document digitization
- Route optimization engine
- Demand forecasting
- Automated notifications (email/SMS/WhatsApp)
- Workflow automation engine
- Digital twin / simulation

**Platform**
- Multi-tenant isolation (company_id scoping)
- JWT authentication (bcrypt + HS256, 7-day expiry)
- Role-based access control (6 roles)
- 6-step setup wizard (new company onboarding)
- CSV import utility (customers, vehicles, drivers, inventory, CoA, opening balances)
- Developer API gateway with webhooks
- Prometheus-format metrics (`/api/metrics`)
- Structured health endpoint (`/api/health`)
- Rate limiting (300 req/15min global, 10 login/15min)
- Helmet security headers
- gzip compression

---

### Platforms Supported

| Platform | Support |
|---|---|
| Web browser (Chrome, Edge, Firefox, Safari) | ✅ |
| API clients (Postman, curl, SDKs) | ✅ |
| Mobile browsers | ✅ (responsive) |
| Native mobile app | ❌ (Version 2.0 candidate) |

---

### Known Limitations

| Limitation | Workaround | Plan |
|---|---|---|
| Email notifications require SMTP config | Manual email | Customer configures SMTP |
| GPS tracking not integrated | Manual status updates | Version 2.0 candidate |
| E-way Bill API not integrated | Manual e-way bill | Version 2.0 candidate |
| No MFA | Strong password policy | Version 2.0 candidate |
| Single-server deployment | PM2 single process | Redis + cluster when needed |

---

### Upgrade Path

There are no upgrades from v0.x — this is the first production release. Future releases will follow:

```
v1.0.0  →  v1.0.1 (hotfixes)  →  v1.0.2 (hotfixes)  →  ...
                                                             ↓
                                                     v2.0.0 (after gate)
```

Hotfixes (v1.0.x) are deployed transparently. No customer data migration required for hotfixes.

---

### API Version

The current API does not use URL versioning (`/v1/`). If versioning is added in v2.0, all v1.0 endpoints will remain functional during a transition period.

---

### Dependencies

| Package | Version | Purpose |
|---|---|---|
| Node.js | 20 LTS | Runtime |
| express | 4.18.3 | HTTP framework |
| mongoose | 8.23.1 | MongoDB ODM |
| jsonwebtoken | 9.0.2 | JWT authentication |
| bcryptjs | 2.4.3 | Password hashing |
| helmet | 8.2.0 | Security headers |
| cors | 2.8.5 | CORS policy |
| morgan | 1.10.0 | HTTP logging |
| express-rate-limit | 8.5.2 | Rate limiting |
| compression | 1.8.1 | gzip responses |
| multer | 1.4.5-lts.1 | File uploads |
| @anthropic-ai/sdk | 0.106.0 | AI features |
| dotenv | 16.4.5 | Environment config |

---

## Upcoming: v1.0.1 (Hotfix — TBD)

No hotfix scheduled. Will be issued only for confirmed production defects.

---

*Release notes maintained by Platform Team*  
*LW-CERT-2026-001 | LocalWheels Enterprise v1.0.0*
