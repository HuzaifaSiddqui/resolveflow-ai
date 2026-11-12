import mongoose from 'mongoose';

const workflowExecutionSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
      required: true,
      index: true,
    },
    workflowName: {
      type: String,
      required: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
    },
    trigger: {
      type: String,
      required: true,
    },
    input: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    output: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'skipped'],
      default: 'success',
    },
    executedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

workflowExecutionSchema.index({ workspaceId: 1, executedAt: -1 });

export default mongoose.model('WorkflowExecution', workflowExecutionSchema);
