import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  getRoleRequirements,
  normalizeRoleToKycCode,
  validateKycDocumentUpload,
  detectMagicBytesMime,
  generateSecureOtpCode,
  hashOtpCode,
  verifyOtpHash,
  hashIdentifier,
  maskDestination,
  maskGovIdentifier,
  createOtpRateTracker,
  checkAndRecordOtpSendRate,
  DEFAULT_OTP_LIMITS,
  SAFE_PLATFORM_MAX_MB,
  runHonestPreCheck,
  type KycRoleCode,
} from "../src/lib/kyc-engine.js";

const ALL_12_ROLES: KycRoleCode[] = [
  "buyer",
  "retailer",
  "manufacturer",
  "wholesaler",
  "distributor",
  "raw_material_supplier",
  "packaging_supplier",
  "importer_exporter",
  "logistics_partner",
  "transporter",
  "service_provider",
  "sales_agent",
];

// Authentic magic-byte file fixtures
const VALID_PDF_BUF = Buffer.from("%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF", "utf8");
const VALID_PNG_BUF = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
const VALID_JPG_BUF = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const VALID_WEBP_BUF = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20,
]);
const FAKE_EXE_AS_PDF = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]); // MZ PE executable header
const FAKE_HTML_SCRIPT = Buffer.from("<!DOCTYPE html><html><script>alert(1)</script></html>", "utf8");
const FAKE_SVG_XSS = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', "utf8");

describe("COVERLY Centralized Identity & Business Document Verification System (KYC)", () => {
  // 1. Role-based document requirements for all 12 roles
  describe("Phase 1 & 4: Role-Based Requirements Across All 12 Roles", () => {
    it("returns configured requirements for every one of the 12 eligible platform roles", () => {
      for (const role of ALL_12_ROLES) {
        const reqs = getRoleRequirements(role);
        assert.ok(Array.isArray(reqs) && reqs.length > 0, `Role ${role} must return verification requirements`);
        for (const r of reqs) {
          assert.ok(r.document_type, `Missing document_type for ${role}`);
          assert.ok(r.max_size_mb <= SAFE_PLATFORM_MAX_MB, `Max size must never exceed ${SAFE_PLATFORM_MAX_MB} MB`);
          assert.ok(r.allowed_extensions.length > 0, `Allowed extensions required for ${r.document_type}`);
        }
      }
    });

    it("never forces GSTIN or Udyam on small/unregistered buyers or proprietorships where optional", () => {
      const buyerReqs = getRoleRequirements("buyer");
      const gst = buyerReqs.find((r) => r.document_type === "gst_certificate");
      const udyam = buyerReqs.find((r) => r.document_type === "udyam_certificate");
      assert.equal(gst?.is_required, false, "GSTIN must remain optional for general Buyers");
      if (udyam) assert.equal(udyam.is_required, false, "Udyam must remain optional");
    });

    it("includes voluntary alternative identity ID route alongside Aadhaar offline", () => {
      const buyerReqs = getRoleRequirements("buyer");
      const aadhaar = buyerReqs.find((r) => r.document_type === "aadhaar_offline");
      const altId = buyerReqs.find((r) => r.document_type === "identity_alt");
      assert.ok(aadhaar && !aadhaar.is_required, "Aadhaar offline must be voluntary (not mandatory)");
      assert.ok(altId, "Non-Aadhaar alternative ID must be offered");
    });

    it("normalizes dual roles and aliases cleanly", () => {
      assert.equal(normalizeRoleToKycCode("buyer_supplier"), "manufacturer");
      assert.equal(normalizeRoleToKycCode("unknown_role_xyz"), "buyer");
      assert.equal(normalizeRoleToKycCode("importer_exporter"), "importer_exporter");
    });
  });

  // 2. Server-side file validation (magic bytes, MIME, extensions, size limits, path traversal)
  describe("Phase 7 & 11: Server-Side File Validation & Magic Bytes Security", () => {
    it("accepts authentic PDF, PNG, JPEG, and WebP files within size limits", () => {
      const pdfRes = validateKycDocumentUpload({
        filename: "gst_certificate.pdf",
        claimedMimeType: "application/pdf",
        buffer: VALID_PDF_BUF,
        documentType: "gst_certificate",
      });
      assert.equal(pdfRes.valid, true);
      assert.equal(pdfRes.detectedMime, "application/pdf");
      assert.equal(pdfRes.sha256?.length, 64);

      const pngRes = validateKycDocumentUpload({
        filename: "pan_card.png",
        claimedMimeType: "image/png",
        buffer: VALID_PNG_BUF,
        documentType: "pan",
      });
      assert.equal(pngRes.valid, true);
      assert.equal(pngRes.detectedMime, "image/png");

      const jpgRes = validateKycDocumentUpload({
        filename: "pan_scan.jpg",
        claimedMimeType: "image/jpeg",
        buffer: VALID_JPG_BUF,
        documentType: "pan",
      });
      assert.equal(jpgRes.valid, true);
      assert.equal(jpgRes.detectedMime, "image/jpeg");

      const webpRes = validateKycDocumentUpload({
        filename: "passport.webp",
        claimedMimeType: "image/webp",
        buffer: VALID_WEBP_BUF,
        documentType: "identity_alt",
      });
      assert.equal(webpRes.valid, true);
      assert.equal(webpRes.detectedMime, "image/webp");
    });

    it("rejects executables renamed to .pdf via magic-byte signature inspection (MZ header)", () => {
      assert.equal(detectMagicBytesMime(FAKE_EXE_AS_PDF), "application/x-msdownload");
      const res = validateKycDocumentUpload({
        filename: "invoice.pdf",
        claimedMimeType: "application/pdf",
        buffer: FAKE_EXE_AS_PDF,
        documentType: "pan",
      });
      assert.equal(res.valid, false);
      assert.match(res.error || "", /signature|not allowed/i);
    });

    it("rejects HTML/script injection and SVG XSS payloads disguised as images/PDF", () => {
      const htmlRes = validateKycDocumentUpload({
        filename: "doc.pdf",
        claimedMimeType: "application/pdf",
        buffer: FAKE_HTML_SCRIPT,
        documentType: "pan",
      });
      assert.equal(htmlRes.valid, false);

      const svgRes = validateKycDocumentUpload({
        filename: "logo.svg",
        claimedMimeType: "image/svg+xml",
        buffer: FAKE_SVG_XSS,
        documentType: "pan",
      });
      assert.equal(svgRes.valid, false);
    });

    it("blocks dangerous extensions (.exe, .sh, .js, .php) and path traversal filenames", () => {
      const exeRes = validateKycDocumentUpload({
        filename: "malware.exe",
        claimedMimeType: "application/octet-stream",
        buffer: VALID_PDF_BUF,
        documentType: "pan",
      });
      assert.equal(exeRes.valid, false);

      const traversalRes = validateKycDocumentUpload({
        filename: "../../etc/passwd.pdf",
        claimedMimeType: "application/pdf",
        buffer: VALID_PDF_BUF,
        documentType: "pan",
      });
      assert.equal(traversalRes.valid, false);
      assert.match(traversalRes.error || "", /traversal|invalid filename/i);
    });

    it("rejects oversized files exceeding configured per-document limits", () => {
      // PAN limit is 5 MB; build a 5.2 MB valid-header PDF buffer
      const oversized = Buffer.alloc(5 * 1024 * 1024 + 200_000, 0x20);
      VALID_PDF_BUF.copy(oversized, 0);
      const res = validateKycDocumentUpload({
        filename: "huge_pan.pdf",
        claimedMimeType: "application/pdf",
        buffer: oversized,
        documentType: "pan",
      });
      assert.equal(res.valid, false);
      assert.match(res.error || "", /exceeds maximum allowed size/i);
    });

    it("rejects empty 0-byte uploads", () => {
      const res = validateKycDocumentUpload({
        filename: "empty.pdf",
        claimedMimeType: "application/pdf",
        buffer: Buffer.alloc(0),
        documentType: "pan",
      });
      assert.equal(res.valid, false);
    });
  });

  // 3. Cryptographic OTP & Anti-Bomber Abuse Protection
  describe("Phase 9 & 10: Cryptographic OTP Security & Anti-Bomber Rate Protection", () => {
    it("generates cryptographically random 6-digit OTPs and verifies salted HMAC-SHA256 hashes", () => {
      const otp = generateSecureOtpCode();
      assert.match(otp, /^\d{6}$/);
      const salt = crypto.randomBytes(16).toString("hex");
      const hash = hashOtpCode(otp, salt);
      assert.notEqual(hash, otp, "OTP must never be stored in plaintext");
      assert.equal(verifyOtpHash(otp, salt, hash), true);
      assert.equal(verifyOtpHash("000000", salt, hash), otp === "000000");
    });

    it("enforces 60s resend cooldown and max 5 OTP sends/hour per destination", () => {
      const tracker = createOtpRateTracker();
      const destHash = hashIdentifier("mobile:+919876543210");
      const ipHash = hashIdentifier("203.0.113.10");
      let now = 1_700_000_000_000;

      // 1st send succeeds
      const r1 = checkAndRecordOtpSendRate(tracker, destHash, ipHash, now, DEFAULT_OTP_LIMITS);
      assert.equal(r1.allowed, true);

      // Immediate retry within 60s is blocked by cooldown
      const rCooldown = checkAndRecordOtpSendRate(tracker, destHash, ipHash, now + 10_000, DEFAULT_OTP_LIMITS);
      assert.equal(rCooldown.allowed, false);
      assert.ok((rCooldown.retryAfterSeconds || 0) >= 45);

      // Sends 2..5 spaced 65s apart succeed
      for (let i = 2; i <= 5; i++) {
        now += 65_000;
        const r = checkAndRecordOtpSendRate(tracker, destHash, ipHash, now, DEFAULT_OTP_LIMITS);
        assert.equal(r.allowed, true, `Send #${i} should be allowed`);
      }

      // 6th send within same hour is blocked by hourly anti-bomber cap
      now += 65_000;
      const r6 = checkAndRecordOtpSendRate(tracker, destHash, ipHash, now, DEFAULT_OTP_LIMITS);
      assert.equal(r6.allowed, false);
      assert.match(r6.reason || "", /hourly|too many|limit/i);
    });

    it("blocks OTP sends during failed-attempt lockout window", () => {
      const tracker = createOtpRateTracker();
      const destHash = hashIdentifier("email:buyer@example.com");
      const ipHash = hashIdentifier("203.0.113.11");
      const now = 1_700_000_000_000;
      tracker.failedAttempts.set(destHash, { count: 5, lockedUntil: now + 10 * 60_000 });
      const res = checkAndRecordOtpSendRate(tracker, destHash, ipHash, now, DEFAULT_OTP_LIMITS);
      assert.equal(res.allowed, false);
      assert.match(res.reason || "", /locked|failed/i);
    });
  });

  // 4. Masking & Honest Pre-Check Verification (Zero Raw Aadhaar, No Fake Govt APIs)
  describe("Phase 8 & 13: Sensitive Identifier Masking & Honest Verification Labels", () => {
    it("masks PAN, GSTIN, mobile, email, and NEVER retains raw 12-digit Aadhaar numbers", () => {
      assert.equal(maskGovIdentifier("pan", "ABCDE1234F"), "ABXXXXX34F");
      assert.equal(maskGovIdentifier("gst_certificate", "27ABCDE1234F1Z5"), "27ABXXXXXXXF1Z5");
      assert.equal(maskGovIdentifier("aadhaar_offline", "1234 5678 9012"), "XXXX-XXXX-9012");
      assert.equal(maskDestination("email", "rajesh@company.com"), "ra****@company.com");
      assert.ok(maskDestination("mobile", "+919876543210").includes("****3210"));
    });

    it("runs honest PAN/GSTIN/Udyam format pre-checks and labels review honestly as Manual Verification", () => {
      const validPan = runHonestPreCheck({ documentType: "pan", identifier: "ABCDE1234F" });
      assert.equal(validPan.status, "pending_manual");
      assert.equal(validPan.method, "manual_admin_review");
      assert.match(validPan.honestLabel, /manual/i);

      const invalidPan = runHonestPreCheck({ documentType: "pan", identifier: "INVALID123" });
      assert.equal(invalidPan.status, "mismatch");

      const validGst = runHonestPreCheck({ documentType: "gst_certificate", identifier: "27ABCDE1234F1Z5" });
      assert.equal(validGst.status, "pending_manual");

      const invalidGst = runHonestPreCheck({ documentType: "gst_certificate", identifier: "NOT-A-GST" });
      assert.equal(invalidGst.status, "mismatch");

      const validUdyam = runHonestPreCheck({
        documentType: "udyam_certificate",
        identifier: "UDYAM-MH-01-0012345",
      });
      assert.equal(validUdyam.status, "pending_manual");
    });
  });

  // 5. Legal Compliance Documentation & Migration Presence Verification
  describe("Phase 12 & 16: Additive Schema Migration & 5 KYC Legal Compliance Documents", () => {
    it("contains the additive SQL migration with all 11 tables and RLS policies", () => {
      const migPath = path.resolve(
        process.cwd(),
        "..",
        "migrations",
        "20261118120000_centralized-kyc-verification.sql"
      );
      assert.equal(fs.existsSync(migPath), true, "Additive KYC SQL migration must exist");
      const sql = fs.readFileSync(migPath, "utf8");
      const expectedTables = [
        "verification_profiles",
        "verification_requirements",
        "verification_submissions",
        "kyc_verification_documents",
        "verification_results",
        "verification_consents",
        "verification_history",
        "verification_provider_logs",
        "otp_challenges",
        "upload_sessions",
        "verification_audit_logs",
      ];
      for (const tbl of expectedTables) {
        assert.ok(sql.includes(`CREATE TABLE IF NOT EXISTS public.${tbl}`), `Missing table ${tbl}`);
        assert.ok(sql.includes(`ALTER TABLE public.${tbl} ENABLE ROW LEVEL SECURITY`), `Missing RLS for ${tbl}`);
      }
    });

    it("contains all 5 mandatory KYC legal documents with counsel-review disclaimers", () => {
      const legalDir = path.resolve(process.cwd(), "..", "docs", "legal");
      const requiredDocs = [
        "KYC_PRIVACY_NOTICE.md",
        "IDENTITY_VERIFICATION_CONSENT.md",
        "AADHAAR_OFFLINE_VERIFICATION_NOTICE.md",
        "DOCUMENT_RETENTION_POLICY.md",
        "VERIFICATION_TERMS.md",
      ];
      for (const doc of requiredDocs) {
        const full = path.join(legalDir, doc);
        assert.equal(fs.existsSync(full), true, `Missing legal document: ${doc}`);
        const content = fs.readFileSync(full, "utf8");
        assert.match(content, /legal counsel/i, `${doc} must include qualified legal counsel review notice`);
      }
    });
  });
});
