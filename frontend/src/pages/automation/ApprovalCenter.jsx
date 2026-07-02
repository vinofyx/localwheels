import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h  = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });
const jh = () => ({ ...h(), 'Content-Type': 'application/json' });

const STATUS_COLOR = {
  pending:   'bg-yellow-100 text-yellow-700',
  in_review: 'bg-blue-100 text-blue-700',
  approved:  'bg-green-100 text-green-700',
  rejected:  'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

export default function ApprovalCenter() {
  const [tab, setTab]         = useState('requests');
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail]     = useState(null);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [comment, setComment]   = useState('');
  const [form, setForm] = useState({ title: '', entity_type: 'purchase_order', description: '', amount: '' });
  const [saving, setSaving] = useState(false);

  const loadRequests = () => {
    setLoading(true);
    Promise.all([
      fetch(`${_BASE}/approvals/requests?limit=30`, { headers: h() }).then(r => r.json()),
      fetch(`${_BASE}/approvals/stats`, { headers: h() }).then(r => r.json()),
    ]).then(([req, st]) => {
      setRequests(req.data?.requests || []);
      setStats(st.data || st);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { loadRequests(); }, []);

  const loadDetail = (req) => {
    setSelected(req);
    fetch(`${_BASE}/approvals/requests/${req._id}`, { headers: h() }).then(r => r.json())
      .then(r => setDetail(r.data));
    setTab('detail');
  };

  const approve = async (id) => {
    await fetch(`${_BASE}/approvals/requests/${id}/approve`, { method: 'POST', headers: jh(), body: JSON.stringify({ comment }) });
    setComment(''); loadRequests(); setTab('requests');
  };
  const reject = async (id) => {
    if (!comment.trim()) return alert('Comment required for rejection');
    await fetch(`${_BASE}/approvals/requests/${id}/reject`, { method: 'POST', headers: jh(), body: JSON.stringify({ comment }) });
    setComment(''); loadRequests(); setTab('requests');
  };

  const submit = async () => {
    setSaving(true);
    try {
      await fetch(`${_BASE}/approvals/requests`, { method: 'POST', headers: jh(), body: JSON.stringify({
        ...form, amount: form.amount ? +form.amount : undefined,
      }) });
      setForm({ title: '', entity_type: 'purchase_order', description: '', amount: '' });
      loadRequests(); setTab('requests');
    } catch (_) {} finally { setSaving(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approval Center</h1>
        <p className="text-sm text-gray-500 mt-1">Multi-step approval workflows for enterprise decisions</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[['Total', stats.total], ['Pending', stats.pending, 'text-yellow-600'], ['Approved', stats.approved, 'text-green-600'], ['Rejected', stats.rejected, 'text-red-500']].map(([l, v, c]) => (
            <div key={l} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
              <p className="text-xs text-gray-500">{l}</p>
              <p className={`text-2xl font-bold mt-0.5 ${c || 'text-gray-900'}`}>{v ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200">
        {[['requests','Requests'],['submit','Submit Request'],['detail','Detail']].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{label}</button>
        ))}
      </div>

      {tab === 'requests' && (
        <div className="space-y-2">
          {loading && <div className="text-center py-10 text-gray-400">Loading…</div>}
          {!loading && requests.length === 0 && <div className="text-center py-10 text-gray-400">No approval requests yet</div>}
          {requests.map(req => (
            <div key={req._id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center justify-between cursor-pointer hover:border-indigo-200"
              onClick={() => loadDetail(req)}>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">{req.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[req.status] || 'bg-gray-100 text-gray-600'}`}>{req.status}</span>
                </div>
                <p className="text-sm text-gray-500">{req.entity_type} · {req.request_ref}</p>
                {req.amount && <p className="text-xs text-indigo-600 mt-0.5">KES {req.amount.toLocaleString()}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Step {req.current_step}/{req.total_steps}</p>
                <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'submit' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-800">New Approval Request</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. PO approval for fuel procurement" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.entity_type}
                onChange={e => setForm(f => ({ ...f, entity_type: e.target.value }))}>
                {['purchase_order','sales_order','quote','shipment','complaint','supplier','expense','custom'].map(t => (
                  <option key={t} value={t}>{t.replace('_',' ')}</option>
                ))}
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount (optional)</label>
              <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Reason for this approval…" /></div>
          </div>
          <button onClick={submit} disabled={saving || !form.title}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Submitting…' : 'Submit for Approval'}
          </button>
        </div>
      )}

      {tab === 'detail' && detail && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{detail.request.title}</h3>
                <p className="text-sm text-gray-500">{detail.request.request_ref} · {detail.request.entity_type}</p>
                {detail.request.amount && <p className="text-sm text-indigo-600 font-medium mt-1">KES {detail.request.amount.toLocaleString()}</p>}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[detail.request.status] || 'bg-gray-100 text-gray-600'}`}>{detail.request.status}</span>
            </div>
            <p className="text-sm text-gray-600 mt-3">{detail.request.description}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h4 className="font-medium text-gray-800 mb-3">Approval History</h4>
            <div className="space-y-2">
              {(detail.history || []).map((h, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${h.action === 'approved' ? 'bg-green-500' : h.action === 'rejected' ? 'bg-red-500' : 'bg-blue-500'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{h.actor_name || 'System'} — {h.action}</p>
                    <p className="text-xs text-gray-500">{h.comment}</p>
                    <p className="text-xs text-gray-400">{new Date(h.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {['pending','in_review'].includes(detail.request.status) && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h4 className="font-medium text-gray-800 mb-3">Take Action</h4>
              <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3" rows={2}
                placeholder="Comment (required for rejection)…" value={comment}
                onChange={e => setComment(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={() => approve(detail.request._id)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">✓ Approve</button>
                <button onClick={() => reject(detail.request._id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700">✕ Reject</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
