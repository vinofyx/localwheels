import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const SEV_COLOR  = { low: 'bg-blue-100 text-blue-700', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' };
const STAT_COLOR = { open: 'bg-red-100 text-red-700', investigating: 'bg-yellow-100 text-yellow-700', escalated: 'bg-orange-100 text-orange-700', resolved: 'bg-green-100 text-green-700', closed: 'bg-gray-100 text-gray-500' };

export default function EnterpriseIncidents() {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats]         = useState(null);
  const [tab, setTab]             = useState('list');
  const [selected, setSelected]   = useState(null);
  const [comments, setComments]   = useState([]);
  const [commentText, setCommentText] = useState('');
  const [form, setForm]           = useState({ type: 'other', severity: 'medium', title: '', description: '', location: '', impact: '' });
  const [resolveForm, setResolveForm] = useState({ resolution: '', root_cause: '', actions_taken: '' });
  const [saving, setSaving]       = useState(false);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (statusFilter) params.set('status', statusFilter);
      const [inc, s] = await Promise.all([
        fetch(`${_BASE}/incidents?${params}`, { headers: h() }).then(r => r.json()),
        fetch(`${_BASE}/incidents/stats/summary`, { headers: h() }).then(r => r.json()),
      ]);
      setIncidents(inc.data?.incidents || []);
      setStats(s.data || s);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const loadDetail = async (id) => {
    const r = await fetch(`${_BASE}/incidents/${id}`, { headers: h() }).then(r => r.json());
    setSelected(r.data?.incident || r.incident);
    setComments(r.data?.comments || r.comments || []);
    setTab('detail');
  };

  const createIncident = async () => {
    setSaving(true);
    await fetch(`${_BASE}/incidents`, { method: 'POST', headers: h(), body: JSON.stringify(form) });
    setSaving(false);
    setTab('list');
    load();
  };

  const resolve = async () => {
    const payload = { ...resolveForm, actions_taken: resolveForm.actions_taken.split('\n').filter(Boolean) };
    await fetch(`${_BASE}/incidents/${selected._id}/resolve`, { method: 'PUT', headers: h(), body: JSON.stringify(payload) });
    loadDetail(selected._id);
  };

  const addComment = async () => {
    if (!commentText.trim()) return;
    await fetch(`${_BASE}/incidents/${selected._id}/comments`, { method: 'POST', headers: h(), body: JSON.stringify({ text: commentText }) });
    setCommentText('');
    loadDetail(selected._id);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enterprise Incidents</h1>
          <p className="text-sm text-gray-500 mt-1">Report, track and resolve operational incidents</p>
        </div>
        <button onClick={() => setTab('create')} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700">+ Report Incident</button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[['Total', stats.total], ['Open', stats.open, 'text-red-600'], ['Critical', stats.critical, 'text-red-700'], ['Resolved', stats.resolved, 'text-green-600']].map(([l, v, c]) => (
            <div key={l} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 uppercase">{l}</p>
              <p className={`text-2xl font-bold mt-1 ${c || 'text-gray-900'}`}>{v ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200">
        {['list','create', selected ? 'detail' : null].filter(Boolean).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'detail' ? selected?.incident_ref || 'Detail' : t}
          </button>
        ))}
      </div>

      {tab === 'list' && (
        <div className="space-y-3">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="">All Status</option>
            {['open','investigating','escalated','resolved','closed'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {loading ? <div className="text-center py-12 text-gray-400">Loading…</div> : (
            <div className="space-y-2">
              {incidents.map(inc => (
                <div key={inc._id} className="bg-white rounded-lg border border-gray-100 p-4 flex items-start gap-3 shadow-sm cursor-pointer hover:border-gray-200" onClick={() => loadDetail(inc._id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SEV_COLOR[inc.severity] || 'bg-gray-100 text-gray-700'}`}>{inc.severity}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STAT_COLOR[inc.status] || 'bg-gray-100 text-gray-600'}`}>{inc.status}</span>
                      <span className="text-xs text-gray-400">{inc.incident_ref}</span>
                    </div>
                    <p className="font-medium text-gray-900">{inc.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{inc.type?.replace('_',' ')} · {new Date(inc.createdAt).toLocaleDateString()}</p>
                  </div>
                  {inc.assigned_to && <p className="text-xs text-gray-500 whitespace-nowrap">{inc.assigned_to.name}</p>}
                </div>
              ))}
              {incidents.length === 0 && <div className="text-center py-10 text-gray-400">No incidents found</div>}
            </div>
          )}
        </div>
      )}

      {tab === 'create' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm max-w-2xl">
          <h3 className="font-semibold text-gray-800 mb-4">Report Incident</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({...p,title:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Brief incident title" />
            </div>
            {[['type','Type',['accident','breakdown','theft','delay','weather','compliance','customer_complaint','supplier_failure','system_outage','other'],'select'],['severity','Severity',['low','medium','high','critical'],'select']].map(([k,l,opts,t]) => (
              <div key={k}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                <select value={form[k]} onChange={e => setForm(p => ({...p,[k]:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  {opts.map(o => <option key={o} value={o}>{o.replace('_',' ')}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
              <input value={form.location} onChange={e => setForm(p => ({...p,location:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({...p,description:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" rows={3} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Impact</label>
              <input value={form.impact} onChange={e => setForm(p => ({...p,impact:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={createIncident} disabled={saving || !form.title} className="bg-red-600 text-white px-5 py-2 rounded-lg text-sm disabled:opacity-50">
              {saving ? 'Reporting…' : 'Report Incident'}
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
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEV_COLOR[selected.severity] || ''}`}>{selected.severity}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STAT_COLOR[selected.status] || ''}`}>{selected.status}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{selected.title}</h3>
                <p className="text-sm text-gray-500">{selected.incident_ref} · {selected.type?.replace('_',' ')}</p>
              </div>
            </div>
            {selected.description && <p className="text-sm text-gray-600 mb-3">{selected.description}</p>}
            {selected.impact && <p className="text-sm text-orange-700 bg-orange-50 p-3 rounded-lg">Impact: {selected.impact}</p>}
          </div>

          {!['resolved','closed'].includes(selected.status) && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-3">Resolve Incident</h4>
              <div className="space-y-3">
                <textarea placeholder="Resolution details…" value={resolveForm.resolution} onChange={e => setResolveForm(p => ({...p,resolution:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" rows={2} />
                <input placeholder="Root cause" value={resolveForm.root_cause} onChange={e => setResolveForm(p => ({...p,root_cause:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <textarea placeholder="Actions taken (one per line)" value={resolveForm.actions_taken} onChange={e => setResolveForm(p => ({...p,actions_taken:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" rows={2} />
                <button onClick={resolve} disabled={!resolveForm.resolution} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">Mark Resolved</button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-3">Timeline ({comments.length})</h4>
            <div className="space-y-3 mb-4">
              {comments.map(c => (
                <div key={c._id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-700">{(c.author_name || 'U')[0].toUpperCase()}</div>
                  <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">{c.author_name}</span>
                      <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-700">{c.text}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && <p className="text-sm text-gray-400">No comments yet</p>}
            </div>
            <div className="flex gap-2">
              <input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()} placeholder="Add comment…" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <button onClick={addComment} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm">Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
