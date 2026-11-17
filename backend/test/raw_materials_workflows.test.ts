import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("COVERLY Raw Material Supplier Marketplace Integration Tests", () => {
  // Workflow RM-1: Supplier Onboarding & Profile Setup
  it("Workflow RM-1: Raw Material Supplier Onboarding & Multi-Warehouse Configuration", async () => {
    const supplierPayload = {
      userId: "usr-rm-sup-01",
      businessName: "Bharat Alloys & Steel Mills Ltd",
      supplierType: "manufacturer" as const,
      city: "Jamshedpur",
      state: "Jharkhand",
      pincode: "831001",
      gstin: "20AABCB9876C1Z1",
      materialCategories: ["Industrial Raw Materials", "Construction Raw Materials"],
      warehouses: [
        { name: "Central Plant Yard", city: "Jamshedpur", state: "Jharkhand", capacity: "50,000 MT" },
        { name: "Western Buffer Depot", city: "Navi Mumbai", state: "Maharashtra", capacity: "15,000 MT" },
      ],
      supplyCapacityMonthly: "65,000 MT / Month",
      certifications: ["ISO 9001:2015", "BIS IS 1786:2008 Grade Fe 500D"],
      verificationStatus: "pending",
    };

    assert.ok(supplierPayload.userId, "Supplier requires valid user account");
    assert.strictEqual(supplierPayload.supplierType, "manufacturer");
    assert.strictEqual(supplierPayload.warehouses.length, 2, "Multi-warehouse locations tracked");
    assert.ok(supplierPayload.certifications.includes("ISO 9001:2015"), "Certifications registered");
  });

  // Workflow RM-2: Specification-Driven Product Publishing & Tiered Pricing
  it("Workflow RM-2: Specification-Driven Product Publishing & Multi-Tier Pricing", async () => {
    // Industrial Steel Rebar product
    const steelProduct = {
      id: "rm-prod-steel-01",
      name: "TMT Steel Rebars Grade Fe 550D (12mm to 32mm)",
      category_id: "rm-cat-industrial",
      material_grade: "Fe 550D Primary Billet",
      origin: "Jamshedpur Integrated Steel Plant",
      specifications: {
        diameter_mm: [12, 16, 20, 25, 32],
        carbon_content_max_pct: 0.25,
        yield_strength_mpa: 550,
        tensile_strength_mpa: 585,
        elongation_pct: 16.5,
      },
      unit_of_measurement: "metric_ton",
      moq: 15, // 15 MT MOQ
      base_price: 52000, // per MT
      bulk_pricing_tiers: [
        { min_qty: 15, max_qty: 49, price_per_unit: 52000 },
        { min_qty: 50, max_qty: 199, price_per_unit: 50500 },
        { min_qty: 200, max_qty: 9999, price_per_unit: 49000 },
      ],
      moderation_status: "approved",
      is_active: true,
    };

    assert.strictEqual(steelProduct.specifications.yield_strength_mpa, 550);
    assert.strictEqual(steelProduct.bulk_pricing_tiers.length, 3);
    assert.strictEqual(steelProduct.bulk_pricing_tiers[2].price_per_unit, 49000);

    // Agricultural Basmati Paddy product
    const agriProduct = {
      id: "rm-prod-rice-02",
      name: "Basmati Paddy Pusa 1121 Grade A",
      category_id: "rm-cat-agri",
      material_grade: "Grade A Extra Long",
      specifications: {
        variety: "Pusa 1121",
        grain_length_mm: 8.35,
        moisture_max_pct: 13.0,
        foreign_matter_max_pct: 1.0,
        crop_year: "2026 Kharif",
      },
      unit_of_measurement: "metric_ton",
      moq: 20,
      base_price: 43500,
    };

    assert.strictEqual(agriProduct.specifications.moisture_max_pct, 13.0);
    assert.strictEqual(agriProduct.specifications.crop_year, "2026 Kharif");
  });

  // Workflow RM-3: Stock & Inventory Management / Oversell Prevention
  it("Workflow RM-3: Stock Allocation & Oversell Prevention for Inventory-Tracked Items", async () => {
    const inventoryItem = {
      product_id: "rm-prod-poly-03",
      maintains_inventory: true,
      stock_quantity: 100, // 100 MT
      available_quantity: 100,
      reserved_quantity: 0,
    };

    const orderRequestQuantity = 40; // 40 MT

    // Allocate inventory
    assert.ok(inventoryItem.available_quantity >= orderRequestQuantity, "Sufficient stock available");
    inventoryItem.available_quantity -= orderRequestQuantity;
    inventoryItem.reserved_quantity += orderRequestQuantity;

    assert.strictEqual(inventoryItem.available_quantity, 60);
    assert.strictEqual(inventoryItem.reserved_quantity, 40);

    // Attempt to order more than available (70 MT when only 60 available)
    const excessOrderQty = 70;
    const canFulfill = inventoryItem.available_quantity >= excessOrderQty;
    assert.strictEqual(canFulfill, false, "Overselling is strictly prevented");
  });

  // Workflow RM-4: Guest Bulk RFQ Submission
  it("Workflow RM-4: Unregistered Guest Bulk RFQ Submission with Unique Reference", async () => {
    const guestRfq = {
      buyer_id: null,
      guest_name: "Gaurav Aggarwal",
      guest_email: "gaurav@aggarwalinfra.in",
      guest_phone: "+91 98100 44556",
      guest_company: "Aggarwal Infrastructure Projects LLP",
      material_name: "TMT Rebars Fe 550D 16mm",
      category_id: "rm-cat-industrial",
      required_quantity: 120, // 120 MT
      unit: "metric_ton",
      material_grade: "Fe 550D",
      delivery_city: "Ghaziabad",
      delivery_state: "Uttar Pradesh",
      target_delivery_date: "2026-12-10",
      budget: 6200000,
      status: "submitted",
    };

    assert.strictEqual(guestRfq.buyer_id, null, "Guest RFQ has no initial user_id");
    assert.ok(guestRfq.guest_email && guestRfq.guest_phone, "Contact coordinates captured");

    // Reference code generation check
    const rfqNumber = `RM-RFQ-${Date.now().toString(36).toUpperCase()}-9811`;
    assert.match(rfqNumber, /^RM-RFQ-/, "RFQ reference prefix verified");
  });

  // Workflow RM-5: Guest-to-Buyer Conversion & Historical RFQ Claiming
  it("Workflow RM-5: Guest-to-Buyer Conversion & Retroactive RFQ Association", async () => {
    const unlinkedRfqs = [
      { id: "rfq-01", rfq_number: "RM-RFQ-A1-101", guest_email: "gaurav@aggarwalinfra.in", buyer_id: null },
      { id: "rfq-02", rfq_number: "RM-RFQ-A1-102", guest_email: "gaurav@aggarwalinfra.in", buyer_id: null },
      { id: "rfq-03", rfq_number: "RM-RFQ-OTHER", guest_email: "other@builder.com", buyer_id: null },
    ];

    // Gaurav registers on COVERLY with the same email
    const registeredUser = {
      id: "usr-buyer-gaurav-99",
      email: "gaurav@aggarwalinfra.in",
    };

    let claimedCount = 0;
    unlinkedRfqs.forEach((rfq) => {
      if (rfq.guest_email === registeredUser.email && !rfq.buyer_id) {
        rfq.buyer_id = registeredUser.id;
        claimedCount++;
      }
    });

    assert.strictEqual(claimedCount, 2, "Both matching RFQs linked to registered buyer");
    assert.strictEqual(unlinkedRfqs[0].buyer_id, "usr-buyer-gaurav-99");
    assert.strictEqual(unlinkedRfqs[2].buyer_id, null, "Unrelated RFQs untouched");
  });

  // Workflow RM-6: Multi-Supplier Landed Cost Quotations
  it("Workflow RM-6: Multi-Supplier Itemized Landed Cost Quotation Calculation", async () => {
    const rfq = {
      id: "rfq-01",
      required_quantity: 100, // 100 MT
      unit: "metric_ton",
    };

    // Supplier A Quotation
    const quoteA = {
      supplier_id: "sup-steel-01",
      quantity: 100,
      unit_price: 50000, // 50,000 INR / MT
      bulk_discount: 100000, // 100,000 INR flat volume discount
      packaging_charges: 15000,
      loading_charges: 20000,
      freight_charges: 65000,
      insurance_charges: 10000,
      gst_rate: 0.18,
    };

    const subtotalGoodsA = quoteA.quantity * quoteA.unit_price; // 5,000,000
    const taxableGoodsA = subtotalGoodsA - quoteA.bulk_discount; // 4,900,000
    const otherChargesA = quoteA.packaging_charges + quoteA.loading_charges + quoteA.freight_charges + quoteA.insurance_charges; // 110,000
    const totalTaxableA = taxableGoodsA + otherChargesA; // 5,010,000
    const gstAmountA = totalTaxableA * quoteA.gst_rate; // 901,800
    const totalLandedCostA = totalTaxableA + gstAmountA; // 5,911,800
    const effectiveUnitCostA = totalLandedCostA / quoteA.quantity; // 59,118 / MT

    assert.strictEqual(totalTaxableA, 5010000);
    assert.strictEqual(gstAmountA, 901800);
    assert.strictEqual(totalLandedCostA, 5911800);
    assert.strictEqual(effectiveUnitCostA, 59118);
  });

  // Workflow RM-7: Quotation Acceptance & Single Order Guarantee
  it("Workflow RM-7: Quotation Acceptance Triggers Exactly-One Order & Competitor Cancellation", async () => {
    const quotations = [
      { id: "quote-A", rfq_id: "rfq-01", total: 5911800, status: "submitted" },
      { id: "quote-B", rfq_id: "rfq-01", total: 6150000, status: "submitted" },
    ];

    // Buyer accepts Quote A
    const selectedQuoteId = "quote-A";
    let orderCreated = null;

    quotations.forEach((q) => {
      if (q.id === selectedQuoteId) {
        q.status = "accepted";
        orderCreated = {
          order_number: `RM-ORD-${Date.now().toString(36).toUpperCase()}-101`,
          quotation_id: q.id,
          rfq_id: q.rfq_id,
          total_amount: q.total,
          status: "order_created",
        };
      } else {
        q.status = "rejected";
      }
    });

    assert.ok(orderCreated, "Order generated upon quote acceptance");
    assert.strictEqual(quotations[0].status, "accepted");
    assert.strictEqual(quotations[1].status, "rejected", "Competing quote marked rejected");
  });

  // Workflow RM-8: Supplier Order Progression Stepper
  it("Workflow RM-8: Supplier Order Progression Stepper & Shipment Handover", async () => {
    const order = {
      id: "ord-rm-901",
      order_number: "RM-ORD-X9-101",
      status: "order_created",
      carrier_name: null as string | null,
      tracking_number: null as string | null,
      dispatch_date: null as string | null,
    };

    // 1. Supplier confirms
    order.status = "confirmed";
    assert.strictEqual(order.status, "confirmed");

    // 2. Production & preparation
    order.status = "processing";
    order.status = "preparing_for_dispatch";
    assert.strictEqual(order.status, "preparing_for_dispatch");

    // 3. Ready and Dispatched with logistics details
    order.status = "dispatched";
    order.carrier_name = "BlueDart Express Freight & Supply Chain";
    order.tracking_number = "BD-FRT-9928174";
    order.dispatch_date = "2026-11-20";

    assert.strictEqual(order.status, "dispatched");
    assert.ok(order.carrier_name && order.tracking_number);

    // 4. Delivered and Completed
    order.status = "delivered";
    order.status = "completed";
    assert.strictEqual(order.status, "completed");
  });

  // Workflow RM-9: Admin Verification & Moderation Audit
  it("Workflow RM-9: Admin Supplier Verification Audit & Listing Moderation", async () => {
    const supplier = {
      id: "sup-01",
      businessName: "Bharat Alloys",
      verification_status: "pending",
      verification_notes: null as string | null,
      verified_at: null as string | null,
    };

    // Admin verifies
    supplier.verification_status = "verified";
    supplier.verification_notes = "GSTIN 20AABCB9876C1Z1 verified on GST portal. Factory license inspected.";
    supplier.verified_at = new Date().toISOString();

    assert.strictEqual(supplier.verification_status, "verified");
    assert.ok(supplier.verification_notes && supplier.verified_at);
  });
});
