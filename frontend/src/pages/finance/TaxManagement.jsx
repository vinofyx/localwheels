import React, { useState, useEffect } from 'react';
const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

export default function TaxManagement() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [taxType, setTaxType] = useState('');
  const [returnPeriod, setReturnPeriod] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ transaction_date: '', tax_type: 'gst', reference_no: '', party_name: '', taxable_amount: '', tax_rate: '', tax_amount: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTransactions(); }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (taxType) params.set('tax_type', taxType);
      if (returnPeriod) params.set('return_period', returnPeriod);
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
      const r = await fetch(`${_BASE}/tax/transactions?${params}`, { headers: h() });
      const d = await r.json();
      setTransactions(Array.isArray(d) ? d : d.data || []);
    } catch (e) { setError('Failed to load tax transactions'); }
    finally { setLoading(false); }
  };

  const createTransaction = async () => {
    try {
      setSaving(true);
      await fetch(`${_BASE}/tax/transactions`, { method: 'POST', headers: h(), body: JSON.stringify(form) });
      setShowModal(false);
      fetchTransactions();
    } catch (e) { setError('Failed to create transaction'); }
    finally { setSaving(false); }
  };

  const fmt = v => `₹${Number(v || 0).toLocaleString('en-IN')}`;
  const statusColor = s => ({ paid: '#22c55e', pending: '#f59e0b', overdue: '#ef4444' }[s] || '#64748b');
  const taxTypeColor = t => ({ gst: '#3b82f6', igst: '#8b5cf6', cgst: '#06b6d4', sgst: '#ec4899', tds: '#f59e0b', tcs: '#22c55e' }[t] || '#64748b');

  // Summary by tax type
  const summary = transactions.reduce((acc, t) => {
    const k = t.tax_type || 'other';
    if (!acc[k]) acc[k] = 0;
    acc[k] += (t.tax_amount || 0);
    return acc;
  }, {});

  const totalThisMonth = transactions.filter(t => {
    const d = new Date(t.transaction_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, t) => s + (t.tax_amount || 0), 0);

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', padding: '24px', color: '#e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Tax Management</h1>
        <button onClick={() => setShowModal(true)} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>+ Add Transaction</button>
      </div>
      {error && <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155' }}>
          <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 6 }}>TOTAL TRANSACTIONS</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{transactions.length}</div>
        </div>
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155' }}>
          <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 6 }}>TOTAL TAX COLLECTED THIS MONTH</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>{fmt(totalThisMonth)}</div>
        </div>
      </div>

      {/* Summary by Tax Type */}
      {Object.keys(summary).length > 0 && (
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155', marginBottom: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 14 }}>Summary by Tax Type</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {Object.entries(summary).map(([type, amount]) => (
              <div key={type} style={{ background: '#0f172a', borderRadius: 8, padding: '10px 16px', border: `1px solid ${taxTypeColor(type)}44` }}>
                <div style={{ color: taxTypeColor(type), fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{type}</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{fmt(amount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 20, border: '1px solid #334155' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr) auto', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>TAX TYPE</label>
            <select value={taxType} onChange={e => setTaxType(e.target.value)}
              style={{ width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: '9px 12px' }}>
              <option value="">All Types</option>
              {['gst', 'igst', 'cgst', 'sgst', 'tds', 'tcs'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>RETURN PERIOD</label>
            <input value={returnPeriod} onChange={e => setReturnPeriod(e.target.value)} placeholder="e.g. Q1 2024"
              style={{ width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: '9px 12px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>DATE FROM</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={{ width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: '9px 12px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>DATE TO</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={{ width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: '9px 12px', boxSizing: 'border-box' }} />
          </div>
          <button onClick={fetchTransactions} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontWeight: 600 }}>Filter</button>
        </div>
      </div>

      {/* Transactions Table */}
      <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
        {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {['Date', 'Tax Type', 'Reference No', 'Party Name', 'Taxable Amount', 'Rate %', 'Tax Amount', 'Status'].map(c => (
                  <th key={c} style={{ padding: '12px 14px', textAlign: 'left', color: '#94a3b8', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #334155' }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1e293b', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '11px 14px', color: '#94a3b8', fontSize: 13 }}>{t.transaction_date ? new Date(t.transaction_date).toLocaleDateString('en-IN') : '—'}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ background: taxTypeColor(t.tax_type) + '22', color: taxTypeColor(t.tax_type), padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{t.tax_type?.toUpperCase()}</span>
                  </td>
                  <td style={{ padding: '11px 14px', color: '#e2e8f0', fontSize: 13 }}>{t.reference_no || '—'}</td>
                  <td style={{ padding: '11px 14px', color: '#e2e8f0' }}>{t.party_name || '—'}</td>
                  <td style={{ padding: '11px 14px', color: '#e2e8f0', fontWeight: 600 }}>{fmt(t.taxable_amount)}</td>
                  <td style={{ padding: '11px 14px', color: '#94a3b8' }}>{t.tax_rate}%</td>
                  <td style={{ padding: '11px 14px', color: '#3b82f6', fontWeight: 700 }}>{fmt(t.tax_amount)}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ background: statusColor(t.status) + '22', color: statusColor(t.status), padding: '3px 10px', borderRadius: 20, fontSize: 12 }}>{t.status}</span>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No tax transactions found</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 32, width: 520, border: '1px solid #334155' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>Create Tax Transaction</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>TAX TYPE</label>
                <select value={form.tax_type} onChange={e => setForm(p => ({ ...p, tax_type: e.target.value }))}
                  style={{ width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px' }}>
                  {['gst', 'igst', 'cgst', 'sgst', 'tds', 'tcs'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                </select>
              </div>
              {['transaction_date', 'reference_no', 'party_name', 'taxable_amount', 'tax_rate', 'tax_amount'].map(k => (
                <div key={k}>
                  <label style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>{k.replace(/_/g, ' ').toUpperCase()}</label>
                  <input type={k.includes('date') ? 'date' : k.includes('amount') || k.includes('rate') ? 'number' : 'text'}
                    value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                    style={{ width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} style={{ background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={createTransaction} disabled={saving} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>{saving ? 'Saving...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
