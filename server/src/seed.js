import mongoose from 'mongoose';
import User from './models/User.js';
import Workspace from './models/Workspace.js';
import AgentConfiguration from './models/AgentConfiguration.js';
import KnowledgeDocument from './models/KnowledgeDocument.js';
import KnowledgeChunk from './models/KnowledgeChunk.js';
import Customer from './models/Customer.js';
import Order from './models/Order.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';
import Workflow from './models/Workflow.js';
import WorkflowExecution from './models/WorkflowExecution.js';
import AgentTestCase from './models/AgentTestCase.js';
import ToolExecution from './models/ToolExecution.js';
import AuditLog from './models/AuditLog.js';
import { indexKnowledgeDocument } from './services/ragService.js';
import { connectDB } from './config/db.js';

export const seedDatabase = async (force = false) => {
  try {
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0 && !force) {
      console.log('[Seed] Database already seeded. Skipping initial seed.');
      return;
    }

    if (force) {
      console.log('[Seed] Force seeding: clearing existing records...');
      await Promise.all([
        User.deleteMany({}),
        Workspace.deleteMany({}),
        AgentConfiguration.deleteMany({}),
        KnowledgeDocument.deleteMany({}),
        KnowledgeChunk.deleteMany({}),
        Customer.deleteMany({}),
        Order.deleteMany({}),
        Conversation.deleteMany({}),
        Message.deleteMany({}),
        Workflow.deleteMany({}),
        WorkflowExecution.deleteMany({}),
        AgentTestCase.deleteMany({}),
        ToolExecution.deleteMany({}),
        AuditLog.deleteMany({}),
      ]);
    }

    console.log('[Seed] Creating demo user...');
    const demoUser = await User.create({
      name: 'Alex Rivera',
      email: 'demo@resolveflow.ai',
      password: 'Password123!',
      role: 'owner',
    });

    console.log('[Seed] Creating demo workspace...');
    const workspace = await Workspace.create({
      name: 'NovaCommerce Direct',
      slug: 'novacommerce-direct',
      ownerId: demoUser._id,
      settings: {
        supportEmail: 'support@novacommerce.com',
        businessHours: '9:00 AM - 6:00 PM EST, Mon-Fri',
        timezone: 'America/New_York',
        websiteUrl: 'https://novacommerce.store',
        primaryColor: '#4f46e5',
        greetingMessage: 'Hello! I am ResolveBot, NovaCommerce support assistant. How can I help you today?',
      },
    });

    demoUser.activeWorkspace = workspace._id;
    await demoUser.save();

    console.log('[Seed] Creating Agent Configuration...');
    await AgentConfiguration.create({
      workspaceId: workspace._id,
      agentName: 'ResolveBot',
      personality: 'Helpful, concise, empathetic, and strictly factual support assistant',
      tone: 'Professional',
      systemInstructions: 'You are ResolveBot, the AI customer support specialist for NovaCommerce Direct. Answer inquiries accurately using company knowledge articles and available tools. For order issues, use get_order_details. Before cancelling or refunding an order, verify status and request user confirmation. If the customer is angry or requests a person, escalate to human support immediately.',
      welcomeMessage: 'Hello! I am ResolveBot from NovaCommerce Direct. How may I assist you with orders, returns, or questions today?',
      businessInfo: 'NovaCommerce Direct sells premium electronics, home gear, and lifestyle products. We offer 30-day hassle-free returns on delivered items and full cancellations before dispatch.',
      supportedLanguages: ['English', 'Spanish', 'French'],
      knowledgeBaseEnabled: true,
      similarityThreshold: 0.5,
      maxContextChunks: 4,
      enabledTools: [
        { name: 'search_knowledge_base', enabled: true, description: 'Search company policies and FAQs' },
        { name: 'find_customer', enabled: true, description: 'Look up customer account info and order list' },
        { name: 'get_order_details', enabled: true, description: 'Fetch order status, items, tracking and total' },
        { name: 'cancel_order', enabled: true, description: 'Cancel eligible orders with user confirmation' },
        { name: 'initiate_refund', enabled: true, description: 'Process demo refunds with user confirmation' },
        { name: 'escalate_to_human_support', enabled: true, description: 'Transfer session to human support queue' },
      ],
      humanHandoff: {
        autoEscalateKeywords: ['human', 'agent', 'representative', 'supervisor', 'lawyer', 'complaint'],
        confidenceThreshold: 0.55,
        promptForHumanWhenUncertain: true,
      },
      modelName: 'gpt-4o-mini',
    });

    console.log('[Seed] Seeding Knowledge Base Documents and Chunks...');
    const returnPolicyText = `NovaCommerce Return & Refund Policy (Updated 2026)
1. Eligibility: Customers can return most items within 30 days of the recorded delivery date. Items must be in original condition with all original packaging, tags, and accessories included.
2. Non-Returnable Items: Final sale products, personalized items, and gift cards cannot be returned or refunded unless received damaged or defective.
3. Return Shipping: We provide prepaid digital return labels for all domestic returns. A $5.99 restocking fee is deducted unless the return is due to our error or product defect.
4. Refund Processing Time: Once our warehouse inspects the returned item (usually within 2 business days of arrival), refunds are issued to the original payment method within 3 to 5 business days.
5. Exchanges: We do not offer direct exchanges. Please return your original purchase for a full refund and place a new order for the desired item.`;

    const shippingPolicyText = `NovaCommerce Shipping & Delivery Guidelines
1. Standard Domestic Shipping: Takes 3-5 business days. Free on all orders exceeding $50.00. For orders under $50.00, standard shipping is a flat rate of $6.95.
2. Express Priority Shipping: 1-2 business days delivery. Available at checkout for $14.99. Orders placed before 1:00 PM EST ship same-day.
3. Order Tracking: Tracking numbers are generated and emailed as soon as the carrier scans the parcel. You can track your package directly through our website or carrier portal.
4. Damaged or Lost Packages: If your shipment arrives damaged or is marked delivered but not found, notify our support team within 48 hours for immediate replacement or investigation.
5. International Shipping: We currently deliver to Canada, the United Kingdom, and the European Union. Delivery usually takes 7-14 business days.`;

    const warrantyPolicyText = `NovaCommerce 1-Year Limited Hardware Warranty
1. Coverage: All electronic devices, chargers, and smart home appliances sold by NovaCommerce Direct come with a 12-month manufacturer limited warranty covering hardware defects in materials and craftsmanship.
2. Exclusions: Cosmetic damage, drops, liquid immersion, unauthorized repairs, or normal wear and tear are not covered under standard warranty.
3. Warranty Claims: Contact support with your original Order ID and a brief description/photo of the issue. Our team will authorize repair or replacement unit shipment within 48 hours.`;

    const faqText = `Frequently Asked Questions (FAQ)
Q: How do I cancel an order?
A: You can cancel an order as long as it is still in "Pending" or "Processing" status. Once an order is "Shipped", it cannot be cancelled, but you can return it within 30 days of receipt.
Q: How do I change my shipping address?
A: Shipping addresses can only be updated if the order is still "Processing". Please contact our support team immediately with your Order ID and correct address.
Q: What payment methods do you accept?
A: We accept Visa, MasterCard, American Express, PayPal, Apple Pay, and Google Pay.
Q: How do I contact a human representative?
A: Simply say "connect me to a human" or "talk to an agent" in this chat, or email support@novacommerce.com during business hours (9:00 AM - 6:00 PM EST).`;

    const doc1 = await KnowledgeDocument.create({
      workspaceId: workspace._id,
      title: 'Return and Refund Policy',
      type: 'manual',
      category: 'Returns',
      status: 'processing',
    });
    await indexKnowledgeDocument({ documentId: doc1._id, workspaceId: workspace._id, rawText: returnPolicyText });

    const doc2 = await KnowledgeDocument.create({
      workspaceId: workspace._id,
      title: 'Shipping and Delivery Guidelines',
      type: 'manual',
      category: 'Shipping',
      status: 'processing',
    });
    await indexKnowledgeDocument({ documentId: doc2._id, workspaceId: workspace._id, rawText: shippingPolicyText });

    const doc3 = await KnowledgeDocument.create({
      workspaceId: workspace._id,
      title: 'Hardware Warranty Terms',
      type: 'manual',
      category: 'Warranty',
      status: 'processing',
    });
    await indexKnowledgeDocument({ documentId: doc3._id, workspaceId: workspace._id, rawText: warrantyPolicyText });

    const doc4 = await KnowledgeDocument.create({
      workspaceId: workspace._id,
      title: 'Customer Support FAQ',
      type: 'faq',
      category: 'FAQ',
      status: 'processing',
    });
    await indexKnowledgeDocument({ documentId: doc4._id, workspaceId: workspace._id, rawText: faqText });

    console.log('[Seed] Seeding Customers...');
    const customers = await Customer.insertMany([
      {
        workspaceId: workspace._id,
        customerId: 'CUST-1001',
        name: 'Sarah Jenkins',
        email: 'sarah.j@example.com',
        phone: '+1 (555) 234-5678',
        tags: ['VIP', 'Repeat Buyer'],
        totalOrders: 3,
        totalSpent: 429.98,
        notes: 'Preferred customer, prefers quick concise answers.',
      },
      {
        workspaceId: workspace._id,
        customerId: 'CUST-1002',
        name: 'Michael Chen',
        email: 'm.chen@example.com',
        phone: '+1 (555) 876-5432',
        tags: ['Standard'],
        totalOrders: 2,
        totalSpent: 189.50,
      },
      {
        workspaceId: workspace._id,
        customerId: 'CUST-1003',
        name: 'Emily Rodriguez',
        email: 'emily.r@example.com',
        phone: '+1 (555) 432-1098',
        tags: ['New Customer'],
        totalOrders: 1,
        totalSpent: 89.00,
      },
      {
        workspaceId: workspace._id,
        customerId: 'CUST-1004',
        name: 'David Kim',
        email: 'david.kim@example.com',
        phone: '+1 (555) 998-1122',
        tags: ['High Value'],
        totalOrders: 5,
        totalSpent: 1240.00,
      },
    ]);

    console.log('[Seed] Seeding Orders...');
    const orders = await Order.insertMany([
      {
        workspaceId: workspace._id,
        orderId: 'ORD-1001',
        customerId: 'CUST-1001',
        customerName: 'Sarah Jenkins',
        customerEmail: 'sarah.j@example.com',
        products: [
          { productId: 'P-101', name: 'SonicBreeze Wireless ANC Headphones', quantity: 1, price: 129.99 },
        ],
        orderAmount: 129.99,
        orderStatus: 'processing',
        paymentStatus: 'paid',
        shippingAddress: '742 Evergreen Terrace, Springfield, OR 97477',
        trackingNumber: 'TRK-992100',
        orderDate: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
        isCancellable: true,
        isRefundable: false,
      },
      {
        workspaceId: workspace._id,
        orderId: 'ORD-1002',
        customerId: 'CUST-1001',
        customerName: 'Sarah Jenkins',
        customerEmail: 'sarah.j@example.com',
        products: [
          { productId: 'P-104', name: 'Lumina Smart Desk Lamp Pro', quantity: 1, price: 89.99 },
          { productId: 'P-109', name: 'ErgoComfort Gel Wrist Rest', quantity: 2, price: 24.99 },
        ],
        orderAmount: 139.97,
        orderStatus: 'delivered',
        paymentStatus: 'paid',
        shippingAddress: '742 Evergreen Terrace, Springfield, OR 97477',
        trackingNumber: 'TRK-774431',
        orderDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6), // 6 days ago
        isCancellable: false,
        isRefundable: true,
      },
      {
        workspaceId: workspace._id,
        orderId: 'ORD-1003',
        customerId: 'CUST-1002',
        customerName: 'Michael Chen',
        customerEmail: 'm.chen@example.com',
        products: [
          { productId: 'P-202', name: 'AeroCharge 65W GaN Travel Charger', quantity: 1, price: 49.99 },
        ],
        orderAmount: 49.99,
        orderStatus: 'shipped',
        paymentStatus: 'paid',
        shippingAddress: '456 Mission St, Apt 4B, San Francisco, CA 94105',
        trackingNumber: 'TRK-FEDEX-488210',
        orderDate: new Date(Date.now() - 1000 * 60 * 60 * 36),
        isCancellable: false,
        isRefundable: false,
      },
      {
        workspaceId: workspace._id,
        orderId: 'ORD-1004',
        customerId: 'CUST-1003',
        customerName: 'Emily Rodriguez',
        customerEmail: 'emily.r@example.com',
        products: [
          { productId: 'P-301', name: 'HydroGrip Insulated Steel Bottle 32oz', quantity: 2, price: 34.50 },
        ],
        orderAmount: 69.00,
        orderStatus: 'delivered',
        paymentStatus: 'paid',
        shippingAddress: '1840 Elmwood Ave, Austin, TX 78704',
        trackingNumber: 'TRK-UPS-199402',
        orderDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
        isCancellable: false,
        isRefundable: true,
      },
      {
        workspaceId: workspace._id,
        orderId: 'ORD-1005',
        customerId: 'CUST-1004',
        customerName: 'David Kim',
        customerEmail: 'david.kim@example.com',
        products: [
          { productId: 'P-405', name: 'ProCam 4K Dual Gimbal Action Camera', quantity: 1, price: 349.00 },
        ],
        orderAmount: 349.00,
        orderStatus: 'cancelled',
        paymentStatus: 'refunded',
        refundAmount: 349.00,
        cancellationReason: 'Customer requested cancellation prior to dispatch',
        refundReason: 'Order cancelled before shipment',
        shippingAddress: '880 Pine Ridge Rd, Seattle, WA 98101',
        orderDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        isCancellable: false,
        isRefundable: false,
      },
    ]);

    console.log('[Seed] Seeding Workflows...');
    await Workflow.insertMany([
      {
        workspaceId: workspace._id,
        name: 'Order Status Auto-Lookup',
        description: 'Detects when a customer inquires about shipment, tracking, or order status and activates order lookup',
        trigger: 'order_inquiry',
        conditions: [{ field: 'message', operator: 'contains', value: 'order' }],
        actions: [{ actionType: 'lookup_order', payload: { autoPrompt: true } }],
        isActive: true,
        executionCount: 14,
      },
      {
        workspaceId: workspace._id,
        name: 'Refund Eligibility Guard',
        description: 'Ensures confirmation is required and checks 30-day window when a customer asks for a refund',
        trigger: 'refund_request',
        conditions: [{ field: 'message', operator: 'contains', value: 'refund' }],
        actions: [{ actionType: 'check_refund_eligibility', payload: { requireConfirmation: true } }],
        isActive: true,
        executionCount: 8,
      },
      {
        workspaceId: workspace._id,
        name: 'Immediate Human Escalation',
        description: 'Routes conversations to the human support queue when customer asks for a human agent',
        trigger: 'human_escalation',
        conditions: [{ field: 'message', operator: 'contains', value: 'human' }],
        actions: [{ actionType: 'escalate_conversation', payload: { priority: 'high' } }],
        isActive: true,
        executionCount: 6,
      },
      {
        workspaceId: workspace._id,
        name: 'Negative Sentiment Escalation',
        description: 'Flags angry or dissatisfied customer messages for immediate human review',
        trigger: 'negative_sentiment',
        conditions: [{ field: 'message', operator: 'contains', value: 'terrible' }],
        actions: [
          { actionType: 'flag_sentiment', payload: { sentiment: 'negative' } },
          { actionType: 'escalate_conversation', payload: { priority: 'urgent' } },
        ],
        isActive: true,
        executionCount: 3,
      },
    ]);

    console.log('[Seed] Seeding Conversations and Messages...');
    const conv1 = await Conversation.create({
      workspaceId: workspace._id,
      sessionId: 'sess_live_sarah_1001',
      customer: {
        customerId: 'CUST-1001',
        name: 'Sarah Jenkins',
        email: 'sarah.j@example.com',
        phone: '+1 (555) 234-5678',
      },
      channel: 'widget',
      status: 'open',
      handlingMode: 'ai',
      lastMessage: 'Can you check if my order ORD-1001 is on its way?',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 15),
      messageCount: 3,
    });

    await Message.create({
      workspaceId: workspace._id,
      conversationId: conv1._id,
      sender: 'customer',
      senderName: 'Sarah Jenkins',
      content: 'Hi! Can you check the status of my order ORD-1001?',
      createdAt: new Date(Date.now() - 1000 * 60 * 16),
    });

    await Message.create({
      workspaceId: workspace._id,
      conversationId: conv1._id,
      sender: 'ai',
      senderName: 'ResolveBot',
      content: 'Here are the details for Order **ORD-1001**:\n- **Status:** PROCESSING\n- **Total Amount:** $129.99\n- **Payment:** paid\n- **Tracking:** TRK-992100\n- **Items:** 1x SonicBreeze Wireless ANC Headphones ($129.99)\n- **Delivery Address:** 742 Evergreen Terrace, Springfield, OR 97477\n\nYour order is currently being prepared at our fulfillment center and is scheduled to ship today.',
      toolCalls: [
        {
          toolName: 'get_order_details',
          toolCallId: 'call_ord_1001_seed',
          arguments: { orderId: 'ORD-1001' },
          result: { success: true, orderId: 'ORD-1001', orderStatus: 'processing' },
          status: 'success',
        },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 15),
    });

    const conv2 = await Conversation.create({
      workspaceId: workspace._id,
      sessionId: 'sess_live_mchen_1002',
      customer: {
        customerId: 'CUST-1002',
        name: 'Michael Chen',
        email: 'm.chen@example.com',
        phone: '+1 (555) 876-5432',
      },
      channel: 'widget',
      status: 'escalated',
      handlingMode: 'human',
      escalationReason: 'Customer requested human agent for custom invoice request',
      lastMessage: 'I need to speak with a human support representative regarding a tax invoice.',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 45),
      messageCount: 2,
    });

    await Message.create({
      workspaceId: workspace._id,
      conversationId: conv2._id,
      sender: 'customer',
      senderName: 'Michael Chen',
      content: 'I need to speak with a human support representative regarding a tax invoice.',
      createdAt: new Date(Date.now() - 1000 * 60 * 46),
    });

    await Message.create({
      workspaceId: workspace._id,
      conversationId: conv2._id,
      sender: 'ai',
      senderName: 'ResolveBot',
      content: 'I have transferred your conversation to our human support team. A representative will review your request and reply directly in this chat shortly.',
      toolCalls: [
        {
          toolName: 'escalate_to_human_support',
          toolCallId: 'call_escalate_seed',
          arguments: { reason: 'Customer requested human support representative' },
          result: { success: true, status: 'escalated' },
          status: 'success',
        },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 45),
    });

    const conv3 = await Conversation.create({
      workspaceId: workspace._id,
      sessionId: 'sess_live_emily_1003',
      customer: {
        customerId: 'CUST-1003',
        name: 'Emily Rodriguez',
        email: 'emily.r@example.com',
      },
      channel: 'widget',
      status: 'resolved',
      handlingMode: 'ai',
      lastMessage: 'Thank you so much, that answers my question!',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 120),
      messageCount: 4,
    });

    await Message.create({
      workspaceId: workspace._id,
      conversationId: conv3._id,
      sender: 'customer',
      senderName: 'Emily Rodriguez',
      content: 'What is your return policy for delivered items?',
      createdAt: new Date(Date.now() - 1000 * 60 * 125),
    });

    await Message.create({
      workspaceId: workspace._id,
      conversationId: conv3._id,
      sender: 'ai',
      senderName: 'ResolveBot',
      content: 'Based on our company policy (Return and Refund Policy):\n\nCustomers can return most items within 30 days of the recorded delivery date in original condition with packaging. We provide prepaid digital return labels for domestic returns.\n\nDoes this help with what you needed?',
      sources: [
        {
          documentTitle: 'Return and Refund Policy',
          contentSnippet: 'Customers can return most items within 30 days of the recorded delivery date...',
          score: 0.92,
        },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 124),
    });

    console.log('[Seed] Seeding AI Agent Test Cases...');
    await AgentTestCase.insertMany([
      {
        workspaceId: workspace._id,
        testName: 'Return Window Policy Query',
        category: 'Knowledge Q&A',
        customerQuestion: 'How many days do I have to return an item after delivery?',
        expectedBehavior: 'State that customers have a 30-day return window from the delivery date with prepaid return labels.',
        expectedTool: 'search_knowledge_base',
        actualResponse: 'Based on our company policy (Return and Refund Policy): Customers can return most items within 30 days of the recorded delivery date in original condition.',
        actualToolUsed: 'search_knowledge_base',
        status: 'passed',
        lastRunAt: new Date(),
      },
      {
        workspaceId: workspace._id,
        testName: 'Order Details Lookup',
        category: 'Order Lookup',
        customerQuestion: 'Can you check status and tracking for order ORD-1001?',
        expectedBehavior: 'Retrieve order ORD-1001 details from the backend and display status as PROCESSING with items and total.',
        expectedTool: 'get_order_details',
        actualResponse: 'Here are the details for Order ORD-1001: Status: PROCESSING, Total Amount: $129.99, Items: 1x SonicBreeze Wireless ANC Headphones.',
        actualToolUsed: 'get_order_details',
        status: 'passed',
        lastRunAt: new Date(),
      },
      {
        workspaceId: workspace._id,
        testName: 'Cancellation Confirmation Guard',
        category: 'Cancellation',
        customerQuestion: 'Please cancel my order ORD-1001.',
        expectedBehavior: 'Check eligibility for ORD-1001 and explicitly ask for customer confirmation before executing cancellation.',
        expectedTool: 'cancel_order',
        actualResponse: 'Order ORD-1001 (Total: $129.99) is eligible for cancellation. Please ask the customer to confirm: "Would you like me to proceed with cancelling order ORD-1001?"',
        actualToolUsed: 'cancel_order',
        status: 'passed',
        lastRunAt: new Date(),
      },
      {
        workspaceId: workspace._id,
        testName: 'Customer Profile Retrieval',
        category: 'Knowledge Q&A',
        customerQuestion: 'Can you find my customer account for sarah.j@example.com?',
        expectedBehavior: 'Retrieve customer Sarah Jenkins with account ID CUST-1001 and order history.',
        expectedTool: 'find_customer',
        actualResponse: 'Customer record located for Sarah Jenkins (sarah.j@example.com). Account ID: CUST-1001, Total Orders: 3, Total Spent: $429.98.',
        actualToolUsed: 'find_customer',
        status: 'passed',
        lastRunAt: new Date(),
      },
      {
        workspaceId: workspace._id,
        testName: 'Human Escalation on Request',
        category: 'Human Escalation',
        customerQuestion: 'I want to speak with a human agent right now.',
        expectedBehavior: 'Trigger escalate_to_human_support tool, change conversation status to escalated, and notify human support team.',
        expectedTool: 'escalate_to_human_support',
        actualResponse: 'I have transferred your conversation to our human support team. A representative will join and review your chat shortly.',
        actualToolUsed: 'escalate_to_human_support',
        status: 'passed',
        lastRunAt: new Date(),
      },
    ]);

    console.log('[Seed] Seeding Tool Executions & Audit Logs...');
    await ToolExecution.insertMany([
      {
        workspaceId: workspace._id,
        conversationId: conv1._id,
        toolName: 'get_order_details',
        inputParams: { orderId: 'ORD-1001' },
        result: { success: true, orderId: 'ORD-1001', status: 'processing' },
        status: 'success',
        executionTimeMs: 42,
      },
      {
        workspaceId: workspace._id,
        conversationId: conv2._id,
        toolName: 'escalate_to_human_support',
        inputParams: { reason: 'Customer requested human support representative' },
        result: { success: true, status: 'escalated' },
        status: 'success',
        executionTimeMs: 28,
      },
      {
        workspaceId: workspace._id,
        conversationId: conv3._id,
        toolName: 'search_knowledge_base',
        inputParams: { query: 'return policy' },
        result: { success: true, foundCount: 1 },
        status: 'success',
        executionTimeMs: 51,
      },
    ]);

    await AuditLog.insertMany([
      {
        workspaceId: workspace._id,
        userId: demoUser._id,
        action: 'WORKSPACE_INITIALIZED',
        entityType: 'Workspace',
        entityId: workspace._id.toString(),
        details: { name: workspace.name },
      },
      {
        workspaceId: workspace._id,
        userId: demoUser._id,
        action: 'KNOWLEDGE_BASE_SEEDED',
        entityType: 'KnowledgeDocument',
        entityId: doc1._id.toString(),
        details: { documentsCount: 4 },
      },
      {
        workspaceId: workspace._id,
        userId: demoUser._id,
        action: 'AGENT_CONFIGURED',
        entityType: 'Agent',
        entityId: 'ResolveBot',
        details: { toolsCount: 6, model: 'gpt-4o-mini' },
      },
    ]);

    console.log('✅ [Seed] Database seeding completed successfully!');
    console.log('--------------------------------------------------');
    console.log('Demo Account: demo@resolveflow.ai');
    console.log('Password:     Password123!');
    console.log('Workspace:    NovaCommerce Direct');
    console.log('--------------------------------------------------');
  } catch (error) {
    console.error('❌ [Seed Error]:', error);
  }
};

// Allow running directly from CLI: node src/seed.js --force
if (process.argv[1]?.endsWith('seed.js')) {
  const force = process.argv.includes('--force');
  connectDB().then(() => {
    seedDatabase(force).then(() => {
      console.log('[Seed] Finished. Exiting.');
      process.exit(0);
    });
  });
}
