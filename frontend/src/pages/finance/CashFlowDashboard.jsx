import React, { useState, useEffect } from 'react';
const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const s = {
  page: { padding: '24px', background: '#0f172a', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'sans-serif' },
  title: { fontSize: '22px', fontWeight: 700, marginBottom: '20px', color: '#f1f5f9' },
  card: { background: '#1e293b', borderRadius: '10px', padding: '20px', border: '1px solid #334155', marginBottom: '16px' },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '20px' },
  kpiLabel: { fontSize: '11px', color: '#94a3b8', marginBottom: '5px', textTransform: 'uppercase' },
  kpiValue: { fontSize: '24px', fontWeight: 700 },
  sectionTitle: { fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '14px' },
  chartRow: { display: 'flex', alignItems: 'flex-end', gap: '10px', height: '140px', padding: '0 0 8px 0' },
  barGroup: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
  barWrap: { display: 'flex', gap: '3px', alignItems: 'flex-end', width: '100%', height: '120px' },
  barLabel: { fontSize: '10px', color: '#64748b', textAlign: 'center' },
  legend: { display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '12px' },
  dot: (c) => ({ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: c, marginRight: '4px' }),
  forecastGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' },
  forecastCard: { background: '#0f172a', borderRadius: '8px', padding: '14px' },
  btn: (c) => ({ background: c, color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }),
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#1e293b', borderRadius: '12px', padding: '28px', width: '480px', border: '1px solid #334155', maxHeight: '85vh', overflowY: 'auto' },
  modalTitle: { fontSize: '16px', fontWeight: 700, marginBottom: '20px' },
  label: { fontSize: '12px', color: '#64748b', marginBottom: '4px' },
  input: { width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', marginBottom: '12px', boxSizing: 'border-box' },
  modalRow: { display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' },
  subLabel: { fontSize: '12px', color: '#475569', margin: '8px 0 4px', fontWeight: 600 },
  error: { background: '#450a0a', color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
  success: { background: '#052e16', color: '#86efac', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
};

const emptySnap = { period: '', period_date: '', opening_balance: '', customer_receipts: '', vendor_payments_out: '', other_inflows: '', rent: '', salaries: '', utilities: '', other_outflows: '' };

export default function CashFlowDashboard() {
  const [dash, setDash] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptySnap);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const [d, f] = await Promise.all([
        fetch(`${_BASE}/cashflow/dashboard`, { headers: h() }).then(r => r.json()),
        fetch(`${_BASE}/cashflow/forecast`, { headers: h() }).then(r => r.json()),
      ]);
      setDash(d.data || d);
      setForecast(Array.isArray(f.data) ? f.data : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.period || !form.period_date) { setError('Period and date required'); return; }
    try {
      setSaving(true); setError('');
      const payload = {
        period: form.period, period_date: form.period_date,
        opening_balance: parseFloat(form.opening_balance) || 0,
        inflows: { customer_receipts: parseFloat(form.customer_receipts) || 0, other: parseFloat(form.other_inflows) || 0 },
        outflows: { vendor_payments: parseFloat(form.vendor_payments_out) || 0, rent: parseFloat(form.rent) || 0, salaries: parseFloat(form.salaries) || 0, utilities: parseFloat(form.utilities) || 0, other: parseFloat(form.other_outflows) || 0 },
      };
      const res = await fetch(`${_BASE}/cashflow/snapshot`, { method: 'POST', headers: h(), body: JSON.stringify(payload) });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed');
      setMsg('Snapshot added'); setShowModal(false); setForm(emptySnap); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';
  const months = dash?.last_6_months || [];
  const maxVal = months.length ? Math.max(...months.map(m => Math.max(m.inflows || 0, m.outflows || 0)), 1) : 1;

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={s.page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={s.title}>Cash Flow Dashboard</div>
        <button style={s.btn('#3b82f6')} onClick={() => setShowModal(true)}>+ Add Snapshot</button>
      </div>
      {error && <div style={s.error}>{error}</div>}
      {msg && <div style={s.success}>{msg}</div>}

      {loading ? <div>Loading...</div> : (
        <>
          <div style={s.grid3}>
            {[
              { label: 'Net Flow (Month)', value: fmt(dash?.net_flow_mtd), color: (dash?.net_flow_mtd || 0) >= 0 ? '#34d399' : '#f87171' },
              { label: 'Total Inflows', value: fmt(dash?.total_inflows_mtd), color: '#34d399' },
              { label: 'Total Outflows', value: fmt(dash?.total_outflows_mtd), color: '#f87171' },
            ].map(k => (
              <div key={k.label} style={s.card}>
                <div style={s.kpiLabel}>{k.label}</div>
                <div style={{ ...s.kpiValue, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          <div style={s.card}>
            <div style={s.sectionTitle}>6-Month Cash Flow Trend</div>
            <div style={s.legend}>
              <span><span style={s.dot('#34d399')} />Inflows</span>
              <span><span style={s.dot('#f87171')} />Outflows</span>
            </div>
            <div style={s.chartRow}>
              {months.map((m, i) => (
                <div key={i} style={s.barGroup}>
                  <div style={s.barWrap}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                      <div style={{ width: '100%', background: '#34d399', borderRadius: '3px 3px 0 0', height: `${Math.round(((m.inflows || 0) / maxVal) * 110)}px`, minHeight: '2px' }} title={fmt(m.inflows)} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                      <div style={{ width: '100%', background: '#f87171', borderRadius: '3px 3px 0 0', height: `${Math.round(((m.outflows || 0) / maxVal) * 110)}px`, minHeight: '2px' }} title={fmt(m.outflows)} />
                    </div>
                  </div>
                  <div style={s.barLabel}>{m.month || m.label || `M${i + 1}`}</div>
                </div>
              ))}
              {months.length === 0 && <div style={{ color: '#64748b', fontSize: '13px' }}>No trend data</div>}
            </div>
          </div>

          <div style={s.card}>
            <div style={s.sectionTitle}>3-Month Forecast</div>
            <div style={s.forecastGrid}>
              {forecast.slice(0, 3).map((f, i) => (
                <div key={i} style={s.forecastCard}>
                  <div style={{ fontWeight: 600, marginBottom: '8px', color: '#f1f5f9' }}>{f.period || f.month}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Projected Inflows</div>
                  <div style={{ color: '#34d399', fontWeight: 600 }}>{fmt(f.projected_inflows)}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', marginBottom: '2px' }}>Projected Outflows</div>
                  <div style={{ color: '#f87171', fontWeight: 600 }}>{fmt(f.projected_outflows)}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', marginBottom: '2px' }}>Net</div>
                  <div style={{ color: (f.net_flow || 0) >= 0 ? '#34d399' : '#f87171', fontWeight: 700 }}>{fmt(f.net_flow)}</div>
                </div>
              ))}
              {forecast.length === 0 && <div style={{ color: '#64748b', fontSize: '13px' }}>No forecast data</div>}
            </div>
          </div>
        </>
      )}

      {showModal && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={s.modal}>
            <div style={s.modalTitle}>Add Cash Flow Snapshot</div>
            {[['Period', 'period', 'text', 'e.g. 2025-07'], ['Period Date', 'period_date', 'date'], ['Opening Balance', 'opening_balance', 'number']].map(([lbl, k, t, ph]) => (
              <div key={k}>
                <div style={s.label}>{lbl}</div>
                <input style={s.input} type={t} value={form[k]} onChange={e => setF(k, e.target.value)} placeholder={ph} />
              </div>
            ))}
            <div style={s.subLabel}>Inflows</div>
            {[['Customer Receipts', 'customer_receipts'], ['Other Inflows', 'other_inflows']].map(([lbl, k]) => (
              <div key={k}><div style={s.label}>{lbl}</div><input style={s.input} type="number" value={form[k]} onChange={e => setF(k, e.target.value)} /></div>
            ))}
            <div style={s.subLabel}>Outflows</div>
            {[['Vendor Payments', 'vendor_payments_out'], ['Rent', 'rent'], ['Salaries', 'salaries'], ['Utilities', 'utilities'], ['Other Outflows', 'other_outflows']].map(([lbl, k]) => (
              <div key={k}><div style={s.label}>{lbl}</div><input style={s.input} type="number" value={form[k]} onChange={e => setF(k, e.target.value)} /></div>
            ))}
            <div style={s.modalRow}>
              <button style={s.btn('#334155')} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={s.btn('#3b82f6')} onClick={submit} disabled={saving}>{saving ? 'Saving...' : 'Add Snapshot'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
