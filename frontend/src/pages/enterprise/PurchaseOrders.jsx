import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const STATUS_COLOR = { draft: 'bg-gray-100 text-gray-700', submitted: 'bg-blue-100 text-blue-700', approved: 'bg-indigo-100 text-indigo-700', partially_received: 'bg-yellow-100 text-yellow-700', received: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700', closed: 'bg-gray-200 text-gray-600' };

export default function PurchaseOrders() {
  const [orders, setOrders]     = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [summary, setSummary]   = useState(null);
  const [tab, setTab]           = useState('list');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm]         = useState({ supplier_id: '', priority: 'medium', expected_date: '', payment_terms: '', notes: '', items: [{ sku: '', description: '', quantity: 1, unit_price: 0, unit: 'pcs' }] });
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (statusFilter) params.set('status', statusFilter);
      const [o, s, sum] = await Promise.all([
        fetch(`${_BASE}/purchase-orders?${params}`, { headers: h() }).then(r => r.json()),
        fetch(`${_BASE}/suppliers?status=active&limit=100`, { headers: h() }).then(r => r.json()),
        fetch(`${_BASE}/purchase-orders/analytics/summary`, { headers: h() }).then(r => r.json()),
      ]);
      setOrders(o.data?.orders || []);
      setSuppliers(s.data?.suppliers || []);
      setSummary(sum.data || sum);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { sku: '', description: '', quantity: 1, unit_price: 0, unit: 'pcs' }] }));
  const removeItem = (i) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, key, val) => setForm(p => { const items = [...p.items]; items[i] = { ...items[i], [key]: val }; return { ...p, items }; });
  const total = form.items.reduce((s, i) => s + (Number(i.quantity) * Number(i.unit_price)), 0);

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${_BASE}/purchase-orders`, { method: 'POST', headers: h(), body: JSON.stringify(form) });
      setTab('list');
      load();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const approve = async (id) => {
    await fetch(`${_BASE}/purchase-orders/${id}/approve`, { method: 'PUT', headers: h() });
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage supplier purchase orders</p>
        </div>
        <button onClick={() => setTab('create')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">+ Create PO</button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[['Total Spend', `KES ${(summary.total_spend || 0).toLocaleString()}`], ['Paid', `KES ${(summary.paid || 0).toLocaleString()}`], ['Approved', summary.status_breakdown?.approved || 0], ['Pending', summary.status_breakdown?.submitted || 0]].map(([l, v]) => (
            <div key={l} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 uppercase">{l}</p>
              <p className="text-xl font-bold mt-1">{v ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200">
        {['list','create'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t}</button>
        ))}
      </div>

      {tab === 'list' && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">All Status</option>
              {['draft','submitted','approved','partially_received','received','cancelled'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
            </select>
          </div>
          {loading ? <div className="text-center py-12 text-gray-400">Loading…</div> : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{['PO Number','Supplier','Expected','Amount','Payment','Status','Actions'].map(c => <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{c}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map(o => (
                    <tr key={o._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-600">{o.po_number}</td>
                      <td className="px-4 py-3 text-gray-700">{o.supplier_id?.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{o.expected_date ? new Date(o.expected_date).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3 font-medium">KES {(o.total_amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${o.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{o.payment_status}</span></td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[o.status] || 'bg-gray-100 text-gray-700'}`}>{o.status?.replace('_',' ')}</span></td>
                      <td className="px-4 py-3">
                        {(o.status === 'draft' || o.status === 'submitted') && (
                          <button onClick={() => approve(o._id)} className="text-green-600 hover:underline text-xs">Approve</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No purchase orders found</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'create' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Create Purchase Order</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Supplier *</label>
              <select value={form.supplier_id} onChange={e => setForm(p => ({...p, supplier_id: e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="">Select supplier…</option>
                {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm(p => ({...p, priority: e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Expected Delivery</label>
              <input type="date" value={form.expected_date} onChange={e => setForm(p => ({...p, expected_date: e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <h4 className="font-medium text-gray-700 mb-3">Line Items</h4>
          <div className="space-y-2 mb-3">
            {form.items.map((item, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 items-center">
                <input placeholder="SKU" value={item.sku} onChange={e => updateItem(i, 'sku', e.target.value)} className="border border-gray-200 rounded px-2 py-1.5 text-sm" />
                <input placeholder="Description" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} className="border border-gray-200 rounded px-2 py-1.5 text-sm col-span-2" />
                <input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} className="border border-gray-200 rounded px-2 py-1.5 text-sm" min="1" />
                <div className="flex gap-1">
                  <input type="number" placeholder="Unit Price" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', e.target.value)} className="border border-gray-200 rounded px-2 py-1.5 text-sm flex-1" min="0" />
                  {form.items.length > 1 && <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 px-1">✕</button>}
                </div>
              </div>
            ))}
          </div>
          <button onClick={addItem} className="text-indigo-600 text-sm hover:underline mb-4">+ Add Line Item</button>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>KES {total.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm mt-1"><span className="text-gray-500">Tax (16%)</span><span>KES {(total * 0.16).toLocaleString()}</span></div>
            <div className="flex justify-between font-bold mt-2 border-t pt-2"><span>Total</span><span>KES {(total * 1.16).toLocaleString()}</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Payment Terms</label>
              <input value={form.payment_terms} onChange={e => setForm(p => ({...p, payment_terms: e.target.value}))} placeholder="e.g. Net 30" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <input value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={save} disabled={saving || !form.supplier_id} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm disabled:opacity-50">
              {saving ? 'Creating…' : 'Create PO'}
            </button>
            <button onClick={() => setTab('list')} className="border border-gray-200 px-5 py-2 rounded-lg text-sm text-gray-600">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
