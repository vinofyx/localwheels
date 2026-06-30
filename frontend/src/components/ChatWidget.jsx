import React, { useState, useRef, useEffect, useCallback } from 'react';
import api from '../api/client';

// ─── Constants ────────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: '📦 Track Shipment',  text: 'I want to track my shipment' },
  { label: '💰 Get Quote',       text: 'I need a freight price quote' },
  { label: '🚨 File Complaint',  text: 'I want to register a complaint' },
  { label: '🏢 Find Branch',     text: 'Where is the nearest branch?' },
  { label: '📞 Talk to Agent',   text: '__AGENT__' },
];

const WELCOME = "Hi! I'm **Lexi** 👋, your LocalWheels AI assistant.\n\nI can help you track shipments, get freight quotes, file complaints, and more. How can I help you today?";
const LANGS   = [
  { code: 'en-IN', label: 'EN' }, { code: 'hi-IN', label: 'HI' },
  { code: 'te-IN', label: 'TE' }, { code: 'ta-IN', label: 'TA' },
  { code: 'kn-IN', label: 'KA' },
];

// ─── Markdown-lite renderer ───────────────────────────────────────────────────
function MsgText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i}>{p.slice(2, -2)}</strong>
          : p.split('\n').map((line, j, arr) => (
              <React.Fragment key={`${i}-${j}`}>
                {line}{j < arr.length - 1 && <br />}
              </React.Fragment>
            ))
      )}
    </span>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }} />
      ))}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function Bubble({ msg }) {
  const isBot   = msg.role === 'assistant';
  const isSystem = msg.role === 'system';
  if (isSystem) return (
    <div className="text-center my-1">
      <span className="text-[11px] text-gray-400 bg-gray-100 rounded-full px-3 py-1">{msg.content}</span>
    </div>
  );
  return (
    <div className={`flex gap-2 items-end ${isBot ? '' : 'flex-row-reverse'}`}>
      {isBot && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 mb-0.5 shadow">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
          </svg>
        </div>
      )}
      <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
        isBot
          ? 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
          : 'bg-gradient-to-br from-[#0b8fd3] to-[#0971ab] text-white rounded-br-sm'
      }`}>
        <MsgText text={msg.content} />
        {msg.from === 'agent' && (
          <p className="text-[10px] mt-1 opacity-60">Support Agent</p>
        )}
      </div>
    </div>
  );
}

// ─── CSAT Rating ──────────────────────────────────────────────────────────────
function CSATRating({ sessionId, onDone }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover]   = useState(0);
  const [sent, setSent]     = useState(false);

  const submit = async (r) => {
    setRating(r);
    await api.post(`/live-agent/session/${sessionId}/rate`, { rating: r }).catch(() => {});
    setSent(true);
    setTimeout(onDone, 2000);
  };

  if (sent) return (
    <div className="text-center py-3 text-[13px] text-gray-500">Thank you for your feedback! 🙏</div>
  );
  return (
    <div className="bg-blue-50 rounded-xl p-3 text-center">
      <p className="text-[12px] text-gray-600 mb-2 font-medium">How was your support experience?</p>
      <div className="flex justify-center gap-2">
        {[1,2,3,4,5].map(s => (
          <button key={s} onClick={() => submit(s)}
            onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
            className={`text-2xl transition-transform ${(hover || rating) >= s ? 'scale-125' : 'opacity-40'}`}>
            ⭐
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main ChatWidget ──────────────────────────────────────────────────────────
export default function ChatWidget() {
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState([{ role: 'assistant', content: WELCOME }]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [unread, setUnread]       = useState(0);
  const [lang, setLang]           = useState('en-IN');
  const [listening, setListening] = useState(false);
  const [agentMode, setAgentMode] = useState(false);   // true when connected to live agent
  const [agentSessionId, setAgentSessionId] = useState(null);
  const [agentStatus, setAgentStatus]       = useState('idle'); // idle | waiting | active | closed
  const [showCsat, setShowCsat]   = useState(false);
  const [sessionId]               = useState(() => `sess_${Date.now().toString(36)}`);

  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const pollRef     = useRef(null);
  const recognRef   = useRef(null);
  const lastMsgCount = useRef(0);

  // Auto-scroll
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  // Focus + clear unread on open
  useEffect(() => {
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 150); }
  }, [open]);

  // ── Agent polling ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!agentSessionId || agentStatus === 'closed') {
      clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/live-agent/session/${agentSessionId}`);
        const d = data.data;

        // Status transition: waiting → active
        if (d.status === 'active' && agentStatus === 'waiting') {
          setAgentStatus('active');
          setMessages(prev => [...prev, { role: 'system', content: '✅ Agent connected! You can now chat.' }]);
        }
        if (d.status === 'closed' && agentStatus !== 'closed') {
          setAgentStatus('closed');
          setShowCsat(true);
          clearInterval(pollRef.current);
          return;
        }

        // Append new agent messages
        const agentMsgs = d.messages.filter(m => m.from === 'agent' || m.from === 'system');
        if (agentMsgs.length > lastMsgCount.current) {
          const newOnes = agentMsgs.slice(lastMsgCount.current);
          lastMsgCount.current = agentMsgs.length;
          newOnes.forEach(m => {
            setMessages(prev => [...prev, { role: 'assistant', content: m.content, from: m.from }]);
          });
          if (!open) setUnread(u => u + newOnes.length);
        }
      } catch { /* ignore polling errors */ }
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [agentSessionId, agentStatus, open]);

  // ── Voice input ───────────────────────────────────────────────────────────
  const startVoice = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Voice input not supported in this browser. Use Chrome.'); return; }
    if (recognRef.current) { recognRef.current.stop(); return; }

    const r = new SpeechRecognition();
    r.lang = lang;
    r.continuous = false;
    r.interimResults = false;
    recognRef.current = r;
    setListening(true);

    r.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + t);
    };
    r.onend = () => { setListening(false); recognRef.current = null; };
    r.onerror = () => { setListening(false); recognRef.current = null; };
    r.start();
  }, [lang]);

  // ── Request live agent ────────────────────────────────────────────────────
  const requestAgent = useCallback(async () => {
    setMessages(prev => [...prev, { role: 'system', content: '⏳ Connecting you to a live support agent...' }]);
    setLoading(true);
    try {
      const transcript = messages
        .filter(m => m.role !== 'system')
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const { data } = await api.post('/live-agent/request', {
        issue_summary: 'Customer requested live agent from chat widget',
        channel: 'website',
        chat_session_id: sessionId,
        ai_transcript: transcript,
      });

      setAgentSessionId(data.data.session_id);
      setAgentStatus('waiting');
      setAgentMode(true);
      lastMsgCount.current = 0;
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "You're in the queue. An agent will be with you shortly (**2–5 minutes**). Feel free to describe your issue while you wait.",
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, couldn't connect to an agent right now. Please call 📞 **1800-123-4567** (Mon–Sat 9 AM–8 PM).",
      }]);
    } finally { setLoading(false); }
  }, [messages, sessionId]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;
    if (trimmed === '__AGENT__') { setInput(''); return requestAgent(); }
    setInput('');

    const userMsg = { role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Agent mode: send via live agent API
    if (agentMode && agentSessionId && agentStatus !== 'closed') {
      try {
        await api.post(`/live-agent/session/${agentSessionId}/message`, { content: trimmed });
      } catch {
        setMessages(prev => [...prev, { role: 'assistant', content: "Couldn't send message. Please try again." }]);
      }
      setLoading(false);
      return;
    }

    // AI mode
    const history = [...messages, userMsg]
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .reduce((acc, m, i, arr) => {
        if (i === 0 && m.role === 'assistant' && m.content === WELCOME) return acc; // skip welcome
        if (i === 0 && m.role !== 'user') return acc; // skip leading assistant
        acc.push({ role: m.role, content: m.content });
        return acc;
      }, []);
    const firstUser = history.findIndex(m => m.role === 'user');
    const trimmedHistory = firstUser >= 0 ? history.slice(firstUser) : [{ role: 'user', content: trimmed }];

    try {
      const { data } = await api.post('/chat', { messages: trimmedHistory }, {
        headers: { 'x-session-id': sessionId },
      });
      const reply = data.reply || "I couldn't process that. Please try again.";

      // Auto-escalate if AI detects agent request
      if (/\btalk to (a|an)? ?(human|agent|person|representative)\b/i.test(trimmed)) {
        await requestAgent();
        setLoading(false);
        return;
      }
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      if (!open) setUnread(u => u + 1);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please call 📞 **1800-123-4567** for immediate support.",
      }]);
    } finally { setLoading(false); }
  }, [input, loading, messages, agentMode, agentSessionId, agentStatus, open, sessionId, requestAgent]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const showQuickActions = messages.length <= 1 && !loading && !agentMode;

  const agentStatusBadge = agentMode
    ? agentStatus === 'waiting' ? { text: 'In Queue', color: 'bg-yellow-400' }
    : agentStatus === 'active'  ? { text: 'Agent Connected', color: 'bg-green-400' }
    : { text: 'Session Ended', color: 'bg-gray-400' }
    : null;

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-4 z-[2000] flex flex-col shadow-2xl rounded-2xl overflow-hidden"
          style={{ width: 'min(380px, calc(100vw - 24px))', height: 'min(560px, calc(100vh - 120px))' }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-[#0b8fd3] to-[#0971ab] px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-[14px] leading-tight">
                {agentMode ? 'Live Support Agent' : 'Lexi · AI Support'}
              </p>
              <p className="text-white/70 text-[11px] flex items-center gap-1">
                {agentStatusBadge
                  ? <><span className={`w-1.5 h-1.5 rounded-full ${agentStatusBadge.color} inline-block`} />{agentStatusBadge.text}</>
                  : <><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />LocalWheels · Always Online</>
                }
              </p>
            </div>

            {/* Language selector */}
            <select value={lang} onChange={e => setLang(e.target.value)}
              className="text-[10px] bg-white/10 text-white border-0 rounded px-1 py-0.5 cursor-pointer focus:outline-none flex-shrink-0">
              {LANGS.map(l => <option key={l.code} value={l.code} className="text-black">{l.label}</option>)}
            </select>

            <button onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-gray-50 px-3 py-4 flex flex-col gap-3">
            {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
            {loading && (
              <div className="flex gap-2 items-end">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
                  </svg>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm shadow-sm">
                  <TypingDots />
                </div>
              </div>
            )}
            {showCsat && agentSessionId && (
              <CSATRating sessionId={agentSessionId} onDone={() => setShowCsat(false)} />
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick actions */}
          {showQuickActions && (
            <div className="bg-gray-50 border-t border-gray-100 px-3 py-2 flex flex-wrap gap-1.5 flex-shrink-0">
              {QUICK_ACTIONS.map(a => (
                <button key={a.label} onClick={() => sendMessage(a.text)}
                  className="text-[12px] px-3 py-1.5 rounded-full border border-[#0b8fd3]/40 text-[#0b8fd3] bg-[#0b8fd3]/5 hover:bg-[#0b8fd3]/10 transition-colors whitespace-nowrap font-medium">
                  {a.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className={`bg-white border-t px-3 py-2.5 flex gap-2 items-end flex-shrink-0 ${agentStatus === 'closed' ? 'opacity-50 pointer-events-none' : ''}`}>
            <textarea ref={inputRef} rows={1} value={input}
              onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder={agentMode ? 'Message agent…' : 'Type a message…'}
              disabled={loading || agentStatus === 'closed'}
              className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0b8fd3] focus:ring-1 focus:ring-[#0b8fd3] disabled:opacity-50 max-h-24 overflow-y-auto leading-relaxed"
              style={{ minHeight: '38px' }} />

            {/* Voice button */}
            <button onClick={startVoice} disabled={loading || agentStatus === 'closed'}
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                listening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-40'
              }`} title="Voice input">
              <svg className="w-4 h-4" fill={listening ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>

            {/* Send button */}
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0b8fd3] to-[#0971ab] flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0 shadow">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>

          <div className="bg-white text-center pb-1.5">
            <p className="text-[10px] text-gray-400">Powered by LocalWheels AI · Claude</p>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button onClick={() => setOpen(o => !o)}
        className="fixed bottom-4 right-4 z-[2000] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
        aria-label="Chat with Lexi">
        {open
          ? <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          : <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        }
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
        {!open && (
          <span className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }} />
        )}
      </button>
    </>
  );
}
