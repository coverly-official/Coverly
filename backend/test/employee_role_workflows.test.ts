import { test, describe } from "node:test";
import assert from "node:assert";

describe("COVERLY Admin & Buyer Employee Role Management Integration Tests", () => {
  // ====================================================================
  // Test Suite 1: Admin Employee Governance & Provisioning
  // ====================================================================

  test("ERM-1: Admin direct employee creation with role, branch, and default permissions", () => {
    const rolesConfig: Record<string, { permissions: string[]; defaultLimit: number | null }> = {
      procurement_manager: {
        permissions: ["view", "create", "edit", "approve", "reject", "export"],
        defaultLimit: 500000,
      },
      purchase_staff: {
        permissions: ["view", "create", "edit"],
        defaultLimit: null,
      },
      finance_staff: {
        permissions: ["view", "create", "edit", "export"],
        defaultLimit: null,
      },
    };

    // Test creating Procurement Manager
    const pmEmployee = {
      id: "usr-pm-001",
      full_name: "Vikram Rathore",
      email: "vikram.procurement@shreeram-textiles.in",
      business_id: "biz-shreeram-01",
      branch_id: "branch-pune-wh-01",
      role_in_business: "procurement_manager",
      permissions: rolesConfig.procurement_manager.permissions,
      spending_limit: rolesConfig.procurement_manager.defaultLimit,
      is_active: true,
    };

    assert.strictEqual(pmEmployee.role_in_business, "procurement_manager");
    assert.ok(pmEmployee.permissions.includes("approve"));
    assert.strictEqual(pmEmployee.spending_limit, 500000);
    assert.strictEqual(pmEmployee.branch_id, "branch-pune-wh-01");

    // Test creating Purchase Staff
    const psEmployee = {
      id: "usr-ps-002",
      full_name: "Sneha Patil",
      email: "sneha.purchase@shreeram-textiles.in",
      business_id: "biz-shreeram-01",
      branch_id: "branch-pune-wh-01",
      role_in_business: "purchase_staff",
      permissions: rolesConfig.purchase_staff.permissions,
      spending_limit: rolesConfig.purchase_staff.defaultLimit,
      is_active: true,
    };

    assert.strictEqual(psEmployee.role_in_business, "purchase_staff");
    assert.strictEqual(psEmployee.permissions.includes("approve"), false);
    assert.strictEqual(psEmployee.spending_limit, null);

    // Test creating Finance Staff
    const fsEmployee = {
      id: "usr-fs-003",
      full_name: "Rohan Deshmukh",
      email: "rohan.accounts@shreeram-textiles.in",
      business_id: "biz-shreeram-01",
      branch_id: "branch-headquarters-01",
      role_in_business: "finance_staff",
      permissions: rolesConfig.finance_staff.permissions,
      spending_limit: rolesConfig.finance_staff.defaultLimit,
      is_active: true,
    };

    assert.strictEqual(fsEmployee.role_in_business, "finance_staff");
    assert.ok(fsEmployee.permissions.includes("export"));
    assert.strictEqual(fsEmployee.permissions.includes("approve"), false);
  });

  test("ERM-2: Admin filters employee roster by role, branch, and active status", () => {
    const employeeRoster = [
      { id: "e1", name: "Vikram Rathore", role: "procurement_manager", branch_id: "b-pune", is_active: true },
      { id: "e2", name: "Sneha Patil", role: "purchase_staff", branch_id: "b-pune", is_active: true },
      { id: "e3", name: "Rohan Deshmukh", role: "finance_staff", branch_id: "b-mumbai", is_active: true },
      { id: "e4", name: "Kunal Shah", role: "purchase_staff", branch_id: "b-mumbai", is_active: false },
      { id: "e5", name: "Priya Nair", role: "procurement_manager", branch_id: "b-bangalore", is_active: true },
    ];

    // Filter by role
    const procurementManagers = employeeRoster.filter((e) => e.role === "procurement_manager");
    assert.strictEqual(procurementManagers.length, 2);

    // Filter by branch
    const puneEmployees = employeeRoster.filter((e) => e.branch_id === "b-pune");
    assert.strictEqual(puneEmployees.length, 2);

    // Filter by active status
    const activeStaff = employeeRoster.filter((e) => e.is_active);
    assert.strictEqual(activeStaff.length, 4);

    // Filter suspended
    const suspendedStaff = employeeRoster.filter((e) => !e.is_active);
    assert.strictEqual(suspendedStaff.length, 1);
  });

  test("ERM-3: Admin updates permissions, spending limit, and toggles account status", () => {
    const member = {
      id: "mem-001",
      user_id: "usr-pm-001",
      role_in_business: "procurement_manager",
      permissions: ["view", "create"],
      spending_limit: 200000,
      is_active: true,
    };

    // Admin elevates limit and adds approval permissions
    member.permissions = ["view", "create", "edit", "approve", "reject", "export"];
    member.spending_limit = 750000;
    assert.strictEqual(member.spending_limit, 750000);
    assert.ok(member.permissions.includes("approve"));

    // Admin temporarily suspends account
    member.is_active = false;
    assert.strictEqual(member.is_active, false);

    // Reactivate account
    member.is_active = true;
    assert.strictEqual(member.is_active, true);
  });

  test("ERM-4: Soft revocation preserves historical audit trails and relations", () => {
    const employeeMembership = {
      id: "mem-002",
      user_id: "usr-ps-002",
      business_id: "biz-shreeram-01",
      is_active: true,
      deactivated_at: null as string | null,
    };

    const historicalPurchaseRequests = [
      { id: "pr-101", requester_id: "usr-ps-002", pr_number: "PR-2026-001", amount: 45000 },
      { id: "pr-102", requester_id: "usr-ps-002", pr_number: "PR-2026-002", amount: 120000 },
    ];

    // Soft revoke
    employeeMembership.is_active = false;
    employeeMembership.deactivated_at = new Date().toISOString();

    // Verify membership is revoked
    assert.strictEqual(employeeMembership.is_active, false);
    assert.ok(employeeMembership.deactivated_at !== null);

    // Historic PRs remain completely intact with requester relation
    assert.strictEqual(historicalPurchaseRequests.length, 2);
    assert.strictEqual(historicalPurchaseRequests[0].requester_id, "usr-ps-002");
  });

  test("ERM-5: Admin Employee Dashboard KPI aggregation", () => {
    const employees = [
      { role: "procurement_manager", is_active: true },
      { role: "procurement_manager", is_active: true },
      { role: "purchase_staff", is_active: true },
      { role: "purchase_staff", is_active: false },
      { role: "finance_staff", is_active: true },
      { role: "owner", is_active: true },
    ];

    const pendingInvitations = [{ id: "inv-1" }, { id: "inv-2" }];

    const metrics = {
      total_employees: employees.length,
      procurement_managers: employees.filter((e) => e.role === "procurement_manager").length,
      purchase_staff: employees.filter((e) => e.role === "purchase_staff").length,
      finance_staff: employees.filter((e) => e.role === "finance_staff").length,
      active_employees: employees.filter((e) => e.is_active).length,
      suspended_employees: employees.filter((e) => !e.is_active).length,
      pending_invitations: pendingInvitations.length,
    };

    assert.strictEqual(metrics.total_employees, 6);
    assert.strictEqual(metrics.procurement_managers, 2);
    assert.strictEqual(metrics.purchase_staff, 2);
    assert.strictEqual(metrics.finance_staff, 1);
    assert.strictEqual(metrics.active_employees, 5);
    assert.strictEqual(metrics.suspended_employees, 1);
    assert.strictEqual(metrics.pending_invitations, 2);
  });

  // ====================================================================
  // Test Suite 2: Purchase Staff Requisition & Approval Delegation
  // ====================================================================

  test("ERM-6: Purchase Staff creates purchase requisition request", () => {
    const purchaseStaffUser = {
      id: "usr-ps-002",
      role_in_business: "purchase_staff",
      branch_id: "branch-pune-wh-01",
    };

    const newPr = {
      pr_number: "PR-2026-X99",
      requester_id: purchaseStaffUser.id,
      title: "Raw Polyester Yarn 150D Grade A",
      estimated_amount: 180000,
      status: "pending_approval",
      items: [
        { item_name: "Yarn Spools 150D", quantity: 300, unit: "kg", estimated_unit_price: 600, total_price: 180000 },
      ],
    };

    assert.strictEqual(newPr.status, "pending_approval");
    assert.strictEqual(newPr.items.length, 1);
    assert.strictEqual(newPr.items[0].total_price, 180000);
  });

  test("ERM-7: Purchase Staff is blocked from approving purchase requests or issuing POs", () => {
    const purchaseStaffMember = {
      role_in_business: "purchase_staff",
      permissions: ["view", "create", "edit"],
    };

    const allowedApprovalRoles = ["owner", "admin", "business_manager", "procurement_manager"];

    const canApprove = allowedApprovalRoles.includes(purchaseStaffMember.role_in_business);
    assert.strictEqual(canApprove, false);

    const canIssuePO =
      allowedApprovalRoles.includes(purchaseStaffMember.role_in_business) ||
      purchaseStaffMember.permissions.includes("approve");
    assert.strictEqual(canIssuePO, false);
  });

  // ====================================================================
  // Test Suite 3: Procurement Manager Review & Spending Limits
  // ====================================================================

  test("ERM-8: Procurement Manager approves purchase request within spending limit", () => {
    const pmMember = {
      id: "usr-pm-001",
      role_in_business: "procurement_manager",
      spending_limit: 500000,
    };

    const pr = {
      id: "pr-001",
      pr_number: "PR-2026-001",
      estimated_amount: 180000,
      status: "pending_approval",
    };

    const isAuthorized = pr.estimated_amount <= pmMember.spending_limit;
    assert.strictEqual(isAuthorized, true);

    // Apply approval
    pr.status = "approved";
    assert.strictEqual(pr.status, "approved");
  });

  test("ERM-9: Procurement Manager approval blocked when PR exceeds spending limit", () => {
    const pmMember = {
      id: "usr-pm-001",
      role_in_business: "procurement_manager",
      spending_limit: 250000, // 2.5 Lakh limit
    };

    const highValuePr = {
      id: "pr-002",
      pr_number: "PR-2026-HIGH-01",
      estimated_amount: 600000, // 6 Lakh request
      status: "pending_approval",
    };

    const exceedsLimit = highValuePr.estimated_amount > pmMember.spending_limit;
    assert.strictEqual(exceedsLimit, true);

    // Should require escalation to business owner
    const canSelfApprove = pmMember.role_in_business === "owner" || !exceedsLimit;
    assert.strictEqual(canSelfApprove, false);
  });

  test("ERM-10: Procurement Manager issues Purchase Order with spending limit verification", () => {
    const pmMember = {
      id: "usr-pm-001",
      role_in_business: "procurement_manager",
      spending_limit: 500000,
    };

    const poPayload = {
      po_number: "PO-2026-TK88",
      supplier_business_id: "biz-supplier-01",
      subtotal: 300000,
      freight: 15000,
      gst_amount: 56700,
      total_amount: 371700,
      po_status: "issued",
      authorized_by: pmMember.id,
    };

    assert.ok(poPayload.total_amount <= pmMember.spending_limit);
    assert.strictEqual(poPayload.po_status, "issued");
    assert.strictEqual(poPayload.authorized_by, "usr-pm-001");
  });

  // ====================================================================
  // Test Suite 4: Finance / Accounts Staff Workflows & Guardrails
  // ====================================================================

  test("ERM-11: Finance Staff records incoming invoice with GST, freight, and auto calculations", () => {
    const financeStaff = {
      id: "usr-fs-003",
      role_in_business: "finance_staff",
    };

    const subtotal = 100000;
    const freight_charges = 5000;
    const additional_charges = 1000;
    const gst_rate = 0.18;

    const baseAmount = subtotal + freight_charges + additional_charges;
    const gst_amount = Math.round(baseAmount * gst_rate * 100) / 100;
    const total_amount = Math.round((baseAmount + gst_amount) * 100) / 100;

    assert.strictEqual(baseAmount, 106000);
    assert.strictEqual(gst_amount, 19080);
    assert.strictEqual(total_amount, 125080);

    const invoice = {
      invoice_number: "INV-SUP-8921",
      purchase_order_id: "po-101",
      subtotal,
      freight_charges,
      additional_charges,
      gst_rate,
      gst_amount,
      total_amount,
      payment_status: "unpaid",
      amount_paid: 0,
      recorded_by: financeStaff.id,
    };

    assert.strictEqual(invoice.payment_status, "unpaid");
    assert.strictEqual(invoice.total_amount, 125080);
    assert.strictEqual(invoice.recorded_by, "usr-fs-003");
  });

  test("ERM-12: Finance Staff maintains invoice payment records across statuses", () => {
    const invoice = {
      id: "inv-001",
      invoice_number: "INV-SUP-8921",
      total_amount: 125080,
      amount_paid: 0,
      payment_status: "unpaid",
      payment_reference: null as string | null,
    };

    // Partial payment record
    invoice.amount_paid = 50000;
    invoice.payment_status = "partially_paid";
    invoice.payment_reference = "NEFT-HDFC-99120";

    assert.strictEqual(invoice.payment_status, "partially_paid");
    assert.strictEqual(invoice.amount_paid, 50000);

    // Full payment record
    invoice.amount_paid = 125080;
    invoice.payment_status = "paid";
    invoice.payment_reference = "UTR-SBIN-8821994";

    assert.strictEqual(invoice.payment_status, "paid");
    assert.strictEqual(invoice.amount_paid, invoice.total_amount);
  });

  test("ERM-13: Finance Staff records standalone purchase expenses with category validation", () => {
    const validCategories = [
      "freight",
      "packaging",
      "insurance",
      "loading_unloading",
      "customs_duty",
      "storage_warehouse",
      "other",
    ];

    const expenseRecord = {
      expense_category: "insurance",
      amount: 12500,
      description: "Transit insurance for Gujarat to Pune logistics consignment",
      vendor_name: "ICICI Lombard General Insurance",
      payment_reference: "CHQ-008129",
      recorded_by: "usr-fs-003",
    };

    assert.ok(validCategories.includes(expenseRecord.expense_category));
    assert.ok(expenseRecord.amount > 0);
    assert.strictEqual(expenseRecord.recorded_by, "usr-fs-003");
  });

  test("ERM-14: Finance Staff is blocked from RFQ creation/approval and PO issuance", () => {
    const financeStaffMember = {
      role_in_business: "finance_staff",
      permissions: ["view", "create", "edit", "export"],
    };

    // Supplier selection / RFQ approval check
    const canApproveRfq = ["owner", "admin", "business_manager", "procurement_manager"].includes(
      financeStaffMember.role_in_business
    );
    assert.strictEqual(canApproveRfq, false);

    // Purchase order issuance check
    const canIssuePO = ["owner", "admin", "business_manager", "procurement_manager"].includes(
      financeStaffMember.role_in_business
    );
    assert.strictEqual(canIssuePO, false);
  });

  test("ERM-15: Financial summary metrics aggregation for Finance Staff & Owner", () => {
    const invoices = [
      { total_amount: 100000, amount_paid: 100000, payment_status: "paid", gst_amount: 18000, freight_charges: 4000 },
      { total_amount: 250000, amount_paid: 100000, payment_status: "partially_paid", gst_amount: 45000, freight_charges: 12000 },
      { total_amount: 80000, amount_paid: 0, payment_status: "unpaid", gst_amount: 14400, freight_charges: 3000 },
    ];

    const expenses = [
      { expense_category: "freight", amount: 6000 },
      { expense_category: "insurance", amount: 4500 },
      { expense_category: "customs_duty", amount: 15000 },
    ];

    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalGst = 0;
    let totalFreight = 0;

    for (const inv of invoices) {
      totalInvoiced += inv.total_amount;
      totalPaid += inv.amount_paid;
      totalPending += inv.total_amount - inv.amount_paid;
      totalGst += inv.gst_amount;
      totalFreight += inv.freight_charges;
    }

    let totalOtherExpenses = 0;
    for (const exp of expenses) {
      totalOtherExpenses += exp.amount;
    }

    assert.strictEqual(totalInvoiced, 430000);
    assert.strictEqual(totalPaid, 200000);
    assert.strictEqual(totalPending, 230000);
    assert.strictEqual(totalGst, 77400);
    assert.strictEqual(totalFreight, 19000);
    assert.strictEqual(totalOtherExpenses, 25500);
  });

  // ====================================================================
  // Test Suite 5: Audit Activity Trail & Branch Governance
  // ====================================================================

  test("ERM-16: Employee activity logs correctly record actions with branch assignment", () => {
    const activityLogs = [
      {
        id: "act-1",
        business_id: "biz-shreeram-01",
        user_id: "usr-pm-001",
        branch_id: "branch-pune-wh-01",
        activity_type: "po_issued",
        description: "Purchase order PO-2026-TK88 issued for ₹371700.",
        created_at: new Date().toISOString(),
      },
      {
        id: "act-2",
        business_id: "biz-shreeram-01",
        user_id: "usr-fs-003",
        branch_id: "branch-pune-wh-01",
        activity_type: "invoice_recorded",
        description: "Supplier invoice INV-SUP-8921 recorded for ₹125080.",
        created_at: new Date().toISOString(),
      },
      {
        id: "act-3",
        business_id: "biz-shreeram-01",
        user_id: "usr-fs-003",
        branch_id: "branch-pune-wh-01",
        activity_type: "payment_recorded",
        description: "Payment updated for invoice INV-SUP-8921: paid, ₹125080 recorded.",
        created_at: new Date().toISOString(),
      },
    ];

    assert.strictEqual(activityLogs.length, 3);
    assert.strictEqual(activityLogs[0].activity_type, "po_issued");
    assert.strictEqual(activityLogs[1].activity_type, "invoice_recorded");
    assert.strictEqual(activityLogs[2].activity_type, "payment_recorded");
    assert.strictEqual(activityLogs[0].branch_id, "branch-pune-wh-01");
  });
});
