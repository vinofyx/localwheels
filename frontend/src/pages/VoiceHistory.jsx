import { useState, useEffect, useCallback } from 'react';
import { Mic, Clock, User, ChevronDown, ChevronUp, Phone, Globe, ArrowRight, Loader, X } from 'lucide-react';
import axios from 'axios';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const API = `${_BASE}/voice`;
const LANG_LABELS = { en: 'English', hi: 'हिन्दी', te: 'తెలుగు', ta: 'தமிழ்', kn: 'ಕನ್ನಡ' };
const RESOLUTION_COLOR = {
  resolved:              'bg-green-100 text-green-700',
  unresolved:            'bg-yellow-100 text-yellow-700',
  transferred_to_human:  'bg-blue-100 text-blue-700',
  abandoned:             'bg-gray-100 text-gray-500',
};

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('lw_token')}` };
}

function TranscriptDrawer({ sessionId, onClose }) {
  const [turns, setTurns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/history`, { params: { session_id: sessionId }, headers: authHeaders() })
      .then(r => setTurns(r.data.transcripts || []))
      .finally(() => setLoading(false));
  }, [sessionId]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold">Session Transcript</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {loading ? <div className="text-center py-10 text-gray-400"><Loader className="animate-spin mx-auto" /></div>
          : turns.length === 0 ? <div className="text-center py-10 text-gray-400">No transcript found.</div>
          : turns.map((t, i) => (
            <div key={i} className={`flex ${t.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-3 py-2 rounded-lg text-sm max-w-[80%] ${t.speaker === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-800'}`}>
                {t.text || <span className="italic text-xs opacity-60">encrypted</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function VoiceHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [viewingTranscript, setViewingTranscript] = useState(null);
  const [filter, setFilter] = useState({ language: '', resolution: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/history`, { params: { limit: 100 }, headers: authHeaders() });
      setSessions(data.sessions || []);
    } catch { setSessions([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = sessions.filter(s => {
    if (filter.language && s.language !== filter.language) return false;
    if (filter.resolution && s.resolution !== filter.resolution) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Mic size={22} /> Voice History</h1>
          <p className="text-sm text-gray-500">{filtered.length} session{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <select className="border rounded-lg px-3 py-2 text-sm" value={filter.language}
            onChange={e => setFilter(f => ({ ...f, language: e.target.value }))}>
            <option value="">All Languages</option>
            {Object.entries(LANG_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="border rounded-lg px-3 py-2 text-sm" value={filter.resolution}
            onChange={e => setFilter(f => ({ ...f, resolution: e.target.value }))}>
            <option value="">All Outcomes</option>
            <option value="resolved">Resolved</option>
            <option value="unresolved">Unresolved</option>
            <option value="transferred_to_human">Transferred</option>
            <option value="abandoned">Abandoned</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400"><Loader className="animate-spin mx-auto mb-2" /> Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Mic size={40} className="mx-auto mb-3 text-gray-300" />
          <p>No voice sessions found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <div key={s._id} className="bg-white border rounded-xl overflow-hidden">
              <div className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(expanded === s._id ? null : s._id)}>
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                  <Mic size={16} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-gray-800">{s.session_number}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RESOLUTION_COLOR[s.resolution] || 'bg-gray-100 text-gray-500'}`}>
                      {s.resolution?.replace(/_/g, ' ')}
                    </span>
                    {s.transferred_to_human && <span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700 flex items-center gap-1"><Phone size={10} /> Transferred</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1"><Globe size={11} /> {LANG_LABELS[s.language] || s.language}</span>
                    {s.customer_phone && <span className="flex items-center gap-1"><User size={11} /> {s.customer_phone}</span>}
                    <span className="flex items-center gap-1"><Clock size={11} /> {s.duration_sec}s</span>
                    <span>{new Date(s.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                {expanded === s._id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </div>

              {expanded === s._id && (
                <div className="border-t bg-gray-50 px-4 py-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                    <div><span className="text-gray-500 text-xs block">Channel</span>{s.channel?.replace(/_/g, ' ')}</div>
                    <div><span className="text-gray-500 text-xs block">Role</span>{s.user_role}</div>
                    <div><span className="text-gray-500 text-xs block">Turns</span>{s.turn_count}</div>
                    <div><span className="text-gray-500 text-xs block">Started</span>{new Date(s.started_at).toLocaleString()}</div>
                  </div>
                  <button onClick={() => setViewingTranscript(s._id)}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                    <ArrowRight size={12} /> View Full Transcript
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {viewingTranscript && <TranscriptDrawer sessionId={viewingTranscript} onClose={() => setViewingTranscript(null)} />}
    </div>
  );
}
