# COVERLY — Personal Data Protection & Privacy Architecture

> **Date:** 2026-11-18  
> **Applicable Frameworks Reviewed:** Digital Personal Data Protection Act, 2023 (India), IT Act, 2000 & IT Rules

---

## 1. Public vs. Private Data Separation

| Data Category | Public Marketplace Visibility | Protection Mechanism |
| :--- | :--- | :--- |
| Business Name, Legal Name, City, State, Active Catalogue, Verification Tier | Publicly visible (when `is_active = true`) | Queried via `getPublicInsForgeClient()` with explicit column allowlists (zero PII columns selected) |
| User Personal Email, Phone, Password Hash, Auth Tokens | **NEVER PUBLIC** | Restricted to authenticated user session & authorized Admin roles; excluded from OG metadata and sitemaps |
| KYC Documents, GSTIN/PAN Uploads, Business Authorization Files | **NEVER PUBLIC** | Stored separately from public listings; restricted to verification workflows & authorized Verification Managers |
| RFQs, Private Quotations, Purchase Requests, Purchase Orders, Invoices | **NEVER PUBLIC** | Scoped to participating businesses via `requireBusinessMember` & PostgreSQL RLS; excluded from search indexing (`noindex, nofollow`) |
| Admin Audit Logs, Support Tickets, Disputes | **NEVER PUBLIC** | Strictly gated inside `AdminLayout` and backend `requireAdmin` + `requireAdminModule` RBAC |

---

## 2. Consent Management & Data Minimization Implemented

- **Registration Consent (`RegisterPage.tsx` + `POST /api/auth/register`)**:
  - Mandatory explicit acceptance checkbox linking to `/terms-and-conditions` and `/privacy-policy`.
  - Separate optional marketing communication checkbox **unchecked by default** (never preselected).
  - Records `terms_version`, `privacy_version`, `marketing_consent`, and ISO `accepted_at` timestamp.
- **Cookie & Storage Consent (`CookieConsentBanner.tsx` + `/cookie-policy`)**:
  - Clearly distinguishes Essential Session Storage (always active) from Optional Preference & Analytics storage (strictly unchecked by default).
  - Persistent **Cookie Preferences** trigger mounted in the website footer so users can update or withdraw optional consent at any time.
- **Account Deletion, Consent Withdrawal & Data Export (`POST /api/auth/privacy-request`)**:
  - Authenticated users can submit `account_deletion`, `data_export`, or `consent_withdrawal` requests directly from `/account-deletion-policy` and `/privacy-policy`, receiving a unique reference ID (`PRV-...`) routed into Support/Compliance review.

---

## 3. Data Retention & Log Redaction Guidelines

- **Retention**: Active account data is retained while the account is active; upon verified deletion request, personal profile identifiers are removed or anonymized while statutory commercial/tax/dispute audit records are retained in restricted archival form only for legally mandated periods.
- **Log Redaction**: Backend error handlers never return raw stack traces, SQL errors, or authentication tokens in HTTP responses. Secrets and PII must never be logged to stdout/production logs.
- **Pending Operational Step**: Appoint and publish the official Designated Grievance Officer and Privacy Contact email in `frontend/src/lib/legal-documents.ts` and `docs/legal/*.md` before commercial launch.
