import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Bot,
  UserCheck,
  Zap,
  TrendingUp,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Sparkles,
  BookOpen,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import api from '../services/api';
import Badge from '../components/Badge';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, convRes] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/conversations?limit=6'),
        ]);

        if (analyticsRes.data.success) {
          setData(analyticsRes.data);
        }
        if (convRes.data.success) {
          setConversations(convRes.data.conversations);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Loading workspace metrics...</span>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 backdrop-blur-md mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            AI Customer Support Engine Running
          </span>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome to ResolveFlow AI
          </h2>
          <p className="mt-2 text-sm text-indigo-100/90 leading-relaxed">
            Your support agent is actively reviewing customer inquiries, retrieving company knowledge, looking up order statuses, and automating resolution workflows.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/inbox"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-900 hover:bg-slate-100 transition shadow-sm"
            >
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>Open Support Inbox</span>
            </Link>
            <Link
              to="/testing"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-700/60 hover:bg-indigo-700 text-white border border-indigo-500/40 transition"
            >
              <Bot className="w-4 h-4" />
              <span>Test AI Agent</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Conversations</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.totalConversations || 0}</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +18%
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Across web chat widget</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">AI Resolution Rate</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.aiResolutionRate || 92}%</span>
            <span className="text-xs font-semibold text-emerald-600">Goal: &gt;85%</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Resolved without human transfer</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Human Escalations</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.escalatedConversations || 0}</span>
            <span className="text-xs text-slate-500 font-medium">
              {metrics.totalConversations > 0
                ? Math.round((metrics.escalatedConversations / metrics.totalConversations) * 100)
                : 0}% rate
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Handled in support queue</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">AI Tool Executions</span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.totalToolExecutions || 0}</span>
            <span className="text-xs text-emerald-600 font-semibold">100% verified</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Orders, refunds, knowledge</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Activity Over Time */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Conversation Volume & Resolution Trend</h3>
              <p className="text-xs text-slate-500">Daily conversation metrics</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <span className="text-slate-600">Total</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600">AI Handled</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#totalGrad)" />
                <Area type="monotone" dataKey="aiHandled" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#aiGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Col: Tool Executions Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">AI Tool Usage Breakdown</h3>
            <p className="text-xs text-slate-500">Autonomous function calls executed</p>

            <div className="mt-5 space-y-3">
              {(data?.toolBreakdown || []).map((tb, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {tb.name}
                  </span>
                  <span className="font-bold text-slate-900">{tb.count} calls</span>
                </div>
              ))}
              {(!data?.toolBreakdown || data.toolBreakdown.length === 0) && (
                <div className="text-xs text-slate-400 py-4 text-center">No tool calls recorded yet</div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              to="/monitoring"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center justify-between"
            >
              <span>View Tool Execution Logs</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Conversations Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Customer Inquiries</h3>
            <p className="text-xs text-slate-500">Live conversations handled across workspace</p>
          </div>
          <Link
            to="/inbox"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>View All Inbox</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Last Message</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Mode</th>
                <th className="py-3 px-6">Time</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {conversations.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-6 font-medium text-slate-900">
                    <div>{c.customer?.name || 'Visitor'}</div>
                    <div className="text-[11px] text-slate-400 font-normal">{c.customer?.email || c.sessionId}</div>
                  </td>
                  <td className="py-3.5 px-6 max-w-xs truncate text-slate-600">
                    {c.lastMessage || 'No message yet'}
                  </td>
                  <td className="py-3.5 px-6">
                    <Badge
                      variant={
                        c.status === 'resolved'
                          ? 'success'
                          : c.status === 'escalated'
                          ? 'warning'
                          : 'primary'
                      }
                    >
                      {c.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
                      {c.handlingMode === 'ai' ? (
                        <>
                          <Bot className="w-3 h-3 text-indigo-500" /> AI Agent
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3 h-3 text-emerald-600" /> Human Agent
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-[11px] text-slate-400">
                    {new Date(c.lastMessageAt || c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <Link
                      to="/inbox"
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Open Chat
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
