import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = n => Number(n || 0).toLocaleString('en-IN');
const fmtCurr = n => {
  const v = Number(n || 0);
  if (v >= 10000000) return '₹' + (v / 10000000).toFixed(2) + 'Cr';
  if (v >= 100000)   return '₹' + (v / 100000).toFixed(2) + 'L';
  return '₹' + fmt(v);
};
function nowClock() {
  return new Date().toLocaleTimeString('en-IN', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function todayStr() {
  return new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_COLOR = {
  booked:           'bg-blue-100 text-blue-700',
  in_transit:       'bg-cyan-100 text-cyan-700',
  out_for_delivery: 'bg-yellow-100 text-yellow-700',
  delivered:        'bg-green-100 text-green-700',
  hold:             'bg-orange-100 text-orange-700',
  lost:             'bg-red-100 text-red-600',
  returned:         'bg-gray-100 text-gray-600',
};
const STATUS_LABEL = {
  booked:           'Booked',
  in_transit:       'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered:        'Delivered',
  hold:             'On Hold',
  lost:             'Lost',
  returned:         'Returned',
};

// ─── Atoms ────────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_COLOR[status] || 'bg-gray-100 text-gray-500'}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function EmptyState({ msg }) {
  return <div className="py-12 text-center text-gray-400 text-sm">{msg || 'No data available'}</div>;
}

function KpiCard({ label, value, sub, icon, color, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white rounded-lg p-3 border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all text-left flex-1 min-w-[110px]"
    >
      <div className="flex items-start justify-between mb-1">
        <span className="text-xl">{icon}</span>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${color}`}>{sub}</span>
      </div>
      <p className="text-2xl font-extrabold text-gray-800 leading-none mb-1">{value}</p>
      <p className="text-[11px] text-gray-500 font-medium">{label}</p>
    </button>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ stats, shipments, alerts, onTabChange }) {
  const active = shipments.filter(s =>
    s.status === 'booked' || s.status === 'in_transit' || s.status === 'out_for_delivery'
  );

  return (
    <div className="space-y-4">
      {/* Alert Banner */}
      {(stats.delayed > 0 || stats.high_risk_count > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
          <span className="text-red-500 text-lg flex-shrink-0">⚠</span>
          <div>
            <p className="text-sm font-bold text-red-700">Attention Required</p>
            {stats.delayed > 0 && (
              <p className="text-xs text-red-600 mt-0.5">
                {stats.delayed} shipment(s) in transit for more than 3 days — possible delay
              </p>
            )}
            {stats.high_risk_count > 0 && (
              <p className="text-xs text-red-600 mt-0.5">
                {stats.high_risk_count} shipment(s) on hold or lost
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Active Shipments Table */}
        <div className="xl:col-span-2 bg-white rounded-lg border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-sm">Active Shipments ({active.length})</h3>
            <button
              type="button"
              onClick={() => onTabChange('board')}
              className="text-xs text-blue-600 hover:underline"
            >
              View Board →
            </button>
          </div>
          {active.length === 0 ? (
            <EmptyState msg="No active shipments — create a new LR to get started" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    {['LR No', 'Consignor', 'Consignee', 'Destination', 'Weight', 'Status', 'Amount'].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-semibold text-gray-500 text-[10px] uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {active.map((s, i) => (
                    <tr key={s.id} className={`border-t border-gray-50 hover:bg-blue-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                      <td className="px-3 py-2 font-mono font-semibold text-blue-700 whitespace-nowrap">{s.lr_number}</td>
                      <td className="px-3 py-2 text-gray-700 whitespace-nowrap max-w-[120px] truncate">{s.sender_name}</td>
                      <td className="px-3 py-2 text-gray-700 whitespace-nowrap max-w-[120px] truncate">{s.receiver_name}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{s.destination}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{s.weight ? s.weight + ' kg' : '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap"><StatusBadge status={s.status} /></td>
                      <td className="px-3 py-2 text-gray-700 whitespace-nowrap font-medium">{fmtCurr(s.freight_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Live Alerts */}
          <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-sm">Live Alerts</h3>
              {alerts.length > 0 && (
                <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{alerts.length}</span>
              )}
            </div>
            {alerts.length === 0 ? (
              <p className="px-4 py-6 text-xs text-gray-400 text-center">No active alerts</p>
            ) : (
              <div className="divide-y divide-gray-50 max-h-52 overflow-y-auto">
                {alerts.map((a, i) => (
                  <div key={a.id || i} className="px-4 py-2.5 flex gap-2.5">
                    <span className="text-sm mt-0.5 flex-shrink-0">{a.priority === 'High' ? '🔴' : '⚠️'}</span>
                    <div>
                      <p className="text-xs text-gray-700 leading-snug">{a.message}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{a.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Summary */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-4 text-white">
            <h4 className="text-sm font-bold mb-3 opacity-90">Today's Summary</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Revenue', value: fmtCurr(stats.revenue_today) },
                { label: 'Deliveries', value: stats.deliveries_today || 0 },
                { label: 'POD Pending', value: stats.pending_pod_count || 0 },
                { label: 'Risk Alerts', value: stats.risk_alerts || 0 },
              ].map(s => (
                <div key={s.label} className="bg-white/10 rounded p-2">
                  <p className="text-lg font-extrabold">{s.value}</p>
                  <p className="text-[10px] opacity-80">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      {stats.shipment_status && stats.shipment_status.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3">Shipment Status Distribution</h3>
          <div className="flex gap-3 flex-wrap">
            {stats.shipment_status.map(s => (
              <div key={s.name} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.fill }} />
                <span className="text-xs font-semibold text-gray-700">{s.name}</span>
                <span className="text-base font-extrabold" style={{ color: s.fill }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bookings Tab ─────────────────────────────────────────────────────────────
function BookingsTab({ shipments, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    sender_name: '', sender_phone: '', sender_address: '',
    receiver_name: '', receiver_phone: '', receiver_address: '',
    destination: '', weight: '', packages: '1', description: '',
    freight_amount: '', payment_type: 'topay', eway_bill: '',
  });
  const [saving, setSaving] = useState(false);

  function setField(k, v) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function handleCreate() {
    if (!form.sender_name || !form.receiver_name || !form.destination) {
      toast.error('Consignor, Consignee and Destination are required');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/shipments', form);
      toast.success('LR ' + res.data.lr_number + ' created successfully!');
      setShowForm(false);
      setForm({
        sender_name: '', sender_phone: '', sender_address: '',
        receiver_name: '', receiver_phone: '', receiver_address: '',
        destination: '', weight: '', packages: '1', description: '',
        freight_amount: '', payment_type: 'topay', eway_bill: '',
      });
      onRefresh();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to create shipment');
    } finally {
      setSaving(false);
    }
  }

  const FIELDS = [
    { label: 'Consignor (Sender) *', key: 'sender_name' },
    { label: 'Sender Phone', key: 'sender_phone' },
    { label: 'Sender Address', key: 'sender_address' },
    { label: 'Consignee (Receiver) *', key: 'receiver_name' },
    { label: 'Receiver Phone', key: 'receiver_phone' },
    { label: 'Receiver Address', key: 'receiver_address' },
    { label: 'Destination *', key: 'destination' },
    { label: 'Weight (kg)', key: 'weight', type: 'number' },
    { label: 'Packages', key: 'packages', type: 'number' },
    { label: 'Description / Material', key: 'description' },
    { label: 'Freight Amount (₹)', key: 'freight_amount', type: 'number' },
    { label: 'E-Way Bill No', key: 'eway_bill' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">{shipments.length} shipment(s) in this branch</p>
        <button
          type="button"
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-semibold"
        >
          {showForm ? '× Cancel' : '+ New LR / Booking'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-blue-200 rounded-xl shadow-lg p-5">
          <h3 className="font-bold text-gray-900 text-sm mb-4">Create New Shipment / LR</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {FIELDS.map(f => (
              <div key={f.key}>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">{f.label}</label>
                <input
                  type={f.type || 'text'}
                  value={form[f.key]}
                  onChange={e => setField(f.key, e.target.value)}
                  className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            ))}
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Payment Type</label>
              <select
                value={form.payment_type}
                onChange={e => setField('payment_type', e.target.value)}
                className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="topay">To Pay</option>
                <option value="paid">Paid</option>
                <option value="fob">FOB</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded text-sm text-gray-600 hover:bg-gray-100">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-2"
            >
              {saving && <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-3.5 h-3.5" />}
              {saving ? 'Creating…' : 'Create Shipment'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['LR No', 'Consignor', 'Consignee', 'Destination', 'Weight', 'Pkgs', 'Payment', 'Amount', 'Status', 'Booked On'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shipments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-gray-400 text-sm">
                    No shipments found for this branch
                  </td>
                </tr>
              ) : shipments.map((s, i) => (
                <tr key={s.id} className={`border-t border-gray-50 hover:bg-blue-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                  <td className="px-3 py-2.5 font-mono text-blue-700 font-semibold whitespace-nowrap">{s.lr_number}</td>
                  <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap max-w-[120px] truncate">{s.sender_name}</td>
                  <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap max-w-[120px] truncate">{s.receiver_name}</td>
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{s.destination}</td>
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{s.weight ? s.weight + ' kg' : '—'}</td>
                  <td className="px-3 py-2.5 text-gray-600">{s.packages}</td>
                  <td className="px-3 py-2.5 text-gray-600 uppercase font-semibold">{s.payment_type}</td>
                  <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap font-medium">{fmtCurr(s.freight_amount)}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap"><StatusBadge status={s.status} /></td>
                  <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{s.booking_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Trip Board ───────────────────────────────────────────────────────────────
function TripBoardTab({ shipments }) {
  const COLS = [
    { key: 'booked',           label: 'Pending Dispatch', color: 'border-blue-200 bg-blue-50' },
    { key: 'in_transit',       label: 'In Transit',       color: 'border-cyan-200 bg-cyan-50' },
    { key: 'out_for_delivery', label: 'Out for Delivery', color: 'border-yellow-200 bg-yellow-50' },
    { key: 'delivered',        label: 'Delivered',        color: 'border-green-200 bg-green-50' },
    { key: 'hold',             label: 'On Hold',          color: 'border-orange-200 bg-orange-50' },
    { key: 'returned',         label: 'Returned',         color: 'border-gray-200 bg-gray-50' },
    { key: 'lost',             label: 'Lost / Exception', color: 'border-red-200 bg-red-50' },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-3" style={{ minHeight: 460 }}>
      {COLS.map(col => {
        const items = shipments.filter(s => s.status === col.key);
        return (
          <div key={col.key} className={`flex-shrink-0 w-52 rounded-lg border-2 ${col.color} flex flex-col`}>
            <div className="px-3 py-2 flex items-center justify-between border-b border-inherit">
              <span className="text-xs font-bold text-gray-700">{col.label}</span>
              <span className="bg-white text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full border">{items.length}</span>
            </div>
            <div className="p-2 flex-1 space-y-2 overflow-y-auto">
              {items.map(s => (
                <div key={s.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-2.5 hover:shadow-md hover:border-blue-200 transition-all">
                  <p className="text-[10px] font-mono text-blue-700 font-bold mb-1">{s.lr_number}</p>
                  <p className="text-xs font-semibold text-gray-800 leading-tight truncate">{s.sender_name}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 truncate">→ {s.destination}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[9px] text-gray-400">{s.weight ? s.weight + ' kg' : ''}</span>
                    <span className="text-[9px] text-gray-600 font-semibold">{fmtCurr(s.freight_amount)}</span>
                  </div>
                </div>
              ))}
              {items.length === 0 && <p className="text-[10px] text-gray-400 text-center py-6">Empty</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Dispatch Console ─────────────────────────────────────────────────────────
function DispatchTab({ shipments, onStatusUpdate }) {
  const pending = shipments.filter(s => s.status === 'booked');
  const [selShipment, setSelShipment] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [successLR, setSuccessLR] = useState(null);

  useEffect(() => {
    if (pending.length > 0 && !selShipment) {
      setSelShipment(pending[0]);
    }
  }, [pending.length]);

  async function handleDispatch() {
    if (!selShipment) return;
    setUpdating(true);
    try {
      await api.patch('/shipments/' + selShipment.id + '/status', { status: 'in_transit' });
      setSuccessLR(selShipment.lr_number);
      toast.success('Shipment ' + selShipment.lr_number + ' dispatched!');
      setSelShipment(null);
      onStatusUpdate();
    } catch {
      toast.error('Failed to dispatch. Please try again.');
    } finally {
      setUpdating(false);
    }
  }

  async function handleHold() {
    if (!selShipment) return;
    setUpdating(true);
    try {
      await api.patch('/shipments/' + selShipment.id + '/status', { status: 'hold' });
      toast.success('Shipment placed on hold');
      setSelShipment(null);
      onStatusUpdate();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* Pending Queue */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        <div className="px-4 py-2.5 bg-orange-50 border-b border-orange-100">
          <h3 className="font-bold text-orange-700 text-sm">Pending Dispatch ({pending.length})</h3>
        </div>
        {pending.length === 0 ? (
          <p className="px-4 py-10 text-xs text-gray-400 text-center">No shipments pending dispatch</p>
        ) : (
          <div className="divide-y divide-gray-50 overflow-y-auto max-h-[500px]">
            {pending.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelShipment(s)}
                className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${selShipment?.id === s.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}
              >
                <p className="text-[10px] font-mono text-blue-700 font-bold">{s.lr_number}</p>
                <p className="text-xs font-semibold text-gray-800 mt-0.5 truncate">{s.sender_name}</p>
                <p className="text-[10px] text-gray-500">→ {s.destination}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {s.payment_type?.toUpperCase()} · {fmtCurr(s.freight_amount)}
                  {s.weight ? ' · ' + s.weight + ' kg' : ''}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div className="xl:col-span-2 space-y-4">
        {successLR && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <span className="text-green-600 text-xl flex-shrink-0">✅</span>
            <div>
              <p className="font-bold text-green-700">Dispatched Successfully</p>
              <p className="text-xs text-green-600 mt-0.5">
                Shipment {successLR} status changed to In Transit.
              </p>
            </div>
            <button type="button" onClick={() => setSuccessLR(null)} className="ml-auto text-green-500 font-bold text-lg leading-none">×</button>
          </div>
        )}

        {selShipment ? (
          <>
            {/* Shipment Detail */}
            <div className="bg-white rounded-lg border border-gray-100 p-4">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Shipment Detail: {selShipment.lr_number}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Consignor', value: selShipment.sender_name },
                  { label: 'Consignee', value: selShipment.receiver_name },
                  { label: 'Destination', value: selShipment.destination },
                  { label: 'Weight', value: selShipment.weight ? selShipment.weight + ' kg' : '—' },
                  { label: 'Packages', value: selShipment.packages || '—' },
                  { label: 'Freight', value: fmtCurr(selShipment.freight_amount) },
                  { label: 'Payment Type', value: selShipment.payment_type?.toUpperCase() || '—' },
                  { label: 'Booking Date', value: selShipment.booking_date || '—' },
                  { label: 'E-Way Bill', value: selShipment.eway_bill || 'Not provided' },
                ].map(f => (
                  <div key={f.label} className="bg-gray-50 rounded p-2">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase">{f.label}</p>
                    <p className="text-xs font-bold text-gray-800 mt-0.5 truncate">{f.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle / Driver Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700">
                <strong>Vehicle & Driver Assignment:</strong> Requires GPS/telematics integration.
                Once IoT devices are connected, the AI will recommend the optimal vehicle and driver
                based on real-time location, fuel level, capacity, and availability.
              </p>
            </div>

            {/* Dispatch Actions */}
            <div className="bg-white rounded-lg border border-gray-100 p-4">
              <h4 className="font-bold text-gray-800 text-sm mb-2">Dispatch Actions</h4>
              <p className="text-xs text-gray-500 mb-4">
                Dispatching changes status: <strong>Booked → In Transit</strong>
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDispatch}
                  disabled={updating}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {updating && <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />}
                  🚀 Dispatch Now
                </button>
                <button
                  type="button"
                  onClick={handleHold}
                  disabled={updating}
                  className="px-4 py-2.5 border border-orange-300 text-orange-700 hover:bg-orange-50 rounded text-sm font-semibold disabled:opacity-50"
                >
                  ⏸ On Hold
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg border border-gray-100 p-10 text-center">
            <p className="text-gray-400 text-sm">
              {pending.length === 0
                ? 'No shipments pending dispatch'
                : 'Select a shipment from the queue to begin dispatch'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Live Tracking Tab ────────────────────────────────────────────────────────
function TrackingTab({ shipments }) {
  const [tick, setTick] = useState(nowClock());
  const active = shipments.filter(s => s.status === 'in_transit' || s.status === 'out_for_delivery');

  useEffect(() => {
    const id = setInterval(() => setTick(nowClock()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* In Transit List */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-sm">In Transit ({active.length})</h3>
          <span className="text-[10px] text-green-600 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
            {tick}
          </span>
        </div>
        {active.length === 0 ? (
          <EmptyState msg="No shipments in transit" />
        ) : (
          <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
            {active.map(s => (
              <div key={s.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold text-blue-700">{s.lr_number}</span>
                  <StatusBadge status={s.status} />
                </div>
                <p className="text-xs text-gray-700 font-medium truncate">{s.sender_name}</p>
                <p className="text-[10px] text-gray-500">→ {s.destination}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Booked: {s.booking_date}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map + Status */}
      <div className="xl:col-span-2 bg-white rounded-lg border border-gray-100 overflow-hidden">
        <div className="h-72 bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
          <div className="text-center px-6">
            <div className="text-5xl mb-3">🗺️</div>
            <p className="font-bold text-gray-700 mb-2">Live GPS Map</p>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Real-time vehicle tracking requires GPS hardware and telematics integration.
              Connect IoT devices to see live vehicle positions on the map.
            </p>
          </div>
        </div>
        <div className="p-4 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: '📡', label: 'GPS Devices', value: 'Not Connected' },
              { icon: '🚛', label: 'In Transit', value: active.length + ' shipments' },
              { icon: '⚡', label: 'Telematics', value: 'Setup Required' },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded p-2.5 text-center">
                <span className="text-xl">{s.icon}</span>
                <p className="text-[10px] text-gray-400 font-semibold uppercase mt-1">{s.label}</p>
                <p className="text-xs font-bold text-gray-700 mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Digital POD Tab ──────────────────────────────────────────────────────────
function DigitalPODTab({ pods, stats }) {
  const uploaded = pods.filter(p => p.status === 'uploaded' || p.status === 'verified');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'POD Pending', value: stats.pending_pod_count || 0, color: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
          { label: 'POD Uploaded', value: uploaded.length, color: 'bg-green-50 border-green-200', text: 'text-green-700' },
          { label: 'Total Delivered', value: pods.length, color: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
        ].map(c => (
          <div key={c.label} className={`rounded-lg border p-4 ${c.color}`}>
            <p className={`text-3xl font-extrabold ${c.text}`}>{c.value}</p>
            <p className="text-xs text-gray-600 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 bg-orange-50">
          <h3 className="font-bold text-orange-700 text-sm">POD Records ({pods.length})</h3>
        </div>
        {pods.length === 0 ? (
          <EmptyState msg="No delivered shipments yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {['LR No', 'Consignee', 'Driver', 'Delivery Date', 'Signature', 'Photo', 'QR Verified', 'Status'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pods.map((p, i) => (
                  <tr key={p.id || i} className={`border-t border-gray-50 hover:bg-blue-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                    <td className="px-3 py-2.5 font-mono text-blue-700 font-semibold whitespace-nowrap">{p.lr_no}</td>
                    <td className="px-3 py-2.5 text-gray-700 max-w-[120px] truncate">{p.consignee}</td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{p.driver}</td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{p.delivery_date}</td>
                    <td className="px-3 py-2.5 text-center">{p.signature ? '✅' : '❌'}</td>
                    <td className="px-3 py-2.5 text-center">{p.photo ? '✅' : '❌'}</td>
                    <td className="px-3 py-2.5 text-center">{p.qr_verified ? '✅' : '❌'}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        p.status === 'verified' ? 'bg-green-100 text-green-700'
                          : p.status === 'uploaded' ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────
function ReportsTab() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const REPORTS = [
    { icon: '📋', name: 'Trip Report',     desc: 'Trip-wise breakdown with status and delivery performance',  color: 'blue' },
    { icon: '🚀', name: 'Dispatch Report', desc: 'Daily dispatch summary — shipments booked and dispatched', color: 'green' },
    { icon: '📦', name: 'Delivery Report', desc: 'Delivered shipments with POD status and completion rate',  color: 'purple' },
    { icon: '⏱️', name: 'Delay Report',    desc: 'Delayed in-transit shipments with booking date analysis',  color: 'red' },
    { icon: '💰', name: 'Revenue Report',  desc: 'Freight revenue by date, branch, and payment type',       color: 'emerald' },
    { icon: '✅', name: 'POD Report',      desc: 'POD submission status — pending, uploaded, verified',      color: 'orange' },
    { icon: '🏢', name: 'Customer Report', desc: 'Consignor/consignee shipment history and MIS',            color: 'indigo' },
    { icon: '📊', name: 'Branch Report',   desc: 'Branch-wise performance, revenue, and delivery metrics',  color: 'cyan' },
  ];

  const COLOR_MAP = {
    blue:    'bg-blue-50 border-blue-200 text-blue-700',
    green:   'bg-green-50 border-green-200 text-green-700',
    purple:  'bg-purple-50 border-purple-200 text-purple-700',
    red:     'bg-red-50 border-red-200 text-red-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    orange:  'bg-orange-50 border-orange-200 text-orange-700',
    indigo:  'bg-indigo-50 border-indigo-200 text-indigo-700',
    cyan:    'bg-cyan-50 border-cyan-200 text-cyan-700',
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-100 p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-600">From:</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-600">To:</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300" />
        </div>
        <button type="button" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-xs font-semibold">
          Generate
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {REPORTS.map(r => (
          <div key={r.name} className={`rounded-lg border p-4 hover:shadow-md transition-all cursor-pointer ${COLOR_MAP[r.color]}`}>
            <div className="flex items-start justify-between mb-2">
              <span className="text-2xl">{r.icon}</span>
              <div className="flex gap-1">
                <button type="button" className="bg-white/80 hover:bg-white px-2 py-0.5 rounded text-[10px] font-semibold border border-white/50">PDF</button>
                <button type="button" className="bg-white/80 hover:bg-white px-2 py-0.5 rounded text-[10px] font-semibold border border-white/50">XLS</button>
              </div>
            </div>
            <h4 className="font-bold text-sm mb-1">{r.name}</h4>
            <p className="text-[10px] opacity-80 leading-snug">{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DispatchCenter() {
  const [tab, setTab] = useState('overview');
  const [tick, setTick] = useState(nowClock());
  const [stats, setStats] = useState({});
  const [shipments, setShipments] = useState([]);
  const [pods, setPods] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aiRes, shipRes, podRes, alertRes] = await Promise.allSettled([
        api.get('/ai/dashboard'),
        api.get('/shipments?limit=100'),
        api.get('/ai/pods'),
        api.get('/ai/notifications'),
      ]);
      if (aiRes.status === 'fulfilled')    setStats(aiRes.value.data || {});
      if (shipRes.status === 'fulfilled')  setShipments(shipRes.value.data?.data || []);
      if (podRes.status === 'fulfilled')   setPods(Array.isArray(podRes.value.data) ? podRes.value.data : []);
      if (alertRes.status === 'fulfilled') setAlerts(alertRes.value.data?.recent || []);
    } catch {
      toast.error('Failed to load dispatch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const id = setInterval(() => setTick(nowClock()), 1000);
    return () => clearInterval(id);
  }, []);

  const bookedCount    = shipments.filter(s => s.status === 'booked').length;
  const inTransitCount = shipments.filter(s => s.status === 'in_transit' || s.status === 'out_for_delivery').length;
  const deliveredCount = shipments.filter(s => s.status === 'delivered').length;

  const KPI = [
    { label: "Today's Bookings",  value: bookedCount,                  sub: 'Pending LRs',     icon: '📋', color: 'bg-blue-50 text-blue-700',    onClick: () => setTab('bookings') },
    { label: 'Pending Dispatch',  value: bookedCount,                  sub: 'Action needed',   icon: '⏳', color: 'bg-orange-50 text-orange-700', onClick: () => setTab('dispatch') },
    { label: 'Trips Running',     value: inTransitCount,               sub: 'In transit',      icon: '🚛', color: 'bg-cyan-50 text-cyan-700',     onClick: () => setTab('tracking') },
    { label: 'Trips Completed',   value: deliveredCount,               sub: 'Delivered',       icon: '✅', color: 'bg-green-50 text-green-700',   onClick: () => setTab('board') },
    { label: 'Delayed Trips',     value: stats.delayed || 0,           sub: 'Needs attention', icon: '⚠️', color: 'bg-red-50 text-red-700',       onClick: () => setTab('tracking') },
    { label: 'Deliveries Today',  value: stats.deliveries_today || 0,  sub: 'Completed today', icon: '📦', color: 'bg-purple-50 text-purple-700', onClick: () => setTab('board') },
    { label: 'POD Pending',       value: stats.pending_pod_count || 0, sub: 'Upload required', icon: '📄', color: 'bg-indigo-50 text-indigo-700', onClick: () => setTab('pod') },
    { label: 'Revenue Today',     value: fmtCurr(stats.revenue_today), sub: 'Freight booked',  icon: '💰', color: 'bg-emerald-50 text-emerald-700', onClick: () => setTab('reports') },
  ];

  const TABS = [
    { key: 'overview', label: 'Overview',         icon: '📊' },
    { key: 'bookings', label: 'Bookings',          icon: '📋' },
    { key: 'board',    label: 'Trip Board',        icon: '📌' },
    { key: 'dispatch', label: 'Dispatch Console',  icon: '🚀', badge: bookedCount },
    { key: 'tracking', label: 'Live Tracking',     icon: '📍', badge: inTransitCount },
    { key: 'pod',      label: 'Digital POD',       icon: '✅', badge: stats.pending_pod_count || 0 },
    { key: 'reports',  label: 'Reports',           icon: '📈' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl">🚛</div>
          <div>
            <h1 className="text-lg font-extrabold text-gray-900">Dispatch & Trip Management Center</h1>
            <p className="text-xs text-gray-500">Loading operational data…</p>
          </div>
        </div>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl">🚛</div>
            <div>
              <h1 className="text-lg font-extrabold text-gray-900 leading-tight">Dispatch & Trip Management Center</h1>
              <p className="text-xs text-gray-500">{todayStr()} · Operations Hub</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full font-semibold">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              LIVE · {tick}
            </span>
            <button type="button" onClick={load} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 text-base">
              ↻
            </button>
            <button
              type="button"
              onClick={() => setTab('bookings')}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              + New LR
            </button>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white/80">
        <div className="flex gap-2 overflow-x-auto">
          {KPI.map(k => <KpiCard key={k.label} {...k} />)}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-4">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                tab === t.key
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {t.badge > 0 && (
                <span className="bg-orange-100 text-orange-600 text-[9px] font-bold px-1 rounded-full">{t.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-4">
        {tab === 'overview' && <OverviewTab stats={stats} shipments={shipments} alerts={alerts} onTabChange={setTab} />}
        {tab === 'bookings' && <BookingsTab shipments={shipments} onRefresh={load} />}
        {tab === 'board'    && <TripBoardTab shipments={shipments} />}
        {tab === 'dispatch' && <DispatchTab shipments={shipments} onStatusUpdate={load} />}
        {tab === 'tracking' && <TrackingTab shipments={shipments} />}
        {tab === 'pod'      && <DigitalPODTab pods={pods} stats={stats} />}
        {tab === 'reports'  && <ReportsTab />}
      </div>
    </div>
  );
}
