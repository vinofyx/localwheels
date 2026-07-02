import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });

const KpiCard = ({ label, value, sub, color = 'text-gray-900' }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

export default function AutomationDashboard() {
  const [dash, setDash]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${_BASE}/automation-analytics/dashboard`, { headers: h() })
      .then(r => r.json()).then(r => setDash(r.data || r)).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automation Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">AI-powered hyper-automation across the enterprise</p>
        </div>
        <a href="/automation/builder" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">+ New Workflow</a>
      </div>

      {loading && <div className="text-center py-16 text-gray-400">Loading dashboard…</div>}

      {!loading && dash && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <KpiCard label="Workflows Active"     value={dash.workflows?.active}    color="text-indigo-600" />
            <KpiCard label="Jobs (30d)"           value={dash.jobs?.last_30_days?.total} />
            <KpiCard label="Success Rate (30d)"   value={`${dash.jobs?.last_30_days?.success_rate_pct}%`} color="text-green-600" />
            <KpiCard label="Pending Approvals"    value={dash.approvals?.pending}   color={dash.approvals?.pending > 0 ? 'text-yellow-600' : 'text-gray-900'} />
            <KpiCard label="Digital Workers"      value={dash.workers?.active}      sub={`of ${dash.workers?.total} total`} />
            <KpiCard label="Active Schedules"     value={dash.schedulers?.active}   />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">Job Performance</h3>
              {[
                ['30-day Total Jobs',    dash.jobs?.last_30_days?.total],
                ['Completed',           dash.jobs?.last_30_days?.completed, 'text-green-600'],
                ['Failed',              dash.jobs?.last_30_days?.failed, 'text-red-500'],
                ['7-day Success Rate',  `${dash.jobs?.last_7_days?.success_rate_pct}%`, 'text-indigo-600'],
              ].map(([l, v, c]) => (
                <div key={l} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{l}</span>
                  <span className={`text-sm font-bold ${c || 'text-gray-900'}`}>{v ?? 0}</span>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">Approval Center</h3>
              {[
                ['Total Requests',  dash.approvals?.total],
                ['Pending Review',  dash.approvals?.pending,  'text-yellow-600'],
                ['Approved',        dash.approvals?.approved, 'text-green-600'],
              ].map(([l, v, c]) => (
                <div key={l} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{l}</span>
                  <span className={`text-sm font-bold ${c || 'text-gray-900'}`}>{v ?? 0}</span>
                </div>
              ))}
            </div>
          </div>

          {dash.top_workflows?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">Top Workflows</h3>
              <table className="min-w-full text-sm">
                <thead><tr className="border-b border-gray-100">
                  {['Workflow','Total Runs','Success','Failed'].map(c => (
                    <th key={c} className="py-2 text-left text-xs font-semibold text-gray-400 uppercase">{c}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {dash.top_workflows.map(w => (
                    <tr key={w._id} className="hover:bg-gray-50">
                      <td className="py-2 font-medium text-gray-900">{w.name}</td>
                      <td className="py-2 text-gray-600">{w.run_count}</td>
                      <td className="py-2 text-green-600 font-medium">{w.success_count}</td>
                      <td className="py-2 text-red-500 font-medium">{w.failure_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-5">
            <h3 className="font-semibold text-indigo-800 mb-2">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              {[
                ['🔄 Workflow Builder', '/automation/builder'],
                ['📋 Workflow Templates', '/automation/templates'],
                ['✅ Approvals', '/automation/approvals'],
                ['🤖 Digital Workers', '/automation/workers'],
                ['⏰ Scheduler', '/automation/scheduler'],
                ['📊 Analytics', '/automation/analytics'],
              ].map(([label, path]) => (
                <a key={path} href={path}
                  className="bg-white border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-50 transition-colors">
                  {label}
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
