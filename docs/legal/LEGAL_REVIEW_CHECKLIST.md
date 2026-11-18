# COVERLY — Legal & Regulatory Review Checklist (India)

> **Status:** Draft Pending Qualified Legal Counsel Review  
> **Last Updated:** 2026-11-18  
> **Production URL:** https://coverly-indol.vercel.app/legal

---

## 1. Mandatory Placeholders to Complete Before Commercial Launch

Never invent or publish unverified legal entity details. Replace the following placeholders across `frontend/src/lib/legal-documents.ts` and `docs/legal/*.md`:

- [ ] **Legal Entity Name** (Pvt Ltd / LLP / Proprietorship / Partnership)
- [ ] **CIN / LLPIN / GSTIN / Udyam Registration** (only if genuinely registered)
- [ ] **Registered Office Address** (verified physical business address)
- [ ] **Official Support Email & Phone Number**
- [ ] **Privacy Contact Email**
- [ ] **Designated Grievance Officer** (Full name, designation, direct email, postal address, working hours)
- [ ] **Governing Court Jurisdiction** (e.g., Courts at [City], [State], India)

---

## 2. India-Specific Statutory Review Matrix

| Statute / Rules | Applicability to COVERLY | Action Required by Legal Counsel |
| :--- | :--- | :--- |
| **Digital Personal Data Protection Act, 2023 (DPDP Act) & Rules** | Applies to digital personal data of individual users, sole proprietors, business representatives, and contact persons collected on COVERLY. | Confirm Data Fiduciary notice wording, consent withdrawal UX, retention schedule, Data Protection Officer applicability (if ever designated Significant Data Fiduciary), and notified rule timelines. |
| **Information Technology Act, 2000 (Sec 79) & IT (Intermediary Guidelines) Rules, 2021** | Applies to COVERLY's role as a B2B online marketplace intermediary hosting third-party supplier listings, business profiles, and user reviews. | Confirm Safe Harbor due diligence disclosures, Grievance Officer appointment, takedown notice workflow, and retention of user registration/audit logs. |
| **Information Technology (Reasonable Security Practices & SPDI) Rules** | Applies to sensitive personal data where collected (passwords, financial details, KYC documents) until fully superseded by notified DPDP rules. | Verify security policy disclosures and KYC document access/encryption practices. |
| **Consumer Protection Act, 2019 & E-Commerce Rules, 2020** | Primarily governs B2C consumer transactions; COVERLY is designed as a B2B commercial procurement platform, though individual buyers or sole proprietors may occasionally transact. | Confirm B2B commercial-use scope wording in Terms & Conditions and Buyer Terms, and verify whether any workflows trigger E-Commerce Rules disclosures (country of origin, seller details, grievance officer). |
| **GST Act, 2017 & E-Way Bill Rules** | Applies to B2B suppliers, buyers, and transporters transacting goods/services; COVERLY currently facilitates RFQ/quote comparison and does not act as Seller of Record. | Verify whether any future payment/escrow collection triggers TCS (Section 52 CGST) or e-commerce operator obligations before enabling online checkout. |
| **Trade Marks Act, 1999 & Copyright Act, 1957** | Applies to brand listings, distributor authorization letters, and supplier product photography. | Validate IP infringement notice & takedown SLA in `INTELLECTUAL_PROPERTY_POLICY.md`. |

---

## 3. Technical Alignment Checks (Verified in Codebase)

- [x] All 15 Legal Center routes live under `PublicLayout` (`/legal` + 15 dedicated URLs)
- [x] Visible Legal Center & Cookie Preferences controls mounted in website footer
- [x] Cookie Consent Banner defaults all optional categories (preferences, analytics) to **unchecked / off**
- [x] Registration requires explicit Terms & Privacy Policy acceptance checkbox with clickable links
- [x] Optional marketing consent checkbox on registration is **separate and unchecked by default**
- [x] Registration records `terms_version`, `privacy_version`, `marketing_consent`, and `accepted_at`
- [x] Authenticated Privacy Request endpoint (`POST /api/auth/privacy-request`) logs Account Deletion, Data Export, and Consent Withdrawal requests with unique tracking references
