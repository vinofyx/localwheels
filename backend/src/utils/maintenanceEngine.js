const FleetVehicle       = require('../models/FleetVehicle');
const VehicleMaintenance = require('../models/VehicleMaintenance');

// Service intervals in km
const KM_INTERVALS = {
  engine_oil:    5000,
  oil_filter:    10000,
  air_filter:    20000,
  fuel_filter:   30000,
  coolant:       40000,
  brake_service: 30000,
  brake_pads:    25000,
  tyre_replacement: 60000,
  wheel_alignment:  10000,
  battery:          50000,
  suspension:       80000,
  general_service:  10000,
};

// Day-based intervals (for compliance items)
const COMPLIANCE_TYPES = ['insurance_renewal','fitness_renewal','permit_renewal','puc_renewal','road_tax'];

function daysUntil(date) {
  if (!date) return null;
  return Math.ceil((new Date(date) - new Date()) / 86400000);
}

function alertLevel(days) {
  if (days === null) return null;
  if (days < 0)   return 'overdue';
  if (days <= 7)  return 'critical';
  if (days <= 30) return 'warning';
  if (days <= 90) return 'notice';
  return null;
}

// Build compliance alerts from FleetVehicle fields
function buildComplianceAlerts(vehicle) {
  const alerts = [];
  const checks = [
    { field: 'insurance_expiry',  label: 'Insurance',            type: 'insurance_renewal' },
    { field: 'fitness_expiry',    label: 'Fitness Certificate',  type: 'fitness_renewal' },
    { field: 'permit_expiry',     label: 'Permit',               type: 'permit_renewal' },
    { field: 'pollution_expiry',  label: 'PUC',                  type: 'puc_renewal' },
    { field: 'road_tax_expiry',   label: 'Road Tax',             type: 'road_tax' },
  ];

  for (const c of checks) {
    const days  = daysUntil(vehicle[c.field]);
    const level = alertLevel(days);
    if (level) {
      alerts.push({
        vehicle_number:  vehicle.vehicle_number,
        fleet_vehicle_id:vehicle._id,
        type:            c.type,
        label:           c.label,
        expiry_date:     vehicle[c.field],
        days_remaining:  days,
        alert_level:     level,
      });
    }
  }
  return alerts;
}

// Check km-based maintenance needs
async function checkKmMaintenance(vehicle) {
  const alerts = [];
  const odometer = vehicle.odometer_km || 0;

  for (const [type, interval] of Object.entries(KM_INTERVALS)) {
    // Find last completed maintenance of this type
    const last = await VehicleMaintenance.findOne({
      fleet_vehicle_id: vehicle._id,
      maintenance_type: type,
      status:           'completed',
    }).sort({ completed_date: -1 }).lean();

    const lastKm = last?.odometer_at_service || 0;
    const kmSince = odometer - lastKm;
    const kmDue   = interval - kmSince;

    if (kmDue <= 0) {
      alerts.push({
        vehicle_number:   vehicle.vehicle_number,
        fleet_vehicle_id: vehicle._id,
        type,
        label:            type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        km_overdue:       Math.abs(kmDue),
        alert_level:      'overdue',
        last_service_km:  lastKm,
      });
    } else if (kmDue <= 500) {
      alerts.push({
        vehicle_number:   vehicle.vehicle_number,
        fleet_vehicle_id: vehicle._id,
        type,
        label:            type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        km_remaining:     kmDue,
        alert_level:      kmDue <= 100 ? 'critical' : 'warning',
        last_service_km:  lastKm,
      });
    }
  }
  return alerts;
}

// Get all alerts for a company
async function getFleetAlerts(companyId) {
  const vehicles = await FleetVehicle.find({
    company_id: companyId,
    is_active:  true,
    status:     { $nin: ['out_of_service','inactive'] },
  }).lean();

  const complianceAlerts = vehicles.flatMap(buildComplianceAlerts);
  const kmAlertsNested   = await Promise.all(vehicles.map(checkKmMaintenance));
  const kmAlerts         = kmAlertsNested.flat();

  return {
    compliance: complianceAlerts,
    maintenance: kmAlerts,
    total: complianceAlerts.length + kmAlerts.length,
    critical: [...complianceAlerts, ...kmAlerts].filter(a => a.alert_level === 'critical' || a.alert_level === 'overdue').length,
  };
}

// Auto-create scheduled maintenance records for overdue items
async function scheduleMaintenanceForAlerts(companyId, userId) {
  const alerts = await getFleetAlerts(companyId);
  const created = [];

  for (const alert of [...alerts.compliance, ...alerts.maintenance]) {
    if (!['overdue','critical'].includes(alert.alert_level)) continue;

    // Avoid duplicates
    const existing = await VehicleMaintenance.findOne({
      fleet_vehicle_id: alert.fleet_vehicle_id,
      maintenance_type: alert.type,
      status:           { $in: ['scheduled','in_progress'] },
    });
    if (existing) continue;

    const rec = await VehicleMaintenance.create({
      company_id:       companyId,
      fleet_vehicle_id: alert.fleet_vehicle_id,
      vehicle_number:   alert.vehicle_number,
      maintenance_type: alert.type,
      maintenance_category: COMPLIANCE_TYPES.includes(alert.type) ? 'compliance' : 'preventive',
      status:           'scheduled',
      priority:         alert.alert_level === 'overdue' ? 'urgent' : 'high',
      scheduled_date:   new Date(Date.now() + 3 * 86400000), // schedule 3 days out
      description:      `Auto-scheduled: ${alert.label} ${alert.alert_level}`,
      created_by:       userId,
    });
    created.push(rec);
  }
  return created;
}

module.exports = { getFleetAlerts, buildComplianceAlerts, checkKmMaintenance, scheduleMaintenanceForAlerts };
