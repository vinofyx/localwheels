import { useState, useEffect, useRef } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const TYPE_COLOR = { general: 'bg-gray-100 text-gray-700', operations: 'bg-blue-100 text-blue-700', incident: 'bg-red-100 text-red-700', dispatch: 'bg-purple-100 text-purple-700', warehouse: 'bg-yellow-100 text-yellow-700', management: 'bg-indigo-100 text-indigo-700' };
const TASK_COLOR = { pending: 'bg-yellow-100 text-yellow-700', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', awaiting_approval: 'bg-orange-100 text-orange-700', approved: 'bg-green-200 text-green-800', rejected: 'bg-red-100 text-red-700' };

export default function CollaborationCenter() {
  const [rooms, setRooms]         = useState([]);
  const [tasks, setTasks]         = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages]   = useState([]);
  const [msgText, setMsgText]     = useState('');
  const [tab, setTab]             = useState('rooms');
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [roomForm, setRoomForm]   = useState({ name: '', type: 'general', description: '' });
  const [taskForm, setTaskForm]   = useState({ title: '', type: 'action', priority: 'medium', due_date: '', description: '' });
  const [loading, setLoading]     = useState(true);
  const msgEnd = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const [r, t] = await Promise.all([
        fetch(`${_BASE}/collaboration/rooms`, { headers: h() }).then(r => r.json()),
        fetch(`${_BASE}/collaboration/tasks?limit=30`, { headers: h() }).then(r => r.json()),
      ]);
      setRooms(r.data?.rooms || []);
      setTasks(t.data?.tasks || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openRoom = async (id) => {
    const r = await fetch(`${_BASE}/collaboration/rooms/${id}`, { headers: h() }).then(r => r.json());
    const room = r.data || r;
    setActiveRoom(room);
    setMessages(room.messages || []);
    setTimeout(() => msgEnd.current?.scrollIntoView(), 100);
  };

  const sendMsg = async () => {
    if (!msgText.trim() || !activeRoom) return;
    await fetch(`${_BASE}/collaboration/rooms/${activeRoom._id}/messages`, { method: 'POST', headers: h(), body: JSON.stringify({ text: msgText }) });
    const newMsg = { sender_name: 'You', text: msgText, sent_at: new Date() };
    setMessages(prev => [...prev, newMsg]);
    setMsgText('');
    setTimeout(() => msgEnd.current?.scrollIntoView(), 50);
  };

  const createRoom = async () => {
    await fetch(`${_BASE}/collaboration/rooms`, { method: 'POST', headers: h(), body: JSON.stringify(roomForm) });
    setShowNewRoom(false);
    setRoomForm({ name: '', type: 'general', description: '' });
    load();
  };

  const createTask = async () => {
    await fetch(`${_BASE}/collaboration/tasks`, { method: 'POST', headers: h(), body: JSON.stringify(taskForm) });
    setShowNewTask(false);
    setTaskForm({ title: '', type: 'action', priority: 'medium', due_date: '', description: '' });
    load();
  };

  const updateTask = async (id, status) => {
    await fetch(`${_BASE}/collaboration/tasks/${id}`, { method: 'PUT', headers: h(), body: JSON.stringify({ status }) });
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collaboration Center</h1>
          <p className="text-sm text-gray-500 mt-1">Team chat, tasks and approvals</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {['rooms','tasks'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t}</button>
        ))}
      </div>

      {loading && <div className="text-center py-12 text-gray-400">Loading…</div>}

      {!loading && tab === 'rooms' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
          <div className="col-span-1 flex flex-col gap-3">
            <button onClick={() => setShowNewRoom(true)} className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm hover:bg-indigo-700">+ New Room</button>
            <div className="space-y-2 overflow-y-auto flex-1">
              {rooms.map(r => (
                <button key={r._id} onClick={() => openRoom(r._id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${activeRoom?._id === r._id ? 'border-indigo-200 bg-indigo-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${TYPE_COLOR[r.type] || 'bg-gray-100 text-gray-700'}`}>{r.type}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">{r.name}</p>
                  {r.description && <p className="text-xs text-gray-500 truncate">{r.description}</p>}
                </button>
              ))}
              {rooms.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No rooms yet</p>}
            </div>
          </div>

          <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
            {activeRoom ? (
              <>
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-900">{activeRoom.name}</p>
                  <p className="text-xs text-gray-500">{activeRoom.members?.length || 0} members</p>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex gap-2 ${m.sender_name === 'You' ? 'flex-row-reverse' : ''}`}>
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-700">{(m.sender_name || '?')[0].toUpperCase()}</div>
                      <div className={`max-w-xs rounded-lg px-3 py-2 text-sm ${m.sender_name === 'You' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                        <p className={`text-xs mb-0.5 opacity-70`}>{m.sender_name}</p>
                        <p>{m.text}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={msgEnd} />
                </div>
                <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
                  <input value={msgText} onChange={e => setMsgText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()} placeholder="Type a message…" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  <button onClick={sendMsg} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Send</button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">Select a room to start chatting</div>
            )}
          </div>
        </div>
      )}

      {!loading && tab === 'tasks' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowNewTask(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">+ New Task</button>
          </div>
          {showNewTask && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-3">Create Task</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                  <input value={taskForm.title} onChange={e => setTaskForm(p => ({...p,title:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                {[['type','Type',['action','approval','review','escalation','follow_up','inspection','other'],'select'],['priority','Priority',['low','medium','high','urgent'],'select']].map(([k,l,opts]) => (
                  <div key={k}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                    <select value={taskForm[k]} onChange={e => setTaskForm(p => ({...p,[k]:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                      {opts.map(o => <option key={o} value={o}>{o.replace('_',' ')}</option>)}
                    </select>
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
                  <input type="date" value={taskForm.due_date} onChange={e => setTaskForm(p => ({...p,due_date:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                  <input value={taskForm.description} onChange={e => setTaskForm(p => ({...p,description:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex gap-3 mt-3">
                <button onClick={createTask} disabled={!taskForm.title} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">Create Task</button>
                <button onClick={() => setShowNewTask(false)} className="border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600">Cancel</button>
              </div>
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Title','Type','Priority','Due Date','Status','Actions'].map(c => <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{c}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tasks.map(t => (
                  <tr key={t._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{t.title}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{t.type?.replace('_',' ')}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${t.priority === 'urgent' ? 'bg-red-100 text-red-700' : t.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>{t.priority}</span></td>
                    <td className="px-4 py-3 text-gray-500">{t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TASK_COLOR[t.status] || 'bg-gray-100 text-gray-700'}`}>{t.status?.replace('_',' ')}</span></td>
                    <td className="px-4 py-3 flex gap-2">
                      {t.status === 'pending' && <button onClick={() => updateTask(t._id, 'in_progress')} className="text-blue-600 text-xs hover:underline">Start</button>}
                      {t.status === 'in_progress' && <button onClick={() => updateTask(t._id, 'completed')} className="text-green-600 text-xs hover:underline">Complete</button>}
                      {t.status === 'awaiting_approval' && <button onClick={() => updateTask(t._id, 'approved')} className="text-green-600 text-xs hover:underline">Approve</button>}
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No tasks found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showNewRoom && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-4">Create Room</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Room Name *</label>
                <input value={roomForm.name} onChange={e => setRoomForm(p => ({...p,name:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <select value={roomForm.type} onChange={e => setRoomForm(p => ({...p,type:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  {['general','operations','incident','dispatch','warehouse','management'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input value={roomForm.description} onChange={e => setRoomForm(p => ({...p,description:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={createRoom} disabled={!roomForm.name} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm flex-1 disabled:opacity-50">Create</button>
              <button onClick={() => setShowNewRoom(false)} className="border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
