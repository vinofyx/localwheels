import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const SEV_COLOR  = { low: 'bg-blue-100 text-blue-700', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' };
const STAT_COLOR = { active: 'bg-red-100 text-red-700', monitoring: 'bg-yellow-100 text-yellow-700', mitigated: 'bg-green-100 text-green-700', accepted: 'bg-gray-100 text-gray-700', closed: 'bg-gray-200 text-gray-600' };
const SEV_BG    = { low: 'bg-blue-50 border-blue-200', medium: 'bg-yellow-50 border-yellow-200', high: 'bg-orange-50 border-orange-200', critical: 'bg-red-50 border-red-200' };

export default function RiskCenter() {
  const [risks, setRisks]         = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [tab, setTab]             = useState('matrix');
  const [typeFilter, setTypeFilter] = useState('');
  const [sevFilter, setSevFilter] = useState('');
  const [aiContext, setAiContext] = useState('');
  const [aiRunning, setAiRunning] = useState(false);
  const [form, setForm]           = useState({ risk_type: 'other', severity: 'medium', probability: 'possible', title: '', description: '', affected_area: '', mitigation: '' });
  const [saving, setSaving]       = useState(false);
  const [loading, setLoading]     = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50, status: 'active' });
      if (typeFilter) params.set('risk_type', typeFilter);
      if (sevFilter) params.set('severity', sevFilter);
      const [r, d] = await Promise.all([
        fetch(`${_BASE}/risk?${params}`, { headers: h() }).then(r => r.json()),
        fetch(`${_BASE}/risk/dashboard`, { headers: h() }).then(r => r.json()),
      ]);
      setRisks(r.data?.risks || []);
      setDashboard(d.data || d);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [typeFilter, sevFilter]);

  const runAiAssess = async () => {
    if (!aiContext.trim()) return;
    setAiRunning(true);
    try {
      await fetch(`${_BASE}/risk/ai-assess`, { method: 'POST', headers: h(), body: JSON.stringify({ context: aiContext }) });
      setAiContext('');
      load();
    } catch { /* ignore */ }
    setAiRunning(false);
  };

  const createRisk = async () => {
    setSaving(true);
    try {
      await fetch(`${_BASE}/risk`, { method: 'POST', headers: h(), body: JSON.stringify(form) });
      setTab('matrix');
      load();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const updateStatus = async (id, status) => {
    await fetch(`${_BASE}/risk/${id}/status`, { method: 'PUT', headers: h(), body: JSON.stringify({ status }) });
    load();
  };

  const MATRIX_SEVS = ['low','medium','high','critical'];
  const MATRIX_PROBS = ['unlikely','possible','likely','almost_certain'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Risk Intelligence Center</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor, assess and mitigate enterprise risks</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('add')} className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">+ Manual Risk</button>
          <button onClick={() => setTab('ai')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">AI Assess</button>
        </div>
      </div>

      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[['Total Risks', dashboard.total], ['Active', dashboard.active, 'text-red-600'], ['Critical', dashboard.critical, 'text-red-700'], ['High', dashboard.high, 'text-orange-600']].map(([l, v, c]) => (
            <div key={l} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 uppercase">{l}</p>
              <p className={`text-2xl font-bold mt-1 ${c || 'text-gray-900'}`}>{v ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200">
        {['matrix','list','add','ai'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t === 'ai' ? 'AI Assess' : t}</button>
        ))}
      </div>

      {loading && <div className="text-center py-12 text-gray-400">Loading…</div>}

      {!loading && tab === 'matrix' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm overflow-x-auto">
          <h3 className="font-semibold text-gray-800 mb-4">Risk Matrix</h3>
          <table className="min-w-full text-center text-xs">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Probability ↓ / Severity →</th>
                {MATRIX_SEVS.map(s => <th key={s} className="px-4 py-2 font-medium capitalize text-gray-600">{s}</th>)}
              </tr>
            </thead>
            <tbody>
              {[...MATRIX_PROBS].reverse().map(prob => (
                <tr key={prob}>
                  <td className="px-4 py-2 text-left font-medium text-gray-500 capitalize">{prob.replace('_',' ')}</td>
                  {MATRIX_SEVS.map(sev => {
                    const count = risks.filter(r => r.severity === sev && r.probability === prob).length;
                    const cellColor = sev === 'critical' || (sev === 'high' && prob !== 'unlikely') ? 'bg-red-100' : sev === 'high' || (sev === 'medium' && prob !== 'unlikely') ? 'bg-orange-50' : 'bg-green-50';
                    return (
                      <td key={sev} className={`px-4 py-3 rounded ${cellColor}`}>
                        {count > 0 ? <span className="font-bold text-gray-800">{count}</span> : <span className="text-gray-300">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === 'list' && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">All Types</option>
              {['weather','traffic','political','route_closure','vehicle_breakdown','supplier','warehouse','driver','delivery','financial'].map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
            </select>
            <select value={sevFilter} onChange={e => setSevFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">All Severities</option>
              {['low','medium','high','critical'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            {risks.map(r => (
              <div key={r._id} className={`rounded-lg border p-4 shadow-sm ${SEV_BG[r.severity] || 'bg-white border-gray-100'}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SEV_COLOR[r.severity] || ''}`}>{r.severity}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STAT_COLOR[r.status] || ''}`}>{r.status}</span>
                      <span className="text-xs text-gray-500 capitalize">{r.risk_type?.replace('_',' ')}</span>
                    </div>
                    <p className="font-medium text-gray-900">{r.title}</p>
                    {r.description && <p className="text-xs text-gray-600 mt-0.5">{r.description}</p>}
                    {r.mitigation && <p className="text-xs text-green-700 mt-1 bg-green-50 px-2 py-1 rounded">Mitigation: {r.mitigation}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-gray-800">{r.risk_score}</p>
                    <p className="text-xs text-gray-400">Score</p>
                    <div className="flex gap-1 mt-2">
                      {r.status === 'active' && <button onClick={() => updateStatus(r._id, 'monitoring')} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded hover:bg-yellow-200">Monitor</button>}
                      {['active','monitoring'].includes(r.status) && <button onClick={() => updateStatus(r._id, 'mitigated')} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded hover:bg-green-200">Mitigate</button>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {risks.length === 0 && <div className="text-center py-10 text-gray-400">No active risks</div>}
          </div>
        </div>
      )}

      {tab === 'add' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm max-w-2xl">
          <h3 className="font-semibold text-gray-800 mb-4">Add Risk Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({...p,title:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            {[['risk_type','Risk Type',['weather','traffic','political','route_closure','vehicle_breakdown','supplier','warehouse','driver','delivery','financial','other']],['severity','Severity',['low','medium','high','critical']],['probability','Probability',['unlikely','possible','likely','almost_certain']]].map(([k,l,opts]) => (
              <div key={k}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                <select value={form[k]} onChange={e => setForm(p => ({...p,[k]:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  {opts.map(o => <option key={o} value={o}>{o.replace('_',' ')}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Affected Area</label>
              <input value={form.affected_area} onChange={e => setForm(p => ({...p,affected_area:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({...p,description:e.target.value}))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Mitigation Plan</label>
              <textarea value={form.mitigation} onChange={e => setForm(p => ({...p,mitigation:e.target.value}))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={createRisk} disabled={saving || !form.title} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm disabled:opacity-50">{saving ? 'Saving…' : 'Add Risk'}</button>
            <button onClick={() => setTab('list')} className="border border-gray-200 px-5 py-2 rounded-lg text-sm text-gray-600">Cancel</button>
          </div>
        </div>
      )}

      {tab === 'ai' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm max-w-2xl">
          <h3 className="font-semibold text-gray-800 mb-2">AI Risk Assessment</h3>
          <p className="text-sm text-gray-500 mb-4">Describe a situation and the AI will identify and log up to 3 risk assessments.</p>
          <textarea value={aiContext} onChange={e => setAiContext(e.target.value)} rows={5} placeholder="e.g. Heavy rainfall forecast for the Nairobi–Mombasa route next week, 3 vehicles scheduled for deliveries…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
          <button onClick={runAiAssess} disabled={aiRunning || !aiContext.trim()} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm disabled:opacity-50">
            {aiRunning ? 'Assessing…' : 'Run AI Assessment'}
          </button>
        </div>
      )}
    </div>
  );
}
