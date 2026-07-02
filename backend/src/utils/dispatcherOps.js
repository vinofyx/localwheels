const Trip               = require('../models/Trip');
const DispatchPlan       = require('../models/DispatchPlan');
const DispatcherShift    = require('../models/DispatcherShift');
const DispatchApproval   = require('../models/DispatchApproval');
const DispatchImpact     = require('../models/DispatchImpact');
const DispatcherPerformance = require('../models/DispatcherPerformance');
const Customer           = require('../models/Customer');

const HIGH_VALUE_THRESHOLD = 100000; // INR — plans above this require supervisor approval

// ─── Digital Driver Acknowledgement ────────────────────────────────────────────
async function acknowledgeTrip({ companyId, tripId, driverId, signatureData }) {
  const trip = await Trip.findOne({ _id: tripId, company_id: companyId });
  if (!trip) return { success: false, error: 'Trip not found' };
  if (driverId && String(trip.driver_id) !== String(driverId)) {
    return { success: false, error: 'Driver mismatch for this trip' };
  }

  trip.driver_acknowledged = true;
  trip.driver_acknowledged_at = new Date();
  trip.driver_acknowledgement_signature = signatureData || null;
  await trip.save();

  return { success: true, trip };
}

// ─── Customer Impact Analysis ──────────────────────────────────────────────────
async function analyzeCustomerImpact({ companyId, tripId, dispatchPlanId, changeType, changeReason, etaDelayMin = 0 }) {
  const trip = tripId ? await Trip.findOne({ _id: tripId, company_id: companyId }).lean() : null;
  const shipmentIds = trip?.shipment_ids || [];

  const affected_customers = [];
  if (trip?.stops?.length) {
    for (const stop of trip.stops) {
      if (stop.status === 'completed') continue;
      affected_customers.push({
        customer_name: stop.receiver_name, customer_phone: stop.receiver_phone,
        lr_number: stop.lr_number, eta_delay_min: etaDelayMin, notified: false,
      });
    }
  }

  const impact = await DispatchImpact.create({
    company_id: companyId, trip_id: tripId, dispatch_plan_id: dispatchPlanId,
    change_type: changeType, change_reason: changeReason,
    affected_shipment_ids: shipmentIds, affected_customers,
  });

  // Notification dispatch is best-effort — reuse existing Notification model if present
  let notified = 0;
  try {
    const Notification = require('../models/Notification');
    for (const c of affected_customers) {
      await Notification.create({
        company_id: companyId, type: 'dispatch_impact', title: 'Delivery Update',
        message: `Your shipment ${c.lr_number || ''} may be delayed by ~${etaDelayMin}min due to ${changeReason || changeType}.`,
        recipient_phone: c.customer_phone, recipient_name: c.customer_name,
      });
      notified++;
    }
    impact.notifications_sent = notified;
    await impact.save();
  } catch { /* Notification model/route not wired for this channel — impact record still saved */ }

  return impact;
}

// ─── Automatic Replanning ──────────────────────────────────────────────────────
async function autoReplan({ companyId, tripId, reason, user }) {
  const trip = await Trip.findOne({ _id: tripId, company_id: companyId });
  if (!trip) return { success: false, error: 'Trip not found' };

  const pendingStops = (trip.stops || []).filter(s => !['completed', 'skipped'].includes(s.status));

  const impact = await analyzeCustomerImpact({
    companyId, tripId, dispatchPlanId: trip.dispatch_plan_id,
    changeType: reason?.includes('breakdown') ? 'breakdown' : reason?.includes('weather') ? 'weather_alert' : 'replan',
    changeReason: reason, etaDelayMin: 45,
  });

  trip.status = 'replanning';
  trip.replan_reason = reason;
  trip.replanned_at = new Date();
  trip.replanned_by = user?._id;
  await trip.save();

  return {
    success: true,
    trip,
    pending_stops: pendingStops.length,
    impact,
    requires_dispatcher_review: true,
  };
}

// ─── Dispatcher Performance ─────────────────────────────────────────────────────
async function getDispatcherPerformance(companyId, { dispatcherId, days = 30 } = {}) {
  const since = new Date(Date.now() - days * 86400000);
  const filter = { company_id: companyId, createdAt: { $gte: since } };
  if (dispatcherId) filter.created_by = dispatcherId;

  const plans = await DispatchPlan.find(filter).lean();
  const byDispatcher = {};

  for (const p of plans) {
    const key = String(p.created_by || 'unassigned');
    if (!byDispatcher[key]) byDispatcher[key] = { dispatcher_id: key, plans_created: 0, plans_approved: 0, planning_times: [] };
    byDispatcher[key].plans_created++;
    if (p.status === 'approved' || p.status === 'dispatched') byDispatcher[key].plans_approved++;
    if (p.createdAt && p.planned_dispatch_time) {
      byDispatcher[key].planning_times.push((new Date(p.planned_dispatch_time) - new Date(p.createdAt)) / 60000);
    }
  }

  return Object.values(byDispatcher).map(d => ({
    dispatcher_id: d.dispatcher_id,
    plans_created: d.plans_created,
    plans_approved: d.plans_approved,
    approval_rate_pct: d.plans_created ? Math.round((d.plans_approved / d.plans_created) * 100) : 0,
    avg_planning_time_min: d.planning_times.length ? Math.round(d.planning_times.reduce((a, b) => a + b, 0) / d.planning_times.length) : 0,
  }));
}

// ─── Shift Handover ───────────────────────────────────────────────────────────
async function startShift({ companyId, branchId, dispatcherId, dispatcherName }) {
  await DispatcherShift.updateMany({ company_id: companyId, dispatcher_id: dispatcherId, status: 'active' }, { status: 'ended', shift_end: new Date() });
  return DispatcherShift.create({ company_id: companyId, branch_id: branchId, dispatcher_id: dispatcherId, dispatcher_name: dispatcherName, shift_start: new Date() });
}

async function handoverShift({ companyId, shiftId, handoverNotes, handedOverTo, handedOverToName }) {
  const activeTrips = await Trip.find({ company_id: companyId, status: { $in: ['assigned', 'in_progress'] } }).select('_id').lean();
  const pendingPlans = await DispatchPlan.find({ company_id: companyId, status: 'draft' }).select('_id').lean();

  return DispatcherShift.findOneAndUpdate(
    { _id: shiftId, company_id: companyId },
    {
      status: 'ended', shift_end: new Date(), handover_notes: handoverNotes,
      handed_over_to: handedOverTo, handed_over_to_name: handedOverToName,
      active_trip_ids: activeTrips.map(t => t._id), pending_approval_ids: pendingPlans.map(p => p._id),
    },
    { new: true }
  );
}

// ─── Supervisor Approval Workflow ──────────────────────────────────────────────
function requiresApproval({ valueAmount, isHighRisk }) {
  return (valueAmount && valueAmount >= HIGH_VALUE_THRESHOLD) || !!isHighRisk;
}

async function requestApproval({ companyId, dispatchPlanId, reason, valueAmount, riskNotes, requestedBy, requestedByName }) {
  return DispatchApproval.create({
    company_id: companyId, dispatch_plan_id: dispatchPlanId, reason: reason || 'manual_request',
    value_amount: valueAmount, risk_notes: riskNotes, requested_by: requestedBy, requested_by_name: requestedByName,
  });
}

async function reviewApproval({ companyId, approvalId, approve, reviewer, comment }) {
  const approval = await DispatchApproval.findOneAndUpdate(
    { _id: approvalId, company_id: companyId },
    { status: approve ? 'approved' : 'rejected', reviewed_by: reviewer._id, reviewed_by_name: reviewer.name, reviewed_at: new Date(), review_comment: comment },
    { new: true }
  );
  if (approval && approve) {
    await DispatchPlan.findOneAndUpdate({ _id: approval.dispatch_plan_id, company_id: companyId }, { status: 'approved' });
  }
  return approval;
}

module.exports = {
  acknowledgeTrip, analyzeCustomerImpact, autoReplan, getDispatcherPerformance,
  startShift, handoverShift, requiresApproval, requestApproval, reviewApproval,
  HIGH_VALUE_THRESHOLD,
};
