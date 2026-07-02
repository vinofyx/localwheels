import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, X, Edit2, Trash2, BookOpen, ThumbsUp, ThumbsDown, Eye, Loader, Tag } from 'lucide-react';
import axios from 'axios';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const API = `${_BASE}/knowledge`;
const CATEGORIES = ['Shipment', 'Payment', 'Driver', 'Vehicle', 'Tracking', 'Account', 'General', 'Policy'];

function authHeaders() {
  const token = localStorage.getItem('lw_token');
  return { Authorization: `Bearer ${token}` };
}

function Badge({ children, color = 'bg-gray-100 text-gray-700' }) {
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{children}</span>;
}

function ArticleModal({ article, onClose, onSaved }) {
  const isEdit = !!article;
  const [form, setForm] = useState({
    title: article?.title || '', content: article?.content || '', summary: article?.summary || '',
    category: article?.category || 'General', tags: (article?.tags || []).join(', '),
    is_internal: article?.is_internal || false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!form.title || !form.content) { setError('Title and content are required.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
      if (isEdit) {
        await axios.put(`${API}/${article._id}`, payload, { headers: authHeaders() });
      } else {
        await axios.post(API, payload, { headers: authHeaders() });
      }
      onSaved();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save article.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-gray-800">{isEdit ? 'Edit Article' : 'New Article'}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="p-4 space-y-3">
          {error && <div className="bg-red-50 text-red-700 text-sm p-2 rounded">{error}</div>}
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Title"
            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Summary (optional)"
            value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
          <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={8} placeholder="Content"
            value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
          <div className="flex gap-3">
            <select className="flex-1 border rounded-lg px-3 py-2 text-sm" value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="Tags (comma separated)"
              value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={form.is_internal} onChange={e => setForm({ ...form, is_internal: e.target.checked })} />
            Agent-only (internal article)
          </label>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border">Cancel</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white disabled:opacity-50">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Article'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ArticleDetail({ articleId, onClose, onEdit, onDeleted, isAdmin }) {
  const [article, setArticle] = useState(null);
  const [voted, setVoted] = useState(false);

  const load = useCallback(async () => {
    const { data } = await axios.get(`${API}/${articleId}`, { headers: authHeaders() });
    setArticle(data);
  }, [articleId]);

  useEffect(() => { load(); }, [load]);

  const vote = async (helpful) => {
    await axios.post(`${API}/${articleId}/helpful`, { helpful }, { headers: authHeaders() });
    setVoted(true);
  };

  const remove = async () => {
    if (!window.confirm('Delete this article?')) return;
    await axios.delete(`${API}/${articleId}`, { headers: authHeaders() });
    onDeleted();
  };

  if (!article) return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <Loader className="animate-spin text-white" />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Badge>{article.category}</Badge>
            {article.is_internal && <Badge color="bg-amber-100 text-amber-700">Agent-only</Badge>}
            <span className="text-xs text-gray-400 flex items-center gap-1"><Eye size={12} /> {article.views}</span>
          </div>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="p-5">
          <h2 className="text-xl font-bold text-gray-800 mb-2">{article.title}</h2>
          {article.summary && <p className="text-gray-500 text-sm mb-4">{article.summary}</p>}
          <div className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{article.content}</div>
          {article.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-4">
              {article.tags.map(t => <Badge key={t}><Tag size={10} className="inline mr-1" />{t}</Badge>)}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between p-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Was this helpful?</span>
            <button disabled={voted} onClick={() => vote(true)} className="p-1.5 rounded hover:bg-green-50 disabled:opacity-40">
              <ThumbsUp size={16} className="text-green-600" />
            </button>
            <button disabled={voted} onClick={() => vote(false)} className="p-1.5 rounded hover:bg-red-50 disabled:opacity-40">
              <ThumbsDown size={16} className="text-red-600" />
            </button>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <button onClick={() => onEdit(article)} className="px-3 py-1.5 text-sm rounded-lg border flex items-center gap-1">
                <Edit2 size={14} /> Edit
              </button>
              <button onClick={remove} className="px-3 py-1.5 text-sm rounded-lg border border-red-200 text-red-600 flex items-center gap-1">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KnowledgeBase() {
  const [articles, setArticles] = useState([]);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [view, setView] = useState('agent'); // agent | admin

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (query) {
        const { data } = await axios.get(`${API}/search`, { params: { q: query, category }, headers: authHeaders() });
        setArticles(data.articles);
        setTotal(data.count);
      } else {
        const { data } = await axios.get(API, { params: { category }, headers: authHeaders() });
        setArticles(data.articles);
        setTotal(data.total);
      }
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [category, query]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2"><BookOpen size={22} /> Knowledge Base</h1>
          <p className="text-sm text-gray-500">{total} article{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['agent', 'admin'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1 rounded-md text-sm capitalize ${view === v ? 'bg-white shadow text-indigo-700 font-medium' : 'text-gray-500'}`}>
                {v} view
              </button>
            ))}
          </div>
          {view === 'admin' && (
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm">
              <Plus size={16} /> New Article
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm" placeholder="Search articles…"
            value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <select className="border rounded-lg px-3 py-2 text-sm" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400"><Loader className="animate-spin mx-auto mb-2" /> Loading articles…</div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
          <p>No articles found{query ? ` for "${query}"` : ''}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map(a => (
            <div key={a._id} onClick={() => setSelectedId(a._id)}
              className="bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Badge>{a.category}</Badge>
                {a.is_internal && <Badge color="bg-amber-100 text-amber-700">Agent-only</Badge>}
              </div>
              <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">{a.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2">{a.summary || a.content?.slice(0, 100)}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Eye size={12} /> {a.views}</span>
                <span className="flex items-center gap-1"><ThumbsUp size={12} /> {a.helpful_count}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedId && (
        <ArticleDetail
          articleId={selectedId}
          isAdmin={view === 'admin'}
          onClose={() => setSelectedId(null)}
          onEdit={(article) => { setSelectedId(null); setEditing(article); }}
          onDeleted={() => { setSelectedId(null); load(); }}
        />
      )}
      {(showCreate || editing) && (
        <ArticleModal
          article={editing}
          onClose={() => { setShowCreate(false); setEditing(null); }}
          onSaved={() => { setShowCreate(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
