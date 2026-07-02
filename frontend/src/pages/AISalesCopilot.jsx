import { useState, useRef, useEffect, useCallback } from 'react';
import api from '../api/client';
import { Send, RefreshCw, Bot, User, Lightbulb, FileText, MessageSquare, Phone } from 'lucide-react';

const QUICK_PROMPTS = [
  { icon: Lightbulb,   label: 'Qualify this lead',      text: 'How do I qualify a freight lead effectively? What questions should I ask?' },
  { icon: FileText,    label: 'Write proposal intro',   text: 'Write a compelling executive summary for a freight logistics proposal for a manufacturing company needing monthly FTL shipments.' },
  { icon: MessageSquare,label:'WhatsApp follow-up',     text: 'Write a professional WhatsApp follow-up message for a lead who showed interest in our FTL service 2 days ago but has not responded.' },
  { icon: Phone,       label: 'Call script',            text: 'Give me a 5-minute cold call script for reaching out to a logistics manager at a mid-sized manufacturing company.' },
];

export default function AISalesCopilot() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: '👋 Hi! I\'m your AI Sales Copilot. I can help you qualify leads, write proposals, generate follow-up messages, create call scripts, and provide sales strategy advice.\n\nWhat would you like help with today?' }
  ]);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const { data } = await api.post('/sales/copilot', { message: msg });
      setMessages(m => [...m, { role: 'assistant', text: data.reply }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: 'Sorry, I\'m having trouble connecting. Please try again.' }]);
    }
    setLoading(false);
  }, [input]);

  const clear = () => setMessages([
    { role: 'assistant', text: 'Chat cleared. How can I help with your sales today?' }
  ]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">AI Sales Copilot</p>
            <p className="text-xs text-green-400">Powered by Claude AI</p>
          </div>
        </div>
        <button onClick={clear} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-700">
          <RefreshCw size={12} /> Clear
        </button>
      </div>

      {/* Quick prompts */}
      <div className="flex gap-2 p-3 overflow-x-auto border-b border-slate-700 bg-slate-800/50">
        {QUICK_PROMPTS.map(({ icon: Icon, label, text }) => (
          <button key={label} onClick={() => send(text)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-full text-xs transition-colors">
            <Icon size={12} className="text-blue-400" />
            {label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${m.role === 'assistant' ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-slate-600'}`}>
              {m.role === 'assistant' ? <Bot size={14} className="text-white" /> : <User size={14} className="text-white" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${m.role === 'assistant' ? 'bg-slate-800 text-slate-100 rounded-tl-sm' : 'bg-blue-600 text-white rounded-tr-sm'}`}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center h-5">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-700 bg-slate-800">
        <div className="flex gap-2">
          <input
            className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            placeholder="Ask about leads, proposals, follow-ups, pricing…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
            <Send size={16} className="text-white" />
          </button>
        </div>
        <p className="text-xs text-slate-600 text-center mt-2">Suggestions are AI-generated. Always verify before using.</p>
      </div>
    </div>
  );
}
