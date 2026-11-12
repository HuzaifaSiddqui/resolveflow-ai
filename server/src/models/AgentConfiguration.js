import mongoose from 'mongoose';

const agentConfigurationSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      unique: true,
      index: true,
    },
    agentName: {
      type: String,
      default: 'ResolveBot',
      trim: true,
    },
    personality: {
      type: String,
      default: 'Empathetic, clear, and professional customer service agent',
    },
    tone: {
      type: String,
      enum: ['Friendly', 'Professional', 'Concise', 'Empathetic'],
      default: 'Professional',
    },
    systemInstructions: {
      type: String,
      default: 'You are ResolveFlow AI support specialist. You answer customer inquiries using verified company knowledge. You can lookup customer accounts and order records, check cancellation/refund policies, and escalate to a human agent when needed. Never invent order details or policies. Always verify actions with tools.',
    },
    welcomeMessage: {
      type: String,
      default: 'Hi there! Welcome to customer support. How can I help you today?',
    },
    businessInfo: {
      type: String,
      default: 'Company: ResolveFlow Commerce Store. Free 30-day returns on delivered items. Standard shipping takes 3-5 business days. Cancellations allowed for pending or processing orders.',
    },
    supportedLanguages: {
      type: [String],
      default: ['English', 'Spanish', 'French'],
    },
    knowledgeBaseEnabled: {
      type: Boolean,
      default: true,
    },
    similarityThreshold: {
      type: Number,
      default: 0.65,
    },
    maxContextChunks: {
      type: Number,
      default: 4,
    },
    enabledTools: [
      {
        name: { type: String, required: true },
        enabled: { type: Boolean, default: true },
        description: { type: String },
      },
    ],
    humanHandoff: {
      autoEscalateKeywords: {
        type: [String],
        default: ['human', 'agent', 'representative', 'supervisor', 'complaint', 'lawyer', 'sue'],
      },
      confidenceThreshold: {
        type: Number,
        default: 0.5,
      },
      promptForHumanWhenUncertain: {
        type: Boolean,
        default: true,
      },
    },
    modelName: {
      type: String,
      default: 'gpt-4o-mini',
    },
    openAiApiKey: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.model('AgentConfiguration', agentConfigurationSchema);
