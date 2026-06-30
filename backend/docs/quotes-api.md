# Quotes API — LocalWheels

Base path: `/api/quotes`

All authenticated endpoints require `Authorization: Bearer <jwt>` header.  
Response envelope: `{ status: true|false, message: string, data: any }`.

---

## Public Endpoints

### `POST /estimate`
Quick price estimate — no quote saved.

**Body:**
```json
{
  "pickup_pincode": "400001",
  "destination_pincode": "110001",
  "weight_kg": 500,
  "delivery_priority": "standard",
  "distance_km": 0
}
```
If `distance_km` is 0 or omitted, distance is estimated from pincodes.

**Response:** `{ distance_km, distance_source, vehicle_type, grand_total, transit_days, … }`

---

### `POST /`
Generate a full confirmed quote (saved to DB, assigned quote number).

**Body:** all fields from `/estimate` plus:
```json
{
  "customer_name": "Rajesh Kumar",
  "customer_phone": "9876543210",
  "customer_email": "raj@example.com",
  "customer_gstin": "27AAAA…",
  "pickup_address": "…",
  "pickup_city": "Mumbai",
  "pickup_state": "Maharashtra",
  "destination_address": "…",
  "destination_city": "Delhi",
  "destination_state": "Delhi",
  "material_type": "Electronics",
  "commodity": "Laptops",
  "length_cm": 60,
  "width_cm": 40,
  "height_cm": 30,
  "packages": 10,
  "declared_value": 200000,
  "pickup_date": "2026-07-05",
  "pickup_time": "10:00",
  "insurance_required": true,
  "loading_required": false,
  "unloading_required": false
}
```

**Behaviour:**
- If `GOOGLE_MAPS_API_KEY` env var is set, distance is fetched from Google Maps Directions API. Falls back to pincode-prefix estimation.
- If a matching `CustomerPricing` rule exists for this phone/name, a discount is automatically applied.
- If `ANTHROPIC_API_KEY` is set, AI generates vehicle recommendation, risk assessment, upsell suggestions, and a cost optimisation tip.
- Quote is valid for 7 days.

**Response includes:**
```json
{
  "quote_number": "QT202606301234",
  "distance_source": "google_maps | estimated | user",
  "customer_discount_amount": 500,
  "customer_discount_label": "corporate discount",
  "ai_upsell_suggestions": [
    { "service": "Insurance", "reason": "High value electronics.", "price_hint": "₹1,000" }
  ],
  "ai_cost_tip": "Ship on Tuesday–Thursday to avoid weekend peak rates.",
  "alternatives": [ … ],
  "grand_total": 12500
}
```

---

### `GET /:number`
Get a quote by number (case-insensitive).

---

## Authenticated Endpoints

### `GET /`
List quotes with filters.

**Query:** `?status=active&search=Rajesh&page=1&limit=20`

---

### `GET /rules`
Get current pricing rules (company-specific or system defaults).

---

### `PUT /rules`
Update pricing rules (bulk upsert by vehicle_type). Automatically snapshots to pricing history.

**Body:** `{ "rules": [ { "vehicle_type": "Mini Truck", "base_rate": 850, … } ] }`

---

### `GET /rules/history`
Get pricing rule change history (last 20 snapshots).

---

### `GET /analytics`
Dashboard analytics for the quote module.

**Response:**
```json
{
  "total_quotes": 142,
  "converted_quotes": 38,
  "conversion_rate_pct": 27,
  "avg_quote_value": 8400,
  "revenue_last_30_days": 320000,
  "revenue_forecast_monthly": 450000,
  "pending_discount_requests": 3,
  "daily_revenue": [ { "_id": "06-28", "total": 14000, "count": 3 } ],
  "top_routes": [ { "from": "Mumbai", "to": "Delhi", "count": 22, "avg_total": 9200 } ],
  "vehicle_demand": [ { "vehicle_type": "7 Ton Truck", "count": 34, "avg_total": 11500 } ],
  "top_customers": [ { "phone": "9876543210", "name": "Rajesh", "count": 8, "total_value": 68000 } ]
}
```

---

### `GET /fuel-price`
Get current diesel price and computed fuel surcharge percentage.

### `POST /fuel-price`
Set current diesel price.

**Body:**
```json
{
  "price_per_liter": 95.5,
  "fuel_type": "diesel",
  "reference_price": 90,
  "base_surcharge_pct": 8,
  "region": "Maharashtra"
}
```
The effective surcharge % = `(price_per_liter / reference_price) × base_surcharge_pct`.  
E.g. ₹95.5 / ₹90 × 8% = 8.5%.

---

### `GET /discounts`
List discount requests. Filter: `?status=pending_manager`

### `POST /:number/discount`
Submit a discount request for a quote (requires login).

**Body:**
```json
{
  "discount_type": "percentage",
  "discount_value": 10,
  "reason": "Long-term customer requesting loyalty rate"
}
```
Discounts ≤15% or ≤₹5,000 flat → Manager approval only.  
Higher discounts → escalates to Regional Manager.

### `PATCH /discounts/:id/action`
Approve or reject a discount request.

**Body:** `{ "action": "approved", "note": "Verified customer" }`

---

### `GET /customer-pricing`
List customer-specific pricing rules.

### `POST /customer-pricing`
Create a customer pricing rule (corporate, seasonal, zone, etc.).

**Body:**
```json
{
  "label": "Infosys Corporate",
  "pricing_type": "corporate",
  "customer_phone": "9876543210",
  "discount_type": "percentage",
  "discount_value": 12,
  "max_discount": 3000,
  "valid_from": "2026-01-01",
  "valid_until": "2026-12-31"
}
```

### `PATCH /customer-pricing/:id`
Update a customer pricing rule (e.g. deactivate with `{ "is_active": false }`).

---

### `PATCH /:number/convert`
Convert a quote to a shipment booking. Returns `{ lr_number, shipment_id }`.

### `PATCH /:number/status`
Update quote status. **Body:** `{ "status": "accepted" | "rejected" }`

---

## Distance Source

| Value | Meaning |
|---|---|
| `user` | Customer entered distance manually |
| `google_maps` | Fetched from Google Maps Directions API |
| `estimated` | Estimated by pincode-prefix algorithm |

Set `GOOGLE_MAPS_API_KEY` in `backend/.env` to enable live distance.

---

## Future Stubs (not yet implemented)

- `GET /currencies` — supported currencies (INR only currently)
- `POST /bulk` — bulk quote generation from array
- `POST /excel-upload` — Excel upload for bulk quotes
- `GET /international` — international freight rates
