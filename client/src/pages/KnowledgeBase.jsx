import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  UploadCloud,
  FileText,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Database,
  Layers,
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import Badge from '../components/Badge';

const KnowledgeBase = () => {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({ totalDocs: 0, totalChunks: 0, indexedDocs: 0 });
  const [loading, setLoading] = useState(true);

  // Upload modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('General');
  const [uploading, setUploading] = useState(false);

  // Manual FAQ / Article form states
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [manualCategory, setManualCategory] = useState('General');
  const [manualType, setManualType] = useState('manual');
  const [submittingManual, setSubmittingManual] = useState(false);

  // Semantic retrieval test states
  const [testQuery, setTestQuery] = useState('');
  const [testResults, setTestResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const fetchKnowledgeData = async () => {
    try {
      const [docsRes, statsRes] = await Promise.all([
        api.get('/knowledge/documents'),
        api.get('/knowledge/stats'),
      ]);

      if (docsRes.data.success) {
        setDocuments(docsRes.data.documents);
      }
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
    } catch (err) {
      console.error('Failed to load knowledge base:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledgeData();
  }, []);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('category', uploadCategory);

    try {
      const { data } = await api.post('/knowledge/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.success) {
        setIsUploadModalOpen(false);
        setUploadFile(null);
        fetchKnowledgeData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualTitle || !manualContent) return;

    setSubmittingManual(true);
    try {
      const { data } = await api.post('/knowledge/manual', {
        title: manualTitle,
        content: manualContent,
        category: manualCategory,
        type: manualType,
      });

      if (data.success) {
        setIsManualModalOpen(false);
        setManualTitle('');
        setManualContent('');
        fetchKnowledgeData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save manual article');
    } finally {
      setSubmittingManual(false);
    }
  };

  const handleDeleteDoc = async (id) => {
    if (!confirm('Are you sure you want to delete this document and its vector chunks?')) return;
    try {
      await api.delete(`/knowledge/documents/${id}`);
      fetchKnowledgeData();
    } catch (err) {
      console.error('Failed to delete doc:', err);
    }
  };

  const handleSemanticSearch = async (e) => {
    e.preventDefault();
    if (!testQuery.trim()) return;

    setSearching(true);
    try {
      const { data } = await api.post('/knowledge/search', {
        query: testQuery.trim(),
        limit: 4,
      });
      if (data.success) {
        setTestResults(data.results);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">RAG Knowledge Base</h2>
          <p className="text-xs text-slate-500">
            Upload policies, FAQs, and manuals. The AI chunks and generates vector embeddings to ground support replies.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add FAQ / Article</span>
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Indexed Documents</div>
            <div className="text-xl font-bold text-slate-900">{stats.totalDocs}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Vector Knowledge Chunks</div>
            <div className="text-xl font-bold text-slate-900">{stats.totalChunks}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Embedding Engine</div>
            <div className="text-sm font-bold text-slate-900">Cosine Similarity Search</div>
          </div>
        </div>
      </div>

      {/* Semantic Test Search Box */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-md">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Semantic Vector Retrieval Simulator</span>
          </div>
          <h3 className="text-base font-bold">Test Knowledge Base Retrieval</h3>
          <p className="text-xs text-slate-300 mt-1">
            Simulate a customer question to see exactly which chunked articles your AI agent will retrieve and their cosine similarity score.
          </p>

          <form onSubmit={handleSemanticSearch} className="mt-4 flex gap-2">
            <input
              type="text"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              placeholder="e.g. How many days do I have to return an item?"
              className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={searching || !testQuery.trim()}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-500 hover:bg-indigo-400 text-white transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{searching ? 'Querying...' : 'Search'}</span>
            </button>
          </form>
        </div>

        {/* Results */}
        {testResults && (
          <div className="mt-5 pt-4 border-t border-slate-800/80">
            <div className="text-xs font-semibold text-indigo-200 mb-3">
              Retrieved {testResults.length} relevant chunks for: "{testQuery}"
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {testResults.map((r, idx) => (
                <div key={idx} className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-indigo-300 truncate">{r.documentTitle}</span>
                    <span className="font-mono text-[11px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                      Score: {(r.score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {r.content}
                  </p>
                </div>
              ))}
              {testResults.length === 0 && (
                <div className="text-xs text-slate-400 py-2">
                  No chunks matched above the similarity threshold.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Knowledge Documents & FAQs</h3>
            <p className="text-xs text-slate-500">Current documents active in the AI's retrieval corpus</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                <th className="py-3 px-6">Document Title</th>
                <th className="py-3 px-6">Category</th>
                <th className="py-3 px-6">Type</th>
                <th className="py-3 px-6">Chunks</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Date Indexed</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {documents.map((doc) => (
                <tr key={doc._id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-6 font-semibold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>{doc.title}</span>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                      {doc.category || 'General'}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 uppercase font-mono text-[10px] text-slate-500">
                    {doc.type}
                  </td>
                  <td className="py-3.5 px-6 font-medium text-slate-900">
                    {doc.chunkCount || 0} chunks
                  </td>
                  <td className="py-3.5 px-6">
                    <Badge variant={doc.status === 'indexed' ? 'success' : doc.status === 'failed' ? 'danger' : 'warning'}>
                      {doc.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-6 text-slate-400 text-[11px]">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <button
                      onClick={() => handleDeleteDoc(doc._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Document Modal */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload Knowledge Document">
        <form onSubmit={handleFileUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">File (PDF or TXT)</label>
            <div className="mt-1.5 border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-indigo-500 transition cursor-pointer">
              <input
                type="file"
                accept=".pdf,.txt"
                required
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                <div className="text-xs font-semibold text-slate-700">
                  {uploadFile ? uploadFile.name : 'Click to select a file'}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">PDF or TXT up to 10MB</div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Category</label>
            <input
              type="text"
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              placeholder="e.g. Returns, Shipping, Technical Specs"
              className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!uploadFile || uploading}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
            >
              {uploading ? 'Processing & Indexing...' : 'Upload & Index'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manual Article / FAQ Modal */}
      <Modal isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} title="Add Knowledge Article / FAQ">
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Type</label>
            <select
              value={manualType}
              onChange={(e) => setManualType(e.target.value)}
              className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none"
            >
              <option value="manual">Policy Article</option>
              <option value="faq">FAQ Pair</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Title</label>
            <input
              type="text"
              required
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="e.g. Return Window & Exclusions"
              className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Category</label>
            <input
              type="text"
              value={manualCategory}
              onChange={(e) => setManualCategory(e.target.value)}
              placeholder="e.g. Returns"
              className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Article Content / FAQ Details</label>
            <textarea
              required
              rows={6}
              value={manualContent}
              onChange={(e) => setManualContent(e.target.value)}
              placeholder="Provide exact policy wording, terms, or Q&A instructions..."
              className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingManual || !manualTitle || !manualContent}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
            >
              {submittingManual ? 'Indexing Chunks...' : 'Save & Index'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default KnowledgeBase;
