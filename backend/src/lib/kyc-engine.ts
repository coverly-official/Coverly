import crypto from "node:crypto";

export type VerificationStatus =
  | "not_started"
  | "not_submitted"
  | "uploading"
  | "uploaded"
  | "submitted"
  | "pending_verification"
  | "under_review"
  | "verified"
  | "partially_verified"
  | "rejected"
  | "resubmission_required"
  | "expired";

export type VerificationMethod =
  | "manual_admin_review"
  | "document_validation"
  | "aadhaar_offline_xml"
  | "aadhaar_secure_qr"
  | "pan_provider"
  | "gst_provider"
  | "udyam_check"
  | "mca_check";

export type KycRoleCode =
  | "buyer"
  | "retailer"
  | "manufacturer"
  | "wholesaler"
  | "distributor"
  | "raw_material_supplier"
  | "packaging_supplier"
  | "importer_exporter"
  | "logistics_partner"
  | "transporter"
  | "service_provider"
  | "sales_agent";

export interface DocumentRequirementDef {
  document_type: string;
  display_name: string;
  category: "identity" | "tax" | "business" | "operations";
  is_required: boolean;
  max_size_mb: number;
  allowed_extensions: string[];
  allowed_mime_types: string[];
  instructions: string;
  verification_method: VerificationMethod;
  badge_field?: "identity_verified" | "pan_verified" | "gst_verified" | "udyam_verified" | "business_verified";
}

// Initial configurable platform upload limits (not government-prescribed limits)
export const DEFAULT_DOCUMENT_LIMITS_MB: Record<string, number> = {
  profile_photo: 5,
  pan: 5,
  aadhaar_offline: 5,
  identity_alt: 5,
  gst_certificate: 10,
  udyam_certificate: 10,
  business_registration: 10,
  address_proof: 10,
  factory_address_proof: 10,
  shop_address_proof: 10,
  vehicle_rc: 5,
  licence: 5,
  manufacturing_licence: 10,
  brand_authorization: 10,
  distribution_agreement: 15,
  material_certification: 10,
  quality_certification: 10,
  iec_certificate: 10,
  trade_document: 15,
  transport_permit: 10,
  vehicle_insurance: 5,
  professional_licence: 10,
  employment_authorization: 10,
  multi_page_pdf: 15,
};

export const SAFE_PLATFORM_MAX_MB = 15;

const DOC_CATALOG: Record<string, Omit<DocumentRequirementDef, "is_required">> = {
  pan: {
    document_type: "pan",
    display_name: "PAN Verification (Individual / Business)",
    category: "tax",
    max_size_mb: 5,
    allowed_extensions: ["pdf", "jpg", "jpeg", "png"],
    allowed_mime_types: ["application/pdf", "image/jpeg", "image/png"],
    instructions:
      "Upload a clear copy of your Individual or Entity PAN card. Manual Verification is performed unless an authorized PAN API provider is enabled.",
    verification_method: "manual_admin_review",
    badge_field: "pan_verified",
  },
  aadhaar_offline: {
    document_type: "aadhaar_offline",
    display_name: "Identity Proof (Offline Aadhaar XML/QR or Masked Copy)",
    category: "identity",
    max_size_mb: 5,
    allowed_extensions: ["pdf", "jpg", "jpeg", "png"],
    allowed_mime_types: ["application/pdf", "image/jpeg", "image/png"],
    instructions:
      "Optional identity route: Upload a masked Aadhaar PDF/image (first 8 digits masked) or use an alternative government ID (Passport, Driving Licence, Voter ID). COVERLY does not retain raw Aadhaar numbers.",
    verification_method: "manual_admin_review",
    badge_field: "identity_verified",
  },
  identity_alt: {
    document_type: "identity_alt",
    display_name: "Alternative Identity Proof (Passport / Driving Licence / Voter ID)",
    category: "identity",
    max_size_mb: 5,
    allowed_extensions: ["pdf", "jpg", "jpeg", "png", "webp"],
    allowed_mime_types: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
    instructions:
      "Legally valid alternative to Aadhaar. Upload a clear front/back PDF or photo of your Passport, Driving Licence, or Voter ID.",
    verification_method: "manual_admin_review",
    badge_field: "identity_verified",
  },
  gst_certificate: {
    document_type: "gst_certificate",
    display_name: "GSTIN Registration Certificate",
    category: "tax",
    max_size_mb: 10,
    allowed_extensions: ["pdf", "jpg", "jpeg", "png"],
    allowed_mime_types: ["application/pdf", "image/jpeg", "image/png"],
    instructions:
      "Required only if your business is legally registered under GST. Upload Form GST REG-06 PDF or clear scan.",
    verification_method: "manual_admin_review",
    badge_field: "gst_verified",
  },
  udyam_certificate: {
    document_type: "udyam_certificate",
    display_name: "MSME / Udyam Registration Certificate",
    category: "tax",
    max_size_mb: 10,
    allowed_extensions: ["pdf", "jpg", "jpeg", "png"],
    allowed_mime_types: ["application/pdf", "image/jpeg", "image/png"],
    instructions:
      "Optional unless claiming MSME status. Upload your official Udyam Registration Certificate PDF for manual review.",
    verification_method: "manual_admin_review",
    badge_field: "udyam_verified",
  },
  business_registration: {
    document_type: "business_registration",
    display_name: "Business Registration / Proof of Existence",
    category: "business",
    max_size_mb: 10,
    allowed_extensions: ["pdf", "jpg", "jpeg", "png"],
    allowed_mime_types: ["application/pdf", "image/jpeg", "image/png"],
    instructions:
      "Upload Certificate of Incorporation (COI), LLP Agreement, Partnership Deed, Shop & Establishment licence, or Proprietorship trade licence.",
    verification_method: "manual_admin_review",
    badge_field: "business_verified",
  },
  shop_address_proof: {
    document_type: "shop_address_proof",
    display_name: "Shop / Store Address Proof",
    category: "business",
    max_size_mb: 10,
    allowed_extensions: ["pdf", "jpg", "jpeg", "png"],
    allowed_mime_types: ["application/pdf", "image/jpeg", "image/png"],
    instructions:
      "Upload utility bill (under 3 months old), commercial rent/lease agreement, or municipal Shop Act certificate.",
    verification_method: "manual_admin_review",
  },
  factory_address_proof: {
    document_type: "factory_address_proof",
    display_name: "Factory Address & Premises Proof",
    category: "business",
    max_size_mb: 10,
    allowed_extensions: ["pdf", "jpg", "jpeg", "png"],
    allowed_mime_types: ["application/pdf", "image/jpeg", "image/png"],
    instructions:
      "Upload factory electricity bill, industrial estate allotment letter, lease deed, or Factory Act licence.",
    verification_method: "manual_admin_review",
  },
  manufacturing_licence: {
    document_type: "manufacturing_licence",
    display_name: "Manufacturing Licences & Product Certifications",
    category: "operations",
    max_size_mb: 10,
    allowed_extensions: ["pdf", "jpg", "jpeg", "png"],
    allowed_mime_types: ["application/pdf", "image/jpeg", "image/png"],
    instructions:
      "Optional unless industry-mandated (e.g., FSSAI, BIS, ISO, Drug/Medical Device licence, Pollution Control NOC).",
    verification_method: "manual_admin_review",
  },
  brand_authorization: {
    document_type: "brand_authorization",
    display_name: "Brand Authorization Letter",
    category: "operations",
    max_size_mb: 10,
    allowed_extensions: ["pdf", "jpg", "jpeg", "png"],
    allowed_mime_types: ["application/pdf", "image/jpeg", "image/png"],
    instructions:
      "Required only where claiming authorized distributor status for a specific brand or OEM.",
    verification_method: "manual_admin_review",
  },
  distribution_agreement: {
    document_type: "distribution_agreement",
    display_name: "Distribution Agreement",
    category: "operations",
    max_size_mb: 15,
    allowed_extensions: ["pdf"],
    allowed_mime_types: ["application/pdf"],
    instructions:
      "Optional multi-page PDF of executed regional distribution agreement (confidential pricing schedules may be redacted).",
    verification_method: "manual_admin_review",
  },
  material_certification: {
    document_type: "material_certification",
    display_name: "Material Test & Mill Certifications",
    category: "operations",
    max_size_mb: 10,
    allowed_extensions: ["pdf", "jpg", "jpeg", "png"],
    allowed_mime_types: ["application/pdf", "image/jpeg", "image/png"],
    instructions:
      "Optional sample Mill Test Certificates (MTC), IS/ASTM compliance or lab test reports where relevant.",
    verification_method: "manual_admin_review",
  },
  quality_certification: {
    document_type: "quality_certification",
    display_name: "Packaging Quality / Food-Grade Certifications",
    category: "operations",
    max_size_mb: 10,
    allowed_extensions: ["pdf", "jpg", "jpeg", "png"],
    allowed_mime_types: ["application/pdf", "image/jpeg", "image/png"],
    instructions:
      "Optional ISO, FSC, food-contact safety or packaging testing certifications where relevant.",
    verification_method: "manual_admin_review",
  },
  iec_certificate: {
    document_type: "iec_certificate",
    display_name: "Importer-Exporter Code (IEC)",
    category: "operations",
    max_size_mb: 10,
    allowed_extensions: ["pdf", "jpg", "jpeg", "png"],
    allowed_mime_types: ["application/pdf", "image/jpeg", "image/png"],
    instructions:
      "Required where legally mandated for cross-border import/export shipments (DGFT IEC Certificate PDF).",
    verification_method: "manual_admin_review",
  },
  trade_document: {
    document_type: "trade_document",
    display_name: "Additional Export/Trade Compliance Documents",
    category: "operations",
    max_size_mb: 15,
    allowed_extensions: ["pdf"],
    allowed_mime_types: ["application/pdf"],
    instructions:
      "Optional RCMC, Export Promotion Council membership, APEDA, or phytosanitary credentials.",
    verification_method: "manual_admin_review",
  },
  transport_permit: {
    document_type: "transport_permit",
    display_name: "Transport Licences & National/State Permits",
    category: "operations",
    max_size_mb: 10,
    allowed_extensions: ["pdf", "jpg", "jpeg", "png"],
    allowed_mime_types: ["application/pdf", "image/jpeg", "image/png"],
    instructions:
      "Upload valid commercial goods carrier permit, IBA approval or logistics operator licence where applicable.",
    verification_method: "manual_admin_review",
  },
  vehicle_rc: {
    document_type: "vehicle_rc",
    display_name: "Commercial Vehicle RC (Registration Certificate)",
    category: "operations",
    max_size_mb: 5,
    allowed_extensions: ["pdf", "jpg", "jpeg", "png"],
    allowed_mime_types: ["application/pdf", "image/jpeg", "image/png"],
    instructions:
      "Upload commercial vehicle Registration Certificate (RC). Driver identity & DL are verified separately upon driver registration.",
    verification_method: "manual_admin_review",
  },
  vehicle_insurance: {
    document_type: "vehicle_insurance",
    display_name: "Commercial Vehicle Insurance Certificate",
    category: "operations",
    max_size_mb: 5,
    allowed_extensions: ["pdf", "jpg", "jpeg", "png"],
    allowed_mime_types: ["application/pdf", "image/jpeg", "image/png"],
    instructions:
      "Upload active commercial motor/transit insurance policy certificate where required.",
    verification_method: "manual_admin_review",
  },
  professional_licence: {
    document_type: "professional_licence",
    display_name: "Professional Licences / Practice Certificates",
    category: "operations",
    max_size_mb: 10,
    allowed_extensions: ["pdf", "jpg", "jpeg", "png"],
    allowed_mime_types: ["application/pdf", "image/jpeg", "image/png"],
    instructions:
      "Upload ICAI/Bar Council/ICSI certificate of practice or agency credentials where relevant to your service vertical.",
    verification_method: "manual_admin_review",
  },
  employment_authorization: {
    document_type: "employment_authorization",
    display_name: "Business / Employment Authorization Letter",
    category: "business",
    max_size_mb: 10,
    allowed_extensions: ["pdf", "jpg", "jpeg", "png"],
    allowed_mime_types: ["application/pdf", "image/jpeg", "image/png"],
    instructions:
      "Optional unless representing a specific company. Upload authorization letter on company letterhead.",
    verification_method: "manual_admin_review",
  },
};

function reqItem(docKey: keyof typeof DOC_CATALOG, isRequired: boolean): DocumentRequirementDef {
  return {
    ...DOC_CATALOG[docKey],
    is_required: isRequired,
  };
}

/**
 * Role-specific document matrix across all 12 COVERLY user roles.
 * Never forces GSTIN, Udyam or corporate COI on proprietorships/unregistered entities
 * where not legally required.
 */
export const ROLE_DOCUMENT_MATRIX: Record<KycRoleCode, DocumentRequirementDef[]> = {
  buyer: [
    reqItem("pan", false),
    reqItem("identity_alt", false),
    reqItem("aadhaar_offline", false),
    reqItem("business_registration", false),
    reqItem("gst_certificate", false),
    reqItem("udyam_certificate", false),
  ],
  retailer: [
    reqItem("pan", true),
    reqItem("business_registration", true),
    reqItem("gst_certificate", false),
    reqItem("udyam_certificate", false),
    reqItem("shop_address_proof", false),
    reqItem("identity_alt", false),
  ],
  manufacturer: [
    reqItem("pan", true),
    reqItem("business_registration", true),
    reqItem("factory_address_proof", true),
    reqItem("gst_certificate", false),
    reqItem("udyam_certificate", false),
    reqItem("manufacturing_licence", false),
  ],
  wholesaler: [
    reqItem("pan", true),
    reqItem("business_registration", true),
    reqItem("gst_certificate", false),
    reqItem("udyam_certificate", false),
  ],
  distributor: [
    reqItem("pan", true),
    reqItem("business_registration", true),
    reqItem("gst_certificate", false),
    reqItem("brand_authorization", false),
    reqItem("distribution_agreement", false),
  ],
  raw_material_supplier: [
    reqItem("pan", true),
    reqItem("business_registration", true),
    reqItem("gst_certificate", false),
    reqItem("material_certification", false),
  ],
  packaging_supplier: [
    reqItem("pan", true),
    reqItem("business_registration", true),
    reqItem("gst_certificate", false),
    reqItem("quality_certification", false),
  ],
  importer_exporter: [
    reqItem("pan", true),
    reqItem("business_registration", true),
    reqItem("gst_certificate", false),
    reqItem("iec_certificate", false),
    reqItem("trade_document", false),
  ],
  logistics_partner: [
    reqItem("pan", true),
    reqItem("business_registration", true),
    reqItem("gst_certificate", false),
    reqItem("transport_permit", false),
  ],
  transporter: [
    reqItem("pan", true),
    reqItem("business_registration", true),
    reqItem("vehicle_rc", true),
    reqItem("gst_certificate", false),
    reqItem("transport_permit", false),
    reqItem("vehicle_insurance", false),
  ],
  service_provider: [
    reqItem("pan", true),
    reqItem("business_registration", true),
    reqItem("gst_certificate", false),
    reqItem("professional_licence", false),
    reqItem("identity_alt", false),
  ],
  sales_agent: [
    reqItem("identity_alt", true),
    reqItem("aadhaar_offline", false),
    reqItem("pan", false),
    reqItem("employment_authorization", false),
  ],
};

export function normalizeRoleToKycCode(role?: string | null): KycRoleCode {
  const r = String(role || "buyer").toLowerCase();
  if (r in ROLE_DOCUMENT_MATRIX) return r as KycRoleCode;
  if (r === "buyer_supplier") return "manufacturer";
  if (r === "importer" || r === "exporter") return "importer_exporter";
  if (r === "sales_manager") return "sales_agent";
  return "buyer";
}

export function getRoleRequirements(role?: string | null): DocumentRequirementDef[] {
  return ROLE_DOCUMENT_MATRIX[normalizeRoleToKycCode(role)] || ROLE_DOCUMENT_MATRIX.buyer;
}

// ============================================================================
// SERVER-SIDE FILE SIGNATURE (MAGIC BYTES), EXTENSION & SIZE VALIDATION
// ============================================================================

const DANGEROUS_EXTENSIONS = new Set([
  "exe", "bat", "cmd", "sh", "ps1", "js", "mjs", "cjs", "ts", "html", "htm",
  "svg", "php", "py", "rb", "jar", "msi", "dll", "com", "scr", "vbs",
]);

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedMime?: string;
  extension?: string;
  sha256?: string;
}

export function detectMagicBytesMime(buf: Buffer): string | null {
  if (!buf || buf.length < 4) return null;

  // Reject Windows PE executable (MZ), Linux ELF, Mach-O, shell shebang
  if (buf[0] === 0x4d && buf[1] === 0x5a) return "application/x-msdownload";
  if (buf[0] === 0x7f && buf[1] === 0x45 && buf[2] === 0x4c && buf[3] === 0x46) return "application/x-elf";
  if (buf[0] === 0x23 && buf[1] === 0x21) return "text/x-shellscript";

  // Check for HTML / Script / SVG payloads masquerading as documents
  const headText = buf.subarray(0, Math.min(256, buf.length)).toString("utf8").trimStart().toLowerCase();
  if (
    headText.startsWith("<!doctype html") ||
    headText.startsWith("<html") ||
    headText.startsWith("<script") ||
    headText.startsWith("<svg") ||
    headText.includes("<script")
  ) {
    return "text/html";
  }

  // PDF: %PDF-
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) {
    return "application/pdf";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return "image/png";
  }
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  // WebP: RIFF....WEBP
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

export function validateKycDocumentUpload(params: {
  filename: string;
  claimedMimeType: string;
  buffer: Buffer;
  documentType: string;
  maxSizeMbOverride?: number;
}): FileValidationResult {
  const { filename, claimedMimeType, buffer, documentType, maxSizeMbOverride } = params;

  if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return { valid: false, error: "Invalid filename or path traversal detected." };
  }

  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (!ext || DANGEROUS_EXTENSIONS.has(ext)) {
    return { valid: false, error: `File type '.${ext || "unknown"}' is not permitted for security reasons.` };
  }

  const docSpec = DOC_CATALOG[documentType];
  const allowedExts = docSpec?.allowed_extensions || ["pdf", "jpg", "jpeg", "png"];
  const allowedMimes = docSpec?.allowed_mime_types || ["application/pdf", "image/jpeg", "image/png"];

  if (!allowedExts.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported file extension '.${ext}'. Allowed formats: ${allowedExts.join(", ").toUpperCase()}.`,
    };
  }

  if (!buffer || buffer.length === 0) {
    return { valid: false, error: "Uploaded file is empty." };
  }

  const configuredMaxMb = Math.min(
    SAFE_PLATFORM_MAX_MB,
    maxSizeMbOverride || docSpec?.max_size_mb || DEFAULT_DOCUMENT_LIMITS_MB[documentType] || 5
  );
  const maxBytes = configuredMaxMb * 1024 * 1024;
  if (buffer.length > maxBytes) {
    return {
      valid: false,
      error: `File exceeds maximum allowed size of ${configuredMaxMb} MB for this document type.`,
    };
  }

  const detectedMime = detectMagicBytesMime(buffer);
  if (!detectedMime || !allowedMimes.includes(detectedMime)) {
    return {
      valid: false,
      error: "File signature verification failed. File contents do not match an allowed PDF/JPG/PNG/WebP document.",
    };
  }

  // Ensure claimed MIME (if provided) isn't an executable/script mismatch
  const normalizedClaimed = String(claimedMimeType || "").toLowerCase().split(";")[0].trim();
  if (
    normalizedClaimed &&
    normalizedClaimed !== "application/octet-stream" &&
    !allowedMimes.includes(normalizedClaimed)
  ) {
    return {
      valid: false,
      error: `MIME type '${normalizedClaimed}' is not allowed for this document.`,
    };
  }

  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
  return {
    valid: true,
    detectedMime,
    extension: ext,
    sha256,
  };
}

// ============================================================================
// CRYPTOGRAPHIC OTP & ANTI-BOMBER RATE PROTECTION
// ============================================================================

export function generateSecureOtpCode(): string {
  return String(crypto.randomInt(100000, 1000000));
}

export function hashOtpCode(otp: string, salt: string): string {
  return crypto.createHmac("sha256", salt).update(otp).digest("hex");
}

export function verifyOtpHash(candidateOtp: string, salt: string, storedHash: string): boolean {
  const computed = hashOtpCode(candidateOtp, salt);
  const a = Buffer.from(computed, "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function hashIdentifier(raw: string): string {
  return crypto.createHash("sha256").update(raw.trim().toLowerCase()).digest("hex");
}

export function maskDestination(channel: "mobile" | "email", value: string): string {
  const clean = value.trim();
  if (channel === "email") {
    const [local, domain] = clean.split("@");
    if (!domain) return "***";
    const visible = local.slice(0, 2);
    return `${visible}${"*".repeat(Math.max(2, local.length - 2))}@${domain}`;
  }
  const digits = clean.replace(/\s+/g, "");
  if (digits.length <= 4) return "****";
  return `${digits.slice(0, Math.min(3, digits.length - 4))}****${digits.slice(-4)}`;
}

export function maskGovIdentifier(type: string, raw?: string | null): string | null {
  if (!raw?.trim()) return null;
  const val = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (type === "pan" && val.length === 10) {
    return `${val.slice(0, 2)}XXXXX${val.slice(7)}`;
  }
  if (type === "gst_certificate" && val.length === 15) {
    return `${val.slice(0, 4)}XXXXXXX${val.slice(11)}`;
  }
  if (type === "aadhaar_offline") {
    // Strictly mask to last 4 digits only — never retain raw 12-digit Aadhaar
    const digits = val.replace(/\D/g, "");
    return digits.length >= 4 ? `XXXX-XXXX-${digits.slice(-4)}` : null;
  }
  if (val.length > 6) {
    return `${val.slice(0, 3)}****${val.slice(-3)}`;
  }
  return "****";
}

export interface OtpRateLimitConfig {
  cooldownSeconds: number;
  maxPerHourPerDestination: number;
  maxPerHourPerIp: number;
  maxVerifyAttempts: number;
  otpExpiryMinutes: number;
}

export const DEFAULT_OTP_LIMITS: OtpRateLimitConfig = {
  cooldownSeconds: 60,
  maxPerHourPerDestination: 5,
  maxPerHourPerIp: 15,
  maxVerifyAttempts: 5,
  otpExpiryMinutes: 10,
};

export interface OtpRateTracker {
  destinationTimestamps: Map<string, number[]>;
  ipTimestamps: Map<string, number[]>;
  failedAttempts: Map<string, { count: number; lockedUntil: number }>;
}

export function createOtpRateTracker(): OtpRateTracker {
  return {
    destinationTimestamps: new Map(),
    ipTimestamps: new Map(),
    failedAttempts: new Map(),
  };
}

export function checkAndRecordOtpSendRate(
  tracker: OtpRateTracker,
  destKey: string,
  ipKey: string,
  nowMs = Date.now(),
  limits: OtpRateLimitConfig = DEFAULT_OTP_LIMITS
): { allowed: boolean; retryAfterSeconds?: number; reason?: string; requireCaptcha?: boolean } {
  const hourAgo = nowMs - 60 * 60 * 1000;
  const destHistory = (tracker.destinationTimestamps.get(destKey) || []).filter((t) => t > hourAgo);
  const ipHistory = (tracker.ipTimestamps.get(ipKey) || []).filter((t) => t > hourAgo);

  const lockState = tracker.failedAttempts.get(destKey);
  if (lockState && lockState.lockedUntil > nowMs) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((lockState.lockedUntil - nowMs) / 1000),
      reason: "Too many failed verification attempts. Temporary cooldown is active.",
    };
  }

  const lastSent = destHistory[destHistory.length - 1];
  if (lastSent && nowMs - lastSent < limits.cooldownSeconds * 1000) {
    const waitSec = Math.ceil((limits.cooldownSeconds * 1000 - (nowMs - lastSent)) / 1000);
    return {
      allowed: false,
      retryAfterSeconds: waitSec,
      reason: `Please wait ${waitSec} seconds before requesting another OTP.`,
    };
  }

  if (destHistory.length >= limits.maxPerHourPerDestination) {
    return {
      allowed: false,
      retryAfterSeconds: 3600,
      reason: "Maximum hourly OTP limit reached for this destination. Please try again later.",
      requireCaptcha: true,
    };
  }

  if (ipHistory.length >= limits.maxPerHourPerIp) {
    return {
      allowed: false,
      retryAfterSeconds: 3600,
      reason: "Unusual OTP request volume detected from this network. Please retry later.",
      requireCaptcha: true,
    };
  }

  destHistory.push(nowMs);
  ipHistory.push(nowMs);
  tracker.destinationTimestamps.set(destKey, destHistory);
  tracker.ipTimestamps.set(ipKey, ipHistory);

  return {
    allowed: true,
    requireCaptcha: destHistory.length >= 3 || ipHistory.length >= 8,
  };
}

// ============================================================================
// PROVIDER-INDEPENDENT VERIFICATION ADAPTER DISPATCHER (NO FAKE GOVT APIs)
// ============================================================================

export interface VerificationCheckResult {
  method: VerificationMethod;
  source: string;
  status: "pending_manual" | "mismatch" | "verified";
  honestLabel: string;
  notes: string;
  mismatchDetails?: Record<string, string>;
}

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const UDYAM_REGEX = /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/;

/**
 * Evaluates a submitted document/identifier honestly.
 * Never claims an automated government API check when only syntax validation
 * and manual Admin review are configured.
 */
export function runHonestPreCheck(params: {
  documentType: string;
  identifier?: string;
  requestedMethod?: VerificationMethod;
}): VerificationCheckResult {
  const { documentType, identifier } = params;
  const cleanId = identifier?.trim().toUpperCase().replace(/\s+/g, "") || "";

  if (documentType === "pan" && cleanId) {
    if (!PAN_REGEX.test(cleanId)) {
      return {
        method: "document_validation",
        source: "coverly_format_validator",
        status: "mismatch",
        honestLabel: "Format Validation Failed",
        notes: "PAN format is invalid (expected 10-character alphanumeric format e.g., ABCDE1234F).",
        mismatchDetails: { pan: "Invalid PAN syntax" },
      };
    }
    return {
      method: "manual_admin_review",
      source: "coverly_compliance_queue",
      status: "pending_manual",
      honestLabel: "Manual Verification (Format Checked)",
      notes:
        "PAN syntax validated. Queued for Manual Admin Review (no external PAN API provider configured).",
    };
  }

  if (documentType === "gst_certificate" && cleanId) {
    if (!GSTIN_REGEX.test(cleanId)) {
      return {
        method: "document_validation",
        source: "coverly_format_validator",
        status: "mismatch",
        honestLabel: "Format Validation Failed",
        notes: "GSTIN format is invalid (expected 15-character GSTIN).",
        mismatchDetails: { gstin: "Invalid GSTIN syntax" },
      };
    }
    return {
      method: "manual_admin_review",
      source: "coverly_compliance_queue",
      status: "pending_manual",
      honestLabel: "Manual Verification (Format Checked)",
      notes:
        "GSTIN syntax validated. Queued for Manual Admin Review against uploaded GST certificate.",
    };
  }

  if (documentType === "udyam_certificate" && cleanId) {
    if (!UDYAM_REGEX.test(cleanId)) {
      return {
        method: "document_validation",
        source: "coverly_format_validator",
        status: "mismatch",
        honestLabel: "Format Validation Failed",
        notes: "Udyam number format is invalid (expected UDYAM-XX-00-0000000).",
        mismatchDetails: { udyam: "Invalid Udyam syntax" },
      };
    }
  }

  return {
    method: "manual_admin_review",
    source: "coverly_compliance_queue",
    status: "pending_manual",
    honestLabel: "Manual Verification",
    notes: "Document queued for authorized Admin compliance review.",
  };
}
