import { useState, useEffect } from 'react';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const STATUS_COLOR = { pending: 'bg-gray-100 text-gray-600', allocated: 'bg-blue-100 text-blue-700', pick_list_generated: 'bg-indigo-100 text-indigo-700', picking: 'bg-yellow-100 text-yellow-700', packing: 'bg-orange-100 text-orange-700', ready_to_dispatch: 'bg-purple-100 text-purple-700', loaded: 'bg-cyan-100 text-cyan-700', dispatched: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-600' };

export default function OutboundCenter() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWH, setSelectedWH] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [statusCounts, setStatusCounts] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ items: [{ sku: '', product_name: '', ordered_qty: 1 }] });
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
    api.get(`${_BASE}/outbound?${q}`).then(r => {
      setShipments(r.data.shipments || []);
      setStatusCounts(r.data.status_counts || {});
    }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [selectedWH, statusFilter]);

  const createShipment = async () => {
    setSaving(true); setMsg('');
    try {
      await api.post(`${_BASE}/outbound`, { ...form, warehouse_id: selectedWH });
      setMsg('Outbound order created'); setShowCreate(false); setForm({ items: [{ sku: '', product_name: '', ordered_qty: 1 }] }); load();
    } catch (e) { setMsg(e.response?.data?.error || 'Error'); }
    setSaving(false);
  };

  const action = async (id, action) => {
    try {
      if (action === 'allocate') await api.put(`${_BASE}/outbound/${id}/allocate`, {});
      else if (action === 'picklist') await api.put(`${_BASE}/outbound/${id}/generate-picklist`, {});
      else if (action === 'dispatch') await api.put(`${_BASE}/outbound/${id}/dispatch`, {});
      load();
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
  };

  const addItem = () => setForm(p => ({ ...p, items: [...(p.items || []), { sku: '', product_name: '', ordered_qty: 1 }] }));
  const setItem = (i, k, v) => setForm(p => { const items = [...(p.items || [])]; items[i] = { ...items[i], [k]: v }; return { ...p, items }; });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Outbound Center</h1><p className="text-sm text-gray-500 mt-0.5">Order allocation, wave planning, pick, pack & dispatch</p></div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">+ New Outbound Order</button>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <select value={selectedWH} onChange={e => setSelectedWH(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
        </select>
        <div className="flex gap-1 flex-wrap">
          {['','pending','allocated','picking','packing','dispatched'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}>
              {s || 'All'}{statusCounts[s] ? ` (${statusCounts[s]})` : ''}
            </button>
          ))}
        </div>
      </div>

      {showCreate && (
        <div className="bg-white border border-indigo-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold">Create Outbound Order</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[['customer_name','Customer Name'],['order_ref','Order Ref'],['delivery_address','Delivery Address']].map(([k, l]) => (
              <div key={k}><label className="text-xs text-gray-500 mb-1 block">{l}</label>
                <input value={form[k] || ''} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            ))}
            <div><label className="text-xs text-gray-500 mb-1 block">Planned Dispatch</label>
              <input type="datetime-local" value={form.planned_dispatch_at || ''} onChange={e => setForm(p => ({ ...p, planned_dispatch_at: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-700">Items</span><button onClick={addItem} className="text-xs text-indigo-600 hover:underline">+ Add Item</button></div>
            {(form.items || []).map((item, i) => (
              <div key={i} className="grid grid-cols-3 gap-2">
                <input placeholder="SKU *" value={item.sku || ''} onChange={e => setItem(i, 'sku', e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <input placeholder="Product Name" value={item.product_name || ''} onChange={e => setItem(i, 'product_name', e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <input type="number" placeholder="Qty" value={item.ordered_qty || ''} onChange={e => setItem(i, 'ordered_qty', Number(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            ))}
          </div>
          {msg && <div className="text-sm text-red-600">{msg}</div>}
          <div className="flex gap-3"><button onClick={createShipment} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg disabled:opacity-50">{saving ? '...' : 'Create Order'}</button><button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-300 text-sm rounded-lg">Cancel</button></div>
        </div>
      )}

      {loading ? <div className="py-12 text-center text-gray-400">Loading...</div> : (
        <div className="space-y-3">
          {shipments.map(s => (
            <div key={s._id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-800">{s.outbound_number}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[s.status]}`}>{s.status?.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">{s.customer_name} · Ref: {s.order_ref}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.total_skus} SKUs · Ordered: {s.total_ordered_qty} · Picked: {s.total_picked_qty || 0}</div>
                </div>
                <div className="flex gap-2">
                  {s.status === 'pending' && <button onClick={() => action(s._id, 'allocate')} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg">Allocate</button>}
                  {s.status === 'allocated' && <button onClick={() => action(s._id, 'picklist')} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg">Generate Pick List</button>}
                  {['packing','ready_to_dispatch'].includes(s.status) && <button onClick={() => action(s._id, 'dispatch')} className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg">Dispatch</button>}
                  <button onClick={() => setDetail(detail?._id === s._id ? null : s)} className="px-3 py-1.5 border border-gray-300 text-xs rounded-lg">Items</button>
                </div>
              </div>
              {detail?._id === s._id && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <table className="min-w-full text-xs"><thead><tr className="text-gray-400">{['SKU','Product','Ordered','Allocated','Picked','Bin'].map(h => <th key={h} className="px-2 py-1 text-left">{h}</th>)}</tr></thead>
                    <tbody>{(s.items || []).map((item, i) => <tr key={i} className="border-t border-gray-50"><td className="px-2 py-1 font-mono">{item.sku}</td><td className="px-2 py-1">{item.product_name}</td><td className="px-2 py-1">{item.ordered_qty}</td><td className="px-2 py-1 text-blue-600">{item.allocated_qty || 0}</td><td className="px-2 py-1 text-green-600">{item.picked_qty || 0}</td><td className="px-2 py-1 font-mono">{item.bin_code || '—'}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
          {shipments.length === 0 && <div className="text-center py-12 text-gray-400">No outbound orders.</div>}
        </div>
      )}
    </div>
  );
}
