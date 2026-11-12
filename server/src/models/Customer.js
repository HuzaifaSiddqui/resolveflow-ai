import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    customerId: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: ['standard'],
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

customerSchema.index({ workspaceId: 1, customerId: 1 }, { unique: true });
customerSchema.index({ workspaceId: 1, email: 1 });

export default mongoose.model('Customer', customerSchema);
