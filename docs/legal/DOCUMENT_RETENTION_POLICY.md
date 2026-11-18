# COVERLY — KYC Document Retention & Deletion Policy

> **Status:** Draft v1.0 (`2026-11-18`) — *Subject to review and sign-off by qualified Indian legal counsel prior to formal publication.*
> **Legal Entity:** `[COVERLY LEGAL ENTITY NAME — PENDING REGISTRATION CONFIRMATION]`

## 1. Retention Principles
COVERLY retains KYC and business verification records only for as long as necessary to fulfill identity/business trust verification, fraud prevention, dispute resolution, and applicable Indian statutory compliance obligations.

## 2. Lifecycle by Record Category
| Record Category | Storage Location | Retention Schedule |
|---|---|---|
| Unsubmitted uploaded files | Private bucket `kyc-private` | Removable immediately by the user (`DELETE /api/kyc/documents/:id`); stale unsubmitted uploads purged periodically. |
| Active verified KYC documents | Private bucket `kyc-private` | Retained while account remains active and verification badge is valid, or until superseded by renewed document. |
| Rejected / superseded documents | Private bucket `kyc-private` | Retained in restricted review history for fraud/dispute window, then scheduled for secure deletion. |
| Verification audit logs & consent proofs | PostgreSQL (`verification_audit_logs`, `verification_consents`) | Retained in minimal metadata form (no raw document bytes or plaintext OTPs) as required by applicable Indian IT/tax/audit rules. |
| OTP challenge hashes | PostgreSQL (`otp_challenges`) | Expire within 10 minutes; consumed/expired hashed records purged on routine maintenance. |

## 3. Secure Deletion & Archival
- Upon verified account deletion request or expiration of statutory hold periods, private storage objects in `kyc-private` are permanently deleted and database references marked deleted.
- Internal compliance notes remain strictly confidential to authorized COVERLY compliance administrators and are never exposed publicly.
