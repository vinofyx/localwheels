import React, { useState, useEffect } from 'react';
import api from '../api/client';

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'blue', icon }) {
  const colors = {
    blue:   'from-blue-500 to-blue-600',
    orange: 'from-orange-500 to-orange-600',
    green:  'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    red:    'from-red-500 to-red-600',
    teal:   'from-teal-500 to-teal-600',
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center flex-shrink-0 text-white text-lg`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-[22px] font-bold text-gray-800 leading-tight">{value ?? '—'}</p>
        {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Agent row ────────────────────────────────────────────────────────────────
function AgentRow({ agent }) {
  const statusColors = { online: 'text-green-600 bg-green-50', busy: 'text-yellow-700 bg-yellow-50', offline: 'text-gray-500 bg-gray-100' };
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3 text-[13px] font-medium text-gray-800">{agent.name || '—'}</td>
      <td className="px-4 py-3">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusColors[agent.status] || statusColors.offline}`}>
          {agent.status}
        </span>
      </td>
      <td className="px-4 py-3 text-[13px] text-gray-600 text-center">{agent.active_sessions}</td>
      <td className="px-4 py-3 text-[13px] text-gray-600 text-center">{agent.total_handled}</td>
      <td className="px-4 py-3 text-[13px] text-gray-600 text-center">
        {agent.avg_rating ? `${'⭐'.repeat(Math.round(agent.avg_rating))} ${agent.avg_rating.toFixed(1)}` : '—'}
      </td>
      <td className="px-4 py-3 text-[12px] text-gray-400">
        {agent.last_active ? new Date(agent.last_active).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}
      </td>
    </tr>
  );
}

// ─── Sparkline-style bar chart ────────────────────────────────────────────────
function MiniBar({ data, labelKey, valueKey, color = '#0b8fd3' }) {
  if (!data?.length) return <p className="text-[12px] text-gray-400 py-4 text-center">No data</p>;
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t transition-all" style={{ height: `${(d[valueKey] / max) * 80}px`, backgroundColor: color, opacity: 0.8 }} />
          <p className="text-[9px] text-gray-400 truncate w-full text-center">{d[labelKey]?.slice(-5)}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Donut-lite chart ─────────────────────────────────────────────────────────
function PieList({ data, labelKey = '_id', valueKey = 'count' }) {
  if (!data?.length) return <p className="text-[12px] text-gray-400 py-4 text-center">No data</p>;
  const total  = data.reduce((s, d) => s + d[valueKey], 0);
  const colors = ['#0b8fd3', '#f97316', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b'];
  return (
    <div className="space-y-2">
      {data.map((d, i) => {
        const pct = total ? Math.round((d[valueKey] / total) * 100) : 0;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
            <p className="text-[12px] text-gray-700 flex-1 capitalize">{d[labelKey]?.replace('_', ' ') || 'Unknown'}</p>
            <div className="flex items-center gap-1.5">
              <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }} />
              </div>
              <p className="text-[11px] text-gray-500 w-8 text-right">{d[valueKey]}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── FAQ Manager ──────────────────────────────────────────────────────────────
function FAQManager() {
  const [faqs, setFaqs]     = useState([]);
  const [form, setForm]     = useState({ question: '', answer: '', category: 'General' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await api.get('/faq/admin/all').catch(() => ({ data: { data: { faqs: [] } } }));
    setFaqs(data.data?.faqs || []);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.question || !form.answer) return;
    setSaving(true);
    await api.post('/faq', form).catch(() => {});
    setForm({ question: '', answer: '', category: 'General' });
    await load();
    setSaving(false);
  };

  const toggle = async (id, is_published) => {
    await api.put(`/faq/${id}`, { is_published: !is_published }).catch(() => {});
    await load();
  };

  return (
    <div className="space-y-4">
      {/* Add FAQ */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-[13px] text-gray-700 mb-3">Add New FAQ</h3>
        <div className="space-y-2">
          <input value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
            placeholder="Question…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#0b8fd3]" />
          <textarea rows={3} value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
            placeholder="Answer…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#0b8fd3] resize-none" />
          <div className="flex gap-2">
            <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              placeholder="Category"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#0b8fd3]" />
            <button onClick={save} disabled={saving || !form.question || !form.answer}
              className="px-4 py-2 bg-[#0b8fd3] text-white rounded-lg text-[13px] font-semibold disabled:opacity-40 hover:bg-[#0971ab] transition-colors">
              {saving ? 'Saving…' : 'Add FAQ'}
            </button>
          </div>
        </div>
      </div>

      {/* FAQ list */}
      <div className="space-y-2">
        {faqs.length === 0 && <p className="text-[13px] text-gray-400 text-center py-6">No FAQs yet. Add your first one above.</p>}
        {faqs.map(f => (
          <div key={f._id} className={`bg-white rounded-xl border p-3 transition-opacity ${f.is_published ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-gray-800">{f.question}</p>
                <p className="text-[12px] text-gray-500 mt-0.5">{f.answer}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{f.category}</span>
                  <span className="text-[10px] text-gray-400">👍 {f.helpful_yes} · 👎 {f.helpful_no} · 👁 {f.view_count}</span>
                </div>
              </div>
              <button onClick={() => toggle(f._id, f.is_published)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold flex-shrink-0 ${
                  f.is_published ? 'border-green-200 text-green-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200' : 'border-gray-200 text-gray-500 hover:bg-green-50 hover:text-green-600 hover:border-green-200'
                } transition-colors`}>
                {f.is_published ? 'Published' : 'Unpublished'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SupportAdmin() {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]     = useState('overview');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: d } = await api.get('/support-analytics/overview');
        setData(d.data);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  const ov = data?.overview || {};
  const TABS = ['overview', 'agents', 'channels', 'faqs'];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-[18px] font-bold text-gray-800">Support Analytics</h1>
          <p className="text-[12px] text-gray-500">Real-time overview of customer support operations</p>
        </div>
        <span className="text-[11px] text-gray-400">{loading ? 'Refreshing…' : `Last updated ${new Date().toLocaleTimeString('en-IN')}`}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 mb-5 w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-all ${tab === t ? 'bg-[#0b8fd3] text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard icon="💬" label="Total Chats"       value={ov.total_chats}          sub={`${ov.chats_today || 0} today`}         color="blue" />
            <StatCard icon="🟡" label="Open Chats"        value={ov.open_chats}            sub={`${ov.active_agent_sessions || 0} active`} color="orange" />
            <StatCard icon="✅" label="Resolved Today"    value={ov.resolved_today}        sub={`${ov.resolved_complaints || 0} total`}  color="green" />
            <StatCard icon="🚨" label="Open Complaints"   value={ov.open_complaints}       sub="awaiting action"                         color="red" />
            <StatCard icon="⭐" label="Avg CSAT"          value={ov.avg_csat ? `${ov.avg_csat}/5` : '—'} sub={`${ov.csat_responses || 0} responses`} color="purple" />
            <StatCard icon="⚡" label="Avg Response"      value={ov.avg_response_minutes ? `${ov.avg_response_minutes}m` : '—'} sub="first response" color="teal" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-[13px] text-gray-700 mb-3">7-Day Chat Volume</h3>
              <MiniBar data={data?.chat_trend} labelKey="_id" valueKey="count" />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-[13px] text-gray-700 mb-3">Complaint Types (30d)</h3>
              <PieList data={data?.issue_breakdown} />
            </div>
          </div>
        </div>
      )}

      {/* Agents tab */}
      {tab === 'agents' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-[13px] text-gray-700">Agent Performance (30 days)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50 text-left">
                {['Agent', 'Status', 'Active', 'Handled', 'CSAT', 'Last Active'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {data?.agents?.length
                  ? data.agents.map(a => <AgentRow key={a.id} agent={a} />)
                  : <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-[13px]">No agents configured yet</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Channels tab */}
      {tab === 'channels' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-[13px] text-gray-700 mb-3">Channel Distribution (30d)</h3>
            <PieList data={data?.channel_breakdown} />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-[13px] text-gray-700 mb-3">WhatsApp Integration</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                <div>
                  <p className="text-[13px] font-semibold text-green-800">Webhook Ready</p>
                  <p className="text-[11px] text-green-600">POST /api/whatsapp/webhook</p>
                </div>
                <span className="text-green-500 text-xl">✅</span>
              </div>
              <div className={`flex items-center justify-between p-3 rounded-xl border ${process.env.REACT_APP_WA_CONNECTED === 'true' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div>
                  <p className="text-[13px] font-semibold text-gray-700">WhatsApp Business API</p>
                  <p className="text-[11px] text-gray-500">Set WHATSAPP_ACCESS_TOKEN in backend .env</p>
                </div>
                <span className="text-gray-400 text-xl">⚙️</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-[12px] text-blue-800 font-medium">Setup Steps:</p>
                <ol className="text-[11px] text-blue-700 mt-1 space-y-0.5 list-decimal list-inside">
                  <li>Create Meta Developer App at developers.facebook.com</li>
                  <li>Add WhatsApp product to your app</li>
                  <li>Set webhook URL to your backend /api/whatsapp/webhook</li>
                  <li>Add WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID to Render env</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQs tab */}
      {tab === 'faqs' && <FAQManager />}
    </div>
  );
}
