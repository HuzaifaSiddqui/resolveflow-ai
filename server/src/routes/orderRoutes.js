import express from 'express';
import Order from '../models/Order.js';
import Customer from '../models/Customer.js';
import AuditLog from '../models/AuditLog.js';
import { protect, requireWorkspace } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(requireWorkspace);

// List orders with filtering
router.get('/', async (req, res) => {
  try {
    const { orderStatus, paymentStatus, search, page = 1, limit = 50 } = req.query;
    const filter = { workspaceId: req.workspaceId };

    if (orderStatus && orderStatus !== 'all') {
      filter.orderStatus = orderStatus;
    }

    if (paymentStatus && paymentStatus !== 'all') {
      filter.paymentStatus = paymentStatus;
    }

    if (search) {
      filter.$or = [
        { orderId: new RegExp(search, 'i') },
        { customerName: new RegExp(search, 'i') },
        { customerEmail: new RegExp(search, 'i') },
        { customerId: new RegExp(search, 'i') },
        { trackingNumber: new RegExp(search, 'i') },
      ];
    }

    const orders = await Order.find(filter)
      .sort({ orderDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      orders,
      total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      workspaceId: req.workspaceId,
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Manual Cancel Order
router.post('/:id/cancel', async (req, res) => {
  try {
    const { reason = 'Cancelled by support representative' } = req.body;
    const order = await Order.findOne({
      _id: req.params.id,
      workspaceId: req.workspaceId,
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!['pending', 'processing'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status "${order.orderStatus}". Only pending or processing orders can be cancelled.`,
      });
    }

    order.orderStatus = 'cancelled';
    order.cancellationReason = reason;
    await order.save();

    await AuditLog.create({
      workspaceId: req.workspaceId,
      userId: req.user._id,
      action: 'ORDER_CANCELLED_MANUALLY',
      entityType: 'Order',
      entityId: order.orderId,
      details: { orderId: order.orderId, reason },
    });

    res.json({ success: true, message: `Order ${order.orderId} cancelled`, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Manual Demo Refund
router.post('/:id/refund', async (req, res) => {
  try {
    const { amount, reason = 'Refund issued by support representative' } = req.body;
    const order = await Order.findOne({
      _id: req.params.id,
      workspaceId: req.workspaceId,
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatus === 'refunded') {
      return res.status(400).json({ success: false, message: 'Order is already refunded' });
    }

    const refundAmt = amount ? Math.min(Number(amount), order.orderAmount) : order.orderAmount;

    order.paymentStatus = 'refunded';
    order.refundAmount = refundAmt;
    order.refundReason = reason;
    await order.save();

    await AuditLog.create({
      workspaceId: req.workspaceId,
      userId: req.user._id,
      action: 'REFUND_ISSUED_MANUALLY',
      entityType: 'Order',
      entityId: order.orderId,
      details: { orderId: order.orderId, refundAmount: refundAmt, reason },
    });

    res.json({ success: true, message: `Refund of $${refundAmt.toFixed(2)} processed`, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new demo order
router.post('/', async (req, res) => {
  try {
    const { customerId, customerName, customerEmail, products, orderAmount, shippingAddress } = req.body;

    const ordId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);

    const order = await Order.create({
      workspaceId: req.workspaceId,
      orderId: ordId,
      customerId: customerId || 'CUST-1001',
      customerName: customerName || 'Valued Customer',
      customerEmail: customerEmail || 'customer@example.com',
      products: products || [{ productId: 'PROD-1', name: 'Wireless Headphones', quantity: 1, price: 99.99 }],
      orderAmount: orderAmount || 99.99,
      shippingAddress: shippingAddress || '123 Market St, San Francisco, CA',
      trackingNumber: 'TRK-' + Math.floor(100000 + Math.random() * 900000),
    });

    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
