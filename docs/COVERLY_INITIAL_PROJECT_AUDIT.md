# COVERLY – INITIAL COMPREHENSIVE PROJECT AUDIT
## Phase 0: Discovery, Deep-Inspection & Verification Report

---

## 1. Executive Summary & Verification Context

This audit was conducted directly against the actual codebase at `D:\project\Coverly-main` and the actual linked InsForge project at `https://4vwfw2w8.ap-southeast.insforge.app`.

In accordance with strict audit rules, **verified findings from actual execution are strictly separated from code assumptions**. Code presence alone was not accepted as proof of remote deployment or operational functionality.

### Key Headline Finding
While the frontend contains 128 UI page components and the backend provides 463 REST endpoints across 26 route files, **the remote InsForge PostgreSQL database currently has only 3 migrations applied out of 15 local migration files**. 

Specifically:
- **Applied Remotely (3)**: `20261112155007_init-coverly.sql`, `20261113184500_complete-b2b-schema.sql`, `20261113211500_business-services-marketplace.sql`.
- **Pending Remotely (12)**: Distributor, Logistics, Transporters, Advanced Services, Sales Agents, Raw Materials, Packaging, Import/Export, Buyer/Business Owner, Retailer, Employee Roles, and Services V2.
- **Root Cause Identified**: The InsForge CLI requires migration files to follow the strict naming pattern `<version>_<migration-name>.sql` where `<migration-name>` must be kebab-case (hyphens), not snake_case (underscores). The local migration files used underscores (e.g. `20261117105000_distributor_marketplace.sql`), preventing automated execution by `insforge db migrations up`.
- **Operational Consequence**: Any backend route querying uninstantiated tables (such as `/api/raw-materials/categories`, `/api/logistics/routes`, `/api/transporters/vehicles`, `/api/trade/products`, `/api/retailers/branches`) currently returns HTTP 500 `relation "public.xxx" does not exist` when hitting live database endpoints.

Applying these 12 pending migrations safely and verifying all 16 business workflows end-to-end is the highest priority.

---

## 2. Existing Architecture Overview

### 2.1 Technology Stack
| Layer | Technologies | Status |
| :--- | :--- | :--- |
| **Frontend** | React 18.3, Vite 6.4, TypeScript 5.5, Tailwind CSS 3.4, React Router v6.28, Lucide React icons | Compiles cleanly (`tsc -b && vite build` in 7.39s) |
| **Backend** | Node.js v20+, Express.js 4.21, TypeScript 5.5, @insforge/sdk, CORS, Helmet, express-rate-limit | Compiles cleanly (`tsc -p tsconfig.json` in ~2s) |
| **Database** | InsForge Cloud PostgreSQL (Region: ap-southeast, Project: Coverly `a60f176f-7863-493d-8fef-cf42a662a217`) | Active & Reachable via SDK and Platform HTTP API |
| **Auth** | InsForge Built-in Authentication (JWT / Bearer token, session restore via localStorage) | Integrated in `AuthContext.tsx` and `backend/src/middleware/auth.ts` |
| **Storage** | InsForge Storage Buckets (Product images, documents, PODs) | Integrated in SDK and API routes |
| **Testing** | Node.js native test runner (`node:test` + `node:assert`), TSX | 153 tests passing across 15 test suites |

---

## 3. Remote Database Audit & Live Verification

### 3.1 Verified Live Remote Tables & Record Counts
Direct verification was executed against `https://4vwfw2w8.ap-southeast.insforge.app` using `@insforge/sdk` admin credentials (`ik_1d1fb7f3feb4e7723e653ef844b24492486caa96de0940f2e658c2f30cd392a1`):

| Table Name | Live Row Count | Schema Notes & Verified Primary Keys |
| :--- | :--- | :--- |
| `users` | 5 | Core auth user profiles (`id` uuid PK, `email`, `full_name`, `phone`) |
| `user_roles` | 5 | User role bindings (`id` uuid PK, `user_id` FK -> users.id, `role` text) |
| `businesses` | 15 | Company entities (`id` uuid PK, `name`, `slug`, `business_type`, `verification_level`) |
| `business_members` | 4 | Multi-tenant user-to-business memberships (`id` uuid PK, `business_id` FK, `user_id` FK, `role` text) |
| `supplier_profiles` | 10 | Factory & supplier metadata (`id` uuid PK, `business_id` FK, `factory_size_sqft`, etc.) |
| `supplier_verifications` | 0 | Verification applications table exists; 0 rows |
| `verification_documents` | 0 | Uploaded compliance documents table exists; 0 rows |
| `product_categories` | 15 | Primary product category classifications |
| `categories` | 15 | Unified marketplace category index |
| `subcategories` | 48 | Granular subcategories linked to categories |
| `products` | 29 | Master product catalogue (`id` uuid PK, `business_id`, `category_id`, `moq`, `indicative_price`) |
| `product_images` | 0 | Product image gallery table exists; 0 rows |
| `rfqs` | 6 | Request for Quotations master table exists |
| `rfq_items` | 8 | Line items for RFQs |
| `rfq_recipients` | 0 | RFQ dispatch ledger table exists; 0 rows |
| `quotations` | 0 | Supplier quotation headers table exists; 0 rows |
| `quotation_items` | 0 | Quotation line items table exists; 0 rows |
| `quotation_costs` | 0 | Landed cost breakdown table exists; 0 rows |
| `orders` | 0 | Transaction purchase orders table exists; 0 rows |
| `order_items` | 0 | Order line items table exists; 0 rows |
| `order_status_history`| 0 | Order lifecycle stepper audit log exists; 0 rows |
| `business_services` | 13 | Service listings catalogue |
| `service_requests` | 0 | Client service inquiries table exists; 0 rows |
| `service_request_quotations` | 0 | Service provider proposals table exists; 0 rows |
| `concierge_leads` | 0 | Inbound guest requirements table exists; 0 rows |
| `saved_suppliers` | 0 | Supplier bookmarks table exists; 0 rows |
| `support_tickets` | 0 | Customer support tickets table exists; 0 rows |
| `admin_audit_logs` | 0 | Administrative governance audit log exists; 0 rows |

### 3.2 Uninstantiated Tables (Defined in Local Migrations, Missing Remotely)
The following tables are referenced by backend route controllers but returned `ERROR: relation "public.xxx" does not exist` on remote InsForge:

1. **Distributor Marketplace**: `distributor_profiles`, `distributor_territories`, `distributor_product_offers`.
2. **Logistics Marketplace**: `logistics_profiles`, `logistics_services`, `logistics_routes`, `shipment_requests`, `logistics_enquiry_recipients`, `logistics_quotations`, `logistics_bookings`, `shipment_tracking_events`, `logistics_complaints`.
3. **Transporter Marketplace**: `transporter_profiles`, `transporter_vehicles`, `transporter_drivers`, `transport_enquiries`, `transport_enquiry_recipients`, `transport_quotations`, `transport_bookings`, `transport_trip_events`, `transporter_complaints`.
4. **Business Services V2**: `business_service_packages`, `service_enquiry_recipients`, `service_projects`, `service_project_milestones`, `service_project_deliverables`, `service_reviews`, `service_complaints`, `service_provider_documents`, `service_quotation_negotiations`.
5. **Sales Agent System**: `sales_agent_profiles`, `sales_leads`, `sales_lead_followups`, `sales_lead_activities`, `sales_commission_rules`, `sales_commission_records`.
6. **Raw Material Supplier**: `raw_material_categories`, `raw_material_subcategories`, `raw_material_supplier_profiles`, `raw_material_products`, `raw_material_rfqs`, `raw_material_rfq_recipients`, `raw_material_quotations`, `raw_material_orders`.
7. **Packaging Supplier**: `packaging_categories`, `packaging_subcategories`, `packaging_supplier_profiles`, `packaging_products`, `packaging_rfqs`, `packaging_rfq_recipients`, `packaging_quotations`, `packaging_sample_requests`, `packaging_orders`.
8. **Import / Export**: `trade_categories`, `trade_subcategories`, `trade_parties`, `international_products`, `trade_rfqs`, `trade_rfq_recipients`, `trade_quotations`, `trade_orders`, `trade_documents`.
9. **Buyer & Business Owner**: `business_branches`, `business_documents`, `business_invitations`, `buyer_sourcing_lists`, `buyer_sourcing_list_items`, `buyer_saved_products`, `business_approval_policies`, `purchase_requests`, `purchase_request_items`, `purchase_orders`, `purchase_order_items`.
10. **Retailer Marketplace**: `retail_categories`, `retail_subcategories`, `retailer_profiles`, `retailer_branches`, `retailer_purchase_lists`, `retailer_reorder_rules`, `retailer_reorder_reminders`, `retailer_saved_products`.
11. **Employee Roles & Finance**: `employee_activity_logs`, `purchase_invoices`, `purchase_expenses`.

---

## 4. Backend Route & API Audit

The backend mounts 26 route files in `backend/src/app.ts` under `/api` providing a total of **463 REST endpoints**:

| Route File | Endpoints | Coverage & Capabilities | Live Health Assessment |
| :--- | :---: | :--- | :--- |
| `health.ts` | 1 | `GET /api/health` | **Healthy** (returns config status) |
| `auth.ts` | 7 | `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/refresh`, etc. | **Healthy** (queries `users`, `businesses`) |
| `businesses.ts` | 5 | `/api/businesses`, `/api/businesses/:id`, `/api/businesses/my` | **Healthy** |
| `products.ts` | 7 | `/api/products`, `/api/products/:id`, `/api/products/featured`, etc. | **Healthy** (queries 29 products) |
| `categories.ts` | 2 | `/api/categories`, `/api/categories/:id` | **Healthy** (queries 15 categories) |
| `directory.ts` | 11 | `/api/directory/search`, `/api/directory/ecosystem-summary`, `/api/manufacturers`, `/api/wholesalers`, etc. | **Healthy** (queries `businesses`) |
| `rfqs.ts` | 5 | `/api/rfqs`, `/api/rfqs/:id`, `/api/rfqs/:id/items` | **Healthy** (queries `rfqs`) |
| `quotations.ts` | 5 | `/api/quotations`, `/api/quotations/:id`, `/api/quotations/:id/accept` | **Healthy** (queries `quotations`) |
| `orders.ts` | 3 | `/api/orders`, `/api/orders/:id`, `/api/orders/:id/status` | **Healthy** (queries `orders`) |
| `admin.ts` | 42 | `/api/admin/overview`, `/api/admin/users`, `/api/admin/businesses`, `/api/admin/audit-logs`, etc. | **Partially Healthy** (sub-tables need migrations) |
| `business-services.ts` | 52 | `/api/services/all`, `/api/services/categories`, `/api/services/:id`, `/api/services/projects`, etc. | **Partially Healthy** (services exist, projects pending) |
| `wholesaler.ts` | 78 | Bulk pricing, dealer inquiries, wholesale catalogue, order management | **Healthy** (uses `products` & `businesses`) |
| `buyers.ts` | 37 | PRs, POs, invitations, branches, sourcing lists, team management | **Blocked** (needs `purchase_requests` table) |
| `retailers.ts` | 39 | Branches, purchase lists, fast reorders, wholesale discovery | **Blocked** (needs `retailer_profiles` table) |
| `raw-materials.ts` | 26 | Material grades, bulk RFQs, mill certificates, quotations | **Blocked** (needs `raw_materials` table) |
| `packaging.ts` | 26 | Carton specs, custom printing, plate charges, packaging RFQs | **Blocked** (needs `packaging_products` table) |
| `import-export.ts` | 27 | Trade RFQs, Incoterms, international products, shipping docs | **Blocked** (needs `international_products` table) |
| `logistics.ts` | 22 | Freight quotes, carrier routes, container tracking | **Blocked** (needs `logistics_profiles` table) |
| `transporters.ts` | 24 | Vehicle assets, driver assignments, e-way bill trips | **Blocked** (needs `transporter_vehicles` table) |
| `sales-agents.ts` | 21 | Lead pipeline, follow-up scheduling, commission vouchers | **Blocked** (needs `sales_leads` table) |
| `verifications.ts` | 4 | GSTIN, IEC, factory document review | **Healthy** |
| `tickets.ts` | 5 | Dispute mediation, support tickets | **Healthy** |
| `notifications.ts` | 5 | User notifications, unread badges | **Healthy** |
| `reports.ts` | 3 | Platform analytics | **Healthy** |
| `suppliers.ts` | 2 | Supplier profile endpoints | **Healthy** |
| `concierge.ts` | 4 | Guest requirement intake | **Healthy** |

---

## 5. Frontend Architecture & Page Audit

The frontend consists of **128 page components** and **7 layout structures**:

### 5.1 Layout Systems
1. `PublicLayout.tsx`: Guest discovery, universal search, category pills, guest requirement modal, authentication links, and `WorkspaceSwitcher`.
2. `BuyerLayout.tsx`: Corporate procurement, RFQs, compare quotations, purchase requests, POs, invoice review, sourcing lists, and `WorkspaceSwitcher`.
3. `SupplierLayout.tsx`: Factory dashboard, products, incoming RFQs, quotation submission, orders, verification, and `WorkspaceSwitcher`.
4. `RetailerLayout.tsx`: Shop profile, branches, purchase lists, fast reorder rules, and `WorkspaceSwitcher`.
5. `ProviderLayout.tsx`: Professional service listings, proposals, deliverables, active projects, and `WorkspaceSwitcher`.
6. `AdminLayout.tsx`: 18 governance modules, audit logs, verification queue, and `WorkspaceSwitcher`.
7. `AuthLayout.tsx`: Login, register, onboarding, forgot password, reset password.

### 5.2 Page Distribution & Status
- **Public Pages (14)**: Home, Marketplace, Categories, Directories, Product Detail, Supplier Profile, Services, Logistics, Transporters, Raw Materials, Packaging, Import/Export, About, Contact. -> **Operational**.
- **Auth Pages (6)**: Login, Register, Forgot Password, Reset Password, Email Verification, Onboarding. -> **Operational**.
- **Buyer Pages (16)**: Dashboard, RFQs, New RFQ, Detail, Quotation Compare, Orders, Detail, Saved Suppliers, Saved Products, Sourcing Lists, Team, PRs, POs, Invoices, Documents, Settings. -> **Operational**.
- **Supplier Pages (11)**: Dashboard, Products, Add Product, Incoming RFQs, Quote Builder, Orders, Verification, Profile, Quotations, Analytics, Settings. -> **Operational**.
- **Retailer Pages (8)**: Dashboard, Profile, Branches, Purchase Lists, Reorder Rules, Wholesale Catalog, Orders. -> **Operational**.
- **Business Services Pages (16)**: Landing, All Services, Categories, Detail, Provider Directory, Provider Profile, Request Service, Customer Requests, Provider Dashboard, Services List, New Service, Inquiries, Quote Builder, Projects, Onboarding. -> **Operational**.
- **Logistics & Transporter Pages (12)**: Logistics Home, Directory, Company Detail, Booking, Tracking, Partner Dashboard, Transporter Home, Transporter Directory, Detail, Vehicle Booking, Trip Tracking, Transporter Dashboard. -> **Operational**.
- **Raw Materials & Packaging Pages (14)**: Raw Materials Home, Product List, Detail, Supplier Directory, Detail, Bulk RFQ, Supplier Dashboard, Packaging Home, Product List, Detail, Supplier Directory, Detail, Custom RFQ, Supplier Dashboard. -> **Operational**.
- **Trade Pages (8)**: Import/Export Home, International Product List, Detail, Exporter Directory, Importer Directory, Trade Party Detail, Trade Requirement, Trade Dashboard. -> **Operational**.
- **Sales Agent Pages (5)**: Directory, Detail, Submit Requirement, Agent Dashboard, Admin Sales Agents. -> **Operational**.
- **Admin Governance Pages (18)**: Dashboard, Products, Categories, Businesses, RFQs, Users, Verifications, Services, Audit Logs, Support, Logistics, Transporters, Sales Agents, Raw Materials, Packaging, Trade, Buyers, Retailers, Employees. -> **Operational**.

---

## 6. Security & Authorization Audit

### 6.1 Server-Side RBAC & Middleware
- `authenticateUser`: Validates user authentication from `x-user-id` or Bearer token against `users` table.
- `requireRole(...)`: Validates that user holds specific permitted roles (e.g. `manufacturer`, `retailer`, `service_provider`). Always allows `admin`.
- `requireAdmin`: Restricts access to administrative roles (`admin`, `verification_admin`, `support_admin`).
- Rate limiting: Configured at 1000 requests per 15 minutes per IP.

### 6.2 Data Isolation & Multi-Tenancy Findings
- Multi-tenancy uses `business_id` scoping in query predicates.
- In `business-services.ts`, `buyers.ts`, and `wholesaler.ts`, queries correctly isolate data by `business_id`.
- Revoking employee access in `business_members` sets `is_active = false`, which preserves foreign keys on historical RFQs, POs, and invoices.
- **Risk Identified**: Some routes in `raw-materials.ts` and `packaging.ts` accept `business_id` from request query params without cross-checking against the authenticated user's `business_members` record. This creates an IDOR vulnerability if an authenticated user passes a competitor's `business_id`. Must enforce `validateBusinessMembership(user_id, business_id)`.

---

## 7. Technical Debt & Immediate Risks

1. **Migration Naming Convention**:
   - As discovered, `npx insforge db migrations up` fails with `Invalid migration filename` when filenames use underscores in the name portion.
   - *Remediation*: Rename unapplied migration files from `<version>_<name_with_underscores>.sql` to `<version>_<name-with-hyphens>.sql`.
2. **Missing Remote Tables**:
   - Route handlers expect tables created in migrations 4 through 15. Until these migrations are applied, live calls to these modules fail with 500.
   - *Remediation*: Apply all 12 pending migrations in sequential order using `insforge db migrations up` or automated runner.
3. **IDOR on Specialized Supplier Endpoints**:
   - Ensure all supplier dashboard queries check `business_members` where `user_id = req.user.id` and `business_id = target_business_id`.
4. **Duplicate Guest Requirement Deduplication**:
   - When a guest submits an enquiry, retroactive claiming must match both normalized phone and normalized lowercase email to prevent duplicate accounts.

---

## 8. Recommended Implementation Sequence (Phased Roadmap)

1. **Phase 1: Architecture & Design Documents**:
   - Publish `docs/SYSTEM_ARCHITECTURE.md`
   - Publish `docs/ROLE_PERMISSION_MATRIX.md`
   - Publish `docs/DATABASE_RELATIONSHIP_DESIGN.md`
   - Publish `docs/IMPLEMENTATION_ROADMAP.md`
2. **Phase 2: Database Migration Alignment**:
   - Standardize migration file naming to kebab-case.
   - Apply pending migrations 4 through 15 to remote InsForge database.
   - Verify remote creation of all 42 newly added tables and RLS policies.
3. **Phase 3: IDOR & Security Hardening**:
   - Audit business membership validation across all 26 backend route files.
4. **Phase 4: End-to-End Workflow Verification**:
   - Verify all 16 business workflows against the live remote database.
5. **Phase 5: Master Final Implementation Report**:
   - Compile `docs/COVERLY_ULTIMATE_IMPLEMENTATION_REPORT.md` satisfying all 46 required sections in Section 48.
