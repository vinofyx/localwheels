import { useState, useEffect } from 'react';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const STATUS_COLOR = { scheduled: 'bg-gray-100 text-gray-600', arrived: 'bg-blue-100 text-blue-700', unloading: 'bg-yellow-100 text-yellow-700', receiving: 'bg-orange-100 text-orange-700', quality_check: 'bg-purple-100 text-purple-700', put_away: 'bg-indigo-100 text-indigo-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-600', rejected: 'bg-red-200 text-red-800' };

export default function InboundCenter() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWH, setSelectedWH] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [statusCounts, setStatusCounts] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ items: [{ sku: '', product_name: '', expected_qty: 1 }] });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    api.get(`${_BASE}/warehouses`).then(r => {
      const whs = r.data?.data?.warehouses || [];
      setWarehouses(whs);
      if (whs.length) setSelectedWH(whs[0]._id);
    }).catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    const q = new URLSearchParams();
    if (selectedWH) q.set('warehouse_id', selectedWH);
    if (statusFilter) q.set('status', statusFilter);
    api.get(`${_BASE}/inbound?${q}`).then(r => {
      setShipments(r.data.shipments || []);
      setStatusCounts(r.data.status_counts || {});
    }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [selectedWH, statusFilter]);

  const createShipment = async () => {
    setSaving(true); setMsg('');
    try {
      await api.post(`${_BASE}/inbound`, { ...form, warehouse_id: selectedWH });
      setMsg('Inbound shipment created'); setShowCreate(false); setForm({ items: [{ sku: '', product_name: '', expected_qty: 1 }] }); load();
    } catch (e) { setMsg(e.response?.data?.error || 'Error'); }
    setSaving(false);
  };

  const updateStatus = async (id, status) => {
    try {
      if (status === 'completed') { await api.put(`${_BASE}/inbound/${id}/complete`, {}); }
      else if (status === 'arrived') { await api.put(`${_BASE}/inbound/${id}/arrive`, {}); }
      else { await api.put(`${_BASE}/inbound/${id}/status`, { status }); }
      load();
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
  };

  const addItem = () => setForm(p => ({ ...p, items: [...(p.items || []), { sku: '', product_name: '', expected_qty: 1 }] }));
  const removeItem = i => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  const setItem = (i, k, v) => setForm(p => { const items = [...(p.items || [])]; items[i] = { ...items[i], [k]: v }; return { ...p, items }; });

  const STATUS_FLOW = { scheduled: ['arrived'], arrived: ['unloading'], unloading: ['receiving'], receiving: ['quality_check','put_away'], quality_check: ['put_away'], put_away: ['completed'] };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Inbound Center</h1><p className="text-sm text-gray-500 mt-0.5">Vehicle arrival, receiving, quality check & put-away</p></div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">+ New Inbound</button>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <select value={selectedWH} onChange={e => setSelectedWH(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
        </select>
        <div className="flex gap-1">
          {['', 'scheduled', 'arrived', 'receiving', 'put_away', 'completed'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}>
              {s || 'All'}{statusCounts[s] ? ` (${statusCounts[s]})` : ''}
            </button>
          ))}
        </div>
      </div>

      {showCreate && (
        <div className="bg-white border border-indigo-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800">Create Inbound Shipment</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[['supplier_name','Supplier Name'],['shipment_ref','Shipment Ref'],['po_number','PO Number'],['vehicle_number','Vehicle No.'],['driver_name','Driver Name']].map(([k, l]) => (
              <div key={k}><label className="text-xs text-gray-500 mb-1 block">{l}</label>
                <input value={form[k] || ''} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            ))}
            <div><label className="text-xs text-gray-500 mb-1 block">Expected Arrival</label>
              <input type="datetime-local" value={form.expected_arrival || ''} onChange={e => setForm(p => ({ ...p, expected_arrival: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-700">Items</span><button onClick={addItem} className="text-xs text-indigo-600 hover:underline">+ Add Item</button></div>
            {(form.items || []).map((item, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 items-center">
                <input placeholder="SKU *" value={item.sku || ''} onChange={e => setItem(i, 'sku', e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <input placeholder="Product Name" value={item.product_name || ''} onChange={e => setItem(i, 'product_name', e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <input type="number" placeholder="Expected Qty" value={item.expected_qty || ''} onChange={e => setItem(i, 'expected_qty', Number(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
              </div>
            ))}
          </div>
          {msg && <div className={`text-sm ${msg.includes('Error') || msg.includes('error') ? 'text-red-600' : 'text-green-600'}`}>{msg}</div>}
          <div className="flex gap-3"><button onClick={createShipment} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg disabled:opacity-50">{saving ? 'Creating...' : 'Create'}</button><button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-300 text-sm rounded-lg">Cancel</button></div>
        </div>
      )}

      {loading ? <div className="py-12 text-center text-gray-400">Loading...</div> : (
        <div className="space-y-3">
          {shipments.map(s => (
            <div key={s._id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-800">{s.inbound_number}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[s.status]}`}>{s.status}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">{s.supplier_name} · {s.vehicle_number} · {s.driver_name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.total_skus} SKUs · Expected: {s.total_expected_qty} units · Received: {s.total_received_qty}</div>
                </div>
                <div className="flex items-center gap-2">
                  {(STATUS_FLOW[s.status] || []).map(next => (
                    <button key={next} onClick={() => updateStatus(s._id, next)} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700">→ {next.replace('_', ' ')}</button>
                  ))}
                  <button onClick={() => setDetail(detail?._id === s._id ? null : s)} className="px-3 py-1.5 border border-gray-300 text-xs rounded-lg">Items</button>
                </div>
              </div>
              {detail?._id === s._id && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <table className="min-w-full text-xs"><thead><tr className="text-gray-400">{['SKU','Product','Expected','Received','Damaged','Quality','Bin'].map(h => <th key={h} className="px-2 py-1 text-left">{h}</th>)}</tr></thead>
                    <tbody>{(s.items || []).map((item, i) => <tr key={i} className="border-t border-gray-50"><td className="px-2 py-1 font-mono">{item.sku}</td><td className="px-2 py-1">{item.product_name}</td><td className="px-2 py-1">{item.expected_qty}</td><td className="px-2 py-1 text-green-600">{item.received_qty || 0}</td><td className="px-2 py-1 text-red-500">{item.damaged_qty || 0}</td><td className="px-2 py-1">{item.quality_status || '—'}</td><td className="px-2 py-1 font-mono">{item.bin_code || '—'}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
          {shipments.length === 0 && <div className="text-center py-12 text-gray-400">No inbound shipments. Create one above.</div>}
        </div>
      )}
    </div>
  );
}
