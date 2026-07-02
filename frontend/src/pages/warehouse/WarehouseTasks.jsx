import { useState, useEffect } from 'react';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const STATUS_COLOR = { pending: 'bg-gray-100 text-gray-600', assigned: 'bg-blue-100 text-blue-700', in_progress: 'bg-yellow-100 text-yellow-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-600', on_hold: 'bg-orange-100 text-orange-700' };
const PRIORITY_COLOR = { low: 'text-gray-400', medium: 'text-blue-500', high: 'text-orange-500', urgent: 'text-red-600' };
const TYPE_ICON = { receive: '📥', put_away: '📦', pick: '🛒', pack: '📫', cycle_count: '🔢', transfer: '↔️', replenish: '🔄', cross_dock: '⚡', quality_check: '✅', damage_report: '⚠️' };

export default function WarehouseTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWH, setSelectedWH] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusCounts, setStatusCounts] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ items: [] });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get(`${_BASE}/warehouses`).then(r => {
      const whs = r.data?.data?.warehouses || [];
      setWarehouses(whs);
      if (whs.length) setSelectedWH(whs[0]._id);
    }).catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    const q = new URLSearchParams({ limit: 50 });
    if (selectedWH) q.set('warehouse_id', selectedWH);
    if (statusFilter) q.set('status', statusFilter);
    if (typeFilter) q.set('task_type', typeFilter);
    api.get(`${_BASE}/tasks?${q}`).then(r => {
      setTasks(r.data.tasks || []);
      setStatusCounts(r.data.status_counts || {});
    }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [selectedWH, statusFilter, typeFilter]);

  const taskAction = async (id, action) => {
    try {
      await api.put(`${_BASE}/tasks/${id}/${action}`, {});
      load();
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
  };

  const createTask = async () => {
    setSaving(true); setMsg('');
    try {
      await api.post(`${_BASE}/tasks`, { ...form, warehouse_id: selectedWH });
      setMsg('Task created'); setShowCreate(false); setForm({ items: [] }); load();
    } catch (e) { setMsg(e.response?.data?.error || 'Error'); }
    setSaving(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Warehouse Tasks</h1><p className="text-sm text-gray-500 mt-0.5">Receive, put-away, pick, pack, cycle count & transfer tasks</p></div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">+ Create Task</button>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <select value={selectedWH} onChange={e => setSelectedWH(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
        </select>
        <div className="flex gap-1 flex-wrap">
          {['','pending','assigned','in_progress','completed'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}>
              {s || 'All'}{statusCounts[s] ? ` (${statusCounts[s]})` : ''}
            </button>
          ))}
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All Types</option>
          {Object.keys(TYPE_ICON).map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
        </select>
      </div>

      {showCreate && (
        <div className="bg-white border border-indigo-200 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold">Create Task</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><label className="text-xs text-gray-500 mb-1 block">Task Type *</label>
              <select value={form.task_type || ''} onChange={e => setForm(p => ({ ...p, task_type: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select...</option>
                {Object.keys(TYPE_ICON).map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
              </select></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Priority</label>
              <select value={form.priority || 'medium'} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p}</option>)}
              </select></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Assigned To</label>
              <input value={form.assigned_to_name || ''} onChange={e => setForm(p => ({ ...p, assigned_to_name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Reference</label>
              <input value={form.reference_number || ''} onChange={e => setForm(p => ({ ...p, reference_number: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          {msg && <div className="text-sm text-red-600">{msg}</div>}
          <div className="flex gap-3"><button onClick={createTask} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg disabled:opacity-50">{saving ? '...' : 'Create'}</button><button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-300 text-sm rounded-lg">Cancel</button></div>
        </div>
      )}

      {loading ? <div className="py-12 text-center text-gray-400">Loading...</div> : (
        <div className="space-y-3">
          {tasks.map(t => (
            <div key={t._id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{TYPE_ICON[t.task_type] || '📋'}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">{t.task_number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[t.status]}`}>{t.status?.replace('_',' ')}</span>
                      <span className={`text-xs font-medium ${PRIORITY_COLOR[t.priority]}`}>● {t.priority}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">{t.task_type?.replace('_',' ')} · {t.assigned_to_name || 'Unassigned'}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{t.items_done || 0}/{t.total_items || 0} items · {t.reference_number}</div>
                    {t.ai_picking_route?.length > 0 && <div className="text-xs text-indigo-600 mt-1">🤖 AI Route: {t.ai_picking_route.map(r => r.bin_code).join(' → ')}</div>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {t.status === 'pending' && <button onClick={() => taskAction(t._id, 'start')} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg">Start</button>}
                  {t.status === 'in_progress' && <button onClick={() => taskAction(t._id, 'complete')} className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg">Complete</button>}
                </div>
              </div>
            </div>
          ))}
          {tasks.length === 0 && <div className="text-center py-12 text-gray-400">No tasks found.</div>}
        </div>
      )}
    </div>
  );
}
