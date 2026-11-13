import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";
import { authenticateUser } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = Router();

// Defined state-machine allowed transitions: current_status -> permitted next statuses
const PERMITTED_TRANSITIONS: Record<string, string[]> = {
  pending_deposit: ["deposit_paid", "cancelled"],
  deposit_paid: ["in_production", "cancelled", "disputed"],
  in_production: ["quality_check", "disputed"],
  quality_check: ["shipped", "in_production", "disputed"],
  shipped: ["delivered", "disputed"],
  delivered: ["completed", "disputed"],
  completed: [],
  disputed: ["in_production", "shipped", "delivered", "completed", "cancelled"],
  cancelled: [],
};

// GET /api/orders
router.get("/orders", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { status, page = "1", limit = "20" } = req.query as Record<string, string | undefined>;

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const pageNum = Math.max(1, Number.parseInt(page || "1", 10));
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit || "20", 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = insforge.database
      .from("orders")
      .select(
        "id, order_number, quotation_id, buyer_id, supplier_business_id, status, total_amount, tracking_number, carrier, dispatch_date, delivery_date, created_at, businesses!supplier_business_id(name, city, verification_level)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    // Role-based filtering
    if (!user.roles.includes("admin")) {
      // Find business IDs where user is member
      const { data: userBusinesses } = await insforge.database
        .from("business_members")
        .select("business_id")
        .eq("user_id", user.id);

      const bizIds = (userBusinesses || []).map((b: any) => b.business_id);

      // Either user is buyer or supplier
      if (bizIds.length > 0) {
        query = query.or(`buyer_id.eq.${user.id},supplier_business_id.in.(${bizIds.join(",")})`);
      } else {
        query = query.eq("buyer_id", user.id);
      }
    }

    if (status && Object.keys(PERMITTED_TRANSITIONS).includes(status)) {
      query = query.eq("status", status);
    }

    const { data, count, error } = await query.range(offset, offset + limitNum - 1);

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, {
      items: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch orders.", 500, "SERVER_ERROR");
  }
});

// GET /api/orders/:id (Order Details)
router.get("/orders/:id", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { id } = req.params;

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: order, error } = await insforge.database
      .from("orders")
      .select(
        "id, order_number, quotation_id, buyer_id, buyer_business_id, supplier_business_id, status, total_amount, tracking_number, carrier, dispatch_date, delivery_date, created_at, businesses!supplier_business_id(id, name, city, phone, email, verification_level), users!buyer_id(id, full_name, email, phone)"
      )
      .eq("id", id)
      .single();

    if (error || !order) {
      return sendError(res, "Order not found.", 404, "NOT_FOUND");
    }

    // Verify user authorization: buyer, supplier member, or admin
    let isAuthorized = user.id === order.buyer_id || user.roles.includes("admin");
    if (!isAuthorized) {
      const { data: member } = await insforge.database
        .from("business_members")
        .select("id")
        .eq("business_id", order.supplier_business_id)
        .eq("user_id", user.id)
        .single();

      if (member) isAuthorized = true;
    }

    if (!isAuthorized) {
      return sendError(res, "You are not authorized to view this order.", 403, "FORBIDDEN");
    }

    // Line items
    const { data: items } = await insforge.database
      .from("order_items")
      .select("id, item_name, quantity, unit, unit_price, total_price")
      .eq("order_id", id);

    // Status timeline history
    const { data: history } = await insforge.database
      .from("order_status_history")
      .select("id, previous_status, new_status, note, created_at, users(full_name)")
      .eq("order_id", id)
      .order("created_at", { ascending: true });

    return sendSuccess(res, {
      ...order,
      items: items || [],
      history: history || [],
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch order details.", 500, "SERVER_ERROR");
  }
});

// PATCH /api/orders/:id/status (Transition Status)
router.patch("/orders/:id/status", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { id } = req.params;
  const { new_status, note, tracking_number, carrier } = req.body;

  if (!new_status || !Object.keys(PERMITTED_TRANSITIONS).includes(new_status)) {
    return sendError(res, "Valid new_status is required.", 400, "VALIDATION_FAILED");
  }

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    // 1. Fetch current order
    const { data: order, error: orderErr } = await insforge.database
      .from("orders")
      .select("id, order_number, buyer_id, supplier_business_id, status")
      .eq("id", id)
      .single();

    if (orderErr || !order) return sendError(res, "Order not found.", 404, "NOT_FOUND");

    const previous_status = order.status;

    // Check permitted transition
    const allowedNext = PERMITTED_TRANSITIONS[previous_status] || [];
    if (!allowedNext.includes(new_status) && !user.roles.includes("admin")) {
      return sendError(
        res,
        `Cannot transition order from '${previous_status}' to '${new_status}'. Allowed transitions: ${allowedNext.join(", ") || "none"}.`,
        400,
        "INVALID_TRANSITION"
      );
    }

    // Role-based transition authorization
    const isBuyer = order.buyer_id === user.id;
    const isAdmin = user.roles.includes("admin");

    let isSupplier = false;
    if (!isBuyer && !isAdmin) {
      const { data: member } = await insforge.database
        .from("business_members")
        .select("id")
        .eq("business_id", order.supplier_business_id)
        .eq("user_id", user.id)
        .single();
      if (member) isSupplier = true;
    }

    if (!isBuyer && !isSupplier && !isAdmin) {
      return sendError(res, "Not authorized to update this order.", 403, "FORBIDDEN");
    }

    // Specific actor restrictions:
    if (new_status === "deposit_paid" && !isBuyer && !isAdmin) {
      return sendError(res, "Only the buyer or admin can mark deposit paid.", 403, "FORBIDDEN");
    }
    if (["in_production", "quality_check", "shipped"].includes(new_status) && !isSupplier && !isAdmin) {
      return sendError(res, "Only the supplier can update manufacturing/shipping status.", 403, "FORBIDDEN");
    }
    if (new_status === "completed" && !isBuyer && !isAdmin) {
      return sendError(res, "Only the buyer can confirm final order completion.", 403, "FORBIDDEN");
    }

    // 2. Prepare update payload
    const updatePayload: Record<string, any> = {
      status: new_status,
      updated_at: new Date().toISOString(),
    };

    if (tracking_number?.trim()) updatePayload.tracking_number = tracking_number.trim();
    if (carrier?.trim()) updatePayload.carrier = carrier.trim();
    if (new_status === "shipped") updatePayload.dispatch_date = new Date().toISOString().split("T")[0];
    if (new_status === "delivered" || new_status === "completed") {
      updatePayload.delivery_date = new Date().toISOString().split("T")[0];
    }

    const { data: updatedOrder, error: updateError } = await insforge.database
      .from("orders")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (updateError) return sendError(res, updateError.message, 500, "DATABASE_ERROR");

    // 3. Record status history
    await insforge.database.from("order_status_history").insert([
      {
        order_id: id,
        previous_status,
        new_status,
        changed_by: user.id,
        note: note?.trim() || null,
      },
    ]);

    // 4. Notify counterpart
    const notificationTarget = isBuyer
      ? null // If buyer changed status, notify supplier
      : order.buyer_id;

    if (notificationTarget) {
      await insforge.database.from("notifications").insert([
        {
          user_id: notificationTarget,
          title: `Order ${order.order_number} Update`,
          message: `Order status moved to ${new_status.replace("_", " ")}.`,
          link: `/buyer/orders/${id}`,
        },
      ]);
    }

    return sendSuccess(res, updatedOrder, `Order status updated to ${new_status}.`);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to update order status.", 500, "SERVER_ERROR");
  }
});

export default router;
