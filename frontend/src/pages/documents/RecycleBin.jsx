import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

export default function RecycleBin() {
  const [docs, setDocs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get(`${_BASE}/documents?is_deleted=true&limit=50`)
      .then(r => { setDocs(r.data.documents || []); setTotal(r.data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const restore = async (id) => {
    await api.post(`${_BASE}/documents/${id}/restore`);
    load();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/documents/repository" className="text-gray-400 hover:text-gray-600 text-sm">← Repository</Link>
          <h1 className="text-2xl font-bold text-gray-900">Recycle Bin</h1>
        </div>
        <span className="text-sm text-gray-500">{total} deleted document{total !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400">Loading...</div>
      ) : docs.length === 0 ? (
        <div className="p-12 text-center">
          <div className="text-5xl mb-3">🗑️</div>
          <div className="text-gray-400">Recycle bin is empty</div>
          <Link to="/documents/repository" className="text-indigo-600 text-sm mt-2 block hover:underline">Back to Repository</Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Deleted</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {docs.map(doc => (
                <tr key={doc._id} className="hover:bg-gray-50 opacity-75">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-700">{doc.name}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 capitalize text-xs">{doc.doc_type?.replace(/_/g,' ')}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {doc.deleted_at ? new Date(doc.deleted_at).toLocaleDateString() : new Date(doc.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => restore(doc._id)} className="text-xs text-indigo-600 hover:underline">Restore</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
