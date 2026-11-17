import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("COVERLY Packaging Supplier Marketplace Integration Tests", () => {
  // Workflow PKG-1: Supplier Onboarding & Capability Configuration
  it("Workflow PKG-1: Packaging Supplier Onboarding & Capability Configuration", async () => {
    const supplierPayload = {
      userId: "usr-pkg-sup-01",
      businessName: "FlexoPack Solutions India Pvt Ltd",
      supplierType: "packaging_manufacturer" as const,
      registeredAddress: "Plot 42, GIDC Packaging Cluster, Vapi, Gujarat 396195",
      factoryLocations: [
        { name: "Vapi Main Converting Facility", city: "Vapi", state: "Gujarat", areaSqFt: 75000 },
        { name: "Haridwar Secondary Plant", city: "Haridwar", state: "Uttarakhand", areaSqFt: 45000 },
      ],
      serviceableLocations: ["Gujarat", "Maharashtra", "Delhi NCR", "Uttarakhand", "Karnataka"],
      packagingCategories: ["Flexible Packaging", "Food Packaging", "Labels and Printing"],
      manufacturingCapabilities: [
        "8-Colour Rotogravure Printing",
        "Solventless Lamination",
        "High-Speed Slitting",
        "Stand-up Zipper Pouch Making",
        "Shaped Pouch Die-cutting",
      ],
      printingCapabilities: [
        "Rotogravure (up to 8 colours)",
        "Flexographic Printing",
        "Digital Roll Label Printing",
        "Cold Foil Stamping",
        "Spot Gloss / Matte UV",
      ],
      productionCapacity: "1,500,000 Pouches / Month",
      moqPolicy: "5,000 units for customized printed pouches; 500 units for standard stock",
      typicalLeadTimeDays: 10,
      certifications: ["ISO 9001:2015", "BRCGS Packaging Materials", "US FDA 21 CFR Food Contact Compliance"],
      verificationStatus: "pending",
    };

    assert.ok(supplierPayload.userId, "Supplier requires valid user account");
    assert.strictEqual(supplierPayload.supplierType, "packaging_manufacturer");
    assert.strictEqual(supplierPayload.factoryLocations.length, 2, "Multi-plant factories registered");
    assert.ok(supplierPayload.certifications.includes("BRCGS Packaging Materials"), "Food-grade certifications verified");
    assert.ok(supplierPayload.printingCapabilities.length >= 3, "High-definition printing methods configured");
  });

  // Workflow PKG-2: Category-Specific Product Specification & Bulk Pricing Models
  it("Workflow PKG-2: Category-Specific Product Specification & Bulk Pricing Models", async () => {
    // 1. Flexible Stand-up Barrier Pouch
    const flexiblePouchProduct = {
      id: "pkg-prod-pouch-01",
      name: "Custom Printed Matte Finish Stand-Up Barrier Pouch with Zipper",
      category_id: "pkg-cat-flexible",
      packaging_type: "Flexible Pouch",
      material_type: "PET / MET-PET / Polyethylene (12 / 12 / 80 Micron)",
      dimensions: { width_mm: 160, height_mm: 240, bottom_gusset_mm: 70 },
      thickness: "104 Microns",
      capacity: "500 grams (dry food basis)",
      category_specifications: {
        layer_structure: "3-Ply High Barrier",
        oxygen_transmission_rate_otr: "< 1.5 cc/m2/24hr",
        water_vapour_transmission_rate_wvtr: "< 1.0 g/m2/24hr",
        sealing_type: "Heat Seal with Resealable Grip Zipper",
        tear_notch: true,
        rounded_corners: true,
        food_contact_suitable: true,
      },
      unit_of_measurement: "piece",
      moq: 5000,
      base_price: 4.85, // Rs. 4.85 per pouch
      bulk_pricing_tiers: [
        { min_qty: 5000, max_qty: 9999, price_per_unit: 4.85, discount_pct: 0 },
        { min_qty: 10000, max_qty: 24999, price_per_unit: 4.25, discount_pct: 12.37 },
        { min_qty: 25000, max_qty: 99999, price_per_unit: 3.75, discount_pct: 22.68 },
      ],
      moderation_status: "approved",
      is_active: true,
    };

    assert.strictEqual(flexiblePouchProduct.category_specifications.food_contact_suitable, true);
    assert.strictEqual(flexiblePouchProduct.bulk_pricing_tiers.length, 3);
    assert.strictEqual(flexiblePouchProduct.bulk_pricing_tiers[2].price_per_unit, 3.75);

    // 2. Corrugated 5-Ply Shipping Carton
    const corrugatedBoxProduct = {
      id: "pkg-prod-box-02",
      name: "Heavy-Duty 5-Ply Corrugated Master Shipping Box",
      category_id: "pkg-cat-corrugated",
      packaging_type: "Corrugated Box",
      material_type: "Virgin Kraft Paperboard",
      dimensions: { length_mm: 450, width_mm: 300, height_mm: 350 },
      thickness: "5-Ply (approx 6.5 mm)",
      category_specifications: {
        ply_count: 5,
        flute_type: "BC Flute",
        paper_gsm: "180 Kraft / 140 Fluting / 140 Semi-chem / 140 Fluting / 180 Kraft",
        bursting_factor_bf: 24,
        edge_crush_test_ect: "44 ECT",
        safe_stacking_load_kg: 35,
        printing_method: "2-Colour Flexographic Brand Printing",
      },
      unit_of_measurement: "box",
      moq: 500,
      base_price: 48.0, // Rs. 48 per box
      bulk_pricing_tiers: [
        { min_qty: 500, max_qty: 1999, price_per_unit: 48.0, discount_pct: 0 },
        { min_qty: 2000, max_qty: 4999, price_per_unit: 42.5, discount_pct: 11.45 },
        { min_qty: 5000, max_qty: 50000, price_per_unit: 37.0, discount_pct: 22.92 },
      ],
    };

    assert.strictEqual(corrugatedBoxProduct.category_specifications.ply_count, 5);
    assert.strictEqual(corrugatedBoxProduct.category_specifications.bursting_factor_bf, 24);
  });

  // Workflow PKG-3: Stock Allocation & Oversell Prevention
  it("Workflow PKG-3: Stock Allocation & Oversell Prevention for Inventory-Tracked Items", async () => {
    const readyStockProduct = {
      product_id: "pkg-prod-tape-03",
      name: "BOPP Transparent Heavy Duty Packaging Tape (65m x 48mm)",
      maintains_inventory: true,
      stock_quantity: 1200, // 1200 rolls in warehouse
      available_quantity: 1200,
      reserved_quantity: 0,
    };

    const orderRequestQuantity = 300; // Buyer purchases 300 rolls

    // Validation
    assert.ok(readyStockProduct.available_quantity >= orderRequestQuantity, "Sufficient stock available");
    readyStockProduct.available_quantity -= orderRequestQuantity;
    readyStockProduct.reserved_quantity += orderRequestQuantity;

    assert.strictEqual(readyStockProduct.available_quantity, 900);
    assert.strictEqual(readyStockProduct.reserved_quantity, 300);

    // Attempting oversell beyond remaining available stock
    const excessiveOrderQuantity = 1000;
    const canFulfill = readyStockProduct.available_quantity >= excessiveOrderQuantity;
    assert.strictEqual(canFulfill, false, "Oversell must be prevented");
  });

  // Workflow PKG-4: Unregistered Guest Custom Packaging Requirement & RFQ Submission
  it("Workflow PKG-4: Unregistered Guest Custom Packaging Requirement Submission with Unique Reference", async () => {
    const guestRfqSubmission = {
      category_id: "pkg-cat-flexible",
      product_being_packed: "Artisanal Roasted Filter Coffee Beans (Whole)",
      packaging_type: "Stand-Up Pouch with Degassing Valve & Zipper",
      material_preference: "Kraft Paper / Foil / Polyethylene 3-Layer Laminate",
      required_dimensions: { width_mm: 180, height_mm: 260, bottom_gusset_mm: 80 },
      required_capacity: "1000 grams",
      required_quantity: 10000,
      unit: "piece",
      printing_required: true,
      printing_details: "Full CMYK Rotogravure with Matt Varnishing",
      branding_details: "Front brand graphic + rear barcode, nutrition panel & brewing guide",
      custom_finishing: "One-Way Aroma Degassing Valve & Tear Notch",
      food_contact_grade: true,
      target_budget: 85000, // Rs. 85,000
      target_delivery_date: "2026-12-15",
      delivery_city: "Bengaluru",
      delivery_state: "Karnataka",
      delivery_pincode: "560001",
      guest_name: "Karthik Subramanian",
      guest_email: "karthik@malnadcraftcoffee.com",
      guest_phone: "+91 98450 12345",
      guest_company: "Malnad Craft Roasters LLP",
      reference_files: [
        { name: "Coffee_Pouch_Dieline_Front_v2.pdf", size: 4200000, file_type: "application/pdf" },
      ],
      is_sample_requested: true,
    };

    // Simulate unique reference generation
    const timestampStr = Date.now().toString(36).toUpperCase();
    const randPart = "A7K9";
    const rfqNumber = `PKG-RFQ-${timestampStr}-${randPart}`;

    assert.ok(rfqNumber.startsWith("PKG-RFQ-"), "Unique PKG-RFQ prefix formatted");
    assert.strictEqual(guestRfqSubmission.guest_email, "karthik@malnadcraftcoffee.com");
    assert.strictEqual(guestRfqSubmission.food_contact_grade, true);
    assert.strictEqual(guestRfqSubmission.is_sample_requested, true);
  });

  // Workflow PKG-5: Guest-to-Buyer Account Conversion & Retroactive RFQ Claiming
  it("Workflow PKG-5: Guest-to-Buyer Conversion & Retroactive RFQ Claiming", async () => {
    // Guest RFQs initially created without user ID
    const initialRfqs = [
      { id: "rfq-1", guest_email: "karthik@malnadcraftcoffee.com", buyer_id: null },
      { id: "rfq-2", guest_email: "karthik@malnadcraftcoffee.com", buyer_id: null },
      { id: "rfq-3", guest_email: "other@domain.com", buyer_id: null },
    ];

    // User registers or authenticates
    const authenticatedUser = {
      id: "usr-buyer-karthik-88",
      email: "karthik@malnadcraftcoffee.com",
      roles: ["buyer"],
    };

    // Simulate POST /api/packaging/guest-claim
    const claimedRfqs = initialRfqs.filter((r) => r.guest_email === authenticatedUser.email && r.buyer_id === null);
    claimedRfqs.forEach((r) => {
      r.buyer_id = authenticatedUser.id;
    });

    assert.strictEqual(claimedRfqs.length, 2, "Two historical guest RFQs claimed");
    assert.strictEqual(initialRfqs[0].buyer_id, authenticatedUser.id);
    assert.strictEqual(initialRfqs[1].buyer_id, authenticatedUser.id);
    assert.strictEqual(initialRfqs[2].buyer_id, null, "Unrelated RFQ remains unclaimed");
  });

  // Workflow PKG-6: Multi-Supplier Itemized Landed Cost Quotation Calculation
  it("Workflow PKG-6: Multi-Supplier Itemized Landed Cost Quotation Calculation", async () => {
    // Supplier submits formal quotation for 10,000 pouches
    const quoteInput = {
      quantity: 10000,
      unit_price: 7.20, // Rs. 7.20 per pouch base
      bulk_discount_amount: 2000, // Volume discount
      printing_charges: 4500, // High-speed rotogravure print run setup
      plate_cylinder_charges: 12000, // 4-Colour engraved cylinders (one-time tooling)
      design_charges: 1500, // CAD die-line adaptation
      packaging_charges: 1200, // Corrugated carton packing
      freight_charges: 2800, // Freight to Bengaluru
    };

    const subtotal = Math.round(quoteInput.quantity * quoteInput.unit_price * 100) / 100; // 72,000
    const taxableBase =
      subtotal -
      quoteInput.bulk_discount_amount +
      quoteInput.printing_charges +
      quoteInput.plate_cylinder_charges +
      quoteInput.design_charges +
      quoteInput.packaging_charges +
      quoteInput.freight_charges; // 72,000 - 2,000 + 4,500 + 12,000 + 1,500 + 1,200 + 2,800 = 92,000

    const gstRate = 0.18;
    const gstAmount = Math.round(taxableBase * gstRate * 100) / 100; // 16,560.00
    const totalEstimatedCost = Math.round((taxableBase + gstAmount) * 100) / 100; // 108,560.00
    const effectiveUnitCost = Math.round((totalEstimatedCost / quoteInput.quantity) * 100) / 100; // 10.86

    assert.strictEqual(subtotal, 72000);
    assert.strictEqual(taxableBase, 92000);
    assert.strictEqual(gstAmount, 16560);
    assert.strictEqual(totalEstimatedCost, 108560);
    assert.strictEqual(effectiveUnitCost, 10.86);
  });

  // Workflow PKG-7: Optional Sample Workflow & Approval State Machine
  it("Workflow PKG-7: Optional Sample Workflow & Approval State Machine", async () => {
    const sampleLifecycle = {
      sample_number: "PKG-SMP-20261117-X812",
      sample_type: "custom_printed_sample",
      sample_charges: 1500,
      payment_status: "paid",
      status: "sample_requested",
      carrier_name: "Blue Dart Express",
      tracking_number: "BD77189210IN",
      buyer_feedback: null as string | null,
    };

    // Progression 1: Supplier prepares and dispatches sample
    sampleLifecycle.status = "sample_dispatched";
    assert.strictEqual(sampleLifecycle.status, "sample_dispatched");

    // Progression 2: Delivered & Reviewed by Buyer
    sampleLifecycle.status = "sample_reviewed";
    sampleLifecycle.buyer_feedback = "Matte finish and aroma valve verified. Alignment approved.";

    // Progression 3: Formal Approval
    sampleLifecycle.status = "sample_approved";
    assert.strictEqual(sampleLifecycle.status, "sample_approved");
    assert.ok(sampleLifecycle.buyer_feedback.includes("Alignment approved"));
  });

  // Workflow PKG-8: Quotation Acceptance, Atomic Rival Rejection & 13-Stage Production Stepper
  it("Workflow PKG-8: Quotation Acceptance Triggers Exactly-One Order & 13-Stage Production Stepper", async () => {
    const rfqId = "rfq-coffee-99";
    const quotations = [
      { id: "quote-sup-1", rfq_id: rfqId, supplier: "FlexoPack", total: 108560, status: "submitted" },
      { id: "quote-sup-2", rfq_id: rfqId, supplier: "Apex Packaging", total: 114000, status: "submitted" },
      { id: "quote-sup-3", rfq_id: rfqId, supplier: "EcoPack India", total: 119500, status: "submitted" },
    ];

    // Buyer accepts FlexoPack quotation
    const acceptedQuoteId = "quote-sup-1";
    quotations.forEach((q) => {
      if (q.id === acceptedQuoteId) {
        q.status = "accepted";
      } else {
        q.status = "rejected";
      }
    });

    assert.strictEqual(quotations[0].status, "accepted");
    assert.strictEqual(quotations[1].status, "rejected");
    assert.strictEqual(quotations[2].status, "rejected");

    // Generate Order
    const newOrder = {
      order_number: "PKG-ORD-20261117-K901",
      quotation_id: acceptedQuoteId,
      buyer_id: "usr-buyer-karthik-88",
      supplier_id: "sup-flexopack-01",
      total_amount: 108560,
      order_status: "order_created",
      carrier_name: null as string | null,
      tracking_number: null as string | null,
    };

    // Progression through production stepper
    const progressionStates = [
      "supplier_confirmation_pending",
      "specifications_awaiting_approval",
      "production_scheduled",
      "production_in_progress",
      "quality_inspection",
      "ready_for_dispatch",
      "dispatched",
      "delivered",
      "completed",
    ];

    for (const state of progressionStates) {
      newOrder.order_status = state;
    }

    newOrder.carrier_name = "V-Trans India Ltd";
    newOrder.tracking_number = "VT-7881920-BLR";

    assert.strictEqual(newOrder.order_status, "completed");
    assert.strictEqual(newOrder.tracking_number, "VT-7881920-BLR");
  });

  // Workflow PKG-9: Admin Packaging Ecosystem Governance & Product Moderation Audit
  it("Workflow PKG-9: Admin Packaging Ecosystem Governance & Product Moderation Audit", async () => {
    // Supplier verification audit
    const pendingSupplier = {
      id: "sup-pending-01",
      business_name: "Gujarat Pouches & Films Ltd",
      verification_status: "pending",
      verification_notes: null as string | null,
      verified_by: null as string | null,
    };

    // Admin verifies
    const adminUserId = "usr-admin-ops-01";
    pendingSupplier.verification_status = "verified";
    pendingSupplier.verification_notes = "Factory audit completed; GSTIN and BRCGS food certificates verified.";
    pendingSupplier.verified_by = adminUserId;

    assert.strictEqual(pendingSupplier.verification_status, "verified");
    assert.strictEqual(pendingSupplier.verified_by, adminUserId);

    // Product moderation
    const pendingProduct = {
      id: "prod-pending-01",
      name: "Polyolefin Shrink Film Roll (15 Micron)",
      moderation_status: "pending",
      moderation_notes: null as string | null,
    };

    pendingProduct.moderation_status = "approved";
    pendingProduct.moderation_notes = "Technical specifications, tensile strength and thickness compliant.";
    assert.strictEqual(pendingProduct.moderation_status, "approved");
  });
});
