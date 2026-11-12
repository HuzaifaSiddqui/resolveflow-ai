import OpenAI from 'openai';
import AgentConfiguration from '../models/AgentConfiguration.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { executeTool, getAvailableToolDefinitions } from './toolService.js';
import { searchKnowledgeBase } from './ragService.js';
import { evaluateWorkflows } from './workflowService.js';

// Heuristic tool selection for fallback/offline mode when no OpenAI API Key is present
const determineFallbackToolCall = (userText) => {
  const text = (userText || '').toLowerCase();

  // 1. Human Escalation
  if (
    text.includes('human') ||
    text.includes('agent') ||
    text.includes('representative') ||
    text.includes('speak with someone') ||
    text.includes('talk to a real person') ||
    text.includes('supervisor')
  ) {
    return {
      name: 'escalate_to_human_support',
      args: { reason: 'Customer requested human assistance' },
    };
  }

  // 2. Cancellation
  const cancelMatch = text.match(/cancel.*?(ord-[\w\d]+)/i) || text.match(/(ord-[\w\d]+).*?cancel/i);
  if (text.includes('cancel') && (text.includes('order') || cancelMatch)) {
    const orderIdMatch = text.match(/ord-[\w\d]+/i);
    const orderId = orderIdMatch ? orderIdMatch[0].toUpperCase() : 'ORD-1001';
    const isConfirmed = text.includes('yes') || text.includes('confirm') || text.includes('please proceed');
    return {
      name: 'cancel_order',
      args: { orderId, reason: 'Customer requested cancellation', confirmed: isConfirmed },
    };
  }

  // 3. Refund
  const refundMatch = text.match(/refund.*?(ord-[\w\d]+)/i) || text.match(/(ord-[\w\d]+).*?refund/i);
  if (text.includes('refund') && (text.includes('order') || refundMatch || text.includes('money back'))) {
    const orderIdMatch = text.match(/ord-[\w\d]+/i);
    const orderId = orderIdMatch ? orderIdMatch[0].toUpperCase() : 'ORD-1002';
    const isConfirmed = text.includes('yes') || text.includes('confirm') || text.includes('please proceed');
    return {
      name: 'initiate_refund',
      args: { orderId, reason: 'Customer requested refund', confirmed: isConfirmed },
    };
  }

  // 4. Order Details
  const orderIdExplicit = text.match(/ord-[\w\d]+/i);
  if (orderIdExplicit || ((text.includes('order') || text.includes('package') || text.includes('tracking')) && (text.includes('where') || text.includes('status') || text.includes('find')))) {
    return {
      name: 'get_order_details',
      args: { orderId: orderIdExplicit ? orderIdExplicit[0].toUpperCase() : 'ORD-1001' },
    };
  }

  // 5. Customer Lookup
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  const custMatch = text.match(/cust-[\w\d]+/i);
  if (emailMatch || custMatch || (text.includes('my account') || text.includes('who am i') || text.includes('my profile'))) {
    return {
      name: 'find_customer',
      args: { query: emailMatch ? emailMatch[0] : (custMatch ? custMatch[0].toUpperCase() : 'sarah.j@example.com') },
    };
  }

  // 6. Default to Knowledge Base Search for policy/FAQ queries
  return {
    name: 'search_knowledge_base',
    args: { query: userText },
  };
};

export const processCustomerMessage = async ({
  workspaceId,
  conversationId,
  userMessage,
  userId = null,
}) => {
  // 1. Fetch conversation and agent configuration
  const conversation = await Conversation.findOne({ _id: conversationId, workspaceId });
  if (!conversation) {
    throw new Error('Conversation not found');
  }

  // If conversation is already escalated to a human, DO NOT auto-respond!
  if (conversation.handlingMode === 'human' || conversation.status === 'escalated') {
    return {
      message: 'This conversation has been escalated to a human agent. An agent will respond directly in the support inbox.',
      status: 'escalated',
      handlingMode: 'human',
      isHandledByHuman: true,
    };
  }

  // 2. Fetch or create Agent Configuration
  let agentConfig = await AgentConfiguration.findOne({ workspaceId });
  if (!agentConfig) {
    agentConfig = await AgentConfiguration.create({ workspaceId });
  }

  // 3. Evaluate Rule-based Workflows first
  const triggeredWorkflows = await evaluateWorkflows({
    workspaceId,
    conversationId: conversation._id,
    messageText: userMessage,
    customerData: conversation.customer,
  });

  // Re-check if workflow just escalated it
  const refreshedConv = await Conversation.findById(conversation._id);
  if (refreshedConv.status === 'escalated' || refreshedConv.handlingMode === 'human') {
    const escalationReply = 'Your request has been routed to our human support team. A team representative will assist you shortly.';
    const savedMsg = await Message.create({
      workspaceId,
      conversationId: conversation._id,
      sender: 'system',
      senderName: 'System Workflow',
      content: escalationReply,
      metadata: { triggeredWorkflows },
    });
    return {
      reply: escalationReply,
      toolCalls: [],
      sources: [],
      conversationStatus: 'escalated',
      handlingMode: 'human',
    };
  }

  // 4. Retrieve recent message history for context
  const recentMessages = await Message.find({ conversationId: conversation._id })
    .sort({ createdAt: -1 })
    .limit(8);
  recentMessages.reverse();

  // 5. Pre-fetch Knowledge Base chunks (RAG)
  let retrievedKnowledge = [];
  if (agentConfig.knowledgeBaseEnabled) {
    retrievedKnowledge = await searchKnowledgeBase({
      workspaceId,
      query: userMessage,
      limit: agentConfig.maxContextChunks || 4,
      threshold: agentConfig.similarityThreshold || 0.4,
      apiKey: agentConfig.openAiApiKey || process.env.OPENAI_API_KEY,
    });
  }

  const knowledgeContext = retrievedKnowledge.length > 0
    ? `\n\n--- RELEVANT COMPANY KNOWLEDGE BASE ARTICLES ---\n` +
      retrievedKnowledge.map((k, idx) => `[Document ${idx + 1}: ${k.documentTitle}]\n${k.content}`).join('\n\n') +
      `\n--- END OF KNOWLEDGE BASE ---`
    : '\n(No relevant knowledge base articles found for this question)';

  // 6. Build System Prompt
  const systemPrompt = `You are ${agentConfig.agentName}, an AI customer support agent for this company.
Personality: ${agentConfig.personality}
Tone: ${agentConfig.tone}
Company Information: ${agentConfig.businessInfo}

Instructions:
${agentConfig.systemInstructions}

CRITICAL OPERATIONAL RULES:
1. Always prioritize verified company knowledge provided below. Avoid inventing company policies, pricing, or order details.
2. If the user asks about an order or wants to check an order, use the "get_order_details" tool.
3. If the user wants to cancel an order, check if it's pending/processing. If not confirmed, ask the customer for confirmation before cancelling! Never claim an order was cancelled unless the backend confirms it.
4. If the user asks for a refund, check eligibility and ask for confirmation before issuing. Never claim a refund was completed without backend confirmation.
5. If the customer asks for a human representative, sounds deeply unsatisfied, or you cannot answer confidently, use the "escalate_to_human_support" tool.
6. If the needed information is not in the knowledge base and cannot be resolved with tools, admit uncertainty honestly and offer to escalate to human support.

${knowledgeContext}`;

  const apiKey = agentConfig.openAiApiKey || process.env.OPENAI_API_KEY;
  const tools = getAvailableToolDefinitions(agentConfig.enabledTools);

  let finalReply = '';
  let toolCallsExecuted = [];
  let sourcesUsed = retrievedKnowledge.map((k) => ({
    documentTitle: k.documentTitle,
    contentSnippet: k.content.substring(0, 160) + '...',
    score: k.score,
  }));

  // 7. Execute with OpenAI if API key available, otherwise use Intelligent Engine Fallback
  if (apiKey) {
    try {
      const openai = new OpenAI({ apiKey });

      // Build conversation messages array
      const messagesPayload = [
        { role: 'system', content: systemPrompt },
      ];

      for (const m of recentMessages) {
        if (m.sender === 'customer') {
          messagesPayload.push({ role: 'user', content: m.content });
        } else if (m.sender === 'ai' || m.sender === 'agent') {
          messagesPayload.push({ role: 'assistant', content: m.content });
        }
      }

      // Add current message if not in history
      if (!recentMessages.some((m) => m.content === userMessage && m.sender === 'customer')) {
        messagesPayload.push({ role: 'user', content: userMessage });
      }

      // First call: allows OpenAI to decide tool calls
      const response = await openai.chat.completions.create({
        model: agentConfig.modelName || 'gpt-4o-mini',
        messages: messagesPayload,
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: tools.length > 0 ? 'auto' : undefined,
        temperature: 0.2,
      });

      const responseMessage = response.choices[0].message;

      // Handle Tool Calls
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        messagesPayload.push(responseMessage);

        for (const toolCall of responseMessage.tool_calls) {
          const fnName = toolCall.function.name;
          let fnArgs = {};
          try {
            fnArgs = JSON.parse(toolCall.function.arguments);
          } catch (e) {
            fnArgs = {};
          }

          const executionResult = await executeTool({
            toolName: fnName,
            parameters: fnArgs,
            workspaceId,
            conversationId: conversation._id,
            userId,
            apiKey,
          });

          toolCallsExecuted.push({
            toolName: fnName,
            toolCallId: toolCall.id,
            arguments: fnArgs,
            result: executionResult,
            status: executionResult.success !== false ? 'success' : 'failed',
          });

          messagesPayload.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(executionResult),
          });
        }

        // Second call: get final synthesized response after tool execution
        const finalResponse = await openai.chat.completions.create({
          model: agentConfig.modelName || 'gpt-4o-mini',
          messages: messagesPayload,
          temperature: 0.2,
        });

        finalReply = finalResponse.choices[0].message.content || 'Action executed successfully.';
      } else {
        finalReply = responseMessage.content || 'I have reviewed your inquiry.';
      }
    } catch (apiErr) {
      console.warn(`[AIAgent] OpenAI API error (${apiErr.message}). Falling back to local agent engine.`);
      // Fallback to local agent engine below
    }
  }

  // Local Agent Engine (Used when no API key or when OpenAI call fails)
  if (!finalReply) {
    const detected = determineFallbackToolCall(userMessage);

    if (detected && detected.name) {
      const toolResult = await executeTool({
        toolName: detected.name,
        parameters: detected.args,
        workspaceId,
        conversationId: conversation._id,
        userId,
        apiKey: null,
      });

      toolCallsExecuted.push({
        toolName: detected.name,
        toolCallId: 'local_' + Date.now(),
        arguments: detected.args,
        result: toolResult,
        status: toolResult.success !== false ? 'success' : 'failed',
      });

      // Craft response based on verified backend execution
      if (detected.name === 'escalate_to_human_support') {
        finalReply = `I have transferred your conversation to our human support team. A representative will join and review your chat shortly.`;
      } else if (detected.name === 'cancel_order') {
        if (toolResult.requiresConfirmation) {
          finalReply = `${toolResult.message}`;
        } else if (toolResult.success && toolResult.actionCompleted) {
          finalReply = `Your cancellation request is confirmed: ${toolResult.message}`;
        } else {
          finalReply = `Regarding cancellation for order ${detected.args.orderId}: ${toolResult.message}`;
        }
      } else if (detected.name === 'initiate_refund') {
        if (toolResult.requiresConfirmation) {
          finalReply = `${toolResult.message}`;
        } else if (toolResult.success && toolResult.actionCompleted) {
          finalReply = `Your refund request has been processed: ${toolResult.message}`;
        } else {
          finalReply = `Regarding refund for order ${detected.args.orderId}: ${toolResult.message}`;
        }
      } else if (detected.name === 'get_order_details') {
        if (toolResult.success) {
          const ord = toolResult.order;
          const itemsList = ord.products.map((p) => `${p.quantity}x ${p.name} ($${p.price})`).join(', ');
          finalReply = `Here are the details for Order **${ord.orderId}**:\n- **Status:** ${ord.orderStatus.toUpperCase()}\n- **Total Amount:** $${ord.orderAmount.toFixed(2)}\n- **Payment:** ${ord.paymentStatus}\n- **Tracking:** ${ord.trackingNumber}\n- **Items:** ${itemsList}\n- **Delivery Address:** ${ord.shippingAddress}`;
        } else {
          finalReply = toolResult.message;
        }
      } else if (detected.name === 'find_customer') {
        if (toolResult.success) {
          const c = toolResult.customer;
          finalReply = `Customer record located for **${c.name}** (${c.email}). Account ID: ${c.customerId}, Total Orders: ${c.totalOrders}, Total Spent: $${c.totalSpent.toFixed(2)}.`;
        } else {
          finalReply = toolResult.message;
        }
      } else if (detected.name === 'search_knowledge_base') {
        if (toolResult.foundCount > 0) {
          const topMatch = toolResult.results[0];
          finalReply = `Based on our company policy (${topMatch.documentTitle}):\n\n${topMatch.contentSnippet}\n\nDoes this answer your question, or would you like me to connect you with a team member?`;
        } else {
          finalReply = `I couldn't find a direct policy regarding that in our knowledge base. Would you like me to connect you with a human support agent who can help?`;
        }
      }
    } else {
      finalReply = `Thank you for your message. How can I assist you with your orders, shipping, or returns today?`;
    }
  }

  // 8. Save the AI response message
  const aiMessage = await Message.create({
    workspaceId,
    conversationId: conversation._id,
    sender: 'ai',
    senderName: agentConfig.agentName,
    content: finalReply,
    toolCalls: toolCallsExecuted,
    sources: sourcesUsed,
    metadata: {
      modelUsed: apiKey ? (agentConfig.modelName || 'gpt-4o-mini') : 'ResolveFlow Local Agent Engine',
      hasApiKey: !!apiKey,
    },
  });

  // 9. Update conversation summary and timestamps
  conversation.lastMessage = finalReply.substring(0, 150);
  conversation.lastMessageAt = new Date();
  conversation.messageCount = (conversation.messageCount || 0) + 1;

  // If escalate tool was used, mark conversation as escalated
  if (toolCallsExecuted.some((tc) => tc.toolName === 'escalate_to_human_support')) {
    conversation.status = 'escalated';
    conversation.handlingMode = 'human';
  }

  await conversation.save();

  return {
    reply: finalReply,
    messageId: aiMessage._id,
    toolCalls: toolCallsExecuted,
    sources: sourcesUsed,
    conversationStatus: conversation.status,
    handlingMode: conversation.handlingMode,
  };
};
