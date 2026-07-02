import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

function TelemetryCard({ label, value, unit, status, icon }) {
  const statusColor = status === 'critical' ? 'text-red-600' : status === 'warning' ? 'text-yellow-600' : 'text-green-600';
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-lg">{icon}</span>
        {status && <span className={`text-xs font-medium ${statusColor}`}>{status.toUpperCase()}</span>}
      </div>
      <div className="text-xl font-bold text-gray-800">{value ?? '—'}{unit && value != null ? <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span> : null}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

export default function LiveTelemetry() {
  const [snapshot, setSnapshot] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simVehicleId, setSimVehicleId] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      api.get(`${_BASE}/telemetry/fleet-snapshot`),
      api.get(`${_BASE}/iot/devices?limit=50`),
    ])
      .then(([s, d]) => { setSnapshot(s.data.snapshots || []); setDevices(d.data.devices || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [autoRefresh, load]);

  const loadLive = async (vehicleId) => {
    setSelected(vehicleId);
    try {
      const r = await api.get(`${_BASE}/telemetry/live/${vehicleId}`);
      setLiveData(r.data.data);
    } catch { setLiveData(null); }
  };

  const simulate = async () => {
    if (!simVehicleId) return;
    setSimulating(true);
    try {
      await api.post(`${_BASE}/telemetry/simulate`, { fleet_vehicle_id: simVehicleId, count: 20 });
      await loadLive(simVehicleId);
    } catch {}
    setSimulating(false);
  };

  const t = liveData;
  const isOld = t && new Date() - new Date(t.recorded_at) > 60000;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Live Telemetry</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} className="rounded" />
            Auto-refresh (10s)
          </label>
          <button onClick={load} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Refresh</button>
        </div>
      </div>

      {/* Fleet Snapshot */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Fleet Snapshot</h2>
          <span className="text-xs text-gray-400">{snapshot.length} vehicles</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : snapshot.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <div className="text-3xl mb-2">📡</div>
            <div>No telemetry data. Register IoT devices and stream data.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Vehicle</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Speed</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Fuel %</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Battery V</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Coolant °C</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Last Update</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {snapshot.map((s, i) => {
                  const tel = s.telemetry;
                  const age = tel ? Math.round((Date.now() - new Date(tel.recorded_at)) / 60000) : null;
                  return (
                    <tr key={s.vehicle?._id || i} className={`hover:bg-gray-50 cursor-pointer ${selected === s.vehicle?._id ? 'bg-indigo-50' : ''}`} onClick={() => loadLive(s.vehicle?._id)}>
                      <td className="px-4 py-3 font-medium text-gray-800">{s.vehicle?.vehicle_number || '—'}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{tel?.motion?.speed ?? '—'} <span className="text-gray-400 text-xs">km/h</span></td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${(tel?.fuel?.level_pct || 100) < 20 ? 'text-red-600' : 'text-gray-700'}`}>{tel?.fuel?.level_pct ?? '—'}%</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${(tel?.electrical?.battery_voltage || 13) < 12 ? 'text-red-600' : 'text-gray-700'}`}>{tel?.electrical?.battery_voltage?.toFixed(1) ?? '—'}V</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${(tel?.engine?.coolant_temp || 0) > 100 ? 'text-red-600' : 'text-gray-700'}`}>{tel?.engine?.coolant_temp ?? '—'}°C</span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-gray-400">{age != null ? `${age}m ago` : '—'}</td>
                      <td className="px-4 py-3">
                        <button className="text-xs text-indigo-600 hover:underline">View</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Live Detail Panel */}
      {selected && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Live Vehicle Data</h2>
            {isOld && <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">⚠️ Data may be stale</span>}
            {!t && <span className="text-xs text-gray-400">No live telemetry available</span>}
          </div>
          {t ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <TelemetryCard icon="🏎️" label="Speed" value={t.motion?.speed} unit="km/h" status={t.motion?.speed > 90 ? 'warning' : null} />
              <TelemetryCard icon="⚙️" label="Engine RPM" value={t.engine?.rpm} unit="rpm" status={t.engine?.rpm > 3500 ? 'warning' : null} />
              <TelemetryCard icon="🌡️" label="Coolant Temp" value={t.engine?.coolant_temp} unit="°C" status={t.engine?.coolant_temp > 100 ? 'critical' : t.engine?.coolant_temp > 90 ? 'warning' : null} />
              <TelemetryCard icon="🔋" label="Battery" value={t.electrical?.battery_voltage?.toFixed(1)} unit="V" status={t.electrical?.battery_voltage < 12 ? 'critical' : t.electrical?.battery_voltage < 12.4 ? 'warning' : null} />
              <TelemetryCard icon="⛽" label="Fuel Level" value={t.fuel?.level_pct} unit="%" status={t.fuel?.level_pct < 15 ? 'critical' : t.fuel?.level_pct < 25 ? 'warning' : null} />
              <TelemetryCard icon="💨" label="Engine Load" value={t.engine?.engine_load} unit="%" status={t.engine?.engine_load > 90 ? 'warning' : null} />
              <TelemetryCard icon="🛣️" label="Odometer" value={t.motion?.odometer ? t.motion.odometer.toLocaleString() : null} unit="km" />
              <TelemetryCard icon="📍" label="GPS" value={t.gps?.lat ? `${t.gps.lat?.toFixed(4)},${t.gps.lng?.toFixed(4)}` : null} />
            </div>
          ) : (
            <div className="text-center text-gray-400 py-6">No telemetry data for selected vehicle</div>
          )}
        </div>
      )}

      {/* Simulate Telemetry */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-amber-800 mb-2">📡 Simulate Telemetry (Development)</h3>
        <div className="flex gap-3">
          <input value={simVehicleId} onChange={e => setSimVehicleId(e.target.value)} placeholder="Vehicle ID (MongoDB ObjectId)" className="flex-1 border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" />
          <button onClick={simulate} disabled={simulating || !simVehicleId} className="px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 disabled:opacity-50">
            {simulating ? 'Generating...' : 'Simulate 20 Packets'}
          </button>
        </div>
        <p className="text-xs text-amber-600 mt-1">In production, IoT devices push data via POST /api/telemetry with device API key.</p>
      </div>

      {/* IoT Devices */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Registered IoT Devices</h2>
        {devices.length === 0 ? (
          <div className="text-center text-gray-300 py-6">No IoT devices registered. Use the IoT registration API to onboard devices.</div>
        ) : (
          <div className="space-y-2">
            {devices.map(d => (
              <div key={d._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-800">{d.device_id}</div>
                  <div className="text-xs text-gray-400">{d.device_type} • {d.vehicle_number || 'Unassigned'}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${d.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{d.status}</span>
                  <span className="text-xs text-gray-400">{d.last_seen ? new Date(d.last_seen).toLocaleTimeString() : 'Never'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
