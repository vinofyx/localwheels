const WeatherSnapshot = require('../models/WeatherSnapshot');

const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

// Base mileage by vehicle type (km/litre on mixed roads)
const VEHICLE_MILEAGE = {
  bike:       35,
  tempo:      14,
  mini_truck: 12,
  truck:       8,
  trailer:     5,
  container:   5,
};

// Weather impact multipliers on driving risk and fuel
const CONDITION_MAP = {
  clear:        { risk: 'low',    fuel_multiplier: 1.0, delay_min: 0 },
  clouds:       { risk: 'low',    fuel_multiplier: 1.0, delay_min: 0 },
  drizzle:      { risk: 'medium', fuel_multiplier: 1.05, delay_min: 10 },
  rain:         { risk: 'medium', fuel_multiplier: 1.1,  delay_min: 20 },
  thunderstorm: { risk: 'high',   fuel_multiplier: 1.15, delay_min: 40 },
  snow:         { risk: 'high',   fuel_multiplier: 1.2,  delay_min: 60 },
  mist:         { risk: 'medium', fuel_multiplier: 1.05, delay_min: 15 },
  fog:          { risk: 'high',   fuel_multiplier: 1.1,  delay_min: 30 },
  haze:         { risk: 'medium', fuel_multiplier: 1.05, delay_min: 10 },
  dust:         { risk: 'medium', fuel_multiplier: 1.05, delay_min: 15 },
  sand:         { risk: 'high',   fuel_multiplier: 1.1,  delay_min: 30 },
  ash:          { risk: 'high',   fuel_multiplier: 1.1,  delay_min: 30 },
  squall:       { risk: 'high',   fuel_multiplier: 1.15, delay_min: 45 },
  tornado:      { risk: 'extreme',fuel_multiplier: 1.5,  delay_min: 120 },
};

function buildLocationKey(lat, lng) {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

async function fetchFromOpenWeather(lat, lng) {
  if (!WEATHER_API_KEY) return null;
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=metric`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();

    const condition = (data.weather?.[0]?.main || 'clear').toLowerCase();
    const meta      = CONDITION_MAP[condition] || CONDITION_MAP.clear;
    const windSpeed = data.wind?.speed ? data.wind.speed * 3.6 : 0; // m/s → km/h

    const alerts = [];
    if (['thunderstorm', 'tornado', 'squall'].includes(condition))
      alerts.push({ type: 'storm',  severity: 'warning', message: `Storm conditions: ${data.weather[0].description}` });
    if (['rain', 'drizzle'].includes(condition) && (data.rain?.['1h'] || 0) > 10)
      alerts.push({ type: 'rain',   severity: 'watch',   message: `Heavy rain: ${data.rain?.['1h']} mm/h` });
    if (data.main?.temp > 42)
      alerts.push({ type: 'heat',   severity: 'watch',   message: `Extreme heat: ${data.main.temp}°C` });
    if (windSpeed > 60)
      alerts.push({ type: 'wind',   severity: 'warning', message: `High winds: ${windSpeed.toFixed(0)} km/h` });
    if (data.visibility && data.visibility < 1000)
      alerts.push({ type: 'flood',  severity: 'watch',   message: `Very low visibility: ${data.visibility}m` });

    return {
      condition,
      temperature:  data.main?.temp,
      humidity:     data.main?.humidity,
      wind_speed:   windSpeed,
      visibility:   (data.visibility || 10000) / 1000,
      alerts,
      driving_risk: meta.risk,
      city:         data.name,
      source:       'openweather',
    };
  } catch {
    return null;
  }
}

function estimateWeather(lat) {
  // Rough seasonal estimate based on latitude (India-centric heuristic)
  const month = new Date().getMonth(); // 0-11
  const isMonsoon = month >= 5 && month <= 9;
  const isSummer  = month >= 2 && month <= 5;

  let condition = 'clear';
  let temp = 28;
  let alerts = [];

  if (isMonsoon) {
    condition = lat < 20 ? 'rain' : 'clouds';
    temp = 30;
    if (lat < 15) alerts.push({ type: 'rain', severity: 'watch', message: 'Monsoon season — expect rain delays' });
  } else if (isSummer) {
    temp = 38;
    if (temp > 42) alerts.push({ type: 'heat', severity: 'watch', message: `High heat advisory: ${temp}°C` });
  }

  const meta = CONDITION_MAP[condition] || CONDITION_MAP.clear;
  return {
    condition,
    temperature:  temp,
    humidity:     isMonsoon ? 80 : 45,
    wind_speed:   15,
    visibility:   10,
    alerts,
    driving_risk: meta.risk,
    city:         'Unknown',
    source:       'estimated',
  };
}

async function getWeather(lat, lng, companyId) {
  const locationKey = buildLocationKey(lat, lng);
  const now = new Date();

  // Check cache (valid for 1 hour)
  const cached = await WeatherSnapshot.findOne({
    location_key: locationKey,
    expires_at:   { $gt: now },
  }).lean();
  if (cached) return cached;

  // Fetch live or estimate
  const liveData = await fetchFromOpenWeather(lat, lng) || estimateWeather(lat);

  const expires = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
  const snap = await WeatherSnapshot.findOneAndUpdate(
    { location_key: locationKey },
    {
      company_id:   companyId,
      location_key: locationKey,
      lat, lng,
      ...liveData,
      fetched_at: now,
      expires_at: expires,
    },
    { upsert: true, new: true }
  ).lean();

  return snap;
}

function getWeatherImpact(weatherData) {
  const condition = (weatherData?.condition || 'clear').toLowerCase();
  const meta = CONDITION_MAP[condition] || CONDITION_MAP.clear;
  return {
    driving_risk:      meta.risk,
    fuel_multiplier:   meta.fuel_multiplier,
    delay_minutes:     meta.delay_min,
    weather_alerts:    (weatherData?.alerts || []).map(a => a.message),
    weather_summary:   `${weatherData?.condition || 'Clear'}, ${weatherData?.temperature || 28}°C, wind ${weatherData?.wind_speed || 0} km/h`,
  };
}

module.exports = { getWeather, getWeatherImpact, VEHICLE_MILEAGE };
