import React, { useState, useEffect } from 'react';
const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

export default function FinancialForecast() {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiContext, setAiContext] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ forecast_name: '', forecast_type: 'revenue', period: 'monthly', total_forecast: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchForecasts(); }, []);

  const fetchForecasts = async () => {
    try {
      setLoading(true);
      const r = await fetch(`${_BASE}/forecast-finance`, { headers: h() });
      const d = await r.json();
      setForecasts(Array.isArray(d) ? d : d.data || []);
    } catch (e) { setError('Failed to load forecasts'); }
    finally { setLoading(false); }
  };

  const generateAI = async () => {
    try {
      setAiLoading(true);
      setAiResult(null);
      const r = await fetch(`${_BASE}/forecast-finance/ai-forecast`, {
        method: 'POST', headers: h(),
        body: JSON.stringify({ forecast_type: 'revenue', periods: 6, context: aiContext })
      });
      const d = await r.json();
      setAiResult(d);
    } catch (e) { setError('AI forecast failed'); }
    finally { setAiLoading(false); }
  };

  const createForecast = async () => {
    try {
      setSaving(true);
      await fetch(`${_BASE}/forecast-finance`, { method: 'POST', headers: h(), body: JSON.stringify(form) });
      setShowModal(false);
      fetchForecasts();
    } catch (e) { setError('Failed to create forecast'); }
    finally { setSaving(false); }
  };

  const fmt = v => `₹${Number(v || 0).toLocaleString('en-IN')}`;

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', padding: '24px', color: '#e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Financial Forecast</h1>
        <button onClick={() => setShowModal(true)} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>+ New Forecast</button>
      </div>
      {error && <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {/* Forecast Cards */}
      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16, marginBottom: 32 }}>
          {forecasts.map((f, i) => (
            <div key={i} style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155' }}>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>{f.forecast_type?.toUpperCase()}</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{f.forecast_name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>Period: {f.period}</span>
                <span style={{ color: '#3b82f6', fontWeight: 700 }}>{fmt(f.total_forecast)}</span>
              </div>
              {f.accuracy_pct != null && (
                <div style={{ background: '#0f172a', borderRadius: 6, padding: '4px 10px', display: 'inline-block', fontSize: 12, color: '#22c55e' }}>
                  Accuracy: {f.accuracy_pct}%
                </div>
              )}
            </div>
          ))}
          {forecasts.length === 0 && <div style={{ color: '#64748b', gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>No forecasts found</div>}
        </div>
      )}

      {/* AI Forecast Panel */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155', marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#3b82f6' }}>AI Forecast Generator</h2>
        <textarea
          value={aiContext}
          onChange={e => setAiContext(e.target.value)}
          placeholder="Describe what you want to forecast (e.g. 'Forecast next 6 months revenue based on Q1 growth of 12%...')"
          style={{ width: '100%', minHeight: 100, background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: 12, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
        />
        <button onClick={generateAI} disabled={aiLoading || !aiContext.trim()} style={{ marginTop: 12, background: aiLoading ? '#1e40af' : '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: aiLoading ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
          {aiLoading ? 'Generating...' : 'Generate AI Forecast'}
        </button>

        {aiResult && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Forecast Results</h3>
            {Array.isArray(aiResult.forecast) && (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', color: '#94a3b8', fontSize: 13, borderBottom: '1px solid #334155' }}>Period</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', color: '#94a3b8', fontSize: 13, borderBottom: '1px solid #334155' }}>Forecast Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {aiResult.forecast.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '10px 14px', color: '#e2e8f0' }}>{row.period_label}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#22c55e', fontWeight: 600 }}>{fmt(row.forecast_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {aiResult.key_assumptions?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: '#22c55e' }}>Key Assumptions</div>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {aiResult.key_assumptions.map((a, i) => <li key={i} style={{ color: '#94a3b8', marginBottom: 4, fontSize: 14 }}>{a}</li>)}
                </ul>
              </div>
            )}
            {aiResult.risks?.length > 0 && (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 8, color: '#f59e0b' }}>Risks</div>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {aiResult.risks.map((r, i) => <li key={i} style={{ color: '#94a3b8', marginBottom: 4, fontSize: 14 }}>{r}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 32, width: 480, border: '1px solid #334155' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>Create Manual Forecast</h2>
            {['forecast_name', 'period', 'total_forecast'].map(k => (
              <div key={k} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>{k.replace(/_/g, ' ').toUpperCase()}</label>
                <input value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                  style={{ width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>FORECAST TYPE</label>
              <select value={form.forecast_type} onChange={e => setForm(p => ({ ...p, forecast_type: e.target.value }))}
                style={{ width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px' }}>
                {['revenue', 'expense', 'cash_flow', 'profit'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} style={{ background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={createForecast} disabled={saving} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>
                {saving ? 'Saving...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
