import express from 'express';
import Workspace from '../models/Workspace.js';
import AgentConfiguration from '../models/AgentConfiguration.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { verifyWidgetAccess } from '../middleware/auth.js';
import { processCustomerMessage } from '../services/aiAgentService.js';

const router = express.Router();

// Get public widget configuration for a workspace
router.get('/config/:workspaceId', verifyWidgetAccess, async (req, res) => {
  try {
    const workspace = req.workspace;
    let agentConfig = await AgentConfiguration.findOne({ workspaceId: workspace._id });
    if (!agentConfig) {
      agentConfig = await AgentConfiguration.create({
        workspaceId: workspace._id,
        agentName: 'ResolveBot',
        businessInfo: `Company: ${workspace.name}`,
      });
    }

    res.json({
      success: true,
      widget: {
        workspaceId: workspace._id,
        workspaceName: workspace.name,
        agentName: agentConfig.agentName,
        welcomeMessage: agentConfig.welcomeMessage,
        primaryColor: workspace.settings?.primaryColor || '#4f46e5',
        greetingMessage: workspace.settings?.greetingMessage || agentConfig.welcomeMessage,
        supportEmail: workspace.settings?.supportEmail,
        businessHours: workspace.settings?.businessHours,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Fetch conversation history for a visitor session
router.get('/history/:workspaceId/:sessionId', verifyWidgetAccess, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const conversation = await Conversation.findOne({
      workspaceId: req.workspaceId,
      sessionId,
    });

    if (!conversation) {
      return res.json({ success: true, conversation: null, messages: [] });
    }

    const messages = await Message.find({
      workspaceId: req.workspaceId,
      conversationId: conversation._id,
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      conversation,
      messages,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Customer sends message from widget
router.post('/message/:workspaceId', verifyWidgetAccess, async (req, res) => {
  try {
    const { sessionId, message, customer = {} } = req.body;

    if (!sessionId || !message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'sessionId and message are required' });
    }

    // Find or create conversation for this visitor session
    let conversation = await Conversation.findOne({
      workspaceId: req.workspaceId,
      sessionId,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        workspaceId: req.workspaceId,
        sessionId,
        customer: {
          customerId: customer.customerId || '',
          name: customer.name || 'Website Visitor',
          email: customer.email || '',
          phone: customer.phone || '',
        },
        channel: 'widget',
        status: 'open',
        handlingMode: 'ai',
      });
    } else if (customer && (customer.name || customer.email || customer.customerId)) {
      if (customer.name) conversation.customer.name = customer.name;
      if (customer.email) conversation.customer.email = customer.email;
      if (customer.customerId) conversation.customer.customerId = customer.customerId;
      await conversation.save();
    }

    // Record user message
    const customerMsg = await Message.create({
      workspaceId: req.workspaceId,
      conversationId: conversation._id,
      sender: 'customer',
      senderName: conversation.customer.name || 'Customer',
      content: message.trim(),
    });

    conversation.lastMessage = message.trim().substring(0, 150);
    conversation.lastMessageAt = new Date();
    conversation.messageCount = (conversation.messageCount || 0) + 1;
    await conversation.save();

    // Check if currently handled by a human
    if (conversation.handlingMode === 'human' || conversation.status === 'escalated') {
      return res.json({
        success: true,
        customerMessage: customerMsg,
        aiReply: null,
        status: conversation.status,
        handlingMode: 'human',
        notice: 'A human agent has been notified and will reply shortly in the chat.',
      });
    }

    // Execute AI Agent
    const aiResult = await processCustomerMessage({
      workspaceId: req.workspaceId,
      conversationId: conversation._id,
      userMessage: message.trim(),
    });

    const refreshedConv = await Conversation.findById(conversation._id);

    res.json({
      success: true,
      customerMessage: customerMsg,
      aiReply: {
        content: aiResult.reply,
        toolCalls: aiResult.toolCalls,
        sources: aiResult.sources,
      },
      conversation: refreshedConv,
    });
  } catch (error) {
    console.error('[Widget Message Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
