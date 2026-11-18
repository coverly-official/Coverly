import crypto from "node:crypto";
import express, { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";
import { authenticateUser, requireAdmin } from "../middleware/auth.js";
import { requireAdminModule, hasAdminModuleAccess } from "../middleware/adminPermissions.js";
import { sendSuccess, sendError } from "../utils/response.js";
import {
  getRoleRequirements,
  normalizeRoleToKycCode,
  validateKycDocumentUpload,
  generateSecureOtpCode,
  hashOtpCode,
  verifyOtpHash,
  hashIdentifier,
  maskDestination,
  maskGovIdentifier,
  createOtpRateTracker,
  checkAndRecordOtpSendRate,
  DEFAULT_OTP_LIMITS,
  DEFAULT_DOCUMENT_LIMITS_MB,
  SAFE_PLATFORM_MAX_MB,
  runHonestPreCheck,
  type VerificationMethod,
} from "../lib/kyc-engine.js";

const router = Router();
const otpTracker = createOtpRateTracker();
const KYC_PRIVATE_BUCKET = "kyc-private";

// Helper: verify user belongs to business (or is platform admin)
async function assertBusinessAccess(
  insforge: any,
  user: any,
  businessId?: string | null
): Promise<boolean> {
  if (!businessId) return true;
  if (hasAdminModuleAccess(user, "verification")) return true;
  const { data: member } = await insforge.database
    .from("business_members")
    .select("role_in_business")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .single();
  return Boolean(member);
}

// Helper: recalculate overall verification progress & badges for a profile
async function recomputeProfileProgress(
  insforge: any,
  userId: string,
  businessId: string | null,
  roleCode: string
) {
  const reqs = getRoleRequirements(roleCode);
  let q = insforge.database
    .from("verification_submissions")
    .select("document_type, status")
    .eq("user_id", userId);
  q = businessId ? q.eq("business_id", businessId) : q.is("business_id", null);
  const { data: subs } = await q;

  const subMap = new Map<string, string>();
  for (const s of subs || []) {
    subMap.set(s.document_type, s.status);
  }

  const requiredDocs = reqs.filter((r) => r.is_required);
  const verifiedRequired = requiredDocs.filter((r) => subMap.get(r.document_type) === "verified").length;
  const anySubmitted = (subs || []).some((s: any) =>
    ["submitted", "pending_verification", "under_review", "verified"].includes(s.status)
  );
  const anyRejected = (subs || []).some((s: any) =>
    ["rejected", "resubmission_required"].includes(s.status)
  );

  const panVerified = subMap.get("pan") === "verified";
  const gstVerified = subMap.get("gst_certificate") === "verified";
  const udyamVerified = subMap.get("udyam_certificate") === "verified";
  const identityVerified =
    subMap.get("aadhaar_offline") === "verified" || subMap.get("identity_alt") === "verified";
  const bizDocVerified = subMap.get("business_registration") === "verified";

  const businessVerified =
    requiredDocs.length > 0
      ? verifiedRequired === requiredDocs.length
      : bizDocVerified || panVerified;

  const totalSteps = Math.max(1, requiredDocs.length + 2); // +2 for mobile & email
  let profQ = insforge.database
    .from("verification_profiles")
    .select("id, mobile_verified, email_verified")
    .eq("user_id", userId);
  profQ = businessId ? profQ.eq("business_id", businessId) : profQ.is("business_id", null);
  const { data: profile } = await profQ.single();

  const completedSteps =
    verifiedRequired +
    (profile?.mobile_verified ? 1 : 0) +
    (profile?.email_verified ? 1 : 0);
  const completionPercent = Math.min(100, Math.round((completedSteps / totalSteps) * 100));

  let overallStatus = "not_started";
  if (businessVerified && profile?.mobile_verified && profile?.email_verified) {
    overallStatus = "verified";
  } else if (verifiedRequired > 0 || panVerified || gstVerified || identityVerified) {
    overallStatus = "partially_verified";
  } else if (anyRejected) {
    overallStatus = "resubmission_required";
  } else if (anySubmitted) {
    overallStatus = "pending_verification";
  }

  const updateFields = {
    overall_status: overallStatus,
    completion_percent: completionPercent,
    identity_verified: identityVerified,
    pan_verified: panVerified,
    gst_verified: gstVerified,
    udyam_verified: udyamVerified,
    business_verified: businessVerified,
    updated_at: new Date().toISOString(),
  };

  if (profile?.id) {
    await insforge.database
      .from("verification_profiles")
      .update(updateFields)
      .eq("id", profile.id);
  }

  // Only promote public businesses.verification_level when authorized Admin approved required checks
  if (businessId && businessVerified) {
    await insforge.database
      .from("businesses")
      .update({
        verification_level: gstVerified ? "document_verified" : "registration_checked",
        updated_at: new Date().toISOString(),
      })
      .eq("id", businessId);
  }

  return updateFields;
}

// ============================================================================
// 1. ROLE-BASED REQUIREMENTS & VERIFICATION OVERVIEW
// ============================================================================

router.get("/kyc/requirements", authenticateUser, async (req, res) => {
  const roleParam = (req.query.role as string) || req.user!.activeRole;
  const roleCode = normalizeRoleToKycCode(roleParam);
  const defaults = getRoleRequirements(roleCode);

  const insforge = getInsForgeClient();
  if (!insforge) {
    return sendSuccess(res, { role: roleCode, requirements: defaults });
  }

  try {
    const { data: overrides } = await insforge.database
      .from("verification_requirements")
      .select("*")
      .eq("role_code", roleCode)
      .eq("is_active", true);

    const overrideMap = new Map((overrides || []).map((o: any) => [o.document_type, o]));
    const merged = defaults.map((def) => {
      const ov: any = overrideMap.get(def.document_type);
      if (!ov) return def;
      return {
        ...def,
        display_name: ov.display_name || def.display_name,
        is_required: typeof ov.is_required === "boolean" ? ov.is_required : def.is_required,
        max_size_mb: ov.max_size_mb || def.max_size_mb,
        instructions: ov.instructions || def.instructions,
      };
    });

    return sendSuccess(res, { role: roleCode, requirements: merged });
  } catch {
    return sendSuccess(res, { role: roleCode, requirements: defaults });
  }
});

router.get("/kyc/overview", authenticateUser, async (req, res) => {
  const user = req.user!;
  const businessId = (req.query.business_id as string) || null;
  const roleCode = normalizeRoleToKycCode((req.query.role as string) || user.activeRole);
  const requirements = getRoleRequirements(roleCode);

  const insforge = getInsForgeClient();
  if (!insforge) {
    return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");
  }

  try {
    if (businessId && !(await assertBusinessAccess(insforge, user, businessId))) {
      return sendError(res, "Not authorized to view verification for this business.", 403, "FORBIDDEN");
    }

    // Fetch or initialize verification profile
    let profQ = insforge.database
      .from("verification_profiles")
      .select("*")
      .eq("user_id", user.id);
    profQ = businessId ? profQ.eq("business_id", businessId) : profQ.is("business_id", null);
    let { data: profile } = await profQ.single();

    if (!profile) {
      const { data: created } = await insforge.database
        .from("verification_profiles")
        .insert([
          {
            user_id: user.id,
            business_id: businessId,
            role_code: roleCode,
            overall_status: "not_started",
            completion_percent: 0,
          },
        ])
        .select()
        .single();
      profile = created || {
        user_id: user.id,
        business_id: businessId,
        role_code: roleCode,
        overall_status: "not_started",
        completion_percent: 0,
        mobile_verified: false,
        email_verified: false,
        identity_verified: false,
        pan_verified: false,
        gst_verified: false,
        udyam_verified: false,
        business_verified: false,
      };
    }

    // Fetch user submissions (STRICTLY exclude internal_notes!)
    let subQ = insforge.database
      .from("verification_submissions")
      .select(
        "id, document_type, verification_method, status, masked_identifier, rejection_reason, submitted_at, reviewed_at, expires_at, updated_at"
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    subQ = businessId ? subQ.eq("business_id", businessId) : subQ.is("business_id", null);
    const { data: submissions } = await subQ;

    // Fetch user uploaded docs
    let docQ = insforge.database
      .from("kyc_verification_documents")
      .select(
        "id, submission_id, document_type, original_filename, mime_type, file_size_bytes, upload_status, uploaded_at"
      )
      .eq("user_id", user.id)
      .neq("upload_status", "deleted")
      .order("uploaded_at", { ascending: false });
    docQ = businessId ? docQ.eq("business_id", businessId) : docQ.is("business_id", null);
    const { data: documents } = await docQ;

    // Fetch history for user's submissions
    const subIds = (submissions || []).map((s: any) => s.id);
    let history: any[] = [];
    if (subIds.length > 0) {
      const { data: histRows } = await insforge.database
        .from("verification_history")
        .select("id, submission_id, actor_role, previous_status, new_status, public_note, created_at")
        .in("submission_id", subIds)
        .order("created_at", { ascending: false })
        .limit(40);
      history = histRows || [];
    }

    return sendSuccess(res, {
      profile,
      role: roleCode,
      requirements,
      submissions: submissions || [],
      documents: documents || [],
      history,
      badges: {
        mobile_verified: Boolean(profile.mobile_verified),
        email_verified: Boolean(profile.email_verified),
        identity_verified: Boolean(profile.identity_verified),
        pan_verified: Boolean(profile.pan_verified),
        gst_verified: Boolean(profile.gst_verified),
        udyam_verified: Boolean(profile.udyam_verified),
        business_verified: Boolean(profile.business_verified),
      },
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to load Verification Center overview.", 500, "SERVER_ERROR");
  }
});

// ============================================================================
// 2. MOBILE & EMAIL OTP VERIFICATION (CRYPTOGRAPHIC + ANTI-BOMBER)
// ============================================================================

router.post("/kyc/otp/send", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { channel, destination, country_code, website_url_hp } = req.body as {
    channel?: "mobile" | "email";
    destination?: string;
    country_code?: string;
    website_url_hp?: string;
  };

  // Anti-bot honeypot field check
  if (website_url_hp && String(website_url_hp).trim().length > 0) {
    return sendError(res, "Request rejected by abuse protection.", 400, "BOT_DETECTED");
  }

  if (!channel || !["mobile", "email"].includes(channel) || !destination?.trim()) {
    return sendError(res, "Valid channel ('mobile' or 'email') and destination are required.", 400, "VALIDATION_FAILED");
  }

  const normalizedDest =
    channel === "mobile"
      ? `${(country_code || "+91").trim()}${destination.replace(/[^\d]/g, "")}`
      : destination.trim().toLowerCase();

  if (channel === "mobile" && normalizedDest.replace(/[^\d]/g, "").length < 10) {
    return sendError(res, "Please provide a valid mobile number.", 400, "INVALID_MOBILE");
  }
  if (channel === "email" && !normalizedDest.includes("@")) {
    return sendError(res, "Please provide a valid email address.", 400, "INVALID_EMAIL");
  }

  const destHash = hashIdentifier(`${channel}:${normalizedDest}`);
  const ipHash = hashIdentifier(req.ip || "unknown");

  const rate = checkAndRecordOtpSendRate(otpTracker, destHash, ipHash, Date.now(), DEFAULT_OTP_LIMITS);
  if (!rate.allowed) {
    return res.status(429).json({
      success: false,
      error: rate.reason,
      code: "OTP_RATE_LIMITED",
      retry_after_seconds: rate.retryAfterSeconds,
      require_captcha: Boolean(rate.requireCaptcha),
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");
  }

  try {
    // Generate cryptographically secure 6-digit OTP and store ONLY salted HMAC-SHA256 hash
    const otpCode = generateSecureOtpCode();
    const otpSalt = crypto.randomBytes(16).toString("hex");
    const otpHash = hashOtpCode(otpCode, otpSalt);
    const expiresAt = new Date(Date.now() + DEFAULT_OTP_LIMITS.otpExpiryMinutes * 60 * 1000).toISOString();
    const masked = maskDestination(channel, normalizedDest);

    const { data: challenge, error } = await insforge.database
      .from("otp_challenges")
      .insert([
        {
          user_id: user.id,
          channel,
          destination_hash: destHash,
          masked_destination: masked,
          otp_salt: otpSalt,
          otp_hash: otpHash,
          attempts: 0,
          max_attempts: DEFAULT_OTP_LIMITS.maxVerifyAttempts,
          expires_at: expiresAt,
          ip_hash: ipHash,
        },
      ])
      .select("id, masked_destination, expires_at")
      .single();

    if (error) {
      return sendError(res, "Unable to initiate OTP verification right now.", 500, "DATABASE_ERROR");
    }

    // Check if an authorized external SMS / SMTP transport is configured
    const providerConfigured =
      channel === "mobile"
        ? Boolean(process.env.SMS_PROVIDER_URL && process.env.SMS_PROVIDER_API_KEY)
        : Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

    // NEVER log otpCode or return plaintext OTP in responses!
    return sendSuccess(
      res,
      {
        challenge_id: challenge?.id,
        channel,
        masked_destination: masked,
        expires_at: expiresAt,
        cooldown_seconds: DEFAULT_OTP_LIMITS.cooldownSeconds,
        delivery_status: providerConfigured ? "dispatched" : "provider_not_configured",
        require_captcha: Boolean(rate.requireCaptcha),
      },
      providerConfigured
        ? `Verification code sent to ${masked}.`
        : `OTP challenge created for ${masked}. External ${channel === "mobile" ? "SMS" : "SMTP email"} delivery provider credentials are not yet configured in server environment variables.`
    );
  } catch (err: any) {
    return sendError(res, err.message || "Failed to initiate OTP.", 500, "SERVER_ERROR");
  }
});

router.post("/kyc/otp/verify", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { challenge_id, channel, otp_code, business_id } = req.body as {
    challenge_id?: string;
    channel?: "mobile" | "email";
    otp_code?: string;
    business_id?: string;
  };

  if (!challenge_id || !otp_code?.trim() || !/^\d{6}$/.test(otp_code.trim())) {
    return sendError(res, "Valid challenge ID and 6-digit OTP code are required.", 400, "VALIDATION_FAILED");
  }

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: challenge, error } = await insforge.database
      .from("otp_challenges")
      .select("*")
      .eq("id", challenge_id)
      .eq("user_id", user.id)
      .single();

    if (error || !challenge) {
      return sendError(res, "Invalid or expired verification challenge.", 400, "INVALID_OTP");
    }

    if (challenge.consumed_at) {
      return sendError(res, "This verification code has already been used.", 400, "OTP_CONSUMED");
    }

    if (new Date(challenge.expires_at).getTime() < Date.now()) {
      return sendError(res, "Verification code has expired. Please request a new code.", 400, "OTP_EXPIRED");
    }

    if (challenge.attempts >= challenge.max_attempts) {
      return sendError(
        res,
        "Maximum verification attempts exceeded for this code. Request a new code after cooldown.",
        429,
        "OTP_MAX_ATTEMPTS"
      );
    }

    const isValid = verifyOtpHash(otp_code.trim(), challenge.otp_salt, challenge.otp_hash);

    if (!isValid) {
      const nextAttempts = (challenge.attempts || 0) + 1;
      await insforge.database
        .from("otp_challenges")
        .update({ attempts: nextAttempts })
        .eq("id", challenge.id);

      if (nextAttempts >= challenge.max_attempts) {
        otpTracker.failedAttempts.set(challenge.destination_hash, {
          count: nextAttempts,
          lockedUntil: Date.now() + 15 * 60 * 1000,
        });
      }

      return sendError(
        res,
        `Incorrect verification code. ${Math.max(0, challenge.max_attempts - nextAttempts)} attempt(s) remaining.`,
        400,
        "OTP_MISMATCH"
      );
    }

    // Mark single-use challenge consumed
    const nowIso = new Date().toISOString();
    await insforge.database
      .from("otp_challenges")
      .update({ consumed_at: nowIso, attempts: (challenge.attempts || 0) + 1 })
      .eq("id", challenge.id);

    const verifiedChannel = channel || challenge.channel;
    const patch =
      verifiedChannel === "mobile"
        ? { mobile_verified: true, mobile_verified_at: nowIso, updated_at: nowIso }
        : { email_verified: true, email_verified_at: nowIso, updated_at: nowIso };

    let profQ = insforge.database
      .from("verification_profiles")
      .update(patch)
      .eq("user_id", user.id);
    if (business_id) profQ = profQ.eq("business_id", business_id);
    await profQ;

    await recomputeProfileProgress(insforge, user.id, business_id || null, user.activeRole);

    // User notification
    try {
      await insforge.database.from("notifications").insert([
        {
          user_id: user.id,
          title: verifiedChannel === "mobile" ? "Mobile Number Verified" : "Email Address Verified",
          message: `Your ${verifiedChannel} (${challenge.masked_destination}) has been successfully verified.`,
          link: "/account/verification",
        },
      ]);
    } catch {}

    return sendSuccess(res, {
      verified: true,
      channel: verifiedChannel,
      verified_at: nowIso,
    }, `${verifiedChannel === "mobile" ? "Mobile" : "Email"} verified successfully.`);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to verify OTP.", 500, "SERVER_ERROR");
  }
});

// ============================================================================
// 3. SECURE PRIVATE DOCUMENT UPLOAD (REAL PROGRESS + MAGIC-BYTES VALIDATION)
// ============================================================================

router.post(
  "/kyc/upload",
  authenticateUser,
  express.raw({ type: "*/*", limit: "16mb" }),
  async (req, res) => {
    const user = req.user!;
    const filename = decodeURIComponent(String(req.headers["x-kyc-filename"] || "document.pdf"));
    const documentType = String(req.headers["x-kyc-document-type"] || "other").trim().toLowerCase();
    const claimedMime = String(req.headers["x-kyc-mime-type"] || req.headers["content-type"] || "");
    const businessId = String(req.headers["x-kyc-business-id"] || "").trim() || null;

    const buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");

    const validation = validateKycDocumentUpload({
      filename,
      claimedMimeType: claimedMime,
      buffer,
      documentType,
    });

    if (!validation.valid) {
      return sendError(res, validation.error || "Document failed server-side security validation.", 400, "INVALID_FILE");
    }

    const insforge = getInsForgeClient();
    if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

    try {
      if (businessId && !(await assertBusinessAccess(insforge, user, businessId))) {
        return sendError(res, "Not authorized to upload documents for this business.", 403, "FORBIDDEN");
      }

      const safeBizFolder = businessId || "personal";
      const fileUuid = crypto.randomUUID();
      const storageKey = `kyc/${user.id}/${safeBizFolder}/${documentType}/${fileUuid}.${validation.extension}`;

      // Upload to PRIVATE InsForge storage bucket (never public product image bucket)
      const blob = new Blob([new Uint8Array(buffer)], { type: validation.detectedMime! });
      const { error: uploadErr } = await insforge.storage
        .from(KYC_PRIVATE_BUCKET)
        .upload(storageKey, blob as any);

      if (uploadErr) {
        return sendError(
          res,
          "Private KYC storage bucket is unavailable. Please ensure the private 'kyc-private' bucket is provisioned in InsForge Storage.",
          503,
          "STORAGE_UPLOAD_FAILED"
        );
      }

      // Store metadata & private storage reference ONLY (never document bytes in DB!)
      const { data: docRow, error: dbErr } = await insforge.database
        .from("kyc_verification_documents")
        .insert([
          {
            user_id: user.id,
            business_id: businessId,
            document_type: documentType,
            storage_bucket: KYC_PRIVATE_BUCKET,
            storage_key: storageKey,
            original_filename: filename.replace(/[^\w.\-() ]+/g, "_").slice(0, 140),
            mime_type: validation.detectedMime!,
            file_size_bytes: buffer.length,
            sha256_hash: validation.sha256!,
            magic_bytes_verified: true,
            upload_status: "uploaded",
          },
        ])
        .select("id, document_type, original_filename, mime_type, file_size_bytes, upload_status, uploaded_at")
        .single();

      if (dbErr) {
        return sendError(res, dbErr.message, 500, "DATABASE_ERROR");
      }

      // Audit log
      try {
        await insforge.database.from("verification_audit_logs").insert([
          {
            actor_id: user.id,
            actor_role: user.activeRole,
            action: "KYC_DOCUMENT_UPLOADED",
            target_type: "kyc_verification_document",
            target_id: docRow.id,
            metadata: {
              document_type: documentType,
              file_size_bytes: buffer.length,
              mime_type: validation.detectedMime,
              sha256: validation.sha256,
            },
          },
        ]);
      } catch {}

      return sendSuccess(
        res,
        docRow,
        "Document uploaded securely. Review consent and click Submit for Verification.",
        201
      );
    } catch (err: any) {
      return sendError(res, err.message || "Document upload failed.", 500, "SERVER_ERROR");
    }
  }
);

// DELETE /api/kyc/documents/:id (Remove unsubmitted document)
router.delete("/kyc/documents/:id", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: doc } = await insforge.database
      .from("kyc_verification_documents")
      .select("id, user_id, storage_bucket, storage_key, upload_status")
      .eq("id", id)
      .single();

    if (!doc) return sendError(res, "Document not found.", 404, "NOT_FOUND");
    if (doc.user_id !== user.id) {
      return sendError(res, "Not authorized to remove this document.", 403, "FORBIDDEN");
    }
    if (doc.upload_status === "submitted") {
      return sendError(
        res,
        "Submitted documents under review cannot be deleted. Wait for review or contact support.",
        400,
        "ALREADY_SUBMITTED"
      );
    }

    try {
      await insforge.storage.from(doc.storage_bucket || KYC_PRIVATE_BUCKET).remove(doc.storage_key);
    } catch {}

    await insforge.database
      .from("kyc_verification_documents")
      .update({ upload_status: "deleted", deleted_at: new Date().toISOString() })
      .eq("id", id);

    return sendSuccess(res, { id }, "Unsubmitted document removed.");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to remove document.", 500, "SERVER_ERROR");
  }
});

// ============================================================================
// 4. CONSENT-GATED VERIFICATION SUBMISSION (WITH IDEMPOTENCY)
// ============================================================================

router.post("/kyc/submit", authenticateUser, async (req, res) => {
  const user = req.user!;
  const {
    business_id,
    document_type,
    document_id,
    identifier_value,
    verification_method,
    consent_accepted,
    consent_text_version,
    privacy_policy_version,
    terms_version,
    alternative_route_disclosed,
    idempotency_key,
  } = req.body as {
    business_id?: string | null;
    document_type?: string;
    document_id?: string;
    identifier_value?: string;
    verification_method?: VerificationMethod;
    consent_accepted?: boolean;
    consent_text_version?: string;
    privacy_policy_version?: string;
    terms_version?: string;
    alternative_route_disclosed?: boolean;
    idempotency_key?: string;
  };

  if (!document_type || !document_id) {
    return sendError(res, "Document type and uploaded document ID are required.", 400, "VALIDATION_FAILED");
  }
  if (consent_accepted !== true) {
    return sendError(
      res,
      "Explicit legal consent for this document verification method is required before submission.",
      400,
      "CONSENT_REQUIRED"
    );
  }
  if (document_type === "aadhaar_offline" && alternative_route_disclosed !== true) {
    return sendError(
      res,
      "Aadhaar verification requires acknowledgement of the voluntary alternative identity verification route.",
      400,
      "AADHAAR_CONSENT_INCOMPLETE"
    );
  }

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    if (business_id && !(await assertBusinessAccess(insforge, user, business_id))) {
      return sendError(res, "Not authorized to submit verification for this business.", 403, "FORBIDDEN");
    }

    // Duplicate submission protection via idempotency_key
    if (idempotency_key) {
      const { data: dup } = await insforge.database
        .from("verification_submissions")
        .select("id, status, document_type, submitted_at")
        .eq("user_id", user.id)
        .eq("idempotency_key", idempotency_key)
        .single();
      if (dup) {
        return sendSuccess(res, dup, "Verification submission already recorded (duplicate prevented).");
      }
    }

    // Verify document ownership
    const { data: doc } = await insforge.database
      .from("kyc_verification_documents")
      .select("id, user_id, document_type, upload_status")
      .eq("id", document_id)
      .single();

    if (!doc || doc.user_id !== user.id) {
      return sendError(res, "Uploaded document not found or unauthorized.", 404, "DOCUMENT_NOT_FOUND");
    }

    // Honest format pre-check (never claims live govt API when manual review is used)
    const preCheck = runHonestPreCheck({
      documentType: document_type,
      identifier: identifier_value,
      requestedMethod: verification_method,
    });

    if (preCheck.status === "mismatch") {
      return sendError(res, preCheck.notes, 400, "IDENTIFIER_FORMAT_INVALID");
    }

    const maskedId = maskGovIdentifier(document_type, identifier_value);
    const roleCode = normalizeRoleToKycCode(user.activeRole);
    const nowIso = new Date().toISOString();

    // Ensure profile exists
    let profQ = insforge.database
      .from("verification_profiles")
      .select("id")
      .eq("user_id", user.id);
    profQ = business_id ? profQ.eq("business_id", business_id) : profQ.is("business_id", null);
    let { data: profile } = await profQ.single();
    if (!profile) {
      const { data: createdProf } = await insforge.database
        .from("verification_profiles")
        .insert([{ user_id: user.id, business_id: business_id || null, role_code: roleCode }])
        .select("id")
        .single();
      profile = createdProf;
    }

    const { data: submission, error: subErr } = await insforge.database
      .from("verification_submissions")
      .insert([
        {
          profile_id: profile?.id || null,
          user_id: user.id,
          business_id: business_id || null,
          role_code: roleCode,
          document_type,
          verification_method: preCheck.method,
          status: "pending_verification",
          masked_identifier: maskedId,
          idempotency_key: idempotency_key || null,
          submitted_at: nowIso,
        },
      ])
      .select("id, document_type, verification_method, status, masked_identifier, submitted_at")
      .single();

    if (subErr || !submission) {
      return sendError(res, subErr?.message || "Failed to record submission.", 500, "DATABASE_ERROR");
    }

    // Link uploaded document to submission
    await insforge.database
      .from("kyc_verification_documents")
      .update({ submission_id: submission.id, upload_status: "submitted" })
      .eq("id", document_id);

    // Record explicit consent
    await insforge.database.from("verification_consents").insert([
      {
        user_id: user.id,
        business_id: business_id || null,
        submission_id: submission.id,
        document_type,
        consent_text_version: consent_text_version || "kyc-consent-2026-11-18-v1",
        privacy_policy_version: privacy_policy_version || "2026-11-18-v1",
        terms_version: terms_version || "2026-11-18-v1",
        verification_method: preCheck.method,
        provider_identity: preCheck.source,
        alternative_route_disclosed: Boolean(alternative_route_disclosed),
        accepted_at: nowIso,
      },
    ]);

    // Record initial verification_result & history
    await insforge.database.from("verification_results").insert([
      {
        submission_id: submission.id,
        verification_method: preCheck.method,
        verification_source: preCheck.source,
        result_status: "pending_manual",
        reviewer_or_provider: preCheck.honestLabel,
        mismatch_details: {},
        evidence_reference: doc.id,
      },
    ]);

    await insforge.database.from("verification_history").insert([
      {
        submission_id: submission.id,
        actor_id: user.id,
        actor_role: roleCode,
        previous_status: "uploaded",
        new_status: "pending_verification",
        public_note: `${preCheck.honestLabel}: Submitted for compliance review.`,
      },
    ]);

    await recomputeProfileProgress(insforge, user.id, business_id || null, roleCode);

    // User notification
    try {
      await insforge.database.from("notifications").insert([
        {
          user_id: user.id,
          title: "Verification Document Submitted",
          message: `Your ${document_type.replace(/_/g, " ")} document has been submitted for compliance review (${preCheck.honestLabel}).`,
          link: "/account/verification",
        },
      ]);
    } catch {}

    return sendSuccess(
      res,
      { ...submission, verification_label: preCheck.honestLabel },
      "Document submitted for verification review.",
      201
    );
  } catch (err: any) {
    return sendError(res, err.message || "Failed to submit verification.", 500, "SERVER_ERROR");
  }
});

// ============================================================================
// 5. AUTHORIZED PRIVATE DOCUMENT ACCESS (OWNER OR VERIFICATION ADMIN ONLY)
// ============================================================================

router.get("/kyc/documents/:id/access", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: doc } = await insforge.database
      .from("kyc_verification_documents")
      .select("id, user_id, business_id, storage_bucket, storage_key, original_filename, mime_type")
      .eq("id", id)
      .single();

    if (!doc) return sendError(res, "Document not found.", 404, "NOT_FOUND");

    const isOwner = doc.user_id === user.id;
    const isAuthorizedAdmin = hasAdminModuleAccess(user, "verification");
    if (!isOwner && !isAuthorizedAdmin) {
      return sendError(
        res,
        "Access denied. You do not hold permission to view or download this private KYC document.",
        403,
        "FORBIDDEN"
      );
    }

    // Audit every document access
    try {
      await insforge.database.from("verification_audit_logs").insert([
        {
          actor_id: user.id,
          actor_role: user.activeRole,
          action: "KYC_DOCUMENT_ACCESSED",
          target_type: "kyc_verification_document",
          target_id: doc.id,
          metadata: { owner_access: isOwner, admin_access: isAuthorizedAdmin },
        },
      ]);
    } catch {}

    const { data: blob, error } = await insforge.storage
      .from(doc.storage_bucket || KYC_PRIVATE_BUCKET)
      .download(doc.storage_key);

    if (error || !blob) {
      return sendError(res, "Unable to retrieve private document from storage.", 404, "STORAGE_NOT_FOUND");
    }

    const arrayBuffer = await (blob as Blob).arrayBuffer();
    res.setHeader("Content-Type", doc.mime_type || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${doc.original_filename}"`);
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    return sendError(res, err.message || "Failed to retrieve document.", 500, "SERVER_ERROR");
  }
});

// ============================================================================
// 6. ADMIN VERIFICATION CENTER (RBAC: verification MODULE REQUIRED)
// ============================================================================

router.get(
  "/kyc/admin/applications",
  authenticateUser,
  requireAdmin,
  requireAdminModule("verification"),
  async (req, res) => {
    const { role, business_type, document_type, status, risk_status, from_date } =
      req.query as Record<string, string | undefined>;
    const insforge = getInsForgeClient();
    if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

    try {
      let q = insforge.database
        .from("verification_submissions")
        .select(
          "*, users!verification_submissions_user_id_fkey(id, full_name, email, phone), businesses(id, name, business_type, city, state, verification_level)"
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (role && role !== "all") q = q.eq("role_code", role);
      if (business_type && business_type !== "all") q = q.eq("business_type", business_type);
      if (document_type && document_type !== "all") q = q.eq("document_type", document_type);
      if (status && status !== "all") q = q.eq("status", status);
      if (risk_status && risk_status !== "all") q = q.eq("risk_status", risk_status);
      if (from_date) q = q.gte("submitted_at", from_date);

      const { data: apps, error } = await q;
      if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

      const list = apps || [];
      const ids = list.map((a: any) => a.id);

      let docs: any[] = [];
      let consents: any[] = [];
      let history: any[] = [];

      if (ids.length > 0) {
        const [dRes, cRes, hRes] = await Promise.all([
          insforge.database
            .from("kyc_verification_documents")
            .select("id, submission_id, document_type, original_filename, mime_type, file_size_bytes, uploaded_at")
            .in("submission_id", ids),
          insforge.database
            .from("verification_consents")
            .select("id, submission_id, document_type, consent_text_version, verification_method, accepted_at")
            .in("submission_id", ids),
          insforge.database
            .from("verification_history")
            .select("id, submission_id, actor_role, previous_status, new_status, public_note, created_at")
            .in("submission_id", ids)
            .order("created_at", { ascending: false }),
        ]);
        docs = dRes.data || [];
        consents = cRes.data || [];
        history = hRes.data || [];
      }

      // Compute dashboard metrics
      const { data: allStatuses } = await insforge.database
        .from("verification_submissions")
        .select("status");

      const statusRows = allStatuses || [];
      const metrics = {
        total: statusRows.length,
        pending_review: statusRows.filter((r: any) => ["submitted", "pending_verification"].includes(r.status)).length,
        under_review: statusRows.filter((r: any) => r.status === "under_review").length,
        verified: statusRows.filter((r: any) => r.status === "verified").length,
        rejected: statusRows.filter((r: any) => r.status === "rejected").length,
        resubmission_required: statusRows.filter((r: any) => r.status === "resubmission_required").length,
        expired: statusRows.filter((r: any) => r.status === "expired").length,
      };

      const enriched = list.map((app: any) => ({
        ...app,
        documents: docs.filter((d) => d.submission_id === app.id),
        consents: consents.filter((c) => c.submission_id === app.id),
        history: history.filter((h) => h.submission_id === app.id),
      }));

      return sendSuccess(res, { metrics, applications: enriched });
    } catch (err: any) {
      return sendError(res, err.message || "Failed to load admin verification queue.", 500, "SERVER_ERROR");
    }
  }
);

router.patch(
  "/kyc/admin/applications/:id",
  authenticateUser,
  requireAdmin,
  requireAdminModule("verification"),
  async (req, res) => {
    const admin = req.user!;
    const { id } = req.params;
    const { action, rejection_reason, internal_note, assigned_reviewer_id, expires_at } = req.body as {
      action?: "approve" | "reject" | "request_resubmission" | "mark_under_review" | "add_internal_note" | "assign_reviewer";
      rejection_reason?: string;
      internal_note?: string;
      assigned_reviewer_id?: string;
      expires_at?: string;
    };

    const validActions = [
      "approve",
      "reject",
      "request_resubmission",
      "mark_under_review",
      "add_internal_note",
      "assign_reviewer",
    ];
    if (!action || !validActions.includes(action)) {
      return sendError(res, `Valid action required: ${validActions.join(", ")}.`, 400, "VALIDATION_FAILED");
    }

    if ((action === "reject" || action === "request_resubmission") && !rejection_reason?.trim()) {
      return sendError(
        res,
        "A clear rejection or resubmission reason is mandatory.",
        400,
        "REASON_REQUIRED"
      );
    }

    const insforge = getInsForgeClient();
    if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

    try {
      const { data: existing, error: fetchErr } = await insforge.database
        .from("verification_submissions")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchErr || !existing) {
        return sendError(res, "Verification application not found.", 404, "NOT_FOUND");
      }

      const nowIso = new Date().toISOString();
      const updatePayload: Record<string, any> = { updated_at: nowIso };
      let nextStatus = existing.status;
      let publicNote = "";

      if (action === "approve") {
        nextStatus = "verified";
        updatePayload.status = "verified";
        updatePayload.reviewed_at = nowIso;
        updatePayload.assigned_reviewer_id = admin.id;
        updatePayload.rejection_reason = null;
        if (expires_at) updatePayload.expires_at = expires_at;
        publicNote = "Verified via Manual Admin Review.";
      } else if (action === "reject") {
        nextStatus = "rejected";
        updatePayload.status = "rejected";
        updatePayload.reviewed_at = nowIso;
        updatePayload.assigned_reviewer_id = admin.id;
        updatePayload.rejection_reason = rejection_reason!.trim();
        publicNote = `Rejected: ${rejection_reason!.trim()}`;
      } else if (action === "request_resubmission") {
        nextStatus = "resubmission_required";
        updatePayload.status = "resubmission_required";
        updatePayload.reviewed_at = nowIso;
        updatePayload.assigned_reviewer_id = admin.id;
        updatePayload.rejection_reason = rejection_reason!.trim();
        publicNote = `Resubmission requested: ${rejection_reason!.trim()}`;
      } else if (action === "mark_under_review") {
        nextStatus = "under_review";
        updatePayload.status = "under_review";
        updatePayload.assigned_reviewer_id = admin.id;
        publicNote = "Application is currently under compliance review.";
      } else if (action === "add_internal_note") {
        const prefix = existing.internal_notes ? `${existing.internal_notes}\n` : "";
        updatePayload.internal_notes = `${prefix}[${nowIso} • ${admin.full_name}]: ${internal_note?.trim() || ""}`;
      } else if (action === "assign_reviewer") {
        updatePayload.assigned_reviewer_id = assigned_reviewer_id || admin.id;
      }

      const { data: updated, error: updErr } = await insforge.database
        .from("verification_submissions")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (updErr) return sendError(res, updErr.message, 500, "DATABASE_ERROR");

      // Record verification_results & verification_history (never expose internal_notes!)
      if (action !== "add_internal_note" && action !== "assign_reviewer") {
        await insforge.database.from("verification_results").insert([
          {
            submission_id: id,
            verification_method: "manual_admin_review",
            verification_source: "coverly_admin_verification_center",
            result_status: action === "approve" ? "verified" : action === "reject" ? "rejected" : "pending_manual",
            checked_at: nowIso,
            reviewer_or_provider: `Manual Review (${admin.full_name})`,
            mismatch_details: rejection_reason ? { reason: rejection_reason.trim() } : {},
          },
        ]);

        await insforge.database.from("verification_history").insert([
          {
            submission_id: id,
            actor_id: admin.id,
            actor_role: admin.activeRole,
            previous_status: existing.status,
            new_status: nextStatus,
            public_note: publicNote,
          },
        ]);

        await recomputeProfileProgress(
          insforge,
          existing.user_id,
          existing.business_id || null,
          existing.role_code
        );

        // Deduplicated user notification (only if status actually changed)
        if (existing.status !== nextStatus) {
          try {
            await insforge.database.from("notifications").insert([
              {
                user_id: existing.user_id,
                title: `KYC ${existing.document_type.replace(/_/g, " ").toUpperCase()}: ${nextStatus.replace(/_/g, " ")}`,
                message: publicNote,
                link: "/account/verification",
              },
            ]);
          } catch {}
        }
      }

      // Mandatory Admin Audit Log
      await insforge.database.from("verification_audit_logs").insert([
        {
          actor_id: admin.id,
          actor_role: admin.activeRole,
          action: `ADMIN_KYC_${action.toUpperCase()}`,
          target_type: "verification_submission",
          target_id: id,
          metadata: {
            previous_status: existing.status,
            new_status: nextStatus,
            has_internal_note: Boolean(internal_note),
            has_rejection_reason: Boolean(rejection_reason),
          },
        },
      ]);

      return sendSuccess(res, updated, `Verification application updated (${action}).`);
    } catch (err: any) {
      return sendError(res, err.message || "Failed to update verification application.", 500, "SERVER_ERROR");
    }
  }
);

// Admin Configurable Limits & Role Requirements
router.get(
  "/kyc/admin/config",
  authenticateUser,
  requireAdmin,
  requireAdminModule("verification"),
  async (_req, res) => {
    const insforge = getInsForgeClient();
    let customReqs: any[] = [];
    if (insforge) {
      try {
        const { data } = await insforge.database.from("verification_requirements").select("*");
        customReqs = data || [];
      } catch {}
    }
    return sendSuccess(res, {
      default_limits_mb: DEFAULT_DOCUMENT_LIMITS_MB,
      safe_platform_max_mb: SAFE_PLATFORM_MAX_MB,
      otp_limits: DEFAULT_OTP_LIMITS,
      custom_requirements: customReqs,
    });
  }
);

router.patch(
  "/kyc/admin/config",
  authenticateUser,
  requireAdmin,
  requireAdminModule("verification"),
  async (req, res) => {
    const admin = req.user!;
    const { role_code, document_type, display_name, description, is_required, max_size_mb, instructions } =
      req.body as Record<string, any>;

    if (!role_code || !document_type) {
      return sendError(res, "role_code and document_type are required.", 400, "VALIDATION_FAILED");
    }

    const boundedMaxMb = Math.min(SAFE_PLATFORM_MAX_MB, Math.max(1, Number(max_size_mb) || 5));
    const insforge = getInsForgeClient();
    if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

    try {
      const { data, error } = await insforge.database
        .from("verification_requirements")
        .upsert([
          {
            role_code,
            document_type,
            display_name: display_name || document_type.replace(/_/g, " "),
            description: description || "Configurable role verification document.",
            is_required: Boolean(is_required),
            max_size_mb: boundedMaxMb,
            instructions: instructions || null,
            updated_by: admin.id,
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

      await insforge.database.from("verification_audit_logs").insert([
        {
          actor_id: admin.id,
          actor_role: admin.activeRole,
          action: "ADMIN_KYC_CONFIG_UPDATED",
          target_type: "verification_requirement",
          metadata: { role_code, document_type, is_required, max_size_mb: boundedMaxMb },
        },
      ]);

      return sendSuccess(res, data, "Verification requirement configuration saved.");
    } catch (err: any) {
      return sendError(res, err.message || "Failed to update verification configuration.", 500, "SERVER_ERROR");
    }
  }
);

export default router;
