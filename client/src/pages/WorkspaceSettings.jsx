import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Copy,
  Check,
  Code2,
  Save,
  Globe,
  Mail,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import api from '../services/api';

const WorkspaceSettings = () => {
  const { currentWorkspace, refreshWorkspaces } = useWorkspace();
  const [name, setName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [timezone, setTimezone] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (currentWorkspace) {
      setName(currentWorkspace.name || '');
      setSupportEmail(currentWorkspace.settings?.supportEmail || '');
      setBusinessHours(currentWorkspace.settings?.businessHours || '');
      setTimezone(currentWorkspace.settings?.timezone || '');
      setWebsiteUrl(currentWorkspace.settings?.websiteUrl || '');
    }
  }, [currentWorkspace]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const { data } = await api.put('/workspaces/current', {
        name,
        settings: {
          supportEmail,
          businessHours,
          timezone,
          websiteUrl,
        },
      });

      if (data.success) {
        setSaveSuccess(true);
        refreshWorkspaces();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const widgetSnippet = `<!-- ResolveFlow AI Web Chat Widget -->
<script
  src="${window.location.origin}/widget.js"
  data-workspace-id="${currentWorkspace?._id || 'YOUR_WORKSPACE_ID'}"
  data-api-key="${currentWorkspace?.apiKey || 'YOUR_API_KEY'}"
  async>
</script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(widgetSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Workspace Settings</h2>
        <p className="text-xs text-slate-500">
          Manage company contact information, business hours, and embeddable customer chat widget.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          Workspace settings successfully saved!
        </div>
      )}

      {/* Embed Code Snippet Card */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm">Embeddable Web Chat Widget Snippet</h3>
          </div>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Snippet' : 'Copy HTML'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Paste this snippet right before the closing <code className="text-indigo-300">&lt;/body&gt;</code> tag of your website, Shopify storefront, or React app.
        </p>

        <pre className="p-4 rounded-2xl bg-slate-950 font-mono text-[11px] text-indigo-200 overflow-x-auto border border-slate-800/80 leading-relaxed">
          {widgetSnippet}
        </pre>

        <div className="pt-1 flex items-center justify-between text-xs text-slate-400">
          <span>Public Key: <code className="text-indigo-400">{currentWorkspace?.apiKey}</code></span>
          <a
            href="/widget-demo"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            <span>Preview in Browser</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Business Profile Form */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
        <form onSubmit={handleSave} className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Company Information</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Business / Workspace Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Business Hours</label>
              <input
                type="text"
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                placeholder="e.g. 9:00 AM - 6:00 PM EST, Mon-Fri"
                className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g. America/New_York"
                className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">Website URL</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yourstore.com"
                className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkspaceSettings;
