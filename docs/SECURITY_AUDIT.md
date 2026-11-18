# COVERLY — Security Audit Report

> **Audit Date:** 2026-11-18  
> **Scope:** Frontend SPA, Express REST API, Vercel Serverless Functions, RBAC, Authentication, HTTP Security Headers & InsForge RLS

---

## 1. Authentication & Session Architecture

- **Identity Provider**: Existing linked InsForge Auth (`signUp`, `signInWithPassword`, `signOut`) backed by `public.users` and `public.user_roles`.
- **Role Resolution**: Primary and secondary roles resolved server-side from `public.user_roles` in `backend/src/middleware/auth.ts` (`authenticateUser`). Public registration (`POST /api/auth/register`) strictly allowlists `PUBLIC_PERMITTED_ROLES` and prevents self-assignment of administrative roles.
- **Admin Login Enforcement**: `AdminLoginPage.tsx` verifies returned account roles against `isAdminRole(...)` before allowing navigation into `/admin/dashboard`; non-admin credentials are immediately logged out and rejected.
- **Known Architectural Note**: Client session persistence currently relies on `localStorage` (`coverly_user_id`, `coverly_user_profile`, `coverly_active_role`) passed via `x-user-id` / Bearer headers rather than `HttpOnly` server-issued JWT cookies. Migrating to signed `HttpOnly; Secure; SameSite=Lax` JWT session cookies with server-side signature verification in `authenticateUser` is recommended as a high-priority hardening follow-up before handling direct online payment/escrow settlements.

---

## 2. Authorization & Fine-Grained RBAC

- **Platform Admin RBAC**: Implemented synchronized frontend (`frontend/src/lib/admin-permissions.ts` + `AdminModuleGuard.tsx`) and backend (`backend/src/middleware/adminPermissions.ts` + `requireAdminModule(...)`) across all 11+ operational admin roles (`super_admin`, `admin`, `verification_manager`, `marketplace_manager`, `procurement_operations_manager`, `order_operations_manager`, `logistics_operations_manager`, `finance_accounts_staff`/`finance_admin`, `support_executive`, `compliance_manager`, `quality_operations_manager`).
- **Business Membership & Branch Isolation**: Enforced via `requireBusinessMember(...)` in `backend/src/middleware/auth.ts` and verified across Buyer, Retailer, and Employee Role Management test suites.
- **Public Metadata Isolation**: `api/render.ts` and `api/sitemap.ts` use `getPublicInsForgeClient()` (unauthenticated anon client subject to InsForge PostgreSQL RLS) and never query private tables (`users`, `orders`, `quotations`, `rfqs`, `supplier_verifications`, `audit_logs`).

---

## 3. HTTP Security, Rate Limiting & Error Handling

- **Security Headers**:
  - Express: `helmet()` active in `backend/src/app.ts`.
  - Vercel Edge (`vercel.json`): `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- **Rate Limiting**: `express-rate-limit` mounted on `/api` (`windowMs: 15 min`).
- **CORS**: Configurable via `CORS_ORIGIN` environment variable.
- **Sanitized Error Responses**: Global Express error handler in `backend/src/app.ts` strips raw stack traces and internal DB errors on `5xx` responses. Unknown `/api/*` endpoints return structured JSON `404` (`{ success: false, code: "NOT_FOUND" }`).
- **Frontend Error Boundary**: `AppErrorBoundary.tsx` catches unexpected React runtime errors and displays a clean branded `500` state with zero stack-trace exposure.

---

## 4. InsForge RLS & Storage Verification

- Existing InsForge PostgreSQL RLS policies across all 45 tables were preserved intact — RLS was **never** disabled globally or bypassed for public previews.
- Public OG image URL validator (`resolvePublicImageUrl`) explicitly rejects `http://`, `localhost`, `.svg`, and signed private URLs containing `?token=` or `?signature=`.
- Sensitive KYC documents and verification attachments remain isolated behind authenticated verification workflows.
