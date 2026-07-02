import { useState, useRef, useEffect } from 'react';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

const SUGGESTED_QUESTIONS = [
  'What is our revenue trend this month?',
  'Why are deliveries delayed?',
  'Which customers are generating the most revenue?',
  'What is our complaint resolution rate?',
  'Forecast next month revenue.',
  'What operational risks should I be aware of?',
  'How is fleet utilization performing?',
  'Generate an executive summary for the board.',
];

export default function AIExecutiveCopilot() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I\'m your AI Executive Copilot. I have access to real-time data from all Local Wheels modules — shipments, revenue, complaints, fleet, documents and more. What business question can I answer for you?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const ask = async (question) => {
    const q = question || input.trim();
    if (!q) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);

    try {
      const r = await api.post(`${_BASE}/business-intelligence/query`, { question: q });
      const { answer, data } = r.data;
      let text = answer;
      if (data?.recommendation) text += `\n\n💡 **Recommendation:** ${data.recommendation}`;
      setMessages(prev => [...prev, { role: 'assistant', text, data: r.data }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'I encountered an error fetching business data. Please try again.', error: true }]);
    }
    setLoading(false);
  };

  const clear = () => setMessages([{ role: 'assistant', text: 'Conversation cleared. How can I help you today?' }]);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Executive Copilot</h1>
          <p className="text-sm text-gray-500 mt-0.5">Natural language business intelligence powered by Claude AI</p>
        </div>
        <button onClick={clear} className="text-sm text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg">Clear</button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* Chat */}
        <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2 shrink-0 mt-0.5">
                    🤖
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : msg.error
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}>
                  {msg.text.split('\n').map((line, j) => (
                    <p key={j} className={j > 0 ? 'mt-1' : ''}>
                      {line.startsWith('💡 **Recommendation:**') ? (
                        <span className="font-medium">{line}</span>
                      ) : line}
                    </p>
                  ))}
                  {msg.data?.context && (
                    <div className="mt-2 pt-2 border-t border-gray-200 grid grid-cols-2 gap-1 text-xs text-gray-500">
                      <span>Shipments: {msg.data.context.shipmentsThisMonth}</span>
                      <span>Delivery: {msg.data.context.deliveryRate}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2 shrink-0">🤖</div>
                <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-3">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && ask()}
                placeholder="Ask any business question..."
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                disabled={loading}
              />
              <button onClick={() => ask()} disabled={loading || !input.trim()} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Suggested Questions */}
        <div className="lg:w-64 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Suggested Questions</h2>
          <div className="space-y-2">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button key={i} onClick={() => ask(q)} disabled={loading} className="w-full text-left text-sm text-gray-700 bg-white border border-gray-200 rounded-xl px-3 py-2.5 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors disabled:opacity-50">
                {q}
              </button>
            ))}
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-700 mt-4">
            <div className="font-semibold mb-1">💡 Powered by Claude AI</div>
            <div>Accesses real-time data from Shipments, Revenue, Complaints, Fleet, Documents and all other modules.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
