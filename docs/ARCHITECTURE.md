# LocalWheels Platform — Architecture Documentation
**Version:** 1.0 | **Date:** 2026-07-02

---

## System Overview

LocalWheels is a multi-tenant Enterprise Logistics SaaS platform built on a modern three-tier architecture. It supports Company → Branch → User hierarchy with complete data isolation at every layer.

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT TIER                         │
│  React 18 + Vite │ React Native (iOS/Android)           │
│  417 routed pages │ 4 mobile apps                       │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS / WSS
┌────────────────────────▼────────────────────────────────┐
│                     API TIER                            │
│  Node.js 20 LTS + Express 4                             │
│  131 route files │ JWT auth │ Rate limiting              │
│  Prometheus metrics │ Redis cache                        │
└────────────────────────┬────────────────────────────────┘
                         │ Mongoose ODM
┌────────────────────────▼────────────────────────────────┐
│                     DATA TIER                           │
│  MongoDB Atlas (217 collections)                        │
│  Redis Cloud (session + cache)                          │
└─────────────────────────────────────────────────────────┘
```

---

## Multi-Tenancy Design

Every MongoDB collection that stores business data includes:
- `company_id` — isolates data by tenant
- `branch_id` — isolates data by branch within a tenant

All API handlers enforce both fields via middleware. No cross-tenant data leakage is possible through any API path.

```
Company (tenant root)
  └── Branch (operational unit)
        └── User (actor)
              └── all business entities
```

**Tenant isolation enforcement points:**
1. `authenticate` middleware extracts `company_id` from JWT
2. All Mongoose queries include `{ company_id: req.user.company_id }`
3. All indexes are compound (`company_id + ...`) for both isolation and performance

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | React | 18.x | SPA application |
| Frontend build | Vite | 5.x | Fast HMR + build |
| Frontend router | React Router | 6.x | SPA routing (417 pages) |
| Frontend UI | Tailwind CSS | 3.x | Utility-first styling |
| Frontend state | React hooks | — | Local state per component |
| Backend runtime | Node.js | 20 LTS | JavaScript runtime |
| Backend framework | Express | 4.x | HTTP API server |
| Backend ODM | Mongoose | 8.x | MongoDB object modeling |
| Database | MongoDB Atlas | 7.x | Primary data store |
| Cache | Redis (ioredis) | — | Session cache + rate limit |
| Auth | JWT (jsonwebtoken) | — | Stateless authentication |
| AI | Anthropic Claude API | — | AI features + copilot |
| Metrics | prom-client | — | Prometheus metrics |
| Security | helmet, cors, express-rate-limit | — | HTTP security |
| Logging | morgan | — | Access log |
| Monitoring | Prometheus + Grafana | — | Metrics dashboards |
| Container | Docker | — | Portable packaging |
| Orchestration | Kubernetes | — | Production scaling |
| CI/CD | GitHub Actions | — | Automated pipeline |

---

## Module Architecture

### Phase 1–6: Core TMS
- **Shipments** — LR creation, booking, AWB generation
- **Entries** — Lorry receipts, bill submission, POD
- **Billing** — Invoice generation, payment tracking
- **Tracking** — Real-time shipment tracking, GPS logs
- **Customers** — Customer master, pricing, credit

### Phase 7–8: Customer Portal
- **Customer Portal** — Self-service tracking, shipment history
- **WhatsApp Integration** — Automated notifications

### Phase 9–10: Sales CRM
- **Leads** — Lead capture, AI scoring (0-100)
- **Opportunities** — Pipeline management
- **Quotes** — Quotation builder, GST calculation
- **Sales Analytics** — Win rate, revenue forecasting

### Phase 11–13: Fleet Intelligence
- **Fleet Management** — Vehicle lifecycle, documents
- **IoT Integration** — GPS, telematics, fuel monitoring
- **Maintenance** — Predictive maintenance, work orders
- **Driver Management** — Performance, behavior analytics

### Phase 14: AI Warehouse Management
- **Inventory** — Real-time stock, barcode/RFID
- **Inbound/Outbound** — Receiving, picking, dispatch
- **AI Slotting** — ML-based location optimization
- **Warehouse Analytics** — Throughput, accuracy KPIs

### Phase 15: Control Tower
- **Live Operations** — Real-time fleet + warehouse state
- **Dispatch Center** — Route optimization, dispatch planning
- **Exception Management** — Automated alerts and escalation
- **KPI Wall** — Real-time operational metrics

### Phase 16: AI Automation
- **Workflow Automation** — No-code rule engine
- **Digital Workers** — AI-powered task automation
- **Autonomous Decisions** — Self-executing actions
- **Automation Analytics** — ROI, execution metrics

### Phase 17: Integration Platform
- **API Gateway** — Multi-tenant API management
- **Event Bus** — Pub/sub event streaming
- **Connector Framework** — Pre-built integrations
- **Developer Portal** — API docs, keys, usage

### Phase 18: Digital Twin & Simulation
- **Digital Twin** — Virtual replica of operations
- **Scenario Simulation** — What-if analysis
- **Predictive Modeling** — Demand, capacity forecasts
- **Simulation Analytics** — Scenario comparison

### Phase 19: Enterprise Finance
- **Chart of Accounts** — Full double-entry bookkeeping
- **Invoice Builder** — GST-compliant invoicing
- **AR/AP** — Receivables and payables management
- **Bank Reconciliation** — Auto-matching transactions
- **GST Filing** — GSTR-1, GSTR-3B export
- **Financial Reports** — P&L, Balance Sheet, Cash Flow, Trial Balance
- **AI Finance Copilot** — Natural language financial queries

---

## API Design

### Authentication
All API endpoints (except `/api/health`, `/api/metrics`, `/api/auth/login`) require:
```
Authorization: Bearer <JWT>
```

JWT payload:
```json
{
  "id": "<user_id>",
  "username": "admin",
  "full_name": "Administrator",
  "role": "admin",
  "company_id": "<company_id>",
  "company_name": "LocalWheels Demo Co",
  "exp": 1783592080
}
```

### Response Format
```json
{ "status": true,  "message": "OK",    "data": { ... } }
{ "status": false, "message": "Error", "errors": ["..."] }
```

### Rate Limiting
- Login: 10 requests / 15 minutes / IP
- API: 300 requests / 15 minutes / IP (global)

### Route Naming Convention
All routes: `GET|POST|PUT|PATCH|DELETE /api/<resource>[/:id][/<sub-resource>]`

---

## Database Design

### 217 Collections
Organized into functional groups:

| Group | Collections | Key Indexes |
|-------|-------------|-------------|
| Core TMS | shipments, bookings, pods, trackingevents | lr_number, company_id+status |
| Finance | invoices, payments, journals, gl, chartofaccounts | company_id+invoice_number |
| Fleet | vehicles, drivers, trips, vehicletelemetries | company_id+vehicle_number |
| Warehouse | warehouses, inventories, inboundshipments, outboundshipments | company_id+warehouse_id+sku |
| CRM | leads, opportunities, quotes, customers | company_id+stage, lead_number |
| Auth | users, oauthtokens, apikeys | username, company_id |

### Index Strategy
Every query-heavy collection has compound indexes:
- `{ company_id: 1, status: 1, createdAt: -1 }` — list views
- `{ company_id: 1, <unique_ref>: 1 }` — lookup by reference number
- `{ company_id: 1, <date_field>: -1 }` — date-range reports

---

## Security Architecture

```
Request → Rate Limiter → CORS → Helmet → Auth Middleware → Route Handler
                                           ↓
                                    JWT Verification
                                    Company ID Extract
                                    Role Check (where needed)
```

Security controls:
- **Authentication:** JWT RS256-equivalent (HS256 with 64-byte secret)
- **Authorization:** Role-based + company-scoped
- **Injection:** NoSQL injection guard on all user inputs (typeof string check)
- **Transport:** HTTPS enforced in production
- **Rate limiting:** Login and API limits enforced
- **Audit trail:** All mutations logged to `auditlogs` collection
- **Tenant isolation:** All queries filtered by `company_id`

---

## Infrastructure

### Production Topology
```
Internet → Cloudflare (CDN + DDoS) → Load Balancer
                                          ├── Backend Pod 1 (Node.js)
                                          ├── Backend Pod 2 (Node.js)
                                          └── Backend Pod N (auto-scale)
                                                ↓
                                          MongoDB Atlas M10+
                                          Redis Cloud
```

### Deployment
- **Frontend:** Vercel (CDN-distributed, auto-deploy from main)
- **Backend:** Render / AWS ECS / Kubernetes
- **Database:** MongoDB Atlas M10+ (3-node replica set)
- **Cache:** Redis Cloud (1GB, persistence enabled)
- **Monitoring:** Prometheus + Grafana (self-hosted or Grafana Cloud)

### Scaling Characteristics
- **Horizontal scaling:** Backend is stateless (JWT), scales linearly
- **Database scaling:** MongoDB Atlas auto-scales; read replicas available
- **Cache scaling:** Redis handles session offload; 300+ req/s without DB hits
- **CDN:** Frontend served from edge, 99.99% availability

---

## CI/CD Pipeline

```
Push to main → GitHub Actions
  ├── Job 1: Lint (ESLint frontend + backend)
  ├── Job 2: Build (npm run build — frontend)
  ├── Job 3: Docker (build + push image)
  └── Job 4: Deploy (Render webhook trigger)
```

Weekly: `npm audit` scan — fails pipeline on new Critical/High vulnerabilities.
