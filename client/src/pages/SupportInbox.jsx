import React, { useState, useEffect, useRef } from 'react';
import {
  Inbox,
  Search,
  Filter,
  Bot,
  User,
  Send,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import api from '../services/api';
import Badge from '../components/Badge';

const SupportInbox = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [counts, setCounts] = useState({ open: 0, escalated: 0, resolved: 0, all: 0 });
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchConversations = async () => {
    try {
      const { data } = await api.get(`/conversations?status=${statusFilter}&search=${search}`);
      if (data.success) {
        setConversations(data.conversations);
        setCounts(data.counts);
        if (!selectedConv && data.conversations.length > 0) {
          selectConversation(data.conversations[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (convId) => {
    try {
      const { data } = await api.get(`/conversations/${convId}`);
      if (data.success) {
        setSelectedConv(data.conversation);
        setMessages(data.messages);

        // Fetch customer orders if customer exists
        if (data.conversation?.customer?.customerId || data.conversation?.customer?.email) {
          const query = data.conversation.customer.customerId || data.conversation.customer.email;
          const custRes = await api.get(`/orders?search=${query}&limit=3`);
          if (custRes.data.success) {
            setCustomerOrders(custRes.data.orders);
          }
        } else {
          setCustomerOrders([]);
        }
      }
    } catch (err) {
      console.error('Failed to load conversation details:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [statusFilter, search]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConv || sending) return;

    setSending(true);
    try {
      const { data } = await api.post(`/conversations/${selectedConv._id}/reply`, {
        content: replyText.trim(),
      });
      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
        setSelectedConv(data.conversation);
        setReplyText('');
        fetchConversations();
      }
    } catch (err) {
      console.error('Failed to reply:', err);
    } finally {
      setSending(false);
    }
  };

  const handleToggleMode = async (newMode) => {
    if (!selectedConv) return;
    try {
      const { data } = await api.put(`/conversations/${selectedConv._id}/mode`, {
        handlingMode: newMode,
      });
      if (data.success) {
        setSelectedConv(data.conversation);
        selectConversation(selectedConv._id);
        fetchConversations();
      }
    } catch (err) {
      console.error('Failed to toggle mode:', err);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedConv) return;
    try {
      const { data } = await api.put(`/conversations/${selectedConv._id}/status`, {
        status: newStatus,
      });
      if (data.success) {
        setSelectedConv(data.conversation);
        fetchConversations();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-3xl border border-slate-200/80 shadow-sm flex overflow-hidden">
      {/* 1. Conversations List Panel */}
      <div className="w-80 border-r border-slate-200 flex flex-col shrink-0">
        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            {['all', 'open', 'escalated', 'resolved'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`flex-1 py-1 rounded-lg font-medium capitalize text-[11px] transition ${
                  statusFilter === f
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {f} ({counts[f] || 0})
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {conversations.map((c) => {
            const isSelected = selectedConv?._id === c._id;
            return (
              <div
                key={c._id}
                onClick={() => selectConversation(c._id)}
                className={`p-4 cursor-pointer transition ${
                  isSelected ? 'bg-indigo-50/60 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-xs text-slate-900 truncate">
                    {c.customer?.name || 'Visitor'}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 truncate mt-1">
                  {c.lastMessage || 'No messages yet'}
                </div>

                <div className="flex items-center gap-2 mt-2">
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

                  <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                    {c.handlingMode === 'ai' ? (
                      <Bot className="w-3 h-3 text-indigo-500" />
                    ) : (
                      <UserCheck className="w-3 h-3 text-emerald-600" />
                    )}
                    {c.handlingMode === 'ai' ? 'AI' : 'Human'}
                  </span>
                </div>
              </div>
            );
          })}

          {conversations.length === 0 && !loading && (
            <div className="p-8 text-center text-xs text-slate-400">
              No conversations found in this filter.
            </div>
          )}
        </div>
      </div>

      {/* 2. Middle Chat Thread Panel */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/40">
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs border border-slate-200">
                  {selectedConv.customer?.name?.[0] || 'V'}
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">{selectedConv.customer?.name}</div>
                  <div className="text-[11px] text-slate-500">{selectedConv.customer?.email || selectedConv.sessionId}</div>
                </div>
              </div>

              {/* Status & Mode Controls */}
              <div className="flex items-center gap-2">
                {selectedConv.handlingMode === 'ai' ? (
                  <button
                    onClick={() => handleToggleMode('human')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition shadow-sm"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Take Over as Human</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleMode('ai')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition shadow-sm"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Return Control to AI</span>
                  </button>
                )}

                <select
                  value={selectedConv.status}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  className="text-xs font-semibold rounded-xl px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 focus:outline-none"
                >
                  <option value="open">Status: Open</option>
                  <option value="escalated">Status: Escalated</option>
                  <option value="resolved">Status: Resolved</option>
                </select>
              </div>
            </div>

            {/* Escalation Alert Banner */}
            {selectedConv.status === 'escalated' && (
              <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Escalated to Human:</strong> {selectedConv.escalationReason || 'Customer requested human support representative.'}
                  </span>
                </div>
                <span className="font-semibold text-amber-700">AI auto-replies paused</span>
              </div>
            )}

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m) => {
                const isCustomer = m.sender === 'customer';
                const isSystem = m.sender === 'system';

                if (isSystem) {
                  return (
                    <div key={m._id} className="text-center my-3">
                      <span className="inline-block text-[11px] bg-slate-200/80 text-slate-600 px-3 py-1 rounded-full font-medium">
                        {m.content}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={m._id} className={`flex gap-3 ${isCustomer ? '' : 'flex-row-reverse'}`}>
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs text-white shrink-0 shadow-sm mt-0.5 ${
                        isCustomer
                          ? 'bg-slate-700'
                          : m.sender === 'agent'
                          ? 'bg-emerald-600'
                          : 'bg-indigo-600'
                      }`}
                    >
                      {isCustomer ? <User className="w-4 h-4" /> : m.sender === 'agent' ? <UserCheck className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div
                      className={`max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                        isCustomer
                          ? 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-sm'
                          : m.sender === 'agent'
                          ? 'bg-emerald-600 text-white rounded-tr-sm'
                          : 'bg-indigo-600 text-white rounded-tr-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-75 font-semibold">
                        <span>{m.senderName || (isCustomer ? 'Customer' : m.sender === 'agent' ? 'Human Agent' : 'AI Assistant')}</span>
                        <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div className="whitespace-pre-wrap">{m.content}</div>

                      {/* Tool Calls Display */}
                      {m.toolCalls && m.toolCalls.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-indigo-400/40 text-[11px] space-y-1.5">
                          <div className="font-semibold flex items-center gap-1 text-indigo-100">
                            <Sparkles className="w-3 h-3" /> Tools Executed by Backend:
                          </div>
                          {m.toolCalls.map((tc, idx) => (
                            <div key={idx} className="bg-indigo-800/60 rounded-lg p-2 font-mono text-[10px] text-indigo-100">
                              <div><strong>Tool:</strong> {tc.toolName}</div>
                              {tc.arguments && <div><strong>Args:</strong> {JSON.stringify(tc.arguments)}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
              <form onSubmit={handleSendReply} className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    selectedConv.handlingMode === 'ai'
                      ? 'Type manual agent reply (will send as Human Agent)...'
                      : 'Type your reply to customer...'
                  }
                  className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || sending}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 disabled:opacity-40 transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 text-xs">
            <Inbox className="w-12 h-12 stroke-1 mb-2 text-slate-300" />
            <span>Select a conversation to view customer messages</span>
          </div>
        )}
      </div>

      {/* 3. Right Customer & Order Info Panel */}
      {selectedConv && (
        <div className="w-72 border-l border-slate-200 bg-white p-5 overflow-y-auto space-y-5 shrink-0">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Customer Profile</h4>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Name:</span>
                <span className="font-semibold text-slate-900">{selectedConv.customer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-semibold text-slate-900 truncate max-w-[140px]">{selectedConv.customer?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer ID:</span>
                <span className="font-mono text-slate-800">{selectedConv.customer?.customerId || 'N/A'}</span>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Recent Orders</span>
              <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
            </h4>

            <div className="mt-3 space-y-2.5">
              {customerOrders.map((ord) => (
                <div key={ord._id} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="font-mono text-indigo-600">{ord.orderId}</span>
                    <Badge variant={ord.orderStatus === 'delivered' ? 'success' : ord.orderStatus === 'cancelled' ? 'danger' : 'warning'}>
                      {ord.orderStatus}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Total: ${ord.orderAmount?.toFixed(2)} • {ord.paymentStatus}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {ord.products?.map((p) => p.name).join(', ')}
                  </div>
                </div>
              ))}
              {customerOrders.length === 0 && (
                <div className="text-[11px] text-slate-400 py-2">No matching orders in database</div>
              )}
            </div>
          </div>

          <hr className="border-slate-100" />

          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Conversation Metadata</h4>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Channel:</span>
                <span className="font-medium capitalize text-slate-800">{selectedConv.channel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Messages:</span>
                <span className="font-medium text-slate-800">{selectedConv.messageCount || messages.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Session ID:</span>
                <span className="font-mono text-[10px] text-slate-600 truncate max-w-[120px]">{selectedConv.sessionId}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportInbox;
