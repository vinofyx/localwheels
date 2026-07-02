# LocalWheels Platform — Warehouse Manager Manual
Version 1.0 | Phase 19.7 | Production Release

## 1. Your Role
Warehouse managers and staff handle goods receipt, storage, picking, and dispatch within the AI-powered WMS.

## 2. Inbound Operations

### Receiving Goods
1. **Warehouse → Inbound Center** — New Inbound
2. Scan or enter LR/barcode of incoming cargo
3. Record quantity, condition, and storage location
4. System updates inventory automatically

### Quality Check
1. After receiving, mark items for QC
2. **Warehouse → Tasks** — QC tasks appear here
3. Staff inspects and marks: Accept / Reject / Hold
4. Rejected items generate an incident report

### Barcode Generation
1. **Warehouse → Barcode Center** — Generate barcodes
2. Scan existing barcode to look up item
3. Bulk barcode generation for new stock
4. Print labels from the barcode center

## 3. Storage & Inventory
- **Warehouse → Inventory** — Real-time stock levels
- **Warehouse → Setup & Master** — Configure zones, aisles, bins
- AI Slotting: system suggests optimal storage location based on velocity
- FIFO enforced automatically for perishables

## 4. Outbound Operations

### Picking
1. **Warehouse → Outbound Center** — Create pick list
2. Staff picks items as per the pick list
3. Scan items to confirm pick
4. System updates inventory on confirmation

### Dispatch
1. After picking, assign to outbound dock
2. **Warehouse → Dock Management** — Assign dock slot
3. Load onto vehicle (system creates loading manifest)
4. Confirm dispatch — inventory reduced, shipment created

## 5. AI Features
- **Warehouse → AI Insights** — Demand-driven restocking suggestions
- **Warehouse → Forecast** — 30/60/90-day inventory forecast
- **Warehouse → Analytics** — Throughput, accuracy, utilisation KPIs

## 6. RFID Integration
- RFID readers at dock entry/exit auto-update inventory
- **Warehouse → RFID** — View RFID scan log

## 7. Key Reports
| Report | Location |
|--------|----------|
| Inventory Snapshot | Warehouse → Inventory |
| Inbound Register | Warehouse → Inbound Center |
| Outbound Register | Warehouse → Outbound Center |
| Stock Accuracy | Warehouse → Analytics |
| Space Utilisation | Warehouse → Analytics |

## 8. Monthly Tasks
- [ ] Full physical stock count
- [ ] Reconcile WMS vs physical count
- [ ] Review slow-moving inventory
- [ ] Check dock utilisation report
- [ ] Raise maintenance requests for dock equipment
