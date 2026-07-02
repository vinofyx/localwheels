import { useState, useEffect } from 'react';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const TABS = ['Warehouses', 'Zones', 'Racks', 'Bins', 'Workers'];

export default function WarehouseMaster() {
  const [tab, setTab] = useState('Warehouses');
  const [warehouses, setWarehouses] = useState([]);
  const [zones, setZones] = useState([]);
  const [racks, setRacks] = useState([]);
  const [bins, setBins] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedWH, setSelectedWH] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedRack, setSelectedRack] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const loadWarehouses = () => {
    api.get(`${_BASE}/warehouses`).then(r => {
      const whs = r.data?.data?.warehouses || r.data?.warehouses || [];
      setWarehouses(whs);
      if (whs.length && !selectedWH) setSelectedWH(whs[0]._id);
    }).catch(() => {});
  };

  useEffect(() => { loadWarehouses(); }, []);

  useEffect(() => {
    if (!selectedWH) return;
    if (tab === 'Zones') api.get(`${_BASE}/warehouses/${selectedWH}/zones`).then(r => setZones(r.data?.data?.zones || [])).catch(() => {});
    if (tab === 'Racks') api.get(`${_BASE}/warehouses/${selectedWH}/racks`).then(r => setRacks(r.data?.data?.racks || [])).catch(() => {});
    if (tab === 'Bins') {
      const q = selectedRack ? `?rack_id=${selectedRack}` : selectedZone ? `?zone_id=${selectedZone}` : '';
      api.get(`${_BASE}/warehouses/${selectedWH}/bins${q}`).then(r => setBins(r.data?.data?.bins || [])).catch(() => {});
    }
    if (tab === 'Workers') api.get(`${_BASE}/warehouses/${selectedWH}/workers`).then(r => setWorkers(r.data?.data?.workers || [])).catch(() => {});
  }, [tab, selectedWH, selectedZone, selectedRack]);

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      if (tab === 'Warehouses') {
        await api.post(`${_BASE}/warehouses`, form);
        setMsg('Warehouse created'); loadWarehouses();
      } else if (tab === 'Zones') {
        await api.post(`${_BASE}/warehouses/${selectedWH}/zones`, form);
        setMsg('Zone created');
        api.get(`${_BASE}/warehouses/${selectedWH}/zones`).then(r => setZones(r.data?.data?.zones || []));
      } else if (tab === 'Racks') {
        await api.post(`${_BASE}/warehouses/${selectedWH}/racks`, { ...form, zone_id: selectedZone });
        setMsg('Rack created');
        api.get(`${_BASE}/warehouses/${selectedWH}/racks`).then(r => setRacks(r.data?.data?.racks || []));
      } else if (tab === 'Bins') {
        await api.post(`${_BASE}/warehouses/${selectedWH}/bins/bulk`, { ...form, zone_id: selectedZone, rack_id: selectedRack, rack_code: form.rack_code });
        setMsg('Bins created');
        api.get(`${_BASE}/warehouses/${selectedWH}/bins`).then(r => setBins(r.data?.data?.bins || []));
      } else if (tab === 'Workers') {
        await api.post(`${_BASE}/warehouses/${selectedWH}/workers`, form);
        setMsg('Worker added');
        api.get(`${_BASE}/warehouses/${selectedWH}/workers`).then(r => setWorkers(r.data?.data?.workers || []));
      }
      setShowForm(false); setForm({});
    } catch (e) { setMsg(e.response?.data?.error || e.response?.data?.message || 'Error'); }
    setSaving(false);
  };

  const Field = ({ k, label, type = 'text', options }) => (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      {options ? (
        <select value={form[k] || ''} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value="">Select...</option>
          {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
        </select>
      ) : (
        <input type={type} value={form[k] || ''} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none" />
      )}
    </div>
  );

  const tabForms = {
    Warehouses: [
      <Field key="name" k="name" label="Warehouse Name *" />,
      <Field key="address" k="address" label="Address" />,
      <Field key="city" k="city" label="City" />,
      <Field key="state" k="state" label="State/County" />,
      <Field key="capacity_sqft" k="capacity_sqft" label="Capacity (sqft)" type="number" />,
      <Field key="manager_name" k="manager_name" label="Manager Name" />,
      <Field key="manager_phone" k="manager_phone" label="Manager Phone" />,
    ],
    Zones: [
      <Field key="zone_code" k="zone_code" label="Zone Code *" />,
      <Field key="zone_name" k="zone_name" label="Zone Name *" />,
      <Field key="zone_type" k="zone_type" label="Zone Type" options={['dry','cold','frozen','hazmat','returns','staging','dispatch','bulk','high_value']} />,
      <Field key="area_sqm" k="area_sqm" label="Area (sqm)" type="number" />,
    ],
    Racks: [
      <Field key="rack_code" k="rack_code" label="Rack Code *" />,
      <Field key="rack_name" k="rack_name" label="Rack Name" />,
      <Field key="rack_type" k="rack_type" label="Rack Type" options={['selective','drive_in','push_back','cantilever','mobile']} />,
      <Field key="total_shelves" k="total_shelves" label="Shelves" type="number" />,
      <Field key="max_weight_kg" k="max_weight_kg" label="Max Weight (kg)" type="number" />,
    ],
    Bins: [
      <Field key="rack_code" k="rack_code" label="Rack Code (prefix) *" />,
      <Field key="shelves" k="shelves" label="Number of Shelves" type="number" />,
      <Field key="bins_per_shelf" k="bins_per_shelf" label="Bins Per Shelf" type="number" />,
      <Field key="max_weight_kg" k="max_weight_kg" label="Max Weight per Bin (kg)" type="number" />,
    ],
    Workers: [
      <Field key="name" k="name" label="Worker Name *" />,
      <Field key="employee_id" k="employee_id" label="Employee ID" />,
      <Field key="role" k="role" label="Role *" options={['supervisor','receiver','put_away','picker','packer','forklift_operator','cycle_counter','quality_checker']} />,
      <Field key="shift" k="shift" label="Shift" options={['morning','afternoon','night','flexible']} />,
      <Field key="phone" k="phone" label="Phone" />,
    ],
  };

  const STATUS_COLOR = { empty: 'bg-green-100 text-green-700', occupied: 'bg-blue-100 text-blue-700', reserved: 'bg-yellow-100 text-yellow-700', blocked: 'bg-red-100 text-red-700', damaged: 'bg-orange-100 text-orange-700' };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouse Setup</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage warehouse structure — zones, racks, bins & workers</p>
        </div>
        <button onClick={() => { setShowForm(true); setForm({}); setMsg(''); }} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">+ Add {tab.slice(0, -1)}</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(t => <button key={t} onClick={() => { setTab(t); setShowForm(false); }} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{t}</button>)}
      </div>

      {/* Context selectors */}
      {tab !== 'Warehouses' && (
        <div className="flex gap-3 flex-wrap">
          <select value={selectedWH} onChange={e => setSelectedWH(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Select Warehouse</option>
            {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
          {(tab === 'Racks' || tab === 'Bins' || tab === 'Workers') && zones.length > 0 && (
            <select value={selectedZone} onChange={e => setSelectedZone(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">All Zones</option>
              {zones.map(z => <option key={z._id} value={z._id}>{z.zone_code} — {z.zone_name}</option>)}
            </select>
          )}
          {tab === 'Bins' && racks.length > 0 && (
            <select value={selectedRack} onChange={e => setSelectedRack(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">All Racks</option>
              {racks.map(r => <option key={r._id} value={r._id}>{r.rack_code}</option>)}
            </select>
          )}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="bg-white border border-indigo-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Add {tab.slice(0, -1)}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {tabForms[tab]}
          </div>
          {msg && <div className={`mt-3 text-sm ${msg.includes('rror') || msg.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>{msg}</div>}
          <div className="flex gap-3 mt-4">
            <button onClick={save} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            <button onClick={() => { setShowForm(false); setMsg(''); }} className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Content */}
      {tab === 'Warehouses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {warehouses.map(w => (
            <div key={w._id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{w.name}</h3>
                  <p className="text-xs text-gray-400">{w.city}, {w.state}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${w.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{w.is_active ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                <div><span className="text-gray-400">Capacity: </span><span className="font-medium">{w.capacity_sqft?.toLocaleString() || '—'} sqft</span></div>
                <div><span className="text-gray-400">Occupancy: </span><span className="font-medium">{w.current_occupancy_percent || 0}%</span></div>
                <div><span className="text-gray-400">Manager: </span><span className="font-medium">{w.manager_name || '—'}</span></div>
                <div><span className="text-gray-400">Phone: </span><span className="font-medium">{w.manager_phone || '—'}</span></div>
              </div>
            </div>
          ))}
          {warehouses.length === 0 && <div className="col-span-2 text-center py-12 text-gray-400">No warehouses. Create one above.</div>}
        </div>
      )}

      {tab === 'Zones' && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="bg-gray-50 text-left">{['Code','Name','Type','Bins','Utilization'].map(h => <th key={h} className="px-4 py-2 text-xs text-gray-500 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {zones.map(z => (
                <tr key={z._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono font-bold text-indigo-700">{z.zone_code}</td>
                  <td className="px-4 py-2">{z.zone_name}</td>
                  <td className="px-4 py-2"><span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{z.zone_type}</span></td>
                  <td className="px-4 py-2">{z.total_bins}</td>
                  <td className="px-4 py-2"><div className="flex items-center gap-2"><div className="bg-gray-100 rounded-full h-1.5 w-16"><div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${z.utilization_pct}%` }} /></div><span>{z.utilization_pct}%</span></div></td>
                </tr>
              ))}
              {zones.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No zones. Select a warehouse and add zones.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Racks' && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="bg-gray-50 text-left">{['Code','Zone','Type','Shelves','Bins','Max Weight'].map(h => <th key={h} className="px-4 py-2 text-xs text-gray-500 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {racks.map(r => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono font-bold text-indigo-700">{r.rack_code}</td>
                  <td className="px-4 py-2 text-xs">{r.zone_id?.zone_code}</td>
                  <td className="px-4 py-2">{r.rack_type}</td>
                  <td className="px-4 py-2">{r.total_shelves}</td>
                  <td className="px-4 py-2">{r.total_bins}</td>
                  <td className="px-4 py-2">{r.max_weight_kg} kg</td>
                </tr>
              ))}
              {racks.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No racks found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Bins' && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="bg-gray-50 text-left">{['Bin Code','Zone','Rack','Status','SKU','Qty','Weight'].map(h => <th key={h} className="px-4 py-2 text-xs text-gray-500 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {bins.map(b => (
                <tr key={b._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono font-bold text-indigo-700">{b.bin_code}</td>
                  <td className="px-4 py-2 text-xs">{b.zone_id?.zone_code}</td>
                  <td className="px-4 py-2 text-xs">{b.rack_id?.rack_code}</td>
                  <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[b.status] || 'bg-gray-100 text-gray-600'}`}>{b.status}</span></td>
                  <td className="px-4 py-2 text-xs font-mono">{b.sku || '—'}</td>
                  <td className="px-4 py-2">{b.quantity || 0}</td>
                  <td className="px-4 py-2 text-xs">{b.current_weight_kg || 0} kg</td>
                </tr>
              ))}
              {bins.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No bins found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Workers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workers.map(w => (
            <div key={w._id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold text-gray-800">{w.name}</div>
                  <div className="text-xs text-gray-400">{w.employee_id} · {w.role}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${w.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{w.shift}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 bg-gray-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${w.productivity_score}%` }} /></div>
                <span className="text-xs font-bold text-gray-700">{w.productivity_score}%</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">Tasks today: {w.tasks_completed_today}</div>
            </div>
          ))}
          {workers.length === 0 && <div className="col-span-3 text-center py-12 text-gray-400">No workers. Add workers above.</div>}
        </div>
      )}
    </div>
  );
}
