import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";

const router = Router();

// POST /api/rfqs
router.post("/rfqs", async (req, res) => {
  const {
    buyer_id,
    business_id,
    title,
    category_id,
    delivery_city,
    delivery_pincode,
    target_delivery_date,
    dispatch_mode = "broadcast",
    notes,
    items,
  } = req.body;

  if (!buyer_id || !title?.trim() || !category_id || !delivery_city?.trim() || !delivery_pincode?.trim()) {
    return res.status(400).json({
      success: false,
      error: "Buyer ID, title, category, delivery city, and delivery pincode are required.",
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: "At least one RFQ item is required.",
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
    const rfqNumber = `RFQ-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    // 1. Insert RFQ
    const { data: rfq, error: rfqError } = await insforge.database
      .from("rfqs")
      .insert([
        {
          rfq_number: rfqNumber,
          buyer_id,
          business_id: business_id || null,
          title: title.trim(),
          category_id,
          delivery_city: delivery_city.trim(),
          delivery_pincode: delivery_pincode.trim(),
          target_delivery_date: target_delivery_date || null,
          dispatch_mode,
          status: "submitted",
          notes: notes?.trim() || null,
        },
      ])
      .select()
      .single();

    if (rfqError || !rfq) {
      return res.status(500).json({ success: false, error: rfqError?.message || "Failed to create RFQ." });
    }

    // 2. Insert RFQ Items
    const rfqItemsPayload = items.map((item: any) => ({
      rfq_id: rfq.id,
      item_name: item.item_name || "Item",
      quantity: Number.parseInt(item.quantity, 10) || 1,
      unit: item.unit || "pc",
      target_unit_price: item.target_unit_price ? Number.parseFloat(item.target_unit_price) : null,
      specifications: item.specifications || {},
    }));

    await insforge.database.from("rfq_items").insert(rfqItemsPayload);

    // 3. Match and dispatch to suppliers if broadcast
    if (dispatch_mode === "broadcast") {
      const { data: matchedSuppliers } = await insforge.database
        .from("products")
        .select("business_id")
        .eq("category_id", category_id)
        .eq("is_active", true)
        .limit(20);

      const uniqueBusinessIds = Array.from(new Set(matchedSuppliers?.map((s: any) => s.business_id) || []));

      if (uniqueBusinessIds.length > 0) {
        const recipientsPayload = uniqueBusinessIds.map((bizId) => ({
          rfq_id: rfq.id,
          supplier_business_id: bizId,
          status: "pending",
        }));
        await insforge.database.from("rfq_recipients").insert(recipientsPayload);
      }
    }

    return res.status(201).json({
      success: true,
      message: "RFQ created and dispatched successfully.",
      data: rfq,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to submit RFQ.",
    });
  }
});

// GET /api/rfqs (Buyer's RFQs)
router.get("/rfqs", async (req, res) => {
  const { buyer_id, status } = req.query as { buyer_id?: string; status?: string };

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({
      success: false,
      error: "Database client unavailable.",
    });
  }

  try {
    let query = insforge.database
      .from("rfqs")
      .select("id, rfq_number, title, category_id, delivery_city, status, created_at, quotations(count)")
      .order("created_at", { ascending: false });

    if (buyer_id) {
      query = query.eq("buyer_id", buyer_id);
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
      error: err.message || "Failed to fetch RFQs.",
    });
  }
});

// GET /api/rfqs/:id
router.get("/rfqs/:id", async (req, res) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({
      success: false,
      error: "Database client unavailable.",
    });
  }

  try {
    const { data: rfq, error } = await insforge.database
      .from("rfqs")
      .select("id, rfq_number, buyer_id, title, category_id, delivery_city, delivery_pincode, target_delivery_date, dispatch_mode, status, notes, created_at")
      .eq("id", id)
      .single();

    if (error || !rfq) {
      return res.status(404).json({ success: false, error: "RFQ not found." });
    }

    const { data: items } = await insforge.database
      .from("rfq_items")
      .select("id, item_name, quantity, unit, target_unit_price, specifications")
      .eq("rfq_id", id);

    const { data: quotations } = await insforge.database
      .from("quotations")
      .select("id, quotation_number, supplier_business_id, status, valid_until, lead_time_days, created_at, quotation_costs(*), businesses(name, city, verification_level)")
      .eq("rfq_id", id);

    return res.json({
      success: true,
      data: {
        ...rfq,
        items: items || [],
        quotations: quotations || [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch RFQ details.",
    });
  }
});

// GET /api/rfqs/supplier/incoming
router.get("/rfqs/supplier/incoming", async (req, res) => {
  const { business_id } = req.query as { business_id?: string };

  if (!business_id) {
    return res.status(400).json({
      success: false,
      error: "Supplier business ID is required.",
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
    const { data, error } = await insforge.database
      .from("rfq_recipients")
      .select("id, status, created_at, rfqs(id, rfq_number, title, category_id, delivery_city, delivery_pincode, target_delivery_date, status, created_at, rfq_items(*))")
      .eq("supplier_business_id", business_id)
      .order("created_at", { ascending: false })
      .limit(50);

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
      error: err.message || "Failed to fetch incoming RFQs.",
    });
  }
});

export default router;
