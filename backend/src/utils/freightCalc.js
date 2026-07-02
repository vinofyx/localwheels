const DEFAULT_CATALOG = [
  { vehicle_type: 'Two Wheeler',    capacity_label: '20 kg',   capacity_kg: 20,    base_rate: 150,   per_km_rate: 8,   fuel_surcharge_pct: 8, local_toll: 0, regional_toll: 100,  national_toll: 300,  cross_country_toll: 600,  loading_charge: 0,    unloading_charge: 0,    gst_rate: 18, insurance_rate: 0.5, express_surcharge_pct: 30, premium_surcharge_pct: 60 },
  { vehicle_type: 'Mini Truck',     capacity_label: '750 kg',  capacity_kg: 750,   base_rate: 800,   per_km_rate: 15,  fuel_surcharge_pct: 8, local_toll: 0, regional_toll: 300,  national_toll: 800,  cross_country_toll: 1500, loading_charge: 300,  unloading_charge: 300,  gst_rate: 18, insurance_rate: 0.5, express_surcharge_pct: 25, premium_surcharge_pct: 50 },
  { vehicle_type: 'Pickup Van',     capacity_label: '1 Ton',   capacity_kg: 1000,  base_rate: 1200,  per_km_rate: 18,  fuel_surcharge_pct: 8, local_toll: 0, regional_toll: 350,  national_toll: 900,  cross_country_toll: 1800, loading_charge: 500,  unloading_charge: 500,  gst_rate: 18, insurance_rate: 0.5, express_surcharge_pct: 25, premium_surcharge_pct: 50 },
  { vehicle_type: 'Tata Ace',       capacity_label: '1.5 Ton', capacity_kg: 1500,  base_rate: 1500,  per_km_rate: 20,  fuel_surcharge_pct: 8, local_toll: 0, regional_toll: 400,  national_toll: 1000, cross_country_toll: 2000, loading_charge: 600,  unloading_charge: 600,  gst_rate: 18, insurance_rate: 0.5, express_surcharge_pct: 25, premium_surcharge_pct: 50 },
  { vehicle_type: '3 Ton Truck',    capacity_label: '3 Ton',   capacity_kg: 3000,  base_rate: 2500,  per_km_rate: 25,  fuel_surcharge_pct: 8, local_toll: 0, regional_toll: 500,  national_toll: 1500, cross_country_toll: 3000, loading_charge: 1000, unloading_charge: 1000, gst_rate: 18, insurance_rate: 0.5, express_surcharge_pct: 25, premium_surcharge_pct: 50 },
  { vehicle_type: '7 Ton Truck',    capacity_label: '7 Ton',   capacity_kg: 7000,  base_rate: 4500,  per_km_rate: 30,  fuel_surcharge_pct: 8, local_toll: 0, regional_toll: 600,  national_toll: 1800, cross_country_toll: 3500, loading_charge: 1500, unloading_charge: 1500, gst_rate: 18, insurance_rate: 0.5, express_surcharge_pct: 25, premium_surcharge_pct: 50 },
  { vehicle_type: '14 Ton Truck',   capacity_label: '14 Ton',  capacity_kg: 14000, base_rate: 8000,  per_km_rate: 35,  fuel_surcharge_pct: 8, local_toll: 0, regional_toll: 700,  national_toll: 2000, cross_country_toll: 4000, loading_charge: 2500, unloading_charge: 2500, gst_rate: 18, insurance_rate: 0.5, express_surcharge_pct: 25, premium_surcharge_pct: 50 },
  { vehicle_type: '20 Ton Trailer', capacity_label: '20 Ton',  capacity_kg: 20000, base_rate: 12000, per_km_rate: 42,  fuel_surcharge_pct: 8, local_toll: 0, regional_toll: 800,  national_toll: 2500, cross_country_toll: 5000, loading_charge: 3500, unloading_charge: 3500, gst_rate: 18, insurance_rate: 0.5, express_surcharge_pct: 25, premium_surcharge_pct: 50 },
  { vehicle_type: 'Container',      capacity_label: '32 Ton',  capacity_kg: 32000, base_rate: 18000, per_km_rate: 55,  fuel_surcharge_pct: 8, local_toll: 0, regional_toll: 1000, national_toll: 3000, cross_country_toll: 6000, loading_charge: 5000, unloading_charge: 5000, gst_rate: 18, insurance_rate: 0.5, express_surcharge_pct: 25, premium_surcharge_pct: 50 },
];

function estimateDistance(fromPin, toPin) {
  if (!fromPin || !toPin) return 300;
  const f = String(fromPin).padStart(6, '0');
  const t = String(toPin).padStart(6, '0');
  if (f === t) return 15;
  if (f.slice(0, 4) === t.slice(0, 4)) return 35;
  if (f.slice(0, 3) === t.slice(0, 3)) return 100;
  if (f.slice(0, 2) === t.slice(0, 2)) return 250;
  if (f[0] === t[0]) return 650;
  return 1400;
}

function calcVolumetricWeight(l, w, h) {
  if (!l || !w || !h) return 0;
  return Math.round(((Number(l) * Number(w) * Number(h)) / 5000) * 100) / 100;
}

function selectVehicle(weight_kg, catalog) {
  const sorted = [...catalog].sort((a, b) => a.capacity_kg - b.capacity_kg);
  return sorted.find(v => v.capacity_kg >= weight_kg) || sorted[sorted.length - 1];
}

function getToll(rule, distance_km) {
  if (distance_km < 100)  return rule.local_toll  ?? 0;
  if (distance_km < 500)  return rule.regional_toll ?? 500;
  if (distance_km < 1000) return rule.national_toll ?? 1500;
  return rule.cross_country_toll ?? 3000;
}

function getTransitDays(distance_km, priority) {
  let base;
  if (distance_km < 50)    base = 'Same day';
  else if (distance_km < 150)  base = '1 day';
  else if (distance_km < 400)  base = '1-2 days';
  else if (distance_km < 700)  base = '2-3 days';
  else if (distance_km < 1200) base = '3-5 days';
  else base = '5-7 days';

  if (priority === 'express') {
    const m = { 'Same day': 'Same day', '1 day': 'Same day', '1-2 days': '1 day', '2-3 days': '1-2 days', '3-5 days': '2-3 days', '5-7 days': '3-4 days' };
    return m[base] || base;
  }
  if (priority === 'premium') {
    const m = { 'Same day': 'Same day (Priority)', '1 day': 'Same day', '1-2 days': 'Same day', '2-3 days': '1 day', '3-5 days': '1-2 days', '5-7 days': '2-3 days' };
    return m[base] || base;
  }
  return base;
}

function computePrice(rule, distance_km, opts = {}) {
  const base      = rule.base_rate;
  const dist_chg  = Math.round(distance_km * rule.per_km_rate);
  const s1        = base + dist_chg;
  const fuel      = Math.round(s1 * ((rule.fuel_surcharge_pct ?? 8) / 100));
  const toll      = getToll(rule, distance_km);
  const state_tax = distance_km > 200 ? Math.round(s1 * 0.005) : 0;
  const s2        = s1 + fuel + toll + state_tax;

  let express_chg = 0;
  if (opts.priority === 'express')  express_chg = Math.round(s2 * ((rule.express_surcharge_pct ?? 25) / 100));
  if (opts.priority === 'premium')  express_chg = Math.round(s2 * ((rule.premium_surcharge_pct ?? 50) / 100));

  const s3        = s2 + express_chg;
  const gst_rate  = rule.gst_rate ?? 18;
  const gst       = Math.round(s3 * gst_rate / 100);
  const insurance = (opts.insurance && opts.declared_value)
    ? Math.round((opts.declared_value * (rule.insurance_rate ?? 0.5)) / 100)
    : 0;
  const loading    = opts.loading   ? (rule.loading_charge   ?? 0) : 0;
  const unloading  = opts.unloading ? (rule.unloading_charge ?? 0) : 0;
  const grand      = s3 + gst + insurance + loading + unloading;

  return {
    base_freight:      base,
    distance_charges:  dist_chg,
    fuel_surcharge:    fuel,
    toll_charges:      toll,
    state_tax,
    express_charges:   express_chg,
    subtotal:          s3,
    gst_rate,
    gst_amount:        gst,
    insurance_amount:  insurance,
    loading_charges:   loading,
    unloading_charges: unloading,
    grand_total:       grand,
  };
}

module.exports = { DEFAULT_CATALOG, estimateDistance, calcVolumetricWeight, selectVehicle, computePrice, getTransitDays };
