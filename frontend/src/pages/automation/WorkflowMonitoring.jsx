import { useState, useEffect, useRef } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h  = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });

const STATUS_COLOR = {
  queued:    'bg-gray-100 text-gray-600',
  running:   'bg-blue-100 text-blue-700 animate-pulse',
  completed: 'bg-green-100 text-green-700',
  failed:    'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default function WorkflowMonitoring() {
  const [workflows, setWorkflows] = useState([]);
  const [jobs, setJobs]           = useState([]);
  const [summary, setSummary]     = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading]     = useState(true);
  const intervalRef = useRef(null);

  const load = () => {
    Promise.all([
      fetch(`${_BASE}/automation?is_active=true&limit=10`, { headers: h() }).then(r => r.json()),
      fetch(`${_BASE}/automation-jobs?limit=15`, { headers: h() }).then(r => r.json()),
      fetch(`${_BASE}/automation/analytics/summary`, { headers: h() }).then(r => r.json()),
    ]).then(([wf, j, s]) => {
      setWorkflows(wf.data?.workflows || []);
      setJobs(j.data?.jobs || []);
      setSummary(s.data || s);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
    if (autoRefresh) { intervalRef.current = setInterval(load, 15000); }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflow Monitoring</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time visibility into automation execution</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <div onClick={() => setAutoRefresh(r => !r)}
              className={`w-9 h-5 rounded-full transition-colors ${autoRefresh ? 'bg-green-500' : 'bg-gray-300'} relative`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${autoRefresh ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            Auto-refresh (15s)
          </label>
          <button onClick={load} className="border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50">↻ Refresh</button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[['Active Workflows', summary.workflows?.active,'text-indigo-600'], ['Running Jobs', jobs.filter(j=>j.status==='running').length,'text-blue-600'],
            ['Queued', jobs.filter(j=>j.status==='queued').length,'text-yellow-600'],
            ['Success Rate', `${summary.jobs?.success_rate_pct}%`,'text-green-600']].map(([l,v,c]) => (
            <div key={l} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
              <p className="text-xs text-gray-500">{l}</p>
              <p className={`text-2xl font-bold mt-0.5 ${c||'text-gray-900'}`}>{v??0}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">Active Workflows</h3>
          {loading && <div className="text-center py-6 text-gray-400">Loading…</div>}
          <div className="space-y-2">
            {workflows.map(wf => (
              <div key={wf._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{wf.name}</p>
                  <p className="text-xs text-gray-500">{wf.category} · {wf.trigger_type}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">Runs: {wf.run_count}</p>
                  <div className="flex gap-1 mt-0.5">
                    <span className="text-xs text-green-600">{wf.success_count}✓</span>
                    <span className="text-xs text-red-500">{wf.failure_count}✗</span>
                  </div>
                </div>
              </div>
            ))}
            {!loading && workflows.length === 0 && <p className="text-center py-4 text-gray-400 text-sm">No active workflows</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">Recent Jobs</h3>
          <div className="space-y-2">
            {jobs.map(j => (
              <div key={j._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs font-mono text-indigo-600">{j.job_ref}</p>
                  <p className="text-sm text-gray-700">{j.workflow_name || '—'}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[j.status]||'bg-gray-100 text-gray-600'}`}>{j.status}</span>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(j.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
            {!loading && jobs.length === 0 && <p className="text-center py-4 text-gray-400 text-sm">No jobs yet</p>}
          </div>
        </div>
      </div>

      {autoRefresh && (
        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Live monitoring active — refreshing every 15 seconds
        </div>
      )}
    </div>
  );
}
