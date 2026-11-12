import React, { useState, useEffect } from 'react';
import {
  Bot,
  Save,
  Sparkles,
  Shield,
  Send,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Key,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';

const AgentConfig = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form Fields
  const [agentName, setAgentName] = useState('');
  const [personality, setPersonality] = useState('');
  const [tone, setTone] = useState('Professional');
  const [systemInstructions, setSystemInstructions] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [businessInfo, setBusinessInfo] = useState('');
  const [knowledgeBaseEnabled, setKnowledgeBaseEnabled] = useState(true);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.5);
  const [enabledTools, setEnabledTools] = useState([]);
  const [modelName, setModelName] = useState('gpt-4o-mini');
  const [openAiApiKey, setOpenAiApiKey] = useState('');

  // Interactive Live Preview Chat
  const [previewMessages, setPreviewMessages] = useState([
    {
      sender: 'ai',
      content: 'Hello! I am your configured AI agent. Type a question below to test how I respond with your updated settings!',
    },
  ]);
  const [previewInput, setPreviewInput] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await api.get('/agent/config');
        if (data.success) {
          const c = data.config;
          setConfig(c);
          setAgentName(c.agentName || 'ResolveBot');
          setPersonality(c.personality || '');
          setTone(c.tone || 'Professional');
          setSystemInstructions(c.systemInstructions || '');
          setWelcomeMessage(c.welcomeMessage || '');
          setBusinessInfo(c.businessInfo || '');
          setKnowledgeBaseEnabled(c.knowledgeBaseEnabled !== false);
          setSimilarityThreshold(c.similarityThreshold || 0.5);
          setEnabledTools(c.enabledTools || []);
          setModelName(c.modelName || 'gpt-4o-mini');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleToolToggle = (toolName) => {
    setEnabledTools((prev) =>
      prev.map((t) => (t.name === toolName ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const { data } = await api.put('/agent/config', {
        agentName,
        personality,
        tone,
        systemInstructions,
        welcomeMessage,
        businessInfo,
        knowledgeBaseEnabled,
        similarityThreshold: Number(similarityThreshold),
        enabledTools,
        modelName,
        openAiApiKey: openAiApiKey.trim() || undefined,
      });

      if (data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewSubmit = async (e) => {
    e.preventDefault();
    if (!previewInput.trim() || previewLoading) return;

    const userText = previewInput.trim();
    setPreviewMessages((prev) => [...prev, { sender: 'customer', content: userText }]);
    setPreviewInput('');
    setPreviewLoading(true);

    try {
      const { data } = await api.post('/agent/test-preview', {
        message: userText,
      });

      if (data.success && data.result) {
        setPreviewMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            content: data.result.reply,
            toolCalls: data.result.toolCalls,
          },
        ]);
      }
    } catch (err) {
      setPreviewMessages((prev) => [
        ...prev,
        { sender: 'ai', content: 'Error testing response. Please ensure configuration is saved.' },
      ]);
    } finally {
      setPreviewLoading(false);
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI Agent Configuration</h2>
          <p className="text-xs text-slate-500">
            Customize agent personality, instructions, RAG access, and backend execution tools.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Changes...' : 'Save Agent Settings'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Agent configuration updated and applied successfully!</span>
        </div>
      )}

      {/* Main Grid: Settings on Left, Interactive Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-600" />
              <span>Identity & Communication Tone</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Agent Name</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Tone of Voice</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none"
                >
                  <option value="Professional">Professional</option>
                  <option value="Friendly">Friendly</option>
                  <option value="Empathetic">Empathetic</option>
                  <option value="Concise">Concise & Direct</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Personality Summary</label>
              <input
                type="text"
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                placeholder="e.g. Helpful, polite, strictly factual customer advocate"
                className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Welcome Message</label>
              <input
                type="text"
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* System Instructions */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>System Prompt & Guardrails</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700">System Instructions</label>
              <textarea
                rows={5}
                value={systemInstructions}
                onChange={(e) => setSystemInstructions(e.target.value)}
                className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-[11px] leading-relaxed"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Defines the agent's core instructions and boundaries.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Business Knowledge Overview</label>
              <textarea
                rows={2}
                value={businessInfo}
                onChange={(e) => setBusinessInfo(e.target.value)}
                className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs"
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Tools & RAG Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Authorized Agent Backend Tools</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {enabledTools.map((t) => (
                <label
                  key={t.name}
                  className={`flex items-start gap-2.5 p-3 rounded-2xl border transition cursor-pointer ${
                    t.enabled
                      ? 'bg-indigo-50/50 border-indigo-200'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={t.enabled !== false}
                    onChange={() => handleToolToggle(t.name)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="font-mono text-xs font-bold text-slate-900">{t.name}</div>
                    <div className="text-[11px] text-slate-500 leading-snug mt-0.5">{t.description}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-800">Knowledge Base RAG Access</div>
                <div className="text-[11px] text-slate-500">Inject vector similarity matches into agent prompt</div>
              </div>
              <input
                type="checkbox"
                checked={knowledgeBaseEnabled}
                onChange={(e) => setKnowledgeBaseEnabled(e.target.checked)}
                className="h-4 w-4 text-indigo-600 rounded"
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* AI Provider Config */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-600" />
              <span>AI Engine & API Credentials</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Model</label>
                <select
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none"
                >
                  <option value="gpt-4o-mini">OpenAI GPT-4o-mini (Recommended)</option>
                  <option value="gpt-4o">OpenAI GPT-4o</option>
                  <option value="gpt-3.5-turbo">OpenAI GPT-3.5 Turbo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  OpenAI API Key {config?.hasApiKey && <span className="text-emerald-600 font-normal">(Configured)</span>}
                </label>
                <input
                  type="password"
                  value={openAiApiKey}
                  onChange={(e) => setOpenAiApiKey(e.target.value)}
                  placeholder={config?.maskedApiKey || 'sk-... (leave blank to keep current)'}
                  className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Chat (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-[750px] bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-400" />
              <div>
                <div className="text-xs font-bold">{agentName || 'ResolveBot'} Live Preview</div>
                <div className="text-[10px] text-slate-400">Testing prompt & tool execution live</div>
              </div>
            </div>
            <button
              onClick={() => setPreviewMessages([previewMessages[0]])}
              className="p-1 rounded text-slate-400 hover:text-white"
              title="Reset Chat"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {previewMessages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.sender === 'customer' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                    m.sender === 'customer' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-300 border border-slate-700'
                  }`}
                >
                  {m.sender === 'customer' ? 'You' : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    m.sender === 'customer'
                      ? 'bg-indigo-600 text-white rounded-tr-sm'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700 rounded-tl-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>

                  {m.toolCalls && m.toolCalls.length > 0 && (
                    <div className="mt-2 pt-1.5 border-t border-slate-700 text-[10px] text-indigo-300 font-mono">
                      Tools Called: {m.toolCalls.map((tc) => tc.toolName).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {previewLoading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-slate-800 text-indigo-300 border border-slate-700 flex items-center justify-center text-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-800 rounded-2xl px-3 py-2 text-xs text-slate-400 animate-pulse">
                  Evaluating response...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 bg-slate-800 border-t border-slate-700">
            <form onSubmit={handlePreviewSubmit} className="flex gap-2">
              <input
                type="text"
                value={previewInput}
                onChange={(e) => setPreviewInput(e.target.value)}
                placeholder="Ask your agent anything..."
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!previewInput.trim() || previewLoading}
                className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentConfig;
