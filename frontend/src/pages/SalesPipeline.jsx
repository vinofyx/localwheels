import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { RefreshCw, Plus, X, DollarSign } from 'lucide-react';

const STAGES = [
  { key: 'new_lead',          label: 'New Lead',          color: 'border-slate-500' },
  { key: 'qualified',         label: 'Qualified',         color: 'border-blue-500' },
  { key: 'contacted',         label: 'Contacted',         color: 'border-cyan-500' },
  { key: 'meeting_scheduled', label: 'Meeting Scheduled', color: 'border-purple-500' },
  { key: 'proposal_sent',     label: 'Proposal Sent',     color: 'border-orange-500' },
  { key: 'negotiation',       label: 'Negotiation',       color: 'border-yellow-500' },
];

function fmt(n) {
  if (n >= 100000) return `₹${(n/100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n/1000).toFixed(1)}K`;
  return `₹${n || 0}`;
}

function OppCard({ opp, onEdit, onMove }) {
  return (
    <div className="bg-slate-700 rounded-lg p-3 mb-2 cursor-pointer hover:bg-slate-650 select-none"
      onClick={() => onEdit(opp)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-white leading-tight">{opp.customer_name}</p>
        <span className="text-xs text-green-400 font-bold whitespace-nowrap">{fmt(opp.estimated_value)}</span>
      </div>
      {opp.company_name && <p className="text-xs text-slate-400 mt-0.5">{opp.company_name}</p>}
      <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
        {opp.origin && <span>🚚 {opp.origin} → {opp.destination || '?'}</span>}
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-slate-400">Win: {opp.probability}%</span>
        <div className="h-1.5 w-16 bg-slate-600 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${opp.probability}%` }} />
        </div>
      </div>
      <div className="flex gap-1 mt-2">
        {STAGES.filter(s => s.key !== opp.stage).slice(0,2).map(s => (
          <button key={s.key} onClick={e => { e.stopPropagation(); onMove(opp, s.key); }}
            className="text-xs px-1.5 py-0.5 bg-slate-600 hover:bg-slate-500 text-slate-300 rounded truncate max-w-[80px]">
            → {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function OppModal({ opp, onClose, onSave }) {
  const isNew = !opp?._id;
  const [form, setForm] = useState(opp || {
    title:'', customer_name:'', company_name:'', email:'', phone:'',
    stage:'qualified', service_type:'ftl', origin:'', destination:'',
    estimated_value:'', probability:30, expected_close_date:'', notes:'',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.customer_name?.trim()) return alert('Customer name required');
    setSaving(true);
    try {
      if (isNew) {
        await api.post('/opportunities', { ...form, title: form.title || `${form.customer_name} — ${form.service_type}` });
      } else {
        await api.put(`/opportunities/${opp._id}`, form);
      }
      onSave();
      onClose();
    } catch (e) { alert(e.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  };

  const f = (label, key, type='text', opts) => (
    <div key={key}>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      {opts ? (
        <select className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-100"
          value={form[key]||''} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}>
          {opts.map(o=><option key={o} value={o}>{o.replace(/_/g,' ')}</option>)}
        </select>
      ) : (
        <input type={type} className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-100"
          value={form[key]||''} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-base font-semibold text-white">{isNew ? 'New Opportunity' : 'Edit Opportunity'}</h2>
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          {f('Customer Name *','customer_name')}
          {f('Company','company_name')}
          {f('Stage','stage','text',STAGES.map(s=>s.key))}
          {f('Service','service_type','text',['ftl','ltl','express','part_load','courier'])}
          {f('Origin','origin')}
          {f('Destination','destination')}
          {f('Estimated Value (₹)','estimated_value','number')}
          {f('Win Probability (%)','probability','number')}
          {f('Expected Close','expected_close_date','date')}
          <div className="col-span-2">
            <label className="block text-xs text-slate-400 mb-1">Notes</label>
            <textarea className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-100 h-16 resize-none"
              value={form.notes||''} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-slate-700">
          <button onClick={onClose} className="px-3 py-2 bg-slate-700 text-slate-200 rounded text-sm">Cancel</button>
          <button onClick={save} disabled={saving} className="px-3 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SalesPipeline() {
  const [pipeline, setPipeline] = useState({});
  const [loading, setLoading]  = useState(true);
  const [modal, setModal]      = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/opportunities/pipeline');
      setPipeline(data);
    } catch { setPipeline({}); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const moveOpp = async (opp, newStage) => {
    try {
      await api.put(`/opportunities/${opp._id}`, { stage: newStage });
      load();
    } catch { alert('Move failed'); }
  };

  const totalPipeline = Object.values(pipeline).reduce((s, col) => s + (col.total_value || 0), 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Sales Pipeline</h1>
          <p className="text-sm text-slate-400">
            Pipeline value: <span className="text-green-400 font-medium">{fmt(totalPipeline)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setModal({})} className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
            <Plus size={14} /> New Opportunity
          </button>
        </div>
      </div>

      {/* Kanban board — horizontal scroll */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {STAGES.map(({ key, label, color }) => {
            const col = pipeline[key] || { opportunities: [], total_value: 0, count: 0 };
            return (
              <div key={key} className={`w-56 bg-slate-800 rounded-xl border-t-2 ${color} flex flex-col`}>
                <div className="p-3 border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-200 uppercase tracking-wide">{label}</p>
                    <span className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full">{col.count}</span>
                  </div>
                  <p className="text-xs text-green-400 font-medium mt-0.5">{fmt(col.total_value)}</p>
                </div>
                <div className="p-2 flex-1 min-h-32 overflow-y-auto max-h-[60vh]">
                  {col.opportunities?.map(opp => (
                    <OppCard key={opp._id} opp={opp} onEdit={o => setModal(o)} onMove={moveOpp} />
                  ))}
                  {!col.count && <p className="text-xs text-slate-600 text-center py-4">No opportunities</p>}
                </div>
              </div>
            );
          })}

          {/* Won / Lost summary columns */}
          {['won','lost'].map(s => (
            <div key={s} className={`w-40 bg-slate-800 rounded-xl border-t-2 ${s==='won'?'border-green-500':'border-red-500'} flex flex-col opacity-70`}>
              <div className="p-3">
                <p className="text-xs font-semibold text-slate-300 uppercase">{s}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal !== null && (
        <OppModal
          opp={modal?._id ? modal : null}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
