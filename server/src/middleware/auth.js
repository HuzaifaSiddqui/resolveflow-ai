import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';

const JWT_SECRET = process.env.JWT_SECRET || 'resolveflow_jwt_super_secret_key_2026';

export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    req.user = user;

    // Check workspace header or fallback to user.activeWorkspace
    const headerWorkspaceId = req.headers['x-workspace-id'];
    let workspaceId = headerWorkspaceId || user.activeWorkspace;

    if (workspaceId) {
      req.workspaceId = workspaceId.toString();
    }

    next();
  } catch (error) {
    console.error('[AuthMiddleware] Verification error:', error.message);
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

export const requireWorkspace = async (req, res, next) => {
  if (!req.workspaceId) {
    return res.status(400).json({ success: false, message: 'Workspace context is required' });
  }

  try {
    const workspace = await Workspace.findById(req.workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }
    req.workspace = workspace;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error verifying workspace access' });
  }
};

// Middleware for public web widget
export const verifyWidgetAccess = async (req, res, next) => {
  const { workspaceId } = req.params;
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!workspaceId) {
    return res.status(400).json({ success: false, message: 'Workspace ID is required' });
  }

  try {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Invalid workspace' });
    }

    req.workspaceId = workspace._id.toString();
    req.workspace = workspace;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to authenticate widget access' });
  }
};
