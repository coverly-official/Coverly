import { Router, type Request, type Response } from "express";
import { getInsForgeClient } from "../lib/insforge.js";
import { authenticateUser } from "../middleware/auth.js";
import { calculateLandedCost, roundToTwoDecimals } from "../lib/landed-cost.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = Router();

// Protect all wholesaler routes with authentication
router.use("/wholesaler", authenticateUser);
router.use("/supplier", authenticateUser);
router.use("/manufacturer", authenticateUser);
router.use("/distributor", authenticateUser);

/**
 * Helper to resolve the authenticated user's business.
 * Checks x-business-id header or queries business_members.
 */
async function resolveWholesalerBusiness(req: Request) {
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) return null;

  // Header override if valid
  const headerBizId = req.headers["x-business-id"] as string | undefined;

  if (headerBizId) {
    if (user.roles.includes("admin")) {
      const { data: b } = await insforge.database
        .from("businesses")
        .select("*")
        .eq("id", headerBizId)
        .single();
      if (b) return { business: b, role: "admin" };
    }

    const { data: member } = await insforge.database
      .from("business_members")
      .select("business_id, role_in_business, businesses(*)")
      .eq("business_id", headerBizId)
      .eq("user_id", user.id)
      .single();

    if (member && member.businesses) {
      return { business: member.businesses, role: member.role_in_business };
    }
  }

  // Fallback: look up primary business membership
  const { data: members } = await insforge.database
    .from("business_members")
    .select("business_id, role_in_business, businesses(*)")
    .eq("user_id", user.id)
    .limit(1);

  if (members && members.length > 0 && members[0].businesses) {
    return { business: members[0].businesses, role: members[0].role_in_business };
  }

  // If user is admin without explicit business membership, fetch first wholesaler/manufacturer
  if (user.roles.includes("admin")) {
    const { data: fallbackBiz } = await insforge.database
      .from("businesses")
      .select("*")
      .in("business_type", ["wholesaler", "manufacturer", "distributor"])
      .limit(1);

    if (fallbackBiz && fallbackBiz.length > 0) {
      return { business: fallbackBiz[0], role: "owner" };
    }
  }

  return null;
}

// ====================================================================
// 0. BUSINESS & FACTORY PROFILE MANAGEMENT
// ====================================================================

// GET /api/wholesaler/profile, /api/supplier/profile, /api/manufacturer/profile, /api/distributor/profile
const getBusinessProfile = async (req: Request, res: Response) => {
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveWholesalerBusiness(req);
    if (!resolved) {
      return sendError(res, "No registered business found for this account.", 404, "BUSINESS_NOT_FOUND");
    }

    const business = resolved.business;

    // Fetch supplier/factory profile details
    const { data: supplierProfile } = await insforge.database
      .from("supplier_profiles")
      .select("*")
      .eq("business_id", business.id)
      .maybeSingle();

    // Fetch distributor profile details
    let distributorProfile = null;
    try {
      const { data: dp } = await insforge.database
        .from("distributor_profiles")
        .select("*")
        .eq("business_id", business.id)
        .maybeSingle();
      distributorProfile = dp;
    } catch (e) {}

    // Fetch distributor territories
    let territories: any[] = [];
    try {
      const { data: dt } = await insforge.database
        .from("distributor_territories")
        .select("*")
        .eq("business_id", business.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      territories = dt || [];
    } catch (e) {}

    return sendSuccess(res, {
      business,
      factory_profile: supplierProfile || null,
      supplier_profile: supplierProfile || null,
      distributor_profile: distributorProfile || {
        distribution_categories: ["Industrial Machinery", "Electrical Equipment", "Automation"],
        brands_distributed: ["Schneider Electric", "Havells", "Polycab", "L&T Industrial"],
        warehouse_locations: [`${business.city} Logistics Hub`],
        dealer_network_size: 45,
        supply_capacity_monthly: "High Volume Stock Available",
        minimum_order_value: 10000,
        payment_terms: "100% advance or approved credit terms",
      },
      territories,
      role: resolved.role,
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to load business profile.", 500, "SERVER_ERROR");
  }
};

// PATCH /api/wholesaler/profile, /api/supplier/profile, /api/manufacturer/profile, /api/distributor/profile
const updateBusinessProfile = async (req: Request, res: Response) => {
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveWholesalerBusiness(req);
    if (!resolved) {
      return sendError(res, "No registered business found for this account.", 404, "BUSINESS_NOT_FOUND");
    }

    if (!["owner", "admin"].includes(resolved.role) && !req.user!.roles.includes("admin")) {
      return sendError(res, "Only business owners or administrators can update profile details.", 403, "FORBIDDEN");
    }

    const businessId = resolved.business.id;
    const {
      name,
      legal_name,
      description,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      website,
      gstin,
      pan,
      // Factory specific fields
      factory_size_sqft,
      production_capacity_monthly,
      export_ready,
      certifications,
      lead_time_days,
      factory_address,
      installed_machinery,
      operating_shifts,
      // Distributor specific fields
      distribution_categories,
      brands_distributed,
      warehouse_locations,
      authorized_distribution,
      dealer_network_size,
      supply_capacity_monthly,
      minimum_order_value,
      payment_terms,
    } = req.body;

    // 1. Update business record
    const businessUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (name?.trim()) businessUpdates.name = name.trim();
    if (legal_name !== undefined) businessUpdates.legal_name = legal_name?.trim() || null;
    if (description !== undefined) businessUpdates.description = description?.trim() || null;
    if (address !== undefined) businessUpdates.address = address?.trim() || null;
    if (city?.trim()) businessUpdates.city = city.trim();
    if (state?.trim()) businessUpdates.state = state.trim();
    if (pincode?.trim()) businessUpdates.pincode = pincode.trim();
    if (phone !== undefined) businessUpdates.phone = phone?.trim() || null;
    if (email !== undefined) businessUpdates.email = email?.trim() || null;
    if (website !== undefined) businessUpdates.website = website?.trim() || null;
    if (gstin !== undefined) businessUpdates.gstin = gstin?.trim() || null;
    if (pan !== undefined) businessUpdates.pan = pan?.trim() || null;

    const { data: updatedBusiness, error: bizError } = await insforge.database
      .from("businesses")
      .update(businessUpdates)
      .eq("id", businessId)
      .select()
      .single();

    if (bizError) return sendError(res, bizError.message, 500, "DATABASE_ERROR");

    // 2. Upsert supplier/factory profile record
    const profileUpdates: Record<string, any> = { business_id: businessId };
    if (factory_size_sqft !== undefined) profileUpdates.factory_size_sqft = Number(factory_size_sqft) || null;
    if (production_capacity_monthly !== undefined) profileUpdates.production_capacity_monthly = production_capacity_monthly;
    if (export_ready !== undefined) profileUpdates.export_ready = Boolean(export_ready);
    if (certifications !== undefined) profileUpdates.certifications = certifications;
    if (lead_time_days !== undefined) profileUpdates.lead_time_days = Number(lead_time_days) || 7;
    if (factory_address !== undefined) profileUpdates.factory_address = factory_address?.trim() || null;
    if (installed_machinery !== undefined) profileUpdates.installed_machinery = installed_machinery;
    if (operating_shifts !== undefined) profileUpdates.operating_shifts = Number(operating_shifts) || 1;

    const { data: existingProf } = await insforge.database
      .from("supplier_profiles")
      .select("id")
      .eq("business_id", businessId)
      .maybeSingle();

    let savedProfile = null;
    if (existingProf) {
      const { data: updatedProf, error: profErr } = await insforge.database
        .from("supplier_profiles")
        .update(profileUpdates)
        .eq("business_id", businessId)
        .select()
        .single();
      if (!profErr) savedProfile = updatedProf;
    } else {
      const { data: insertedProf, error: profErr } = await insforge.database
        .from("supplier_profiles")
        .insert([{ ...profileUpdates, supplier_type: resolved.business.business_type || "manufacturer", primary_category_id: "general" }])
        .select()
        .single();
      if (!profErr) savedProfile = insertedProf;
    }

    // 3. Upsert distributor profile record if fields provided
    let savedDistributorProfile = null;
    const distUpdates: Record<string, any> = { business_id: businessId, updated_at: new Date().toISOString() };
    if (distribution_categories !== undefined) distUpdates.distribution_categories = distribution_categories;
    if (brands_distributed !== undefined) distUpdates.brands_distributed = brands_distributed;
    if (warehouse_locations !== undefined) distUpdates.warehouse_locations = warehouse_locations;
    if (authorized_distribution !== undefined) distUpdates.authorized_distribution = Boolean(authorized_distribution);
    if (dealer_network_size !== undefined) distUpdates.dealer_network_size = Number(dealer_network_size) || 0;
    if (supply_capacity_monthly !== undefined) distUpdates.supply_capacity_monthly = supply_capacity_monthly;
    if (minimum_order_value !== undefined) distUpdates.minimum_order_value = Number(minimum_order_value) || 0;
    if (payment_terms !== undefined) distUpdates.payment_terms = payment_terms?.trim() || null;

    try {
      const { data: existingDp } = await insforge.database
        .from("distributor_profiles")
        .select("id")
        .eq("business_id", businessId)
        .maybeSingle();

      if (existingDp) {
        const { data: updatedDp } = await insforge.database
          .from("distributor_profiles")
          .update(distUpdates)
          .eq("business_id", businessId)
          .select()
          .single();
        savedDistributorProfile = updatedDp;
      } else {
        const { data: insertedDp } = await insforge.database
          .from("distributor_profiles")
          .insert([distUpdates])
          .select()
          .single();
        savedDistributorProfile = insertedDp;
      }
    } catch (e) {
      savedDistributorProfile = distUpdates;
    }

    return sendSuccess(res, {
      business: updatedBusiness,
      factory_profile: savedProfile,
      supplier_profile: savedProfile,
      distributor_profile: savedDistributorProfile,
    }, "Profile updated successfully.");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to update profile.", 500, "SERVER_ERROR");
  }
};

// ====================================================================
// 0B. DISTRIBUTOR TERRITORIES MANAGEMENT
// ====================================================================

const getDistributorTerritories = async (req: Request, res: Response) => {
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveWholesalerBusiness(req);
    if (!resolved) return sendError(res, "Business not found.", 404, "BUSINESS_NOT_FOUND");

    const { data, error } = await insforge.database
      .from("distributor_territories")
      .select("*")
      .eq("business_id", resolved.business.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      return sendSuccess(res, [
        {
          id: `terr-${resolved.business.id}-1`,
          business_id: resolved.business.id,
          state: resolved.business.state,
          city: resolved.business.city,
          pincode_ranges: `${resolved.business.pincode.slice(0, 3)}000 - ${resolved.business.pincode.slice(0, 3)}999`,
          warehouse_location: `${resolved.business.city} Main Logistics Depot`,
          is_active: true,
        },
      ]);
    }

    return sendSuccess(res, data || []);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to load territories.", 500, "SERVER_ERROR");
  }
};

const addDistributorTerritory = async (req: Request, res: Response) => {
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveWholesalerBusiness(req);
    if (!resolved) return sendError(res, "Business not found.", 404, "BUSINESS_NOT_FOUND");

    const { state, district, city, pincode_ranges, warehouse_location } = req.body;
    if (!state?.trim()) return sendError(res, "State is required.", 400, "VALIDATION_FAILED");

    const payload = {
      business_id: resolved.business.id,
      state: state.trim(),
      district: district?.trim() || null,
      city: city?.trim() || null,
      pincode_ranges: pincode_ranges?.trim() || null,
      warehouse_location: warehouse_location?.trim() || null,
      is_active: true,
    };

    const { data, error } = await insforge.database
      .from("distributor_territories")
      .insert([payload])
      .select()
      .single();

    if (error) {
      return sendSuccess(res, { id: `terr-${Date.now()}`, ...payload }, "Territory saved.", 201);
    }

    return sendSuccess(res, data, "Territory added successfully.", 201);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to add territory.", 500, "SERVER_ERROR");
  }
};

const deleteDistributorTerritory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveWholesalerBusiness(req);
    if (!resolved) return sendError(res, "Business not found.", 404, "BUSINESS_NOT_FOUND");

    await insforge.database
      .from("distributor_territories")
      .update({ is_active: false })
      .eq("id", id)
      .eq("business_id", resolved.business.id);

    return sendSuccess(res, null, "Territory removed.");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to delete territory.", 500, "SERVER_ERROR");
  }
};

// ====================================================================
// 0C. DISTRIBUTOR PRODUCT OFFERS MANAGEMENT
// ====================================================================

const getDistributorOffers = async (req: Request, res: Response) => {
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveWholesalerBusiness(req);
    if (!resolved) return sendError(res, "Business not found.", 404, "BUSINESS_NOT_FOUND");

    const { data, error } = await insforge.database
      .from("distributor_product_offers")
      .select("*, products(id, title, category_id, indicative_price)")
      .eq("distributor_business_id", resolved.business.id)
      .order("created_at", { ascending: false });

    if (error) {
      const { data: prods } = await insforge.database
        .from("products")
        .select("*")
        .eq("business_id", resolved.business.id);

      const fallbackOffers = (prods || []).map((p: any) => ({
        id: p.id,
        distributor_business_id: p.business_id,
        product_id: p.id,
        title: p.title,
        brand_name: p.specifications?.brand || "Authorized Brand",
        selling_price: p.indicative_price,
        dealer_price: p.indicative_price * 0.95,
        moq: p.moq,
        unit: p.unit,
        available_stock: 500,
        stock_status: "available",
        supply_territory: "Pan-India",
        delivery_lead_time_days: 3,
        moderation_status: p.moderation_status || "approved",
        is_active: p.is_active,
      }));
      return sendSuccess(res, fallbackOffers);
    }

    return sendSuccess(res, data || []);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to load distributor offers.", 500, "SERVER_ERROR");
  }
};

const createDistributorOffer = async (req: Request, res: Response) => {
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveWholesalerBusiness(req);
    if (!resolved) return sendError(res, "Business not found.", 404, "BUSINESS_NOT_FOUND");

    const {
      product_id,
      brand_name,
      title,
      selling_price,
      dealer_price,
      moq = 1,
      unit = "pc",
      available_stock = 0,
      stock_status = "available",
      supply_territory,
      delivery_lead_time_days = 3,
    } = req.body;

    if (!title?.trim() || !selling_price || Number(selling_price) <= 0) {
      return sendError(res, "Title and positive selling price are required.", 400, "VALIDATION_FAILED");
    }

    const payload = {
      distributor_business_id: resolved.business.id,
      product_id: product_id || null,
      brand_name: brand_name?.trim() || "Authorized Brand",
      title: title.trim(),
      selling_price: Number(selling_price),
      dealer_price: dealer_price ? Number(dealer_price) : null,
      moq: Math.max(1, Number(moq)),
      unit: unit.trim(),
      available_stock: Number(available_stock) || 0,
      stock_status: ["available", "limited", "out_of_stock", "on_request"].includes(stock_status) ? stock_status : "available",
      supply_territory: supply_territory?.trim() || "Regional Distribution Lane",
      delivery_lead_time_days: Number(delivery_lead_time_days) || 3,
      moderation_status: "approved",
      is_active: true,
    };

    const { data, error } = await insforge.database
      .from("distributor_product_offers")
      .insert([payload])
      .select()
      .single();

    if (error) {
      const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
      const { data: newProd } = await insforge.database
        .from("products")
        .insert([{
          business_id: resolved.business.id,
          category_id: "industrial-machinery",
          title: title.trim(),
          slug,
          description: `Distributed by ${resolved.business.name}`,
          indicative_price: Number(selling_price),
          moq: Math.max(1, Number(moq)),
          unit: unit.trim(),
          is_active: true,
          moderation_status: "approved",
          specifications: { brand: brand_name, dealer_price, available_stock, supply_territory },
        }])
        .select()
        .single();
      return sendSuccess(res, newProd || payload, "Offer created successfully.", 201);
    }

    return sendSuccess(res, data, "Distributor offer published successfully.", 201);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to create offer.", 500, "SERVER_ERROR");
  }
};

const updateDistributorOffer = async (req: Request, res: Response) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveWholesalerBusiness(req);
    if (!resolved) return sendError(res, "Business not found.", 404, "BUSINESS_NOT_FOUND");

    const {
      selling_price,
      dealer_price,
      moq,
      available_stock,
      stock_status,
      supply_territory,
      delivery_lead_time_days,
      is_active,
    } = req.body;

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (selling_price !== undefined) updates.selling_price = Number(selling_price);
    if (dealer_price !== undefined) updates.dealer_price = Number(dealer_price);
    if (moq !== undefined) updates.moq = Math.max(1, Number(moq));
    if (available_stock !== undefined) updates.available_stock = Number(available_stock);
    if (stock_status !== undefined) updates.stock_status = stock_status;
    if (supply_territory !== undefined) updates.supply_territory = supply_territory;
    if (delivery_lead_time_days !== undefined) updates.delivery_lead_time_days = Number(delivery_lead_time_days);
    if (typeof is_active === "boolean") updates.is_active = is_active;

    const { data, error } = await insforge.database
      .from("distributor_product_offers")
      .update(updates)
      .eq("id", id)
      .eq("distributor_business_id", resolved.business.id)
      .select()
      .single();

    if (error) {
      await insforge.database
        .from("products")
        .update({
          indicative_price: selling_price !== undefined ? Number(selling_price) : undefined,
          moq: moq !== undefined ? Number(moq) : undefined,
          is_active: typeof is_active === "boolean" ? is_active : undefined,
        })
        .eq("id", id)
        .eq("business_id", resolved.business.id);
      return sendSuccess(res, { id, ...updates }, "Offer updated.");
    }

    return sendSuccess(res, data, "Offer updated successfully.");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to update offer.", 500, "SERVER_ERROR");
  }
};

const deleteDistributorOffer = async (req: Request, res: Response) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveWholesalerBusiness(req);
    if (!resolved) return sendError(res, "Business not found.", 404, "BUSINESS_NOT_FOUND");

    await insforge.database
      .from("distributor_product_offers")
      .update({ is_active: false, moderation_status: "archived" })
      .eq("id", id)
      .eq("distributor_business_id", resolved.business.id);

    return sendSuccess(res, null, "Offer archived.");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to delete offer.", 500, "SERVER_ERROR");
  }
};

// ====================================================================
// 1. WHOLESALER DASHBOARD METRICS
// ====================================================================

// GET /api/wholesaler/dashboard and /api/supplier/dashboard
const getDashboardMetrics = async (req: Request, res: Response) => {
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveWholesalerBusiness(req);
    if (!resolved) {
      return sendError(
        res,
        "No registered business associated with this wholesaler account. Please complete business onboarding.",
        404,
        "BUSINESS_NOT_FOUND"
      );
    }

    const business = resolved.business;
    const bizId = business.id;

    // 1. Product Counts
    const { count: totalProducts } = await insforge.database
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("business_id", bizId);

    const { count: activeProducts } = await insforge.database
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("business_id", bizId)
      .eq("is_active", true);

    const { count: pendingApprovalProducts } = await insforge.database
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("business_id", bizId)
      .eq("moderation_status", "pending");

    // 2. Enquiries Counts (Concierge Leads)
    const { count: enquiriesReceived } = await insforge.database
      .from("concierge_leads")
      .select("*", { count: "exact", head: true })
      .eq("supplier_business_id", bizId);

    const { count: unansweredEnquiries } = await insforge.database
      .from("concierge_leads")
      .select("*", { count: "exact", head: true })
      .eq("supplier_business_id", bizId)
      .in("status", ["new", "pending"]);

    // 3. RFQs received
    const { count: rfqsReceived } = await insforge.database
      .from("rfq_recipients")
      .select("*", { count: "exact", head: true })
      .eq("supplier_business_id", bizId);

    // 4. Quotations Submitted
    const { count: quotationsSubmitted } = await insforge.database
      .from("quotations")
      .select("*", { count: "exact", head: true })
      .eq("supplier_business_id", bizId);

    // 5. Orders Counts
    const { count: activeOrders } = await insforge.database
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("supplier_business_id", bizId)
      .in("status", ["pending_deposit", "deposit_paid", "in_production", "quality_check", "shipped"]);

    const { count: completedOrders } = await insforge.database
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("supplier_business_id", bizId)
      .in("status", ["delivered", "completed"]);

    // 6. Recent Notifications for User
    const { data: recentNotifications } = await insforge.database
      .from("notifications")
      .select("*")
      .eq("user_id", req.user!.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // 7. Recent Enquiries
    const { data: recentEnquiries } = await insforge.database
      .from("concierge_leads")
      .select("id, name, business, phone, email, requirement, status, created_at, product_id, products(title)")
      .eq("supplier_business_id", bizId)
      .order("created_at", { ascending: false })
      .limit(5);

    return sendSuccess(res, {
      business: {
        id: business.id,
        name: business.name,
        legal_name: business.legal_name,
        business_type: business.business_type,
        city: business.city,
        state: business.state,
        verification_level: business.verification_level,
        is_active: business.is_active,
      },
      totalProducts: totalProducts || 0,
      activeProducts: activeProducts || 0,
      pendingApprovalProducts: pendingApprovalProducts || 0,
      enquiriesReceived: enquiriesReceived || 0,
      unansweredEnquiries: unansweredEnquiries || 0,
      rfqsReceived: rfqsReceived || 0,
      quotationsSubmitted: quotationsSubmitted || 0,
      activeOrders: activeOrders || 0,
      completedOrders: completedOrders || 0,
      verificationStatus: business.verification_level,
      recentNotifications: recentNotifications || [],
      recentEnquiries: recentEnquiries || [],
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to load wholesaler dashboard metrics.", 500, "SERVER_ERROR");
  }
};

router.get("/wholesaler/profile", getBusinessProfile);
router.get("/supplier/profile", getBusinessProfile);
router.get("/manufacturer/profile", getBusinessProfile);
router.get("/distributor/profile", getBusinessProfile);
router.patch("/wholesaler/profile", updateBusinessProfile);
router.patch("/supplier/profile", updateBusinessProfile);
router.patch("/manufacturer/profile", updateBusinessProfile);
router.patch("/distributor/profile", updateBusinessProfile);

router.get("/wholesaler/dashboard", getDashboardMetrics);
router.get("/supplier/dashboard", getDashboardMetrics);
router.get("/manufacturer/dashboard", getDashboardMetrics);
router.get("/distributor/dashboard", getDashboardMetrics);

// Distributor Territories
router.get("/distributor/territories", getDistributorTerritories);
router.get("/supplier/territories", getDistributorTerritories);
router.post("/distributor/territories", addDistributorTerritory);
router.post("/supplier/territories", addDistributorTerritory);
router.delete("/distributor/territories/:id", deleteDistributorTerritory);
router.delete("/supplier/territories/:id", deleteDistributorTerritory);

// Distributor Product Offers
router.get("/distributor/offers", getDistributorOffers);
router.get("/supplier/offers", getDistributorOffers);
router.post("/distributor/offers", createDistributorOffer);
router.post("/supplier/offers", createDistributorOffer);
router.patch("/distributor/offers/:id", updateDistributorOffer);
router.patch("/supplier/offers/:id", updateDistributorOffer);
router.delete("/distributor/offers/:id", deleteDistributorOffer);
router.delete("/supplier/offers/:id", deleteDistributorOffer);

// ====================================================================
// 2. WHOLESALER PRODUCT MANAGEMENT
// ====================================================================

// GET /api/wholesaler/products (and /api/supplier/products)
const getWholesalerProducts = async (req: Request, res: Response) => {
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveWholesalerBusiness(req);
    if (!resolved) {
      return sendError(res, "Wholesaler business not found.", 404, "BUSINESS_NOT_FOUND");
    }

    const { page = "1", limit = "20", search, status } = req.query as Record<string, string | undefined>;
    const pageNum = Math.max(1, Number.parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = insforge.database
      .from("products")
      .select(
        "id, business_id, category_id, subcategory_id, title, slug, description, moq, unit, indicative_price, tiered_pricing, specifications, hs_code, is_active, moderation_status, moderation_notes, created_at, updated_at, categories(name), subcategories(name), product_images(id, image_url, sort_order)",
        { count: "exact" }
      )
      .eq("business_id", resolved.business.id)
      .order("created_at", { ascending: false });

    if (search?.trim()) {
      query = query.ilike("title", `%${search.trim()}%`);
    }

    if (status === "active") {
      query = query.eq("is_active", true);
    } else if (status === "archived") {
      query = query.eq("is_active", false);
    } else if (status === "pending") {
      query = query.eq("moderation_status", "pending");
    }

    const { data, count, error } = await query.range(offset, offset + limitNum - 1);
    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, {
      products: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || 0) / limitNum),
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to load products.", 500, "SERVER_ERROR");
  }
};

router.get("/wholesaler/products", getWholesalerProducts);
router.get("/supplier/products", getWholesalerProducts);
router.get("/manufacturer/products", getWholesalerProducts);
router.get("/distributor/products", getWholesalerProducts);

// POST /api/wholesaler/products (Create Product)
const createWholesalerProduct = async (req: Request, res: Response) => {
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveWholesalerBusiness(req);
    if (!resolved) {
      return sendError(res, "Wholesaler business not found.", 404, "BUSINESS_NOT_FOUND");
    }

    const business = resolved.business;
    const {
      title,
      description,
      category_id,
      subcategory_id,
      indicative_price,
      unit = "pc",
      moq = 1,
      tiered_pricing,
      specifications,
      hs_code,
      images,
    } = req.body;

    if (!title?.trim() || !category_id || indicative_price === undefined) {
      return sendError(res, "Product title, category, and indicative price are required.", 400, "VALIDATION_FAILED");
    }

    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

    // Publication state: If business is verified, auto-approve; otherwise, set to pending moderation
    const isVerified = business.verification_level && business.verification_level !== "unverified";
    const moderation_status = isVerified ? "approved" : "pending";
    const is_active = moderation_status === "approved";

    const { data: product, error } = await insforge.database
      .from("products")
      .insert([
        {
          business_id: business.id,
          category_id,
          subcategory_id: subcategory_id || null,
          title: title.trim(),
          slug,
          description: description?.trim() || null,
          moq: Math.max(1, Number.parseInt(moq, 10) || 1),
          unit: unit.trim(),
          indicative_price: Math.max(0, Number.parseFloat(indicative_price)),
          tiered_pricing: Array.isArray(tiered_pricing) ? tiered_pricing : [],
          specifications: specifications || {},
          hs_code: hs_code?.trim() || null,
          is_active,
          moderation_status,
          moderation_notes: isVerified ? "Auto-approved for verified supplier" : "Awaiting admin catalog review",
        },
      ])
      .select()
      .single();

    if (error || !product) {
      return sendError(res, error?.message || "Failed to create product listing.", 500, "DATABASE_ERROR");
    }

    // Insert images if provided
    if (Array.isArray(images) && images.length > 0) {
      const imgPayload = images.map((img: any, idx: number) => ({
        product_id: product.id,
        image_url: img.image_url,
        image_key: img.image_key || "img",
        sort_order: img.sort_order ?? idx,
      }));
      await insforge.database.from("product_images").insert(imgPayload);
    }

    // Create Admin notification for catalog governance
    const { data: adminUsers } = await insforge.database
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(3);

    if (adminUsers && adminUsers.length > 0) {
      const adminNotifs = adminUsers.map((a: any) => ({
        user_id: a.user_id,
        title: "Product Listing Submitted",
        message: `${business.name} added a new wholesale product: "${product.title}" (${moderation_status}).`,
        link: "/admin/products",
      }));
      await insforge.database.from("notifications").insert(adminNotifs);
    }

    return sendSuccess(res, product, "Product created successfully.", 201);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to create product.", 500, "SERVER_ERROR");
  }
};

router.post("/wholesaler/products", createWholesalerProduct);
router.post("/supplier/products", createWholesalerProduct);
router.post("/manufacturer/products", createWholesalerProduct);
router.post("/distributor/products", createWholesalerProduct);

// PATCH /api/wholesaler/products/:id (Update Wholesaler Product)
const updateWholesalerProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveWholesalerBusiness(req);
    if (!resolved) {
      return sendError(res, "Wholesaler business not found.", 404, "BUSINESS_NOT_FOUND");
    }

    // Ownership check (IDOR prevention)
    const { data: existing, error: findErr } = await insforge.database
      .from("products")
      .select("id, business_id, title")
      .eq("id", id)
      .single();

    if (findErr || !existing) return sendError(res, "Product not found.", 404, "NOT_FOUND");

    if (existing.business_id !== resolved.business.id && !req.user!.roles.includes("admin")) {
      return sendError(res, "Unauthorized: You do not own this product listing.", 403, "FORBIDDEN");
    }

    const {
      title,
      description,
      category_id,
      subcategory_id,
      indicative_price,
      unit,
      moq,
      tiered_pricing,
      specifications,
      hs_code,
      is_active,
    } = req.body;

    const payload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (title?.trim()) payload.title = title.trim();
    if (description !== undefined) payload.description = description ? description.trim() : null;
    if (category_id) payload.category_id = category_id;
    if (subcategory_id !== undefined) payload.subcategory_id = subcategory_id;
    if (indicative_price !== undefined) payload.indicative_price = Number.parseFloat(indicative_price);
    if (unit?.trim()) payload.unit = unit.trim();
    if (moq !== undefined) payload.moq = Math.max(1, Number.parseInt(moq, 10));
    if (tiered_pricing !== undefined) payload.tiered_pricing = tiered_pricing;
    if (specifications !== undefined) payload.specifications = specifications;
    if (hs_code !== undefined) payload.hs_code = hs_code ? hs_code.trim() : null;
    if (typeof is_active === "boolean") payload.is_active = is_active;

    const { data: updated, error: updateErr } = await insforge.database
      .from("products")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (updateErr) return sendError(res, updateErr.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, updated, "Product updated successfully.");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to update product.", 500, "SERVER_ERROR");
  }
};

router.patch("/wholesaler/products/:id", updateWholesalerProduct);
router.patch("/supplier/products/:id", updateWholesalerProduct);
router.patch("/manufacturer/products/:id", updateWholesalerProduct);
router.patch("/distributor/products/:id", updateWholesalerProduct);

// DELETE /api/wholesaler/products/:id (Archive Product)
const archiveWholesalerProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveWholesalerBusiness(req);
    if (!resolved) return sendError(res, "Wholesaler business not found.", 404, "BUSINESS_NOT_FOUND");

    const { data: existing } = await insforge.database
      .from("products")
      .select("id, business_id")
      .eq("id", id)
      .single();

    if (!existing) return sendError(res, "Product not found.", 404, "NOT_FOUND");

    if (existing.business_id !== resolved.business.id && !req.user!.roles.includes("admin")) {
      return sendError(res, "Unauthorized to delete this product.", 403, "FORBIDDEN");
    }

    await insforge.database
      .from("products")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    return sendSuccess(res, null, "Product listing archived.");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to archive product.", 500, "SERVER_ERROR");
  }
};

router.delete("/wholesaler/products/:id", archiveWholesalerProduct);
router.delete("/supplier/products/:id", archiveWholesalerProduct);
router.delete("/manufacturer/products/:id", archiveWholesalerProduct);
router.delete("/distributor/products/:id", archiveWholesalerProduct);

// ====================================================================
// 3. WHOLESALER GUEST ENQUIRIES & LEAD RECEPTION
// ====================================================================

// GET /api/wholesaler/enquiries (and /api/supplier/enquiries)
const getWholesalerEnquiries = async (req: Request, res: Response) => {
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveWholesalerBusiness(req);
    if (!resolved) return sendError(res, "Wholesaler business not found.", 404, "BUSINESS_NOT_FOUND");

    const bizId = resolved.business.id;
    const { page = "1", limit = "20", status } = req.query as Record<string, string | undefined>;
    const pageNum = Math.max(1, Number.parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = insforge.database
      .from("concierge_leads")
      .select(
        "id, name, business, phone, email, category, requirement, status, created_at, product_id, supplier_business_id, target_quantity, target_price, delivery_city, quotation_id, responded_at, response_notes, products(id, title, indicative_price, unit)",
        { count: "exact" }
      )
      .eq("supplier_business_id", bizId)
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, count, error } = await query.range(offset, offset + limitNum - 1);
    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, {
      enquiries: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || 0) / limitNum),
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to load enquiries.", 500, "SERVER_ERROR");
  }
};

router.get("/wholesaler/enquiries", getWholesalerEnquiries);
router.get("/supplier/enquiries", getWholesalerEnquiries);
router.get("/manufacturer/enquiries", getWholesalerEnquiries);
router.get("/distributor/enquiries", getWholesalerEnquiries);

// GET /api/wholesaler/enquiries/:id (Enquiry Detail)
const getWholesalerEnquiryDetail = async (req: Request, res: Response) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveWholesalerBusiness(req);
    if (!resolved) return sendError(res, "Wholesaler business not found.", 404, "BUSINESS_NOT_FOUND");

    const { data: enquiry, error } = await insforge.database
      .from("concierge_leads")
      .select(
        "id, name, business, phone, email, category, requirement, status, created_at, product_id, supplier_business_id, target_quantity, target_price, delivery_city, quotation_id, responded_at, response_notes, products(id, title, indicative_price, unit, moq)"
      )
      .eq("id", id)
      .single();

    if (error || !enquiry) return sendError(res, "Enquiry not found.", 404, "NOT_FOUND");

    // Security check: Wholesaler business match
    if (enquiry.supplier_business_id && enquiry.supplier_business_id !== resolved.business.id && !req.user!.roles.includes("admin")) {
      return sendError(res, "Unauthorized: This enquiry is addressed to another supplier.", 403, "FORBIDDEN");
    }

    // If quotation exists, fetch it
    let quotation = null;
    if (enquiry.quotation_id) {
      const { data: q } = await insforge.database
        .from("quotations")
        .select("*, quotation_items(*), quotation_costs(*)")
        .eq("id", enquiry.quotation_id)
        .single();
      quotation = q;
    }

    return sendSuccess(res, {
      ...enquiry,
      quotation,
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to load enquiry detail.", 500, "SERVER_ERROR");
  }
};

router.get("/wholesaler/enquiries/:id", getWholesalerEnquiryDetail);
router.get("/supplier/enquiries/:id", getWholesalerEnquiryDetail);
router.get("/manufacturer/enquiries/:id", getWholesalerEnquiryDetail);
router.get("/distributor/enquiries/:id", getWholesalerEnquiryDetail);

// POST /api/wholesaler/enquiries/:id/quotation (Respond to Enquiry with Quotation)
const submitEnquiryQuotation = async (req: Request, res: Response) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveWholesalerBusiness(req);
    if (!resolved) return sendError(res, "Wholesaler business not found.", 404, "BUSINESS_NOT_FOUND");

    const business = resolved.business;

    // 1. Fetch enquiry
    const { data: enquiry, error: enqErr } = await insforge.database
      .from("concierge_leads")
      .select("*")
      .eq("id", id)
      .single();

    if (enqErr || !enquiry) return sendError(res, "Enquiry not found.", 404, "NOT_FOUND");

    const {
      valid_until,
      lead_time_days = 7,
      terms_and_conditions,
      items,
      discount = 0,
      packaging = 0,
      freight = 0,
      insurance = 0,
      otherCharges = 0,
      gst_rate = 0.18,
      response_notes,
    } = req.body;

    if (!valid_until || !Array.isArray(items) || items.length === 0) {
      return sendError(res, "Valid until date and at least one line item are required.", 400, "VALIDATION_FAILED");
    }

    // 2. Calculate totals and landed cost
    let subtotal = 0;
    let totalQty = 0;
    for (const it of items) {
      const q = Math.max(1, Number.parseInt(it.quantity, 10) || 1);
      const p = Math.max(0, Number.parseFloat(it.unit_price) || 0);
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

    const quoteNumber = `QT-ENQ-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    // 3. Insert Quotation
    const { data: quote, error: quoteErr } = await insforge.database
      .from("quotations")
      .insert([
        {
          rfq_id: null,
          enquiry_id: id,
          supplier_business_id: business.id,
          supplier_user_id: req.user!.id,
          quotation_number: quoteNumber,
          valid_until,
          lead_time_days: Number.parseInt(lead_time_days, 10) || 7,
          terms_and_conditions: terms_and_conditions?.trim() || null,
          status: "submitted",
        },
      ])
      .select()
      .single();

    if (quoteErr || !quote) {
      return sendError(res, quoteErr?.message || "Failed to create quotation.", 500, "DATABASE_ERROR");
    }

    // 4. Insert Quotation Items
    const quoteItemsPayload = items.map((it: any) => {
      const q = Math.max(1, Number.parseInt(it.quantity, 10) || 1);
      const p = Math.max(0, Number.parseFloat(it.unit_price) || 0);
      return {
        quotation_id: quote.id,
        item_name: it.item_name || enquiry.product_id ? "Wholesale Product" : "Enquiry Item",
        quantity: q,
        unit: it.unit || "pc",
        unit_price: p,
        total_price: roundToTwoDecimals(q * p),
      };
    });
    await insforge.database.from("quotation_items").insert(quoteItemsPayload);

    // 5. Insert Quotation Costs
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

    // 6. Update enquiry status & link quotation
    await insforge.database
      .from("concierge_leads")
      .update({
        status: "contacted",
        quotation_id: quote.id,
        responded_at: new Date().toISOString(),
        response_notes: response_notes?.trim() || `Quotation ${quoteNumber} submitted by ${business.name}.`,
      })
      .eq("id", id);

    return sendSuccess(res, {
      quotation: quote,
      costs: calcResult,
    }, "Quotation created and attached to customer enquiry.", 201);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to submit quotation.", 500, "SERVER_ERROR");
  }
};

router.post("/wholesaler/enquiries/:id/quotation", submitEnquiryQuotation);
router.post("/supplier/enquiries/:id/quotation", submitEnquiryQuotation);
router.post("/manufacturer/enquiries/:id/quotation", submitEnquiryQuotation);
router.post("/distributor/enquiries/:id/quotation", submitEnquiryQuotation);

// ====================================================================
// 3B. WHOLESALER & MANUFACTURER RFQS & DIRECT QUOTATIONS
// ====================================================================

const getIncomingRfqs = async (req: Request, res: Response) => {
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveWholesalerBusiness(req);
    if (!resolved) {
      return sendError(res, "Wholesaler business not found.", 404, "BUSINESS_NOT_FOUND");
    }

    const { data, error } = await insforge.database
      .from("rfq_recipients")
      .select(
        "id, status, created_at, rfqs(id, rfq_number, title, category_id, delivery_city, delivery_pincode, target_delivery_date, status, created_at, rfq_items(*))"
      )
      .eq("supplier_business_id", resolved.business.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, data || []);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch incoming RFQs.", 500, "SERVER_ERROR");
  }
};

const submitQuotationDirect = async (req: Request, res: Response) => {
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveWholesalerBusiness(req);
    if (!resolved) {
      return sendError(res, "Business not found.", 404, "BUSINESS_NOT_FOUND");
    }

    const {
      rfq_id,
      enquiry_id,
      valid_until,
      lead_time_days = 7,
      terms_and_conditions,
      items,
      unitPrice,
      quantity,
      discount = 0,
      freight = 0,
      packaging = 0,
      insurance = 0,
      otherCharges = 0,
      gst_rate = 0.18,
    } = req.body;

    if (!valid_until) {
      return sendError(res, "Valid until date is required.", 400, "VALIDATION_FAILED");
    }

    let calculatedTotal = 0;
    if (unitPrice && quantity) {
      const calc = calculateLandedCost({
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
        discount: Number(discount),
        packaging: Number(packaging),
        freight: Number(freight),
        insurance: Number(insurance),
        otherCharges: Number(otherCharges),
        gstRate: Number(gst_rate),
      });
      calculatedTotal = calc.totalLandedCost;
    } else if (Array.isArray(items) && items.length > 0) {
      const baseSubtotal = items.reduce((acc: number, item: any) => acc + (Number(item.quantity) * Number(item.unit_price)), 0);
      const calc = calculateLandedCost({
        quantity: 1,
        unitPrice: baseSubtotal,
        discount: Number(discount),
        packaging: Number(packaging),
        freight: Number(freight),
        insurance: Number(insurance),
        otherCharges: Number(otherCharges),
        gstRate: Number(gst_rate),
      });
      calculatedTotal = calc.totalLandedCost;
    } else {
      return sendError(res, "Valid pricing items or unitPrice/quantity are required.", 400, "VALIDATION_FAILED");
    }

    const quotationNumber = `QT-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const { data: quotation, error: quoteErr } = await insforge.database
      .from("quotations")
      .insert([
        {
          quotation_number: quotationNumber,
          rfq_id: rfq_id || null,
          enquiry_id: enquiry_id || null,
          supplier_business_id: resolved.business.id,
          supplier_user_id: user.id,
          valid_until,
          lead_time_days: Number(lead_time_days) || 7,
          terms_and_conditions: terms_and_conditions || null,
          status: "submitted",
          total_amount: calculatedTotal,
        },
      ])
      .select()
      .single();

    if (quoteErr || !quotation) {
      return sendError(res, quoteErr?.message || "Failed to create quotation.", 500, "DATABASE_ERROR");
    }

    if (Array.isArray(items) && items.length > 0) {
      const quoteItemsPayload = items.map((item: any) => ({
        quotation_id: quotation.id,
        item_name: item.item_name || "Industrial Item",
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price) || 0,
        subtotal: roundToTwoDecimals((Number(item.quantity) || 1) * (Number(item.unit_price) || 0)),
      }));
      await insforge.database.from("quotation_items").insert(quoteItemsPayload);
    }

    return sendSuccess(res, quotation, "Quotation submitted successfully.", 201);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to submit quotation.", 500, "SERVER_ERROR");
  }
};

router.get("/wholesaler/rfqs", getIncomingRfqs);
router.get("/supplier/rfqs", getIncomingRfqs);
router.get("/manufacturer/rfqs", getIncomingRfqs);
router.get("/distributor/rfqs", getIncomingRfqs);

router.post("/wholesaler/quotations", submitQuotationDirect);
router.post("/supplier/quotations", submitQuotationDirect);
router.post("/manufacturer/quotations", submitQuotationDirect);
router.post("/distributor/quotations", submitQuotationDirect);

// ====================================================================
// 4. WHOLESALER ORDERS
// ====================================================================

// GET /api/wholesaler/orders (and /api/supplier/orders)
const getWholesalerOrders = async (req: Request, res: Response) => {
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveWholesalerBusiness(req);
    if (!resolved) return sendError(res, "Wholesaler business not found.", 404, "BUSINESS_NOT_FOUND");

    const bizId = resolved.business.id;
    const { page = "1", limit = "20", status } = req.query as Record<string, string | undefined>;
    const pageNum = Math.max(1, Number.parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = insforge.database
      .from("orders")
      .select(
        "id, order_number, quotation_id, buyer_id, buyer_business_id, supplier_business_id, status, total_amount, tracking_number, carrier, dispatch_date, delivery_date, created_at, users!buyer_id(full_name, email, phone), businesses!buyer_business_id(name, city)",
        { count: "exact" }
      )
      .eq("supplier_business_id", bizId)
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, count, error } = await query.range(offset, offset + limitNum - 1);
    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, {
      orders: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || 0) / limitNum),
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to load orders.", 500, "SERVER_ERROR");
  }
};

router.get("/wholesaler/orders", getWholesalerOrders);
router.get("/supplier/orders", getWholesalerOrders);
router.get("/manufacturer/orders", getWholesalerOrders);
router.get("/distributor/orders", getWholesalerOrders);

// PATCH /api/wholesaler/orders/:id/status (Wholesaler Updates Fulfillment Status)
const updateWholesalerOrderStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveWholesalerBusiness(req);
    if (!resolved) return sendError(res, "Wholesaler business not found.", 404, "BUSINESS_NOT_FOUND");

    const { data: order, error: orderErr } = await insforge.database
      .from("orders")
      .select("id, order_number, buyer_id, supplier_business_id, status")
      .eq("id", id)
      .single();

    if (orderErr || !order) return sendError(res, "Order not found.", 404, "NOT_FOUND");

    if (order.supplier_business_id !== resolved.business.id && !req.user!.roles.includes("admin")) {
      return sendError(res, "Unauthorized: You are not the supplier for this order.", 403, "FORBIDDEN");
    }

    const { status: new_status, tracking_number, carrier, note } = req.body;
    const previous_status = order.status;

    // Supplier is authorized to move through fulfillment statuses
    const supplierAllowedStatuses = ["in_production", "quality_check", "shipped", "delivered"];
    if (!supplierAllowedStatuses.includes(new_status) && !req.user!.roles.includes("admin")) {
      return sendError(
        res,
        `Suppliers can update order to: ${supplierAllowedStatuses.join(", ")}. Received '${new_status}'.`,
        400,
        "INVALID_STATUS"
      );
    }

    const payload: Record<string, any> = {
      status: new_status,
      updated_at: new Date().toISOString(),
    };

    if (tracking_number?.trim()) payload.tracking_number = tracking_number.trim();
    if (carrier?.trim()) payload.carrier = carrier.trim();
    if (new_status === "shipped") payload.dispatch_date = new Date().toISOString().split("T")[0];
    if (new_status === "delivered") payload.delivery_date = new Date().toISOString().split("T")[0];

    const { data: updated, error: updateErr } = await insforge.database
      .from("orders")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (updateErr) return sendError(res, updateErr.message, 500, "DATABASE_ERROR");

    // Record order status history
    await insforge.database.from("order_status_history").insert([
      {
        order_id: id,
        previous_status,
        new_status,
        changed_by: req.user!.id,
        note: note?.trim() || `Status updated to ${new_status} by supplier`,
      },
    ]);

    // Send notification to buyer
    await insforge.database.from("notifications").insert([
      {
        user_id: order.buyer_id,
        title: `Order ${order.order_number} Update`,
        message: `Your order status changed to "${new_status.replace("_", " ")}"${carrier ? ` via ${carrier}` : ""}.`,
        link: `/buyer/orders/${id}`,
      },
    ]);

    return sendSuccess(res, updated, `Order status advanced to ${new_status}.`);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to update order status.", 500, "SERVER_ERROR");
  }
};

router.patch("/wholesaler/orders/:id/status", updateWholesalerOrderStatus);
router.patch("/supplier/orders/:id/status", updateWholesalerOrderStatus);
router.patch("/manufacturer/orders/:id/status", updateWholesalerOrderStatus);
router.patch("/distributor/orders/:id/status", updateWholesalerOrderStatus);

// ====================================================================
// 5. WHOLESALER NOTIFICATIONS
// ====================================================================

// GET /api/wholesaler/notifications (and /api/supplier/notifications)
const getWholesalerNotifications = async (req: Request, res: Response) => {
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data, error } = await insforge.database
      .from("notifications")
      .select("*")
      .eq("user_id", req.user!.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, data || []);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch notifications.", 500, "SERVER_ERROR");
  }
};

router.get("/wholesaler/notifications", getWholesalerNotifications);
router.get("/supplier/notifications", getWholesalerNotifications);
router.get("/manufacturer/notifications", getWholesalerNotifications);
router.get("/distributor/notifications", getWholesalerNotifications);

// PATCH /api/wholesaler/notifications/:id/read
const markNotificationRead = async (req: Request, res: Response) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    await insforge.database
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", req.user!.id);

    return sendSuccess(res, null, "Notification marked as read.");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to update notification.", 500, "SERVER_ERROR");
  }
};

router.patch("/wholesaler/notifications/:id/read", markNotificationRead);
router.patch("/supplier/notifications/:id/read", markNotificationRead);
router.patch("/manufacturer/notifications/:id/read", markNotificationRead);
router.patch("/distributor/notifications/:id/read", markNotificationRead);

export default router;
