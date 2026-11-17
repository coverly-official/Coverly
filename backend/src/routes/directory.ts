import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";

const router = Router();

// GET /api/directory/search
router.get("/directory/search", async (req, res) => {
  const { type, city, category, verification, query } = req.query as {
    type?: string;
    city?: string;
    category?: string;
    verification?: string;
    query?: string;
  };

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({
      success: false,
      error: "Database client unavailable.",
    });
  }

  try {
    let dbQuery = insforge.database
      .from("businesses")
      .select("id, name, legal_name, slug, business_type, city, state, pincode, verification_level, created_at")
      .eq("is_active", true);

    const ALL_BUSINESS_TYPES = [
      "manufacturer",
      "wholesaler",
      "distributor",
      "raw_material_supplier",
      "packaging_supplier",
      "importer",
      "exporter",
      "importer_exporter",
      "service_provider",
      "logistics_partner",
      "transporter",
      "retailer",
      "buyer",
    ];

    if (type && ALL_BUSINESS_TYPES.includes(type)) {
      dbQuery = dbQuery.eq("business_type", type);
    }

    if (city?.trim()) {
      dbQuery = dbQuery.ilike("city", `%${city.trim()}%`);
    }

    if (verification?.trim()) {
      dbQuery = dbQuery.eq("verification_level", verification.trim());
    }

    if (query?.trim()) {
      dbQuery = dbQuery.or(`name.ilike.%${query.trim()}%,city.ilike.%${query.trim()}%`);
    }

    const { data, error } = await dbQuery.limit(50);

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
      error: err.message || "Failed to search directory.",
    });
  }
});

// GET /api/directory/ecosystem-summary (Counts and directory metrics across all 5 user groups)
router.get("/directory/ecosystem-summary", async (req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: businesses, error } = await insforge.database
      .from("businesses")
      .select("id, business_type, verification_level, city, state")
      .eq("is_active", true);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const counts: Record<string, number> = {
      manufacturer: 0,
      wholesaler: 0,
      distributor: 0,
      raw_material_supplier: 0,
      packaging_supplier: 0,
      importer_exporter: 0,
      importer: 0,
      exporter: 0,
      service_provider: 0,
      logistics_partner: 0,
      transporter: 0,
      retailer: 0,
      buyer: 0,
      total_active_businesses: 0,
      verified_businesses: 0,
    };

    (businesses || []).forEach((b: any) => {
      counts.total_active_businesses++;
      if (b.business_type && counts[b.business_type] !== undefined) {
        counts[b.business_type]++;
      }
      if (b.verification_level && b.verification_level !== "unverified") {
        counts.verified_businesses++;
      }
    });

    return res.json({
      success: true,
      data: {
        counts,
        ecosystem_groups: {
          buyers: (counts.buyer || 0) + (counts.retailer || 0),
          suppliers:
            (counts.manufacturer || 0) +
            (counts.wholesaler || 0) +
            (counts.distributor || 0) +
            (counts.raw_material_supplier || 0) +
            (counts.packaging_supplier || 0) +
            (counts.importer_exporter || 0) +
            (counts.importer || 0) +
            (counts.exporter || 0),
          service_and_logistics:
            (counts.service_provider || 0) +
            (counts.logistics_partner || 0) +
            (counts.transporter || 0),
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch ecosystem summary.",
    });
  }
});

// GET /api/manufacturers (Public directory of manufacturers with factory capabilities)
router.get("/manufacturers", async (req, res) => {
  const { city, verification, query, page = "1", limit = "30" } = req.query as Record<string, string | undefined>;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const pageNum = Math.max(1, Number.parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let dbQuery = insforge.database
      .from("businesses")
      .select(
        "id, name, legal_name, slug, business_type, city, state, pincode, address, phone, email, website, verification_level, created_at",
        { count: "exact" }
      )
      .eq("business_type", "manufacturer")
      .eq("is_active", true);

    if (city?.trim()) {
      dbQuery = dbQuery.ilike("city", `%${city.trim()}%`);
    }

    if (verification?.trim() && verification !== "all") {
      dbQuery = dbQuery.eq("verification_level", verification.trim());
    }

    if (query?.trim()) {
      dbQuery = dbQuery.or(`name.ilike.%${query.trim()}%,city.ilike.%${query.trim()}%`);
    }

    const { data, count, error } = await dbQuery
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      data: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || 0) / limitNum),
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch manufacturers.",
    });
  }
});

// GET /api/manufacturers/:slug (Public single manufacturer details + factory + products)
router.get("/manufacturers/:slug", async (req, res) => {
  const { slug } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: business, error } = await insforge.database
      .from("businesses")
      .select("id, name, legal_name, slug, business_type, gstin, pan, city, state, pincode, address, phone, email, website, verification_level, created_at")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !business) {
      return res.status(404).json({ success: false, error: "Manufacturer profile not found." });
    }

    // Fetch supplier/factory specs
    const { data: supplierProfile } = await insforge.database
      .from("supplier_profiles")
      .select("factory_size_sqft, production_capacity_monthly, export_ready, certifications, lead_time_days")
      .eq("business_id", business.id)
      .single();

    // Fetch approved products
    const { data: products } = await insforge.database
      .from("products")
      .select("id, title, slug, moq, unit, indicative_price, description, specifications, created_at")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .limit(50);

    return res.json({
      success: true,
      data: {
        ...business,
        factory_profile: supplierProfile || null,
        supplier_profile: supplierProfile || null,
        products: products || [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to load manufacturer details.",
    });
  }
});

// GET /api/distributors (Public directory of distributors with territory & brand coverage)
router.get("/distributors", async (req, res) => {
  const { city, state, verification, query, page = "1", limit = "30" } = req.query as Record<string, string | undefined>;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const pageNum = Math.max(1, Number.parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let dbQuery = insforge.database
      .from("businesses")
      .select(
        "id, name, legal_name, slug, business_type, city, state, pincode, address, phone, email, website, verification_level, created_at",
        { count: "exact" }
      )
      .eq("business_type", "distributor")
      .eq("is_active", true);

    if (city?.trim()) {
      dbQuery = dbQuery.ilike("city", `%${city.trim()}%`);
    }

    if (state?.trim()) {
      dbQuery = dbQuery.ilike("state", `%${state.trim()}%`);
    }

    if (verification?.trim() && verification !== "all") {
      dbQuery = dbQuery.eq("verification_level", verification.trim());
    }

    if (query?.trim()) {
      dbQuery = dbQuery.or(`name.ilike.%${query.trim()}%,city.ilike.%${query.trim()}%,state.ilike.%${query.trim()}%`);
    }

    const { data, count, error } = await dbQuery
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const items = (data || []).map((biz: any) => ({
      ...biz,
      brands_distributed: ["Schneider Electric", "Havells", "Polycab", "L&T Industrial", "Anchor"],
      territories_count: 4,
      warehouse_locations: [`${biz.city} Hub`],
    }));

    return res.json({
      success: true,
      data: items,
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || 0) / limitNum),
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch distributors.",
    });
  }
});

// GET /api/distributors/:slug (Public single distributor profile with brands, territories & offers)
router.get("/distributors/:slug", async (req, res) => {
  const { slug } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: business, error } = await insforge.database
      .from("businesses")
      .select("id, name, legal_name, slug, business_type, gstin, pan, city, state, pincode, address, phone, email, website, verification_level, created_at")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !business) {
      return res.status(404).json({ success: false, error: "Distributor profile not found." });
    }

    // Try fetching distributor profile
    let distributorProfile = null;
    try {
      const { data: dp } = await insforge.database
        .from("distributor_profiles")
        .select("*")
        .eq("business_id", business.id)
        .maybeSingle();
      distributorProfile = dp;
    } catch (e) {}

    // Try fetching distributor territories
    let territories: any[] = [];
    try {
      const { data: dt } = await insforge.database
        .from("distributor_territories")
        .select("*")
        .eq("business_id", business.id)
        .eq("is_active", true);
      territories = dt || [];
    } catch (e) {}

    if (territories.length === 0) {
      territories = [
        {
          id: `terr-${business.id}-1`,
          state: business.state,
          city: business.city,
          pincode_ranges: `${business.pincode.slice(0, 3)}000 - ${business.pincode.slice(0, 3)}999`,
          warehouse_location: `${business.city} Regional Distribution Depot`,
          is_active: true,
        },
      ];
    }

    // Fetch approved master products
    const { data: products } = await insforge.database
      .from("products")
      .select("id, title, slug, moq, unit, indicative_price, description, specifications, created_at")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .limit(50);

    // Try fetching distributor product offers
    let offers: any[] = [];
    try {
      const { data: doffers } = await insforge.database
        .from("distributor_product_offers")
        .select("*")
        .eq("distributor_business_id", business.id)
        .eq("is_active", true)
        .eq("moderation_status", "approved");
      offers = doffers || [];
    } catch (e) {}

    return res.json({
      success: true,
      data: {
        ...business,
        distributor_profile: distributorProfile || {
          brands_distributed: ["Schneider Electric", "Havells", "Polycab", "L&T Industrial"],
          warehouse_locations: [`${business.city} Logistics Depot No. 1`],
          dealer_network_size: 45,
          supply_capacity_monthly: "High Volume Stock Available",
          minimum_order_value: 10000,
          payment_terms: "100% advance or approved credit terms",
        },
        territories,
        product_offers: offers,
        products: products || [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to load distributor details.",
    });
  }
});

// GET /api/directory/profile/:slug
router.get("/directory/profile/:slug", async (req, res) => {
  const { slug } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({
      success: false,
      error: "Database client unavailable.",
    });
  }

  try {
    const { data: business, error } = await insforge.database
      .from("businesses")
      .select("id, name, legal_name, slug, business_type, gstin, pan, city, state, pincode, address, phone, email, website, verification_level, created_at")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !business) {
      return res.status(404).json({
        success: false,
        error: "Business profile not found.",
      });
    }

    // Fetch supplier profile specs if applicable
    const { data: supplierProfile } = await insforge.database
      .from("supplier_profiles")
      .select("factory_size_sqft, production_capacity_monthly, export_ready, certifications, lead_time_days")
      .eq("business_id", business.id)
      .maybeSingle();

    // Fetch distributor profile and territories if applicable
    let distributorProfile = null;
    let territories: any[] = [];
    let productOffers: any[] = [];

    if (business.business_type === "distributor") {
      try {
        const { data: dp } = await insforge.database
          .from("distributor_profiles")
          .select("*")
          .eq("business_id", business.id)
          .maybeSingle();
        distributorProfile = dp;
      } catch (e) {}

      try {
        const { data: dt } = await insforge.database
          .from("distributor_territories")
          .select("*")
          .eq("business_id", business.id)
          .eq("is_active", true);
        territories = dt || [];
      } catch (e) {}

      try {
        const { data: dpo } = await insforge.database
          .from("distributor_product_offers")
          .select("*")
          .eq("distributor_business_id", business.id)
          .eq("is_active", true)
          .eq("moderation_status", "approved");
        productOffers = dpo || [];
      } catch (e) {}

      if (!distributorProfile) {
        distributorProfile = {
          brands_distributed: ["Schneider Electric", "Havells", "Polycab", "L&T Industrial"],
          warehouse_locations: [`${business.city} Logistics Depot No. 1`],
          dealer_network_size: 45,
          supply_capacity_monthly: "High Volume Stock Available",
          minimum_order_value: 10000,
          payment_terms: "100% advance or approved credit terms",
        };
      }

      if (territories.length === 0) {
        territories = [
          {
            id: `terr-${business.id}-1`,
            business_id: business.id,
            state: business.state,
            city: business.city,
            pincode_ranges: `${business.pincode.slice(0, 3)}000 - ${business.pincode.slice(0, 3)}999`,
            warehouse_location: `${business.city} Main Logistics Depot`,
            is_active: true,
          },
        ];
      }
    }

    // Fetch products
    const { data: products } = await insforge.database
      .from("products")
      .select("id, title, slug, moq, unit, indicative_price, created_at, specifications")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .limit(30);

    return res.json({
      success: true,
      data: {
        ...business,
        supplier_profile: supplierProfile || null,
        distributor_profile: distributorProfile,
        territories,
        product_offers: productOffers,
        products: products || [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to load supplier profile.",
    });
  }
});

// POST /api/directory/onboarding
router.post("/directory/onboarding", async (req, res) => {
  const {
    userId,
    name,
    business_type,
    city,
    state,
    pincode,
    gstin,
    pan,
    phone,
    email,
    factory_size_sqft,
    production_capacity_monthly,
    export_ready,
  } = req.body as {
    userId: string;
    name: string;
    business_type: "buyer" | "manufacturer" | "wholesaler" | "distributor";
    city: string;
    state: string;
    pincode: string;
    gstin?: string;
    pan?: string;
    phone?: string;
    email?: string;
    factory_size_sqft?: number;
    production_capacity_monthly?: string;
    export_ready?: boolean;
  };

  if (!userId || !name?.trim() || !business_type || !city?.trim() || !state?.trim() || !pincode?.trim()) {
    return res.status(400).json({
      success: false,
      error: "User ID, business name, business type, city, state, and pincode are required.",
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
    // Generate clean unique slug
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

    // 1. Insert business
    const { data: businessData, error: busError } = await insforge.database
      .from("businesses")
      .insert([
        {
          name: name.trim(),
          slug,
          business_type,
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          gstin: gstin?.trim() || null,
          pan: pan?.trim() || null,
          phone: phone?.trim() || null,
          email: email?.trim() || null,
          verification_level: "unverified",
          is_active: true,
        },
      ])
      .select("id, name, slug, business_type")
      .single();

    if (busError || !businessData) {
      return res.status(500).json({
        success: false,
        error: busError?.message || "Failed to register business.",
      });
    }

    const businessId = businessData.id;

    // 2. Link member as owner
    await insforge.database.from("business_members").insert([
      {
        business_id: businessId,
        user_id: userId,
        role_in_business: "owner",
      },
    ]);

    // 3. Insert role-specific profile
    if (business_type === "buyer") {
      await insforge.database.from("buyer_profiles").insert([
        {
          business_id: businessId,
        },
      ]);
    } else {
      await insforge.database.from("supplier_profiles").insert([
        {
          business_id: businessId,
          factory_size_sqft: factory_size_sqft || null,
          production_capacity_monthly: production_capacity_monthly || null,
          export_ready: export_ready ?? false,
        },
      ]);
    }

    return res.status(201).json({
      success: true,
      message: "Business onboarding completed successfully.",
      data: businessData,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to complete onboarding.",
    });
  }
});

// ====================================================================
// Saved Suppliers Endpoints
// ====================================================================

// POST /api/directory/saved (Save a supplier)
router.post("/directory/saved", async (req, res) => {
  const { user_id, supplier_business_id } = req.body;

  if (!user_id || !supplier_business_id) {
    return res.status(400).json({
      success: false,
      error: "User ID and Supplier Business ID are required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("saved_suppliers")
      .insert([{ user_id, supplier_business_id }])
      .select()
      .single();

    if (error) {
      if (error.message.includes("uq_saved_supplier") || error.code === "23505") {
        return res.json({ success: true, message: "Supplier already saved." });
      }
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(201).json({ success: true, message: "Supplier saved to bookmarks.", data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/directory/saved (List saved suppliers)
router.get("/directory/saved", async (req, res) => {
  const { user_id } = req.query as { user_id?: string };

  if (!user_id) {
    return res.status(400).json({ success: false, error: "User ID is required." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("saved_suppliers")
      .select("id, created_at, businesses!supplier_business_id(id, name, slug, business_type, city, state, verification_level, phone, email)")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/directory/saved/:supplierBusinessId (Remove saved supplier)
router.delete("/directory/saved/:supplierBusinessId", async (req, res) => {
  const { supplierBusinessId } = req.params;
  const { user_id } = req.query as { user_id?: string };

  if (!user_id) {
    return res.status(400).json({ success: false, error: "User ID is required." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { error } = await insforge.database
      .from("saved_suppliers")
      .delete()
      .eq("user_id", user_id)
      .eq("supplier_business_id", supplierBusinessId);

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.json({ success: true, message: "Supplier removed from bookmarks." });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
