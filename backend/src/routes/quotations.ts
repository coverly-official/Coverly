import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";
import { calculateLandedCost } from "../lib/landed-cost.js";

const router = Router();

// POST /api/quotations
router.post("/quotations", async (req, res) => {
  const {
    rfq_id,
    supplier_business_id,
    supplier_user_id,
    valid_until,
    lead_time_days = 7,
    terms_and_conditions,
    items,
    freight = 0,
    packaging = 0,
    insurance = 0,
    gst_rate = 0.18,
  } = req.body;

  if (!rfq_id || !supplier_business_id || !supplier_user_id || !valid_until) {
    return res.status(400).json({
      success: false,
      error: "RFQ ID, Supplier Business, Supplier User, and Validity Date are required.",
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: "Quotation must have at least one line item.",
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
    const quoteNumber = `QT-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    // 1. Calculate Landed Cost
    let subtotal = 0;
    let totalQty = 0;
    for (const item of items) {
      const q = Number.parseInt(item.quantity, 10) || 1;
      const p = Number.parseFloat(item.unit_price) || 0;
      subtotal += q * p;
      totalQty += q;
    }

    const calcResult = calculateLandedCost({
      unitPrice: totalQty > 0 ? subtotal / totalQty : subtotal,
      quantity: totalQty,
      freight: Number.parseFloat(freight) || 0,
      gstRate: Number.parseFloat(gst_rate) || 0.18,
    });

    const parsedPackaging = Number.parseFloat(packaging) || 0;
    const parsedInsurance = Number.parseFloat(insurance) || 0;
    const finalTotalLandedCost = calcResult.totalCost + parsedPackaging + parsedInsurance;
    const effectiveLandedUnitCost = totalQty > 0 ? Math.round((finalTotalLandedCost / totalQty) * 100) / 100 : finalTotalLandedCost;

    // 2. Insert Quotation
    const { data: quote, error: quoteError } = await insforge.database
      .from("quotations")
      .insert([
        {
          rfq_id,
          supplier_business_id,
          supplier_user_id,
          quotation_number: quoteNumber,
          valid_until,
          lead_time_days: Number.parseInt(lead_time_days, 10) || 7,
          terms_and_conditions: terms_and_conditions?.trim() || null,
          status: "submitted",
        },
      ])
      .select()
      .single();

    if (quoteError || !quote) {
      return res.status(500).json({ success: false, error: quoteError?.message || "Failed to create quotation." });
    }

    // 3. Insert Quotation Items
    const quoteItemsPayload = items.map((item: any) => {
      const q = Number.parseInt(item.quantity, 10) || 1;
      const p = Number.parseFloat(item.unit_price) || 0;
      return {
        quotation_id: quote.id,
        rfq_item_id: item.rfq_item_id || null,
        item_name: item.item_name || "Quoted Item",
        quantity: q,
        unit: item.unit || "pc",
        unit_price: p,
        total_price: q * p,
      };
    });
    await insforge.database.from("quotation_items").insert(quoteItemsPayload);

    // 4. Insert Quotation Costs
    await insforge.database.from("quotation_costs").insert([
      {
        quotation_id: quote.id,
        subtotal,
        freight: Number.parseFloat(freight) || 0,
        packaging: parsedPackaging,
        insurance: parsedInsurance,
        gst_rate: Number.parseFloat(gst_rate) || 0.18,
        gst_amount: calcResult.gstAmount,
        total_landed_cost: finalTotalLandedCost,
        effective_landed_unit_cost: effectiveLandedUnitCost,
      },
    ]);

    // 5. Update RFQ Status to quotes_received
    await insforge.database
      .from("rfqs")
      .update({ status: "quotes_received" })
      .eq("id", rfq_id);

    return res.status(201).json({
      success: true,
      message: "Quotation submitted successfully.",
      data: quote,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to submit quotation.",
    });
  }
});

// GET /api/quotations/compare/:rfqId
router.get("/quotations/compare/:rfqId", async (req, res) => {
  const { rfqId } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({
      success: false,
      error: "Database client unavailable.",
    });
  }

  try {
    const { data: quotations, error } = await insforge.database
      .from("quotations")
      .select("id, quotation_number, status, valid_until, lead_time_days, created_at, quotation_costs(*), quotation_items(*), businesses(id, name, city, verification_level)")
      .eq("rfq_id", rfqId);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    // Sort by lowest landed unit cost
    const sortedQuotes = (quotations || []).sort((a: any, b: any) => {
      const aCost = (a.quotation_costs && (a.quotation_costs as any).effective_landed_unit_cost) || 0;
      const bCost = (b.quotation_costs && (b.quotation_costs as any).effective_landed_unit_cost) || 0;
      return aCost - bCost;
    });

    return res.json({
      success: true,
      data: sortedQuotes,
      bestQuoteId: sortedQuotes[0]?.id || null,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to compare quotations.",
    });
  }
});

// POST /api/quotations/:id/accept
router.post("/quotations/:id/accept", async (req, res) => {
  const { id } = req.params;
  const { buyer_id, buyer_business_id } = req.body;

  if (!buyer_id) {
    return res.status(400).json({
      success: false,
      error: "Buyer ID is required.",
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
    // 1. Fetch quotation
    const { data: quote, error: quoteError } = await insforge.database
      .from("quotations")
      .select("id, rfq_id, supplier_business_id, quotation_costs(*), quotation_items(*)")
      .eq("id", id)
      .single();

    if (quoteError || !quote) {
      return res.status(404).json({ success: false, error: "Quotation not found." });
    }

    // 2. Mark quote accepted
    await insforge.database
      .from("quotations")
      .update({ status: "accepted" })
      .eq("id", id);

    // 3. Mark RFQ accepted
    await insforge.database
      .from("rfqs")
      .update({ status: "accepted" })
      .eq("id", quote.rfq_id);

    // 4. Generate Order
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const costRecord = quote.quotation_costs as any;
    const totalAmount = costRecord?.total_landed_cost || 0;

    const { data: order, error: orderError } = await insforge.database
      .from("orders")
      .insert([
        {
          order_number: orderNumber,
          quotation_id: id,
          buyer_id,
          buyer_business_id: buyer_business_id || null,
          supplier_business_id: quote.supplier_business_id,
          status: "pending_deposit",
          total_amount: totalAmount,
        },
      ])
      .select()
      .single();

    if (orderError || !order) {
      return res.status(500).json({ success: false, error: orderError?.message || "Failed to create order." });
    }

    // 5. Insert Order Items
    if (Array.isArray(quote.quotation_items)) {
      const orderItems = quote.quotation_items.map((item: any) => ({
        order_id: order.id,
        item_name: item.item_name,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));
      await insforge.database.from("order_items").insert(orderItems);
    }

    // 6. Record Status History
    await insforge.database.from("order_status_history").insert([
      {
        order_id: order.id,
        new_status: "pending_deposit",
        changed_by: buyer_id,
        note: "Order created upon quotation acceptance.",
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Quotation accepted and order created.",
      data: order,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to accept quotation.",
    });
  }
});

export default router;
