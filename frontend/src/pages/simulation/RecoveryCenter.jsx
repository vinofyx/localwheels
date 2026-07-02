import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

export default function RecoveryCenter() {
  const [executions, setExecutions] = useState([]);
  const [selected, setSelected]     = useState(null);

  const load = async () => {
    const res = await fetch(`${_BASE}/recovery/executions`, { headers: h() });
    if (res.ok) { const d = await res.json(); setExecutions(d.data.executions || []); }
  };

  useEffect(() => { load(); }, []);

  const updateCheckpoint = async (execId, index, status) => {
    await fetch(`${_BASE}/recovery/executions/${execId}/checkpoint`, {
      method: 'PUT', headers: h(), body: JSON.stringify({ index, status }),
    });
    load();
    if (selected?._id === execId) {
      const res = await fetch(`${_BASE}/recovery/executions`, { headers: h() });
      if (res.ok) { const d = await res.json(); const updated = d.data.executions?.find(e => e._id === execId); setSelected(updated); }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recovery Center</h1>
        <p className="text-gray-500 text-sm mt-1">Manage active disaster recovery executions</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-700">Recovery Executions</h2>
          {executions.length === 0 && (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
              No active recoveries. Activate a BCP plan to start.
            </div>
          )}
          {executions.map(exec => (
            <div
              key={exec._id}
              onClick={() => setSelected(exec)}
              className={`bg-white rounded-xl border p-4 cursor-pointer hover:border-blue-400 ${selected?._id === exec._id ? 'border-blue-500 shadow' : 'border-gray-200'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">{exec.title}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${exec.status === 'activated' ? 'bg-red-100 text-red-700' : exec.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{exec.status}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{exec.incident_type?.replace(/_/g,' ')}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {exec.checkpoints?.filter(c => c.status === 'completed').length || 0}/{exec.checkpoints?.length || 0} done
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          {selected ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-800 mb-1">{selected.title}</h2>
              <p className="text-xs text-gray-500 mb-4">Activated: {new Date(selected.activated_at).toLocaleString()}</p>
              <div className="space-y-2">
                {(selected.checkpoints || []).map((cp, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${cp.status === 'completed' ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                    <div>
                      <div className="font-medium text-sm text-gray-900">
                        {cp.status === 'completed' ? '✓ ' : `${i+1}. `}{cp.title}
                      </div>
                      {cp.completed_at && <div className="text-xs text-gray-400">{new Date(cp.completed_at).toLocaleString()}</div>}
                    </div>
                    {cp.status !== 'completed' && (
                      <button
                        onClick={() => updateCheckpoint(selected._id, i, 'completed')}
                        className="text-xs bg-green-600 text-white px-3 py-1.5 rounded"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              Select a recovery execution to manage checkpoints
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
