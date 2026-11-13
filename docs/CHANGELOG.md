# COVERLY — Architecture & Release Changelog

All notable changes to the COVERLY architecture, schema, APIs, and user interfaces are documented here following [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and semantic versioning.

---

## [0.2.0] — 2026-11-13

### Monorepo Restructuring & Enterprise Architecture Blueprint

#### Added
- **Monorepo Structure**: Transitioned application into a Vercel-ready monorepo with `frontend/` (React 18, Vite 6, Tailwind CSS, TypeScript), `backend/` (Node.js, Express, TypeScript), and `api/index.ts` (Vercel serverless edge gateway).
- **InsForge BaaS Integration**: Linked live InsForge backend project `a60f176f-7863-493d-8fef-cf42a662a217` (`https://4vwfw2w8.ap-southeast.insforge.app`) via `@insforge/cli` and `@insforge/sdk`.
- **Database Migrations**: Executed `20261112155007_init-coverly.sql` provisioning initial tables (`product_categories`, `suppliers`, `concierge_leads`, `rfq_logs`).
- **Comprehensive Documentation Suite** (16 Master Files in `docs/`):
  1. `docs/README.md`: High-level system blueprint, directory structure, and development commands.
  2. `docs/PRODUCT_BLUEPRINT.md`: Vision, problem statement, core workflows, verification tiers, quantitative KPIs.
  3. `docs/SCREEN_SPECIFICATION.md`: Exhaustive 20-point specification for all ~75 screens across Groups A–F.
  4. `docs/USER_WORKFLOWS.md`: 9 detailed end-to-end user workflows with Mermaid flowcharts and state transitions.
  5. `docs/ROLE_PERMISSION_MATRIX.md`: 9-role capability matrix, RLS policy mapping, and dual-role switcher specification.
  6. `docs/DATABASE_ARCHITECTURE.md`: Complete 26-entity relational schema, foreign keys, indexes, and storage buckets.
  7. `docs/API_SPECIFICATION.md`: REST API contracts, request/response envelopes, status codes, and error codes.
  8. `docs/FRONTEND_ARCHITECTURE.md`: Component layout hierarchy, React Router v6 tree, state management, and Warm Ledger tokens.
  9. `docs/BACKEND_ARCHITECTURE.md`: Express middleware pipeline, modular service layer, and Landed Cost Engine equations.
  10. `docs/ADMIN_PANEL_SPECIFICATION.md`: Superadmin, Verification Admin, and Support Admin consoles with audit queues.
  11. `docs/NOTIFICATION_SPECIFICATION.md`: In-app notification catalog, payload schemas, and event triggers.
  12. `docs/SECURITY_SPECIFICATION.md`: Threat model, RLS enforcement, rate limits, and audit trails.
  13. `docs/IMPLEMENTATION_ROADMAP.md`: Gap analysis across 20 modules and 15-phase implementation plan.
  14. `docs/TESTING_SPECIFICATION.md`: QA strategy, unit/integration/E2E test matrices, and landed cost benchmarks.
  15. `docs/DEPLOYMENT_GUIDE.md`: Vercel monorepo deployment, environment variables, and rollback procedures.
  16. `docs/CHANGELOG.md`: Architectural evolution and version tracking.
- **Git Synchronization**: Cleanly committed and pushed monorepo baseline to `https://github.com/coverly-official/Coverly.git` on branch `main`.

#### Changed
- Converted monolithic Next.js codebase into separated decoupled client and server workspaces while preserving UI styling, Warm Ledger design tokens, and domain logic.
- Standardized package scripts across root, frontend, and backend for automated builds and tests.

---

## [0.1.0] — 2026-11-12

### Initial Prototype & Landed Cost Benchmark

#### Added
- Initial landing page prototype showcasing B2B wholesale sourcing concept.
- Landed Cost Engine unit tests (`landed-cost.test.ts`) validating landed cost calculations across unit pricing, GST, freight, and insurance.
- Initial InsForge project linkage.
