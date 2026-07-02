import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

export default function ValidationDashboard() {
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');
  const [fraudFilter, setFraudFilter] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: 20 });
    if (filter !== '') params.set('is_valid', filter);
    if (fraudFilter) params.set('fraud_risk', fraudFilter);

    Promise.all([
      api.get(`${_BASE}/document-validation?${params}`),
      api.get(`${_BASE}/document-analytics/validation-summary`),
    ])
      .then(([r, s]) => {
        setResults(r.data.results || []);
        setTotal(r.data.total || 0);
        setSummary(s.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter, fraudFilter]);

  const validCount = summary?.validation?.find(v => v._id === true)?.count || 0;
  const invalidCount = summary?.validation?.find(v => v._id === false)?.count || 0;
  const highFraud = summary?.fraud_risk?.find(f => f._id === 'high')?.count || 0;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Validation Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-700">{validCount}</div>
          <div className="text-sm text-green-600">Valid Documents</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-red-700">{invalidCount}</div>
          <div className="text-sm text-red-600">Failed Validation</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-orange-700">{highFraud}</div>
          <div className="text-sm text-orange-600">High Fraud Risk</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select value={filter} onChange={e => setFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
          <option value="">All</option>
          <option value="true">Valid</option>
          <option value="false">Invalid</option>
        </select>
        <select value={fraudFilter} onChange={e => setFraudFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
          <option value="">All Fraud Risk</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <span className="self-center text-sm text-gray-500">{total} results</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No validation results found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Document</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Valid</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Fraud Risk</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Errors</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.map(v => (
                <tr key={v._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">
                    {v.document_id?.name || 'Unknown'}
                    <div className="text-xs text-gray-400 capitalize">{v.document_id?.doc_type?.replace(/_/g,' ')}</div>
                  </td>
                  <td className="px-4 py-3">{v.is_valid ? <span className="text-green-600">✅ Yes</span> : <span className="text-red-600">❌ No</span>}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${v.score >= 80 ? 'bg-green-500' : v.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${v.score}%` }} />
                      </div>
                      <span className="text-xs">{v.score}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${v.fraud_risk === 'high' ? 'bg-red-100 text-red-700' : v.fraud_risk === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {v.fraud_risk}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-red-600">{v.validation_errors?.length || 0} error{v.validation_errors?.length !== 1 ? 's' : ''}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(v.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Link to={`/documents/ocr/${v.document_id?._id}`} className="text-xs text-indigo-600 hover:underline">View</Link>
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
