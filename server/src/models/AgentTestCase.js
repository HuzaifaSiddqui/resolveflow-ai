import mongoose from 'mongoose';

const agentTestCaseSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    testName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Knowledge Q&A', 'Order Lookup', 'Cancellation', 'Refund', 'Human Escalation', 'Edge Case'],
      default: 'Knowledge Q&A',
    },
    customerQuestion: {
      type: String,
      required: true,
    },
    expectedBehavior: {
      type: String,
      required: true,
    },
    expectedTool: {
      type: String,
      default: 'none',
    },
    actualResponse: {
      type: String,
      default: '',
    },
    actualToolUsed: {
      type: String,
      default: 'none',
    },
    retrievedSources: [
      {
        documentTitle: String,
        score: Number,
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'passed', 'failed'],
      default: 'pending',
    },
    lastRunAt: {
      type: Date,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

agentTestCaseSchema.index({ workspaceId: 1, category: 1 });

export default mongoose.model('AgentTestCase', agentTestCaseSchema);
