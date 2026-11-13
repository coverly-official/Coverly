# COVERLY - Security Architecture & Threat Mitigation Specification

This document defines the end-to-end security architecture of COVERLY, enforcing defense-in-depth across the client browser, API middleware, business services, PostgreSQL Row Level Security (RLS), and InsForge cloud storage.

---

## 1. Security Architecture & Threat Model

```
+-----------------------------------------------------------------------------------+
| LAYER 1: CLIENT BROWSER                                                           |
| - React ProtectedRoute & RoleGuard navigation interception.                       |
| - Memory-only access token handling; zero credential persistence in localStorage. |
| - Strict Sanitization: DOMPurify and React auto-escaping against XSS.             |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
| LAYER 2: EXPRESS API GATEWAY                                                      |
| - Helmet HTTP Headers: CSP, HSTS, X-Frame-Options: DENY, X-Content-Type-Options.  |
| - Rate Limiter: Window-based IP throttling preventing brute force and scraping.   |
| - Joi/Zod Schema Validation: Rejects malformed or unexpected request payloads.    |
| - JWT Signature Validation: Verifies cryptographically signed InsForge tokens.    |
| - Capability Authorization: Validates user permissions before route execution.   |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
| LAYER 3: BUSINESS SERVICE LAYER                                                   |
| - Ownership Verification: Verifies caller owns the target RFQ, Quote, or PO.     |
| - State Machine Verification: Rejects illegal milestone transitions.              |
| - Anti-Tamper Landed Cost Engine: Server re-computes all quote totals.             |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
| LAYER 4: POSTGRESQL ROW LEVEL SECURITY (RLS)                                      |
| - Database engine enforces user isolation using auth.uid() context.               |
| - Immutable Audit Logging: INSERT-only administrative records.                    |
| - Private InsForge S3 Buckets: Gated verification document access.                |
+-----------------------------------------------------------------------------------+
```

---

## 2. Granular Security Policies & Enforcements

### 2.1 Cross-Tenant Isolation (Anti-Data Leakage)
1. **Buyer RFQ Isolation**:
   - A buyer can *never* query or view another buyer's private RFQs or received quotations.
   - Enforced by PostgreSQL RLS:
     ```sql
     CREATE POLICY "Buyer RFQ Isolation" ON public.rfqs
       FOR SELECT USING (
         buyer_id IN (
           SELECT id FROM public.buyer_profiles WHERE business_id IN (
             SELECT business_id FROM public.business_members WHERE user_id = auth.uid()
           )
         )
         OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
       );
     ```
2. **Supplier RFQ Isolation**:
   - A supplier can *only* access RFQs that have been explicitly matched or targeted to them via a `public.rfq_recipients` record.
   - Suppliers cannot view other suppliers' quotations on the same RFQ.
3. **Quotation Integrity**:
   - A supplier cannot modify, view, or delete another supplier's quotations.
   - Quotation prices cannot be updated once marked `accepted`.

### 2.2 Order Fulfillment Access Control
- Only the buyer and supplier linked to a Purchase Order can view or interact with that order.
- Status transitions are validated against the state machine:
  - Only the assigned supplier can mark an order `dispatched`.
  - Only the assigned buyer can mark an order `completed`.
- Concurrent double-acceptance is blocked by a unique database constraint on `orders.quotation_id`.

### 2.3 Ground-Truth Verification Document Security
- Business documents (GSTIN registration, Udyam MSME, electricity bills, plant photos) are stored in the private InsForge bucket `verification-docs`.
- The bucket RLS policy restricts read access exclusively to:
  1. The uploading supplier's verified business members.
  2. Platform users holding `admin` or `verification_admin` roles.
- Public visitors attempting to access private document URLs receive an `HTTP 403 Forbidden` response.

---

## 3. Input Validation & Injection Prevention

1. **SQL Injection Mitigation**:
   - All database queries are executed using PostgREST parameterization through `@insforge/sdk` or parameterized queries. Raw string concatenation is strictly prohibited.
2. **Strict Payload Validation**:
   - Every mutation route executes a Joi/Zod validator before entering the business controller:
     ```typescript
     export const createQuoteSchema = Joi.object({
       rfq_id: Joi.string().uuid().required(),
       production_lead_time_days: Joi.number().integer().min(1).max(180).required(),
       payment_terms: Joi.string().valid('100% Advance', '30-70', 'Net 30').required(),
       freight: Joi.number().min(0).precision(2).required(),
       gst_rate: Joi.number().valid(0.05, 0.12, 0.18, 0.28).required(),
       items: Joi.array().items(
         Joi.object({
           rfq_item_id: Joi.string().uuid().required(),
           unit_price: Joi.number().positive().precision(2).required(),
           quoted_quantity: Joi.number().integer().positive().required(),
           moq: Joi.number().integer().positive().required(),
         })
       ).min(1).required(),
     });
     ```
3. **File Upload Hardening**:
   - MIME-type inspection (checking file magic bytes, not just file extensions).
   - Maximum upload size constrained to $10\text{MB}$.
   - Filenames are replaced with randomized UUIDs to prevent directory traversal attacks.

---

## 4. Rate Limiting & Denial-of-Service Defense

API rate limiting is configured via `express-rate-limit`:

| Route Group | Window | Max Requests | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/auth/*` | 15 minutes | 10 requests | Prevents credential stuffing & brute-force attacks |
| `/api/search/*` | 1 minute | 60 requests | Throttles automated competitor catalog scrapers |
| `/api/rfqs` | 1 hour | 20 creations | Blocks automated RFQ spamming |
| General `/api/*` | 1 minute | 120 requests | General API availability safeguard |

---

## 5. Security Audit Logging (`public.admin_audit_logs`)

All privileged operations are immutably captured:
- User suspensions and reactivations
- Verification badge approvals, rejections, and level changes
- Product moderation and delistings
- Platform configuration adjustments

Audit records capture: `admin_user_id`, `action_type`, `target_entity_type`, `target_entity_id`, `ip_address`, `user_agent`, and `payload_diff`. The audit table is strictly append-only.
