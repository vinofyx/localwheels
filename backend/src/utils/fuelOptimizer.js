// Fuel optimization calculations

// Base mileage (km/litre) by vehicle type and road type
const BASE_MILEAGE = {
  bike:       { highway: 40, city: 30, mixed: 35 },
  tempo:      { highway: 16, city: 11, mixed: 14 },
  mini_truck: { highway: 14, city: 10, mixed: 12 },
  truck:      { highway: 10, city:  6, mixed:  8 },
  trailer:    { highway:  6, city:  4, mixed:  5 },
  container:  { highway:  6, city:  4, mixed:  5 },
};

// CO2 emission factor: kg per litre of diesel
const CO2_PER_LITRE = 2.68;

// Diesel price fallback (INR per litre)
const DEFAULT_DIESEL_PRICE = 92;

/**
 * Determine road type from distance
 * < 30 km  → city
 * 30-100   → mixed
 * > 100    → highway
 */
function inferRoadType(distanceKm) {
  if (distanceKm < 30)  return 'city';
  if (distanceKm < 100) return 'mixed';
  return 'highway';
}

/**
 * Load penalty: fuel consumption increases with load
 * 0-50% capacity = +0%, 50-80% = +8%, 80-100% = +15%
 */
function loadPenalty(loadTons, capacityTons) {
  if (!capacityTons || capacityTons === 0) return 1.0;
  const ratio = loadTons / capacityTons;
  if (ratio <= 0.5) return 1.0;
  if (ratio <= 0.8) return 1.08;
  return 1.15;
}

/**
 * Calculate fuel metrics for a route segment
 */
function calculateFuel({
  distanceKm,
  vehicleType      = 'truck',
  loadTons         = 0,
  capacityTons     = 10,
  fuelMultiplier   = 1.0,  // from weather/traffic impact
  dieselPricePerL  = DEFAULT_DIESEL_PRICE,
  roadType,
}) {
  const road     = roadType || inferRoadType(distanceKm);
  const baseMpg  = (BASE_MILEAGE[vehicleType] || BASE_MILEAGE.truck)[road];
  const penalty  = loadPenalty(loadTons, capacityTons);
  const mileage  = baseMpg / (penalty * fuelMultiplier);   // effective km/l

  const litresConsumed = distanceKm / mileage;
  const fuelCost       = litresConsumed * dieselPricePerL;
  const co2Kg          = litresConsumed * CO2_PER_LITRE;

  return {
    mileage_kmpl:         parseFloat(mileage.toFixed(2)),
    fuel_consumed_liters: parseFloat(litresConsumed.toFixed(2)),
    fuel_cost:            parseFloat(fuelCost.toFixed(2)),
    co2_emission_kg:      parseFloat(co2Kg.toFixed(2)),
    road_type:            road,
  };
}

/**
 * Compare optimized vs unoptimized route and compute saving
 */
function computeFuelSaving({
  originalDistanceKm,
  optimizedDistanceKm,
  vehicleType,
  loadTons,
  capacityTons,
  dieselPricePerL = DEFAULT_DIESEL_PRICE,
}) {
  const original  = calculateFuel({ distanceKm: originalDistanceKm, vehicleType, loadTons, capacityTons, dieselPricePerL });
  const optimized = calculateFuel({ distanceKm: optimizedDistanceKm, vehicleType, loadTons, capacityTons, dieselPricePerL });

  const fuelSaving    = parseFloat((original.fuel_cost - optimized.fuel_cost).toFixed(2));
  const co2Saving     = parseFloat((original.co2_emission_kg - optimized.co2_emission_kg).toFixed(2));
  const distanceSaved = parseFloat((originalDistanceKm - optimizedDistanceKm).toFixed(2));

  return {
    original,
    optimized,
    fuel_saving:     fuelSaving,
    co2_saving_kg:   co2Saving,
    distance_saved_km: distanceSaved,
    saving_percent:  originalDistanceKm > 0
      ? parseFloat(((distanceSaved / originalDistanceKm) * 100).toFixed(1))
      : 0,
  };
}

/**
 * Compute optimization score (0–100)
 * Based on fuel saving, delay risk, optimization type alignment
 */
function computeOptimizationScore({
  fuelSavingPercent = 0,
  delayRisk         = 'low',
  optimizationType  = 'balanced',
  weatherRisk       = 'low',
  trafficLevel      = 'low',
}) {
  let score = 60; // base

  // Fuel saving bonus (max +20)
  score += Math.min(20, fuelSavingPercent * 2);

  // Delay risk penalty
  const riskPenalty = { low: 0, medium: -5, high: -15, extreme: -25 };
  score += (riskPenalty[delayRisk] || 0);

  // Weather risk penalty
  const weatherPenalty = { low: 0, medium: -3, high: -8, extreme: -15 };
  score += (weatherPenalty[weatherRisk] || 0);

  // Traffic penalty
  const trafficPenalty = { low: 0, moderate: -3, high: -8, severe: -12 };
  score += (trafficPenalty[trafficLevel] || 0);

  // AI recommended bonus
  if (optimizationType === 'ai_recommended') score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

module.exports = { calculateFuel, computeFuelSaving, computeOptimizationScore, DEFAULT_DIESEL_PRICE, BASE_MILEAGE };
