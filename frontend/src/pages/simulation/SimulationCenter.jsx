import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const SIM_TYPES = ['what_if','traffic','weather','demand','capacity','fleet','warehouse','cost','risk','route','disaster','carbon','custom'];
const STATUS_COLOR = { running:'blue', completed:'green', failed:'red', queued:'yellow', draft:'gray' };

export default function SimulationCenter() {
  const [sims, setSims]     = useState([]);
  const [stats, setStats]   = useState(null);
  const [creating, setCreating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiConfig, setAiConfig]   = useState(null);
  const [form, setForm]     = useState({ name: '', sim_type: 'what_if', time_horizon_days: 30, description: '' });

  const load = async () => {
    const [sRes, stRes] = await Promise.all([
      fetch(`${_BASE}/simulation`, { headers: h() }),
      fetch(`${_BASE}/simulation/stats/summary`, { headers: h() }),
    ]);
    if (sRes.ok) { const d = await sRes.json(); setSims(d.data.simulations || []); }
    if (stRes.ok) { const d = await stRes.json(); setStats(d.data); }
  };

  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, []);

  const runSim = async () => {
    const body = aiConfig ? { ...aiConfig, ...form } : form;
    await fetch(`${_BASE}/simulation`, { method: 'POST', headers: h(), body: JSON.stringify(body) });
    setCreating(false); setAiConfig(null); setForm({ name: '', sim_type: 'what_if', time_horizon_days: 30, description: '' });
    setTimeout(load, 1000);
  };

  const aiGenerate = async () => {
    setAiLoading(true);
    try {
      const res = await fetch(`${_BASE}/simulation/ai-generate`, { method: 'POST', headers: h(), body: JSON.stringify({ prompt: aiPrompt }) });
      if (res.ok) { const d = await res.json(); setAiConfig(d.data.config); setForm(f => ({...f, ...d.data.config})); }
    } finally { setAiLoading(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Simulation Center</h1>
          <p className="text-gray-500 text-sm mt-1">Run AI-powered logistics simulations</p>
        </div>
        <button onClick={() => setCreating(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
          + New Simulation
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'gray' },
            { label: 'Running', value: stats.running, color: 'blue' },
            { label: 'Completed', value: stats.completed, color: 'green' },
            { label: 'Failed', value: stats.failed, color: 'red' },
            { label: 'Success Rate', value: `${stats.success_rate_pct}%`, color: 'emerald' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-xl font-bold text-${s.color}-600 mt-1`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {stats?.total_saving_inr > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-700 font-medium">Total Projected Savings from Simulations</p>
          <p className="text-2xl font-bold text-green-800">₹{stats.total_saving_inr.toLocaleString()}</p>
        </div>
      )}

      <div className="space-y-3">
        {sims.length === 0 && <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">No simulations yet. Create one to get started.</div>}
        {sims.map(sim => {
          const color = STATUS_COLOR[sim.status] || 'gray';
          return (
            <div key={sim._id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">{sim.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full bg-${color}-100 text-${color}-700`}>{sim.status}</span>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{sim.sim_type}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{sim.description} • {sim.time_horizon_days}d horizon</p>
                {sim.status === 'running' && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${sim.progress_pct || 0}%` }} />
                    </div>
                    <p className="text-xs text-blue-600 mt-0.5">{sim.progress_pct || 0}%</p>
                  </div>
                )}
              </div>
              {sim.result_summary && (
                <div className="text-right text-xs">
                  <div className={`font-semibold ${sim.result_summary.cost_impact < 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {sim.result_summary.cost_impact < 0 ? '▼' : '▲'} ₹{Math.abs(sim.result_summary.cost_impact || 0).toLocaleString()}
                  </div>
                  <div className="text-gray-500">Confidence: {sim.result_summary.confidence_pct}%</div>
                </div>
              )}
              <div className="text-xs text-gray-400">{new Date(sim.createdAt).toLocaleDateString()}</div>
            </div>
          );
        })}
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">New Simulation</h2>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs font-medium text-blue-700 mb-2">AI Generate from description</p>
              <div className="flex gap-2">
                <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="e.g. What if we increase fleet by 20%?" className="flex-1 border rounded px-2 py-1.5 text-sm" />
                <button onClick={aiGenerate} disabled={aiLoading} className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded">
                  {aiLoading ? '...' : 'AI'}
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Simulation Name *" className="w-full border rounded-lg px-3 py-2 text-sm" />
              <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Description" className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
              <select value={form.sim_type} onChange={e => setForm(f => ({...f, sim_type: e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm">
                {SIM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="number" value={form.time_horizon_days} onChange={e => setForm(f => ({...f, time_horizon_days: +e.target.value}))} placeholder="Horizon (days)" className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={runSim} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm">Run Simulation</button>
              <button onClick={() => setCreating(false)} className="flex-1 border rounded-lg py-2 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
