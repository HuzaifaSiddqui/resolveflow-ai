import express from 'express';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import AuditLog from '../models/AuditLog.js';
import { protect, requireWorkspace } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(requireWorkspace);

// List conversations with filters and search
router.get('/', async (req, res) => {
  try {
    const { status, handlingMode, search, page = 1, limit = 50 } = req.query;

    const filter = { workspaceId: req.workspaceId };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (handlingMode && handlingMode !== 'all') {
      filter.handlingMode = handlingMode;
    }

    if (search) {
      filter.$or = [
        { sessionId: new RegExp(search, 'i') },
        { 'customer.name': new RegExp(search, 'i') },
        { 'customer.email': new RegExp(search, 'i') },
        { 'customer.customerId': new RegExp(search, 'i') },
        { lastMessage: new RegExp(search, 'i') },
      ];
    }

    const conversations = await Conversation.find(filter)
      .sort({ lastMessageAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Conversation.countDocuments(filter);

    // Counts for sidebar badges
    const openCount = await Conversation.countDocuments({ workspaceId: req.workspaceId, status: 'open' });
    const escalatedCount = await Conversation.countDocuments({ workspaceId: req.workspaceId, status: 'escalated' });
    const resolvedCount = await Conversation.countDocuments({ workspaceId: req.workspaceId, status: 'resolved' });

    res.json({
      success: true,
      conversations,
      total,
      counts: {
        open: openCount,
        escalated: escalatedCount,
        resolved: resolvedCount,
        all: total,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get conversation details & full message history
router.get('/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      workspaceId: req.workspaceId,
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const messages = await Message.find({
      conversationId: conversation._id,
      workspaceId: req.workspaceId,
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

// Human Agent sends a manual message
router.post('/:id/reply', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      workspaceId: req.workspaceId,
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const message = await Message.create({
      workspaceId: req.workspaceId,
      conversationId: conversation._id,
      sender: 'agent',
      senderName: req.user.name,
      content: content.trim(),
    });

    conversation.lastMessage = content.substring(0, 150);
    conversation.lastMessageAt = new Date();
    conversation.messageCount = (conversation.messageCount || 0) + 1;
    conversation.assignedAgent = {
      id: req.user._id,
      name: req.user.name,
    };
    await conversation.save();

    res.status(201).json({
      success: true,
      message,
      conversation,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update conversation status (open, resolved, escalated)
router.put('/:id/status', async (req, res) => {
  try {
    const { status, escalationReason } = req.body;
    if (!['open', 'resolved', 'escalated'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      workspaceId: req.workspaceId,
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const oldStatus = conversation.status;
    conversation.status = status;
    if (escalationReason) conversation.escalationReason = escalationReason;
    if (status === 'escalated') conversation.handlingMode = 'human';

    await conversation.save();

    await AuditLog.create({
      workspaceId: req.workspaceId,
      userId: req.user._id,
      action: 'CONVERSATION_STATUS_CHANGED',
      entityType: 'Conversation',
      entityId: conversation._id.toString(),
      details: { from: oldStatus, to: status },
    });

    res.json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Toggle handling mode: human take-over vs return to AI
router.put('/:id/mode', async (req, res) => {
  try {
    const { handlingMode } = req.body; // 'ai' or 'human'
    if (!['ai', 'human'].includes(handlingMode)) {
      return res.status(400).json({ success: false, message: 'Invalid handling mode' });
    }

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      workspaceId: req.workspaceId,
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    conversation.handlingMode = handlingMode;
    if (handlingMode === 'ai' && conversation.status === 'escalated') {
      conversation.status = 'open';
    }
    if (handlingMode === 'human') {
      conversation.assignedAgent = {
        id: req.user._id,
        name: req.user.name,
      };
    }

    await conversation.save();

    // Add a system note
    await Message.create({
      workspaceId: req.workspaceId,
      conversationId: conversation._id,
      sender: 'system',
      senderName: 'System',
      content: handlingMode === 'human'
        ? `Support agent ${req.user.name} took over this conversation.`
        : `Control returned to AI Agent.`,
    });

    res.json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete conversation
router.delete('/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      workspaceId: req.workspaceId,
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    await Message.deleteMany({ conversationId: conversation._id });

    res.json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
