import express from 'express';
import AgentTestCase from '../models/AgentTestCase.js';
import Conversation from '../models/Conversation.js';
import { protect, requireWorkspace } from '../middleware/auth.js';
import { processCustomerMessage } from '../services/aiAgentService.js';

const router = express.Router();

router.use(protect);
router.use(requireWorkspace);

// List test cases
router.get('/', async (req, res) => {
  try {
    const { category, status } = req.query;
    const filter = { workspaceId: req.workspaceId };

    if (category && category !== 'all') filter.category = category;
    if (status && status !== 'all') filter.status = status;

    const testCases = await AgentTestCase.find(filter).sort({ createdAt: -1 });

    const stats = {
      total: testCases.length,
      passed: testCases.filter((t) => t.status === 'passed').length,
      failed: testCases.filter((t) => t.status === 'failed').length,
      pending: testCases.filter((t) => t.status === 'pending').length,
    };

    res.json({ success: true, testCases, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create test case
router.post('/', async (req, res) => {
  try {
    const { testName, category, customerQuestion, expectedBehavior, expectedTool } = req.body;

    if (!testName || !customerQuestion || !expectedBehavior) {
      return res.status(400).json({
        success: false,
        message: 'Test name, customer question, and expected behavior are required',
      });
    }

    const testCase = await AgentTestCase.create({
      workspaceId: req.workspaceId,
      testName,
      category: category || 'Knowledge Q&A',
      customerQuestion,
      expectedBehavior,
      expectedTool: expectedTool || 'none',
      status: 'pending',
    });

    res.status(201).json({ success: true, testCase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Run a single test case through the AI Agent live
router.post('/:id/run', async (req, res) => {
  try {
    const testCase = await AgentTestCase.findOne({
      _id: req.params.id,
      workspaceId: req.workspaceId,
    });

    if (!testCase) {
      return res.status(404).json({ success: false, message: 'Test case not found' });
    }

    // Create an isolated evaluation conversation
    const testSessionId = `eval-${testCase._id}-${Date.now()}`;
    const testConv = await Conversation.create({
      workspaceId: req.workspaceId,
      sessionId: testSessionId,
      customer: {
        name: 'Evaluation Runner',
        email: 'eval@resolveflow.test',
        customerId: 'CUST-1001',
      },
      channel: 'dashboard',
      status: 'open',
      handlingMode: 'ai',
    });

    const aiResult = await processCustomerMessage({
      workspaceId: req.workspaceId,
      conversationId: testConv._id,
      userMessage: testCase.customerQuestion,
      userId: req.user._id,
    });

    // Extract tool used
    const toolUsed = aiResult.toolCalls && aiResult.toolCalls.length > 0
      ? aiResult.toolCalls[0].toolName
      : 'none';

    testCase.actualResponse = aiResult.reply;
    testCase.actualToolUsed = toolUsed;
    testCase.retrievedSources = (aiResult.sources || []).map((s) => ({
      documentTitle: s.documentTitle,
      score: s.score,
    }));
    testCase.lastRunAt = new Date();

    // Auto-evaluate based on tool match if expectedTool specified, otherwise leave for user or check keywords
    if (testCase.expectedTool && testCase.expectedTool !== 'none') {
      testCase.status = toolUsed === testCase.expectedTool ? 'passed' : 'failed';
    } else {
      // Check if actual response is meaningful (not error)
      testCase.status = aiResult.reply && aiResult.reply.length > 20 ? 'passed' : 'failed';
    }

    await testCase.save();

    // Clean up test conversation
    await Conversation.findByIdAndDelete(testConv._id);

    res.json({
      success: true,
      testCase,
      executionDetails: {
        toolCalls: aiResult.toolCalls,
        sources: aiResult.sources,
      },
    });
  } catch (error) {
    console.error('[Run Test Case Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Run all test cases in sequence
router.post('/run-all', async (req, res) => {
  try {
    const testCases = await AgentTestCase.find({ workspaceId: req.workspaceId });
    const results = [];

    for (const testCase of testCases) {
      try {
        const testSessionId = `eval-${testCase._id}-${Date.now()}`;
        const testConv = await Conversation.create({
          workspaceId: req.workspaceId,
          sessionId: testSessionId,
          customer: {
            name: 'Evaluation Runner',
            email: 'eval@resolveflow.test',
            customerId: 'CUST-1001',
          },
          channel: 'dashboard',
          status: 'open',
          handlingMode: 'ai',
        });

        const aiResult = await processCustomerMessage({
          workspaceId: req.workspaceId,
          conversationId: testConv._id,
          userMessage: testCase.customerQuestion,
          userId: req.user._id,
        });

        const toolUsed = aiResult.toolCalls && aiResult.toolCalls.length > 0
          ? aiResult.toolCalls[0].toolName
          : 'none';

        testCase.actualResponse = aiResult.reply;
        testCase.actualToolUsed = toolUsed;
        testCase.retrievedSources = (aiResult.sources || []).map((s) => ({
          documentTitle: s.documentTitle,
          score: s.score,
        }));
        testCase.lastRunAt = new Date();

        if (testCase.expectedTool && testCase.expectedTool !== 'none') {
          testCase.status = toolUsed === testCase.expectedTool ? 'passed' : 'failed';
        } else {
          testCase.status = aiResult.reply && aiResult.reply.length > 20 ? 'passed' : 'failed';
        }

        await testCase.save();
        await Conversation.findByIdAndDelete(testConv._id);
        results.push(testCase);
      } catch (err) {
        testCase.status = 'failed';
        testCase.actualResponse = `Error: ${err.message}`;
        await testCase.save();
        results.push(testCase);
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update test case status or notes manually
router.put('/:id', async (req, res) => {
  try {
    const { status, notes, testName, expectedBehavior, customerQuestion } = req.body;
    const testCase = await AgentTestCase.findOne({
      _id: req.params.id,
      workspaceId: req.workspaceId,
    });

    if (!testCase) {
      return res.status(404).json({ success: false, message: 'Test case not found' });
    }

    if (status) testCase.status = status;
    if (notes !== undefined) testCase.notes = notes;
    if (testName) testCase.testName = testName;
    if (expectedBehavior) testCase.expectedBehavior = expectedBehavior;
    if (customerQuestion) testCase.customerQuestion = customerQuestion;

    await testCase.save();
    res.json({ success: true, testCase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete test case
router.delete('/:id', async (req, res) => {
  try {
    await AgentTestCase.findOneAndDelete({
      _id: req.params.id,
      workspaceId: req.workspaceId,
    });
    res.json({ success: true, message: 'Test case deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
