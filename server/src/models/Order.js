import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      trim: true,
    },
    customerId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    products: [
      {
        productId: String,
        name: String,
        quantity: { type: Number, default: 1 },
        price: Number,
      },
    ],
    orderAmount: {
      type: Number,
      required: true,
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'processing',
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending', 'refunded', 'failed'],
      default: 'paid',
    },
    trackingNumber: {
      type: String,
      default: '',
    },
    shippingAddress: {
      type: String,
      default: '123 Market Street, San Francisco, CA 94105',
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    isCancellable: {
      type: Boolean,
      default: true,
    },
    isRefundable: {
      type: Boolean,
      default: true,
    },
    cancellationReason: {
      type: String,
    },
    refundReason: {
      type: String,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

orderSchema.index({ workspaceId: 1, orderId: 1 }, { unique: true });
orderSchema.index({ workspaceId: 1, customerId: 1 });

export default mongoose.model('Order', orderSchema);
