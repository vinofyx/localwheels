import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { Plus, Search, Filter, RefreshCw, ChevronDown, ChevronUp, Star, Phone, Mail, Building2, X } from 'lucide-react';

const STAGES  = ['new_lead','qualified','contacted','meeting_scheduled','proposal_sent','negotiation','won','lost'];
const SOURCES = ['website','whatsapp','facebook','instagram','google_ads','referral','sales_team','manual_entry'];
const STAGE_COLORS = {
  new_lead:'bg-slate-600', qualified:'bg-blue-700', contacted:'bg-cyan-700',
  meeting_scheduled:'bg-purple-700', proposal_sent:'bg-orange-700',
  negotiation:'bg-yellow-700', won:'bg-green-700', lost:'bg-red-700',
};

function ScoreBadge({ score }) {
  const color = score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400';
  return <span className={`text-sm font-bold ${color}`}>{score ?? '—'}</span>;
}

function LeadModal({ lead, onClose, onSave }) {
  const [form, setForm] = useState(lead || {
    name:'', company_name:'', phone:'', email:'', source:'manual_entry',
    stage:'new_lead', service_type:'ftl', frequency:'one_time',
    origin_city:'', destination_city:'', cargo_type:'', weight_tons:'',
    estimated_value:'', notes:'',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name?.trim()) return alert('Name required');
    setSaving(true);
    try {
      if (lead?._id) {
        const { data } = await api.put(`/leads/${lead._id}`, form);
        onSave(data);
      } else {
        const { data } = await api.post('/leads', form);
        onSave(data);
      }
      onClose();
    } catch (e) { alert(e.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  };

  const field = (label, key, type = 'text', options) => (
    <div key={key}>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      {options ? (
        <select className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100"
          value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}>
          {options.map(o => <option key={o} value={o}>{o.replace(/_/g,' ')}</option>)}
        </select>
      ) : (
        <input type={type} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100"
          value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-base font-semibold text-white">{lead?._id ? 'Edit Lead' : 'New Lead'}</h2>
          <button onClick={onClose}><X size={18} className="text-slate-400 hover:text-white" /></button>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          {field('Name *', 'name')}
          {field('Company', 'company_name')}
          {field('Phone', 'phone', 'tel')}
          {field('Email', 'email', 'email')}
          {field('Source', 'source', 'text', SOURCES)}
          {field('Stage', 'stage', 'text', STAGES)}
          {field('Service Type', 'service_type', 'text', ['ftl','ltl','express','part_load','courier'])}
          {field('Frequency', 'frequency', 'text', ['one_time','weekly','monthly','quarterly','annual'])}
          {field('Origin City', 'origin_city')}
          {field('Destination City', 'destination_city')}
          {field('Cargo Type', 'cargo_type')}
          {field('Weight (tons)', 'weight_tons', 'number')}
          {field('Estimated Value (₹)', 'estimated_value', 'number')}
          <div className="col-span-2">
            <label className="block text-xs text-slate-400 mb-1">Notes</label>
            <textarea className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 h-20 resize-none"
              value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-slate-700">
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg text-sm hover:bg-slate-600">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Lead'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LeadManagement() {
  const [leads, setLeads]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [stage, setStage]       = useState('');
  const [page, setPage]         = useState(1);
  const [modal, setModal]       = useState(null); // null | 'new' | lead_obj
  const [expanded, setExpanded] = useState(null);
  const [scoring, setScoring]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set('search', search);
      if (stage)  params.set('stage', stage);
      const { data } = await api.get(`/leads?${params}`);
      setLeads(data.leads || []);
      setTotal(data.total || 0);
    } catch { setLeads([]); }
    finally { setLoading(false); }
  }, [page, search, stage]);

  useEffect(() => { load(); }, [load]);

  const aiScore = async (lead) => {
    setScoring(lead._id);
    try {
      const { data } = await api.post('/leads/score', { lead_id: lead._id });
      setLeads(ls => ls.map(l => l._id === lead._id ? { ...l, ...data } : l));
    } catch { alert('Scoring failed'); }
    finally { setScoring(null); }
  };

  const deleteLead = async (lead) => {
    if (!confirm(`Delete lead ${lead.lead_number}?`)) return;
    await api.delete(`/leads/${lead._id}`);
    load();
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Lead Management</h1>
          <p className="text-sm text-slate-400">{total} leads total</p>
        </div>
        <button onClick={() => setModal('new')} className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
          <Plus size={14} /> New Lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500"
            placeholder="Search name, company, phone…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
          value={stage} onChange={e => { setStage(e.target.value); setPage(1); }}>
          <option value="">All Stages</option>
          {STAGES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
        <button onClick={load} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm hover:bg-slate-700">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Leads List */}
      {loading ? (
        <div className="text-center text-slate-400 py-12">Loading leads…</div>
      ) : !leads.length ? (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-3">No leads found</p>
          <button onClick={() => setModal('new')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Create First Lead</button>
        </div>
      ) : (
        <div className="space-y-2">
          {leads.map(lead => (
            <div key={lead._id} className="bg-slate-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-750"
                onClick={() => setExpanded(expanded === lead._id ? null : lead._id)}>
                {/* Score */}
                <div className="text-center w-10 flex-shrink-0">
                  <ScoreBadge score={lead.ai_score} />
                  <p className="text-xs text-slate-500">score</p>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">{lead.name}</span>
                    {lead.company_name && <span className="text-xs text-slate-400 flex items-center gap-1"><Building2 size={10} />{lead.company_name}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full text-white ${STAGE_COLORS[lead.stage] || 'bg-slate-600'}`}>
                      {lead.stage.replace(/_/g,' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    {lead.phone && <span className="flex items-center gap-1"><Phone size={10} />{lead.phone}</span>}
                    {lead.origin_city && <span>🚚 {lead.origin_city} → {lead.destination_city || '?'}</span>}
                    {lead.estimated_value > 0 && <span className="text-green-400 font-medium">₹{lead.estimated_value.toLocaleString()}</span>}
                  </div>
                  {lead.ai_qualification && <p className="text-xs text-slate-500 mt-0.5 italic">{lead.ai_qualification}</p>}
                </div>
                {/* Source */}
                <div className="text-xs text-slate-500 text-right flex-shrink-0">
                  <p>{lead.source?.replace(/_/g,' ')}</p>
                  <p>{lead.lead_number}</p>
                </div>
                {expanded === lead._id ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
              </div>

              {expanded === lead._id && (
                <div className="border-t border-slate-700 p-3 space-y-3 bg-slate-850">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {[
                      ['Service',    lead.service_type],
                      ['Frequency',  lead.frequency],
                      ['Cargo',      lead.cargo_type || '—'],
                      ['Weight',     lead.weight_tons ? `${lead.weight_tons}t` : '—'],
                      ['AI Next',    lead.ai_next_action || '—'],
                      ['Win Prob',   lead.ai_win_probability != null ? `${lead.ai_win_probability}%` : '—'],
                      ['Source',     lead.source?.replace(/_/g,' ')],
                      ['Created',    new Date(lead.createdAt).toLocaleDateString()],
                    ].map(([l,v]) => (
                      <div key={l}><p className="text-slate-500">{l}</p><p className="text-slate-200">{v}</p></div>
                    ))}
                  </div>
                  {lead.notes && <p className="text-xs text-slate-400 italic">{lead.notes}</p>}
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setModal(lead)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs">Edit</button>
                    <button onClick={() => aiScore(lead)} disabled={scoring === lead._id} className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded text-xs disabled:opacity-50">
                      {scoring === lead._id ? 'Scoring…' : '🤖 AI Score'}
                    </button>
                    <button onClick={() => deleteLead(lead)} className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-red-200 rounded text-xs">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage(p => p-1)}
            className="px-3 py-1.5 bg-slate-700 text-slate-200 rounded text-sm disabled:opacity-40">Prev</button>
          <span className="text-sm text-slate-400">Page {page} of {Math.ceil(total/20)}</span>
          <button disabled={page >= Math.ceil(total/20)} onClick={() => setPage(p => p+1)}
            className="px-3 py-1.5 bg-slate-700 text-slate-200 rounded text-sm disabled:opacity-40">Next</button>
        </div>
      )}

      {modal && (
        <LeadModal
          lead={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => load()}
        />
      )}
    </div>
  );
}
