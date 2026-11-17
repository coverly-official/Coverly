import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";

const router = Router();

// ====================================================================
// 1. Public Sales Agent Directory & Guest Lead Submission
// ====================================================================

// GET /api/sales-agents (Public Directory)
router.get("/sales-agents", async (req, res) => {
  const { category, location, agent_type, search } = req.query as {
    category?: string;
    location?: string;
    agent_type?: string;
    search?: string;
  };

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    let query = insforge.database
      .from("sales_agent_profiles")
      .select("id, full_name, agent_type, bio, profile_photo_url, product_categories, service_categories, operating_cities, operating_states, languages, experience_years, verification_status, slug, total_conversions, businesses(name, city)")
      .eq("verification_status", "verified")
      .eq("is_public_discovery_enabled", true);

    if (agent_type) {
      query = query.eq("agent_type", agent_type);
    }
    if (search?.trim()) {
      query = query.or(`full_name.ilike.%${search.trim()}%,bio.ilike.%${search.trim()}%`);
    }

    const { data, error } = await query.order("total_conversions", { ascending: false }).limit(50);
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/sales-agents/:slug (Public Agent Dossier)
router.get("/sales-agents/:slug", async (req, res) => {
  const { slug } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("sales_agent_profiles")
      .select("id, full_name, agent_type, bio, profile_photo_url, product_categories, service_categories, operating_cities, operating_states, languages, experience_years, verification_status, slug, total_conversions, businesses(id, name, city, state)")
      .or(`slug.eq.${slug},id.eq.${slug}`)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: "Sales representative not found." });
    }

    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/sales-agents/leads (Submit Business Requirement / Lead - Guest & Authenticated)
router.post("/sales-agents/leads", async (req, res) => {
  const {
    customer_id,
    guest_name,
    guest_email,
    guest_phone,
    guest_company,
    requirement_category,
    product_or_service,
    quantity,
    budget,
    location_city,
    location_state,
    description,
    assigned_agent_id,
    priority = "medium",
  } = req.body;

  if (!requirement_category?.trim() || !product_or_service?.trim() || !description?.trim()) {
    return res.status(400).json({
      success: false,
      error: "Requirement category, product/service name, and description are required.",
    });
  }

  // Validate contact info for guests
  if (!customer_id && (!guest_name?.trim() || !guest_email?.trim() || !guest_phone?.trim())) {
    return res.status(400).json({
      success: false,
      error: "Name, email, and phone number are required for business requirement enquiries.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const leadNumber = `SA-LEAD-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const { data: leadRecord, error: leadError } = await insforge.database
      .from("sales_leads")
      .insert([
        {
          lead_number: leadNumber,
          customer_id: customer_id || null,
          guest_name: guest_name?.trim() || null,
          guest_email: guest_email?.trim() || null,
          guest_phone: guest_phone?.trim() || null,
          guest_company: guest_company?.trim() || null,
          requirement_category: requirement_category.trim(),
          product_or_service: product_or_service.trim(),
          quantity: quantity?.trim() || null,
          budget: budget ? Number.parseFloat(budget) : null,
          location_city: location_city?.trim() || null,
          location_state: location_state?.trim() || null,
          description: description.trim(),
          assigned_agent_id: assigned_agent_id || null,
          assigned_at: assigned_agent_id ? new Date().toISOString() : null,
          status: assigned_agent_id ? "assigned" : "new",
          priority,
          lead_source: customer_id ? "authenticated_buyer" : "guest_web",
        },
      ])
      .select()
      .single();

    if (leadError || !leadRecord) {
      return res.status(500).json({ success: false, error: leadError?.message || "Failed to create sales lead." });
    }

    // Insert activity log
    await insforge.database.from("sales_lead_activities").insert([
      {
        lead_id: leadRecord.id,
        actor_id: customer_id || "00000000-0000-0000-0000-000000000000",
        activity_type: "LEAD_CREATED",
        details: `Business requirement submitted by ${customer_id ? "authenticated buyer" : guest_name}.`,
      },
    ]);

    return res.status(201).json({
      success: true,
      message: "Business requirement submitted successfully.",
      data: leadRecord,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/sales-agents/guest-claim (Claim guest leads upon login/registration)
router.post("/sales-agents/guest-claim", async (req, res) => {
  const { user_id, email, lead_number } = req.body;
  if (!user_id || (!email && !lead_number)) {
    return res.status(400).json({ success: false, error: "user_id and either email or lead_number are required." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    let query = insforge.database.from("sales_leads").update({
      customer_id: user_id,
      updated_at: new Date().toISOString(),
    });

    if (lead_number) {
      query = query.eq("lead_number", lead_number.trim());
    } else if (email) {
      query = query.eq("guest_email", email.trim()).is("customer_id", null);
    }

    const { data, error } = await query.select();
    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.json({
      success: true,
      message: `Claimed ${data?.length || 0} business leads into account.`,
      data: data || [],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 2. Sales Agent Portal & CRM
// ====================================================================

// POST /api/sales-agent/onboarding (Register / Setup Sales Agent)
router.post("/sales-agent/onboarding", async (req, res) => {
  const {
    userId,
    agent_type = "independent",
    full_name,
    phone,
    email,
    bio,
    affiliated_business_id,
    product_categories = [],
    service_categories = [],
    operating_cities = [],
    operating_states = [],
    languages = [],
    experience_years = 0,
  } = req.body;

  if (!userId || !full_name?.trim() || !phone?.trim() || !email?.trim()) {
    return res.status(400).json({
      success: false,
      error: "User ID, full name, phone, and email are required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const baseSlug = full_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

    // 1. Insert Sales Agent Profile
    const { data: agentRecord, error: agentError } = await insforge.database
      .from("sales_agent_profiles")
      .insert([
        {
          user_id: userId,
          agent_type,
          full_name: full_name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          bio: bio?.trim() || null,
          affiliated_business_id: affiliated_business_id || null,
          product_categories: Array.isArray(product_categories) ? product_categories : [],
          service_categories: Array.isArray(service_categories) ? service_categories : [],
          operating_cities: Array.isArray(operating_cities) ? operating_cities : [],
          operating_states: Array.isArray(operating_states) ? operating_states : [],
          languages: Array.isArray(languages) ? languages : ["English", "Hindi"],
          experience_years: Number.parseInt(experience_years, 10) || 0,
          verification_status: "pending",
          is_public_discovery_enabled: true,
          slug,
        },
      ])
      .select()
      .single();

    if (agentError || !agentRecord) {
      return res.status(500).json({ success: false, error: agentError?.message || "Failed to onboard sales agent." });
    }

    // 2. Add sales_agent role
    await insforge.database.from("user_roles").insert([
      {
        user_id: userId,
        role: "sales_agent",
        is_primary: false,
      },
    ]);

    return res.status(201).json({
      success: true,
      message: "Sales agent registration submitted for review.",
      data: agentRecord,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/sales-agent/profile
router.get("/sales-agent/profile", async (req, res) => {
  const { user_id, agent_id } = req.query as { user_id?: string; agent_id?: string };
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    let query = insforge.database
      .from("sales_agent_profiles")
      .select("*, businesses(name, city, state, verification_level)");

    if (agent_id) query = query.eq("id", agent_id);
    else if (user_id) query = query.eq("user_id", user_id);
    else return res.status(400).json({ success: false, error: "user_id or agent_id is required." });

    const { data, error } = await query.single();
    if (error || !data) return res.status(404).json({ success: false, error: "Agent profile not found." });

    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/sales-agent/dashboard (Agent Metrics)
router.get("/sales-agent/dashboard", async (req, res) => {
  const { agent_id } = req.query as { agent_id?: string };
  if (!agent_id) return res.status(400).json({ success: false, error: "agent_id is required." });

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { count: assignedLeads } = await insforge.database
      .from("sales_leads")
      .select("*", { count: "exact", head: true })
      .eq("assigned_agent_id", agent_id);

    const { count: newLeads } = await insforge.database
      .from("sales_leads")
      .select("*", { count: "exact", head: true })
      .eq("assigned_agent_id", agent_id)
      .eq("status", "assigned");

    const { count: contactedLeads } = await insforge.database
      .from("sales_leads")
      .select("*", { count: "exact", head: true })
      .eq("assigned_agent_id", agent_id)
      .eq("status", "contacted");

    const { count: convertedLeads } = await insforge.database
      .from("sales_leads")
      .select("*", { count: "exact", head: true })
      .eq("assigned_agent_id", agent_id)
      .eq("status", "converted");

    const { count: lostLeads } = await insforge.database
      .from("sales_leads")
      .select("*", { count: "exact", head: true })
      .eq("assigned_agent_id", agent_id)
      .eq("status", "lost");

    // Commission telemetry
    const { data: commissions } = await insforge.database
      .from("sales_commission_records")
      .select("calculated_commission, status")
      .eq("agent_id", agent_id);

    let eligibleCommission = 0;
    let approvedCommission = 0;
    let paidCommission = 0;

    (commissions || []).forEach((c: any) => {
      const amt = Number(c.calculated_commission) || 0;
      eligibleCommission += amt;
      if (c.status === "approved" || c.status === "payable") approvedCommission += amt;
      if (c.status === "paid") paidCommission += amt;
    });

    return res.json({
      success: true,
      data: {
        assigned_leads: assignedLeads || 0,
        new_leads: newLeads || 0,
        contacted_leads: contactedLeads || 0,
        converted_leads: convertedLeads || 0,
        lost_leads: lostLeads || 0,
        eligible_commission: eligibleCommission,
        approved_commission: approvedCommission,
        paid_commission: paidCommission,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/sales-agent/leads (Agent Assigned Leads)
router.get("/sales-agent/leads", async (req, res) => {
  const { agent_id, status } = req.query as { agent_id?: string; status?: string };
  if (!agent_id) return res.status(400).json({ success: false, error: "agent_id is required." });

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    let query = insforge.database
      .from("sales_leads")
      .select("id, lead_number, customer_id, guest_name, guest_email, guest_phone, guest_company, requirement_category, product_or_service, quantity, budget, location_city, location_state, priority, status, created_at, assigned_at")
      .eq("assigned_agent_id", agent_id)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data, error } = await query.limit(50);
    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/sales-agent/leads/:id (Lead Details with Follow-ups & Activity Logs)
router.get("/sales-agent/leads/:id", async (req, res) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data: lead, error: leadErr } = await insforge.database
      .from("sales_leads")
      .select("*, businesses!target_supplier_business_id(name, city)")
      .eq("id", id)
      .single();

    if (leadErr || !lead) return res.status(404).json({ success: false, error: "Lead not found." });

    const { data: followups } = await insforge.database
      .from("sales_lead_followups")
      .select("*")
      .eq("lead_id", id)
      .order("scheduled_at", { ascending: true });

    const { data: activities } = await insforge.database
      .from("sales_lead_activities")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false });

    return res.json({
      success: true,
      data: {
        ...lead,
        followups: followups || [],
        activities: activities || [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/sales-agent/leads/:id/status (Agent updates lead status)
router.patch("/sales-agent/leads/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status, actor_id, note, lost_reason } = req.body;

  const validStatuses = [
    "new", "assigned", "contacted", "interested", "followup_required",
    "quotation_requested", "negotiation", "converted", "lost", "closed"
  ];

  if (!status || !validStatuses.includes(status) || !actor_id) {
    return res.status(400).json({ success: false, error: "Valid status and actor_id are required." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const updatePayload: any = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (lost_reason) updatePayload.lost_reason = lost_reason;

    const { data: updated, error } = await insforge.database
      .from("sales_leads")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    // Insert activity log
    await insforge.database.from("sales_lead_activities").insert([
      {
        lead_id: id,
        actor_id,
        activity_type: `STATUS_CHANGED_TO_${status.toUpperCase()}`,
        details: note?.trim() || `Lead status updated to ${status}.`,
      },
    ]);

    return res.json({ success: true, message: `Lead status updated to ${status}.`, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/sales-agent/leads/:id/followups (Schedule Follow-up)
router.post("/sales-agent/leads/:id/followups", async (req, res) => {
  const { id } = req.params;
  const { agent_id, scheduled_at, followup_type = "phone_call", next_action } = req.body;

  if (!agent_id || !scheduled_at) {
    return res.status(400).json({ success: false, error: "agent_id and scheduled_at are required." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("sales_lead_followups")
      .insert([
        {
          lead_id: id,
          agent_id,
          scheduled_at,
          followup_type,
          next_action: next_action?.trim() || null,
          is_completed: false,
        },
      ])
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    // Update lead status to followup_required
    await insforge.database.from("sales_leads").update({ status: "followup_required" }).eq("id", id);

    return res.status(201).json({ success: true, message: "Follow-up scheduled.", data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/sales-agent/leads/:id/convert (Convert Lead linked to Order/Transaction & Calculate Commission)
router.post("/sales-agent/leads/:id/convert", async (req, res) => {
  const { id } = req.params;
  const { agent_id, transaction_value, linked_order_id, linked_rfq_id, notes } = req.body;

  if (!agent_id || !transaction_value || Number(transaction_value) <= 0) {
    return res.status(400).json({ success: false, error: "agent_id and valid transaction_value are required." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const txVal = Number.parseFloat(transaction_value);

    // 1. Update lead status to converted
    const { data: updatedLead, error: leadErr } = await insforge.database
      .from("sales_leads")
      .update({
        status: "converted",
        converted_transaction_value: txVal,
        converted_at: new Date().toISOString(),
        linked_order_id: linked_order_id || null,
        linked_rfq_id: linked_rfq_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (leadErr || !updatedLead) {
      return res.status(500).json({ success: false, error: leadErr?.message || "Failed to convert lead." });
    }

    // 2. Fetch applicable commission rule
    const { data: rules } = await insforge.database
      .from("sales_commission_rules")
      .select("*")
      .eq("is_active", true)
      .order("min_transaction_value", { ascending: false });

    let appliedRate = 2.0; // default 2%
    let calculatedCommission = (txVal * appliedRate) / 100;

    if (rules && rules.length > 0) {
      const match = rules.find((r: any) => txVal >= Number(r.min_transaction_value)) || rules[0];
      if (match.commission_type === "fixed_amount") {
        calculatedCommission = Number(match.fixed_amount);
      } else {
        appliedRate = Number(match.commission_rate);
        calculatedCommission = (txVal * appliedRate) / 100;
      }
    }

    // 3. Create commission record
    const commissionNumber = `COM-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const { data: commissionRecord, error: commErr } = await insforge.database
      .from("sales_commission_records")
      .insert([
        {
          commission_number: commissionNumber,
          agent_id,
          lead_id: id,
          order_id: linked_order_id || null,
          qualifying_transaction_value: txVal,
          calculated_commission: calculatedCommission,
          status: "pending_verification",
          notes: notes?.trim() || `Conversion commission at ${appliedRate}% on qualifying transaction ₹${txVal.toLocaleString("en-IN")}.`,
        },
      ])
      .select()
      .single();

    // 4. Activity log
    await insforge.database.from("sales_lead_activities").insert([
      {
        lead_id: id,
        actor_id: agent_id,
        activity_type: "LEAD_CONVERTED",
        details: `Lead converted with transaction value ₹${txVal.toLocaleString("en-IN")}. Commission claim ${commissionNumber} created.`,
      },
    ]);

    return res.json({
      success: true,
      message: "Lead successfully converted and commission claim generated.",
      data: {
        lead: updatedLead,
        commission: commissionRecord,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/sales-agent/commissions (Agent Commission Records)
router.get("/sales-agent/commissions", async (req, res) => {
  const { agent_id } = req.query as { agent_id?: string };
  if (!agent_id) return res.status(400).json({ success: false, error: "agent_id is required." });

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("sales_commission_records")
      .select("*, sales_leads(lead_number, product_or_service)")
      .eq("agent_id", agent_id)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 3. Admin Governance & Commission Oversight
// ====================================================================

// GET /api/admin/sales-agents/metrics
router.get("/admin/sales-agents/metrics", async (_req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { count: totalAgents } = await insforge.database
      .from("sales_agent_profiles")
      .select("*", { count: "exact", head: true });

    const { count: approvedAgents } = await insforge.database
      .from("sales_agent_profiles")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "verified");

    const { count: totalLeads } = await insforge.database
      .from("sales_leads")
      .select("*", { count: "exact", head: true });

    const { count: unassignedLeads } = await insforge.database
      .from("sales_leads")
      .select("*", { count: "exact", head: true })
      .is("assigned_agent_id", null);

    const { count: convertedLeads } = await insforge.database
      .from("sales_leads")
      .select("*", { count: "exact", head: true })
      .eq("status", "converted");

    const { data: commissions } = await insforge.database
      .from("sales_commission_records")
      .select("calculated_commission, status");

    let pendingApprovals = 0;
    let approvedCommissions = 0;

    (commissions || []).forEach((c: any) => {
      const val = Number(c.calculated_commission) || 0;
      if (c.status === "pending_verification") pendingApprovals += val;
      if (c.status === "approved" || c.status === "paid") approvedCommissions += val;
    });

    return res.json({
      success: true,
      data: {
        total_agents: totalAgents || 0,
        approved_agents: approvedAgents || 0,
        total_leads: totalLeads || 0,
        unassigned_leads: unassignedLeads || 0,
        converted_leads: convertedLeads || 0,
        pending_commission_approvals: pendingApprovals,
        approved_commissions: approvedCommissions,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/sales-agents (List Agents)
router.get("/admin/sales-agents", async (req, res) => {
  const { verification_status } = req.query as { verification_status?: string };
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    let query = insforge.database
      .from("sales_agent_profiles")
      .select("*, businesses(name, city, state)")
      .order("created_at", { ascending: false });

    if (verification_status) query = query.eq("verification_status", verification_status);

    const { data, error } = await query.limit(100);
    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/sales-agents/:id/verify (Admin verifies/suspends agent)
router.patch("/admin/sales-agents/:id/verify", async (req, res) => {
  const { id } = req.params;
  const { verification_status } = req.body;

  if (!verification_status || !["verified", "rejected", "suspended", "pending"].includes(verification_status)) {
    return res.status(400).json({ success: false, error: "Valid verification_status is required." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("sales_agent_profiles")
      .update({
        verification_status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, message: `Agent status updated to ${verification_status}.`, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/sales-agents/leads (Global Leads List)
router.get("/admin/sales-agents/leads", async (req, res) => {
  const { status, unassigned } = req.query as { status?: string; unassigned?: string };
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    let query = insforge.database
      .from("sales_leads")
      .select("*, sales_agent_profiles(full_name, phone)")
      .order("created_at", { ascending: false });

    if (unassigned === "true") query = query.is("assigned_agent_id", null);
    if (status) query = query.eq("status", status);

    const { data, error } = await query.limit(100);
    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/sales-agents/leads/:id/assign (Admin assigns lead to agent)
router.patch("/admin/sales-agents/leads/:id/assign", async (req, res) => {
  const { id } = req.params;
  const { assigned_agent_id, admin_id, priority } = req.body;

  if (!assigned_agent_id || !admin_id) {
    return res.status(400).json({ success: false, error: "assigned_agent_id and admin_id are required." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const updatePayload: any = {
      assigned_agent_id,
      assigned_by: admin_id,
      assigned_at: new Date().toISOString(),
      status: "assigned",
      updated_at: new Date().toISOString(),
    };
    if (priority) updatePayload.priority = priority;

    const { data: updatedLead, error } = await insforge.database
      .from("sales_leads")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    // Update agent total_leads_assigned count
    const { data: agent } = await insforge.database
      .from("sales_agent_profiles")
      .select("total_leads_assigned")
      .eq("id", assigned_agent_id)
      .single();

    if (agent) {
      await insforge.database
        .from("sales_agent_profiles")
        .update({ total_leads_assigned: (agent.total_leads_assigned || 0) + 1 })
        .eq("id", assigned_agent_id);
    }

    // Activity log
    await insforge.database.from("sales_lead_activities").insert([
      {
        lead_id: id,
        actor_id: admin_id,
        activity_type: "LEAD_ASSIGNED",
        details: `Lead assigned to sales agent ${assigned_agent_id}.`,
      },
    ]);

    return res.json({ success: true, message: "Lead assigned successfully.", data: updatedLead });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/sales-agents/commissions (Commission Review Queue)
router.get("/admin/sales-agents/commissions", async (_req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("sales_commission_records")
      .select("*, sales_agent_profiles(full_name, phone, email), sales_leads(lead_number, product_or_service)")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/sales-agents/commissions/:id/approve (Finance Admin Approves/Rejects Commission)
router.patch("/admin/sales-agents/commissions/:id/approve", async (req, res) => {
  const { id } = req.params;
  const { status, admin_id, notes } = req.body;

  if (!status || !["approved", "rejected", "payable"].includes(status) || !admin_id) {
    return res.status(400).json({ success: false, error: "Valid status (approved/rejected/payable) and admin_id are required." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("sales_commission_records")
      .update({
        status,
        approved_by: admin_id,
        approved_at: new Date().toISOString(),
        notes: notes?.trim() || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, message: `Commission status updated to ${status}.`, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/sales-agents/commissions/:id/payout (Finance Admin Records Payout)
router.patch("/admin/sales-agents/commissions/:id/payout", async (req, res) => {
  const { id } = req.params;
  const { payout_reference, admin_id } = req.body;

  if (!payout_reference || !admin_id) {
    return res.status(400).json({ success: false, error: "payout_reference and admin_id are required." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("sales_commission_records")
      .update({
        status: "paid",
        payout_reference: payout_reference.trim(),
        paid_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, message: "Commission payout recorded successfully.", data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
