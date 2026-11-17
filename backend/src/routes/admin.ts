import { Router } from "express";
import crypto from "crypto";
import { getInsForgeClient } from "../lib/insforge.js";
import { authenticateUser, requireAdmin } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = Router();

// Protect all admin endpoints with authentication and admin role verification
router.use("/admin", authenticateUser, requireAdmin);

// ====================================================================
// 1. ADMIN METRICS & DASHBOARD
// ====================================================================

// GET /api/admin/metrics & GET /api/admin/dashboard (Comprehensive Platform Metrics from Real DB)
const handleAdminMetrics = async (_req: any, res: any) => {
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    // 1. Products Metrics
    const { count: totalProducts } = await insforge.database
      .from("products")
      .select("*", { count: "exact", head: true });

    const { count: activeProducts } = await insforge.database
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    const archivedProducts = (totalProducts || 0) - (activeProducts || 0);

    // 2. Business Metrics
    const { count: totalBusinesses } = await insforge.database
      .from("businesses")
      .select("*", { count: "exact", head: true });

    const { count: totalSuppliers } = await insforge.database
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .in("business_type", ["manufacturer", "wholesaler", "distributor"]);

    const { count: totalManufacturers } = await insforge.database
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .eq("business_type", "manufacturer");

    const { count: verifiedSuppliers } = await insforge.database
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .neq("verification_level", "unverified");

    const { count: verifiedManufacturers } = await insforge.database
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .eq("business_type", "manufacturer")
      .neq("verification_level", "unverified");

    const { count: totalDistributors } = await insforge.database
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .eq("business_type", "distributor");

    const { count: verifiedDistributors } = await insforge.database
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .eq("business_type", "distributor")
      .neq("verification_level", "unverified");

    let activeDistributorOffers = 0;
    let pendingDistributorOffers = 0;
    try {
      const { count: aOffers } = await insforge.database
        .from("distributor_product_offers")
        .select("*", { count: "exact", head: true })
        .eq("moderation_status", "approved")
        .eq("is_active", true);
      activeDistributorOffers = aOffers || 0;

      const { count: pOffers } = await insforge.database
        .from("distributor_product_offers")
        .select("*", { count: "exact", head: true })
        .eq("moderation_status", "pending");
      pendingDistributorOffers = pOffers || 0;
    } catch (e) {}

    let activeTerritories = 0;
    try {
      const { count: terrCount } = await insforge.database
        .from("distributor_territories")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);
      activeTerritories = terrCount || 0;
    } catch (e) {}

    // 3. User Metrics
    const { count: totalUsers } = await insforge.database
      .from("users")
      .select("*", { count: "exact", head: true });

    // 4. Verifications Queue
    const { count: pendingVerifications } = await insforge.database
      .from("supplier_verifications")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // 5. RFQs & Enquiries & Quotations
    const { count: totalRfqs } = await insforge.database
      .from("rfqs")
      .select("*", { count: "exact", head: true });

    const { count: activeRfqs } = await insforge.database
      .from("rfqs")
      .select("*", { count: "exact", head: true })
      .in("status", ["submitted", "in_review", "matched", "quotes_received"]);

    const { count: totalConciergeLeads } = await insforge.database
      .from("concierge_leads")
      .select("*", { count: "exact", head: true });

    const { count: quotationsSubmitted } = await insforge.database
      .from("quotations")
      .select("*", { count: "exact", head: true });

    const { count: pendingProductsCount } = await insforge.database
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("moderation_status", "pending");

    // 6. Categories & Services
    const { count: activeCategories } = await insforge.database
      .from("product_categories")
      .select("*", { count: "exact", head: true });

    const { count: totalBusinessServices } = await insforge.database
      .from("business_services")
      .select("*", { count: "exact", head: true });

    const { count: totalServiceRequests } = await insforge.database
      .from("service_requests")
      .select("*", { count: "exact", head: true });

    // 7. Orders, Ecosystem Participants, Shipments & Recent Activities
    const { data: orders } = await insforge.database
      .from("orders")
      .select("total_amount, status");

    const totalOrders = orders?.length || 0;
    const activeOrders =
      orders?.filter((o: any) => !["completed", "cancelled", "delivered"].includes(o.status)).length || 0;
    const totalGmv = orders?.reduce((acc: number, curr: any) => acc + (Number(curr.total_amount) || 0), 0) || 0;

    const { count: openTickets } = await insforge.database
      .from("support_tickets")
      .select("*", { count: "exact", head: true })
      .eq("status", "open");

    const { count: totalWholesalers } = await insforge.database
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .eq("business_type", "wholesaler");

    let activeBuyers = 0;
    let activeRetailers = 0;
    let totalServiceProviders = 0;
    let totalTransporters = 0;
    let activeShipments = 0;
    let recentActivities: any[] = [];

    try {
      const { count: buyerRoles } = await insforge.database
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .in("role", ["buyer", "buyer_supplier"]);
      activeBuyers = buyerRoles || 0;
    } catch {}

    try {
      const { count: retailerBiz } = await insforge.database
        .from("businesses")
        .select("*", { count: "exact", head: true })
        .eq("business_type", "retailer");
      const { count: retailerRoles } = await insforge.database
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "retailer");
      activeRetailers = Math.max(retailerBiz || 0, retailerRoles || 0);
    } catch {}

    try {
      const { count: spCount } = await insforge.database
        .from("service_provider_profiles")
        .select("*", { count: "exact", head: true });
      const { count: spRoles } = await insforge.database
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "service_provider");
      totalServiceProviders = Math.max(spCount || 0, spRoles || 0);
    } catch {}

    try {
      const { count: trCount } = await insforge.database
        .from("transporter_profiles")
        .select("*", { count: "exact", head: true });
      const { count: trRoles } = await insforge.database
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "transporter");
      totalTransporters = Math.max(trCount || 0, trRoles || 0);
    } catch {}

    try {
      const { count: logBookings } = await insforge.database
        .from("logistics_bookings")
        .select("*", { count: "exact", head: true })
        .not("status", "in", '("delivered","completed","cancelled")');
      const { count: trips } = await insforge.database
        .from("transport_trips")
        .select("*", { count: "exact", head: true })
        .not("status", "in", '("delivered","completed","cancelled")');
      activeShipments = (logBookings || 0) + (trips || 0);
    } catch {}

    try {
      const { data: logs } = await insforge.database
        .from("audit_logs")
        .select("id, action, target_type, target_id, metadata, created_at, admin_id, users!admin_id(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(8);
      recentActivities = logs || [];
    } catch {}

    return sendSuccess(res, {
      totalGmv,
      totalOrders,
      activeOrders,
      totalRfqs: totalRfqs || 0,
      activeRfqs: activeRfqs || 0,
      totalConciergeLeads: totalConciergeLeads || 0,
      totalEnquiries: (totalRfqs || 0) + (totalConciergeLeads || 0),
      quotationsSubmitted: quotationsSubmitted || 0,
      totalQuotations: quotationsSubmitted || 0,
      totalBusinesses: totalBusinesses || 0,
      totalSuppliers: totalSuppliers || 0,
      totalManufacturers: totalManufacturers || 0,
      totalWholesalers: totalWholesalers || 0,
      totalDistributors: totalDistributors || 0,
      activeBuyers,
      activeRetailers,
      totalServiceProviders,
      totalTransporters,
      activeShipments,
      verifiedSuppliers: verifiedSuppliers || 0,
      verifiedManufacturers: verifiedManufacturers || 0,
      verifiedDistributors: verifiedDistributors || 0,
      activeDistributorOffers: activeDistributorOffers || 0,
      pendingDistributorOffers: pendingDistributorOffers || 0,
      activeTerritories: activeTerritories || 0,
      totalUsers: totalUsers || 0,
      totalProducts: totalProducts || 0,
      activeProducts: activeProducts || 0,
      archivedProducts: archivedProducts >= 0 ? archivedProducts : 0,
      pendingProductApprovals: pendingProductsCount || 0,
      pendingProducts: pendingProductsCount || 0,
      pendingVerifications: pendingVerifications || 0,
      activeCategories: activeCategories || 0,
      totalBusinessServices: totalBusinessServices || 0,
      totalServiceRequests: totalServiceRequests || 0,
      openTickets: openTickets || 0,
      pendingComplaints: openTickets || 0,
      recentActivities,
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to aggregate admin metrics.", 500, "SERVER_ERROR");
  }
};

router.get("/admin/metrics", handleAdminMetrics);
router.get("/admin/dashboard", handleAdminMetrics);

// ====================================================================
// 2. PRODUCT MANAGEMENT (CRUD, Moderation, Image Management)
// ====================================================================

// GET /api/admin/products (List products with filtering & pagination)
router.get("/admin/products", async (req, res) => {
  const { search, category, is_active, page = "1", limit = "50" } = req.query as Record<string, string | undefined>;

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const pageNum = Math.max(1, Number.parseInt(page || "1", 10));
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit || "50", 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = insforge.database
      .from("products")
      .select(
        "id, business_id, category_id, subcategory_id, title, slug, description, moq, unit, indicative_price, tiered_pricing, specifications, hs_code, is_active, created_at, updated_at, businesses(id, name, slug, city, state, verification_level), product_images(id, image_url, sort_order)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (search?.trim()) {
      query = query.ilike("title", `%${search.trim()}%`);
    }

    if (category?.trim() && category !== "all") {
      query = query.eq("category_id", category.trim());
    }

    if (is_active !== undefined && is_active !== "all") {
      query = query.eq("is_active", is_active === "true");
    }

    const { data, count, error } = await query.range(offset, offset + limitNum - 1);
    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, {
      items: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || 0) / limitNum),
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch products.", 500, "SERVER_ERROR");
  }
});

// GET /api/admin/products/pending (Moderation queue for products)
router.get("/admin/products/pending", async (req, res) => {
  const { page = "1", limit = "50" } = req.query as Record<string, string | undefined>;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const pageNum = Math.max(1, Number.parseInt(page || "1", 10));
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit || "50", 10)));
    const offset = (pageNum - 1) * limitNum;

    const { data, count, error } = await insforge.database
      .from("products")
      .select(
        "id, business_id, category_id, subcategory_id, title, slug, description, moq, unit, indicative_price, tiered_pricing, specifications, hs_code, is_active, moderation_status, moderation_notes, created_at, updated_at, businesses(id, name, slug, city, state, verification_level), product_images(id, image_url, sort_order)",
        { count: "exact" }
      )
      .eq("moderation_status", "pending")
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, {
      items: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || 0) / limitNum),
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch pending products.", 500, "SERVER_ERROR");
  }
});

// GET /api/admin/products/:id (Single product details)
router.get("/admin/products/:id", async (req, res) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: product, error } = await insforge.database
      .from("products")
      .select(
        "id, business_id, category_id, subcategory_id, title, slug, description, moq, unit, indicative_price, tiered_pricing, specifications, hs_code, is_active, created_at, updated_at, businesses(id, name, slug, city, state, verification_level, phone, email), product_images(id, image_url, image_key, sort_order)"
      )
      .eq("id", id)
      .single();

    if (error || !product) return sendError(res, "Product not found.", 404, "NOT_FOUND");
    return sendSuccess(res, product);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch product.", 500, "SERVER_ERROR");
  }
});

// POST /api/admin/products (Admin creates product)
router.post("/admin/products", async (req, res) => {
  const admin = req.user!;
  const {
    business_id,
    category_id,
    subcategory_id,
    title,
    description,
    moq = 1,
    unit = "pc",
    indicative_price,
    tiered_pricing,
    specifications,
    hs_code,
    is_active = true,
  } = req.body;

  if (!business_id || !category_id || !title?.trim() || indicative_price === undefined) {
    return sendError(res, "Business ID, Category ID, Title, and Indicative Price are required.", 400, "VALIDATION_FAILED");
  }

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

    const { data: product, error } = await insforge.database
      .from("products")
      .insert([
        {
          business_id,
          category_id,
          subcategory_id: subcategory_id || null,
          title: title.trim(),
          slug,
          description: description?.trim() || null,
          moq: Number.parseInt(moq, 10) || 1,
          unit: unit?.trim() || "pc",
          indicative_price: Number.parseFloat(indicative_price),
          tiered_pricing: Array.isArray(tiered_pricing) ? tiered_pricing : [],
          specifications: specifications || {},
          hs_code: hs_code?.trim() || null,
          is_active: Boolean(is_active),
        },
      ])
      .select()
      .single();

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    // Audit log
    await insforge.database.from("admin_audit_logs").insert([
      {
        admin_id: admin.id,
        action: "PRODUCT_CREATED",
        target_type: "product",
        target_id: product.id,
        metadata: { title: product.title, business_id },
      },
    ]);

    return sendSuccess(res, product, "Product created successfully.", 201);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to create product.", 500, "SERVER_ERROR");
  }
});

// PATCH /api/admin/products/:id (Admin edit product)
router.patch("/admin/products/:id", async (req, res) => {
  const admin = req.user!;
  const { id } = req.params;
  const {
    category_id,
    subcategory_id,
    title,
    description,
    moq,
    unit,
    indicative_price,
    tiered_pricing,
    specifications,
    hs_code,
    is_active,
  } = req.body;

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (category_id) updatePayload.category_id = category_id;
    if (subcategory_id !== undefined) updatePayload.subcategory_id = subcategory_id;
    if (title?.trim()) updatePayload.title = title.trim();
    if (description !== undefined) updatePayload.description = description ? description.trim() : null;
    if (moq !== undefined) updatePayload.moq = Number.parseInt(moq, 10);
    if (unit?.trim()) updatePayload.unit = unit.trim();
    if (indicative_price !== undefined) updatePayload.indicative_price = Number.parseFloat(indicative_price);
    if (tiered_pricing !== undefined) updatePayload.tiered_pricing = tiered_pricing;
    if (specifications !== undefined) updatePayload.specifications = specifications;
    if (hs_code !== undefined) updatePayload.hs_code = hs_code ? hs_code.trim() : null;
    if (typeof is_active === "boolean") updatePayload.is_active = is_active;

    const { data: updated, error } = await insforge.database
      .from("products")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    // Audit log
    await insforge.database.from("admin_audit_logs").insert([
      {
        admin_id: admin.id,
        action: "PRODUCT_UPDATED",
        target_type: "product",
        target_id: id,
        metadata: { title: updated.title },
      },
    ]);

    return sendSuccess(res, updated, "Product updated successfully.");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to update product.", 500, "SERVER_ERROR");
  }
});

// PATCH /api/admin/products/:id/moderate & /api/admin/products/:id/moderation
const handleProductModeration = async (req: any, res: any) => {
  const admin = req.user!;
  const { id } = req.params;
  const { is_active, status, reason } = req.body;

  const effectiveActive = typeof is_active === "boolean" ? is_active : status === "approved";
  const moderation_status = effectiveActive ? "approved" : "rejected";

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data, error } = await insforge.database
      .from("products")
      .update({
        is_active: effectiveActive,
        moderation_status,
        moderation_notes: reason || (effectiveActive ? "Approved by admin" : "Rejected by admin moderation"),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    // Audit Log
    await insforge.database.from("admin_audit_logs").insert([
      {
        admin_id: admin.id,
        action: effectiveActive ? "PRODUCT_APPROVED" : "PRODUCT_SUSPENDED",
        target_type: "product",
        target_id: id,
        metadata: { reason: reason || null, moderation_status },
      },
    ]);

    // Real-time Notification to Wholesaler Team Members
    if (data?.business_id) {
      const { data: members } = await insforge.database
        .from("business_members")
        .select("user_id")
        .eq("business_id", data.business_id);

      if (members && members.length > 0) {
        const notifs = members.map((m: any) => ({
          user_id: m.user_id,
          title: effectiveActive ? "Product Listing Approved" : "Product Listing Moderated",
          message: effectiveActive
            ? `Your wholesale product "${data.title}" was approved by admin and is now live on the marketplace.`
            : `Your wholesale product "${data.title}" was rejected: ${reason || "Does not meet catalog guidelines"}.`,
          link: "/supplier/products",
        }));
        await insforge.database.from("notifications").insert(notifs);
      }
    }

    return sendSuccess(res, data, `Product listing status updated to ${effectiveActive ? "active (approved)" : "archived (rejected)"}.`);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to moderate product.", 500, "SERVER_ERROR");
  }
};

router.patch("/admin/products/:id/moderate", handleProductModeration);
router.patch("/admin/products/:id/moderation", handleProductModeration);

// POST /api/admin/products/:id/images (Admin upload/attach product image)
router.post("/admin/products/:id/images", async (req, res) => {
  const admin = req.user!;
  const { id } = req.params;
  const { image_url, image_key, sort_order = 0 } = req.body;

  if (!image_url?.trim()) {
    return sendError(res, "image_url is required.", 400, "VALIDATION_FAILED");
  }

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data, error } = await insforge.database
      .from("product_images")
      .insert([
        {
          product_id: id,
          image_url: image_url.trim(),
          image_key: image_key || "img",
          sort_order: Number.parseInt(sort_order, 10) || 0,
        },
      ])
      .select()
      .single();

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    // Audit Log
    await insforge.database.from("admin_audit_logs").insert([
      {
        admin_id: admin.id,
        action: "PRODUCT_IMAGE_ADDED",
        target_type: "product",
        target_id: id,
        metadata: { image_id: data.id, image_url },
      },
    ]);

    return sendSuccess(res, data, "Product image attached successfully.", 201);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to add product image.", 500, "SERVER_ERROR");
  }
});

// DELETE /api/admin/products/:id/images/:imageId (Admin delete product image)
router.delete("/admin/products/:id/images/:imageId", async (req, res) => {
  const admin = req.user!;
  const { id, imageId } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    await insforge.database
      .from("product_images")
      .delete()
      .eq("id", imageId)
      .eq("product_id", id);

    // Audit Log
    await insforge.database.from("admin_audit_logs").insert([
      {
        admin_id: admin.id,
        action: "PRODUCT_IMAGE_REMOVED",
        target_type: "product",
        target_id: id,
        metadata: { image_id: imageId },
      },
    ]);

    return sendSuccess(res, null, "Product image removed successfully.");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to remove product image.", 500, "SERVER_ERROR");
  }
});

// ====================================================================
// 3. PRODUCT CATEGORY & SUBCATEGORY MANAGEMENT
// ====================================================================

// GET /api/admin/categories (List all categories with subcategories & product counts)
router.get("/admin/categories", async (_req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: prodCats, error: pcErr } = await insforge.database
      .from("product_categories")
      .select("id, label, unit, default_qty, created_at")
      .order("created_at", { ascending: true });

    if (pcErr) return sendError(res, pcErr.message, 500, "DATABASE_ERROR");

    const { data: subcats, error: subErr } = await insforge.database
      .from("subcategories")
      .select("id, category_id, name, slug, created_at")
      .order("name", { ascending: true });

    if (subErr) return sendError(res, subErr.message, 500, "DATABASE_ERROR");

    // Product counts by category
    const { data: products } = await insforge.database
      .from("products")
      .select("category_id");

    const productCounts: Record<string, number> = {};
    for (const p of products || []) {
      productCounts[p.category_id] = (productCounts[p.category_id] || 0) + 1;
    }

    const categoriesWithMeta = (prodCats || []).map((cat: any) => ({
      ...cat,
      productCount: productCounts[cat.id] || 0,
      subcategories: (subcats || []).filter((s: any) => s.category_id === cat.id),
    }));

    return sendSuccess(res, categoriesWithMeta);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch categories.", 500, "SERVER_ERROR");
  }
});

// POST /api/admin/categories (Add new category)
router.post("/admin/categories", async (req, res) => {
  const admin = req.user!;
  const { id, label, unit = "pc", default_qty = 500, description } = req.body;

  if (!label?.trim()) {
    return sendError(res, "Category label is required.", 400, "VALIDATION_FAILED");
  }

  const catId = (id || label).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    // 1. Insert into product_categories
    const { data: newProdCat, error: pcErr } = await insforge.database
      .from("product_categories")
      .insert([
        {
          id: catId,
          label: label.trim(),
          unit: unit.trim(),
          default_qty: Number.parseInt(default_qty, 10) || 500,
        },
      ])
      .select()
      .single();

    if (pcErr) return sendError(res, pcErr.message, 500, "DATABASE_ERROR");

    // 2. Sync to categories table
    await insforge.database.from("categories").insert([
      {
        id: catId,
        name: label.trim(),
        slug: catId,
        description: description?.trim() || `${label.trim()} wholesale discovery`,
        is_active: true,
      },
    ]);

    // Audit log
    await insforge.database.from("admin_audit_logs").insert([
      {
        admin_id: admin.id,
        action: "CATEGORY_CREATED",
        target_type: "category",
        target_id: catId,
        metadata: { label },
      },
    ]);

    return sendSuccess(res, newProdCat, "Category created successfully.", 201);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to create category.", 500, "SERVER_ERROR");
  }
});

// PATCH /api/admin/categories/:id (Update category)
router.patch("/admin/categories/:id", async (req, res) => {
  const admin = req.user!;
  const { id } = req.params;
  const { label, unit, default_qty } = req.body;

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const updatePayload: Record<string, any> = {};
    if (label?.trim()) updatePayload.label = label.trim();
    if (unit?.trim()) updatePayload.unit = unit.trim();
    if (default_qty !== undefined) updatePayload.default_qty = Number.parseInt(default_qty, 10);

    const { data: updated, error } = await insforge.database
      .from("product_categories")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    if (label?.trim()) {
      await insforge.database
        .from("categories")
        .update({ name: label.trim() })
        .eq("id", id);
    }

    // Audit log
    await insforge.database.from("admin_audit_logs").insert([
      {
        admin_id: admin.id,
        action: "CATEGORY_UPDATED",
        target_type: "category",
        target_id: id,
        metadata: updatePayload,
      },
    ]);

    return sendSuccess(res, updated, "Category updated successfully.");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to update category.", 500, "SERVER_ERROR");
  }
});

// POST /api/admin/categories/:id/subcategories (Add subcategory)
router.post("/admin/categories/:id/subcategories", async (req, res) => {
  const admin = req.user!;
  const { id } = req.params;
  const { name } = req.body;

  if (!name?.trim()) {
    return sendError(res, "Subcategory name is required.", 400, "VALIDATION_FAILED");
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: subcategory, error } = await insforge.database
      .from("subcategories")
      .insert([
        {
          category_id: id,
          name: name.trim(),
          slug,
        },
      ])
      .select()
      .single();

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    // Audit log
    await insforge.database.from("admin_audit_logs").insert([
      {
        admin_id: admin.id,
        action: "SUBCATEGORY_CREATED",
        target_type: "subcategory",
        target_id: subcategory.id,
        metadata: { category_id: id, name },
      },
    ]);

    return sendSuccess(res, subcategory, "Subcategory added successfully.", 201);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to add subcategory.", 500, "SERVER_ERROR");
  }
});

// ====================================================================
// 4. BUSINESS & SUPPLIER GOVERNANCE
// ====================================================================

// GET /api/admin/businesses & /api/admin/wholesalers (List businesses with supplier profiles & products count)
const handleGetBusinesses = async (req: any, res: any) => {
  const { type, verification, search, page = "1", limit = "50" } = req.query as Record<string, string | undefined>;

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const pageNum = Math.max(1, Number.parseInt(page || "1", 10));
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit || "50", 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = insforge.database
      .from("businesses")
      .select(
        "id, name, legal_name, slug, business_type, gstin, pan, city, state, pincode, address, phone, email, website, verification_level, is_active, created_at, supplier_profiles(id, factory_size_sqft, production_capacity_monthly, export_ready, certifications, lead_time_days)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (type && type !== "all") {
      query = query.eq("business_type", type);
    }

    if (verification && verification !== "all") {
      query = query.eq("verification_level", verification);
    }

    if (search?.trim()) {
      query = query.or(`name.ilike.%${search.trim()}%,city.ilike.%${search.trim()}%,gstin.ilike.%${search.trim()}%`);
    }

    const { data: businesses, count, error } = await query.range(offset, offset + limitNum - 1);
    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    // Fetch product counts per business
    const { data: prods } = await insforge.database.from("products").select("business_id");
    const countsMap: Record<string, number> = {};
    for (const p of prods || []) {
      countsMap[p.business_id] = (countsMap[p.business_id] || 0) + 1;
    }

    const enhanced = (businesses || []).map((b: any) => ({
      ...b,
      productsCount: countsMap[b.id] || 0,
    }));

    return sendSuccess(res, {
      items: enhanced,
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || 0) / limitNum),
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch businesses.", 500, "SERVER_ERROR");
  }
};

router.get("/admin/businesses", handleGetBusinesses);
router.get("/admin/wholesalers", handleGetBusinesses);
router.get("/admin/manufacturers", (req: any, res: any) => {
  req.query.type = "manufacturer";
  return handleGetBusinesses(req, res);
});
router.get("/admin/distributors", (req: any, res: any) => {
  req.query.type = "distributor";
  return handleGetBusinesses(req, res);
});

// GET /api/admin/distributor-offers (List all distributor offers across platform)
router.get("/admin/distributor-offers", async (req, res) => {
  const { status, page = "1", limit = "50" } = req.query as Record<string, string | undefined>;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const pageNum = Math.max(1, Number.parseInt(page || "1", 10));
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit || "50", 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = insforge.database
      .from("distributor_product_offers")
      .select("*, businesses:distributor_business_id(name, city, verification_level), products(title, category_id)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("moderation_status", status);
    }

    const { data, count, error } = await query.range(offset, offset + limitNum - 1);
    if (error) {
      // Fallback: return products where business is distributor
      const { data: prods, count: pCount } = await insforge.database
        .from("products")
        .select("*, businesses!inner(id, name, city, business_type, verification_level)", { count: "exact" })
        .eq("businesses.business_type", "distributor")
        .range(offset, offset + limitNum - 1);

      const mapped = (prods || []).map((p: any) => ({
        id: p.id,
        distributor_business_id: p.business_id,
        title: p.title,
        brand_name: p.specifications?.brand || "Authorized Brand",
        selling_price: p.indicative_price,
        dealer_price: p.specifications?.dealer_price || p.indicative_price * 0.95,
        moq: p.moq,
        unit: p.unit,
        available_stock: p.specifications?.available_stock || 100,
        stock_status: "available",
        supply_territory: p.specifications?.supply_territory || "Regional",
        delivery_lead_time_days: 3,
        moderation_status: p.moderation_status || "approved",
        is_active: p.is_active,
        businesses: p.businesses,
      }));

      return sendSuccess(res, {
        items: mapped,
        total: pCount || mapped.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil((pCount || mapped.length) / limitNum),
      });
    }

    return sendSuccess(res, {
      items: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || 0) / limitNum),
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch distributor offers.", 500, "SERVER_ERROR");
  }
});

// PATCH /api/admin/distributor-offers/:id/moderation
router.patch("/admin/distributor-offers/:id/moderation", async (req, res) => {
  const admin = req.user!;
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!status || !["approved", "rejected", "changes_requested"].includes(status)) {
    return sendError(res, "Valid status (approved, rejected, or changes_requested) is required.", 400, "VALIDATION_FAILED");
  }

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const isApproved = status === "approved";
    const { data: updated, error } = await insforge.database
      .from("distributor_product_offers")
      .update({
        moderation_status: status,
        moderation_notes: notes?.trim() || null,
        is_active: isApproved,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      await insforge.database
        .from("products")
        .update({
          moderation_status: status,
          moderation_notes: notes?.trim() || null,
          is_active: isApproved,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    }

    // Record audit log
    await insforge.database.from("admin_audit_logs").insert([
      {
        admin_id: admin.id,
        action: `DISTRIBUTOR_OFFER_${status.toUpperCase()}`,
        target_type: "distributor_product_offer",
        target_id: id,
        metadata: { status, notes },
      },
    ]);

    return sendSuccess(res, updated || { id, moderation_status: status }, `Offer marked as ${status}.`);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to moderate distributor offer.", 500, "SERVER_ERROR");
  }
});

// GET /api/admin/businesses/:id (Full business detail with products)
router.get("/admin/businesses/:id", async (req, res) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: business, error } = await insforge.database
      .from("businesses")
      .select("*, supplier_profiles(*), buyer_profiles(*), service_provider_profiles(*)")
      .eq("id", id)
      .single();

    if (error || !business) return sendError(res, "Business not found.", 404, "NOT_FOUND");

    const { data: products } = await insforge.database
      .from("products")
      .select("id, title, category_id, indicative_price, moq, unit, is_active, created_at")
      .eq("business_id", id);

    const { data: members } = await insforge.database
      .from("business_members")
      .select("id, role_in_business, users(id, email, full_name)")
      .eq("business_id", id);

    return sendSuccess(res, {
      ...business,
      products: products || [],
      members: members || [],
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch business.", 500, "SERVER_ERROR");
  }
});

// PATCH /api/admin/businesses/:id/status (Update business status or verification level)
router.patch("/admin/businesses/:id/status", async (req, res) => {
  const admin = req.user!;
  const { id } = req.params;
  const { is_active, verification_level, reason } = req.body;

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof is_active === "boolean") updatePayload.is_active = is_active;
    if (verification_level) updatePayload.verification_level = verification_level;

    const { data: updated, error } = await insforge.database
      .from("businesses")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    // Audit log
    await insforge.database.from("admin_audit_logs").insert([
      {
        admin_id: admin.id,
        action: "BUSINESS_STATUS_UPDATED",
        target_type: "business",
        target_id: id,
        metadata: { ...updatePayload, reason: reason || null },
      },
    ]);

    return sendSuccess(res, updated, "Business status updated successfully.");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to update business.", 500, "SERVER_ERROR");
  }
});

// ====================================================================
// 5. ENQUIRIES & RFQ GOVERNANCE
// ====================================================================

// GET /api/admin/rfqs (List all platform RFQs)
router.get("/admin/rfqs", async (req, res) => {
  const { status, search } = req.query as { status?: string; search?: string };
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    let query = insforge.database
      .from("rfqs")
      .select(
        "id, rfq_number, buyer_id, business_id, title, category_id, delivery_city, delivery_pincode, target_delivery_date, dispatch_mode, status, notes, created_at, users(id, full_name, email, phone), businesses(id, name, city), rfq_items(id, item_name, quantity, unit, target_unit_price)"
      )
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search?.trim()) {
      query = query.or(`title.ilike.%${search.trim()}%,rfq_number.ilike.%${search.trim()}%`);
    }

    const { data, error } = await query.limit(100);
    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, data || []);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch RFQs.", 500, "SERVER_ERROR");
  }
});

// GET /api/admin/rfqs/:id (Full RFQ details with items and quotations)
router.get("/admin/rfqs/:id", async (req, res) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: rfq, error } = await insforge.database
      .from("rfqs")
      .select(
        "*, users(id, full_name, email, phone), businesses(id, name, city, gstin), rfq_items(*), quotations(*, businesses(name, city))"
      )
      .eq("id", id)
      .single();

    if (error || !rfq) return sendError(res, "RFQ not found.", 404, "NOT_FOUND");
    return sendSuccess(res, rfq);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch RFQ details.", 500, "SERVER_ERROR");
  }
});

// PATCH /api/admin/rfqs/:id/status (Update RFQ status)
router.patch("/admin/rfqs/:id/status", async (req, res) => {
  const admin = req.user!;
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!status) return sendError(res, "status is required.", 400, "VALIDATION_FAILED");

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: updated, error } = await insforge.database
      .from("rfqs")
      .update({ status, notes: notes || null, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    // Audit log
    await insforge.database.from("admin_audit_logs").insert([
      {
        admin_id: admin.id,
        action: "RFQ_STATUS_UPDATED",
        target_type: "rfq",
        target_id: id,
        metadata: { status },
      },
    ]);

    return sendSuccess(res, updated, `RFQ status updated to ${status}.`);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to update RFQ.", 500, "SERVER_ERROR");
  }
});

// GET /api/admin/enquiries (List all concierge leads / guest enquiries)
router.get("/admin/enquiries", async (req, res) => {
  const { status, search } = req.query as { status?: string; search?: string };
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    let query = insforge.database
      .from("concierge_leads")
      .select("id, name, business, phone, category, requirement, status, created_at")
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search?.trim()) {
      query = query.or(`name.ilike.%${search.trim()}%,business.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%`);
    }

    const { data, error } = await query.limit(100);
    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, data || []);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch enquiries.", 500, "SERVER_ERROR");
  }
});

// PATCH /api/admin/enquiries/:id/status (Update concierge lead status)
router.patch("/admin/enquiries/:id/status", async (req, res) => {
  const admin = req.user!;
  const { id } = req.params;
  const { status } = req.body;

  if (!status) return sendError(res, "status is required.", 400, "VALIDATION_FAILED");

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: updated, error } = await insforge.database
      .from("concierge_leads")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    // Audit log
    await insforge.database.from("admin_audit_logs").insert([
      {
        admin_id: admin.id,
        action: "ENQUIRY_STATUS_UPDATED",
        target_type: "concierge_lead",
        target_id: id,
        metadata: { status },
      },
    ]);

    return sendSuccess(res, updated, `Enquiry status updated to ${status}.`);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to update enquiry status.", 500, "SERVER_ERROR");
  }
});

// GET /api/admin/quotations (Monitor platform quotations)
router.get("/admin/quotations", async (req, res) => {
  const { status, page = "1", limit = "50" } = req.query as Record<string, string | undefined>;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const pageNum = Math.max(1, Number.parseInt(page || "1", 10));
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit || "50", 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = insforge.database
      .from("quotations")
      .select(
        "id, quotation_number, rfq_id, enquiry_id, supplier_business_id, supplier_user_id, status, total_amount, valid_until, lead_time_days, created_at, businesses(name, city), rfqs(rfq_number, title)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, count, error } = await query.range(offset, offset + limitNum - 1);
    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, {
      items: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || 0) / limitNum),
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch quotations.", 500, "SERVER_ERROR");
  }
});

// ====================================================================
// 6. USER GOVERNANCE & AUDIT LOGS
// ====================================================================

// GET /api/admin/users (User Governance)
router.get("/admin/users", async (req, res) => {
  const { role, search, is_active, page = "1", limit = "50" } = req.query as Record<string, string | undefined>;

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const pageNum = Math.max(1, Number.parseInt(page || "1", 10));
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit || "50", 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = insforge.database
      .from("users")
      .select("id, email, full_name, phone, avatar_url, is_active, created_at, user_roles(role, is_primary)", {
        count: "exact",
      })
      .order("created_at", { ascending: false });

    if (search?.trim()) {
      query = query.or(`full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
    }

    if (is_active !== undefined) {
      query = query.eq("is_active", is_active === "true");
    }

    const { data, count, error } = await query.range(offset, offset + limitNum - 1);
    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    let filteredUsers = data || [];
    if (role?.trim()) {
      filteredUsers = filteredUsers.filter((u: any) =>
        u.user_roles?.some((r: any) => r.role === role.trim())
      );
    }

    return sendSuccess(res, {
      items: filteredUsers,
      total: count || filteredUsers.length,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch users list.", 500, "SERVER_ERROR");
  }
});

// PATCH /api/admin/users/:id/status (Suspend / Activate User)
router.patch("/admin/users/:id/status", async (req, res) => {
  const admin = req.user!;
  const { id } = req.params;
  const { is_active, reason } = req.body;

  if (typeof is_active !== "boolean") {
    return sendError(res, "is_active boolean is required.", 400, "VALIDATION_FAILED");
  }

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: updatedUser, error: updateError } = await insforge.database
      .from("users")
      .update({
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) return sendError(res, updateError.message, 500, "DATABASE_ERROR");

    // Audit Log
    await insforge.database.from("admin_audit_logs").insert([
      {
        admin_id: admin.id,
        action: is_active ? "USER_ACTIVATED" : "USER_SUSPENDED",
        target_type: "user",
        target_id: id,
        metadata: { reason: reason?.trim() || null },
      },
    ]);

    return sendSuccess(res, updatedUser, `User account ${is_active ? "activated" : "suspended"}.`);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to update user status.", 500, "SERVER_ERROR");
  }
});

// PATCH /api/admin/users/:id/roles (Assign / Revoke Roles)
router.patch("/admin/users/:id/roles", async (req, res) => {
  const admin = req.user!;
  const { id } = req.params;
  const { roles } = req.body as { roles: string[] };

  if (!Array.isArray(roles) || roles.length === 0) {
    return sendError(res, "At least one role must be provided.", 400, "VALIDATION_FAILED");
  }

  const validRoles = [
    "buyer", "manufacturer", "wholesaler", "distributor", "service_provider",
    "buyer_supplier", "admin", "verification_admin", "support_admin",
  ];

  for (const r of roles) {
    if (!validRoles.includes(r)) {
      return sendError(res, `Invalid role: ${r}.`, 400, "VALIDATION_FAILED");
    }
  }

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    await insforge.database.from("user_roles").delete().eq("user_id", id);

    const payload = roles.map((role, idx) => ({
      user_id: id,
      role,
      is_primary: idx === 0,
    }));

    await insforge.database.from("user_roles").insert(payload);

    // Audit Log
    await insforge.database.from("admin_audit_logs").insert([
      {
        admin_id: admin.id,
        action: "USER_ROLES_UPDATED",
        target_type: "user",
        target_id: id,
        metadata: { assignedRoles: roles },
      },
    ]);

    return sendSuccess(res, { roles }, "User roles updated successfully.");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to update user roles.", 500, "SERVER_ERROR");
  }
});

// GET /api/admin/audit-logs
router.get("/admin/audit-logs", async (req, res) => {
  const { limit = "100" } = req.query as { limit?: string };
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data, error } = await insforge.database
      .from("admin_audit_logs")
      .select("id, admin_id, action, target_type, target_id, metadata, created_at, users(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(Number.parseInt(limit, 10) || 100);

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");
    return sendSuccess(res, data || []);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch audit logs.", 500, "SERVER_ERROR");
  }
});

// GET /api/admin/orders (Monitor all platform orders)
router.get("/admin/orders", async (req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { status, page = "1", limit = "50" } = req.query as Record<string, string | undefined>;
    const pageNum = Math.max(1, Number.parseInt(page || "1", 10));
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit || "50", 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = insforge.database
      .from("orders")
      .select(
        "id, order_number, quotation_id, buyer_id, buyer_business_id, supplier_business_id, status, total_amount, tracking_number, carrier, dispatch_date, delivery_date, created_at, users!buyer_id(full_name, email, phone), businesses!supplier_business_id(name, city, verification_level)",
        { count: "exact" }
      )
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
    return sendError(res, err.message || "Failed to fetch platform orders.", 500, "SERVER_ERROR");
  }
});

// GET /api/admin/reports (Platform Conversion & Liquidity Intelligence)
router.get("/admin/reports", async (_req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { count: totalRfqs } = await insforge.database.from("rfqs").select("*", { count: "exact", head: true });
    const { count: totalLeads } = await insforge.database.from("concierge_leads").select("*", { count: "exact", head: true });
    const { count: totalQuotations } = await insforge.database.from("quotations").select("*", { count: "exact", head: true });
    const { data: orders } = await insforge.database.from("orders").select("total_amount, status");

    const totalOrders = orders?.length || 0;
    const totalGmv = (orders || []).reduce((acc: number, curr: any) => acc + (Number(curr.total_amount) || 0), 0);
    const completedOrders = (orders || []).filter((o: any) => o.status === "completed" || o.status === "delivered").length;

    return sendSuccess(res, {
      liquidity: {
        totalRfqs: totalRfqs || 0,
        totalLeads: totalLeads || 0,
        totalEnquiries: (totalRfqs || 0) + (totalLeads || 0),
        totalQuotations: totalQuotations || 0,
        totalOrders,
        totalGmv,
        completedOrders,
      },
      conversionRate: totalRfqs ? Math.round((totalOrders / totalRfqs) * 100) : 0,
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to generate admin reports.", 500, "SERVER_ERROR");
  }
});

// ====================================================================
// 12. ADMIN EMPLOYEE & ROLE MANAGEMENT
// ====================================================================

// GET /api/admin/employee-dashboard
router.get("/admin/employee-dashboard", async (_req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: members, error } = await insforge.database
      .from("business_members")
      .select("id, role_in_business, is_active");

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    const memberList = members || [];
    const nonOwnerEmployees = memberList.filter((m: any) => m.role_in_business !== "owner");
    const totalEmployees = nonOwnerEmployees.length;
    const procurementManagers = memberList.filter((m: any) => m.role_in_business === "procurement_manager").length;
    const purchaseStaff = memberList.filter((m: any) => ["purchase_staff", "purchase_executive"].includes(m.role_in_business)).length;
    const financeStaff = memberList.filter((m: any) => ["finance_staff", "accounts_executive"].includes(m.role_in_business)).length;
    const activeEmployees = nonOwnerEmployees.filter((m: any) => m.is_active).length;
    const suspendedEmployees = nonOwnerEmployees.filter((m: any) => !m.is_active).length;

    // Pending Invitations
    const { count: pendingInvitations } = await insforge.database
      .from("business_invitations")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // Recent Employee Activities
    let recentActivities: any[] = [];
    try {
      const { data: acts } = await insforge.database
        .from("employee_activity_logs")
        .select("id, activity_type, description, entity_type, entity_id, created_at, users(full_name, email), businesses(name)")
        .order("created_at", { ascending: false })
        .limit(10);
      recentActivities = acts || [];
    } catch {
      recentActivities = [];
    }

    return sendSuccess(res, {
      totalEmployees,
      procurementManagers,
      purchaseStaff,
      financeStaff,
      activeEmployees,
      pendingInvitations: pendingInvitations || 0,
      suspendedEmployees,
      recentActivities,
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch employee dashboard.", 500, "SERVER_ERROR");
  }
});

// GET /api/admin/employees
router.get("/admin/employees", async (req, res) => {
  const { role, business_id, branch_id, is_active, search } = req.query as Record<string, string | undefined>;

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    let query = insforge.database
      .from("business_members")
      .select("id, business_id, user_id, branch_id, role_in_business, permissions, spending_limit, department, is_active, created_at, users(id, email, full_name, phone, is_active), businesses(id, name, city, gstin), business_branches(id, branch_name, city)")
      .order("created_at", { ascending: false });

    if (role) {
      query = query.eq("role_in_business", role);
    }
    if (business_id) {
      query = query.eq("business_id", business_id);
    }
    if (branch_id) {
      query = query.eq("branch_id", branch_id);
    }
    if (is_active !== undefined) {
      query = query.eq("is_active", is_active === "true");
    }

    const { data: members, error } = await query;
    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    let list = members || [];
    if (search?.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((m: any) => {
        const u = Array.isArray(m.users) ? m.users[0] : m.users;
        const b = Array.isArray(m.businesses) ? m.businesses[0] : m.businesses;
        return (
          u?.full_name?.toLowerCase().includes(q) ||
          u?.email?.toLowerCase().includes(q) ||
          b?.name?.toLowerCase().includes(q)
        );
      });
    }

    return sendSuccess(res, list);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch employees.", 500, "SERVER_ERROR");
  }
});

// POST /api/admin/employees
router.post("/admin/employees", async (req, res) => {
  const admin = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  const {
    email,
    full_name,
    phone,
    business_id,
    branch_id,
    role = "purchase_staff",
    permissions,
    spending_limit,
    department,
  } = req.body;

  if (!email || !full_name || !business_id) {
    return sendError(res, "Email, full name, and business_id are required.", 400, "VALIDATION_FAILED");
  }

  try {
    // 1. Find or create user
    let userId: string;
    const { data: existingUser } = await insforge.database
      .from("users")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (existingUser) {
      userId = existingUser.id;
    } else {
      userId = crypto.randomUUID();
      const { error: userErr } = await insforge.database.from("users").insert([
        {
          id: userId,
          email: email.trim().toLowerCase(),
          full_name,
          phone: phone || null,
          is_active: true,
        },
      ]);
      if (userErr) return sendError(res, userErr.message, 500, "DATABASE_ERROR");

      // Give buyer role in user_roles
      await insforge.database.from("user_roles").insert([
        {
          user_id: userId,
          role: "buyer",
          is_primary: true,
        },
      ]);
    }

    // Default permissions based on role
    let rolePerms = permissions;
    if (!rolePerms || !Array.isArray(rolePerms) || rolePerms.length === 0) {
      if (role === "procurement_manager") {
        rolePerms = ["view", "create", "edit", "approve", "reject", "export"];
      } else if (role === "purchase_staff" || role === "purchase_executive") {
        rolePerms = ["view", "create", "edit"];
      } else if (role === "finance_staff" || role === "accounts_executive") {
        rolePerms = ["view", "create", "edit", "export"];
      } else {
        rolePerms = ["view"];
      }
    }

    // 2. Insert or update business_members
    const { data: member, error: memErr } = await insforge.database
      .from("business_members")
      .upsert(
        [
          {
            business_id,
            user_id: userId,
            branch_id: branch_id || null,
            role_in_business: role,
            permissions: rolePerms,
            spending_limit: spending_limit ? Number(spending_limit) : null,
            department: department || null,
            is_active: true,
            invited_by: admin.id,
          },
        ],
        { onConflict: "business_id,user_id" }
      )
      .select("*, users(id, full_name, email), businesses(name)")
      .single();

    if (memErr) return sendError(res, memErr.message, 500, "DATABASE_ERROR");

    // 3. Log Audit
    await insforge.database.from("admin_audit_logs").insert([
      {
        admin_id: admin.id,
        action: "EMPLOYEE_CREATED",
        target_type: "business_member",
        target_id: member.id,
        metadata: { business_id, role, email, branch_id },
      },
    ]);

    try {
      await insforge.database.from("employee_activity_logs").insert([
        {
          business_id,
          user_id: userId,
          branch_id: branch_id || null,
          activity_type: "member_created",
          description: `Employee account created by administrator with role ${role}.`,
          entity_type: "business_member",
          entity_id: member.id,
          metadata: { permissions: rolePerms, role },
        },
      ]);
    } catch {
      // Ignored if table logging is deferred
    }

    return sendSuccess(res, member, "Employee account configured successfully.", 201);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to create employee.", 500, "SERVER_ERROR");
  }
});

// PUT /api/admin/employees/:id
router.put("/admin/employees/:id", async (req, res) => {
  const admin = req.user!;
  const { id } = req.params;
  const { role, permissions, spending_limit, branch_id, department } = req.body;

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const updatePayload: any = {};
    if (role) updatePayload.role_in_business = role;
    if (permissions && Array.isArray(permissions)) updatePayload.permissions = permissions;
    if (spending_limit !== undefined) updatePayload.spending_limit = spending_limit ? Number(spending_limit) : null;
    if (branch_id !== undefined) updatePayload.branch_id = branch_id || null;
    if (department !== undefined) updatePayload.department = department || null;

    const { data: updated, error } = await insforge.database
      .from("business_members")
      .update(updatePayload)
      .eq("id", id)
      .select("*, users(id, full_name, email), businesses(name)")
      .single();

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    // Audit logs
    await insforge.database.from("admin_audit_logs").insert([
      {
        admin_id: admin.id,
        action: "EMPLOYEE_UPDATED",
        target_type: "business_member",
        target_id: id,
        metadata: updatePayload,
      },
    ]);

    try {
      await insforge.database.from("employee_activity_logs").insert([
        {
          business_id: updated.business_id,
          user_id: updated.user_id,
          branch_id: updated.branch_id,
          activity_type: "permissions_updated",
          description: `Employee profile and permissions updated by administrator.`,
          entity_type: "business_member",
          entity_id: id,
          metadata: updatePayload,
        },
      ]);
    } catch {
      // Ignored
    }

    return sendSuccess(res, updated, "Employee permissions and role updated successfully.");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to update employee.", 500, "SERVER_ERROR");
  }
});

// PATCH /api/admin/employees/:id/status
router.patch("/admin/employees/:id/status", async (req, res) => {
  const admin = req.user!;
  const { id } = req.params;
  const { is_active, reason } = req.body;

  if (typeof is_active !== "boolean") {
    return sendError(res, "is_active boolean is required.", 400, "VALIDATION_FAILED");
  }

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: member, error } = await insforge.database
      .from("business_members")
      .update({ is_active })
      .eq("id", id)
      .select("*, users(id, full_name, email)")
      .single();

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    // Audit log
    await insforge.database.from("admin_audit_logs").insert([
      {
        admin_id: admin.id,
        action: is_active ? "EMPLOYEE_ACTIVATED" : "EMPLOYEE_SUSPENDED",
        target_type: "business_member",
        target_id: id,
        metadata: { reason: reason || null, is_active },
      },
    ]);

    return sendSuccess(res, member, `Employee account ${is_active ? "activated" : "suspended"}.`);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to toggle employee status.", 500, "SERVER_ERROR");
  }
});

// DELETE /api/admin/employees/:id (Revoke Access)
router.delete("/admin/employees/:id", async (req, res) => {
  const admin = req.user!;
  const { id } = req.params;

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: member, error } = await insforge.database
      .from("business_members")
      .update({ is_active: false })
      .eq("id", id)
      .select("*, users(id, full_name, email)")
      .single();

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    await insforge.database.from("admin_audit_logs").insert([
      {
        admin_id: admin.id,
        action: "EMPLOYEE_ACCESS_REVOKED",
        target_type: "business_member",
        target_id: id,
        metadata: { note: "Access revoked by admin; history preserved." },
      },
    ]);

    return sendSuccess(res, member, "Employee access revoked successfully. Historical audit records preserved.");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to revoke employee access.", 500, "SERVER_ERROR");
  }
});

// GET /api/admin/employees/:id/activity
router.get("/admin/employees/:id/activity", async (req, res) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: member } = await insforge.database
      .from("business_members")
      .select("user_id, business_id")
      .eq("id", id)
      .single();

    if (!member) return sendError(res, "Employee not found.", 404, "NOT_FOUND");

    const { data: activities, error } = await insforge.database
      .from("employee_activity_logs")
      .select("*")
      .eq("user_id", member.user_id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, activities || []);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch employee activity.", 500, "SERVER_ERROR");
  }
});

export default router;
