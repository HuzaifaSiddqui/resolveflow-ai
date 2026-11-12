import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

const WorkspaceSetup = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { createWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createWorkspace(name.trim());
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mb-6">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Set up a new workspace</h2>
        <p className="mt-2 text-xs text-slate-400">
          Each workspace has its own customer database, knowledge documents, orders, workflows, and AI support agent.
        </p>

        <form onSubmit={handleCreate} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300">Workspace / Business Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Commerce"
              className="mt-1 w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Isolated RAG knowledge base
            </div>
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Independent customer and order directory
            </div>
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Dedicated embeddable chat widget key
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim() || loading}
            className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition shadow-lg shadow-indigo-600/25"
          >
            <span>{loading ? 'Creating...' : 'Create Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default WorkspaceSetup;
