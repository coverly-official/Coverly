# COVERLY — Testing Specification & QA Strategy

This document establishes the comprehensive quality assurance framework, automated testing matrix, security audit procedures, and validation checklists for the COVERLY B2B Wholesale Platform.

---

## 1. Testing Philosophy & Architecture

The testing strategy follows the standard testing pyramid adapted for modern cloud B2B SaaS:

```
          / \
         / E2E \        (End-to-End User Journeys via Playwright / Vitest)
        /-------\
       /  Integ  \      (API Route Integration & InsForge RLS Validation)
      /-----------\
     /    Unit     \    (Pure Functions, Landed Cost Engine, Schema Validators)
    /---------------\
```

### Core Tenets
1. **Mathematical Invariance**: Landed cost calculations must produce byte-exact results across unit prices, freight, insurance, and GST rates.
2. **Zero Unauthorized Access**: Every API route and database query must fail closed when unauthenticated or lacking appropriate role claims.
3. **Multi-Role Isolation**: A buyer cannot view another buyer's RFQs; a supplier cannot see competing quotations.
4. **Idempotent Transitions**: Status state machines (RFQ states, Order states) must reject illegal transitions with deterministic errors.

---

## 2. Test Suites & Execution Commands

| Scope | Tooling | Target | Command |
|---|---|---|---|
| **Unit Tests** | Vitest | Calculation engines, formatters, validation schemas | `npm run test` |
| **API Integration** | Supertest + Vitest | Express REST routes, auth guards, response structures | `npm run test:api` |
| **Database & RLS** | InsForge CLI + pgTAP | PostgreSQL Row Level Security policies, triggers | `npx @insforge/cli db test` |
| **Type Check** | TypeScript `tsc` | Strict type adherence across frontend and backend | `npm run typecheck` |
| **Frontend Unit** | Vitest + React Testing Library | Component states, form validation, hooks | `npm run test:ui` |
| **End-to-End** | Playwright | Full browser-driven workflows across all 9 roles | `npx playwright test` |

---

## 3. Workflow Verification Matrix (9 User Roles)

### Workflow 1: Guest Browsing & Discovery
- [ ] **TC-G01**: Unauthenticated user loads `/` and receives 200 OK with Warm Ledger theme tokens.
- [ ] **TC-G02**: User searches products with query `"steel"` and receives matching catalog items.
- [ ] **TC-G03**: User filters products by MOQ $\le 100$ and category `"Industrial Supplies"`.
- [ ] **TC-G04**: User views public supplier profile at `/suppliers/:slug` without encountering login prompt.
- [ ] **TC-G05**: User clicks "Submit RFQ" and is immediately redirected to `/auth/login?redirect=/buyer/rfq/new`.

### Workflow 2: Buyer Sourcing & Order Lifecycle
- [ ] **TC-B01**: Buyer logs in and accesses `/buyer/dashboard` with personalized active metrics.
- [ ] **TC-B02**: Buyer creates multi-item RFQ with specifications, target price, delivery pincode, and target date.
- [ ] **TC-B03**: RFQ transitions from `draft` to `submitted` and dispatches to matched suppliers.
- [ ] **TC-B04**: Buyer views incoming quotations for RFQ at `/buyer/rfqs/:id/quotations`.
- [ ] **TC-B05**: Buyer opens `/buyer/rfqs/:id/compare` and verifies side-by-side cost breakdown.
- [ ] **TC-B06**: Buyer accepts quotation $\to$ Order is instantiated in `pending_deposit` status.
- [ ] **TC-B07**: Buyer confirms delivery $\to$ Order status updates to `completed`.

### Workflow 3: Manufacturer Catalog & RFQ Bidding
- [ ] **TC-M01**: Manufacturer completes onboarding with factory location, production capacity, and certifications.
- [ ] **TC-M02**: Manufacturer creates a new product with tiered volume pricing:
  - 50–99 units: ₹1,200/unit
  - 100–499 units: ₹1,050/unit
  - 500+ units: ₹900/unit
- [ ] **TC-M03**: Manufacturer receives relevant RFQ notification matching their category.
- [ ] **TC-M04**: Manufacturer submits quotation with unit price, freight charge, GST percentage, and 30-day validity.
- [ ] **TC-M05**: Manufacturer updates order status through `in_production` $\to$ `shipped` with tracking ID.

### Workflow 4: Wholesaler Bulk Operations
- [ ] **TC-W01**: Wholesaler registers, sets ready-stock inventory quantities and MOQ.
- [ ] **TC-W02**: Wholesaler receives RFQ and provides immediate dispatch quote.
- [ ] **TC-W03**: Wholesaler manages order dispatch slip and invoice upload.

### Workflow 5: Distributor Regional Supply
- [ ] **TC-D01**: Distributor defines authorized regional pincodes and brand partnerships.
- [ ] **TC-D02**: System filters incoming RFQs to only match pincodes within distributor territory.
- [ ] **TC-D03**: Distributor submits localized delivery quotation.

### Workflow 6: Buyer + Supplier Dual Role Workspace Switcher
- [ ] **TC-BS01**: User with `buyer_supplier` role logs in.
- [ ] **TC-BS02**: Workspace switcher dropdown is present in navbar showing `Buyer Workspace` and `Supplier Workspace`.
- [ ] **TC-BS03**: Switching to `Buyer Workspace` renders `/buyer/*` routes and hides supplier order queues.
- [ ] **TC-BS04**: Switching to `Supplier Workspace` renders `/supplier/*` routes and hides buyer RFQs.
- [ ] **TC-BS05**: Session identity persists without re-authentication during workspace switch.

### Workflow 7: Superadmin Governance & Moderation
- [ ] **TC-A01**: Admin accesses `/admin/dashboard` showing live platform GMV and active user counts.
- [ ] **TC-A02**: Admin searches user list and suspends a fraudulent supplier account.
- [ ] **TC-A03**: Suspended supplier is immediately blocked from logging in (HTTP 403 `ACCOUNT_SUSPENDED`).
- [ ] **TC-A04**: Administrative action is verified in `/admin/audit-logs` with timestamp, admin ID, and reason.

### Workflow 8: Verification Admin Document Audit
- [ ] **TC-VA01**: Verification Admin logs into `/admin/verifications` queue.
- [ ] **TC-VA02**: Admin reviews uploaded GSTIN certificate PDF via signed InsForge storage URL.
- [ ] **TC-VA03**: Admin approves document verification $\to$ Supplier record updates `verification_level: 'document_verified'`.
- [ ] **TC-VA04**: Public supplier profile reflects the updated verification badge without cache lag.

### Workflow 9: Support Admin Helpdesk Resolution
- [ ] **TC-SA01**: Buyer submits support ticket regarding delayed shipment.
- [ ] **TC-SA02**: Support Admin views ticket at `/admin/support/:id`, sets priority to `high`, and posts internal note.
- [ ] **TC-SA03**: Support Admin replies to buyer $\to$ Ticket status updates to `waiting_on_customer`.

---

## 4. Landed Cost Engine Verification Cases

The Landed Cost Engine must be verified against exact mathematical benchmarks:

$$\text{Subtotal} = \sum (\text{Quantity}_i \times \text{Unit Price}_i)$$
$$\text{GST Amount} = \text{Subtotal} \times \left(\frac{\text{GST \%}}{100}\right)$$
$$\text{Total Landed Cost} = \text{Subtotal} + \text{Freight} + \text{Insurance} + \text{Packaging} + \text{GST Amount}$$
$$\text{Effective Landed Unit Cost} = \frac{\text{Total Landed Cost}}{\sum \text{Quantity}_i}$$

### Test Vectors

| Test Case | Qty | Unit Price | Freight | Insurance | Packaging | GST % | Expected Total | Expected Landed/Unit |
|---|---|---|---|---|---|---|---|---|
| **LC-01: Standard GST 18%** | 500 | ₹200.00 | ₹5,000.00 | ₹1,000.00 | ₹1,500.00 | 18% | ₹1,25,500.00 | ₹251.00 |
| **LC-02: Zero GST Export/Exempt**| 1,000 | ₹50.00 | ₹2,500.00 | ₹0.00 | ₹500.00 | 0% | ₹53,000.00 | ₹53.00 |
| **LC-03: Fractional Quantities**| 125 | ₹845.50 | ₹3,200.00 | ₹850.00 | ₹1,200.00 | 12% | ₹1,23,624.50 | ₹988.996 |

---

## 5. Security & Row Level Security (RLS) Test Suite

```typescript
describe('InsForge RLS Policy Enforcement', () => {
  it('prevents Buyer A from reading Buyer B RFQs', async () => {
    const buyerAToken = await createTestUserToken('buyer_a');
    const buyerBToken = await createTestUserToken('buyer_b');
    
    const rfq = await createRFQ(buyerBToken, { title: 'Private RFQ' });
    
    const res = await request(app)
      .get(`/api/rfqs/${rfq.id}`)
      .set('Authorization', `Bearer ${buyerAToken}`);
      
    expect(res.status).toBe(403);
  });

  it('prevents unverified suppliers from viewing high-value RFQs', async () => {
    const unverifiedSupplierToken = await createTestUserToken('unverified_supplier');
    const res = await request(app)
      .get('/api/rfqs')
      .set('Authorization', `Bearer ${unverifiedSupplierToken}`);
      
    expect(res.body.data.every((r: any) => !r.requires_verification)).toBe(true);
  });
});
```

---

## 6. Pre-Commit & Pre-Deploy Quality Gates

Before any git commit or deployment to production, the following pipeline gates must succeed:

1. **Lint & Formatting**: `npm run lint` — Zero ESLint warnings.
2. **Type Check**: `npm run typecheck` — Clean TypeScript exit code 0.
3. **Automated Unit Tests**: `npm test` — 100% pass on calculation logic and validation rules.
4. **Build Check**: `npm run build` — Clean Vite and Express builds.
