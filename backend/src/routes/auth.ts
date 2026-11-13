import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";

const router = Router();

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
    return res.status(400).json({
      success: false,
      error: "Email, password, and full name are required.",
    });
  }

  const validRoles = [
    "buyer", "manufacturer", "wholesaler", "distributor",
    "buyer_supplier", "admin", "verification_admin", "support_admin"
  ];
  const userRole = role && validRoles.includes(role) ? role : "buyer";

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({
      success: false,
      error: "InsForge database is not configured.",
    });
  }

  try {
    // 1. Register with InsForge Auth
    const { data: authData, error: authError } = await insforge.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError || !authData?.user) {
      return res.status(400).json({
        success: false,
        error: authError?.message || "Failed to create authentication account.",
      });
    }

    const userId = authData.user.id;

    // 2. Insert into public.users
    const { error: userError } = await insforge.database
      .from("users")
      .insert([
        {
          id: userId,
          email: email.trim().toLowerCase(),
          full_name: full_name.trim(),
          phone: phone?.trim() || null,
          is_active: true,
        },
      ]);

    if (userError) {
      console.warn("Failed to create public user record:", userError.message);
    }

    // 3. Assign Role in public.user_roles
    await insforge.database.from("user_roles").insert([
      {
        user_id: userId,
        role: userRole,
        is_primary: true,
      },
    ]);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: {
        user: {
          id: userId,
          email: email.trim().toLowerCase(),
          full_name: full_name.trim(),
          role: userRole,
        },
        accessToken: authData.accessToken,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "An unexpected error occurred during registration.",
    });
  }
});

// POST /api/auth/login
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email?.trim() || !password) {
    return res.status(400).json({
      success: false,
      error: "Email and password are required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({
      success: false,
      error: "InsForge database is not configured.",
    });
  }

  try {
    // 1. Sign in with InsForge Auth
    const { data: authData, error: authError } = await insforge.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError || !authData?.user) {
      return res.status(401).json({
        success: false,
        error: authError?.message || "Invalid email or password.",
      });
    }

    const userId = authData.user.id;

    // 2. Fetch User Profile
    const { data: userProfile } = await insforge.database
      .from("users")
      .select("id, email, full_name, phone, avatar_url, is_active")
      .eq("id", userId)
      .single();

    if (userProfile && !userProfile.is_active) {
      return res.status(403).json({
        success: false,
        error: "Your account has been suspended. Please contact support.",
      });
    }

    // 3. Fetch User Roles
    const { data: roles } = await insforge.database
      .from("user_roles")
      .select("role, is_primary")
      .eq("user_id", userId);

    const activeRole = roles?.find((r: any) => r.is_primary)?.role || roles?.[0]?.role || "buyer";

    // 4. Fetch User Business (if any)
    const { data: memberRecord } = await insforge.database
      .from("business_members")
      .select("business_id, role_in_business, businesses(*)")
      .eq("user_id", userId)
      .limit(1)
      .single();

    return res.json({
      success: true,
      data: {
        user: {
          id: userId,
          email: userProfile?.email || authData.user.email,
          full_name: userProfile?.full_name || "User",
          roles: roles?.map((r: any) => r.role) || [activeRole],
          activeRole,
        },
        business: memberRecord ? (memberRecord as any).businesses : null,
        accessToken: authData.accessToken,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to authenticate.",
    });
  }
});

// GET /api/auth/me
router.get("/auth/me", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: "User identifier header required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({
      success: false,
      error: "InsForge database is not configured.",
    });
  }

  try {
    const { data: userProfile, error: profileError } = await insforge.database
      .from("users")
      .select("id, email, full_name, phone, avatar_url, is_active")
      .eq("id", userId)
      .single();

    if (profileError || !userProfile) {
      return res.status(404).json({
        success: false,
        error: "User profile not found.",
      });
    }

    const { data: roles } = await insforge.database
      .from("user_roles")
      .select("role, is_primary")
      .eq("user_id", userId);

    const activeRole = roles?.find((r: any) => r.is_primary)?.role || roles?.[0]?.role || "buyer";

    const { data: memberRecord } = await insforge.database
      .from("business_members")
      .select("business_id, role_in_business, businesses(*)")
      .eq("user_id", userId)
      .limit(1)
      .single();

    return res.json({
      success: true,
      data: {
        user: {
          id: userId,
          email: userProfile.email,
          full_name: userProfile.full_name,
          roles: roles?.map((r: any) => r.role) || [activeRole],
          activeRole,
          is_active: userProfile.is_active,
        },
        business: memberRecord ? (memberRecord as any).businesses : null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch user session.",
    });
  }
});

export default router;
