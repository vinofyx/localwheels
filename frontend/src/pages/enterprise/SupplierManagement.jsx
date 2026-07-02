import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const STATUS_COLOR = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-blue-100 text-blue-700', active: 'bg-green-100 text-green-700', suspended: 'bg-orange-100 text-orange-700', blacklisted: 'bg-red-100 text-red-700' };
const GRADE_COLOR  = { A: 'text-green-600', B: 'text-blue-600', C: 'text-yellow-600', D: 'text-orange-600', F: 'text-red-600' };

const BLANK = { name: '', category: 'other', contact_person: '', email: '', phone: '', address: '', city: '', state: '', payment_terms: 'net_30' };

export default function SupplierManagement() {
  const [suppliers, setSuppliers]   = useState([]);
  const [summary, setSummary]       = useState(null);
  const [tab, setTab]               = useState('list');
  const [form, setForm]             = useState(BLANK);
  const [saving, setSaving]         = useState(false);
  const [selected, setSelected]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const [s, sum] = await Promise.all([
        fetch(`${_BASE}/suppliers?${params}`, { headers: h() }).then(r => r.json()),
        fetch(`${_BASE}/suppliers/analytics/summary`, { headers: h() }).then(r => r.json()),
      ]);
      setSuppliers(s.data?.suppliers || []);
      setSummary(sum.data || sum);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, statusFilter]);

  const loadDetail = async (id) => {
    const r = await fetch(`${_BASE}/suppliers/${id}`, { headers: h() }).then(r => r.json());
    setSelected(r.data || r);
    setTab('detail');
  };

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${_BASE}/suppliers`, { method: 'POST', headers: h(), body: JSON.stringify(form) });
      setForm(BLANK);
      setTab('list');
      load();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const approve = async (id) => {
    await fetch(`${_BASE}/suppliers/${id}/approve`, { method: 'POST', headers: h() });
    load();
    if (selected?.supplier?._id === id) loadDetail(id);
  };

  const genScorecard = async (id) => {
    await fetch(`${_BASE}/suppliers/${id}/scorecard`, { method: 'POST', headers: h(), body: JSON.stringify({}) });
    loadDetail(id);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Management</h1>
          <p className="text-sm text-gray-500 mt-1">Register, approve and monitor suppliers</p>
        </div>
        <button onClick={() => setTab('add')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">+ Add Supplier</button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[['Total', summary.total], ['Active', summary.active], ['Approved', summary.approved], ['Pending', summary.pending]].map(([l, v]) => (
            <div key={l} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 uppercase">{l}</p>
              <p className="text-2xl font-bold mt-1">{v ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200">
        {['list','add', selected ? 'detail' : null].filter(Boolean).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'detail' ? selected?.supplier?.name || 'Detail' : t}
          </button>
        ))}
      </div>

      {tab === 'list' && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search suppliers…" className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">All Status</option>
              {['pending','approved','active','suspended','blacklisted'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {loading && <div className="text-center py-12 text-gray-400">Loading…</div>}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Code','Name','Category','City','Score','Status','Actions'].map(c => <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{c}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {suppliers.map(s => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.supplier_code}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{s.category?.replace('_',' ')}</td>
                    <td className="px-4 py-3 text-gray-500">{s.city || '—'}</td>
                    <td className="px-4 py-3 font-bold text-gray-700">{s.overall_score > 0 ? s.overall_score : '—'}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[s.status] || 'bg-gray-100 text-gray-700'}`}>{s.status}</span></td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => loadDetail(s._id)} className="text-indigo-600 hover:underline text-xs">View</button>
                      {s.status === 'pending' && <button onClick={() => approve(s._id)} className="text-green-600 hover:underline text-xs">Approve</button>}
                    </td>
                  </tr>
                ))}
                {!loading && suppliers.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No suppliers found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'add' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm max-w-2xl">
          <h3 className="font-semibold text-gray-800 mb-4">Register New Supplier</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[['name','Company Name','text',true],['contact_person','Contact Person','text'],['email','Email','email'],['phone','Phone','text'],['city','City','text'],['state','State','text']].map(([key,label,type,req]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}{req && ' *'}</label>
                <input type={type} value={form[key]} onChange={e => setForm(p => ({...p,[key]:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({...p,category:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {['raw_material','packaging','fuel','spare_parts','logistics','services','technology','other'].map(c => <option key={c} value={c}>{c.replace('_',' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Payment Terms</label>
              <select value={form.payment_terms} onChange={e => setForm(p => ({...p,payment_terms:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {['net_7','net_15','net_30','net_45','net_60','cod','advance'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
            <input value={form.address} onChange={e => setForm(p => ({...p,address:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={save} disabled={saving || !form.name} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm disabled:opacity-50">
              {saving ? 'Saving…' : 'Register Supplier'}
            </button>
            <button onClick={() => setTab('list')} className="border border-gray-200 px-5 py-2 rounded-lg text-sm text-gray-600">Cancel</button>
          </div>
        </div>
      )}

      {tab === 'detail' && selected && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selected.supplier?.name}</h3>
                <p className="text-sm text-gray-500">{selected.supplier?.supplier_code} · {selected.supplier?.category?.replace('_',' ')}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[selected.supplier?.status] || 'bg-gray-100 text-gray-700'}`}>{selected.supplier?.status}</span>
                {selected.supplier?.status === 'pending' && (
                  <button onClick={() => approve(selected.supplier?._id)} className="bg-green-600 text-white px-3 py-1 rounded text-xs">Approve</button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[['Contact', selected.supplier?.contact_person], ['Email', selected.supplier?.email], ['Phone', selected.supplier?.phone], ['City', selected.supplier?.city], ['Payment Terms', selected.supplier?.payment_terms], ['Currency', selected.supplier?.currency]].map(([l,v]) => (
                <div key={l}>
                  <p className="text-xs text-gray-400">{l}</p>
                  <p className="text-sm font-medium text-gray-800">{v || '—'}</p>
                </div>
              ))}
            </div>
          </div>

          {selected.scorecard ? (
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-3">Latest Scorecard</h4>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900">{selected.scorecard.overall_score}</p>
                  <p className="text-sm text-gray-500">Overall Score</p>
                </div>
                <div className="text-center">
                  <p className={`text-4xl font-bold ${GRADE_COLOR[selected.scorecard.grade] || 'text-gray-700'}`}>{selected.scorecard.grade}</p>
                  <p className="text-sm text-gray-500">Grade</p>
                </div>
              </div>
              {selected.scorecard.ai_summary && <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">{selected.scorecard.ai_summary}</p>}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm text-center">
              <p className="text-gray-500 mb-3">No scorecard generated yet</p>
              <button onClick={() => genScorecard(selected.supplier?._id)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Generate Scorecard</button>
            </div>
          )}

          {selected.recent_pos?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-3">Recent Purchase Orders</h4>
              <div className="space-y-2">
                {selected.recent_pos.map(po => (
                  <div key={po._id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm font-mono text-gray-600">{po.po_number}</span>
                    <span className="text-sm text-gray-500">{po.status}</span>
                    <span className="text-sm font-medium">KES {(po.total_amount || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
