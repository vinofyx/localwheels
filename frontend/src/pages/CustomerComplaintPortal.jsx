import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, Plus, Search, X, Star, RefreshCw, Upload,
  CheckCircle, Clock, ArrowLeft, Loader, Paperclip, History,
  Truck, FileText, Mic, BookOpen, ExternalLink,
} from 'lucide-react';
import axios from 'axios';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const API = `${_BASE}/customer`;

const STATUS_COLORS = {
  New: 'bg-blue-100 text-blue-800', Open: 'bg-yellow-100 text-yellow-800',
  Assigned: 'bg-indigo-100 text-indigo-800', 'In Progress': 'bg-orange-100 text-orange-800',
  'Waiting For Customer': 'bg-purple-100 text-purple-800', Resolved: 'bg-green-100 text-green-800',
  Closed: 'bg-gray-100 text-gray-600', Rejected: 'bg-red-100 text-red-700', Escalated: 'bg-red-200 text-red-900',
};

const COMPLAINT_TYPES = [
  'Shipment Delay','Shipment Lost','Shipment Damaged','Wrong Delivery','Pickup Delay',
  'Invoice Issue','Payment Issue','Driver Behaviour','Vehicle Issue','Tracking Problem',
  'Website Issue','General Feedback',
];

function Badge({ label, colorClass }) {
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${colorClass}`}>{label}</span>;
}

export default function CustomerComplaintPortal() {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('lw_customer_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [view, setView] = useState('list'); // list | new | detail | timeline
  const [complaints, setComplaints] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchList = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/complaints`, { params: { customer_phone: session.phone, company_id: session.company_id } });
      setComplaints(data.complaints);
    } catch (err) { setError(err.response?.data?.error || 'Failed to load complaints'); }
    finally { setLoading(false); }
  }, [session]);

  useEffect(() => { if (session) fetchList(); }, [session, fetchList]);

  if (!session) return <LoginGate onLogin={setSession} />;

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">My Complaints</h1>
          <p className="text-xs text-gray-500">{session.phone}</p>
        </div>
        <div className="flex gap-2">
          {view !== 'list' && (
            <button onClick={() => { setView('list'); fetchList(); }} className="flex items-center gap-1 px-3 py-1.5 bg-white border rounded-lg text-sm">
              <ArrowLeft size={14} /> Back
            </button>
          )}
          {view === 'list' && (
            <>
              <button onClick={() => setView('timeline')} className="flex items-center gap-1 px-3 py-1.5 bg-white border rounded-lg text-sm">
                <History size={14} /> My Timeline
              </button>
              <button onClick={() => setView('new')} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold">
                <Plus size={14} /> Raise Complaint
              </button>
            </>
          )}
          <button onClick={() => { localStorage.removeItem('lw_customer_session'); setSession(null); }} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm">
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg mb-4 flex items-center gap-2">
          {error} <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {view === 'list' && (
        <div className="space-y-4">
          {/* Quick access shortcuts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
            {[
              { label: 'Track Shipment', icon: Truck,     href: '/track',          color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { label: 'Get a Quote',    icon: FileText,  href: '/quote',          color: 'bg-green-50 text-green-700 border-green-200' },
              { label: 'Voice Assistant',icon: Mic,       href: '/voice/assistant',color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
              { label: 'Knowledge Base', icon: BookOpen,  href: '/knowledge-base', color: 'bg-amber-50 text-amber-700 border-amber-200' },
            ].map(({ label, icon: Icon, href, color }) => (
              <a key={label} href={href}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center hover:shadow-sm transition-shadow ${color}`}>
                <Icon size={20} />
                <span className="text-xs font-medium">{label}</span>
                <ExternalLink size={10} className="opacity-50" />
              </a>
            ))}
          </div>

          <div className="space-y-2">
          {loading && <div className="text-center text-gray-400 py-8"><Loader className="animate-spin mx-auto" /></div>}
          {!loading && !complaints.length && (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">
              No complaints yet. <button onClick={() => setView('new')} className="text-indigo-600 underline">Raise one</button>
            </div>
          )}
          {complaints.map(c => (
            <div key={c._id} onClick={() => { setSelectedId(c._id); setView('detail'); }} className="bg-white rounded-xl shadow p-3 flex items-center justify-between cursor-pointer hover:shadow-md">
              <div>
                <p className="text-sm font-semibold text-gray-800">{c.ticket_number} — {c.subject}</p>
                <p className="text-xs text-gray-500">{c.type} · {new Date(c.createdAt).toLocaleDateString()}</p>
              </div>
              <Badge label={c.status} colorClass={STATUS_COLORS[c.status] || 'bg-gray-100'} />
            </div>
          ))}
          </div>{/* end inner space-y-2 */}
        </div>
      )}

      {view === 'new' && <NewComplaintForm session={session} onCreated={() => { setView('list'); fetchList(); }} setError={setError} />}
      {view === 'detail' && selectedId && <ComplaintDetail id={selectedId} session={session} setError={setError} />}
      {view === 'timeline' && <CustomerTimeline session={session} setError={setError} />}
    </div>
  );
}

// ─── Login Gate ───────────────────────────────────────────────────────────────
function LoginGate({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [companyId, setCompanyId] = useState('');

  const submit = () => {
    if (!phone || !companyId) return;
    const session = { phone, company_id: companyId };
    localStorage.setItem('lw_customer_session', JSON.stringify(session));
    onLogin(session);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow p-6 w-full max-w-sm space-y-3">
        <h1 className="text-xl font-bold text-gray-800 text-center">Track Your Complaint</h1>
        <p className="text-xs text-gray-500 text-center">Enter your registered phone number to continue</p>
        <input placeholder="Company ID" value={companyId} onChange={e => setCompanyId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
        <input placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
        <button onClick={submit} className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold">Continue</button>
      </div>
    </div>
  );
}

// ─── New Complaint Form ────────────────────────────────────────────────────────
function NewComplaintForm({ session, onCreated, setError }) {
  const [form, setForm] = useState({
    customer_name: '', customer_email: '', type: COMPLAINT_TYPES[0],
    subject: '', description: '', lr_number: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async () => {
    if (!form.customer_name || !form.subject || !form.description) { setError('Name, subject and description are required'); return; }
    setSubmitting(true);
    try {
      const { data } = await axios.post(`${API}/complaints`, { ...form, company_id: session.company_id, customer_phone: session.phone });
      setResult(data);
    } catch (err) { setError(err.response?.data?.error || 'Failed to submit complaint'); }
    finally { setSubmitting(false); }
  };

  if (result) {
    return (
      <div className="bg-white rounded-xl shadow p-5 space-y-3">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
          <CheckCircle size={16} className="inline mr-1" /> Ticket <strong>{result.ticket.ticket_number}</strong> raised successfully
        </div>
        <p className="text-xs text-gray-600">{result.ai_auto_reply}</p>
        {result.is_duplicate && <p className="text-xs text-orange-600">This may be related to an existing complaint — our team will check.</p>}
        <button onClick={onCreated} className="w-full py-2 bg-gray-800 text-white rounded-lg text-sm">Done</button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-5 space-y-3">
      <input placeholder="Your Name *" value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
      <input placeholder="Email" value={form.customer_email} onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
      <input placeholder="LR Number (optional)" value={form.lr_number} onChange={e => setForm(f => ({ ...f, lr_number: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
      <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
        {COMPLAINT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <input placeholder="Subject *" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
      <textarea placeholder="Describe your issue *" rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
      <button onClick={submit} disabled={submitting} className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold disabled:opacity-60">
        {submitting ? 'Submitting…' : 'Submit Complaint'}
      </button>
    </div>
  );
}

// ─── Complaint Detail (track / reply / upload / rate / reopen) ────────────────
function ComplaintDetail({ id, session, setError }) {
  const [data, setData] = useState(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [uploadForm, setUploadForm] = useState({ file_name: '', file_url: '', file_type: 'image/jpeg', file_size_kb: 100, category: 'photo' });
  const [showUpload, setShowUpload] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/complaints/${id}`, { params: { customer_phone: session.phone } });
      setData(data);
    } catch (err) { setError(err.response?.data?.error || 'Failed to load complaint'); }
  }, [id, session]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const reply = async () => {
    if (!comment.trim()) return;
    setBusy(true);
    try {
      await axios.post(`${API}/complaints/${id}/reply`, { comment, customer_phone: session.phone });
      setComment(''); fetchDetail();
    } catch (err) { setError(err.response?.data?.error || 'Failed to send reply'); }
    finally { setBusy(false); }
  };

  const upload = async () => {
    if (!uploadForm.file_name || !uploadForm.file_url) return;
    setBusy(true);
    try {
      await axios.post(`${API}/complaints/${id}/upload`, { ...uploadForm, customer_phone: session.phone });
      setShowUpload(false); fetchDetail();
    } catch (err) { setError(err.response?.data?.error || 'Upload failed validation'); }
    finally { setBusy(false); }
  };

  const submitRating = async () => {
    if (!rating) return;
    setBusy(true);
    try {
      await axios.post(`${API}/complaints/${id}/rating`, { rating, comment: ratingComment, customer_phone: session.phone });
      fetchDetail();
    } catch (err) { setError(err.response?.data?.error || 'Failed to submit rating'); }
    finally { setBusy(false); }
  };

  const reopen = async () => {
    setBusy(true);
    try {
      await axios.post(`${API}/complaints/${id}/reopen`, { reason: 'Issue not fully resolved', customer_phone: session.phone });
      fetchDetail();
    } catch (err) { setError(err.response?.data?.error || 'Failed to reopen'); }
    finally { setBusy(false); }
  };

  if (!data) return <div className="text-center text-gray-400 py-8"><Loader className="animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-800">{data.ticket_number}</h2>
          <Badge label={data.status} colorClass={STATUS_COLORS[data.status] || 'bg-gray-100'} />
        </div>
        <p className="text-sm text-gray-700">{data.subject}</p>
        <p className="text-xs text-gray-500 mt-1">{data.description}</p>
        {data.sla_status && (
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><Clock size={12} /> {data.sla_status.minutes_to_deadline != null ? `${data.sla_status.minutes_to_deadline}m to resolution deadline` : 'SLA pending'}</p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Complaint Timeline</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {data.activities?.map(a => (
            <div key={a._id} className="text-xs border-l-2 border-gray-200 pl-2 py-1">
              <p className="text-gray-700"><strong>{a.actor_name || 'System'}</strong> · {a.action.replace(/_/g, ' ')}</p>
              {a.comment && <p className="text-gray-500">{a.comment}</p>}
              <p className="text-gray-300">{new Date(a.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {data.attachments?.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><Paperclip size={14} /> Attachments</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            {data.attachments.map(a => <li key={a._id}>{a.file_name} ({a.category})</li>)}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Reply to Support</h3>
          <button onClick={() => setShowUpload(s => !s)} className="text-xs text-indigo-600 flex items-center gap-1"><Upload size={12} /> Add Evidence</button>
        </div>
        {showUpload && (
          <div className="border rounded-lg p-2 space-y-2 bg-gray-50">
            <input placeholder="File name (e.g. damage_photo.jpg)" value={uploadForm.file_name} onChange={e => setUploadForm(f => ({ ...f, file_name: e.target.value }))} className="w-full border rounded px-2 py-1 text-xs" />
            <input placeholder="File URL" value={uploadForm.file_url} onChange={e => setUploadForm(f => ({ ...f, file_url: e.target.value }))} className="w-full border rounded px-2 py-1 text-xs" />
            <select value={uploadForm.file_type} onChange={e => setUploadForm(f => ({ ...f, file_type: e.target.value }))} className="w-full border rounded px-2 py-1 text-xs">
              <option value="image/jpeg">Image (JPEG)</option>
              <option value="image/png">Image (PNG)</option>
              <option value="video/mp4">Video (MP4)</option>
              <option value="application/pdf">Document (PDF)</option>
              <option value="audio/mpeg">Voice Recording (MP3)</option>
            </select>
            <button onClick={upload} disabled={busy} className="w-full py-1.5 bg-indigo-600 text-white rounded text-xs font-semibold">Upload</button>
          </div>
        )}
        <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Type your reply..." rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" />
        <button onClick={reply} disabled={busy || !comment.trim()} className="w-full py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold disabled:opacity-50">Send Reply</button>
      </div>

      {['Resolved', 'Closed'].includes(data.status) && !data.feedback && (
        <div className="bg-yellow-50 rounded-xl shadow p-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Rate the Resolution</h3>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setRating(n)}>
                <Star size={22} className={n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
              </button>
            ))}
          </div>
          <textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)} placeholder="Tell us about your experience..." rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button onClick={submitRating} disabled={busy || !rating} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">Submit Rating</button>
            <button onClick={reopen} disabled={busy} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold">Reopen</button>
          </div>
        </div>
      )}

      {data.feedback && (
        <div className="bg-green-50 rounded-xl shadow p-4 text-sm">
          <p className="font-semibold text-gray-700 flex items-center gap-1"><Star size={14} className="text-yellow-500" /> You rated this {data.feedback.rating}/5</p>
          {data.status === 'Closed' && <button onClick={reopen} disabled={busy} className="mt-2 text-xs text-red-600 underline">Not satisfied? Reopen complaint</button>}
        </div>
      )}
    </div>
  );
}

// ─── Customer Timeline (cross-module journey) ──────────────────────────────────
function CustomerTimeline({ session, setError }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get(`${API}/timeline`, { params: { customer_phone: session.phone, company_id: session.company_id } })
      .then(({ data }) => setData(data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load timeline'));
  }, [session]);

  if (!data) return <div className="text-center text-gray-400 py-8"><Loader className="animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Shipment History</h3>
        {data.shipment_history?.length ? (
          <ul className="text-xs text-gray-600 space-y-1">{data.shipment_history.map(s => <li key={s._id}>{s.lr_number || s._id} · {s.status}</li>)}</ul>
        ) : <p className="text-xs text-gray-400">No shipments found</p>}
      </div>
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Quotation History</h3>
        {data.quotation_history?.length ? (
          <ul className="text-xs text-gray-600 space-y-1">{data.quotation_history.map(q => <li key={q._id}>{q.quote_number || q._id}</li>)}</ul>
        ) : <p className="text-xs text-gray-400">No quotes found</p>}
      </div>
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Complaint History</h3>
        {data.complaint_history?.length ? (
          <ul className="text-xs text-gray-600 space-y-1">{data.complaint_history.map(c => <li key={c._id}>{c.ticket_number} — {c.subject} ({c.status})</li>)}</ul>
        ) : <p className="text-xs text-gray-400">No complaints found</p>}
      </div>
    </div>
  );
}
