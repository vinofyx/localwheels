import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';

const EMPTY = {
  sender_name: '', sender_phone: '', sender_address: '',
  receiver_name: '', receiver_phone: '', receiver_address: '',
  destination: '', weight: '', packages: '1', description: '',
  freight_amount: '', payment_type: 'topay',
  eway_bill: '', eway_bill_expiry: '',
};

export default function CreateShipment() {
  const { branch } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  function set(field, val) { setForm(f => ({ ...f, [field]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post(`/shipments?branch_id=${branch._id || branch.id}`, {
        ...form,
        weight: parseFloat(form.weight) || 0,
        packages: parseInt(form.packages) || 1,
        freight_amount: parseFloat(form.freight_amount) || 0,
      });
      toast.success(`LR created: ${data.lr_number}`);
      navigate(`/shipments/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create shipment');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/shipments" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Shipment (LR)</h1>
          <p className="text-sm text-gray-500">{branch?.branch_name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Sender */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
            Sender Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Sender Name *</label>
              <input className="input" value={form.sender_name} onChange={e => set('sender_name', e.target.value)} required />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.sender_phone} onChange={e => set('sender_phone', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Address</label>
              <input className="input" value={form.sender_address} onChange={e => set('sender_address', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Receiver */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
            Receiver Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Receiver Name *</label>
              <input className="input" value={form.receiver_name} onChange={e => set('receiver_name', e.target.value)} required />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.receiver_phone} onChange={e => set('receiver_phone', e.target.value)} />
            </div>
            <div>
              <label className="label">Destination City *</label>
              <input className="input" value={form.destination} onChange={e => set('destination', e.target.value)} required />
            </div>
            <div>
              <label className="label">Delivery Address</label>
              <input className="input" value={form.receiver_address} onChange={e => set('receiver_address', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Shipment Details */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
            Shipment Details
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="label">Packages</label>
              <input className="input" type="number" min="1" value={form.packages} onChange={e => set('packages', e.target.value)} />
            </div>
            <div>
              <label className="label">Weight (kg)</label>
              <input className="input" type="number" step="0.1" min="0" value={form.weight} onChange={e => set('weight', e.target.value)} />
            </div>
            <div>
              <label className="label">Freight (₹)</label>
              <input className="input" type="number" min="0" value={form.freight_amount} onChange={e => set('freight_amount', e.target.value)} />
            </div>
            <div>
              <label className="label">Payment Type</label>
              <select className="input" value={form.payment_type} onChange={e => set('payment_type', e.target.value)}>
                <option value="topay">To Pay</option>
                <option value="paid">Paid</option>
                <option value="fob">FOB</option>
                <option value="tbb">TBB</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="label">Description / Contents</label>
            <input className="input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. Electronic goods, textiles…" />
          </div>
        </div>

        {/* E-Way Bill */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
            E-Way Bill (optional)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">E-Way Bill Number</label>
              <input className="input" value={form.eway_bill} onChange={e => set('eway_bill', e.target.value)} placeholder="EWB1234567890" />
            </div>
            <div>
              <label className="label">Expiry Date</label>
              <input className="input" type="date" value={form.eway_bill_expiry} onChange={e => set('eway_bill_expiry', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating…' : 'Create LR'}
          </button>
          <Link to="/shipments" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
