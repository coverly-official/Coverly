# COVERLY — Centralized Identity & Business Document Verification System (KYC) Implementation Report

**Date:** 2026-11-18
**Production URL:** `https://coverly-indol.vercel.app`
**Linked Backend Project:** InsForge `Coverly` (`https://4vwfw2w8.ap-southeast.insforge.app`)
**Scope:** Additive centralized KYC, Identity Verification, Business Document Verification, Liquid-Fill Real-Progress Upload, Cryptographic OTP Abuse Protection, Private Storage Isolation, Admin Verification Center, and KYC Legal Documentation across all 12 COVERLY user roles.

---

## 1. Architecture Summary

COVERLY now operates one shared, centralized verification infrastructure serving all 12 eligible platform roles (`buyer`, `retailer`, `manufacturer`, `wholesaler`, `distributor`, `raw_material_supplier`, `packaging_supplier`, `importer_exporter`, `logistics_partner`, `transporter`, `service_provider`, `sales_agent`) plus dual-role (`buyer_supplier`) accounts without creating duplicate role-specific KYC pipelines.

### Database & Private Storage (Applied Live on Linked InsForge Project)
- **Additive SQL Migration Applied:** `migrations/20261118120000_centralized-kyc-verification.sql`
  - Added 11 new PostgreSQL tables with strict Row Level Security (RLS) enabled while preserving all existing tables and legacy `verification_documents` data untouched:
    1. `verification_profiles`
    2. `verification_requirements`
    3. `verification_submissions`
    4. `kyc_verification_documents`
    5. `verification_results`
    6. `verification_consents`
    7. `verification_history`
    8. `verification_provider_logs`
    9. `otp_challenges`
    10. `upload_sessions`
    11. `verification_audit_logs`
- **Private Storage Bucket Provisioned:** `kyc-private` (`--private`, non-public).
  - Storage key namespace: `kyc/{user_id}/{business_id|personal}/{document_type}/{uuid}.{ext}`.
  - Document bytes are never persisted in relational DB columns and never exposed via public URLs.

---

## 2. Backend Implementation

- **Shared Verification Engine:** `backend/src/lib/kyc-engine.ts`
  - Configurable role-based document matrix across all 12 roles (`ROLE_DOCUMENT_MATRIX`), marking GSTIN, MSME/Udyam, and Aadhaar Offline as optional/voluntary so unregistered proprietorships and small buyers are never blocked.
  - Server-side file validation (`validateKycDocumentUpload`) enforcing extension allowlists, configurable per-document size limits (capped at platform ceiling `SAFE_PLATFORM_MAX_MB = 15`), path traversal rejection, claimed MIME verification, and magic-byte signature inspection (PDF `%PDF-`, PNG, JPEG, WebP) while explicitly rejecting disguised executables (`MZ`), HTML/scripts, and SVG XSS payloads.
  - Cryptographic OTP security (`generateSecureOtpCode`, `hashOtpCode`, `verifyOtpHash`): CSPRNG 6-digit codes stored strictly as salted HMAC-SHA256 hashes (never plaintext, never logged), timing-safe verification, 60s resend cooldown, max 5 sends/hr per destination, max 5 verify attempts, and 15-minute lockout (`checkAndRecordOtpSendRate`).
  - Sensitive data masking (`maskGovIdentifier`, `maskDestination`) ensuring raw 12-digit Aadhaar numbers are never stored.
  - Honest verification pre-checks (`runHonestPreCheck`) validating PAN/GSTIN/Udyam formats and explicitly labeling reviews as **Manual Verification** (never faking live government APIs or scraping government portals).
- **Centralized KYC API Router:** `backend/src/routes/kyc.ts` (mounted in `backend/src/app.ts`)
  - `GET /api/kyc/requirements` & `GET /api/kyc/overview`
  - `POST /api/kyc/otp/send` & `POST /api/kyc/otp/verify` (anti-bot honeypot + rate limiting)
  - `POST /api/kyc/upload` (raw binary streaming for real XHR progress + magic-bytes check + private vault upload)
  - `DELETE /api/kyc/documents/:id` (removes unsubmitted files from private storage)
  - `GET /api/kyc/documents/:id/access` (owner or `verification`-module admin only, `Cache-Control: private, no-store`, logged in `verification_audit_logs`)
  - `POST /api/kyc/submit` (consent-gated, Aadhaar alternative-route disclosure enforced, idempotency key duplicate-submission protection)
  - `GET /api/kyc/admin/applications`, `PATCH /api/kyc/admin/applications/:id`, `GET /api/kyc/admin/config`, `PATCH /api/kyc/admin/config` (RBAC gated via `requireAdmin` + `requireAdminModule("verification")`, mandatory reason for reject/resubmission, internal notes strictly stripped from end-user APIs).
- **Enhanced Registration API:** `backend/src/routes/auth.ts`
  - Accepts all 12 eligible roles + `buyer_supplier`, `confirm_password`, `account_type`, `business_type`, `country`, `state`, `city`, separate `terms_accepted` & `privacy_accepted`, optional `marketing_consent`, anti-bot honeypot (`website_url_hp`), and initializes `verification_profiles` + `verification_consents` upon registration.

---

## 3. Frontend Implementation

- **Liquid-Fill Real-Progress Upload Component:** `frontend/src/components/verification/LiquidUploadCard.tsx`
  - Fintech white/neutral surface with COVERLY emerald green (`#059669` / `#10B981`) animated dual-wave SVG meniscus and subtle rising bubbles.
  - Uses genuine `XMLHttpRequest.upload.onprogress` byte tracking (0%–100%) with an honest indeterminate fallback when `!event.lengthComputable` (zero fake timers).
  - Full `prefers-reduced-motion` accessibility support, file thumbnail/PDF preview, Cancel (`xhr.abort()`), Retry, Replace, and Remove unsubmitted document actions.
- **Document-Specific Legal Consent Modal:** `frontend/src/components/verification/VerificationConsentModal.tsx`
  - Enforces explicit per-document consent before submission, including Aadhaar voluntary disclosure and non-Aadhaar alternative ID notice.
- **Granular Badges & Workspace Banner:**
  - `frontend/src/components/verification/VerificationBadges.tsx` (7 individual badges: `Mobile Verified`, `Email Verified`, `Identity Verified`, `PAN Verified`, `GST Verified`, `Udyam Verified`, `Business Verified`)
  - `frontend/src/components/verification/VerificationBanner.tsx` (`"Complete your profile and business verification to unlock eligible platform features."`) wired into `BuyerLayout`, `RetailerLayout`, `SupplierLayout`, `ProviderLayout`, and `TransportLayout` alongside persistent Verification Center navigation entries.
- **User Verification Center:** `frontend/src/pages/account/VerificationCenterPage.tsx` & `AccountVerificationShell.tsx`
  - Mounted at `/account/verification`, `/buyer/verification`, `/retailer/verification`, `/supplier/verification`, and `/provider/verification` with `noindex, nofollow` robots protection.
- **Upgraded Registration Page:** `frontend/src/pages/auth/RegisterPage.tsx`
  - All 12 roles + Dual Role, Confirm Password, Business Type, Country/State/City, two separate required legal checkboxes (`Terms & Conditions` and `Privacy Policy`), unchecked optional promotional checkbox, and hidden honeypot.
- **Upgraded Admin Verification Center:** `frontend/src/pages/admin/AdminVerificationsPage.tsx`
  - 7 dashboard metric cards, 6 filters, detail review drawer with audited private document inspection, recorded consents, review actions (`Approve`, `Under Review`, `Request Resubmission`, `Reject`, `Assign Reviewer`), hidden admin-only internal notes, and live role-requirement/file-limit configuration tab.

---

## 4. KYC Legal Compliance Documents

Created in `docs/legal/` and published cleanly on the live Legal Center (`frontend/src/lib/legal-documents.ts` & `AppRouter.tsx`), marked as drafts pending qualified Indian legal counsel sign-off with zero invented entity details:
1. `docs/legal/KYC_PRIVACY_NOTICE.md` → `/kyc-privacy-notice`
2. `docs/legal/IDENTITY_VERIFICATION_CONSENT.md` → `/identity-verification-consent`
3. `docs/legal/AADHAAR_OFFLINE_VERIFICATION_NOTICE.md` → `/aadhaar-offline-verification-notice`
4. `docs/legal/DOCUMENT_RETENTION_POLICY.md` → `/document-retention-policy`
5. `docs/legal/VERIFICATION_TERMS.md` → `/verification-terms`

---

## 5. Operational Notes & Production Limitations

1. **External SMS / SMTP Delivery Providers:** `POST /api/kyc/otp/send` generates cryptographically secure hashed OTP challenges and checks for `SMS_PROVIDER_URL`/`SMS_PROVIDER_API_KEY` and `SMTP_HOST`/`SMTP_USER`. Until production SMS/SMTP credentials are configured in Vercel Environment Variables, the API honestly reports `delivery_status: "provider_not_configured"` and never leaks plaintext OTP codes.
2. **Vercel Serverless Request Body Ceiling:** While Express supports up to `16 MB` locally (matching the `15 MB` configurable ceiling), Vercel Node.js serverless functions enforce a platform payload limit of `~4.5 MB` per direct HTTP request. Files up to `~4 MB` upload seamlessly through `/api/kyc/upload` on Vercel; supporting larger multi-page PDFs (5–15 MB) on Vercel will require direct presigned storage PUT URLs once enabled on InsForge Storage.
3. **Manual Verification Honesty:** All PAN, GSTIN, Udyam, Identity, and Business Registration checks are transparently marked as **COVERLY Manual Compliance Review**. No unauthorized government portal scraping or mock government APIs are present.
