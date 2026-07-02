# LocalWheels Platform — Administrator Manual
Version 1.0 | Phase 19.7 | Production Release

## 1. Overview
The LocalWheels Platform is a multi-tenant logistics SaaS built on React + Express + MongoDB. Admins manage the entire company hierarchy: company settings, branches, users, and platform-wide configuration.

## 2. Initial Setup

### 2.1 First Login
1. Navigate to `https://your-domain.com`
2. Login with your admin credentials (username: `admin`, password: set during provisioning)
3. You will be placed in the company dashboard immediately.

### 2.2 Company Configuration
- **Config → User Interface** — Set company logo, theme colour, financial year
- **Config → User Creation** — Create users for each role
- **Config → Level Master** — Define approval hierarchies
- **Switch → Branch** — Create or switch between branches
- **Switch → Fin.year** — Select the active financial year

## 3. User Management

### 3.1 Creating a User
1. Go to **Config → User Creation**
2. Fill in: Full Name, Username, Password, Email, Role, Branch
3. Assign roles: `admin`, `manager`, `dispatcher`, `finance`, `warehouse`, `driver`, `support`, `sales`, `customer`
4. Click **Save**

### 3.2 Role Permissions Matrix
| Role | TMS | Finance | Warehouse | Fleet | Sales CRM | BI | Config |
|------|-----|---------|-----------|-------|-----------|-----|--------|
| Admin | Full | Full | Full | Full | Full | Full | Full |
| Manager | Full | View | Full | Full | View | Full | None |
| Dispatcher | Full | None | View | View | None | View | None |
| Finance | View | Full | None | None | None | Full | None |
| Warehouse | None | None | Full | None | None | View | None |
| Driver | POD | None | None | None | None | None | None |
| Sales | None | View | None | None | Full | View | None |
| Support | View | None | None | None | None | View | None |
| Customer | Track | None | None | None | None | None | None |

## 4. Branch Management
- All data is scoped per branch. Users must be assigned to a branch.
- Switch branches via **Switch → Branch** in the top nav.
- Each branch has its own shipments, trips, warehouse stock, and accounts.

## 5. Financial Year
- Set the active financial year via **Switch → Fin.year**.
- All reports and accounts filter by the selected financial year.
- Year-end process: **Config → DayEnd** for daily closing, then roll over financial year.

## 6. Backup & Recovery
- MongoDB Atlas auto-backups every 24 hours (configurable in Atlas console).
- Manual backup: **Config → Backup** within the application.
- Restore: contact your DBA or use Atlas point-in-time recovery.

## 7. System Monitoring
- **Health**: `GET /api/health` — server uptime, DB state, memory
- **Metrics**: `GET /api/metrics` — Prometheus format for Grafana dashboards
- Grafana: available at `http://your-server:3000` (admin/set-password)

## 8. Security
- JWT tokens expire in 7 days. Users must re-login after expiry.
- Rate limiting: 10 login attempts per 15 minutes, 300 API calls per 15 minutes.
- All API endpoints require authentication except `/api/health`, `/api/metrics`, `/api/tracking/public`.
- Audit logs: every create/update/delete is logged with user + timestamp.

## 9. Troubleshooting
| Issue | Fix |
|-------|-----|
| User can't login | Check is_active flag in Config → User Creation |
| Data not showing | Verify branch_id is set for the user |
| Slow dashboard | Check MongoDB Atlas performance advisor for slow queries |
| 401 errors | JWT expired — user must re-login |
| WhatsApp not sending | Set WHATSAPP_TOKEN and WHATSAPP_PHONE_ID in server environment |
