import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { StatusBadge } from './Dashboard';
import toast from 'react-hot-toast';

const STATUSES = ['booked', 'in_transit', 'out_for_delivery', 'delivered', 'hold', 'lost', 'returned'];

export default function ShipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/shipments/${id}`)
      .then(r => setShipment(r.data))
      .catch(() => { toast.error('Shipment not found'); navigate('/shipments'); })
      .finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(newStatus) {
    try {
      await api.patch(`/shipments/${id}/status`, { status: newStatus });
      setShipment(s => ({ ...s, status: newStatus }));
      toast.success('Status updated');
    } catch { toast.error('Failed to update'); }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!shipment) return null;

  const rows = [
    ['LR Number', shipment.lr_number],
    ['Booking Date', shipment.booking_date],
    ['Branch', shipment.branch_name],
    ['Packages', shipment.packages],
    ['Weight', `${shipment.weight} kg`],
    ['Freight Amount', `₹${Number(shipment.freight_amount).toLocaleString()}`],
    ['Payment Type', shipment.payment_type?.toUpperCase()],
    ['E-Way Bill', shipment.eway_bill || '—'],
    ['E-Way Expiry', shipment.eway_bill_expiry || '—'],
  ];

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/shipments" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">{shipment.lr_number}</h1>
          <StatusBadge status={shipment.status} />
        </div>
      </div>

      {/* Status update */}
      <div className="card flex items-center gap-4 flex-wrap">
        <p className="text-sm font-medium text-gray-700">Update Status:</p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                shipment.status === s
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Sender */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-3">Sender</h3>
          <p className="font-medium">{shipment.sender_name}</p>
          {shipment.sender_phone && <p className="text-sm text-gray-500">{shipment.sender_phone}</p>}
          {shipment.sender_address && <p className="text-sm text-gray-500">{shipment.sender_address}</p>}
        </div>

        {/* Receiver */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-3">Receiver</h3>
          <p className="font-medium">{shipment.receiver_name}</p>
          {shipment.receiver_phone && <p className="text-sm text-gray-500">{shipment.receiver_phone}</p>}
          {shipment.receiver_address && <p className="text-sm text-gray-500">{shipment.receiver_address}</p>}
          <p className="text-sm text-blue-600 font-medium mt-1">{shipment.destination}</p>
        </div>
      </div>

      {/* Details */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-3">Shipment Details</h3>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {rows.map(([label, val]) => (
            <div key={label}>
              <dt className="text-xs text-gray-500">{label}</dt>
              <dd className="text-sm font-medium text-gray-800">{val}</dd>
            </div>
          ))}
        </dl>
        {shipment.description && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <dt className="text-xs text-gray-500">Description</dt>
            <dd className="text-sm text-gray-700">{shipment.description}</dd>
          </div>
        )}
      </div>

      {/* POD status */}
      {shipment.status === 'delivered' && (
        <div className={`card border-l-4 ${shipment.pod_status === 'verified' ? 'border-green-500' : shipment.pod_status === 'uploaded' ? 'border-blue-500' : 'border-amber-500'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">POD Status</p>
              <p className="text-sm text-gray-500">
                {shipment.pod_status === 'verified' ? 'POD verified ✓' :
                 shipment.pod_status === 'uploaded' ? 'POD uploaded, pending verification' :
                 'POD not uploaded yet'}
              </p>
              {shipment.delivery_date && <p className="text-xs text-gray-400">Delivered: {shipment.delivery_date}</p>}
            </div>
            <Link to={`/pod?search=${shipment.lr_number}`} className="btn-secondary text-sm">
              Manage POD
            </Link>
          </div>
        </div>
      )}

      {/* Payment */}
      {shipment.payment_amount && (
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">Payment</p>
              <p className="text-sm text-gray-500">₹{Number(shipment.payment_amount).toLocaleString()} · {shipment.payment_status}</p>
            </div>
            <span className={`badge ${shipment.payment_status === 'paid' ? 'bg-green-100 text-green-700' : shipment.payment_status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
              {shipment.payment_status}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
