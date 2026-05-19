import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

const STATUS_STEPS = ['booked', 'in_transit', 'out_for_delivery', 'delivered'];

function StepIndicator({ status }) {
  const idx = STATUS_STEPS.indexOf(status);
  return (
    <div className="flex items-center justify-between w-full">
      {STATUS_STEPS.map((step, i) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
              i <= idx ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-400'
            }`}>
              {i < idx ? '✓' : i + 1}
            </div>
            <span className={`text-xs text-center ${i <= idx ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
              {step.replace(/_/g, ' ')}
            </span>
          </div>
          {i < STATUS_STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 ${i < idx ? 'bg-blue-600' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function Track() {
  const [lr, setLr] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function search(e) {
    e.preventDefault();
    if (!lr.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const { data } = await api.get(`/shipments/track/${lr.trim()}`);
      setResult(data);
    } catch {
      setError('LR number not found. Please check and try again.');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Track Shipment</h1>
          <p className="text-blue-200 mt-1">Enter your LR number to track</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-5">
          <form onSubmit={search} className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Enter LR Number (e.g. LW000001)"
              value={lr}
              onChange={e => setLr(e.target.value.toUpperCase())}
              autoFocus
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '…' : 'Track'}
            </button>
          </form>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          {result && (
            <div className="space-y-4">
              <div className="border-t border-gray-100 pt-4">
                <StepIndicator status={result.status} />
              </div>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['LR Number', result.lr_number],
                  ['Status', result.status?.replace(/_/g, ' ')],
                  ['Origin', result.origin_branch],
                  ['Destination', result.destination],
                  ['Sender', result.sender_name],
                  ['Receiver', result.receiver_name],
                  ['Packages', result.packages],
                  ['Booking Date', result.booking_date],
                  result.delivery_date ? ['Delivered On', result.delivery_date] : null,
                ].filter(Boolean).map(([label, val]) => (
                  <div key={label}>
                    <dt className="text-xs text-gray-400">{label}</dt>
                    <dd className="font-medium text-gray-800 capitalize">{val}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        <p className="text-center text-blue-200 text-xs mt-4">
          <Link to="/login" className="hover:text-white underline">Staff Login</Link>
          {' · '}© 2024 LocalWheels
        </p>
      </div>
    </div>
  );
}
