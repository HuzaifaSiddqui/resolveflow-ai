import mongoose from 'mongoose';

const workflowSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    trigger: {
      type: String,
      enum: ['order_inquiry', 'refund_request', 'human_escalation', 'negative_sentiment', 'custom_keyword'],
      required: true,
    },
    conditions: [
      {
        field: { type: String, default: 'message' },
        operator: { type: String, enum: ['contains', 'equals', 'starts_with', 'sentiment_is'], default: 'contains' },
        value: { type: String, default: '' },
      },
    ],
    actions: [
      {
        actionType: {
          type: String,
          enum: ['lookup_order', 'check_refund_eligibility', 'escalate_conversation', 'flag_sentiment', 'send_auto_message'],
          required: true,
        },
        payload: {
          type: mongoose.Schema.Types.Mixed,
          default: {},
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    executionCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

workflowSchema.index({ workspaceId: 1, isActive: 1 });

export default mongoose.model('Workflow', workflowSchema);
