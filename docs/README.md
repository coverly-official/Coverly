# COVERLY - Complete B2B Wholesale Discovery, Sourcing & Procurement Platform

COVERLY is an enterprise-grade B2B wholesale marketplace, discovery engine, and landed-cost calculation platform tailored for Indian Micro, Small, and Medium Enterprises (MSMEs). It bridges the trust and information deficit in wholesale procurement by unifying product discovery, supplier verification, Request for Quote (RFQ) automation, multi-vendor landed-cost comparison, and order lifecycle management into a single cohesive ecosystem.

---

## 1. Project Purpose & Core Mission

Wholesale sourcing across India is traditionally fragmented across informal WhatsApp chats, unverified phone inquiries, handwritten rate cards, and deceptive sticker prices that obscure shipping fees and multi-tier Goods and Services Tax (GST).

**COVERLY's Core Workflow:**
$$\text{DISCOVER} \longrightarrow \text{CONNECT} \longrightarrow \text{COMPARE} \longrightarrow \text{MANAGE}$$

- **DISCOVER**: Transparently explore verified manufacturers, regional wholesalers, and authorized brand distributors along with dynamic bulk product catalogs and Minimum Order Quantities (MOQs).
- **CONNECT**: Formulate and broadcast structured RFQs directly to chosen vendors or leverage automated regional matching algorithms.
- **COMPARE**: Ingest quotations and evaluate true landed costs per unit using our proprietary Landed Cost Calculation Engine (factoring base price, freight logistics, HSN/SAC GST slabs, and packaging surcharges).
- **MANAGE**: Formalize quotes into binding Purchase Orders, coordinate fulfillment milestones, monitor tracking updates, and maintain audit-ready digital histories.

---

## 2. Technology Stack

### Frontend Application (`frontend/`)
- **Core Library**: React 18 (SPA Architecture)
- **Build System**: Vite 6 with TypeScript
- **Styling**: Tailwind CSS v3.4 with custom design tokens (`Warm Ledger` theme)
- **Animation & Motion**: Framer Motion
- **Icons**: Lucide React
- **Routing**: React Router v6 (Nested layout routing with role-based guards)
- **Unit Testing**: Vitest with React Testing Library

### Backend API Services (`backend/`)
- **Runtime**: Node.js (v20+ LTS)
- **Web Framework**: Express.js (Modular TypeScript architecture)
- **Cross-Origin & Security**: CORS, Helmet, Rate Limiter, Joi/Zod request validation
- **Execution & Hot-Reload**: `tsx` (development) and `tsc` (production build)

### Database & Cloud BaaS (InsForge PostgreSQL)
- **Platform**: [InsForge](https://insforge.dev) managed PostgreSQL
- **SDK**: `@insforge/sdk`
- **Data Layers**: Strict Row Level Security (RLS) policies, Foreign Keys, UUIDv4 identifiers, and Automated Triggers
- **Storage**: InsForge S3-compatible private and public object buckets for verification documents, certificates, and product media
- **Auth**: InsForge JWT session management with custom claims for multi-role identities

### Cloud Deployment
- **Target**: Vercel Monorepo Serverless (`frontend/dist` static assets + `/api/*` Express handler via `api/index.ts`)

---

## 3. System User Roles

The platform natively supports 9 distinct operational roles with strict authorization:

1. **Guest**: Anonymous public browsing, catalog discovery, landing preview, and self-registration.
2. **Buyer**: Sourcing procurement team managing RFQs, comparing quotes, issuing orders, and tracking consignments.
3. **Manufacturer**: Production factory listing custom and bulk goods, factory capacity, machine certifications, and responding to RFQs.
4. **Wholesaler**: High-volume stockist providing ready-to-ship inventories, bulk volume discounts, and local delivery.
5. **Distributor**: Authorized brand channel partner with territory-scoped distribution rights and catalog quotas.
6. **Buyer + Supplier**: Unified dual-mode business identity with on-the-fly workspace switching and shared credentialing.
7. **Admin**: Platform governance, user/business moderation, dispute resolution, analytics, and platform-wide configurations.
8. **Verification Admin**: Ground-truth auditing specialist reviewing GSTIN, factory photos, Udyam certificates, and assigning tiered trust badges.
9. **Support Admin**: Customer success operative handling tickets, dispute escalation, and account inquiries.

---

## 4. Main Business Workflows

- **Workflow 1 (Guest to Buyer)**: Public product search $\to$ Supplier profile review $\to$ Auth gate $\to$ Onboarding $\to$ Direct RFQ creation.
- **Workflow 2 (Supplier Onboarding & Verification)**: Business registration $\to$ Verification dossier upload $\to$ Verification Admin audit $\to$ Tiered badge award $\to$ Catalog publishing.
- **Workflow 3 (Buyer RFQ Dispatch)**: Structured item requirements $\to$ Target delivery destination $\to$ Selective or algorithmic supplier matching $\to$ Notification dispatch.
- **Workflow 4 (Supplier Quotation)**: RFQ alert $\to$ Cost breakdown inputs (unit price, freight, GST, lead time, validity) $\to$ Submission $\to$ Buyer notification.
- **Workflow 5 (Landed Cost Comparison)**: Dynamic normalization of multiple quotes $\to$ Mathematical comparison $\to$ Variance callouts $\to$ Acceptance.
- **Workflow 6 (Order Generation)**: Quote acceptance validation $\to$ Atomic order creation $\to$ Idempotent PO locking.
- **Workflow 7 (Order Lifecycle Tracking)**: Order confirmation $\to$ Processing $\to$ Quality check $\to$ Dispatch $\to$ In-transit $\to$ Delivery sign-off.
- **Workflow 8 (Admin Verification Governance)**: Verification queue inspection $\to$ GSTIN/site audit $\to$ Approve/Reject/Request Info $\to$ Immutable audit trail.
- **Workflow 9 (Support & Dispute Escalation)**: Ticket filing $\to$ Triaging $\to$ Administrative mediation $\to$ Resolution logging.

---

## 5. Repository Directory Structure

```text
Coverly-main/
├── api/                           # Vercel Serverless Function entry point
│   └── index.ts                   # Express app serverless wrapper
├── backend/                       # Node.js + Express + TypeScript Backend
│   ├── api/                       # Local API entry
│   ├── database/                  # SQL Schemas & reference queries
│   ├── src/                       # Application source code
│   │   ├── config/                # Environment, InsForge, CORS configurations
│   │   ├── middleware/            # Auth, authorization, validation, error handler
│   │   ├── modules/               # Modular domain modules (auth, rfq, orders, etc.)
│   │   ├── lib/                   # Shared backend utilities & InsForge client
│   │   ├── routes/                # Express routing definitions
│   │   ├── app.ts                 # Express application setup
│   │   └── index.ts               # Standalone server runner
│   ├── package.json               # Backend dependencies and scripts
│   └── tsconfig.json              # Backend TypeScript configuration
├── frontend/                      # React 18 + Vite 6 Frontend Application
│   ├── src/                       # Frontend source code
│   │   ├── components/            # UI components (common, sections, ui, forms)
│   │   ├── data/                  # Static category & demo data fixtures
│   │   ├── layouts/               # Public, Buyer, Supplier, Admin layouts
│   │   ├── pages/                 # Public, Auth, Buyer, Supplier, Admin pages
│   │   ├── routes/                # React Router v6 routing & route guards
│   │   ├── lib/                   # API clients, utils, landed-cost calculator
│   │   ├── App.tsx                # App shell
│   │   ├── main.tsx               # DOM entry point
│   │   └── index.css              # Tailwind base & global styles
│   ├── index.html                 # HTML entry template
│   ├── package.json               # Frontend dependencies and scripts
│   ├── tailwind.config.ts         # Tailwind design system tokens
│   ├── tsconfig.json              # Frontend TypeScript configuration
│   └── vite.config.ts             # Vite build & dev-proxy configuration
├── docs/                          # Comprehensive Architectural & Specification Docs
│   ├── README.md                  # This document
│   ├── PRODUCT_BLUEPRINT.md       # Product strategy, domain models & metrics
│   ├── SCREEN_SPECIFICATION.md    # 75-screen inventory & interaction specs
│   ├── USER_WORKFLOWS.md          # End-to-end user journeys & flowcharts
│   ├── ROLE_PERMISSION_MATRIX.md  # RBAC & authorization rules
│   ├── DATABASE_ARCHITECTURE.md   # PostgreSQL schema, ERD, RLS & triggers
│   ├── API_SPECIFICATION.md       # Complete REST API documentation
│   ├── FRONTEND_ARCHITECTURE.md   # React architecture, routing & state
│   ├── BACKEND_ARCHITECTURE.md    # Express architecture, services & pipeline
│   ├── ADMIN_PANEL_SPECIFICATION.md # Governance & verification console specs
│   ├── NOTIFICATION_SPECIFICATION.md # Event catalog & delivery matrix
│   ├── SECURITY_SPECIFICATION.md  # Threat modeling & security controls
│   ├── IMPLEMENTATION_ROADMAP.md  # 15 development phases & milestones
│   ├── TESTING_SPECIFICATION.md   # QA strategies & automated test suites
│   ├── DEPLOYMENT_GUIDE.md        # Vercel & InsForge production deployment
│   └── CHANGELOG.md               # Version history & architectural iterations
├── migrations/                    # InsForge PostgreSQL timestamped migrations
├── .insforge/                     # InsForge CLI project linkage metadata
├── insforge.toml                  # InsForge project declarative configuration
├── package.json                   # Root monorepo workspace configuration
├── vercel.json                    # Unified Vercel monorepo deployment config
└── AGENTS.md                      # Agent rules & BaaS operating instructions
```

---

## 6. Setup & Local Development

### Prerequisites
- Node.js version 20 or higher
- npm version 10 or higher
- An active InsForge Project (already linked to project `a60f176f-7863-493d-8fef-cf42a662a217`)

### 1. Install Workspace Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Verify or create `backend/.env` (see `backend/.env.example`):
```env
PORT=5000
CORS_ORIGIN=http://localhost:5173
INSFORGE_BASE_URL=https://4vwfw2w8.ap-southeast.insforge.app
INSFORGE_ANON_KEY=anon_9da4660d2d03cec83d7ea57032348bab48a951f8ddf8b2b9dccdfb4b77eefe58
INSFORGE_API_KEY=ik_1d1fb7f3feb4e7723e653ef844b24492486caa96de0940f2e658c2f30cd392a1
```

For the frontend, configure `frontend/.env` (optional for local development since Vite proxies `/api` to port 5000):
```env
VITE_API_URL=
```

### 3. Run Database Migrations
Database migrations are automatically tracked in `migrations/` and applied using the InsForge CLI:
```bash
npx -y @insforge/cli db migrations up --all
```

### 4. Start Development Servers
Run both backend and frontend concurrently:
```bash
npm run dev
```
- Frontend will be accessible at: `http://localhost:5173`
- Backend API will be accessible at: `http://localhost:5000/api`

### 5. Execute Tests & Typechecks
```bash
# Run unit and landed cost tests
npm test

# Run backend TypeScript verification
npm run typecheck

# Full production build verification
npm run build
```

---

## 7. Documentation Index

Detailed architectural specifications are located in the [`docs/`](file:///d:/project/Coverly-main/docs) directory:

| Document | Purpose |
| :--- | :--- |
| [PRODUCT_BLUEPRINT.md](file:///d:/project/Coverly-main/docs/PRODUCT_BLUEPRINT.md) | Business vision, domain entities, value propositions, and success metrics |
| [SCREEN_SPECIFICATION.md](file:///d:/project/Coverly-main/docs/SCREEN_SPECIFICATION.md) | Granular specifications for all ~75 application screens & interaction states |
| [USER_WORKFLOWS.md](file:///d:/project/Coverly-main/docs/USER_WORKFLOWS.md) | Step-by-step user journeys, state transitions, and sequence diagrams |
| [ROLE_PERMISSION_MATRIX.md](file:///d:/project/Coverly-main/docs/ROLE_PERMISSION_MATRIX.md) | Full 9-role authorization matrix, permission flags, and access boundaries |
| [DATABASE_ARCHITECTURE.md](file:///d:/project/Coverly-main/docs/DATABASE_ARCHITECTURE.md) | 26 PostgreSQL tables, foreign keys, indexes, triggers, and RLS policies |
| [API_SPECIFICATION.md](file:///d:/project/Coverly-main/docs/API_SPECIFICATION.md) | Comprehensive REST API contract with request/response schemas |
| [FRONTEND_ARCHITECTURE.md](file:///d:/project/Coverly-main/docs/FRONTEND_ARCHITECTURE.md) | Component patterns, React Router setup, context state, and design tokens |
| [BACKEND_ARCHITECTURE.md](file:///d:/project/Coverly-main/docs/BACKEND_ARCHITECTURE.md) | Express pipeline, service layers, error handling, and calculation engine |
| [ADMIN_PANEL_SPECIFICATION.md](file:///d:/project/Coverly-main/docs/ADMIN_PANEL_SPECIFICATION.md) | Superadmin, Verification Admin, and Support Admin consoles & actions |
| [NOTIFICATION_SPECIFICATION.md](file:///d:/project/Coverly-main/docs/NOTIFICATION_SPECIFICATION.md) | In-app notification catalog, triggers, event payloads, and delivery rules |
| [SECURITY_SPECIFICATION.md](file:///d:/project/Coverly-main/docs/SECURITY_SPECIFICATION.md) | Threat model, JWT verification, RLS audits, and data privacy safeguards |
| [IMPLEMENTATION_ROADMAP.md](file:///d:/project/Coverly-main/docs/IMPLEMENTATION_ROADMAP.md) | 15-phase staged development schedule, gap analysis, and delivery gates |
| [TESTING_SPECIFICATION.md](file:///d:/project/Coverly-main/docs/TESTING_SPECIFICATION.md) | QA test strategy, integration test matrices, and test automation scripts |
| [DEPLOYMENT_GUIDE.md](file:///d:/project/Coverly-main/docs/DEPLOYMENT_GUIDE.md) | Vercel production deployment, environment setup, and release procedures |
| [CHANGELOG.md](file:///d:/project/Coverly-main/docs/CHANGELOG.md) | Version history, database migrations, and structural changelog |
