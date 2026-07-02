import { useState, useEffect, useCallback } from 'react';
import { Mic, TrendingUp, Globe, Zap, PhoneCall, CheckCircle, Loader, RefreshCw } from 'lucide-react';
import axios from 'axios';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const API = `${_BASE}/voice`;
const LANG_LABELS = { en: 'English', hi: 'हिन्दी', te: 'తెలుగు', ta: 'தமிழ்', kn: 'ಕನ್ನಡ' };
const INTENT_LABELS = {
  track_shipment: 'Track Shipment', get_quote: 'Get Quote', raise_complaint: 'Raise Complaint',
  nearest_branch: 'Nearest Branch', talk_to_agent: 'Talk to Agent', dispatch_summary: 'Dispatch Summary',
  fleet_status: 'Fleet Status', revenue_kpi: 'Revenue KPI', unknown: 'Unknown',
};

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('lw_token')}` };
}

function KpiCard({ label, value, sub, icon: Icon, color = 'text-indigo-600', bg = 'bg-indigo-50' }) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center mb-3`}>
        <Icon size={20} className={color} />
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-sm font-medium text-gray-600 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function HBarChart({ data, total, colorClass = 'bg-indigo-500' }) {
  if (!data?.length) return <div className="text-sm text-gray-400 py-4 text-center">No data yet.</div>;
  const max = data[0]?.count || 1;
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3 text-sm">
          <span className="w-40 text-gray-600 truncate">{d.intent ? (INTENT_LABELS[d.intent] || d.intent) : d.lang}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-2">
            <div className={`${colorClass} h-2 rounded-full`} style={{ width: `${Math.round((d.count / max) * 100)}%` }} />
          </div>
          <span className="w-8 text-right text-gray-500">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

export default function VoiceAnalytics() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: d } = await axios.get(`${API}/analytics`, { params: { days }, headers: authHeaders() });
      setData(d);
    } catch { setData(null); }
    finally { setLoading(false); }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const langRows = data ? Object.entries(data.language_distribution || {}).map(([k, count]) => ({ lang: LANG_LABELS[k] || k, count })).sort((a, b) => b.count - a.count) : [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2"><TrendingUp size={22} /> Voice Analytics</h1>
          <p className="text-sm text-gray-500">AI voice assistant performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="border rounded-lg px-3 py-2 text-sm" value={days} onChange={e => setDays(Number(e.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button onClick={load} className="p-2 border rounded-lg hover:bg-gray-50"><RefreshCw size={16} /></button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400"><Loader className="animate-spin mx-auto mb-2" /> Loading analytics…</div>
      ) : !data ? (
        <div className="text-center py-20 text-gray-400">No analytics data yet.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label="Total Sessions" value={data.total_sessions} icon={Mic} />
            <KpiCard label="Avg Duration" value={`${data.avg_call_duration_sec}s`} icon={PhoneCall} color="text-blue-600" bg="bg-blue-50" />
            <KpiCard label="AI Resolution Rate" value={`${data.ai_resolution_rate_pct}%`} icon={CheckCircle} color="text-green-600" bg="bg-green-50" />
            <KpiCard label="Human Transfer Rate" value={`${data.human_transfer_rate_pct}%`} icon={Zap} color="text-orange-600" bg="bg-orange-50"
              sub={`Avg satisfaction: ${data.avg_satisfaction_score}/5`} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white border rounded-xl p-5">
              <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Zap size={16} /> Top Voice Queries</h2>
              <HBarChart data={data.top_intents?.map(d => ({ intent: d.intent, count: d.count }))} />
            </div>
            <div className="bg-white border rounded-xl p-5">
              <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Globe size={16} /> Language Distribution</h2>
              <HBarChart data={langRows} colorClass="bg-emerald-500" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
