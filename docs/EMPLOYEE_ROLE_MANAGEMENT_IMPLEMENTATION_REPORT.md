# COVERLY Admin & Buyer Ecosystem: Employee Role Management & RBAC Governance
## Complete Full-Stack Integration Report

**Date:** November 17, 2026  
**System:** COVERLY B2B Wholesale Platform  
**Target Environment:** Node.js, Express, React 18, Vite, TypeScript, Tailwind CSS, InsForge PostgreSQL BaaS  

---

## 1. Executive Summary

This implementation establishes comprehensive **Role-Based Access Control (RBAC)**, **Employee Account Provisioning**, and **Multi-Branch Governance** within the COVERLY Admin Panel and Buyer / Business Owner Portal.

Three designated enterprise employee roles have been introduced with distinct operational boundaries, spending limits, and audit logs:
1. **Procurement Manager (`procurement_manager`)**: Discovers products and vetted suppliers, manages RFQs, compares incoming quotations, reviews purchase requisitions submitted by purchase staff, approves or rejects requisitions within assigned authority limits, issues official Purchase Orders (POs), and manages supplier negotiations.
2. **Purchase Staff (`purchase_staff` / `purchase_executive`)**: Discovers wholesale products, maintains departmental sourcing lists, drafts RFQs, collects quotation bids, and submits formal Purchase Requests (PR) to their manager for review. Restrained by default from approving purchases, editing finance records, or issuing payments.
3. **Finance / Accounts Staff (`finance_staff` / `accounts_executive`)**: Inspects purchase orders, uploads and manages supplier tax invoices, reviews GSTIN and tax rates (18%/12%/5%), itemizes freight and landed expenses, tracks payment milestones (`unpaid`, `partially_paid`, `paid`, `disputed`), logs bank UTR transaction references, and downloads audit-ready financial datasets. Restrained by default from RFQ approval, purchase approvals, or supplier selection.

---

## 2. Database Schema & Architecture (`migrations/20261117210000_employee_role_management.sql`)

### 2.1 Role Constraints & Branch References
- **`business_members`**:
  - `role_in_business` check constraint extended to include:
    `owner`, `business_manager`, `procurement_manager`, `purchase_staff`, `purchase_executive`, `finance_staff`, `accounts_executive`, `store_manager`, `staff`, `admin`, `sales`, `procurement`, `viewer`.
  - Added `branch_id UUID REFERENCES public.business_branches(id) ON DELETE SET NULL`.
  - Indexed on `branch_id`.
- **`business_invitations`**:
  - Role check constraint updated matching all new roles.
  - Added `branch_id UUID REFERENCES public.business_branches(id) ON DELETE SET NULL`.

### 2.2 Employee Activity Audit Trail (`employee_activity_logs`)
- Columns:
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE`
  - `user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE`
  - `branch_id UUID REFERENCES public.business_branches(id) ON DELETE SET NULL`
  - `activity_type TEXT NOT NULL` (`po_issued`, `purchase_request_created`, `purchase_request_approved`, `purchase_request_rejected`, `invoice_recorded`, `payment_recorded`, `expense_recorded`, `account_activated`, `account_suspended`, `member_invited`)
  - `description TEXT NOT NULL`
  - `entity_type TEXT` (`purchase_order`, `purchase_request`, `purchase_invoice`, `purchase_expense`, `business_invitation`, etc.)
  - `entity_id TEXT`
  - `metadata JSONB DEFAULT '{}'::jsonb`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- Multi-column indexing for real-time audit querying.

### 2.3 Supplier Invoices (`purchase_invoices`)
- Columns:
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE`
  - `supplier_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE RESTRICT`
  - `purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL`
  - `order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL`
  - `invoice_number TEXT NOT NULL`
  - `invoice_date DATE NOT NULL DEFAULT CURRENT_DATE`
  - `due_date DATE`
  - `currency TEXT NOT NULL DEFAULT 'INR'`
  - `subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0`
  - `freight_charges NUMERIC(12, 2) NOT NULL DEFAULT 0`
  - `additional_charges NUMERIC(12, 2) NOT NULL DEFAULT 0`
  - `gst_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.18`
  - `gst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0`
  - `total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0`
  - `payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid', 'disputed'))`
  - `amount_paid NUMERIC(14, 2) NOT NULL DEFAULT 0`
  - `payment_reference TEXT` (Bank UTR / NEFT / Cheque)
  - `file_url TEXT`
  - `notes TEXT`
  - `recorded_by UUID NOT NULL REFERENCES public.users(id)`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

### 2.4 Purchase Expenses (`purchase_expenses`)
- Columns:
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE`
  - `purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL`
  - `invoice_id UUID REFERENCES public.purchase_invoices(id) ON DELETE SET NULL`
  - `expense_category TEXT NOT NULL CHECK (expense_category IN ('freight', 'packaging', 'insurance', 'loading_unloading', 'customs_duty', 'storage_warehouse', 'other'))`
  - `amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0)`
  - `description TEXT NOT NULL`
  - `vendor_name TEXT`
  - `payment_reference TEXT`
  - `payment_date DATE NOT NULL DEFAULT CURRENT_DATE`
  - `recorded_by UUID NOT NULL REFERENCES public.users(id)`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

### 2.5 Security & Row-Level Security (RLS)
- Full RLS enabled across `employee_activity_logs`, `purchase_invoices`, and `purchase_expenses`.
- Isolation policy ensures tenant business members can only inspect and manage their organization's records while admin users retain cross-tenant visibility.

---

## 3. Backend Implementation & API Endpoints

### 3.1 Admin Employee Governance Endpoints (`backend/src/routes/admin.ts`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/employee-dashboard` | Computes live counts: Total Employees, Procurement Managers, Purchase Staff, Finance Staff, Active Staff, Suspended Staff, Pending Invites, and Recent Activities |
| `GET` | `/api/admin/employees` | Filterable employee roster by role, business, branch, active status, and search query |
| `POST` | `/api/admin/employees` | Direct employee account creation with hashed individual credentials, role assignment, branch mapping, default permission matrix, and activity audit logging |
| `PUT` | `/api/admin/employees/:id` | Modifies employee role, spending limit, branch assignment, and granular permissions |
| `PATCH` | `/api/admin/employees/:id/status` | Activates or suspends employee accounts with audit reason |
| `DELETE` | `/api/admin/employees/:id` | Soft-deactivates employee (`is_active = false`) to revoke immediate access while preserving historic PR, RFQ, and PO data integrity |
| `GET` | `/api/admin/employees/:id/activity` | Returns complete immutable activity audit trail for employee |

### 3.2 Buyer & Finance Staff Endpoints (`backend/src/routes/buyers.ts`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/buyer/invoices` | Retrieves supplier invoices with filtering (`unpaid`, `partially_paid`, `paid`, `disputed`) and financial summary metrics |
| `POST` | `/api/buyer/invoices` | Finance Staff records incoming invoice against PO, validates GST rates, computes totals, auto-logs freight expenses, and records audit trail |
| `PATCH` | `/api/buyer/invoices/:id/payment` | Updates payment status, cumulative amount paid, bank UTR reference, and audit log |
| `GET` | `/api/buyer/expenses` | Returns itemized purchase expenses grouped by category (`freight`, `packaging`, `insurance`, `customs`, etc.) |
| `POST` | `/api/buyer/expenses` | Finance Staff records direct purchase expenses with positive amount verification |
| `GET` | `/api/buyer/financial-summary` | Executive financial summary: PO commitments, total invoiced, paid, pending, GST eligible, and total landed expenditure |
| `GET` | `/api/buyer/team/:memberId/activity` | Business Owner inspects activity audit log for a specific employee |
| `POST` | `/api/buyer/purchase-orders` | Verified role guard: Restricts PO generation to Procurement Manager, Owner, or Business Manager; enforces spending limits |

---

## 4. Frontend Architecture & User Interfaces

### 4.1 Admin Employee Console (`frontend/src/pages/admin/AdminEmployeesPage.tsx`)
- **Executive Metric Cards**:
  - Total Staff, Procurement Managers, Purchase Staff, Finance/Accounts, Active Staff, Suspended, Pending Invitations.
- **Multi-Filter Bar**:
  - Live search by Name, Email, Business Name, or Role.
  - Role dropdown filter (`procurement_manager`, `purchase_staff`, `finance_staff`, etc.).
  - Status toggle filter (`all`, `active`, `suspended`).
- **Data Table**:
  - Employee credentials & contact details.
  - Business & Branch name badge.
  - Role badge with color differentiation.
  - Spending authority limit (e.g. ₹5,00,000 or Unlimited).
  - Granular permissions tags.
  - One-click account activation / suspension toggle.
  - Quick action toolbar: View Activity Log, Edit Permissions, Soft Revoke.
- **Account Provisioning Modal**:
  - Fields: Full Name, Work Email, Initial Password, Phone, Business Selector, Branch Dropdown.
  - Role selector with auto-preset button applying recommended permissions and limits.
  - Granular permission checkboxes (`view`, `create`, `edit`, `approve`, `reject`, `delete`, `export`, `manage`).
- **Activity Audit Trail Modal**:
  - Real-time chronological timeline displaying activity types, descriptions, branch references, and metadata JSON.

### 4.2 Finance / Accounts Console (`frontend/src/pages/buyer/InvoicesExpensesPage.tsx`)
- **Landed Cost KPI Grid**:
  - PO Commitments, Invoiced Amount, Paid Funds, Pending Payables, GST Input Credit, Freight & Landing Costs.
- **Tab 1: Supplier Invoices**:
  - Status filter tabs (`all`, `unpaid`, `partially_paid`, `paid`, `disputed`).
  - Invoice items with Supplier GSTIN, Linked PO Number, Subtotal, Freight, GST Amount, Total, and Pending Balance.
  - "Record Supplier Invoice" modal with live auto-calculating GST and Total preview.
  - "Update Payment Record" modal for recording bank UTR, Cheque number, NEFT, and payment amounts.
- **Tab 2: Purchase Landed Expenses**:
  - Expense category breakdown for freight, packaging, insurance, loading, and customs.
  - "Record Purchase Expense" modal.
- **Tab 3: Financial Summary & Reports**:
  - Landed procurement expenditure breakdown.
  - One-click download of audit dataset in `.JSON` format for tax preparation.

### 4.3 Buyer Team Page Enhancement (`frontend/src/pages/buyer/BuyerTeamPage.tsx`)
- Updated Role selector to include `procurement_manager`, `purchase_staff`, `finance_staff`.
- Integrated Branch selector loaded dynamically from `GET /api/buyer/branches`.
- Added Member Activity Audit Trail viewer modal accessible directly from the team roster.

### 4.4 Navigation Updates
- `AdminLayout.tsx`: Added "Employees & RBAC" (`/admin/employees`) with `UserCog` icon.
- `AdminDashboardPage.tsx`: Added "Employees & RBAC" Administrative Module card.
- `BuyerLayout.tsx`: Added "Invoices & Expenses" (`/buyer/invoices`) with `Receipt` icon.
- `AppRouter.tsx`: Registered routes for `/admin/employees` and `/buyer/invoices`.

---

## 5. Automated Verification & Test Results

A dedicated test suite was built in `backend/test/employee_role_workflows.test.ts` covering 16 verification scenarios:

```
▶ COVERLY Admin & Buyer Employee Role Management Integration Tests
  ✔ ERM-1: Admin direct employee creation with role, branch, and default permissions (0.9ms)
  ✔ ERM-2: Admin filters employee roster by role, branch, and active status (0.1ms)
  ✔ ERM-3: Admin updates permissions, spending limit, and toggles account status (0.1ms)
  ✔ ERM-4: Soft revocation preserves historical audit trails and relations (1.2ms)
  ✔ ERM-5: Admin Employee Dashboard KPI aggregation (0.3ms)
  ✔ ERM-6: Purchase Staff creates purchase requisition request (0.1ms)
  ✔ ERM-7: Purchase Staff is blocked from approving purchase requests or issuing POs (0.1ms)
  ✔ ERM-8: Procurement Manager approves purchase request within spending limit (0.1ms)
  ✔ ERM-9: Procurement Manager approval blocked when PR exceeds spending limit (0.1ms)
  ✔ ERM-10: Procurement Manager issues Purchase Order with spending limit verification (0.3ms)
  ✔ ERM-11: Finance Staff records incoming invoice with GST, freight, and auto calculations (0.2ms)
  ✔ ERM-12: Finance Staff maintains invoice payment records across statuses (0.1ms)
  ✔ ERM-13: Finance Staff records standalone purchase expenses with category validation (0.1ms)
  ✔ ERM-14: Finance Staff is blocked from RFQ creation/approval and PO issuance (0.1ms)
  ✔ ERM-15: Financial summary metrics aggregation for Finance Staff & Owner (0.1ms)
  ✔ ERM-16: Employee activity logs correctly record actions with branch assignment (0.1ms)
✔ COVERLY Admin & Buyer Employee Role Management Integration Tests (5.2ms)
ℹ tests 16, pass 16, fail 0
```

### Overall Backend Test Run
- Total test suites: **14**
- Total passing tests: **135 passed**, **0 failed**
- TypeScript build check: **0 errors** (`npm --prefix backend run build` exited with code 0)
- Frontend build check: **0 errors** (`npm --prefix frontend run build` exited with code 0)

---

## 6. Security and Compliance Summary
1. **Zero Database Record Deletion on Revoke**:
   - Deleting or revoking employee access sets `is_active = false` and records a revocation timestamp, preventing broken foreign key relationships on previous purchase orders, requests, and invoice records.
2. **Strict Authority Guardrails**:
   - Purchase Staff and Finance Staff are blocked at the controller level from executing purchase approvals or issuing unauthorized Purchase Orders.
   - High-value purchases exceeding a Procurement Manager's assigned `spending_limit` are blocked from manager-level self-approval and automatically require Business Owner authorization.
3. **Immutable Audit Trail**:
   - Critical lifecycle events across requisitions, approvals, rejections, invoices, expenses, and payments generate persistent rows in `employee_activity_logs`.
