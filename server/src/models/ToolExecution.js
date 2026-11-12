import mongoose from 'mongoose';

const toolExecutionSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      index: true,
    },
    toolName: {
      type: String,
      required: true,
      index: true,
    },
    inputParams: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      default: 'success',
      index: true,
    },
    executionTimeMs: {
      type: Number,
      default: 0,
    },
    executedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

toolExecutionSchema.index({ workspaceId: 1, executedAt: -1 });

export default mongoose.model('ToolExecution', toolExecutionSchema);
