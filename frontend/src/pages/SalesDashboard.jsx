import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { TrendingUp, Users, Calendar, CheckSquare, DollarSign, Target, Activity, RefreshCw, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

function KpiCard({ label, value, sub, icon: Icon, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-600',   green:  'bg-green-600',
    orange: 'bg-orange-500', red:    'bg-red-600',
    purple: 'bg-purple-600', indigo: 'bg-indigo-600',
  };
  return (
    <div className="bg-slate-800 rounded-xl p-4 flex items-start gap-3">
      <div className={`${colors[color]} rounded-lg p-2 flex-shrink-0`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function fmt(n) {
  if (n >= 100000) return `₹${(n/100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n/1000).toFixed(1)}K`;
  return `₹${n}`;
}

export default function SalesDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: d } = await api.get('/sales/dashboard');
      setData(d);
    } catch { /* empty pipeline */ setData(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const k = data?.kpis || {};

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Sales Dashboard</h1>
          <p className="text-sm text-slate-400">AI-powered CRM & Sales Pipeline</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <Link to="/sales/leads/new" className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
            <Plus size={14} /> New Lead
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Today's Leads"    value={k.todayLeads     ?? '—'} icon={Users}      color="blue"   />
        <KpiCard label="Qualified"         value={k.qualifiedLeads ?? '—'} icon={TrendingUp}  color="green"  />
        <KpiCard label="Pending Follow-ups"value={k.pendingFollowups ?? '—'} icon={CheckSquare} color="orange" />
        <KpiCard label="Meetings Today"   value={k.meetingsToday   ?? '—'} icon={Calendar}    color="purple" />
        <KpiCard label="Won This Month"   value={k.wonThisMonth    ?? '—'} icon={Target}      color="green"  sub="Deals closed" />
        <KpiCard label="Won Revenue"      value={fmt(k.wonRevenue  || 0)}   icon={DollarSign}  color="indigo" sub="This month" />
        <KpiCard label="Pipeline Total"   value={fmt(k.pipelineTotal || 0)} icon={Activity}    color="blue"   sub={`Weighted: ${fmt(k.pipelineWeighted || 0)}`} />
        <KpiCard label="Lost Deals"       value={k.lostThisMonth   ?? '—'} icon={TrendingUp}  color="red"    sub="This month" />
      </div>

      {/* Sales Target */}
      {data?.target && (
        <div className="bg-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-200 mb-3">Monthly Sales Target</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Revenue', actual: data.target.revenue_actual, target: data.target.revenue_target, isMoney: true },
              { label: 'Leads',   actual: data.target.leads_actual,   target: data.target.leads_target },
              { label: 'Deals',   actual: data.target.deals_actual,   target: data.target.deals_target },
            ].map(({ label, actual, target: t, isMoney }) => {
              const pct = t > 0 ? Math.min(100, Math.round((actual / t) * 100)) : 0;
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>{label}</span><span>{pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{isMoney ? `${fmt(actual)} / ${fmt(t)}` : `${actual} / ${t}`}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Overdue Tasks */}
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-200">Overdue Follow-ups</h2>
            <Link to="/sales/tasks" className="text-xs text-blue-400 hover:text-blue-300">View all</Link>
          </div>
          {!data?.overdueTasks?.length ? (
            <p className="text-xs text-slate-500 text-center py-4">No overdue tasks 🎉</p>
          ) : data.overdueTasks.map(t => (
            <div key={t._id} className="flex items-center gap-2 py-2 border-b border-slate-700 last:border-0">
              <span className="text-orange-400 text-lg">⚠</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 truncate">{t.title}</p>
                <p className="text-xs text-red-400">Due {new Date(t.due_date).toLocaleDateString()}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${t.priority === 'urgent' ? 'bg-red-900 text-red-300' : 'bg-orange-900 text-orange-300'}`}>{t.priority}</span>
            </div>
          ))}
        </div>

        {/* Upcoming Meetings */}
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-200">Upcoming Meetings</h2>
            <Link to="/sales/meetings" className="text-xs text-blue-400 hover:text-blue-300">View all</Link>
          </div>
          {!data?.upcomingMeetings?.length ? (
            <p className="text-xs text-slate-500 text-center py-4">No upcoming meetings</p>
          ) : data.upcomingMeetings.map(m => (
            <div key={m._id} className="flex items-center gap-2 py-2 border-b border-slate-700 last:border-0">
              <span className="text-blue-400 text-lg">📅</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 truncate">{m.title}</p>
                <p className="text-xs text-slate-400">{new Date(m.scheduled_at).toLocaleString()}</p>
              </div>
              <span className="text-xs px-2 py-0.5 bg-blue-900 text-blue-300 rounded-full">{m.meeting_type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-200">Recent Activity</h2>
          <Link to="/sales/leads" className="text-xs text-blue-400 hover:text-blue-300">All leads →</Link>
        </div>
        {!data?.recentActivities?.length ? (
          <p className="text-xs text-slate-500 text-center py-4">No activity yet</p>
        ) : data.recentActivities.map(a => (
          <div key={a._id} className="flex items-start gap-2 py-2 border-b border-slate-700 last:border-0">
            <span className="text-slate-400 text-sm mt-0.5">
              {{ note:'📝', call:'📞', email:'✉️', whatsapp:'💬', meeting:'📅', stage_change:'🔄', created:'✨', followup:'🔔', proposal_sent:'📄', won:'🏆', lost:'❌' }[a.type] || '•'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-200">{a.description}</p>
              <p className="text-xs text-slate-500">{a.performed_by?.full_name || 'System'} · {new Date(a.createdAt).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Lead Management', path: '/sales/leads',    emoji: '👥' },
          { label: 'Sales Pipeline',  path: '/sales/pipeline', emoji: '📊' },
          { label: 'Meetings',        path: '/sales/meetings', emoji: '📅' },
          { label: 'AI Copilot',      path: '/sales/copilot',  emoji: '🤖' },
        ].map(({ label, path, emoji }) => (
          <Link key={path} to={path} className="bg-slate-800 hover:bg-slate-700 rounded-xl p-4 text-center transition-colors">
            <div className="text-2xl mb-1">{emoji}</div>
            <p className="text-sm text-slate-200 font-medium">{label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
