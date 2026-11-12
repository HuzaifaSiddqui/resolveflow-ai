import express from 'express';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import AgentConfiguration from '../models/AgentConfiguration.js';
import { protect, requireWorkspace } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Get all workspaces for user
router.get('/', async (req, res) => {
  try {
    const workspaces = await Workspace.find({ ownerId: req.user._id });
    res.json({ success: true, workspaces });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new workspace
router.post('/', async (req, res) => {
  try {
    const { name, supportEmail, businessHours, timezone } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Workspace name is required' });
    }

    const slug = name.toLowerCase().replace(/[^\w]/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);

    const workspace = await Workspace.create({
      name,
      slug,
      ownerId: req.user._id,
      settings: {
        supportEmail: supportEmail || req.user.email,
        businessHours: businessHours || '9:00 AM - 6:00 PM EST, Mon-Fri',
        timezone: timezone || 'America/New_York',
      },
    });

    // Create default agent configuration for this new workspace
    await AgentConfiguration.create({
      workspaceId: workspace._id,
      agentName: 'ResolveBot',
      businessInfo: `Company: ${name}.`,
    });

    // Switch active workspace
    await User.findByIdAndUpdate(req.user._id, { activeWorkspace: workspace._id });

    res.status(201).json({ success: true, workspace });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current workspace details
router.get('/current', requireWorkspace, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.workspaceId);
    res.json({ success: true, workspace });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update current workspace settings
router.put('/current', requireWorkspace, async (req, res) => {
  try {
    const { name, settings } = req.body;
    const workspace = await Workspace.findById(req.workspaceId);

    if (name) workspace.name = name;
    if (settings) {
      workspace.settings = { ...workspace.settings.toObject(), ...settings };
    }

    await workspace.save();
    res.json({ success: true, workspace });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Switch active workspace
router.post('/switch/:workspaceId', async (req, res) => {
  try {
    const workspace = await Workspace.findOne({
      _id: req.params.workspaceId,
      ownerId: req.user._id,
    });

    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found or unauthorized' });
    }

    await User.findByIdAndUpdate(req.user._id, { activeWorkspace: workspace._id });
    res.json({ success: true, activeWorkspace: workspace._id, workspace });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
