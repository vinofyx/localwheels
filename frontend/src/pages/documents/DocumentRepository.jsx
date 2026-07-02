import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

const DOC_TYPES = ['invoice','lr','awb','pod','delivery_challan','packing_list','gst_invoice','eway_bill','driver_license','vehicle_rc','insurance','permit','fitness','puc','fastag','customer_doc','vendor_doc','purchase_bill','fuel_bill','other'];

const STATUS_BADGE = {
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
  correction_required: 'bg-orange-100 text-orange-700',
};

export default function DocumentRepository() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [docs, setDocs] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [folders, setFolders] = useState([]);

  const page = parseInt(searchParams.get('page') || '1');
  const docType = searchParams.get('doc_type') || '';
  const status = searchParams.get('approval_status') || '';
  const folderId = searchParams.get('folder_id') || '';
  const isDeleted = searchParams.get('is_deleted') === 'true';

  const loadDocs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (docType) params.set('doc_type', docType);
    if (status) params.set('approval_status', status);
    if (folderId) params.set('folder_id', folderId);
    if (isDeleted) params.set('is_deleted', 'true');

    Promise.all([
      api.get(`${_BASE}/documents?${params}`),
      api.get(`${_BASE}/documents/folders`),
    ])
      .then(([r, f]) => {
        setDocs(r.data.documents || []);
        setTotal(r.data.total || 0);
        setPages(r.data.pages || 1);
        setFolders(f.data.folders || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, docType, status, folderId, isDeleted]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const softDelete = async (id) => {
    if (!confirm('Move to recycle bin?')) return;
    await api.delete(`${_BASE}/documents/${id}`);
    loadDocs();
  };

  const toggleFavorite = async (id) => {
    await api.post(`${_BASE}/documents/${id}/favorite`);
    loadDocs();
  };

  const setFilter = (key, val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    p.set('page', '1');
    setSearchParams(p);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Document Repository</h1>
        <Link to="/documents/upload" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">+ Upload</Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white border border-gray-200 rounded-xl p-4">
        <select value={docType} onChange={e => setFilter('doc_type', e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
          <option value="">All Types</option>
          {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
        </select>
        <select value={status} onChange={e => setFilter('approval_status', e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
          <option value="">All Status</option>
          {['pending','approved','rejected','correction_required'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
        <select value={folderId} onChange={e => setFilter('folder_id', e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
          <option value="">All Folders</option>
          {folders.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
        </select>
        <button onClick={() => setFilter('is_deleted', isDeleted ? '' : 'true')} className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${isDeleted ? 'bg-red-100 text-red-700 border-red-300' : 'border-gray-300 text-gray-700'}`}>
          {isDeleted ? 'Recycle Bin' : 'Recycle Bin'}
        </button>
        <span className="ml-auto text-sm text-gray-500 self-center">{total} documents</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : docs.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No documents found. <Link to="/documents/upload" className="text-indigo-600">Upload one</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left"><input type="checkbox" onChange={e => setSelected(e.target.checked ? docs.map(d => d._id) : [])} /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">OCR</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {docs.map(doc => (
                <tr key={doc._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><input type="checkbox" checked={selected.includes(doc._id)} onChange={e => setSelected(e.target.checked ? [...selected, doc._id] : selected.filter(i => i !== doc._id))} /></td>
                  <td className="px-4 py-3">
                    <Link to={`/documents/ocr/${doc._id}`} className="font-medium text-gray-800 hover:text-indigo-600 truncate block max-w-xs">
                      {doc.is_favorite && <span className="text-yellow-400 mr-1">★</span>}
                      {doc.name}
                    </Link>
                    {doc.is_duplicate && <span className="text-xs bg-orange-100 text-orange-700 px-1 rounded ml-1">Duplicate</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{doc.doc_type?.replace(/_/g,' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[doc.approval_status] || 'bg-gray-100 text-gray-600'}`}>
                      {doc.approval_status || 'pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {doc.ocr_confidence ? (
                      <span className={`text-xs font-medium ${doc.ocr_confidence >= 0.8 ? 'text-green-600' : doc.ocr_confidence >= 0.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {Math.round(doc.ocr_confidence * 100)}%
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(doc.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link to={`/documents/ocr/${doc._id}`} className="text-indigo-600 hover:underline text-xs">View</Link>
                      <button onClick={() => toggleFavorite(doc._id)} className="text-yellow-500 hover:text-yellow-600 text-xs">★</button>
                      {!isDeleted && <button onClick={() => softDelete(doc._id)} className="text-red-400 hover:text-red-600 text-xs">Delete</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex gap-2 justify-center">
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setFilter('page', p)} className={`px-3 py-1 rounded-lg text-sm ${p === page ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}
