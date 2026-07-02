import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
  Truck, User, MapPin, Zap, Leaf, Clock, AlertTriangle,
  TrendingUp, RefreshCw, CheckCircle, Play, Flag, Star,
  ChevronDown, ChevronUp, BarChart2, Fuel, Navigation,
  CloudRain, Wind, Eye, Activity, Package, XCircle,
} from 'lucide-react';

// Fix default Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Colour helpers ───────────────────────────────────────────────────────────
const riskColor = { low: 'text-green-400', medium: 'text-yellow-400', high: 'text-red-400', extreme: 'text-red-600' };
const riskBg    = { low: 'bg-green-900/40 border-green-700', medium: 'bg-yellow-900/40 border-yellow-700', high: 'bg-red-900/40 border-red-700', extreme: 'bg-red-950 border-red-600' };
const scoreColor = s => s >= 80 ? 'text-green-400' : s >= 60 ? 'text-yellow-400' : 'text-red-400';
const congestionColor = { low: 'text-green-400', moderate: 'text-yellow-400', high: 'text-orange-400', severe: 'text-red-400' };

// ─── Map auto-fit ─────────────────────────────────────────────────────────────
function MapAutoFit({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions?.length > 0) {
      map.fitBounds(positions, { padding: [40, 40] });
    }
  }, [positions, map]);
  return null;
}

// ─── Small stat card ──────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = 'text-blue-400' }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${color}`}><Icon size={18} /></div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
          <p className="text-lg font-bold text-white mt-0.5">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const r = 36, c = 2 * Math.PI * r;
  const filled = (score / 100) * c;
  const color  = score >= 80 ? '#4ade80' : score >= 60 ? '#facc15' : '#f87171';
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" className="mx-auto">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#334155" strokeWidth="8" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${filled} ${c}`} strokeLinecap="round"
        transform="rotate(-90 50 50)" />
      <text x="50" y="54" textAnchor="middle" fill={color} fontSize="18" fontWeight="bold">{score}</text>
      <text x="50" y="66" textAnchor="middle" fill="#94a3b8" fontSize="9">/ 100</text>
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RouteOptimizer() {
  // ── Form state
  const [form, setForm] = useState({
    shipment_search:   '',
    origin_address:    '',
    origin_lat:        '',
    origin_lng:        '',
    optimization_type: 'ai_recommended',
    route_type:        'single_stop',
    diesel_price:      '',
  });

  // ── Data state
  const [searchResults, setSearchResults]   = useState([]);
  const [selectedShipments, setSelected]    = useState([]);
  const [result, setResult]                 = useState(null);
  const [liveMap, setLiveMap]               = useState(null);
  const [analytics, setAnalytics]           = useState(null);
  const [allVehicles, setAllVehicles]       = useState([]);
  const [allDrivers, setAllDrivers]         = useState([]);
  const [routeHistory, setRouteHistory]     = useState([]);

  // ── UI state
  const [loading, setLoading]               = useState(false);
  const [activeTab, setActiveTab]           = useState('optimize'); // optimize | live | analytics | history | intelligence
  const [intel, setIntel]                   = useState({});
  const [intelLoading, setIntelLoading]     = useState(false);
  const [showOverride, setShowOverride]     = useState(false);
  const [overrideVehicle, setOverrideVehicle] = useState('');
  const [overrideDriver, setOverrideDriver]   = useState('');
  const [overrideReason, setOverrideReason]   = useState('');
  const [expandedStop, setExpandedStop]     = useState(null);

  // ── Load live map, analytics, vehicles, drivers on mount
  useEffect(() => {
    loadLiveMap();
    loadAnalytics();
    loadVehiclesDrivers();
    loadHistory();
  }, []);

  const loadLiveMap = async () => {
    try {
      const { data } = await api.get('/routes/live-map');
      setLiveMap(data);
    } catch {}
  };

  const loadAnalytics = async () => {
    try {
      const { data } = await api.get('/routes/analytics?days=30');
      setAnalytics(data);
    } catch {}
  };

  const loadVehiclesDrivers = async () => {
    try {
      const [v, d] = await Promise.all([
        api.get('/vehicles?limit=200'),
        api.get('/drivers?limit=200'),
      ]);
      setAllVehicles(v.data?.vehicles || v.data || []);
      setAllDrivers(d.data?.drivers  || d.data || []);
    } catch {}
  };

  const loadHistory = async () => {
    try {
      const { data } = await api.get('/routes/history?limit=20');
      setRouteHistory(data.history || []);
    } catch {}
  };

  // ── Shipment search
  const searchShipments = useCallback(async (q) => {
    if (!q || q.length < 2) { setSearchResults([]); return; }
    try {
      const { data } = await api.get(`/shipments?search=${encodeURIComponent(q)}&status=booked,in_transit,at_hub&limit=10`);
      setSearchResults(data.shipments || data || []);
    } catch {}
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchShipments(form.shipment_search), 300);
    return () => clearTimeout(t);
  }, [form.shipment_search, searchShipments]);

  const addShipment = (s) => {
    if (!selectedShipments.find(x => x._id === s._id)) {
      setSelected(prev => [...prev, s]);
    }
    setForm(f => ({ ...f, shipment_search: '' }));
    setSearchResults([]);
  };

  const removeShipment = (id) => setSelected(prev => prev.filter(x => x._id !== id));

  // ── Run optimization
  const runOptimize = async () => {
    if (!selectedShipments.length) { toast.error('Select at least one shipment'); return; }
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        shipment_ids:      selectedShipments.map(s => s._id),
        optimization_type: form.optimization_type,
        route_type:        form.route_type,
        origin_address:    form.origin_address || undefined,
        origin_lat:        form.origin_lat  ? Number(form.origin_lat)  : undefined,
        origin_lng:        form.origin_lng  ? Number(form.origin_lng)  : undefined,
        diesel_price:      form.diesel_price ? Number(form.diesel_price) : undefined,
        preferred_vehicle_id: overrideVehicle || undefined,
        preferred_driver_id:  overrideDriver  || undefined,
      };
      const { data } = await api.post('/routes/optimize', payload);
      setResult(data.result);
      toast.success('Route optimized!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Optimization failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Manual override assign
  const applyOverride = async () => {
    if (!result?._id) return;
    try {
      if (overrideVehicle) {
        await api.post('/routes/assign-vehicle', { route_id: result._id, vehicle_id: overrideVehicle, reason: overrideReason });
        toast.success('Vehicle assigned');
      }
      if (overrideDriver) {
        await api.post('/routes/assign-driver', { route_id: result._id, driver_id: overrideDriver, reason: overrideReason });
        toast.success('Driver assigned');
      }
      setShowOverride(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Override failed');
    }
  };

  // ── Start route
  const startRoute = async () => {
    if (!result?._id) return;
    try {
      await api.post(`/routes/${result._id}/start`);
      toast.success('Route started!');
      setResult(r => ({ ...r, status: 'active' }));
      loadLiveMap();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start route');
    }
  };

  // ── Recalculate
  const recalculate = async () => {
    if (!result?._id) return;
    setLoading(true);
    try {
      const { data } = await api.post('/routes/recalculate', { route_id: result._id, reason: 'Manual recalculation' });
      setResult(data.recalculated);
      toast.success('Route recalculated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Recalculation failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Map positions
  const mapPositions = result?.stops
    ?.filter(s => s.lat && s.lng)
    .map(s => [s.lat, s.lng]) || [];

  const originPos = form.origin_lat && form.origin_lng
    ? [[Number(form.origin_lat), Number(form.origin_lng)]]
    : [[18.5204, 73.8567]];

  const allPositions = [...originPos, ...mapPositions];

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Navigation className="text-blue-400" size={22} />
              AI Route Optimizer
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">Phase 4 — Intelligent Dispatch &amp; Route Planning</p>
          </div>
          <div className="flex gap-2">
            {['optimize', 'live', 'analytics', 'history', 'intelligence'].map(tab => (
              <button key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">

        {/* ── OPTIMIZE TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'optimize' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* LEFT: Input panel */}
            <div className="space-y-5">
              {/* Shipment selector */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
                  <Package size={14} className="inline mr-1" /> Shipments
                </h2>
                <div className="relative">
                  <input
                    value={form.shipment_search}
                    onChange={e => setForm(f => ({ ...f, shipment_search: e.target.value }))}
                    placeholder="Search by LR number, destination…"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-xl max-h-56 overflow-y-auto">
                      {searchResults.map(s => (
                        <button key={s._id} onClick={() => addShipment(s)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-600 border-b border-slate-600 last:border-0">
                          <span className="font-mono text-blue-300">{s.lr_number}</span>
                          <span className="text-slate-400 ml-2">→ {s.destination}</span>
                          <span className="text-slate-500 ml-2 text-xs">{s.weight}kg</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedShipments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selectedShipments.map(s => (
                      <div key={s._id} className="flex items-center justify-between bg-slate-700 rounded-lg px-3 py-2">
                        <div>
                          <span className="font-mono text-blue-300 text-sm">{s.lr_number}</span>
                          <span className="text-slate-400 text-xs ml-2">→ {s.destination}</span>
                          {s.weight && <span className="text-slate-500 text-xs ml-1">({s.weight}kg)</span>}
                        </div>
                        <button onClick={() => removeShipment(s._id)} className="text-slate-500 hover:text-red-400 ml-2">
                          <XCircle size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Origin */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
                  <MapPin size={14} className="inline mr-1" /> Origin / Depot
                </h2>
                <div className="space-y-3">
                  <input
                    value={form.origin_address}
                    onChange={e => setForm(f => ({ ...f, origin_address: e.target.value }))}
                    placeholder="Depot address (optional)"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={form.origin_lat}
                      onChange={e => setForm(f => ({ ...f, origin_lat: e.target.value }))}
                      placeholder="Latitude (e.g. 18.5204)"
                      type="number" step="any"
                      className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />
                    <input
                      value={form.origin_lng}
                      onChange={e => setForm(f => ({ ...f, origin_lng: e.target.value }))}
                      placeholder="Longitude (e.g. 73.8567)"
                      type="number" step="any"
                      className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Optimization settings */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
                  <Zap size={14} className="inline mr-1" /> Optimization Settings
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Optimization Type</label>
                    <select value={form.optimization_type}
                      onChange={e => setForm(f => ({ ...f, optimization_type: e.target.value }))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                      <option value="ai_recommended">AI Recommended</option>
                      <option value="shortest_distance">Shortest Distance</option>
                      <option value="lowest_fuel">Lowest Fuel</option>
                      <option value="fastest">Fastest Route</option>
                      <option value="lowest_toll">Lowest Toll</option>
                      <option value="balanced">Balanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Route Type</label>
                    <select value={form.route_type}
                      onChange={e => setForm(f => ({ ...f, route_type: e.target.value }))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                      <option value="single_stop">Single Stop</option>
                      <option value="multi_stop">Multi Stop</option>
                      <option value="pickup_delivery">Pickup &amp; Delivery</option>
                      <option value="round_trip">Round Trip</option>
                      <option value="return_trip">Return Trip</option>
                      <option value="express">Express</option>
                      <option value="economy">Economy</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Diesel Price (₹/L)</label>
                    <input
                      value={form.diesel_price}
                      onChange={e => setForm(f => ({ ...f, diesel_price: e.target.value }))}
                      placeholder="92"
                      type="number"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Manual override toggle */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <button onClick={() => setShowOverride(o => !o)}
                  className="flex items-center justify-between w-full text-sm font-semibold text-slate-300">
                  <span><User size={14} className="inline mr-1" /> Manual Override (optional)</span>
                  {showOverride ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showOverride && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Force Vehicle</label>
                      <select value={overrideVehicle}
                        onChange={e => setOverrideVehicle(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                        <option value="">-- Let AI decide --</option>
                        {allVehicles.map(v => (
                          <option key={v._id} value={v._id}>
                            {v.registration_number} ({v.vehicle_type}, {v.capacity_tons}T) — {v.status}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Force Driver</label>
                      <select value={overrideDriver}
                        onChange={e => setOverrideDriver(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                        <option value="">-- Let AI decide --</option>
                        {allDrivers.map(d => (
                          <option key={d._id} value={d._id}>
                            {d.name} — {d.status}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Override Reason</label>
                      <input
                        value={overrideReason}
                        onChange={e => setOverrideReason(e.target.value)}
                        placeholder="Reason for manual override"
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={runOptimize}
                disabled={loading || !selectedShipments.length}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-colors">
                {loading ? <><RefreshCw size={16} className="animate-spin" /> Optimizing…</> : <><Zap size={16} /> Run AI Optimization</>}
              </button>
            </div>

            {/* RIGHT: Results panel */}
            <div className="space-y-5">
              {!result ? (
                <div className="bg-slate-800 border border-dashed border-slate-600 rounded-xl p-12 text-center">
                  <Navigation size={40} className="text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Select shipments and run optimization to see the AI-recommended route, vehicle, driver, and fuel estimates.</p>
                </div>
              ) : (
                <>
                  {/* Score + key metrics */}
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="font-semibold text-white">Optimization Result</h2>
                      <div className="flex gap-2">
                        <button onClick={recalculate} disabled={loading}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-slate-300 transition-colors">
                          <RefreshCw size={12} /> Recalculate
                        </button>
                        {result.status !== 'active' && (
                          <button onClick={startRoute}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded-lg text-xs text-white transition-colors">
                            <Play size={12} /> Start Route
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-xs text-slate-400 mb-2">Optimization Score</p>
                        <ScoreRing score={result.optimization_score || 0} />
                      </div>
                      <div className="space-y-2.5">
                        <StatCard icon={MapPin}  label="Distance"   value={`${result.total_distance_km?.toFixed(1)} km`} color="text-blue-400" />
                        <StatCard icon={Clock}   label="ETA"        value={`${result.estimated_duration_min} min`} color="text-purple-400" />
                        <StatCard icon={Fuel}    label="Fuel Cost"  value={`₹${result.fuel_cost_optimized?.toFixed(0)}`}
                          sub={`Saving: ₹${result.fuel_saving?.toFixed(0)}`} color="text-orange-400" />
                        <StatCard icon={Leaf}    label="CO₂"        value={`${result.co2_emission_kg?.toFixed(1)} kg`} color="text-green-400" />
                      </div>
                    </div>
                  </div>

                  {/* AI Recommendation */}
                  {result.ai_recommendation && (
                    <div className={`border rounded-xl p-4 ${riskBg[result.delay_risk] || riskBg.low}`}>
                      <div className="flex items-start gap-2">
                        <Star className="text-yellow-400 mt-0.5 flex-shrink-0" size={16} />
                        <div>
                          <p className="text-sm font-semibold text-white">AI Recommendation</p>
                          <p className="text-sm text-slate-300 mt-1">{result.ai_recommendation}</p>
                          {result.ai_reasoning && <p className="text-xs text-slate-400 mt-1">{result.ai_reasoning}</p>}
                          {result.ai_risks?.length > 0 && (
                            <ul className="mt-2 space-y-0.5">
                              {result.ai_risks.map((r, i) => (
                                <li key={i} className="text-xs text-yellow-300 flex items-center gap-1">
                                  <AlertTriangle size={10} /> {r}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Vehicle + Driver recommendation */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Vehicle */}
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Truck size={12} /> Best Vehicle
                      </p>
                      {result.best_vehicle ? (
                        <>
                          <p className="font-bold text-white">{result.best_vehicle.registration_number}</p>
                          <p className="text-xs text-slate-400">{result.best_vehicle.vehicle_type} • {result.best_vehicle.capacity_tons}T</p>
                          <p className="text-xs text-slate-500 mt-1">{result.best_vehicle.reason}</p>
                          <div className="mt-2">
                            <span className="text-xs font-medium text-green-400">Score: {result.best_vehicle.score}</span>
                          </div>
                          {result.vehicle_candidates?.length > 1 && (
                            <p className="text-xs text-slate-500 mt-1">+{result.vehicle_candidates.length - 1} alternatives</p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-red-400">No available vehicle</p>
                      )}
                    </div>

                    {/* Driver */}
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <User size={12} /> Best Driver
                      </p>
                      {result.best_driver ? (
                        <>
                          <p className="font-bold text-white">{result.best_driver.name}</p>
                          <p className="text-xs text-slate-400">{result.best_driver.phone}</p>
                          <p className="text-xs text-slate-500 mt-1">{result.best_driver.reason}</p>
                          <div className="mt-2">
                            <span className="text-xs font-medium text-green-400">Score: {result.best_driver.score}</span>
                          </div>
                          {result.driver_candidates?.length > 1 && (
                            <p className="text-xs text-slate-500 mt-1">+{result.driver_candidates.length - 1} alternatives</p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-red-400">No available driver</p>
                      )}
                    </div>
                  </div>

                  {/* Apply manual override button (post-result) */}
                  {showOverride && (overrideVehicle || overrideDriver) && result._id && (
                    <button onClick={applyOverride}
                      className="w-full py-2 rounded-xl bg-yellow-700 hover:bg-yellow-600 text-white text-sm font-semibold">
                      Apply Manual Override
                    </button>
                  )}

                  {/* Weather + Traffic */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <CloudRain size={12} /> Weather
                      </p>
                      <p className="text-sm text-white">{result.weather_summary || '—'}</p>
                      {result.weather_alerts?.length > 0 && (
                        <ul className="mt-2 space-y-0.5">
                          {result.weather_alerts.map((a, i) => (
                            <li key={i} className="text-xs text-orange-300 flex items-center gap-1">
                              <AlertTriangle size={10} />{a}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Activity size={12} /> Traffic
                      </p>
                      <p className="text-sm text-white">{result.traffic_summary || '—'}</p>
                      {result.traffic_alerts?.length > 0 && (
                        <ul className="mt-2 space-y-0.5">
                          {result.traffic_alerts.map((a, i) => (
                            <li key={i} className="text-xs text-yellow-300 flex items-center gap-1">
                              <AlertTriangle size={10} />{a}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Delay risk */}
                  <div className={`border rounded-xl p-4 flex items-center gap-3 ${riskBg[result.delay_risk] || riskBg.low}`}>
                    <AlertTriangle className={riskColor[result.delay_risk] || 'text-green-400'} size={18} />
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Delay Risk: <span className={riskColor[result.delay_risk]}>{(result.delay_risk || 'low').toUpperCase()}</span>
                      </p>
                      {result.delay_risk_reason && <p className="text-xs text-slate-400 mt-0.5">{result.delay_risk_reason}</p>}
                    </div>
                  </div>

                  {/* Route stops */}
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                    <p className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-1">
                      <Flag size={14} /> Delivery Stops ({result.stops?.length})
                    </p>
                    <div className="space-y-2">
                      {result.stops?.map((stop, idx) => (
                        <div key={idx}
                          className="border border-slate-700 rounded-lg overflow-hidden">
                          <button
                            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-700 transition-colors"
                            onClick={() => setExpandedStop(expandedStop === idx ? null : idx)}>
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                                {stop.sequence}
                              </span>
                              <div className="text-left">
                                <p className="text-sm text-white">{stop.address || stop.lr_number}</p>
                                {stop.lr_number && <p className="text-xs text-blue-300 font-mono">{stop.lr_number}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {stop.priority && stop.priority !== 'normal' && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${stop.priority === 'emergency' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'}`}>
                                  {stop.priority}
                                </span>
                              )}
                              {stop.estimated_arrival && (
                                <span className="text-xs text-slate-400">
                                  ETA {new Date(stop.estimated_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                              {expandedStop === idx ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                            </div>
                          </button>
                          {expandedStop === idx && (
                            <div className="px-3 py-2 bg-slate-750 border-t border-slate-700 text-xs text-slate-400 space-y-1">
                              {stop.address && <p>📍 {stop.address}</p>}
                              {stop.stop_type && <p>Type: {stop.stop_type}</p>}
                              {stop.lat && stop.lng && <p>Coords: {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}</p>}
                              {stop.time_window_start && <p>Window: {new Date(stop.time_window_start).toLocaleTimeString()} – {new Date(stop.time_window_end).toLocaleTimeString()}</p>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mini map */}
                  {mapPositions.length > 0 && (
                    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden" style={{ height: 280 }}>
                      <MapContainer
                        center={originPos[0]}
                        zoom={7}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={true}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution="© OpenStreetMap contributors" />
                        <MapAutoFit positions={allPositions} />
                        {/* Origin marker */}
                        <Marker position={originPos[0]}>
                          <Popup>Origin / Depot</Popup>
                        </Marker>
                        {/* Stop markers */}
                        {result.stops?.filter(s => s.lat && s.lng).map((stop, i) => (
                          <Marker key={i} position={[stop.lat, stop.lng]}>
                            <Popup>Stop {stop.sequence}: {stop.address || stop.lr_number}</Popup>
                          </Marker>
                        ))}
                        {/* Route line */}
                        {allPositions.length > 1 && (
                          <Polyline positions={allPositions} color="#3b82f6" weight={3} opacity={0.8} dashArray="6 4" />
                        )}
                      </MapContainer>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── LIVE MAP TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'live' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Activity}  label="Active Routes"      value={liveMap?.active_routes?.length   || 0} color="text-blue-400" />
              <StatCard icon={Truck}     label="Active Shipments"   value={liveMap?.active_shipments?.length || 0} color="text-orange-400" />
              <StatCard icon={Truck}     label="Avail. Vehicles"    value={liveMap?.available_vehicles?.length || 0} color="text-green-400" />
              <StatCard icon={User}      label="Avail. Drivers"     value={liveMap?.available_drivers?.length  || 0} color="text-purple-400" />
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden" style={{ height: 420 }}>
              <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />
                {liveMap?.active_shipments?.filter(s => s.current_lat && s.current_lng).map((s, i) => (
                  <Marker key={i} position={[s.current_lat, s.current_lng]}>
                    <Popup>
                      <b>{s.lr_number}</b><br />
                      {s.driver_name} • {s.vehicle_number}<br />
                      Status: {s.status}<br />
                      Dest: {s.destination}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* Active routes table */}
            {liveMap?.active_routes?.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">Active Routes</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700 text-xs text-slate-400 uppercase">
                        <th className="pb-2 text-left">Vehicle</th>
                        <th className="pb-2 text-left">Driver</th>
                        <th className="pb-2 text-center">Stops</th>
                        <th className="pb-2 text-right">Distance</th>
                        <th className="pb-2 text-right">Score</th>
                        <th className="pb-2 text-right">Fuel Saving</th>
                        <th className="pb-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {liveMap.active_routes.map((r, i) => (
                        <tr key={i}>
                          <td className="py-2 font-mono text-blue-300">{r.vehicle_number || r.vehicle_id?.registration_number || '—'}</td>
                          <td className="py-2">{r.driver_name || r.driver_id?.name || '—'}</td>
                          <td className="py-2 text-center">{r.stops?.length || 0}</td>
                          <td className="py-2 text-right">{r.total_distance_km?.toFixed(1)} km</td>
                          <td className={`py-2 text-right font-bold ${scoreColor(r.optimization_score)}`}>{r.optimization_score}</td>
                          <td className="py-2 text-right text-green-400">₹{r.fuel_saving?.toFixed(0)}</td>
                          <td className="py-2 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${r.status === 'active' ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'}`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <button onClick={loadLiveMap} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 transition-colors">
              <RefreshCw size={14} /> Refresh Live Data
            </button>
          </div>
        )}

        {/* ── ANALYTICS TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'analytics' && (
          <div className="space-y-5">
            {analytics ? (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon={Navigation}  label="Total Routes"     value={analytics.route_summary?.total_routes || 0}   color="text-blue-400" />
                  <StatCard icon={TrendingUp}  label="Avg Score"        value={analytics.route_summary?.avg_score?.toFixed(1) || 0}  color="text-green-400" />
                  <StatCard icon={Fuel}        label="Total Fuel Saved" value={`₹${analytics.route_summary?.total_fuel_saving?.toFixed(0) || 0}`} color="text-orange-400" />
                  <StatCard icon={Leaf}        label="Total CO₂"        value={`${analytics.route_summary?.total_co2?.toFixed(1) || 0} kg`} color="text-emerald-400" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard icon={MapPin}      label="Total Distance"   value={`${analytics.route_summary?.total_distance?.toFixed(0) || 0} km`} color="text-cyan-400" />
                  <StatCard icon={Clock}       label="Avg Duration"     value={`${analytics.route_summary?.avg_duration?.toFixed(0) || 0} min`} color="text-purple-400" />
                  <StatCard icon={Fuel}        label="Avg Mileage"      value={`${analytics.fuel_summary?.avg_mileage?.toFixed(1) || 0} km/L`} color="text-yellow-400" />
                </div>

                {/* Vehicle utilization */}
                {analytics.vehicle_stats?.length > 0 && (
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4 flex items-center gap-1">
                      <Truck size={14} /> Vehicle Utilization (Last 30 Days)
                    </h2>
                    <div className="space-y-2">
                      {analytics.vehicle_stats.map((v, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                          <span className="font-mono text-blue-300 text-sm">{v.registration || v._id}</span>
                          <span className="text-xs text-slate-400">{v.type}</span>
                          <span className="text-sm text-white">{v.trips} trips</span>
                          <span className="text-sm text-slate-400">{v.total_km?.toFixed(0)} km</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Driver utilization */}
                {analytics.driver_stats?.length > 0 && (
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4 flex items-center gap-1">
                      <User size={14} /> Driver Utilization (Last 30 Days)
                    </h2>
                    <div className="space-y-2">
                      {analytics.driver_stats.map((d, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                          <span className="text-sm text-white">{d.name || d._id}</span>
                          <span className="text-xs text-slate-400">{d.phone}</span>
                          <span className="text-sm text-white">{d.trips} trips</span>
                          <span className="text-sm text-slate-400">{d.total_km?.toFixed(0)} km</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-slate-400 py-12">
                <BarChart2 size={40} className="mx-auto mb-3 text-slate-600" />
                <p>No analytics data yet. Run some optimizations first.</p>
              </div>
            )}
          </div>
        )}

        {/* ── HISTORY TAB ───────────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4 flex items-center gap-1">
              <Clock size={14} /> Route History
            </h2>
            {routeHistory.length === 0 ? (
              <div className="text-center text-slate-400 py-10">
                <Clock size={36} className="mx-auto mb-3 text-slate-600" />
                <p>No completed routes yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-xs text-slate-400 uppercase">
                      <th className="pb-2 text-left">Date</th>
                      <th className="pb-2 text-left">Vehicle</th>
                      <th className="pb-2 text-left">Driver</th>
                      <th className="pb-2 text-center">Stops</th>
                      <th className="pb-2 text-right">Distance</th>
                      <th className="pb-2 text-right">Duration</th>
                      <th className="pb-2 text-right">Fuel Saved</th>
                      <th className="pb-2 text-right">Score</th>
                      <th className="pb-2 text-right">On Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {routeHistory.map((h, i) => (
                      <tr key={i} className="hover:bg-slate-750">
                        <td className="py-2 text-slate-400 text-xs">{new Date(h.createdAt).toLocaleDateString()}</td>
                        <td className="py-2 font-mono text-blue-300 text-xs">{h.vehicle_number || '—'}</td>
                        <td className="py-2">{h.driver_name || '—'}</td>
                        <td className="py-2 text-center">{h.total_stops}</td>
                        <td className="py-2 text-right">{h.total_distance_km?.toFixed(1)} km</td>
                        <td className="py-2 text-right">{h.actual_duration_min} min</td>
                        <td className="py-2 text-right text-green-400">₹{h.fuel_saving?.toFixed(0)}</td>
                        <td className={`py-2 text-right font-bold ${scoreColor(h.optimization_score)}`}>{h.optimization_score}</td>
                        <td className="py-2 text-right">
                          {h.on_time
                            ? <CheckCircle size={14} className="text-green-400 inline" />
                            : <XCircle   size={14} className="text-red-400 inline" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── INTELLIGENCE TAB ──────────────────────────────────────────────── */}
        {activeTab === 'intelligence' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Route Intelligence Dashboard</h2>
              <button disabled={intelLoading} onClick={async () => {
                setIntelLoading(true);
                try {
                  const [learning, risk, fatigue, docks, fuel] = await Promise.all([
                    api.get('/routes/learning'),
                    api.get('/routes/risk'),
                    api.get('/routes/fatigue'),
                    api.get('/routes/docks'),
                    api.get('/routes/fuel-stations'),
                  ]);
                  setIntel({ learning: learning.data, risk: risk.data, fatigue: fatigue.data, docks: docks.data, fuel: fuel.data });
                } catch { /* graceful */ } finally { setIntelLoading(false); }
              }} className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50">
                {intelLoading ? 'Loading…' : 'Refresh Intelligence'}
              </button>
            </div>

            {!intel.learning && !intelLoading && (
              <div className="text-center py-10 text-slate-400">
                <Activity size={36} className="mx-auto mb-2 text-slate-600" />
                <p>Click "Refresh Intelligence" to load AI route insights.</p>
              </div>
            )}

            {/* Route Learning Insights */}
            {intel.learning && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2"><TrendingUp size={14} /> Route Learning Insights</h3>
                {intel.learning.routes?.length === 0 ? <p className="text-slate-400 text-sm">No completed routes to learn from yet.</p> : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['avg_eta_error_min','avg_fuel_error_l','avg_delay_min','avg_driver_score'].map(k => (
                      <div key={k} className="bg-slate-900 rounded-lg p-3">
                        <div className="text-xs text-slate-400 mb-1">{k.replace(/avg_|_/g,' ').trim()}</div>
                        <div className="text-lg font-bold text-blue-400">{
                          (() => { const arr = (intel.learning.routes||[]); if(!arr.length) return '—'; const avg = arr.reduce((s,r)=>s+(r[k]||0),0)/arr.length; return avg.toFixed(1); })()
                        }</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Route Risk */}
            {intel.risk && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2"><AlertTriangle size={14} /> Route Risk Assessment</h3>
                {(intel.risk.risks||[]).length === 0
                  ? <p className="text-slate-400 text-sm">No risk records yet.</p>
                  : <div className="space-y-2">
                    {(intel.risk.risks||[]).slice(0,5).map((r,i) => (
                      <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${riskBg[r.risk_level]||'bg-slate-900 border-slate-700'}`}>
                        <span className="text-sm">{r.route_id || 'Route'}</span>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold uppercase ${riskColor[r.risk_level]}`}>{r.risk_level}</span>
                          <span className="text-slate-400 text-xs">Score: {r.overall_risk_score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                }
              </div>
            )}

            {/* Driver Fatigue */}
            {intel.fatigue && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2"><User size={14} /> Driver Fatigue Monitor</h3>
                {(intel.fatigue.drivers||[]).length === 0
                  ? <p className="text-slate-400 text-sm">No fatigue data yet.</p>
                  : <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-slate-700 text-xs text-slate-400">
                        <th className="pb-2 text-left">Driver</th><th className="pb-2 text-center">Today (hrs)</th>
                        <th className="pb-2 text-center">Week (hrs)</th><th className="pb-2 text-center">Status</th>
                      </tr></thead>
                      <tbody className="divide-y divide-slate-700">
                        {(intel.fatigue.drivers||[]).map((d,i) => (
                          <tr key={i} className="hover:bg-slate-750">
                            <td className="py-2">{d.driver_name||d.driver_id}</td>
                            <td className="py-2 text-center">{d.hours_driven_today?.toFixed(1)||'0.0'}</td>
                            <td className="py-2 text-center">{d.hours_driven_week?.toFixed(1)||'0.0'}</td>
                            <td className="py-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${d.is_fatigued ? 'bg-red-900/40 text-red-300' : d.is_eligible_for_assignment ? 'bg-green-900/40 text-green-300' : 'bg-yellow-900/40 text-yellow-300'}`}>
                                {d.is_fatigued ? 'Fatigued' : d.is_eligible_for_assignment ? 'Available' : 'Near limit'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            )}

            {/* Dock Schedule */}
            {intel.docks && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2"><Package size={14} /> Dock Availability</h3>
                {(intel.docks.docks||[]).length === 0
                  ? <p className="text-slate-400 text-sm">No dock schedules configured yet.</p>
                  : <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {(intel.docks.docks||[]).map((d,i) => (
                      <div key={i} className="bg-slate-900 rounded-lg p-3">
                        <div className="text-xs text-slate-400">Dock #{d.dock_number}</div>
                        <div className="text-sm font-medium mt-1">{d.status}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{d.purpose}</div>
                      </div>
                    ))}
                  </div>
                }
              </div>
            )}

            {/* Fuel Stations */}
            {intel.fuel && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2"><Fuel size={14} /> Fuel Station Recommendations</h3>
                {(intel.fuel.stations||[]).length === 0
                  ? <p className="text-slate-400 text-sm">No fuel stations configured yet. Add preferred stations in the settings.</p>
                  : <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(intel.fuel.stations||[]).map((s,i) => (
                      <div key={i} className={`p-3 rounded-lg border ${s.is_preferred ? 'border-blue-600 bg-blue-900/20' : 'border-slate-700 bg-slate-900'}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-sm">{s.name}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{s.brand} · {s.fuel_type}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-blue-400 font-bold text-sm">₹{s.fuel_price_per_l}/L</div>
                            {s.rating && <div className="text-xs text-yellow-400">★ {s.rating}</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                }
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
