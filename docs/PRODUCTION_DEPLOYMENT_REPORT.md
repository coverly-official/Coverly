# COVERLY — Production Readiness & Deployment Report

> **Platform:** COVERLY B2B Discovery, Sourcing & Landed-Cost Procurement Platform  
> **GitHub Repository:** `https://github.com/coverly-official/Coverly.git` (branch `main`)  
> **Production Domain:** `https://coverly-indol.vercel.app`  
> **Linked Backend:** InsForge PostgreSQL, Auth & Storage (`Coverly`, existing project preserved — zero resets, zero deletions)  
> **Report Date:** 2026-11-18

---

## 1. Security & Secrets Audit Status

- **Repository Secret Scan**: **PASSED (0 hardcoded secrets in HEAD)**. Removed all previously committed `INSFORGE_API_KEY` (`ik_...`) and `INSFORGE_ANON_KEY` strings from `api/index.ts`, `api/render.ts`, `backend/src/lib/insforge.ts`, `frontend/src/lib/insforge.ts`, 5 database/audit scripts, and 2 historical documentation files.
- **Compiled Frontend Bundle Scan**: **PASSED (0 privileged secrets embedded in `frontend/dist/assets/*.js`)**.
- **CI/CD Automated Guardrails**: Added `.github/workflows/security-and-ci.yml`, `.env.example`, and hardened `.gitignore`.
- **Edge & API Security Headers**: Enabled `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, Express `helmet()`, `express-rate-limit`, JSON `404` catch-all on `/api/*`, and sanitized global `500` error handler (zero raw stack traces exposed).
- **Mandatory Post-Deploy Blocker (Owner Action Required)**: Because the old `INSFORGE_API_KEY` appeared in historical Git commits prior to this audit, the project owner MUST rotate `INSFORGE_API_KEY` in InsForge Console and ensure `INSFORGE_BASE_URL`, `INSFORGE_ANON_KEY`, `INSFORGE_API_KEY`, `VITE_INSFORGE_API_BASE`, and `VITE_INSFORGE_ANON_KEY` are configured in **Vercel Project Settings -> Environment Variables**. Shared Git history was NOT rewritten without explicit approval.

---

## 2. SEO & WhatsApp / Social Preview Implementation Status

- **Server-Rendered Initial HTML Metadata (`api/render.ts` + `backend/src/lib/seo-meta.ts`)**: Injects unique `<title>`, `<meta name="description">`, `<link rel="canonical">`, Open Graph (`og:title`, `og:description`, `og:image`, `1200×630`, `og:url`, `og:site_name`), Twitter Cards (`summary_large_image`), and JSON-LD structured data (`Organization`, `WebSite`, `Product`, `LocalBusiness`, `Service`, `BreadcrumbList`, `FAQPage`) before React runs.
- **Dynamic 1200×630 PNG OG Cards (`api/og-image.ts`)**: Uses pure `satori` + `@resvg/resvg-wasm` with bundled assets (`api/_assets/`) alongside 8 static branded 1200×630 PNG banners (`frontend/public/og/*.png`, `106–201 KB`) and authentic public product/business images where present.
- **XML Sitemap & Robots**: Live dynamic RLS-enforced `/sitemap.xml` (`api/sitemap.ts`) and `/robots.txt` (`frontend/public/robots.txt`).
- **Private Route Indexing Protection**: `/admin/*`, `/buyer/*`, `/retailer/*`, `/supplier/*`, `/provider/*`, `/auth/*`, `/access-denied` return `robots="noindex, nofollow"` and `Cache-Control: private, no-store`.
- **9 B2B SEO Landing Pages**: Mounted and linked across `/verified-manufacturers-india`, `/wholesale-suppliers-india`, `/industrial-raw-material-suppliers`, `/packaging-material-manufacturers`, `/b2b-procurement-platform`, `/bulk-product-sourcing`, `/indian-wholesale-marketplace`, `/business-services-for-manufacturers`, and `/b2b-logistics-transport-services`.
- **Google Search Console**: Setup & verification runbook created at `docs/GOOGLE_SEARCH_CONSOLE_SETUP.md` (pending domain owner execution).

---

## 3. Legal Center, Consent UX & Trust Documentation Status

- **16 Markdown Policy Files**: Created under `docs/legal/` (all 15 legal policies + `LEGAL_REVIEW_CHECKLIST.md` evaluating DPDP Act 2023, IT Act 2000, IT Rules, Consumer Protection Act 2019 & E-Commerce Rules 2020).
- **15 Public Legal Center Routes + `/legal`**: Mounted inside `PublicLayout` and prominently linked in the footer.
- **Consent & Privacy UX**:
  - `CookieConsentBanner.tsx`: Essential storage clearly distinguished; optional preference & analytics toggles strictly unchecked by default; footer "Cookie Preferences" control enables consent withdrawal anytime.
  - `RegisterPage.tsx` + `POST /api/auth/register`: Mandatory Terms & Privacy acceptance checkbox + separate unchecked optional marketing consent checkbox; records `terms_version`, `privacy_version`, `marketing_consent`, and `accepted_at`.
  - `POST /api/auth/privacy-request`: Authenticated account deletion, data export, and consent withdrawal request flow embedded in `/account-deletion-policy` and `/privacy-policy`.
- **Trust & Guide Pages**: `/buyer-guide`, `/supplier-guide`, `/help-center`, `/faq`, `/verification-info` (zero fabricated supplier counts, testimonials, addresses, or registrations).

---

## 4. Custom Animated 404 & Error State System Status

- **Animated Branded 404 (`NotFoundPage.tsx`)**: Framer Motion supply-chain illustration with floating freight crates, animated conveyor route, `prefers-reduced-motion` support, exact required copy ("Looks like this route is out of stock!"), Back to Home / Explore Marketplace / Contact Support buttons, inline product search, and popular category links.
- **Consistent Reuse**: Used for `/404`, wildcard `*` inside `PublicLayout`, missing product pages (`ProductDetailPage.tsx`), missing business profiles (`SupplierProfilePage.tsx`), and missing business service listings (`ServiceDetailPage.tsx`).
- **Real HTTP 404 Status Codes**: `api/render.ts` returns HTTP `404` for `/404`, unknown public routes, and non-existent public product/business/service IDs; `backend/src/app.ts` returns JSON HTTP `404` for unknown `/api/*` endpoints.
- **Other Branded Error States**: Reusable `ErrorStateView.tsx` (401, 403, 500, 503, network, empty, loading) + top-level `AppErrorBoundary.tsx`.

---

## 5. Build, Bundle & Automated Test Verification

| Check | Command | Result |
| :--- | :--- | :--- |
| **Backend Automated Tests** | `npm --prefix backend test` | **197 / 197 passed** (17 suites, 0 failures) |
| **Frontend Automated Tests** | `npm --prefix frontend test -- --run` | **12 / 12 passed** (2 suites, 0 failures) |
| **Production Build** | `npm run build` (`vite build` + `embed-index-html` + `tsc`) | **PASSED (0 errors)** |
| **Bundle Code Splitting** | Vite manual vendor chunks (`vendor-react`, `vendor-motion`, `vendor-icons`, `vendor-insforge`) | App chunk reduced from `429 KB` gzip -> `298 KB` gzip |
| **Secret Scans (Repo + Bundle)** | Redacted regex scan across tracked files & `frontend/dist/assets/*.js` | **0 matches** |

---

## 6. Remaining Blockers / Owner Sign-Off Items

1. **InsForge Key Rotation & Vercel Env Vars**: Rotate the previously committed `INSFORGE_API_KEY` in InsForge Console and verify `INSFORGE_BASE_URL`, `INSFORGE_ANON_KEY`, `INSFORGE_API_KEY`, `VITE_INSFORGE_API_BASE`, and `VITE_INSFORGE_ANON_KEY` are set in Vercel Project Settings.
2. **Legal Entity Placeholders & Counsel Review**: Replace bracketed placeholders (`[LEGAL ENTITY NAME]`, `[REGISTERED OFFICE ADDRESS]`, `[CIN / GSTIN]`, `[DESIGNATED GRIEVANCE OFFICER]`, `[JURISDICTION]`) in `frontend/src/lib/legal-documents.ts` and `docs/legal/*.md` and complete legal counsel review before commercial launch.
3. **Google Search Console Verification**: Verify property ownership and submit `https://coverly-indol.vercel.app/sitemap.xml` per `docs/GOOGLE_SEARCH_CONSOLE_SETUP.md`.
4. **Session Hardening Follow-Up**: Plan migration from client-stored `localStorage` user ID headers to signed `HttpOnly; Secure; SameSite=Lax` JWT cookies before launching direct online payment/escrow workflows.

---

## 7. Rollback Procedure

If a production regression is ever detected:
1. **Instant Edge Rollback (Vercel Dashboard)**: Open the Vercel project -> **Deployments** -> select the previous known-good production deployment -> click **Promote to Production** (takes < 10 seconds, zero database mutations).
2. **Git Rollback (No Force-Push)**:
   ```bash
   git revert <commit-sha>
   git push origin main
   ```
3. **Database Safety**: Zero destructive schema migrations or data deletions were performed; all 45 InsForge PostgreSQL tables remain backwards-compatible.
