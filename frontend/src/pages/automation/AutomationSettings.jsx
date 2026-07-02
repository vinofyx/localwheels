import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h  = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });
const jh = () => ({ ...h(), 'Content-Type': 'application/json' });

export default function AutomationSettings() {
  const [rules, setRules]   = useState([]);
  const [tab, setTab]       = useState('rules');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', rule_type: 'custom', description: '', priority: 5, condition_logic: 'AND' });
  const [saving, setSaving] = useState(false);

  const RULE_TYPES = ['lead_assignment','quote_generation','shipment_creation','vehicle_allocation','driver_allocation','dispatch_planning','warehouse_putaway','inventory_replenishment','invoice_generation','payment_reminder','complaint_routing','document_classification','maintenance_scheduling','supplier_approval','executive_report','custom'];

  const loadRules = () => {
    setLoading(true);
    fetch(`${_BASE}/automation/rules/list`, { headers: h() }).then(r => r.json())
      .then(r => setRules(r.data?.rules || [])).finally(() => setLoading(false));
  };
  useEffect(() => { loadRules(); }, []);

  const createRule = async () => {
    setSaving(true);
    try {
      await fetch(`${_BASE}/automation/rules`, { method: 'POST', headers: jh(), body: JSON.stringify(form) });
      setForm({ name: '', rule_type: 'custom', description: '', priority: 5, condition_logic: 'AND' });
      loadRules(); setTab('rules');
    } catch (_) {} finally { setSaving(false); }
  };

  const toggleRule = async (rule) => {
    await fetch(`${_BASE}/automation/rules/${rule._id}`, { method: 'PUT', headers: jh(), body: JSON.stringify({ is_active: !rule.is_active }) });
    loadRules();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Automation Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure automation rules and global settings</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {[['rules','Rules'],['create','New Rule'],['global','Global Settings']].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{l}</button>
        ))}
      </div>

      {tab === 'rules' && (
        <div className="space-y-2">
          {loading && <div className="text-center py-10 text-gray-400">Loading…</div>}
          {!loading && rules.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">⚙️</p>
              <p>No automation rules configured yet.</p>
              <button onClick={() => setTab('create')} className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">Create First Rule</button>
            </div>
          )}
          {rules.map(rule => (
            <div key={rule._id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">{rule.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${rule.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{rule.rule_type.replace(/_/g,' ')}</span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{rule.description || '—'}</p>
                <p className="text-xs text-gray-400 mt-0.5">Priority: {rule.priority} · Logic: {rule.condition_logic} · Triggers: {rule.trigger_count}</p>
              </div>
              <button onClick={() => toggleRule(rule)}
                className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                {rule.is_active ? 'Disable' : 'Enable'}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'create' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-800">New Automation Rule</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Rule Name *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Auto-assign Nairobi leads" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Rule Type</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.rule_type}
                onChange={e => setForm(f => ({ ...f, rule_type: e.target.value }))}>
                {RULE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Priority (1=highest)</label>
              <input type="number" min={1} max={10} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.priority} onChange={e => setForm(f => ({ ...f, priority: +e.target.value }))} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Condition Logic</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.condition_logic}
                onChange={e => setForm(f => ({ ...f, condition_logic: e.target.value }))}>
                <option value="AND">AND (all conditions)</option>
                <option value="OR">OR (any condition)</option>
              </select></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this rule do?" /></div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={createRule} disabled={saving || !form.name}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Create Rule'}
            </button>
            <button onClick={() => setTab('rules')} className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {tab === 'global' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">Global Automation Settings</h3>
            {[
              ['Max Concurrent Jobs', '10', 'number'],
              ['Job Retry Limit', '3', 'number'],
              ['Job Timeout (minutes)', '30', 'number'],
              ['Email Notifications', 'enabled', 'text'],
              ['Automation Log Retention (days)', '90', 'number'],
            ].map(([label, def, type]) => (
              <div key={label} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{label}</span>
                <input type={type} defaultValue={def}
                  className="w-24 border border-gray-300 rounded px-2 py-1 text-sm text-right" />
              </div>
            ))}
          </div>
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-sm text-yellow-800">
            ⚠️ Global settings apply to all automation workflows. Changes take effect on next execution.
          </div>
          <button className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-indigo-700">Save Settings</button>
        </div>
      )}
    </div>
  );
}
