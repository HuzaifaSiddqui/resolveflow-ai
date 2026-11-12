import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Play,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  BookOpen,
  Zap,
  ArrowRight,
  Filter,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import Badge from '../components/Badge';

const TestingPlayground = () => {
  const [testCases, setTestCases] = useState([]);
  const [stats, setStats] = useState({ total: 0, passed: 0, failed: 0, pending: 0 });
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [runningId, setRunningId] = useState(null);
  const [runningAll, setRunningAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Test Case Form
  const [testName, setTestName] = useState('');
  const [category, setCategory] = useState('Knowledge Q&A');
  const [customerQuestion, setCustomerQuestion] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [expectedTool, setExpectedTool] = useState('none');

  const fetchTestCases = async () => {
    try {
      const { data } = await api.get(`/test-cases?category=${categoryFilter}`);
      if (data.success) {
        setTestCases(data.testCases);
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestCases();
  }, [categoryFilter]);

  const runSingleTest = async (id) => {
    setRunningId(id);
    try {
      const { data } = await api.post(`/test-cases/${id}/run`);
      if (data.success) {
        setTestCases((prev) =>
          prev.map((t) => (t._id === id ? data.testCase : t))
        );
        fetchTestCases();
      }
    } catch (err) {
      console.error('Run test error:', err);
    } finally {
      setRunningId(null);
    }
  };

  const runAllTests = async () => {
    setRunningAll(true);
    try {
      const { data } = await api.post('/test-cases/run-all');
      if (data.success) {
        fetchTestCases();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRunningAll(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/test-cases', {
        testName,
        category,
        customerQuestion,
        expectedBehavior,
        expectedTool,
      });
      if (data.success) {
        setIsModalOpen(false);
        setTestName('');
        setCustomerQuestion('');
        setExpectedBehavior('');
        fetchTestCases();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create test case');
    }
  };

  const handleToggleStatus = async (tc, newStatus) => {
    try {
      const { data } = await api.put(`/test-cases/${tc._id}`, { status: newStatus });
      if (data.success) {
        setTestCases((prev) =>
          prev.map((t) => (t._id === tc._id ? data.testCase : t))
        );
        fetchTestCases();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this test case?')) return;
    try {
      await api.delete(`/test-cases/${id}`);
      fetchTestCases();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI Agent Testing & Evaluation</h2>
          <p className="text-xs text-slate-500">
            Benchmark and monitor agent performance with structured test cases and tool validation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={runAllTests}
            disabled={runningAll}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition shadow-sm disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{runningAll ? 'Running Benchmark...' : 'Run All Tests'}</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Test Case</span>
          </button>
        </div>
      </div>

      {/* Scorecards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Total Test Cases</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Passed</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5" />
            <span>{stats.passed}</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Failed</span>
          <div className="text-2xl font-bold text-rose-600 mt-1 flex items-center gap-1.5">
            <XCircle className="w-5 h-5" />
            <span>{stats.failed}</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Pass Rate</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            {stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 100}%
          </div>
        </div>
      </div>

      {/* Test Cases List */}
      <div className="space-y-4">
        {testCases.map((tc) => {
          const isRunning = runningId === tc._id;

          return (
            <div
              key={tc._id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      tc.status === 'passed'
                        ? 'bg-emerald-500'
                        : tc.status === 'failed'
                        ? 'bg-rose-500'
                        : 'bg-amber-400'
                    }`}
                  />
                  <h3 className="font-bold text-xs text-slate-900">{tc.testName}</h3>
                  <Badge variant="default">{tc.category}</Badge>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Toggle Buttons */}
                  <button
                    onClick={() => handleToggleStatus(tc, 'passed')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
                      tc.status === 'passed'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Passed
                  </button>
                  <button
                    onClick={() => handleToggleStatus(tc, 'failed')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
                      tc.status === 'failed'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Failed
                  </button>

                  <button
                    onClick={() => runSingleTest(tc._id)}
                    disabled={isRunning}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isRunning ? 'Evaluating...' : 'Run Test'}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(tc._id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question & Expected Spec */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Input Question
                  </div>
                  <div className="font-semibold text-slate-800 italic">"{tc.customerQuestion}"</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Expected Behavior & Tool
                  </div>
                  <div className="text-slate-700 leading-relaxed">{tc.expectedBehavior}</div>
                  <div className="text-[11px] text-indigo-600 font-mono mt-1">
                    Expected Tool: <strong>{tc.expectedTool || 'none'}</strong>
                  </div>
                </div>
              </div>

              {/* Actual Execution Output */}
              {tc.actualResponse && (
                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Agent Actual Response & Verification:
                    </span>
                    <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-800">
                      Tool Used: {tc.actualToolUsed || 'none'}
                    </span>
                  </div>
                  <div className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {tc.actualResponse}
                  </div>

                  {tc.retrievedSources && tc.retrievedSources.length > 0 && (
                    <div className="pt-2 border-t border-indigo-100 text-[11px] text-indigo-700">
                      Knowledge sources retrieved: {tc.retrievedSources.map((s) => s.documentTitle).join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New Test Case Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Agent Test Case">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Test Name</label>
            <input
              type="text"
              required
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="e.g. Return Policy Accuracy Test"
              className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200"
            >
              <option value="Knowledge Q&A">Knowledge Q&A</option>
              <option value="Order Lookup">Order Lookup</option>
              <option value="Cancellation">Cancellation</option>
              <option value="Refund">Refund</option>
              <option value="Human Escalation">Human Escalation</option>
              <option value="Edge Case">Edge Case</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Customer Test Question</label>
            <textarea
              required
              rows={2}
              value={customerQuestion}
              onChange={(e) => setCustomerQuestion(e.target.value)}
              placeholder="e.g. How long do I have to return an item?"
              className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Expected Agent Behavior</label>
            <textarea
              required
              rows={2}
              value={expectedBehavior}
              onChange={(e) => setExpectedBehavior(e.target.value)}
              placeholder="e.g. Must state 30 days and mention return label availability."
              className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Expected Tool Call</label>
            <select
              value={expectedTool}
              onChange={(e) => setExpectedTool(e.target.value)}
              className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200"
            >
              <option value="none">None (Direct Response)</option>
              <option value="search_knowledge_base">search_knowledge_base</option>
              <option value="get_order_details">get_order_details</option>
              <option value="find_customer">find_customer</option>
              <option value="cancel_order">cancel_order</option>
              <option value="initiate_refund">initiate_refund</option>
              <option value="escalate_to_human_support">escalate_to_human_support</option>
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
              Save Test Case
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TestingPlayground;
