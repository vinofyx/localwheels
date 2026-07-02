import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const DOC_TYPES = [
  { value: 'driving_license',    label: 'Driving License' },
  { value: 'vehicle_rc',         label: 'Vehicle RC' },
  { value: 'insurance',          label: 'Insurance' },
  { value: 'permit',             label: 'Permit' },
  { value: 'fitness',            label: 'Fitness Certificate' },
  { value: 'puc',                label: 'PUC Certificate' },
  { value: 'medical',            label: 'Medical Certificate' },
  { value: 'police_verification',label: 'Police Verification' },
  { value: 'other',              label: 'Other' },
];

const STATUS_COLOR = {
  valid:          'bg-green-100 text-green-700',
  expiring_soon:  'bg-yellow-100 text-yellow-700',
  expired:        'bg-red-100 text-red-600',
  pending_renewal:'bg-orange-100 text-orange-700',
};

function DocModal({ drivers, onSave, onClose }) {
  const [frm, setFrm] = useState({
    driver_id: '', doc_type: '', doc_number: '', title: '',
    issued_date: '', expiry_date: '', issued_by: '', notes: '',
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/driver/documents', frm);
      onSave();
    } catch (err) {
      alert(err.response?.data?.error || 'Save failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Add Driver Document</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Driver *</label>
          <select required value={frm.driver_id} onChange={e => setFrm(f => ({ ...f, driver_id: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Select Driver</option>
            {drivers.map(d => <option key={d._id} value={d._id}>{d.name} — {d.phone}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Document Type *</label>
            <select required value={frm.doc_type} onChange={e => {
              const t = DOC_TYPES.find(d => d.value === e.target.value);
              setFrm(f => ({ ...f, doc_type: e.target.value, title: t?.label || '' }));
            }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Select Type</option>
              {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Document Number</label>
            <input value={frm.doc_number} onChange={e => setFrm(f => ({ ...f, doc_number: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="DL-MH-..." />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
          <input required value={frm.title} onChange={e => setFrm(f => ({ ...f, title: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Issue Date</label>
            <input type="date" value={frm.issued_date} onChange={e => setFrm(f => ({ ...f, issued_date: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Expiry Date</label>
            <input type="date" value={frm.expiry_date} onChange={e => setFrm(f => ({ ...f, expiry_date: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Issued By</label>
          <input value={frm.issued_by} onChange={e => setFrm(f => ({ ...f, issued_by: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="RTO Office, Insurance Co..." />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <textarea value={frm.notes} onChange={e => setFrm(f => ({ ...f, notes: e.target.value }))}
            rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Saving...' : 'Add Document'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function DriverDocuments() {
  const [docs, setDocs]         = useState([]);
  const [drivers, setDrivers]   = useState([]);
  const [driverId, setDriverId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [msg, setMsg]           = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (driverId) params.set('driver_id', driverId);
      const r = await api.get(`/driver/documents?${params}`);
      let docs = r.data.documents || [];
      if (filterStatus) docs = docs.filter(d => d.status === filterStatus);
      setDocs(docs);
    } catch {} finally { setLoading(false); }
  }, [driverId, filterStatus]);

  useEffect(() => {
    api.get('/drivers').then(r => setDrivers(r.data?.data?.drivers || r.data?.drivers || [])).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const expiring = docs.filter(d => d.status === 'expiring_soon').length;
  const expired  = docs.filter(d => d.status === 'expired').length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Documents</h1>
          <p className="text-sm text-gray-500 mt-1">{docs.length} documents · {expiring} expiring · {expired} expired</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + Add Document
        </button>
      </div>

      {msg && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-4 opacity-60">✕</button>
        </div>
      )}

      {/* Alerts */}
      {expired > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          ❌ {expired} document(s) expired. Please renew immediately.
        </div>
      )}
      {expiring > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
          ⚠️ {expiring} document(s) expiring within 30 days.
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={driverId} onChange={e => setDriverId(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
          <option value="">All Drivers</option>
          {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          <option value="valid">Valid</option>
          <option value="expiring_soon">Expiring Soon</option>
          <option value="expired">Expired</option>
          <option value="pending_renewal">Pending Renewal</option>
        </select>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex justify-center h-40 items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : docs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No documents found. Add the first document.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map(doc => (
            <div key={doc._id} className={`bg-white rounded-xl border p-4 ${doc.status === 'expired' ? 'border-red-200' : doc.status === 'expiring_soon' ? 'border-yellow-200' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{doc.title}</div>
                  {doc.driver_id?.name && (
                    <div className="text-xs text-gray-500 mt-0.5">{doc.driver_id.name}</div>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_COLOR[doc.status] || 'bg-gray-100 text-gray-500'}`}>
                  {doc.status?.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-1 text-xs text-gray-500">
                {doc.doc_number && <div>No: <span className="font-mono text-gray-700">{doc.doc_number}</span></div>}
                {doc.issued_date && <div>Issued: {new Date(doc.issued_date).toLocaleDateString()}</div>}
                {doc.expiry_date && (
                  <div className={doc.status === 'expired' ? 'text-red-600 font-medium' : doc.status === 'expiring_soon' ? 'text-yellow-700 font-medium' : ''}>
                    Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                    {doc.days_to_expiry != null && (
                      <span className="ml-1">({doc.days_to_expiry > 0 ? `${doc.days_to_expiry}d left` : 'EXPIRED'})</span>
                    )}
                  </div>
                )}
                {doc.issued_by && <div>Issued by: {doc.issued_by}</div>}
              </div>

              {doc.notes && <div className="mt-2 text-xs text-gray-400 italic">{doc.notes}</div>}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <DocModal
          drivers={drivers}
          onSave={() => { setShowModal(false); setMsg({ type: 'success', text: 'Document added!' }); load(); }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
