# COVERLY End-to-End Business Workflow Report
**Date:** November 13, 2026  
**Status:** VERIFIED & PRODUCTION READY  

---

## Workflow A: Buyer to Supplier to Purchase Order

```mermaid
sequenceDiagram
    autonumber
    actor Buyer
    participant API as COVERLY REST API
    participant DB as InsForge PostgreSQL
    actor Supplier

    Buyer->>API: POST /api/rfqs (Title, items, delivery location)
    API->>DB: INSERT into rfqs & rfq_items (Status: submitted)
    API->>DB: Identify category suppliers & INSERT into rfq_recipients
    Supplier->>API: GET /api/rfqs/supplier/incoming
    API->>DB: SELECT from rfq_recipients
    Supplier->>API: POST /api/quotations (Items, validity, freight, GST)
    API->>DB: INSERT into quotations, quotation_items, quotation_costs
    API->>DB: UPDATE rfqs status -> quotes_received
    API->>DB: INSERT into notifications (Notify buyer)
    Buyer->>API: GET /api/quotations/compare/:rfqId
    API-->>Buyer: Landed cost ranked comparisons
    Buyer->>API: POST /api/quotations/:id/accept
    API->>DB: UPDATE quotations status -> accepted
    API->>DB: UPDATE competing quotations -> rejected
    API->>DB: UPDATE rfqs status -> accepted
    API->>DB: INSERT into orders (Status: pending_deposit)
    API->>DB: INSERT into order_items & order_status_history
    API->>DB: INSERT into notifications (Notify supplier)
    Supplier->>API: PATCH /api/orders/:id/status (in_production -> shipped)
    API->>DB: UPDATE orders status & INSERT status_history
    Buyer->>API: PATCH /api/orders/:id/status (completed)
    API->>DB: Final sign-off logged
```

### Verification & Validation Points
1. **Quantity & Precision:** Line items must have positive integer quantities and validated decimal prices.
2. **Double-Acceptance Safeguard:** Concurrency checks prevent creating multiple orders for a single quotation.
3. **Competing Quotes Rejection:** Accepting one quote automatically updates competing quotes to `rejected`.
4. **Lifecycle Audit:** Every order status transition writes to `order_status_history`.

---

## Workflow B: Supplier Onboarding & Compliance Verification

```mermaid
sequenceDiagram
    autonumber
    actor Supplier
    participant API as COVERLY REST API
    participant DB as InsForge PostgreSQL
    actor Admin

    Supplier->>API: POST /api/directory/onboarding (Name, GSTIN, PAN, City)
    API->>DB: INSERT into businesses & supplier_profiles (Level: unverified)
    API->>DB: INSERT into business_members (Role: owner)
    Supplier->>API: POST /api/verifications/submit (Tier, docs)
    API->>DB: INSERT into supplier_verifications & verification_documents
    Admin->>API: GET /api/admin/verifications?status=pending
    API-->>Admin: Review queue with attachments
    Admin->>API: PATCH /api/admin/verifications/:id (Decision: approved, notes)
    API->>DB: UPDATE supplier_verifications status -> approved
    API->>DB: UPDATE businesses verification_level -> document_verified
    API->>DB: INSERT into admin_audit_logs (VERIFICATION_APPROVED)
    API->>DB: INSERT into notifications (Notify supplier owner)
```

---

## Workflow C: Business Services Marketplace

```mermaid
sequenceDiagram
    autonumber
    actor Provider
    participant API as COVERLY REST API
    participant DB as InsForge PostgreSQL
    actor Client

    Provider->>API: POST /api/business-services (Title, category, pricing, deliverables)
    API->>DB: INSERT into business_services
    Client->>API: GET /api/business-services?category=...
    Client->>API: POST /api/business-services/requests (Requirements, budget)
    API->>DB: INSERT into service_requests (Status: submitted)
    Provider->>API: POST /api/business-services/quotations (Price, turnaround, deliverables)
    API->>DB: INSERT into service_request_quotations & UPDATE request -> quoted
    Client->>API: POST /api/business-services/quotations/:id/respond (action: accept)
    API->>DB: UPDATE request -> accepted -> in_progress
    Provider->>API: PATCH /api/business-services/requests/:id/status (completed)
    API->>DB: UPDATE service_requests -> completed & audit status history
```

---

## Workflow D: Administrative Governance & Security Operations

1. **Platform Metrics:** Aggregated across `businesses`, `rfqs`, `orders` (GMV calculation), `supplier_verifications`, and `products`.
2. **User Governance:** Inspect registered users, view roles, and suspend/reactivate accounts with mandatory reason logging.
3. **Role Management:** Server-side assignment of administrative roles (`admin`, `verification_admin`, `support_admin`).
4. **Moderation Queue:** Moderate product listings and enterprise service listings.
5. **Support Ticket Resolution:** Manage customer disputes, assign tickets, and reply to message threads.
6. **Immutable Audit Logs:** Zero deletion or modification permitted; every administrative action logged with admin ID and target metadata.
