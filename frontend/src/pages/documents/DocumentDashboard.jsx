import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

const STAT_CARDS = [
  { key: 'total', label: 'Total Documents', color: 'blue', icon: '📄' },
  { key: 'pending', label: 'Pending Approval', color: 'yellow', icon: '⏳' },
  { key: 'approved', label: 'Approved', color: 'green', icon: '✅' },
  { key: 'rejected', label: 'Rejected', color: 'red', icon: '❌' },
  { key: 'expiring_soon', label: 'Expiring Soon', color: 'orange', icon: '⚠️' },
  { key: 'duplicates', label: 'Duplicates', color: 'purple', icon: '🔁' },
  { key: 'ocr_processed', label: 'OCR Processed', color: 'teal', icon: '🔍' },
  { key: 'high_fraud_risk', label: 'Fraud Risk', color: 'red', icon: '🚨' },
];

const COLOR_MAP = {
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  green: 'bg-green-50 border-green-200 text-green-700',
  red: 'bg-red-50 border-red-200 text-red-700',
  orange: 'bg-orange-50 border-orange-200 text-orange-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
  teal: 'bg-teal-50 border-teal-200 text-teal-700',
};

export default function DocumentDashboard() {
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`${_BASE}/document-analytics/summary`),
      api.get(`${_BASE}/document-analytics/trend?days=7`),
      api.get(`${_BASE}/documents?limit=5&sort=createdAt`),
    ])
      .then(([s, t, r]) => {
        setSummary(s.data);
        setTrend(t.data.trend || []);
        setRecent(r.data.documents || []);
      })
      .catch(e => setError(e.response?.data?.error || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading document dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">AI-powered document processing & OCR platform</p>
        </div>
        <div className="flex gap-3">
          <Link to="/documents/upload" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
            + Upload Document
          </Link>
          <Link to="/documents/search" className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
            Search
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map(card => (
          <div key={card.key} className={`border rounded-xl p-4 ${COLOR_MAP[card.color] || 'bg-gray-50 border-gray-200'}`}>
            <div className="text-2xl mb-1">{card.icon}</div>
            <div className="text-2xl font-bold">{summary?.[card.key] ?? '—'}</div>
            <div className="text-xs font-medium mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* OCR Stats Row */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-sm text-gray-500">OCR Avg Confidence</div>
            <div className="text-3xl font-bold text-indigo-600 mt-1">{summary.ocr_avg_confidence}%</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-sm text-gray-500">Approval Rate</div>
            <div className="text-3xl font-bold text-green-600 mt-1">{summary.approval_rate}%</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-sm text-gray-500">Storage Used</div>
            <div className="text-3xl font-bold text-gray-700 mt-1">
              {summary.storage_bytes ? (summary.storage_bytes / 1024 / 1024).toFixed(1) + ' MB' : '0 MB'}
            </div>
          </div>
        </div>
      )}

      {/* Upload Trend + Recent Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trend */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Uploads (Last 7 Days)</h2>
          {trend.length === 0 ? (
            <div className="text-center text-gray-400 py-8 text-sm">No data yet</div>
          ) : (
            <div className="space-y-2">
              {trend.map(day => (
                <div key={day._id} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20">{day._id}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (day.uploads / Math.max(...trend.map(t => t.uploads || 1))) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700 w-6 text-right">{day.uploads}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Documents */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Recent Documents</h2>
            <Link to="/documents/repository" className="text-xs text-indigo-600 hover:underline">View all</Link>
          </div>
          {recent.length === 0 ? (
            <div className="text-center text-gray-400 py-8 text-sm">No documents yet. <Link to="/documents/upload" className="text-indigo-600">Upload one</Link></div>
          ) : (
            <div className="space-y-2">
              {recent.map(doc => (
                <Link key={doc._id} to={`/documents/ocr/${doc._id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <span className="text-lg">📄</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{doc.name}</div>
                    <div className="text-xs text-gray-400">{doc.doc_type} · {new Date(doc.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    doc.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
                    doc.approval_status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{doc.approval_status || 'pending'}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { to: '/documents/repository', icon: '🗂️', label: 'Repository' },
          { to: '/documents/upload', icon: '📤', label: 'Upload' },
          { to: '/documents/validation', icon: '✔️', label: 'Validation' },
          { to: '/documents/approval', icon: '📋', label: 'Approvals' },
          { to: '/documents/analytics', icon: '📊', label: 'Analytics' },
        ].map(a => (
          <Link key={a.to} to={a.to} className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:border-indigo-300 hover:shadow-sm transition-all">
            <div className="text-2xl mb-1">{a.icon}</div>
            <div className="text-sm font-medium text-gray-700">{a.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
