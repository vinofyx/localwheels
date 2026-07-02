# LocalWheels Platform — Dispatcher Manual
Version 1.0 | Phase 19.7 | Production Release

## 1. Your Role
Dispatchers manage the day-to-day movement of shipments: creating lorry receipts (LRs), assigning vehicles and drivers, tracking live shipments, and handling the full delivery lifecycle.

## 2. Daily Workflow

### Morning Start
1. Login and switch to your branch (**Switch → Branch**)
2. Check **MIS → Dashboard** for pending tasks
3. Review **Tracking → Dispatcher** for today's active shipments

### Creating a Shipment (LR)
1. **Daily Entries → LR Booking** (or Rebooking for existing)
2. Fill: Consignor, Consignee, From/To Location, Freight, Packages
3. Print LR sticker: **Daily Entries → Sticker/Thermal**
4. Submit and attach to cargo

### Assigning a Trip
1. **Daily Entries → Vehicle Assign** — Assign vehicle to a route
2. **Daily Entries → Loading Sheet** — Add LRs to the loading sheet
3. **Daily Entries → LHS (LR Handling Sheet)** — Complete LHS
4. Dispatcher confirms dispatch from **Tracking → Dispatcher**

### Route Optimization
- Go to **Tracking → Routes → Optimizer**
- Enter origin, destination, cargo weight
- AI suggests the most efficient route
- Confirm and assign to trip

### Live Tracking
- **Tracking → LR Tracking** — Track a single LR
- **Tracking → Multi LR Tracking** — Track multiple LRs
- **Tracking → Veh. Current Status** — All vehicles on map

### POD (Proof of Delivery)
1. Driver uploads POD via mobile app
2. Dispatcher verifies: **Daily Entries → POD Submit**
3. Send to branch: **Daily Entries → POD Send Branch**
4. Send to customer: **Daily Entries → POD Send Customer**

### Billing
1. **Daily Entries → Billing Against LR** — Bill per LR
2. **Daily Entries → Billing Without LR** — Lump sum billing
3. Submit bill: **Daily Entries → Bill Submission**

## 3. Key Reports
- **Reports → LR → Booking HO** — All bookings at HO level
- **Reports → POD → Non Submit** — LRs without POD
- **Reports → Bill → Unbilled** — Pending billing LRs
- **MIS → Party Outstanding** — Customer dues

## 4. Common Issues
| Issue | Action |
|-------|--------|
| Vehicle not showing | Check vehicle is active in Master → Vehicle |
| Driver not available | Check Driver → Mapping for branch assignment |
| LR not printing | Check Stationary Allocation in Master |
| Trip not closing | Complete LDM-DRS Settlement first |
