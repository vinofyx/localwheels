import { useState, useEffect } from 'react';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const PRIORITY_COLOR = { low: 'border-gray-200 bg-white', medium: 'border-blue-200 bg-blue-50', high: 'border-orange-200 bg-orange-50', critical: 'border-red-300 bg-red-50' };
const PRIORITY_BADGE = { low: 'bg-gray-100 text-gray-600', medium: 'bg-blue-100 text-blue-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' };
const TYPE_ICON = { bin_allocation: '📦', picking_route: '🛒', replenishment: '🔄', dock_scheduling: '🚢', labour_optimization: '👷', space_optimization: '📐', congestion: '⚠️', temperature_alert: '🌡️', expiry_alert: '📅', slow_moving: '🐌', fast_moving: '⚡' };

export default function WarehouseAI() {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWH, setSelectedWH] = useState('');
  const [recs, setRecs] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [forecasting, setForecasting] = useState(false);
  const [heatmap, setHeatmap] = useState([]);
  const [labour, setLabour] = useState(null);
  const [analyzeResult, setAnalyzeResult] = useState(null);
  const [forecasts, setForecasts] = useState([]);
  const [activeTab, setActiveTab] = useState('recommendations');

  useEffect(() => {
    api.get(`${_BASE}/warehouses`).then(r => {
      const whs = r.data?.data?.warehouses || [];
      setWarehouses(whs);
      if (whs.length) setSelectedWH(whs[0]._id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedWH) return;
    loadRecs();
    loadHeatmap();
  }, [selectedWH]);

  const loadRecs = () => {
    setRecsLoading(true);
    api.get(`${_BASE}/warehouse-ai/recommendations?warehouse_id=${selectedWH}&limit=20`)
      .then(r => setRecs(r.data.recommendations || []))
      .catch(() => {}).finally(() => setRecsLoading(false));
  };

  const loadHeatmap = () => {
    api.get(`${_BASE}/warehouse-ai/heatmap?warehouse_id=${selectedWH}`)
      .then(r => setHeatmap(r.data.heatmap || [])).catch(() => {});
  };

  const analyze = async () => {
    setAnalyzing(true);
    try {
      const r = await api.post(`${_BASE}/warehouse-ai/analyze`, { warehouse_id: selectedWH });
      setAnalyzeResult(r.data); loadRecs();
    } catch (e) { alert(e.response?.data?.error || 'Analysis failed'); }
    setAnalyzing(false);
  };

  const runForecast = async () => {
    setForecasting(true);
    try {
      const r = await api.post(`${_BASE}/warehouse-ai/forecast`, { warehouse_id: selectedWH, horizon_days: 30 });
      setForecasts(r.data.forecasts || []);
      setActiveTab('forecasts');
    } catch (e) { alert(e.response?.data?.error || 'Forecast failed'); }
    setForecasting(false);
  };

  const loadLabour = () => {
    api.get(`${_BASE}/warehouse-ai/labour-optimization?warehouse_id=${selectedWH}`)
      .then(r => { setLabour(r.data); setActiveTab('labour'); }).catch(() => {});
  };

  const actionRec = async (id) => {
    try { await api.put(`${_BASE}/warehouse-ai/recommendations/${id}/action`); loadRecs(); } catch {}
  };

  const HEAT_COLOR = { hot: 'bg-red-400', warm: 'bg-orange-300', moderate: 'bg-yellow-300', cool: 'bg-green-300' };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Warehouse AI</h1><p className="text-sm text-gray-500 mt-0.5">Smart recommendations, forecasting, heatmap & labour optimization</p></div>
        <div className="flex gap-2">
          <select value={selectedWH} onChange={e => setSelectedWH(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
          <button onClick={analyze} disabled={analyzing || !selectedWH} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg disabled:opacity-50">
            {analyzing ? '🤖 Analyzing...' : '🤖 Run AI Analysis'}
          </button>
          <button onClick={runForecast} disabled={forecasting || !selectedWH} className="px-4 py-2 border border-indigo-300 text-indigo-700 text-sm rounded-lg disabled:opacity-50">
            {forecasting ? '...' : '🔮 Forecast'}
          </button>
          <button onClick={loadLabour} disabled={!selectedWH} className="px-4 py-2 border border-gray-300 text-sm rounded-lg disabled:opacity-50">👷 Labour</button>
        </div>
      </div>

      {analyzeResult && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <div className="font-medium text-indigo-900 mb-1">🤖 AI Analysis Complete</div>
          <p className="text-sm text-indigo-700">{analyzeResult.ai_summary}</p>
          <div className="mt-2 grid grid-cols-4 gap-3">
            {[['Utilization', analyzeResult.utilization_pct + '%'], ['Empty Bins', analyzeResult.empty_bins], ['Low Stock', analyzeResult.low_stock_skus], ['Expiring', analyzeResult.expiring_soon]].map(([l, v]) => (
              <div key={l} className="bg-white rounded-lg p-2 text-center"><div className="font-bold text-indigo-700">{v}</div><div className="text-xs text-gray-500">{l}</div></div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {['recommendations','heatmap','forecasts','labour'].map(t => <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize ${activeTab === t ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{t}</button>)}
      </div>

      {activeTab === 'recommendations' && (
        recsLoading ? <div className="py-8 text-center text-gray-400">Loading...</div> : (
          <div className="space-y-3">
            {recs.map(r => (
              <div key={r._id} className={`border rounded-xl p-4 ${PRIORITY_COLOR[r.priority]}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{TYPE_ICON[r.recommendation_type] || '💡'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{r.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_BADGE[r.priority]}`}>{r.priority}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{r.ai_explanation}</p>
                      {r.sku && <div className="text-xs text-gray-400 mt-1">SKU: {r.sku}</div>}
                      {r.estimated_savings > 0 && <div className="text-xs text-green-600 mt-1">Est. savings: KES {r.estimated_savings.toLocaleString()}</div>}
                    </div>
                  </div>
                  {r.status === 'active' && <button onClick={() => actionRec(r._id)} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg shrink-0">✓ Action</button>}
                  {r.status === 'actioned' && <span className="text-xs text-green-600 font-medium">✅ Done</span>}
                </div>
              </div>
            ))}
            {recs.length === 0 && <div className="text-center py-12 text-gray-400">No recommendations. Run AI Analysis to generate.</div>}
          </div>
        )
      )}

      {activeTab === 'heatmap' && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Zone Utilization Heatmap</h3>
          {heatmap.length === 0 ? <div className="text-center py-12 text-gray-400">No zone data. Set up zones first.</div> : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {heatmap.map(z => (
                <div key={z.zone_id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className={`h-3 ${HEAT_COLOR[z.heat_level]}`} style={{ width: `${z.utilization_pct}%` }} />
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div><div className="font-semibold text-gray-800">{z.zone_code}</div><div className="text-xs text-gray-400">{z.zone_name} · {z.zone_type}</div></div>
                      <div className={`text-2xl font-bold ${z.utilization_pct > 85 ? 'text-red-600' : z.utilization_pct > 60 ? 'text-yellow-600' : 'text-green-600'}`}>{z.utilization_pct}%</div>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">{z.occupied_bins}/{z.total_bins} bins occupied</div>
                    <div className={`mt-1 text-xs font-medium ${z.heat_level === 'hot' ? 'text-red-600' : z.heat_level === 'warm' ? 'text-orange-500' : z.heat_level === 'moderate' ? 'text-yellow-500' : 'text-green-600'}`}>🌡️ {z.heat_level.toUpperCase()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'forecasts' && (
        <div className="space-y-3">
          {forecasts.length === 0 ? <div className="text-center py-12 text-gray-400">No forecasts. Click Forecast button above.</div> : (
            forecasts.map(f => (
              <div key={f._id} className={`bg-white border rounded-xl p-4 ${f.risk_level === 'critical' ? 'border-red-300' : f.risk_level === 'high' ? 'border-orange-300' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-800">{f.sku}</span>
                      <span className="text-gray-500">—</span>
                      <span className="text-gray-700">{f.product_name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_BADGE[f.risk_level]}`}>{f.risk_level}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{f.ai_explanation}</p>
                    <div className="text-xs text-gray-400 mt-1">{f.recommended_action}</div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <div className="text-xl font-bold text-red-600">{f.days_until_stockout}</div>
                    <div className="text-xs text-gray-400">days to stockout</div>
                    <div className="text-sm font-medium text-gray-700 mt-1">{f.current_qty} in stock</div>
                    <div className="text-xs text-gray-400">suggest order: {f.suggested_order_qty}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'labour' && labour && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[['Active Workers', labour.workers], ['Pending Tasks', labour.pending_tasks], ['Suggested Assignments', labour.suggested_assignments?.length]].map(([l, v]) => (
              <div key={l} className="bg-white border border-gray-200 rounded-xl p-4 text-center"><div className="text-2xl font-bold text-indigo-700">{v}</div><div className="text-sm text-gray-500">{l}</div></div>
            ))}
          </div>
          <div className="space-y-2">
            {(labour.suggested_assignments || []).map((a, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-800">{a.task_number}</span>
                  <span className="text-gray-400 mx-2">·</span>
                  <span className="text-sm text-gray-600">{a.task_type?.replace('_',' ')}</span>
                  <span className={`ml-2 text-xs font-medium ${a.priority === 'urgent' ? 'text-red-600' : a.priority === 'high' ? 'text-orange-500' : 'text-gray-400'}`}>{a.priority}</span>
                </div>
                <div className="text-sm text-indigo-700 font-medium">→ {a.suggested_worker}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
