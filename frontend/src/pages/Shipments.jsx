import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { StatusBadge } from './Dashboard';
import toast from 'react-hot-toast';

const STATUSES = ['', 'booked', 'in_transit', 'out_for_delivery', 'delivered', 'hold', 'lost', 'returned'];
const PAY_TYPES = ['', 'paid', 'topay', 'fob', 'tbb'];

export default function Shipments() {
  const { branch } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [shipments, setShipments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);

  const status = searchParams.get('status') || '';
  const payType = searchParams.get('payment_type') || '';
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const fetchShipments = useCallback(() => {
    if (!branch) return;
    setLoading(true);
    const params = new URLSearchParams({ branch_id: branch._id || branch.id, page, limit: 20 });
    if (status) params.set('status', status);
    if (payType) params.set('payment_type', payType);
    if (search) params.set('search', search);

    api.get(`/shipments?${params}`)
      .then(r => { setShipments(r.data.data); setPagination(r.data.pagination); })
      .catch(() => toast.error('Failed to load shipments'))
      .finally(() => setLoading(false));
  }, [branch, status, payType, search, page]);

  useEffect(() => { fetchShipments(); }, [fetchShipments]);

  function setFilter(key, val) {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  }

  async function updateStatus(shipmentId, newStatus) {
    try {
      await api.patch(`/shipments/${shipmentId}/status`, { status: newStatus });
      toast.success('Status updated');
      fetchShipments();
    } catch { toast.error('Failed to update status'); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipments</h1>
          <p className="text-sm text-gray-500">{pagination.total} total · {branch?.branch_name}</p>
        </div>
        <Link to="/shipments/new" className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New LR
        </Link>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search LR, sender, receiver…"
          value={search}
          onChange={e => setFilter('search', e.target.value)}
        />
        <select className="input w-auto" value={status} onChange={e => setFilter('status', e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.slice(1).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select className="input w-auto" value={payType} onChange={e => setFilter('payment_type', e.target.value)}>
          <option value="">All Payment Types</option>
          {PAY_TYPES.slice(1).map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
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
                  <th className="table-th">Date</th>
                  <th className="table-th">Sender</th>
                  <th className="table-th">Receiver</th>
                  <th className="table-th">Destination</th>
                  <th className="table-th">Pkg/Wt</th>
                  <th className="table-th">Amount</th>
                  <th className="table-th">Pay</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {shipments.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="table-td">
                      <Link to={`/shipments/${s.id}`} className="text-blue-600 font-semibold hover:underline">{s.lr_number}</Link>
                    </td>
                    <td className="table-td whitespace-nowrap">{s.booking_date}</td>
                    <td className="table-td">{s.sender_name}</td>
                    <td className="table-td">{s.receiver_name}</td>
                    <td className="table-td">{s.destination}</td>
                    <td className="table-td whitespace-nowrap">{s.packages} / {s.weight}kg</td>
                    <td className="table-td whitespace-nowrap">₹{Number(s.freight_amount).toLocaleString()}</td>
                    <td className="table-td">
                      <span className={`badge ${s.payment_type === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {s.payment_type?.toUpperCase()}
                      </span>
                    </td>
                    <td className="table-td"><StatusBadge status={s.status} /></td>
                    <td className="table-td">
                      <select
                        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                        value={s.status}
                        onChange={e => updateStatus(s.id, e.target.value)}
                      >
                        {STATUSES.slice(1).map(st => <option key={st} value={st}>{st.replace('_', ' ')}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {shipments.length === 0 && (
              <p className="text-center text-gray-400 py-10">No shipments found</p>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setFilter('page', String(p))}
              className={`w-8 h-8 rounded text-sm font-medium ${p === page ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
