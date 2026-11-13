import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";

const router = Router();

// ====================================================================
// 1. Categories & Subcategories
// ====================================================================

// GET /api/business-services/categories
router.get("/business-services/categories", async (_req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: categories, error: catError } = await insforge.database
      .from("business_service_categories")
      .select("id, name, slug, icon, description, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (catError) {
      return res.status(500).json({ success: false, error: catError.message });
    }

    const { data: subcategories, error: subError } = await insforge.database
      .from("business_service_subcategories")
      .select("id, category_id, name, slug, description, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (subError) {
      return res.status(500).json({ success: false, error: subError.message });
    }

    // Group subcategories under categories
    const categoriesWithSubs = (categories || []).map((cat: any) => ({
      ...cat,
      subcategories: (subcategories || []).filter((sub: any) => sub.category_id === cat.id),
    }));

    return res.json({
      success: true,
      data: categoriesWithSubs,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Failed to fetch categories." });
  }
});

// POST /api/business-services/categories (Admin create)
router.post("/business-services/categories", async (req, res) => {
  const { name, icon, description, sort_order = 0 } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ success: false, error: "Category name is required." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database unavailable." });

  try {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { data, error } = await insforge.database
      .from("business_service_categories")
      .insert([{ name: name.trim(), slug, icon: icon || null, description: description?.trim() || null, sort_order }])
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/business-services/subcategories (Admin create)
router.post("/business-services/subcategories", async (req, res) => {
  const { category_id, name, description, sort_order = 0 } = req.body;
  if (!category_id || !name?.trim()) {
    return res.status(400).json({ success: false, error: "Category ID and subcategory name are required." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database unavailable." });

  try {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { data, error } = await insforge.database
      .from("business_service_subcategories")
      .insert([{ category_id, name: name.trim(), slug, description: description?.trim() || null, sort_order }])
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 2. Services Listings
// ====================================================================

// GET /api/business-services (List & Search with Filters)
router.get("/business-services", async (req, res) => {
  const { category, subcategory, search, city, business_id, sort, minPrice, maxPrice } = req.query as {
    category?: string;
    subcategory?: string;
    search?: string;
    city?: string;
    business_id?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  };

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    let query = insforge.database
      .from("business_services")
      .select("id, business_id, category_id, subcategory_id, title, slug, short_description, full_description, deliverables, pricing_model, starting_price, turnaround_days, is_active, created_at, businesses(id, name, slug, city, state, verification_level), business_service_categories(id, name, slug), business_service_subcategories(id, name, slug)")
      .eq("is_active", true);

    if (business_id) {
      query = query.eq("business_id", business_id);
    }

    if (category?.trim()) {
      query = query.eq("category_id", category.trim());
    }

    if (subcategory?.trim()) {
      query = query.eq("subcategory_id", subcategory.trim());
    }

    if (search?.trim()) {
      query = query.or(`title.ilike.%${search.trim()}%,short_description.ilike.%${search.trim()}%`);
    }

    if (minPrice) {
      query = query.gte("starting_price", Number.parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte("starting_price", Number.parseFloat(maxPrice));
    }

    if (sort === "price_asc") {
      query = query.order("starting_price", { ascending: true });
    } else if (sort === "price_desc") {
      query = query.order("starting_price", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
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
    return res.status(500).json({ success: false, error: err.message || "Failed to search business services." });
  }
});

// GET /api/business-services/:id (Single Service Details)
router.get("/business-services/:id", async (req, res) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: service, error } = await insforge.database
      .from("business_services")
      .select("id, business_id, category_id, subcategory_id, title, slug, short_description, full_description, deliverables, pricing_model, starting_price, turnaround_days, is_active, created_at, businesses(id, name, slug, city, state, phone, email, website, verification_level), business_service_categories(id, name, slug), business_service_subcategories(id, name, slug)")
      .eq("id", id)
      .single();

    if (error || !service) {
      return res.status(404).json({ success: false, error: "Service listing not found." });
    }

    // Fetch portfolio items for this service/business
    const { data: portfolio } = await insforge.database
      .from("business_service_portfolios")
      .select("id, title, image_url, description, created_at")
      .or(`service_id.eq.${id},business_id.eq.${service.business_id}`)
      .limit(10);

    // Fetch provider profile
    const { data: providerProfile } = await insforge.database
      .from("service_provider_profiles")
      .select("headline, bio, experience_years, service_areas, certifications, website_url")
      .eq("business_id", service.business_id)
      .single();

    return res.json({
      success: true,
      data: {
        ...service,
        portfolio: portfolio || [],
        provider_profile: providerProfile || null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Failed to load service details." });
  }
});

// POST /api/business-services (Provider creates new service listing)
router.post("/business-services", async (req, res) => {
  const {
    business_id,
    category_id,
    subcategory_id,
    title,
    short_description,
    full_description,
    deliverables = [],
    pricing_model = "custom_quote",
    starting_price,
    turnaround_days = 3,
  } = req.body;

  if (!business_id || !category_id || !title?.trim() || !short_description?.trim()) {
    return res.status(400).json({
      success: false,
      error: "Business ID, category, title, and short description are required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

    const { data, error } = await insforge.database
      .from("business_services")
      .insert([
        {
          business_id,
          category_id,
          subcategory_id: subcategory_id || null,
          title: title.trim(),
          slug,
          short_description: short_description.trim(),
          full_description: full_description?.trim() || null,
          deliverables: Array.isArray(deliverables) ? deliverables : [],
          pricing_model,
          starting_price: starting_price ? Number.parseFloat(starting_price) : null,
          turnaround_days: Number.parseInt(turnaround_days, 10) || 3,
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
      message: "Business service listed successfully.",
      data,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Failed to create service listing." });
  }
});

// PATCH /api/business-services/:id (Provider updates service)
router.patch("/business-services/:id", async (req, res) => {
  const { id } = req.params;
  const updatePayload = req.body;

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("business_services")
      .update({
        ...updatePayload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.json({
      success: true,
      message: "Service listing updated.",
      data,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 3. Service Providers & Profiles
// ====================================================================

// GET /api/business-services/providers (List Providers)
router.get("/business-services/providers", async (req, res) => {
  const { city, search } = req.query as { city?: string; search?: string };
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    let query = insforge.database
      .from("businesses")
      .select("id, name, legal_name, slug, city, state, pincode, verification_level, created_at, service_provider_profiles(*)")
      .eq("business_type", "service_provider")
      .eq("is_active", true);

    if (city?.trim()) {
      query = query.ilike("city", `%${city.trim()}%`);
    }

    if (search?.trim()) {
      query = query.or(`name.ilike.%${search.trim()}%,city.ilike.%${search.trim()}%`);
    }

    const { data, error } = await query.limit(50);
    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/business-services/providers/:id (Provider Profile & Active Services)
router.get("/business-services/providers/:id", async (req, res) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data: business, error: bizError } = await insforge.database
      .from("businesses")
      .select("id, name, legal_name, slug, city, state, pincode, phone, email, website, verification_level, created_at")
      .eq("id", id)
      .single();

    if (bizError || !business) {
      return res.status(404).json({ success: false, error: "Provider not found." });
    }

    const { data: profile } = await insforge.database
      .from("service_provider_profiles")
      .select("*")
      .eq("business_id", id)
      .single();

    const { data: services } = await insforge.database
      .from("business_services")
      .select("id, title, slug, short_description, pricing_model, starting_price, turnaround_days, created_at, business_service_categories(name)")
      .eq("business_id", id)
      .eq("is_active", true);

    const { data: portfolio } = await insforge.database
      .from("business_service_portfolios")
      .select("id, title, image_url, description, created_at")
      .eq("business_id", id)
      .limit(12);

    return res.json({
      success: true,
      data: {
        ...business,
        profile: profile || null,
        services: services || [],
        portfolio: portfolio || [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/business-services/providers/onboarding (Register / Setup Provider)
router.post("/business-services/providers/onboarding", async (req, res) => {
  const {
    userId,
    name,
    city,
    state,
    pincode,
    gstin,
    pan,
    headline,
    bio,
    experience_years,
    service_areas = [],
    website_url,
  } = req.body;

  if (!userId || !name?.trim() || !city?.trim() || !state?.trim() || !pincode?.trim()) {
    return res.status(400).json({
      success: false,
      error: "User ID, company name, city, state, and pincode are required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

    // 1. Create Business
    const { data: bizData, error: bizError } = await insforge.database
      .from("businesses")
      .insert([
        {
          name: name.trim(),
          slug,
          business_type: "service_provider",
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          gstin: gstin?.trim() || null,
          pan: pan?.trim() || null,
          verification_level: "unverified",
          is_active: true,
        },
      ])
      .select()
      .single();

    if (bizError || !bizData) {
      return res.status(500).json({ success: false, error: bizError?.message || "Failed to create business." });
    }

    const businessId = bizData.id;

    // 2. Link member
    await insforge.database.from("business_members").insert([
      {
        business_id: businessId,
        user_id: userId,
        role_in_business: "owner",
      },
    ]);

    // 3. Add service provider profile
    await insforge.database.from("service_provider_profiles").insert([
      {
        business_id: businessId,
        headline: headline?.trim() || null,
        bio: bio?.trim() || null,
        experience_years: Number.parseInt(experience_years, 10) || 0,
        service_areas: Array.isArray(service_areas) ? service_areas : [],
        website_url: website_url?.trim() || null,
      },
    ]);

    // 4. Assign role in user_roles if not already present
    await insforge.database.from("user_roles").insert([
      {
        user_id: userId,
        role: "service_provider",
        is_primary: false,
      },
    ]);

    return res.status(201).json({
      success: true,
      message: "Service Provider onboarding completed.",
      data: bizData,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 4. Service Requests (Inquiries & Lifecycle)
// ====================================================================

// POST /api/business-services/requests (Customer submits inquiry)
router.post("/business-services/requests", async (req, res) => {
  const {
    customer_id,
    customer_business_id,
    service_id,
    provider_business_id,
    title,
    requirements,
    delivery_city,
    target_timeline,
    budget,
  } = req.body;

  if (!customer_id || !provider_business_id || !title?.trim() || !requirements?.trim()) {
    return res.status(400).json({
      success: false,
      error: "Customer ID, provider business, title, and requirements are required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const requestNumber = `SR-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const { data: requestRecord, error: reqError } = await insforge.database
      .from("service_requests")
      .insert([
        {
          request_number: requestNumber,
          customer_id,
          customer_business_id: customer_business_id || null,
          service_id: service_id || null,
          provider_business_id,
          title: title.trim(),
          requirements: requirements.trim(),
          delivery_city: delivery_city?.trim() || null,
          target_timeline: target_timeline?.trim() || null,
          budget: budget ? Number.parseFloat(budget) : null,
          status: "submitted",
        },
      ])
      .select()
      .single();

    if (reqError || !requestRecord) {
      return res.status(500).json({ success: false, error: reqError?.message || "Failed to submit request." });
    }

    // Insert Status History
    await insforge.database.from("service_request_status_history").insert([
      {
        request_id: requestRecord.id,
        new_status: "submitted",
        changed_by: customer_id,
        note: "Service inquiry submitted by customer.",
      },
    ]);

    return res.status(201).json({
      success: true,
      message: "Service inquiry sent to provider successfully.",
      data: requestRecord,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/business-services/requests (Customer or Provider list)
router.get("/business-services/requests", async (req, res) => {
  const { customer_id, provider_business_id, status } = req.query as {
    customer_id?: string;
    provider_business_id?: string;
    status?: string;
  };

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    let query = insforge.database
      .from("service_requests")
      .select("id, request_number, customer_id, provider_business_id, service_id, title, status, budget, target_timeline, created_at, businesses!provider_business_id(name, city), business_services(title)")
      .order("created_at", { ascending: false });

    if (customer_id) {
      query = query.eq("customer_id", customer_id);
    }

    if (provider_business_id) {
      query = query.eq("provider_business_id", provider_business_id);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.limit(50);
    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/business-services/requests/:id (Detailed Request with Quotations)
router.get("/business-services/requests/:id", async (req, res) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data: requestRecord, error: reqError } = await insforge.database
      .from("service_requests")
      .select("id, request_number, customer_id, customer_business_id, provider_business_id, service_id, title, requirements, delivery_city, target_timeline, budget, status, created_at, businesses!provider_business_id(id, name, city, phone, email, verification_level), business_services(title, pricing_model)")
      .eq("id", id)
      .single();

    if (reqError || !requestRecord) {
      return res.status(404).json({ success: false, error: "Service request not found." });
    }

    // Fetch quotations
    const { data: quotations } = await insforge.database
      .from("service_request_quotations")
      .select("*")
      .eq("request_id", id);

    // Fetch status history
    const { data: history } = await insforge.database
      .from("service_request_status_history")
      .select("*")
      .eq("request_id", id)
      .order("created_at", { ascending: true });

    return res.json({
      success: true,
      data: {
        ...requestRecord,
        quotations: quotations || [],
        history: history || [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/business-services/requests/:id/status (Lifecycle Update)
router.patch("/business-services/requests/:id/status", async (req, res) => {
  const { id } = req.params;
  const { new_status, changed_by, note } = req.body;

  const validStatuses = [
    "submitted", "viewed", "quoted", "accepted", "rejected", "in_progress", "completed", "cancelled"
  ];

  if (!new_status || !validStatuses.includes(new_status) || !changed_by) {
    return res.status(400).json({
      success: false,
      error: "Valid new_status and changed_by user ID are required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data: currentReq } = await insforge.database
      .from("service_requests")
      .select("status")
      .eq("id", id)
      .single();

    const previous_status = currentReq?.status || null;

    const { data: updated, error } = await insforge.database
      .from("service_requests")
      .update({
        status: new_status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    // Insert history
    await insforge.database.from("service_request_status_history").insert([
      {
        request_id: id,
        previous_status,
        new_status,
        changed_by,
        note: note?.trim() || null,
      },
    ]);

    return res.json({
      success: true,
      message: `Service request updated to ${new_status}.`,
      data: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 5. Service Quotations
// ====================================================================

// POST /api/business-services/quotations (Provider submits quotation)
router.post("/business-services/quotations", async (req, res) => {
  const {
    request_id,
    provider_business_id,
    provider_user_id,
    quoted_price,
    scope_of_work,
    deliverables = [],
    turnaround_days = 3,
    valid_until,
    terms,
  } = req.body;

  if (!request_id || !provider_business_id || !provider_user_id || !quoted_price || !scope_of_work) {
    return res.status(400).json({
      success: false,
      error: "Request ID, provider details, quoted price, and scope of work are required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const quotationNumber = `SQT-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const { data: quotation, error: quoteError } = await insforge.database
      .from("service_request_quotations")
      .insert([
        {
          quotation_number: quotationNumber,
          request_id,
          provider_business_id,
          provider_user_id,
          quoted_price: Number.parseFloat(quoted_price),
          scope_of_work: scope_of_work.trim(),
          deliverables: Array.isArray(deliverables) ? deliverables : [],
          turnaround_days: Number.parseInt(turnaround_days, 10) || 3,
          valid_until: valid_until || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          terms: terms?.trim() || null,
          status: "submitted",
        },
      ])
      .select()
      .single();

    if (quoteError || !quotation) {
      return res.status(500).json({ success: false, error: quoteError?.message || "Failed to submit quotation." });
    }

    // Update request status to quoted
    await insforge.database
      .from("service_requests")
      .update({ status: "quoted", updated_at: new Date().toISOString() })
      .eq("id", request_id);

    // Insert history
    await insforge.database.from("service_request_status_history").insert([
      {
        request_id,
        previous_status: "submitted",
        new_status: "quoted",
        changed_by: provider_user_id,
        note: `Provider sent quotation ${quotationNumber} for ₹${Number(quoted_price).toLocaleString("en-IN")}.`,
      },
    ]);

    return res.status(201).json({
      success: true,
      message: "Service quotation submitted successfully.",
      data: quotation,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/business-services/quotations/:id/respond (Customer accepts or rejects quotation)
router.post("/business-services/quotations/:id/respond", async (req, res) => {
  const { id } = req.params;
  const { customer_id, action } = req.body as { customer_id: string; action: "accept" | "reject" };

  if (!customer_id || !["accept", "reject"].includes(action)) {
    return res.status(400).json({
      success: false,
      error: "Customer ID and valid action (accept/reject) are required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data: quotation, error: quoteErr } = await insforge.database
      .from("service_request_quotations")
      .select("id, request_id, quotation_number")
      .eq("id", id)
      .single();

    if (quoteErr || !quotation) {
      return res.status(404).json({ success: false, error: "Quotation not found." });
    }

    const nextQuoteStatus = action === "accept" ? "accepted" : "rejected";
    const nextRequestStatus = action === "accept" ? "accepted" : "rejected";

    // 1. Update quotation
    await insforge.database
      .from("service_request_quotations")
      .update({ status: nextQuoteStatus, updated_at: new Date().toISOString() })
      .eq("id", id);

    // 2. Update request
    await insforge.database
      .from("service_requests")
      .update({ status: nextRequestStatus, updated_at: new Date().toISOString() })
      .eq("id", quotation.request_id);

    // 3. Status History
    await insforge.database.from("service_request_status_history").insert([
      {
        request_id: quotation.request_id,
        previous_status: "quoted",
        new_status: nextRequestStatus,
        changed_by: customer_id,
        note: `Customer ${action === "accept" ? "accepted" : "rejected"} quotation ${quotation.quotation_number}.`,
      },
    ]);

    return res.json({
      success: true,
      message: `Quotation ${action === "accept" ? "accepted" : "rejected"}.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 6. Admin Panel Oversight
// ====================================================================

// GET /api/business-services/admin/stats
router.get("/business-services/admin/stats", async (_req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { count: totalServices } = await insforge.database
      .from("business_services")
      .select("*", { count: "exact", head: true });

    const { count: totalProviders } = await insforge.database
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .eq("business_type", "service_provider");

    const { count: totalRequests } = await insforge.database
      .from("service_requests")
      .select("*", { count: "exact", head: true });

    const { count: totalCategories } = await insforge.database
      .from("business_service_categories")
      .select("*", { count: "exact", head: true });

    return res.json({
      success: true,
      data: {
        totalServices: totalServices || 0,
        totalProviders: totalProviders || 0,
        totalRequests: totalRequests || 0,
        totalCategories: totalCategories || 0,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/business-services/admin/services/:id/moderate
router.patch("/business-services/admin/services/:id/moderate", async (req, res) => {
  const { id } = req.params;
  const { is_active, admin_id, reason } = req.body;

  if (typeof is_active !== "boolean" || !admin_id) {
    return res.status(400).json({ success: false, error: "is_active boolean and admin_id are required." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("business_services")
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    // Audit log
    await insforge.database.from("admin_audit_logs").insert([
      {
        admin_id,
        action: is_active ? "SERVICE_APPROVED" : "SERVICE_SUSPENDED",
        target_type: "business_service",
        target_id: id,
        metadata: { reason: reason || null },
      },
    ]);

    return res.json({ success: true, message: `Service listing status updated to ${is_active ? "active" : "suspended"}.`, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
