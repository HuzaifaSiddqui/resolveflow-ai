import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    customer: {
      customerId: { type: String, default: '' },
      name: { type: String, default: 'Guest Visitor' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    channel: {
      type: String,
      enum: ['widget', 'dashboard', 'api'],
      default: 'widget',
    },
    status: {
      type: String,
      enum: ['open', 'resolved', 'escalated'],
      default: 'open',
      index: true,
    },
    handlingMode: {
      type: String,
      enum: ['ai', 'human'],
      default: 'ai',
      index: true,
    },
    assignedAgent: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String },
    },
    summary: {
      type: String,
      default: '',
    },
    escalationReason: {
      type: String,
      default: '',
    },
    lastMessage: {
      type: String,
      default: '',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

conversationSchema.index({ workspaceId: 1, status: 1 });
conversationSchema.index({ workspaceId: 1, lastMessageAt: -1 });

export default mongoose.model('Conversation', conversationSchema);
