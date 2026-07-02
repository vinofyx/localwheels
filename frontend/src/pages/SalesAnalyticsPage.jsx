import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { RefreshCw, TrendingUp, Award, BarChart2 } from 'lucide-react';

function HBar({ label, value, max, color = 'bg-blue-500' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs text-slate-400 w-32 truncate text-right">{label}</span>
      <div className="flex-1 h-4 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-300 w-8 text-right">{value}</span>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, color = 'blue' }) {
  const colors = { blue:'bg-blue-600', green:'bg-green-600', orange:'bg-orange-500', purple:'bg-purple-600' };
  return (
    <div className="bg-slate-800 rounded-xl p-4 flex items-start gap-3">
      <div className={`${colors[color]} rounded-lg p-2 flex-shrink-0`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

export default function SalesAnalyticsPage() {
  const [data, setData]   = useState(null);
  const [forecast, setFc] = useState(null);
  const [days, setDays]   = useState(30);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: a }, { data: f }] = await Promise.all([
        api.get(`/sales/analytics?days=${days}`),
        api.get('/sales/forecast'),
      ]);
      setData(a);
      setFc(f);
    } catch { setData(null); }
    finally { setLoading(false); }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const fmt = n => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : n >= 1000 ? `₹${(n/1000).toFixed(1)}K` : `₹${n || 0}`;

  const s = data?.summary || {};
  const byStage  = data?.leadsByStage  || {};
  const bySource = data?.leadsBySource || {};
  const maxStage = Math.max(1, ...Object.values(byStage));
  const maxSource= Math.max(1, ...Object.values(bySource));

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Sales Analytics</h1>
          <p className="text-sm text-slate-400">Revenue forecasting & pipeline insights</p>
        </div>
        <div className="flex gap-2">
          <select className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
            value={days} onChange={e => setDays(Number(e.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button onClick={load} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total Leads"   value={s.totalLeads  ?? '—'} icon={TrendingUp} color="blue"   />
        <KpiCard label="Won Deals"     value={s.wonDeals    ?? '—'} icon={Award}      color="green"  />
        <KpiCard label="Win Rate"      value={`${s.winRate ?? 0}%`}  icon={BarChart2}  color="orange" />
        <KpiCard label="Avg Deal Size" value={fmt(s.avgDealSize || 0)} icon={TrendingUp} color="purple" />
      </div>

      {/* Forecast */}
      {forecast && (
        <div className="bg-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-200 mb-3">Revenue Forecast</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[
              { label: 'Pipeline Total',  value: fmt(forecast.pipeline_total) },
              { label: 'Weighted Value',  value: fmt(forecast.weighted_value) },
              { label: 'AI Forecast',     value: fmt(forecast.ai_forecast) },
              { label: 'Target',          value: fmt(forecast.monthly_target?.revenue_target || 0) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-700 rounded-lg p-3">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-lg font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
          {forecast.ai_narrative && (
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
              <p className="text-xs text-blue-300 font-medium mb-1">🤖 AI Forecast Insight</p>
              <p className="text-sm text-blue-100">{forecast.ai_narrative}</p>
            </div>
          )}

          {/* By stage breakdown */}
          {Object.keys(forecast.by_stage || {}).length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Pipeline by Stage</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-400 border-b border-slate-700">
                      <th className="text-left py-2">Stage</th>
                      <th className="text-right py-2">Count</th>
                      <th className="text-right py-2">Total</th>
                      <th className="text-right py-2">Weighted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(forecast.by_stage).map(([stage, row]) => (
                      <tr key={stage} className="border-b border-slate-700/50">
                        <td className="py-2 text-slate-200 capitalize">{stage.replace(/_/g,' ')}</td>
                        <td className="py-2 text-right text-slate-400">{row.count}</td>
                        <td className="py-2 text-right text-slate-200">{fmt(row.total)}</td>
                        <td className="py-2 text-right text-green-400">{fmt(row.weighted)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By Stage */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-200 mb-3">Leads by Stage</h2>
          {Object.entries(byStage).length ? (
            Object.entries(byStage).sort((a,b)=>b[1]-a[1]).map(([stage, count]) => (
              <HBar key={stage} label={stage.replace(/_/g,' ')} value={count} max={maxStage} color="bg-blue-500" />
            ))
          ) : <p className="text-xs text-slate-500 text-center py-4">No data yet</p>}
        </div>

        {/* By Source */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-200 mb-3">Leads by Source</h2>
          {Object.entries(bySource).length ? (
            Object.entries(bySource).sort((a,b)=>b[1]-a[1]).map(([source, count]) => (
              <HBar key={source} label={source.replace(/_/g,' ')} value={count} max={maxSource} color="bg-purple-500" />
            ))
          ) : <p className="text-xs text-slate-500 text-center py-4">No data yet</p>}
        </div>
      </div>

      {/* Lead trend table */}
      {data?.leadTrend?.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-200 mb-3">Daily Lead Volume</h2>
          <div className="overflow-x-auto">
            <div className="flex items-end gap-1 h-24">
              {data.leadTrend.map(d => {
                const maxC = Math.max(...data.leadTrend.map(x=>x.count), 1);
                const h = Math.max(4, (d.count / maxC) * 100);
                return (
                  <div key={d._id} className="flex-1 flex flex-col items-center gap-0.5 min-w-4">
                    <span className="text-xs text-slate-400">{d.count}</span>
                    <div className="w-full bg-blue-600 rounded-t" style={{ height: `${h}%` }} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
