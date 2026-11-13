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

    if (type && ["manufacturer", "wholesaler", "distributor"].includes(type)) {
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
      .single();

    // Fetch products
    const { data: products } = await insforge.database
      .from("products")
      .select("id, title, slug, moq, unit, indicative_price, created_at")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .limit(30);

    return res.json({
      success: true,
      data: {
        ...business,
        supplier_profile: supplierProfile || null,
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

export default router;
