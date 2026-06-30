const express = require('express');
const router  = express.Router();

const ok  = (res, data, message = 'Success') => res.json({ status: true, message, data });
const err = (res, message, status = 400)     => res.status(status).json({ status: false, message, errors: [message] });

const RATES = {
  electronics: 18, furniture: 12, textile: 8, documents: 6,
  perishable: 20, pharma: 22, machinery: 14, auto_parts: 16,
  general: 10,
};

const TRANSIT = {
  express: { multiplier: 1.5, days: '1–2 business days' },
  air:     { multiplier: 2.5, days: 'Same/Next day' },
  ptl:     { multiplier: 1.0, days: '3–5 business days' },
  ftl:     { multiplier: 0.85, days: '2–4 business days' },
};

// POST /api/quotes  — calculate freight quote
// Public endpoint (no auth required) — used by chatbot + customer portal
router.post('/', (req, res) => {
  try {
    const { from_city, to_city, weight_kg, goods_type, service_type = 'ptl', packages = 1 } = req.body;
    if (!from_city || !to_city || !weight_kg)
      return err(res, 'from_city, to_city, weight_kg are required');
    if (weight_kg <= 0)
      return err(res, 'weight_kg must be greater than 0');

    const rate     = RATES[(goods_type || '').toLowerCase()] || RATES.general;
    const svc      = TRANSIT[service_type] || TRANSIT.ptl;
    const base     = weight_kg * rate * svc.multiplier;
    const fuel     = base * 0.12;
    const handling = packages * 20;
    const subtotal = base + fuel + handling;
    const gst      = subtotal * 0.18;
    const total    = subtotal + gst;

    ok(res, {
      from_city, to_city,
      weight_kg, packages,
      goods_type:      goods_type || 'general',
      service_type,
      base_freight:    +base.toFixed(2),
      fuel_surcharge:  +fuel.toFixed(2),
      handling_charge: +handling.toFixed(2),
      subtotal:        +subtotal.toFixed(2),
      gst_18_percent:  +gst.toFixed(2),
      total_estimate:  +total.toFixed(2),
      transit_time:    svc.days,
      note:            'Indicative estimate. Contact your nearest branch for a confirmed quote.',
      valid_for:       '24 hours',
    });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/quotes/rates — return rate card
router.get('/rates', (_req, res) => {
  ok(res, { per_kg_rates: RATES, service_types: TRANSIT, gst_percent: 18 });
});

module.exports = router;
