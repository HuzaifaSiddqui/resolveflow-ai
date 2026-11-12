import mongoose from 'mongoose';
import crypto from 'crypto';

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    settings: {
      supportEmail: { type: String, default: 'support@example.com' },
      businessHours: { type: String, default: '9:00 AM - 6:00 PM EST, Mon-Fri' },
      timezone: { type: String, default: 'America/New_York' },
      websiteUrl: { type: String, default: 'https://example.com' },
      primaryColor: { type: String, default: '#4f46e5' },
      greetingMessage: { type: String, default: 'Hello! How can our AI assistant help you today?' },
    },
    apiKey: {
      type: String,
      unique: true,
      default: () => 'rf_pub_' + crypto.randomBytes(16).toString('hex'),
    },
  },
  { timestamps: true }
);

export default mongoose.model('Workspace', workspaceSchema);
