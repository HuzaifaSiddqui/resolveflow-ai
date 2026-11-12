import express from 'express';
import AgentConfiguration from '../models/AgentConfiguration.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { protect, requireWorkspace } from '../middleware/auth.js';
import { processCustomerMessage } from '../services/aiAgentService.js';

const router = express.Router();

router.use(protect);
router.use(requireWorkspace);

// Get agent configuration
router.get('/config', async (req, res) => {
  try {
    let config = await AgentConfiguration.findOne({ workspaceId: req.workspaceId });
    if (!config) {
      config = await AgentConfiguration.create({
        workspaceId: req.workspaceId,
        agentName: 'ResolveBot',
        businessInfo: `Company: ${req.workspace.name}`,
        enabledTools: [
          { name: 'search_knowledge_base', enabled: true, description: 'Search company knowledge and FAQs' },
          { name: 'find_customer', enabled: true, description: 'Lookup customer profile and contact details' },
          { name: 'get_order_details', enabled: true, description: 'Check order status, tracking, and items' },
          { name: 'cancel_order', enabled: true, description: 'Cancel pending or processing orders with confirmation' },
          { name: 'initiate_refund', enabled: true, description: 'Process demo refunds with confirmation' },
          { name: 'escalate_to_human_support', enabled: true, description: 'Transfer conversation to a human representative' },
        ],
      });
    }

    // Hide full raw API key for security, return masked key
    const configObj = config.toObject();
    if (configObj.openAiApiKey) {
      configObj.hasApiKey = true;
      configObj.maskedApiKey = configObj.openAiApiKey.substring(0, 7) + '...' + configObj.openAiApiKey.slice(-4);
      delete configObj.openAiApiKey;
    } else {
      configObj.hasApiKey = !!process.env.OPENAI_API_KEY;
    }

    res.json({ success: true, config: configObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update agent configuration
router.put('/config', async (req, res) => {
  try {
    const {
      agentName,
      personality,
      tone,
      systemInstructions,
      welcomeMessage,
      businessInfo,
      supportedLanguages,
      knowledgeBaseEnabled,
      similarityThreshold,
      maxContextChunks,
      enabledTools,
      humanHandoff,
      modelName,
      openAiApiKey,
    } = req.body;

    let config = await AgentConfiguration.findOne({ workspaceId: req.workspaceId });
    if (!config) {
      config = new AgentConfiguration({ workspaceId: req.workspaceId });
    }

    if (agentName !== undefined) config.agentName = agentName;
    if (personality !== undefined) config.personality = personality;
    if (tone !== undefined) config.tone = tone;
    if (systemInstructions !== undefined) config.systemInstructions = systemInstructions;
    if (welcomeMessage !== undefined) config.welcomeMessage = welcomeMessage;
    if (businessInfo !== undefined) config.businessInfo = businessInfo;
    if (supportedLanguages !== undefined) config.supportedLanguages = supportedLanguages;
    if (knowledgeBaseEnabled !== undefined) config.knowledgeBaseEnabled = knowledgeBaseEnabled;
    if (similarityThreshold !== undefined) config.similarityThreshold = similarityThreshold;
    if (maxContextChunks !== undefined) config.maxContextChunks = maxContextChunks;
    if (enabledTools !== undefined) config.enabledTools = enabledTools;
    if (humanHandoff !== undefined) config.humanHandoff = { ...config.humanHandoff.toObject(), ...humanHandoff };
    if (modelName !== undefined) config.modelName = modelName;
    if (openAiApiKey !== undefined && openAiApiKey !== '') {
      config.openAiApiKey = openAiApiKey.trim();
    }

    await config.save();

    res.json({ success: true, message: 'Agent configuration updated successfully', config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Interactive preview chat test in Agent Settings
router.post('/test-preview', async (req, res) => {
  try {
    const { message, sessionId = 'preview-session-test' } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // Find or create test conversation
    let conv = await Conversation.findOne({
      workspaceId: req.workspaceId,
      sessionId,
    });

    if (!conv) {
      conv = await Conversation.create({
        workspaceId: req.workspaceId,
        sessionId,
        customer: {
          name: 'Preview Tester',
          email: 'tester@example.com',
          customerId: 'CUST-1001',
        },
        channel: 'dashboard',
        status: 'open',
        handlingMode: 'ai',
      });
    }

    // Record user message
    await Message.create({
      workspaceId: req.workspaceId,
      conversationId: conv._id,
      sender: 'customer',
      senderName: 'Preview Tester',
      content: message,
    });

    const aiResult = await processCustomerMessage({
      workspaceId: req.workspaceId,
      conversationId: conv._id,
      userMessage: message,
      userId: req.user._id,
    });

    res.json({
      success: true,
      result: aiResult,
    });
  } catch (error) {
    console.error('[Agent Test Preview Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
