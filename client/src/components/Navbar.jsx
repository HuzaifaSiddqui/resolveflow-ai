import React, { useState } from 'react';
import { Sparkles, MessageCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import ChatWidgetModal from './ChatWidgetModal';

const Navbar = ({ title = 'Dashboard' }) => {
  const { currentWorkspace } = useWorkspace();
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            AI Agent Online
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsChatModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition shadow-sm"
          >
            <MessageCircle className="w-4 h-4 text-indigo-600" />
            <span>Test Customer Widget</span>
          </button>

          <a
            href="/widget-demo"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm"
          >
            <span>Open Standalone Chat</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </header>

      {/* Floating Chat Widget Test Modal */}
      {isChatModalOpen && currentWorkspace && (
        <ChatWidgetModal
          isOpen={isChatModalOpen}
          onClose={() => setIsChatModalOpen(false)}
          workspaceId={currentWorkspace._id}
        />
      )}
    </>
  );
};

export default Navbar;
