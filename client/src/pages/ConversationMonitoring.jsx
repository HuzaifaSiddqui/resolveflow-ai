import React, { useState, useEffect } from 'react';
import {
  Activity,
  Sparkles,
  ShieldAlert,
  AlertOctagon,
  Clock,
  Terminal,
  Database,
  ArrowRight,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';
import api from '../services/api';
import Badge from '../components/Badge';

const ConversationMonitoring = () => {
  const [data, setData] = useState({
    recentToolCalls: [],
    escalatedConversations: [],
    failedActions: [],
    auditLogs: [],
  });
  const [activeTab, setActiveTab] = useState('tools'); // 'tools' | 'escalations' | 'audit' | 'failed'
  const [loading, setLoading] = useState(true);

  const fetchMonitoringData = async () => {
    try {
      const { data: res } = await api.get('/analytics/monitoring');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Conversation & Agent Monitoring</h2>
          <p className="text-xs text-slate-500">
            Real-time inspection of AI tool calls, backend actions, human escalations, and system audit logs.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('tools')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
              activeTab === 'tools' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Tool Calls ({data.recentToolCalls?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('escalations')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
              activeTab === 'escalations' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Escalations ({data.escalatedConversations?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
              activeTab === 'audit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Audit Logs ({data.auditLogs?.length || 0})
          </button>
        </div>
      </div>

      {/* Tab 1: Live Tool Executions */}
      {activeTab === 'tools' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                  <th className="py-3 px-6">Tool Name</th>
                  <th className="py-3 px-6">Input Parameters</th>
                  <th className="py-3 px-6">Execution Result</th>
                  <th className="py-3 px-6">Latency</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {data.recentToolCalls?.map((tc) => (
                  <tr key={tc._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-6 font-mono font-bold text-indigo-600 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{tc.toolName}</span>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-[11px] text-slate-600 max-w-xs truncate">
                      {JSON.stringify(tc.inputParams)}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-[11px] text-slate-600 max-w-sm truncate">
                      {JSON.stringify(tc.result)}
                    </td>
                    <td className="py-3.5 px-6 text-slate-500 font-mono text-[11px]">
                      {tc.executionTimeMs}ms
                    </td>
                    <td className="py-3.5 px-6">
                      <Badge variant={tc.status === 'success' ? 'success' : 'danger'}>
                        {tc.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-6 text-right text-slate-400 text-[11px]">
                      {new Date(tc.executedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Human Escalations */}
      {activeTab === 'escalations' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                  <th className="py-3 px-6">Customer</th>
                  <th className="py-3 px-6">Session ID</th>
                  <th className="py-3 px-6">Escalation Reason</th>
                  <th className="py-3 px-6">Last Message</th>
                  <th className="py-3 px-6 text-right">Escalated At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {data.escalatedConversations?.map((conv) => (
                  <tr key={conv._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      {conv.customer?.name || 'Visitor'}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-[11px] text-slate-500">
                      {conv.sessionId}
                    </td>
                    <td className="py-3.5 px-6 font-medium text-amber-700">
                      {conv.escalationReason || 'Customer requested human agent'}
                    </td>
                    <td className="py-3.5 px-6 max-w-xs truncate text-slate-500">
                      {conv.lastMessage}
                    </td>
                    <td className="py-3.5 px-6 text-right text-slate-400 text-[11px]">
                      {new Date(conv.lastMessageAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: System Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                  <th className="py-3 px-6">Action</th>
                  <th className="py-3 px-6">Entity</th>
                  <th className="py-3 px-6">Details</th>
                  <th className="py-3 px-6 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {data.auditLogs?.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-6 font-medium text-indigo-600">
                      {log.entityType} ({log.entityId})
                    </td>
                    <td className="py-3.5 px-6 font-mono text-[11px] text-slate-600 max-w-sm truncate">
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="py-3.5 px-6 text-right text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationMonitoring;
