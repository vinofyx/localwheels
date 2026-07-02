import { useState, useEffect } from 'react';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const STATUS_COLOR = { available: 'bg-green-100 text-green-700 border-green-200', occupied: 'bg-blue-100 text-blue-700 border-blue-200', maintenance: 'bg-orange-100 text-orange-700 border-orange-200', closed: 'bg-gray-100 text-gray-600 border-gray-200' };
const STATUS_DOT = { available: 'bg-green-500', occupied: 'bg-blue-500', maintenance: 'bg-orange-500', closed: 'bg-gray-400' };

export default function DockManagement() {
  const [docks, setDocks] = useState([]);
  const [timeline, setTimeline] = useState({ inbound_schedule: [], outbound_schedule: [], docks: [] });
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWH, setSelectedWH] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState('docks');

  useEffect(() => {
    api.get(`${_BASE}/warehouses`).then(r => {
      const whs = r.data?.data?.warehouses || [];
      setWarehouses(whs);
      if (whs.length) setSelectedWH(whs[0]._id);
    }).catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    const q = selectedWH ? `?warehouse_id=${selectedWH}` : '';
    Promise.all([
      api.get(`${_BASE}/docks${q}`).then(r => setDocks(r.data.docks || [])),
      api.get(`${_BASE}/docks/timeline/today${q}`).then(r => setTimeline(r.data)),
    ]).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [selectedWH]);

  const createDock = async () => {
    setSaving(true); setMsg('');
    try {
      await api.post(`${_BASE}/docks`, { ...form, warehouse_id: selectedWH });
      setMsg('Dock created'); setShowCreate(false); setForm({}); load();
    } catch (e) { setMsg(e.response?.data?.error || 'Error'); }
    setSaving(false);
  };

  const release = async (id) => {
    try { await api.put(`${_BASE}/docks/${id}/release`); load(); } catch (e) { alert(e.response?.data?.error || 'Error'); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Dock Management</h1><p className="text-sm text-gray-500 mt-0.5">Inbound & outbound dock scheduling and real-time status</p></div>
        <div className="flex gap-2">
          <select value={selectedWH} onChange={e => setSelectedWH(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">+ Add Dock</button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[['Total Docks', docks.length], ['Available', docks.filter(d => d.status === 'available').length], ['Occupied', docks.filter(d => d.status === 'occupied').length], ['Today\'s Inbound', timeline.inbound_schedule?.length || 0]].map(([l, v]) => (
          <div key={l} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-gray-800">{v}</div><div className="text-xs text-gray-400">{l}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {['docks','timeline'].map(t => <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500'}`}>{t}</button>)}
      </div>

      {showCreate && (
        <div className="bg-white border border-indigo-200 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold">Add Dock</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><label className="text-xs text-gray-500 mb-1 block">Dock Number *</label><input value={form.dock_number || ''} onChange={e => setForm(p => ({ ...p, dock_number: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Dock Name</label><input value={form.dock_name || ''} onChange={e => setForm(p => ({ ...p, dock_name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Type</label>
              <select value={form.dock_type || 'flexible'} onChange={e => setForm(p => ({ ...p, dock_type: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {['inbound','outbound','cross_dock','flexible'].map(t => <option key={t} value={t}>{t}</option>)}
              </select></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Size</label>
              <select value={form.dock_size || 'medium'} onChange={e => setForm(p => ({ ...p, dock_size: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {['small','medium','large','extra_large'].map(s => <option key={s} value={s}>{s}</option>)}
              </select></div>
          </div>
          {msg && <div className="text-sm text-red-600">{msg}</div>}
          <div className="flex gap-3"><button onClick={createDock} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg disabled:opacity-50">{saving ? '...' : 'Create'}</button><button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-300 text-sm rounded-lg">Cancel</button></div>
        </div>
      )}

      {loading ? <div className="py-12 text-center text-gray-400">Loading...</div> : tab === 'docks' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {docks.map(d => (
            <div key={d._id} className={`border rounded-xl p-5 ${STATUS_COLOR[d.status]}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[d.status]}`} />
                    <span className="font-bold text-gray-800">{d.dock_number}</span>
                    <span className="text-xs text-gray-500">{d.dock_type}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{d.dock_name} · {d.dock_size}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[d.status]}`}>{d.status}</span>
              </div>
              {d.status === 'occupied' && (
                <div className="bg-white/60 rounded-lg p-2 text-xs mb-3">
                  <div>Vehicle: <strong>{d.current_vehicle_number || '—'}</strong></div>
                  {d.occupied_since && <div className="text-gray-400">Since: {new Date(d.occupied_since).toLocaleTimeString()}</div>}
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Avg: {d.avg_turnaround_min?.toFixed(0) || '—'} min</span>
                <span>Today: {d.total_vehicles_today} vehicles</span>
              </div>
              {d.status === 'occupied' && <button onClick={() => release(d._id)} className="mt-3 w-full py-1.5 border border-current rounded-lg text-xs font-medium hover:bg-white/50">Release Dock</button>}
            </div>
          ))}
          {docks.length === 0 && <div className="col-span-3 text-center py-12 text-gray-400">No docks configured. Add docks above.</div>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">📥 Today's Inbound ({timeline.inbound_schedule?.length || 0})</h3>
            <div className="space-y-2">
              {(timeline.inbound_schedule || []).map(s => (
                <div key={s._id} className="bg-white border border-gray-200 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div><div className="font-medium text-gray-800 text-sm">{s.inbound_number}</div><div className="text-xs text-gray-400">{s.supplier_name} · {s.vehicle_number}</div></div>
                    <div className="text-xs text-gray-500">{s.expected_arrival ? new Date(s.expected_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                  </div>
                </div>
              ))}
              {!timeline.inbound_schedule?.length && <div className="text-xs text-gray-400 p-4 text-center">No inbound scheduled today</div>}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">📤 Today's Outbound ({timeline.outbound_schedule?.length || 0})</h3>
            <div className="space-y-2">
              {(timeline.outbound_schedule || []).map(s => (
                <div key={s._id} className="bg-white border border-gray-200 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div><div className="font-medium text-gray-800 text-sm">{s.outbound_number}</div><div className="text-xs text-gray-400">{s.customer_name}</div></div>
                    <div className="text-xs text-gray-500">{s.planned_dispatch_at ? new Date(s.planned_dispatch_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                  </div>
                </div>
              ))}
              {!timeline.outbound_schedule?.length && <div className="text-xs text-gray-400 p-4 text-center">No outbound scheduled today</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
