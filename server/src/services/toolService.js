import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import Conversation from '../models/Conversation.js';
import ToolExecution from '../models/ToolExecution.js';
import AuditLog from '../models/AuditLog.js';
import { searchKnowledgeBase } from './ragService.js';

export const executeTool = async ({
  toolName,
  parameters,
  workspaceId,
  conversationId,
  userId = null,
  apiKey = null,
}) => {
  const startTime = Date.now();
  let result;
  let status = 'success';

  try {
    switch (toolName) {
      case 'search_knowledge_base': {
        const query = parameters.query || parameters.question || '';
        const limit = Number(parameters.limit) || 4;
        const chunks = await searchKnowledgeBase({
          workspaceId,
          query,
          limit,
          threshold: 0.35,
          apiKey,
        });

        result = {
          query,
          foundCount: chunks.length,
          results: chunks.map((c) => ({
            documentTitle: c.documentTitle,
            category: c.category,
            contentSnippet: c.content,
            score: c.score,
          })),
        };
        break;
      }

      case 'find_customer': {
        const query = (parameters.email || parameters.customerId || parameters.query || '').trim();
        if (!query) {
          result = { success: false, message: 'Please provide customer email, ID, or name' };
          break;
        }

        const customer = await Customer.findOne({
          workspaceId,
          $or: [
            { email: new RegExp(`^${query}$`, 'i') },
            { customerId: new RegExp(`^${query}$`, 'i') },
            { name: new RegExp(query, 'i') },
          ],
        });

        if (!customer) {
          result = { success: false, message: `No customer found matching "${query}"` };
          break;
        }

        const recentOrders = await Order.find({
          workspaceId,
          customerId: customer.customerId,
        })
          .sort({ orderDate: -1 })
          .limit(5);

        result = {
          success: true,
          customer: {
            customerId: customer.customerId,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            totalOrders: customer.totalOrders,
            totalSpent: customer.totalSpent,
            tags: customer.tags,
          },
          recentOrders: recentOrders.map((o) => ({
            orderId: o.orderId,
            orderDate: o.orderDate,
            amount: o.orderAmount,
            orderStatus: o.orderStatus,
            paymentStatus: o.paymentStatus,
            trackingNumber: o.trackingNumber,
          })),
        };
        break;
      }

      case 'get_order_details': {
        const orderId = (parameters.orderId || '').trim();
        if (!orderId) {
          result = { success: false, message: 'Please provide an order ID (e.g. ORD-1001)' };
          break;
        }

        const order = await Order.findOne({
          workspaceId,
          orderId: new RegExp(`^${orderId}$`, 'i'),
        });

        if (!order) {
          result = { success: false, message: `Order ${orderId} not found in our database.` };
          break;
        }

        result = {
          success: true,
          order: {
            orderId: order.orderId,
            customerId: order.customerId,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            orderAmount: order.orderAmount,
            orderStatus: order.orderStatus,
            paymentStatus: order.paymentStatus,
            trackingNumber: order.trackingNumber || 'Not assigned yet',
            shippingAddress: order.shippingAddress,
            orderDate: order.orderDate,
            products: order.products,
            isCancellable: ['pending', 'processing'].includes(order.orderStatus),
            isRefundable: ['delivered', 'cancelled'].includes(order.orderStatus) && order.paymentStatus === 'paid',
          },
        };
        break;
      }

      case 'cancel_order': {
        const orderId = (parameters.orderId || '').trim();
        const reason = parameters.reason || 'Customer requested cancellation';
        const confirmed = parameters.confirmed === true || parameters.confirmed === 'true';

        if (!orderId) {
          result = { success: false, message: 'Order ID is required to cancel an order.' };
          break;
        }

        const order = await Order.findOne({
          workspaceId,
          orderId: new RegExp(`^${orderId}$`, 'i'),
        });

        if (!order) {
          result = { success: false, message: `Order ${orderId} was not found.` };
          break;
        }

        // Business rules: only pending or processing orders can be cancelled
        if (!['pending', 'processing'].includes(order.orderStatus)) {
          result = {
            success: false,
            message: `Order ${order.orderId} cannot be cancelled because its current status is "${order.orderStatus}". Orders that have shipped or delivered must be returned or refunded according to policy.`,
          };
          break;
        }

        // Confirmation requirement
        if (!confirmed) {
          result = {
            success: false,
            requiresConfirmation: true,
            orderId: order.orderId,
            orderAmount: order.orderAmount,
            message: `Order ${order.orderId} (Total: $${order.orderAmount}) is eligible for cancellation. Please ask the customer to confirm: "Would you like me to proceed with cancelling order ${order.orderId}?"`,
          };
          break;
        }

        // Execute cancellation
        order.orderStatus = 'cancelled';
        order.cancellationReason = reason;
        await order.save();

        await AuditLog.create({
          workspaceId,
          userId,
          action: 'ORDER_CANCELLED',
          entityType: 'Order',
          entityId: order.orderId,
          details: { orderId: order.orderId, reason, amount: order.orderAmount },
        });

        result = {
          success: true,
          actionCompleted: true,
          orderId: order.orderId,
          newStatus: 'cancelled',
          message: `Order ${order.orderId} has been successfully cancelled. A confirmation has been logged.`,
        };
        break;
      }

      case 'initiate_refund': {
        const orderId = (parameters.orderId || '').trim();
        const reason = parameters.reason || 'Customer requested refund';
        const confirmed = parameters.confirmed === true || parameters.confirmed === 'true';
        let requestedAmount = parameters.amount ? Number(parameters.amount) : null;

        if (!orderId) {
          result = { success: false, message: 'Order ID is required to initiate a refund.' };
          break;
        }

        const order = await Order.findOne({
          workspaceId,
          orderId: new RegExp(`^${orderId}$`, 'i'),
        });

        if (!order) {
          result = { success: false, message: `Order ${orderId} was not found.` };
          break;
        }

        if (order.paymentStatus === 'refunded') {
          result = { success: false, message: `Order ${order.orderId} has already been refunded.` };
          break;
        }

        if (order.paymentStatus !== 'paid') {
          result = { success: false, message: `Order ${order.orderId} payment status is "${order.paymentStatus}", not paid.` };
          break;
        }

        // Refund eligibility: delivered or cancelled
        if (!['delivered', 'cancelled'].includes(order.orderStatus)) {
          result = {
            success: false,
            message: `Order ${order.orderId} is currently "${order.orderStatus}". Refunds are only processed for delivered or cancelled items.`,
          };
          break;
        }

        const refundAmt = requestedAmount && requestedAmount > 0 ? Math.min(requestedAmount, order.orderAmount) : order.orderAmount;

        // Confirmation requirement
        if (!confirmed) {
          result = {
            success: false,
            requiresConfirmation: true,
            orderId: order.orderId,
            refundAmount: refundAmt,
            message: `A demo refund of $${refundAmt.toFixed(2)} for order ${order.orderId} is eligible. Please ask the customer to confirm: "Would you like me to process a refund of $${refundAmt.toFixed(2)} for order ${order.orderId}?"`,
          };
          break;
        }

        // Execute demo refund
        order.paymentStatus = 'refunded';
        order.refundReason = reason;
        order.refundAmount = refundAmt;
        await order.save();

        await AuditLog.create({
          workspaceId,
          userId,
          action: 'REFUND_PROCESSED',
          entityType: 'Order',
          entityId: order.orderId,
          details: { orderId: order.orderId, refundAmount: refundAmt, reason },
        });

        result = {
          success: true,
          actionCompleted: true,
          orderId: order.orderId,
          refundAmount: refundAmt,
          paymentStatus: 'refunded',
          message: `Demo refund of $${refundAmt.toFixed(2)} for order ${order.orderId} has been successfully processed.`,
        };
        break;
      }

      case 'escalate_to_human_support': {
        const reason = parameters.reason || 'Customer requested human support agent';
        let targetConvId = conversationId || parameters.conversationId;

        if (targetConvId) {
          const conv = await Conversation.findOne({ _id: targetConvId, workspaceId });
          if (conv) {
            conv.status = 'escalated';
            conv.handlingMode = 'human';
            conv.escalationReason = reason;
            await conv.save();

            await AuditLog.create({
              workspaceId,
              userId,
              action: 'CONVERSATION_ESCALATED',
              entityType: 'Conversation',
              entityId: conv._id.toString(),
              details: { reason, sessionId: conv.sessionId },
            });
          }
        }

        result = {
          success: true,
          actionCompleted: true,
          status: 'escalated',
          message: 'The conversation has been transferred to a human support agent. A team member will assist shortly.',
        };
        break;
      }

      default:
        result = { success: false, message: `Unknown tool: ${toolName}` };
        status = 'failed';
        break;
    }
  } catch (err) {
    console.error(`[ToolService] Error executing tool ${toolName}:`, err);
    result = { success: false, message: `Tool execution failed: ${err.message}` };
    status = 'failed';
  }

  const executionTimeMs = Date.now() - startTime;

  // Record tool execution for analytics and audit
  await ToolExecution.create({
    workspaceId,
    conversationId: conversationId || null,
    toolName,
    inputParams: parameters,
    result,
    status,
    executionTimeMs,
  });

  return result;
};

// Tool definitions for OpenAI / LangChain
export const getAvailableToolDefinitions = (enabledToolsList = null) => {
  const allTools = [
    {
      type: 'function',
      function: {
        name: 'search_knowledge_base',
        description: 'Search the company knowledge base, policies, FAQs, shipping guides, return terms, and product documentation using semantic similarity.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query or question about company policies, shipping, returns, etc.',
            },
          },
          required: ['query'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'find_customer',
        description: 'Find a customer profile and order history by email, customer ID, or name.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The customer email address, ID (e.g. CUST-1001), or full name.',
            },
          },
          required: ['query'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_order_details',
        description: 'Look up an order by order ID (e.g. ORD-1001) to check its status, payment, products, and tracking information.',
        parameters: {
          type: 'object',
          properties: {
            orderId: {
              type: 'string',
              description: 'The order ID, e.g. ORD-1001, ORD-8821.',
            },
          },
          required: ['orderId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'cancel_order',
        description: 'Cancel an order that is in pending or processing status. Requires explicit confirmation from the customer before setting confirmed: true.',
        parameters: {
          type: 'object',
          properties: {
            orderId: {
              type: 'string',
              description: 'The order ID to cancel.',
            },
            reason: {
              type: 'string',
              description: 'Reason for cancellation.',
            },
            confirmed: {
              type: 'boolean',
              description: 'Set to true ONLY IF the customer has explicitly confirmed they want to cancel.',
            },
          },
          required: ['orderId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'initiate_refund',
        description: 'Process a demo refund for a delivered or cancelled order. Requires explicit customer confirmation before setting confirmed: true.',
        parameters: {
          type: 'object',
          properties: {
            orderId: {
              type: 'string',
              description: 'The order ID to refund.',
            },
            amount: {
              type: 'number',
              description: 'The refund amount.',
            },
            reason: {
              type: 'string',
              description: 'Reason for refund.',
            },
            confirmed: {
              type: 'boolean',
              description: 'Set to true ONLY IF the customer has explicitly confirmed the refund request.',
            },
          },
          required: ['orderId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'escalate_to_human_support',
        description: 'Escalate the conversation to a human support agent when the customer asks for a human, expresses high frustration, or the AI cannot confidently resolve the issue.',
        parameters: {
          type: 'object',
          properties: {
            reason: {
              type: 'string',
              description: 'Reason for human escalation.',
            },
          },
          required: ['reason'],
        },
      },
    },
  ];

  if (!enabledToolsList || enabledToolsList.length === 0) {
    return allTools;
  }

  // Filter based on enabled tools configuration
  const enabledNames = new Set(
    enabledToolsList.filter((t) => t.enabled !== false).map((t) => t.name)
  );

  return allTools.filter((t) => enabledNames.has(t.function.name));
};
