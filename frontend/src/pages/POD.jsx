import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';

const POD_BADGE = {
  pending: 'bg-amber-100 text-amber-700',
  uploaded: 'bg-blue-100 text-blue-700',
  verified: 'bg-green-100 text-green-700',
};

function UploadModal({ pod, onClose, onDone }) {
  const [form, setForm] = useState({ receiver_name: pod.receiver_name || '', delivery_date: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('receiver_name', form.receiver_name);
      fd.append('delivery_date', form.delivery_date);
      if (file) fd.append('file', file);
      await api.post(`/pod/${pod.shipment_id}/upload`, fd);
      toast.success('POD uploaded');
      onDone();
    } catch { toast.error('Upload failed'); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="font-bold text-lg mb-4">Upload POD — {pod.lr_number}</h3>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Receiver Name</label>
            <input className="input" value={form.receiver_name} onChange={e => setForm(f => ({ ...f, receiver_name: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Delivery Date</label>
            <input className="input" type="date" value={form.delivery_date} onChange={e => setForm(f => ({ ...f, delivery_date: e.target.value }))} required />
          </div>
          <div>
            <label className="label">POD Document (image/PDF)</label>
            <input className="input" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => setFile(e.target.files[0])} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Uploading…' : 'Upload POD'}</button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function POD() {
  const { branch } = useAuth();
  const [searchParams] = useSearchParams();
  const [pods, setPods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '');
  const [uploading, setUploading] = useState(null);

  const fetchPODs = useCallback(() => {
    if (!branch) return;
    setLoading(true);
    const params = new URLSearchParams({ branch_id: branch._id || branch.id, limit: 50 });
    if (filterStatus) params.set('status', filterStatus);
    api.get(`/pod?${params}`)
      .then(r => setPods(r.data.data))
      .catch(() => toast.error('Failed to load POD list'))
      .finally(() => setLoading(false));
  }, [branch, filterStatus]);

  useEffect(() => { fetchPODs(); }, [fetchPODs]);

  async function verify(shipmentId) {
    try {
      await api.patch(`/pod/${shipmentId}/verify`);
      toast.success('POD verified');
      fetchPODs();
    } catch { toast.error('Failed to verify'); }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Proof of Delivery</h1>
        <p className="text-sm text-gray-500">{branch?.branch_name}</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[['', 'All'], ['pending', 'Pending'], ['uploaded', 'Uploaded'], ['verified', 'Verified']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilterStatus(val)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterStatus === val ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

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
                  <th className="table-th">Destination</th>
                  <th className="table-th">Booking Date</th>
                  <th className="table-th">POD Status</th>
                  <th className="table-th">Delivery Date</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pods.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="table-td">
                      <Link to={`/shipments/${p.shipment_id}`} className="text-blue-600 font-semibold hover:underline">{p.lr_number}</Link>
                    </td>
                    <td className="table-td">{p.sender_name}</td>
                    <td className="table-td">{p.receiver_name}</td>
                    <td className="table-td">{p.destination}</td>
                    <td className="table-td">{p.booking_date}</td>
                    <td className="table-td">
                      <span className={`badge ${POD_BADGE[p.status]}`}>{p.status}</span>
                    </td>
                    <td className="table-td">{p.delivery_date || '—'}</td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        {p.status === 'pending' && (
                          <button onClick={() => setUploading(p)} className="text-xs btn-primary py-1 px-2">
                            Upload
                          </button>
                        )}
                        {p.status === 'uploaded' && (
                          <button onClick={() => verify(p.shipment_id)} className="text-xs bg-green-600 hover:bg-green-700 text-white font-medium px-2 py-1 rounded transition-colors">
                            Verify
                          </button>
                        )}
                        {p.uploaded_file && (
                          <a href={p.uploaded_file} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                            View
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pods.length === 0 && (
              <p className="text-center text-gray-400 py-10">No POD records found</p>
            )}
          </div>
        )}
      </div>

      {uploading && (
        <UploadModal
          pod={uploading}
          onClose={() => setUploading(null)}
          onDone={() => { setUploading(null); fetchPODs(); }}
        />
      )}
    </div>
  );
}
