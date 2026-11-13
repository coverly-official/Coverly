import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";
import { authenticateUser } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = Router();

// Permitted status transitions for RFQs
const VALID_RFQ_STATUSES = [
  "draft",
  "submitted",
  "in_review",
  "matched",
  "quotes_received",
  "accepted",
  "closed",
  "cancelled",
];

// POST /api/rfqs (Create RFQ)
router.post("/rfqs", authenticateUser, async (req, res) => {
  const user = req.user!;
  const {
    business_id,
    title,
    category_id,
    delivery_city,
    delivery_pincode,
    target_delivery_date,
    dispatch_mode = "broadcast",
    notes,
    items,
    direct_supplier_ids,
  } = req.body;

  if (!title?.trim() || !category_id || !delivery_city?.trim() || !delivery_pincode?.trim()) {
    return sendError(
      res,
      "Title, category, delivery city, and delivery pincode are required.",
      400,
      "VALIDATION_FAILED"
    );
  }

  if (!Array.isArray(items) || items.length === 0) {
    return sendError(res, "At least one RFQ item is required.", 400, "VALIDATION_FAILED");
  }

  // Validate items
  for (const item of items) {
    if (!item.item_name?.trim() || !item.quantity || Number(item.quantity) <= 0) {
      return sendError(res, "Each item must have a valid item_name and positive quantity.", 400, "VALIDATION_FAILED");
    }
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");
  }

  try {
    const rfqNumber = `RFQ-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    // 1. Insert RFQ
    const { data: rfq, error: rfqError } = await insforge.database
      .from("rfqs")
      .insert([
        {
          rfq_number: rfqNumber,
          buyer_id: user.id,
          business_id: business_id || null,
          title: title.trim(),
          category_id,
          delivery_city: delivery_city.trim(),
          delivery_pincode: delivery_pincode.trim(),
          target_delivery_date: target_delivery_date || null,
          dispatch_mode: ["direct", "broadcast", "managed"].includes(dispatch_mode) ? dispatch_mode : "broadcast",
          status: "submitted",
          notes: notes?.trim() || null,
        },
      ])
      .select()
      .single();

    if (rfqError || !rfq) {
      return sendError(res, rfqError?.message || "Failed to create RFQ.", 500, "DATABASE_ERROR");
    }

    // 2. Insert RFQ Items
    const rfqItemsPayload = items.map((item: any) => ({
      rfq_id: rfq.id,
      item_name: item.item_name.trim(),
      quantity: Number.parseInt(item.quantity, 10),
      unit: item.unit?.trim() || "pc",
      target_unit_price: item.target_unit_price ? Number.parseFloat(item.target_unit_price) : null,
      specifications: item.specifications || {},
    }));

    const { data: insertedItems } = await insforge.database
      .from("rfq_items")
      .insert(rfqItemsPayload)
      .select();

    // 3. Supplier Matching & Distribution
    let recipientBusinessIds: string[] = [];

    if (dispatch_mode === "direct" && Array.isArray(direct_supplier_ids) && direct_supplier_ids.length > 0) {
      recipientBusinessIds = direct_supplier_ids;
    } else {
      // Find relevant active suppliers registered with products in this category
      const { data: matchedSuppliers } = await insforge.database
        .from("products")
        .select("business_id")
        .eq("category_id", category_id)
        .eq("is_active", true)
        .limit(30);

      recipientBusinessIds = Array.from(new Set(matchedSuppliers?.map((s: any) => s.business_id) || []));
    }

    if (recipientBusinessIds.length > 0) {
      const recipientsPayload = recipientBusinessIds.map((bizId) => ({
        rfq_id: rfq.id,
        supplier_business_id: bizId,
        status: "pending",
      }));
      await insforge.database.from("rfq_recipients").insert(recipientsPayload);
    }

    return sendSuccess(
      res,
      {
        ...rfq,
        items: insertedItems || [],
        dispatched_count: recipientBusinessIds.length,
      },
      "RFQ created and dispatched successfully.",
      201
    );
  } catch (err: any) {
    return sendError(res, err.message || "Failed to submit RFQ.", 500, "SERVER_ERROR");
  }
});

// GET /api/rfqs (Buyer's RFQs)
router.get("/rfqs", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { status, page = "1", limit = "20" } = req.query as Record<string, string | undefined>;

  const insforge = getInsForgeClient();
  if (!insforge) {
    return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");
  }

  try {
    const pageNum = Math.max(1, Number.parseInt(page || "1", 10));
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit || "20", 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = insforge.database
      .from("rfqs")
      .select(
        "id, rfq_number, title, category_id, delivery_city, delivery_pincode, target_delivery_date, dispatch_mode, status, created_at, quotations(count)",
        { count: "exact" }
      )
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false });

    if (status && VALID_RFQ_STATUSES.includes(status)) {
      query = query.eq("status", status);
    }

    const { data, count, error } = await query.range(offset, offset + limitNum - 1);

    if (error) {
      return sendError(res, error.message, 500, "DATABASE_ERROR");
    }

    return sendSuccess(res, {
      items: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch RFQs.", 500, "SERVER_ERROR");
  }
});

// GET /api/rfqs/:id (RFQ Details)
router.get("/rfqs/:id", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { id } = req.params;

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: rfq, error } = await insforge.database
      .from("rfqs")
      .select(
        "id, rfq_number, buyer_id, business_id, title, category_id, delivery_city, delivery_pincode, target_delivery_date, dispatch_mode, status, notes, created_at"
      )
      .eq("id", id)
      .single();

    if (error || !rfq) {
      return sendError(res, "RFQ not found.", 404, "NOT_FOUND");
    }

    // Verify user authorization: buyer, recipient supplier, or admin
    let isAuthorized = user.id === rfq.buyer_id || user.roles.includes("admin");

    if (!isAuthorized) {
      // Check if user is member of a supplier business that received this RFQ
      const { data: recipientCheck } = await insforge.database
        .from("rfq_recipients")
        .select("id, supplier_business_id, business_members!inner(user_id)")
        .eq("rfq_id", id)
        .eq("business_members.user_id", user.id)
        .limit(1);

      if (recipientCheck && recipientCheck.length > 0) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return sendError(res, "You are not authorized to view this RFQ.", 403, "FORBIDDEN");
    }

    // Fetch line items
    const { data: items } = await insforge.database
      .from("rfq_items")
      .select("id, item_name, quantity, unit, target_unit_price, specifications")
      .eq("rfq_id", id);

    // Fetch quotations (if buyer or admin)
    let quotations: any[] = [];
    if (user.id === rfq.buyer_id || user.roles.includes("admin")) {
      const { data: quotes } = await insforge.database
        .from("quotations")
        .select(
          "id, quotation_number, supplier_business_id, status, valid_until, lead_time_days, created_at, quotation_costs(*), businesses(name, city, verification_level)"
        )
        .eq("rfq_id", id);
      quotations = quotes || [];
    }

    return sendSuccess(res, {
      ...rfq,
      items: items || [],
      quotations,
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch RFQ details.", 500, "SERVER_ERROR");
  }
});

// PATCH /api/rfqs/:id/cancel (Cancel RFQ)
router.patch("/rfqs/:id/cancel", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { id } = req.params;
  const { reason } = req.body;

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: rfq } = await insforge.database
      .from("rfqs")
      .select("id, buyer_id, status")
      .eq("id", id)
      .single();

    if (!rfq) return sendError(res, "RFQ not found.", 404, "NOT_FOUND");

    if (rfq.buyer_id !== user.id && !user.roles.includes("admin")) {
      return sendError(res, "Not authorized to cancel this RFQ.", 403, "FORBIDDEN");
    }

    if (["accepted", "closed", "cancelled"].includes(rfq.status)) {
      return sendError(res, `Cannot cancel an RFQ that is already ${rfq.status}.`, 400, "INVALID_STATE");
    }

    const { data: updatedRfq, error } = await insforge.database
      .from("rfqs")
      .update({
        status: "cancelled",
        notes: reason ? `Cancelled: ${reason}` : "Cancelled by buyer.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, updatedRfq, "RFQ cancelled successfully.");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to cancel RFQ.", 500, "SERVER_ERROR");
  }
});

// GET /api/rfqs/supplier/incoming
router.get("/rfqs/supplier/incoming", authenticateUser, async (req, res) => {
  const { business_id } = req.query as { business_id?: string };

  if (!business_id) {
    return sendError(res, "Supplier business ID is required.", 400, "VALIDATION_FAILED");
  }

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data, error } = await insforge.database
      .from("rfq_recipients")
      .select(
        "id, status, created_at, rfqs(id, rfq_number, title, category_id, delivery_city, delivery_pincode, target_delivery_date, status, created_at, rfq_items(*))"
      )
      .eq("supplier_business_id", business_id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, data || []);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch incoming RFQs.", 500, "SERVER_ERROR");
  }
});

export default router;
