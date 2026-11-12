# ResolveFlow AI – AI-Powered Customer Support SaaS Platform

**ResolveFlow AI** is a modern, full-stack B2B SaaS platform that enables businesses to deploy autonomous AI customer support agents. The agent understands company knowledge bases through **Retrieval-Augmented Generation (RAG)**, executes verified backend tools (order tracking, cancellations, demo refunds, customer lookup, and human escalation), enforces rule-based automation workflows, and provides an Intercom-style support inbox for human agent collaboration.

---

## 🌟 Key Highlights & Capabilities

1. **Multi-Tenant SaaS Architecture**:
   - Secure JWT authentication with bcrypt password hashing.
   - Complete workspace-level data isolation (`workspaceId` scoped models & queries).
   - Dynamic workspace creation and workspace switcher.

2. **RAG Knowledge Base Engine**:
   - Ingests **PDF documents**, **TXT files**, **FAQs**, and manual policy articles.
   - Text extraction using `pdf-parse` and overlapping chunking strategy.
   - Vector embeddings with application-level **cosine similarity search**.
   - Offline intelligent fallback vectorizer ensures zero-friction local development without mandatory external API credits.

3. **LangChain & OpenAI Agent with Strict Tool Calling**:
   - Executes real deterministic backend functions through structured tool calling.
   - **Never simulates or fabricates state changes**:
     - `search_knowledge_base`: Semantic vector retrieval of company policies.
     - `find_customer`: Retrieve customer profile and order history.
     - `get_order_details`: Real-time order status, tracking, and item details.
     - `cancel_order`: Business-rule validation (only `pending` / `processing`) with explicit confirmation guardrails.
     - `initiate_refund`: Demo refund validation (only `delivered` / `cancelled` & `paid`) with explicit confirmation requirement.
     - `escalate_to_human_support`: Live handoff to support team queue.

4. **Human Handoff & Customer Support Inbox**:
   - Centralized inbox inspired by Intercom, Linear, and Crisp.
   - Live status filters: **Open**, **Escalated**, **Resolved**.
   - Instant takeover mode (`handlingMode: 'human'`) which halts automatic AI responses.
   - Return control back to AI (`handlingMode: 'ai'`) at any point.

5. **Rule-Based Workflow Automation**:
   - Configurable declarative rules (e.g. Order Status, Refund Guard, Negative Sentiment, Human Escalation).
   - Evaluation engine with execution audit history.

6. **Testing Playground & Evaluation Benchmarking**:
   - Structured test case suite (`Knowledge Q&A`, `Order Lookup`, `Cancellation Guard`, `Human Escalation`).
   - One-click live test runner with pass/fail evaluation and retrieved sources inspection.

7. **Analytics & Monitoring Dashboard**:
   - Recharts visual charts (conversation trends, resolution distribution, tool usage breakdown).
   - Real-time monitoring of tool calls, latency, escalation reasons, and system audit logs.

8. **Omnichannel Embeddable Customer Chat Widget**:
   - Standalone customer storefront demo page (`/widget-demo`).
   - One-click copyable embed script (`<script src=".../widget.js" data-workspace-id="..." async></script>`).

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide Icons, Axios, React Router v6.
- **Backend**: Node.js (ES Modules), Express.js, Mongoose, Multer, `pdf-parse`.
- **Database**: MongoDB (Local or MongoDB Atlas).
- **AI Framework**: LangChain.js, OpenAI API (`gpt-4o-mini`, `text-embedding-3-small`).
- **Authentication**: JWT, bcryptjs.

---

## 📂 Project Structure

```
resolveflow-ai/
├── client/                     # React + Vite Frontend
│   ├── public/
│   │   └── widget.js           # Embeddable script for 3rd-party websites
│   ├── src/
│   │   ├── components/         # Layout, Sidebar, Navbar, Modal, Badge, ChatWidgetModal
│   │   ├── context/            # AuthContext, WorkspaceContext
│   │   ├── pages/              # 14 SaaS dashboard views + Widget Demo
│   │   │   ├── Dashboard.jsx
│   │   │   ├── SupportInbox.jsx
│   │   │   ├── KnowledgeBase.jsx
│   │   │   ├── Customers.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── Workflows.jsx
│   │   │   ├── AgentConfig.jsx
│   │   │   ├── TestingPlayground.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── ConversationMonitoring.jsx
│   │   │   ├── WorkspaceSettings.jsx
│   │   │   ├── WidgetDemo.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── WorkspaceSetup.jsx
│   │   ├── services/           # Axios API client with interceptors
│   │   └── index.css           # Tailwind design tokens
│   └── vite.config.js
│
├── server/                     # Node.js + Express Backend
│   ├── src/
│   │   ├── config/             # MongoDB connection & memory fallback
│   │   ├── middleware/         # Auth JWT & tenant isolation middleware
│   │   ├── models/             # 14 Mongoose Schema Models
│   │   │   ├── User.js
│   │   │   ├── Workspace.js
│   │   │   ├── AgentConfiguration.js
│   │   │   ├── KnowledgeDocument.js
│   │   │   ├── KnowledgeChunk.js
│   │   │   ├── Customer.js
│   │   │   ├── Order.js
│   │   │   ├── Conversation.js
│   │   │   ├── Message.js
│   │   │   ├── Workflow.js
│   │   │   ├── WorkflowExecution.js
│   │   │   ├── AgentTestCase.js
│   │   │   ├── ToolExecution.js
│   │   │   └── AuditLog.js
│   │   ├── routes/             # RESTful API endpoints
│   │   ├── services/           # RAG, Tool execution, Workflow engine, AI Agent
│   │   ├── seed.js             # Seed database with sample store & test cases
│   │   └── index.js            # Express server entry point & static server
│   └── test/
│       └── e2e-scenarios.test.js # 16 critical end-to-end verification tests
│
├── package.json
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js >= 18
- MongoDB running locally on `mongodb://127.0.0.1:27017` (or MongoDB Atlas)

### 1. Installation
Install server and client dependencies:
```bash
cd /Users/huzaifasiddiqui/.gemini/antigravity/scratch/resolveflow-ai
npm run install-all
```

### 2. Environment Configuration
Create `/server/.env` (a template is provided in `.env.example`):
```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/resolveflow
JWT_SECRET=resolveflow_jwt_super_secret_key_2026
OPENAI_API_KEY=your_openai_api_key_optional
```
*(Note: If `OPENAI_API_KEY` is omitted, the application seamlessly runs using its built-in local semantic cosine vectorizer and intelligent tool dispatch engine, allowing complete zero-credit offline testing!)*

### 3. Seed Database
Populate demo workspace, knowledge base documents, customers, orders, workflows, and test cases:
```bash
npm run seed
```

**Preloaded Demo Credentials:**
- **Email**: `demo@resolveflow.ai`
- **Password**: `Password123!`
- **Workspace**: `NovaCommerce Direct`

### 4. Running the Application

To run the unified server (serves both API and production frontend build):
```bash
cd server
npm start
```
Access the application at: **[http://localhost:5001](http://localhost:5001)**

To run in concurrent developer mode (with Vite Hot-Module-Reloading on port 3000):
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend (Vite)
npm run client
```
Access developer UI at: **[http://localhost:3000](http://localhost:3000)**

---

## 🧪 Automated End-to-End Scenarios Verification

Run the comprehensive test suite verifying all 16 critical requirements:
```bash
cd server
node test/e2e-scenarios.test.js
```

### Verified Scenarios:
1. Business registration and workspace creation.
2. Knowledge upload and text extraction (PDF / manual).
3. Chunking and vector embedding generation in MongoDB.
4. Semantic cosine similarity retrieval for company policy questions.
5. Accurate, hallucination-free knowledge grounding.
6. Real-time MongoDB customer account and order retrieval.
7. Order cancellation guard: enforces confirmation before database mutation.
8. Refund eligibility enforcement (checks order status and paid state).
9. Human escalation handoff: halts automatic AI responses and transfers to human queue.
10. Human agent reply in Support Inbox.
11. Declarative workflow automation triggering and execution logging.
12. Predefined AI agent testing playground benchmarking.
13. Complete multi-tenant data isolation across workspaces.

---

## 💬 Embeddable Web Chat Widget

Include the customer support widget on any external website with:

```html
<!-- ResolveFlow AI Web Chat Widget -->
<script
  src="http://localhost:5001/widget.js"
  data-workspace-id="YOUR_WORKSPACE_ID"
  async>
</script>
```

A live demo is available at `/widget-demo`.
