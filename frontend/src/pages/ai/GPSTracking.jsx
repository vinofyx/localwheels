import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';

const STATUS_COLOR = { Moving: 'bg-green-100 text-green-700', Stopped: 'bg-red-100 text-red-700', Idle: 'bg-yellow-100 text-yellow-700' };
const GEO_COLOR   = { Inside: 'text-green-600', Outside: 'text-red-600', 'Near Delivery': 'text-blue-600' };

export default function GPSTracking() {
  const [vehicles, setVehicles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('All');
  const intervalRef             = useRef(null);

  function load() {
    api.get('/ai/gps/vehicles')
      .then(r => setVehicles(r.data))
      .catch(() => toast.error('GPS fetch failed'));
  }

  useEffect(() => {
    load();
    setLoading(false);
    intervalRef.current = setInterval(load, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const filtered = vehicles.filter(v => {
    const matchSearch = !search || v.vehicle_no.includes(search.toUpperCase()) || v.driver.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || v.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded shadow text-white px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold flex items-center gap-2">📍 Real-Time GPS Tracking</h1>
          <p className="text-green-100 text-[12px]">Live vehicle locations, speed, geo-fence alerts, history playback</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-[12px] text-green-100">Live — auto-refresh 30s</span>
          <button onClick={load} className="bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold px-3 py-1 rounded">Refresh</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: 'Total',   val: vehicles.length,                                   color: '#0b8fd3' },
          { label: 'Moving',  val: vehicles.filter(v => v.status === 'Moving').length, color: '#22c55e' },
          { label: 'Stopped', val: vehicles.filter(v => v.status === 'Stopped').length,color: '#ef4444' },
          { label: 'Idle',    val: vehicles.filter(v => v.status === 'Idle').length,   color: '#f97316' },
          { label: 'Alerts',  val: vehicles.reduce((s, v) => s + v.alerts, 0),         color: '#ef4444' },
          { label: 'Near Del',val: vehicles.filter(v => v.geofence === 'Near Delivery').length, color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded shadow-sm p-2 text-center border-t-2" style={{ borderColor: s.color }}>
            <p className="text-xl font-bold text-gray-800">{s.val}</p>
            <p className="text-[10px] font-semibold text-gray-500 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Vehicle List */}
        <div className="bg-white rounded shadow-sm lg:col-span-1">
          <div className="px-3 py-2 border-b space-y-2">
            <input className="w-full border border-gray-300 rounded px-2 py-1 text-[12px]"
              placeholder="Search vehicle / driver…" value={search} onChange={e => setSearch(e.target.value)} />
            <div className="flex gap-1 flex-wrap">
              {['All','Moving','Stopped','Idle'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${filter === f ? 'bg-[#0b8fd3] text-white border-[#0b8fd3]' : 'text-gray-600 border-gray-300 hover:border-blue-400'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 480 }}>
            {loading ? (
              <p className="p-4 text-center text-gray-400 text-sm">Loading…</p>
            ) : filtered.map(v => (
              <div key={v.vehicle_no} onClick={() => setSelected(v)}
                className={`px-3 py-2 border-b cursor-pointer hover:bg-blue-50 transition-colors ${selected?.vehicle_no === v.vehicle_no ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-[12px] text-gray-800">{v.vehicle_no}</p>
                    <p className="text-[11px] text-gray-500">{v.driver}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_COLOR[v.status]}`}>{v.status}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                  <span>⚡ {v.speed} km/h</span>
                  <span>⛽ {v.fuel_pct}%</span>
                  <span>📏 {v.today_km} km</span>
                  {v.alerts > 0 && <span className="text-red-500 font-bold">⚠️ {v.alerts}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map + Detail */}
        <div className="lg:col-span-2 space-y-3">
          {/* Map placeholder */}
          <div className="bg-white rounded shadow-sm overflow-hidden">
            <div className="px-3 py-2 border-b flex items-center justify-between">
              <h2 className="text-[13px] font-bold text-gray-700">Live Map</h2>
              <span className="text-[11px] text-gray-400">GPS coordinates — map integration ready</span>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-green-50 flex flex-col items-center justify-center" style={{ height: 260 }}>
              <div className="text-center">
                <p className="text-5xl mb-2">🗺️</p>
                <p className="text-[13px] font-semibold text-gray-600">Live Vehicle Map</p>
                <p className="text-[11px] text-gray-400 mt-1">Connect Google Maps API key to enable live tracking</p>
                {selected && (
                  <div className="mt-3 bg-white rounded-lg shadow px-4 py-2 text-[12px] text-left space-y-1">
                    <p><b>Vehicle:</b> {selected.vehicle_no}</p>
                    <p><b>Driver:</b> {selected.driver}</p>
                    <p><b>Coordinates:</b> {selected.lat}, {selected.lng}</p>
                    <p><b>Speed:</b> {selected.speed} km/h | <b>Heading:</b> {selected.heading}°</p>
                    <p><b>Geo-fence:</b> <span className={GEO_COLOR[selected.geofence]}>{selected.geofence}</span></p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selected vehicle detail */}
          {selected && (
            <div className="bg-white rounded shadow-sm p-3">
              <h2 className="text-[13px] font-bold text-gray-700 border-b pb-1 mb-2">
                Vehicle Detail — {selected.vehicle_no}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
                {[
                  { label: 'Driver',      val: selected.driver },
                  { label: 'Status',      val: selected.status },
                  { label: 'Speed',       val: `${selected.speed} km/h` },
                  { label: 'Idle Time',   val: `${selected.idle_min} min` },
                  { label: 'Today KM',    val: `${selected.today_km} km` },
                  { label: 'Fuel',        val: `${selected.fuel_pct}%` },
                  { label: 'Ignition',    val: selected.ignition ? '🟢 ON' : '🔴 OFF' },
                  { label: 'Odometer',    val: `${selected.odometer.toLocaleString('en-IN')} km` },
                  { label: 'Geo-fence',   val: selected.geofence },
                  { label: 'Alerts',      val: selected.alerts },
                  { label: 'Last Update', val: new Date(selected.last_seen).toLocaleTimeString('en-IN') },
                  { label: 'Coordinates', val: `${selected.lat}, ${selected.lng}` },
                ].map(f => (
                  <div key={f.label} className="bg-gray-50 rounded p-2">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">{f.label}</p>
                    <p className="font-medium text-gray-800 mt-0.5">{f.val}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2 flex-wrap">
                <button className="text-[11px] font-bold px-3 py-1.5 bg-[#0b8fd3] text-white rounded hover:bg-[#0066aa]">📜 History Playback</button>
                <button className="text-[11px] font-bold px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700">🔔 Set Geo-fence</button>
                <button className="text-[11px] font-bold px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700">📱 Send Alert to Driver</button>
                <button className="text-[11px] font-bold px-3 py-1.5 bg-orange-500 text-white rounded hover:bg-orange-600">🔗 Customer Tracking Link</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
