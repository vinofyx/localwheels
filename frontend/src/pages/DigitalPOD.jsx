import { useState, useEffect } from 'react';
import api from '../api/client';

export default function DigitalPOD() {
  const [drivers, setDrivers]   = useState([]);
  const [trips, setTrips]       = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [msg, setMsg]           = useState(null);

  const [frm, setFrm] = useState({
    driver_id: '', trip_id: '', shipment_id: '',
    receiver_name: '', receiver_phone: '', notes: '',
    lat: '', lng: '',
  });

  useEffect(() => {
    api.get('/drivers').then(r => setDrivers(r.data?.data?.drivers || r.data?.drivers || [])).catch(() => {});
  }, []);

  const loadTrips = async (driverId) => {
    if (!driverId) return setTrips([]);
    try {
      const r = await api.get(`/driver/trips?driver_id=${driverId}&status=in_progress`);
      setTrips(r.data.trips || []);
    } catch {}
  };

  const loadShipments = async (tripId) => {
    if (!tripId) return setShipments([]);
    try {
      const r = await api.get(`/driver/trips/${tripId}`);
      setShipments((r.data.shipments || []).filter(s => s.status !== 'delivered'));
    } catch {}
  };

  const handleChange = (field, value) => {
    setFrm(f => ({ ...f, [field]: value }));
    if (field === 'driver_id') { loadTrips(value); setFrm(f => ({ ...f, driver_id: value, trip_id: '', shipment_id: '' })); }
    if (field === 'trip_id')   { loadShipments(value); setFrm(f => ({ ...f, trip_id: value, shipment_id: '' })); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!frm.shipment_id) return setMsg({ type: 'error', text: 'Select a shipment' });
    setLoading(true);
    try {
      const payload = {
        shipment_id:   frm.shipment_id,
        trip_id:       frm.trip_id || undefined,
        receiver_name: frm.receiver_name,
        receiver_phone:frm.receiver_phone,
        notes:         frm.notes,
        lat:           frm.lat ? parseFloat(frm.lat) : undefined,
        lng:           frm.lng ? parseFloat(frm.lng) : undefined,
      };
      const r = await api.post('/driver/pod', payload);
      setMsg({ type: 'success', text: `POD submitted for ${r.data.lr_number}. Shipment marked as Delivered.` });
      setFrm({ driver_id: frm.driver_id, trip_id: frm.trip_id, shipment_id: '', receiver_name: '', receiver_phone: '', notes: '', lat: '', lng: '' });
      loadShipments(frm.trip_id);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'POD submission failed' });
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Digital Proof of Delivery</h1>
        <p className="text-sm text-gray-500 mt-1">Capture and submit POD for delivered shipments</p>
      </div>

      {msg && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-4 opacity-60">✕</button>
        </div>
      )}

      <form onSubmit={submit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {/* Step 1 */}
        <div className="border-b border-gray-100 pb-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Step 1 — Select Driver & Trip</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Driver</label>
              <select value={frm.driver_id} onChange={e => handleChange('driver_id', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                <option value="">Select Driver</option>
                {drivers.map(d => <option key={d._id} value={d._id}>{d.name} — {d.phone}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Active Trip</label>
              <select value={frm.trip_id} onChange={e => handleChange('trip_id', e.target.value)}
                disabled={!frm.driver_id}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50">
                <option value="">Select Trip</option>
                {trips.map(t => <option key={t._id} value={t._id}>{t.trip_number}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="border-b border-gray-100 pb-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Step 2 — Select Shipment</h3>
          <select required value={frm.shipment_id} onChange={e => setFrm(f => ({ ...f, shipment_id: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
            <option value="">Select Shipment to Deliver</option>
            {shipments.map(s => (
              <option key={s._id} value={s._id}>{s.lr_number} — {s.receiver_name} · {s.destination}</option>
            ))}
          </select>
          {frm.trip_id && shipments.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">All shipments in this trip are already delivered.</p>
          )}
        </div>

        {/* Step 3 */}
        <div className="border-b border-gray-100 pb-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Step 3 — Receiver Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Receiver Name</label>
              <input value={frm.receiver_name} onChange={e => setFrm(f => ({ ...f, receiver_name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="Name of person receiving" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Receiver Phone</label>
              <input value={frm.receiver_phone} onChange={e => setFrm(f => ({ ...f, receiver_phone: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="Phone number" />
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Step 4 — Delivery Notes & GPS</h3>
          <textarea value={frm.notes} onChange={e => setFrm(f => ({ ...f, notes: e.target.value }))}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 mb-3"
            placeholder="Any notes (short qty, damages, etc.)" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">GPS Lat (optional)</label>
              <input type="number" step="any" value={frm.lat}
                onChange={e => setFrm(f => ({ ...f, lat: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="19.0760" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">GPS Lng (optional)</label>
              <input type="number" step="any" value={frm.lng}
                onChange={e => setFrm(f => ({ ...f, lng: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="72.8777" />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
          📌 Submitting this form will mark the shipment as <strong>Delivered</strong>, create a tracking event, and update the shipment's GPS location.
        </div>

        <button type="submit" disabled={loading || !frm.shipment_id}
          className="w-full py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <span className="animate-spin">⏳</span> : '✅'}
          Submit Digital POD
        </button>
      </form>
    </div>
  );
}
