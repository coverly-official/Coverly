# COVERLY — KYC Privacy Notice

> **Status:** Draft v1.0 (`2026-11-18`) — *Subject to review and sign-off by qualified Indian legal counsel prior to formal publication.*
> **Legal Entity:** `[COVERLY LEGAL ENTITY NAME — PENDING REGISTRATION CONFIRMATION]`
> **Registered Office:** `[REGISTERED OFFICE ADDRESS — TO BE CONFIRMED PRIOR TO PUBLICATION]`
> **Privacy Contact:** `[PRIVACY CONTACT EMAIL — e.g., privacy@yourdomain.com]`
> **Grievance Officer:** `[DESIGNATED GRIEVANCE OFFICER NAME, DESIGNATION & EMAIL — PENDING APPOINTMENT]`

## 1. Purpose of This Notice
This KYC Privacy Notice explains how COVERLY collects, validates, stores, accesses, and protects personal identity and business verification records submitted through the COVERLY Verification Center (`/account/verification`) across all supported B2B roles (Buyer, Retailer, Manufacturer, Wholesaler, Distributor, Raw Material Supplier, Packaging Supplier, Importer/Exporter, Logistics Partner, Transporter, Business Service Provider, and Sales Agent).

## 2. Categories of Verification Data Collected
- **Contact Verification:** Mobile number and email address verified through time-limited, single-use 6-digit OTP challenges. Plaintext OTP codes are never stored or logged; only salted HMAC-SHA256 hashes are persisted.
- **Role-Based Business & Tax Documents:** PAN, GST Registration Certificate (where applicable), MSME/Udyam Certificate (optional), Business Incorporation/Registration Proof, Import Export Code (IEC for international trade), Logistics/Transporter Permits, and Professional Service Credentials.
- **Voluntary Identity Documents:** Government-issued ID documents (Passport, Driving Licence, Voter ID, PAN) or strictly voluntary Aadhaar Offline XML / Secure QR proofs (never raw 12-digit Aadhaar numbers).
- **Consent & Audit Metadata:** Consent policy version, consent acceptance timestamp, masked reference identifiers (e.g., `AB*****34F`), file SHA-256 integrity hashes, and administrative review decisions.

## 3. Private Vault Storage & Access Controls
- Uploaded KYC documents are stored exclusively in a **private, non-public storage bucket (`kyc-private`)** segregated from public product or catalog media.
- Document bytes are never stored inside relational database columns or exposed via public URLs.
- Access to stored documents is restricted to the submitting account owner and authorized COVERLY compliance personnel holding the `verification` RBAC permission. Every access event is logged in `verification_audit_logs`.

## 4. Honest Verification Processing Disclosure
COVERLY performs document verification through **Manual Compliance Review** by authorized verification reviewers (and format pre-checks). COVERLY does **not** misrepresent manual review as automated government API integration. If licensed third-party verification partners are enabled in the future, their identity and applicable terms will be disclosed prior to submission.

## 5. User Rights Under DPDP Act, 2023
Users may request access to their verification status, correction of inaccurate metadata, withdrawal of consent (which may affect verified badge eligibility), or erasure of eligible documents subject to statutory retention obligations by contacting the Privacy Contact or Grievance Officer listed above.
