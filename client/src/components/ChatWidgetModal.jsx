import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, CornerDownLeft, Sparkles, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const ChatWidgetModal = ({ isOpen, onClose, workspaceId }) => {
  const [sessionId] = useState(() => {
    let sid = localStorage.getItem('rf_visitor_session');
    if (!sid) {
      sid = 'session_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('rf_visitor_session', sid);
    }
    return sid;
  });

  const [config, setConfig] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!workspaceId) return;

    // Load widget config
    axios.get(`/api/widget/config/${workspaceId}`).then((res) => {
      if (res.data.success) {
        setConfig(res.data.widget);
      }
    }).catch(console.error);

    // Load conversation history
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
    scrollToBottom();
  }, [messages, sending]);

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || input;
    if (!textToSend || !textToSend.trim() || sending) return;

    const userMsg = {
      _id: 'temp_' + Date.now(),
      sender: 'customer',
      senderName: 'You',
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
          const aiMsg = {
            _id: 'ai_' + Date.now(),
            sender: 'ai',
            senderName: config?.agentName || 'ResolveBot',
            content: data.aiReply.content,
            toolCalls: data.aiReply.toolCalls || [],
            sources: data.aiReply.sources || [],
            createdAt: new Date(),
          };
          setMessages((prev) => [...prev, aiMsg]);
        } else if (data.notice) {
          setMessages((prev) => [
            ...prev,
            {
              _id: 'sys_' + Date.now(),
              sender: 'system',
              senderName: 'Support Desk',
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
      console.error('Failed to send message:', err);
      setMessages((prev) => [
        ...prev,
        {
          _id: 'err_' + Date.now(),
          sender: 'system',
          senderName: 'System',
          content: 'Unable to deliver message. Please try again.',
          createdAt: new Date(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const quickPrompts = [
    'Check order ORD-1001 status',
    'What is your return policy?',
    'Cancel my order ORD-1001',
    'Connect me to a human agent',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md h-[600px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/25">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                {config?.agentName || 'ResolveBot'}
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-[11px] text-indigo-100">
                {config?.workspaceName || 'NovaCommerce Support'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Bar */}
        {isEscalated && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Transferred to a human representative. Our team is active.</span>
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60">
          {/* Welcome greeting */}
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs shrink-0 shadow-sm mt-0.5">
              <Bot className="w-4 h-4" />
            </div>
            <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white p-3.5 text-xs text-slate-800 shadow-sm border border-slate-200/80 leading-relaxed">
              {config?.welcomeMessage || 'Hi there! I am your AI support assistant. Ask me anything about your orders, products, shipping, or returns!'}
            </div>
          </div>

          {messages.map((m) => {
            const isUser = m.sender === 'customer';
            const isSystem = m.sender === 'system';

            if (isSystem) {
              return (
                <div key={m._id} className="text-center my-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] bg-slate-200 text-slate-700 px-3 py-1 rounded-full font-medium">
                    <Shield className="w-3 h-3 text-indigo-500" />
                    {m.content}
                  </span>
                </div>
              );
            }

            return (
              <div key={m._id} className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 shadow-sm mt-0.5 ${
                    isUser
                      ? 'bg-slate-900 text-white'
                      : m.sender === 'agent'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[82%] rounded-2xl text-xs p-3.5 shadow-sm leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-sm'
                      : m.sender === 'agent'
                      ? 'bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-tl-sm'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-sm'
                  }`}
                >
                  {m.sender === 'agent' && (
                    <div className="text-[10px] font-bold text-emerald-700 mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Human Support Representative ({m.senderName})
                    </div>
                  )}

                  <div className="whitespace-pre-wrap">{m.content}</div>

                  {/* Tool execution badges if present */}
                  {m.toolCalls && m.toolCalls.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {m.toolCalls.map((tc, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"
                        >
                          <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                          Tool: {tc.toolName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {sending && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs shrink-0 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-slate-200/80 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="px-3 py-2 bg-slate-100/70 border-t border-slate-200/60 overflow-x-auto whitespace-nowrap flex gap-1.5">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] font-medium bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 px-2.5 py-1 rounded-full border border-slate-200 transition shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Footer */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-100 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatWidgetModal;
