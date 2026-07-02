import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });

function KpiCard({ label, value, sub, color = 'text-gray-900', icon }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value ?? '—'}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        {icon && <span className="text-2xl opacity-70">{icon}</span>}
      </div>
    </div>
  );
}

export default function ExecutiveCockpit() {
  const [snapshot, setSnapshot] = useState(null);
  const [ceo, setCeo]           = useState(null);
  const [cfo, setCfo]           = useState(null);
  const [coo, setCoo]           = useState(null);
  const [tab, setTab]           = useState('overview');
  const [loading, setLoading]   = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, ce, cf, co] = await Promise.all([
        fetch(`${_BASE}/executive-cockpit/snapshot`, { headers: h() }).then(r => r.json()),
        fetch(`${_BASE}/executive-cockpit/ceo`, { headers: h() }).then(r => r.json()),
        fetch(`${_BASE}/executive-cockpit/cfo`, { headers: h() }).then(r => r.json()),
        fetch(`${_BASE}/executive-cockpit/coo`, { headers: h() }).then(r => r.json()),
      ]);
      setSnapshot(s.data || s);
      setCeo(ce.data || ce);
      setCfo(cf.data || cf);
      setCoo(co.data || co);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const kpis = snapshot?.kpis;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Cockpit</h1>
          <p className="text-sm text-gray-500 mt-1">Live enterprise performance dashboard</p>
        </div>
        <button onClick={load} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">Refresh</button>
      </div>

      {loading && <div className="text-center py-12 text-gray-400">Loading executive data…</div>}

      {!loading && snapshot?.ai_summary && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-5 text-white">
          <p className="text-xs uppercase tracking-wide opacity-80 mb-1">AI Executive Summary</p>
          <p className="text-sm leading-relaxed">{snapshot.ai_summary}</p>
          {snapshot.ai_risks?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/20 flex flex-wrap gap-2">
              {snapshot.ai_risks.map((r, i) => <span key={i} className="text-xs bg-red-400/30 px-2 py-0.5 rounded-full">⚠️ {r}</span>)}
              {snapshot.ai_opportunities?.map((o, i) => <span key={i} className="text-xs bg-green-400/30 px-2 py-0.5 rounded-full">✅ {o}</span>)}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200">
        {['overview','ceo','coo','cfo'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium uppercase border-b-2 transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t}</button>
        ))}
      </div>

      {!loading && tab === 'overview' && kpis && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Shipments Today" value={kpis.shipments_today} icon="📦" />
            <KpiCard label="Delivered Today" value={kpis.delivered_today} color="text-green-600" icon="✅" />
            <KpiCard label="In Transit" value={kpis.in_transit} icon="🚛" />
            <KpiCard label="Delayed" value={kpis.delayed} color={kpis.delayed > 0 ? 'text-red-600' : 'text-gray-900'} icon="⚠️" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Active Vehicles" value={kpis.active_vehicles} sub={`${kpis.fleet_utilization_pct}% utilized`} icon="🚗" />
            <KpiCard label="Active Drivers" value={kpis.active_drivers} icon="👤" />
            <KpiCard label="Open Incidents" value={kpis.open_incidents} color={kpis.critical_incidents > 0 ? 'text-red-600' : 'text-gray-900'} sub={kpis.critical_incidents > 0 ? `${kpis.critical_incidents} critical` : ''} icon="🚨" />
            <KpiCard label="Active Risks" value={kpis.active_risks} icon="🛡️" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Revenue (Month)" value={`KES ${(kpis.revenue_month || 0).toLocaleString()}`} color="text-green-600" icon="💰" />
            <KpiCard label="Spend (Month)" value={`KES ${(kpis.spend_month || 0).toLocaleString()}`} icon="🏦" />
            <KpiCard label="On-Time Delivery" value={`${kpis.on_time_delivery_pct}%`} color={kpis.on_time_delivery_pct >= 90 ? 'text-green-600' : 'text-orange-600'} icon="⏱️" />
            <KpiCard label="Pending Decisions" value={kpis.pending_decisions} color={kpis.pending_decisions > 5 ? 'text-orange-600' : 'text-gray-900'} icon="🤖" />
          </div>
        </div>
      )}

      {!loading && tab === 'ceo' && ceo && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">Sales Orders by Status</h3>
              <div className="space-y-2">
                {(ceo.sales_orders || []).map(so => (
                  <div key={so._id} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-sm capitalize text-gray-600">{so._id?.replace('_',' ')}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">{so.count}</span>
                      <span className="text-xs text-gray-400 ml-2">KES {(so.revenue || 0).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                {!ceo.sales_orders?.length && <p className="text-sm text-gray-400">No sales orders this month</p>}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">Top Suppliers</h3>
              <div className="space-y-2">
                {(ceo.top_suppliers || []).map(s => (
                  <div key={s._id} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-700">{s.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${s.grade === 'A' ? 'text-green-600' : s.grade === 'B' ? 'text-blue-600' : 'text-gray-600'}`}>{s.grade || '—'}</span>
                      <span className="text-xs text-gray-400">{s.overall_score || 0}/100</span>
                    </div>
                  </div>
                ))}
                {!ceo.top_suppliers?.length && <p className="text-sm text-gray-400">No supplier data</p>}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">Open Incidents</h3>
              {(ceo.open_incidents || []).map(i => (
                <div key={i._id} className="py-2 border-b border-gray-50 last:border-0">
                  <p className="text-sm font-medium text-gray-900">{i.title}</p>
                  <p className="text-xs text-gray-500 capitalize">{i.severity} · {i.type?.replace('_',' ')}</p>
                </div>
              ))}
              {!ceo.open_incidents?.length && <p className="text-sm text-gray-400">No open incidents</p>}
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">Top Risks</h3>
              {(ceo.top_risks || []).map(r => (
                <div key={r._id} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700">{r.title}</span>
                  <span className={`text-xs font-bold ${r.severity === 'critical' ? 'text-red-600' : r.severity === 'high' ? 'text-orange-600' : 'text-yellow-600'}`}>{r.risk_score}</span>
                </div>
              ))}
              {!ceo.top_risks?.length && <p className="text-sm text-gray-400">No active risks</p>}
            </div>
          </div>
        </div>
      )}

      {!loading && tab === 'coo' && coo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Operations Today</h3>
            {[['Shipments Today', coo.shipments_today], ['Delayed', coo.delayed], ['Active Drivers', coo.active_drivers], ['Open Incidents', coo.open_incidents]].map(([l,v]) => (
              <div key={l} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{l}</span>
                <span className="text-sm font-bold text-gray-900">{v ?? 0}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Fleet Status</h3>
            {(coo.vehicles_by_status || []).map(v => (
              <div key={v._id} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm capitalize text-gray-500">{v._id}</span>
                <span className="text-sm font-bold text-gray-900">{v.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && tab === 'cfo' && cfo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Revenue</h3>
            {[['Total Invoiced', `KES ${(cfo.revenue?.total || 0).toLocaleString()}`], ['Collected', `KES ${(cfo.revenue?.collected || 0).toLocaleString()}`], ['Outstanding', `KES ${(cfo.revenue?.outstanding || 0).toLocaleString()}`], ['Pending Collections', cfo.pending_collections]].map(([l,v]) => (
              <div key={l} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{l}</span>
                <span className="text-sm font-bold text-gray-900">{v}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Expenditure</h3>
            {[['Total POs', `KES ${(cfo.expenditure?.total || 0).toLocaleString()}`], ['Paid to Suppliers', `KES ${(cfo.expenditure?.paid || 0).toLocaleString()}`], ['Pending Payments', cfo.pending_payments]].map(([l,v]) => (
              <div key={l} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{l}</span>
                <span className="text-sm font-bold text-gray-900">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
