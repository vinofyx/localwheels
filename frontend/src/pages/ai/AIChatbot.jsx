import React, { useState, useRef, useEffect } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';

const SUGGESTIONS = [
  'Track LR2024001',
  'Show delayed shipments',
  'Vehicle MH12AB1234 status',
  'Today fuel consumption',
  'POD pending list',
  'Invoice INV12345 status',
];

export default function AIChatbot() {
  const [messages, setMessages] = useState([
    { role: 'bot', text: '👋 Hello! I\'m the LocalWheels AI Assistant. I can help you with:\n• Shipment tracking & LR status\n• Vehicle & driver information\n• Fuel & maintenance alerts\n• Invoice & POD queries\n• Warehouse & delivery updates\n\nHow can I help you today?', time: new Date().toISOString() },
  ]);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef           = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(text) {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', text: msg, time: new Date().toISOString() }]);
    setLoading(true);
    try {
      const r = await api.post('/ai/chatbot', { message: msg });
      setMessages(m => [...m, { role: 'bot', text: r.data.reply, time: r.data.timestamp }]);
    } catch {
      setMessages(m => [...m, { role: 'bot', text: '⚠️ Sorry, I couldn\'t process that. Please try again.', time: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-3 space-y-3">
      <div className="bg-gradient-to-r from-[#ec4899] to-[#db2777] rounded shadow text-white px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold">🤖 AI Chatbot — LocalWheels Assistant</h1>
          <p className="text-pink-100 text-[12px]">Track shipments, check status, voice assistant, WhatsApp integration</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[12px] text-pink-100">Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Chat Window */}
        <div className="lg:col-span-3 flex flex-col bg-white rounded shadow-sm" style={{ height: 520 }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-[12px] shadow-sm ${
                  m.role === 'user'
                    ? 'bg-[#ec4899] text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  {m.role === 'bot' && (
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-sm">🤖</span>
                      <span className="text-[10px] font-bold text-pink-600">AI Assistant</span>
                    </div>
                  )}
                  <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                  <p className={`text-[9px] mt-1 text-right ${m.role==='user' ? 'text-pink-100' : 'text-gray-400'}`}>
                    {new Date(m.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3">
            <div className="flex gap-2">
              <input
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-[12px] focus:outline-none focus:border-pink-400"
                placeholder="Type a message or ask about LR, vehicle, fuel…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                disabled={loading}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="w-9 h-9 rounded-full bg-[#ec4899] text-white flex items-center justify-center hover:bg-[#db2777] disabled:opacity-50 transition-colors flex-shrink-0">
                <svg className="w-4 h-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          <div className="bg-white rounded shadow-sm p-3">
            <h3 className="text-[12px] font-bold text-gray-700 mb-2">💡 Quick Queries</h3>
            <div className="space-y-1.5">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="w-full text-left text-[11px] px-3 py-1.5 bg-pink-50 text-pink-700 rounded-lg hover:bg-pink-100 transition-colors font-medium">
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded shadow-sm p-3">
            <h3 className="text-[12px] font-bold text-gray-700 mb-2">🔗 Channels</h3>
            <div className="space-y-2">
              {[
                { icon: '💬', label: 'In-App Chat',    status: 'Active',       color: 'text-green-600' },
                { icon: '📱', label: 'WhatsApp Bot',   status: 'Coming Soon',  color: 'text-gray-400' },
                { icon: '🎤', label: 'Voice Assistant',status: 'Coming Soon',  color: 'text-gray-400' },
                { icon: '✉️',  label: 'Email Bot',      status: 'Coming Soon',  color: 'text-gray-400' },
              ].map(c => (
                <div key={c.label} className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5">{c.icon} {c.label}</span>
                  <span className={`font-bold ${c.color}`}>{c.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded shadow-sm p-3">
            <h3 className="text-[12px] font-bold text-gray-700 mb-2">📊 Session Stats</h3>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between"><span className="text-gray-500">Messages sent</span><b>{messages.filter(m=>m.role==='user').length}</b></div>
              <div className="flex justify-between"><span className="text-gray-500">AI responses</span><b>{messages.filter(m=>m.role==='bot').length}</b></div>
              <div className="flex justify-between"><span className="text-gray-500">Avg response</span><b>&lt; 1s</b></div>
            </div>
            <button onClick={() => setMessages([messages[0]])} className="mt-2 w-full text-[11px] py-1 border border-gray-200 rounded text-gray-500 hover:bg-gray-50">
              Clear Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
