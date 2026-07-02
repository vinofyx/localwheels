const TrafficSnapshot = require('../models/TrafficSnapshot');

const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Peak hours: 8-10am and 5-8pm
function isPeakHour() {
  const h = new Date().getHours();
  return (h >= 8 && h <= 10) || (h >= 17 && h <= 20);
}

function buildRouteKey(oLat, oLng, dLat, dLng) {
  return `${oLat.toFixed(3)},${oLng.toFixed(3)}→${dLat.toFixed(3)},${dLng.toFixed(3)}`;
}

// Haversine distance in km
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchGoogleTraffic(oLat, oLng, dLat, dLng) {
  if (!GOOGLE_MAPS_KEY) return null;
  try {
    const origin = `${oLat},${oLng}`;
    const dest   = `${dLat},${dLng}`;
    const url    = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${dest}&departure_time=now&traffic_model=best_guess&key=${GOOGLE_MAPS_KEY}`;
    const res    = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = await res.json();

    const el = data.rows?.[0]?.elements?.[0];
    if (!el || el.status !== 'OK') return null;

    const normalSecs  = el.duration?.value || 0;
    const trafficSecs = el.duration_in_traffic?.value || normalSecs;
    const delayMin    = Math.max(0, Math.round((trafficSecs - normalSecs) / 60));

    let congestion = 'low';
    const ratio = trafficSecs / (normalSecs || 1);
    if (ratio > 1.5)      congestion = 'severe';
    else if (ratio > 1.3) congestion = 'high';
    else if (ratio > 1.1) congestion = 'moderate';

    return {
      congestion_level: congestion,
      delay_minutes:    delayMin,
      distance_km:      (el.distance?.value || 0) / 1000,
      duration_min:     Math.round(trafficSecs / 60),
      incidents:        [],
      road_closures:    [],
      construction:     [],
      is_peak_hour:     isPeakHour(),
      source:           'google',
    };
  } catch {
    return null;
  }
}

function estimateTraffic(oLat, oLng, dLat, dLng) {
  const distKm  = haversine(oLat, oLng, dLat, dLng);
  const peak    = isPeakHour();
  const hour    = new Date().getHours();
  const isNight = hour < 5 || hour > 22;

  // Base speed assumptions
  let speedKmh = isNight ? 65 : (distKm > 100 ? 55 : 35);
  let congestion = 'low';
  let delay = 0;

  if (peak && !isNight) {
    congestion = distKm < 50 ? 'high' : 'moderate';
    delay = distKm < 50 ? 20 : 10;
    speedKmh *= 0.7;
  }

  return {
    congestion_level: congestion,
    delay_minutes:    delay,
    distance_km:      distKm,
    duration_min:     Math.round((distKm / speedKmh) * 60) + delay,
    incidents:        [],
    road_closures:    [],
    construction:     [],
    is_peak_hour:     peak,
    source:           'estimated',
  };
}

async function getTraffic(oLat, oLng, dLat, dLng, companyId) {
  const routeKey = buildRouteKey(oLat, oLng, dLat, dLng);
  const now = new Date();

  const cached = await TrafficSnapshot.findOne({
    route_key:  routeKey,
    expires_at: { $gt: now },
  }).lean();
  if (cached) return cached;

  const liveData = await fetchGoogleTraffic(oLat, oLng, dLat, dLng)
    || estimateTraffic(oLat, oLng, dLat, dLng);

  const expires = new Date(now.getTime() + 30 * 60 * 1000); // 30 min TTL
  const snap = await TrafficSnapshot.findOneAndUpdate(
    { route_key: routeKey },
    {
      company_id:  companyId,
      route_key:   routeKey,
      origin_lat:  oLat, origin_lng: oLng,
      dest_lat:    dLat, dest_lng:   dLng,
      ...liveData,
      fetched_at:  now,
      expires_at:  expires,
    },
    { upsert: true, new: true }
  ).lean();

  return snap;
}

function getTrafficImpact(trafficData) {
  const level = trafficData?.congestion_level || 'low';
  const multiplierMap = { low: 1.0, moderate: 1.15, high: 1.3, severe: 1.5 };
  return {
    congestion_level:  level,
    speed_multiplier:  1 / (multiplierMap[level] || 1),
    delay_minutes:     trafficData?.delay_minutes || 0,
    traffic_alerts:    [
      ...(trafficData?.incidents   || []),
      ...(trafficData?.road_closures || []),
      ...(trafficData?.construction  || []),
      trafficData?.is_peak_hour ? 'Peak hour traffic' : null,
    ].filter(Boolean),
    traffic_summary:   `${level.charAt(0).toUpperCase() + level.slice(1)} congestion${trafficData?.is_peak_hour ? ' (peak hour)' : ''}, +${trafficData?.delay_minutes || 0} min delay`,
  };
}

module.exports = { getTraffic, getTrafficImpact, haversine, isPeakHour };
