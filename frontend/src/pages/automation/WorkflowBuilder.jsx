import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });
const jh = () => ({ ...h(), 'Content-Type': 'application/json' });

const CATEGORIES = ['logistics','fleet','warehouse','crm','finance','hr','compliance','custom'];
const TRIGGER_TYPES = ['schedule','event','manual','webhook','condition','api'];
const ACTION_TYPES  = ['send_email','send_sms','create_record','update_record','call_api','run_query','generate_report','notify_user','assign_task','custom'];

export default function WorkflowBuilder() {
  const [tab, setTab]         = useState('list');
  const [workflows, setWorkflows] = useState([]);
  const [selected, setSelected]   = useState(null);
  const [aiDesc, setAiDesc]       = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDraft, setAiDraft]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [form, setForm] = useState({ name: '', description: '', category: 'custom', trigger_type: 'manual', steps: [] });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`${_BASE}/automation`, { headers: h() }).then(r => r.json())
      .then(r => setWorkflows(r.data?.workflows || []))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const addStep = () => setForm(f => ({
    ...f,
    steps: [...f.steps, { step_number: f.steps.length + 1, name: '', action_type: 'custom', action_config: {} }],
  }));
  const removeStep = i => setForm(f => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }));
  const updateStep = (i, field, val) => setForm(f => {
    const steps = [...f.steps];
    steps[i] = { ...steps[i], [field]: val };
    return { ...f, steps };
  });

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${_BASE}/automation`, { method: 'POST', headers: jh(), body: JSON.stringify(form) });
      setForm({ name: '', description: '', category: 'custom', trigger_type: 'manual', steps: [] });
      load(); setTab('list');
    } catch (_) {} finally { setSaving(false); }
  };

  const aiGenerate = async () => {
    if (!aiDesc.trim()) return;
    setAiLoading(true);
    try {
      const r = await fetch(`${_BASE}/automation/ai-build`, { method: 'POST', headers: jh(), body: JSON.stringify({ description: aiDesc }) });
      const data = await r.json();
      setAiDraft(data.data?.workflow_draft);
    } catch (_) {} finally { setAiLoading(false); }
  };

  const useAiDraft = () => {
    if (!aiDraft) return;
    setForm({ name: aiDraft.name || '', description: aiDraft.description || '', category: aiDraft.category || 'custom', trigger_type: aiDraft.trigger_type || 'manual', steps: aiDraft.steps || [] });
    setAiDraft(null); setAiDesc(''); setTab('create');
  };

  const toggleActive = async (wf) => {
    await fetch(`${_BASE}/automation/${wf._id}`, { method: 'PUT', headers: jh(), body: JSON.stringify({ is_active: !wf.is_active }) });
    load();
  };

  const runWorkflow = async (id) => {
    await fetch(`${_BASE}/automation/${id}/run`, { method: 'POST', headers: jh(), body: '{}' });
    alert('Workflow triggered!');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflow Builder</h1>
          <p className="text-sm text-gray-500 mt-1">Design and manage automation workflows</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {[['list','Workflows'],['create','Create'],['ai','AI Builder']].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{label}</button>
        ))}
      </div>

      {tab === 'list' && (
        <div className="space-y-3">
          {loading && <div className="text-center py-10 text-gray-400">Loading…</div>}
          {!loading && workflows.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">🔄</p>
              <p>No workflows yet. Create one or use the AI Builder.</p>
            </div>
          )}
          {workflows.map(wf => (
            <div key={wf._id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{wf.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${wf.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {wf.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{wf.category}</span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{wf.description || '—'}</p>
                <p className="text-xs text-gray-400 mt-1">Trigger: {wf.trigger_type} · Steps: {wf.steps?.length || 0} · Runs: {wf.run_count}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => runWorkflow(wf._id)}
                  className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100">▶ Run</button>
                <button onClick={() => toggleActive(wf)}
                  className="text-xs bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100">
                  {wf.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'create' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-800">New Workflow</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Invoice Auto-Generation" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Trigger Type</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.trigger_type}
                onChange={e => setForm(f => ({ ...f, trigger_type: e.target.value }))}>
                {TRIGGER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this workflow do?" /></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-700">Steps</h4>
              <button onClick={addStep} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100">+ Add Step</button>
            </div>
            {form.steps.map((step, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3 mb-2 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center">{i+1}</span>
                  <input className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm" placeholder="Step name"
                    value={step.name} onChange={e => updateStep(i, 'name', e.target.value)} />
                  <select className="border border-gray-300 rounded px-2 py-1 text-sm" value={step.action_type}
                    onChange={e => updateStep(i, 'action_type', e.target.value)}>
                    {ACTION_TYPES.map(a => <option key={a} value={a}>{a.replace('_', ' ')}</option>)}
                  </select>
                  <button onClick={() => removeStep(i)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                </div>
              </div>
            ))}
            {form.steps.length === 0 && <p className="text-sm text-gray-400 py-3 text-center">No steps yet — click Add Step</p>}
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={saving || !form.name}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Workflow'}
            </button>
            <button onClick={() => setTab('list')} className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {tab === 'ai' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-5">
            <h3 className="font-semibold text-purple-900 mb-1">🤖 AI Workflow Builder</h3>
            <p className="text-sm text-purple-700 mb-4">Describe what you want to automate and AI will generate a workflow.</p>
            <div className="flex gap-2">
              <input className="flex-1 border border-purple-200 bg-white rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. When a new lead is created, assign it based on region and send welcome email"
                value={aiDesc} onChange={e => setAiDesc(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && aiGenerate()} />
              <button onClick={aiGenerate} disabled={aiLoading || !aiDesc.trim()}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 whitespace-nowrap">
                {aiLoading ? 'Generating…' : '✨ Generate'}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {['Auto-assign leads by region','Generate invoice on shipment delivery','Send payment reminder 3 days before due',
                'Route complaints by type to team','Schedule daily executive report'].map(ex => (
                <button key={ex} onClick={() => setAiDesc(ex)}
                  className="text-xs bg-white border border-purple-200 text-purple-700 px-2 py-1 rounded hover:bg-purple-50">{ex}</button>
              ))}
            </div>
          </div>

          {aiDraft && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">Generated Workflow: {aiDraft.name}</h3>
                <button onClick={useAiDraft} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">Use This Workflow</button>
              </div>
              <p className="text-sm text-gray-500 mb-3">{aiDraft.description}</p>
              <div className="space-y-2">
                {(aiDraft.steps || []).map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-indigo-50 rounded-lg">
                    <span className="text-xs font-bold bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center">{i+1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.action_type}</p>
                    </div>
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
