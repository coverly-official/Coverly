import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";
import { authenticateUser, requireAdmin } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = Router();

// Protect all admin endpoints
router.use(authenticateUser);
router.use(requireAdmin);

// GET /api/admin/metrics (Comprehensive Platform Metrics)
router.get("/admin/metrics", async (_req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    // 1. Total Businesses
    const { count: totalBusinesses } = await insforge.database
      .from("businesses")
      .select("*", { count: "exact", head: true });

    // 2. Total Users
    const { count: totalUsers } = await insforge.database
      .from("users")
      .select("*", { count: "exact", head: true });

    // 3. Total RFQs
    const { count: totalRfqs } = await insforge.database
      .from("rfqs")
      .select("*", { count: "exact", head: true });

    // 4. Total Orders & GMV
    const { data: orders } = await insforge.database
      .from("orders")
      .select("total_amount, status");

    const totalOrders = orders?.length || 0;
    const totalGmv = orders?.reduce((acc: number, curr: any) => acc + (Number(curr.total_amount) || 0), 0) || 0;

    // 5. Pending Verifications
    const { count: pendingVerifications } = await insforge.database
      .from("supplier_verifications")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // 6. Total Products
    const { count: totalProducts } = await insforge.database
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // 7. Open Support Tickets
    const { count: openTickets } = await insforge.database
      .from("support_tickets")
      .select("*", { count: "exact", head: true })
      .eq("status", "open");

    // 8. Service Requests
    const { count: totalServiceRequests } = await insforge.database
      .from("service_requests")
      .select("*", { count: "exact", head: true });

    return sendSuccess(res, {
      totalGmv,
      totalOrders,
      totalRfqs: totalRfqs || 0,
      totalBusinesses: totalBusinesses || 0,
      totalUsers: totalUsers || 0,
      totalProducts: totalProducts || 0,
      pendingVerifications: pendingVerifications || 0,
      openTickets: openTickets || 0,
      totalServiceRequests: totalServiceRequests || 0,
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to aggregate admin metrics.", 500, "SERVER_ERROR");
  }
});

// GET /api/admin/users (User Governance)
router.get("/admin/users", async (req, res) => {
  const { role, search, is_active, page = "1", limit = "50" } = req.query as Record<string, string | undefined>;

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const pageNum = Math.max(1, Number.parseInt(page || "1", 10));
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit || "50", 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = insforge.database
      .from("users")
      .select("id, email, full_name, phone, avatar_url, is_active, created_at, user_roles(role, is_primary)", {
        count: "exact",
      })
      .order("created_at", { ascending: false });

    if (search?.trim()) {
      query = query.or(`full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
    }

    if (is_active !== undefined) {
      query = query.eq("is_active", is_active === "true");
    }

    const { data, count, error } = await query.range(offset, offset + limitNum - 1);
    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    let filteredUsers = data || [];
    if (role?.trim()) {
      filteredUsers = filteredUsers.filter((u: any) =>
        u.user_roles?.some((r: any) => r.role === role.trim())
      );
    }

    return sendSuccess(res, {
      items: filteredUsers,
      total: count || filteredUsers.length,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch users list.", 500, "SERVER_ERROR");
  }
});

// PATCH /api/admin/users/:id/status (Suspend / Activate User)
router.patch("/admin/users/:id/status", async (req, res) => {
  const admin = req.user!;
  const { id } = req.params;
  const { is_active, reason } = req.body;

  if (typeof is_active !== "boolean") {
    return sendError(res, "is_active boolean is required.", 400, "VALIDATION_FAILED");
  }

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: updatedUser, error: updateError } = await insforge.database
      .from("users")
      .update({
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) return sendError(res, updateError.message, 500, "DATABASE_ERROR");

    // Audit Log
    await insforge.database.from("admin_audit_logs").insert([
      {
        admin_id: admin.id,
        action: is_active ? "USER_ACTIVATED" : "USER_SUSPENDED",
        target_type: "user",
        target_id: id,
        metadata: { reason: reason?.trim() || null },
      },
    ]);

    return sendSuccess(res, updatedUser, `User account ${is_active ? "activated" : "suspended"}.`);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to update user status.", 500, "SERVER_ERROR");
  }
});

// PATCH /api/admin/users/:id/roles (Assign / Revoke Roles)
router.patch("/admin/users/:id/roles", async (req, res) => {
  const admin = req.user!;
  const { id } = req.params;
  const { roles } = req.body as { roles: string[] };

  if (!Array.isArray(roles) || roles.length === 0) {
    return sendError(res, "At least one role must be provided.", 400, "VALIDATION_FAILED");
  }

  const validRoles = [
    "buyer", "manufacturer", "wholesaler", "distributor", "service_provider",
    "buyer_supplier", "admin", "verification_admin", "support_admin",
  ];

  for (const r of roles) {
    if (!validRoles.includes(r)) {
      return sendError(res, `Invalid role: ${r}.`, 400, "VALIDATION_FAILED");
    }
  }

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    // Delete existing roles
    await insforge.database.from("user_roles").delete().eq("user_id", id);

    // Insert new roles
    const payload = roles.map((role, idx) => ({
      user_id: id,
      role,
      is_primary: idx === 0,
    }));

    await insforge.database.from("user_roles").insert(payload);

    // Audit Log
    await insforge.database.from("admin_audit_logs").insert([
      {
        admin_id: admin.id,
        action: "USER_ROLES_UPDATED",
        target_type: "user",
        target_id: id,
        metadata: { assignedRoles: roles },
      },
    ]);

    return sendSuccess(res, { roles }, "User roles updated successfully.");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to update user roles.", 500, "SERVER_ERROR");
  }
});

// GET /api/admin/products (Product Moderation Queue)
router.get("/admin/products", async (req, res) => {
  const { search, category, is_active } = req.query as Record<string, string | undefined>;

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    let query = insforge.database
      .from("products")
      .select("id, title, indicative_price, moq, is_active, created_at, businesses(name, city, verification_level), categories(name)")
      .order("created_at", { ascending: false });

    if (search?.trim()) query = query.ilike("title", `%${search.trim()}%`);
    if (category?.trim()) query = query.eq("category_id", category.trim());
    if (is_active !== undefined) query = query.eq("is_active", is_active === "true");

    const { data, error } = await query.limit(50);
    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, data || []);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch products.", 500, "SERVER_ERROR");
  }
});

// PATCH /api/admin/products/:id/moderate
router.patch("/admin/products/:id/moderate", async (req, res) => {
  const admin = req.user!;
  const { id } = req.params;
  const { is_active, reason } = req.body;

  if (typeof is_active !== "boolean") {
    return sendError(res, "is_active boolean is required.", 400, "VALIDATION_FAILED");
  }

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data, error } = await insforge.database
      .from("products")
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    // Audit Log
    await insforge.database.from("admin_audit_logs").insert([
      {
        admin_id: admin.id,
        action: is_active ? "PRODUCT_APPROVED" : "PRODUCT_SUSPENDED",
        target_type: "product",
        target_id: id,
        metadata: { reason },
      },
    ]);

    return sendSuccess(res, data, `Product listing status updated to ${is_active ? "active" : "suspended"}.`);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to moderate product.", 500, "SERVER_ERROR");
  }
});

// GET /api/admin/audit-logs
router.get("/admin/audit-logs", async (req, res) => {
  const { limit = "100" } = req.query as { limit?: string };
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data, error } = await insforge.database
      .from("admin_audit_logs")
      .select("id, admin_id, action, target_type, target_id, metadata, created_at, users(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(Number.parseInt(limit, 10) || 100);

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, data || []);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch audit logs.", 500, "SERVER_ERROR");
  }
});

export default router;
