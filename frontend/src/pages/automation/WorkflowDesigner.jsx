import { useState } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h  = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });
const jh = () => ({ ...h(), 'Content-Type': 'application/json' });

const ACTION_TYPES = ['send_email','send_sms','create_record','update_record','call_api','run_query','generate_report','notify_user','assign_task','wait','condition','custom'];
const ACTION_ICONS = { send_email:'📧', send_sms:'💬', create_record:'➕', update_record:'✏️', call_api:'🌐', run_query:'🔍', generate_report:'📊', notify_user:'🔔', assign_task:'👤', wait:'⏱️', condition:'🔀', custom:'⚙️' };

export default function WorkflowDesigner() {
  const [steps, setSteps]     = useState([]);
  const [name, setName]       = useState('');
  const [category, setCategory] = useState('custom');
  const [triggerType, setTriggerType] = useState('manual');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  const addStep = (type = 'custom') => {
    const s = { id: Date.now(), step_number: steps.length + 1, name: `Step ${steps.length + 1}`, action_type: type, action_config: {}, description: '' };
    setSteps(prev => [...prev, s]);
    setSelected(s.id);
  };

  const updateStep = (id, field, val) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  const removeStep = id => {
    setSteps(prev => {
      const filtered = prev.filter(s => s.id !== id);
      return filtered.map((s, i) => ({ ...s, step_number: i + 1 }));
    });
    if (selected === id) setSelected(null);
  };

  const moveUp = id => {
    setSteps(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx === 0) return prev;
      const next = [...prev];
      [next[idx-1], next[idx]] = [next[idx], next[idx-1]];
      return next.map((s, i) => ({ ...s, step_number: i + 1 }));
    });
  };

  const moveDown = id => {
    setSteps(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx === prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx+1]] = [next[idx+1], next[idx]];
      return next.map((s, i) => ({ ...s, step_number: i + 1 }));
    });
  };

  const save = async () => {
    if (!name.trim() || steps.length === 0) return;
    setSaving(true);
    try {
      const payload = {
        name, description, category, trigger_type: triggerType,
        steps: steps.map(({ id, ...s }) => s),
      };
      await fetch(`${_BASE}/automation`, { method: 'POST', headers: jh(), body: JSON.stringify(payload) });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (_) {} finally { setSaving(false); }
  };

  const selectedStep = steps.find(s => s.id === selected);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflow Designer</h1>
          <p className="text-sm text-gray-500 mt-1">Visually design automation workflows step by step</p>
        </div>
        <div className="flex gap-2">
          {saved && <span className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">✅ Saved!</span>}
          <button onClick={save} disabled={saving || !name || steps.length === 0}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Saving…' : '💾 Save Workflow'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Workflow Name *</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={name}
            onChange={e => setName(e.target.value)} placeholder="e.g. Invoice Auto-Generation" /></div>
        <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Category</label>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={category} onChange={e => setCategory(e.target.value)}>
            {['logistics','fleet','warehouse','crm','finance','hr','compliance','custom'].map(c => <option key={c} value={c}>{c}</option>)}
          </select></div>
        <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Trigger</label>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={triggerType} onChange={e => setTriggerType(e.target.value)}>
            {['schedule','event','manual','webhook','condition','api'].map(t => <option key={t} value={t}>{t}</option>)}
          </select></div>
        <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Description</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={description}
            onChange={e => setDescription(e.target.value)} placeholder="Describe the workflow purpose" /></div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Steps ({steps.length})</h3>
          </div>

          {steps.length === 0 && (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
              <p className="text-2xl mb-2">🔄</p>
              <p className="text-sm">Add steps using the action palette below</p>
            </div>
          )}

          <div className="space-y-2">
            {steps.map((step, i) => (
              <div key={step.id}
                onClick={() => setSelected(step.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selected === step.id ? 'border-indigo-400 bg-indigo-50 shadow-md' : 'border-gray-100 bg-white hover:border-indigo-200 shadow-sm'}`}>
                <div className="flex flex-col gap-0.5">
                  <button onClick={e => { e.stopPropagation(); moveUp(step.id); }} disabled={i === 0}
                    className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30 leading-none">▲</button>
                  <button onClick={e => { e.stopPropagation(); moveDown(step.id); }} disabled={i === steps.length - 1}
                    className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30 leading-none">▼</button>
                </div>
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{step.step_number}</span>
                <span className="text-lg">{ACTION_ICONS[step.action_type] || '⚙️'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{step.name}</p>
                  <p className="text-xs text-gray-400">{step.action_type}</p>
                </div>
                {step.description && <p className="text-xs text-gray-400 max-w-32 truncate hidden md:block">{step.description}</p>}
                <button onClick={e => { e.stopPropagation(); removeStep(step.id); }}
                  className="text-red-300 hover:text-red-500 text-sm flex-shrink-0">✕</button>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-xl border border-gray-200 p-3">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Add Action</p>
            <div className="flex flex-wrap gap-1.5">
              {ACTION_TYPES.map(t => (
                <button key={t} onClick={() => addStep(t)}
                  className="flex items-center gap-1 text-xs border border-gray-200 bg-white text-gray-700 px-2 py-1.5 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors">
                  <span>{ACTION_ICONS[t]}</span> {t.replace(/_/g,' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {selectedStep && (
          <div className="w-64 xl:w-80 bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex-shrink-0">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>{ACTION_ICONS[selectedStep.action_type]}</span> Edit Step
            </h4>
            <div className="space-y-3">
              <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Name</label>
                <input className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" value={selectedStep.name}
                  onChange={e => updateStep(selectedStep.id, 'name', e.target.value)} /></div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Action Type</label>
                <select className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" value={selectedStep.action_type}
                  onChange={e => updateStep(selectedStep.id, 'action_type', e.target.value)}>
                  {ACTION_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
                </select></div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Description</label>
                <textarea className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" rows={2}
                  value={selectedStep.description}
                  onChange={e => updateStep(selectedStep.id, 'description', e.target.value)}
                  placeholder="What does this step do?" /></div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Config (JSON)</label>
                <textarea className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-mono" rows={4}
                  defaultValue="{}"
                  onChange={e => { try { updateStep(selectedStep.id, 'action_config', JSON.parse(e.target.value)); } catch(_){} }}
                  placeholder='{"key": "value"}' /></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
