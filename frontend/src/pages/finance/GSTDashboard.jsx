import React, { useState, useEffect } from 'react';
const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

export default function GSTDashboard() {
  const [dashboard, setDashboard] = useState({});
  const [gstReturns, setGstReturns] = useState([]);
  const [tdsRecords, setTdsRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showGSTModal, setShowGSTModal] = useState(false);
  const [showTDSModal, setShowTDSModal] = useState(false);
  const [gstForm, setGstForm] = useState({ return_type: 'GSTR-1', return_period: '', total_tax: '' });
  const [tdsForm, setTdsForm] = useState({ section: '', deductee_name: '', tds_amount: '', return_quarter: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [dr, gr, tr] = await Promise.all([
        fetch(`${_BASE}/tax/dashboard`, { headers: h() }),
        fetch(`${_BASE}/tax/gst-returns`, { headers: h() }),
        fetch(`${_BASE}/tax/tds`, { headers: h() }),
      ]);
      const [dd, gd, td] = await Promise.all([dr.json(), gr.json(), tr.json()]);
      setDashboard(dd);
      setGstReturns(Array.isArray(gd) ? gd : gd.data || []);
      setTdsRecords(Array.isArray(td) ? td : td.data || []);
    } catch (e) { setError('Failed to load GST data'); }
    finally { setLoading(false); }
  };

  const fileReturn = async (id) => {
    try {
      await fetch(`${_BASE}/tax/gst-returns/${id}/file`, { method: 'PUT', headers: h() });
      fetchAll();
    } catch (e) { setError('Failed to file return'); }
  };

  const createGST = async () => {
    try {
      setSaving(true);
      await fetch(`${_BASE}/tax/gst-returns`, { method: 'POST', headers: h(), body: JSON.stringify(gstForm) });
      setShowGSTModal(false);
      fetchAll();
    } catch (e) { setError('Failed to create GST return'); }
    finally { setSaving(false); }
  };

  const createTDS = async () => {
    try {
      setSaving(true);
      await fetch(`${_BASE}/tax/tds`, { method: 'POST', headers: h(), body: JSON.stringify(tdsForm) });
      setShowTDSModal(false);
      fetchAll();
    } catch (e) { setError('Failed to create TDS record'); }
    finally { setSaving(false); }
  };

  const fmt = v => `₹${Number(v || 0).toLocaleString('en-IN')}`;
  const statusColor = s => ({ filed: '#22c55e', pending: '#f59e0b', overdue: '#ef4444', deducted: '#3b82f6' }[s] || '#64748b');

  const kpis = [
    { label: 'GST Liability This Month', value: fmt(dashboard.gst_liability_month), color: '#ef4444' },
    { label: 'ITC Available', value: fmt(dashboard.itc_available), color: '#22c55e' },
    { label: 'TDS Deducted YTD', value: fmt(dashboard.tds_deducted_ytd), color: '#f59e0b' },
    { label: 'Pending Filings', value: dashboard.pending_filings || 0, color: '#3b82f6' },
  ];

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', padding: '24px', color: '#e2e8f0' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 24px' }}>GST Dashboard</h1>
      {error && <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {/* KPI Cards */}
      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
          {kpis.map((k, i) => (
            <div key={i} style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155' }}>
              <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 8 }}>{k.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* GST Returns */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>GST Returns</h2>
          <button onClick={() => setShowGSTModal(true)} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>+ Create GST Return</button>
        </div>
        <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {['Return Type', 'Period', 'Total Tax', 'Net Payable', 'Status', 'Action'].map(c => (
                  <th key={c} style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontSize: 13, borderBottom: '1px solid #334155' }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gstReturns.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '12px 16px', color: '#3b82f6', fontWeight: 600 }}>{r.return_type}</td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{r.return_period}</td>
                  <td style={{ padding: '12px 16px', color: '#e2e8f0', fontWeight: 600 }}>{fmt(r.total_tax)}</td>
                  <td style={{ padding: '12px 16px', color: '#ef4444', fontWeight: 600 }}>{fmt(r.net_payable)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: statusColor(r.status) + '22', color: statusColor(r.status), padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{r.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {r.status !== 'filed' && (
                      <button onClick={() => fileReturn(r._id || r.id)} style={{ background: '#166534', color: '#86efac', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}>File Return</button>
                    )}
                  </td>
                </tr>
              ))}
              {gstReturns.length === 0 && <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>No GST returns found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* TDS Records */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>TDS Records</h2>
          <button onClick={() => setShowTDSModal(true)} style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>+ Create TDS Record</button>
        </div>
        <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {['Section', 'Deductee Name', 'TDS Amount', 'Quarter', 'Status'].map(c => (
                  <th key={c} style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontSize: 13, borderBottom: '1px solid #334155' }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tdsRecords.map((t, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '12px 16px', color: '#3b82f6', fontWeight: 600 }}>{t.section}</td>
                  <td style={{ padding: '12px 16px', color: '#e2e8f0' }}>{t.deductee_name}</td>
                  <td style={{ padding: '12px 16px', color: '#f59e0b', fontWeight: 600 }}>{fmt(t.tds_amount)}</td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{t.return_quarter}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: statusColor(t.status) + '22', color: statusColor(t.status), padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{t.status}</span>
                  </td>
                </tr>
              ))}
              {tdsRecords.length === 0 && <tr><td colSpan={5} style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>No TDS records found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* GST Modal */}
      {showGSTModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 32, width: 440, border: '1px solid #334155' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>Create GST Return</h2>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>RETURN TYPE</label>
              <select value={gstForm.return_type} onChange={e => setGstForm(p => ({ ...p, return_type: e.target.value }))}
                style={{ width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px' }}>
                {['GSTR-1', 'GSTR-3B', 'GSTR-9', 'GSTR-2A'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            {['return_period', 'total_tax'].map(k => (
              <div key={k} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>{k.replace(/_/g, ' ').toUpperCase()}</label>
                <input value={gstForm[k]} onChange={e => setGstForm(p => ({ ...p, [k]: e.target.value }))}
                  style={{ width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setShowGSTModal(false)} style={{ background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={createGST} disabled={saving} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>{saving ? 'Saving...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* TDS Modal */}
      {showTDSModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 32, width: 440, border: '1px solid #334155' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>Create TDS Record</h2>
            {['section', 'deductee_name', 'tds_amount', 'return_quarter'].map(k => (
              <div key={k} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>{k.replace(/_/g, ' ').toUpperCase()}</label>
                <input value={tdsForm[k]} onChange={e => setTdsForm(p => ({ ...p, [k]: e.target.value }))}
                  style={{ width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setShowTDSModal(false)} style={{ background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={createTDS} disabled={saving} style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>{saving ? 'Saving...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
