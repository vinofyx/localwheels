const VehicleMaintenance = require('../models/VehicleMaintenance');
const VehicleExpense     = require('../models/VehicleExpense');

const GRADE = score =>
  score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';

// Age penalty: vehicles older than 5 years lose points
function agePenalty(year) {
  if (!year) return 0;
  const age = new Date().getFullYear() - year;
  if (age <= 2)  return 0;
  if (age <= 5)  return 5;
  if (age <= 8)  return 12;
  if (age <= 12) return 20;
  return 30;
}

// Mileage penalty
function mileagePenalty(odometerKm) {
  if (!odometerKm) return 0;
  if (odometerKm < 50000)   return 0;
  if (odometerKm < 150000)  return 5;
  if (odometerKm < 300000)  return 15;
  if (odometerKm < 500000)  return 25;
  return 35;
}

// Compliance score from document expiries
function complianceScore(vehicle) {
  const now = new Date();
  let score = 100;
  const fields = ['insurance_expiry','fitness_expiry','permit_expiry','pollution_expiry','road_tax_expiry'];
  for (const f of fields) {
    if (!vehicle[f]) { score -= 5; continue; }
    const days = (new Date(vehicle[f]) - now) / 86400000;
    if (days < 0)   score -= 20;
    else if (days < 7)  score -= 10;
    else if (days < 30) score -= 5;
  }
  return Math.max(0, score);
}

async function computeHealthScore(vehicle) {
  const vehicleId = vehicle._id;
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 86400000);

  // Fetch last 90 days maintenance
  const maintenanceRecords = await VehicleMaintenance.find({
    fleet_vehicle_id: vehicleId,
    createdAt:        { $gte: new Date(now - 90 * 86400000) },
  }).lean();

  const overdueCount    = maintenanceRecords.filter(m => m.status === 'overdue').length;
  const completedCount  = maintenanceRecords.filter(m => m.status === 'completed').length;
  const scheduledCount  = maintenanceRecords.filter(m => m.status === 'scheduled').length;

  // Maintenance sub-score
  let maintenanceScore = 100;
  maintenanceScore -= overdueCount * 20;
  maintenanceScore += completedCount * 2;
  maintenanceScore = Math.max(0, Math.min(100, maintenanceScore));

  // Component estimates based on maintenance history
  const hasRecentBrake    = maintenanceRecords.some(m => m.maintenance_type.includes('brake') && m.status === 'completed');
  const hasRecentOil      = maintenanceRecords.some(m => m.maintenance_type === 'engine_oil' && m.status === 'completed');
  const hasRecentTyre     = maintenanceRecords.some(m => m.maintenance_type.includes('tyre') && m.status === 'completed');
  const hasRecentBattery  = maintenanceRecords.some(m => m.maintenance_type === 'battery' && m.status === 'completed');

  const components = {
    engine:     Math.max(40, hasRecentOil  ? 95 : 80 - mileagePenalty(vehicle.odometer_km) * 0.5),
    brakes:     Math.max(40, hasRecentBrake   ? 95 : 80),
    tyres:      Math.max(40, hasRecentTyre    ? 95 : 80),
    battery:    Math.max(40, hasRecentBattery ? 95 : 80),
    suspension: Math.max(40, 85 - mileagePenalty(vehicle.odometer_km) * 0.3),
    body:       Math.max(40, 90 - vehicle.breakdown_count * 5),
    compliance: complianceScore(vehicle),
  };

  // Weighted composite score
  const weights = { engine: 0.25, brakes: 0.20, tyres: 0.15, battery: 0.10, suspension: 0.10, body: 0.05, compliance: 0.15 };
  let weightedScore = Object.entries(components).reduce((sum, [k, v]) => sum + v * (weights[k] || 0), 0);

  // Apply penalties
  const age    = agePenalty(vehicle.year);
  const miles  = mileagePenalty(vehicle.odometer_km);
  const breakdowns = Math.min(30, vehicle.breakdown_count * 8);

  const finalScore = Math.max(0, Math.min(100, Math.round(weightedScore - age * 0.3 - breakdowns)));
  const grade      = GRADE(finalScore);

  // Predicted issues
  const predicted_issues = [];
  if (components.engine < 70)
    predicted_issues.push({ component: 'Engine', issue: 'Oil change or service overdue', probability: 0.8, urgency: 'high', estimated_days: 7 });
  if (components.brakes < 70)
    predicted_issues.push({ component: 'Brakes', issue: 'Brake service recommended', probability: 0.7, urgency: 'high', estimated_days: 14 });
  if (components.tyres < 70)
    predicted_issues.push({ component: 'Tyres', issue: 'Tyre inspection or replacement due', probability: 0.6, urgency: 'medium', estimated_days: 30 });
  if (components.battery < 70)
    predicted_issues.push({ component: 'Battery', issue: 'Battery health declining', probability: 0.65, urgency: 'medium', estimated_days: 21 });
  if (components.compliance < 80)
    predicted_issues.push({ component: 'Compliance', issue: 'Documents expiring — renewal required', probability: 1.0, urgency: 'critical', estimated_days: 0 });

  const ai_recommendations = [];
  if (finalScore < 50)  ai_recommendations.push('Schedule immediate comprehensive inspection');
  if (finalScore < 70)  ai_recommendations.push('Prioritise maintenance before next long-haul trip');
  if (overdueCount > 0) ai_recommendations.push(`${overdueCount} overdue maintenance task(s) — address immediately`);
  if (vehicle.breakdown_count > 2) ai_recommendations.push('High breakdown history — consider vehicle replacement');
  if (components.compliance < 90)  ai_recommendations.push('Renew expiring compliance documents');

  return {
    score: finalScore,
    grade,
    components,
    factors: {
      maintenance_score: maintenanceScore,
      age_penalty:       age,
      mileage_penalty:   miles,
      breakdown_penalty: breakdowns,
      compliance_bonus:  components.compliance,
    },
    predicted_issues,
    ai_recommendations,
    ai_summary: `Vehicle health is ${grade} (${finalScore}/100). ${ai_recommendations[0] || 'Continue regular maintenance schedule.'}`,
  };
}

module.exports = { computeHealthScore, GRADE };
