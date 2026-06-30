const express     = require('express');
const router      = express.Router();
const Anthropic   = require('@anthropic-ai/sdk');
const Quote       = require('../models/Quote');
const PricingRule = require('../models/PricingRule');
const Shipment    = require('../models/Shipment');
const { authenticate } = require('../middleware/auth');
const audit       = require('../utils/audit');
const {
  DEFAULT_CATALOG,
  estimateDistance,
  calcVolumetricWeight,
  selectVehicle,
  computePrice,
  getTransitDays,
} = require('../utils/freightCalc');
const FuelPrice       = require('../models/FuelPrice');
const CustomerPricing = require('../models/CustomerPricing');
const PricingHistory  = require('../models/PricingHistory');
const DiscountRequest = require('../models/DiscountRequest');
const { getRouteDistance } = require('../utils/distanceCalc');

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ok  = (res, data, message = 'Success', status = 200) =>
  res.status(status).json({ status: true, message, data });
const err = (res, message, status = 400) =>
  res.status(status).json({ status: false, message, errors: [message] });

// Load pricing catalog (DB rules or default fallback)
async function getCatalog(company_id) {
  const rules = await PricingRule.find({ is_active: true, company_id: company_id || null }).lean();
  if (rules.length >= 5) return rules;
  return DEFAULT_CATALOG;
}

// Generate unique quote number
async function genQuoteNumber() {
  const d   = new Date();
  const pad = n => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const rand = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
  const num  = `QT${date}${rand}`;
  const exists = await Quote.findOne({ quote_number: num });
  return exists ? genQuoteNumber() : num;
}

// AI vehicle + risk analysis (non-fatal: returns nulls on error)
async function getAIAnalysis({ material_type, commodity, chargeable_weight_kg, packages, distance_km, pickup_city, destination_city, declared_value, priority, vehicle_type, capacity_label, insurance_required }) {
  try {
    const prompt = `You are a freight expert for LocalWheels, an Indian logistics company. Analyse this shipment and respond ONLY in JSON.

Shipment:
- Material: ${material_type || 'General'} (${commodity || 'unspecified'})
- Chargeable Weight: ${chargeable_weight_kg} kg, ${packages} package(s)
- Route: ${pickup_city || 'Origin'} → ${destination_city || 'Destination'} (~${distance_km} km)
- Declared Value: ₹${declared_value || 0}
- Priority: ${priority}
- Recommended Vehicle: ${vehicle_type} (${capacity_label})
- Insurance Requested: ${insurance_required ? 'Yes' : 'No'}

Respond with exactly this JSON (no extra text):
{"vehicle_recommendation":"1-2 sentence recommendation for this vehicle choice","risk_assessment":"1 sentence risk level and main concern","insurance_note":"1 sentence insurance advice based on material and value","handling_note":"1 sentence special handling tip or null"}`;

    const msg = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw   = msg.content[0].text.trim();
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch { return null; }
}

// ─── ENHANCEMENT HELPERS ─────────────────────────────────────────────────────
async function getDynamicFuelPct() {
  try {
    const fp = await FuelPrice.findOne({ is_current: true }).sort({ createdAt: -1 }).lean();
    if (!fp) return null;
    return Math.round((fp.price_per_liter / fp.reference_price) * fp.base_surcharge_pct * 10) / 10;
  } catch { return null; }
}

async function findCustomerDiscount({ phone, name, vehicle_type, pickup_pincode, destination_pincode, weight_kg, distance_km }) {
  try {
    const now = new Date();
    const orClauses = [];
    if (phone) orClauses.push({ customer_phone: phone });
    if (name)  orClauses.push({ customer_name: new RegExp(name.trim().split(' ')[0], 'i') });
    if (!orClauses.length) return null;

    const candidates = await CustomerPricing.find({
      is_active: true,
      $or: orClauses,
      $and: [
        { $or: [{ valid_from: null }, { valid_from: { $lte: now } }] },
        { $or: [{ valid_until: null }, { valid_until: { $gte: now } }] },
      ],
    }).lean();

    for (const c of candidates) {
      if (c.vehicle_type && c.vehicle_type !== vehicle_type) continue;
      if (c.zone_from && !String(pickup_pincode || '').startsWith(c.zone_from)) continue;
      if (c.zone_to   && !String(destination_pincode || '').startsWith(c.zone_to)) continue;
      if (c.min_weight_kg && weight_kg < c.min_weight_kg) continue;
      if (c.min_distance  && distance_km < c.min_distance) continue;
      return c;
    }
    return null;
  } catch { return null; }
}

async function getAIUpsell({ grand_total, insurance_required, loading_required, unloading_required, delivery_priority, material_type, declared_value = 0, chargeable_weight_kg, distance_km }) {
  try {
    const prompt = `You are a sales assistant for LocalWheels, an Indian freight company. Based on this shipment, suggest 2-3 relevant add-on services and one cost-saving tip.

Shipment: ${material_type}, ${chargeable_weight_kg} kg, ${distance_km} km, ₹${grand_total} total
Priority: ${delivery_priority} | Declared value: ₹${declared_value}
Insurance: ${insurance_required ? 'Yes' : 'No'} | Loading: ${loading_required ? 'Yes' : 'No'} | Unloading: ${unloading_required ? 'Yes' : 'No'}

Respond ONLY in JSON (no extra text):
{"upsell":[{"service":"short name","reason":"one sentence why it helps","price_hint":"approx cost or range"}],"cost_tip":"one sentence tip to reduce cost or improve delivery"}

Only suggest services not already selected. Focus on Indian logistics context.`;

    const msg = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 350,
      messages: [{ role: 'user', content: prompt }],
    });
    const raw   = msg.content[0].text.trim();
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch { return null; }
}

// ─── PUBLIC: quick estimate (no save) ────────────────────────────────────────
router.post('/estimate', async (req, res) => {
  try {
    const { pickup_pincode, destination_pincode, weight_kg, material_type, delivery_priority = 'standard', distance_km } = req.body;
    if (!weight_kg || weight_kg <= 0) return err(res, 'weight_kg is required and must be > 0');

    const catalog = await getCatalog(null);
    const dist    = distance_km > 0 ? Number(distance_km) : estimateDistance(pickup_pincode, destination_pincode);
    const vehicle = selectVehicle(Number(weight_kg), catalog);
    const price   = computePrice(vehicle, dist, { priority: delivery_priority });

    ok(res, {
      distance_km:   dist,
      distance_source: distance_km > 0 ? 'user' : 'estimated',
      vehicle_type:  vehicle.vehicle_type,
      vehicle_capacity: vehicle.capacity_label,
      ...price,
      transit_days:  getTransitDays(dist, delivery_priority),
      note: 'Indicative estimate. Submit full details for a confirmed quotation.',
    });
  } catch (e) { err(res, e.message, 500); }
});

// ─── PUBLIC: get pricing rules ────────────────────────────────────────────────
router.get('/rules', authenticate, async (req, res) => {
  try {
    const rules = await PricingRule.find({ is_active: true }).lean();
    ok(res, rules.length ? rules : DEFAULT_CATALOG);
  } catch (e) { err(res, e.message, 500); }
});

// ─── ADMIN: update pricing rules (bulk upsert) ───────────────────────────────
router.put('/rules', authenticate, async (req, res) => {
  try {
    const { rules } = req.body;
    if (!Array.isArray(rules) || !rules.length) return err(res, 'rules array is required');

    const ops = rules.map(r => ({
      updateOne: {
        filter: { vehicle_type: r.vehicle_type, company_id: req.user.company_id },
        update: { $set: { ...r, company_id: req.user.company_id } },
        upsert: true,
      },
    }));
    await PricingRule.bulkWrite(ops);
    // Snapshot pricing history (non-fatal, fire-and-forget)
    PricingHistory.countDocuments({ company_id: req.user.company_id })
      .then(count => PricingHistory.create({
        company_id:      req.user.company_id,
        version:         count + 1,
        changed_by:      req.user.id,
        changed_by_name: req.user.full_name || req.user.username,
        rules_snapshot:  rules,
        vehicle_count:   rules.length,
      })).catch(() => {});
    await audit.log({ company_id: req.user.company_id, user: req.user, action: 'UPDATE', resource: 'PricingRule', req });
    ok(res, null, `${rules.length} pricing rules updated`);
  } catch (e) { err(res, e.message, 500); }
});

// ─── AUTHENTICATED: list quotes ───────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, search, limit = 50, page = 1 } = req.query;
    const q = {};
    if (req.user.role !== 'superadmin') q.company_id = req.user.company_id;
    if (status) q.status = status;
    if (search) {
      const re = new RegExp(search, 'i');
      q.$or = [{ quote_number: re }, { customer_name: re }, { customer_phone: re }, { destination_city: re }];
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Quote.countDocuments(q);
    const docs  = await Quote.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean();

    ok(res, { total, page: Number(page), limit: Number(limit), quotes: docs });
  } catch (e) { err(res, e.message, 500); }
});

// ─── ANALYTICS dashboard ─────────────────────────────────────────────────────
router.get('/analytics', authenticate, async (req, res) => {
  try {
    const filter = req.user.role !== 'superadmin' ? { company_id: req.user.company_id } : {};
    const d30    = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [total, converted, daily, routes, vehicles, customers, pendingDiscounts] = await Promise.all([
      Quote.countDocuments(filter),
      Quote.countDocuments({ ...filter, status: 'converted' }),
      Quote.aggregate([
        { $match: { ...filter, createdAt: { $gte: d30 } } },
        { $group: { _id: { $dateToString: { format: '%m-%d', date: '$createdAt' } }, total: { $sum: '$grand_total' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Quote.aggregate([
        { $match: filter },
        { $group: { _id: { from: '$pickup_city', to: '$destination_city' }, count: { $sum: 1 }, avg_total: { $avg: '$grand_total' } } },
        { $sort: { count: -1 } }, { $limit: 8 },
      ]),
      Quote.aggregate([
        { $match: filter },
        { $group: { _id: '$vehicle_type', count: { $sum: 1 }, avg_total: { $avg: '$grand_total' } } },
        { $sort: { count: -1 } },
      ]),
      Quote.aggregate([
        { $match: filter },
        { $group: { _id: '$customer_phone', name: { $first: '$customer_name' }, count: { $sum: 1 }, total_value: { $sum: '$grand_total' } } },
        { $sort: { total_value: -1 } }, { $limit: 10 },
      ]),
      DiscountRequest.countDocuments({ ...filter, status: { $in: ['pending_manager', 'pending_regional'] } }),
    ]);

    const revenue30d = daily.reduce((s, d) => s + d.total, 0);
    const quotes30d  = daily.reduce((s, d) => s + d.count, 0);
    const last7      = daily.slice(-7);
    const forecast   = last7.length
      ? Math.round((last7.reduce((s, d) => s + d.total, 0) / last7.length) * 30)
      : 0;

    ok(res, {
      total_quotes:             total,
      converted_quotes:         converted,
      conversion_rate_pct:      total ? Math.round((converted / total) * 100) : 0,
      avg_quote_value:          quotes30d ? Math.round(revenue30d / quotes30d) : 0,
      revenue_last_30_days:     revenue30d,
      revenue_forecast_monthly: forecast,
      pending_discount_requests: pendingDiscounts,
      daily_revenue:   daily,
      top_routes:      routes.map(r => ({ from: r._id.from || '–', to: r._id.to || '–', count: r.count, avg_total: Math.round(r.avg_total || 0) })),
      vehicle_demand:  vehicles.map(v => ({ vehicle_type: v._id || 'Unknown', count: v.count, avg_total: Math.round(v.avg_total || 0) })),
      top_customers:   customers.map(c => ({ phone: c._id, name: c.name, count: c.count, total_value: Math.round(c.total_value || 0) })),
    });
  } catch (e) { err(res, e.message, 500); }
});

// ─── FUEL PRICE ───────────────────────────────────────────────────────────────
router.get('/fuel-price', authenticate, async (req, res) => {
  try {
    const fp = await FuelPrice.findOne({ is_current: true }).sort({ createdAt: -1 }).lean();
    ok(res, fp || { price_per_liter: null, note: 'No fuel price set — using fixed surcharge from pricing rules.' });
  } catch (e) { err(res, e.message, 500); }
});

router.post('/fuel-price', authenticate, async (req, res) => {
  try {
    const { price_per_liter, fuel_type = 'diesel', reference_price = 90, base_surcharge_pct = 8, region } = req.body;
    if (!price_per_liter || price_per_liter <= 0) return err(res, 'price_per_liter must be > 0');
    await FuelPrice.updateMany({ is_current: true }, { $set: { is_current: false } });
    const fp = await FuelPrice.create({ price_per_liter, fuel_type, reference_price, base_surcharge_pct, region, is_current: true, updated_by: req.user.id });
    ok(res, fp, 'Fuel price updated', 201);
  } catch (e) { err(res, e.message, 500); }
});

// ─── DISCOUNT REQUESTS: list ─────────────────────────────────────────────────
router.get('/discounts', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const q = {};
    if (req.user.role !== 'superadmin') q.company_id = req.user.company_id;
    if (status) q.status = status;
    const docs = await DiscountRequest.find(q).sort({ createdAt: -1 }).limit(100).lean();
    ok(res, docs);
  } catch (e) { err(res, e.message, 500); }
});

// ─── PRICING HISTORY ─────────────────────────────────────────────────────────
router.get('/rules/history', authenticate, async (req, res) => {
  try {
    const q = req.user.role !== 'superadmin' ? { company_id: req.user.company_id } : {};
    const history = await PricingHistory.find(q).sort({ createdAt: -1 }).limit(20).lean();
    ok(res, history);
  } catch (e) { err(res, e.message, 500); }
});

// ─── CUSTOMER PRICING: list & manage ─────────────────────────────────────────
router.get('/customer-pricing', authenticate, async (req, res) => {
  try {
    const q = req.user.role !== 'superadmin' ? { company_id: req.user.company_id } : {};
    const docs = await CustomerPricing.find(q).sort({ createdAt: -1 }).lean();
    ok(res, docs);
  } catch (e) { err(res, e.message, 500); }
});

router.post('/customer-pricing', authenticate, async (req, res) => {
  try {
    const doc = await CustomerPricing.create({ ...req.body, company_id: req.user.company_id, created_by: req.user.id });
    ok(res, doc, 'Customer pricing rule created', 201);
  } catch (e) { err(res, e.message, 500); }
});

router.patch('/customer-pricing/:id', authenticate, async (req, res) => {
  try {
    const doc = await CustomerPricing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return err(res, 'Not found', 404);
    ok(res, doc, 'Customer pricing rule updated');
  } catch (e) { err(res, e.message, 500); }
});

// ─── PUBLIC: get quote by number ─────────────────────────────────────────────
router.get('/:number', async (req, res) => {
  try {
    const quote = await Quote.findOne({ quote_number: req.params.number.toUpperCase() }).lean();
    if (!quote) return err(res, 'Quote not found', 404);
    ok(res, quote);
  } catch (e) { err(res, e.message, 500); }
});

// ─── PUBLIC: create full quote ────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      customer_name, customer_phone, customer_email, customer_gstin,
      pickup_address, pickup_pincode, pickup_city, pickup_state,
      destination_address, destination_pincode, destination_city, destination_state,
      distance_km,
      material_type = 'General', commodity,
      weight_kg, length_cm, width_cm, height_cm,
      packages = 1, declared_value = 0,
      pickup_date, pickup_time,
      delivery_priority = 'standard',
      insurance_required = false,
      loading_required   = false,
      unloading_required = false,
    } = req.body;

    if (!customer_name)  return err(res, 'customer_name is required');
    if (!customer_phone) return err(res, 'customer_phone is required');
    if (!weight_kg || weight_kg <= 0) return err(res, 'weight_kg is required and must be > 0');

    const catalog   = await getCatalog(null);
    const routeInfo = distance_km > 0
      ? { distance_km: Number(distance_km), source: 'user' }
      : await getRouteDistance({ pickup_pincode, pickup_city, destination_pincode, destination_city });
    const dist = routeInfo.distance_km;
    const volWt   = calcVolumetricWeight(length_cm, width_cm, height_cm);
    const chargeWt = Math.max(Number(weight_kg), volWt);

    const sorted = [...catalog].sort((a, b) => a.capacity_kg - b.capacity_kg);
    const recIdx  = sorted.findIndex(v => v.capacity_kg >= chargeWt);
    const recVeh  = recIdx >= 0 ? sorted[recIdx] : sorted[sorted.length - 1];

    const dynFuelPct = await getDynamicFuelPct();
    const effVeh = dynFuelPct ? { ...recVeh, fuel_surcharge_pct: dynFuelPct } : recVeh;

    const priceOpts = {
      priority:      delivery_priority,
      insurance:     insurance_required,
      declared_value: Number(declared_value),
      loading:       loading_required,
      unloading:     unloading_required,
    };

    const pricing = computePrice(effVeh, dist, priceOpts);

    // Customer contract / loyalty discount
    const custDiscount = await findCustomerDiscount({
      phone: customer_phone, name: customer_name,
      vehicle_type: recVeh.vehicle_type, pickup_pincode, destination_pincode,
      weight_kg: chargeWt, distance_km: dist,
    });
    let customer_discount_amount = 0;
    let customer_discount_label  = null;
    let effective_total = pricing.grand_total;
    if (custDiscount) {
      if (custDiscount.discount_type === 'percentage') {
        customer_discount_amount = Math.round(pricing.grand_total * custDiscount.discount_value / 100);
        if (custDiscount.max_discount) customer_discount_amount = Math.min(customer_discount_amount, custDiscount.max_discount);
      } else {
        customer_discount_amount = Math.min(custDiscount.discount_value, pricing.grand_total);
      }
      effective_total         = Math.max(0, pricing.grand_total - customer_discount_amount);
      customer_discount_label = custDiscount.label || `${custDiscount.pricing_type} discount`;
    }

    // Build 2 alternatives
    const altVehicles = [];
    if (recIdx > 0) altVehicles.push(sorted[recIdx - 1]);
    if (recIdx < sorted.length - 1) altVehicles.push(sorted[recIdx + 1]);

    const alternatives = altVehicles.map(v => {
      const altOpts = { ...priceOpts, loading: false, unloading: false, insurance: false };
      const ap = computePrice(v, dist, altOpts);
      return {
        vehicle_type:     v.vehicle_type,
        vehicle_capacity: v.capacity_label,
        base_freight:     ap.base_freight,
        grand_total:      ap.grand_total,
        transit_days:     getTransitDays(dist, delivery_priority),
      };
    });

    // AI analysis + upsell — run in parallel (both non-fatal)
    const [aiResult, aiUpsell] = await Promise.all([
      getAIAnalysis({
        material_type, commodity, chargeable_weight_kg: chargeWt, packages,
        distance_km: dist, pickup_city, destination_city, declared_value,
        priority: delivery_priority, vehicle_type: recVeh.vehicle_type,
        capacity_label: recVeh.capacity_label, insurance_required,
      }),
      getAIUpsell({
        grand_total: effective_total, insurance_required, loading_required, unloading_required,
        delivery_priority, material_type, declared_value, chargeable_weight_kg: chargeWt, distance_km: dist,
      }),
    ]);

    const quote_number = await genQuoteNumber();
    const valid_until  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const quote = await Quote.create({
      quote_number, valid_until,
      customer_name, customer_phone, customer_email, customer_gstin,
      pickup_address, pickup_pincode, pickup_city, pickup_state,
      destination_address, destination_pincode, destination_city, destination_state,
      estimated_distance_km: dist,
      distance_source: distance_km > 0 ? 'user' : 'estimated',
      material_type, commodity,
      weight_kg: Number(weight_kg),
      length_cm: length_cm ? Number(length_cm) : undefined,
      width_cm:  width_cm  ? Number(width_cm)  : undefined,
      height_cm: height_cm ? Number(height_cm) : undefined,
      volumetric_weight_kg: volWt,
      chargeable_weight_kg: chargeWt,
      packages: Number(packages),
      declared_value: Number(declared_value),
      pickup_date: pickup_date ? new Date(pickup_date) : undefined,
      pickup_time,
      delivery_priority,
      insurance_required, loading_required, unloading_required,
      vehicle_type:           recVeh.vehicle_type,
      vehicle_capacity_label: recVeh.capacity_label,
      transit_days:           getTransitDays(dist, delivery_priority),
      ...pricing,
      grand_total:               effective_total,
      customer_discount_amount,
      customer_discount_label,
      distance_source:           routeInfo.source || 'estimated',
      ai_vehicle_recommendation: aiResult?.vehicle_recommendation || null,
      ai_risk_assessment:        aiResult?.risk_assessment        || null,
      ai_insurance_note:         aiResult?.insurance_note         || null,
      ai_handling_note:          aiResult?.handling_note          || null,
      ai_upsell_suggestions:     aiUpsell?.upsell  || null,
      ai_cost_tip:               aiUpsell?.cost_tip || null,
      alternatives,
    });

    ok(res, quote, 'Quote created successfully', 201);
  } catch (e) { err(res, e.message, 500); }
});

// ─── AUTHENTICATED: convert quote to booking ──────────────────────────────────
router.patch('/:number/convert', authenticate, async (req, res) => {
  try {
    const quote = await Quote.findOne({ quote_number: req.params.number.toUpperCase() });
    if (!quote) return err(res, 'Quote not found', 404);
    if (quote.status === 'converted') return err(res, 'Quote already converted');
    if (quote.status === 'expired')   return err(res, 'Quote has expired');

    const lrRand  = String(Math.floor(Math.random() * 999999)).padStart(6, '0');
    const lr      = `LW${lrRand}`;

    const shipment = await Shipment.create({
      company_id:     req.user.company_id,
      branch_id:      req.user.branch_id,
      lr_number:      lr,
      sender_name:    quote.customer_name,
      sender_phone:   quote.customer_phone,
      receiver_name:  quote.customer_name,
      receiver_phone: quote.customer_phone,
      destination:    quote.destination_city || quote.destination_address,
      weight:         quote.weight_kg,
      packages:       quote.packages,
      description:    quote.commodity,
      freight_amount: quote.grand_total,
      payment_type:   'topay',
      status:         'booked',
      booking_date:   quote.pickup_date || new Date(),
      created_by:     req.user.id,
    });

    quote.status                  = 'converted';
    quote.converted_to_shipment_id = shipment._id;
    await quote.save();

    await audit.log({ company_id: req.user.company_id, user: req.user, action: 'CREATE', resource: 'Shipment', resource_id: shipment._id, resource_ref: lr, req });

    ok(res, { quote_number: quote.quote_number, lr_number: lr, shipment_id: shipment._id }, 'Converted to booking');
  } catch (e) { err(res, e.message, 500); }
});

// ─── AUTHENTICATED: update quote status ──────────────────────────────────────
router.patch('/:number/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const quote = await Quote.findOneAndUpdate(
      { quote_number: req.params.number.toUpperCase() },
      { status },
      { new: true }
    );
    if (!quote) return err(res, 'Quote not found', 404);
    ok(res, { quote_number: quote.quote_number, status: quote.status });
  } catch (e) { err(res, e.message, 500); }
});

// ─── DISCOUNT REQUEST: submit ────────────────────────────────────────────────
router.post('/:number/discount', authenticate, async (req, res) => {
  try {
    const { discount_type, discount_value, reason } = req.body;
    if (!discount_type || !discount_value || !reason) return err(res, 'discount_type, discount_value and reason are required');
    if (!['percentage', 'flat'].includes(discount_type)) return err(res, "discount_type must be 'percentage' or 'flat'");
    if (discount_value <= 0) return err(res, 'discount_value must be > 0');

    const quote = await Quote.findOne({ quote_number: req.params.number.toUpperCase() }).lean();
    if (!quote) return err(res, 'Quote not found', 404);

    let discounted_total = quote.grand_total;
    if (discount_type === 'percentage') discounted_total = Math.round(quote.grand_total * (1 - discount_value / 100));
    else discounted_total = Math.max(0, quote.grand_total - discount_value);

    const dr = await DiscountRequest.create({
      quote_number:      quote.quote_number,
      quote_id:          quote._id,
      company_id:        req.user.company_id,
      requested_by:      req.user.id,
      requested_by_name: req.user.full_name || req.user.username,
      discount_type, discount_value, reason,
      original_total:   quote.grand_total,
      discounted_total,
    });
    ok(res, dr, 'Discount request submitted — pending manager approval', 201);
  } catch (e) { err(res, e.message, 500); }
});

// ─── DISCOUNT REQUEST: approve / reject ──────────────────────────────────────
router.patch('/discounts/:id/action', authenticate, async (req, res) => {
  try {
    const { action, note } = req.body;
    if (!['approved', 'rejected'].includes(action)) return err(res, "action must be 'approved' or 'rejected'");

    const dr = await DiscountRequest.findById(req.params.id);
    if (!dr) return err(res, 'Discount request not found', 404);
    if (!['pending_manager', 'pending_regional'].includes(dr.status))
      return err(res, `Cannot act on a request already ${dr.status}`);

    const entry = { action, by: req.user.id, by_name: req.user.full_name || req.user.username, at: new Date(), note };

    if (dr.status === 'pending_manager') {
      dr.manager_action = entry;
      if (action === 'rejected') {
        dr.status = 'rejected';
      } else {
        const needsRegional = (dr.discount_type === 'percentage' && dr.discount_value > 15)
          || (dr.discount_type === 'flat' && dr.discount_value > 5000);
        dr.status = needsRegional ? 'pending_regional' : 'approved';
      }
    } else {
      dr.regional_action = entry;
      dr.status = action === 'approved' ? 'approved' : 'rejected';
    }

    await dr.save();
    ok(res, dr, `Discount request ${dr.status}`);
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
