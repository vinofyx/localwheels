import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const DOMAINS = ['fleet','route','warehouse','cost','carbon','demand','capacity'];

export default function ExecutiveSimulation() {
  const [dashboard, setDashboard] = useState(null);
  const [kpis, setKpis]           = useState(null);
  const [financial, setFinancial] = useState(null);
  const [recs, setRecs]           = useState([]);
  const [question, setQuestion]   = useState('');
  const [answer, setAnswer]       = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [recDomain, setRecDomain] = useState('fleet');

  const load = async () => {
    const [dRes, kRes, fRes] = await Promise.all([
      fetch(`${_BASE}/executive-simulation/dashboard`, { headers: h() }),
      fetch(`${_BASE}/executive-simulation/kpis`, { headers: h() }),
      fetch(`${_BASE}/executive-simulation/financial-impact`, { headers: h() }),
    ]);
    if (dRes.ok) { const d = await dRes.json(); setDashboard(d.data); }
    if (kRes.ok) { const d = await kRes.json(); setKpis(d.data); }
    if (fRes.ok) { const d = await fRes.json(); setFinancial(d.data); }
  };

  useEffect(() => { load(); }, []);

  const askCopilot = async () => {
    if (!question.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch(`${_BASE}/executive-simulation/copilot`, { method: 'POST', headers: h(), body: JSON.stringify({ question }) });
      if (res.ok) { const d = await res.json(); setAnswer(d.data.answer); }
    } finally { setAiLoading(false); }
  };

  const genRecs = async () => {
    setAiLoading(true);
    try {
      const res = await fetch(`${_BASE}/executive-simulation/recommendations`, { method: 'POST', headers: h(), body: JSON.stringify({ domain: recDomain, count: 3 }) });
      if (res.ok) { const d = await res.json(); setRecs(d.data.recommendations || []); }
    } finally { setAiLoading(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Executive Simulation Center</h1>
        <p className="text-gray-500 text-sm mt-1">Board-level visibility into simulations, decisions and strategic outlook</p>
      </div>

      {dashboard && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Active Digital Twins', value: dashboard.digital_twin?.active || 0, sub: `${dashboard.digital_twin?.health || 0}% health`, color: 'blue' },
            { label: 'Pending Decisions',    value: dashboard.decisions?.pending || 0, sub: 'awaiting approval', color: 'yellow' },
            { label: 'Sustainability',       value: dashboard.sustainability?.grade || '—', sub: `Score: ${dashboard.sustainability?.score || 0}/100`, color: 'green' },
            { label: 'High Risks',           value: dashboard.risks?.open_high || 0, sub: 'critical/high severity', color: 'red' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold text-${s.color}-600 mt-1`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {financial && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <p className="text-sm text-green-700 font-medium">Cost Savings Projected</p>
            <p className="text-2xl font-bold text-green-800">₹{(financial.cost_saving_inr||0).toLocaleString()}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <p className="text-sm text-blue-700 font-medium">Revenue Impact</p>
            <p className="text-2xl font-bold text-blue-800">₹{(financial.revenue_impact_inr||0).toLocaleString()}</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
            <p className="text-sm text-purple-700 font-medium">ROI</p>
            <p className="text-2xl font-bold text-purple-800">{financial.roi_pct || 0}%</p>
            <p className="text-xs text-gray-500">{financial.simulations_contributing} simulations</p>
          </div>
        </div>
      )}

      {kpis && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Platform KPIs</h2>
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: 'Sim Accuracy', value: `${kpis.simulation_accuracy_pct || 0}%` },
              { label: 'Approval Rate', value: `${kpis.autonomous_approval_rate || 0}%` },
              { label: 'Risk Mitigation', value: `${kpis.risk_mitigation_rate || 0}%` },
              { label: 'Avg Sim Time', value: `${kpis.avg_sim_duration_s || 0}s` },
              { label: 'Rec Value', value: `₹${((kpis.recommendations_value_inr||0)/1000).toFixed(0)}K` },
            ].map(k => (
              <div key={k.label} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">{k.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-3">Executive AI Copilot</h2>
        <div className="flex gap-2">
          <input
            value={question} onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && askCopilot()}
            placeholder="Ask anything: 'What's our risk exposure?' 'Which simulation showed the best ROI?'"
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
          />
          <button onClick={askCopilot} disabled={aiLoading} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">
            {aiLoading ? '...' : 'Ask'}
          </button>
        </div>
        {answer && (
          <div className="mt-3 bg-purple-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">{answer}</div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">AI Optimisation Recommendations</h2>
          <div className="flex gap-2 items-center">
            <select value={recDomain} onChange={e => setRecDomain(e.target.value)} className="border rounded px-2 py-1 text-sm">
              {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <button onClick={genRecs} disabled={aiLoading} className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded">Generate</button>
          </div>
        </div>
        {recs.length === 0 ? (
          <div className="text-center text-gray-400 py-6">Select a domain and click Generate to get AI recommendations</div>
        ) : (
          <div className="space-y-3">
            {recs.map((rec, i) => (
              <div key={i} className={`border rounded-xl p-4 ${rec.priority === 'high' ? 'border-red-200 bg-red-50' : rec.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' : 'border-blue-200 bg-blue-50'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">{rec.title}</h3>
                    <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                  </div>
                  <div className="text-right text-xs ml-4 flex-shrink-0">
                    {rec.estimated_impact?.cost_saving_inr > 0 && (
                      <div className="text-green-600 font-medium">₹{rec.estimated_impact.cost_saving_inr.toLocaleString()}</div>
                    )}
                    {rec.estimated_impact?.efficiency_gain_pct > 0 && (
                      <div className="text-blue-600">+{rec.estimated_impact.efficiency_gain_pct}% efficiency</div>
                    )}
                  </div>
                </div>
                {rec.actions?.length > 0 && (
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {rec.actions.slice(0,3).map((a, j) => (
                      <span key={j} className="text-xs bg-white border rounded px-2 py-0.5 text-gray-600">{a}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
