import express from 'express';
import Workflow from '../models/Workflow.js';
import WorkflowExecution from '../models/WorkflowExecution.js';
import { protect, requireWorkspace } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(requireWorkspace);

// List all workflows
router.get('/', async (req, res) => {
  try {
    const workflows = await Workflow.find({ workspaceId: req.workspaceId }).sort({ createdAt: -1 });
    res.json({ success: true, workflows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create workflow
router.post('/', async (req, res) => {
  try {
    const { name, description, trigger, conditions, actions, isActive = true } = req.body;

    if (!name || !trigger) {
      return res.status(400).json({ success: false, message: 'Workflow name and trigger are required' });
    }

    const workflow = await Workflow.create({
      workspaceId: req.workspaceId,
      name,
      description,
      trigger,
      conditions: conditions || [],
      actions: actions || [],
      isActive,
    });

    res.status(201).json({ success: true, workflow });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update workflow / toggle active
router.put('/:id', async (req, res) => {
  try {
    const workflow = await Workflow.findOne({
      _id: req.params.id,
      workspaceId: req.workspaceId,
    });

    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found' });
    }

    const { name, description, trigger, conditions, actions, isActive } = req.body;
    if (name !== undefined) workflow.name = name;
    if (description !== undefined) workflow.description = description;
    if (trigger !== undefined) workflow.trigger = trigger;
    if (conditions !== undefined) workflow.conditions = conditions;
    if (actions !== undefined) workflow.actions = actions;
    if (isActive !== undefined) workflow.isActive = isActive;

    await workflow.save();
    res.json({ success: true, workflow });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete workflow
router.delete('/:id', async (req, res) => {
  try {
    const workflow = await Workflow.findOneAndDelete({
      _id: req.params.id,
      workspaceId: req.workspaceId,
    });

    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found' });
    }

    res.json({ success: true, message: 'Workflow deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get workflow executions history
router.get('/executions', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const executions = await WorkflowExecution.find({ workspaceId: req.workspaceId })
      .sort({ executedAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, executions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
