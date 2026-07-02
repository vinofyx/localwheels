import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h  = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });
const jh = () => ({ ...h(), 'Content-Type': 'application/json' });

export default function AutomationAnalytics() {
  const [dash, setDash]       = useState(null);
  const [insights, setInsights] = useState([]);
  const [history, setHistory]   = useState([]);
  const [tab, setTab]           = useState('overview');
  const [loading, setLoading]   = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${_BASE}/automation-analytics/dashboard`, { headers: h() }).then(r => r.json()),
      fetch(`${_BASE}/automation-analytics/history?period=daily&limit=14`, { headers: h() }).then(r => r.json()),
    ]).then(([d, hist]) => {
      setDash(d.data || d);
      setHistory(hist.data?.history || []);
    }).finally(() => setLoading(false));
  }, []);

  const getAiInsights = async () => {
    setAiLoading(true);
    try {
      const r = await fetch(`${_BASE}/automation-analytics/ai-insights`, { method: 'POST', headers: jh(), body: '{}' });
      const data = await r.json();
      setInsights(data.data?.insights || []);
    } catch (_) {} finally { setAiLoading(false); }
  };

  const saveSnapshot = async () => {
    await fetch(`${_BASE}/automation-analytics/snapshot`, { method: 'POST', headers: jh(), body: '{"period":"daily"}' });
    alert('Snapshot saved!');
  };

  if (loading) return <div className="p-6 text-center text-gray-400 py-16">Loading analytics…</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automation Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Performance metrics for the automation platform</p>
        </div>
        <div className="flex gap-2">
          <button onClick={saveSnapshot} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">Save Snapshot</button>
          <button onClick={getAiInsights} disabled={aiLoading}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50">
            {aiLoading ? 'Analyzing…' : '🤖 AI Insights'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {[['overview','Overview'],['workflows','Workflows'],['approvals','Approvals'],['history','History']].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{l}</button>
        ))}
      </div>

      {insights.length > 0 && (
        <div className="space-y-2">
          {insights.map((ins, i) => (
            <div key={i} className="bg-purple-50 border border-purple-100 rounded-xl p-4">
              <p className="font-medium text-purple-900">💡 {ins.insight}</p>
              <p className="text-sm text-purple-700 mt-1">→ {ins.recommendation}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'overview' && dash && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Workflows</h3>
            {[['Total', dash.workflows?.total], ['Active', dash.workflows?.active, 'text-green-600']].map(([l,v,c]) => (
              <div key={l} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{l}</span>
                <span className={`text-sm font-bold ${c||'text-gray-900'}`}>{v??0}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Jobs (30 Days)</h3>
            {[['Total', dash.jobs?.last_30_days?.total], ['Completed', dash.jobs?.last_30_days?.completed,'text-green-600'],
              ['Failed', dash.jobs?.last_30_days?.failed,'text-red-500'],
              ['Success Rate', `${dash.jobs?.last_30_days?.success_rate_pct}%`,'text-indigo-600']].map(([l,v,c]) => (
              <div key={l} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{l}</span>
                <span className={`text-sm font-bold ${c||'text-gray-900'}`}>{v??0}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Approvals</h3>
            {[['Total', dash.approvals?.total], ['Pending', dash.approvals?.pending,'text-yellow-600'],
              ['Approved', dash.approvals?.approved,'text-green-600']].map(([l,v,c]) => (
              <div key={l} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{l}</span>
                <span className={`text-sm font-bold ${c||'text-gray-900'}`}>{v??0}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Digital Workers</h3>
            {[['Total', dash.workers?.total], ['Active', dash.workers?.active,'text-green-600']].map(([l,v,c]) => (
              <div key={l} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{l}</span>
                <span className={`text-sm font-bold ${c||'text-gray-900'}`}>{v??0}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Schedulers & Rules</h3>
            {[['Active Schedules', dash.schedulers?.active], ['Total Rules', dash.rules?.total],
              ['Active Rules', dash.rules?.active,'text-green-600']].map(([l,v,c]) => (
              <div key={l} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{l}</span>
                <span className={`text-sm font-bold ${c||'text-gray-900'}`}>{v??0}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Last 7 Days</h3>
            {[['Jobs', dash.jobs?.last_7_days?.total], ['Completed', dash.jobs?.last_7_days?.completed,'text-green-600'],
              ['Success Rate', `${dash.jobs?.last_7_days?.success_rate_pct}%`,'text-indigo-600']].map(([l,v,c]) => (
              <div key={l} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{l}</span>
                <span className={`text-sm font-bold ${c||'text-gray-900'}`}>{v??0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'workflows' && dash?.top_workflows && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">Top Workflows by Usage</h3>
          <table className="min-w-full text-sm">
            <thead><tr className="border-b border-gray-100">
              {['Workflow','Total Runs','Success','Failed'].map(c => <th key={c} className="py-2 text-left text-xs font-semibold text-gray-400 uppercase">{c}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {dash.top_workflows.map(w => (
                <tr key={w._id}>
                  <td className="py-2 font-medium text-gray-900">{w.name}</td>
                  <td className="py-2 text-gray-600">{w.run_count}</td>
                  <td className="py-2 text-green-600 font-medium">{w.success_count}</td>
                  <td className="py-2 text-red-500 font-medium">{w.failure_count}</td>
                </tr>
              ))}
              {dash.top_workflows.length === 0 && <tr><td colSpan={4} className="text-center py-6 text-gray-400">No workflow data yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">Daily Snapshots (Last 14 Days)</h3>
          {history.length === 0 ? (
            <p className="text-center py-6 text-gray-400">No history yet — click "Save Snapshot" to record today's metrics</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                {['Date','Jobs','Completed','Failed','Success %','Time Saved'].map(c => <th key={c} className="py-2 text-left text-xs font-semibold text-gray-400 uppercase">{c}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {history.map(s => (
                  <tr key={s._id}>
                    <td className="py-2 text-gray-900">{new Date(s.period_date).toLocaleDateString()}</td>
                    <td className="py-2">{s.jobs_total}</td>
                    <td className="py-2 text-green-600">{s.jobs_completed}</td>
                    <td className="py-2 text-red-500">{s.jobs_failed}</td>
                    <td className="py-2 text-indigo-600 font-medium">{s.success_rate_pct}%</td>
                    <td className="py-2 text-gray-600">{s.time_saved_hours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
