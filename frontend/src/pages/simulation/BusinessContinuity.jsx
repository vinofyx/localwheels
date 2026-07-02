import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const SCENARIOS = ['system_outage','natural_disaster','cyber_attack','pandemic','power_failure','key_person_loss','supplier_failure','route_disruption','warehouse_fire','data_breach'];

export default function BusinessContinuity() {
  const [plans, setPlans]   = useState([]);
  const [stats, setStats]   = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ plan_name: '', scenario_type: 'system_outage', rto_hours: 24, rpo_hours: 4, priority: 'high' });

  const load = async () => {
    const [pRes, sRes] = await Promise.all([
      fetch(`${_BASE}/recovery/plans`, { headers: h() }),
      fetch(`${_BASE}/recovery/stats`, { headers: h() }),
    ]);
    if (pRes.ok) { const d = await pRes.json(); setPlans(d.data.plans || []); }
    if (sRes.ok) { const d = await sRes.json(); setStats(d.data); }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    await fetch(`${_BASE}/recovery/plans`, { method: 'POST', headers: h(), body: JSON.stringify(form) });
    setCreating(false); load();
  };

  const activate = async (id) => {
    if (!confirm('Activate this recovery plan?')) return;
    await fetch(`${_BASE}/recovery/plans/${id}/activate`, { method: 'POST', headers: h() });
    alert('Recovery plan activated');
    load();
  };

  const test = async (id) => {
    await fetch(`${_BASE}/recovery/plans/${id}/test`, { method: 'POST', headers: h(), body: JSON.stringify({ result: 'pass' }) });
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Continuity</h1>
          <p className="text-gray-500 text-sm mt-1">Recovery plans and disaster preparedness</p>
        </div>
        <button onClick={() => setCreating(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">+ New Plan</button>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Plans',       value: stats.total_plans,      color: 'gray' },
            { label: 'Tested',            value: stats.tested,           color: 'green' },
            { label: 'Active Recoveries', value: stats.active_recoveries,color: 'red' },
            { label: 'Coverage',          value: `${stats.coverage_pct}%`,color: 'blue' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-xl font-bold text-${s.color}-600 mt-1`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {plans.length === 0 && <div className="bg-white rounded-xl border p-8 text-center text-gray-400">No recovery plans yet. Create one to start.</div>}
        {plans.map(plan => (
          <div key={plan._id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{plan.plan_name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${plan.status === 'active' ? 'bg-red-100 text-red-700' : plan.status === 'tested' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{plan.status}</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{plan.scenario_type?.replace(/_/g,' ')}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${plan.priority === 'critical' ? 'bg-red-100 text-red-700' : plan.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{plan.priority}</span>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>RTO: <strong>{plan.rto_hours}h</strong></span>
                  <span>RPO: <strong>{plan.rpo_hours}h</strong></span>
                  <span>Steps: {plan.recovery_steps?.length || 0}</span>
                  {plan.last_tested_at && <span>Last tested: {new Date(plan.last_tested_at).toLocaleDateString()}</span>}
                </div>
                {plan.recovery_steps?.length > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {plan.recovery_steps.map(s => (
                      <div key={s.step_no} className="text-xs bg-gray-50 border rounded px-2 py-1">
                        <strong>S{s.step_no}</strong> {s.title} <span className="text-gray-400">({s.duration_hrs}h)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 ml-4 flex-shrink-0">
                <button onClick={() => test(plan._id)} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded">Test</button>
                <button onClick={() => activate(plan._id)} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded">Activate</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold mb-4">New Recovery Plan</h2>
            <div className="space-y-3">
              <input value={form.plan_name} onChange={e => setForm(f => ({...f, plan_name: e.target.value}))} placeholder="Plan Name *" className="w-full border rounded-lg px-3 py-2 text-sm" />
              <select value={form.scenario_type} onChange={e => setForm(f => ({...f, scenario_type: e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm">
                {SCENARIOS.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs text-gray-500">RTO (hours)</label>
                  <input type="number" value={form.rto_hours} onChange={e => setForm(f => ({...f, rto_hours: +e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5" /></div>
                <div><label className="text-xs text-gray-500">RPO (hours)</label>
                  <input type="number" value={form.rpo_hours} onChange={e => setForm(f => ({...f, rpo_hours: +e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5" /></div>
              </div>
              <select value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm">
                {['low','medium','high','critical'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={create} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm">Create</button>
              <button onClick={() => setCreating(false)} className="flex-1 border rounded-lg py-2 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
