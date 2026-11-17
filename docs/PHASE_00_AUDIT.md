# COVERLY – PHASE 00 DISCOVERY & AUDIT
## Formal Phase 0 Completion Deliverable

---

## 1. Audit Scope & Verification Methods

| Component | Target Location | Verification Method | Result |
| :--- | :--- | :--- | :--- |
| **Repository & Codebase** | `D:\project\Coverly-main` | Git log, directory walk, line counts | Clean repository, 128 React pages, 26 Express routes |
| **Frontend Build** | `frontend/` | `npm --prefix frontend run build` | **PASS**: Built in 7.39s with zero TypeScript errors |
| **Backend Build** | `backend/` | `npm --prefix backend run build` | **PASS**: Clean `tsc` compilation with zero errors |
| **Automated Tests** | `backend/test/` | `npm --prefix backend test` | **PASS**: 153 tests passing across 15 suites in ~1.03s |
| **Remote InsForge DB** | `https://4vwfw2w8.ap-southeast.insforge.app` | InsForge Admin SDK live query & CLI | Reachable; 3 migrations applied, 12 pending |
| **Authentication** | `backend/src/middleware/auth.ts` | JWT & user profile lookup | Operational |
| **Row Level Security** | Database tables | RLS inspection | RLS enabled on core tables; pending on unmigrated tables |
| **Storage Buckets** | InsForge Storage | File upload & key persistence | Configured for product images and documents |

---

## 2. Incomplete & Uninstantiated Components

1. **Remote Database Schema Gap**:
   - 12 migration files exist in `migrations/` but have not yet been applied to the remote InsForge database.
   - Remote queries against `raw_materials`, `packaging_products`, `international_products`, `transport_trips`, `shipments`, `service_projects`, `sales_leads`, `invoices`, `purchase_expenses`, `business_branches`, and `business_employees` fail with `relation does not exist`.
2. **Migration Filename Formatting**:
   - Migration filenames use underscores (`20261117105000_distributor_marketplace.sql`) instead of kebab-case (`20261117105000_distributor-marketplace.sql`), causing `insforge db migrations up` to reject them.
3. **Cross-Tenant Membership Guards**:
   - Certain route controllers in `raw-materials.ts` and `packaging.ts` accept `business_id` without verifying the calling user's membership in `business_members`.

---

## 3. Immediate Action Plan for Phase 1 & Phase 2

1. **Phase 1 Deliverables**:
   - `docs/SYSTEM_ARCHITECTURE.md`
   - `docs/ROLE_PERMISSION_MATRIX.md`
   - `docs/DATABASE_RELATIONSHIP_DESIGN.md`
   - `docs/IMPLEMENTATION_ROADMAP.md`
2. **Phase 2 Database Alignment**:
   - Rename local migration files 4 through 15 to kebab-case.
   - Execute migrations against remote InsForge database and verify table creation.
   - Perform live table inspection confirming all 42 tables and RLS policies are active.
