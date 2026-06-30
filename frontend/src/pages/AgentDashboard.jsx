import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    waiting: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    active:  'bg-green-100 text-green-800 border-green-200',
    closed:  'bg-gray-100 text-gray-600 border-gray-200',
    missed:  'bg-red-100 text-red-700 border-red-200',
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${map[status] || map.closed}`}>
      {status.toUpperCase()}
    </span>
  );
}

// ─── Priority badge ───────────────────────────────────────────────────────────
function PriorityDot({ priority }) {
  const c = { high: 'bg-red-500', medium: 'bg-yellow-400', low: 'bg-green-400' };
  return <span className={`w-2 h-2 rounded-full inline-block ${c[priority] || c.medium}`} />;
}

// ─── Queue card ───────────────────────────────────────────────────────────────
function QueueCard({ session, onAccept, isActive }) {
  const wait = Math.round((Date.now() - new Date(session.createdAt)) / 60000);
  return (
    <div className={`border rounded-xl p-3 cursor-pointer transition-all ${isActive ? 'border-[#0b8fd3] bg-blue-50 shadow' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}`}
      onClick={() => onAccept(session)}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <PriorityDot priority={session.priority} />
          <p className="text-[13px] font-semibold text-gray-800 truncate">{session.customer_name || 'Anonymous'}</p>
        </div>
        <StatusBadge status={session.status} />
      </div>
      {session.lr_number && <p className="text-[11px] text-blue-600 font-mono mb-0.5">LR: {session.lr_number}</p>}
      {session.issue_summary && <p className="text-[12px] text-gray-500 truncate">{session.issue_summary}</p>}
      <div className="flex items-center justify-between mt-2">
        <span className="text-[11px] text-gray-400 capitalize">📱 {session.channel}</span>
        <span className="text-[11px] text-gray-400">{wait}m ago</span>
      </div>
    </div>
  );
}

// ─── Chat message ─────────────────────────────────────────────────────────────
function ChatMsg({ msg }) {
  const isAgent  = msg.from === 'agent';
  const isSystem = msg.from === 'system';
  if (isSystem) return (
    <div className="text-center my-2">
      <span className="text-[11px] text-gray-400 bg-gray-100 rounded-full px-3 py-1">{msg.content}</span>
    </div>
  );
  return (
    <div className={`flex ${isAgent ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
        isAgent
          ? 'bg-gradient-to-br from-[#0b8fd3] to-[#0971ab] text-white rounded-br-sm'
          : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
      }`}>
        {msg.content}
        <p className={`text-[10px] mt-0.5 ${isAgent ? 'text-white/60' : 'text-gray-400'}`}>
          {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AgentDashboard() {
  const { user }              = useAuth();
  const [status, setStatus]   = useState('offline');
  const [queue, setQueue]     = useState({ waiting: [], active: [] });
  const [selected, setSelected] = useState(null);
  const [fullSession, setFull]  = useState(null);
  const [replyText, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [resolution, setResolution] = useState('');
  const [showClose, setShowClose]   = useState(false);
  const bottomRef = useRef(null);
  const pollRef   = useRef(null);

  // ── Agent status toggle ─────────────────────────────────────────────────
  const toggleStatus = async (s) => {
    await api.patch('/live-agent/me/status', { status: s }).catch(() => {});
    setStatus(s);
  };

  useEffect(() => {
    api.get('/live-agent/me').then(({ data }) => {
      if (data.data?.status) setStatus(data.data.status);
    }).catch(() => {});
  }, []);

  // ── Queue polling ────────────────────────────────────────────────────────
  const fetchQueue = useCallback(async () => {
    try {
      const { data } = await api.get('/live-agent/queue');
      setQueue(data.data);
    } catch { /* ignore */ }
  }, []);

  const fetchFull = useCallback(async (sessionId) => {
    try {
      const { data } = await api.get(`/live-agent/session/${sessionId}/full`);
      setFull(data.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchQueue();
    pollRef.current = setInterval(() => {
      fetchQueue();
      if (selected?.session_id) fetchFull(selected.session_id);
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [fetchQueue, fetchFull, selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [fullSession?.messages]);

  // ── Accept session ───────────────────────────────────────────────────────
  const acceptSession = async (session) => {
    if (session.status === 'waiting') {
      try {
        await api.post(`/live-agent/accept/${session.session_id}`);
        setStatus('busy');
      } catch (e) {
        if (!e?.response?.data?.message?.includes('already taken')) alert(e?.response?.data?.message || 'Could not accept');
      }
    }
    setSelected(session);
    fetchFull(session.session_id);
    setReply('');
    setShowClose(false);
  };

  // ── Send reply ───────────────────────────────────────────────────────────
  const sendReply = async () => {
    if (!replyText.trim() || sending || !selected) return;
    setSending(true);
    try {
      await api.post(`/live-agent/reply/${selected.session_id}`, { content: replyText.trim() });
      setReply('');
      fetchFull(selected.session_id);
    } catch { alert('Failed to send message'); }
    finally { setSending(false); }
  };

  // ── Close session ────────────────────────────────────────────────────────
  const closeSession = async () => {
    try {
      await api.post(`/live-agent/close/${selected.session_id}`, { resolution_note: resolution });
      setSelected(null); setFull(null); setShowClose(false); setResolution('');
      fetchQueue();
    } catch { alert('Failed to close session'); }
  };

  const statusColors = { online: 'bg-green-500', busy: 'bg-yellow-500', offline: 'bg-gray-400' };
  const allSessions  = [...queue.waiting, ...queue.active];

  return (
    <div className="h-full flex flex-col bg-[#eaf0fb]">

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-[15px] font-bold text-gray-800">Support Agent Dashboard</h1>
          <p className="text-[12px] text-gray-500">Welcome, {user?.full_name || user?.username}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] text-gray-500">Queue</p>
            <p className="text-[18px] font-bold text-orange-600">{queue.waiting.length}</p>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {['online', 'busy', 'offline'].map(s => (
              <button key={s} onClick={() => toggleStatus(s)}
                className={`text-[11px] px-2.5 py-1.5 rounded-md font-semibold capitalize transition-all ${
                  status === s ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full inline-block mr-1 ${statusColors[s]}`} />
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main layout ──────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Queue panel */}
        <div className="w-72 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
            <p className="text-[12px] font-semibold text-gray-600 uppercase tracking-wide">Queue</p>
            <div className="flex gap-2 text-[11px] text-gray-500">
              <span className="text-yellow-600 font-semibold">{queue.waiting.length} waiting</span>
              <span>·</span>
              <span className="text-green-600 font-semibold">{queue.active.length} active</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {allSessions.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-3xl mb-2">🎉</p>
                <p className="text-[13px] font-medium">Queue is empty!</p>
                <p className="text-[12px]">Set yourself online to receive chats</p>
              </div>
            )}
            {allSessions.map(s => (
              <QueueCard key={s.session_id} session={s}
                onAccept={acceptSession}
                isActive={selected?.session_id === s.session_id} />
            ))}
          </div>
        </div>

        {/* Chat panel */}
        {selected && fullSession ? (
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Chat header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-800">{fullSession.customer_name || 'Anonymous'}</p>
                  <StatusBadge status={fullSession.status} />
                </div>
                <p className="text-[12px] text-gray-500">
                  {fullSession.customer_phone && `📱 ${fullSession.customer_phone}  `}
                  {fullSession.lr_number && `📦 ${fullSession.lr_number}  `}
                  <span className="capitalize">{fullSession.channel}</span>
                </p>
              </div>
              <div className="flex gap-2">
                {fullSession.status !== 'closed' && (
                  <button onClick={() => setShowClose(true)}
                    className="text-[12px] px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 font-medium transition-colors">
                    Close Session
                  </button>
                )}
                <button onClick={() => { setSelected(null); setFull(null); }}
                  className="text-[12px] px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-colors">
                  Back
                </button>
              </div>
            </div>

            {/* AI transcript (collapsed) */}
            {fullSession.ai_transcript?.length > 0 && (
              <details className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-[12px] text-amber-800 cursor-pointer select-none">
                <summary className="font-medium">📋 AI Conversation History ({fullSession.ai_transcript.length} messages)</summary>
                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {fullSession.ai_transcript.map((m, i) => (
                    <p key={i} className={`leading-relaxed ${m.role === 'assistant' ? 'text-amber-700' : 'text-amber-900'}`}>
                      <span className="font-semibold">{m.role === 'assistant' ? 'Lexi' : 'Customer'}:</span> {m.content}
                    </p>
                  ))}
                </div>
              </details>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4">
              {fullSession.messages.map((m, i) => <ChatMsg key={i} msg={m} />)}
              <div ref={bottomRef} />
            </div>

            {/* Reply input */}
            {fullSession.status !== 'closed' ? (
              <div className="bg-white border-t border-gray-200 p-3 flex gap-2 flex-shrink-0">
                <textarea rows={2} value={replyText} onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder="Type reply… (Enter to send, Shift+Enter for newline)"
                  className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:border-[#0b8fd3] focus:ring-1 focus:ring-[#0b8fd3]" />
                <button onClick={sendReply} disabled={!replyText.trim() || sending}
                  className="px-4 py-2 bg-gradient-to-br from-[#0b8fd3] to-[#0971ab] text-white rounded-xl text-[13px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:from-[#0971ab] hover:to-[#0b8fd3] transition-all shadow">
                  {sending ? '…' : 'Send'}
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 border-t border-gray-100 p-3 text-center text-[12px] text-gray-400">
                Session closed {fullSession.closed_at ? `· ${new Date(fullSession.closed_at).toLocaleString('en-IN')}` : ''}
                {fullSession.csat_rating && ` · CSAT: ${'⭐'.repeat(fullSession.csat_rating)}`}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-400">
              <p className="text-5xl mb-4">💬</p>
              <p className="text-[15px] font-semibold text-gray-600">Select a chat from the queue</p>
              <p className="text-[13px] mt-1">Waiting sessions will appear on the left</p>
              <div className="mt-6 flex items-center gap-2 justify-center text-[12px]">
                <span className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
                <span className="capitalize">You are <strong>{status}</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Close session modal ───────────────────────────────────────── */}
      {showClose && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
            <h2 className="font-bold text-[15px] text-gray-800 mb-1">Close Session</h2>
            <p className="text-[13px] text-gray-500 mb-3">Add a resolution note before closing.</p>
            <textarea rows={3} value={resolution} onChange={e => setResolution(e.target.value)}
              placeholder="Resolution or outcome (optional)…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:border-[#0b8fd3] resize-none mb-3" />
            <div className="flex gap-2">
              <button onClick={() => setShowClose(false)}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={closeSession}
                className="flex-1 py-2 rounded-xl bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600">Close Session</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
