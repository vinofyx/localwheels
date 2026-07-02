import { useState, useEffect } from 'react';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const STATUS_COLOR = { available: 'bg-green-100 text-green-700', reserved: 'bg-yellow-100 text-yellow-700', blocked: 'bg-red-100 text-red-700', damaged: 'bg-orange-100 text-orange-700', quarantine: 'bg-purple-100 text-purple-700', expired: 'bg-gray-200 text-gray-600' };

export default function InventoryPage() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWH, setSelectedWH] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [selected, setSelected] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNote, setAdjustNote] = useState('');

  useEffect(() => {
    api.get(`${_BASE}/warehouses`).then(r => {
      const whs = r.data?.data?.warehouses || [];
      setWarehouses(whs);
      if (whs.length) setSelectedWH(whs[0]._id);
    }).catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    const q = new URLSearchParams({ page, limit: 30 });
    if (selectedWH) q.set('warehouse_id', selectedWH);
    if (search) q.set('search', search);
    if (status) q.set('status', status);
    api.get(`${_BASE}/inventory?${q}`).then(r => {
      setRecords(r.data.records || []);
      setStats(r.data.stats || {});
      setTotal(r.data.total || 0);
      setPages(r.data.pages || 1);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [selectedWH, search, status, page]);

  const addInventory = async () => {
    setSaving(true); setMsg('');
    try {
      await api.post(`${_BASE}/inventory`, { ...form, warehouse_id: selectedWH });
      setMsg('Stock added'); setShowAdd(false); setForm({}); load();
    } catch (e) { setMsg(e.response?.data?.error || 'Error'); }
    setSaving(false);
  };

  const adjust = async () => {
    if (!selected || !adjustQty) return;
    try {
      await api.put(`${_BASE}/inventory/${selected._id}/adjust`, { qty_change: Number(adjustQty), notes: adjustNote });
      setSelected(null); setAdjustQty(''); setAdjustNote(''); load();
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time stock — batch, lot, serial, expiry tracking</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">+ Add Stock</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[['Total SKUs', stats.total_skus || 0], ['Total Units', (stats.total_qty || 0).toLocaleString()], ['Reserved', stats.reserved || 0], ['Total Value', `KES ${((stats.total_value || 0) / 1000).toFixed(1)}K`]].map(([l, v]) => (
          <div key={l} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-gray-800">{v}</div>
            <div className="text-xs text-gray-400">{l}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={selectedWH} onChange={e => setSelectedWH(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All Warehouses</option>
          {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
        </select>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search SKU / product / batch..." className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-60 focus:outline-none" />
        <select value={status} onChange={e => setStatus(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All Status</option>
          {['available','reserved','blocked','damaged','quarantine','expired'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="bg-white border border-indigo-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Add Stock</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[['sku','SKU *'],['product_name','Product Name *'],['quantity','Quantity *','number'],['uom','Unit of Measure'],['batch_number','Batch #'],['lot_number','Lot #'],['unit_cost','Unit Cost','number'],['supplier_name','Supplier']].map(([k, l, t]) => (
              <div key={k}><label className="text-xs text-gray-500 mb-1 block">{l}</label>
                <input type={t || 'text'} value={form[k] || ''} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            ))}
            <div><label className="text-xs text-gray-500 mb-1 block">Expiry Date</label>
              <input type="date" value={form.expiry_date || ''} onChange={e => setForm(p => ({ ...p, expiry_date: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          {msg && <div className="mt-3 text-sm text-red-600">{msg}</div>}
          <div className="flex gap-3 mt-4">
            <button onClick={addInventory} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg disabled:opacity-50">{saving ? 'Saving...' : 'Add Stock'}</button>
            <button onClick={() => { setShowAdd(false); setForm({}); setMsg(''); }} className="px-4 py-2 border border-gray-300 text-sm rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 space-y-3">
            <h3 className="font-semibold text-gray-800">Adjust Stock — {selected.sku}</h3>
            <p className="text-sm text-gray-500">Current: {selected.quantity} {selected.uom}</p>
            <div><label className="text-xs text-gray-500">Qty Change (+ or -)</label>
              <input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" /></div>
            <div><label className="text-xs text-gray-500">Reason</label>
              <input value={adjustNote} onChange={e => setAdjustNote(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" /></div>
            <div className="flex gap-3 pt-2">
              <button onClick={adjust} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg">Save</button>
              <button onClick={() => setSelected(null)} className="px-4 py-2 border border-gray-300 text-sm rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div className="py-12 text-center text-gray-400">Loading...</div> : (
        <>
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
            <table className="min-w-full text-sm">
              <thead><tr className="bg-gray-50 text-left border-b border-gray-200">{['SKU','Product','Qty','Reserved','Avail','Batch','Expiry','Bin','Status',''].map(h => <th key={h} className="px-4 py-2 text-xs text-gray-500 font-medium">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {records.map(r => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono font-bold text-indigo-700">{r.sku}</td>
                    <td className="px-4 py-2 max-w-36 truncate">{r.product_name}</td>
                    <td className="px-4 py-2 font-semibold">{r.quantity} <span className="text-gray-400 text-xs">{r.uom}</span></td>
                    <td className="px-4 py-2 text-yellow-600">{r.reserved_qty || 0}</td>
                    <td className="px-4 py-2 text-green-600 font-medium">{r.available_qty || 0}</td>
                    <td className="px-4 py-2 text-xs text-gray-400">{r.batch_number || '—'}</td>
                    <td className="px-4 py-2 text-xs">{r.expiry_date ? new Date(r.expiry_date).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-2 text-xs font-mono">{r.bin_id?.bin_code || '—'}</td>
                    <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[r.status] || 'bg-gray-100 text-gray-600'}`}>{r.status}</span></td>
                    <td className="px-4 py-2"><button onClick={() => setSelected(r)} className="text-xs text-indigo-600 hover:underline">Adjust</button></td>
                  </tr>
                ))}
                {records.length === 0 && <tr><td colSpan={10} className="py-8 text-center text-gray-400">No inventory records found.</td></tr>}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex gap-2 justify-center">
              {Array.from({ length: pages }, (_, i) => i + 1).map(p => <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded text-sm ${p === page ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}>{p}</button>)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
