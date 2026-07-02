import { useState, useEffect } from 'react';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

export default function WarehouseAnalytics() {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWH, setSelectedWH] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [turnover, setTurnover] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snapshotting, setSnapshotting] = useState(false);
  const [tab, setTab] = useState('dashboard');

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
    Promise.all([
      api.get(`${_BASE}/warehouse-analytics/dashboard?warehouse_id=${selectedWH}`).then(r => setDashboard(r.data)),
      api.get(`${_BASE}/warehouse-analytics/inventory-turnover?warehouse_id=${selectedWH}`).then(r => setTurnover(r.data.top_movers || [])),
      api.get(`${_BASE}/warehouse-analytics?warehouse_id=${selectedWH}&limit=10`).then(r => setSnapshots(r.data.analytics || [])),
    ]).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [selectedWH]);

  const takeSnapshot = async () => {
    setSnapshotting(true);
    try {
      await api.post(`${_BASE}/warehouse-analytics/snapshot`, { warehouse_id: selectedWH });
      load();
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
    setSnapshotting(false);
  };

  const kpi = dashboard?.kpis;
  const KPI = ({ label, value, sub, accent }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className={`text-2xl font-bold ${accent || 'text-gray-800'}`}>{value ?? '—'}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Warehouse Analytics</h1><p className="text-sm text-gray-500 mt-0.5">KPI dashboard, inventory turnover and performance snapshots</p></div>
        <div className="flex gap-2">
          <select value={selectedWH} onChange={e => setSelectedWH(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
          <button onClick={takeSnapshot} disabled={snapshotting || !selectedWH} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg disabled:opacity-50">{snapshotting ? '...' : '📸 Snapshot'}</button>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {['dashboard','turnover','snapshots'].map(t => <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500'}`}>{t}</button>)}
      </div>

      {loading ? <div className="py-12 text-center text-gray-400">Loading...</div> : tab === 'dashboard' && kpi ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPI label="Utilization" value={`${kpi.utilization_pct?.toFixed(1)}%`} accent={kpi.utilization_pct > 85 ? 'text-red-600' : 'text-green-600'} />
            <KPI label="Total SKUs" value={kpi.total_skus?.toLocaleString()} />
            <KPI label="Total Units" value={kpi.total_qty?.toLocaleString()} />
            <KPI label="Inventory Value" value={kpi.total_inventory_value ? `KES ${(kpi.total_inventory_value/1000).toFixed(0)}K` : '—'} accent="text-indigo-700" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPI label="Bins Empty" value={kpi.empty_bins} />
            <KPI label="Receiving Time" value={kpi.avg_receiving_time_min ? `${kpi.avg_receiving_time_min.toFixed(0)} min` : '—'} sub="avg per shipment" />
            <KPI label="Pick Time" value={kpi.avg_pick_time_min ? `${kpi.avg_pick_time_min.toFixed(0)} min` : '—'} sub="avg per task" />
            <KPI label="Accuracy Rate" value={kpi.picking_accuracy_pct ? `${kpi.picking_accuracy_pct.toFixed(1)}%` : '—'} accent="text-green-600" />
          </div>
          {dashboard.critical_forecasts?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="font-semibold text-red-800 mb-2">⚠️ Critical Stock Alerts ({dashboard.critical_forecasts.length})</div>
              <div className="space-y-1">
                {dashboard.critical_forecasts.map(f => (
                  <div key={f._id} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-gray-800">{f.sku} — {f.product_name}</span>
                    <span className="text-red-600 font-medium">{f.days_until_stockout} days left · {f.current_qty} units</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : tab === 'dashboard' && !loading && (
        <div className="text-center py-12 text-gray-400">No data. Take a snapshot first.</div>
      )}

      {!loading && tab === 'turnover' && (
        <div className="space-y-3">
          <div className="text-sm text-gray-500">Top SKUs by dispatch movement (last 30 days)</div>
          {turnover.length === 0 ? <div className="text-center py-12 text-gray-400">No movement data yet.</div> : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead><tr className="text-xs text-gray-400 border-b border-gray-100">{['SKU','Product','Dispatches','Total Qty','Inventory Qty'].map(h => <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>)}</tr></thead>
                <tbody>
                  {turnover.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-sm text-gray-800">{row.sku}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{row.product_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.dispatch_count}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.total_dispatched_qty}</td>
                      <td className="px-4 py-3 text-sm text-indigo-700 font-medium">{row.current_inventory_qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!loading && tab === 'snapshots' && (
        <div className="space-y-3">
          {snapshots.length === 0 ? <div className="text-center py-12 text-gray-400">No snapshots. Click Snapshot above.</div> : (
            snapshots.map(s => (
              <div key={s._id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold text-gray-800">{new Date(s.period_start).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-400">{s.period} snapshot</div>
                  </div>
                  <div className={`text-lg font-bold ${s.utilization_pct > 85 ? 'text-red-600' : 'text-green-600'}`}>{s.utilization_pct?.toFixed(1)}% utilization</div>
                </div>
                <div className="grid grid-cols-4 gap-3 text-center">
                  {[['SKUs', s.total_skus], ['Units', s.total_qty], ['Value', s.total_inventory_value ? `KES ${(s.total_inventory_value/1000).toFixed(0)}K` : '—'], ['Accuracy', s.picking_accuracy_pct ? `${s.picking_accuracy_pct.toFixed(0)}%` : '—']].map(([l, v]) => (
                    <div key={l} className="bg-gray-50 rounded-lg p-2"><div className="font-medium text-gray-800 text-sm">{v}</div><div className="text-xs text-gray-400">{l}</div></div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
