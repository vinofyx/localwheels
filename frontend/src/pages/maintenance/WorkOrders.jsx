import { useState, useEffect } from 'react';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

const STATUS_COLOR = {
  draft: 'bg-gray-100 text-gray-600',
  open: 'bg-blue-100 text-blue-700',
  assigned: 'bg-indigo-100 text-indigo-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  awaiting_parts: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  on_hold: 'bg-gray-100 text-gray-500',
};

const PRIORITY_COLOR = {
  low: 'text-gray-500', normal: 'text-blue-600', high: 'text-orange-600', urgent: 'text-red-600', critical: 'text-red-700 font-bold',
};

export default function WorkOrders() {
  const [workOrders, setWorkOrders] = useState([]);
  const [summary, setSummary] = useState({});
  const [statusCounts, setStatusCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', vehicle_id: '', priority: 'normal', category: 'predictive' });
  const [vehicles, setVehicles] = useState([]);
  const [updating, setUpdating] = useState(null);

  const load = () => {
    const params = filter ? `?status=${filter}&limit=30` : '?limit=30';
    Promise.all([
      api.get(`${_BASE}/workorders${params}`),
      api.get(`${_BASE}/workorders/stats/summary`),
    ])
      .then(([r, s]) => { setWorkOrders(r.data.workOrders || []); setStatusCounts(r.data.status_counts || []); setSummary(s.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  useEffect(() => {
    api.get(`${_BASE}/fleet/vehicles?limit=50`).then(r => setVehicles(r.data.vehicles || r.data || [])).catch(() => {});
  }, []);

  const create = async () => {
    if (!form.title || !form.vehicle_id) return;
    setCreating(true);
    try {
      await api.post(`${_BASE}/workorders`, { title: form.title, fleet_vehicle_id: form.vehicle_id, priority: form.priority, category: form.category, status: 'open' });
      setShowCreate(false);
      setForm({ title: '', vehicle_id: '', priority: 'normal', category: 'predictive' });
      load();
    } catch {}
    setCreating(false);
  };

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.put(`${_BASE}/workorders/${id}`, { status });
      load();
    } catch {}
    setUpdating(null);
  };

  const statusList = ['', 'open', 'assigned', 'in_progress', 'awaiting_parts', 'completed', 'cancelled'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">+ New Work Order</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: summary.total || 0, color: 'gray' },
          { label: 'Open', value: summary.open || 0, color: 'blue' },
          { label: 'Completed', value: summary.completed || 0, color: 'green' },
          { label: 'Total Cost', value: summary.total_cost ? '₹' + Math.round(summary.total_cost / 1000) + 'K' : '₹0', color: 'purple' },
        ].map(s => (
          <div key={s.label} className={`border rounded-xl p-4 ${s.color === 'green' ? 'bg-green-50 border-green-200' : s.color === 'blue' ? 'bg-blue-50 border-blue-200' : s.color === 'purple' ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className={`text-2xl font-bold ${s.color === 'green' ? 'text-green-700' : s.color === 'blue' ? 'text-blue-700' : s.color === 'purple' ? 'text-purple-700' : 'text-gray-700'}`}>{s.value}</div>
            <div className="text-xs text-gray-600 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Create Work Order</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Work order title *" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
            <select value={form.vehicle_id} onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
              <option value="">Select Vehicle *</option>
              {vehicles.map(v => <option key={v._id} value={v._id}>{v.vehicle_number}</option>)}
            </select>
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
              <option value="low">Low Priority</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
              <option value="critical">Critical</option>
            </select>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
              <option value="preventive">Preventive</option>
              <option value="predictive">Predictive</option>
              <option value="corrective">Corrective</option>
              <option value="compliance">Compliance</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={create} disabled={creating || !form.title || !form.vehicle_id} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">{creating ? 'Creating...' : 'Create'}</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-300 text-sm rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {statusList.map(s => (
          <button key={s || 'all'} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-lg capitalize ${filter === s ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-8 text-center text-gray-400">Loading...</div>
      ) : workOrders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
          <div className="text-4xl mb-2">🔧</div>
          <div>No work orders found</div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">WO #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Vehicle</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Cost</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {workOrders.map(wo => (
                <tr key={wo._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{wo.wo_number || '—'}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{wo.title}</td>
                  <td className="px-4 py-3 text-gray-600">{wo.fleet_vehicle_id?.vehicle_number || wo.vehicle_number || '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-medium capitalize ${PRIORITY_COLOR[wo.priority]}`}>{wo.priority}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[wo.status]}`}>{wo.status?.replace('_', ' ')}</span></td>
                  <td className="px-4 py-3 text-right text-gray-700">{wo.total_cost ? '₹' + wo.total_cost.toLocaleString() : '—'}</td>
                  <td className="px-4 py-3">
                    <select value={wo.status} onChange={e => updateStatus(wo._id, e.target.value)} disabled={updating === wo._id}
                      className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-indigo-400 disabled:opacity-50">
                      {['open','assigned','in_progress','awaiting_parts','completed','cancelled'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
