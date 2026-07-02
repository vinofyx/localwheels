import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const STATUS_COLOR = { draft: 'bg-gray-100 text-gray-700', confirmed: 'bg-blue-100 text-blue-700', processing: 'bg-indigo-100 text-indigo-700', allocated: 'bg-purple-100 text-purple-700', fulfilled: 'bg-green-100 text-green-700', shipped: 'bg-teal-100 text-teal-700', delivered: 'bg-green-200 text-green-800', cancelled: 'bg-red-100 text-red-700', returned: 'bg-orange-100 text-orange-700' };
const NEXT_STATUS = { confirmed: 'processing', processing: 'allocated', allocated: 'fulfilled', fulfilled: 'shipped', shipped: 'delivered' };

export default function SalesOrders() {
  const [orders, setOrders]   = useState([]);
  const [summary, setSummary] = useState(null);
  const [tab, setTab]         = useState('list');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]   = useState('');
  const [form, setForm]       = useState({ customer_name: '', customer_email: '', customer_phone: '', delivery_address: '', delivery_city: '', priority: 'medium', requested_date: '', notes: '', items: [{ sku: '', product_name: '', quantity: 1, unit_price: 0, discount_pct: 0 }] });
  const [saving, setSaving]   = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      const [o, sum] = await Promise.all([
        fetch(`${_BASE}/sales-orders?${params}`, { headers: h() }).then(r => r.json()),
        fetch(`${_BASE}/sales-orders/analytics/summary`, { headers: h() }).then(r => r.json()),
      ]);
      setOrders(o.data?.orders || []);
      setSummary(sum.data || sum);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter, search]);

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { sku: '', product_name: '', quantity: 1, unit_price: 0, discount_pct: 0 }] }));
  const removeItem = (i) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, key, val) => setForm(p => { const items = [...p.items]; items[i] = { ...items[i], [key]: val }; return { ...p, items }; });
  const total = form.items.reduce((s, i) => { const base = Number(i.quantity) * Number(i.unit_price); return s + base - (base * Number(i.discount_pct) / 100); }, 0);

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${_BASE}/sales-orders`, { method: 'POST', headers: h(), body: JSON.stringify(form) });
      setTab('list'); load();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const advance = async (id, currentStatus) => {
    const next = NEXT_STATUS[currentStatus];
    if (!next) return;
    await fetch(`${_BASE}/sales-orders/${id}/status`, { method: 'PUT', headers: h(), body: JSON.stringify({ status: next }) });
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Create and fulfil customer sales orders</p>
        </div>
        <button onClick={() => setTab('create')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">+ New Order</button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[['Total Revenue', `KES ${(summary.total_revenue || 0).toLocaleString()}`], ['Collected', `KES ${(summary.collected || 0).toLocaleString()}`], ['Fulfilled', summary.status_breakdown?.fulfilled || 0], ['Pending', summary.status_breakdown?.confirmed || 0]].map(([l, v]) => (
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders or customer…" className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">All Status</option>
              {['confirmed','processing','allocated','fulfilled','shipped','delivered','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {loading ? <div className="text-center py-12 text-gray-400">Loading…</div> : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{['Order #','Customer','City','Items','Amount','Status','Action'].map(c => <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{c}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map(o => (
                    <tr key={o._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-600">{o.order_number}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{o.customer_name}</td>
                      <td className="px-4 py-3 text-gray-500">{o.delivery_city || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{o.items?.length || 0}</td>
                      <td className="px-4 py-3 font-medium">KES {(o.total_amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[o.status] || 'bg-gray-100 text-gray-700'}`}>{o.status?.replace('_',' ')}</span></td>
                      <td className="px-4 py-3">
                        {NEXT_STATUS[o.status] && (
                          <button onClick={() => advance(o._id, o.status)} className="text-indigo-600 hover:underline text-xs capitalize">→ {NEXT_STATUS[o.status]}</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No orders found</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'create' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">New Sales Order</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[['customer_name','Customer Name *','text'],['customer_email','Email','email'],['customer_phone','Phone','text'],['delivery_address','Delivery Address','text'],['delivery_city','City','text']].map(([k,l,t]) => (
              <div key={k}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                <input type={t} value={form[k]} onChange={e => setForm(p => ({...p,[k]:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm(p => ({...p,priority:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <h4 className="font-medium text-gray-700 mb-3">Order Items</h4>
          <div className="space-y-2 mb-3">
            {form.items.map((item, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 items-center">
                <input placeholder="SKU" value={item.sku} onChange={e => updateItem(i,'sku',e.target.value)} className="border border-gray-200 rounded px-2 py-1.5 text-sm" />
                <input placeholder="Product Name" value={item.product_name} onChange={e => updateItem(i,'product_name',e.target.value)} className="border border-gray-200 rounded px-2 py-1.5 text-sm" />
                <input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i,'quantity',e.target.value)} className="border border-gray-200 rounded px-2 py-1.5 text-sm" min="1" />
                <input type="number" placeholder="Unit Price" value={item.unit_price} onChange={e => updateItem(i,'unit_price',e.target.value)} className="border border-gray-200 rounded px-2 py-1.5 text-sm" min="0" />
                <div className="flex gap-1">
                  <input type="number" placeholder="Disc%" value={item.discount_pct} onChange={e => updateItem(i,'discount_pct',e.target.value)} className="border border-gray-200 rounded px-2 py-1.5 text-sm flex-1" min="0" max="100" />
                  {form.items.length > 1 && <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">✕</button>}
                </div>
              </div>
            ))}
          </div>
          <button onClick={addItem} className="text-indigo-600 text-sm hover:underline mb-4">+ Add Item</button>

          <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>KES {total.toLocaleString()}</span></div>
            <div className="flex justify-between mt-1"><span className="text-gray-500">Tax (16%)</span><span>KES {(total * 0.16).toLocaleString()}</span></div>
            <div className="flex justify-between font-bold mt-2 border-t pt-2"><span>Total</span><span>KES {(total * 1.16).toLocaleString()}</span></div>
          </div>

          <div className="flex gap-3">
            <button onClick={save} disabled={saving || !form.customer_name} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm disabled:opacity-50">
              {saving ? 'Creating…' : 'Create Order'}
            </button>
            <button onClick={() => setTab('list')} className="border border-gray-200 px-5 py-2 rounded-lg text-sm text-gray-600">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
