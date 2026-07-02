import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });

const STATUS_ICON  = { completed:'✅', failed:'❌', running:'🔄', queued:'⏳', cancelled:'🚫', skipped:'⏭️' };
const TRIGGER_ICON = { manual:'👆', schedule:'⏰', event:'⚡', webhook:'🔗', condition:'🔀', api:'🌐' };

export default function ExecutionHistory() {
  const [jobs, setJobs]     = useState([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [filter, setFilter] = useState({ status: '', from: '', to: '' });
  const [loading, setLoading] = useState(true);

  const load = (p = 1) => {
    setLoading(true);
    const qs = new URLSearchParams({ page: p, limit: 20, ...(filter.status && { status: filter.status }) });
    fetch(`${_BASE}/automation-jobs?${qs}`, { headers: h() }).then(r => r.json())
      .then(r => { setJobs(r.data?.jobs || []); setTotal(r.data?.total || 0); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(page); }, [page, filter.status]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Execution History</h1>
        <p className="text-sm text-gray-500 mt-1">Complete log of all automation job executions</p>
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        <span className="text-sm text-gray-500">Filter by status:</span>
        {['','queued','running','completed','failed','cancelled'].map(s => (
          <button key={s} onClick={() => { setFilter(f => ({ ...f, status: s })); setPage(1); }}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${filter.status === s ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            {s || 'All'}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400">{total} total records</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['Job Ref','Workflow','Trigger','Status','Steps','Duration','Started','Completed'].map(c => (
              <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{c}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading…</td></tr>}
            {!loading && jobs.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-gray-400">No executions found</td></tr>}
            {jobs.map(j => (
              <tr key={j._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-600">{j.job_ref}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{j.workflow_name || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{TRIGGER_ICON[j.trigger_type]} {j.trigger_type}</td>
                <td className="px-4 py-3">{STATUS_ICON[j.status]} <span className="text-gray-700 capitalize">{j.status}</span></td>
                <td className="px-4 py-3 text-gray-600">{j.steps_done}/{j.steps_total}</td>
                <td className="px-4 py-3 text-gray-600">{j.duration_ms ? `${j.duration_ms}ms` : '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{j.started_at ? new Date(j.started_at).toLocaleString() : '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{j.completed_at ? new Date(j.completed_at).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
            className="border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">← Prev</button>
          <span className="text-sm text-gray-500 px-3 py-1.5">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
            className="border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">Next →</button>
        </div>
      )}
    </div>
  );
}
