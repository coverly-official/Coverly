import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";
import { authenticateUser, requireAdmin } from "../middleware/auth.js";
import { roundToTwoDecimals } from "../lib/landed-cost.js";
import crypto from "crypto";

const router = Router();

// Helper to resolve business ID for authenticated user
async function resolveUserBusiness(userId: string) {
  const insforge = getInsForgeClient();
  if (!insforge) return null;

  // 1. Direct membership
  const { data: member } = await insforge.database
    .from("business_members")
    .select("business_id, role_in_business, permissions, spending_limit, branch_id, businesses(*)")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (member && member.businesses) {
    return {
      businessId: member.business_id,
      roleInBusiness: member.role_in_business,
      permissions: member.permissions || ["view"],
      spendingLimit: member.spending_limit,
      branchId: member.branch_id || null,
      business: Array.isArray(member.businesses) ? member.businesses[0] : member.businesses,
    };
  }

  // 2. Direct business matching email
  const { data: user } = await insforge.database
    .from("users")
    .select("email")
    .eq("id", userId)
    .single();

  if (user) {
    const { data: biz } = await insforge.database
      .from("businesses")
      .select("*")
      .eq("email", user.email)
      .maybeSingle();

    if (biz) {
      return {
        businessId: biz.id,
        roleInBusiness: "owner",
        permissions: ["view", "create", "edit", "approve", "reject", "manage", "export"],
        spendingLimit: null,
        branchId: null,
        business: biz,
      };
    }
  }

  return null;
}

// ====================================================================
// 1. Buyer Profile & Account Management
// ====================================================================

// GET /api/buyer/profile
router.get("/buyer/profile", authenticateUser, async (req, res) => {
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const bizData = await resolveUserBusiness(user.id);

    // Fetch buyer_profile record
    let buyerProfile: any = null;
    if (bizData?.businessId) {
      const { data: prof } = await insforge.database
        .from("buyer_profiles")
        .select("*")
        .eq("business_id", bizData.businessId)
        .maybeSingle();
      buyerProfile = prof;
    } else {
      const { data: prof } = await insforge.database
        .from("buyer_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      buyerProfile = prof;
    }

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          roles: user.roles,
        },
        business: bizData?.business || null,
        role_in_business: bizData?.roleInBusiness || (buyerProfile?.account_type === "individual" ? "individual_buyer" : "owner"),
        permissions: bizData?.permissions || ["view"],
        spending_limit: bizData?.spendingLimit || null,
        profile: buyerProfile,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/buyer/register-account
router.post("/buyer/register-account", authenticateUser, async (req, res) => {
  const user = req.user!;
  const {
    account_type = "business", // "individual" | "business"
    business_name,
    legal_name,
    business_category,
    industry_type,
    gstin,
    pan,
    city,
    state,
    pincode,
    address,
    phone,
    website,
    annual_sourcing_budget,
    purchasing_categories = [],
  } = req.body;

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    let businessId: string | null = null;

    if (account_type === "business") {
      if (!business_name?.trim()) {
        return res.status(400).json({ success: false, error: "Business name is required for company accounts." });
      }

      // Check if business already exists
      const { data: existingBiz } = await insforge.database
        .from("businesses")
        .select("id")
        .eq("name", business_name.trim())
        .maybeSingle();

      if (existingBiz) {
        businessId = existingBiz.id;
      } else {
        const slug = `${business_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
        const { data: newBiz, error: bizErr } = await insforge.database
          .from("businesses")
          .insert([
            {
              name: business_name.trim(),
              legal_name: legal_name?.trim() || business_name.trim(),
              slug,
              business_type: "buyer",
              gstin: gstin ? gstin.trim().toUpperCase() : null,
              pan: pan ? pan.trim().toUpperCase() : null,
              city: city?.trim() || "Mumbai",
              state: state?.trim() || "Maharashtra",
              pincode: pincode?.trim() || "400001",
              address: address?.trim() || null,
              phone: phone?.trim() || user.phone || null,
              email: user.email,
              website: website?.trim() || null,
              verification_level: "unverified",
              is_active: true,
            },
          ])
          .select()
          .single();

        if (bizErr) {
          return res.status(500).json({ success: false, error: bizErr.message });
        }
        businessId = newBiz.id;

        // Register member as Owner with full permissions
        await insforge.database.from("business_members").insert([
          {
            business_id: businessId,
            user_id: user.id,
            role_in_business: "owner",
            permissions: ["view", "create", "edit", "approve", "reject", "manage", "export"],
          },
        ]);
      }
    }

    // Insert or update buyer_profiles
    const profilePayload: any = {
      user_id: user.id,
      account_type,
      annual_sourcing_budget: annual_sourcing_budget ? parseFloat(annual_sourcing_budget) : null,
      primary_categories: purchasing_categories,
      purchasing_categories,
      industry_type: industry_type || business_category || null,
      verification_status: "unverified",
    };

    if (businessId) {
      profilePayload.business_id = businessId;
    }

    const { data: profile, error: profErr } = await insforge.database
      .from("buyer_profiles")
      .upsert(profilePayload)
      .select()
      .single();

    if (profErr) {
      // In case business_id constraint collision, update by user_id
      await insforge.database
        .from("buyer_profiles")
        .update(profilePayload)
        .eq("user_id", user.id);
    }

    // Ensure user has 'buyer' role
    await insforge.database
      .from("user_roles")
      .insert([{ user_id: user.id, role: "buyer" }])
      .select()
      .maybeSingle();

    return res.status(201).json({
      success: true,
      message: `Successfully registered as ${account_type === "business" ? "Business Owner" : "Individual Buyer"}.`,
      profile,
      business_id: businessId,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/buyer/profile (Update Details)
router.put("/buyer/profile", authenticateUser, async (req, res) => {
  const user = req.user!;
  const {
    business_name,
    legal_name,
    gstin,
    pan,
    city,
    state,
    pincode,
    address,
    phone,
    website,
    industry_type,
    purchasing_categories,
    company_logo_url,
  } = req.body;

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const bizData = await resolveUserBusiness(user.id);

    if (bizData?.businessId) {
      const bizUpdate: any = { updated_at: new Date().toISOString() };
      if (business_name?.trim()) bizUpdate.name = business_name.trim();
      if (legal_name !== undefined) bizUpdate.legal_name = legal_name;
      if (gstin !== undefined) bizUpdate.gstin = gstin ? gstin.trim().toUpperCase() : null;
      if (pan !== undefined) bizUpdate.pan = pan ? pan.trim().toUpperCase() : null;
      if (city?.trim()) bizUpdate.city = city.trim();
      if (state?.trim()) bizUpdate.state = state.trim();
      if (pincode?.trim()) bizUpdate.pincode = pincode.trim();
      if (address !== undefined) bizUpdate.address = address;
      if (phone !== undefined) bizUpdate.phone = phone;
      if (website !== undefined) bizUpdate.website = website;

      await insforge.database.from("businesses").update(bizUpdate).eq("id", bizData.businessId);

      const buyerUpdate: any = {};
      if (industry_type !== undefined) buyerUpdate.industry_type = industry_type;
      if (purchasing_categories !== undefined) buyerUpdate.purchasing_categories = purchasing_categories;
      if (company_logo_url !== undefined) buyerUpdate.company_logo_url = company_logo_url;

      if (Object.keys(buyerUpdate).length > 0) {
        await insforge.database
          .from("buyer_profiles")
          .update(buyerUpdate)
          .eq("business_id", bizData.businessId);
      }
    }

    return res.json({ success: true, message: "Buyer profile successfully updated." });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/buyer/stats (Actual Database Metrics)
router.get("/buyer/stats", authenticateUser, async (req, res) => {
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const bizData = await resolveUserBusiness(user.id);
    const businessId = bizData?.businessId;

    // 1. RFQs count
    let rfqQuery = insforge.database.from("rfqs").select("id", { count: "exact", head: true });
    if (businessId) {
      rfqQuery = rfqQuery.or(`buyer_id.eq.${user.id},business_id.eq.${businessId}`);
    } else {
      rfqQuery = rfqQuery.eq("buyer_id", user.id);
    }
    const { count: totalRfqs } = await rfqQuery;

    // Active RFQs
    let activeRfqQuery = insforge.database
      .from("rfqs")
      .select("id", { count: "exact", head: true })
      .not("status", "in", '("closed","cancelled")');
    if (businessId) {
      activeRfqQuery = activeRfqQuery.or(`buyer_id.eq.${user.id},business_id.eq.${businessId}`);
    } else {
      activeRfqQuery = activeRfqQuery.eq("buyer_id", user.id);
    }
    const { count: activeRfqs } = await activeRfqQuery;

    // 2. Orders count
    let orderQuery = insforge.database.from("orders").select("id, status");
    if (businessId) {
      orderQuery = orderQuery.or(`buyer_id.eq.${user.id},buyer_business_id.eq.${businessId}`);
    } else {
      orderQuery = orderQuery.eq("buyer_id", user.id);
    }
    const { data: orderList } = await orderQuery;

    const totalOrders = orderList?.length || 0;
    const activeOrders = orderList?.filter((o) => !["completed", "cancelled"].includes(o.status)).length || 0;
    const completedOrders = orderList?.filter((o) => o.status === "completed").length || 0;
    const cancelledOrders = orderList?.filter((o) => o.status === "cancelled").length || 0;

    // 3. Saved Items
    const { count: savedSuppliersCount } = await insforge.database
      .from("saved_suppliers")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    const { count: savedProductsCount } = await insforge.database
      .from("buyer_saved_products")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    // 4. Purchase Requests pending approval
    let prPendingCount = 0;
    if (businessId) {
      const { count } = await insforge.database
        .from("purchase_requests")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("status", "pending_approval");
      prPendingCount = count || 0;
    }

    return res.json({
      success: true,
      data: {
        total_rfqs: totalRfqs || 0,
        active_rfqs: activeRfqs || 0,
        received_quotations: 0,
        accepted_quotations: completedOrders + activeOrders,
        active_orders: activeOrders,
        completed_orders: completedOrders,
        cancelled_orders: cancelledOrders,
        total_orders: totalOrders,
        saved_suppliers: savedSuppliersCount || 0,
        saved_products: savedProductsCount || 0,
        pending_purchase_requests: prPendingCount,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/buyer/guest-claim (Claim Anonymous RFQs/Enquiries)
router.post("/buyer/guest-claim", authenticateUser, async (req, res) => {
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const bizData = await resolveUserBusiness(user.id);
    const businessId = bizData?.businessId || null;

    // 1. Link guest RFQs
    const { data: claimedRfqs, error: rfqErr } = await insforge.database
      .from("rfqs")
      .update({
        buyer_id: user.id,
        business_id: businessId,
        is_guest_submission: false,
      })
      .eq("guest_email", user.email)
      .is("buyer_id", null)
      .select();

    return res.json({
      success: true,
      message: `Successfully linked ${claimedRfqs?.length || 0} historical enquiries to your buyer account.`,
      claimed_count: claimedRfqs?.length || 0,
      rfqs: claimedRfqs || [],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 2. Business Team & Employee Management
// ====================================================================

// GET /api/buyer/team
router.get("/buyer/team", authenticateUser, async (req, res) => {
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const bizData = await resolveUserBusiness(user.id);
    if (!bizData?.businessId) {
      return res.json({ success: true, data: { members: [], invitations: [] } });
    }

    const [membersRes, invitesRes] = await Promise.all([
      insforge.database
        .from("business_members")
        .select("id, role_in_business, permissions, spending_limit, department, branch_id, is_active, created_at, users(id, email, full_name, phone, avatar_url), business_branches(id, branch_name, city)")
        .eq("business_id", bizData.businessId)
        .eq("is_active", true),
      insforge.database
        .from("business_invitations")
        .select("*, business_branches(id, branch_name, city)")
        .eq("business_id", bizData.businessId)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ]);

    return res.json({
      success: true,
      data: {
        members: membersRes.data || [],
        invitations: invitesRes.data || [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/buyer/team/invite
router.post("/buyer/team/invite", authenticateUser, async (req, res) => {
  const user = req.user!;
  const {
    email,
    full_name,
    role_in_business = "purchase_staff",
    permissions = ["view", "create"],
    department,
    spending_limit,
    branch_id,
  } = req.body;

  if (!email?.trim() || !full_name?.trim()) {
    return res.status(400).json({ success: false, error: "Email and full name are required." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const bizData = await resolveUserBusiness(user.id);
    if (!bizData?.businessId) {
      return res.status(403).json({ success: false, error: "Only registered business accounts can invite team members." });
    }

    // Check authority
    if (!["owner", "admin", "business_manager"].includes(bizData.roleInBusiness)) {
      return res.status(403).json({ success: false, error: "Insufficient permissions to invite team members." });
    }

    // Generate unique token
    const token = `INV-${crypto.randomBytes(16).toString("hex").toUpperCase()}`;

    const { data: invitation, error } = await insforge.database
      .from("business_invitations")
      .insert([
        {
          business_id: bizData.businessId,
          invited_by_user_id: user.id,
          email: email.trim().toLowerCase(),
          full_name: full_name.trim(),
          role_in_business,
          permissions,
          department: department || null,
          spending_limit: spending_limit ? parseFloat(spending_limit) : null,
          branch_id: branch_id || null,
          invitation_token: token,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    try {
      await insforge.database.from("employee_activity_logs").insert([
        {
          business_id: bizData.businessId,
          user_id: user.id,
          branch_id: branch_id || null,
          activity_type: "member_invited",
          description: `Invitation sent to ${email} for role '${role_in_business}'.`,
          entity_type: "business_invitation",
          entity_id: invitation.id,
          metadata: { email, role_in_business, permissions },
        },
      ]);
    } catch {
      // Ignored
    }

    return res.status(201).json({
      success: true,
      message: `Invitation generated for ${email}.`,
      invitation,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/buyer/team/accept-invite
router.post("/buyer/team/accept-invite", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { invitation_token } = req.body;

  if (!invitation_token?.trim()) {
    return res.status(400).json({ success: false, error: "Invitation token required." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: inv, error: invErr } = await insforge.database
      .from("business_invitations")
      .select("*")
      .eq("invitation_token", invitation_token.trim())
      .eq("status", "pending")
      .single();

    if (invErr || !inv) {
      return res.status(404).json({ success: false, error: "Invalid or expired invitation token." });
    }

    // Insert membership
    await insforge.database
      .from("business_members")
      .upsert({
        business_id: inv.business_id,
        user_id: user.id,
        branch_id: inv.branch_id || null,
        role_in_business: inv.role_in_business,
        permissions: inv.permissions,
        spending_limit: inv.spending_limit,
        department: inv.department,
        is_active: true,
        invited_by: inv.invited_by_user_id,
      });

    // Mark invitation accepted
    await insforge.database
      .from("business_invitations")
      .update({ status: "accepted" })
      .eq("id", inv.id);

    try {
      await insforge.database.from("employee_activity_logs").insert([
        {
          business_id: inv.business_id,
          user_id: user.id,
          branch_id: inv.branch_id || null,
          activity_type: "member_joined",
          description: `User ${user.email} joined business team as '${inv.role_in_business}'.`,
          entity_type: "business_member",
          metadata: { role: inv.role_in_business },
        },
      ]);
    } catch {
      // Ignored
    }

    return res.json({
      success: true,
      message: `You have joined the business team as '${inv.role_in_business}'.`,
      business_id: inv.business_id,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/buyer/team/:memberId (Update Role & Permissions & Branch)
router.patch("/buyer/team/:memberId", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { memberId } = req.params;
  const { role_in_business, permissions, spending_limit, department, branch_id } = req.body;

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const bizData = await resolveUserBusiness(user.id);
    if (!bizData?.businessId || !["owner", "admin", "business_manager"].includes(bizData.roleInBusiness)) {
      return res.status(403).json({ success: false, error: "Only business owners can update member permissions." });
    }

    const payload: any = {};
    if (role_in_business) payload.role_in_business = role_in_business;
    if (permissions) payload.permissions = permissions;
    if (spending_limit !== undefined) payload.spending_limit = spending_limit ? parseFloat(spending_limit) : null;
    if (department !== undefined) payload.department = department;
    if (branch_id !== undefined) payload.branch_id = branch_id || null;

    const { data: updated, error } = await insforge.database
      .from("business_members")
      .update(payload)
      .eq("id", memberId)
      .eq("business_id", bizData.businessId)
      .select("*, business_branches(id, branch_name, city)")
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    try {
      await insforge.database.from("employee_activity_logs").insert([
        {
          business_id: bizData.businessId,
          user_id: user.id,
          branch_id: payload.branch_id || null,
          activity_type: "permissions_updated",
          description: `Permissions/role updated for team member ID ${memberId}.`,
          entity_type: "business_member",
          entity_id: memberId,
          metadata: payload,
        },
      ]);
    } catch {
      // Ignored
    }

    return res.json({ success: true, message: "Member permissions updated.", member: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/buyer/team/:memberId/activity (Employee Activity Trail)
router.get("/buyer/team/:memberId/activity", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { memberId } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const bizData = await resolveUserBusiness(user.id);
    if (!bizData?.businessId || !["owner", "admin", "business_manager"].includes(bizData.roleInBusiness)) {
      return res.status(403).json({ success: false, error: "Only business owners can inspect employee activity." });
    }

    const { data: member } = await insforge.database
      .from("business_members")
      .select("user_id, business_id")
      .eq("id", memberId)
      .eq("business_id", bizData.businessId)
      .single();

    if (!member) {
      return res.status(404).json({ success: false, error: "Employee member not found." });
    }

    const { data: activities, error } = await insforge.database
      .from("employee_activity_logs")
      .select("*")
      .eq("user_id", member.user_id)
      .eq("business_id", bizData.businessId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return res.json({ success: true, data: activities || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/buyer/team/:memberId (Revoke Access)
router.delete("/buyer/team/:memberId", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { memberId } = req.params;

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const bizData = await resolveUserBusiness(user.id);
    if (!bizData?.businessId || !["owner", "admin"].includes(bizData.roleInBusiness)) {
      return res.status(403).json({ success: false, error: "Only business owners can revoke team members." });
    }

    // Soft deactivate to preserve historical PO / PR links
    await insforge.database
      .from("business_members")
      .update({ is_active: false })
      .eq("id", memberId)
      .eq("business_id", bizData.businessId);

    return res.json({ success: true, message: "Member access revoked without affecting historical records." });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 3. Branches & Delivery Warehouses
// ====================================================================

// GET /api/buyer/branches
router.get("/buyer/branches", authenticateUser, async (req, res) => {
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const bizData = await resolveUserBusiness(user.id);
    if (!bizData?.businessId) return res.json({ success: true, data: [] });

    const { data: branches, error } = await insforge.database
      .from("business_branches")
      .select("*")
      .eq("business_id", bizData.businessId)
      .eq("is_active", true)
      .order("is_headquarters", { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: branches || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/buyer/branches
router.post("/buyer/branches", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { branch_name, address, city, state, pincode, phone, email, gstin, is_headquarters } = req.body;

  if (!branch_name || !address || !city || !state || !pincode) {
    return res.status(400).json({ success: false, error: "Branch name and full address are required." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const bizData = await resolveUserBusiness(user.id);
    if (!bizData?.businessId) return res.status(403).json({ success: false, error: "Business account required." });

    const { data: branch, error } = await insforge.database
      .from("business_branches")
      .insert([
        {
          business_id: bizData.businessId,
          branch_name: branch_name.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          phone: phone || null,
          email: email || null,
          gstin: gstin ? gstin.trim().toUpperCase() : null,
          is_headquarters: Boolean(is_headquarters),
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, message: "Branch added.", branch });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 4. Saved Suppliers & Sourcing Lists
// ====================================================================

// GET /api/buyer/saved-suppliers
router.get("/buyer/saved-suppliers", authenticateUser, async (req, res) => {
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data: saved, error } = await insforge.database
      .from("saved_suppliers")
      .select("id, created_at, businesses!supplier_business_id(*)")
      .eq("user_id", user.id);

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: saved || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/buyer/saved-suppliers
router.post("/buyer/saved-suppliers", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { supplier_business_id } = req.body;
  if (!supplier_business_id) return res.status(400).json({ success: false, error: "Supplier business ID required." });

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data: saved, error } = await insforge.database
      .from("saved_suppliers")
      .insert([{ user_id: user.id, supplier_business_id }])
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, message: "Supplier saved to your procurement favorites.", data: saved });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/buyer/saved-suppliers/:supplierBusinessId
router.delete("/buyer/saved-suppliers/:supplierBusinessId", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { supplierBusinessId } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    await insforge.database
      .from("saved_suppliers")
      .delete()
      .eq("user_id", user.id)
      .eq("supplier_business_id", supplierBusinessId);

    return res.json({ success: true, message: "Supplier removed from saved list." });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/buyer/saved-products
router.get("/buyer/saved-products", authenticateUser, async (req, res) => {
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data: saved, error } = await insforge.database
      .from("buyer_saved_products")
      .select("id, created_at, products(*, businesses(id, name, city, verification_level))")
      .eq("user_id", user.id);

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: saved || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/buyer/saved-products
router.post("/buyer/saved-products", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { product_id } = req.body;
  if (!product_id) return res.status(400).json({ success: false, error: "Product ID required." });

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const bizData = await resolveUserBusiness(user.id);
    const { data: saved, error } = await insforge.database
      .from("buyer_saved_products")
      .insert([{ user_id: user.id, business_id: bizData?.businessId || null, product_id }])
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, message: "Product saved to your shortlist.", data: saved });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/buyer/saved-products/:productId
router.delete("/buyer/saved-products/:productId", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { productId } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    await insforge.database
      .from("buyer_saved_products")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", productId);

    return res.json({ success: true, message: "Product removed from saved list." });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 5. Purchase Requests & Internal Approvals
// ====================================================================

// GET /api/buyer/purchase-requests
router.get("/buyer/purchase-requests", authenticateUser, async (req, res) => {
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const bizData = await resolveUserBusiness(user.id);
    if (!bizData?.businessId) {
      return res.json({ success: true, data: [] });
    }

    const { data: prs, error } = await insforge.database
      .from("purchase_requests")
      .select("*, purchase_request_items(*), users!requester_id(full_name, email)")
      .eq("business_id", bizData.businessId)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: prs || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/buyer/purchase-requests
router.post("/buyer/purchase-requests", authenticateUser, async (req, res) => {
  const user = req.user!;
  const {
    title,
    department,
    category_id,
    estimated_amount = 0,
    currency = "INR",
    priority = "medium",
    justification,
    target_delivery_date,
    items = [],
    quotation_id,
    rfq_id,
  } = req.body;

  if (!title?.trim()) {
    return res.status(400).json({ success: false, error: "Purchase request title is required." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const bizData = await resolveUserBusiness(user.id);
    if (!bizData?.businessId) {
      return res.status(403).json({ success: false, error: "You must belong to a business account to create purchase requests." });
    }

    const prNumber = `PR-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const { data: pr, error: prErr } = await insforge.database
      .from("purchase_requests")
      .insert([
        {
          pr_number: prNumber,
          business_id: bizData.businessId,
          requester_id: user.id,
          title: title.trim(),
          department: department || bizData.roleInBusiness,
          category_id: category_id || null,
          estimated_amount: parseFloat(estimated_amount) || 0,
          currency,
          priority,
          status: "pending_approval",
          justification: justification?.trim() || null,
          target_delivery_date: target_delivery_date || null,
          quotation_id: quotation_id || null,
          rfq_id: rfq_id || null,
        },
      ])
      .select()
      .single();

    if (prErr) return res.status(500).json({ success: false, error: prErr.message });

    // Insert line items
    if (items.length > 0) {
      const itemsPayload = items.map((it: any) => ({
        purchase_request_id: pr.id,
        item_name: it.item_name || "Requisition Item",
        quantity: parseInt(it.quantity, 10) || 1,
        unit: it.unit || "pc",
        estimated_unit_price: parseFloat(it.estimated_unit_price) || 0,
        total_price: roundToTwoDecimals((parseInt(it.quantity, 10) || 1) * (parseFloat(it.estimated_unit_price) || 0)),
        specifications: it.specifications || {},
      }));

      await insforge.database.from("purchase_request_items").insert(itemsPayload);
    }

    try {
      await insforge.database.from("employee_activity_logs").insert([
        {
          business_id: bizData.businessId,
          user_id: user.id,
          branch_id: bizData.branchId || null,
          activity_type: "purchase_request_created",
          description: `Purchase request ${prNumber} created for ₹${pr.estimated_amount}.`,
          entity_type: "purchase_request",
          entity_id: pr.id,
          metadata: { pr_number: prNumber, estimated_amount: pr.estimated_amount, title }
        }
      ]);
    } catch {
      // Ignored
    }

    return res.status(201).json({
      success: true,
      message: `Purchase request ${prNumber} created and submitted for internal approval.`,
      purchase_request: pr,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/buyer/purchase-requests/:id/approve
router.post("/buyer/purchase-requests/:id/approve", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { id } = req.params;
  const { notes } = req.body;

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const bizData = await resolveUserBusiness(user.id);
    if (!bizData?.businessId) return res.status(403).json({ success: false, error: "Forbidden." });

    // Validate approval role
    const canApprove = ["owner", "admin", "business_manager", "procurement_manager"].includes(bizData.roleInBusiness);
    if (!canApprove) {
      return res.status(403).json({ success: false, error: "Insufficient authority to approve purchase requests." });
    }

    // Check spending limit if configured
    const { data: pr } = await insforge.database
      .from("purchase_requests")
      .select("*")
      .eq("id", id)
      .eq("business_id", bizData.businessId)
      .single();

    if (!pr) return res.status(404).json({ success: false, error: "Purchase request not found." });

    if (bizData.spendingLimit && pr.estimated_amount > bizData.spendingLimit && bizData.roleInBusiness !== "owner") {
      return res.status(403).json({
        success: false,
        error: `Estimated amount ₹${pr.estimated_amount} exceeds your approval authority threshold of ₹${bizData.spendingLimit}. Requires Business Owner approval.`,
      });
    }

    // Update PR
    const { data: updatedPr } = await insforge.database
      .from("purchase_requests")
      .update({
        status: "approved",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    // Audit approval log
    await insforge.database.from("purchase_request_approvals").insert([
      {
        purchase_request_id: id,
        approver_id: user.id,
        action: "approved",
        notes: notes || "Approved according to company procurement policy.",
      },
    ]);

    try {
      await insforge.database.from("employee_activity_logs").insert([
        {
          business_id: bizData.businessId,
          user_id: user.id,
          branch_id: bizData.branchId || null,
          activity_type: "purchase_request_approved",
          description: `Purchase request ${pr.pr_number} approved.`,
          entity_type: "purchase_request",
          entity_id: id,
          metadata: { pr_number: pr.pr_number, notes }
        }
      ]);
    } catch {
      // Ignored
    }

    return res.json({
      success: true,
      message: `Purchase request ${pr.pr_number} approved. Ready for RFQ or PO issuance.`,
      purchase_request: updatedPr,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/buyer/purchase-requests/:id/reject
router.post("/buyer/purchase-requests/:id/reject", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { id } = req.params;
  const { reason = "Rejected during internal review." } = req.body;

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const bizData = await resolveUserBusiness(user.id);
    if (!bizData?.businessId || !["owner", "admin", "business_manager", "procurement_manager"].includes(bizData.roleInBusiness)) {
      return res.status(403).json({ success: false, error: "Insufficient authority to reject purchase requests." });
    }

    const { data: updatedPr } = await insforge.database
      .from("purchase_requests")
      .update({
        status: "rejected",
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("business_id", bizData.businessId)
      .select()
      .single();

    await insforge.database.from("purchase_request_approvals").insert([
      {
        purchase_request_id: id,
        approver_id: user.id,
        action: "rejected",
        notes: reason,
      },
    ]);

    try {
      await insforge.database.from("employee_activity_logs").insert([
        {
          business_id: bizData.businessId,
          user_id: user.id,
          branch_id: bizData.branchId || null,
          activity_type: "purchase_request_rejected",
          description: `Purchase request rejected: ${reason}`,
          entity_type: "purchase_request",
          entity_id: id,
          metadata: { reason }
        }
      ]);
    } catch {
      // Ignored
    }

    return res.json({ success: true, message: "Purchase request rejected.", purchase_request: updatedPr });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 6. Purchase Orders (PO) Management
// ====================================================================

// GET /api/buyer/purchase-orders
router.get("/buyer/purchase-orders", authenticateUser, async (req, res) => {
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const bizData = await resolveUserBusiness(user.id);
    let query = insforge.database
      .from("purchase_orders")
      .select("*, purchase_order_items(*), businesses!supplier_business_id(name, city, state, gstin)")
      .order("created_at", { ascending: false });

    if (bizData?.businessId) {
      query = query.eq("business_id", bizData.businessId);
    } else {
      query = query.eq("buyer_user_id", user.id);
    }

    const { data: pos, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: pos || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/buyer/purchase-orders (Generate Official PO)
router.post("/buyer/purchase-orders", authenticateUser, async (req, res) => {
  const user = req.user!;
  const {
    supplier_business_id,
    quotation_id,
    purchase_request_id,
    order_id,
    delivery_address,
    delivery_city,
    delivery_state,
    delivery_pincode,
    expected_delivery_date,
    payment_terms = "Net 30 Days",
    terms_and_conditions,
    items = [],
    subtotal = 0,
    freight = 0,
    packaging = 0,
    gst_amount = 0,
    total_amount = 0,
    currency = "INR",
  } = req.body;

  if (!supplier_business_id || !delivery_address || !delivery_city || !delivery_pincode) {
    return res.status(400).json({ success: false, error: "Supplier and delivery address coordinates are required." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const bizData = await resolveUserBusiness(user.id);
    if (!bizData?.businessId) {
      return res.status(403).json({ success: false, error: "Business account required to issue purchase orders." });
    }

    // Role guard: Only Procurement Manager, Business Manager, Owner, or Admin can issue POs
    const canIssuePO = ["owner", "admin", "business_manager", "procurement_manager"].includes(bizData.roleInBusiness) ||
                       (bizData.permissions && (bizData.permissions.includes("approve") || bizData.permissions.includes("manage")));
    if (!canIssuePO) {
      return res.status(403).json({
        success: false,
        error: "Insufficient authority to issue or approve Purchase Orders. Role requires Procurement Manager or Owner authorization."
      });
    }

    const numericTotal = parseFloat(total_amount) || 0;
    if (bizData.spendingLimit && numericTotal > bizData.spendingLimit && bizData.roleInBusiness !== "owner") {
      return res.status(403).json({
        success: false,
        error: `Total order amount ₹${numericTotal} exceeds your approval authority limit of ₹${bizData.spendingLimit}. Requires Business Owner approval.`
      });
    }

    const poNumber = `PO-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const { data: po, error: poErr } = await insforge.database
      .from("purchase_orders")
      .insert([
        {
          po_number: poNumber,
          business_id: bizData.businessId,
          buyer_user_id: user.id,
          supplier_business_id,
          quotation_id: quotation_id || null,
          purchase_request_id: purchase_request_id || null,
          order_id: order_id || null,
          po_status: "issued",
          currency,
          subtotal: parseFloat(subtotal) || 0,
          freight: parseFloat(freight) || 0,
          packaging: parseFloat(packaging) || 0,
          gst_amount: parseFloat(gst_amount) || 0,
          total_amount: parseFloat(total_amount) || 0,
          delivery_address: delivery_address.trim(),
          delivery_city: delivery_city.trim(),
          delivery_state: delivery_state?.trim() || "Maharashtra",
          delivery_pincode: delivery_pincode.trim(),
          expected_delivery_date: expected_delivery_date || null,
          payment_terms,
          terms_and_conditions: terms_and_conditions || null,
          authorized_by: user.id,
          issued_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (poErr) return res.status(500).json({ success: false, error: poErr.message });

    // Insert PO items
    if (items.length > 0) {
      const itemsPayload = items.map((it: any) => ({
        purchase_order_id: po.id,
        item_name: it.item_name || "PO Item",
        quantity: parseInt(it.quantity, 10) || 1,
        unit: it.unit || "pc",
        unit_price: parseFloat(it.unit_price) || 0,
        total_price: roundToTwoDecimals((parseInt(it.quantity, 10) || 1) * (parseFloat(it.unit_price) || 0)),
        specifications: it.specifications || {},
      }));

      await insforge.database.from("purchase_order_items").insert(itemsPayload);
    }

    try {
      await insforge.database.from("employee_activity_logs").insert([
        {
          business_id: bizData.businessId,
          user_id: user.id,
          branch_id: bizData.branchId || null,
          activity_type: "po_issued",
          description: `Purchase order ${poNumber} issued for ₹${po.total_amount}.`,
          entity_type: "purchase_order",
          entity_id: po.id,
          metadata: { po_number: poNumber, total_amount: po.total_amount, supplier_business_id }
        }
      ]);
    } catch {
      // Ignored
    }

    return res.status(201).json({
      success: true,
      message: `Purchase Order ${poNumber} issued successfully.`,
      purchase_order: po,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/buyer/purchase-orders/:poNumber
router.get("/buyer/purchase-orders/:poNumber", authenticateUser, async (req, res) => {
  const { poNumber } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data: po, error } = await insforge.database
      .from("purchase_orders")
      .select("*, purchase_order_items(*), businesses!supplier_business_id(*), businesses!business_id(*)")
      .eq("po_number", poNumber)
      .single();

    if (error || !po) return res.status(404).json({ success: false, error: "Purchase order not found." });
    return res.json({ success: true, data: po });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 7. Quotation Negotiations & Clarifications
// ====================================================================

// GET /api/buyer/quotations/:id/negotiations
router.get("/buyer/quotations/:id/negotiations", authenticateUser, async (req, res) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data: thread, error } = await insforge.database
      .from("quotation_negotiations")
      .select("*, users(full_name, avatar_url)")
      .eq("quotation_id", id)
      .order("created_at", { ascending: true });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: thread || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/buyer/quotations/:id/negotiations
router.post("/buyer/quotations/:id/negotiations", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { id } = req.params;
  const { message, proposed_price, proposed_delivery_days } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ success: false, error: "Message cannot be empty." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data: note, error } = await insforge.database
      .from("quotation_negotiations")
      .insert([
        {
          quotation_id: id,
          sender_id: user.id,
          message: message.trim(),
          proposed_price: proposed_price ? parseFloat(proposed_price) : null,
          proposed_delivery_days: proposed_delivery_days ? parseInt(proposed_delivery_days, 10) : null,
        },
      ])
      .select("*, users(full_name, avatar_url)")
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, message: "Negotiation sent.", data: note });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 8. Finance & Accounts Management (Invoices, Expenses & Payments)
// ====================================================================

// GET /api/buyer/invoices
router.get("/buyer/invoices", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { payment_status, po_id, supplier_id } = req.query;
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const bizData = await resolveUserBusiness(user.id);
    if (!bizData?.businessId) {
      return res.status(403).json({ success: false, error: "Business account required." });
    }

    let query = insforge.database
      .from("purchase_invoices")
      .select("*, purchase_orders(po_number, total_amount), businesses!supplier_business_id(name, city, state, gstin), users!recorded_by(full_name, email)")
      .eq("business_id", bizData.businessId)
      .order("invoice_date", { ascending: false });

    if (payment_status && typeof payment_status === "string" && payment_status !== "all") {
      query = query.eq("payment_status", payment_status);
    }
    if (po_id && typeof po_id === "string") {
      query = query.eq("purchase_order_id", po_id);
    }
    if (supplier_id && typeof supplier_id === "string") {
      query = query.eq("supplier_business_id", supplier_id);
    }

    const { data: invoices, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });

    // Calculate invoice stats
    const totalInvoices = invoices?.length || 0;
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalGst = 0;
    let totalFreight = 0;
    let unpaidCount = 0;
    let paidCount = 0;

    for (const inv of invoices || []) {
      const invTotal = parseFloat(inv.total_amount) || 0;
      const invPaid = parseFloat(inv.amount_paid) || 0;
      totalInvoiced += invTotal;
      totalPaid += invPaid;
      totalPending += Math.max(0, invTotal - invPaid);
      totalGst += parseFloat(inv.gst_amount) || 0;
      totalFreight += parseFloat(inv.freight_charges) || 0;
      if (inv.payment_status === "paid") {
        paidCount++;
      } else if (inv.payment_status === "unpaid") {
        unpaidCount++;
      }
    }

    return res.json({
      success: true,
      data: invoices || [],
      summary: {
        total_invoices: totalInvoices,
        total_invoiced_amount: roundToTwoDecimals(totalInvoiced),
        total_paid_amount: roundToTwoDecimals(totalPaid),
        total_pending_amount: roundToTwoDecimals(totalPending),
        total_gst_amount: roundToTwoDecimals(totalGst),
        total_freight_amount: roundToTwoDecimals(totalFreight),
        unpaid_count: unpaidCount,
        paid_count: paidCount,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/buyer/invoices (Record incoming invoice against PO)
router.post("/buyer/invoices", authenticateUser, async (req, res) => {
  const user = req.user!;
  const {
    supplier_business_id,
    purchase_order_id,
    order_id,
    invoice_number,
    invoice_date,
    due_date,
    currency = "INR",
    subtotal,
    freight_charges = 0,
    additional_charges = 0,
    gst_rate = 0.18,
    gst_amount,
    total_amount,
    payment_status = "unpaid",
    amount_paid = 0,
    payment_reference,
    file_url,
    notes,
  } = req.body;

  if (!supplier_business_id || !invoice_number?.trim() || subtotal === undefined) {
    return res.status(400).json({ success: false, error: "Supplier ID, Invoice Number and Subtotal are required." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const bizData = await resolveUserBusiness(user.id);
    if (!bizData?.businessId) {
      return res.status(403).json({ success: false, error: "Business account required." });
    }

    // Role check: Finance staff, Accounts executive, Owner, Admin, Business Manager or users with manage/create permission
    const canRecord = ["owner", "admin", "business_manager", "finance_staff", "accounts_executive"].includes(bizData.roleInBusiness) ||
                      (bizData.permissions && (bizData.permissions.includes("create") || bizData.permissions.includes("manage")));
    if (!canRecord) {
      return res.status(403).json({
        success: false,
        error: "Insufficient authority to record invoices. Role requires Finance/Accounts Staff or Owner authority.",
      });
    }

    const numSubtotal = parseFloat(subtotal) || 0;
    const numFreight = parseFloat(freight_charges) || 0;
    const numAdditional = parseFloat(additional_charges) || 0;
    const numGstRate = parseFloat(gst_rate) || 0.18;
    const baseTotal = numSubtotal + numFreight + numAdditional;
    const numGst = gst_amount !== undefined ? parseFloat(gst_amount) : roundToTwoDecimals(baseTotal * numGstRate);
    const numTotal = total_amount !== undefined ? parseFloat(total_amount) : roundToTwoDecimals(baseTotal + numGst);
    const numPaid = parseFloat(amount_paid) || 0;

    const { data: invoice, error: invErr } = await insforge.database
      .from("purchase_invoices")
      .insert([
        {
          business_id: bizData.businessId,
          supplier_business_id,
          purchase_order_id: purchase_order_id || null,
          order_id: order_id || null,
          invoice_number: invoice_number.trim(),
          invoice_date: invoice_date || new Date().toISOString().split("T")[0],
          due_date: due_date || null,
          currency,
          subtotal: numSubtotal,
          freight_charges: numFreight,
          additional_charges: numAdditional,
          gst_rate: numGstRate,
          gst_amount: numGst,
          total_amount: numTotal,
          payment_status: payment_status || "unpaid",
          amount_paid: numPaid,
          payment_reference: payment_reference?.trim() || null,
          file_url: file_url || null,
          notes: notes?.trim() || null,
          recorded_by: user.id,
        },
      ])
      .select()
      .single();

    if (invErr) return res.status(500).json({ success: false, error: invErr.message });

    // Auto-record freight expense if freight charges > 0
    if (numFreight > 0) {
      try {
        await insforge.database.from("purchase_expenses").insert([
          {
            business_id: bizData.businessId,
            purchase_order_id: purchase_order_id || null,
            invoice_id: invoice.id,
            expense_category: "freight",
            amount: numFreight,
            description: `Freight charges on invoice ${invoice_number.trim()}`,
            recorded_by: user.id,
          },
        ]);
      } catch {
        // Ignored
      }
    }

    // Log to employee_activity_logs
    try {
      await insforge.database.from("employee_activity_logs").insert([
        {
          business_id: bizData.businessId,
          user_id: user.id,
          branch_id: bizData.branchId || null,
          activity_type: "invoice_recorded",
          description: `Supplier invoice ${invoice_number.trim()} recorded for ₹${numTotal}.`,
          entity_type: "purchase_invoice",
          entity_id: invoice.id,
          metadata: {
            invoice_number: invoice_number.trim(),
            total_amount: numTotal,
            subtotal: numSubtotal,
            freight_charges: numFreight,
            gst_amount: numGst,
            purchase_order_id,
          },
        },
      ]);
    } catch {
      // Ignored
    }

    return res.status(201).json({
      success: true,
      message: `Invoice ${invoice_number.trim()} recorded successfully.`,
      invoice,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/buyer/invoices/:id/payment (Maintain paid/unpaid/pending payment status)
router.patch("/buyer/invoices/:id/payment", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { id } = req.params;
  const { payment_status, amount_paid, payment_reference, notes } = req.body;

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const bizData = await resolveUserBusiness(user.id);
    if (!bizData?.businessId) {
      return res.status(403).json({ success: false, error: "Business account required." });
    }

    // Role check: Finance staff, Accounts executive, Owner, Admin, Business Manager
    const canUpdate = ["owner", "admin", "business_manager", "finance_staff", "accounts_executive"].includes(bizData.roleInBusiness) ||
                      (bizData.permissions && (bizData.permissions.includes("edit") || bizData.permissions.includes("manage")));
    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        error: "Insufficient authority to update payment records. Role requires Finance/Accounts Staff or Owner authorization.",
      });
    }

    const { data: existingInv } = await insforge.database
      .from("purchase_invoices")
      .select("*")
      .eq("id", id)
      .eq("business_id", bizData.businessId)
      .single();

    if (!existingInv) return res.status(404).json({ success: false, error: "Invoice not found." });

    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (payment_status) updatePayload.payment_status = payment_status;
    if (amount_paid !== undefined) updatePayload.amount_paid = parseFloat(amount_paid) || 0;
    if (payment_reference !== undefined) updatePayload.payment_reference = payment_reference?.trim() || null;
    if (notes !== undefined) updatePayload.notes = notes?.trim() || null;

    const { data: updatedInv, error } = await insforge.database
      .from("purchase_invoices")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    // Log activity
    try {
      await insforge.database.from("employee_activity_logs").insert([
        {
          business_id: bizData.businessId,
          user_id: user.id,
          branch_id: bizData.branchId || null,
          activity_type: "payment_recorded",
          description: `Payment updated for invoice ${existingInv.invoice_number}: ${payment_status || existingInv.payment_status}, ₹${updatePayload.amount_paid ?? existingInv.amount_paid} recorded.`,
          entity_type: "purchase_invoice",
          entity_id: id,
          metadata: updatePayload,
        },
      ]);
    } catch {
      // Ignored
    }

    return res.json({
      success: true,
      message: `Payment record updated for invoice ${existingInv.invoice_number}.`,
      invoice: updatedInv,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/buyer/expenses
router.get("/buyer/expenses", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { category, po_id } = req.query;
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const bizData = await resolveUserBusiness(user.id);
    if (!bizData?.businessId) {
      return res.status(403).json({ success: false, error: "Business account required." });
    }

    let query = insforge.database
      .from("purchase_expenses")
      .select("*, purchase_orders(po_number), purchase_invoices(invoice_number), users!recorded_by(full_name, email)")
      .eq("business_id", bizData.businessId)
      .order("payment_date", { ascending: false });

    if (category && typeof category === "string" && category !== "all") {
      query = query.eq("expense_category", category);
    }
    if (po_id && typeof po_id === "string") {
      query = query.eq("purchase_order_id", po_id);
    }

    const { data: expenses, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });

    // Category breakdown
    const categoryTotals: Record<string, number> = {};
    let totalExpenseAmount = 0;
    for (const exp of expenses || []) {
      const amt = parseFloat(exp.amount) || 0;
      totalExpenseAmount += amt;
      categoryTotals[exp.expense_category] = (categoryTotals[exp.expense_category] || 0) + amt;
    }

    return res.json({
      success: true,
      data: expenses || [],
      summary: {
        total_expenses: expenses?.length || 0,
        total_amount: roundToTwoDecimals(totalExpenseAmount),
        category_totals: categoryTotals,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/buyer/expenses
router.post("/buyer/expenses", authenticateUser, async (req, res) => {
  const user = req.user!;
  const {
    purchase_order_id,
    invoice_id,
    expense_category,
    amount,
    description,
    vendor_name,
    payment_reference,
    payment_date,
  } = req.body;

  if (!expense_category || !amount || !description?.trim()) {
    return res.status(400).json({ success: false, error: "Expense category, amount, and description are required." });
  }

  const validCategories = [
    "freight",
    "packaging",
    "insurance",
    "loading_unloading",
    "customs_duty",
    "storage_warehouse",
    "other",
  ];
  if (!validCategories.includes(expense_category)) {
    return res.status(400).json({
      success: false,
      error: `Invalid category. Allowed: ${validCategories.join(", ")}`,
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const bizData = await resolveUserBusiness(user.id);
    if (!bizData?.businessId) {
      return res.status(403).json({ success: false, error: "Business account required." });
    }

    // Role check: Finance staff, Accounts executive, Owner, Admin, Business Manager
    const canRecord = ["owner", "admin", "business_manager", "finance_staff", "accounts_executive"].includes(bizData.roleInBusiness) ||
                      (bizData.permissions && (bizData.permissions.includes("create") || bizData.permissions.includes("manage")));
    if (!canRecord) {
      return res.status(403).json({
        success: false,
        error: "Insufficient authority to record expenses. Role requires Finance/Accounts Staff or Owner authority.",
      });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, error: "Amount must be a positive number." });
    }

    const { data: expense, error } = await insforge.database
      .from("purchase_expenses")
      .insert([
        {
          business_id: bizData.businessId,
          purchase_order_id: purchase_order_id || null,
          invoice_id: invoice_id || null,
          expense_category,
          amount: numAmount,
          description: description.trim(),
          vendor_name: vendor_name?.trim() || null,
          payment_reference: payment_reference?.trim() || null,
          payment_date: payment_date || new Date().toISOString().split("T")[0],
          recorded_by: user.id,
        },
      ])
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    try {
      await insforge.database.from("employee_activity_logs").insert([
        {
          business_id: bizData.businessId,
          user_id: user.id,
          branch_id: bizData.branchId || null,
          activity_type: "expense_recorded",
          description: `${expense_category.toUpperCase()} expense of ₹${numAmount} recorded: ${description.trim()}.`,
          entity_type: "purchase_expense",
          entity_id: expense.id,
          metadata: { expense_category, amount: numAmount, vendor_name },
        },
      ]);
    } catch {
      // Ignored
    }

    return res.status(201).json({
      success: true,
      message: `${expense_category.toUpperCase()} expense recorded successfully.`,
      expense,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/buyer/financial-summary (Authorized Financial Overview & Document Export Data)
router.get("/buyer/financial-summary", authenticateUser, async (req, res) => {
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const bizData = await resolveUserBusiness(user.id);
    if (!bizData?.businessId) {
      return res.status(403).json({ success: false, error: "Business account required." });
    }

    // Role check: Finance staff, Accounts executive, Owner, Admin, Business Manager, Procurement Manager
    const canViewFinance = ["owner", "admin", "business_manager", "finance_staff", "accounts_executive", "procurement_manager"].includes(bizData.roleInBusiness) ||
                           (bizData.permissions && (bizData.permissions.includes("view") || bizData.permissions.includes("export")));
    if (!canViewFinance) {
      return res.status(403).json({ success: false, error: "Insufficient permissions to view financial summary." });
    }

    // Query PO total commitments
    const { data: pos } = await insforge.database
      .from("purchase_orders")
      .select("id, total_amount, po_status")
      .eq("business_id", bizData.businessId);

    // Query Invoices
    const { data: invoices } = await insforge.database
      .from("purchase_invoices")
      .select("id, invoice_number, total_amount, amount_paid, payment_status, gst_amount, freight_charges, additional_charges")
      .eq("business_id", bizData.businessId);

    // Query Expenses
    const { data: expenses } = await insforge.database
      .from("purchase_expenses")
      .select("id, expense_category, amount")
      .eq("business_id", bizData.businessId);

    let poCommitments = 0;
    for (const po of pos || []) {
      poCommitments += parseFloat(po.total_amount) || 0;
    }

    let invoicedTotal = 0;
    let paidTotal = 0;
    let pendingTotal = 0;
    let totalGst = 0;
    let totalFreight = 0;
    let totalAdditional = 0;
    for (const inv of invoices || []) {
      const tot = parseFloat(inv.total_amount) || 0;
      const pd = parseFloat(inv.amount_paid) || 0;
      invoicedTotal += tot;
      paidTotal += pd;
      pendingTotal += Math.max(0, tot - pd);
      totalGst += parseFloat(inv.gst_amount) || 0;
      totalFreight += parseFloat(inv.freight_charges) || 0;
      totalAdditional += parseFloat(inv.additional_charges) || 0;
    }

    let otherExpensesTotal = 0;
    const expenseCategoryMap: Record<string, number> = {};
    for (const exp of expenses || []) {
      const a = parseFloat(exp.amount) || 0;
      otherExpensesTotal += a;
      expenseCategoryMap[exp.expense_category] = (expenseCategoryMap[exp.expense_category] || 0) + a;
    }

    return res.json({
      success: true,
      data: {
        po_commitments: roundToTwoDecimals(poCommitments),
        total_invoiced: roundToTwoDecimals(invoicedTotal),
        total_paid: roundToTwoDecimals(paidTotal),
        total_pending: roundToTwoDecimals(pendingTotal),
        total_gst: roundToTwoDecimals(totalGst),
        total_freight: roundToTwoDecimals(totalFreight),
        total_additional_charges: roundToTwoDecimals(totalAdditional),
        other_expenses_total: roundToTwoDecimals(otherExpensesTotal),
        total_landed_expenditure: roundToTwoDecimals(paidTotal + otherExpensesTotal),
        expense_by_category: expenseCategoryMap,
        invoice_count: invoices?.length || 0,
        po_count: pos?.length || 0,
        expense_count: expenses?.length || 0,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 9. Admin Buyer & Business Governance
// ====================================================================

// GET /api/admin/buyers/stats
router.get("/admin/buyers/stats", async (req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { count: totalBuyers } = await insforge.database
      .from("users")
      .select("id", { count: "exact", head: true });

    const { count: totalBusinesses } = await insforge.database
      .from("businesses")
      .select("id", { count: "exact", head: true });

    const { count: verifiedBusinesses } = await insforge.database
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .in("verification_level", ["document_verified", "registration_checked"]);

    const { count: pendingVerification } = await insforge.database
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .eq("verification_level", "unverified");

    const { count: totalPos } = await insforge.database
      .from("purchase_orders")
      .select("id", { count: "exact", head: true });

    const { count: totalPrs } = await insforge.database
      .from("purchase_requests")
      .select("id", { count: "exact", head: true });

    return res.json({
      success: true,
      data: {
        total_buyers: totalBuyers || 0,
        total_businesses: totalBusinesses || 0,
        verified_businesses: verifiedBusinesses || 0,
        pending_verification: pendingVerification || 0,
        total_purchase_orders: totalPos || 0,
        total_purchase_requests: totalPrs || 0,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/buyers
router.get("/admin/buyers", async (req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data: businesses, error } = await insforge.database
      .from("businesses")
      .select("*, buyer_profiles(*), business_members(id, role_in_business, users(full_name, email))")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: businesses || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/buyers/:businessId/verify
router.post("/admin/buyers/:businessId/verify", authenticateUser, async (req, res) => {
  const { businessId } = req.params;
  const { action = "approve", notes } = req.body;

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const newTier = action === "approve" ? "document_verified" : "unverified";
    const { data: updatedBiz } = await insforge.database
      .from("businesses")
      .update({
        verification_level: newTier,
        updated_at: new Date().toISOString(),
      })
      .eq("id", businessId)
      .select()
      .single();

    await insforge.database
      .from("buyer_profiles")
      .update({
        verification_status: action === "approve" ? "verified" : "rejected",
        verification_notes: notes || null,
        verified_at: action === "approve" ? new Date().toISOString() : null,
      })
      .eq("business_id", businessId);

    return res.json({
      success: true,
      message: `Business verification level updated to '${newTier}'.`,
      business: updatedBiz,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
