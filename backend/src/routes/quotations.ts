import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";
import { authenticateUser } from "../middleware/auth.js";
import { calculateLandedCost, roundToTwoDecimals } from "../lib/landed-cost.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = Router();

// POST /api/landed-cost/calculate (Simulation Endpoint)
router.post("/landed-cost/calculate", (req, res) => {
  const {
    quantity = 1,
    unitPrice = 0,
    discount = 0,
    packaging = 0,
    freight = 0,
    insurance = 0,
    otherCharges = 0,
    gstRate = 0.18,
  } = req.body;

  const result = calculateLandedCost({
    quantity: Number(quantity),
    unitPrice: Number(unitPrice),
    discount: Number(discount),
    packaging: Number(packaging),
    freight: Number(freight),
    insurance: Number(insurance),
    otherCharges: Number(otherCharges),
    gstRate: Number(gstRate),
  });

  return sendSuccess(res, result, "Landed cost calculated successfully.");
});

// POST /api/quotations (Submit Quotation)
router.post("/quotations", authenticateUser, async (req, res) => {
  const user = req.user!;
  const {
    rfq_id,
    supplier_business_id,
    valid_until,
    lead_time_days = 7,
    terms_and_conditions,
    items,
    discount = 0,
    freight = 0,
    packaging = 0,
    insurance = 0,
    otherCharges = 0,
    gst_rate = 0.18,
  } = req.body;

  if (!rfq_id || !supplier_business_id || !valid_until) {
    return sendError(
      res,
      "RFQ ID, Supplier Business, and Valid Until Date are required.",
      400,
      "VALIDATION_FAILED"
    );
  }

  if (!Array.isArray(items) || items.length === 0) {
    return sendError(res, "Quotation must have at least one line item.", 400, "VALIDATION_FAILED");
  }

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    // 1. Check RFQ existence and status
    const { data: rfq, error: rfqErr } = await insforge.database
      .from("rfqs")
      .select("id, rfq_number, buyer_id, status")
      .eq("id", rfq_id)
      .single();

    if (rfqErr || !rfq) {
      return sendError(res, "RFQ not found.", 404, "NOT_FOUND");
    }

    if (["accepted", "closed", "cancelled"].includes(rfq.status)) {
      return sendError(res, `Cannot quote on an RFQ that is already ${rfq.status}.`, 400, "INVALID_STATE");
    }

    // 2. Validate supplier business membership
    if (!user.roles.includes("admin")) {
      const { data: member } = await insforge.database
        .from("business_members")
        .select("role_in_business")
        .eq("business_id", supplier_business_id)
        .eq("user_id", user.id)
        .single();

      if (!member) {
        return sendError(res, "You are not an authorized member of this supplier business.", 403, "FORBIDDEN");
      }
    }

    // 3. Compute item totals & landed cost breakdown
    let subtotal = 0;
    let totalQty = 0;
    for (const item of items) {
      const q = Math.max(1, Number.parseInt(item.quantity, 10) || 1);
      const p = Math.max(0, Number.parseFloat(item.unit_price) || 0);
      subtotal += q * p;
      totalQty += q;
    }

    const calcResult = calculateLandedCost({
      quantity: totalQty,
      unitPrice: totalQty > 0 ? subtotal / totalQty : subtotal,
      discount: Number(discount),
      packaging: Number(packaging),
      freight: Number(freight),
      insurance: Number(insurance),
      otherCharges: Number(otherCharges),
      gstRate: Number(gst_rate),
    });

    const quoteNumber = `QT-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    // 4. Insert Quotation
    const { data: quote, error: quoteError } = await insforge.database
      .from("quotations")
      .insert([
        {
          rfq_id,
          supplier_business_id,
          supplier_user_id: user.id,
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
      return sendError(res, quoteError?.message || "Failed to create quotation.", 500, "DATABASE_ERROR");
    }

    // 5. Insert Line Items
    const quoteItemsPayload = items.map((item: any) => {
      const q = Math.max(1, Number.parseInt(item.quantity, 10) || 1);
      const p = Math.max(0, Number.parseFloat(item.unit_price) || 0);
      return {
        quotation_id: quote.id,
        rfq_item_id: item.rfq_item_id || null,
        item_name: item.item_name || "Quoted Item",
        quantity: q,
        unit: item.unit || "pc",
        unit_price: p,
        total_price: roundToTwoDecimals(q * p),
      };
    });
    await insforge.database.from("quotation_items").insert(quoteItemsPayload);

    // 6. Insert Quotation Costs
    await insforge.database.from("quotation_costs").insert([
      {
        quotation_id: quote.id,
        subtotal: calcResult.baseAmount,
        freight: calcResult.freight,
        packaging: calcResult.packaging,
        insurance: calcResult.insurance,
        gst_rate: calcResult.gstRate,
        gst_amount: calcResult.gstAmount,
        total_landed_cost: calcResult.totalLandedCost,
        effective_landed_unit_cost: calcResult.effectiveLandedUnitCost,
      },
    ]);

    // 7. Update RFQ status to quotes_received
    await insforge.database
      .from("rfqs")
      .update({ status: "quotes_received", updated_at: new Date().toISOString() })
      .eq("id", rfq_id);

    // 8. Update supplier recipient status
    await insforge.database
      .from("rfq_recipients")
      .update({ status: "quoted" })
      .eq("rfq_id", rfq_id)
      .eq("supplier_business_id", supplier_business_id);

    // 9. Send notification to buyer
    await insforge.database.from("notifications").insert([
      {
        user_id: rfq.buyer_id,
        title: "New Quotation Received",
        message: `A supplier submitted quotation ${quoteNumber} for RFQ ${rfq.rfq_number}.`,
        link: `/buyer/rfqs/${rfq_id}/compare`,
      },
    ]);

    return sendSuccess(res, quote, "Quotation submitted successfully.", 201);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to submit quotation.", 500, "SERVER_ERROR");
  }
});

// GET /api/quotations/compare/:rfqId
router.get("/quotations/compare/:rfqId", authenticateUser, async (req, res) => {
  const { rfqId } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: quotations, error } = await insforge.database
      .from("quotations")
      .select(
        "id, quotation_number, status, valid_until, lead_time_days, terms_and_conditions, created_at, quotation_costs(*), quotation_items(*), businesses!supplier_business_id(id, name, city, verification_level, phone, email)"
      )
      .eq("rfq_id", rfqId);

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    // Sort by lowest landed unit cost
    const sortedQuotes = (quotations || []).sort((a: any, b: any) => {
      const aCost = a.quotation_costs?.effective_landed_unit_cost || 0;
      const bCost = b.quotation_costs?.effective_landed_unit_cost || 0;
      return aCost - bCost;
    });

    return sendSuccess(res, {
      quotations: sortedQuotes,
      lowestLandedQuoteId: sortedQuotes[0]?.id || null,
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to compare quotations.", 500, "SERVER_ERROR");
  }
});

// POST /api/quotations/:id/accept (Accept Quotation -> Creates Order)
router.post("/quotations/:id/accept", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { id } = req.params;
  const { buyer_business_id } = req.body;

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    // 1. Fetch quotation with items and RFQ
    const { data: quote, error: quoteError } = await insforge.database
      .from("quotations")
      .select(
        "id, quotation_number, rfq_id, supplier_business_id, supplier_user_id, status, valid_until, quotation_costs(*), quotation_items(*), rfqs(id, buyer_id, rfq_number, status)"
      )
      .eq("id", id)
      .single();

    if (quoteError || !quote) {
      return sendError(res, "Quotation not found.", 404, "NOT_FOUND");
    }

    const parentRfq = (quote as any).rfqs;

    // Security Check: Buyer ownership
    if (parentRfq.buyer_id !== user.id && !user.roles.includes("admin")) {
      return sendError(res, "You are not authorized to accept this quotation.", 403, "FORBIDDEN");
    }

    // Expiry Check
    const today = new Date().toISOString().split("T")[0];
    if (quote.valid_until && quote.valid_until < today) {
      return sendError(res, "This quotation has expired and can no longer be accepted.", 400, "QUOTE_EXPIRED");
    }

    // Duplicate Check
    if (quote.status === "accepted") {
      return sendError(res, "This quotation has already been accepted.", 400, "ALREADY_ACCEPTED");
    }

    if (quote.status === "rejected") {
      return sendError(res, "Cannot accept a rejected quotation.", 400, "ALREADY_REJECTED");
    }

    // Check if RFQ already has an accepted quote / order
    const { data: existingOrder } = await insforge.database
      .from("orders")
      .select("id, order_number")
      .eq("quotation_id", id)
      .single();

    if (existingOrder) {
      return sendError(res, `An order (${existingOrder.order_number}) already exists for this quotation.`, 409, "ORDER_EXISTS");
    }

    // 2. Mark this quote accepted
    await insforge.database
      .from("quotations")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", id);

    // 3. Mark competing quotes for this RFQ as rejected
    await insforge.database
      .from("quotations")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("rfq_id", quote.rfq_id)
      .neq("id", id);

    // 4. Update RFQ status to accepted
    await insforge.database
      .from("rfqs")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", quote.rfq_id);

    // 5. Create Order
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const costRecord = quote.quotation_costs as any;
    const totalAmount = costRecord?.total_landed_cost || 0;

    const { data: order, error: orderError } = await insforge.database
      .from("orders")
      .insert([
        {
          order_number: orderNumber,
          quotation_id: id,
          buyer_id: user.id,
          buyer_business_id: buyer_business_id || null,
          supplier_business_id: quote.supplier_business_id,
          status: "pending_deposit",
          total_amount: totalAmount,
        },
      ])
      .select()
      .single();

    if (orderError || !order) {
      return sendError(res, orderError?.message || "Failed to create order.", 500, "DATABASE_ERROR");
    }

    // 6. Insert Order Items
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

    // 7. Record Status History
    await insforge.database.from("order_status_history").insert([
      {
        order_id: order.id,
        new_status: "pending_deposit",
        changed_by: user.id,
        note: `Order generated upon accepting quotation ${quote.quotation_number}.`,
      },
    ]);

    // 8. Notify Supplier
    if (quote.supplier_user_id) {
      await insforge.database.from("notifications").insert([
        {
          user_id: quote.supplier_user_id,
          title: "Quotation Accepted!",
          message: `Buyer accepted your quote ${quote.quotation_number}. Purchase Order ${orderNumber} generated.`,
          link: `/supplier/orders`,
        },
      ]);
    }

    return sendSuccess(res, order, "Quotation accepted and order created successfully.", 201);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to accept quotation.", 500, "SERVER_ERROR");
  }
});

// POST /api/quotations/:id/reject
router.post("/quotations/:id/reject", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { id } = req.params;

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: quote } = await insforge.database
      .from("quotations")
      .select("id, rfq_id, rfqs(buyer_id)")
      .eq("id", id)
      .single();

    if (!quote) return sendError(res, "Quotation not found.", 404, "NOT_FOUND");

    if ((quote as any).rfqs?.buyer_id !== user.id && !user.roles.includes("admin")) {
      return sendError(res, "Not authorized to reject this quotation.", 403, "FORBIDDEN");
    }

    await insforge.database
      .from("quotations")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", id);

    return sendSuccess(res, null, "Quotation rejected.");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to reject quotation.", 500, "SERVER_ERROR");
  }
});

export default router;
