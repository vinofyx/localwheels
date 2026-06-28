import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/client';
import toast from 'react-hot-toast';

const STATUS_COLORS = { Available: 'bg-green-100 text-green-700', Matched: 'bg-blue-100 text-blue-700', Confirmed: 'bg-purple-100 text-purple-700', 'In Transit': 'bg-amber-100 text-amber-700' };

export default function LoadMatching() {
  const [loads, setLoads]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('All');

  useEffect(() => {
    api.get('/ai/loads')
      .then(r => setLoads(r.data))
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  function match(id) {
    setLoads(l => l.map(x => x.id === id ? { ...x, status: 'Matched' } : x));
    toast.success('Load matched to vehicle!');
  }

  const filtered = loads.filter(l => {
    const ms = !search || l.origin.toLowerCase().includes(search.toLowerCase()) || l.destination.toLowerCase().includes(search.toLowerCase());
    const mf = filter === 'All' || l.status === filter;
    return ms && mf;
  });

  const chartData = ['Available','Matched','Confirmed','In Transit'].map(s => ({
    status: s, count: loads.filter(l => l.status === s).length,
  }));

  return (
    <div className="p-3 space-y-3">
      <div className="bg-gradient-to-r from-[#f97316] to-[#ea580c] rounded shadow text-white px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold">🔄 Load Matching AI</h1>
          <p className="text-orange-100 text-[12px]">Nearest trucks, freight matching, empty trip reduction, revenue optimization</p>
        </div>
        <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-1 rounded">AI Powered</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Total Loads',     val: loads.length,                                               color: '#f97316' },
          { label: 'Available',       val: loads.filter(l => l.status === 'Available').length,          color: '#22c55e' },
          { label: 'Matched',         val: loads.filter(l => l.status === 'Matched').length,            color: '#0b8fd3' },
          { label: 'Avg Match Score', val: loads.length ? (loads.reduce((s,l)=>s+l.match_score,0)/loads.length).toFixed(1)+'%' : '—', color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded shadow-sm p-3 border-l-4" style={{ borderColor: s.color }}>
            <p className="text-xl font-bold text-gray-800">{s.val}</p>
            <p className="text-[10px] font-semibold text-gray-500 uppercase mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Chart */}
        <div className="bg-white rounded shadow-sm p-3">
          <h2 className="text-[13px] font-bold text-gray-700 border-b pb-1 mb-2">Load Status Distribution</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="status" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#f97316" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 p-2 bg-orange-50 rounded text-[11px]">
            <p className="font-bold text-orange-700">🤖 AI Insight</p>
            <p className="text-gray-600 mt-0.5">
              {loads.filter(l=>l.status==='Available').length} loads unmatched — potential empty trips. AI can auto-match based on route proximity.
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded shadow-sm lg:col-span-2">
          <div className="px-3 py-2 border-b flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-[13px] font-bold text-gray-700">All Loads ({filtered.length})</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <input className="border border-gray-300 rounded px-2 py-1 text-[11px] w-32"
                placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
              {['All','Available','Matched','Confirmed','In Transit'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${filter===f ? 'bg-[#f97316] text-white border-[#f97316]' : 'text-gray-600 border-gray-300'}`}>{f}</button>
              ))}
            </div>
          </div>
          {loading ? <div className="p-6 text-center text-gray-400">Loading…</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Origin','Destination','Weight','Volume','Pickup Date','Freight','Match%','Vehicle','Util%','Status','Action'].map(h => (
                      <th key={h} className="text-left px-2 py-2 font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1.5 font-medium text-gray-800">{l.origin}</td>
                      <td className="px-2 py-1.5 font-medium text-gray-800">{l.destination}</td>
                      <td className="px-2 py-1.5">{l.weight_ton}T</td>
                      <td className="px-2 py-1.5">{l.volume_cbm} cbm</td>
                      <td className="px-2 py-1.5">{l.pickup_date}</td>
                      <td className="px-2 py-1.5 text-green-700 font-medium">₹{l.freight_rs.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-1">
                          <div className="w-12 bg-gray-200 rounded-full h-1.5">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${l.match_score}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-green-700">{l.match_score}%</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-[11px]">{l.available_truck}</td>
                      <td className="px-2 py-1.5">{l.utilization_pct}%</td>
                      <td className="px-2 py-1.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_COLORS[l.status]}`}>{l.status}</span>
                      </td>
                      <td className="px-2 py-1.5">
                        {l.status === 'Available' && (
                          <button onClick={() => match(l.id)}
                            className="text-[10px] font-bold px-2 py-1 bg-[#0b8fd3] text-white rounded hover:bg-[#0066aa]">
                            Match
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
