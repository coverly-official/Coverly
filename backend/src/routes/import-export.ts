import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";
import { authenticateUser, type AuthenticatedUser } from "../middleware/auth.js";
import { roundToTwoDecimals } from "../lib/landed-cost.js";

const router = Router();

// Reference exchange rates to INR (Source: RBI Reference Rates)
const REFERENCE_EXCHANGE_RATES: Record<string, number> = {
  USD: 86.50,
  EUR: 91.20,
  AED: 23.55,
  GBP: 109.80,
  JPY: 0.56,
  CNY: 11.90,
  SGD: 64.20,
  INR: 1.00,
};

// ====================================================================
// 1. Public International Trade Marketplace (Categories, Products, Currencies)
// ====================================================================

// GET /api/import-export/currencies
router.get("/import-export/currencies", (req, res) => {
  return res.json({
    success: true,
    data: {
      source: "Reserve Bank of India Reference Rate",
      timestamp: new Date().toISOString(),
      rates: REFERENCE_EXCHANGE_RATES,
      supported_incoterms: [
        { code: "EXW", name: "Ex Works", description: "Seller makes goods available at their premises. Buyer handles all transport & customs." },
        { code: "FCA", name: "Free Carrier", description: "Seller clears goods for export and hands over to carrier named by buyer." },
        { code: "FOB", name: "Free On Board", description: "Seller loads goods on board vessel at named port. Risk passes at ship's rail." },
        { code: "CFR", name: "Cost and Freight", description: "Seller pays ocean freight to destination port; risk transfers when loaded." },
        { code: "CIF", name: "Cost, Insurance and Freight", description: "Seller pays ocean freight and marine insurance to destination port." },
        { code: "CPT", name: "Carriage Paid To", description: "Seller pays carriage to named place; risk transfers upon first carrier handover." },
        { code: "CIP", name: "Carriage and Insurance Paid", description: "Seller pays carriage and comprehensive all-risks insurance." },
        { code: "DAP", name: "Delivered at Place", description: "Seller delivers goods ready for unloading at buyer destination." },
        { code: "DPU", name: "Delivered at Place Unloaded", description: "Seller delivers and unloads goods at destination terminal/warehouse." },
        { code: "DDP", name: "Delivered Duty Paid", description: "Seller handles entire freight, destination import duty and taxes." },
      ],
    },
  });
});

// GET /api/import-export/categories
router.get("/import-export/categories", async (req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data, error } = await insforge.database
      .from("trade_categories")
      .select("id, name, slug, description, icon, display_order, is_active, trade_subcategories(id, name, slug, description, display_order)")
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

// GET /api/import-export/products (Search & Filter International Products)
router.get("/import-export/products", async (req, res) => {
  const {
    category,
    search,
    origin_country,
    incoterm,
    currency,
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
    origin_country?: string;
    incoterm?: string;
    currency?: string;
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
      .from("international_products")
      .select(
        "id, name, slug, category_id, subcategory, description, hs_code, origin_country, origin_state, material_grade, specifications, quality_certifications, unit_of_measurement, moq, max_supply_capacity_monthly, currency, base_price_fob, incoterm_basis, pricing_tiers, export_lead_time_days, packaging_details, loading_port, eligible_destination_countries, images, moderation_status, is_active, trade_parties(id, party_type, country_code, country_name, verification_status, rating, iec_code, businesses(id, name, city, state))"
      )
      .eq("moderation_status", "approved")
      .eq("is_active", true);

    if (category && category !== "all") {
      query = query.eq("category_id", category);
    }
    if (origin_country && origin_country !== "all") {
      query = query.ilike("origin_country", `%${origin_country.trim()}%`);
    }
    if (incoterm && incoterm !== "all") {
      query = query.eq("incoterm_basis", incoterm);
    }
    if (currency && currency !== "all") {
      query = query.eq("currency", currency);
    }
    if (search?.trim()) {
      query = query.or(`name.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%,hs_code.ilike.%${search.trim()}%`);
    }
    if (min_price) {
      query = query.gte("base_price_fob", parseFloat(min_price));
    }
    if (max_price) {
      query = query.lte("base_price_fob", parseFloat(max_price));
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
      query = query.order("base_price_fob", { ascending: true });
    } else if (sort === "price_desc") {
      query = query.order("base_price_fob", { ascending: false });
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

// GET /api/import-export/products/:slug (Product Technical & Trade Dossier)
router.get("/import-export/products/:slug", async (req, res) => {
  const { slug } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data, error } = await insforge.database
      .from("international_products")
      .select(
        "*, trade_parties(*, businesses(id, name, legal_name, city, state, pincode, phone, email, verification_level))"
      )
      .eq("slug", slug)
      .single();

    if (error || !data) {
      // Lookup by UUID if slug lookup yields nothing
      const { data: byId } = await insforge.database
        .from("international_products")
        .select(
          "*, trade_parties(*, businesses(id, name, legal_name, city, state, pincode, phone, email, verification_level))"
        )
        .eq("id", slug)
        .single();

      if (!byId) {
        return res.status(404).json({ success: false, error: "International product not found." });
      }
      return res.json({ success: true, data: byId });
    }

    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/import-export/exporters (Exporters Directory)
router.get("/import-export/exporters", async (req, res) => {
  const { country, category, search } = req.query as {
    country?: string;
    category?: string;
    search?: string;
  };

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    let query = insforge.database
      .from("trade_parties")
      .select("*, businesses(id, name, city, state, phone, email, verification_level)")
      .in("party_type", ["exporter", "importer_exporter"])
      .eq("verification_status", "verified")
      .eq("is_public_discovery_enabled", true);

    if (country && country !== "all") {
      query = query.eq("country_code", country);
    }
    if (category && category !== "all") {
      query = query.contains("product_categories", [category]);
    }

    const { data, error } = await query.order("total_export_deals_completed", { ascending: false }).limit(50);
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/import-export/importers (Importers Directory)
router.get("/import-export/importers", async (req, res) => {
  const { country, category } = req.query as {
    country?: string;
    category?: string;
  };

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    let query = insforge.database
      .from("trade_parties")
      .select("*, businesses(id, name, city, state, phone, email, verification_level)")
      .in("party_type", ["importer", "importer_exporter"])
      .eq("verification_status", "verified")
      .eq("is_public_discovery_enabled", true);

    if (country && country !== "all") {
      query = query.eq("country_code", country);
    }
    if (category && category !== "all") {
      query = query.contains("product_categories", [category]);
    }

    const { data, error } = await query.order("created_at", { ascending: false }).limit(50);
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/import-export/parties/:id (Detailed Trader Profile & Catalog)
router.get("/import-export/parties/:id", async (req, res) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: party, error } = await insforge.database
      .from("trade_parties")
      .select("*, businesses(*)")
      .eq("id", id)
      .single();

    if (error || !party) {
      return res.status(404).json({ success: false, error: "Trade party not found." });
    }

    // Fetch published export products
    const { data: products } = await insforge.database
      .from("international_products")
      .select("*")
      .eq("party_id", id)
      .eq("moderation_status", "approved")
      .eq("is_active", true);

    return res.json({
      success: true,
      data: {
        ...party,
        products: products || [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 2. Trade Requirements & Export Enquiries (RFQs)
// ====================================================================

// POST /api/import-export/rfqs (Submit Import Requirement or Export Enquiry)
router.post("/import-export/rfqs", async (req, res) => {
  const {
    direction = "import",
    product_name,
    category_id,
    product_id,
    hs_code_preference,
    required_specifications = {},
    origin_country_preference,
    destination_country,
    destination_port,
    preferred_incoterm = "CIF",
    required_quantity,
    unit = "metric_ton",
    packaging_preference,
    target_currency = "USD",
    target_budget,
    target_delivery_date,
    payment_terms_preferred,
    inspection_agency,
    additional_instructions,
    reference_files = [],
    target_party_id,
    guest_name,
    guest_email,
    guest_phone,
    guest_company,
    guest_country = "India",
  } = req.body;

  if (!product_name || !destination_country || !destination_port || !required_quantity) {
    return res.status(400).json({
      success: false,
      error: "Product name, destination country, destination port and required quantity are mandatory.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const timestampStr = Date.now().toString(36).toUpperCase();
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const rfqNumber = `TRD-RFQ-${timestampStr}-${randPart}`;

    let buyerId: string | null = null;
    const authHeader = req.headers["authorization"];
    const xUserId = req.headers["x-user-id"] as string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      buyerId = authHeader.substring(7).trim();
    } else if (xUserId) {
      buyerId = xUserId.trim();
    }

    const { data: newRfq, error } = await insforge.database
      .from("trade_rfqs")
      .insert([
        {
          rfq_number: rfqNumber,
          direction,
          buyer_id: buyerId || null,
          guest_name: guest_name || null,
          guest_email: guest_email || null,
          guest_phone: guest_phone || null,
          guest_company: guest_company || null,
          guest_country,
          category_id: category_id || null,
          product_id: product_id || null,
          product_name,
          hs_code_preference: hs_code_preference || null,
          required_specifications,
          origin_country_preference: origin_country_preference || null,
          destination_country,
          destination_port,
          preferred_incoterm,
          required_quantity: parseFloat(required_quantity),
          unit,
          packaging_preference: packaging_preference || null,
          target_currency,
          target_budget: target_budget ? parseFloat(target_budget) : null,
          target_delivery_date: target_delivery_date || null,
          payment_terms_preferred: payment_terms_preferred || null,
          inspection_agency: inspection_agency || null,
          additional_instructions: additional_instructions || null,
          reference_files,
          status: "open",
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    // Match and dispatch to eligible exporters/suppliers
    if (target_party_id) {
      await insforge.database.from("trade_rfq_recipients").insert([
        {
          rfq_id: newRfq.id,
          party_id: target_party_id,
          status: "pending",
        },
      ]);
    } else {
      const { data: matchingExporters } = await insforge.database
        .from("trade_parties")
        .select("id")
        .in("party_type", ["exporter", "importer_exporter"])
        .eq("verification_status", "verified")
        .limit(10);

      if (matchingExporters && matchingExporters.length > 0) {
        const recipients = matchingExporters.map((p) => ({
          rfq_id: newRfq.id,
          party_id: p.id,
          status: "pending",
        }));
        await insforge.database.from("trade_rfq_recipients").insert(recipients);
      }
    }

    return res.status(201).json({
      success: true,
      message: "International trade requirement / RFQ broadcast to verified exporters.",
      data: newRfq,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/import-export/rfqs/:rfqNumber (Status & Received Quotations)
router.get("/import-export/rfqs/:rfqNumber", async (req, res) => {
  const { rfqNumber } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: rfq, error: rfqErr } = await insforge.database
      .from("trade_rfqs")
      .select("*, trade_categories(name, slug)")
      .eq("rfq_number", rfqNumber)
      .single();

    if (rfqErr || !rfq) {
      return res.status(404).json({ success: false, error: "Trade requirement not found." });
    }

    const { data: quotations } = await insforge.database
      .from("trade_quotations")
      .select("*, trade_parties(id, party_type, country_name, rating, businesses(id, name, city, state))")
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

// POST /api/import-export/guest-claim (Claim Anonymous Trade Inquiries)
router.post("/import-export/guest-claim", authenticateUser, async (req, res) => {
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data, error } = await insforge.database
      .from("trade_rfqs")
      .update({ buyer_id: user.id })
      .eq("guest_email", user.email)
      .is("buyer_id", null)
      .select();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      message: `Successfully linked ${data?.length || 0} trade requirements to your account.`,
      claimed_count: data?.length || 0,
      data: data || [],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 3. Buyer Quotation Actions & Order Acceptance
// ====================================================================

// POST /api/import-export/quotations/:id/accept (Accept Quotation & Generate Trade Order)
router.post("/import-export/quotations/:id/accept", authenticateUser, async (req, res) => {
  const { id } = req.params;
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: quotation, error: quoteErr } = await insforge.database
      .from("trade_quotations")
      .select("*, trade_rfqs(*)")
      .eq("id", id)
      .single();

    if (quoteErr || !quotation) {
      return res.status(404).json({ success: false, error: "Trade quotation not found." });
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

    const timestampStr = Date.now().toString(36).toUpperCase();
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `TRD-ORD-${timestampStr}-${randPart}`;

    // 1. Accept quotation
    await insforge.database
      .from("trade_quotations")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", id);

    // 2. Reject competing quotations atomically
    await insforge.database
      .from("trade_quotations")
      .update({ status: "rejected" })
      .eq("rfq_id", quotation.rfq_id)
      .neq("id", id);

    // 3. Update RFQ status
    await insforge.database
      .from("trade_rfqs")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", quotation.rfq_id);

    // 4. Generate Official Trade Order
    const { data: newOrder, error: orderErr } = await insforge.database
      .from("trade_orders")
      .insert([
        {
          order_number: orderNumber,
          quotation_id: quotation.id,
          rfq_id: quotation.rfq_id,
          buyer_id: user.id,
          party_id: quotation.party_id,
          order_status: "order_confirmed",
          currency: quotation.currency,
          total_amount: quotation.total_amount,
          indicative_inr_total: quotation.indicative_inr_total,
          agreed_unit_price: quotation.unit_price,
          quantity: quotation.quantity,
          unit: quotation.unit,
          incoterm: quotation.incoterm,
          port_of_loading: quotation.named_port_of_loading,
          port_of_discharge: quotation.named_port_of_discharge,
          estimated_departure_date: new Date(Date.now() + (quotation.production_dispatch_lead_days || 15) * 86400000)
            .toISOString()
            .split("T")[0],
          buyer_confirmed_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (orderErr) {
      return res.status(500).json({ success: false, error: orderErr.message });
    }

    // 5. Seed order history audit
    await insforge.database.from("trade_order_history").insert([
      {
        order_id: newOrder.id,
        previous_status: null,
        new_status: "order_confirmed",
        changed_by: user.id,
        note: `Order confirmed via quotation ${quotation.quotation_number} (${quotation.incoterm} terms)`,
      },
    ]);

    return res.json({
      success: true,
      message: "Quotation accepted and international trade purchase order confirmed.",
      order: newOrder,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/import-export/orders/:orderNumber (Order Dossier & Shipment Stepper)
router.get("/import-export/orders/:orderNumber", async (req, res) => {
  const { orderNumber } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: order, error } = await insforge.database
      .from("trade_orders")
      .select(
        "*, trade_quotations(*), trade_parties(*, businesses(id, name, city, state, phone, email)), trade_documents(*), trade_order_history(*)"
      )
      .eq("order_number", orderNumber)
      .single();

    if (error || !order) {
      return res.status(404).json({ success: false, error: "Trade order not found." });
    }

    return res.json({ success: true, data: order });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 4. Trade Party Portal (Importers & Exporters)
// ====================================================================

// POST /api/import-export/register (Onboard Trader)
router.post("/import-export/register", authenticateUser, async (req, res) => {
  const user = req.user!;
  const {
    legal_business_name,
    party_type = "importer_exporter",
    country_code = "IN",
    country_name = "India",
    iec_code,
    authorized_dealer_code,
    gstin,
    export_markets = [],
    sourcing_countries = [],
    product_categories = [],
    annual_trade_turnover,
    certifications = [],
    primary_loading_ports = [],
    headline,
    description,
    phone,
  } = req.body;

  if (!legal_business_name || !party_type) {
    return res.status(400).json({
      success: false,
      error: "Legal business name and party type (importer/exporter/importer_exporter) are mandatory.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
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
            business_type: "distributor",
            city: "Mumbai Hub",
            state: "Maharashtra",
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

    const { data: profile, error: profErr } = await insforge.database
      .from("trade_parties")
      .insert([
        {
          business_id: businessId,
          user_id: user.id,
          party_type,
          headline: headline || `${legal_business_name} - Verified Global Trade House`,
          description: description || "Specialized import-export operations, containerized logistics and custom clearance.",
          country_code,
          country_name,
          iec_code: iec_code || null,
          authorized_dealer_code: authorized_dealer_code || null,
          gstin: gstin || null,
          export_markets,
          sourcing_countries,
          product_categories,
          annual_trade_turnover: annual_trade_turnover || "USD 5 Million+",
          certifications,
          primary_loading_ports,
          verification_status: "pending",
          is_public_discovery_enabled: true,
        },
      ])
      .select()
      .single();

    if (profErr) {
      return res.status(500).json({ success: false, error: profErr.message });
    }

    // Assign role
    const assignedRole = party_type === "importer" ? "importer" : party_type === "exporter" ? "exporter" : "importer_exporter";
    await insforge.database
      .from("user_roles")
      .insert([{ user_id: user.id, role: assignedRole }])
      .select()
      .maybeSingle();

    return res.status(201).json({
      success: true,
      message: "International trade profile registered and submitted for DGFT/IEC compliance verification.",
      party: profile,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/import-export/profile (Authenticated Trader Profile)
router.get("/import-export/profile", authenticateUser, async (req, res) => {
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: profile, error } = await insforge.database
      .from("trade_parties")
      .select("*, businesses(*)")
      .eq("user_id", user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ success: false, error: "Trade profile not found." });
    }

    return res.json({ success: true, data: profile });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/import-export/stats (Trader Dashboard Counters)
router.get("/import-export/stats", authenticateUser, async (req, res) => {
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: party } = await insforge.database
      .from("trade_parties")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!party) {
      return res.status(404).json({ success: false, error: "Party not found." });
    }

    const { count: totalProducts } = await insforge.database
      .from("international_products")
      .select("id", { count: "exact", head: true })
      .eq("party_id", party.id);

    const { count: openRfqs } = await insforge.database
      .from("trade_rfq_recipients")
      .select("id", { count: "exact", head: true })
      .eq("party_id", party.id)
      .eq("status", "pending");

    const { count: submittedQuotes } = await insforge.database
      .from("trade_quotations")
      .select("id", { count: "exact", head: true })
      .eq("party_id", party.id);

    const { count: activeOrders } = await insforge.database
      .from("trade_orders")
      .select("id", { count: "exact", head: true })
      .eq("party_id", party.id)
      .in("order_status", [
        "order_confirmed",
        "production_procurement",
        "ready_for_dispatch",
        "export_documentation",
        "customs_processing",
        "shipment_booked",
        "in_transit",
        "arrived_at_destination",
        "import_customs_processing",
      ]);

    const { count: completedOrders } = await insforge.database
      .from("trade_orders")
      .select("id", { count: "exact", head: true })
      .eq("party_id", party.id)
      .eq("order_status", "completed");

    return res.json({
      success: true,
      data: {
        total_products: totalProducts || 0,
        open_rfqs: openRfqs || 0,
        submitted_quotes: submittedQuotes || 0,
        active_orders: activeOrders || 0,
        completed_orders: completedOrders || 0,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/import-export/my-products (Products Managed by Exporter)
router.get("/import-export/my-products", authenticateUser, async (req, res) => {
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: party } = await insforge.database
      .from("trade_parties")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!party) {
      return res.status(404).json({ success: false, error: "Party not found." });
    }

    const { data: products, error } = await insforge.database
      .from("international_products")
      .select("*, trade_categories(name, slug)")
      .eq("party_id", party.id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data: products || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/import-export/products (Create International Product Listing)
router.post("/import-export/products", authenticateUser, async (req, res) => {
  const user = req.user!;
  const {
    name,
    category_id,
    subcategory,
    description,
    hs_code,
    origin_country = "India",
    origin_state,
    material_grade,
    specifications = {},
    quality_certifications = [],
    unit_of_measurement = "metric_ton",
    moq = 20,
    currency = "USD",
    base_price_fob,
    incoterm_basis = "FOB",
    pricing_tiers = [],
    export_lead_time_days = 15,
    packaging_details,
    loading_port = "Nhava Sheva, India",
    eligible_destination_countries = [],
    images = [],
  } = req.body;

  if (!name || !category_id || base_price_fob === undefined) {
    return res.status(400).json({
      success: false,
      error: "Product name, category and FOB unit price are mandatory.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: party } = await insforge.database
      .from("trade_parties")
      .select("id, business_id")
      .eq("user_id", user.id)
      .single();

    if (!party) {
      return res.status(404).json({ success: false, error: "Trade profile not found." });
    }

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;

    const { data: newProduct, error } = await insforge.database
      .from("international_products")
      .insert([
        {
          party_id: party.id,
          business_id: party.business_id,
          category_id,
          subcategory: subcategory || null,
          name,
          slug,
          description: description || null,
          hs_code: hs_code || null,
          origin_country,
          origin_state: origin_state || null,
          material_grade: material_grade || null,
          specifications,
          quality_certifications,
          unit_of_measurement,
          moq: parseInt(moq, 10) || 20,
          currency,
          base_price_fob: parseFloat(base_price_fob),
          incoterm_basis,
          pricing_tiers,
          export_lead_time_days: parseInt(export_lead_time_days, 10) || 15,
          packaging_details: packaging_details || null,
          loading_port,
          eligible_destination_countries,
          images,
          moderation_status: "approved", // auto-approve for testing or flag pending
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
      message: "International product listing created successfully.",
      product: newProduct,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/import-export/my-rfqs (Dispatched RFQs)
router.get("/import-export/my-rfqs", authenticateUser, async (req, res) => {
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: party } = await insforge.database
      .from("trade_parties")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!party) {
      return res.status(404).json({ success: false, error: "Party not found." });
    }

    const { data: recipients, error } = await insforge.database
      .from("trade_rfq_recipients")
      .select("*, trade_rfqs(*, trade_categories(name, slug))")
      .eq("party_id", party.id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data: recipients || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/import-export/quotations (Submit Itemized Trade Quotation)
router.post("/import-export/quotations", authenticateUser, async (req, res) => {
  const user = req.user!;
  const {
    rfq_id,
    product_id,
    quantity,
    unit = "metric_ton",
    currency = "USD",
    unit_price,
    incoterm = "CIF",
    named_port_of_loading = "Nhava Sheva (JNPT), India",
    named_port_of_discharge,
    inland_freight = 0,
    international_ocean_air_freight = 0,
    marine_transit_insurance = 0,
    customs_documentation_charges = 0,
    inspection_charges = 0,
    payment_terms = "30% Advance TT, 70% against BL copy",
    production_dispatch_lead_days = 15,
    estimated_ocean_transit_days = 7,
    valid_until,
    terms_and_conditions,
  } = req.body;

  if (!rfq_id || !quantity || !unit_price || !named_port_of_discharge) {
    return res.status(400).json({
      success: false,
      error: "RFQ reference, quantity, unit price, and destination port of discharge are required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: party } = await insforge.database
      .from("trade_parties")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!party) {
      return res.status(404).json({ success: false, error: "Trader profile not found." });
    }

    const qty = parseFloat(quantity);
    const uPrice = parseFloat(unit_price);
    const subtotal = roundToTwoDecimals(qty * uPrice);
    const inlFrt = roundToTwoDecimals(parseFloat(inland_freight) || 0);
    const intlFrt = roundToTwoDecimals(parseFloat(international_ocean_air_freight) || 0);
    const insChg = roundToTwoDecimals(parseFloat(marine_transit_insurance) || 0);
    const custChg = roundToTwoDecimals(parseFloat(customs_documentation_charges) || 0);
    const inspChg = roundToTwoDecimals(parseFloat(inspection_charges) || 0);

    const totalAmount = roundToTwoDecimals(subtotal + inlFrt + intlFrt + insChg + custChg + inspChg);
    const effectiveUnitCost = roundToTwoDecimals(totalAmount / qty);

    const exchangeRate = REFERENCE_EXCHANGE_RATES[currency] || 86.50;
    const indicativeInrTotal = roundToTwoDecimals(totalAmount * exchangeRate);

    const timestampStr = Date.now().toString(36).toUpperCase();
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const quotationNumber = `TRD-QT-${timestampStr}-${randPart}`;

    const expiryDate = valid_until || new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0];

    const { data: newQuote, error } = await insforge.database
      .from("trade_quotations")
      .insert([
        {
          quotation_number: quotationNumber,
          rfq_id,
          party_id: party.id,
          seller_user_id: user.id,
          product_id: product_id || null,
          quantity: qty,
          unit,
          currency,
          indicative_exchange_rate_to_inr: exchangeRate,
          exchange_rate_source: "Reserve Bank of India Reference Rate",
          exchange_rate_timestamp: new Date().toISOString(),
          unit_price: uPrice,
          subtotal,
          incoterm,
          named_port_of_loading,
          named_port_of_discharge,
          inland_freight: inlFrt,
          international_ocean_air_freight: intlFrt,
          marine_transit_insurance: insChg,
          customs_documentation_charges: custChg,
          inspection_charges: inspChg,
          total_amount: totalAmount,
          indicative_inr_total: indicativeInrTotal,
          effective_unit_cost: effectiveUnitCost,
          payment_terms,
          production_dispatch_lead_days: parseInt(production_dispatch_lead_days, 10) || 15,
          estimated_ocean_transit_days: parseInt(estimated_ocean_transit_days, 10) || 7,
          valid_until: expiryDate,
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
      .from("trade_rfq_recipients")
      .update({ status: "quoted" })
      .eq("rfq_id", rfq_id)
      .eq("party_id", party.id);

    return res.status(201).json({
      success: true,
      message: "International trade quotation submitted successfully.",
      quotation: newQuote,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/import-export/my-orders (Orders Managed by Trader)
router.get("/import-export/my-orders", authenticateUser, async (req, res) => {
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: party } = await insforge.database
      .from("trade_parties")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!party) {
      return res.status(404).json({ success: false, error: "Party not found." });
    }

    const { data: orders, error } = await insforge.database
      .from("trade_orders")
      .select("*, trade_quotations(*), trade_documents(*)")
      .eq("party_id", party.id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data: orders || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/import-export/orders/:id/status (Advance 16-Stage Trade Stepper)
router.put("/import-export/orders/:id/status", authenticateUser, async (req, res) => {
  const { id } = req.params;
  const user = req.user!;
  const {
    order_status,
    container_numbers = [],
    bl_awb_number,
    shipping_line_airline,
    vessel_flight_details,
    actual_departure_date,
    actual_arrival_date,
    delivery_date,
    note,
  } = req.body;

  const validStatuses = [
    "rfq_submitted",
    "quotation_received",
    "quotation_accepted",
    "order_confirmed",
    "production_procurement",
    "ready_for_dispatch",
    "export_documentation",
    "customs_processing",
    "shipment_booked",
    "in_transit",
    "arrived_at_destination",
    "import_customs_processing",
    "delivered",
    "completed",
    "cancelled",
    "disputed",
  ];

  if (!order_status || !validStatuses.includes(order_status)) {
    return res.status(400).json({ success: false, error: "Invalid trade order status." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: existingOrder } = await insforge.database
      .from("trade_orders")
      .select("order_status")
      .eq("id", id)
      .single();

    if (!existingOrder) {
      return res.status(404).json({ success: false, error: "Order not found." });
    }

    const updatePayload: any = {
      order_status,
      updated_at: new Date().toISOString(),
    };
    if (container_numbers.length > 0) updatePayload.container_numbers = container_numbers;
    if (bl_awb_number) updatePayload.bl_awb_number = bl_awb_number;
    if (shipping_line_airline) updatePayload.shipping_line_airline = shipping_line_airline;
    if (vessel_flight_details) updatePayload.vessel_flight_details = vessel_flight_details;
    if (actual_departure_date) updatePayload.actual_departure_date = actual_departure_date;
    if (actual_arrival_date) updatePayload.actual_arrival_date = actual_arrival_date;
    if (delivery_date) updatePayload.delivery_date = delivery_date;

    const { data: updated, error } = await insforge.database
      .from("trade_orders")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    // Append to audit trail
    await insforge.database.from("trade_order_history").insert([
      {
        order_id: id,
        previous_status: existingOrder.order_status,
        new_status: order_status,
        changed_by: user.id,
        note: note || `Order transitioned to ${order_status}`,
      },
    ]);

    return res.json({
      success: true,
      message: `Trade order updated to status '${order_status}'.`,
      order: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/import-export/orders/:id/documents (Upload Trade Document Record)
router.post("/import-export/orders/:id/documents", authenticateUser, async (req, res) => {
  const { id } = req.params;
  const user = req.user!;
  const {
    document_type,
    document_name,
    document_number,
    file_url,
    issuing_authority,
    issue_date,
    expiry_date,
  } = req.body;

  if (!document_type || !document_name || !file_url) {
    return res.status(400).json({
      success: false,
      error: "Document type, document name, and file URL are mandatory.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: doc, error } = await insforge.database
      .from("trade_documents")
      .insert([
        {
          order_id: id,
          document_type,
          document_name,
          document_number: document_number || null,
          file_url,
          issuing_authority: issuing_authority || null,
          issue_date: issue_date || null,
          expiry_date: expiry_date || null,
          verification_status: "submitted",
          uploaded_by: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(201).json({
      success: true,
      message: "Trade document uploaded and queued for operational compliance review.",
      document: doc,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 5. Admin Governance & Platform Operations
// ====================================================================

// GET /api/admin/import-export/stats (Platform Overview)
router.get("/admin/import-export/stats", async (req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { count: totalParties } = await insforge.database
      .from("trade_parties")
      .select("id", { count: "exact", head: true });

    const { count: verifiedParties } = await insforge.database
      .from("trade_parties")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "verified");

    const { count: pendingVerification } = await insforge.database
      .from("trade_parties")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "pending");

    const { count: activeProducts } = await insforge.database
      .from("international_products")
      .select("id", { count: "exact", head: true })
      .eq("moderation_status", "approved");

    const { count: pendingProductApproval } = await insforge.database
      .from("international_products")
      .select("id", { count: "exact", head: true })
      .eq("moderation_status", "pending");

    const { count: totalRfqs } = await insforge.database
      .from("trade_rfqs")
      .select("id", { count: "exact", head: true });

    const { count: totalQuotations } = await insforge.database
      .from("trade_quotations")
      .select("id", { count: "exact", head: true });

    const { count: totalOrders } = await insforge.database
      .from("trade_orders")
      .select("id", { count: "exact", head: true });

    const { count: inTransitShipments } = await insforge.database
      .from("trade_orders")
      .select("id", { count: "exact", head: true })
      .eq("order_status", "in_transit");

    const { count: completedOrders } = await insforge.database
      .from("trade_orders")
      .select("id", { count: "exact", head: true })
      .eq("order_status", "completed");

    return res.json({
      success: true,
      data: {
        total_parties: totalParties || 0,
        verified_parties: verifiedParties || 0,
        pending_verification: pendingVerification || 0,
        active_products: activeProducts || 0,
        pending_product_approval: pendingProductApproval || 0,
        total_rfqs: totalRfqs || 0,
        total_quotations: totalQuotations || 0,
        total_orders: totalOrders || 0,
        in_transit_shipments: inTransitShipments || 0,
        completed_orders: completedOrders || 0,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/import-export/parties (Trader Audit Queue)
router.get("/admin/import-export/parties", async (req, res) => {
  const { status } = req.query as { status?: string };
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    let query = insforge.database
      .from("trade_parties")
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

// POST /api/admin/import-export/parties/:id/verify (Approve / Reject IEC & Trade Credentials)
router.post("/admin/import-export/parties/:id/verify", authenticateUser, async (req, res) => {
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
      .from("trade_parties")
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
      message: `Trade credentials marked as '${newStatus}'.`,
      party: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/import-export/products (Listing Moderation Queue)
router.get("/admin/import-export/products", async (req, res) => {
  const { status } = req.query as { status?: string };
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    let query = insforge.database
      .from("international_products")
      .select("*, trade_categories(name), trade_parties(businesses(name))")
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

// POST /api/admin/import-export/products/:id/moderate (Approve / Reject Listing)
router.post("/admin/import-export/products/:id/moderate", authenticateUser, async (req, res) => {
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
      .from("international_products")
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
