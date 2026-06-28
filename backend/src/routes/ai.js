const express = require('express');
const mongoose = require('mongoose');
const router   = express.Router();
const { authenticate } = require('../middleware/auth');
const Shipment = require('../models/Shipment');
const POD      = require('../models/POD');
const Payment  = require('../models/Payment');
const Branch   = require('../models/Branch');

router.use(authenticate);

const ObjId = id => new mongoose.Types.ObjectId(String(id));

function todayRange() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end   = new Date(); end.setHours(23, 59, 59, 999);
  return { start, end };
}

function daysAgo(n) {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

// ── AI Dashboard ──────────────────────────────────────────────────────────────
router.get('/dashboard', async (req, res, next) => {
  try {
    const companyId = ObjId(req.user.company_id);
    const base = { company_id: companyId };
    const { start: todayStart, end: todayEnd } = todayRange();

    const [
      deliveries_today,
      revenue_agg,
      statusCounts,
      delayed,
      eway_expiry,
      overdue_payments,
      hold_lost,
    ] = await Promise.all([
      Shipment.countDocuments({ ...base, status: 'delivered', updatedAt: { $gte: todayStart } }),
      Shipment.aggregate([
        { $match: { ...base, booking_date: { $gte: todayStart, $lte: todayEnd } } },
        { $group: { _id: null, total: { $sum: '$freight_amount' } } },
      ]),
      Shipment.aggregate([
        { $match: base },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Shipment.countDocuments({ ...base, status: 'in_transit', booking_date: { $lte: daysAgo(3) } }),
      Shipment.countDocuments({
        ...base,
        eway_bill: { $exists: true, $ne: null },
        eway_bill_expiry: { $gte: todayStart, $lte: todayEnd },
        status: { $nin: ['delivered', 'returned'] },
      }),
      Payment.countDocuments({ ...base, status: 'overdue' }),
      Shipment.countDocuments({ ...base, status: { $in: ['hold', 'lost'] } }),
    ]);

    const revenue_today = revenue_agg[0]?.total || 0;
    const statusMap = Object.fromEntries(statusCounts.map(s => [s._id, s.count]));

    // POD pending: delivered shipments with no uploaded POD
    const deliveredIds = await Shipment.find({ ...base, status: 'delivered' }).select('_id').lean();
    const deliveredIdArr = deliveredIds.map(s => s._id);
    const pods_with_data = await POD.countDocuments({
      shipment_id: { $in: deliveredIdArr },
      status: { $in: ['uploaded', 'verified'] },
    });
    const pending_pod_count = Math.max(0, deliveredIdArr.length - pods_with_data);

    // 7-day revenue trend (real booking data)
    const revTrend = await Shipment.aggregate([
      { $match: { ...base, booking_date: { $gte: daysAgo(6) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$booking_date' } },
          revenue: { $sum: '$freight_amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const revMap = Object.fromEntries(revTrend.map(r => [r._id, r.revenue]));
    const dayLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const revenue_trend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() - (6 - i) * 86400000);
      const key = d.toISOString().split('T')[0];
      const dow = d.getDay();
      return { day: dayLabels[dow === 0 ? 6 : dow - 1], revenue: revMap[key] || 0, cost: 0 };
    });

    res.json({
      // Fleet fields — no Vehicle model exists
      fleet: { total: 0, active: 0, idle: 0, breakdown: 0, maintenance: 0 },
      // Shipment-derived metrics
      revenue_today,
      delayed,
      deliveries_today,
      pending_pod_count,
      risk_alerts: hold_lost + eway_expiry + overdue_payments,
      high_risk_count: hold_lost,
      // No IoT/telematics data — return 0 for hardware metrics
      on_time_pct: 0,
      fleet_health: 0,
      driver_present: 0,
      driver_absent: 0,
      driver_on_leave: 0,
      fuel_today_lt: 0,
      maintenance_due: 0,
      empty_returns: 0,
      cost_per_km: 0,
      fuel_theft_alerts: 0,
      warehouse_pct: 0,
      vehicles_near_delivery: 0,
      avg_delivery_hrs: 0,
      fleet_utilization_pct: 0,
      expenses_today_rs: 0,
      profit_today_rs: 0,
      insurance_expiry_count: 0,
      permit_expiry_count: 0,
      live_gps_count: 0,
      revenue_trend,
      shipment_status: [
        { name: 'Delivered',  value: statusMap['delivered']  || 0, fill: '#22c55e' },
        { name: 'In Transit', value: statusMap['in_transit'] || 0, fill: '#3b82f6' },
        { name: 'Delayed',    value: delayed,                      fill: '#ef4444' },
        { name: 'Booked',     value: statusMap['booked']     || 0, fill: '#f59e0b' },
      ],
      top_drivers: [],
    });
  } catch (err) { next(err); }
});

// ── GPS / Fleet / Fuel / Routes / Loads — no hardware data ────────────────────
// These require IoT sensors, GPS hardware, or telematics — not available yet.

router.get('/fleet/status', (_req, res) => res.json([]));

router.get('/gps/vehicles', (_req, res) => res.json([]));

router.get('/gps/history/:vehicle', (req, res) => {
  res.json({ vehicle: req.params.vehicle, points: [] });
});

router.get('/routes', (_req, res) => res.json([]));

router.post('/routes/optimize', (_req, res) => {
  res.json({ optimized: false, message: 'Route optimization requires GPS hardware integration.' });
});

router.get('/maintenance', (_req, res) => res.json([]));

router.get('/drivers', (_req, res) => res.json([]));

router.get('/fuel', (_req, res) => res.json([]));

router.get('/fuel/analytics', (_req, res) => res.json({ trend: [], by_vehicle: [] }));

router.get('/loads', (_req, res) => res.json([]));

router.get('/warehouse', (_req, res) => res.json({
  summary: { total_racks: 0, occupied: 0, capacity_pct: 0, inbound_today: 0, outbound_today: 0, pending_dispatch: 0 },
  racks: [], stock_alerts: 0, movements: [],
}));

router.get('/docs', (_req, res) => res.json([]));

// ── Digital POD — real data ───────────────────────────────────────────────────
router.get('/pods', async (req, res, next) => {
  try {
    const companyId = ObjId(req.user.company_id);
    const delivered = await Shipment.find({ company_id: companyId, status: 'delivered' })
      .select('_id lr_number receiver_name')
      .sort({ updatedAt: -1 })
      .limit(15)
      .lean();

    const ids = delivered.map(s => s._id);
    const lrMap = Object.fromEntries(delivered.map(s => [s._id.toString(), s]));

    const pods = await POD.find({ shipment_id: { $in: ids } })
      .populate('uploaded_by', 'full_name username')
      .lean();
    const podMap = Object.fromEntries(pods.map(p => [p.shipment_id.toString(), p]));

    res.json(delivered.map((s, i) => {
      const pod = podMap[s._id.toString()];
      return {
        id: i + 1,
        lr_no:         s.lr_number,
        vehicle_no:    '—',
        driver:        pod?.uploaded_by?.full_name || pod?.uploaded_by?.username || '—',
        consignee:     s.receiver_name || '—',
        delivery_date: pod?.delivery_date?.toISOString().split('T')[0] || '—',
        signature:     !!pod,
        photo:         !!(pod?.uploaded_file),
        qr_verified:   pod?.status === 'verified',
        gps_verified:  false,
        status:        pod?.status || 'Pending',
        timestamp:     (pod?.updatedAt || s.updatedAt || new Date()).toISOString(),
      };
    }));
  } catch (err) { next(err); }
});

// ── Customer Portal — real shipments ─────────────────────────────────────────
router.get('/customer-portal', async (req, res, next) => {
  try {
    const companyId = ObjId(req.user.company_id);
    const shipments = await Shipment.find({ company_id: companyId })
      .sort({ booking_date: -1 })
      .limit(10)
      .lean();

    res.json(shipments.map(s => ({
      lr_no:        s.lr_number,
      origin:       s.sender_address || '—',
      destination:  s.destination,
      status:       s.status,
      eta:          null,
      vehicle_no:   '—',
      driver:       '—',
      driver_phone: '—',
      pod_ready:    false,
      invoice_no:   '—',
      weight_kg:    s.weight,
      amount_rs:    s.freight_amount,
    })));
  } catch (err) { next(err); }
});

// ── AI Chatbot — rule-based responses (intentional feature) ──────────────────
router.post('/chatbot', (req, res) => {
  const { message = '' } = req.body;
  const lower = message.toLowerCase();
  let reply = 'I can help with shipment tracking, LR status, invoice queries, and POD status. What would you like to know?';
  if (lower.includes('lr') || lower.includes('track'))
    reply = 'Please provide the LR number to look up its current status.';
  else if (lower.includes('invoice'))
    reply = 'Please provide the invoice number or party name to check outstanding payments.';
  else if (lower.includes('pod'))
    reply = 'POD submissions are tracked under the POD module. Check the Pending POD count on your dashboard.';
  else if (lower.includes('delay'))
    reply = 'Delayed shipments are those in-transit for more than 3 days. Check the AI Dashboard for the current count.';
  res.json({ reply, timestamp: new Date().toISOString(), type: 'text' });
});

// ── Demand Forecasting — real historical + static insights ───────────────────
router.get('/forecast', async (req, res, next) => {
  try {
    const companyId = ObjId(req.user.company_id);
    const base = { company_id: companyId };

    const [monthAgg, branchAgg] = await Promise.all([
      Shipment.aggregate([
        { $match: { ...base, booking_date: { $gte: new Date(Date.now() - 365 * 86400000) } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$booking_date' } },
            actual: { $sum: 1 },
            revenue: { $sum: '$freight_amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Shipment.aggregate([
        { $match: { ...base, booking_date: { $gte: daysAgo(30) } } },
        { $group: { _id: '$branch_id', current: { $sum: 1 } } },
      ]),
    ]);

    const branchIds = branchAgg.map(b => b._id).filter(Boolean);
    const branches = await Branch.find({ _id: { $in: branchIds } }).select('_id branch_name').lean();
    const branchMap = Object.fromEntries(branches.map(b => [b._id.toString(), b.branch_name]));

    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthly_trend = monthAgg.map(m => ({
      month:           monthNames[parseInt(m._id.split('-')[1]) - 1],
      actual:          m.actual,
      forecast:        0,
      revenue:         m.revenue,
      vehicles_needed: 0,
    }));

    const branch_demand = branchAgg.map(b => ({
      branch:     branchMap[b._id?.toString()] || 'Unknown',
      current:    b.current,
      forecast:   0,
      growth_pct: 0,
    }));

    const avgMonthlyRevenue = monthAgg.length > 0
      ? Math.round(monthAgg.reduce((s, m) => s + m.revenue, 0) / monthAgg.length)
      : 0;

    res.json({
      monthly_trend,
      branch_demand,
      seasonal_peaks: ['Q3 (Oct–Nov)', 'Q4 (Jan–Mar)'],
      ai_insights: [
        'Connect GPS and IoT sensors to enable AI-powered route and demand predictions',
        'Fuel sensor integration enables mileage analysis and theft detection',
        'Add vehicle telematics to unlock driver performance scoring',
        'Predictive forecasting activates once 12+ months of route data is available',
      ],
      vehicles_needed_next_month: 0,
      revenue_forecast_rs: avgMonthlyRevenue,
    });
  } catch (err) { next(err); }
});

// ── Notifications — built from real DB alerts ─────────────────────────────────
router.get('/notifications', async (req, res, next) => {
  try {
    const companyId = ObjId(req.user.company_id);
    const base = { company_id: companyId };
    const { start: todayStart, end: todayEnd } = todayRange();
    const sevenDaysOut = new Date(Date.now() + 7 * 86400000);

    const [holdLostShipments, ewayExpiry, overduePay, delayed] = await Promise.all([
      Shipment.find({ ...base, status: { $in: ['hold', 'lost'] } })
        .select('lr_number status updatedAt')
        .sort({ updatedAt: -1 })
        .limit(20)
        .lean(),
      Shipment.find({
        ...base,
        eway_bill: { $exists: true, $ne: null },
        eway_bill_expiry: { $gte: todayStart, $lte: sevenDaysOut },
        status: { $nin: ['delivered', 'returned'] },
      }).select('lr_number eway_bill_expiry').limit(10).lean(),
      Payment.countDocuments({ ...base, status: 'overdue' }),
      Shipment.countDocuments({ ...base, status: 'in_transit', booking_date: { $lte: daysAgo(3) } }),
    ]);

    // POD pending
    const deliveredIds = await Shipment.find({ ...base, status: 'delivered' }).select('_id').lean();
    const deliveredIdArr = deliveredIds.map(s => s._id);
    const podsUploaded = await POD.countDocuments({
      shipment_id: { $in: deliveredIdArr },
      status: { $in: ['uploaded', 'verified'] },
    });
    const podPending = Math.max(0, deliveredIdArr.length - podsUploaded);

    const summary = [
      { type: 'Late Delivery',    icon: '🟡', count: delayed },
      { type: 'Hold/Lost CN',     icon: '🔴', count: holdLostShipments.length },
      { type: 'Doc Expiry',       icon: '📄', count: ewayExpiry.length },
      { type: 'POD Pending',      icon: '📦', count: podPending },
      { type: 'Invoice Pending',  icon: '💰', count: overduePay },
      { type: 'Breakdown',        icon: '🔧', count: 0 },
      { type: 'Fuel Theft',       icon: '⚠️',  count: 0 },
      { type: 'Over Speed',       icon: '🚨', count: 0 },
      { type: 'Vehicle Idle',     icon: '⏸️',  count: 0 },
      { type: 'Maintenance Due',  icon: '🔩', count: 0 },
      { type: 'Insurance Expiry', icon: '📋', count: 0 },
    ];

    const now = Date.now();
    const notifications = [];
    let id = 1;

    if (delayed > 0) {
      notifications.push({
        id: id++, type: 'Late Delivery',
        message: `${delayed} shipment${delayed > 1 ? 's' : ''} in-transit for more than 3 days`,
        time: new Date(now).toISOString(), read: false, priority: 'High',
      });
    }

    holdLostShipments.forEach((s, i) => {
      notifications.push({
        id: id++, type: 'Hold/Lost CN',
        message: `Shipment ${s.lr_number} is in ${s.status} status`,
        time: new Date(now - i * 3600000).toISOString(), read: false, priority: 'High',
      });
    });

    ewayExpiry.forEach((s, i) => {
      const daysLeft = Math.max(0, Math.ceil((new Date(s.eway_bill_expiry) - now) / 86400000));
      notifications.push({
        id: id++, type: 'Doc Expiry',
        message: `E-Way Bill for ${s.lr_number} expires in ${daysLeft} day(s)`,
        time: new Date(now - i * 1800000).toISOString(), read: false,
        priority: daysLeft === 0 ? 'High' : 'Medium',
      });
    });

    if (podPending > 0) {
      notifications.push({
        id: id++, type: 'POD Pending',
        message: `${podPending} delivered shipment${podPending > 1 ? 's' : ''} awaiting POD submission`,
        time: new Date(now - 3600000).toISOString(), read: false, priority: 'Medium',
      });
    }

    if (overduePay > 0) {
      notifications.push({
        id: id++, type: 'Invoice Pending',
        message: `${overduePay} payment${overduePay > 1 ? 's' : ''} are overdue`,
        time: new Date(now - 7200000).toISOString(), read: false, priority: 'High',
      });
    }

    res.json({ summary, total: notifications.length, recent: notifications });
  } catch (err) { next(err); }
});

// ── Analytics — real 30-day and branch data ───────────────────────────────────
router.get('/analytics', async (req, res, next) => {
  try {
    const companyId = ObjId(req.user.company_id);
    const base = { company_id: companyId };

    const [dayAgg, branchAgg, delayedTotal] = await Promise.all([
      Shipment.aggregate([
        { $match: { ...base, booking_date: { $gte: daysAgo(29) } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$booking_date' } },
            revenue:       { $sum: '$freight_amount' },
            trips:         { $sum: 1 },
            on_time_count: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Shipment.aggregate([
        { $match: base },
        {
          $group: {
            _id:       '$branch_id',
            shipments: { $sum: 1 },
            revenue:   { $sum: '$freight_amount' },
            delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          },
        },
      ]),
      Shipment.countDocuments({ ...base, status: 'in_transit', booking_date: { $lte: daysAgo(3) } }),
    ]);

    const branchIds = branchAgg.map(b => b._id).filter(Boolean);
    const branches = await Branch.find({ _id: { $in: branchIds } }).select('_id branch_name').lean();
    const branchMap = Object.fromEntries(branches.map(b => [b._id.toString(), b.branch_name]));

    const days = dayAgg.map(d => ({
      date:        d._id,
      revenue:     d.revenue,
      cost:        0,
      trips:       d.trips,
      fuel_lt:     0,
      on_time_pct: d.trips > 0 ? parseFloat(((d.on_time_count / d.trips) * 100).toFixed(1)) : 0,
    }));

    const branch_performance = branchAgg.map(b => ({
      branch:      branchMap[b._id?.toString()] || 'Unknown',
      shipments:   b.shipments,
      revenue:     b.revenue,
      profit_pct:  0,
      on_time_pct: b.shipments > 0 ? parseFloat(((b.delivered / b.shipments) * 100).toFixed(1)) : 0,
    }));

    res.json({
      days,
      fleet_utilization: [],
      branch_performance,
      maintenance_costs: [],
      delay_analysis: delayedTotal > 0
        ? [{ reason: 'In Transit >3 days', count: delayedTotal }]
        : [],
      driver_rankings: [],
    });
  } catch (err) { next(err); }
});

// ── AI Reports — real data for delivery/revenue/pod/branch; empty for others ──
router.get('/reports', async (req, res, next) => {
  try {
    const companyId = ObjId(req.user.company_id);
    const base = { company_id: companyId };
    const type = req.query.type || 'delivery';

    const from   = req.query.from ? new Date(req.query.from) : daysAgo(30);
    const toDate = req.query.to   ? new Date(req.query.to)   : new Date();
    toDate.setHours(23, 59, 59, 999);

    let rows = [];

    if (type === 'delivery') {
      const agg = await Shipment.aggregate([
        { $match: { ...base, booking_date: { $gte: from, $lte: toDate } } },
        {
          $group: {
            _id:       { $dateToString: { format: '%Y-%m-%d', date: '$booking_date' } },
            total:     { $sum: 1 },
            delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
            delayed:   { $sum: { $cond: [{ $in: ['$status', ['hold', 'lost']] }, 1, 0] } },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 14 },
      ]);
      rows = agg.map(d => ({
        date:        d._id,
        total:       d.total,
        delivered:   d.delivered,
        delayed:     d.delayed,
        pending:     d.total - d.delivered,
        on_time_pct: d.total > 0 ? parseFloat(((d.delivered / d.total) * 100).toFixed(1)) : 0,
      }));

    } else if (type === 'revenue') {
      const agg = await Shipment.aggregate([
        { $match: { ...base, booking_date: { $gte: from, $lte: toDate } } },
        {
          $group: {
            _id:     { $dateToString: { format: '%Y-%m-%d', date: '$booking_date' } },
            revenue: { $sum: '$freight_amount' },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 14 },
      ]);
      rows = agg.map(d => ({
        date:       d._id,
        revenue:    d.revenue,
        cost:       0,
        profit:     d.revenue,
        margin_pct: 0,
      }));

    } else if (type === 'pod') {
      const delivered = await Shipment.find({
        ...base, status: 'delivered',
        booking_date: { $gte: from, $lte: toDate },
      }).select('_id lr_number receiver_name').sort({ updatedAt: -1 }).limit(15).lean();

      const ids = delivered.map(s => s._id);
      const pods = await POD.find({ shipment_id: { $in: ids } })
        .populate('uploaded_by', 'full_name username').lean();
      const podMap = Object.fromEntries(pods.map(p => [p.shipment_id.toString(), p]));

      rows = delivered.map(s => {
        const pod = podMap[s._id.toString()];
        const deliveryDate = pod?.delivery_date?.toISOString().split('T')[0] || '';
        const daysPending = deliveryDate
          ? Math.max(0, Math.floor((Date.now() - new Date(deliveryDate)) / 86400000))
          : 0;
        return {
          lr_no:         s.lr_number,
          driver:        pod?.uploaded_by?.full_name || pod?.uploaded_by?.username || '—',
          consignee:     s.receiver_name || '—',
          delivery_date: deliveryDate || '—',
          status:        pod?.status || 'Pending',
          days_pending:  pod ? 0 : daysPending,
        };
      });

    } else if (type === 'branch') {
      const agg = await Shipment.aggregate([
        { $match: { ...base, booking_date: { $gte: from, $lte: toDate } } },
        {
          $group: {
            _id:        '$branch_id',
            shipments:  { $sum: 1 },
            revenue_rs: { $sum: '$freight_amount' },
            delivered:  { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          },
        },
      ]);
      const branchIds = agg.map(b => b._id).filter(Boolean);
      const branches = await Branch.find({ _id: { $in: branchIds } }).select('_id branch_name').lean();
      const branchMap = Object.fromEntries(branches.map(b => [b._id.toString(), b.branch_name]));

      rows = agg.map(b => ({
        branch:      branchMap[b._id?.toString()] || 'Unknown',
        shipments:   b.shipments,
        revenue_rs:  b.revenue_rs,
        profit_pct:  0,
        on_time_pct: b.shipments > 0 ? parseFloat(((b.delivered / b.shipments) * 100).toFixed(1)) : 0,
        fleet_count: 0,
        drivers:     0,
      }));

    }
    // fleet / driver / fuel / route / maintenance / customer — no data model

    res.json({ type, rows });
  } catch (err) { next(err); }
});

module.exports = router;
