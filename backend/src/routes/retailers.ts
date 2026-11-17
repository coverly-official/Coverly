import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";
import { authenticateUser, requireAdmin } from "../middleware/auth.js";
import { roundToTwoDecimals, calculateLandedCost } from "../lib/landed-cost.js";
import crypto from "crypto";

const router = Router();

// Helper to resolve retailer profile for authenticated user
async function resolveRetailerProfile(userId: string) {
  const insforge = getInsForgeClient();
  if (!insforge) return null;

  const { data: profile } = await insforge.database
    .from("retailer_profiles")
    .select("*, businesses(*)")
    .eq("user_id", userId)
    .maybeSingle();

  return profile || null;
}

// ====================================================================
// 1. RETAILER REGISTRATION & PROFILE
// ====================================================================

/**
 * POST /api/retailer/register
 * Registers or upgrades an account to a Retailer profile.
 */
router.post("/retailer/register", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const userId = req.user!.id;
    const {
      owner_name,
      shop_name,
      retail_type = "kirana",
      phone,
      email,
      store_address,
      city,
      state,
      pincode,
      country = "India",
      gstin,
      pan,
      trade_license_number,
      fssai_license,
      drug_license_number,
      is_multi_branch = false,
      purchasing_categories = [],
      shop_logo_url,
      description,
    } = req.body;

    if (!shop_name || !store_address || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        error: "Shop name, store address, city, state, and pincode are required.",
      });
    }

    // 1. Ensure user has retailer role
    const { data: existingRoles } = await insforge.database
      .from("user_roles")
      .select("id, role")
      .eq("user_id", userId);

    const hasRetailerRole = existingRoles?.some((r) => r.role === "retailer");
    if (!hasRetailerRole) {
      await insforge.database.from("user_roles").insert([
        {
          user_id: userId,
          role: "retailer",
          is_primary: existingRoles && existingRoles.length > 0 ? false : true,
        },
      ]);
    }

    // 2. Create or find linked business
    let businessId: string | null = null;
    const slug = `${shop_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;

    const { data: newBiz, error: bizErr } = await insforge.database
      .from("businesses")
      .insert([
        {
          name: shop_name,
          legal_name: shop_name,
          slug,
          business_type: "retailer",
          gstin: gstin || null,
          pan: pan || null,
          city,
          state,
          pincode,
          address: store_address,
          phone: phone || req.user!.phone || null,
          email: email || req.user!.email,
          verification_level: "unverified",
          is_active: true,
        },
      ])
      .select("id")
      .single();

    if (!bizErr && newBiz) {
      businessId = newBiz.id;
      // Also register user as business member (owner)
      await insforge.database.from("business_members").insert([
        {
          business_id: businessId,
          user_id: userId,
          role_in_business: "owner",
          permissions: ["view", "create", "edit", "approve", "reject", "manage", "export"],
        },
      ]);
    }

    // 3. Upsert retailer profile
    const existingProfile = await resolveRetailerProfile(userId);
    let profileData: any = null;

    if (existingProfile) {
      const { data: updated, error: updErr } = await insforge.database
        .from("retailer_profiles")
        .update({
          owner_name: owner_name || req.user!.full_name,
          shop_name,
          retail_type,
          phone: phone || req.user!.phone || existingProfile.phone,
          email: email || req.user!.email,
          store_address,
          city,
          state,
          pincode,
          country,
          gstin: gstin || existingProfile.gstin,
          pan: pan || existingProfile.pan,
          trade_license_number: trade_license_number || existingProfile.trade_license_number,
          fssai_license: fssai_license || existingProfile.fssai_license,
          drug_license_number: drug_license_number || existingProfile.drug_license_number,
          is_multi_branch: Boolean(is_multi_branch),
          purchasing_categories: purchasing_categories.length > 0 ? purchasing_categories : existingProfile.purchasing_categories,
          shop_logo_url: shop_logo_url || existingProfile.shop_logo_url,
          description: description || existingProfile.description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingProfile.id)
        .select()
        .single();

      if (updErr) throw updErr;
      profileData = updated;
    } else {
      const { data: created, error: crtErr } = await insforge.database
        .from("retailer_profiles")
        .insert([
          {
            user_id: userId,
            business_id: businessId,
            owner_name: owner_name || req.user!.full_name,
            shop_name,
            retail_type,
            phone: phone || req.user!.phone || "N/A",
            email: email || req.user!.email,
            store_address,
            city,
            state,
            pincode,
            country,
            gstin: gstin || null,
            pan: pan || null,
            trade_license_number: trade_license_number || null,
            fssai_license: fssai_license || null,
            drug_license_number: drug_license_number || null,
            is_multi_branch: Boolean(is_multi_branch),
            purchasing_categories,
            shop_logo_url: shop_logo_url || null,
            description: description || null,
            verification_status: "unverified",
          },
        ])
        .select()
        .single();

      if (crtErr) throw crtErr;
      profileData = created;

      // Create main branch automatically
      if (profileData && businessId) {
        await insforge.database.from("retailer_branches").insert([
          {
            retailer_profile_id: profileData.id,
            business_id: businessId,
            branch_name: `${shop_name} (Main Store)`,
            store_code: "STR-001",
            address: store_address,
            city,
            state,
            pincode,
            manager_name: owner_name || req.user!.full_name,
            manager_phone: phone || req.user!.phone,
            manager_email: email || req.user!.email,
            is_main_branch: true,
            is_active: true,
          },
        ]);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Retailer profile registered successfully.",
      data: profileData,
    });
  } catch (err: any) {
    console.error("Retailer registration error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to register retailer." });
  }
});

/**
 * GET /api/retailer/profile
 * Retrieves current retailer's business profile and branch details.
 */
router.get("/retailer/profile", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const userId = req.user!.id;
    let profile = await resolveRetailerProfile(userId);

    // If no dedicated retailer profile exists yet, return default template
    if (!profile) {
      return res.status(200).json({
        success: true,
        data: {
          id: null,
          user_id: userId,
          owner_name: req.user!.full_name,
          email: req.user!.email,
          phone: req.user!.phone || "",
          shop_name: "",
          retail_type: "kirana",
          store_address: "",
          city: "",
          state: "",
          pincode: "",
          is_multi_branch: false,
          verification_status: "unverified",
          purchasing_categories: [],
          branches: [],
        },
      });
    }

    // Fetch branches
    const { data: branches } = await insforge.database
      .from("retailer_branches")
      .select("*")
      .eq("retailer_profile_id", profile.id)
      .eq("is_active", true)
      .order("is_main_branch", { ascending: false });

    // Fetch documents
    const { data: docs } = await insforge.database
      .from("retailer_documents")
      .select("*")
      .eq("retailer_profile_id", profile.id)
      .order("uploaded_at", { ascending: false });

    return res.status(200).json({
      success: true,
      data: {
        ...profile,
        branches: branches || [],
        documents: docs || [],
      },
    });
  } catch (err: any) {
    console.error("Fetch retailer profile error:", err);
    return res.status(500).json({ success: false, error: "Failed to retrieve retailer profile." });
  }
});

/**
 * PUT /api/retailer/profile
 * Updates retailer profile fields.
 */
router.put("/retailer/profile", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const userId = req.user!.id;
    const profile = await resolveRetailerProfile(userId);
    if (!profile) {
      return res.status(404).json({ success: false, error: "Retailer profile not found. Please register first." });
    }

    const {
      owner_name,
      shop_name,
      retail_type,
      phone,
      store_address,
      city,
      state,
      pincode,
      gstin,
      pan,
      trade_license_number,
      fssai_license,
      drug_license_number,
      purchasing_categories,
      shop_logo_url,
      description,
      is_multi_branch,
    } = req.body;

    const { data: updated, error } = await insforge.database
      .from("retailer_profiles")
      .update({
        owner_name: owner_name || profile.owner_name,
        shop_name: shop_name || profile.shop_name,
        retail_type: retail_type || profile.retail_type,
        phone: phone || profile.phone,
        store_address: store_address || profile.store_address,
        city: city || profile.city,
        state: state || profile.state,
        pincode: pincode || profile.pincode,
        gstin: gstin !== undefined ? gstin : profile.gstin,
        pan: pan !== undefined ? pan : profile.pan,
        trade_license_number: trade_license_number !== undefined ? trade_license_number : profile.trade_license_number,
        fssai_license: fssai_license !== undefined ? fssai_license : profile.fssai_license,
        drug_license_number: drug_license_number !== undefined ? drug_license_number : profile.drug_license_number,
        purchasing_categories: purchasing_categories || profile.purchasing_categories,
        shop_logo_url: shop_logo_url !== undefined ? shop_logo_url : profile.shop_logo_url,
        description: description !== undefined ? description : profile.description,
        is_multi_branch: is_multi_branch !== undefined ? Boolean(is_multi_branch) : profile.is_multi_branch,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Retailer profile updated successfully.",
      data: updated,
    });
  } catch (err: any) {
    console.error("Update retailer profile error:", err);
    return res.status(500).json({ success: false, error: "Failed to update profile." });
  }
});

/**
 * POST /api/retailer/verify
 * Submits verification request for retailer shop.
 */
router.post("/retailer/verify", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const profile = await resolveRetailerProfile(req.user!.id);
    if (!profile) {
      return res.status(404).json({ success: false, error: "Retailer profile not found." });
    }

    const { notes } = req.body;

    const { data: updated, error } = await insforge.database
      .from("retailer_profiles")
      .update({
        verification_status: "pending",
        verification_notes: notes || "Verification requested by retailer.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Business verification request submitted for review.",
      data: updated,
    });
  } catch (err: any) {
    console.error("Retailer verify error:", err);
    return res.status(500).json({ success: false, error: "Failed to submit verification request." });
  }
});

// ====================================================================
// 2. RETAILER DASHBOARD METRICS & STATS
// ====================================================================

/**
 * GET /api/retailer/stats
 * Real computed metrics across RFQs, quotes, orders, purchase lists, and reminders.
 */
router.get("/retailer/stats", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const userId = req.user!.id;
    const profile = await resolveRetailerProfile(userId);
    const businessId = profile?.business_id;

    // 1. RFQs count
    const { data: rfqs } = await insforge.database
      .from("rfqs")
      .select("id, status")
      .eq("buyer_id", userId);

    const totalRfqs = rfqs?.length || 0;
    const activeRfqs = rfqs?.filter((r) =>
      ["submitted", "in_review", "matched", "quotes_received"].includes(r.status)
    ).length || 0;

    // 2. Quotations received on user's RFQs
    const rfqIds = rfqs?.map((r) => r.id) || [];
    let pendingQuotations = 0;
    let acceptedQuotations = 0;

    if (rfqIds.length > 0) {
      const { data: quotes } = await insforge.database
        .from("quotations")
        .select("id, status")
        .in("rfq_id", rfqIds);

      pendingQuotations = quotes?.filter((q) => ["submitted", "under_review"].includes(q.status)).length || 0;
      acceptedQuotations = quotes?.filter((q) => q.status === "accepted").length || 0;
    }

    // 3. Orders count
    const { data: orders } = await insforge.database
      .from("orders")
      .select("id, status, total_amount")
      .eq("buyer_id", userId);

    const totalOrders = orders?.length || 0;
    const activeOrders = orders?.filter((o) =>
      ["deposit_paid", "in_production", "quality_check", "shipped"].includes(o.status)
    ).length || 0;
    const completedOrders = orders?.filter((o) => ["delivered", "completed"].includes(o.status)).length || 0;
    const pendingDeliveries = orders?.filter((o) => ["in_production", "quality_check", "shipped"].includes(o.status)).length || 0;

    // 4. Saved items & suppliers
    const { count: savedProductsCount } = await insforge.database
      .from("retailer_saved_products")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const { count: savedSuppliersCount } = await insforge.database
      .from("saved_suppliers")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // 5. Purchase Lists
    const { count: purchaseListsCount } = await insforge.database
      .from("retailer_purchase_lists")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // 6. Reorder Reminders
    const { count: reorderRemindersCount } = await insforge.database
      .from("retailer_reorder_reminders")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "due");

    // 7. Purchase Requests (PRs)
    let purchaseRequestsCount = 0;
    if (businessId) {
      const { count: prCount } = await insforge.database
        .from("purchase_requests")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId);
      purchaseRequestsCount = prCount || 0;
    }

    return res.status(200).json({
      success: true,
      data: {
        totalEnquiries: totalRfqs,
        activeRfqs,
        pendingQuotations,
        acceptedQuotations,
        totalOrders,
        activeOrders,
        completedOrders,
        pendingDeliveries,
        savedSuppliers: savedSuppliersCount || 0,
        savedProducts: savedProductsCount || 0,
        purchaseLists: purchaseListsCount || 0,
        purchaseRequests: purchaseRequestsCount,
        reorderReminders: reorderRemindersCount || 0,
      },
    });
  } catch (err: any) {
    console.error("Retailer stats error:", err);
    return res.status(500).json({ success: false, error: "Failed to load dashboard metrics." });
  }
});

/**
 * POST /api/retailer/claim-guest-inquiries
 * Retroactively links guest enquiries matching the retailer's email.
 */
router.post("/retailer/claim-guest-inquiries", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const email = req.user!.email;
    const userId = req.user!.id;
    const profile = await resolveRetailerProfile(userId);
    const businessId = profile?.business_id;

    const { data: claimedRfqs, error } = await insforge.database
      .from("rfqs")
      .update({
        buyer_id: userId,
        business_id: businessId || null,
        is_guest_submission: false,
      })
      .eq("guest_email", email)
      .select("id, rfq_number, title");

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: `Successfully linked ${claimedRfqs?.length || 0} guest enquiries to your retailer account.`,
      data: { claimedCount: claimedRfqs?.length || 0, rfqs: claimedRfqs || [] },
    });
  } catch (err: any) {
    console.error("Claim guest enquiries error:", err);
    return res.status(500).json({ success: false, error: "Failed to claim guest enquiries." });
  }
});

// ====================================================================
// 3. RETAIL PRODUCT CATEGORIES & WHOLESALE DISCOVERY
// ====================================================================

/**
 * GET /api/retailer/categories
 * Retrieves retail categories with subcategories.
 */
router.get("/retailer/categories", async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const { data: categories, error } = await insforge.database
      .from("retail_categories")
      .select("*, retail_subcategories(*)")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: categories || [],
    });
  } catch (err: any) {
    console.error("Fetch retail categories error:", err);
    return res.status(500).json({ success: false, error: "Failed to load categories." });
  }
});

/**
 * GET /api/retailer/products
 * Wholesale product discovery for retailers across all supplier types.
 */
router.get("/retailer/products", async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const { search, category, supplier_type, min_moq, max_price } = req.query;

    let query = insforge.database
      .from("products")
      .select("*, product_images(*), businesses(id, name, city, state, business_type, verification_level)")
      .eq("is_active", true);

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    if (category) {
      query = query.eq("category_id", category);
    }

    if (min_moq) {
      query = query.gte("moq", Number(min_moq));
    }

    if (max_price) {
      query = query.lte("indicative_price", Number(max_price));
    }

    const { data: products, error } = await query.order("created_at", { ascending: false }).limit(50);
    if (error) throw error;

    let filtered = products || [];
    if (supplier_type) {
      filtered = filtered.filter((p: any) => {
        const b = Array.isArray(p.businesses) ? p.businesses[0] : p.businesses;
        return b?.business_type === supplier_type;
      });
    }

    return res.status(200).json({
      success: true,
      data: filtered,
    });
  } catch (err: any) {
    console.error("Retailer products error:", err);
    return res.status(500).json({ success: false, error: "Failed to search wholesale products." });
  }
});

/**
 * GET /api/retailer/suppliers
 * Directory of verified wholesalers, distributors, manufacturers, and bulk suppliers.
 */
router.get("/retailer/suppliers", async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const { category, supplier_type, city, verified_only } = req.query;

    let query = insforge.database
      .from("businesses")
      .select("*, supplier_profiles(*)")
      .in("business_type", ["wholesaler", "distributor", "manufacturer", "raw_material_supplier", "packaging_supplier", "importer"])
      .eq("is_active", true);

    if (supplier_type) {
      query = query.eq("business_type", supplier_type);
    }

    if (city) {
      query = query.ilike("city", `%${city}%`);
    }

    if (verified_only === "true") {
      query = query.neq("verification_level", "unverified");
    }

    const { data: suppliers, error } = await query.limit(50);
    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: suppliers || [],
    });
  } catch (err: any) {
    console.error("Retailer suppliers error:", err);
    return res.status(500).json({ success: false, error: "Failed to search suppliers." });
  }
});

// ====================================================================
// 4. MULTI-BRANCH STORE MANAGEMENT
// ====================================================================

/**
 * GET /api/retailer/branches
 * Lists all registered branches for the retailer.
 */
router.get("/retailer/branches", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const profile = await resolveRetailerProfile(req.user!.id);
    if (!profile) {
      return res.status(200).json({ success: true, data: [] });
    }

    const { data: branches, error } = await insforge.database
      .from("retailer_branches")
      .select("*")
      .eq("retailer_profile_id", profile.id)
      .eq("is_active", true)
      .order("is_main_branch", { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: branches || [],
    });
  } catch (err: any) {
    console.error("Fetch branches error:", err);
    return res.status(500).json({ success: false, error: "Failed to retrieve branches." });
  }
});

/**
 * POST /api/retailer/branches
 * Adds a new branch / store location.
 */
router.post("/retailer/branches", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const profile = await resolveRetailerProfile(req.user!.id);
    if (!profile) {
      return res.status(404).json({ success: false, error: "Retailer profile not found. Please register first." });
    }

    const {
      branch_name,
      store_code,
      address,
      city,
      state,
      pincode,
      manager_name,
      manager_phone,
      manager_email,
      is_main_branch = false,
    } = req.body;

    if (!branch_name || !address || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        error: "Branch name, address, city, state, and pincode are required.",
      });
    }

    const { data: branch, error } = await insforge.database
      .from("retailer_branches")
      .insert([
        {
          retailer_profile_id: profile.id,
          business_id: profile.business_id,
          branch_name,
          store_code: store_code || `STR-${Math.floor(100 + Math.random() * 900)}`,
          address,
          city,
          state,
          pincode,
          manager_name: manager_name || null,
          manager_phone: manager_phone || null,
          manager_email: manager_email || null,
          is_main_branch: Boolean(is_main_branch),
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Enable is_multi_branch flag on profile if not already
    if (!profile.is_multi_branch) {
      await insforge.database
        .from("retailer_profiles")
        .update({ is_multi_branch: true })
        .eq("id", profile.id);
    }

    return res.status(201).json({
      success: true,
      message: "Branch added successfully.",
      data: branch,
    });
  } catch (err: any) {
    console.error("Create branch error:", err);
    return res.status(500).json({ success: false, error: "Failed to create store branch." });
  }
});

/**
 * DELETE /api/retailer/branches/:id
 * Deactivates a branch.
 */
router.delete("/retailer/branches/:id", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const { id } = req.params;
    const profile = await resolveRetailerProfile(req.user!.id);
    if (!profile) {
      return res.status(404).json({ success: false, error: "Retailer profile not found." });
    }

    const { error } = await insforge.database
      .from("retailer_branches")
      .update({ is_active: false })
      .eq("id", id)
      .eq("retailer_profile_id", profile.id);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Branch deactivated successfully.",
    });
  } catch (err: any) {
    console.error("Delete branch error:", err);
    return res.status(500).json({ success: false, error: "Failed to deactivate branch." });
  }
});

// ====================================================================
// 5. RETAILER PURCHASE LISTS (WHOLESALE SOURCING LISTS)
// ====================================================================

/**
 * GET /api/retailer/purchase-lists
 * Lists all purchase lists created by the retailer.
 */
router.get("/retailer/purchase-lists", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const userId = req.user!.id;

    const { data: lists, error } = await insforge.database
      .from("retailer_purchase_lists")
      .select("*, retailer_purchase_list_items(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: lists || [],
    });
  } catch (err: any) {
    console.error("Fetch purchase lists error:", err);
    return res.status(500).json({ success: false, error: "Failed to retrieve purchase lists." });
  }
});

/**
 * POST /api/retailer/purchase-lists
 * Creates a new purchase list with optional line items.
 */
router.post("/retailer/purchase-lists", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const userId = req.user!.id;
    const profile = await resolveRetailerProfile(userId);

    const { title, category, notes, is_recurring = false, items = [] } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: "Title is required for purchase list." });
    }

    const { data: list, error } = await insforge.database
      .from("retailer_purchase_lists")
      .insert([
        {
          user_id: userId,
          business_id: profile?.business_id || null,
          retailer_profile_id: profile?.id || null,
          title,
          category: category || null,
          notes: notes || null,
          is_recurring: Boolean(is_recurring),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Insert items if provided
    let createdItems: any[] = [];
    if (items && Array.isArray(items) && items.length > 0) {
      const itemsToInsert = items.map((it: any) => ({
        list_id: list.id,
        product_id: it.product_id || null,
        product_name: it.product_name || "Item",
        category: it.category || category || null,
        quantity: Number(it.quantity) || 1,
        unit: it.unit || "kg",
        target_unit_price: it.target_unit_price ? Number(it.target_unit_price) : null,
        preferred_supplier_id: it.preferred_supplier_id || null,
        notes: it.notes || null,
      }));

      const { data: insertedItems } = await insforge.database
        .from("retailer_purchase_list_items")
        .insert(itemsToInsert)
        .select();

      createdItems = insertedItems || [];
    }

    return res.status(201).json({
      success: true,
      message: "Purchase list created successfully.",
      data: {
        ...list,
        items: createdItems,
      },
    });
  } catch (err: any) {
    console.error("Create purchase list error:", err);
    return res.status(500).json({ success: false, error: "Failed to create purchase list." });
  }
});

/**
 * POST /api/retailer/purchase-lists/:id/items
 * Adds a product line item to a purchase list.
 */
router.post("/retailer/purchase-lists/:id/items", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const { id } = req.params;
    const { product_id, product_name, category, quantity, unit = "kg", target_unit_price, preferred_supplier_id, notes } = req.body;

    if (!product_name || !quantity) {
      return res.status(400).json({ success: false, error: "Product name and quantity are required." });
    }

    const { data: item, error } = await insforge.database
      .from("retailer_purchase_list_items")
      .insert([
        {
          list_id: id,
          product_id: product_id || null,
          product_name,
          category: category || null,
          quantity: Number(quantity),
          unit,
          target_unit_price: target_unit_price ? Number(target_unit_price) : null,
          preferred_supplier_id: preferred_supplier_id || null,
          notes: notes || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: "Item added to purchase list.",
      data: item,
    });
  } catch (err: any) {
    console.error("Add item to purchase list error:", err);
    return res.status(500).json({ success: false, error: "Failed to add item." });
  }
});

/**
 * DELETE /api/retailer/purchase-lists/:id/items/:itemId
 * Removes an item from a purchase list.
 */
router.delete("/retailer/purchase-lists/:id/items/:itemId", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const { id, itemId } = req.params;

    const { error } = await insforge.database
      .from("retailer_purchase_list_items")
      .delete()
      .eq("id", itemId)
      .eq("list_id", id);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Item removed from purchase list.",
    });
  } catch (err: any) {
    console.error("Remove purchase list item error:", err);
    return res.status(500).json({ success: false, error: "Failed to remove item." });
  }
});

/**
 * POST /api/retailer/purchase-lists/:id/convert-to-rfq
 * Converts a purchase list into an active multi-product RFQ.
 */
router.post("/retailer/purchase-lists/:id/convert-to-rfq", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const { id } = req.params;
    const userId = req.user!.id;
    const profile = await resolveRetailerProfile(userId);

    // 1. Fetch list and items
    const { data: list, error: listErr } = await insforge.database
      .from("retailer_purchase_lists")
      .select("*, retailer_purchase_list_items(*)")
      .eq("id", id)
      .single();

    if (listErr || !list) {
      return res.status(404).json({ success: false, error: "Purchase list not found." });
    }

    const items = list.retailer_purchase_list_items || [];
    if (items.length === 0) {
      return res.status(400).json({ success: false, error: "Cannot convert an empty purchase list to an RFQ." });
    }

    const { delivery_city, delivery_pincode, target_delivery_date, supplier_business_ids = [] } = req.body;

    const rfqNumber = `RFQ-RET-${Date.now().toString().slice(-6)}`;

    // Resolve category id
    const categoryId = list.category || "grocery_fmcg";

    // 2. Create RFQ
    const { data: rfq, error: rfqErr } = await insforge.database
      .from("rfqs")
      .insert([
        {
          rfq_number: rfqNumber,
          buyer_id: userId,
          business_id: profile?.business_id || null,
          title: `Wholesale RFQ: ${list.title}`,
          category_id: categoryId,
          delivery_city: delivery_city || profile?.city || "Mumbai",
          delivery_pincode: delivery_pincode || profile?.pincode || "400001",
          target_delivery_date: target_delivery_date || null,
          dispatch_mode: supplier_business_ids.length > 0 ? "direct" : "broadcast",
          status: "submitted",
          notes: `Generated from purchase list "${list.title}". ${list.notes || ""}`,
        },
      ])
      .select()
      .single();

    if (rfqErr) throw rfqErr;

    // 3. Create RFQ Items
    const rfqItemsToInsert = items.map((it: any) => ({
      rfq_id: rfq.id,
      item_name: it.product_name,
      quantity: Math.max(1, Math.round(Number(it.quantity))),
      unit: it.unit || "kg",
      target_unit_price: it.target_unit_price ? Number(it.target_unit_price) : null,
      specifications: { notes: it.notes, category: it.category },
    }));

    await insforge.database.from("rfq_items").insert(rfqItemsToInsert);

    // 4. Dispatch to selected suppliers if provided
    if (supplier_business_ids.length > 0) {
      const recipientInserts = supplier_business_ids.map((sId: string) => ({
        rfq_id: rfq.id,
        supplier_business_id: sId,
        status: "pending",
      }));
      await insforge.database.from("rfq_recipients").insert(recipientInserts);
    }

    return res.status(201).json({
      success: true,
      message: "Purchase list converted into RFQ successfully.",
      data: {
        rfq_id: rfq.id,
        rfq_number: rfq.rfq_number,
        items_count: items.length,
      },
    });
  } catch (err: any) {
    console.error("Convert to RFQ error:", err);
    return res.status(500).json({ success: false, error: "Failed to convert purchase list to RFQ." });
  }
});

// ====================================================================
// 6. REORDER & RECURRING PURCHASE MANAGEMENT
// ====================================================================

/**
 * GET /api/retailer/reorder-rules
 * Lists all recurring reorder rules configured by the retailer.
 */
router.get("/retailer/reorder-rules", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const userId = req.user!.id;

    const { data: rules, error } = await insforge.database
      .from("retailer_reorder_rules")
      .select("*, businesses(id, name, city)")
      .eq("user_id", userId)
      .order("next_reminder_date", { ascending: true });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: rules || [],
    });
  } catch (err: any) {
    console.error("Fetch reorder rules error:", err);
    return res.status(500).json({ success: false, error: "Failed to retrieve reorder rules." });
  }
});

/**
 * POST /api/retailer/reorder-rules
 * Configures a new reorder rule.
 */
router.post("/retailer/reorder-rules", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const userId = req.user!.id;
    const profile = await resolveRetailerProfile(userId);

    const {
      title,
      product_name,
      product_id,
      purchase_list_id,
      quantity,
      unit = "kg",
      preferred_supplier_id,
      frequency_days = 15,
    } = req.body;

    if (!title || !product_name || !quantity) {
      return res.status(400).json({
        success: false,
        error: "Title, product name, and quantity are required.",
      });
    }

    const days = Math.max(1, Number(frequency_days));
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + days);
    const next_reminder_date = nextDate.toISOString().split("T")[0];

    const { data: rule, error } = await insforge.database
      .from("retailer_reorder_rules")
      .insert([
        {
          user_id: userId,
          business_id: profile?.business_id || null,
          retailer_profile_id: profile?.id || null,
          title,
          product_name,
          product_id: product_id || null,
          purchase_list_id: purchase_list_id || null,
          quantity: Number(quantity),
          unit,
          preferred_supplier_id: preferred_supplier_id || null,
          frequency_days: days,
          next_reminder_date,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Create an initial reminder entry
    await insforge.database.from("retailer_reorder_reminders").insert([
      {
        rule_id: rule.id,
        user_id: userId,
        reminder_date: next_reminder_date,
        status: "due",
      },
    ]);

    return res.status(201).json({
      success: true,
      message: `Reorder reminder configured for every ${days} days.`,
      data: rule,
    });
  } catch (err: any) {
    console.error("Create reorder rule error:", err);
    return res.status(500).json({ success: false, error: "Failed to configure reorder rule." });
  }
});

/**
 * GET /api/retailer/reorder-reminders
 * Lists due and active restock reminders for the retailer.
 */
router.get("/retailer/reorder-reminders", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const userId = req.user!.id;

    const { data: reminders, error } = await insforge.database
      .from("retailer_reorder_reminders")
      .select("*, retailer_reorder_rules(*)")
      .eq("user_id", userId)
      .order("reminder_date", { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: reminders || [],
    });
  } catch (err: any) {
    console.error("Fetch reorder reminders error:", err);
    return res.status(500).json({ success: false, error: "Failed to retrieve reminders." });
  }
});

/**
 * POST /api/retailer/reorder-reminders/:id/action
 * Handles user action on a reminder: 'acknowledge', 'dismiss', or 'create_rfq'.
 */
router.post("/retailer/reorder-reminders/:id/action", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const { id } = req.params;
    const { action } = req.body; // 'acknowledge' | 'dismiss' | 'create_rfq'
    const userId = req.user!.id;
    const profile = await resolveRetailerProfile(userId);

    const { data: reminder, error: remErr } = await insforge.database
      .from("retailer_reorder_reminders")
      .select("*, retailer_reorder_rules(*)")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (remErr || !reminder) {
      return res.status(404).json({ success: false, error: "Reminder not found." });
    }

    if (action === "dismiss") {
      await insforge.database
        .from("retailer_reorder_reminders")
        .update({ status: "dismissed" })
        .eq("id", id);

      return res.status(200).json({ success: true, message: "Reminder dismissed." });
    }

    if (action === "create_rfq") {
      const rule = reminder.retailer_reorder_rules;
      const rfqNumber = `RFQ-RSTK-${Date.now().toString().slice(-6)}`;

      const { data: rfq, error: rfqErr } = await insforge.database
        .from("rfqs")
        .insert([
          {
            rfq_number: rfqNumber,
            buyer_id: userId,
            business_id: profile?.business_id || null,
            title: `Restock RFQ: ${rule?.product_name || "Bulk Restock"}`,
            category_id: "grocery_fmcg",
            delivery_city: profile?.city || "Mumbai",
            delivery_pincode: profile?.pincode || "400001",
            status: "submitted",
            notes: `Auto-generated from reorder rule "${rule?.title}".`,
          },
        ])
        .select()
        .single();

      if (rfqErr) throw rfqErr;

      // Add item
      await insforge.database.from("rfq_items").insert([
        {
          rfq_id: rfq.id,
          item_name: rule?.product_name || "Item",
          quantity: Math.max(1, Math.round(Number(rule?.quantity || 1))),
          unit: rule?.unit || "kg",
        },
      ]);

      // If preferred supplier, dispatch
      if (rule?.preferred_supplier_id) {
        await insforge.database.from("rfq_recipients").insert([
          {
            rfq_id: rfq.id,
            supplier_business_id: rule.preferred_supplier_id,
            status: "pending",
          },
        ]);
      }

      // Update reminder
      await insforge.database
        .from("retailer_reorder_reminders")
        .update({ status: "rfq_created", rfq_id: rfq.id })
        .eq("id", id);

      // Advance rule next_reminder_date
      if (rule) {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + (rule.frequency_days || 15));
        await insforge.database
          .from("retailer_reorder_rules")
          .update({
            last_ordered_at: new Date().toISOString(),
            next_reminder_date: nextDate.toISOString().split("T")[0],
          })
          .eq("id", rule.id);
      }

      return res.status(200).json({
        success: true,
        message: "Restock RFQ created successfully.",
        data: { rfq_id: rfq.id, rfq_number: rfq.rfq_number },
      });
    }

    // Default acknowledge
    await insforge.database
      .from("retailer_reorder_reminders")
      .update({ status: "acknowledged" })
      .eq("id", id);

    return res.status(200).json({ success: true, message: "Reminder acknowledged." });
  } catch (err: any) {
    console.error("Reminder action error:", err);
    return res.status(500).json({ success: false, error: "Failed to update reminder." });
  }
});

// ====================================================================
// 7. SAVED PRODUCTS & SAVED SUPPLIERS
// ====================================================================

/**
 * GET /api/retailer/saved-products
 */
router.get("/retailer/saved-products", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const { data: saved, error } = await insforge.database
      .from("retailer_saved_products")
      .select("*, products(*, product_images(*), businesses(id, name, city, state))")
      .eq("user_id", req.user!.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({ success: true, data: saved || [] });
  } catch (err: any) {
    console.error("Fetch saved products error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch saved products." });
  }
});

/**
 * POST /api/retailer/saved-products
 */
router.post("/retailer/saved-products", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const { product_id, notes } = req.body;
    if (!product_id) {
      return res.status(400).json({ success: false, error: "product_id is required." });
    }

    const { data, error } = await insforge.database
      .from("retailer_saved_products")
      .upsert(
        [
          {
            user_id: req.user!.id,
            product_id,
            notes: notes || null,
          },
        ],
        { onConflict: "user_id,product_id" }
      )
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({ success: true, message: "Product saved to your bookmarks.", data });
  } catch (err: any) {
    console.error("Save product error:", err);
    return res.status(500).json({ success: false, error: "Failed to save product." });
  }
});

/**
 * DELETE /api/retailer/saved-products/:productId
 */
router.delete("/retailer/saved-products/:productId", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const { productId } = req.params;
    const { error } = await insforge.database
      .from("retailer_saved_products")
      .delete()
      .eq("user_id", req.user!.id)
      .eq("product_id", productId);

    if (error) throw error;

    return res.status(200).json({ success: true, message: "Product removed from saved items." });
  } catch (err: any) {
    console.error("Delete saved product error:", err);
    return res.status(500).json({ success: false, error: "Failed to remove product." });
  }
});

/**
 * GET /api/retailer/saved-suppliers
 */
router.get("/retailer/saved-suppliers", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const { data: saved, error } = await insforge.database
      .from("saved_suppliers")
      .select("*, businesses(*, supplier_profiles(*))")
      .eq("user_id", req.user!.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({ success: true, data: saved || [] });
  } catch (err: any) {
    console.error("Fetch saved suppliers error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch saved suppliers." });
  }
});

/**
 * POST /api/retailer/saved-suppliers
 */
router.post("/retailer/saved-suppliers", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const { supplier_business_id } = req.body;
    if (!supplier_business_id) {
      return res.status(400).json({ success: false, error: "supplier_business_id is required." });
    }

    const { data, error } = await insforge.database
      .from("saved_suppliers")
      .upsert(
        [
          {
            user_id: req.user!.id,
            supplier_business_id,
          },
        ],
        { onConflict: "user_id,supplier_business_id" }
      )
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({ success: true, message: "Supplier saved to your directory.", data });
  } catch (err: any) {
    console.error("Save supplier error:", err);
    return res.status(500).json({ success: false, error: "Failed to save supplier." });
  }
});

/**
 * DELETE /api/retailer/saved-suppliers/:supplierId
 */
router.delete("/retailer/saved-suppliers/:supplierId", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const { supplierId } = req.params;
    const { error } = await insforge.database
      .from("saved_suppliers")
      .delete()
      .eq("user_id", req.user!.id)
      .eq("supplier_business_id", supplierId);

    if (error) throw error;

    return res.status(200).json({ success: true, message: "Supplier removed from saved items." });
  } catch (err: any) {
    console.error("Delete saved supplier error:", err);
    return res.status(500).json({ success: false, error: "Failed to remove supplier." });
  }
});

// ====================================================================
// 8. RETAILER RFQS & QUOTATION COMPARISON
// ====================================================================

/**
 * GET /api/retailer/rfqs
 * Lists RFQs created by this retailer.
 */
router.get("/retailer/rfqs", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const { data: rfqs, error } = await insforge.database
      .from("rfqs")
      .select("*, rfq_items(*), quotations(id, status, supplier_business_id)")
      .eq("buyer_id", req.user!.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const mapped = (rfqs || []).map((r) => ({
      ...r,
      quotes_count: r.quotations?.length || 0,
      has_accepted_quote: r.quotations?.some((q: any) => q.status === "accepted"),
    }));

    return res.status(200).json({ success: true, data: mapped });
  } catch (err: any) {
    console.error("Retailer rfqs error:", err);
    return res.status(500).json({ success: false, error: "Failed to retrieve RFQs." });
  }
});

/**
 * POST /api/retailer/rfqs
 * Submits a new wholesale RFQ.
 */
router.post("/retailer/rfqs", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const userId = req.user!.id;
    const profile = await resolveRetailerProfile(userId);

    const {
      title,
      category_id = "grocery_fmcg",
      delivery_city,
      delivery_pincode,
      target_delivery_date,
      dispatch_mode = "broadcast",
      notes,
      items = [],
      supplier_business_ids = [],
    } = req.body;

    if (!title || !items || items.length === 0) {
      return res.status(400).json({ success: false, error: "Title and at least one item are required." });
    }

    const rfqNumber = `RFQ-RET-${Date.now().toString().slice(-6)}`;

    const { data: rfq, error: rfqErr } = await insforge.database
      .from("rfqs")
      .insert([
        {
          rfq_number: rfqNumber,
          buyer_id: userId,
          business_id: profile?.business_id || null,
          title,
          category_id,
          delivery_city: delivery_city || profile?.city || "Mumbai",
          delivery_pincode: delivery_pincode || profile?.pincode || "400001",
          target_delivery_date: target_delivery_date || null,
          dispatch_mode: supplier_business_ids.length > 0 ? "direct" : dispatch_mode,
          status: "submitted",
          notes: notes || null,
        },
      ])
      .select()
      .single();

    if (rfqErr) throw rfqErr;

    // Insert items
    const itemsToInsert = items.map((it: any) => ({
      rfq_id: rfq.id,
      item_name: it.item_name || it.product_name,
      quantity: Math.max(1, Math.round(Number(it.quantity))),
      unit: it.unit || "kg",
      target_unit_price: it.target_unit_price ? Number(it.target_unit_price) : null,
      specifications: it.specifications || {},
    }));

    await insforge.database.from("rfq_items").insert(itemsToInsert);

    // If specific suppliers selected
    if (supplier_business_ids.length > 0) {
      const recipientInserts = supplier_business_ids.map((sId: string) => ({
        rfq_id: rfq.id,
        supplier_business_id: sId,
        status: "pending",
      }));
      await insforge.database.from("rfq_recipients").insert(recipientInserts);
    }

    return res.status(201).json({
      success: true,
      message: "Wholesale RFQ submitted successfully.",
      data: rfq,
    });
  } catch (err: any) {
    console.error("Create retailer RFQ error:", err);
    return res.status(500).json({ success: false, error: "Failed to submit RFQ." });
  }
});

/**
 * GET /api/retailer/rfqs/:id/compare
 * Multi-supplier quotation comparison matrix with decimal-safe calculations.
 */
router.get("/retailer/rfqs/:id/compare", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const { id } = req.params;

    const { data: rfq, error: rfqErr } = await insforge.database
      .from("rfqs")
      .select("*, rfq_items(*)")
      .eq("id", id)
      .eq("buyer_id", req.user!.id)
      .single();

    if (rfqErr || !rfq) {
      return res.status(404).json({ success: false, error: "RFQ not found or unauthorized." });
    }

    const { data: quotes, error: quotesErr } = await insforge.database
      .from("quotations")
      .select("*, quotation_items(*), quotation_costs(*), businesses(id, name, city, state, verification_level)")
      .eq("rfq_id", id);

    if (quotesErr) throw quotesErr;

    const comparisonList = (quotes || []).map((q: any) => {
      const costs = q.quotation_costs?.[0] || q.quotation_costs || {};
      const subtotal = Number(costs.subtotal || 0);
      const packaging = Number(costs.packaging || 0);
      const freight = Number(costs.freight || 0);
      const insurance = Number(costs.insurance || 0);
      const gstAmount = Number(costs.gst_amount || 0);
      const totalLandedCost = Number(costs.total_landed_cost || (subtotal + packaging + freight + insurance + gstAmount));

      const totalQty = (q.quotation_items || []).reduce((acc: number, it: any) => acc + Number(it.quantity || 1), 0);
      const unitLandedCost = totalQty > 0 ? roundToTwoDecimals(totalLandedCost / totalQty) : totalLandedCost;

      const b = Array.isArray(q.businesses) ? q.businesses[0] : q.businesses;
      return {
        quotation_id: q.id,
        quotation_number: q.quotation_number,
        supplier_id: q.supplier_business_id,
        supplier_name: b?.name || "Verified Supplier",
        supplier_city: b?.city || "India",
        supplier_verification: b?.verification_level || "unverified",
        status: q.status,
        valid_until: q.valid_until,
        lead_time_days: q.lead_time_days,
        subtotal: roundToTwoDecimals(subtotal),
        packaging: roundToTwoDecimals(packaging),
        freight: roundToTwoDecimals(freight),
        insurance: roundToTwoDecimals(insurance),
        gst_amount: roundToTwoDecimals(gstAmount),
        total_landed_cost: roundToTwoDecimals(totalLandedCost),
        effective_unit_cost: unitLandedCost,
        items: q.quotation_items || [],
        terms_and_conditions: q.terms_and_conditions,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        rfq,
        quotations: comparisonList,
      },
    });
  } catch (err: any) {
    console.error("Quotation comparison error:", err);
    return res.status(500).json({ success: false, error: "Failed to compare quotations." });
  }
});

/**
 * POST /api/retailer/quotations/:id/accept
 * Accepts winning quotation, creates order and official Purchase Order, and rejects competitors.
 */
router.post("/retailer/quotations/:id/accept", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const { id } = req.params;
    const userId = req.user!.id;
    const profile = await resolveRetailerProfile(userId);

    // 1. Fetch quotation
    const { data: quote, error: quoteErr } = await insforge.database
      .from("quotations")
      .select("*, quotation_items(*), quotation_costs(*), rfqs(*)")
      .eq("id", id)
      .single();

    if (quoteErr || !quote) {
      return res.status(404).json({ success: false, error: "Quotation not found." });
    }

    // Check ownership
    if (quote.rfqs?.buyer_id !== userId) {
      return res.status(403).json({ success: false, error: "Unauthorized. You do not own this RFQ." });
    }

    // Check if RFQ already accepted another quotation
    if (quote.rfqs?.status === "accepted") {
      return res.status(400).json({
        success: false,
        error: "This RFQ has already been accepted with a winning quotation.",
      });
    }

    // 2. Mark this quote as accepted
    await insforge.database
      .from("quotations")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", id);

    // 3. Mark all competitor quotations on same RFQ as rejected
    await insforge.database
      .from("quotations")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("rfq_id", quote.rfq_id)
      .neq("id", id);

    // 4. Update RFQ status
    await insforge.database
      .from("rfqs")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", quote.rfq_id);

    // 5. Generate Order in orders table
    const orderNumber = `ORD-RET-${Date.now().toString().slice(-6)}`;
    const costRecord = quote.quotation_costs?.[0] || quote.quotation_costs || {};
    const totalAmount = Number(costRecord.total_landed_cost || costRecord.subtotal || 0);

    const { data: order, error: ordErr } = await insforge.database
      .from("orders")
      .insert([
        {
          order_number: orderNumber,
          quotation_id: quote.id,
          buyer_id: userId,
          buyer_business_id: profile?.business_id || null,
          supplier_business_id: quote.supplier_business_id,
          status: "deposit_paid",
          total_amount: roundToTwoDecimals(totalAmount),
          carrier: "COVERLY Verified Fleet",
          tracking_number: `TRK-RET-${Date.now().toString().slice(-8)}`,
        },
      ])
      .select()
      .single();

    if (ordErr) throw ordErr;

    // 6. Generate Order Items
    const orderItems = (quote.quotation_items || []).map((it: any) => ({
      order_id: order.id,
      item_name: it.item_name,
      quantity: Number(it.quantity),
      unit: it.unit || "kg",
      unit_price: Number(it.unit_price),
      total_price: Number(it.total_price),
    }));

    if (orderItems.length > 0) {
      await insforge.database.from("order_items").insert(orderItems);
    }

    // 7. Generate official B2B Purchase Order (PO)
    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data: po } = await insforge.database
      .from("purchase_orders")
      .insert([
        {
          po_number: poNumber,
          business_id: profile?.business_id || quote.supplier_business_id,
          buyer_user_id: userId,
          supplier_business_id: quote.supplier_business_id,
          quotation_id: quote.id,
          order_id: order.id,
          po_status: "issued",
          currency: "INR",
          subtotal: roundToTwoDecimals(Number(costRecord.subtotal || totalAmount)),
          freight: roundToTwoDecimals(Number(costRecord.freight || 0)),
          packaging: roundToTwoDecimals(Number(costRecord.packaging || 0)),
          gst_amount: roundToTwoDecimals(Number(costRecord.gst_amount || 0)),
          total_amount: roundToTwoDecimals(totalAmount),
          delivery_address: profile?.store_address || quote.rfqs?.delivery_city || "Retail Store",
          delivery_city: profile?.city || quote.rfqs?.delivery_city || "City",
          delivery_state: profile?.state || "State",
          delivery_pincode: profile?.pincode || quote.rfqs?.delivery_pincode || "000000",
          payment_terms: "100% on Dispatch / Credit 15 Days",
          terms_and_conditions: quote.terms_and_conditions || "Standard Wholesale Sourcing Terms.",
        },
      ])
      .select()
      .single();

    return res.status(200).json({
      success: true,
      message: "Quotation accepted! Order and official Purchase Order created successfully.",
      data: {
        order_id: order.id,
        order_number: order.order_number,
        po_number: po?.po_number || poNumber,
        total_amount: order.total_amount,
      },
    });
  } catch (err: any) {
    console.error("Accept quotation error:", err);
    return res.status(500).json({ success: false, error: "Failed to accept quotation." });
  }
});

// ====================================================================
// 9. RETAILER ORDERS & SHIPMENT TRACKING
// ====================================================================

/**
 * GET /api/retailer/orders
 * Lists wholesale orders placed by this retailer.
 */
router.get("/retailer/orders", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const { data: orders, error } = await insforge.database
      .from("orders")
      .select("*, order_items(*), businesses(id, name, city, state, business_type)")
      .eq("buyer_id", req.user!.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({ success: true, data: orders || [] });
  } catch (err: any) {
    console.error("Fetch retailer orders error:", err);
    return res.status(500).json({ success: false, error: "Failed to retrieve orders." });
  }
});

/**
 * GET /api/retailer/orders/:id
 * Detailed order information with logistics tracking progression.
 */
router.get("/retailer/orders/:id", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const { id } = req.params;

    const { data: order, error } = await insforge.database
      .from("orders")
      .select("*, order_items(*), businesses(id, name, city, state, phone, email, business_type), quotations(*, quotation_costs(*))")
      .eq("id", id)
      .eq("buyer_id", req.user!.id)
      .single();

    if (error || !order) {
      return res.status(404).json({ success: false, error: "Order not found." });
    }

    // Determine tracking stages
    const stages = [
      { name: "Order Created", status: "completed", date: order.created_at },
      { name: "Supplier Confirmed", status: ["deposit_paid", "in_production", "quality_check", "shipped", "delivered", "completed"].includes(order.status) ? "completed" : "pending" },
      { name: "In Production / Packing", status: ["in_production", "quality_check", "shipped", "delivered", "completed"].includes(order.status) ? "completed" : "pending" },
      { name: "Dispatched with Carrier", status: ["shipped", "delivered", "completed"].includes(order.status) ? "completed" : "pending", tracking: order.tracking_number, carrier: order.carrier },
      { name: "Delivered to Retail Store", status: ["delivered", "completed"].includes(order.status) ? "completed" : "pending" },
    ];

    return res.status(200).json({
      success: true,
      data: {
        ...order,
        tracking_stages: stages,
      },
    });
  } catch (err: any) {
    console.error("Fetch order detail error:", err);
    return res.status(500).json({ success: false, error: "Failed to retrieve order." });
  }
});

// ====================================================================
// 10. RETAILER ANALYTICS & PROCUREMENT HISTORY
// ====================================================================

/**
 * GET /api/retailer/analytics
 * Computes procurement insights, top purchased products, spend by category, and average order value.
 */
router.get("/retailer/analytics", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const userId = req.user!.id;

    const { data: orders } = await insforge.database
      .from("orders")
      .select("id, status, total_amount, created_at, order_items(*), businesses(id, name)")
      .eq("buyer_id", userId);

    const orderList = orders || [];
    const totalPurchases = orderList.reduce((acc, o) => acc + Number(o.total_amount || 0), 0);
    const completedCount = orderList.filter((o) => ["delivered", "completed"].includes(o.status)).length;
    const avgOrderValue = orderList.length > 0 ? roundToTwoDecimals(totalPurchases / orderList.length) : 0;

    // Supplier spend map
    const supplierSpend: Record<string, { name: string; amount: number; orderCount: number }> = {};
    const productFrequency: Record<string, { name: string; totalQty: number; totalSpend: number; unit: string }> = {};

    orderList.forEach((ord: any) => {
      const biz = Array.isArray(ord.businesses) ? ord.businesses[0] : ord.businesses;
      const sId = biz?.id || "unknown";
      const sName = biz?.name || "Verified Wholesaler";
      if (!supplierSpend[sId]) {
        supplierSpend[sId] = { name: sName, amount: 0, orderCount: 0 };
      }
      supplierSpend[sId].amount += Number(ord.total_amount || 0);
      supplierSpend[sId].orderCount += 1;

      (ord.order_items || []).forEach((item: any) => {
        const pName = item.item_name || "General Wholesale Item";
        if (!productFrequency[pName]) {
          productFrequency[pName] = { name: pName, totalQty: 0, totalSpend: 0, unit: item.unit || "kg" };
        }
        productFrequency[pName].totalQty += Number(item.quantity || 1);
        productFrequency[pName].totalSpend += Number(item.total_price || 0);
      });
    });

    return res.status(200).json({
      success: true,
      data: {
        total_purchases_amount: roundToTwoDecimals(totalPurchases),
        total_orders_count: orderList.length,
        completed_orders_count: completedCount,
        average_order_value: avgOrderValue,
        top_suppliers: Object.values(supplierSpend).sort((a, b) => b.amount - a.amount).slice(0, 5),
        most_purchased_products: Object.values(productFrequency).sort((a, b) => b.totalQty - a.totalQty).slice(0, 8),
      },
    });
  } catch (err: any) {
    console.error("Retailer analytics error:", err);
    return res.status(500).json({ success: false, error: "Failed to generate analytics." });
  }
});

// ====================================================================
// 11. RETAILER DOCUMENT VAULT
// ====================================================================

/**
 * GET /api/retailer/documents
 */
router.get("/retailer/documents", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const profile = await resolveRetailerProfile(req.user!.id);
    if (!profile) {
      return res.status(200).json({ success: true, data: [] });
    }

    const { data: docs, error } = await insforge.database
      .from("retailer_documents")
      .select("*")
      .eq("retailer_profile_id", profile.id)
      .order("uploaded_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({ success: true, data: docs || [] });
  } catch (err: any) {
    console.error("Fetch retailer documents error:", err);
    return res.status(500).json({ success: false, error: "Failed to load documents." });
  }
});

/**
 * POST /api/retailer/documents
 */
router.post("/retailer/documents", authenticateUser, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const profile = await resolveRetailerProfile(req.user!.id);
    if (!profile) {
      return res.status(404).json({ success: false, error: "Retailer profile not found." });
    }

    const { doc_type, file_name, file_url, file_key, file_size_bytes } = req.body;

    if (!doc_type || !file_name || !file_url) {
      return res.status(400).json({ success: false, error: "Document type, file name, and file URL are required." });
    }

    const { data: doc, error } = await insforge.database
      .from("retailer_documents")
      .insert([
        {
          user_id: req.user!.id,
          retailer_profile_id: profile.id,
          doc_type,
          file_name,
          file_url,
          file_key: file_key || `ret-doc-${Date.now()}`,
          file_size_bytes: file_size_bytes ? Number(file_size_bytes) : null,
          verification_status: "pending",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: "Document uploaded to compliance vault.",
      data: doc,
    });
  } catch (err: any) {
    console.error("Upload document error:", err);
    return res.status(500).json({ success: false, error: "Failed to upload document." });
  }
});

// ====================================================================
// 12. ADMIN RETAILER GOVERNANCE & OVERSIGHT
// ====================================================================

/**
 * GET /api/admin/retailers
 * Administrative listing of all retailer accounts with verification filters.
 */
router.get("/admin/retailers", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const { retail_type, verification_status, city } = req.query;

    let query = insforge.database
      .from("retailer_profiles")
      .select("*, users(id, email, full_name, phone), businesses(id, name, gstin), retailer_branches(*)")
      .order("created_at", { ascending: false });

    if (retail_type) {
      query = query.eq("retail_type", retail_type);
    }

    if (verification_status) {
      query = query.eq("verification_status", verification_status);
    }

    if (city) {
      query = query.ilike("city", `%${city}%`);
    }

    const { data: retailers, error } = await query;
    if (error) throw error;

    return res.status(200).json({ success: true, data: retailers || [] });
  } catch (err: any) {
    console.error("Admin retailers error:", err);
    return res.status(500).json({ success: false, error: "Failed to load retailers." });
  }
});

/**
 * POST /api/admin/retailers/:id/verify
 * Approves or rejects a retailer's business verification.
 */
router.post("/admin/retailers/:id/verify", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const { id } = req.params;
    const { status, notes } = req.body; // 'verified' | 'rejected'

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, error: "Status must be 'verified' or 'rejected'." });
    }

    const { data: updated, error } = await insforge.database
      .from("retailer_profiles")
      .update({
        verification_status: status,
        verification_notes: notes || `Marked ${status} by admin audit.`,
        verified_by: req.user!.id,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // If verified, also update linked business if exists
    if (status === "verified" && updated?.business_id) {
      await insforge.database
        .from("businesses")
        .update({ verification_level: "document_verified" })
        .eq("id", updated.business_id);
    }

    return res.status(200).json({
      success: true,
      message: `Retailer verification status updated to ${status}.`,
      data: updated,
    });
  } catch (err: any) {
    console.error("Admin verify retailer error:", err);
    return res.status(500).json({ success: false, error: "Failed to update retailer verification." });
  }
});

/**
 * GET /api/admin/retailer-stats
 * Aggregated administrative metrics across the retailer ecosystem.
 */
router.get("/admin/retailer-stats", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const insforge = getInsForgeClient();
    if (!insforge) {
      return res.status(503).json({ success: false, error: "Database service unavailable." });
    }

    const { data: profiles } = await insforge.database
      .from("retailer_profiles")
      .select("id, retail_type, verification_status, is_multi_branch");

    const list = profiles || [];
    const totalRetailers = list.length;
    const verifiedRetailers = list.filter((p) => p.verification_status === "verified").length;
    const pendingVerification = list.filter((p) => p.verification_status === "pending").length;
    const kiranaCount = list.filter((p) => p.retail_type === "kirana").length;
    const supermarketCount = list.filter((p) => ["supermarket", "departmental"].includes(p.retail_type)).length;
    const multiBranchCount = list.filter((p) => p.is_multi_branch).length;

    // Total retail orders
    const { count: totalOrders } = await insforge.database
      .from("orders")
      .select("*", { count: "exact", head: true });

    return res.status(200).json({
      success: true,
      data: {
        totalRetailers,
        verifiedRetailers,
        pendingVerification,
        individualShops: totalRetailers - multiBranchCount,
        multiBranchBusinesses: multiBranchCount,
        kiranaStores: kiranaCount,
        supermarkets: supermarketCount,
        totalOrders: totalOrders || 0,
      },
    });
  } catch (err: any) {
    console.error("Admin retailer stats error:", err);
    return res.status(500).json({ success: false, error: "Failed to load admin stats." });
  }
});

export default router;
