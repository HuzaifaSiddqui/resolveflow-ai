import mongoose from 'mongoose';

const knowledgeDocumentSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['pdf', 'txt', 'faq', 'manual'],
      required: true,
    },
    sourceFileName: {
      type: String,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    characterCount: {
      type: Number,
      default: 0,
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      default: 'General',
    },
    status: {
      type: String,
      enum: ['processing', 'indexed', 'failed'],
      default: 'processing',
    },
    errorMessage: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model('KnowledgeDocument', knowledgeDocumentSchema);
