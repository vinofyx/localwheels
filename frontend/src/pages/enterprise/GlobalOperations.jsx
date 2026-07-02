import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });

export default function GlobalOperations() {
  const [vehicles, setVehicles]   = useState([]);
  const [drivers, setDrivers]     = useState([]);
  const [shipments, setShipments] = useState([]);
  const [capacity, setCapacity]   = useState(null);
  const [kpiWall, setKpiWall]     = useState(null);
  const [tab, setTab]             = useState('kpi');
  const [loading, setLoading]     = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [k, v, d, s, c] = await Promise.all([
        fetch(`${_BASE}/live-operations/kpi-wall`, { headers: h() }).then(r => r.json()),
        fetch(`${_BASE}/live-operations/vehicles`, { headers: h() }).then(r => r.json()),
        fetch(`${_BASE}/live-operations/drivers`, { headers: h() }).then(r => r.json()),
        fetch(`${_BASE}/live-operations/shipments`, { headers: h() }).then(r => r.json()),
        fetch(`${_BASE}/live-operations/warehouse-capacity`, { headers: h() }).then(r => r.json()),
      ]);
      setKpiWall(k.data || k);
      setVehicles(v.data?.vehicles || []);
      setDrivers(d.data?.drivers || []);
      setShipments(s.data?.shipments || []);
      setCapacity(c.data || c);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const STATUS_BADGE = { active: 'bg-green-100 text-green-700', idle: 'bg-gray-100 text-gray-600', maintenance: 'bg-yellow-100 text-yellow-700', breakdown: 'bg-red-100 text-red-700' };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Global Operations</h1>
          <p className="text-sm text-gray-500 mt-1">Live operational visibility across fleet, drivers and shipments</p>
        </div>
        <button onClick={load} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">Refresh</button>
      </div>

      {kpiWall && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[['Delivered Today', kpiWall.delivered_today, 'text-green-600'], ['In Transit', kpiWall.in_transit, 'text-blue-600'], ['Delayed', kpiWall.delayed, kpiWall.delayed > 0 ? 'text-red-600' : 'text-gray-900'], ['Active Vehicles', kpiWall.active_vehicles], ['Active Drivers', kpiWall.active_drivers], ['Open Alerts', kpiWall.open_alerts, kpiWall.open_alerts > 0 ? 'text-orange-600' : 'text-gray-900'], ['Active Risks', kpiWall.active_risks, kpiWall.active_risks > 3 ? 'text-red-600' : 'text-gray-900']].map(([l, v, c]) => (
            <div key={l} className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm text-center">
              <p className="text-xs text-gray-500">{l}</p>
              <p className={`text-xl font-bold mt-0.5 ${c || 'text-gray-900'}`}>{v ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200">
        {['kpi','vehicles','drivers','shipments','capacity'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t}</button>
        ))}
      </div>

      {loading && <div className="text-center py-12 text-gray-400">Loading live data…</div>}

      {!loading && tab === 'kpi' && kpiWall && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Delivery Performance</h3>
            {[['Delivered Today', kpiWall.delivered_today], ['Currently In Transit', kpiWall.in_transit], ['Delayed Shipments', kpiWall.delayed]].map(([l,v]) => (
              <div key={l} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{l}</span>
                <span className="text-sm font-bold text-gray-900">{v ?? 0}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Resource Status</h3>
            {[['Active Vehicles', kpiWall.active_vehicles], ['Active Drivers', kpiWall.active_drivers], ['Open Alerts', kpiWall.open_alerts], ['Active Risks', kpiWall.active_risks]].map(([l,v]) => (
              <div key={l} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{l}</span>
                <span className="text-sm font-bold text-gray-900">{v ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && tab === 'vehicles' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Vehicle','Make/Model','Status','Fuel Level'].map(c => <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{c}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {vehicles.map(v => (
                <tr key={v._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm font-semibold text-gray-900">{v.registration_number}</td>
                  <td className="px-4 py-3 text-gray-600">{[v.make, v.model].filter(Boolean).join(' ') || '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[v.status] || 'bg-gray-100 text-gray-600'}`}>{v.status}</span></td>
                  <td className="px-4 py-3">
                    {v.fuel_level != null ? (
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${v.fuel_level < 25 ? 'bg-red-500' : v.fuel_level < 50 ? 'bg-yellow-400' : 'bg-green-500'}`} style={{width:`${v.fuel_level}%`}}/></div>
                        <span className="text-xs text-gray-500">{v.fuel_level}%</span>
                      </div>
                    ) : '—'}
                  </td>
                </tr>
              ))}
              {vehicles.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-gray-400">No vehicles found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === 'drivers' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Driver','Phone','Status'].map(c => <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{c}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {drivers.map(d => (
                <tr key={d._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                  <td className="px-4 py-3 text-gray-500">{d.phone || '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{d.status}</span></td>
                </tr>
              ))}
              {drivers.length === 0 && <tr><td colSpan={3} className="text-center py-10 text-gray-400">No drivers found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === 'shipments' && (
        <div className="space-y-2">
          {shipments.map(s => (
            <div key={s._id} className="bg-white rounded-lg border border-gray-100 p-4 flex justify-between items-center shadow-sm">
              <div>
                <p className="font-mono text-sm font-semibold text-indigo-600">{s.lr_number}</p>
                <p className="text-sm text-gray-600">{s.consignee_name} → {s.destination_city}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.status === 'delayed' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{s.status?.replace('_',' ')}</span>
            </div>
          ))}
          {shipments.length === 0 && <div className="text-center py-10 text-gray-400">No active shipments</div>}
        </div>
      )}

      {!loading && tab === 'capacity' && capacity && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Warehouse Bins</h3>
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Occupancy</span>
                <span className="font-bold">{capacity.utilization_pct}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${capacity.utilization_pct > 80 ? 'bg-red-500' : capacity.utilization_pct > 60 ? 'bg-yellow-400' : 'bg-green-500'}`} style={{width:`${capacity.utilization_pct}%`}} />
              </div>
            </div>
            {[['Total Bins', capacity.total_bins], ['Occupied', capacity.occupied_bins], ['Empty', capacity.empty_bins]].map(([l,v]) => (
              <div key={l} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{l}</span>
                <span className="text-sm font-bold text-gray-900">{v ?? 0}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Dock Status</h3>
            {[['Total Docks', capacity.total_docks], ['Available', capacity.available_docks], ['Occupied', capacity.occupied_docks]].map(([l,v]) => (
              <div key={l} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{l}</span>
                <span className="text-sm font-bold text-gray-900">{v ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
