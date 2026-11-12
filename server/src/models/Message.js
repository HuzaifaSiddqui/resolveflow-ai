import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
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
      required: true,
      index: true,
    },
    sender: {
      type: String,
      enum: ['customer', 'ai', 'agent', 'system'],
      required: true,
    },
    senderName: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      required: true,
    },
    toolCalls: [
      {
        toolName: String,
        toolCallId: String,
        arguments: mongoose.Schema.Types.Mixed,
        result: mongoose.Schema.Types.Mixed,
        status: { type: String, default: 'success' },
      },
    ],
    sources: [
      {
        documentTitle: String,
        contentSnippet: String,
        score: Number,
      },
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.model('Message', messageSchema);
