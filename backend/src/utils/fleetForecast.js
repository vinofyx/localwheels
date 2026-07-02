const FleetVehicle       = require('../models/FleetVehicle');
const VehicleMaintenance = require('../models/VehicleMaintenance');
const VehicleExpense     = require('../models/VehicleExpense');

// ─── Odometer vs GPS distance validation ──────────────────────────────────────
// Flags possible tampering when reported odometer delta diverges sharply from
// GPS-tracked distance travelled over the same period.
function validateOdometer({ odometerStartKm, odometerEndKm, gpsDistanceKm }) {
  const odoDelta = odometerEndKm - odometerStartKm;
  if (odoDelta < 0) {
    return { valid: false, reason: 'odometer_decreased', odo_delta_km: odoDelta, gps_distance_km: gpsDistanceKm };
  }
  if (!gpsDistanceKm || gpsDistanceKm <= 0) {
    return { valid: true, reason: 'no_gps_data', odo_delta_km: odoDelta, gps_distance_km: gpsDistanceKm };
  }
  const diffPct = Math.abs(odoDelta - gpsDistanceKm) / gpsDistanceKm * 100;
  const tolerance = 12;
  return {
    valid:            diffPct <= tolerance,
    reason:            diffPct <= tolerance ? 'within_tolerance' : 'odometer_gps_mismatch',
    odo_delta_km:      odoDelta,
    gps_distance_km:   Math.round(gpsDistanceKm),
    diff_pct:          Math.round(diffPct * 10) / 10,
  };
}

// ─── Maintenance budget + replacement forecasting ─────────────────────────────
async function forecastFleetBudget(companyId, months = 6) {
  const since = new Date(Date.now() - 365 * 86400000);

  const [maintHistory, expenseHistory, vehicles] = await Promise.all([
    VehicleMaintenance.find({ company_id: companyId, createdAt: { $gte: since } }).lean(),
    VehicleExpense.find({ company_id: companyId, createdAt: { $gte: since } }).lean(),
    FleetVehicle.find({ company_id: companyId, is_active: true }).lean(),
  ]);

  const totalMaintCost = maintHistory.reduce((s, m) => s + (m.cost || 0), 0);
  const totalExpense   = expenseHistory.reduce((s, e) => s + (e.amount || 0), 0);
  const monthlyAvg      = (totalMaintCost + totalExpense) / 12;
  const projected        = Math.round(monthlyAvg * months);

  // Vehicles nearing end-of-life: age > 7 years or health_score < 40
  const now = new Date();
  const retirementCandidates = vehicles
    .filter(v => {
      const ageYears = v.purchase_date ? (now - new Date(v.purchase_date)) / (365 * 86400000) : 0;
      return ageYears > 7 || (v.health_score != null && v.health_score < 40);
    })
    .map(v => ({
      vehicle_id:     v._id,
      vehicle_number: v.vehicle_number,
      health_score:   v.health_score,
      age_years:      v.purchase_date ? Math.round(((now - new Date(v.purchase_date)) / (365 * 86400000)) * 10) / 10 : null,
      recommendation: 'Plan replacement within next budget cycle',
    }));

  return {
    period_months:           months,
    historical_monthly_avg:  Math.round(monthlyAvg),
    projected_maintenance_budget: projected,
    total_maintenance_cost_ytd: Math.round(totalMaintCost),
    total_expense_ytd:          Math.round(totalExpense),
    fleet_size:                  vehicles.length,
    retirement_candidates:       retirementCandidates,
  };
}

module.exports = { validateOdometer, forecastFleetBudget };
