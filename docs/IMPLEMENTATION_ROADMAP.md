# COVERLY – IMPLEMENTATION ROADMAP & EXECUTION PLAN
## Phase 1 Deliverable: Granular Phases 2 Through 13 Execution Plan

---

## 1. Roadmap Overview & Phased Milestones

```
+---------------------------------------------------------------------------------------------------------+
| PHASE 0: Discovery & Comprehensive Audit (COMPLETE) -> docs/COVERLY_INITIAL_PROJECT_AUDIT.md            |
+---------------------------------------------------------------------------------------------------------+
| PHASE 1: Architecture & RBAC System Design (COMPLETE) -> docs/SYSTEM_ARCHITECTURE.md                     |
+---------------------------------------------------------------------------------------------------------+
| PHASE 2: Remote Database Migration Alignment & Schema Instantiation                                      |
|          - Rename local migration files 4-15 to kebab-case                                              |
|          - Execute migrations against remote InsForge via CLI                                            |
|          - Verify all 42 remote tables & RLS policies instantiated                                       |
+---------------------------------------------------------------------------------------------------------+
| PHASE 3: Core Identity & Business Workspace Foundation                                                  |
|          - Verify multi-tenant business_id scoping                                                      |
|          - Validate WorkspaceSwitcher across all layouts                                                 |
|          - Enforce validateBusinessMembership middleware across all protected routes                     |
+---------------------------------------------------------------------------------------------------------+
| PHASE 4: Universal Directory & Marketplace Discovery                                                    |
|          - Verify cross-vertical search (/api/directory/search)                                         |
|          - Verify ecosystem summary metrics (/api/directory/ecosystem-summary)                           |
+---------------------------------------------------------------------------------------------------------+
| PHASE 5: Universal RFQ & Enquiry Engine Verification                                                    |
|          - Verify Guest token generation (RFQ-GUEST-XXXX)                                                |
|          - Verify targeted and broadcast dispatch to multiple vendors                                    |
+---------------------------------------------------------------------------------------------------------+
| PHASE 6: Central Quotation & Single-Winner Concurrency Engine                                           |
|          - Landed cost breakdown calculation (GST, freight, insurance)                                  |
|          - Multi-quote comparison engine                                                                |
|          - Single-winner acceptance with automated competitor closing                                   |
+---------------------------------------------------------------------------------------------------------+
| PHASE 7: Central Order & Procurement Lifecycle Pipeline                                                 |
|          - Single-click quotation-to-PO conversion                                                      |
|          - 10-state sequential order stepper enforcement                                                |
|          - Cancellation guardrails for orders in production/transit                                     |
+---------------------------------------------------------------------------------------------------------+
| PHASE 8: Supplier Hub Operations (Mfg, Wholesaler, Dist, Raw Mat, Pkg, Trade)                           |
|          - End-to-end integration tests for all 6 supplier verticals                                    |
+---------------------------------------------------------------------------------------------------------+
| PHASE 9: Service Operations (Logistics, Transporter, B2B Services, Sales Agents)                         |
|          - End-to-end verification of freight, vehicle trip tracking, POD, milestone projects, CRM     |
+---------------------------------------------------------------------------------------------------------+
| PHASE 10: Financial Reconciliation & After-Sales (3-Way Match, Disputes)                               |
|          - Verify PO vs POD vs Tax Invoice match                                                        |
|          - Commission disbursement ledgers with TDS deduction                                           |
+---------------------------------------------------------------------------------------------------------+
| PHASE 11: Admin Control Center & Platform Governance                                                    |
|          - 18 governance modules verification                                                            |
|          - Immutable audit trail logging                                                                |
+---------------------------------------------------------------------------------------------------------+
| PHASE 12: Master Acceptance Testing (34 Scenarios) & Security Audits                                    |
|          - Execute all 34 acceptance scenarios from Section 50                                          |
|          - Full regression test run (150+ tests green)                                                  |
+---------------------------------------------------------------------------------------------------------+
| PHASE 13: Final Master Implementation Report (46 Sections)                                              |
|          - docs/COVERLY_ULTIMATE_IMPLEMENTATION_REPORT.md                                                |
+---------------------------------------------------------------------------------------------------------+
```

---

## 2. Immediate Phase 2 Execution Plan: Database Migration Alignment

1. Rename local migration files from underscore convention to kebab-case convention required by the InsForge CLI:
   - `20261117105000_distributor_marketplace.sql` -> `20261117105000_distributor-marketplace.sql`
   - `20261117120000_logistics_marketplace.sql` -> `20261117120000_logistics-marketplace.sql`
   - `20261117130000_transporter_marketplace.sql` -> `20261117130000_transporter-marketplace.sql`
   - `20261117140000_business_services_marketplace_complete.sql` -> `20261117140000_business-services-marketplace-complete.sql`
   - `20261117150000_sales_agent_system.sql` -> `20261117150000_sales-agent-system.sql`
   - `20261117160000_raw_material_marketplace.sql` -> `20261117160000_raw-material-marketplace.sql`
   - `20261117170000_packaging_supplier_marketplace.sql` -> `20261117170000_packaging-supplier-marketplace.sql`
   - `20261117180000_import_export_marketplace.sql` -> `20261117180000_import-export-marketplace.sql`
   - `20261117190000_buyer_business_owner_system.sql` -> `20261117190000_buyer-business-owner-system.sql`
   - `20261117200000_retailer_marketplace.sql` -> `20261117200000_retailer-marketplace.sql`
   - `20261117210000_employee_role_management.sql` -> `20261117210000_employee-role-management.sql`
   - `20261117220000_business_services_marketplace_complete_v2.sql` -> `20261117220000_business-services-marketplace-complete-v2.sql`
2. Run `insforge db migrations up --all -y` with bypass sandbox.
3. Query remote database verifying all newly created tables and RLS policies.
