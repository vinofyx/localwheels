import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const KPI = ({ label, value, sub, color = 'indigo' }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4">
    <div className={`text-2xl font-bold text-${color}-600`}>{value ?? '—'}</div>
    <div className="text-sm font-medium text-gray-700 mt-0.5">{label}</div>
    {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
  </div>
);

const NAV_TILES = [
  { name: 'Inventory', path: '/warehouse/inventory', icon: '📦', desc: 'Real-time stock levels' },
  { name: 'Inbound', path: '/warehouse/inbound', icon: '📥', desc: 'Receiving & put-away' },
  { name: 'Outbound', path: '/warehouse/outbound', icon: '📤', desc: 'Pick, pack & dispatch' },
  { name: 'Warehouse AI', path: '/warehouse/ai', icon: '🤖', desc: 'Smart recommendations' },
  { name: 'Docks', path: '/warehouse/docks', icon: '🚢', desc: 'Dock scheduling' },
  { name: 'Tasks', path: '/warehouse/tasks', icon: '✅', desc: 'Worker task queue' },
  { name: 'Barcode Center', path: '/warehouse/barcode', icon: '📊', desc: 'Scan & generate' },
  { name: 'Analytics', path: '/warehouse/analytics', icon: '📈', desc: 'KPIs & reports' },
  { name: 'Forecast', path: '/warehouse/forecast', icon: '🔮', desc: 'Demand forecasting' },
  { name: 'Warehouse Setup', path: '/warehouse/master', icon: '🏭', desc: 'Zones, racks, bins' },
];

export default function WarehouseDashboard() {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWH, setSelectedWH] = useState('');
  const [criticalForecasts, setCriticalForecasts] = useState([]);

  useEffect(() => {
    api.get(`${_BASE}/warehouses`).then(r => {
      const whs = r.data?.data?.warehouses || r.data?.warehouses || [];
      setWarehouses(whs);
      if (whs.length > 0 && !selectedWH) setSelectedWH(whs[0]._id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedWH) return;
    setLoading(true);
    api.get(`${_BASE}/warehouse-analytics/dashboard?warehouse_id=${selectedWH}`)
      .then(r => { setKpis(r.data.kpis); setCriticalForecasts(r.data.critical_forecasts || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedWH]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouse Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">AI-powered warehouse operations — real-time visibility</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedWH} onChange={e => setSelectedWH(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
            <option value="">All Warehouses</option>
            {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
          <Link to="/warehouse/master" className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">+ New Warehouse</Link>
        </div>
      </div>

      {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <KPI label="Utilization" value={`${kpis?.utilization_pct ?? 0}%`} sub={`${kpis?.occupied_bins ?? 0} / ${kpis?.total_bins ?? 0} bins`} color={kpis?.utilization_pct > 85 ? 'red' : kpis?.utilization_pct > 65 ? 'yellow' : 'green'} />
            <KPI label="Total SKUs" value={kpis?.total_skus ?? 0} sub="active inventory" color="indigo" />
            <KPI label="Total Stock" value={kpis?.total_qty?.toLocaleString() ?? 0} sub="units across all bins" color="blue" />
            <KPI label="Inventory Value" value={`KES ${((kpis?.total_inventory_value || 0) / 1000).toFixed(0)}K`} sub="at cost" color="purple" />
            <KPI label="Low Stock" value={kpis?.low_stock_count ?? 0} sub="SKUs below threshold" color={kpis?.low_stock_count > 0 ? 'orange' : 'green'} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPI label="Pending Inbound" value={kpis?.pending_inbound ?? 0} sub="shipments to receive" color="blue" />
            <KPI label="Pending Outbound" value={kpis?.pending_outbound ?? 0} sub="orders to dispatch" color="purple" />
            <KPI label="Open Tasks" value={kpis?.pending_tasks ?? 0} sub="warehouse tasks" color="yellow" />
            <KPI label="AI Recommendations" value={kpis?.active_ai_recommendations ?? 0} sub="active suggestions" color="indigo" />
          </div>
        </>
      )}

      {criticalForecasts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-red-800 mb-2">⚠️ Critical Stock Alerts</h3>
          <div className="space-y-1">
            {criticalForecasts.map(f => (
              <div key={f._id} className="flex items-center justify-between text-xs text-red-700">
                <span><strong>{f.sku}</strong> — {f.product_name}</span>
                <span className="font-medium">{f.days_until_stockout} days until stockout</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {NAV_TILES.map(t => (
          <Link key={t.path} to={t.path} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all">
            <div className="text-2xl mb-2">{t.icon}</div>
            <div className="text-sm font-semibold text-gray-800">{t.name}</div>
            <div className="text-xs text-gray-400 mt-0.5">{t.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
