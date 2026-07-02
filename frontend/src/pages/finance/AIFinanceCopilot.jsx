import React, { useState, useEffect, useRef } from 'react';
const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

export default function AIFinanceCopilot() {
  const [analyses, setAnalyses] = useState([]);
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [analyzeLoading, setAnalyzeLoading] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [context, setContext] = useState({});
  const [forecastMonths, setForecastMonths] = useState(6);
  const [forecastResult, setForecastResult] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => { fetchContext(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const fetchContext = async () => {
    try {
      const r = await fetch(`${_BASE}/finance-analytics/dashboard`, { headers: h() });
      const d = await r.json();
      setContext(d);
    } catch (e) { /* non-critical */ }
  };

  const analyze = async (analysis_type) => {
    try {
      setAnalyzeLoading(analysis_type);
      const r = await fetch(`${_BASE}/finance-copilot/analyze`, {
        method: 'POST', headers: h(), body: JSON.stringify({ analysis_type })
      });
      const d = await r.json();
      const newAnalysis = { ...d, analysis_type, timestamp: new Date() };
      setAnalyses(prev => [newAnalysis, ...prev]);
      setActiveAnalysis(newAnalysis);
    } catch (e) { setError('Analysis failed'); }
    finally { setAnalyzeLoading(''); }
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const question = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: question }]);
    try {
      setChatLoading(true);
      const r = await fetch(`${_BASE}/finance-copilot/chat`, {
        method: 'POST', headers: h(), body: JSON.stringify({ question })
      });
      const d = await r.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: d.response || d.answer || JSON.stringify(d) }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', error: true }]);
    } finally { setChatLoading(false); }
  };

  const generateForecast = async () => {
    try {
      setForecastLoading(true);
      setForecastResult(null);
      const r = await fetch(`${_BASE}/finance-copilot/forecast`, {
        method: 'POST', headers: h(), body: JSON.stringify({ months: forecastMonths })
      });
      const d = await r.json();
      setForecastResult(d);
    } catch (e) { setError('Forecast failed'); }
    finally { setForecastLoading(false); }
  };

  const fmt = v => `₹${Number(v || 0).toLocaleString('en-IN')}`;

  const quickButtons = [
    { label: 'Analyze Revenue', type: 'revenue', color: '#22c55e', bg: '#166534' },
    { label: 'Analyze Expenses', type: 'expenses', color: '#ef4444', bg: '#7f1d1d' },
    { label: 'Cash Flow Risk', type: 'cash_flow', color: '#f59e0b', bg: '#78350f' },
  ];

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', padding: '24px', color: '#e2e8f0' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 24px' }}>AI Finance Copilot</h1>
      {error && <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: 12, borderRadius: 8, marginBottom: 16 }} onClick={() => setError('')}>{error} ✕</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* Left Panel: Analyses List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Quick Analysis Buttons */}
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 16, border: '1px solid #334155' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>QUICK ANALYSIS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {quickButtons.map(btn => (
                <button key={btn.type} onClick={() => analyze(btn.type)} disabled={!!analyzeLoading}
                  style={{ background: analyzeLoading === btn.type ? btn.bg : '#0f172a', color: btn.color, border: `1px solid ${btn.color}44`, borderRadius: 8, padding: '10px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {analyzeLoading === btn.type ? '...' : '▶'} {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recent Analyses */}
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 16, border: '1px solid #334155', flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>RECENT ANALYSES</div>
            {analyses.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: 13, textAlign: 'center', padding: 20 }}>No analyses yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {analyses.map((a, i) => (
                  <div key={i} onClick={() => setActiveAnalysis(a)}
                    style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${activeAnalysis === a ? '#3b82f6' : '#334155'}`, background: activeAnalysis === a ? '#1e3a5f' : 'transparent' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', textTransform: 'capitalize' }}>{a.analysis_type?.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{new Date(a.timestamp).toLocaleTimeString('en-IN')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Analysis Result */}
          {activeAnalysis && (
            <div style={{ background: '#1e293b', borderRadius: 12, padding: 22, border: '1px solid #3b82f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, textTransform: 'capitalize' }}>{activeAnalysis.analysis_type?.replace(/_/g, ' ')} Analysis</h2>
                <button onClick={() => setActiveAnalysis(null)} style={{ background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>✕</button>
              </div>
              {activeAnalysis.summary && <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>{activeAnalysis.summary}</p>}
              {activeAnalysis.recommendations?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, color: '#22c55e', marginBottom: 8, fontSize: 14 }}>Recommendations</div>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {activeAnalysis.recommendations.map((r, i) => <li key={i} style={{ color: '#94a3b8', marginBottom: 6, fontSize: 13, lineHeight: 1.5 }}>{r}</li>)}
                  </ul>
                </div>
              )}
              {activeAnalysis.risks?.length > 0 && (
                <div>
                  <div style={{ fontWeight: 600, color: '#f59e0b', marginBottom: 8, fontSize: 14 }}>Risks</div>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {activeAnalysis.risks.map((r, i) => <li key={i} style={{ color: '#94a3b8', marginBottom: 6, fontSize: 13, lineHeight: 1.5 }}>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Context Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[
              { label: 'Revenue', value: fmt(context.revenue_mtd), color: '#22c55e' },
              { label: 'Expenses', value: fmt(context.expenses_mtd), color: '#ef4444' },
              { label: 'Outstanding', value: fmt(context.outstanding), color: '#f59e0b' },
              { label: 'Net Profit', value: fmt(context.net_profit), color: context.net_profit >= 0 ? '#22c55e' : '#ef4444' },
            ].map((c, i) => (
              <div key={i} style={{ background: '#1e293b', borderRadius: 10, padding: 14, border: '1px solid #334155', textAlign: 'center' }}>
                <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>{c.label}</div>
                <div style={{ color: c.color, fontWeight: 700, fontSize: 15 }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Chat Interface */}
          <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', display: 'flex', flexDirection: 'column', minHeight: 340 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #334155', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: '#3b82f6' }}>●</span> AI Finance Assistant
            </div>
            <div style={{ flex: 1, padding: 16, overflowY: 'auto', maxHeight: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {chatMessages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#64748b', fontSize: 13, marginTop: 40 }}>Ask anything about your finances...</div>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '80%', padding: '10px 14px', borderRadius: 12, fontSize: 14, lineHeight: 1.6,
                    background: m.role === 'user' ? '#3b82f6' : m.error ? '#7f1d1d' : '#0f172a',
                    color: m.role === 'user' ? '#fff' : m.error ? '#fca5a5' : '#e2e8f0',
                    borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px'
                  }}>{m.content}</div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ background: '#0f172a', padding: '10px 14px', borderRadius: '12px 12px 12px 4px', color: '#64748b', fontSize: 14 }}>Thinking...</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: 14, borderTop: '1px solid #334155', display: 'flex', gap: 10 }}>
              <textarea value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendChat())}
                placeholder="Ask about revenue trends, cash flow, expenses... (Enter to send)"
                rows={2}
                style={{ flex: 1, background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', resize: 'none', fontSize: 14 }} />
              <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}
                style={{ background: chatInput.trim() ? '#3b82f6' : '#334155', color: '#fff', border: 'none', borderRadius: 8, padding: '0 20px', cursor: chatInput.trim() ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 14 }}>
                Ask
              </button>
            </div>
          </div>

          {/* Forecast Section */}
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 22, border: '1px solid #334155' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Revenue Forecast</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>FORECAST MONTHS: {forecastMonths}</label>
                <input type="range" min={3} max={12} value={forecastMonths} onChange={e => setForecastMonths(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#3b82f6' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  <span>3 months</span><span>12 months</span>
                </div>
              </div>
              <button onClick={generateForecast} disabled={forecastLoading}
                style={{ background: forecastLoading ? '#1e40af' : '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 20px', cursor: forecastLoading ? 'not-allowed' : 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {forecastLoading ? 'Forecasting...' : 'Forecast Revenue'}
              </button>
            </div>

            {forecastResult && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    {['Period', 'Forecast Amount', 'Confidence'].map(c => (
                      <th key={c} style={{ padding: '10px 14px', textAlign: c === 'Period' ? 'left' : 'right', color: '#94a3b8', fontSize: 12, borderBottom: '1px solid #334155' }}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(forecastResult.forecast || []).map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '10px 14px', color: '#e2e8f0', fontWeight: 600 }}>{row.period || row.month || row.period_label}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#22c55e', fontWeight: 700 }}>{fmt(row.amount || row.forecast_amount)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#94a3b8' }}>
                        {row.confidence ? <span style={{ color: row.confidence > 0.7 ? '#22c55e' : '#f59e0b' }}>{(row.confidence * 100).toFixed(0)}%</span> : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
