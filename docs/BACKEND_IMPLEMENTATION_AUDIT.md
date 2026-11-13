# COVERLY Backend Implementation Audit
**Generated:** November 13, 2026  
**Auditor:** Principal Backend & Security Architect  
**Project:** COVERLY B2B Wholesale Discovery, Sourcing & Procurement Platform  
**Target Database:** Remote InsForge PostgreSQL Project `a60f176f-7863-493d-8fef-cf42a662a217` (`https://4vwfw2w8.ap-southeast.insforge.app`)

---

## 1. Executive Summary

A comprehensive architectural and code-level audit was conducted across the COVERLY backend repository (`D:\project\Coverly-main\backend`) and its connected InsForge PostgreSQL BaaS instance.

### Live Remote Database Status
- **Connectivity:** VERIFIED (HTTP 200 OK via `@insforge/sdk` using server API key).
- **Core Schema Entities:** All 35 core relational entities exist and are active in the live PostgreSQL instance:
  - `users`, `user_roles`, `businesses`, `business_members`, `buyer_profiles`, `supplier_profiles`
  - `supplier_verifications`, `verification_documents`, `categories`, `subcategories`
  - `products`, `product_images`, `rfqs`, `rfq_items`, `rfq_recipients`
  - `quotations`, `quotation_items`, `quotation_costs`, `orders`, `order_items`, `order_status_history`
  - `saved_suppliers`, `notifications`, `support_tickets`, `ticket_messages`, `reports`, `admin_audit_logs`
  - `business_service_categories` (7 seeded), `business_service_subcategories` (59 seeded)
  - `service_provider_profiles`, `business_services`, `business_service_portfolios`, `service_requests`, `service_request_quotations`, `service_request_status_history`
- **Data Integrity:** Clean production state with zero mock/fake data. Categories and service taxonomies are correctly seeded.

---

## 2. Module-by-Module Audit & Gap Matrix

| Module | Route Exists | Controller/Logic | DB Integration | Auth & Authz | Validation | Error Handling | Classification | Action Required |
|---|---|---|---|---|---|---|---|---|
| **Auth & Session** | Partial | Partial | Working | Broken (IDOR risk) | Partial | Working | **Security Risk / Partial** | Enforce JWT token verification; forbid self-granting admin; add password reset, profile update, and account deactivation. |
| **Business Management** | Partial | Partial | Working | Missing Authz | Basic | Working | **Partially Implemented** | Add business profile update (`PATCH`), member invitation, member role modification, and business ownership middleware. |
| **Product Marketplace** | Partial | Partial | Working | Missing Authz | Basic | Working | **Partially Implemented** | Add `PATCH /products/:id`, `DELETE /products/:id`, image upload/management, supplier ownership check, and pagination. |
| **Supplier Directory** | Working | Working | Working | N/A (Public) | Good | Working | **Fully Implemented** | Add saved suppliers functionality (`POST /saved`, `GET /saved`, `DELETE /saved/:id`). |
| **RFQ Workflow** | Working | Partial | Working | Missing IDOR Check | Basic | Working | **Partially Implemented** | Implement RFQ cancellation, editing before quote, authorized supplier check on RFQ details, and strict status transitions. |
| **Quotation System** | Working | Partial | Working | Missing Checks | Good | Working | **Partially Implemented** | Add quotation reject/withdraw/edit, duplicate acceptance prevention, quotation expiry validation, and buyer ownership check. |
| **Landed Cost Engine** | Working | Working | Working | N/A | High | High | **Fully Implemented** | Expand to support discounts, packaging, insurance, and expose dedicated calculator endpoint `POST /api/landed-cost/calculate`. |
| **Order Management** | Working | Partial | Working | Missing Checks | Good | Working | **Partially Implemented** | Enforce sequential status state-machine, check buyer/supplier actor permissions per transition, and prevent duplicate order creation. |
| **Business Services** | Working | Working | Working | Basic | Good | Working | **Fully Implemented** | Add customer request cancellation, portfolio management, and provider detail expansion. |
| **Supplier Verification** | Working | Working | Working | Admin Needed | Good | Working | **Implemented - Needs Hardening** | Verify document types, restrict private document access, and log audit history. |
| **Notifications** | Partial | Partial | Working | Missing Checks | Basic | Working | **Partially Implemented** | Add unread count endpoint, mark-all-read endpoint, and automated event emission across RFQ/Quotes/Orders. |
| **Support Tickets** | Working | Partial | Working | Missing Checks | Good | Working | **Partially Implemented** | Add ticket detail with message history (`GET /tickets/:id`), customer/agent reply (`POST /tickets/:id/reply`), and status resolution. |
| **Admin Governance** | Working | Partial | Working | Missing Authz Guard | Good | Working | **Partially Implemented** | Enforce `requireAdmin` middleware; add product moderation, category CRUD, reports queue, and role assignment. |
| **Reports & Moderation** | Missing | Missing | Exists in DB | Missing | Missing | Missing | **Missing** | Implement `POST /api/reports` and `GET/PATCH /api/admin/reports`. |

---

## 3. High-Priority Vulnerabilities & Security Risks

1. **Authentication Token Bypass (IDOR in `/api/auth/me`):**
   - *Issue:* Currently reads `x-user-id` header directly without verifying JWT or session token. Anyone could pass any user's UUID and obtain their profile and roles.
   - *Fix:* Validate the Bearer token or check session authenticity against InsForge Auth.
2. **Self-Granting of Administrative Privileges:**
   - *Issue:* `POST /api/auth/register` accepted `admin`, `verification_admin`, and `support_admin` from public request body.
   - *Fix:* Restrict public registration to standard roles (`buyer`, `manufacturer`, `wholesaler`, `distributor`, `buyer_supplier`, `service_provider`). Admin roles must require explicit assignment by existing administrators.
3. **Quotation Acceptance Race Condition & Cross-Buyer Acceptance:**
   - *Issue:* `POST /api/quotations/:id/accept` did not check if the quotation belongs to the accepting buyer's RFQ, did not check `valid_until` expiry, and did not check if already accepted.
   - *Fix:* Enforce buyer ownership check, status check (`status === 'submitted'`), expiry check, and atomic database update.
4. **Unprotected Admin Endpoints:**
   - *Issue:* `/api/admin/*` endpoints did not enforce backend `requireAdmin` role verification.
   - *Fix:* Implement server-side role validation middleware `requireRole(['admin', 'verification_admin', 'support_admin'])`.

---

## 4. Implementation Plan

- **Step 1:** Architecture & Shared Middleware:
  - Create `backend/src/middleware/auth.ts`: `authenticateToken`, `requireRole`, `requireBusinessMember`, `requireAdmin`.
  - Create standardized API response helpers and error handling middleware.
- **Step 2:** Authentication & Account Management:
  - Enforce token verification, profile update, password reset, account status checks.
- **Step 3:** Business Management:
  - Implement full business profile updates, member management, and ownership validation.
- **Step 4:** Product Marketplace & Supplier Directory:
  - Product CRUD, image management, supplier product authorization, saved suppliers.
- **Step 5:** RFQ & Bulk Sourcing System:
  - RFQ lifecycle state machine, cancellation, supplier recipient matching, authorization on RFQ view.
- **Step 6:** Quotations & Landed Cost Engine:
  - Safe quotation acceptance, rejection, withdrawal, expiry enforcement, and standalone landed-cost calculator.
- **Step 7:** Order Management:
  - Order state machine, transition authorization, status history logging, tracking updates.
- **Step 8:** Verification, Support, Notifications & Reports:
  - Document access control, ticket conversation threads, unread counts, user/product reports.
- **Step 9:** Admin Console Backend:
  - Secured dashboard, user role assignment, product moderation, category management, reports queue.
- **Step 10:** Automated Testing & Verification:
  - Vitest backend integration tests and end-to-end workflow verification.
