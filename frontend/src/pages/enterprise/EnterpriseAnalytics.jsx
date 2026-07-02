import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });

export default function EnterpriseAnalytics() {
  const [supplierSum, setSupplierSum] = useState(null);
  const [vendorSum, setVendorSum]     = useState(null);
  const [soSum, setSoSum]             = useState(null);
  const [poSum, setPoSum]             = useState(null);
  const [incidentStats, setIncidentStats] = useState(null);
  const [riskDash, setRiskDash]       = useState(null);
  const [decisionStats, setDecisionStats] = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s, v, so, po, inc, risk, dec] = await Promise.all([
          fetch(`${_BASE}/suppliers/analytics/summary`, { headers: h() }).then(r => r.json()),
          fetch(`${_BASE}/vendors-p15/analytics/summary`, { headers: h() }).then(r => r.json()),
          fetch(`${_BASE}/sales-orders/analytics/summary`, { headers: h() }).then(r => r.json()),
          fetch(`${_BASE}/purchase-orders/analytics/summary`, { headers: h() }).then(r => r.json()),
          fetch(`${_BASE}/incidents/stats/summary`, { headers: h() }).then(r => r.json()),
          fetch(`${_BASE}/risk/dashboard`, { headers: h() }).then(r => r.json()),
          fetch(`${_BASE}/decision-engine/stats`, { headers: h() }).then(r => r.json()),
        ]);
        setSupplierSum(s.data || s);
        setVendorSum(v.data || v);
        setSoSum(so.data || so);
        setPoSum(po.data || po);
        setIncidentStats(inc.data || inc);
        setRiskDash(risk.data || risk);
        setDecisionStats(dec.data || dec);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, []);

  const Section = ({ title, rows }) => (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <h3 className="font-semibold text-gray-800 mb-3">{title}</h3>
      <div className="space-y-1">
        {rows.map(([l, v, color]) => (
          <div key={l} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-500">{l}</span>
            <span className={`text-sm font-bold ${color || 'text-gray-900'}`}>{v ?? '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Enterprise Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Consolidated performance metrics across all modules</p>
      </div>

      {loading && <div className="text-center py-12 text-gray-400">Loading analytics…</div>}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {supplierSum && (
            <Section title="Supplier Performance" rows={[
              ['Total Suppliers', supplierSum.total],
              ['Active', supplierSum.active, 'text-green-600'],
              ['Approved', supplierSum.approved, 'text-blue-600'],
              ['Pending Approval', supplierSum.pending, supplierSum.pending > 0 ? 'text-yellow-600' : 'text-gray-900'],
              ['Total Spend', `KES ${(supplierSum.total_spend || 0).toLocaleString()}`, 'text-indigo-600'],
            ]} />
          )}
          {vendorSum && (
            <Section title="Vendor Overview" rows={[
              ['Total Vendors', vendorSum.total],
              ['Preferred Vendors', vendorSum.preferred, 'text-indigo-600'],
              ['Active Contracts', vendorSum.active_contracts, 'text-green-600'],
              ['Total Spend', `KES ${(vendorSum.total_spend || 0).toLocaleString()}`, 'text-indigo-600'],
            ]} />
          )}
          {soSum && (
            <Section title="Sales Orders" rows={[
              ['Total Revenue', `KES ${(soSum.total_revenue || 0).toLocaleString()}`, 'text-green-600'],
              ['Collected', `KES ${(soSum.collected || 0).toLocaleString()}`],
              ['Fulfilled', soSum.status_breakdown?.fulfilled || 0, 'text-green-600'],
              ['Confirmed', soSum.status_breakdown?.confirmed || 0],
              ['Cancelled', soSum.status_breakdown?.cancelled || 0, soSum.status_breakdown?.cancelled > 0 ? 'text-red-600' : 'text-gray-900'],
            ]} />
          )}
          {poSum && (
            <Section title="Purchase Orders" rows={[
              ['Total Spend', `KES ${(poSum.total_spend || 0).toLocaleString()}`, 'text-indigo-600'],
              ['Paid', `KES ${(poSum.paid || 0).toLocaleString()}`, 'text-green-600'],
              ['Approved POs', poSum.status_breakdown?.approved || 0],
              ['Received', poSum.status_breakdown?.received || 0, 'text-green-600'],
              ['Pending', poSum.status_breakdown?.submitted || 0],
            ]} />
          )}
          {incidentStats && (
            <Section title="Incident Management" rows={[
              ['Total Incidents', incidentStats.total],
              ['Open', incidentStats.open, incidentStats.open > 0 ? 'text-red-600' : 'text-gray-900'],
              ['Critical', incidentStats.critical, incidentStats.critical > 0 ? 'text-red-700' : 'text-gray-900'],
              ['Resolved', incidentStats.resolved, 'text-green-600'],
            ]} />
          )}
          {riskDash && (
            <Section title="Risk Intelligence" rows={[
              ['Total Risks', riskDash.total],
              ['Active', riskDash.active, riskDash.active > 0 ? 'text-red-600' : 'text-gray-900'],
              ['Critical', riskDash.critical, riskDash.critical > 0 ? 'text-red-700' : 'text-gray-900'],
              ['High', riskDash.high, riskDash.high > 0 ? 'text-orange-600' : 'text-gray-900'],
            ]} />
          )}
          {decisionStats && (
            <Section title="AI Decision Engine" rows={[
              ['Total Recommendations', decisionStats.total],
              ['Pending', decisionStats.pending, decisionStats.pending > 0 ? 'text-yellow-600' : 'text-gray-900'],
              ['Accepted', decisionStats.accepted, 'text-green-600'],
              ['Cost Savings', `KES ${(decisionStats.total_savings || 0).toLocaleString()}`, 'text-green-700'],
            ]} />
          )}
        </div>
      )}
    </div>
  );
}
