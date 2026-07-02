import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h  = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });
const jh = () => ({ ...h(), 'Content-Type': 'application/json' });

const STATUS_COLOR = { success:'bg-green-100 text-green-700', failed:'bg-red-100 text-red-700', running:'bg-blue-100 text-blue-700', skipped:'bg-gray-100 text-gray-500' };

export default function EnterpriseSchedulerPage() {
  const [tab, setTab]       = useState('list');
  const [data, setData]     = useState({ schedules: [], total: 0 });
  const [overview, setOvr]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '', schedule_type: 'daily', timezone: 'Africa/Nairobi' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch(`${_BASE}/scheduler`, { headers: h() }).then(r => r.json()),
      fetch(`${_BASE}/scheduler/stats/overview`, { headers: h() }).then(r => r.json()),
    ]).then(([s, o]) => {
      setData({ schedules: s.data?.schedules || [], total: s.data?.total || 0 });
      setOvr(o.data || o);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    setSaving(true);
    try {
      await fetch(`${_BASE}/scheduler`, { method: 'POST', headers: jh(), body: JSON.stringify(form) });
      setForm({ name: '', description: '', schedule_type: 'daily', timezone: 'Africa/Nairobi' });
      load(); setTab('list');
    } catch (_) {} finally { setSaving(false); }
  };

  const runNow = async id => {
    await fetch(`${_BASE}/scheduler/${id}/run-now`, { method: 'POST', headers: jh(), body: '{}' });
    alert('Schedule triggered!'); load();
  };

  const remove = async id => {
    if (!confirm('Delete this schedule?')) return;
    await fetch(`${_BASE}/scheduler/${id}`, { method: 'DELETE', headers: h() });
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Enterprise Scheduler</h1>
        <p className="text-sm text-gray-500 mt-1">Automate recurring tasks on a schedule</p>
      </div>

      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[['Total Schedules', overview.total],['Active', overview.active,'text-green-600'],['Due in 1h', overview.due_in_hour,'text-yellow-600'],['Upcoming', overview.upcoming?.length || 0]].map(([l,v,c]) => (
            <div key={l} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
              <p className="text-xs text-gray-500">{l}</p>
              <p className={`text-2xl font-bold mt-0.5 ${c || 'text-gray-900'}`}>{v ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200">
        {[['list','Schedules'],['create','New Schedule'],['upcoming','Upcoming']].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{l}</button>
        ))}
      </div>

      {tab === 'list' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Name','Type','Next Run','Last Run','Status','Actions'].map(c => (
                <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{c}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading…</td></tr>}
              {!loading && data.schedules.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No schedules yet</td></tr>
              )}
              {data.schedules.map(s => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{s.schedule_type}</td>
                  <td className="px-4 py-3 text-gray-600">{s.next_run_at ? new Date(s.next_run_at).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.last_run_at ? new Date(s.last_run_at).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[s.last_status] || 'bg-gray-100 text-gray-500'}`}>{s.last_status || 'pending'}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => runNow(s._id)} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100">Run</button>
                      <button onClick={() => remove(s._id)}  className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'create' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-800">New Schedule</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Daily Executive Report" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Schedule Type</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.schedule_type}
                onChange={e => setForm(f => ({ ...f, schedule_type: e.target.value }))}>
                {['once','minutely','hourly','daily','weekly','monthly','cron'].map(t => <option key={t} value={t}>{t}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.timezone}
                onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}>
                {['Africa/Nairobi','UTC','Africa/Lagos','Africa/Cairo','Africa/Johannesburg'].map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this schedule do?" /></div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={create} disabled={saving || !form.name}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Create Schedule'}
            </button>
            <button onClick={() => setTab('list')} className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {tab === 'upcoming' && overview?.upcoming && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-700">Next 5 Upcoming Runs</h3>
          {overview.upcoming.map(s => (
            <div key={s._id} className="bg-white rounded-lg border border-gray-100 p-4 flex justify-between items-center shadow-sm">
              <div>
                <p className="font-medium text-gray-900">{s.name}</p>
                <p className="text-sm text-gray-500 capitalize">{s.schedule_type} schedule</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-indigo-600">{s.next_run_at ? new Date(s.next_run_at).toLocaleString() : '—'}</p>
                <p className="text-xs text-gray-400">Runs: {s.run_count}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
