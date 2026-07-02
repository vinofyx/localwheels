import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

const STAGES = ['pending','ai_reviewed','supervisor_review','approved','rejected','correction_required'];

export default function ApprovalDashboard() {
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [stage, setStage] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: 20 });
    if (stage) params.set('stage', stage);
    api.get(`${_BASE}/document-approval?${params}`)
      .then(r => { setResults(r.data.results || []); setTotal(r.data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [stage]);

  const quickApprove = async (docId, approvalId) => {
    await api.post(`${_BASE}/document-approval/${docId}/approve`, { notes: 'Quick approved' });
    load();
  };

  const quickReject = async (docId) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    await api.post(`${_BASE}/document-approval/${docId}/reject`, { reason });
    load();
  };

  const STAGE_COLORS = {
    pending: 'bg-gray-100 text-gray-700',
    ai_reviewed: 'bg-blue-100 text-blue-700',
    supervisor_review: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    correction_required: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Approval Dashboard</h1>

      {/* Stage Filter Pills */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setStage('')} className={`px-3 py-1.5 rounded-full text-xs font-medium ${!stage ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>All ({total})</button>
        {STAGES.map(s => (
          <button key={s} onClick={() => setStage(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${stage === s ? 'bg-indigo-600 text-white' : `${STAGE_COLORS[s]} hover:opacity-80`}`}>
            {s.replace(/_/g,' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No approval records</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Document</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Stage</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">AI Decision</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Last Updated</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.map(a => (
                <tr key={a._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/documents/ocr/${a.document_id?._id}`} className="font-medium text-gray-800 hover:text-indigo-600">
                      {a.document_id?.name || 'Unknown'}
                    </Link>
                    <div className="text-xs text-gray-400 capitalize">{a.document_id?.doc_type?.replace(/_/g,' ')}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STAGE_COLORS[a.current_stage] || 'bg-gray-100 text-gray-700'}`}>
                      {a.current_stage?.replace(/_/g,' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{a.ai_decision || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(a.updatedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link to={`/documents/ocr/${a.document_id?._id}`} className="text-xs text-indigo-600 hover:underline">View</Link>
                      {!['approved','rejected'].includes(a.current_stage) && (
                        <>
                          <button onClick={() => quickApprove(a.document_id?._id)} className="text-xs text-green-600 hover:underline">Approve</button>
                          <button onClick={() => quickReject(a.document_id?._id)} className="text-xs text-red-500 hover:underline">Reject</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
