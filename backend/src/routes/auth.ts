import { Router } from "express";
import { getInsForgeClient, getPublicInsForgeClient } from "../lib/insforge.js";
import { authenticateUser } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";

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

    // 2. Register with InsForge Auth on a dedicated authClient so the admin db client is never mutated
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

    // 3. Insert into public.users
    const { error: userError } = await insforge.database.from("users").insert([
      {
        id: userId,
        email: normalizedEmail,
        full_name: full_name.trim(),
        phone: phone?.trim() || null,
        is_active: true,
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

    // 5. Record legal consent version & timestamp in audit log + verification_profiles + verification_consents (best-effort, non-blocking)
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
      // Non-blocking if RLS restricts direct inserts for new registrants
    }

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
        },
        consent: consentRecord,
        accessToken: authData.accessToken,
      },
      "Account registered successfully.",
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

    // 1. Sign in with InsForge Auth using a dedicated authClient so admin db client stays unpolluted
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
        .select("id, email, full_name, phone, avatar_url, is_active")
        .eq("id", userId)
        .single(),
      insforge.database
        .from("user_roles")
        .select("role, is_primary")
        .eq("user_id", userId),
      insforge.database
        .from("business_members")
        .select("business_id, role_in_business, businesses(*)")
        .eq("user_id", userId)
        .limit(1)
        .single(),
    ]);

    const userProfile = profileRes.data;
    if (userProfile && !userProfile.is_active) {
      return sendError(res, "Your account has been suspended. Please contact support.", 403, "ACCOUNT_SUSPENDED");
    }

    const roles = rolesRes.data || [];
    const userRoles = roles.map((r: any) => r.role);
    const activeRole = roles.find((r: any) => r.is_primary)?.role || userRoles[0] || "buyer";
    const memberRecord = memberRes.data;

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
        },
        business: memberRecord ? (memberRecord as any).businesses : null,
        accessToken: authData.accessToken,
      },
      "Login successful."
    );
  } catch (err: any) {
    return sendError(res, err.message || "Failed to authenticate.", 500, "AUTH_ERROR");
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
      user,
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
      .select("id, email, full_name, phone, avatar_url, is_active")
      .single();

    if (error) {
      return sendError(res, error.message, 500, "DATABASE_ERROR");
    }

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
