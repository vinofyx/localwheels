const Shipment = require('../models/Shipment');
const Driver   = require('../models/Driver');

function genManifestNumber() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const rnd  = Math.floor(1000 + Math.random() * 9000);
  return `MF-${ymd}-${rnd}`;
}

function genTripNumber() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const rnd  = Math.floor(1000 + Math.random() * 9000);
  return `TR-${ymd}-${rnd}`;
}

// Build manifest data from trip + shipments
async function buildManifest({ trip, dispatchPlan, companyId, generatedBy }) {
  const shipmentIds = trip.shipment_ids || dispatchPlan?.shipment_ids || [];
  const shipments   = await Shipment.find({ _id: { $in: shipmentIds }, company_id: companyId }).lean();

  // Driver details
  let driverLicense = '';
  if (trip.driver_id) {
    const driver = await Driver.findById(trip.driver_id).lean();
    driverLicense = driver?.license_number || '';
  }

  const manifestNumber = genManifestNumber();
  const qrData = `${process.env.APP_URL || 'https://localwheels.app'}/manifest/${manifestNumber}`;

  const items = shipments.map((s, idx) => ({
    sequence:       idx + 1,
    shipment_id:    s._id,
    lr_number:      s.lr_number,
    sender_name:    s.sender_name,
    receiver_name:  s.receiver_name,
    receiver_phone: s.receiver_phone,
    destination:    s.destination,
    weight_kg:      s.weight || 0,
    packages:       s.packages || 1,
    description:    s.description,
    freight_amount: s.freight_amount || 0,
    payment_type:   s.payment_type,
    eway_bill:      s.eway_bill,
    pod_collected:  false,
  }));

  const totalWeight  = items.reduce((s, i) => s + (i.weight_kg || 0), 0);
  const totalPkgs    = items.reduce((s, i) => s + (i.packages || 0), 0);
  const totalFreight = items.reduce((s, i) => s + (i.freight_amount || 0), 0);
  const destinations = [...new Set(shipments.map(s => s.destination).filter(Boolean))];

  return {
    company_id:      companyId,
    branch_id:       trip.branch_id,
    trip_id:         trip._id,
    dispatch_plan_id:dispatchPlan?._id,
    manifest_number: manifestNumber,
    qr_data:         qrData,
    vehicle_number:  trip.vehicle_number,
    vehicle_type:    trip.vehicle_type,
    driver_name:     trip.driver_name,
    driver_phone:    trip.driver_phone,
    driver_license:  driverLicense,
    origin:          trip.origin_address || dispatchPlan?.origin_address,
    destinations,
    total_distance_km: trip.total_distance_km || dispatchPlan?.total_distance_km,
    dispatch_time:   trip.actual_start || trip.planned_start,
    expected_delivery: trip.planned_end,
    items,
    total_items:     items.length,
    total_weight_kg: totalWeight,
    total_packages:  totalPkgs,
    total_freight:   totalFreight,
    status:          'generated',
    generated_by:    generatedBy,
  };
}

// Build loading checklist from trip shipments
async function buildLoadingChecklist({ trip, manifestId, companyId, userId }) {
  const shipments = await Shipment.find({ _id: { $in: trip.shipment_ids || [] }, company_id: companyId }).lean();

  return {
    company_id:     companyId,
    trip_id:        trip._id,
    manifest_id:    manifestId,
    vehicle_number: trip.vehicle_number,
    driver_name:    trip.driver_name,
    items: shipments.map(s => ({
      lr_number:         s.lr_number,
      shipment_id:       s._id,
      packages_expected: s.packages || 1,
      packages_loaded:   0,
      weight_expected:   s.weight || 0,
      weight_actual:     0,
      is_loaded:         false,
      damage_noted:      false,
    })),
    vehicle_checks: {
      fuel_level: 'ok', tyre_condition: 'ok',
      documents_present: true, cleanliness: 'ok', load_secured: false,
    },
    overall_status: 'pending',
    started_at:     new Date(),
    completed_by:   userId,
  };
}

module.exports = { buildManifest, buildLoadingChecklist, genManifestNumber, genTripNumber };
