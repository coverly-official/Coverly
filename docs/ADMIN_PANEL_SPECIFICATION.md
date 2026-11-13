# COVERLY - Administrative & Governance Panel Specification

This document details the functional specifications, audit consoles, and administrative workflows governing the three managerial personas: **Superadmin**, **Verification Admin**, and **Support Admin**.

---

## 1. Administrative Role Matrix & Console Boundaries

```
+---------------------------------------------------------------------------------+
|                               ADMINISTRATIVE CONSOLE                             |
+---------------------------------------------------------------------------------+
|  1. Superadmin (admin)                                                          |
|     - Complete platform oversight, user management, and account suspension.     |
|     - Global taxonomy creation (Categories, Subcategories, Default Units).      |
|     - Real-time marketplace analytics and financial KPI aggregation.            |
|     - Platform configuration (SLA parameters, session timeouts).                |
|     - Immutable audit logs inspection.                                          |
+---------------------------------------------------------------------------------+
|  2. Verification Admin (verification_admin)                                     |
|     - Dedicated Ground-Truth Verification Queue.                                |
|     - Document inspection (GSTIN, Udyam MSME, PAN, Factory Electricity Bills).  |
|     - Geo-tagged plant photography review and machinery capacity checks.        |
|     - Assignment of discrete badges: Level 1, Level 2, Level 3, Level 4.        |
|     - Issuing action-required remarks for incomplete dossiers.                  |
+---------------------------------------------------------------------------------+
|  3. Support Admin (support_admin)                                               |
|     - Customer support ticketing queue (In-App + Email).                        |
|     - Dispute resolution between buyers and suppliers on active orders.         |
|     - Reviewing reported listings and off-platform solicitations.               |
|     - Escalating severe infractions to Superadmin for immediate suspension.    |
+---------------------------------------------------------------------------------+
```

---

## 2. Verification Admin Console (`/admin/verifications`)

### 2.1 The Verification Queue
The audit queue aggregates pending dossiers submitted by manufacturers, wholesalers, and distributors seeking Level 3 or Level 4 verified trust status:

```text
+---------------------------------------------------------------------------------------------------+
| PENDING VERIFICATION DOSSIERS (3 Awaiting Audit)                                                  |
+-----------------------+--------------+------------------+---------------------+-------------------+
| Business Name         | Entity Type  | Location         | Submitted Documents | Review Action     |
+-----------------------+--------------+------------------+---------------------+-------------------+
| Ludhiana Garments Co  | Manufacturer | Ludhiana, Punjab | GSTIN, Udyam, Plant | [ Open Dossier ]  |
| Raipur Steel Traders  | Wholesaler   | Raipur, C.G.     | GSTIN, Electricity | [ Open Dossier ]  |
| Tiruppur Knits Ltd    | Manufacturer | Tiruppur, T.N.   | GSTIN, Plant, ISO   | [ Open Dossier ]  |
+-----------------------+--------------+------------------+---------------------+-------------------+
```

### 2.2 Dual-Pane Document Inspector
Clicking `Open Dossier` launches a split console view:
- **Left Pane (50%)**: Embedded secure PDF/Image viewer rendering high-resolution documents stored in InsForge private bucket `verification-docs`. Includes zoom, pan, and page rotate controls.
- **Right Pane (50%)**: Verification checklist with active government portal cross-reference:
  1. `[x] GSTIN Active & Valid`: Validated against National GST API.
  2. `[x] Legal Name Match`: Matches name on PAN and Bank settlement records.
  3. `[x] Premise Location Check`: Registered address corresponds with factory photo geo-tagging.
  4. `[x] Machinery Capacity Verified`: Stated monthly units align with installed hardware.

### 2.3 Verification Decision Actions
- **`Approve Level 3 (Business Documents Reviewed)`**:
  - Updates `businesses.verification_level = 'level_3'`.
  - Emits verification badge in search results.
  - Automatically notifies supplier.
- **`Approve Level 4 (Premise & Capacity Audited)`**:
  - Granted when independent factory inspection or verified geo-tagged machinery proofs are logged.
  - Updates `businesses.verification_level = 'level_4'`.
- **`Request Additional Information`**:
  - Sets status to `action_required`.
  - Supplier receives notification detailing missing or illegible documents.
- **`Reject Submission`**:
  - Sets status to `rejected`.
  - Disables verified badge and logs detailed audit reasoning.

---

## 3. Support Admin Console (`/admin/support` & `/admin/reports`)

### 3.1 Dispute & Complaint Triage
Support Admins manage customer issues reported by buyers or suppliers:
- **Issue Types**:
  - `Payment Dispute`: Discrepancy between quoted advance and invoice demand.
  - `Quality Non-Compliance`: Goods received deviate from RFQ technical specs.
  - `Dispatch Delay`: Supplier exceeds stated production lead time without update.
  - `Deceptive Listing`: Suspected counterfeit goods or fake factory claims.

### 3.2 Mediation Workflow
1. Support Admin reviews the initial complaint, attached evidence photos, and associated Purchase Order (`public.orders`).
2. Admin opens a tripartite mediation thread tethered directly to the order.
3. If amicable resolution is achieved (e.g. supplier issues freight concession or replaces batch), the ticket is marked `resolved`.
4. If deliberate fraud or non-delivery occurs, Support Admin flags the account for Superadmin suspension.

---

## 4. Superadmin System Governance (`/admin/dashboard` & `/admin/settings`)

### 4.1 Account Moderation & Suspension
Superadmins possess exclusive authority to suspend business accounts or terminate user sessions:
- **Suspension Mechanics**:
  - Sets `public.businesses.is_active = false`.
  - Sets all associated products to `is_active = false`.
  - Cancels all pending quotation opportunities.
  - Revokes active InsForge JWT session tokens immediately.
- **Audit Mandate**: Every suspension requires an explicit administrative justification ($\ge 25$ characters), which is permanently stored in `public.admin_audit_logs`.

### 4.2 Platform Configuration Controls
Superadmins adjust marketplace operating parameters without modifying code:
- `concierge_response_sla_hours`: Target turnaround for pilot requests (Default: 48h).
- `max_rfq_validity_days`: Automatic expiration window for inactive RFQs (Default: 14 days).
- `default_quote_validity_days`: Default validity period for supplier quotes (Default: 7 days).
- `minimum_supplier_quoting_buffer_hours`: Buffer before RFQ deadline (Default: 6h).
- `maintenance_mode`: Read-only toggle for database maintenance windows.

---

## 5. Immutable Admin Audit Trail (`public.admin_audit_logs`)

To prevent abuse of administrative authority and satisfy corporate compliance, all administrative mutations create append-only audit records:

```sql
INSERT INTO public.admin_audit_logs (
  admin_user_id,
  action_type,
  target_entity_type,
  target_entity_id,
  ip_address,
  metadata
) VALUES (
  'uuid-admin',
  'verification_approved',
  'businesses',
  'uuid-business-ludhiana',
  '192.168.1.50',
  '{"previous_level": "level_0", "new_level": "level_3", "reviewer_notes": "GSTIN verified active"}'::jsonb
);
```

> **Security Rule**: The `admin_audit_logs` table has no `UPDATE` or `DELETE` permissions granted to any role or database user, ensuring an immutable forensic record.
