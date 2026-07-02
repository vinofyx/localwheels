import { useState, useEffect } from 'react';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

const REPORT_TYPES = ['executive','ceo','coo','finance','operations','fleet','sales','customer','document','branch'];
const STATUS_COLOR = { ready: 'bg-green-100 text-green-700', generating: 'bg-blue-100 text-blue-700', failed: 'bg-red-100 text-red-700' };

export default function ExecutiveReports() {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [selectedReport, setSelectedReport] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ report_type: 'executive', period_from: '', period_to: '', title: '' });

  const load = () => {
    setLoading(true);
    api.get(`${_BASE}/reports?limit=20`)
      .then(r => { setReports(r.data.reports || []); setTotal(r.data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    setGenerating(true);
    const r = await api.post(`${_BASE}/reports/generate`, form).catch(() => null);
    if (r) {
      load();
      setTimeout(load, 3000);
    }
    setGenerating(false);
  };

  const viewReport = async (id) => {
    const r = await api.get(`${_BASE}/reports/${id}`).catch(() => null);
    if (r) setSelectedReport(r.data.report);
  };

  const exportCSV = (id) => {
    window.open(`${_BASE}/reports/${id}/export?format=csv`, '_blank');
  };

  const deleteReport = async (id) => {
    if (!confirm('Delete this report?')) return;
    await api.delete(`${_BASE}/reports/${id}`).catch(() => {});
    load();
    if (selectedReport?._id === id) setSelectedReport(null);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Executive Reports</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generate Panel */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Generate New Report</h2>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Report Type</label>
            <select value={form.report_type} onChange={e => setForm(f => ({ ...f, report_type: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {REPORT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)} Report</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Title (optional)</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Auto-generated if blank" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Period From</label>
            <input type="date" value={form.period_from} onChange={e => setForm(f => ({ ...f, period_from: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Period To</label>
            <input type="date" value={form.period_to} onChange={e => setForm(f => ({ ...f, period_to: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <button onClick={generate} disabled={generating} className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {generating ? '⏳ Generating...' : '📄 Generate Report'}
          </button>
          <div className="text-xs text-gray-400">AI generates summary and analysis automatically</div>
        </div>

        {/* Reports List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Reports ({total})</h2>
            <button onClick={load} className="text-xs text-gray-400 hover:text-gray-600">Refresh</button>
          </div>
          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading...</div>
          ) : reports.length === 0 ? (
            <div className="text-center text-gray-400 py-8 text-sm">No reports yet</div>
          ) : (
            reports.map(r => (
              <div key={r._id} className={`border rounded-xl p-3 cursor-pointer hover:border-indigo-300 transition-colors ${selectedReport?._id === r._id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white'}`}
                onClick={() => viewReport(r._id)}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-800 truncate max-w-xs">{r.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5 capitalize">{r.report_type} · {new Date(r.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_COLOR[r.status]}`}>{r.status}</span>
                    <button onClick={e => { e.stopPropagation(); deleteReport(r._id); }} className="text-gray-300 hover:text-red-500 ml-1 text-xs">✕</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Report Viewer */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          {selectedReport ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">{selectedReport.title}</h2>
                  <div className="text-xs text-gray-400 mt-0.5 capitalize">{selectedReport.report_type} · {new Date(selectedReport.createdAt).toLocaleString()}</div>
                </div>
                <button onClick={() => exportCSV(selectedReport._id)} className="text-xs text-indigo-600 hover:underline shrink-0">Export CSV</button>
              </div>

              {selectedReport.ai_summary && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-800">
                  <div className="font-medium text-xs mb-1">🤖 AI Executive Summary</div>
                  {selectedReport.ai_summary}
                </div>
              )}

              {selectedReport.sections?.map((s, i) => (
                <div key={i} className="border-b border-gray-100 pb-3">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{s.title}</div>
                  <div className="text-sm text-gray-700">{s.content}</div>
                  {s.data && (
                    <div className="mt-1 grid grid-cols-2 gap-1">
                      {Object.entries(s.data).filter(([,v]) => typeof v === 'number').map(([k, v]) => (
                        <div key={k} className="bg-gray-50 rounded p-1.5">
                          <div className="text-xs text-gray-400 capitalize">{k.replace(/_/g,' ')}</div>
                          <div className="text-sm font-medium text-gray-800">{typeof v === 'number' && k.includes('revenue') ? '₹' + v.toLocaleString() : v?.toLocaleString?.() ?? v}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-300 py-12">
              <div className="text-4xl mb-2">📄</div>
              <div className="text-sm">Select a report to view</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
