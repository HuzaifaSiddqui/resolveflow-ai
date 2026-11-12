import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Bot,
  User,
  Send,
  X,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Shield,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import axios from 'axios';
import { useWorkspace } from '../context/WorkspaceContext';

const WidgetDemo = () => {
  const { currentWorkspace } = useWorkspace();
  const [workspaceId, setWorkspaceId] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [sessionId] = useState(() => {
    let s = localStorage.getItem('rf_public_widget_session');
    if (!s) {
      s = 'guest_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('rf_public_widget_session', s);
    }
    return s;
  });

  const [widgetConfig, setWidgetConfig] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // If logged in, use current workspace; otherwise fallback to first available or demo
    if (currentWorkspace?._id) {
      setWorkspaceId(currentWorkspace._id);
    } else {
      // Find workspace by public call or default
      axios.get('/api/workspaces').then((res) => {
        if (res.data?.workspaces?.[0]) {
          setWorkspaceId(res.data.workspaces[0]._id);
        }
      }).catch(() => {
        const stored = localStorage.getItem('rf_active_workspace');
        if (stored) setWorkspaceId(stored);
      });
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (!workspaceId) return;

    axios.get(`/api/widget/config/${workspaceId}`).then((res) => {
      if (res.data.success) {
        setWidgetConfig(res.data.widget);
      }
    }).catch(console.error);

    axios.get(`/api/widget/history/${workspaceId}/${sessionId}`).then((res) => {
      if (res.data.success) {
        if (res.data.messages && res.data.messages.length > 0) {
          setMessages(res.data.messages);
        }
        if (res.data.conversation?.status === 'escalated') {
          setIsEscalated(true);
        }
      }
    }).catch(console.error);
  }, [workspaceId, sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSend = async (customText = null) => {
    const textToSend = customText || input;
    if (!textToSend || !textToSend.trim() || sending || !workspaceId) return;

    const userMsg = {
      _id: 'temp_' + Date.now(),
      sender: 'customer',
      senderName: 'Customer',
      content: textToSend.trim(),
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput('');
    setSending(true);

    try {
      const { data } = await axios.post(`/api/widget/message/${workspaceId}`, {
        sessionId,
        message: textToSend.trim(),
        customer: {
          name: 'Sarah Jenkins',
          email: 'sarah.j@example.com',
          customerId: 'CUST-1001',
        },
      });

      if (data.success) {
        if (data.aiReply) {
          setMessages((prev) => [
            ...prev,
            {
              _id: 'ai_' + Date.now(),
              sender: 'ai',
              senderName: widgetConfig?.agentName || 'ResolveBot',
              content: data.aiReply.content,
              toolCalls: data.aiReply.toolCalls || [],
              createdAt: new Date(),
            },
          ]);
        } else if (data.notice) {
          setMessages((prev) => [
            ...prev,
            {
              _id: 'sys_' + Date.now(),
              sender: 'system',
              content: data.notice,
              createdAt: new Date(),
            },
          ]);
        }

        if (data.conversation?.status === 'escalated' || data.status === 'escalated') {
          setIsEscalated(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const samplePrompts = [
    'What is your return policy?',
    'Check order ORD-1001 status',
    'Cancel my order ORD-1001',
    'Connect me to a human representative',
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 relative font-sans">
      {/* Mock Storefront Background */}
      <nav className="h-16 border-b border-slate-800 px-8 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center gap-2 font-bold text-base text-white">
          <ShoppingBag className="w-5 h-5 text-indigo-400" />
          <span>NovaCommerce Storefront Preview</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>Catalog</span>
          <span>Deals</span>
          <span>Support</span>
          <a
            href="/dashboard"
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
          >
            Back to SaaS Admin
          </a>
        </div>
      </nav>

      {/* Hero Mock Section */}
      <div className="max-w-4xl mx-auto py-16 px-6 text-center space-y-4">
        <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          Customer Web Chat Experience
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Live Customer Chat Widget
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          This page represents an external customer visiting your e-commerce store. Interact with the chat widget at the bottom-right to test end-to-end AI inquiries, order lookups, and human escalations.
        </p>

        {/* Floating Quick Action cards */}
        <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-left">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIsOpen(true);
                handleSend(p);
              }}
              className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500 text-xs text-slate-200 transition hover:bg-slate-800"
            >
              <div className="text-[10px] uppercase font-bold text-indigo-400 mb-1">Click to Ask:</div>
              <div className="font-medium text-white italic">"{p}"</div>
            </button>
          ))}
        </div>
      </div>

      {/* Floating Chat Widget Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl flex items-center justify-center transition-transform hover:scale-105 z-50 shadow-indigo-600/40"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[560px] bg-white text-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 z-50 animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="bg-indigo-600 text-white p-4 flex items-center justify-between shrink-0 shadow">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs flex items-center gap-1.5">
                  {widgetConfig?.agentName || 'ResolveBot'}
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-[10px] text-indigo-100">{widgetConfig?.workspaceName || 'NovaCommerce'}</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Escalation notice */}
          {isEscalated && (
            <div className="bg-amber-50 border-b border-amber-200 px-3.5 py-2 text-[11px] text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Transferred to a human agent. A representative will reply here.</span>
            </div>
          )}

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60 text-xs">
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="max-w-[85%] bg-white p-3 rounded-2xl rounded-tl-sm border border-slate-200 text-slate-800 shadow-sm leading-relaxed">
                {widgetConfig?.welcomeMessage || 'Hello! How can I assist you today?'}
              </div>
            </div>

            {messages.map((m) => {
              const isUser = m.sender === 'customer';
              const isSystem = m.sender === 'system';

              if (isSystem) {
                return (
                  <div key={m._id} className="text-center my-2">
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full font-medium">
                      {m.content}
                    </span>
                  </div>
                );
              }

              return (
                <div key={m._id} className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] shrink-0 mt-0.5 ${
                      isUser ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`max-w-[85%] p-3 rounded-2xl shadow-sm leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>

                    {m.toolCalls && m.toolCalls.length > 0 && (
                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex flex-wrap gap-1">
                        {m.toolCalls.map((tc, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200"
                          >
                            Verified: {tc.toolName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px] shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white rounded-2xl px-3 py-2 border border-slate-200 text-slate-400 text-xs">
                  AI is thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-1.5 bg-slate-100 border-t border-slate-200 overflow-x-auto whitespace-nowrap flex gap-1">
            {samplePrompts.slice(0, 3).map((sp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(sp)}
                className="text-[10px] font-medium bg-white hover:bg-indigo-50 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 shrink-0"
              >
                {sp}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything..."
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-100 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WidgetDemo;
