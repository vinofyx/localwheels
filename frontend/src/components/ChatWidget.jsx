import React, { useState, useRef, useEffect, useCallback } from 'react';
import api from '../api/client';

// ─── Quick action chips shown on first open ───────────────────────────────────
const QUICK_ACTIONS = [
  { label: '📦 Track Shipment',  text: 'I want to track my shipment' },
  { label: '💰 Get Quote',       text: 'I need a freight price quote' },
  { label: '🚨 File Complaint',  text: 'I want to register a complaint' },
  { label: '📞 Talk to Human',   text: 'I want to speak to a support agent' },
];

const WELCOME = "Hi! I'm **Lexi** 👋, your LocalWheels AI assistant.\n\nI can help you track shipments, get freight quotes, file complaints, and more. How can I help you today?";

// ─── Markdown-lite renderer (bold + newlines only) ────────────────────────────
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
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
        />
      ))}
    </div>
  );
}

// ─── Single message bubble ────────────────────────────────────────────────────
function Bubble({ msg }) {
  const isBot = msg.role === 'assistant';
  return (
    <div className={`flex gap-2 items-end ${isBot ? '' : 'flex-row-reverse'}`}>
      {isBot && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 mb-0.5 shadow">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
          </svg>
        </div>
      )}
      <div
        className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
          isBot
            ? 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
            : 'bg-gradient-to-br from-[#0b8fd3] to-[#0971ab] text-white rounded-br-sm'
        }`}
      >
        <MsgText text={msg.content} />
      </div>
    </div>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────
export default function ChatWidget() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread]   = useState(0);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Build history for API (exclude welcome message which is synthetic)
    const history = [...messages, userMsg]
      .filter((_, i) => i > 0 || messages[0].content !== WELCOME)
      .map(m => ({ role: m.role, content: m.content }));

    // Ensure history starts with a user message (API requirement)
    const apiMessages = history.filter(m => m.role === 'user' || m.role === 'assistant');
    // Drop leading assistant messages
    const firstUser = apiMessages.findIndex(m => m.role === 'user');
    const trimmedHistory = firstUser >= 0 ? apiMessages.slice(firstUser) : [{ role: 'user', content: trimmed }];

    try {
      const { data } = await api.post('/chat', { messages: trimmedHistory });
      const reply = data.reply || "I couldn't process that. Please try again.";
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      if (!open) setUnread(u => u + 1);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please call 📞 **1800-123-4567** for immediate support."
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, open]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleQuick = (text) => {
    setInput('');
    sendMessage(text);
  };

  const showQuickActions = messages.length <= 1 && !loading;

  return (
    <>
      {/* ── Chat Panel ─────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed bottom-20 right-4 z-[2000] flex flex-col shadow-2xl rounded-2xl overflow-hidden"
          style={{ width: 'min(380px, calc(100vw - 24px))', height: 'min(540px, calc(100vh - 120px))' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0b8fd3] to-[#0971ab] px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-[14px] leading-tight">Lexi · AI Support</p>
              <p className="text-white/70 text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                LocalWheels · Always Online
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors flex-shrink-0"
            >
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
            <div ref={bottomRef} />
          </div>

          {/* Quick action chips */}
          {showQuickActions && (
            <div className="bg-gray-50 border-t border-gray-100 px-3 py-2 flex flex-wrap gap-1.5 flex-shrink-0">
              {QUICK_ACTIONS.map(a => (
                <button
                  key={a.label}
                  onClick={() => handleQuick(a.text)}
                  className="text-[12px] px-3 py-1.5 rounded-full border border-[#0b8fd3]/40 text-[#0b8fd3] bg-[#0b8fd3]/5 hover:bg-[#0b8fd3]/10 transition-colors whitespace-nowrap font-medium"
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="bg-white border-t border-gray-200 px-3 py-2.5 flex gap-2 items-end flex-shrink-0">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message…"
              disabled={loading}
              className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0b8fd3] focus:ring-1 focus:ring-[#0b8fd3] disabled:opacity-50 max-h-24 overflow-y-auto leading-relaxed"
              style={{ minHeight: '38px' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0b8fd3] to-[#0971ab] flex items-center justify-center text-white hover:from-[#0971ab] hover:to-[#0b8fd3] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0 shadow"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>

          {/* Powered by */}
          <div className="bg-white text-center pb-1.5">
            <p className="text-[10px] text-gray-400">Powered by LocalWheels AI · Claude</p>
          </div>
        </div>
      )}

      {/* ── Floating Trigger Button ─────────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-4 right-4 z-[2000] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
        aria-label="Chat with Lexi"
      >
        {open ? (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}

        {/* Unread badge */}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
            {unread}
          </span>
        )}

        {/* Pulse ring when closed */}
        {!open && (
          <span className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }} />
        )}
      </button>
    </>
  );
}
