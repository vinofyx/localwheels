const https = require('https');
const { estimateDistance } = require('./freightCalc');

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch { reject(new Error('JSON parse failed')); }
      });
    }).on('error', reject);
  });
}

async function getRouteDistance({ pickup_pincode, pickup_city, destination_pincode, destination_city }) {
  const key = process.env.GOOGLE_MAPS_API_KEY;

  if (key) {
    const origin = [pickup_city, pickup_pincode, 'India'].filter(Boolean).join(' ');
    const dest   = [destination_city, destination_pincode, 'India'].filter(Boolean).join(' ');
    const url    = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&mode=driving&units=metric&key=${key}`;

    try {
      const data = await fetchJSON(url);
      if (data.status === 'OK' && data.routes?.[0]?.legs?.[0]) {
        const leg = data.routes[0].legs[0];
        return {
          distance_km:   Math.round(leg.distance.value / 1000),
          duration_min:  Math.round(leg.duration.value / 60),
          source:        'google_maps',
          route_summary: data.routes[0].summary || null,
        };
      }
    } catch { /* fall through to estimate */ }
  }

  return {
    distance_km:   estimateDistance(pickup_pincode, destination_pincode),
    duration_min:  null,
    source:        'estimated',
    route_summary: null,
  };
}

module.exports = { getRouteDistance };
