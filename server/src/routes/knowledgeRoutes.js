import express from 'express';
import multer from 'multer';
import KnowledgeDocument from '../models/KnowledgeDocument.js';
import KnowledgeChunk from '../models/KnowledgeChunk.js';
import AgentConfiguration from '../models/AgentConfiguration.js';
import AuditLog from '../models/AuditLog.js';
import { protect, requireWorkspace } from '../middleware/auth.js';
import {
  extractDocumentText,
  indexKnowledgeDocument,
  searchKnowledgeBase,
} from '../services/ragService.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

router.use(protect);
router.use(requireWorkspace);

// List all knowledge documents for current workspace
router.get('/documents', async (req, res) => {
  try {
    const documents = await KnowledgeDocument.find({ workspaceId: req.workspaceId })
      .sort({ createdAt: -1 });

    const totalChunks = await KnowledgeChunk.countDocuments({ workspaceId: req.workspaceId });

    res.json({
      success: true,
      documents,
      totalChunks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upload document (PDF / TXT)
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF or TXT file' });
    }

    const { originalname, mimetype, size, buffer } = req.file;
    const { category = 'General', title } = req.body;

    const docType = originalname.toLowerCase().endsWith('.pdf') ? 'pdf' : 'txt';
    const docTitle = title || originalname;

    // 1. Create document record
    const doc = await KnowledgeDocument.create({
      workspaceId: req.workspaceId,
      title: docTitle,
      type: docType,
      sourceFileName: originalname,
      fileSize: size,
      category,
      status: 'processing',
    });

    // 2. Extract text
    const extractedText = await extractDocumentText(buffer, mimetype, originalname);

    if (!extractedText || !extractedText.trim()) {
      doc.status = 'failed';
      doc.errorMessage = 'No extractable text found in uploaded file';
      await doc.save();
      return res.status(400).json({ success: false, message: 'No extractable text found in file' });
    }

    // 3. Get API key from agent config or env
    const agentConfig = await AgentConfiguration.findOne({ workspaceId: req.workspaceId });
    const apiKey = agentConfig?.openAiApiKey || process.env.OPENAI_API_KEY;

    // 4. Index in background/sync
    const result = await indexKnowledgeDocument({
      documentId: doc._id,
      workspaceId: req.workspaceId,
      rawText: extractedText,
      apiKey,
    });

    await AuditLog.create({
      workspaceId: req.workspaceId,
      userId: req.user._id,
      action: 'DOCUMENT_UPLOADED',
      entityType: 'KnowledgeDocument',
      entityId: doc._id.toString(),
      details: { title: doc.title, type: doc.type, chunkCount: result.chunkCount },
    });

    const updatedDoc = await KnowledgeDocument.findById(doc._id);

    res.status(201).json({
      success: true,
      message: `Document indexed successfully into ${result.chunkCount} knowledge chunks`,
      document: updatedDoc,
    });
  } catch (error) {
    console.error('[Knowledge Upload Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add manual knowledge article or FAQ
router.post('/manual', async (req, res) => {
  try {
    const { title, content, type = 'manual', category = 'General' } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const doc = await KnowledgeDocument.create({
      workspaceId: req.workspaceId,
      title,
      type, // 'faq' or 'manual'
      category,
      fileSize: Buffer.byteLength(content, 'utf8'),
      status: 'processing',
    });

    const agentConfig = await AgentConfiguration.findOne({ workspaceId: req.workspaceId });
    const apiKey = agentConfig?.openAiApiKey || process.env.OPENAI_API_KEY;

    const result = await indexKnowledgeDocument({
      documentId: doc._id,
      workspaceId: req.workspaceId,
      rawText: content,
      apiKey,
    });

    await AuditLog.create({
      workspaceId: req.workspaceId,
      userId: req.user._id,
      action: 'MANUAL_ARTICLE_CREATED',
      entityType: 'KnowledgeDocument',
      entityId: doc._id.toString(),
      details: { title, type, chunkCount: result.chunkCount },
    });

    const updatedDoc = await KnowledgeDocument.findById(doc._id);

    res.status(201).json({
      success: true,
      message: `Knowledge article added and indexed (${result.chunkCount} chunks)`,
      document: updatedDoc,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete knowledge document
router.delete('/documents/:id', async (req, res) => {
  try {
    const doc = await KnowledgeDocument.findOne({
      _id: req.params.id,
      workspaceId: req.workspaceId,
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    await KnowledgeChunk.deleteMany({ documentId: doc._id, workspaceId: req.workspaceId });
    await KnowledgeDocument.findByIdAndDelete(doc._id);

    await AuditLog.create({
      workspaceId: req.workspaceId,
      userId: req.user._id,
      action: 'DOCUMENT_DELETED',
      entityType: 'KnowledgeDocument',
      entityId: doc._id.toString(),
      details: { title: doc.title },
    });

    res.json({ success: true, message: 'Document and its chunks deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Test semantic retrieval search
router.post('/search', async (req, res) => {
  try {
    const { query, limit = 4, threshold = 0.3 } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const agentConfig = await AgentConfiguration.findOne({ workspaceId: req.workspaceId });
    const apiKey = agentConfig?.openAiApiKey || process.env.OPENAI_API_KEY;

    const results = await searchKnowledgeBase({
      workspaceId: req.workspaceId,
      query,
      limit: Number(limit),
      threshold: Number(threshold),
      apiKey,
    });

    res.json({
      success: true,
      query,
      count: results.length,
      results,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Statistics
router.get('/stats', async (req, res) => {
  try {
    const totalDocs = await KnowledgeDocument.countDocuments({ workspaceId: req.workspaceId });
    const totalChunks = await KnowledgeChunk.countDocuments({ workspaceId: req.workspaceId });
    const indexedDocs = await KnowledgeDocument.countDocuments({ workspaceId: req.workspaceId, status: 'indexed' });

    res.json({
      success: true,
      stats: {
        totalDocs,
        totalChunks,
        indexedDocs,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
