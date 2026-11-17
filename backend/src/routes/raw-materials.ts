import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";
import { authenticateUser, type AuthenticatedUser } from "../middleware/auth.js";
import { calculateLandedCost, roundToTwoDecimals } from "../lib/landed-cost.js";

const router = Router();

// ====================================================================
// 1. Public Raw Material Marketplace (Categories, Products, Suppliers)
// ====================================================================

// GET /api/raw-materials/categories
router.get("/raw-materials/categories", async (req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data, error } = await insforge.database
      .from("raw_material_categories")
      .select("id, name, slug, description, icon, display_order, is_active, raw_material_subcategories(id, name, slug, description)")
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

// GET /api/raw-materials/products (Search & Filter Raw Materials)
router.get("/raw-materials/products", async (req, res) => {
  const {
    category,
    search,
    grade,
    location,
    unit,
    min_moq,
    max_moq,
    min_price,
    max_price,
    sort,
    page = "1",
    limit = "20",
  } = req.query as {
    category?: string;
    search?: string;
    grade?: string;
    location?: string;
    unit?: string;
    min_moq?: string;
    max_moq?: string;
    min_price?: string;
    max_price?: string;
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
      .from("raw_material_products")
      .select(
        "id, name, slug, category_id, subcategory, description, material_grade, origin, specifications, unit_of_measurement, moq, max_order_quantity, base_price, bulk_pricing_tiers, maintains_inventory, stock_quantity, available_quantity, lead_time_days, supply_locations, delivery_available, images, moderation_status, is_active, raw_material_supplier_profiles(id, supplier_type, verification_status, rating, businesses(id, name, city, state))"
      )
      .eq("moderation_status", "approved")
      .eq("is_active", true);

    if (category && category !== "all") {
      query = query.eq("category_id", category);
    }
    if (grade) {
      query = query.ilike("material_grade", `%${grade.trim()}%`);
    }
    if (unit) {
      query = query.eq("unit_of_measurement", unit);
    }
    if (search?.trim()) {
      query = query.or(`name.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%,material_grade.ilike.%${search.trim()}%`);
    }
    if (min_price) {
      query = query.gte("base_price", parseFloat(min_price));
    }
    if (max_price) {
      query = query.lte("base_price", parseFloat(max_price));
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

// GET /api/raw-materials/products/:slug (Detailed Product View)
router.get("/raw-materials/products/:slug", async (req, res) => {
  const { slug } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data, error } = await insforge.database
      .from("raw_material_products")
      .select(
        "*, raw_material_supplier_profiles(*, businesses(id, name, legal_name, city, state, pincode, phone, email, verification_level))"
      )
      .eq("slug", slug)
      .single();

    if (error || !data) {
      // Try lookup by UUID if not matched by slug
      const { data: byId } = await insforge.database
        .from("raw_material_products")
        .select(
          "*, raw_material_supplier_profiles(*, businesses(id, name, legal_name, city, state, pincode, phone, email, verification_level))"
        )
        .eq("id", slug)
        .single();

      if (!byId) {
        return res.status(404).json({ success: false, error: "Raw material product not found." });
      }
      return res.json({ success: true, data: byId });
    }

    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/raw-materials/suppliers (Supplier Directory)
router.get("/raw-materials/suppliers", async (req, res) => {
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
      .from("raw_material_supplier_profiles")
      .select("*, businesses(id, name, city, state, pincode, verification_level, phone, email)")
      .eq("verification_status", "verified");

    if (supplier_type && supplier_type !== "all") {
      query = query.eq("supplier_type", supplier_type);
    }
    if (state && state !== "all") {
      query = query.contains("operating_states", [state]);
    }
    if (category && category !== "all") {
      query = query.contains("material_categories", [category]);
    }

    const { data, error } = await query.order("total_deals_completed", { ascending: false }).limit(50);
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/raw-materials/suppliers/:id (Supplier Detailed Profile & Catalog)
router.get("/raw-materials/suppliers/:id", async (req, res) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: supplier, error } = await insforge.database
      .from("raw_material_supplier_profiles")
      .select("*, businesses(*)")
      .eq("id", id)
      .single();

    if (error || !supplier) {
      return res.status(404).json({ success: false, error: "Raw material supplier not found." });
    }

    // Fetch published catalog
    const { data: products } = await insforge.database
      .from("raw_material_products")
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
// 2. RFQ Submission, Multi-Supplier Matching & Guest Conversion
// ====================================================================

// POST /api/raw-materials/rfqs (Guest or Authenticated Buyer Bulk RFQ)
router.post("/raw-materials/rfqs", async (req, res) => {
  const {
    material_name,
    category_id,
    required_quantity,
    unit = "kg",
    material_grade,
    required_specifications = {},
    packaging_requirements,
    delivery_city,
    delivery_state,
    delivery_pincode,
    target_delivery_date,
    budget,
    target_supplier_id,
    guest_name,
    guest_email,
    guest_phone,
    guest_company,
    notes,
  } = req.body;

  if (!material_name || !category_id || !required_quantity || !delivery_city || !delivery_state) {
    return res.status(400).json({
      success: false,
      error: "Material name, category, required quantity, delivery city and state are mandatory.",
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
    const rfqNumber = `RM-RFQ-${timestampStr}-${randPart}`;

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
      .from("raw_material_rfqs")
      .insert([
        {
          rfq_number: rfqNumber,
          buyer_id: buyerId || null,
          guest_name: guest_name || null,
          guest_email: guest_email || null,
          guest_phone: guest_phone || null,
          guest_company: guest_company || null,
          material_name,
          category_id,
          required_quantity: parseFloat(required_quantity),
          unit,
          material_grade: material_grade || null,
          required_specifications,
          packaging_requirements: packaging_requirements || null,
          delivery_city,
          delivery_state,
          delivery_pincode: delivery_pincode || null,
          target_delivery_date: target_delivery_date || null,
          budget: budget ? parseFloat(budget) : null,
          target_supplier_id: target_supplier_id || null,
          status: "submitted",
          notes: notes || null,
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    // Match and dispatch to eligible suppliers
    if (target_supplier_id) {
      // Direct RFQ to specific supplier
      await insforge.database.from("raw_material_rfq_recipients").insert([
        {
          rfq_id: newRfq.id,
          supplier_id: target_supplier_id,
          status: "pending",
        },
      ]);
    } else {
      // Broadcast to matching verified suppliers
      const { data: matchingSuppliers } = await insforge.database
        .from("raw_material_supplier_profiles")
        .select("id")
        .eq("verification_status", "verified")
        .limit(10);

      if (matchingSuppliers && matchingSuppliers.length > 0) {
        const recipientRecords = matchingSuppliers.map((sup) => ({
          rfq_id: newRfq.id,
          supplier_id: sup.id,
          status: "pending",
        }));
        await insforge.database.from("raw_material_rfq_recipients").insert(recipientRecords);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Raw material RFQ successfully broadcast to verified suppliers.",
      data: newRfq,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/raw-materials/rfqs/:rfqNumber (RFQ Status Tracking)
router.get("/raw-materials/rfqs/:rfqNumber", async (req, res) => {
  const { rfqNumber } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: rfq, error } = await insforge.database
      .from("raw_material_rfqs")
      .select("*, raw_material_quotations(id, quotation_number, unit_price, total_estimated_cost, effective_unit_cost, lead_time_days, valid_until, status, raw_material_supplier_profiles(id, businesses(name, city, verification_level)))")
      .eq("rfq_number", rfqNumber)
      .single();

    if (error || !rfq) {
      return res.status(404).json({ success: false, error: "Raw material RFQ not found." });
    }

    return res.json({ success: true, data: rfq });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/raw-materials/guest-claim (Claim historical guest RFQs upon account creation)
router.post("/raw-materials/guest-claim", authenticateUser, async (req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const user = req.user!;
    const buyerId = user.id;
    const buyerEmail = user.email;

    // Associate unlinked RFQs with matching guest email
    const { data: updated, error: updateErr } = await insforge.database
      .from("raw_material_rfqs")
      .update({ buyer_id: buyerId })
      .eq("guest_email", buyerEmail)
      .is("buyer_id", null)
      .select("id, rfq_number, material_name");

    return res.json({
      success: true,
      message: `Associated ${updated ? updated.length : 0} historical RFQs with your account.`,
      data: updated || [],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 3. Buyer Quotation Comparison & Order Acceptance
// ====================================================================

// GET /api/raw-materials/my-rfqs (Authenticated Buyer RFQ Portfolio)
router.get("/raw-materials/my-rfqs", authenticateUser, async (req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const user = req.user!;
    const { data, error } = await insforge.database
      .from("raw_material_rfqs")
      .select("*, raw_material_quotations(id, quotation_number, total_estimated_cost, status)")
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/raw-materials/rfqs/:rfqId/quotations (Compare Quotations for an RFQ)
router.get("/raw-materials/rfqs/:rfqId/quotations", async (req, res) => {
  const { rfqId } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("raw_material_quotations")
      .select("*, raw_material_supplier_profiles(id, supplier_type, verification_status, rating, businesses(name, city, state, verification_level))")
      .eq("rfq_id", rfqId)
      .order("total_estimated_cost", { ascending: true });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/raw-materials/quotations/:quotationId/accept (Accept Quotation & Create Order)
router.post("/raw-materials/quotations/:quotationId/accept", authenticateUser, async (req, res) => {
  const { quotationId } = req.params;
  const { delivery_address } = req.body;

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const user = req.user!;

    // Retrieve quotation and linked RFQ
    const { data: quote, error: quoteErr } = await insforge.database
      .from("raw_material_quotations")
      .select("*, raw_material_rfqs(*)")
      .eq("id", quotationId)
      .single();

    if (quoteErr || !quote) {
      return res.status(404).json({ success: false, error: "Quotation not found." });
    }

    // Verify validity date
    if (new Date(quote.valid_until) < new Date()) {
      return res.status(400).json({ success: false, error: "Quotation has expired and cannot be accepted." });
    }

    if (quote.status === "accepted") {
      return res.status(400).json({ success: false, error: "Quotation has already been accepted." });
    }

    // Generate Order Number
    const timestampStr = Date.now().toString(36).toUpperCase();
    const orderNumber = `RM-ORD-${timestampStr}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Mark quote as accepted
    await insforge.database
      .from("raw_material_quotations")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", quotationId);

    // Reject other competitor quotations for this RFQ
    await insforge.database
      .from("raw_material_quotations")
      .update({ status: "rejected" })
      .eq("rfq_id", quote.rfq_id)
      .neq("id", quotationId);

    // Update RFQ status
    await insforge.database
      .from("raw_material_rfqs")
      .update({ status: "accepted" })
      .eq("id", quote.rfq_id);

    // Create exactly one confirmed order
    const { data: newOrder, error: orderErr } = await insforge.database
      .from("raw_material_orders")
      .insert([
        {
          order_number: orderNumber,
          quotation_id: quote.id,
          rfq_id: quote.rfq_id,
          buyer_id: user.id,
          supplier_id: quote.supplier_id,
          status: "order_created",
          total_amount: quote.total_estimated_cost,
          delivery_city: quote.raw_material_rfqs?.delivery_city || "Delivery Location",
          delivery_address: delivery_address || "Standard delivery destination",
          estimated_delivery_date: new Date(Date.now() + quote.lead_time_days * 86400000).toISOString().split("T")[0],
        },
      ])
      .select()
      .single();

    if (orderErr) {
      return res.status(500).json({ success: false, error: orderErr.message });
    }

    // Record order audit history
    await insforge.database.from("raw_material_order_history").insert([
      {
        order_id: newOrder.id,
        previous_status: null,
        new_status: "order_created",
        changed_by: user.id,
        note: `Order generated from accepted quotation ${quote.quotation_number}`,
      },
    ]);

    return res.status(201).json({
      success: true,
      message: "Quotation accepted and raw material order created successfully.",
      data: newOrder,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 4. Raw Material Supplier Portal (Dashboard, Catalog, Pricing, Orders)
// ====================================================================

// Helper to resolve supplier profile from authenticated user
async function resolveSupplierProfile(user: AuthenticatedUser, insforge: any) {
  const { data: profile } = await insforge.database
    .from("raw_material_supplier_profiles")
    .select("*, businesses(*)")
    .eq("user_id", user.id)
    .single();

  return profile ? { user, profile } : null;
}

// POST /api/raw-material-supplier/register (Supplier Onboarding)
router.post("/raw-material-supplier/register", authenticateUser, async (req, res) => {
  const {
    legal_business_name,
    supplier_type = "manufacturer",
    city,
    state,
    pincode,
    phone,
    email,
    gstin,
    material_categories = [],
    warehouses = [],
    supply_capacity_monthly,
    moq_policy,
    description,
  } = req.body;

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const user = req.user!;
    const userId = user.id;

    // Create Business entity
    const slug = `${legal_business_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
    const { data: business, error: bizErr } = await insforge.database
      .from("businesses")
      .insert([
        {
          name: legal_business_name,
          legal_name: legal_business_name,
          slug,
          business_type: "manufacturer",
          city: city || "Mumbai",
          state: state || "Maharashtra",
          pincode: pincode || "400001",
          phone: phone || user.phone,
          email: email || user.email,
          gstin: gstin || null,
          verification_level: "unverified",
          is_active: true,
        },
      ])
      .select()
      .single();

    if (bizErr) return res.status(500).json({ success: false, error: bizErr.message });

    // Link user role
    await insforge.database.from("user_roles").upsert([
      {
        user_id: userId,
        role: "raw_material_supplier",
        is_primary: false,
      },
    ]);

    // Create Raw Material Supplier Profile
    const { data: supplierProfile, error: profErr } = await insforge.database
      .from("raw_material_supplier_profiles")
      .insert([
        {
          business_id: business.id,
          user_id: userId,
          supplier_type,
          headline: `${supplier_type.replace(/_/g, " ")} of ${material_categories.join(", ")}`,
          description: description || "Verified raw material bulk supplier on COVERLY.",
          operating_states: [state || "Maharashtra"],
          operating_cities: [city || "Mumbai"],
          material_categories,
          warehouses,
          supply_capacity_monthly: supply_capacity_monthly || "500 MT / Month",
          moq_policy: moq_policy || "Minimum commercial shipment requirements apply.",
          verification_status: "pending",
        },
      ])
      .select()
      .single();

    if (profErr) return res.status(500).json({ success: false, error: profErr.message });

    return res.status(201).json({
      success: true,
      message: "Raw material supplier profile registered successfully. Verification is pending administrative review.",
      data: supplierProfile,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Protect subsequent supplier routes with authenticateUser
router.use("/raw-material-supplier", authenticateUser);

// GET /api/raw-material-supplier/dashboard (Supplier Overview Metrics)
router.get("/raw-material-supplier/dashboard", async (req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const authResolved = await resolveSupplierProfile(req.user!, insforge);
    if (!authResolved) {
      return res.status(404).json({ success: false, error: "Supplier profile not registered." });
    }

    const { profile } = authResolved;

    // Fetch Products counts
    const { data: products } = await insforge.database
      .from("raw_material_products")
      .select("id, moderation_status, is_active")
      .eq("supplier_id", profile.id);

    // Fetch RFQs Dispatched to this supplier
    const { data: rfqRecipients } = await insforge.database
      .from("raw_material_rfq_recipients")
      .select("id, status, raw_material_rfqs(*)")
      .eq("supplier_id", profile.id);

    // Fetch Quotations submitted by this supplier
    const { data: quotes } = await insforge.database
      .from("raw_material_quotations")
      .select("id, status, total_estimated_cost")
      .eq("supplier_id", profile.id);

    // Fetch Orders assigned to this supplier
    const { data: orders } = await insforge.database
      .from("raw_material_orders")
      .select("id, status, total_amount")
      .eq("supplier_id", profile.id);

    const totalProducts = products ? products.length : 0;
    const publishedProducts = products ? products.filter((p) => p.moderation_status === "approved" && p.is_active).length : 0;
    const pendingProducts = products ? products.filter((p) => p.moderation_status === "pending").length : 0;

    const activeRfqs = rfqRecipients ? rfqRecipients.length : 0;
    const pendingQuotes = rfqRecipients ? rfqRecipients.filter((r) => r.status === "pending").length : 0;
    const submittedQuotes = quotes ? quotes.length : 0;
    const acceptedQuotes = quotes ? quotes.filter((q) => q.status === "accepted").length : 0;

    const activeOrders = orders ? orders.filter((o) => !["completed", "cancelled"].includes(o.status)).length : 0;
    const completedOrders = orders ? orders.filter((o) => o.status === "completed").length : 0;
    const recordedRevenue = orders
      ? orders
          .filter((o) => ["confirmed", "processing", "dispatched", "delivered", "completed"].includes(o.status))
          .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
      : 0;

    return res.json({
      success: true,
      data: {
        profile,
        metrics: {
          totalProducts,
          publishedProducts,
          pendingProducts,
          activeRfqs,
          pendingQuotes,
          submittedQuotes,
          acceptedQuotes,
          activeOrders,
          completedOrders,
          recordedRevenue,
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/raw-material-supplier/products (Supplier Products List)
router.get("/raw-material-supplier/products", async (req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const authResolved = await resolveSupplierProfile(req.user!, insforge);
    if (!authResolved) return res.status(404).json({ success: false, error: "Supplier profile not registered." });

    const { data, error } = await insforge.database
      .from("raw_material_products")
      .select("*")
      .eq("supplier_id", authResolved.profile.id)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/raw-material-supplier/products (Add New Product Listing)
router.post("/raw-material-supplier/products", async (req, res) => {
  const {
    name,
    category_id,
    subcategory,
    description,
    material_grade,
    origin,
    quality_standards = [],
    specifications = {},
    unit_of_measurement = "kg",
    moq = 1,
    max_order_quantity,
    base_price,
    bulk_pricing_tiers = [],
    maintains_inventory = false,
    stock_quantity = 0,
    lead_time_days = 5,
    packaging_details,
    supply_locations = [],
    images = [],
  } = req.body;

  if (!name || !category_id || !base_price) {
    return res.status(400).json({ success: false, error: "Product name, category, and base price are required." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const authResolved = await resolveSupplierProfile(req.user!, insforge);
    if (!authResolved) return res.status(404).json({ success: false, error: "Supplier profile not registered." });

    const { profile } = authResolved;
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;

    const { data: newProd, error } = await insforge.database
      .from("raw_material_products")
      .insert([
        {
          supplier_id: profile.id,
          business_id: profile.business_id,
          category_id,
          subcategory: subcategory || null,
          name,
          slug,
          description: description || null,
          material_grade: material_grade || null,
          origin: origin || null,
          quality_standards,
          specifications,
          unit_of_measurement,
          moq: parseFloat(moq) || 1,
          max_order_quantity: max_order_quantity ? parseFloat(max_order_quantity) : null,
          base_price: parseFloat(base_price),
          bulk_pricing_tiers,
          maintains_inventory: Boolean(maintains_inventory),
          stock_quantity: maintains_inventory ? parseFloat(stock_quantity) || 0 : 0,
          available_quantity: maintains_inventory ? parseFloat(stock_quantity) || 0 : 0,
          lead_time_days: parseInt(lead_time_days, 10) || 5,
          packaging_details: packaging_details || null,
          supply_locations,
          delivery_available: true,
          images,
          moderation_status: "approved",
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, data: newProd });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/raw-material-supplier/rfqs (Incoming RFQs for this supplier)
router.get("/raw-material-supplier/rfqs", async (req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const authResolved = await resolveSupplierProfile(req.user!, insforge);
    if (!authResolved) return res.status(404).json({ success: false, error: "Supplier profile not registered." });

    const { data, error } = await insforge.database
      .from("raw_material_rfq_recipients")
      .select("id, status, created_at, raw_material_rfqs(*)")
      .eq("supplier_id", authResolved.profile.id)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/raw-material-supplier/rfqs/:rfqId/quote (Submit Formal Landed Quotation)
router.post("/raw-material-supplier/rfqs/:rfqId/quote", async (req, res) => {
  const { rfqId } = req.params;
  const {
    unit_price,
    bulk_discount_amount = 0,
    packaging_charges = 0,
    loading_charges = 0,
    freight_charges = 0,
    insurance_charges = 0,
    gst_rate = 0.18,
    lead_time_days = 5,
    valid_days = 15,
    terms_and_conditions,
    product_id,
  } = req.body;

  if (!unit_price) {
    return res.status(400).json({ success: false, error: "Unit price is required to generate quotation." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const authResolved = await resolveSupplierProfile(req.user!, insforge);
    if (!authResolved) return res.status(404).json({ success: false, error: "Supplier profile not registered." });

    const { profile, user } = authResolved;

    // Fetch target RFQ
    const { data: rfq, error: rfqErr } = await insforge.database
      .from("raw_material_rfqs")
      .select("*")
      .eq("id", rfqId)
      .single();

    if (rfqErr || !rfq) return res.status(404).json({ success: false, error: "Target RFQ not found." });

    const quantity = rfq.required_quantity;
    const baseSubtotal = roundToTwoDecimals(parseFloat(unit_price) * quantity);
    const discount = roundToTwoDecimals(parseFloat(bulk_discount_amount) || 0);
    const taxableGoods = Math.max(0, roundToTwoDecimals(baseSubtotal - discount));

    const pkg = roundToTwoDecimals(parseFloat(packaging_charges) || 0);
    const load = roundToTwoDecimals(parseFloat(loading_charges) || 0);
    const frt = roundToTwoDecimals(parseFloat(freight_charges) || 0);
    const ins = roundToTwoDecimals(parseFloat(insurance_charges) || 0);

    const totalTaxable = roundToTwoDecimals(taxableGoods + pkg + load + frt + ins);
    const rate = parseFloat(gst_rate) || 0.18;
    const gstAmount = roundToTwoDecimals(totalTaxable * rate);
    const totalEstimatedCost = roundToTwoDecimals(totalTaxable + gstAmount);
    const effectiveUnitCost = roundToTwoDecimals(totalEstimatedCost / quantity);

    const quotationNumber = `RM-QT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const validUntilDate = new Date(Date.now() + parseInt(valid_days, 10) * 86400000).toISOString().split("T")[0];

    const { data: quotation, error: quoteErr } = await insforge.database
      .from("raw_material_quotations")
      .insert([
        {
          quotation_number: quotationNumber,
          rfq_id: rfq.id,
          supplier_id: profile.id,
          supplier_user_id: user.id,
          product_id: product_id || null,
          quantity,
          unit: rfq.unit,
          unit_price: parseFloat(unit_price),
          bulk_discount_amount: discount,
          packaging_charges: pkg,
          loading_charges: load,
          freight_charges: frt,
          insurance_charges: ins,
          gst_rate: rate,
          gst_amount: gstAmount,
          total_estimated_cost: totalEstimatedCost,
          effective_unit_cost: effectiveUnitCost,
          lead_time_days: parseInt(lead_time_days, 10) || 5,
          valid_until: validUntilDate,
          terms_and_conditions: terms_and_conditions || "Standard commercial wholesale delivery terms.",
          status: "submitted",
        },
      ])
      .select()
      .single();

    if (quoteErr) return res.status(500).json({ success: false, error: quoteErr.message });

    // Update recipient status to quoted
    await insforge.database
      .from("raw_material_rfq_recipients")
      .update({ status: "quoted" })
      .eq("rfq_id", rfq.id)
      .eq("supplier_id", profile.id);

    // Update RFQ status to quotes_received
    await insforge.database
      .from("raw_material_rfqs")
      .update({ status: "quotes_received" })
      .eq("id", rfq.id);

    return res.status(201).json({
      success: true,
      message: "Formal landed cost quotation submitted to buyer.",
      data: quotation,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/raw-material-supplier/orders (Supplier Confirmed Orders)
router.get("/raw-material-supplier/orders", async (req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const authResolved = await resolveSupplierProfile(req.user!, insforge);
    if (!authResolved) return res.status(404).json({ success: false, error: "Supplier profile not registered." });

    const { data, error } = await insforge.database
      .from("raw_material_orders")
      .select("*, raw_material_quotations(*), raw_material_rfqs(*), users(full_name, email, phone)")
      .eq("supplier_id", authResolved.profile.id)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/raw-material-supplier/orders/:id/status (Advance Order Progression)
router.patch("/raw-material-supplier/orders/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status, note, carrier_name, tracking_number, invoice_url, dispatch_document_url } = req.body;

  const validStatuses = [
    "confirmed",
    "processing",
    "preparing_for_dispatch",
    "ready_for_dispatch",
    "dispatched",
    "in_transit",
    "delivered",
    "completed",
  ];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: "Invalid raw material order status." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const authResolved = await resolveSupplierProfile(req.user!, insforge);
    if (!authResolved) return res.status(404).json({ success: false, error: "Supplier profile not registered." });

    const { profile, user } = authResolved;

    const updatePayload: Record<string, any> = { status };
    if (carrier_name) updatePayload.carrier_name = carrier_name;
    if (tracking_number) updatePayload.tracking_number = tracking_number;
    if (invoice_url) updatePayload.invoice_url = invoice_url;
    if (dispatch_document_url) updatePayload.dispatch_document_url = dispatch_document_url;
    if (status === "dispatched") updatePayload.dispatch_date = new Date().toISOString().split("T")[0];

    const { data: updatedOrder, error } = await insforge.database
      .from("raw_material_orders")
      .update(updatePayload)
      .eq("id", id)
      .eq("supplier_id", profile.id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    // Record History Audit
    await insforge.database.from("raw_material_order_history").insert([
      {
        order_id: id,
        previous_status: null,
        new_status: status,
        changed_by: user.id,
        note: note || `Order status advanced to ${status}`,
      },
    ]);

    return res.json({ success: true, data: updatedOrder });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 5. Admin Raw Material Governance Console
// ====================================================================

// GET /api/admin/raw-materials/metrics
router.get("/admin/raw-materials/metrics", async (req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const [suppliersRes, productsRes, rfqsRes, ordersRes] = await Promise.all([
      insforge.database.from("raw_material_supplier_profiles").select("id, verification_status"),
      insforge.database.from("raw_material_products").select("id, moderation_status"),
      insforge.database.from("raw_material_rfqs").select("id, status"),
      insforge.database.from("raw_material_orders").select("id, status, total_amount"),
    ]);

    const suppliers = suppliersRes.data || [];
    const products = productsRes.data || [];
    const rfqs = rfqsRes.data || [];
    const orders = ordersRes.data || [];

    const totalSuppliers = suppliers.length;
    const verifiedSuppliers = suppliers.filter((s) => s.verification_status === "verified").length;
    const pendingSuppliers = suppliers.filter((s) => s.verification_status === "pending").length;

    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.moderation_status === "approved").length;
    const pendingProducts = products.filter((p) => p.moderation_status === "pending").length;

    const totalRfqs = rfqs.length;
    const openRfqs = rfqs.filter((r) => ["submitted", "quotes_received"].includes(r.status)).length;
    const acceptedRfqs = rfqs.filter((r) => r.status === "accepted").length;

    const totalOrders = orders.length;
    const activeOrders = orders.filter((o) => !["completed", "cancelled"].includes(o.status)).length;
    const totalGmv = orders
      .filter((o) => ["confirmed", "processing", "dispatched", "delivered", "completed"].includes(o.status))
      .reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);

    return res.json({
      success: true,
      data: {
        totalSuppliers,
        verifiedSuppliers,
        pendingSuppliers,
        totalProducts,
        activeProducts,
        pendingProducts,
        totalRfqs,
        openRfqs,
        acceptedRfqs,
        totalOrders,
        activeOrders,
        totalGmv,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/raw-materials/suppliers (Audit & Verification Queue)
router.get("/admin/raw-materials/suppliers", async (req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("raw_material_supplier_profiles")
      .select("*, businesses(*)")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/raw-materials/suppliers/:id/verify (Verify or Reject Supplier)
router.patch("/admin/raw-materials/suppliers/:id/verify", async (req, res) => {
  const { id } = req.params;
  const { status, verification_notes } = req.body;

  if (!["verified", "rejected", "suspended"].includes(status)) {
    return res.status(400).json({ success: false, error: "Invalid verification status." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data: updated, error } = await insforge.database
      .from("raw_material_supplier_profiles")
      .update({
        verification_status: status,
        verification_notes: verification_notes || null,
        verified_at: status === "verified" ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/raw-materials/products (Product Moderation Queue)
router.get("/admin/raw-materials/products", async (req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("raw_material_products")
      .select("*, raw_material_supplier_profiles(id, businesses(name, city))")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/raw-materials/products/:id/moderate (Moderate Product Listing)
router.patch("/admin/raw-materials/products/:id/moderate", async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!["approved", "rejected", "archived"].includes(status)) {
    return res.status(400).json({ success: false, error: "Invalid moderation decision." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data: updated, error } = await insforge.database
      .from("raw_material_products")
      .update({
        moderation_status: status,
        moderation_notes: notes || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/raw-materials/rfqs (Monitor Platform RFQs)
router.get("/admin/raw-materials/rfqs", async (req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("raw_material_rfqs")
      .select("*, raw_material_quotations(id, quotation_number, total_estimated_cost, status), raw_material_rfq_recipients(id, status)")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/raw-materials/orders (Monitor Platform Raw Material Orders)
router.get("/admin/raw-materials/orders", async (req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("raw_material_orders")
      .select("*, raw_material_quotations(*), raw_material_supplier_profiles(businesses(name, city)), users(full_name, email)")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
