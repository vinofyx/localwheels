import { useState, useEffect } from 'react';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

export default function BranchAnalytics() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`${_BASE}/executive/branch-performance`)
      .then(r => setBranches(r.data.branches || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const maxRev = Math.max(...branches.map(b => b.revenue || 0), 1);
  const fmt = (n) => n ? '₹' + (n >= 1000 ? (n/1000).toFixed(0)+'K' : n.toFixed(0)) : '₹0';

  if (loading) return <div className="p-8 text-center text-gray-400">Loading branch data...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Branch Analytics</h1>
      <p className="text-sm text-gray-500">Performance comparison across all branches this month</p>

      {branches.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
          <div className="text-4xl mb-2">🏢</div>
          <div>No branch data available yet</div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-700">{branches.length}</div>
              <div className="text-xs text-blue-600">Active Branches</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-700">{fmt(branches.reduce((a, b) => a + (b.revenue || 0), 0))}</div>
              <div className="text-xs text-green-600">Total Revenue</div>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <div className="text-2xl font-bold text-indigo-700">{branches.reduce((a, b) => a + (b.shipments || 0), 0)}</div>
              <div className="text-xs text-indigo-600">Total Shipments</div>
            </div>
          </div>

          {/* Branch Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Branch</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Revenue</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Shipments</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Delivered</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Delayed</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Revenue Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {branches.map((b, i) => (
                  <tr key={b._id || i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{b._id?.toString().slice(-6) || `Branch ${i+1}`}</td>
                    <td className="px-4 py-3 text-right text-green-700 font-medium">{fmt(b.revenue)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{b.shipments || 0}</td>
                    <td className="px-4 py-3 text-right text-green-600">{b.delivered || 0}</td>
                    <td className="px-4 py-3 text-right text-red-500">{b.delayed || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.round(((b.revenue || 0) / maxRev) * 100)}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right">{Math.round(((b.revenue || 0) / maxRev) * 100)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
