import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle, CheckCircle, Clock, MessageSquare, Search,
  RefreshCw, Plus, X, ChevronDown, ChevronRight, Zap, User,
  FileText, ArrowUpCircle, Star, BarChart2, BookOpen, Loader, Paperclip,
} from 'lucide-react';
import axios from 'axios';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const API = `${_BASE}/complaints`;

const STATUS_COLORS = {
  New:                  'bg-blue-100 text-blue-800',
  Open:                 'bg-yellow-100 text-yellow-800',
  Assigned:             'bg-indigo-100 text-indigo-800',
  'In Progress':        'bg-orange-100 text-orange-800',
  'Waiting For Customer':'bg-purple-100 text-purple-800',
  Resolved:             'bg-green-100 text-green-800',
  Closed:               'bg-gray-100 text-gray-600',
  Rejected:             'bg-red-100 text-red-700',
  Escalated:            'bg-red-200 text-red-900',
};

const PRIORITY_COLORS = {
  Critical: 'bg-red-600 text-white',
  High:     'bg-orange-500 text-white',
  Medium:   'bg-blue-500 text-white',
  Low:      'bg-gray-400 text-white',
};

const SENTIMENT_ICON = {
  positive: '🙂', neutral: '😐', negative: '🙁', very_negative: '😠',
};

const COMPLAINT_TYPES = [
  'Shipment Delay','Shipment Lost','Shipment Damaged','Wrong Delivery',
  'Pickup Delay','Invoice Issue','Payment Issue','Driver Behaviour',
  'Vehicle Issue','Tracking Problem','Website Issue','General Feedback',
];

function Badge({ label, colorClass }) {
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${colorClass}`}>{label}</span>;
}

function KpiCard({ label, value, color = 'text-gray-800', icon: Icon, onClick }) {
  return (
    <div onClick={onClick} className={`bg-white rounded-xl shadow p-4 flex items-center gap-3 ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}>
      {Icon && <div className="p-2 bg-indigo-50 rounded-lg"><Icon size={18} className="text-indigo-600" /></div>}
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value ?? '—'}</p>
      </div>
    </div>
  );
}

export default function ComplaintCenter() {
  const [tab, setTab]         = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [list, setList]       = useState({ items: [], total: 0 });
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showNew, setShowNew] = useState(false);

  const token   = localStorage.getItem('lw_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchDashboard = useCallback(async () => {
    try { const { data } = await axios.get(`${API}/dashboard`, { headers }); setDashboard(data); } catch {}
  }, []);

  const fetchAnalytics = useCallback(async () => {
    const { data } = await axios.get(`${API}/analytics?days=30`, { headers });
    setAnalytics(data);
  }, []);

  const fetchList = useCallback(async () => {
    const params = new URLSearchParams();
    if (filters.status)   params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.search)   params.set('search', filters.search);
    const { data } = await axios.get(`${API}?${params}`, { headers });
    setList(data);
  }, [filters]);

  useEffect(() => { fetchDashboard(); const iv = setInterval(fetchDashboard, 30000); return () => clearInterval(iv); }, [fetchDashboard]);
  useEffect(() => { if (tab === 'tickets') fetchList(); if (tab === 'analytics') fetchAnalytics(); }, [tab, fetchList, fetchAnalytics]);

  const openTicket = async (id) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/${id}`, { headers });
      setSelected(data);
    } catch (err) { setError(err.response?.data?.error || 'Failed to load ticket'); }
    finally { setLoading(false); }
  };

  const refreshSelected = () => selected && openTicket(selected._id);

  const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { id: 'tickets',   label: 'Tickets',   icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  ];

  return (
    <div className="p-4 min-h-screen bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Complaint &amp; Customer Service Center</h1>
          <p className="text-sm text-gray-500">AI-powered complaint classification, SLA tracking &amp; resolution</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchDashboard} className="flex items-center gap-1 px-3 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">
            <Plus size={14} /> New Complaint
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg mb-4 flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      <div className="flex gap-1 mb-4 border-b">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 ${tab === t.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD ─────────────────────────────────────────────────────── */}
      {tab === 'dashboard' && dashboard && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard label="Open Tickets" value={dashboard.sla?.openCount} icon={MessageSquare} onClick={() => setTab('tickets')} />
            <KpiCard label="Critical Open" value={dashboard.sla?.criticalOpen} color="text-red-600" icon={AlertTriangle} />
            <KpiCard label="SLA Breached" value={dashboard.sla?.slaResolutionBreached} color="text-red-600" icon={Clock} />
            <KpiCard label="Nearing Deadline" value={dashboard.sla?.nearingDeadline} color="text-orange-600" icon={Clock} />
            <KpiCard label="Escalated" value={dashboard.sla?.escalated} color="text-red-700" icon={ArrowUpCircle} />
            <KpiCard label="Avg Resolution" value={`${dashboard.avg_resolution_min || 0}m`} icon={CheckCircle} color="text-green-600" />
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow p-4">
              <h2 className="font-semibold text-gray-700 mb-3">Status Breakdown</h2>
              <div className="space-y-2">
                {Object.entries(dashboard.status_counts || {}).map(([s, c]) => (
                  <div key={s} className="flex items-center justify-between text-sm">
                    <Badge label={s} colorClass={STATUS_COLORS[s] || 'bg-gray-100'} />
                    <span className="font-semibold text-gray-700">{c}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-4">
              <h2 className="font-semibold text-gray-700 mb-3">Open by Priority</h2>
              <div className="space-y-2">
                {Object.entries(dashboard.priority_counts || {}).map(([p, c]) => (
                  <div key={p} className="flex items-center justify-between text-sm">
                    <Badge label={p} colorClass={PRIORITY_COLORS[p] || 'bg-gray-100'} />
                    <span className="font-semibold text-gray-700">{c}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-4">
              <h2 className="font-semibold text-gray-700 mb-3">Sentiment (7 days)</h2>
              <div className="space-y-2">
                {Object.entries(dashboard.sentiment_counts || {}).map(([s, c]) => (
                  <div key={s} className="flex items-center justify-between text-sm">
                    <span>{SENTIMENT_ICON[s] || '—'} {s}</span>
                    <span className="font-semibold text-gray-700">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {dashboard.recent_critical?.length > 0 && (
            <div className="bg-white rounded-xl shadow p-4">
              <h2 className="font-semibold text-red-600 mb-3 flex items-center gap-2"><AlertTriangle size={16}/> Recent Critical Complaints</h2>
              <div className="space-y-2">
                {dashboard.recent_critical.map(c => (
                  <div key={c._id} onClick={() => openTicket(c._id)} className="flex items-center justify-between border-l-4 border-red-500 pl-3 py-2 hover:bg-gray-50 cursor-pointer">
                    <div>
                      <p className="text-sm font-semibold">{c.ticket_number} — {c.subject}</p>
                      <p className="text-xs text-gray-500">{c.customer_name} · {c.type}</p>
                    </div>
                    <Badge label={c.status} colorClass={STATUS_COLORS[c.status] || 'bg-gray-100'} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TICKETS ───────────────────────────────────────────────────────── */}
      {tab === 'tickets' && (
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex flex-wrap gap-2 mb-3">
            <div className="relative">
              <Search size={14} className="absolute left-2 top-2.5 text-gray-400" />
              <input
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                placeholder="Search ticket, subject, customer, LR..."
                className="pl-7 pr-3 py-1.5 border rounded-lg text-sm w-72"
              />
            </div>
            <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="border rounded-lg text-sm px-2 py-1.5">
              <option value="">All Status</option>
              {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))} className="border rounded-lg text-sm px-2 py-1.5">
              <option value="">All Priority</option>
              {Object.keys(PRIORITY_COLORS).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button onClick={fetchList} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm">Apply</button>
            <span className="ml-auto text-sm text-gray-400 self-center">{list.total} ticket(s)</span>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b">
                <th className="py-2 text-left">Ticket</th>
                <th className="text-left">Customer</th>
                <th className="text-left">Type</th>
                <th className="text-left">Priority</th>
                <th className="text-left">Sentiment</th>
                <th className="text-left">Status</th>
                <th className="text-left">SLA</th>
                <th className="text-left">Assigned</th>
              </tr>
            </thead>
            <tbody>
              {list.items?.map(c => (
                <tr key={c._id} onClick={() => openTicket(c._id)} className="border-b hover:bg-gray-50 cursor-pointer">
                  <td className="py-2 font-mono text-xs text-indigo-700">{c.ticket_number}</td>
                  <td className="text-xs text-gray-700">{c.customer_name}</td>
                  <td className="text-xs text-gray-500">{c.type}</td>
                  <td><Badge label={c.priority} colorClass={PRIORITY_COLORS[c.priority] || 'bg-gray-100'} /></td>
                  <td className="text-center">{SENTIMENT_ICON[c.ai_sentiment] || '—'}</td>
                  <td><Badge label={c.status} colorClass={STATUS_COLORS[c.status] || 'bg-gray-100'} /></td>
                  <td>
                    {c.sla_status?.resolution_breached && <Badge label="Breached" colorClass="bg-red-100 text-red-700" />}
                    {!c.sla_status?.resolution_breached && c.sla_status?.is_warning && <Badge label="Warning" colorClass="bg-orange-100 text-orange-700" />}
                    {!c.sla_status?.resolution_breached && !c.sla_status?.is_warning && <Badge label="OK" colorClass="bg-green-50 text-green-700" />}
                  </td>
                  <td className="text-xs text-gray-500">{c.assigned_to?.name || '—'}</td>
                </tr>
              ))}
              {!list.items?.length && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No complaints found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── ANALYTICS ─────────────────────────────────────────────────────── */}
      {tab === 'analytics' && analytics && <AnalyticsView a={analytics} />}

      {/* ── New Complaint Modal ──────────────────────────────────────────── */}
      {showNew && (
        <NewComplaintModal
          headers={headers}
          onClose={() => setShowNew(false)}
          onCreated={() => { setShowNew(false); fetchDashboard(); if (tab === 'tickets') fetchList(); }}
        />
      )}

      {/* ── Ticket Detail Drawer ─────────────────────────────────────────── */}
      {selected && (
        <TicketDrawer
          ticket={selected}
          headers={headers}
          loading={loading}
          onClose={() => setSelected(null)}
          onRefresh={refreshSelected}
        />
      )}
    </div>
  );
}

// ─── New Complaint Modal ──────────────────────────────────────────────────────
function NewComplaintModal({ headers, onClose, onCreated }) {
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', customer_email: '',
    type: COMPLAINT_TYPES[0], subject: '', description: '', lr_number: '', source: 'web',
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');

  const submit = async () => {
    if (!form.customer_name || !form.subject || !form.description) {
      setError('Customer name, subject and description are required');
      return;
    }
    setSubmitting(true); setError('');
    try {
      const { data } = await axios.post(API, form, { headers });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create complaint');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-800">New Complaint</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        {!result ? (
          <div className="p-4 space-y-3">
            {error && <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded">{error}</div>}
            <input placeholder="Customer Name *" value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Phone" value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Email" value={form.customer_email} onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
            </div>
            <input placeholder="LR Number (optional)" value={form.lr_number} onChange={e => setForm(f => ({ ...f, lr_number: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
              {COMPLAINT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input placeholder="Subject *" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <textarea placeholder="Describe the issue in detail *" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <button onClick={submit} disabled={submitting} className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting ? <Loader size={14} className="animate-spin" /> : <Zap size={14} />}
              {submitting ? 'Classifying with AI…' : 'Submit & AI Classify'}
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              <CheckCircle size={16} className="inline mr-1" /> Ticket <strong>{result.ticket.ticket_number}</strong> created
            </div>
            <div className="text-xs text-gray-600 space-y-1 border rounded-lg p-3">
              <p><strong>AI Category:</strong> {result.ai_classification.category}</p>
              <p><strong>AI Priority:</strong> {result.ai_classification.priority}</p>
              <p><strong>Sentiment:</strong> {SENTIMENT_ICON[result.ai_classification.sentiment]} {result.ai_classification.sentiment}</p>
              <p><strong>Department:</strong> {result.ai_classification.department}</p>
              <p><strong>Root Cause:</strong> {result.ai_classification.root_cause}</p>
              <p><strong>Suggested Resolution:</strong> {result.ai_classification.suggested_resolution}</p>
              {result.is_duplicate && <p className="text-orange-600"><strong>⚠ Possible duplicate detected</strong></p>}
            </div>
            <button onClick={onCreated} className="w-full py-2 bg-gray-800 text-white rounded-lg text-sm">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Ticket Detail Drawer ─────────────────────────────────────────────────────
function TicketDrawer({ ticket, headers, loading, onClose, onRefresh }) {
  const [comment, setComment]     = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [busy, setBusy]           = useState(false);
  const [suggestedReply, setSuggestedReply] = useState('');
  const [resolveForm, setResolveForm] = useState({ resolution_action: '', resolution_type: 'other' });
  const [showResolve, setShowResolve] = useState(false);

  const postComment = async () => {
    if (!comment.trim()) return;
    setBusy(true);
    try {
      await axios.post(`${API}/${ticket._id}/comment`, { comment, is_internal: isInternal }, { headers });
      setComment(''); onRefresh();
    } finally { setBusy(false); }
  };

  const handleResolve = async () => {
    if (!resolveForm.resolution_action.trim()) return;
    setBusy(true);
    try {
      await axios.post(`${API}/${ticket._id}/resolve`, resolveForm, { headers });
      setShowResolve(false); onRefresh();
    } finally { setBusy(false); }
  };

  const handleEscalate = async () => {
    setBusy(true);
    try {
      await axios.post(`${API}/${ticket._id}/escalate`, { reason: 'Manually escalated by agent' }, { headers });
      onRefresh();
    } finally { setBusy(false); }
  };

  const handleSuggestReply = async () => {
    setBusy(true);
    try {
      const { data } = await axios.post(`${API}/${ticket._id}/suggest-reply`, {}, { headers });
      setSuggestedReply(data.suggested_reply);
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
      <div className="bg-white w-full max-w-2xl h-full overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="font-semibold text-gray-800">{ticket.ticket_number}</h2>
            <p className="text-xs text-gray-500">{ticket.subject}</p>
          </div>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400"><Loader className="animate-spin mx-auto mb-2" /> Loading...</div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Status row */}
            <div className="flex flex-wrap gap-2 items-center">
              <Badge label={ticket.status} colorClass={STATUS_COLORS[ticket.status] || 'bg-gray-100'} />
              <Badge label={ticket.priority} colorClass={PRIORITY_COLORS[ticket.priority] || 'bg-gray-100'} />
              <Badge label={ticket.department} colorClass="bg-gray-100 text-gray-600" />
              <span>{SENTIMENT_ICON[ticket.ai_sentiment]}</span>
              {ticket.sla_status?.resolution_breached && <Badge label="SLA Breached" colorClass="bg-red-100 text-red-700" />}
              {ticket.is_duplicate && <Badge label="Possible Duplicate" colorClass="bg-orange-100 text-orange-700" />}
            </div>

            {/* Customer info */}
            <div className="border rounded-lg p-3 text-sm">
              <p className="font-semibold text-gray-700 flex items-center gap-1"><User size={14} /> {ticket.customer_name}</p>
              <p className="text-xs text-gray-500">{ticket.customer_phone} {ticket.customer_email ? `· ${ticket.customer_email}` : ''}</p>
              {ticket.lr_number && <p className="text-xs text-gray-500 mt-1">LR: {ticket.lr_number}</p>}
            </div>

            {/* Description */}
            <div className="border rounded-lg p-3 text-sm">
              <p className="text-gray-700">{ticket.description}</p>
            </div>

            {/* AI insights */}
            <div className="bg-indigo-50 rounded-lg p-3 text-xs space-y-1">
              <p className="font-semibold text-indigo-800 flex items-center gap-1"><Zap size={12} /> AI Insights ({ticket.ai_confidence}% confidence)</p>
              <p><strong>Root Cause:</strong> {ticket.ai_root_cause}</p>
              <p><strong>Suggested Resolution:</strong> {ticket.ai_suggested_resolution}</p>
              {ticket.ai_flags?.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-1">
                  {ticket.ai_flags.map((f, i) => <span key={i} className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">{f}</span>)}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              {!['Resolved','Closed'].includes(ticket.status) && (
                <button onClick={() => setShowResolve(s => !s)} className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700">
                  <CheckCircle size={12} className="inline mr-1" /> Resolve
                </button>
              )}
              {ticket.status !== 'Escalated' && (
                <button onClick={handleEscalate} disabled={busy} className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 disabled:opacity-60">
                  <ArrowUpCircle size={12} className="inline mr-1" /> Escalate
                </button>
              )}
              <button onClick={handleSuggestReply} disabled={busy} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700 disabled:opacity-60">
                <Zap size={12} className="inline mr-1" /> AI Suggest Reply
              </button>
            </div>

            {showResolve && (
              <div className="border rounded-lg p-3 space-y-2 bg-green-50">
                <textarea
                  placeholder="Resolution action taken..."
                  value={resolveForm.resolution_action}
                  onChange={e => setResolveForm(f => ({ ...f, resolution_action: e.target.value }))}
                  className="w-full border rounded px-2 py-1.5 text-sm"
                  rows={3}
                />
                <select value={resolveForm.resolution_type} onChange={e => setResolveForm(f => ({ ...f, resolution_type: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm">
                  {['refund','replacement','apology','investigation','process_fix','no_action','other'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button onClick={handleResolve} disabled={busy} className="w-full py-1.5 bg-green-600 text-white rounded text-sm font-semibold">Confirm Resolution</button>
              </div>
            )}

            {suggestedReply && (
              <div className="border-l-4 border-indigo-400 bg-indigo-50 p-3 text-sm">
                <p className="text-xs font-semibold text-indigo-700 mb-1">AI Suggested Reply</p>
                <p className="text-gray-700">{suggestedReply}</p>
                <button onClick={() => { setComment(suggestedReply); setSuggestedReply(''); }} className="text-xs text-indigo-600 mt-1 underline">Use this reply</button>
              </div>
            )}

            {/* Timeline */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Activity Timeline</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {ticket.activities?.map(a => (
                  <div key={a._id} className={`text-xs border-l-2 pl-2 py-1 ${a.is_internal ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'}`}>
                    <p className="text-gray-700">
                      <strong>{a.actor_name || 'System'}</strong> · {a.action.replace(/_/g,' ')}
                      {a.is_internal && <span className="ml-1 text-yellow-700">(internal)</span>}
                    </p>
                    {a.comment && <p className="text-gray-500">{a.comment}</p>}
                    <p className="text-gray-300">{new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Comment box */}
            <div className="border-t pt-3 space-y-2">
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Add a reply or internal note..."
                rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1 text-xs text-gray-500">
                  <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} /> Internal note
                </label>
                <button onClick={postComment} disabled={busy || !comment.trim()} className="px-4 py-1.5 bg-gray-800 text-white rounded text-xs font-semibold disabled:opacity-50">Post</button>
              </div>
            </div>

            {ticket.feedback && (
              <div className="border rounded-lg p-3 bg-yellow-50 text-sm">
                <p className="font-semibold text-gray-700 flex items-center gap-1"><Star size={14} className="text-yellow-500" /> Customer Feedback: {ticket.feedback.rating}/5</p>
                {ticket.feedback.comment && <p className="text-gray-600 text-xs mt-1">{ticket.feedback.comment}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Analytics View ───────────────────────────────────────────────────────────
function AnalyticsView({ a }) {
  const kpis = [
    { label: 'Total Complaints', value: a.volume?.total || 0, icon: MessageSquare },
    { label: 'Resolution Rate',  value: `${a.volume?.resolution_rate || 0}%`, icon: CheckCircle, color: 'text-green-600' },
    { label: 'SLA Compliance',   value: `${a.volume?.sla_compliance_pct || 0}%`, icon: Clock, color: 'text-green-600' },
    { label: 'Escalated',        value: a.volume?.escalated || 0, icon: ArrowUpCircle, color: 'text-red-600' },
    { label: 'Avg CSAT',         value: a.csat?.avg_rating || '—', icon: Star, color: 'text-yellow-600' },
    { label: 'NPS Score',        value: a.csat?.nps ?? '—', icon: BarChart2 },
    { label: 'Duplicates Caught',value: a.volume?.duplicates || 0, icon: FileText },
    { label: 'Critical',         value: a.volume?.critical || 0, icon: AlertTriangle, color: 'text-red-600' },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Last {a.period_days} days</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Complaints by Type</h3>
          <div className="space-y-2">
            {a.by_type?.slice(0, 8).map(t => (
              <div key={t._id} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-32 truncate">{t._id}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min(100, (t.count / (a.by_type[0]?.count || 1)) * 100)}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-6 text-right">{t.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Department Performance</h3>
          <table className="w-full text-xs">
            <thead><tr className="text-gray-400"><th className="text-left py-1">Dept</th><th>Count</th><th>Resolved</th><th>Avg (min)</th></tr></thead>
            <tbody>
              {a.by_department?.map(d => (
                <tr key={d._id} className="border-t">
                  <td className="py-1">{d._id}</td>
                  <td className="text-center">{d.count}</td>
                  <td className="text-center">{d.resolved}</td>
                  <td className="text-center">{Math.round(d.avg_resolution || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {a.daily_volume?.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Daily Complaint Volume (7 days)</h3>
          <div className="flex items-end gap-2 h-32">
            {a.daily_volume.map(d => {
              const max = Math.max(...a.daily_volume.map(x => x.count), 1);
              return (
                <div key={d._id} className="flex flex-col items-center flex-1">
                  <span className="text-xs text-gray-400 mb-1">{d.count}</span>
                  <div className="w-full bg-red-400 rounded-t" style={{ height: `${(d.count/max)*100}%`, minHeight: '4px' }} />
                  <span className="text-[10px] text-gray-400 mt-1">{d._id?.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {a.agent_performance?.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Agent Performance</h3>
          <table className="w-full text-xs">
            <thead><tr className="text-gray-400"><th className="text-left py-1">Agent</th><th>Tickets</th><th>Resolved</th><th>Avg (min)</th></tr></thead>
            <tbody>
              {a.agent_performance.map(ag => (
                <tr key={ag._id} className="border-t">
                  <td className="py-1">{ag.agent_name || 'Unknown'}</td>
                  <td className="text-center">{ag.tickets}</td>
                  <td className="text-center">{ag.resolved}</td>
                  <td className="text-center">{Math.round(ag.avg_resolution || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
