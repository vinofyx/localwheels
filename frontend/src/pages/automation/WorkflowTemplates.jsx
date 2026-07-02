import { useState } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h  = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });
const jh = () => ({ ...h(), 'Content-Type': 'application/json' });

const TEMPLATES = [
  { id:'lead_assign',   category:'crm',       icon:'🎯', name:'Lead Auto Assignment', description:'Automatically assign new leads to sales reps based on region and workload', steps:['Receive new lead','Check region','Find available rep','Assign lead','Send notification'] },
  { id:'quote_gen',     category:'logistics', icon:'💰', name:'Automatic Quote Generation', description:'Generate freight quotes automatically when booking requests arrive', steps:['Receive booking request','Calculate distance','Compute rates','Generate quote PDF','Email to customer'] },
  { id:'invoice_auto',  category:'finance',   icon:'📄', name:'Invoice Auto Generation', description:'Generate and send invoices automatically on shipment delivery', steps:['Detect delivery','Pull shipment data','Calculate charges','Generate invoice','Send to customer'] },
  { id:'complaint_rt',  category:'logistics', icon:'🎫', name:'Complaint Auto Routing', description:'Route customer complaints to the right department automatically', steps:['Receive complaint','Classify type','Find department','Assign agent','Notify agent'] },
  { id:'maintenance',   category:'fleet',     icon:'🔧', name:'Maintenance Auto Scheduling', description:'Schedule vehicle maintenance based on mileage and health data', steps:['Monitor vehicle health','Check mileage threshold','Find available slot','Schedule maintenance','Notify driver'] },
  { id:'inv_replenish', category:'warehouse', icon:'📦', name:'Inventory Auto Replenishment', description:'Automatically reorder stock when inventory falls below threshold', steps:['Monitor inventory levels','Check reorder point','Select preferred supplier','Generate purchase order','Send to supplier'] },
  { id:'pay_reminder',  category:'finance',   icon:'💳', name:'Payment Reminder', description:'Send automated payment reminders before and after invoice due dates', steps:['Check invoice due dates','Filter unpaid invoices','Send reminder email','Schedule follow-up','Log activity'] },
  { id:'doc_classify',  category:'warehouse', icon:'📂', name:'Document Auto Classification', description:'Automatically classify and file incoming documents using AI', steps:['Receive document','Extract text (OCR)','Classify document type','Assign folder','Notify owner'] },
  { id:'supplier_apr',  category:'logistics', icon:'🏭', name:'Supplier Auto Approval', description:'Automatically approve suppliers who meet scoring criteria', steps:['New supplier application','Score performance','Check compliance','Auto-approve if qualified','Send approval notice'] },
  { id:'exec_report',   category:'crm',       icon:'📊', name:'Executive Daily Report', description:'Generate and send daily executive summary reports automatically', steps:['Collect KPIs','Summarize performance','Generate AI narrative','Format report','Email to executives'] },
  { id:'dispatch_plan', category:'logistics', icon:'🚚', name:'Dispatch Auto Planning', description:'Automatically plan dispatch routes and assign vehicles/drivers', steps:['Collect pending shipments','Group by route','Assign optimal vehicle','Assign driver','Notify dispatch team'] },
  { id:'putaway',       category:'warehouse', icon:'🏪', name:'Warehouse Auto Put-away', description:'Automatically assign bin locations for inbound inventory', steps:['Scan inbound item','Check item category','Find optimal bin','Assign location','Update inventory'] },
];

const CATEGORY_COLOR = { crm:'bg-blue-100 text-blue-700', logistics:'bg-indigo-100 text-indigo-700', finance:'bg-green-100 text-green-700', fleet:'bg-yellow-100 text-yellow-700', warehouse:'bg-purple-100 text-purple-700' };

export default function WorkflowTemplates() {
  const [filter, setFilter] = useState('all');
  const [deploying, setDeploying] = useState(null);

  const categories = ['all', ...new Set(TEMPLATES.map(t => t.category))];

  const filtered = filter === 'all' ? TEMPLATES : TEMPLATES.filter(t => t.category === filter);

  const deploy = async (tpl) => {
    setDeploying(tpl.id);
    try {
      await fetch(`${_BASE}/automation`, {
        method: 'POST', headers: jh(),
        body: JSON.stringify({
          name: tpl.name, description: tpl.description,
          category: tpl.category, trigger_type: 'manual', is_template: false,
          steps: tpl.steps.map((s, i) => ({ step_number: i + 1, name: s, action_type: 'custom', action_config: {} })),
        }),
      });
      alert(`✅ "${tpl.name}" deployed to your workflows!`);
    } catch (_) {
      alert('Failed to deploy template');
    } finally { setDeploying(null); }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Workflow Templates</h1>
        <p className="text-sm text-gray-500 mt-1">Pre-built automation templates — deploy in one click</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`text-sm px-3 py-1.5 rounded-full border capitalize transition-colors ${filter === c ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(tpl => (
          <div key={tpl.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl">{tpl.icon}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLOR[tpl.category] || 'bg-gray-100 text-gray-600'}`}>{tpl.category}</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{tpl.name}</h3>
            <p className="text-sm text-gray-500 mb-3 flex-1">{tpl.description}</p>
            <div className="space-y-1 mb-4">
              {tpl.steps.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-bold flex-shrink-0">{i+1}</span>
                  {s}
                </div>
              ))}
            </div>
            <button onClick={() => deploy(tpl)} disabled={deploying === tpl.id}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {deploying === tpl.id ? 'Deploying…' : '⚡ Deploy Template'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
