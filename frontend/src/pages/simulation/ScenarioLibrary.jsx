import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const CAT_COLOR = { demand:'blue', supply:'purple', risk:'red', cost:'yellow', capacity:'indigo', route:'green', weather:'cyan', custom:'gray', fleet:'orange', carbon:'emerald' };

export default function ScenarioLibrary() {
  const [templates, setTemplates] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [tab, setTab]             = useState('library');
  const [deploying, setDeploying] = useState(null);

  const load = async () => {
    const [libRes, scRes] = await Promise.all([
      fetch(`${_BASE}/scenarios/library`, { headers: h() }),
      fetch(`${_BASE}/scenarios`, { headers: h() }),
    ]);
    if (libRes.ok) { const d = await libRes.json(); setTemplates(d.data.templates || []); }
    if (scRes.ok)  { const d = await scRes.json(); setScenarios(d.data.scenarios || []); }
  };

  useEffect(() => { load(); }, []);

  const deployTemplate = async (tpl) => {
    setDeploying(tpl.name);
    await fetch(`${_BASE}/scenarios/from-template`, {
      method: 'POST', headers: h(),
      body: JSON.stringify({ template_name: tpl.name }),
    });
    setDeploying(null); load(); setTab('saved');
  };

  const acceptRec = async (id) => {
    await fetch(`${_BASE}/scenarios/recommendations/${id}/accept`, { method: 'PUT', headers: h() });
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scenario Library</h1>
        <p className="text-gray-500 text-sm mt-1">Ready-to-use scenario templates and your saved scenarios</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {[['library','Templates'],['saved','Saved Scenarios']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab===k ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>{l}</button>
        ))}
      </div>

      {tab === 'library' && (
        <div className="grid grid-cols-2 gap-4">
          {templates.map(tpl => {
            const color = CAT_COLOR[tpl.category] || 'gray';
            return (
              <div key={tpl.name} className={`bg-white rounded-xl border border-gray-200 p-5 border-t-4 border-t-${color}-400`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{tpl.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-${color}-100 text-${color}-700 mt-1 inline-block`}>{tpl.category}</span>
                    <p className="text-sm text-gray-500 mt-2">{tpl.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => deployTemplate(tpl)}
                  disabled={deploying === tpl.name}
                  className="mt-3 w-full bg-blue-600 text-white rounded-lg py-1.5 text-sm hover:bg-blue-700"
                >
                  {deploying === tpl.name ? 'Creating...' : 'Use Template'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'saved' && (
        <div className="space-y-3">
          {scenarios.length === 0 && <div className="bg-white rounded-xl border p-8 text-center text-gray-400">No saved scenarios. Use a template or build one.</div>}
          {scenarios.map(sc => {
            const color = CAT_COLOR[sc.category] || 'gray';
            return (
              <div key={sc._id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{sc.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-${color}-100 text-${color}-700`}>{sc.category}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{sc.description}</p>
                    {sc.template && <p className="text-xs text-gray-400 mt-0.5">From template: {sc.template}</p>}
                  </div>
                  <div className="text-xs text-gray-400">{new Date(sc.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
