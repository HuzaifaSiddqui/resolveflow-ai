import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    action: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
      required: true, // 'Order', 'Conversation', 'KnowledgeDocument', 'Workflow', 'Agent'
    },
    entityId: {
      type: String,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ workspaceId: 1, timestamp: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
