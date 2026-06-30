import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const STATUS_STYLES = {
  active:    { bg: 'bg-green-100',  text: 'text-green-800'  },
  accepted:  { bg: 'bg-blue-100',   text: 'text-blue-800'   },
  rejected:  { bg: 'bg-red-100',    text: 'text-red-800'    },
  expired:   { bg: 'bg-gray-100',   text: 'text-gray-600'   },
  converted: { bg: 'bg-purple-100', text: 'text-purple-800' },
};

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN');

const VEHICLE_CATALOG = [
  { vehicle_type: 'Two Wheeler',    capacity_label: '20 kg'   },
  { vehicle_type: 'Mini Truck',     capacity_label: '750 kg'  },
  { vehicle_type: 'Pickup Van',     capacity_label: '1 Ton'   },
  { vehicle_type: 'Tata Ace',       capacity_label: '1.5 Ton' },
  { vehicle_type: '3 Ton Truck',    capacity_label: '3 Ton'   },
  { vehicle_type: '7 Ton Truck',    capacity_label: '7 Ton'   },
  { vehicle_type: '14 Ton Truck',   capacity_label: '14 Ton'  },
  { vehicle_type: '20 Ton Trailer', capacity_label: '20 Ton'  },
  { vehicle_type: 'Container',      capacity_label: '32 Ton'  },
];

function StatCard({ label, value, sub, color = 'blue' }) {
  const colors = {
    blue:   'from-blue-50 to-blue-100 text-blue-700 border-blue-200',
    green:  'from-green-50 to-green-100 text-green-700 border-green-200',
    orange: 'from-orange-50 to-orange-100 text-orange-700 border-orange-200',
    purple: 'from-purple-50 to-purple-100 text-purple-700 border-purple-200',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 border`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

function PricingEditor({ rules, onChange }) {
  function updateField(vehicleType, field, val) {
    const updated = rules.map(r =>
      r.vehicle_type === vehicleType ? { ...r, [field]: Number(val) } : r
    );
    onChange(updated);
  }

  const fields = [
    { key: 'base_rate',            label: 'Base Rate (₹)',         type: 'number' },
    { key: 'per_km_rate',          label: 'Per KM (₹)',            type: 'number' },
    { key: 'fuel_surcharge_pct',   label: 'Fuel Surcharge %',      type: 'number' },
    { key: 'regional_toll',        label: 'Regional Toll (₹)',     type: 'number' },
    { key: 'national_toll',        label: 'National Toll (₹)',     type: 'number' },
    { key: 'loading_charge',       label: 'Loading (₹)',           type: 'number' },
    { key: 'unloading_charge',     label: 'Unloading (₹)',         type: 'number' },
    { key: 'gst_rate',             label: 'GST %',                 type: 'number' },
    { key: 'insurance_rate',       label: 'Insurance %',           type: 'number', step: '0.1' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left px-3 py-2 font-semibold text-gray-600 border border-gray-200 whitespace-nowrap">Vehicle</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600 border border-gray-200 whitespace-nowrap">Capacity</th>
            {fields.map(f => (
              <th key={f.key} className="text-left px-3 py-2 font-semibold text-gray-600 border border-gray-200 whitespace-nowrap">{f.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rules.map(r => (
            <tr key={r.vehicle_type} className="hover:bg-blue-50">
              <td className="px-3 py-2 border border-gray-200 font-medium text-gray-800 whitespace-nowrap">{r.vehicle_type}</td>
              <td className="px-3 py-2 border border-gray-200 text-gray-500 whitespace-nowrap">{r.capacity_label}</td>
              {fields.map(f => (
                <td key={f.key} className="px-1 py-1 border border-gray-200">
                  <input
                    type="number"
                    step={f.step || '1'}
                    className="w-20 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={r[f.key] ?? ''}
                    onChange={e => updateField(r.vehicle_type, f.key, e.target.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function QuoteAdmin() {
  const [tab, setTab]         = useState('quotes');
  const [quotes, setQuotes]   = useState([]);
  const [rules, setRules]     = useState([]);
  const [stats, setStats]     = useState({ total: 0, converted: 0, avg_total: 0, today: 0 });
  const [search, setSearch]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');
  const [page, setPage]       = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [analytics, setAnalytics]   = useState(null);
  const [approvals, setApprovals]   = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [approvalFilter, setApprovalFilter] = useState('');

  const loadQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search)       params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const { data: { data } } = await api.get(`/quotes?${params}`);
      setQuotes(data.quotes || []);
      setTotalCount(data.total || 0);

      const all = data.quotes || [];
      const today = new Date().toLocaleDateString('en-IN');
      setStats({
        total:     data.total || 0,
        converted: all.filter(q => q.status === 'converted').length,
        avg_total: all.length ? Math.round(all.reduce((s, q) => s + (q.grand_total || 0), 0) / all.length) : 0,
        today:     all.filter(q => new Date(q.createdAt).toLocaleDateString('en-IN') === today).length,
      });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [search, statusFilter, page]);

  const loadRules = useCallback(async () => {
    try {
      const { data: { data } } = await api.get('/quotes/rules');
      if (Array.isArray(data) && data.length) {
        setRules(data);
      } else {
        setRules(VEHICLE_CATALOG.map(v => ({
          ...v, capacity_kg: 0,
          base_rate: 0, per_km_rate: 0, fuel_surcharge_pct: 8,
          regional_toll: 500, national_toll: 1500,
          loading_charge: 0, unloading_charge: 0,
          gst_rate: 18, insurance_rate: 0.5,
        })));
      }
    } catch { /* ignore */ }
  }, []);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const { data: { data } } = await api.get('/quotes/analytics');
      setAnalytics(data);
    } catch { } finally { setAnalyticsLoading(false); }
  }, []);

  const loadApprovals = useCallback(async () => {
    try {
      const params = approvalFilter ? `?status=${approvalFilter}` : '';
      const { data: { data } } = await api.get(`/quotes/discounts${params}`);
      setApprovals(data || []);
    } catch { }
  }, [approvalFilter]);

  async function handleApprovalAction(id, action, note = '') {
    try {
      await api.patch(`/quotes/discounts/${id}/action`, { action, note });
      loadApprovals();
    } catch (e) { alert(e.response?.data?.message || 'Action failed'); }
  }

  useEffect(() => { loadQuotes(); }, [loadQuotes]);
  useEffect(() => { if (tab === 'pricing') loadRules(); }, [tab, loadRules]);
  useEffect(() => { if (tab === 'analytics') loadAnalytics(); }, [tab, loadAnalytics]);
  useEffect(() => { if (tab === 'approvals') loadApprovals(); }, [tab, loadApprovals]);

  async function saveRules() {
    setSaving(true); setMsg('');
    try {
      await api.put('/quotes/rules', { rules });
      setMsg('✅ Pricing rules saved successfully.');
    } catch (e) {
      setMsg('❌ ' + (e.response?.data?.message || 'Save failed'));
    } finally { setSaving(false); }
  }

  async function updateStatus(quoteNumber, status) {
    try {
      await api.patch(`/quotes/${quoteNumber}/status`, { status });
      loadQuotes();
    } catch { /* ignore */ }
  }

  return (
    <div className="p-4 sm:p-6 max-w-screen-xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Quote Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage freight quotations and pricing rules</p>
        </div>
        <a href="/quote" target="_blank" rel="noopener noreferrer"
          className="px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 transition-colors">
          + New Quote (Public)
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Quotes"   value={stats.total}     sub="All time"          color="blue"   />
        <StatCard label="Converted"      value={stats.converted} sub="Became bookings"   color="purple" />
        <StatCard label="Avg Quote"      value={fmt(stats.avg_total)} sub="Grand total"  color="green"  />
        <StatCard label="Today"          value={stats.today}     sub="Quotes generated"  color="orange" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {[['quotes', 'Quotations'], ['pricing', 'Pricing Rules'], ['analytics', 'Analytics'], ['approvals', 'Approvals']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Quotes Tab */}
      {tab === 'quotes' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <input
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 max-w-xs"
              placeholder="Search quote#, name, phone, city…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Status</option>
              {['active', 'accepted', 'rejected', 'expired', 'converted'].map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <button onClick={loadQuotes} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-100">
              ↻ Refresh
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">📋</div>
              <p className="font-semibold text-gray-500">No quotations yet</p>
              <p className="text-sm mt-1">Share the public quote form to start receiving requests.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Quote #', 'Customer', 'Route', 'Vehicle', 'Weight', 'Total', 'Status', 'Date', ''].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {quotes.map(q => {
                      const st = STATUS_STYLES[q.status] || STATUS_STYLES.active;
                      return (
                        <tr key={q._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-blue-600 whitespace-nowrap">
                            <a href={`/quote/${q.quote_number}`} target="_blank" rel="noopener noreferrer"
                              className="hover:underline">{q.quote_number}</a>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800">{q.customer_name}</p>
                            <p className="text-xs text-gray-400">{q.customer_phone}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {q.pickup_city || q.pickup_pincode} → {q.destination_city || q.destination_pincode}
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{q.vehicle_type}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{q.chargeable_weight_kg} kg</td>
                          <td className="px-4 py-3 font-bold text-gray-800 whitespace-nowrap">{fmt(q.grand_total)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${st.bg} ${st.text}`}>
                              {q.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                            {new Date(q.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="px-4 py-3">
                            {q.status === 'active' && (
                              <select
                                className="text-xs border border-gray-300 rounded px-1.5 py-1 focus:outline-none"
                                defaultValue=""
                                onChange={e => { if (e.target.value) updateStatus(q.quote_number, e.target.value); }}
                              >
                                <option value="">Set status</option>
                                <option value="accepted">Accept</option>
                                <option value="rejected">Reject</option>
                              </select>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalCount > 20 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, totalCount)} of {totalCount}</p>
                  <div className="flex gap-2">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                      className="px-3 py-1 text-xs border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">← Prev</button>
                    <button disabled={page * 20 >= totalCount} onClick={() => setPage(p => p + 1)}
                      className="px-3 py-1 text-xs border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next →</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pricing Rules Tab */}
      {tab === 'pricing' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-gray-700">Vehicle Pricing Rules</p>
              <p className="text-xs text-gray-400 mt-0.5">These rates apply to all new quotations. Existing quotes are unaffected.</p>
            </div>
            <div className="flex items-center gap-3">
              {msg && <p className={`text-xs font-medium ${msg.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>{msg}</p>}
              <button onClick={saveRules} disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? 'Saving…' : 'Save Rates'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4 overflow-hidden">
            {rules.length ? (
              <PricingEditor rules={rules} onChange={setRules} />
            ) : (
              <div className="text-center py-8 text-gray-400">Loading pricing rules…</div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
            <strong>Note:</strong> Setting a value to 0 uses the system default for that vehicle. Fuel surcharge is a percentage of (base + distance). Toll charges are applied based on route distance (local &lt;100km, regional 100-500km, national 500-1000km, cross-country &gt;1000km). GST applies on the freight subtotal before insurance.
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {tab === 'analytics' && (
        <div className="space-y-5">
          {analyticsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : analytics ? (
            <>
              {/* KPI row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Total Quotes"       value={analytics.total_quotes}              sub="All time"                   color="blue"   />
                <StatCard label="Converted"           value={analytics.converted_quotes}          sub={`${analytics.conversion_rate_pct}% rate`} color="purple" />
                <StatCard label="30-Day Revenue"      value={fmt(analytics.revenue_last_30_days)} sub="Last 30 days"              color="green"  />
                <StatCard label="Monthly Forecast"    value={fmt(analytics.revenue_forecast_monthly)} sub="Based on last 7 days" color="orange" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Daily revenue chart */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Daily Revenue (Last 30 Days)</p>
                  {analytics.daily_revenue.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No data yet</p>
                  ) : (
                    <div className="flex items-end gap-0.5 h-24">
                      {(() => {
                        const max = Math.max(...analytics.daily_revenue.map(d => d.total), 1);
                        return analytics.daily_revenue.map((d, i) => (
                          <div key={i} title={`${d._id}: ${fmt(d.total)}`}
                            className="flex-1 bg-blue-500 hover:bg-blue-700 rounded-t transition-colors cursor-default"
                            style={{ height: `${Math.max(4, (d.total / max) * 100)}%` }} />
                        ));
                      })()}
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1 text-right">Avg: {fmt(analytics.avg_quote_value)} per quote</p>
                </div>

                {/* Vehicle demand */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Vehicle Demand</p>
                  {analytics.vehicle_demand.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No data yet</p>
                  ) : (
                    <div className="space-y-2">
                      {(() => {
                        const max = Math.max(...analytics.vehicle_demand.map(v => v.count), 1);
                        return analytics.vehicle_demand.slice(0, 6).map(v => (
                          <div key={v.vehicle_type}>
                            <div className="flex justify-between text-xs mb-0.5">
                              <span className="text-gray-700 font-medium">{v.vehicle_type}</span>
                              <span className="text-gray-400">{v.count} quotes · {fmt(v.avg_total)} avg</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-400 rounded-full" style={{ width: `${(v.count / max) * 100}%` }} />
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>

                {/* Top routes */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Top Routes</p>
                  </div>
                  {analytics.top_routes.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No data yet</p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {analytics.top_routes.map((r, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50">
                          <div>
                            <span className="font-medium text-gray-800">{r.from}</span>
                            <span className="text-gray-400 mx-1.5">→</span>
                            <span className="font-medium text-gray-800">{r.to}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-blue-600">{r.count} quotes</p>
                            <p className="text-[10px] text-gray-400">{fmt(r.avg_total)} avg</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top customers */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Top Customers</p>
                  </div>
                  {analytics.top_customers.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No data yet</p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {analytics.top_customers.slice(0, 8).map((c, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50">
                          <div>
                            <p className="font-medium text-gray-800">{c.name || c.phone}</p>
                            <p className="text-xs text-gray-400">{c.phone}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-purple-600">{fmt(c.total_value)}</p>
                            <p className="text-[10px] text-gray-400">{c.count} quotes</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {analytics.pending_discount_requests > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-yellow-800 text-sm">{analytics.pending_discount_requests} discount request(s) awaiting approval</p>
                    <p className="text-xs text-yellow-600 mt-0.5">Switch to the Approvals tab to review them.</p>
                  </div>
                  <button onClick={() => setTab('approvals')} className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-xs font-bold hover:bg-yellow-700">
                    Review
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">📊</p>
              <p>Failed to load analytics.</p>
              <button onClick={loadAnalytics} className="mt-3 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-100">Retry</button>
            </div>
          )}
        </div>
      )}

      {/* Approvals Tab */}
      {tab === 'approvals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm font-bold text-gray-700">Discount Approval Requests</p>
            <div className="flex gap-2 flex-wrap">
              {[['', 'All'], ['pending_manager', 'Pending Manager'], ['pending_regional', 'Pending Regional'], ['approved', 'Approved'], ['rejected', 'Rejected']].map(([v, l]) => (
                <button key={v} onClick={() => setApprovalFilter(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${approvalFilter === v ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {l}
                </button>
              ))}
              <button onClick={loadApprovals} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100">↻</button>
            </div>
          </div>

          {approvals.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-5xl mb-3">✅</p>
              <p className="font-semibold text-gray-500">No discount requests</p>
              <p className="text-sm mt-1">Staff can request discounts from any quote page.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Quote #', 'Requested By', 'Discount', 'Original', 'After Discount', 'Reason', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {approvals.map(dr => {
                      const isPending = dr.status === 'pending_manager' || dr.status === 'pending_regional';
                      const statusColors = {
                        pending_manager:  'bg-yellow-100 text-yellow-800',
                        pending_regional: 'bg-orange-100 text-orange-800',
                        approved:         'bg-green-100 text-green-800',
                        rejected:         'bg-red-100 text-red-800',
                      };
                      return (
                        <tr key={dr._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-bold text-blue-600">
                            <a href={`/quote/${dr.quote_number}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{dr.quote_number}</a>
                          </td>
                          <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{dr.requested_by_name || '–'}</td>
                          <td className="px-4 py-3 font-semibold whitespace-nowrap">
                            {dr.discount_type === 'percentage' ? `${dr.discount_value}%` : fmt(dr.discount_value)}
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmt(dr.original_total)}</td>
                          <td className="px-4 py-3 font-bold text-green-700 whitespace-nowrap">{fmt(dr.discounted_total)}</td>
                          <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{dr.reason}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[dr.status] || ''}`}>
                              {dr.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {isPending && (
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleApprovalAction(dr._id, 'approved')}
                                  className="px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200">
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    const note = window.prompt('Reason for rejection (optional):');
                                    if (note !== null) handleApprovalAction(dr._id, 'rejected', note);
                                  }}
                                  className="px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200">
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800">
            <strong>Approval Tiers:</strong> Discounts ≤15% or ≤₹5,000 flat need only Manager approval. Higher discounts escalate to Regional Manager. Approved discounts must be manually applied to the quote by the staff member.
          </div>
        </div>
      )}
    </div>
  );
}
