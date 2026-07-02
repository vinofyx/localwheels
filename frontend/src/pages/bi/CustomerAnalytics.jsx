import { useState, useEffect } from 'react';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

export default function CustomerAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pull customer data from CRM + shipments via BI endpoint
    Promise.all([
      api.get(`${_BASE}/executive/kpis`),
      api.get(`${_BASE}/business-intelligence/recommendations`),
    ])
      .then(([k, r]) => setData({ kpis: k.data.kpis, recs: r.data }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading customer data...</div>;

  const kpis = data?.kpis || {};

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Customer Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Customers', value: kpis.active_customers || '—', color: 'blue' },
          { label: 'Open Complaints', value: kpis.complaints_open || 0, color: 'red' },
          { label: 'Customer Satisfaction', value: kpis.customer_satisfaction ? kpis.customer_satisfaction + '%' : '—', color: 'green' },
          { label: 'Quote Conversion', value: kpis.quote_conversion_pct ? kpis.quote_conversion_pct + '%' : '—', color: 'indigo' },
        ].map(kpi => (
          <div key={kpi.label} className={`border rounded-xl p-4 ${kpi.color === 'green' ? 'bg-green-50 border-green-200' : kpi.color === 'red' ? 'bg-red-50 border-red-200' : kpi.color === 'blue' ? 'bg-blue-50 border-blue-200' : 'bg-indigo-50 border-indigo-200'}`}>
            <div className={`text-2xl font-bold ${kpi.color === 'green' ? 'text-green-700' : kpi.color === 'red' ? 'text-red-700' : kpi.color === 'blue' ? 'text-blue-700' : 'text-indigo-700'}`}>{kpi.value}</div>
            <div className="text-xs text-gray-600 mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Customer Health Metrics</h2>
          {[
            { label: 'Active Customers', value: kpis.active_customers || 0, max: 100, color: 'bg-blue-400' },
            { label: 'Open Complaints', value: kpis.complaints_open || 0, max: 50, color: 'bg-red-400' },
            { label: 'Sales Revenue (Month)', value: kpis.sales_revenue_month || 0, max: kpis.revenue_month || 1, color: 'bg-green-400', isMoney: true },
          ].map(m => (
            <div key={m.label} className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">{m.label}</span>
                <span className="font-medium text-gray-800">{m.isMoney ? '₹' + (m.value/1000).toFixed(0)+'K' : m.value}</span>
              </div>
              <div className="bg-gray-100 rounded-full h-2">
                <div className={`${m.color} h-2 rounded-full`} style={{ width: `${Math.min(100, (m.value / m.max) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">AI Customer Insights</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
              <span>👥</span>
              <div>
                <div className="font-medium">Customer Retention</div>
                <div className="text-xs text-gray-500 mt-0.5">Monitor repeat booking rates and identify at-risk accounts proactively.</div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
              <span>⭐</span>
              <div>
                <div className="font-medium">Satisfaction Monitoring</div>
                <div className="text-xs text-gray-500 mt-0.5">Track complaint resolution times and delivery performance per customer.</div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
              <span>💼</span>
              <div>
                <div className="font-medium">Revenue Expansion</div>
                <div className="text-xs text-gray-500 mt-0.5">Identify high-value customers for contract upselling opportunities.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
