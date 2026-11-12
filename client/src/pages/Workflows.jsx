import React, { useState, useEffect } from 'react';
import {
  Zap,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  ToggleLeft,
  ToggleRight,
  Trash2,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  FileText,
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import Badge from '../components/Badge';

const Workflows = () => {
  const [workflows, setWorkflows] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [activeTab, setActiveTab] = useState('rules'); // 'rules' | 'history'
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Workflow Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState('order_inquiry');
  const [conditionField, setConditionField] = useState('message');
  const [conditionOperator, setConditionOperator] = useState('contains');
  const [conditionValue, setConditionValue] = useState('');
  const [actionType, setActionType] = useState('lookup_order');
  const [actionMessage, setActionMessage] = useState('');

  const fetchWorkflowsData = async () => {
    try {
      const [wfRes, execRes] = await Promise.all([
        api.get('/workflows'),
        api.get('/workflows/executions?limit=25'),
      ]);

      if (wfRes.data.success) {
        setWorkflows(wfRes.data.workflows);
      }
      if (execRes.data.success) {
        setExecutions(execRes.data.executions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflowsData();
  }, []);

  const handleToggle = async (wf) => {
    try {
      const { data } = await api.put(`/workflows/${wf._id}`, {
        isActive: !wf.isActive,
      });
      if (data.success) {
        setWorkflows((prev) =>
          prev.map((w) => (w._id === wf._id ? data.workflow : w))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) return;
    try {
      await api.delete(`/workflows/${id}`);
      fetchWorkflowsData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/workflows', {
        name,
        description,
        trigger,
        conditions: [{ field: conditionField, operator: conditionOperator, value: conditionValue }],
        actions: [{ actionType, payload: { message: actionMessage } }],
        isActive: true,
      });

      if (data.success) {
        setIsModalOpen(false);
        setName('');
        setDescription('');
        setConditionValue('');
        setActionMessage('');
        fetchWorkflowsData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create workflow');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Workflow Automation</h2>
          <p className="text-xs text-slate-500">
            Configure declarative triggers, eligibility rules, and automated escalation safeguards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-xl flex text-xs">
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'rules' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Active Rules ({workflows.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Execution History ({executions.length})
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Rule</span>
          </button>
        </div>
      </div>

      {activeTab === 'rules' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflows.map((wf) => (
            <div
              key={wf._id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-slate-900">{wf.name}</span>
                  </div>

                  <button
                    onClick={() => handleToggle(wf)}
                    className="text-slate-400 hover:text-slate-600 transition"
                  >
                    {wf.isActive ? (
                      <ToggleRight className="w-6 h-6 text-indigo-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-300" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {wf.description || 'Executes automated rule logic when customer message matches trigger condition.'}
                </p>

                <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="font-bold text-indigo-600 text-[11px] uppercase">Trigger:</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                      {wf.trigger}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="font-bold text-slate-500 text-[11px] uppercase">Condition:</span>
                    <span className="text-slate-600">
                      Message {wf.conditions?.[0]?.operator || 'contains'} "{wf.conditions?.[0]?.value || '*'}"
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="font-bold text-emerald-600 text-[11px] uppercase">Action:</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px] text-emerald-700">
                      {wf.actions?.[0]?.actionType}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Executed {wf.executionCount || 0} times
                </span>
                <button
                  onClick={() => handleDelete(wf._id)}
                  className="text-rose-500 hover:text-rose-700 p-1"
                  title="Delete Rule"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Execution History Table */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                  <th className="py-3 px-6">Workflow Rule</th>
                  <th className="py-3 px-6">Trigger</th>
                  <th className="py-3 px-6">Customer Input</th>
                  <th className="py-3 px-6">Action Executed</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {executions.map((ex) => (
                  <tr key={ex._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-6 font-semibold text-slate-900">{ex.workflowName}</td>
                    <td className="py-3 px-6 font-mono text-[11px] text-indigo-600">{ex.trigger}</td>
                    <td className="py-3 px-6 max-w-xs truncate text-slate-500">
                      {ex.input?.messageText || 'Inquiry trigger'}
                    </td>
                    <td className="py-3 px-6 font-mono text-[11px] text-slate-700">
                      {ex.output?.actionResults?.[0]?.action || 'Executed'}
                    </td>
                    <td className="py-3 px-6">
                      <Badge variant="success">SUCCESS</Badge>
                    </td>
                    <td className="py-3 px-6 text-right text-slate-400 text-[11px]">
                      {new Date(ex.executedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Workflow Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Automation Workflow Rule">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Workflow Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. VIP Urgent Escalation"
              className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of what this automation enforces"
              className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Trigger Event</label>
            <select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200"
            >
              <option value="order_inquiry">Order Inquiry (package, tracking, status)</option>
              <option value="refund_request">Refund Request (money back, refund)</option>
              <option value="human_escalation">Human Escalation (speak to agent/human)</option>
              <option value="negative_sentiment">Negative Sentiment (dissatisfied/angry)</option>
              <option value="custom_keyword">Custom Keyword Match</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Condition Operator</label>
              <select
                value={conditionOperator}
                onChange={(e) => setConditionOperator(e.target.value)}
                className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200"
              >
                <option value="contains">Contains Keyword</option>
                <option value="starts_with">Starts With</option>
                <option value="equals">Exact Match</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Keyword Value</label>
              <input
                type="text"
                value={conditionValue}
                onChange={(e) => setConditionValue(e.target.value)}
                placeholder="e.g. tracking, refund, speak"
                className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Enforced Action</label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200"
            >
              <option value="lookup_order">Look Up Order Details & Status</option>
              <option value="check_refund_eligibility">Check Refund Eligibility & Require Confirmation</option>
              <option value="escalate_conversation">Escalate Immediately to Human Representative</option>
              <option value="flag_sentiment">Flag for Supervisor Review</option>
              <option value="send_auto_message">Send Auto-Response Notice</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Save Workflow Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Workflows;
