import express from 'express';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import { protect, requireWorkspace } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(requireWorkspace);

// List customers with search
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const filter = { workspaceId: req.workspaceId };

    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { customerId: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
      ];
    }

    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Customer.countDocuments(filter);

    res.json({
      success: true,
      customers,
      total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Customer details + order history
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      workspaceId: req.workspaceId,
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const orders = await Order.find({
      workspaceId: req.workspaceId,
      customerId: customer.customerId,
    }).sort({ orderDate: -1 });

    res.json({
      success: true,
      customer,
      orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new customer
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, customerId, tags, notes } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const cId = customerId || 'CUST-' + Math.floor(1000 + Math.random() * 9000);

    const customer = await Customer.create({
      workspaceId: req.workspaceId,
      customerId: cId,
      name,
      email,
      phone,
      tags: tags || ['standard'],
      notes,
    });

    res.status(201).json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
