# COVERLY – SYSTEM ARCHITECTURE SPECIFICATION
## Phase 1: High-Level Architecture, Identity, Engines & Service Boundaries

---

## 1. System Overview & Architectural Paradigm

COVERLY is an enterprise B2B Business Operating Ecosystem built on a **modular monolith architecture** powered by:
- React 18 + Vite frontend with role-tailored workspaces and a universal workspace switcher.
- Node.js + Express + TypeScript backend providing 463 REST endpoints.
- Single unified InsForge PostgreSQL database with Row-Level Security (RLS).
- Shared cross-cutting foundations: Identity, Business Directory, RFQ/Enquiry Engine, Quotation Engine, Order Pipeline, Logistics Hub, Document Vault, Realtime Notification Center, and Audit Logs.

```
+---------------------------------------------------------------------------------------------------+
|                                      COVERLY PUBLIC INTERFACE                                     |
|  - Universal Search Engine   - Geo-filter (Cities)   - Public Directory   - Guest Requirement CTA |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                               SHARED IDENTITY & MULTI-TENANT SWITCHER                             |
|  User Account (auth.users) <---> Business Memberships (business_members) <---> Workspaces        |
+---------------------------------------------------------------------------------------------------+
       |                    |                     |                     |                    |
       v                    v                     v                     v                    v
+--------------+     +--------------+     +---------------+     +---------------+     +-------------+
|  BUYER SIDE  |     |   SUPPLIER   |     |    SERVICE    |     |   LOGISTICS   |     |  INTERNAL   |
| - Corporate  |     | - Mfg Hub    |     | - B2B Service |     | - Logistics   |     | - Admin Ctr |
|   Buyer      |     | - Wholesaler |     |   Firms       |     |   Partners    |     | - Operations|
| - Retailer   |     | - Distributor|     | - Sales Agents|     | - Transporters|     | - Compliance|
| - Staff/Mgr  |     | - Raw Mat/Pkg|     |               |     | - Fleet/Trucks|     | - Finance   |
+--------------+     +--------------+     +---------------+     +---------------+     +-------------+
       |                    |                     |                     |                    |
       +--------------------+---------------------+---------------------+--------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                CENTRAL CONNECTED PLATFORM FOUNDATIONS                             |
|  1. Central Business Directory              5. Order & Transaction Pipeline                       |
|  2. Central Product & Service Catalogues    6. Logistics & Freight Routing                        |
|  3. Universal Enquiry & RFQ Engine          7. Document Vault (InsForge Storage)                  |
|  4. Multi-Tier Quotation Engine             8. Realtime Event & Notification Bus                  |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                  DATABASE & SECURITY ARCHITECTURE                                 |
|  - InsForge PostgreSQL with RLS             - Granular Server-Side RBAC                           |
|  - Multi-Tenant business_id Scoping         - Immutable Compliance Audit Logs                     |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Multi-Role and Multi-Business Identity Architecture

### 2.1 Identity Separation Model
To prevent data contamination and duplicate account creation, COVERLY strictly decouples 8 identity dimensions:
1. **User Identity (`users`)**: Person-level record (email, password hash, phone, full name).
2. **Business Identity (`businesses`)**: Company legal entity (GSTIN, PAN, business type, verification level).
3. **Business Capabilities**: Array of capabilities a business possesses (e.g. both `manufacturer` and `wholesaler`).
4. **Business Membership (`business_members`)**: Junction record binding a user to a business.
5. **Business Roles (`role`)**: Role of user in that business (`owner`, `procurement_manager`, `purchase_staff`, `finance_accounts_staff`).
6. **Business Permissions**: Granular permissions bitmask/flags overriding role defaults.
7. **Business Branches (`business_branches`)**: Specific warehouse, retail shop, or factory location.
8. **Verification Record (`supplier_verifications`)**: KYC, GST, MSME, and factory audit status.

### 2.2 Secure Business Workspace Switching
- A single user login allows the user to switch active context between multiple owned or joined businesses.
- The `coverly_active_role` and `coverly_business_profile` cached in local session are validated on every state change and on the backend via `authenticateUser` and `validateBusinessMembership`.
- A user operating in Business A has zero read or write access to Business B's RFQs, orders, or invoices.

---

## 3. Central Core Engine Specifications

### 3.1 Universal Enquiry & RFQ Engine
- **Targeted RFQs**: Dispatched to 1-5 specific verified suppliers selected from directories.
- **Broadcast RFQs**: Dispatched to all verified vendors matching category and territory.
- **Guest RFQs**: Unauthenticated submissions create `concierge_leads` with unique token `RFQ-GUEST-XXXX`. When the guest registers, the system queries unassigned leads by phone/email and reassigns ownership to the new `user_id`.

### 3.2 Central Quotation Engine
- **Landed Cost Breakdown**: Separates base unit price, GST rate (5/12/18/28%), packaging charges, freight, and insurance.
- **Side-by-Side Comparison**: Computes total cost of ownership across up to 4 competing quotations.
- **Single-Winner Concurrency Guard**: When a buyer accepts Quotation A, Quotation A transitions to `accepted`, an official Purchase Order is created, and all competing quotations for that RFQ transition to `closed`.

### 3.3 Central Order & Procurement Pipeline
- Sequential state machine: `draft` -> `issued` -> `pending_deposit` -> `confirmed` -> `in_production` -> `qc_inspection` -> `ready_for_dispatch` -> `shipped` -> `delivered` -> `completed`.
- Backward state transitions and cancellation of in-production/shipped orders are blocked.

### 3.4 Logistics & Transport Coordination
- Directly binds to Purchase Orders.
- Multi-modal Logistics Partners quote freight and subcontract Transporters.
- Transporters register commercial vehicles (RC, payload) and drivers (license).
- Trips track e-way bills and checkpoints. Delivery concludes via digital Proof of Delivery (POD).

### 3.5 Business Services Engine
- Professional service listings across 11 verified categories.
- Structured milestone proposals with deliverable uploads and customer revision loops.
- Completed projects unlock verified customer reviews and ratings.

### 3.6 Sales Agent & CRM Foundation
- Inbound leads assigned to certified agents.
- 10-state progression from `new` to `won`.
- Automatic calculation of agent commission with statutory TDS withholding.
- Payout approval routed to Finance Admin.

---

## 4. Security, Isolation & Audit Architecture

1. **Authentication**: JWT Bearer token or `x-user-id` validated against active users.
2. **Authorization**: RBAC checked at middleware level (`requireRole`, `requireAdmin`) and database level (InsForge RLS).
3. **Data Scoping**: Every tenant query enforces `eq("business_id", targetBusinessId)` verified against the caller's active memberships.
4. **Audit Trail**: Every administrative action, status override, dispute mediation, and verification change logs an immutable entry to `admin_audit_logs`.
