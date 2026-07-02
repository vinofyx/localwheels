import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h  = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });
const jh = () => ({ ...h(), 'Content-Type': 'application/json' });

const STATUS_COLOR = {
  queued:    'bg-gray-100 text-gray-600',
  running:   'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed:    'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
  skipped:   'bg-yellow-100 text-yellow-700',
};

export default function AutomationJobs() {
  const [tab, setTab]     = useState('list');
  const [jobs, setJobs]   = useState([]);
  const [stats, setStats] = useState(null);
  const [detail, setDetail] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const qs = statusFilter ? `?status=${statusFilter}` : '';
    Promise.all([
      fetch(`${_BASE}/automation-jobs${qs}`, { headers: h() }).then(r => r.json()),
      fetch(`${_BASE}/automation-jobs/stats/summary`, { headers: h() }).then(r => r.json()),
    ]).then(([j, s]) => {
      setJobs(j.data?.jobs || []);
      setStats(s.data || s);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [statusFilter]);

  const loadDetail = async (job) => {
    const r = await fetch(`${_BASE}/automation-jobs/${job._id}`, { headers: h() });
    const data = await r.json();
    setDetail(data.data);
    setTab('detail');
  };

  const cancel = async (id) => {
    await fetch(`${_BASE}/automation-jobs/${id}/cancel`, { method: 'PUT', headers: jh(), body: '{}' });
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Automation Jobs</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor all workflow execution history</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[['Total (30d)', stats.total], ['Completed', stats.completed, 'text-green-600'], ['Running', stats.running, 'text-blue-600'],
            ['Failed', stats.failed, 'text-red-500'], ['Success Rate', `${stats.success_rate_pct}%`, 'text-indigo-600']].map(([l,v,c]) => (
            <div key={l} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm text-center">
              <p className="text-xs text-gray-500">{l}</p>
              <p className={`text-xl font-bold mt-0.5 ${c || 'text-gray-900'}`}>{v ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200">
        {[['list','Jobs'],['detail','Detail']].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{l}</button>
        ))}
      </div>

      {tab === 'list' && (
        <>
          <div className="flex gap-2">
            {['','queued','running','completed','failed','cancelled'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${statusFilter === s ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                {s || 'All'}
              </button>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Job Ref','Workflow','Trigger','Steps','Status','Duration','Actions'].map(c => (
                  <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{c}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading && <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading…</td></tr>}
                {!loading && jobs.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-400">No jobs found</td></tr>}
                {jobs.map(j => (
                  <tr key={j._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => loadDetail(j)}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-600">{j.job_ref}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{j.workflow_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{j.trigger_type}</td>
                    <td className="px-4 py-3 text-gray-600">{j.steps_done}/{j.steps_total}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[j.status] || 'bg-gray-100 text-gray-600'}`}>{j.status}</span></td>
                    <td className="px-4 py-3 text-gray-600">{j.duration_ms ? `${j.duration_ms}ms` : '—'}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      {['queued','running'].includes(j.status) && (
                        <button onClick={() => cancel(j._id)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100">Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'detail' && detail && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{detail.job.workflow_name}</h3>
                <p className="font-mono text-xs text-indigo-600">{detail.job.job_ref}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[detail.job.status]}`}>{detail.job.status}</span>
            </div>
            {[['Trigger', detail.job.trigger_type], ['Steps', `${detail.job.steps_done}/${detail.job.steps_total}`],
              ['Duration', detail.job.duration_ms ? `${detail.job.duration_ms}ms` : '—'],
              ['Started', detail.job.started_at ? new Date(detail.job.started_at).toLocaleString() : '—'],
              ['Completed', detail.job.completed_at ? new Date(detail.job.completed_at).toLocaleString() : '—'],
            ].map(([l,v]) => (
              <div key={l} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{l}</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{v}</span>
              </div>
            ))}
            {detail.job.error && <div className="mt-3 bg-red-50 border border-red-100 rounded p-2 text-sm text-red-700">{detail.job.error}</div>}
          </div>
          {detail.executions?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h4 className="font-medium text-gray-800 mb-3">Execution Steps</h4>
              <div className="space-y-2">
                {detail.executions.map((ex, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                    <span className={`w-2 h-2 rounded-full ${ex.status === 'completed' ? 'bg-green-500' : ex.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'}`} />
                    <span className="text-xs font-medium text-gray-700">Step {ex.step_number}: {ex.step_name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{ex.action_type}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_COLOR[ex.status]}`}>{ex.status}</span>
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
