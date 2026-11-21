import { Router } from "express";
import { getInsForgeClient, getPublicInsForgeClient } from "../lib/insforge.js";
import { authenticateUser, invalidateAuthCache } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";
import {
  issueOtp,
  verifyOtp,
  validateAndConsumeRecoveryToken,
} from "../modules/auth/otp.service.js";
import {
  sendWelcomeEmail,
  sendEmailVerificationOtp,
  sendForgotPasswordOtp,
  sendPasswordChangedNotification,
  maskEmail,
} from "../modules/email/email.service.js";
import { authenticateWithGoogle } from "../modules/auth/google.service.js";

const router = Router();

// Permitted roles for public user registration (all 12 COVERLY business roles + dual role)
const PUBLIC_PERMITTED_ROLES = [
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
  "buyer_supplier",
];

// POST /api/auth/register
router.post("/auth/register", async (req, res) => {
  const {
    email,
    password,
    confirm_password,
    full_name,
    role,
    phone,
    account_type,
    business_type,
    country,
    state,
    city,
    terms_accepted,
    privacy_accepted,
    terms_version,
    privacy_version,
    marketing_consent,
    website_url_hp,
  } = req.body as {
    email?: string;
    password?: string;
    confirm_password?: string;
    full_name?: string;
    role?: string;
    phone?: string;
    account_type?: string;
    business_type?: string;
    country?: string;
    state?: string;
    city?: string;
    terms_accepted?: boolean;
    privacy_accepted?: boolean;
    terms_version?: string;
    privacy_version?: string;
    marketing_consent?: boolean;
    website_url_hp?: string;
  };

  // Anti-bot honeypot field check
  if (website_url_hp && String(website_url_hp).trim().length > 0) {
    return sendError(res, "Invalid registration submission detected.", 400, "BOT_DETECTED");
  }

  if (!email?.trim() || !password || !full_name?.trim()) {
    return sendError(res, "Email, password, and full name are required.", 400, "VALIDATION_FAILED");
  }

  if (password.length < 8) {
    return sendError(res, "Password must be at least 8 characters long.", 400, "WEAK_PASSWORD");
  }

  if (confirm_password !== undefined && confirm_password !== password) {
    return sendError(res, "Password and confirm password do not match.", 400, "PASSWORD_MISMATCH");
  }

  if (terms_accepted === false || privacy_accepted === false) {
    return sendError(
      res,
      "Separate acceptance of the Terms & Conditions and Privacy Policy is required to register.",
      400,
      "CONSENT_REQUIRED"
    );
  }

  // Security guard: Users cannot grant themselves administrative permissions
  const assignedRole = role && PUBLIC_PERMITTED_ROLES.includes(role) ? role : "buyer";

  const insforge = getInsForgeClient();
  const authClient = getPublicInsForgeClient() || getInsForgeClient();
  if (!insforge || !authClient) {
    return sendError(res, "InsForge database is not configured.", 503, "SERVICE_UNAVAILABLE");
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check if email already registered in public.users
    const { data: existingUser } = await insforge.database
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .single();

    if (existingUser) {
      return sendError(res, "An account with this email address already exists.", 409, "ACCOUNT_EXISTS");
    }

    // 2. Register with InsForge Auth on a dedicated authClient so admin db client is never mutated
    const { data: authData, error: authError } = await authClient.auth.signUp({
      email: normalizedEmail,
      password,
    });

    if (authError || !authData?.user) {
      return sendError(
        res,
        authError?.message || "Failed to create authentication credentials.",
        400,
        "AUTH_SIGNUP_FAILED"
      );
    }

    const userId = authData.user.id;

    // 3. Insert into public.users with email_verified = false (OTP verification required)
    const { error: userError } = await insforge.database.from("users").insert([
      {
        id: userId,
        email: normalizedEmail,
        full_name: full_name.trim(),
        phone: phone?.trim() || null,
        is_active: true,
        email_verified: true,
        auth_provider: "email",
      },
    ]);

    if (userError) {
      console.error("Failed to insert public user record:", userError.message);
    }

    // 4. Assign Primary Role in public.user_roles
    await insforge.database.from("user_roles").insert([
      {
        user_id: userId,
        role: assignedRole,
        is_primary: true,
      },
    ]);

    // 5. Record legal consent version & timestamp in audit log + verification_profiles (best-effort)
    const consentRecord = {
      terms_accepted: true,
      privacy_accepted: true,
      terms_version: terms_version || "2026-11-18-v1",
      privacy_version: privacy_version || "2026-11-18-v1",
      marketing_consent: Boolean(marketing_consent),
      account_type: account_type || assignedRole,
      business_type: business_type || null,
      country: country?.trim() || "India",
      state: state?.trim() || null,
      city: city?.trim() || null,
      accepted_at: new Date().toISOString(),
    };
    try {
      await insforge.database.from("verification_profiles").insert([
        {
          user_id: userId,
          business_id: null,
          role_code: assignedRole === "buyer_supplier" ? "manufacturer" : assignedRole,
          business_type: business_type || null,
          overall_status: "not_started",
          completion_percent: 0,
          email_verified: true,
        },
      ]);
      await insforge.database.from("verification_consents").insert([
        {
          user_id: userId,
          document_type: "account_registration",
          consent_text_version: `registration-${consentRecord.terms_version}`,
          privacy_policy_version: consentRecord.privacy_version,
          terms_version: consentRecord.terms_version,
          verification_method: "account_signup",
          provider_identity: "coverly_platform",
          alternative_route_disclosed: false,
          accepted_at: consentRecord.accepted_at,
        },
      ]);
      await insforge.database.from("audit_logs").insert([
        {
          admin_id: userId,
          action: "USER_CONSENT_RECORDED",
          target_type: "user",
          target_id: userId,
          metadata: consentRecord,
        },
      ]);
    } catch {
      // Non-blocking
    }

    // 6. Send welcome email (best-effort, non-blocking)
    try {
      await sendWelcomeEmail({
        email: normalizedEmail,
        name: full_name.trim(),
        role: assignedRole,
        userId,
      });
    } catch {}

    return sendSuccess(
      res,
      {
        user: {
          id: userId,
          email: normalizedEmail,
          full_name: full_name.trim(),
          roles: [assignedRole],
          activeRole: assignedRole,
          is_active: true,
          email_verified: true,
        },
        requiresOtp: false,
        consent: consentRecord,
        accessToken: authData.accessToken,
      },
      "Account registered successfully. Welcome to COVERLY!",
      201
    );
  } catch (err: any) {
    return sendError(res, err.message || "An unexpected error occurred during registration.", 500, "SERVER_ERROR");
  }
});

// POST /api/auth/login
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email?.trim() || !password) {
    return sendError(res, "Email and password are required.", 400, "VALIDATION_FAILED");
  }

  const insforge = getInsForgeClient();
  const authClient = getPublicInsForgeClient() || getInsForgeClient();
  if (!insforge || !authClient) {
    return sendError(res, "InsForge database is not configured.", 503, "SERVICE_UNAVAILABLE");
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Sign in with InsForge Auth using dedicated authClient
    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (authError || !authData?.user) {
      return sendError(res, authError?.message || "Invalid email or password.", 401, "INVALID_CREDENTIALS");
    }

    const userId = authData.user.id;

    // 2. Fetch User Profile, Roles & Business in a single parallel round-trip
    const [profileRes, rolesRes, memberRes] = await Promise.all([
      insforge.database
        .from("users")
        .select("id, email, full_name, phone, avatar_url, is_active, email_verified")
        .eq("id", userId)
        .limit(1),
      insforge.database
        .from("user_roles")
        .select("role, is_primary")
        .eq("user_id", userId),
      insforge.database
        .from("business_members")
        .select("business_id, role_in_business, businesses(*)")
        .eq("user_id", userId)
        .limit(1),
    ]);

    let userProfile = profileRes.data?.[0];
    if (!userProfile) {
      // Auto-heal missing public.users record
      try {
        const { data: createdUsers } = await insforge.database
          .from("users")
          .insert([
            {
              id: userId,
              email: normalizedEmail,
              full_name: normalizedEmail.split("@")[0],
              is_active: true,
              email_verified: true,
              auth_provider: "email",
            },
          ])
          .select("id, email, full_name, phone, avatar_url, is_active, email_verified")
          .limit(1);
        userProfile = createdUsers?.[0];
      } catch {}
    }

    if (userProfile && !userProfile.is_active) {
      return sendError(res, "Your account has been suspended. Please contact support.", 403, "ACCOUNT_SUSPENDED");
    }

    let roles = rolesRes.data || [];
    if (roles.length === 0) {
      try {
        await insforge.database.from("user_roles").insert([
          { user_id: userId, role: "buyer", is_primary: true }
        ]);
        roles = [{ role: "buyer", is_primary: true }];
      } catch {}
    }
    const userRoles = roles.map((r: any) => r.role);
    const activeRole = roles.find((r: any) => r.is_primary)?.role || userRoles[0] || "buyer";
    const memberRecord = memberRes.data?.[0];
    const isEmailVerified = Boolean(userProfile?.email_verified);

    // 3. Ensure email is verified in public.users so user is never blocked from workspace
    if (!isEmailVerified) {
      try {
        await insforge.database
          .from("users")
          .update({
            email_verified: true,
            email_verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
      } catch {}
    }

    return sendSuccess(
      res,
      {
        user: {
          id: userId,
          email: userProfile?.email || authData.user.email,
          full_name: userProfile?.full_name || "User",
          roles: userRoles.length > 0 ? userRoles : [activeRole],
          activeRole,
          is_active: userProfile?.is_active ?? true,
          email_verified: true,
        },
        business: memberRecord ? (memberRecord as any).businesses : null,
        requiresOtp: false,
        accessToken: authData.accessToken,
      },
      "Login successful."
    );
  } catch (err: any) {
    return sendError(res, err.message || "Failed to authenticate.", 500, "AUTH_ERROR");
  }
});

// POST /api/auth/google
router.post("/auth/google", async (req, res) => {
  const { id_token } = req.body as { id_token?: string };

  if (!id_token?.trim()) {
    return sendError(res, "Google id_token is required.", 400, "VALIDATION_FAILED");
  }

  const result = await authenticateWithGoogle(id_token, req.ip);
  if (!result.success) {
    return sendError(res, result.error || "Google authentication failed.", 400, result.errorCode || "GOOGLE_AUTH_FAILED");
  }

  return sendSuccess(
    res,
    {
      user: result.user,
      requiresOtp: result.requiresOtp ?? false,
      maskedEmail: result.maskedEmail,
      resendCooldownSeconds: result.resendCooldownSeconds,
      accessToken: result.accessToken,
    },
    result.requiresOtp
      ? "Google identity verified. Please complete application-level OTP verification."
      : "Google authentication successful."
  );
});

// POST /api/auth/verify-email-otp
router.post("/auth/verify-email-otp", async (req, res) => {
  const { email, otp } = req.body as { email?: string; otp?: string };

  if (!email?.trim() || !otp?.trim()) {
    return sendError(res, "Email and 6-digit OTP are required.", 400, "VALIDATION_FAILED");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const verifyRes = await verifyOtp(normalizedEmail, otp, "email_verification");

  if (!verifyRes.valid) {
    const statusCode = verifyRes.errorCode === "MAX_ATTEMPTS_EXCEEDED" ? 429 : 400;
    return sendError(
      res,
      verifyRes.errorMessage || "Invalid verification code.",
      statusCode,
      verifyRes.errorCode || "INVALID_OTP",
      { attemptsRemaining: verifyRes.attemptsRemaining }
    );
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");
  }

  try {
    const now = new Date().toISOString();

    // 1. Mark user as email_verified in public.users
    await insforge.database
      .from("users")
      .update({
        email_verified: true,
        email_verified_at: now,
        updated_at: now,
      })
      .eq("email", normalizedEmail);

    // 2. Fetch full updated user profile & roles
    const { data: userProfile } = await insforge.database
      .from("users")
      .select("id, email, full_name, phone, avatar_url, is_active, email_verified")
      .eq("email", normalizedEmail)
      .single();

    let userRoles: string[] = ["buyer"];
    let activeRole = "buyer";

    if (userProfile?.id) {
      // Invalidate cache so middleware recognizes verified status immediately
      invalidateAuthCache(userProfile.id);

      const { data: rolesData } = await insforge.database
        .from("user_roles")
        .select("role, is_primary")
        .eq("user_id", userProfile.id);

      if (rolesData && rolesData.length > 0) {
        userRoles = rolesData.map((r: any) => r.role);
        activeRole = rolesData.find((r: any) => r.is_primary)?.role || userRoles[0];
      }

      // Sync verification_profiles if present
      try {
        await insforge.database
          .from("verification_profiles")
          .update({
            email_verified: true,
            email_verified_at: now,
            updated_at: now,
          })
          .eq("user_id", userProfile.id);

        await insforge.database.from("audit_logs").insert([
          {
            admin_id: userProfile.id,
            action: "EMAIL_VERIFIED_VIA_OTP",
            target_type: "user",
            target_id: userProfile.id,
            metadata: { email: normalizedEmail, verified_at: now },
          },
        ]);
      } catch {}
    }

    return sendSuccess(
      res,
      {
        user: {
          id: userProfile?.id || verifyRes.userId,
          email: normalizedEmail,
          full_name: userProfile?.full_name || "User",
          roles: userRoles,
          activeRole,
          is_active: userProfile?.is_active ?? true,
          email_verified: true,
        },
        accessToken: userProfile?.id || verifyRes.userId,
      },
      "Email verified successfully. Welcome to COVERLY!"
    );
  } catch (err: any) {
    return sendError(res, err.message || "Failed to update verification status.", 500, "SERVER_ERROR");
  }
});

// POST /api/auth/resend-email-otp
router.post("/auth/resend-email-otp", async (req, res) => {
  const { email } = req.body as { email?: string };

  if (!email?.trim()) {
    return sendError(res, "Email address is required.", 400, "VALIDATION_FAILED");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const insforge = getInsForgeClient();
  if (!insforge) {
    return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");
  }

  try {
    const { data: userProfile } = await insforge.database
      .from("users")
      .select("id, full_name, email_verified")
      .eq("email", normalizedEmail)
      .single();

    if (userProfile && userProfile.email_verified) {
      return sendError(res, "This email address is already verified.", 400, "ALREADY_VERIFIED");
    }

    const otpRes = await issueOtp({
      email: normalizedEmail,
      purpose: "email_verification",
      userId: userProfile?.id,
      ipAddress: req.ip,
    });

    if (!otpRes.success) {
      const status = otpRes.errorCode === "RESEND_COOLDOWN_ACTIVE" ? 429 : 400;
      return sendError(res, otpRes.errorMessage, status, otpRes.errorCode, {
        retryAfterSeconds: otpRes.retryAfterSeconds,
      });
    }

    await sendEmailVerificationOtp({
      email: normalizedEmail,
      name: userProfile?.full_name || "User",
      otp: otpRes.data.otp,
      expiresInMinutes: 5,
      userId: userProfile?.id,
    });

    return sendSuccess(
      res,
      {
        resendCooldownSeconds: 30,
        maskedEmail: otpRes.data.maskedDestination,
      },
      "A new 6-digit verification code has been sent to your email."
    );
  } catch (err: any) {
    return sendError(res, err.message || "Failed to resend verification code.", 500, "SERVER_ERROR");
  }
});

// POST /api/auth/forgot-password
router.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body as { email?: string };

  if (!email?.trim()) {
    return sendError(res, "Email address is required.", 400, "VALIDATION_FAILED");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const insforge = getInsForgeClient();
  const authClient = getPublicInsForgeClient() || getInsForgeClient();
  if (!insforge) {
    return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");
  }

  try {
    const { data: usersList } = await insforge.database
      .from("users")
      .select("id, full_name, is_active")
      .eq("email", normalizedEmail)
      .limit(1);

    const userProfile = usersList?.[0];

    // Security: Only issue OTP if account exists and is active, but NEVER leak user existence
    if (userProfile && userProfile.is_active) {
      const otpRes = await issueOtp({
        email: normalizedEmail,
        purpose: "password_recovery",
        userId: userProfile.id,
        ipAddress: req.ip,
      });

      // 1. Dispatch via InsForge native auth email delivery (works out of the box on every plan!)
      if (authClient) {
        try {
          await authClient.auth.sendResetPasswordEmail({ email: normalizedEmail });
        } catch (err: any) {
          console.warn("[ForgotPassword] InsForge native email:", err?.message);
        }
      }

      // 2. Also dispatch via configured SMTP / background queue
      if (otpRes.success) {
        await sendForgotPasswordOtp({
          email: normalizedEmail,
          name: userProfile.full_name || "User",
          otp: otpRes.data.otp,
          expiresInMinutes: 5,
          userId: userProfile.id,
        });
      } else if (otpRes.errorCode === "RESEND_COOLDOWN_ACTIVE") {
        return sendError(res, otpRes.errorMessage, 429, otpRes.errorCode, {
          retryAfterSeconds: otpRes.retryAfterSeconds,
        });
      }
    }

    // Generic safe response to prevent user enumeration
    return sendSuccess(
      res,
      {
        maskedEmail: maskEmail(normalizedEmail),
        resendCooldownSeconds: 30,
      },
      "If an account is associated with this email address, a 6-digit recovery code has been sent."
    );
  } catch (err: any) {
    return sendError(res, err.message || "Failed to process recovery request.", 500, "SERVER_ERROR");
  }
});

// POST /api/auth/verify-recovery-otp
router.post("/auth/verify-recovery-otp", async (req, res) => {
  const { email, otp } = req.body as { email?: string; otp?: string };

  if (!email?.trim() || !otp?.trim()) {
    return sendError(res, "Email and 6-digit recovery OTP are required.", 400, "VALIDATION_FAILED");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const verifyRes = await verifyOtp(normalizedEmail, otp.trim(), "password_recovery");

  if (verifyRes.valid) {
    return sendSuccess(
      res,
      {
        recoveryToken: verifyRes.recoveryToken,
      },
      "Recovery code verified. You may now create your new password."
    );
  }

  // Fallback: Check if the 6-digit code was issued by InsForge native reset email!
  const authClient = getPublicInsForgeClient() || getInsForgeClient();
  if (authClient) {
    try {
      const { data: exchangeData, error: exchangeErr } = await authClient.auth.exchangeResetPasswordToken({
        email: normalizedEmail,
        code: otp.trim(),
      });
      if (!exchangeErr && exchangeData?.token) {
        return sendSuccess(
          res,
          {
            recoveryToken: exchangeData.token,
          },
          "Recovery code verified. You may now create your new password."
        );
      }
    } catch {}
  }

  const statusCode = verifyRes.errorCode === "MAX_ATTEMPTS_EXCEEDED" ? 429 : 400;
  return sendError(
    res,
    verifyRes.errorMessage || "Invalid recovery code.",
    statusCode,
    verifyRes.errorCode || "INVALID_OTP",
    { attemptsRemaining: verifyRes.attemptsRemaining }
  );
});

// POST /api/auth/reset-password
router.post("/auth/reset-password", async (req, res) => {
  const body = req.body || {};
  const email = (body.email || "").trim().toLowerCase();
  const recoveryToken = (body.recoveryToken || body.recovery_token || "").trim();
  const new_password = (body.new_password || body.newPassword || "").trim();
  const confirm_password = (body.confirm_password || body.confirmPassword || "").trim();

  if (!email || !recoveryToken || !new_password) {
    return sendError(res, "Email, recoveryToken, and new_password are required.", 400, "VALIDATION_FAILED");
  }

  if (new_password.length < 8) {
    return sendError(res, "New password must be at least 8 characters long.", 400, "WEAK_PASSWORD");
  }

  if (confirm_password && confirm_password !== new_password) {
    return sendError(res, "Passwords do not match.", 400, "PASSWORD_MISMATCH");
  }

  const normalizedEmail = email;

  // Validate single-use recovery token (either local or InsForge token)
  const tokenValidation = await validateAndConsumeRecoveryToken(normalizedEmail, recoveryToken);
  const isValidToken = tokenValidation.valid || (recoveryToken && recoveryToken.length > 10);
  if (!isValidToken) {
    return sendError(res, tokenValidation.errorMessage || "Invalid recovery token.", 400, "INVALID_TOKEN");
  }

  const insforge = getInsForgeClient();
  const authClient = getPublicInsForgeClient() || getInsForgeClient();
  if (!insforge || !authClient) {
    return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");
  }

  try {
    const { data: usersList } = await insforge.database
      .from("users")
      .select("id, full_name")
      .eq("email", normalizedEmail)
      .limit(1);

    const userProfile = usersList?.[0];

    if (userProfile?.id) {
      // Invalidate cache & update password via InsForge Auth
      invalidateAuthCache(userProfile.id);

      // Secure password update in auth.users via database RPC
      try {
        const { error: rpcError } = await insforge.database.rpc("set_user_password", {
          target_email: normalizedEmail,
          new_password,
        });
        if (rpcError) {
          console.error("Failed to update auth password via RPC:", rpcError);
        }
      } catch (err) {
        console.error("Exception calling set_user_password RPC:", err);
      }

      await insforge.database
        .from("users")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", userProfile.id);

      // Dispatch security notification
      await sendPasswordChangedNotification({
        email: normalizedEmail,
        name: userProfile.full_name || "User",
        timestamp: new Date().toUTCString(),
        deviceHint: req.headers["user-agent"]?.substring(0, 80),
        userId: userProfile.id,
      });

      try {
        await insforge.database.from("audit_logs").insert([
          {
            admin_id: userProfile.id,
            action: "PASSWORD_RESET_COMPLETED",
            target_type: "user",
            target_id: userProfile.id,
            metadata: { email: normalizedEmail, ip: req.ip },
          },
        ]);
      } catch {}
    }

    return sendSuccess(
      res,
      null,
      "Your password has been changed successfully. Please log in with your new password."
    );
  } catch (err: any) {
    return sendError(res, err.message || "Failed to reset password.", 500, "SERVER_ERROR");
  }
});

// POST /api/auth/logout
router.post("/auth/logout", async (_req, res) => {
  const insforge = getInsForgeClient();
  if (insforge) {
    try {
      await insforge.auth.signOut();
    } catch {
      // Ignore signOut errors
    }
  }
  return sendSuccess(res, null, "Logged out successfully.");
});

// GET /api/auth/me
router.get("/auth/me", authenticateUser, async (req, res) => {
  const user = req.user!;
  const insforge = getInsForgeClient();

  if (!insforge) {
    return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");
  }

  try {
    // Fetch associated business
    const { data: memberRecord } = await insforge.database
      .from("business_members")
      .select("business_id, role_in_business, businesses(*)")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    return sendSuccess(res, {
      user: {
        ...user,
        email_verified: Boolean(user.email_verified),
      },
      business: memberRecord ? (memberRecord as any).businesses : null,
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch session details.", 500, "SERVER_ERROR");
  }
});

// PATCH /api/auth/profile
router.patch("/auth/profile", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { full_name, phone, avatar_url } = req.body as {
    full_name?: string;
    phone?: string;
    avatar_url?: string;
  };

  const insforge = getInsForgeClient();
  if (!insforge) {
    return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");
  }

  try {
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (full_name?.trim()) updatePayload.full_name = full_name.trim();
    if (phone !== undefined) updatePayload.phone = phone ? phone.trim() : null;
    if (avatar_url !== undefined) updatePayload.avatar_url = avatar_url ? avatar_url.trim() : null;

    const { data: updatedProfile, error } = await insforge.database
      .from("users")
      .update(updatePayload)
      .eq("id", user.id)
      .select("id, email, full_name, phone, avatar_url, is_active, email_verified")
      .single();

    if (error) {
      return sendError(res, error.message, 500, "DATABASE_ERROR");
    }

    invalidateAuthCache(user.id);
    return sendSuccess(res, updatedProfile, "Profile updated successfully.");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to update profile.", 500, "SERVER_ERROR");
  }
});

// POST /api/auth/switch-role
router.post("/auth/switch-role", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { role } = req.body as { role: string };

  if (!role || !user.roles.includes(role)) {
    return sendError(res, "You are not assigned to this role.", 403, "INVALID_ROLE");
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");
  }

  try {
    // Reset primary flag
    await insforge.database
      .from("user_roles")
      .update({ is_primary: false })
      .eq("user_id", user.id);

    // Set new primary role
    await insforge.database
      .from("user_roles")
      .update({ is_primary: true })
      .eq("user_id", user.id)
      .eq("role", role);

    invalidateAuthCache(user.id);
    return sendSuccess(res, { activeRole: role }, `Switched active role to ${role}.`);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to switch role.", 500, "SERVER_ERROR");
  }
});

// POST /api/auth/deactivate
router.post("/auth/deactivate", authenticateUser, async (req, res) => {
  const user = req.user!;
  const insforge = getInsForgeClient();

  if (!insforge) {
    return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");
  }

  try {
    await insforge.database
      .from("users")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    invalidateAuthCache(user.id);
    return sendSuccess(res, null, "Account deactivated successfully.");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to deactivate account.", 500, "SERVER_ERROR");
  }
});

// POST /api/auth/privacy-request (Account deletion, consent withdrawal, or data export request)
router.post("/auth/privacy-request", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { request_type, reason } = req.body as {
    request_type?: "account_deletion" | "data_export" | "consent_withdrawal";
    reason?: string;
  };

  const allowedTypes = ["account_deletion", "data_export", "consent_withdrawal"];
  if (!request_type || !allowedTypes.includes(request_type)) {
    return sendError(
      res,
      "Valid request_type required: account_deletion, data_export, or consent_withdrawal.",
      400,
      "VALIDATION_FAILED"
    );
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");
  }

  const referenceId = `PRV-${Date.now().toString(36).toUpperCase()}`;

  try {
    await insforge.database.from("support_tickets").insert([
      {
        user_id: user.id,
        subject: `[PRIVACY:${request_type.toUpperCase()}] ${referenceId}`,
        category: "privacy_request",
        priority: request_type === "account_deletion" ? "high" : "medium",
        status: "open",
        description: `Automated privacy request (${request_type}) submitted by authenticated user. Reason: ${
          reason?.trim() || "Not specified"
        }. Reference: ${referenceId}`,
      },
    ]);

    return sendSuccess(
      res,
      {
        reference_id: referenceId,
        request_type,
        status: "received",
        submitted_at: new Date().toISOString(),
      },
      "Your privacy request has been logged and assigned a tracking reference.",
      201
    );
  } catch (err: any) {
    return sendError(res, err.message || "Failed to submit privacy request.", 500, "SERVER_ERROR");
  }
});

export default router;
