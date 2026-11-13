import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";

const router = Router();

// GET /api/orders
router.get("/orders", async (req, res) => {
  const { buyer_id, supplier_business_id, status } = req.query as {
    buyer_id?: string;
    supplier_business_id?: string;
    status?: string;
  };

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({
      success: false,
      error: "Database client unavailable.",
    });
  }

  try {
    let query = insforge.database
      .from("orders")
      .select("id, order_number, quotation_id, buyer_id, supplier_business_id, status, total_amount, tracking_number, carrier, dispatch_date, created_at, businesses!supplier_business_id(name, city)")
      .order("created_at", { ascending: false });

    if (buyer_id) {
      query = query.eq("buyer_id", buyer_id);
    }

    if (supplier_business_id) {
      query = query.eq("supplier_business_id", supplier_business_id);
    }

    if (status) {
      query = query.eq("status", status);
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
      error: err.message || "Failed to fetch orders.",
    });
  }
});

// GET /api/orders/:id
router.get("/orders/:id", async (req, res) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({
      success: false,
      error: "Database client unavailable.",
    });
  }

  try {
    const { data: order, error } = await insforge.database
      .from("orders")
      .select("id, order_number, quotation_id, buyer_id, buyer_business_id, supplier_business_id, status, total_amount, tracking_number, carrier, dispatch_date, delivery_date, created_at, businesses!supplier_business_id(name, city, phone, email)")
      .eq("id", id)
      .single();

    if (error || !order) {
      return res.status(404).json({ success: false, error: "Order not found." });
    }

    const { data: items } = await insforge.database
      .from("order_items")
      .select("id, item_name, quantity, unit, unit_price, total_price")
      .eq("order_id", id);

    const { data: history } = await insforge.database
      .from("order_status_history")
      .select("id, previous_status, new_status, note, created_at")
      .eq("order_id", id)
      .order("created_at", { ascending: true });

    return res.json({
      success: true,
      data: {
        ...order,
        items: items || [],
        history: history || [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch order details.",
    });
  }
});

// PATCH /api/orders/:id/status
router.patch("/orders/:id/status", async (req, res) => {
  const { id } = req.params;
  const { new_status, changed_by, note, tracking_number, carrier } = req.body;

  const validStatuses = [
    "pending_deposit", "deposit_paid", "in_production",
    "quality_check", "shipped", "delivered", "completed",
    "disputed", "cancelled"
  ];

  if (!new_status || !validStatuses.includes(new_status) || !changed_by) {
    return res.status(400).json({
      success: false,
      error: "Valid new_status and changed_by are required.",
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
    // 1. Get current status
    const { data: order } = await insforge.database
      .from("orders")
      .select("status")
      .eq("id", id)
      .single();

    const previous_status = order?.status || null;

    // 2. Update order
    const updatePayload: Record<string, any> = {
      status: new_status,
      updated_at: new Date().toISOString(),
    };

    if (tracking_number) updatePayload.tracking_number = tracking_number.trim();
    if (carrier) updatePayload.carrier = carrier.trim();
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

    if (updateError) {
      return res.status(500).json({ success: false, error: updateError.message });
    }

    // 3. Insert audit history
    await insforge.database.from("order_status_history").insert([
      {
        order_id: id,
        previous_status,
        new_status,
        changed_by,
        note: note?.trim() || null,
      },
    ]);

    return res.json({
      success: true,
      message: `Order status updated to ${new_status}.`,
      data: updatedOrder,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to update order status.",
    });
  }
});

export default router;
