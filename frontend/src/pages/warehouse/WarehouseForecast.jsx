import { useState, useEffect } from 'react';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const RISK_COLOR = { low: 'border-gray-200 bg-white', medium: 'border-blue-200 bg-blue-50', high: 'border-orange-200 bg-orange-50', critical: 'border-red-300 bg-red-50' };
const RISK_BADGE = { low: 'bg-gray-100 text-gray-600', medium: 'bg-blue-100 text-blue-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' };
const TREND_ICON = { up: '📈', down: '📉', stable: '➡️' };

export default function WarehouseForecast() {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWH, setSelectedWH] = useState('');
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [riskFilter, setRiskFilter] = useState('');
  const [horizon, setHorizon] = useState(30);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get(`${_BASE}/warehouses`).then(r => {
      const whs = r.data?.data?.warehouses || [];
      setWarehouses(whs);
      if (whs.length) setSelectedWH(whs[0]._id);
    }).catch(() => {});
  }, []);

  const load = () => {
    if (!selectedWH) return;
    setLoading(true);
    const q = new URLSearchParams({ warehouse_id: selectedWH, limit: 50 });
    if (riskFilter) q.set('risk_level', riskFilter);
    api.get(`${_BASE}/warehouse-analytics/forecasts?${q}`).then(r => {
      setForecasts(r.data.forecasts || []);
      setSummary(r.data.summary || null);
    }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [selectedWH, riskFilter]);

  const runForecast = async () => {
    setRunning(true);
    try {
      await api.post(`${_BASE}/warehouse-ai/forecast`, { warehouse_id: selectedWH, horizon_days: horizon });
      load();
    } catch (e) { alert(e.response?.data?.error || 'Forecast failed'); }
    setRunning(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Warehouse Forecast</h1><p className="text-sm text-gray-500 mt-0.5">AI-powered stock-out predictions and replenishment planning</p></div>
        <div className="flex gap-2 items-center">
          <select value={selectedWH} onChange={e => setSelectedWH(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
          <select value={horizon} onChange={e => setHorizon(Number(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            {[7, 14, 30, 60, 90].map(d => <option key={d} value={d}>{d} days</option>)}
          </select>
          <button onClick={runForecast} disabled={running || !selectedWH} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg disabled:opacity-50">{running ? '🤖 Forecasting...' : '🔮 Run Forecast'}</button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[['Total SKUs', summary.total, 'text-gray-800'], ['Critical', summary.critical, 'text-red-600'], ['High Risk', summary.high, 'text-orange-600'], ['Stockouts <7d', summary.stockout_7d, 'text-red-700']].map(([l, v, c]) => (
            <div key={l} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${c}`}>{v ?? 0}</div><div className="text-xs text-gray-400">{l}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 items-center">
        <span className="text-xs text-gray-500">Filter:</span>
        {['','critical','high','medium','low'].map(r => (
          <button key={r} onClick={() => setRiskFilter(r)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${riskFilter === r ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}>{r || 'All'}</button>
        ))}
      </div>

      {loading ? <div className="py-12 text-center text-gray-400">Loading...</div> : (
        <div className="space-y-3">
          {forecasts.map(f => (
            <div key={f._id} className={`border rounded-xl p-4 ${RISK_COLOR[f.risk_level]}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-gray-800">{f.sku}</span>
                    <span className="text-gray-400">—</span>
                    <span className="text-gray-700 truncate">{f.product_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RISK_BADGE[f.risk_level]}`}>{f.risk_level}</span>
                    {f.trend && <span className="text-sm">{TREND_ICON[f.trend]}</span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-1.5">{f.ai_explanation}</p>
                  {f.recommended_action && <div className="mt-1 text-xs text-indigo-700 font-medium">→ {f.recommended_action}</div>}
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                    {f.predicted_demand > 0 && <span>Predicted demand: <strong>{f.predicted_demand}</strong> units</span>}
                    {f.reorder_point > 0 && <span>Reorder at: <strong>{f.reorder_point}</strong> units</span>}
                    {f.predicted_stockout_date && <span>Stockout: <strong>{new Date(f.predicted_stockout_date).toLocaleDateString()}</strong></span>}
                    <span>Confidence: <strong>{((f.confidence_score || 0) * 100).toFixed(0)}%</strong></span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-3xl font-bold ${f.days_until_stockout < 7 ? 'text-red-600' : f.days_until_stockout < 14 ? 'text-orange-500' : 'text-gray-700'}`}>{f.days_until_stockout ?? '—'}</div>
                  <div className="text-xs text-gray-400">days to stockout</div>
                  <div className="mt-2 text-sm font-medium text-gray-700">{f.current_qty ?? '—'} <span className="text-xs text-gray-400">in stock</span></div>
                  {f.suggested_order_qty > 0 && (
                    <div className="mt-1 bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-lg">Order {f.suggested_order_qty} units</div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {forecasts.length === 0 && <div className="text-center py-12 text-gray-400">No forecasts. Run forecast above to generate predictions.</div>}
        </div>
      )}
    </div>
  );
}
