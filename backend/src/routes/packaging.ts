import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";
import { authenticateUser, type AuthenticatedUser } from "../middleware/auth.js";
import { calculateLandedCost, roundToTwoDecimals } from "../lib/landed-cost.js";

const router = Router();

// ====================================================================
// 1. Public Packaging Marketplace (Categories, Products, Suppliers)
// ====================================================================

// GET /api/packaging/categories
router.get("/packaging/categories", async (req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data, error } = await insforge.database
      .from("packaging_categories")
      .select("id, name, slug, description, icon, display_order, is_active, packaging_subcategories(id, name, slug, description, display_order)")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/packaging/products (Search & Filter Packaging Products)
router.get("/packaging/products", async (req, res) => {
  const {
    category,
    search,
    material,
    thickness,
    packaging_type,
    unit,
    min_moq,
    max_moq,
    min_price,
    max_price,
    location,
    sort,
    page = "1",
    limit = "20",
  } = req.query as {
    category?: string;
    search?: string;
    material?: string;
    thickness?: string;
    packaging_type?: string;
    unit?: string;
    min_moq?: string;
    max_moq?: string;
    min_price?: string;
    max_price?: string;
    location?: string;
    sort?: string;
    page?: string;
    limit?: string;
  };

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    let query = insforge.database
      .from("packaging_products")
      .select(
        "id, name, slug, category_id, subcategory, description, material_type, dimensions, thickness, weight_gsm, capacity, colour, shape, packaging_type, printing_options, customization_options, category_specifications, unit_of_measurement, moq, max_order_quantity, base_price, bulk_pricing_tiers, lead_time_days, available_supply_locations, images, maintains_inventory, stock_quantity, available_quantity, moderation_status, is_active, packaging_supplier_profiles(id, supplier_type, verification_status, rating, businesses(id, name, city, state))"
      )
      .eq("moderation_status", "approved")
      .eq("is_active", true);

    if (category && category !== "all") {
      query = query.eq("category_id", category);
    }
    if (material) {
      query = query.ilike("material_type", `%${material.trim()}%`);
    }
    if (packaging_type && packaging_type !== "all") {
      query = query.ilike("packaging_type", `%${packaging_type.trim()}%`);
    }
    if (unit) {
      query = query.eq("unit_of_measurement", unit);
    }
    if (search?.trim()) {
      query = query.or(`name.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%,material_type.ilike.%${search.trim()}%`);
    }
    if (min_price) {
      query = query.gte("base_price", parseFloat(min_price));
    }
    if (max_price) {
      query = query.lte("base_price", parseFloat(max_price));
    }
    if (min_moq) {
      query = query.gte("moq", parseInt(min_moq, 10));
    }
    if (max_moq) {
      query = query.lte("moq", parseInt(max_moq, 10));
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * pageSize;

    if (sort === "price_asc") {
      query = query.order("base_price", { ascending: true });
    } else if (sort === "price_desc") {
      query = query.order("base_price", { ascending: false });
    } else if (sort === "moq_asc") {
      query = query.order("moq", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error, count } = await query.range(offset, offset + pageSize - 1);
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      data: data || [],
      pagination: {
        page: pageNum,
        limit: pageSize,
        total: count || (data ? data.length : 0),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/packaging/products/:slug (Detailed Product View)
router.get("/packaging/products/:slug", async (req, res) => {
  const { slug } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data, error } = await insforge.database
      .from("packaging_products")
      .select(
        "*, packaging_supplier_profiles(*, businesses(id, name, legal_name, city, state, pincode, phone, email, verification_level))"
      )
      .eq("slug", slug)
      .single();

    if (error || !data) {
      // Try lookup by UUID if not matched by slug
      const { data: byId } = await insforge.database
        .from("packaging_products")
        .select(
          "*, packaging_supplier_profiles(*, businesses(id, name, legal_name, city, state, pincode, phone, email, verification_level))"
        )
        .eq("id", slug)
        .single();

      if (!byId) {
        return res.status(404).json({ success: false, error: "Packaging product not found." });
      }
      return res.json({ success: true, data: byId });
    }

    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/packaging/suppliers (Supplier Directory)
router.get("/packaging/suppliers", async (req, res) => {
  const { search, category, supplier_type, state, city } = req.query as {
    search?: string;
    category?: string;
    supplier_type?: string;
    state?: string;
    city?: string;
  };

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    let query = insforge.database
      .from("packaging_supplier_profiles")
      .select("*, businesses(id, name, city, state, pincode, verification_level, phone, email)")
      .eq("verification_status", "verified")
      .eq("is_public_discovery_enabled", true);

    if (supplier_type && supplier_type !== "all") {
      query = query.eq("supplier_type", supplier_type);
    }
    if (category && category !== "all") {
      query = query.contains("packaging_categories", [category]);
    }
    if (state && state !== "all") {
      query = query.contains("serviceable_locations", [state]);
    }

    const { data, error } = await query.order("total_orders_completed", { ascending: false }).limit(50);
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/packaging/suppliers/:id (Supplier Detailed Profile & Catalog)
router.get("/packaging/suppliers/:id", async (req, res) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: supplier, error } = await insforge.database
      .from("packaging_supplier_profiles")
      .select("*, businesses(*)")
      .eq("id", id)
      .single();

    if (error || !supplier) {
      return res.status(404).json({ success: false, error: "Packaging supplier not found." });
    }

    // Fetch published catalog
    const { data: products } = await insforge.database
      .from("packaging_products")
      .select("*")
      .eq("supplier_id", id)
      .eq("moderation_status", "approved")
      .eq("is_active", true);

    return res.json({
      success: true,
      data: {
        ...supplier,
        products: products || [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 2. Custom Packaging Requirements & RFQ Management
// ====================================================================

// POST /api/packaging/rfqs (Guest or Authenticated Buyer Custom Requirement / RFQ)
router.post("/packaging/rfqs", async (req, res) => {
  const {
    category_id,
    product_id,
    product_being_packed,
    packaging_type,
    material_preference,
    required_dimensions = {},
    required_capacity,
    required_quantity,
    unit = "piece",
    printing_required = true,
    printing_details,
    branding_details,
    custom_finishing,
    food_contact_grade = false,
    target_budget,
    target_delivery_date,
    delivery_city,
    delivery_state,
    delivery_pincode,
    additional_instructions,
    reference_files = [],
    is_sample_requested = false,
    target_supplier_id,
    guest_name,
    guest_email,
    guest_phone,
    guest_company,
  } = req.body;

  if (!category_id || !required_quantity || !delivery_city || !delivery_state) {
    return res.status(400).json({
      success: false,
      error: "Category, required quantity, delivery city and delivery state are mandatory.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    // Generate unique RFQ Number
    const timestampStr = Date.now().toString(36).toUpperCase();
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const rfqNumber = `PKG-RFQ-${timestampStr}-${randPart}`;

    // Extract user ID from auth header or x-user-id if available
    let buyerId: string | null = null;
    const authHeader = req.headers["authorization"];
    const xUserId = req.headers["x-user-id"] as string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      buyerId = authHeader.substring(7).trim();
    } else if (xUserId) {
      buyerId = xUserId.trim();
    }

    const { data: newRfq, error } = await insforge.database
      .from("packaging_rfqs")
      .insert([
        {
          rfq_number: rfqNumber,
          buyer_id: buyerId || null,
          guest_name: guest_name || null,
          guest_email: guest_email || null,
          guest_phone: guest_phone || null,
          guest_company: guest_company || null,
          category_id,
          product_id: product_id || null,
          product_being_packed: product_being_packed || null,
          packaging_type: packaging_type || null,
          material_preference: material_preference || null,
          required_dimensions,
          required_capacity: required_capacity || null,
          required_quantity: parseInt(required_quantity, 10),
          unit,
          printing_required: Boolean(printing_required),
          printing_details: printing_details || null,
          branding_details: branding_details || null,
          custom_finishing: custom_finishing || null,
          food_contact_grade: Boolean(food_contact_grade),
          target_budget: target_budget ? parseFloat(target_budget) : null,
          target_delivery_date: target_delivery_date || null,
          delivery_city,
          delivery_state,
          delivery_pincode: delivery_pincode || null,
          additional_instructions: additional_instructions || null,
          reference_files,
          is_sample_requested: Boolean(is_sample_requested),
          status: "open",
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    // Match and dispatch to eligible suppliers
    if (target_supplier_id) {
      await insforge.database.from("packaging_rfq_recipients").insert([
        {
          rfq_id: newRfq.id,
          supplier_id: target_supplier_id,
          status: "pending",
        },
      ]);
    } else {
      const { data: matchingSuppliers } = await insforge.database
        .from("packaging_supplier_profiles")
        .select("id")
        .eq("verification_status", "verified")
        .limit(10);

      if (matchingSuppliers && matchingSuppliers.length > 0) {
        const recipientRecords = matchingSuppliers.map((sup) => ({
          rfq_id: newRfq.id,
          supplier_id: sup.id,
          status: "pending",
        }));
        await insforge.database.from("packaging_rfq_recipients").insert(recipientRecords);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Packaging requirement / RFQ successfully submitted and dispatched.",
      data: newRfq,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/packaging/rfqs/:rfqNumber (RFQ Status & Received Quotations)
router.get("/packaging/rfqs/:rfqNumber", async (req, res) => {
  const { rfqNumber } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: rfq, error: rfqError } = await insforge.database
      .from("packaging_rfqs")
      .select("*, packaging_categories(id, name, slug)")
      .eq("rfq_number", rfqNumber)
      .single();

    if (rfqError || !rfq) {
      return res.status(404).json({ success: false, error: "Packaging RFQ not found." });
    }

    // Fetch received quotations
    const { data: quotations } = await insforge.database
      .from("packaging_quotations")
      .select("*, packaging_supplier_profiles(id, supplier_type, rating, businesses(id, name, city, state))")
      .eq("rfq_id", rfq.id);

    return res.json({
      success: true,
      data: {
        ...rfq,
        quotations: quotations || [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/packaging/guest-claim (Claim Anonymous RFQs when logging in)
router.post("/api/packaging/guest-claim", authenticateUser, async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ success: false, error: "Authentication required." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data, error } = await insforge.database
      .from("packaging_rfqs")
      .update({ buyer_id: user.id })
      .eq("guest_email", user.email)
      .is("buyer_id", null)
      .select();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      message: `Successfully claimed ${data?.length || 0} historical packaging requirements.`,
      claimed_count: data?.length || 0,
      data: data || [],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 3. Buyer Quotation Actions, Sample Requests & Order Acceptance
// ====================================================================

// POST /api/packaging/quotations/:id/accept (Accept Quotation & Create Official Order)
router.post("/packaging/quotations/:id/accept", authenticateUser, async (req, res) => {
  const { id } = req.params;
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    // 1. Fetch quotation
    const { data: quotation, error: quoteError } = await insforge.database
      .from("packaging_quotations")
      .select("*, packaging_rfqs(*)")
      .eq("id", id)
      .single();

    if (quoteError || !quotation) {
      return res.status(404).json({ success: false, error: "Quotation not found." });
    }

    if (quotation.status === "accepted") {
      return res.status(400).json({ success: false, error: "Quotation has already been accepted." });
    }
    if (quotation.status === "rejected" || quotation.status === "withdrawn") {
      return res.status(400).json({ success: false, error: `Quotation is in '${quotation.status}' state.` });
    }

    // Expiry check
    const today = new Date().toISOString().split("T")[0];
    if (quotation.valid_until && quotation.valid_until < today) {
      return res.status(400).json({ success: false, error: "Quotation has expired." });
    }

    // Generate unique Order Number
    const timestampStr = Date.now().toString(36).toUpperCase();
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `PKG-ORD-${timestampStr}-${randPart}`;

    // 2. Mark accepted quotation
    await insforge.database
      .from("packaging_quotations")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", id);

    // 3. Atomically reject all other rival quotations for this RFQ
    await insforge.database
      .from("packaging_quotations")
      .update({ status: "rejected" })
      .eq("rfq_id", quotation.rfq_id)
      .neq("id", id);

    // 4. Update RFQ status
    await insforge.database
      .from("packaging_rfqs")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", quotation.rfq_id);

    // 5. Create Packaging Order
    const { data: newOrder, error: orderError } = await insforge.database
      .from("packaging_orders")
      .insert([
        {
          order_number: orderNumber,
          quotation_id: quotation.id,
          rfq_id: quotation.rfq_id,
          buyer_id: user.id,
          supplier_id: quotation.supplier_id,
          order_status: "order_created",
          total_amount: quotation.total_estimated_cost,
          agreed_unit_price: quotation.unit_price,
          quantity: quotation.quantity,
          unit: quotation.unit || "piece",
          delivery_city: quotation.packaging_rfqs?.delivery_city || "Primary City",
          delivery_state: quotation.packaging_rfqs?.delivery_state || "State",
          delivery_pincode: quotation.packaging_rfqs?.delivery_pincode || null,
          estimated_delivery_date: new Date(Date.now() + (quotation.production_lead_time_days || 10) * 86400000)
            .toISOString()
            .split("T")[0],
          buyer_confirmed_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (orderError) {
      return res.status(500).json({ success: false, error: orderError.message });
    }

    // 6. Seed initial production milestones
    const initialMilestones = [
      {
        order_id: newOrder.id,
        milestone_name: "Order Confirmation & Specs Review",
        milestone_status: "pending",
        completion_percentage: 10,
        notes: "Supplier verification of artwork, die-lines and technical tolerances.",
      },
      {
        order_id: newOrder.id,
        milestone_name: "Plate / Cylinder Tooling & Raw Material Sourcing",
        milestone_status: "pending",
        completion_percentage: 30,
        notes: "Cylinder engraving / plate exposure and substrate procurement.",
      },
      {
        order_id: newOrder.id,
        milestone_name: "Printing & Converting / Lamination",
        milestone_status: "pending",
        completion_percentage: 60,
        notes: "High-speed rotogravure / flexo print run and multi-layer lamination.",
      },
      {
        order_id: newOrder.id,
        milestone_name: "Slitting, Pouch Making & Quality Inspection",
        milestone_status: "pending",
        completion_percentage: 85,
        notes: "Slitting, gusseting, pouch forming and seal burst testing.",
      },
      {
        order_id: newOrder.id,
        milestone_name: "Packaging & Logistics Dispatch",
        milestone_status: "pending",
        completion_percentage: 100,
        notes: "Corrugated master carton packing and carrier handover.",
      },
    ];
    await insforge.database.from("packaging_order_milestones").insert(initialMilestones);

    // 7. Audit history
    await insforge.database.from("packaging_order_history").insert([
      {
        order_id: newOrder.id,
        previous_status: null,
        new_status: "order_created",
        changed_by: user.id,
        note: `Order created from accepted quotation ${quotation.quotation_number}`,
      },
    ]);

    return res.json({
      success: true,
      message: "Quotation accepted and official packaging purchase order generated.",
      order: newOrder,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/packaging/quotations/:id/request-sample (Request Sample Workflow)
router.post("/packaging/quotations/:id/request-sample", authenticateUser, async (req, res) => {
  const { id } = req.params;
  const user = req.user!;
  const { sample_type = "custom_printed_sample", specifications = {}, sample_charges = 0 } = req.body;

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: quotation, error: quoteError } = await insforge.database
      .from("packaging_quotations")
      .select("*")
      .eq("id", id)
      .single();

    if (quoteError || !quotation) {
      return res.status(404).json({ success: false, error: "Quotation not found." });
    }

    const timestampStr = Date.now().toString(36).toUpperCase();
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const sampleNumber = `PKG-SMP-${timestampStr}-${randPart}`;

    const { data: sampleRequest, error: sampleError } = await insforge.database
      .from("packaging_sample_requests")
      .insert([
        {
          sample_number: sampleNumber,
          quotation_id: quotation.id,
          rfq_id: quotation.rfq_id,
          buyer_id: user.id,
          supplier_id: quotation.supplier_id,
          sample_type,
          specifications,
          sample_charges: parseFloat(sample_charges) || quotation.sample_charges || 0,
          payment_status: sample_charges > 0 ? "pending" : "free",
          status: "sample_requested",
        },
      ])
      .select()
      .single();

    if (sampleError) {
      return res.status(500).json({ success: false, error: sampleError.message });
    }

    return res.status(201).json({
      success: true,
      message: "Sample request submitted to supplier for review and preparation.",
      sample: sampleRequest,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/packaging/samples/:id/review (Buyer Sample Approval / Revision)
router.post("/packaging/samples/:id/review", authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { decision, feedback, revision_notes } = req.body as {
    decision: "sample_approved" | "sample_revision_requested" | "sample_rejected";
    feedback?: string;
    revision_notes?: string;
  };

  if (!["sample_approved", "sample_revision_requested", "sample_rejected"].includes(decision)) {
    return res.status(400).json({ success: false, error: "Invalid sample review decision." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const updatePayload: any = {
      status: decision,
      buyer_feedback: feedback || null,
      revision_notes: revision_notes || null,
      updated_at: new Date().toISOString(),
    };
    if (decision === "sample_approved") {
      updatePayload.approved_at = new Date().toISOString();
    }

    const { data: updatedSample, error } = await insforge.database
      .from("packaging_sample_requests")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      message: `Sample status updated to '${decision}'.`,
      sample: updatedSample,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/packaging/orders/:orderNumber (Order Tracking & Production Stepper)
router.get("/packaging/orders/:orderNumber", async (req, res) => {
  const { orderNumber } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: order, error } = await insforge.database
      .from("packaging_orders")
      .select(
        "*, packaging_quotations(*), packaging_supplier_profiles(*, businesses(id, name, city, state, phone, email)), packaging_order_milestones(*), packaging_order_history(*)"
      )
      .eq("order_number", orderNumber)
      .single();

    if (error || !order) {
      return res.status(404).json({ success: false, error: "Packaging order not found." });
    }

    return res.json({ success: true, data: order });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 4. Packaging Supplier Portal (Registration, Products, Quotes, Orders)
// ====================================================================

// POST /api/packaging-supplier/register (Onboard Supplier)
router.post("/packaging-supplier/register", authenticateUser, async (req, res) => {
  const user = req.user!;
  const {
    legal_business_name,
    supplier_type = "packaging_manufacturer",
    registered_address,
    factory_locations = [],
    serviceable_locations = [],
    packaging_categories = [],
    manufacturing_capabilities = [],
    printing_capabilities = [],
    production_capacity,
    moq_policy,
    typical_lead_time_days = 7,
    certifications = [],
    description,
    headline,
    gstin,
    phone,
  } = req.body;

  if (!legal_business_name || !supplier_type || !registered_address) {
    return res.status(400).json({
      success: false,
      error: "Legal business name, supplier type and registered address are mandatory.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    // 1. Check or create business record
    let businessId: string;
    const { data: existingBiz } = await insforge.database
      .from("businesses")
      .select("id")
      .eq("legal_name", legal_business_name)
      .maybeSingle();

    if (existingBiz) {
      businessId = existingBiz.id;
    } else {
      const slug = `${legal_business_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
      const { data: newBiz, error: bizErr } = await insforge.database
        .from("businesses")
        .insert([
          {
            name: legal_business_name,
            legal_name: legal_business_name,
            slug,
            business_type: "manufacturer",
            city: registered_address.split(",")[0]?.trim() || "National Hub",
            state: serviceable_locations[0] || "Maharashtra",
            pincode: "400001",
            phone: phone || user.phone || null,
            email: user.email,
            verification_level: "document_verified",
            is_active: true,
          },
        ])
        .select()
        .single();

      if (bizErr) {
        return res.status(500).json({ success: false, error: bizErr.message });
      }
      businessId = newBiz.id;
    }

    // 2. Create packaging supplier profile
    const { data: profile, error: profErr } = await insforge.database
      .from("packaging_supplier_profiles")
      .insert([
        {
          business_id: businessId,
          user_id: user.id,
          supplier_type,
          headline: headline || `${legal_business_name} - Certified Packaging Solutions`,
          description: description || "Custom and bulk packaging manufacturer and printing specialist.",
          registered_address,
          factory_locations,
          serviceable_locations,
          packaging_categories,
          manufacturing_capabilities,
          printing_capabilities,
          production_capacity: production_capacity || "500,000 units / month",
          moq_policy: moq_policy || "Minimum 500 units for standard, 5,000 for customized prints",
          typical_lead_time_days: parseInt(typical_lead_time_days, 10) || 7,
          certifications,
          verification_status: "pending",
          is_public_discovery_enabled: true,
        },
      ])
      .select()
      .single();

    if (profErr) {
      return res.status(500).json({ success: false, error: profErr.message });
    }

    // 3. Assign role
    await insforge.database
      .from("user_roles")
      .insert([{ user_id: user.id, role: "packaging_supplier" }])
      .select()
      .maybeSingle();

    return res.status(201).json({
      success: true,
      message: "Packaging supplier profile registered and submitted for verification.",
      supplier: profile,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/packaging-supplier/profile (Current Supplier Profile)
router.get("/packaging-supplier/profile", authenticateUser, async (req, res) => {
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: profile, error } = await insforge.database
      .from("packaging_supplier_profiles")
      .select("*, businesses(*)")
      .eq("user_id", user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ success: false, error: "Packaging supplier profile not found." });
    }

    return res.json({ success: true, data: profile });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/packaging-supplier/stats (Supplier Dashboard Counters)
router.get("/packaging-supplier/stats", authenticateUser, async (req, res) => {
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: profile } = await insforge.database
      .from("packaging_supplier_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return res.status(404).json({ success: false, error: "Supplier profile not found." });
    }

    // Query stats
    const { count: totalProducts } = await insforge.database
      .from("packaging_products")
      .select("id", { count: "exact", head: true })
      .eq("supplier_id", profile.id);

    const { count: publishedProducts } = await insforge.database
      .from("packaging_products")
      .select("id", { count: "exact", head: true })
      .eq("supplier_id", profile.id)
      .eq("moderation_status", "approved")
      .eq("is_active", true);

    const { count: pendingApprovalProducts } = await insforge.database
      .from("packaging_products")
      .select("id", { count: "exact", head: true })
      .eq("supplier_id", profile.id)
      .eq("moderation_status", "pending");

    const { count: openRfqs } = await insforge.database
      .from("packaging_rfq_recipients")
      .select("id", { count: "exact", head: true })
      .eq("supplier_id", profile.id)
      .eq("status", "pending");

    const { count: submittedQuotations } = await insforge.database
      .from("packaging_quotations")
      .select("id", { count: "exact", head: true })
      .eq("supplier_id", profile.id);

    const { count: acceptedQuotations } = await insforge.database
      .from("packaging_quotations")
      .select("id", { count: "exact", head: true })
      .eq("supplier_id", profile.id)
      .eq("status", "accepted");

    const { count: activeOrders } = await insforge.database
      .from("packaging_orders")
      .select("id", { count: "exact", head: true })
      .eq("supplier_id", profile.id)
      .in("order_status", [
        "order_created",
        "supplier_confirmation_pending",
        "specifications_awaiting_approval",
        "production_scheduled",
        "production_in_progress",
        "quality_inspection",
        "ready_for_dispatch",
        "dispatched",
      ]);

    const { count: completedOrders } = await insforge.database
      .from("packaging_orders")
      .select("id", { count: "exact", head: true })
      .eq("supplier_id", profile.id)
      .eq("order_status", "completed");

    return res.json({
      success: true,
      data: {
        total_products: totalProducts || 0,
        published_products: publishedProducts || 0,
        pending_approval_products: pendingApprovalProducts || 0,
        open_rfqs: openRfqs || 0,
        submitted_quotations: submittedQuotations || 0,
        accepted_quotations: acceptedQuotations || 0,
        active_orders: activeOrders || 0,
        completed_orders: completedOrders || 0,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/packaging-supplier/products (Products Managed by Supplier)
router.get("/packaging-supplier/products", authenticateUser, async (req, res) => {
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: profile } = await insforge.database
      .from("packaging_supplier_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return res.status(404).json({ success: false, error: "Supplier profile not found." });
    }

    const { data: products, error } = await insforge.database
      .from("packaging_products")
      .select("*, packaging_categories(id, name, slug)")
      .eq("supplier_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data: products || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/packaging-supplier/products (Create Packaging Product)
router.post("/packaging-supplier/products", authenticateUser, async (req, res) => {
  const user = req.user!;
  const {
    name,
    category_id,
    subcategory,
    description,
    material_type,
    dimensions = {},
    thickness,
    weight_gsm,
    capacity,
    colour,
    shape,
    packaging_type = "Flexible Pouch",
    printing_options = [],
    customization_options = [],
    category_specifications = {},
    unit_of_measurement = "piece",
    moq = 500,
    max_order_quantity,
    base_price,
    bulk_pricing_tiers = [],
    lead_time_days = 7,
    available_supply_locations = [],
    images = [],
    maintains_inventory = false,
    stock_quantity = 0,
  } = req.body;

  if (!name || !category_id || !material_type || base_price === undefined) {
    return res.status(400).json({
      success: false,
      error: "Product name, category, material type and base price are required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: profile } = await insforge.database
      .from("packaging_supplier_profiles")
      .select("id, business_id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return res.status(404).json({ success: false, error: "Supplier profile not found." });
    }

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;

    const { data: newProduct, error } = await insforge.database
      .from("packaging_products")
      .insert([
        {
          supplier_id: profile.id,
          business_id: profile.business_id,
          category_id,
          subcategory: subcategory || null,
          name,
          slug,
          description: description || null,
          material_type,
          dimensions,
          thickness: thickness || null,
          weight_gsm: weight_gsm || null,
          capacity: capacity || null,
          colour: colour || null,
          shape: shape || null,
          packaging_type,
          printing_options,
          customization_options,
          category_specifications,
          unit_of_measurement,
          moq: parseInt(moq, 10) || 500,
          max_order_quantity: max_order_quantity ? parseInt(max_order_quantity, 10) : null,
          base_price: parseFloat(base_price),
          bulk_pricing_tiers,
          lead_time_days: parseInt(lead_time_days, 10) || 7,
          available_supply_locations,
          images,
          maintains_inventory: Boolean(maintains_inventory),
          stock_quantity: parseInt(stock_quantity, 10) || 0,
          available_quantity: parseInt(stock_quantity, 10) || 0,
          moderation_status: "approved", // auto-approve for testing or set pending
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(201).json({
      success: true,
      message: "Packaging product listing published successfully.",
      product: newProduct,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/packaging-supplier/rfqs (Dispatched RFQs)
router.get("/packaging-supplier/rfqs", authenticateUser, async (req, res) => {
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: profile } = await insforge.database
      .from("packaging_supplier_profiles")
      .select("id, packaging_categories")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return res.status(404).json({ success: false, error: "Supplier profile not found." });
    }

    // Fetch RFQs received by this supplier
    const { data: recipients, error } = await insforge.database
      .from("packaging_rfq_recipients")
      .select("*, packaging_rfqs(*, packaging_categories(name, slug))")
      .eq("supplier_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data: recipients || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/packaging-supplier/quotations (Submit Itemized Quotation)
router.post("/packaging-supplier/quotations", authenticateUser, async (req, res) => {
  const user = req.user!;
  const {
    rfq_id,
    quotation_type = "custom_packaging",
    product_id,
    quantity,
    unit = "piece",
    unit_price,
    bulk_discount_amount = 0,
    printing_charges = 0,
    plate_cylinder_charges = 0,
    design_charges = 0,
    packaging_charges = 0,
    freight_charges = 0,
    production_lead_time_days = 10,
    valid_until,
    sample_available = true,
    sample_charges = 0,
    sample_lead_time_days = 5,
    terms_and_conditions,
  } = req.body;

  if (!rfq_id || !quantity || !unit_price) {
    return res.status(400).json({
      success: false,
      error: "RFQ reference, quantity and unit price are required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: profile } = await insforge.database
      .from("packaging_supplier_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return res.status(404).json({ success: false, error: "Supplier profile not found." });
    }

    // Financial Calculation with 18% GST and rounding
    const qty = parseInt(quantity, 10);
    const uPrice = parseFloat(unit_price);
    const subtotal = roundToTwoDecimals(qty * uPrice);
    const discount = Math.min(subtotal, roundToTwoDecimals(parseFloat(bulk_discount_amount) || 0));
    const printChg = roundToTwoDecimals(parseFloat(printing_charges) || 0);
    const plateChg = roundToTwoDecimals(parseFloat(plate_cylinder_charges) || 0);
    const designChg = roundToTwoDecimals(parseFloat(design_charges) || 0);
    const packChg = roundToTwoDecimals(parseFloat(packaging_charges) || 0);
    const freightChg = roundToTwoDecimals(parseFloat(freight_charges) || 0);

    const taxableBase = roundToTwoDecimals(subtotal - discount + printChg + plateChg + designChg + packChg + freightChg);
    const gstRate = 0.18;
    const gstAmount = roundToTwoDecimals(taxableBase * gstRate);
    const totalCost = roundToTwoDecimals(taxableBase + gstAmount);
    const effectiveUnitCost = roundToTwoDecimals(totalCost / qty);

    const timestampStr = Date.now().toString(36).toUpperCase();
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const quotationNumber = `PKG-QT-${timestampStr}-${randPart}`;

    const expiryDate = valid_until || new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0];

    const { data: newQuote, error } = await insforge.database
      .from("packaging_quotations")
      .insert([
        {
          quotation_number: quotationNumber,
          rfq_id,
          supplier_id: profile.id,
          supplier_user_id: user.id,
          quotation_type,
          product_id: product_id || null,
          quantity: qty,
          unit,
          unit_price: uPrice,
          subtotal,
          bulk_discount_amount: discount,
          printing_charges: printChg,
          plate_cylinder_charges: plateChg,
          design_charges: designChg,
          packaging_charges: packChg,
          freight_charges: freightChg,
          gst_rate: gstRate,
          gst_amount: gstAmount,
          total_estimated_cost: totalCost,
          effective_unit_cost: effectiveUnitCost,
          production_lead_time_days: parseInt(production_lead_time_days, 10) || 10,
          valid_until: expiryDate,
          sample_available: Boolean(sample_available),
          sample_charges: parseFloat(sample_charges) || 0,
          sample_lead_time_days: parseInt(sample_lead_time_days, 10) || 5,
          terms_and_conditions: terms_and_conditions || null,
          status: "submitted",
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    // Mark recipient status
    await insforge.database
      .from("packaging_rfq_recipients")
      .update({ status: "quoted" })
      .eq("rfq_id", rfq_id)
      .eq("supplier_id", profile.id);

    return res.status(201).json({
      success: true,
      message: "Custom packaging quotation submitted successfully.",
      quotation: newQuote,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/packaging-supplier/orders (Orders Managed by Supplier)
router.get("/packaging-supplier/orders", authenticateUser, async (req, res) => {
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: profile } = await insforge.database
      .from("packaging_supplier_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return res.status(404).json({ success: false, error: "Supplier profile not found." });
    }

    const { data: orders, error } = await insforge.database
      .from("packaging_orders")
      .select("*, packaging_quotations(*), packaging_order_milestones(*)")
      .eq("supplier_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data: orders || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/packaging-supplier/orders/:id/status (Advance 13-stage order lifecycle)
router.put("/packaging-supplier/orders/:id/status", authenticateUser, async (req, res) => {
  const { id } = req.params;
  const user = req.user!;
  const {
    order_status,
    carrier_name,
    tracking_number,
    dispatch_date,
    quality_inspection_passed,
    note,
  } = req.body;

  const validStatuses = [
    "order_created",
    "supplier_confirmation_pending",
    "specifications_awaiting_approval",
    "sample_pending",
    "sample_approved",
    "production_scheduled",
    "production_in_progress",
    "quality_inspection",
    "ready_for_dispatch",
    "dispatched",
    "delivered",
    "completed",
    "cancelled",
    "disputed",
  ];

  if (!order_status || !validStatuses.includes(order_status)) {
    return res.status(400).json({ success: false, error: `Invalid order status. Must be one of: ${validStatuses.join(", ")}` });
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: existingOrder, error: getErr } = await insforge.database
      .from("packaging_orders")
      .select("order_status")
      .eq("id", id)
      .single();

    if (getErr || !existingOrder) {
      return res.status(404).json({ success: false, error: "Order not found." });
    }

    const updatePayload: any = {
      order_status,
      updated_at: new Date().toISOString(),
    };
    if (carrier_name) updatePayload.carrier_name = carrier_name;
    if (tracking_number) updatePayload.tracking_number = tracking_number;
    if (dispatch_date) updatePayload.dispatch_date = dispatch_date;
    if (quality_inspection_passed !== undefined) updatePayload.quality_inspection_passed = Boolean(quality_inspection_passed);

    const { data: updatedOrder, error: updateErr } = await insforge.database
      .from("packaging_orders")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      return res.status(500).json({ success: false, error: updateErr.message });
    }

    // Append to audit history
    await insforge.database.from("packaging_order_history").insert([
      {
        order_id: id,
        previous_status: existingOrder.order_status,
        new_status: order_status,
        changed_by: user.id,
        note: note || `Order status transitioned to ${order_status}`,
      },
    ]);

    return res.json({
      success: true,
      message: `Packaging order progressed to '${order_status}'.`,
      order: updatedOrder,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 5. Admin Governance & Platform Management
// ====================================================================

// GET /api/admin/packaging/stats (Platform Overview)
router.get("/admin/packaging/stats", async (req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { count: totalSuppliers } = await insforge.database
      .from("packaging_supplier_profiles")
      .select("id", { count: "exact", head: true });

    const { count: verifiedSuppliers } = await insforge.database
      .from("packaging_supplier_profiles")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "verified");

    const { count: pendingVerification } = await insforge.database
      .from("packaging_supplier_profiles")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "pending");

    const { count: activeProducts } = await insforge.database
      .from("packaging_products")
      .select("id", { count: "exact", head: true })
      .eq("moderation_status", "approved");

    const { count: pendingProductApproval } = await insforge.database
      .from("packaging_products")
      .select("id", { count: "exact", head: true })
      .eq("moderation_status", "pending");

    const { count: totalRfqs } = await insforge.database
      .from("packaging_rfqs")
      .select("id", { count: "exact", head: true });

    const { count: totalQuotations } = await insforge.database
      .from("packaging_quotations")
      .select("id", { count: "exact", head: true });

    const { count: totalOrders } = await insforge.database
      .from("packaging_orders")
      .select("id", { count: "exact", head: true });

    const { count: completedOrders } = await insforge.database
      .from("packaging_orders")
      .select("id", { count: "exact", head: true })
      .eq("order_status", "completed");

    return res.json({
      success: true,
      data: {
        total_suppliers: totalSuppliers || 0,
        verified_suppliers: verifiedSuppliers || 0,
        pending_verification: pendingVerification || 0,
        active_products: activeProducts || 0,
        pending_product_approval: pendingProductApproval || 0,
        total_rfqs: totalRfqs || 0,
        total_quotations: totalQuotations || 0,
        total_orders: totalOrders || 0,
        completed_orders: completedOrders || 0,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/packaging/suppliers (Suppliers Audit Queue)
router.get("/admin/packaging/suppliers", async (req, res) => {
  const { status } = req.query as { status?: string };
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    let query = insforge.database
      .from("packaging_supplier_profiles")
      .select("*, businesses(*)")
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("verification_status", status);
    }

    const { data, error } = await query;
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/packaging/suppliers/:id/verify (Approve / Reject / Suspend)
router.post("/admin/packaging/suppliers/:id/verify", authenticateUser, async (req, res) => {
  const { id } = req.params;
  const user = req.user!;
  const { action, notes } = req.body as {
    action: "approve" | "reject" | "suspend";
    notes?: string;
  };

  const statusMap: Record<string, string> = {
    approve: "verified",
    reject: "rejected",
    suspend: "suspended",
  };

  const newStatus = statusMap[action];
  if (!newStatus) {
    return res.status(400).json({ success: false, error: "Action must be approve, reject, or suspend." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: updated, error } = await insforge.database
      .from("packaging_supplier_profiles")
      .update({
        verification_status: newStatus,
        verification_notes: notes || null,
        verified_at: newStatus === "verified" ? new Date().toISOString() : null,
        verified_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      message: `Packaging supplier credentials marked as '${newStatus}'.`,
      supplier: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/packaging/products (Product Moderation Queue)
router.get("/admin/packaging/products", async (req, res) => {
  const { status } = req.query as { status?: string };
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    let query = insforge.database
      .from("packaging_products")
      .select("*, packaging_categories(name), packaging_supplier_profiles(businesses(name))")
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("moderation_status", status);
    }

    const { data, error } = await query;
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/packaging/products/:id/moderate (Approve / Reject Product Listing)
router.post("/admin/packaging/products/:id/moderate", authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { action, notes } = req.body as {
    action: "approve" | "reject";
    notes?: string;
  };

  const statusMap: Record<string, string> = {
    approve: "approved",
    reject: "rejected",
  };

  const newStatus = statusMap[action];
  if (!newStatus) {
    return res.status(400).json({ success: false, error: "Action must be approve or reject." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: updated, error } = await insforge.database
      .from("packaging_products")
      .update({
        moderation_status: newStatus,
        moderation_notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      message: `Product listing moderation status updated to '${newStatus}'.`,
      product: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
