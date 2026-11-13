# COVERLY - Role-Based Access Control (RBAC) & Permission Matrix

This document defines the comprehensive permission architecture governing COVERLY's 9 user experiences. Every action is strictly gated across both backend authorization middleware and PostgreSQL Row Level Security (RLS) policies.

---

## 1. System Role Definitions

| Role ID | Role Name | Primary Operational Mandate |
| :--- | :--- | :--- |
| `guest` | **Guest** | Anonymous visitor exploring public catalog, learning value props, or registering. |
| `buyer` | **Buyer** | Commercial procurement entity issuing RFQs, comparing quotes, and managing POs. |
| `manufacturer` | **Manufacturer** | Production plant listing OEM capabilities, MOQ tiers, and quoting custom runs. |
| `wholesaler` | **Wholesaler** | Bulk inventory stockist selling ready-to-ship lots and local deliveries. |
| `distributor` | **Distributor** | Authorized channel partner holding regional brand distribution licenses. |
| `buyer_supplier`| **Buyer + Supplier** | Dual-persona business with on-the-fly workspace toggle and unified credentialing. |
| `admin` | **Superadmin** | Executive administrator with full platform oversight, user moderation, and config control. |
| `verification_admin`| **Verification Admin**| Ground-truth compliance specialist auditing business legal dossiers and badges. |
| `support_admin` | **Support Admin** | Customer success specialist handling tickets, mediation, and dispute reports. |

---

## 2. Granular Permission Matrix

The table below maps granular capability flags against all 9 roles:

- `ALLOW` = Unconditional permission granted.
- `OWN` = Permission restricted strictly to records owned by the user's business entity.
- `ASSIGN` = Restricted to explicitly assigned or targeted records (e.g. matched RFQ).
- `DENY` = Explicitly forbidden; blocked by middleware and RLS.

| Domain Module & Capability Flag | Guest | Buyer | Manufacturer | Wholesaler | Distributor | Buyer + Supplier | Superadmin | Verification Admin | Support Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **DISCOVERY & CATALOG** | | | | | | | | | |
| `catalog:view_public` | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW |
| `product:create` | DENY | DENY | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | DENY | DENY |
| `product:update_own` | DENY | DENY | OWN | OWN | OWN | OWN | ALLOW | DENY | DENY |
| `product:delete_own` | DENY | DENY | OWN | OWN | OWN | OWN | ALLOW | DENY | DENY |
| `product:moderate_all` | DENY | DENY | DENY | DENY | DENY | DENY | ALLOW | DENY | DENY |
| `category:manage` | DENY | DENY | DENY | DENY | DENY | DENY | ALLOW | DENY | DENY |
| **REQUESTS FOR QUOTATION (RFQ)** | | | | | | | | | |
| `rfq:create` | DENY | ALLOW | DENY | DENY | DENY | ALLOW | ALLOW | DENY | DENY |
| `rfq:view_own` | DENY | OWN | DENY | DENY | DENY | OWN | ALLOW | DENY | DENY |
| `rfq:view_matched` | DENY | DENY | ASSIGN | ASSIGN | ASSIGN | ASSIGN | ALLOW | DENY | DENY |
| `rfq:view_all_unrestricted` | DENY | DENY | DENY | DENY | DENY | DENY | ALLOW | DENY | DENY |
| `rfq:cancel_own` | DENY | OWN | DENY | DENY | DENY | OWN | ALLOW | DENY | DENY |
| **QUOTATIONS & LANDED COST** | | | | | | | | | |
| `quotation:submit` | DENY | DENY | ASSIGN | ASSIGN | ASSIGN | ASSIGN | ALLOW | DENY | DENY |
| `quotation:view_own_sent` | DENY | DENY | OWN | OWN | OWN | OWN | ALLOW | DENY | DENY |
| `quotation:view_received_on_rfq`| DENY | OWN | DENY | DENY | DENY | OWN | ALLOW | DENY | DENY |
| `quotation:compare_on_rfq` | DENY | OWN | DENY | DENY | DENY | OWN | ALLOW | DENY | DENY |
| `quotation:accept_and_order` | DENY | OWN | DENY | DENY | DENY | OWN | ALLOW | DENY | DENY |
| `quotation:withdraw_own` | DENY | DENY | OWN | OWN | OWN | OWN | ALLOW | DENY | DENY |
| `quotation:audit_calculations`| DENY | OWN | OWN | OWN | OWN | OWN | ALLOW | DENY | DENY |
| **ORDERS & FULFILLMENT** | | | | | | | | | |
| `order:view_own_as_buyer` | DENY | OWN | DENY | DENY | DENY | OWN | ALLOW | DENY | ALLOW |
| `order:view_own_as_supplier` | DENY | DENY | OWN | OWN | OWN | OWN | ALLOW | DENY | ALLOW |
| `order:confirm_as_supplier` | DENY | DENY | OWN | OWN | OWN | OWN | ALLOW | DENY | DENY |
| `order:update_dispatch_status`| DENY | DENY | OWN | OWN | OWN | OWN | ALLOW | DENY | DENY |
| `order:confirm_delivery_buyer`| DENY | OWN | DENY | DENY | DENY | OWN | ALLOW | DENY | DENY |
| `order:cancel_pre_dispatch` | DENY | OWN | OWN | OWN | OWN | OWN | ALLOW | DENY | ALLOW |
| `order:audit_all_platform` | DENY | DENY | DENY | DENY | DENY | DENY | ALLOW | DENY | ALLOW |
| **VERIFICATION & TRUST** | | | | | | | | | |
| `verification:view_badge_public`| ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW |
| `verification:submit_dossier` | DENY | DENY | OWN | OWN | OWN | OWN | ALLOW | DENY | DENY |
| `verification:audit_queue` | DENY | DENY | DENY | DENY | DENY | DENY | ALLOW | ALLOW | DENY |
| `verification:assign_badge_level`| DENY | DENY | DENY | DENY | DENY | DENY | ALLOW | ALLOW | DENY |
| `verification:inspect_private_docs`| DENY | DENY | OWN | OWN | OWN | OWN | ALLOW | ALLOW | DENY |
| **GOVERNANCE & SYSTEM** | | | | | | | | | |
| `admin:access_dashboard` | DENY | DENY | DENY | DENY | DENY | DENY | ALLOW | ALLOW | ALLOW |
| `admin:manage_users` | DENY | DENY | DENY | DENY | DENY | DENY | ALLOW | DENY | DENY |
| `admin:suspend_account` | DENY | DENY | DENY | DENY | DENY | DENY | ALLOW | DENY | DENY |
| `admin:view_audit_logs` | DENY | DENY | DENY | DENY | DENY | DENY | ALLOW | DENY | DENY |
| `admin:modify_platform_settings`| DENY | DENY | DENY | DENY | DENY | DENY | ALLOW | DENY | DENY |
| `support:triage_tickets` | DENY | DENY | DENY | DENY | DENY | DENY | ALLOW | DENY | ALLOW |
| `support:submit_dispute_report`| DENY | OWN | OWN | OWN | OWN | OWN | ALLOW | DENY | DENY |

---

## 3. The Dual-Role Architecture (`buyer_supplier`)

Under no circumstance should a user who both sources raw materials and manufactures finished goods be required to maintain two separate login emails or duplicate profiles.

### Technical Implementation:
1. **Shared Identity**: A single record in `auth.users` and `public.users`.
2. **Dual Capability Flags**: `public.user_roles` holds records for both `buyer` and the designated supplier type (`manufacturer`, `wholesaler`, or `distributor`).
3. **Workspace Switcher**: The frontend stores active workspace mode (`workspace: 'buyer' | 'supplier'`) in `RoleContext`.
4. **Header Switcher Pill**: A prominent toggle in the application top navigation allows 1-click switching:
   ```text
   [ Switch to Supplier Workspace (Ludhiana Garments) ⇄ ]
   ```
5. **Session Claims**: The JWT token encodes the `active_business_id` and all authorized role slugs. Backend requests validate that the active operation matches an authorized capability of the current business context.

---

## 4. Backend Authorization Middleware Implementation

Route protection in Express follows a 2-stage pipeline:

```typescript
// 1. Authentication: Validates JWT signature and populates req.user
app.use('/api', authenticateJwt);

// 2. Authorization: Checks specific capability flag against user's active role
router.post(
  '/api/rfqs',
  authorizeCapability('rfq:create'),
  createRfqHandler
);

router.post(
  '/api/admin/verifications/:id/decision',
  authorizeRole(['admin', 'verification_admin']),
  auditVerificationHandler
);
```

---

## 5. PostgreSQL Row Level Security (RLS) Mapping

Database security mirrors the permission table directly at the Postgres engine level:

```sql
-- Example 1: Buyer can ONLY view their own RFQs
CREATE POLICY "Buyers view own RFQs" ON public.rfqs
  FOR SELECT TO authenticated
  USING (
    buyer_id IN (
      SELECT id FROM public.buyer_profiles WHERE business_id IN (
        SELECT business_id FROM public.business_members WHERE user_id = auth.uid()
      )
    )
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Example 2: Suppliers can ONLY view RFQs specifically dispatched to them
CREATE POLICY "Suppliers view dispatched RFQs" ON public.rfq_recipients
  FOR SELECT TO authenticated
  USING (
    supplier_id IN (
      SELECT id FROM public.supplier_profiles WHERE business_id IN (
        SELECT business_id FROM public.business_members WHERE user_id = auth.uid()
      )
    )
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Example 3: Private verification documents are strictly locked to owner and verification admins
CREATE POLICY "Verification docs restricted" ON public.verification_documents
  FOR SELECT TO authenticated
  USING (
    verification_id IN (
      SELECT id FROM public.supplier_verifications WHERE business_id IN (
        SELECT business_id FROM public.business_members WHERE user_id = auth.uid()
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'verification_admin')
    )
  );
```
