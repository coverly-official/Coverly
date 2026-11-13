import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";
import { authenticateUser } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = Router();

// Permitted roles for public user registration
const PUBLIC_PERMITTED_ROLES = [
  "buyer",
  "manufacturer",
  "wholesaler",
  "distributor",
  "buyer_supplier",
  "service_provider",
];

// POST /api/auth/register
router.post("/auth/register", async (req, res) => {
  const { email, password, full_name, role, phone } = req.body as {
    email?: string;
    password?: string;
    full_name?: string;
    role?: string;
    phone?: string;
  };

  if (!email?.trim() || !password || !full_name?.trim()) {
    return sendError(res, "Email, password, and full name are required.", 400, "VALIDATION_FAILED");
  }

  // Security guard: Users cannot grant themselves administrative permissions
  const assignedRole = role && PUBLIC_PERMITTED_ROLES.includes(role) ? role : "buyer";

  const insforge = getInsForgeClient();
  if (!insforge) {
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

    // 2. Register with InsForge Auth
    const { data: authData, error: authError } = await insforge.auth.signUp({
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
  if (!insforge) {
    return sendError(res, "InsForge database is not configured.", 503, "SERVICE_UNAVAILABLE");
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Sign in with InsForge Auth
    const { data: authData, error: authError } = await insforge.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (authError || !authData?.user) {
      return sendError(res, authError?.message || "Invalid email or password.", 401, "INVALID_CREDENTIALS");
    }

    const userId = authData.user.id;

    // 2. Fetch User Profile & Account Status
    const { data: userProfile } = await insforge.database
      .from("users")
      .select("id, email, full_name, phone, avatar_url, is_active")
      .eq("id", userId)
      .single();

    if (userProfile && !userProfile.is_active) {
      return sendError(res, "Your account has been suspended. Please contact support.", 403, "ACCOUNT_SUSPENDED");
    }

    // 3. Fetch User Roles
    const { data: roles } = await insforge.database
      .from("user_roles")
      .select("role, is_primary")
      .eq("user_id", userId);

    const userRoles = (roles || []).map((r: any) => r.role);
    const activeRole = roles?.find((r: any) => r.is_primary)?.role || userRoles[0] || "buyer";

    // 4. Fetch User Business (if any)
    const { data: memberRecord } = await insforge.database
      .from("business_members")
      .select("business_id, role_in_business, businesses(*)")
      .eq("user_id", userId)
      .limit(1)
      .single();

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

export default router;
