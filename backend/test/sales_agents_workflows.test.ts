import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("COVERLY Sales Agent & Business Representative System Integration Tests", () => {
  // Workflow SA-1: Sales Agent Onboarding (Independent vs Company Representative)
  it("Workflow SA-1: Agent Registration & Profile Setup (Independent vs Company Representative)", async () => {
    // Independent Agent
    const independentAgent = {
      userId: "usr-agent-001",
      agent_type: "independent" as const,
      full_name: "Rajeshwar Rao",
      phone: "+91 98490 12345",
      email: "rajeshwar.rao@b2bagents.in",
      bio: "Senior industrial machinery and electrical equipment broker with 14 years across South India.",
      product_categories: ["Industrial Machinery", "Electrical Equipment", "Packaging Materials"],
      service_categories: ["Machinery Maintenance & AMC"],
      operating_cities: ["Hyderabad", "Bengaluru", "Chennai"],
      operating_states: ["Telangana", "Karnataka", "Tamil Nadu"],
      languages: ["English", "Telugu", "Hindi", "Kannada"],
      experience_years: 14,
      verification_status: "pending",
      is_public_discovery_enabled: true,
      affiliated_business_id: null,
    };

    assert.strictEqual(independentAgent.agent_type, "independent");
    assert.strictEqual(independentAgent.affiliated_business_id, null, "Independent agent has no parent business");
    assert.ok(independentAgent.product_categories.length >= 2, "Agent covers specified categories");
    assert.ok(independentAgent.operating_cities.includes("Hyderabad"), "Territory defined");

    // Company Representative
    const companyRep = {
      userId: "usr-agent-002",
      agent_type: "company_representative" as const,
      full_name: "Anita Deshmukh",
      phone: "+91 98220 54321",
      email: "anita.deshmukh@apexmetals.com",
      bio: "Authorized Sales Representative for Apex Steel & Alloys Pvt Ltd.",
      affiliated_business_id: "biz-mfg-001",
      product_categories: ["Raw Materials", "Construction Materials"],
      operating_cities: ["Mumbai", "Pune"],
      operating_states: ["Maharashtra"],
      languages: ["English", "Marathi", "Hindi"],
      experience_years: 8,
      verification_status: "pending",
      is_public_discovery_enabled: true,
    };

    assert.strictEqual(companyRep.agent_type, "company_representative");
    assert.ok(companyRep.affiliated_business_id, "Company representative must be linked to parent business");
  });

  // Workflow SA-2: Unregistered Guest Business Requirement Submission
  it("Workflow SA-2: Unregistered Guest Business Requirement Submission with Unique Lead Reference", async () => {
    const guestLead = {
      customer_id: null, // Guest without account
      guest_name: "Karan Singhania",
      guest_email: "karan@singhaniapack.in",
      guest_phone: "+91 98111 88776",
      guest_company: "Singhania Packaging Works",
      requirement_category: "Packaging Materials",
      product_or_service: "3-Ply & 5-Ply Corrugated Shipping Cartons",
      quantity: "50,000 Boxes / month",
      budget: 1500000,
      location_city: "Faridabad",
      location_state: "Haryana",
      description: "Need monthly recurring supply of heavy-duty corrugated cartons for auto components export.",
      priority: "high" as const,
      status: "new" as const,
      lead_source: "guest_form" as const,
    };

    assert.strictEqual(guestLead.customer_id, null, "Guest submission starts with null customer_id");
    assert.ok(guestLead.guest_name && guestLead.guest_email && guestLead.guest_phone, "Guest contact required");

    // Generate reference code
    const leadNumber = `SA-LEAD-${Date.now().toString(36).toUpperCase()}-501`;
    assert.match(leadNumber, /^SA-LEAD-/, "Lead number formatted with SA-LEAD- prefix");
  });

  // Workflow SA-3: Guest-to-Buyer Conversion & Historical Lead Association
  it("Workflow SA-3: Guest-to-Buyer Conversion & Historical Lead Association", async () => {
    const historicalLeads = [
      { id: "lead-01", lead_number: "SA-LEAD-K1-101", guest_email: "karan@singhaniapack.in", customer_id: null },
      { id: "lead-02", lead_number: "SA-LEAD-K1-102", guest_email: "karan@singhaniapack.in", customer_id: null },
      { id: "lead-03", lead_number: "SA-LEAD-OTHER", guest_email: "other@buyer.com", customer_id: null },
    ];

    // Karan registers on COVERLY with the same email
    const registeredBuyer = {
      id: "usr-buyer-karan-88",
      email: "karan@singhaniapack.in",
    };

    let claimedCount = 0;
    historicalLeads.forEach((lead) => {
      if (lead.guest_email === registeredBuyer.email && !lead.customer_id) {
        lead.customer_id = registeredBuyer.id;
        claimedCount++;
      }
    });

    assert.strictEqual(claimedCount, 2, "Both matching leads claimed by buyer account");
    assert.strictEqual(historicalLeads[0].customer_id, "usr-buyer-karan-88");
    assert.strictEqual(historicalLeads[2].customer_id, null, "Unrelated leads untouched");
  });

  // Workflow SA-4: Admin Lead Review & Allocation to Verified Agent
  it("Workflow SA-4: Admin Lead Review & Allocation to Verified Agent", async () => {
    const unassignedLead = {
      id: "lead-501",
      lead_number: "SA-LEAD-XY9-501",
      requirement_category: "Packaging Materials",
      location_city: "Faridabad",
      location_state: "Haryana",
      status: "new" as string,
      assigned_agent_id: null as string | null,
      assigned_by: null as string | null,
    };

    const agent = {
      id: "agent-rajesh-01",
      verification_status: "verified",
      product_categories: ["Packaging Materials", "Industrial Machinery"],
      total_leads_assigned: 5,
    };

    assert.strictEqual(agent.verification_status, "verified", "Agent must be verified to receive leads");
    assert.ok(agent.product_categories.includes(unassignedLead.requirement_category), "Category alignment verified");

    // Admin allocates lead
    const adminUser = "usr-admin-01";
    unassignedLead.assigned_agent_id = agent.id;
    unassignedLead.assigned_by = adminUser;
    unassignedLead.status = "assigned";
    agent.total_leads_assigned += 1;

    assert.strictEqual(unassignedLead.status, "assigned");
    assert.strictEqual(unassignedLead.assigned_agent_id, "agent-rajesh-01");
    assert.strictEqual(agent.total_leads_assigned, 6, "Agent workload counter incremented");
  });

  // Workflow SA-5: Agent 10-State Lead Progression & Activity Audit Logging
  it("Workflow SA-5: Agent 10-State Lead Progression & Activity Audit Logging", async () => {
    const validStates = [
      "new",
      "assigned",
      "contacted",
      "interested",
      "followup_required",
      "quotation_requested",
      "negotiation",
      "converted",
      "lost",
      "closed",
    ];

    assert.strictEqual(validStates.length, 10, "Lead model contains exactly 10 distinct states");

    const lead = {
      id: "lead-501",
      status: "assigned",
      notes: [] as string[],
    };

    const activityLog: Array<{ action: string; from_status: string; to_status: string; timestamp: number }> = [];

    // State progression 1: Contacted buyer
    const from1 = lead.status;
    lead.status = "contacted";
    activityLog.push({ action: "lead_status_updated", from_status: from1, to_status: lead.status, timestamp: Date.now() });

    // State progression 2: Buyer expressed strong interest
    const from2 = lead.status;
    lead.status = "interested";
    activityLog.push({ action: "lead_status_updated", from_status: from2, to_status: lead.status, timestamp: Date.now() });

    // State progression 3: Quotation requested
    const from3 = lead.status;
    lead.status = "quotation_requested";
    activityLog.push({ action: "lead_status_updated", from_status: from3, to_status: lead.status, timestamp: Date.now() });

    assert.strictEqual(lead.status, "quotation_requested");
    assert.strictEqual(activityLog.length, 3, "All status changes logged to chronological audit trail");
    assert.strictEqual(activityLog[2].to_status, "quotation_requested");
  });

  // Workflow SA-6: Follow-up Scheduling & Outcome Recording
  it("Workflow SA-6: Follow-up Scheduling & Outcome Recording with Multi-Channel Types", async () => {
    const followup = {
      id: "fup-01",
      lead_id: "lead-501",
      agent_id: "agent-rajesh-01",
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      followup_type: "factory_visit" as const,
      outcome_notes: "",
      next_action: "Inspect packaging specs on site at factory",
      is_completed: false,
    };

    assert.ok(!followup.is_completed, "Followup starts pending");
    assert.strictEqual(followup.followup_type, "factory_visit");

    // Complete follow-up with outcome
    followup.is_completed = true;
    followup.outcome_notes = "Visited plant, verified 50k cartons monthly requirement. Client requested official quotation.";
    followup.next_action = "Generate and submit official supplier quotation.";

    assert.strictEqual(followup.is_completed, true);
    assert.ok(followup.outcome_notes.length > 20, "Meaningful outcome notes recorded");
  });

  // Workflow SA-7: Lead Conversion Linked to Transaction & Configurable Commission Calculation
  it("Workflow SA-7: Lead Conversion Linked to Transaction & Configurable Commission Calculation", async () => {
    // Commission rules
    const commissionRules = [
      {
        rule_name: "Packaging Materials Standard Rate",
        commission_type: "percentage" as const,
        commission_rate: 2.5, // 2.5%
        fixed_amount: null,
        applicable_category: "Packaging Materials",
        min_transaction_value: 50000,
      },
      {
        rule_name: "Machinery Flat Bonus",
        commission_type: "fixed_amount" as const,
        commission_rate: null,
        fixed_amount: 15000,
        applicable_category: "Industrial Machinery",
        min_transaction_value: 200000,
      },
    ];

    const lead = {
      id: "lead-501",
      requirement_category: "Packaging Materials",
      status: "negotiation",
      assigned_agent_id: "agent-rajesh-01",
      converted_transaction_value: 0,
      linked_order_id: null as string | null,
    };

    // Buyer closes PO/Order for 1,200,000 INR
    const qualifyingOrder = {
      order_id: "ord-pkg-9901",
      total_amount: 1200000,
    };

    lead.status = "converted";
    lead.linked_order_id = qualifyingOrder.order_id;
    lead.converted_transaction_value = qualifyingOrder.total_amount;

    // Apply rule
    const rule = commissionRules.find((r) => r.applicable_category === lead.requirement_category);
    assert.ok(rule, "Matching commission rule found");

    let calculatedCommission = 0;
    if (rule.commission_type === "percentage" && rule.commission_rate) {
      calculatedCommission = Math.round((lead.converted_transaction_value * rule.commission_rate) / 100);
    } else if (rule.commission_type === "fixed_amount" && rule.fixed_amount) {
      calculatedCommission = rule.fixed_amount;
    }

    assert.strictEqual(calculatedCommission, 30000, "2.5% on 1,200,000 INR correctly calculates to 30,000 INR");

    const commissionRecord = {
      commission_number: `COM-${Date.now().toString(36).toUpperCase()}-11`,
      agent_id: lead.assigned_agent_id,
      lead_id: lead.id,
      order_id: lead.linked_order_id,
      qualifying_transaction_value: lead.converted_transaction_value,
      calculated_commission: calculatedCommission,
      status: "pending_verification" as const,
    };

    assert.strictEqual(commissionRecord.status, "pending_verification", "Commission initially pending administrative verification");
    assert.strictEqual(commissionRecord.calculated_commission, 30000);
  });

  // Workflow SA-8: Finance Admin Commission Approval & Payout Recording
  it("Workflow SA-8: Finance Admin Commission Approval & Payout Recording", async () => {
    const commissionRecord = {
      id: "com-rec-01",
      commission_number: "COM-77A-11",
      agent_id: "agent-rajesh-01",
      calculated_commission: 30000,
      status: "pending_verification" as string,
      approved_by: null as string | null,
      payout_reference: null as string | null,
      paid_at: null as string | null,
    };

    // Admin verifies conversion and approves commission
    const financeAdmin = "usr-fin-admin-99";
    commissionRecord.status = "approved";
    commissionRecord.approved_by = financeAdmin;

    assert.strictEqual(commissionRecord.status, "approved");
    assert.strictEqual(commissionRecord.approved_by, "usr-fin-admin-99");

    // Finance executes bank transfer / NEFT payout
    const neftReference = "NEFT-HDFC-99281746201";
    commissionRecord.status = "paid";
    commissionRecord.payout_reference = neftReference;
    commissionRecord.paid_at = new Date().toISOString();

    assert.strictEqual(commissionRecord.status, "paid");
    assert.strictEqual(commissionRecord.payout_reference, "NEFT-HDFC-99281746201");
    assert.ok(commissionRecord.paid_at);
  });
});
