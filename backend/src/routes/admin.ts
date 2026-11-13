import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";

const router = Router();

// GET /api/admin/metrics
router.get("/admin/metrics", async (_req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({
      success: false,
      error: "Database client unavailable.",
    });
  }

  try {
    // 1. Total Businesses
    const { count: totalBusinesses } = await insforge.database
      .from("businesses")
      .select("*", { count: "exact", head: true });

    // 2. Total RFQs
    const { count: totalRfqs } = await insforge.database
      .from("rfqs")
      .select("*", { count: "exact", head: true });

    // 3. Total Orders & GMV
    const { data: orders } = await insforge.database
      .from("orders")
      .select("total_amount, status");

    const totalOrders = orders?.length || 0;
    const totalGmv = orders?.reduce((acc: number, curr: any) => acc + (Number(curr.total_amount) || 0), 0) || 0;

    // 4. Pending Verifications
    const { count: pendingVerifications } = await insforge.database
      .from("supplier_verifications")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // 5. Total Products
    const { count: totalProducts } = await insforge.database
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    return res.json({
      success: true,
      data: {
        totalGmv,
        totalOrders,
        totalRfqs: totalRfqs || 0,
        totalBusinesses: totalBusinesses || 0,
        totalProducts: totalProducts || 0,
        pendingVerifications: pendingVerifications || 0,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to aggregate admin metrics.",
    });
  }
});

// GET /api/admin/users
router.get("/admin/users", async (req, res) => {
  const { role, search } = req.query as { role?: string; search?: string };

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({
      success: false,
      error: "Database client unavailable.",
    });
  }

  try {
    let query = insforge.database
      .from("users")
      .select("id, email, full_name, phone, is_active, created_at, user_roles(role, is_primary)")
      .order("created_at", { ascending: false });

    if (search?.trim()) {
      query = query.or(`full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      data: data || [],
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch users list.",
    });
  }
});

// PATCH /api/admin/users/:id/status
router.patch("/admin/users/:id/status", async (req, res) => {
  const { id } = req.params;
  const { is_active, admin_id, reason } = req.body;

  if (typeof is_active !== "boolean" || !admin_id) {
    return res.status(400).json({
      success: false,
      error: "is_active boolean and admin_id are required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({
      success: false,
      error: "Database client unavailable.",
    });
  }

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

    if (updateError) {
      return res.status(500).json({ success: false, error: updateError.message });
    }

    // Record Audit Log
    await insforge.database.from("admin_audit_logs").insert([
      {
        admin_id,
        action: is_active ? "USER_ACTIVATED" : "USER_SUSPENDED",
        target_type: "user",
        target_id: id,
        metadata: { reason: reason?.trim() || null },
      },
    ]);

    return res.json({
      success: true,
      message: `User account ${is_active ? "activated" : "suspended"}.`,
      data: updatedUser,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to update user status.",
    });
  }
});

// GET /api/admin/audit-logs
router.get("/admin/audit-logs", async (_req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({
      success: false,
      error: "Database client unavailable.",
    });
  }

  try {
    const { data, error } = await insforge.database
      .from("admin_audit_logs")
      .select("id, admin_id, action, target_type, target_id, metadata, created_at, users(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      data: data || [],
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch audit logs.",
    });
  }
});

export default router;
