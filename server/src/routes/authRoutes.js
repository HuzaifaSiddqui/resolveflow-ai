import express from 'express';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import AgentConfiguration from '../models/AgentConfiguration.js';
import { generateToken, protect } from '../middleware/auth.js';

const router = express.Router();

// Register new user and workspace
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, companyName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    const wsName = companyName || `${name.split(' ')[0]}'s Workspace`;
    const slug = wsName.toLowerCase().replace(/[^\w]/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);

    const workspace = await Workspace.create({
      name: wsName,
      slug,
      ownerId: user._id,
      settings: {
        supportEmail: email,
        businessHours: '9:00 AM - 6:00 PM EST, Mon-Fri',
      },
    });

    // Create default agent configuration
    await AgentConfiguration.create({
      workspaceId: workspace._id,
      agentName: 'ResolveBot',
      personality: 'Empathetic, clear, and professional customer service agent',
      businessInfo: `Company: ${wsName}. We offer 30-day returns and prompt customer assistance.`,
      enabledTools: [
        { name: 'search_knowledge_base', enabled: true, description: 'Search company knowledge and FAQs' },
        { name: 'find_customer', enabled: true, description: 'Lookup customer profile and contact details' },
        { name: 'get_order_details', enabled: true, description: 'Check order status, tracking, and items' },
        { name: 'cancel_order', enabled: true, description: 'Cancel pending or processing orders with confirmation' },
        { name: 'initiate_refund', enabled: true, description: 'Process demo refunds with confirmation' },
        { name: 'escalate_to_human_support', enabled: true, description: 'Transfer conversation to a human representative' },
      ],
    });

    user.activeWorkspace = workspace._id;
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        activeWorkspace: workspace._id,
      },
      workspace,
    });
  } catch (error) {
    console.error('[Auth Register Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    let workspace = null;
    if (user.activeWorkspace) {
      workspace = await Workspace.findById(user.activeWorkspace);
    }
    if (!workspace) {
      workspace = await Workspace.findOne({ ownerId: user._id });
      if (workspace) {
        user.activeWorkspace = workspace._id;
        await user.save();
      }
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        activeWorkspace: user.activeWorkspace,
      },
      workspace,
    });
  } catch (error) {
    console.error('[Auth Login Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Current User Profile
router.get('/me', protect, async (req, res) => {
  try {
    const workspaces = await Workspace.find({ ownerId: req.user._id });
    const currentWorkspace = await Workspace.findById(req.workspaceId || req.user.activeWorkspace);

    res.json({
      success: true,
      user: req.user,
      workspaces,
      currentWorkspace,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password;

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        activeWorkspace: user.activeWorkspace,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
