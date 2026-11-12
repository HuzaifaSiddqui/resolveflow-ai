import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import knowledgeRoutes from './routes/knowledgeRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import workflowRoutes from './routes/workflowRoutes.js';
import testCaseRoutes from './routes/testCaseRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import widgetRoutes from './routes/widgetRoutes.js';
import { seedDatabase } from './seed.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-workspace-id', 'x-api-key'],
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'ResolveFlow AI',
    timestamp: new Date().toISOString(),
    aiEngine: process.env.OPENAI_API_KEY ? 'OpenAI GPT-4o-mini' : 'Intelligent Local Tool Engine',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/test-cases', testCaseRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/widget', widgetRoutes);

// Serve Client Static Build if available
const clientDistPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]:', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server and Connect DB
const startServer = async () => {
  try {
    await connectDB();
    
    // Automatically check and seed if database is empty
    await seedDatabase(false);

    app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`🚀 ResolveFlow AI Server running on port ${PORT}`);
      console.log(`🌐 Web App: http://localhost:${PORT}`);
      console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
      console.log(`🤖 AI Engine: ${process.env.OPENAI_API_KEY ? 'OpenAI Live' : 'Intelligent Fallback Engine'}`);
      console.log(`=========================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
