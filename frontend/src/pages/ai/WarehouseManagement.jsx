import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../api/client';
import toast from 'react-hot-toast';

const RACK_COLOR = { Available: '#22c55e', Full: '#ef4444', Reserved: '#f59e0b' };

export default function WarehouseManagement() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('racks');

  useEffect(() => {
    api.get('/ai/warehouse')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load warehouse data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-center text-gray-400">Loading warehouse data…</div>;
  if (!data) return null;

  const { summary, racks, movements, stock_alerts } = data;
  const capPct = summary.capacity_pct;

  const pieData = [
    { name: 'Available', value: racks.filter(r=>r.status==='Available').length, fill: '#22c55e' },
    { name: 'Full',      value: racks.filter(r=>r.status==='Full').length,      fill: '#ef4444' },
    { name: 'Reserved',  value: racks.filter(r=>r.status==='Reserved').length,  fill: '#f59e0b' },
  ];

  return (
    <div className="p-3 space-y-3">
      <div className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded shadow text-white px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold">🏭 Warehouse Management</h1>
          <p className="text-green-100 text-[12px]">Rack management, stock movement, barcode/QR scanning, dock management</p>
        </div>
        <div className="text-right text-[12px] text-green-100">
          <p>Capacity Used</p>
          <p className={`text-2xl font-bold ${capPct > 80 ? 'text-red-200' : 'text-white'}`}>{capPct}%</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {[
          { label: 'Total Racks',    val: summary.total_racks,      color: '#0b8fd3' },
          { label: 'Occupied',       val: summary.occupied,          color: '#ef4444' },
          { label: 'Capacity %',     val: `${summary.capacity_pct}%`,color: capPct > 80 ? '#ef4444' : '#22c55e' },
          { label: 'Inbound Today',  val: summary.inbound_today,     color: '#22c55e' },
          { label: 'Outbound Today', val: summary.outbound_today,    color: '#f97316' },
          { label: 'Stock Alerts',   val: stock_alerts,              color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded shadow-sm p-2 border-l-4 text-center" style={{ borderColor: s.color }}>
            <p className="text-lg font-bold text-gray-800">{s.val}</p>
            <p className="text-[10px] font-semibold text-gray-500 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded shadow-sm">
        <div className="border-b px-3 pt-2 flex gap-3">
          {[['racks','🗄️ Rack View'],['movements','📦 Stock Movements'],['analytics','📊 Analytics']].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-[12px] font-bold pb-2 px-1 border-b-2 transition-colors ${tab===t ? 'border-green-500 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {l}
            </button>
          ))}
        </div>

        {tab === 'racks' && (
          <div className="p-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Rack Grid */}
              <div className="lg:col-span-3">
                <h3 className="text-[12px] font-bold text-gray-600 mb-2">Rack Status Grid</h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {racks.map(r => (
                    <div key={r.rack_id} className="rounded p-2 text-center text-[11px] border-2"
                      style={{ borderColor: RACK_COLOR[r.status], background: RACK_COLOR[r.status] + '15' }}>
                      <p className="font-bold text-gray-800">{r.rack_id}</p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 my-1">
                        <div className="h-1.5 rounded-full" style={{ width:`${r.filled}%`, background: RACK_COLOR[r.status] }} />
                      </div>
                      <p className="font-medium" style={{ color: RACK_COLOR[r.status] }}>{r.filled}%</p>
                      <p className="text-gray-400 text-[9px]">{r.items} items</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Pie Chart */}
              <div>
                <h3 className="text-[12px] font-bold text-gray-600 mb-2">Rack Distribution</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={65}
                      label={({ name, value }) => `${name}: ${value}`} labelLine={false} style={{ fontSize: 9 }}>
                      {pieData.map((p, i) => <Cell key={i} fill={p.fill} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {tab === 'movements' && (
          <div className="p-3 overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['#','Item Code','Description','Qty','Rack','Type','Time'].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-3 py-1.5 text-gray-400">{m.id}</td>
                    <td className="px-3 py-1.5 font-mono font-bold text-blue-700">{m.item_code}</td>
                    <td className="px-3 py-1.5">{m.desc}</td>
                    <td className="px-3 py-1.5">{m.qty}</td>
                    <td className="px-3 py-1.5 font-medium">{m.rack}</td>
                    <td className="px-3 py-1.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        m.type==='Inbound' ? 'bg-green-100 text-green-700' : m.type==='Outbound' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>{m.type}</span>
                    </td>
                    <td className="px-3 py-1.5 text-gray-500 text-[11px]">{new Date(m.time).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'analytics' && (
          <div className="p-3">
            <h3 className="text-[12px] font-bold text-gray-700 mb-2">Rack Fill % Analysis</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={racks}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="rack_id" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit="%" />
                <Tooltip formatter={v => `${v}%`} />
                <Bar dataKey="filled" name="Fill %" fill="#22c55e" radius={[3,3,0,0]}
                  label={{ position: 'top', style: { fontSize: 9 }, formatter: v => `${v}%` }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
