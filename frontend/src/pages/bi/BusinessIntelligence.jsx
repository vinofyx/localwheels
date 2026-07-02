import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

const SEVERITY_COLOR = {
  critical: 'border-red-200 bg-red-50 text-red-700',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  opportunity: 'border-green-200 bg-green-50 text-green-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
};
const SEVERITY_ICON = { critical: '🚨', warning: '⚠️', opportunity: '💡', info: 'ℹ️' };

export default function BusinessIntelligence() {
  const [insights, setInsights] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([
      api.get(`${_BASE}/business-intelligence/insights?limit=15`),
      api.get(`${_BASE}/business-intelligence/recommendations`),
    ])
      .then(([i, r]) => { setInsights(i.data.insights || []); setRecommendations(r.data.recommendations || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    setGenerating(true);
    await api.post(`${_BASE}/business-intelligence/generate-insights`).catch(() => {});
    load();
    setGenerating(false);
  };

  const markRead = async (id) => {
    await api.post(`${_BASE}/business-intelligence/insights/${id}/read`);
    setInsights(prev => prev.map(i => i._id === id ? { ...i, is_read: true } : i));
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Intelligence</h1>
          <p className="text-gray-500 text-sm mt-0.5">AI-generated insights from all modules</p>
        </div>
        <button onClick={generate} disabled={generating} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
          {generating ? '🧠 Generating...' : '🧠 Generate Insights'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insights Feed */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">AI Insights</h2>
          {insights.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">
              No insights yet. <button onClick={generate} className="text-indigo-600 hover:underline">Generate insights</button>
            </div>
          ) : (
            insights.map(insight => (
              <div key={insight._id} className={`border rounded-xl p-4 ${!insight.is_read ? 'shadow-sm' : 'opacity-75'} ${SEVERITY_COLOR[insight.severity] || SEVERITY_COLOR.info}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="text-lg shrink-0">{SEVERITY_ICON[insight.severity] || 'ℹ️'}</span>
                    <div>
                      <div className="font-semibold text-sm">{insight.title}</div>
                      <div className="text-xs mt-0.5 opacity-80">{insight.summary}</div>
                      {insight.recommendation && (
                        <div className="text-xs mt-1.5 font-medium opacity-90">
                          💡 {insight.recommendation}
                        </div>
                      )}
                      <div className="text-xs mt-1 opacity-60 flex gap-3">
                        <span className="capitalize">{insight.insight_type}</span>
                        <span>{new Date(insight.createdAt).toLocaleDateString()}</span>
                        <span className="capitalize">{insight.generated_by}</span>
                      </div>
                    </div>
                  </div>
                  {!insight.is_read && (
                    <button onClick={() => markRead(insight._id)} className="text-xs opacity-60 hover:opacity-100 shrink-0">✓ Read</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recommendations */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Action Recommendations</h2>
          {recommendations.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-400 text-sm">No recommendations</div>
          ) : (
            recommendations.map((rec, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${rec.priority === 'high' ? 'bg-red-100 text-red-700' : rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                    {rec.priority}
                  </span>
                  <div>
                    <p className="text-sm text-gray-700">{rec.action}</p>
                    <p className="text-xs text-gray-400 mt-1 capitalize">Module: {rec.module}</p>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Quick Actions</h3>
            <div className="space-y-1.5">
              <Link to="/bi/copilot" className="flex items-center gap-2 text-sm text-gray-700 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50">🤖 Ask AI Copilot</Link>
              <Link to="/bi/forecast" className="flex items-center gap-2 text-sm text-gray-700 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50">📈 View Forecasts</Link>
              <Link to="/bi/reports" className="flex items-center gap-2 text-sm text-gray-700 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50">📄 Generate Report</Link>
              <Link to="/bi/alerts" className="flex items-center gap-2 text-sm text-gray-700 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50">🔔 View Alerts</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
