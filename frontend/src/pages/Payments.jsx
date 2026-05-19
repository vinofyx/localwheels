import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
  pending: 'bg-amber-100 text-amber-700',
  partial: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
};

export default function Payments() {
  const { branch } = useAuth();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState({ data: [], summary: {}, pagination: {} });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '');
  const [filterType, setFilterType] = useState(searchParams.get('payment_type') || '');

  const fetchPayments = useCallback(() => {
    if (!branch) return;
    setLoading(true);
    const params = new URLSearchParams({ branch_id: branch._id || branch.id, limit: 50 });
    if (filterStatus) params.set('status', filterStatus);
    if (filterType) params.set('payment_type', filterType);
    api.get(`/payments?${params}`)
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load payments'))
      .finally(() => setLoading(false));
  }, [branch, filterStatus, filterType]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  async function collect(id) {
    try {
      await api.patch(`/payments/${id}/collect`);
      toast.success('Marked as paid');
      fetchPayments();
    } catch { toast.error('Failed to update'); }
  }

  const { summary } = data;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Payments & Outstanding</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Paid Outstanding', val: summary.paid_outstanding, color: 'text-green-600' },
          { label: 'To Pay Outstanding', val: summary.topay_outstanding, color: 'text-amber-600' },
          { label: 'Overdue', val: summary.overdue, color: 'text-red-600' },
          { label: 'Collected', val: summary.collected, color: 'text-blue-600' },
        ].map(({ label, val, color }) => (
          <div key={label} className="card text-center">
            <p className={`text-xl font-bold ${color}`}>
              {val >= 1000 ? `₹${(val/1000).toFixed(1)}K` : `₹${Math.round(val || 0)}`}
            </p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-3">
        <select className="input w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
        <select className="input w-auto" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          <option value="paid">Paid</option>
          <option value="topay">To Pay</option>
          <option value="fob">FOB</option>
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-th">LR Number</th>
                  <th className="table-th">Sender</th>
                  <th className="table-th">Receiver</th>
                  <th className="table-th">Amount</th>
                  <th className="table-th">Type</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Due Date</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.data.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="table-td">
                      <Link to={`/shipments/${p.shipment_id}`} className="text-blue-600 font-semibold hover:underline">{p.lr_number}</Link>
                    </td>
                    <td className="table-td">{p.sender_name}</td>
                    <td className="table-td">{p.receiver_name}</td>
                    <td className="table-td font-medium">₹{Number(p.amount).toLocaleString()}</td>
                    <td className="table-td">
                      <span className="badge bg-gray-100 text-gray-600">{p.payment_type?.toUpperCase()}</span>
                    </td>
                    <td className="table-td">
                      <span className={`badge ${STATUS_BADGE[p.status] || 'bg-gray-100 text-gray-600'}`}>{p.status}</span>
                    </td>
                    <td className="table-td">
                      <span className={p.status === 'overdue' ? 'text-red-600 font-medium' : ''}>
                        {p.due_date || '—'}
                      </span>
                    </td>
                    <td className="table-td">
                      {['pending', 'partial', 'overdue'].includes(p.status) && (
                        <button onClick={() => collect(p.id)} className="text-xs bg-green-600 hover:bg-green-700 text-white font-medium px-2 py-1 rounded transition-colors">
                          Collect
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.data.length === 0 && (
              <p className="text-center text-gray-400 py-10">No payment records found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
