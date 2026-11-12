import Workflow from '../models/Workflow.js';
import WorkflowExecution from '../models/WorkflowExecution.js';
import Conversation from '../models/Conversation.js';
import Order from '../models/Order.js';

export const evaluateWorkflows = async ({
  workspaceId,
  conversationId,
  messageText,
  customerData = {},
}) => {
  const triggeredWorkflows = [];
  const text = (messageText || '').toLowerCase();

  try {
    const activeWorkflows = await Workflow.find({ workspaceId, isActive: true });
    if (!activeWorkflows || activeWorkflows.length === 0) return [];

    for (const wf of activeWorkflows) {
      let isTriggered = false;

      // 1. Check Trigger
      if (wf.trigger === 'order_inquiry') {
        const orderKeywords = ['order', 'tracking', 'package', 'delivery', 'shipped', 'where is', 'status of'];
        isTriggered = orderKeywords.some((kw) => text.includes(kw));
      } else if (wf.trigger === 'refund_request') {
        const refundKeywords = ['refund', 'money back', 'return payment', 'reimburse'];
        isTriggered = refundKeywords.some((kw) => text.includes(kw));
      } else if (wf.trigger === 'human_escalation') {
        const humanKeywords = ['human', 'agent', 'representative', 'support person', 'talk to someone', 'supervisor'];
        isTriggered = humanKeywords.some((kw) => text.includes(kw));
      } else if (wf.trigger === 'negative_sentiment') {
        const negativeKeywords = ['terrible', 'horrible', 'worst', 'angry', 'scam', 'unacceptable', 'ridiculous', 'sue', 'lawyer'];
        isTriggered = negativeKeywords.some((kw) => text.includes(kw));
      } else if (wf.trigger === 'custom_keyword') {
        isTriggered = true; // will evaluate conditions
      }

      // 2. Evaluate conditions
      if (isTriggered && wf.conditions && wf.conditions.length > 0) {
        for (const cond of wf.conditions) {
          const val = (cond.value || '').toLowerCase();
          if (cond.operator === 'contains') {
            if (!text.includes(val)) isTriggered = false;
          } else if (cond.operator === 'equals') {
            if (text.trim() !== val.trim()) isTriggered = false;
          } else if (cond.operator === 'starts_with') {
            if (!text.trim().startsWith(val)) isTriggered = false;
          }
        }
      }

      // 3. Execute actions if triggered
      if (isTriggered) {
        let actionResults = [];

        for (const action of wf.actions) {
          if (action.actionType === 'escalate_conversation') {
            if (conversationId) {
              await Conversation.findByIdAndUpdate(conversationId, {
                status: 'escalated',
                handlingMode: 'human',
                escalationReason: `Triggered by workflow: ${wf.name}`,
              });
              actionResults.push({ action: 'escalate_conversation', status: 'escalated' });
            }
          } else if (action.actionType === 'flag_sentiment') {
            if (conversationId) {
              await Conversation.findByIdAndUpdate(conversationId, {
                summary: `Flagged for negative sentiment by workflow: ${wf.name}`,
              });
              actionResults.push({ action: 'flag_sentiment', flagged: true });
            }
          } else if (action.actionType === 'lookup_order') {
            actionResults.push({ action: 'lookup_order', note: 'AI agent prompted with order retrieval capability' });
          } else if (action.actionType === 'check_refund_eligibility') {
            actionResults.push({ action: 'check_refund_eligibility', note: 'AI agent instructed to require customer confirmation' });
          } else if (action.actionType === 'send_auto_message') {
            const autoMsg = action.payload?.message || 'Thank you for reaching out. We are checking on this right away.';
            actionResults.push({ action: 'send_auto_message', message: autoMsg });
          }
        }

        // Record execution
        await WorkflowExecution.create({
          workspaceId,
          workflowId: wf._id,
          workflowName: wf.name,
          conversationId: conversationId || null,
          trigger: wf.trigger,
          input: { messageText, customerData },
          output: { actionResults },
          status: 'success',
        });

        wf.executionCount = (wf.executionCount || 0) + 1;
        await wf.save();

        triggeredWorkflows.push({
          workflowId: wf._id,
          name: wf.name,
          trigger: wf.trigger,
          actions: actionResults,
        });
      }
    }
  } catch (err) {
    console.error('[WorkflowService] Error evaluating workflows:', err);
  }

  return triggeredWorkflows;
};
