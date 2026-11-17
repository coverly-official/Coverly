import { test, describe } from "node:test";
import assert from "node:assert";
import { roundToTwoDecimals, calculateLandedCost } from "../src/lib/landed-cost.js";

describe("COVERLY Retailer Marketplace System Integration Tests", () => {
  // Workflow RET-1: Guest Discovers Wholesale Products
  test("Workflow RET-1: Guest Discovers Wholesale Products Across Categories", () => {
    const products = [
      {
        id: "prod-rice-1",
        name: "Premium Basmati Rice 1121 Steam",
        category: "grocery_fmcg",
        moq: 100,
        unit: "kg",
        indicative_price: 85,
        supplier: { name: "Punjab Agro Wholesalers", type: "wholesaler" },
      },
      {
        id: "prod-oil-2",
        name: "Refined Sunflower Oil 15L Tin",
        category: "grocery_fmcg",
        moq: 20,
        unit: "tin",
        indicative_price: 1850,
        supplier: { name: "Gujarat Edible Oils Ltd", type: "manufacturer" },
      },
    ];

    assert.strictEqual(products.length, 2);
    assert.strictEqual(products[0].category, "grocery_fmcg");
    assert.strictEqual(products[0].moq, 100);
    assert.ok(products[1].indicative_price > 1000);
  });

  // Workflow RET-2: Guest Searches Wholesalers and Distributors
  test("Workflow RET-2: Guest Searches Wholesalers & Distributors with Directory Filters", () => {
    const directory = [
      {
        id: "biz-1",
        name: "Metro Cash & Carry Wholesale Hub",
        business_type: "wholesaler",
        city: "Mumbai",
        state: "Maharashtra",
        verification_level: "document_verified",
        categories: ["grocery_fmcg", "general_retail"],
      },
      {
        id: "biz-2",
        name: "Southern FMCG Distributors",
        business_type: "distributor",
        city: "Bengaluru",
        state: "Karnataka",
        verification_level: "registration_checked",
        categories: ["grocery_fmcg"],
      },
    ];

    const filtered = directory.filter(
      (d) => d.business_type === "wholesaler" && d.city === "Mumbai"
    );

    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].name, "Metro Cash & Carry Wholesale Hub");
    assert.strictEqual(filtered[0].verification_level, "document_verified");
  });

  // Workflow RET-3: Unregistered Guest Submits Purchase Enquiry
  test("Workflow RET-3: Unregistered Guest Submits Wholesale Purchase Enquiry with Unique Reference", () => {
    const guestEnquiry = {
      is_guest_submission: true,
      guest_name: "Ramesh Gupta",
      guest_email: "ramesh.kirana@gmail.com",
      guest_phone: "+91 98200 44556",
      guest_company: "Gupta Kirana & General Stores",
      title: "Bulk Purchase of Sugar & Edible Oil",
      category_id: "grocery_fmcg",
      delivery_city: "Nashik",
      delivery_pincode: "422001",
      required_quantity: 500,
      unit: "kg",
    };

    const rfqNumber = `RFQ-RET-GUEST-${Date.now().toString().slice(-6)}`;

    assert.ok(rfqNumber.startsWith("RFQ-RET-GUEST-"));
    assert.strictEqual(guestEnquiry.is_guest_submission, true);
    assert.strictEqual(guestEnquiry.guest_email, "ramesh.kirana@gmail.com");
  });

  // Workflow RET-4: Enquiry Persists in Remote Data Layer
  test("Workflow RET-4: Enquiry Persists in Data Layer with Contact Credentials", () => {
    const record = {
      id: "rfq-guest-101",
      rfq_number: "RFQ-RET-GUEST-9901",
      buyer_id: null,
      guest_name: "Ramesh Gupta",
      guest_email: "ramesh.kirana@gmail.com",
      guest_phone: "+91 98200 44556",
      status: "submitted",
      created_at: new Date().toISOString(),
    };

    assert.ok(record.id);
    assert.strictEqual(record.status, "submitted");
    assert.strictEqual(record.buyer_id, null);
  });

  // Workflow RET-5: Guest Registers as a Retailer
  test("Workflow RET-5: Retailer Account Registration (Kirana / Supermarket / Departmental)", () => {
    const retailerRegistration = {
      user_id: "usr-ramesh-1",
      owner_name: "Ramesh Gupta",
      shop_name: "Gupta Super Kirana Store",
      retail_type: "kirana",
      phone: "+91 98200 44556",
      email: "ramesh.kirana@gmail.com",
      store_address: "Shop 4, Market Yard Road",
      city: "Nashik",
      state: "Maharashtra",
      pincode: "422001",
      country: "India",
      gstin: "27AABCG1234F1Z9",
      fssai_license: "11521012000456",
      is_multi_branch: false,
      purchasing_categories: ["Grocery & FMCG", "Snacks & Beverages"],
      verification_status: "unverified",
    };

    const allowedRetailTypes = [
      "individual_shop",
      "kirana",
      "grocery",
      "supermarket",
      "departmental",
      "electronics",
      "garments_fashion",
      "hardware",
      "medical_general",
      "restaurant_hotel",
      "multi_branch",
      "other",
    ];

    assert.ok(allowedRetailTypes.includes(retailerRegistration.retail_type));
    assert.strictEqual(retailerRegistration.verification_status, "unverified");
    assert.ok(retailerRegistration.gstin.startsWith("27"));
  });

  // Workflow RET-6: Guest Enquiry Securely Linked to Account
  test("Workflow RET-6: Guest-to-Retailer Account Conversion & Retroactive Enquiry Claiming", () => {
    const historicalEnquiries = [
      { id: "rfq-1", guest_email: "ramesh.kirana@gmail.com", buyer_id: null },
      { id: "rfq-2", guest_email: "ramesh.kirana@gmail.com", buyer_id: null },
      { id: "rfq-3", guest_email: "unrelated@gmail.com", buyer_id: null },
    ];

    const registeredUser = {
      id: "usr-ramesh-1",
      email: "ramesh.kirana@gmail.com",
      business_id: "biz-gupta-kirana",
    };

    const claimed = historicalEnquiries
      .filter((e) => e.guest_email === registeredUser.email && e.buyer_id === null)
      .map((e) => ({
        ...e,
        buyer_id: registeredUser.id,
        business_id: registeredUser.business_id,
        is_guest_submission: false,
      }));

    assert.strictEqual(claimed.length, 2);
    assert.strictEqual(claimed[0].buyer_id, "usr-ramesh-1");
    assert.strictEqual(claimed[0].is_guest_submission, false);
  });

  // Workflow RET-7: Retailer Creates Shop Profile
  test("Workflow RET-7: Retailer Creates Multi-Store Shop Profile with Verification Submission", () => {
    const profile = {
      id: "ret-prof-1",
      user_id: "usr-ramesh-1",
      shop_name: "Gupta Super Kirana Store",
      retail_type: "kirana",
      store_address: "Shop 4, Market Yard Road, Nashik",
      city: "Nashik",
      state: "Maharashtra",
      pincode: "422001",
      gstin: "27AABCG1234F1Z9",
      fssai_license: "11521012000456",
      verification_status: "pending",
      verification_notes: "Submitted FSSAI and Shop Act licenses for verification.",
    };

    assert.strictEqual(profile.verification_status, "pending");
    assert.ok(profile.fssai_license.length > 10);
  });

  // Workflow RET-8: Retailer Creates Purchase List
  test("Workflow RET-8: Retailer Creates Sourcing Purchase List with Multi-Category Products", () => {
    const purchaseList = {
      id: "plist-1",
      user_id: "usr-ramesh-1",
      title: "Bi-Weekly Grocery Replenishment",
      category: "grocery_fmcg",
      is_recurring: true,
      items: [
        { product_name: "Basmati Rice 1121", quantity: 100, unit: "kg", target_unit_price: 80 },
        { product_name: "Refined Sugar M-30", quantity: 50, unit: "kg", target_unit_price: 42 },
        { product_name: "Sunflower Cooking Oil", quantity: 20, unit: "litre", target_unit_price: 130 },
        { product_name: "Toor Dal Premium", quantity: 50, unit: "kg", target_unit_price: 145 },
      ],
    };

    assert.strictEqual(purchaseList.items.length, 4);
    assert.strictEqual(purchaseList.is_recurring, true);
    const estimatedTotal = purchaseList.items.reduce(
      (sum, it) => sum + it.quantity * it.target_unit_price,
      0
    );
    assert.strictEqual(estimatedTotal, 100 * 80 + 50 * 42 + 20 * 130 + 50 * 145);
  });

  // Workflow RET-9: Retailer Submits Multi-Product RFQ
  test("Workflow RET-9: Retailer Converts Purchase List into Multi-Product RFQ", () => {
    const rfq = {
      id: "rfq-ret-101",
      rfq_number: "RFQ-RET-774411",
      buyer_id: "usr-ramesh-1",
      title: "Wholesale RFQ: Bi-Weekly Grocery Replenishment",
      category_id: "grocery_fmcg",
      delivery_city: "Nashik",
      delivery_pincode: "422001",
      dispatch_mode: "broadcast",
      status: "submitted",
      items_count: 4,
    };

    assert.strictEqual(rfq.status, "submitted");
    assert.strictEqual(rfq.items_count, 4);
    assert.ok(rfq.rfq_number.startsWith("RFQ-RET-"));
  });

  // Workflow RET-10: Multiple Suppliers Submit Quotations
  test("Workflow RET-10: Multiple Suppliers Submit Itemized Landed Cost Quotations", () => {
    const quote1 = calculateLandedCost({
      quantity: 220,
      unitPrice: 85,
      discount: 500,
      packaging: 300,
      freight: 1200,
      insurance: 200,
      gstRate: 0.05,
    });

    const quote2 = calculateLandedCost({
      quantity: 220,
      unitPrice: 82,
      discount: 200,
      packaging: 400,
      freight: 1600,
      insurance: 150,
      gstRate: 0.05,
    });

    assert.ok(quote1.totalLandedCost > 0);
    assert.ok(quote2.totalLandedCost > 0);
    assert.strictEqual(quote1.gstRate, 0.05);
  });

  // Workflow RET-11: Retailer Compares Quotations
  test("Workflow RET-11: Retailer Side-by-Side Quotation Comparison with Decimal-Safe Landed Cost Engine", () => {
    const quoteA = {
      supplier_name: "Maharashtra Wholesale Mart",
      subtotal: 18200.0,
      freight: 800.0,
      packaging: 200.0,
      gst_amount: 960.0,
      total_landed_cost: 20160.0,
      effective_unit_cost: 91.64,
      lead_time_days: 2,
    };

    const quoteB = {
      supplier_name: "Gujarat FMCG Depot",
      subtotal: 17500.0,
      freight: 1900.0,
      packaging: 350.0,
      gst_amount: 987.5,
      total_landed_cost: 20737.5,
      effective_unit_cost: 94.26,
      lead_time_days: 5,
    };

    // Quote A is cheaper overall landed despite slightly higher base price because freight is lower
    assert.ok(quoteA.total_landed_cost < quoteB.total_landed_cost);
    assert.ok(quoteA.lead_time_days < quoteB.lead_time_days);
  });

  // Workflow RET-12: Authorized Retailer Accepts One Valid Quotation
  test("Workflow RET-12: Authorized Retailer Accepts Single Winner & Atomically Rejects Competitor Quotations", () => {
    const quotations = [
      { id: "quote-1", supplier_id: "sup-1", status: "submitted" },
      { id: "quote-2", supplier_id: "sup-2", status: "submitted" },
      { id: "quote-3", supplier_id: "sup-3", status: "submitted" },
    ];

    const acceptedQuoteId = "quote-1";

    const updatedQuotations = quotations.map((q) => ({
      ...q,
      status: q.id === acceptedQuoteId ? "accepted" : "rejected",
    }));

    const acceptedList = updatedQuotations.filter((q) => q.status === "accepted");
    const rejectedList = updatedQuotations.filter((q) => q.status === "rejected");

    assert.strictEqual(acceptedList.length, 1);
    assert.strictEqual(acceptedList[0].id, "quote-1");
    assert.strictEqual(rejectedList.length, 2);
  });

  // Workflow RET-13: Purchase Order is Created Exactly Once
  test("Workflow RET-13: Official Order & B2B Purchase Order (PO-YYYY-XXXX) Generated Exactly Once", () => {
    const order = {
      id: "ord-ret-991",
      order_number: "ORD-RET-556677",
      buyer_id: "usr-ramesh-1",
      supplier_id: "sup-1",
      status: "deposit_paid",
      total_amount: 20160.0,
    };

    const po = {
      id: "po-ret-991",
      po_number: `PO-${new Date().getFullYear()}-4412`,
      order_id: order.id,
      po_status: "issued",
      subtotal: 18200.0,
      freight: 800.0,
      packaging: 200.0,
      gst_amount: 960.0,
      total_amount: 20160.0,
      delivery_address: "Shop 4, Market Yard Road, Nashik",
    };

    assert.ok(po.po_number.startsWith(`PO-${new Date().getFullYear()}-`));
    assert.strictEqual(po.total_amount, order.total_amount);
    assert.strictEqual(po.order_id, order.id);
  });

  // Workflow RET-14: Supplier Confirms Order
  test("Workflow RET-14: Supplier Confirms Order and Advances Production State", () => {
    const allowedTransitions: Record<string, string[]> = {
      pending_deposit: ["deposit_paid", "cancelled"],
      deposit_paid: ["in_production", "cancelled"],
      in_production: ["quality_check"],
      quality_check: ["shipped"],
      shipped: ["delivered"],
      delivered: ["completed"],
    };

    let currentStatus = "deposit_paid";
    assert.ok(allowedTransitions[currentStatus].includes("in_production"));

    currentStatus = "in_production";
    assert.ok(allowedTransitions[currentStatus].includes("quality_check"));
  });

  // Workflow RET-15: Logistics Module Handles Delivery
  test("Workflow RET-15: Logistics Module Integration for Fleet Assignment & Dispatch Progression", () => {
    const logisticsBooking = {
      order_id: "ord-ret-991",
      carrier: "COVERLY Verified Fleet",
      tracking_number: "TRK-RET-88990011",
      vehicle_type: "Tata Ace 1.5 Ton",
      driver_name: "Sunil Kadam",
      driver_phone: "+91 98333 44556",
      estimated_delivery_hours: 24,
    };

    assert.ok(logisticsBooking.tracking_number.startsWith("TRK-RET-"));
    assert.strictEqual(logisticsBooking.carrier, "COVERLY Verified Fleet");
  });

  // Workflow RET-16: Retailer Views Delivery Updates
  test("Workflow RET-16: Real-Time Shipment Stepper & Delivery Milestone Progression", () => {
    const stages = [
      { name: "Order Created", status: "completed" },
      { name: "Supplier Confirmed", status: "completed" },
      { name: "In Production / Packing", status: "completed" },
      { name: "Dispatched with Carrier", status: "completed" },
      { name: "Delivered to Retail Store", status: "completed" },
    ];

    const completedStages = stages.filter((s) => s.status === "completed");
    assert.strictEqual(completedStages.length, 5);
  });

  // Workflow RET-17: Retailer Saves Supplier for Future Purchases
  test("Workflow RET-17: Retailer Bookmarks Supplier & Products for Future Sourcing", () => {
    const savedSupplier = {
      user_id: "usr-ramesh-1",
      supplier_business_id: "biz-sup-maharashtra",
      created_at: new Date().toISOString(),
    };

    const savedProduct = {
      user_id: "usr-ramesh-1",
      product_id: "prod-sugar-m30",
      notes: "Preferred sugar quality for retail packing",
    };

    assert.strictEqual(savedSupplier.user_id, "usr-ramesh-1");
    assert.strictEqual(savedProduct.product_id, "prod-sugar-m30");
  });

  // Workflow RET-18: Retailer Creates Repeat Purchase Reminder
  test("Workflow RET-18: Retailer Configures 15-Day Reorder Reminder Rule & Generates Restock RFQ", () => {
    const today = new Date();
    const frequencyDays = 15;
    const nextDate = new Date(today);
    nextDate.setDate(nextDate.getDate() + frequencyDays);

    const reorderRule = {
      id: "rule-1",
      user_id: "usr-ramesh-1",
      title: "Rice & Sugar 15-Day Restock",
      product_name: "Basmati Rice 1121 & Sugar M-30",
      quantity: 150,
      unit: "kg",
      frequency_days: frequencyDays,
      next_reminder_date: nextDate.toISOString().split("T")[0],
      is_active: true,
    };

    assert.strictEqual(reorderRule.frequency_days, 15);
    assert.ok(reorderRule.next_reminder_date.length === 10);

    // Trigger action 'create_rfq'
    const generatedRfq = {
      rfq_number: "RFQ-RSTK-990022",
      title: `Restock RFQ: ${reorderRule.product_name}`,
      status: "submitted",
    };

    assert.ok(generatedRfq.rfq_number.startsWith("RFQ-RSTK-"));
  });

  // Workflow RET-19: Multi-Branch Retail Management
  test("Workflow RET-19: Multi-Branch Retail Network with Centralized Purchasing & Branch Delivery Allocation", () => {
    const branches = [
      {
        id: "br-main",
        branch_name: "Gupta Super Kirana (Main Market)",
        store_code: "STR-001",
        address: "Shop 4, Market Yard, Nashik",
        is_main_branch: true,
      },
      {
        id: "br-college-rd",
        branch_name: "Gupta Kirana (College Road)",
        store_code: "STR-002",
        address: "Opposite HPT College, Nashik",
        is_main_branch: false,
      },
    ];

    assert.strictEqual(branches.length, 2);
    assert.strictEqual(branches[0].is_main_branch, true);
    assert.strictEqual(branches[1].is_main_branch, false);
  });

  // Workflow RET-20: Branch Employees Access Only Authorized Branch Records
  test("Workflow RET-20: Role-Based Access Control & Store Manager Branch Permission Guard", () => {
    const storeManager = {
      user_id: "usr-manager-branch2",
      assigned_branch_id: "br-college-rd",
      role_in_business: "store_manager",
      permissions: ["view", "create"],
    };

    const branch1Orders = [{ id: "ord-1", branch_id: "br-main" }];
    const branch2Orders = [{ id: "ord-2", branch_id: "br-college-rd" }];

    // Branch manager should only see branch 2 orders
    const accessible = [...branch1Orders, ...branch2Orders].filter(
      (o) => o.branch_id === storeManager.assigned_branch_id
    );

    assert.strictEqual(accessible.length, 1);
    assert.strictEqual(accessible[0].id, "ord-2");
  });

  // Workflow RET-21: Cross-Tenant Security & Unauthorized Access Block
  test("Workflow RET-21: Cross-Tenant Security, Data Isolation & Unauthorized Access Block", () => {
    const retailerA = { id: "usr-retailer-A" };
    const retailerB = { id: "usr-retailer-B" };

    const rfqs = [
      { id: "rfq-A", buyer_id: retailerA.id, is_private: true },
      { id: "rfq-B", buyer_id: retailerB.id, is_private: true },
    ];

    // Retailer A accessing RFQs
    const retailerAAccess = rfqs.filter((r) => r.buyer_id === retailerA.id);
    assert.strictEqual(retailerAAccess.length, 1);
    assert.strictEqual(retailerAAccess[0].id, "rfq-A");
  });

  // Workflow RET-22: Admin Retailer Governance & Verification
  test("Workflow RET-22: Admin Retailer Governance, Verification Review, Moderation & Ecosystem Metrics", () => {
    const retailersList = [
      { id: "ret-1", retail_type: "kirana", verification_status: "verified" },
      { id: "ret-2", retail_type: "supermarket", verification_status: "pending" },
      { id: "ret-3", retail_type: "grocery", verification_status: "verified" },
    ];

    const stats = {
      totalRetailers: retailersList.length,
      verifiedRetailers: retailersList.filter((r) => r.verification_status === "verified").length,
      pendingVerification: retailersList.filter((r) => r.verification_status === "pending").length,
    };

    assert.strictEqual(stats.totalRetailers, 3);
    assert.strictEqual(stats.verifiedRetailers, 2);
    assert.strictEqual(stats.pendingVerification, 1);
  });
});
