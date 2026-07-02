# Quick Start Guide — System Administrator
**LocalWheels v1.0** | First-time setup in 15 minutes

---

## Step 1: Log In as Admin
- URL: https://app.localwheels.com
- Username: `admin`
- Password: As set during deployment (change immediately)

---

## Step 2: Verify Company Setup
1. **Admin → Company Settings**
   - Confirm: Company Name, GSTIN, Address, Logo
2. **Admin → Financial Year**
   - Set: Start Date (e.g., 01 Apr 2026), End Date (31 Mar 2027)
3. **Admin → LR Configuration**
   - Set LR series per branch (e.g., HO/2026/00001)

---

## Step 3: Create Branches
1. **Admin → Branches** → New Branch
2. Fill: Branch Name, Code, City, State, Phone
3. Mark Head Office branch as primary
4. Repeat for each operational branch

---

## Step 4: Create Users
1. **Admin → User Management** → New User
2. Fill: Username, Full Name, Role, Branch, Email, Phone
3. Set temporary password (user must change on first login)
4. Repeat for all staff

**Roles to create:** Admin, Branch Manager, Dispatcher, Warehouse Manager, Warehouse Staff, Driver, Sales Executive, Finance Manager, Customer Support, Executive

---

## Step 5: Setup Master Data
Run production seed script (if not already seeded):
```bash
cd backend
MONGODB_URI=<your-uri> node src/scripts/seed-production.js
```

Or create manually:
- **Master → Customers** → Add customers
- **Master → Vehicles** → Add vehicles
- **Master → Drivers** → Add drivers
- **Finance → Chart of Accounts** → Verify CoA is complete

---

## Step 6: Configure Pricing
1. **Master → Customer Pricing** → Add pricing rules per customer
2. Set: Vehicle type, route, rate per ton/km, minimum charge

---

## Step 7: Verify Everything Works
Test one complete workflow:
1. Create LR (as Dispatcher)
2. Create Trip (as Dispatcher)
3. Mark Delivery (as Driver)
4. Generate Invoice (as Finance)
5. View in Executive Dashboard (as Admin)

---

## Security Checklist
- [ ] Admin password changed from default
- [ ] All user passwords are non-default
- [ ] GSTIN and company details are accurate
- [ ] Financial year is correctly set
- [ ] LR series is configured per branch

---

## Need Help?
- Full Manual: docs/manuals/ADMIN_MANUAL.md
- Support: support@localwheels.com
