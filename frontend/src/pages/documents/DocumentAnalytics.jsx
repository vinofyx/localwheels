import { useState, useEffect } from 'react';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

export default function DocumentAnalytics() {
  const [summary, setSummary] = useState(null);
  const [byType, setByType] = useState([]);
  const [byStatus, setByStatus] = useState([]);
  const [trend, setTrend] = useState([]);
  const [ocrAccuracy, setOcrAccuracy] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`${_BASE}/document-analytics/summary`),
      api.get(`${_BASE}/document-analytics/by-type`),
      api.get(`${_BASE}/document-analytics/by-status`),
      api.get(`${_BASE}/document-analytics/trend?days=30`),
      api.get(`${_BASE}/document-analytics/ocr-accuracy`),
    ])
      .then(([s, bt, bs, t, oa]) => {
        setSummary(s.data);
        setByType(bt.data.by_type || []);
        setByStatus(bs.data.by_status || []);
        setTrend(t.data.trend || []);
        setOcrAccuracy(oa.data.ocr_accuracy || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const createSnapshot = async () => {
    await api.post(`${_BASE}/document-analytics/snapshot`);
    alert('Snapshot created');
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading analytics...</div>;

  const maxUploads = Math.max(...trend.map(t => t.uploads || 0), 1);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Document Analytics</h1>
        <button onClick={createSnapshot} className="text-sm border border-gray-300 px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-50">
          📸 Create Snapshot
        </button>
      </div>

      {/* KPIs */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Documents', value: summary.total, color: 'text-gray-800' },
            { label: 'OCR Avg Confidence', value: summary.ocr_avg_confidence + '%', color: 'text-indigo-600' },
            { label: 'Approval Rate', value: summary.approval_rate + '%', color: 'text-green-600' },
            { label: 'Avg OCR Time', value: summary.avg_processing_ms + 'ms', color: 'text-blue-600' },
            { label: 'OCR Processed', value: summary.ocr_processed, color: 'text-teal-600' },
            { label: 'High Fraud Risk', value: summary.high_fraud_risk, color: 'text-red-600' },
            { label: 'Expiring Soon', value: summary.expiring_soon, color: 'text-orange-600' },
            { label: 'Storage Used', value: summary.storage_bytes ? (summary.storage_bytes/1024/1024).toFixed(1)+' MB' : '0 MB', color: 'text-purple-600' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value ?? '—'}</div>
              <div className="text-xs text-gray-500 mt-1">{kpi.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Trend */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Upload Trend (30 Days)</h2>
          {trend.length === 0 ? (
            <div className="text-center text-gray-300 py-8 text-sm">No data</div>
          ) : (
            <div className="space-y-1.5">
              {trend.slice(-14).map(day => (
                <div key={day._id} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-400 w-20 shrink-0">{day._id?.slice(5)}</span>
                  <div className="flex-1 flex gap-0.5 h-4 items-end">
                    <div className="bg-indigo-400 rounded-sm" style={{ width: `${(day.uploads / maxUploads) * 100}%`, height: '100%' }} title={`${day.uploads} uploads`} />
                  </div>
                  <span className="text-gray-500 w-4 text-right">{day.uploads}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By Type */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">By Document Type</h2>
          {byType.length === 0 ? (
            <div className="text-center text-gray-300 py-8 text-sm">No data</div>
          ) : (
            <div className="space-y-2">
              {byType.slice(0, 8).map(t => (
                <div key={t._id} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-600 w-28 shrink-0 capitalize">{t._id?.replace(/_/g,' ')}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${(t.count / (byType[0]?.count || 1)) * 100}%` }} />
                  </div>
                  <span className="text-gray-500 w-6 text-right">{t.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By Status */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">By Processing Status</h2>
          {byStatus.length === 0 ? (
            <div className="text-center text-gray-300 py-8 text-sm">No data</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {byStatus.map(s => (
                <div key={s._id} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-lg font-bold text-gray-800">{s.count}</div>
                  <div className="text-xs text-gray-500 capitalize">{s._id?.replace(/_/g,' ')}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* OCR Accuracy */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">OCR Accuracy by Type</h2>
          {ocrAccuracy.length === 0 ? (
            <div className="text-center text-gray-300 py-8 text-sm">No OCR data</div>
          ) : (
            <div className="space-y-2">
              {ocrAccuracy.slice(0,6).map(t => (
                <div key={t._id} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 w-28 shrink-0 capitalize">{t._id?.replace(/_/g,' ') || 'Unknown'}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${t.avg_confidence >= 0.8 ? 'bg-green-500' : t.avg_confidence >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.round((t.avg_confidence || 0) * 100)}%` }} />
                  </div>
                  <span className={`w-8 text-right font-medium ${t.avg_confidence >= 0.8 ? 'text-green-600' : t.avg_confidence >= 0.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {Math.round((t.avg_confidence || 0) * 100)}%
                  </span>
                  <span className="text-gray-400 w-6 text-right">{t.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
