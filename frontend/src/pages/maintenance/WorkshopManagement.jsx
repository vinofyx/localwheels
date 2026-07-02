import { useState, useEffect } from 'react';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

export default function WorkshopManagement() {
  const [workshops, setWorkshops] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'authorized', city: '', address: '', contact_name: '', contact_phone: '', capacity_bays: 4, labour_rate_per_hr: 500 });
  const [creating, setCreating] = useState(false);
  const [mechForm, setMechForm] = useState({ name: '', specialization: '', experience_years: '' });

  const load = () => {
    Promise.all([
      api.get(`${_BASE}/workshops`),
      api.get(`${_BASE}/workshops/stats/summary`),
    ])
      .then(([w, s]) => { setWorkshops(w.data.workshops || []); setStats(s.data.stats || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name) return;
    setCreating(true);
    try {
      await api.post(`${_BASE}/workshops`, form);
      setShowCreate(false);
      setForm({ name: '', type: 'authorized', city: '', address: '', contact_name: '', contact_phone: '', capacity_bays: 4, labour_rate_per_hr: 500 });
      load();
    } catch {}
    setCreating(false);
  };

  const addMechanic = async (wsId) => {
    if (!mechForm.name) return;
    try {
      await api.post(`${_BASE}/workshops/${wsId}/mechanics`, { ...mechForm, specialization: mechForm.specialization ? [mechForm.specialization] : [] });
      setMechForm({ name: '', specialization: '', experience_years: '' });
      load();
    } catch {}
  };

  const typeColors = { in_house: 'bg-blue-100 text-blue-700', authorized: 'bg-green-100 text-green-700', third_party: 'bg-yellow-100 text-yellow-700', mobile: 'bg-purple-100 text-purple-700' };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Workshop Management</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">+ Add Workshop</button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">New Workshop</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { k: 'name', p: 'Workshop name *', type: 'text' },
              { k: 'city', p: 'City', type: 'text' },
              { k: 'address', p: 'Address', type: 'text' },
              { k: 'contact_name', p: 'Contact person', type: 'text' },
              { k: 'contact_phone', p: 'Phone', type: 'text' },
              { k: 'capacity_bays', p: 'Capacity (bays)', type: 'number' },
            ].map(f => (
              <input key={f.k} type={f.type} value={form[f.k]} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.p}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
            ))}
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
              {['in_house','authorized','third_party','mobile'].map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
            </select>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={create} disabled={creating || !form.name} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">{creating ? 'Creating...' : 'Create Workshop'}</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-300 text-sm rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : workshops.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
          <div className="text-4xl mb-2">🏭</div>
          <div>No workshops registered. Add your first workshop.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workshops.map(w => {
            const wStats = stats.find(s => s._id?.toString() === w._id?.toString()) || {};
            return (
              <div key={w._id} className={`bg-white border rounded-xl overflow-hidden ${selected?._id === w._id ? 'border-indigo-400' : 'border-gray-200'}`}>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">{w.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{w.city} {w.address ? `• ${w.address}` : ''}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[w.type] || 'bg-gray-100 text-gray-600'}`}>{w.type?.replace('_', ' ')}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center bg-gray-50 rounded-lg p-2">
                      <div className="text-lg font-bold text-blue-600">{wStats.open_wos || 0}</div>
                      <div className="text-xs text-gray-500">Active WOs</div>
                    </div>
                    <div className="text-center bg-gray-50 rounded-lg p-2">
                      <div className="text-lg font-bold text-green-600">{wStats.completed_wos || 0}</div>
                      <div className="text-xs text-gray-500">Completed</div>
                    </div>
                    <div className="text-center bg-gray-50 rounded-lg p-2">
                      <div className="text-lg font-bold text-indigo-600">{w.capacity_bays}</div>
                      <div className="text-xs text-gray-500">Bays</div>
                    </div>
                  </div>

                  {w.contact_name && <p className="text-xs text-gray-500">📞 {w.contact_name} {w.contact_phone ? `• ${w.contact_phone}` : ''}</p>}

                  <div className="flex items-center justify-between mt-3">
                    <div className="text-xs text-gray-400">{w.mechanics?.length || 0} mechanics</div>
                    <button onClick={() => setSelected(selected?._id === w._id ? null : w)} className="text-xs text-indigo-600 hover:underline">
                      {selected?._id === w._id ? 'Close' : 'Manage Mechanics'}
                    </button>
                  </div>
                </div>

                {selected?._id === w._id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <h4 className="text-xs font-semibold text-gray-600 mb-3">Mechanics</h4>
                    <div className="space-y-2 mb-3">
                      {w.mechanics?.map(m => (
                        <div key={m._id} className="flex items-center justify-between text-xs bg-white rounded-lg p-2 border border-gray-100">
                          <div>
                            <span className="font-medium text-gray-700">{m.name}</span>
                            {m.specialization?.length > 0 && <span className="text-gray-400 ml-2">• {m.specialization.join(', ')}</span>}
                          </div>
                          <span className={`px-1.5 py-0.5 rounded-full ${m.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{m.is_available ? 'Available' : 'Busy'}</span>
                        </div>
                      ))}
                      {!w.mechanics?.length && <div className="text-xs text-gray-400">No mechanics added</div>}
                    </div>
                    <div className="flex gap-2">
                      <input value={mechForm.name} onChange={e => setMechForm(f => ({ ...f, name: e.target.value }))} placeholder="Mechanic name" className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none" />
                      <input value={mechForm.specialization} onChange={e => setMechForm(f => ({ ...f, specialization: e.target.value }))} placeholder="Specialization" className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none" />
                      <button onClick={() => addMechanic(w._id)} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700">Add</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
