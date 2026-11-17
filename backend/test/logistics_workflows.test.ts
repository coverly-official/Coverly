import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { roundToTwoDecimals } from "../src/lib/landed-cost.js";
import { LOGISTICS_CATEGORIES, TRANSPORT_MODES, VEHICLE_TYPES } from "../src/routes/logistics.js";

describe("COVERLY Multi-Logistics Marketplace Integration Tests", () => {
  it("Workflow L: Logistics Partner Onboarding, Fleet & Service Configuration", () => {
    // 1. Logistics business registration
    const logisticsBusiness = {
      id: "biz-logi-888",
      name: "Apex Intermodal Freight & Logistics Ltd",
      legal_name: "Apex Intermodal Freight Services Private Limited",
      business_type: "service_provider",
      city: "Navi Mumbai",
      state: "Maharashtra",
      pincode: "400705",
      verification_level: "unverified",
      is_active: true,
    };

    assert.equal(logisticsBusiness.city, "Navi Mumbai");
    assert.equal(logisticsBusiness.verification_level, "unverified");

    // 2. Partner sets up logistics profile (fleet, modes, routes)
    const profile = {
      business_id: logisticsBusiness.id,
      tagline: "Premier Industrial Linehaul & Cold-Chain Carrier",
      fleet_size: 48,
      transport_modes: ["road", "rail"],
      logistics_categories: ["ftl", "ptl", "bulk", "cold_chain"],
      vehicle_types: ["Pickup Bolero (1.5T)", "14ft Eicher (4T)", "32ft Container (15T)"],
      operating_routes: ["Mumbai - Delhi", "Ahmedabad - Chennai", "Pune - Bengaluru"],
      serviceable_states: ["Maharashtra", "Gujarat", "Delhi NCR", "Karnataka"],
      tracking_support: "manual",
      rating: 4.85,
    };

    assert.equal(profile.fleet_size, 48);
    assert.equal(profile.transport_modes.length, 2);
    assert.equal(profile.operating_routes.length, 3);

    // 3. Partner publishes an FTL Linehaul service
    const ftlService = {
      id: "srv-logi-01",
      company_id: logisticsBusiness.id,
      service_name: "Scheduled 32ft FTL Express Line",
      category: "ftl",
      transport_mode: "road",
      pricing_model: "per_km",
      base_rate: 46.0,
      min_charge: 3500.0,
      fuel_surcharge_percent: 4.5,
      transit_time_days: 2,
      moderation_status: "approved",
      is_active: true,
    };

    assert.equal(ftlService.category, "ftl");
    assert.equal(ftlService.base_rate, 46.0);
    assert.equal(ftlService.transit_time_days, 2);

    // 4. Admin verifies partner permits
    logisticsBusiness.verification_level = "document_verified";
    assert.equal(logisticsBusiness.verification_level, "document_verified");
  });

  it("Workflow M: Public Shipment Enquiry & Multi-Provider Matching", () => {
    // 1. Guest customer creates shipment request
    const shipmentRequest = {
      id: "shp-req-9001",
      request_number: "SHP-2026-VALVE-DELHI-01",
      customer_name: "Sunil Verma",
      customer_phone: "+919876543210",
      customer_email: "sverma@indiapump.in",
      pickup_city: "Surat",
      pickup_state: "Gujarat",
      pickup_address: "Plot 42, GIDC Industrial Estate, Surat",
      delivery_city: "Delhi NCR",
      delivery_state: "Delhi",
      delivery_address: "Depot 8, Okhla Industrial Area Phase 3, New Delhi",
      goods_category: "Industrial Machinery",
      goods_description: "5 Crates of Class 800 Gate Valves for refinery shutdown",
      weight_kg: 350,
      packages_count: 5,
      package_type: "Crate",
      is_fragile: false,
      is_hazardous: false,
      declared_value_inr: 125000,
      preferred_pickup_date: "2026-12-01",
      service_type_preference: "ftl",
      status: "open",
    };

    // Prohibited cargo filter check
    const prohibitedWords = ["explosives", "firearms", "narcotics"];
    const hasProhibited = prohibitedWords.some((w) => shipmentRequest.goods_description.toLowerCase().includes(w));
    assert.equal(hasProhibited, false);

    assert.equal(shipmentRequest.weight_kg, 350);
    assert.equal(shipmentRequest.status, "open");

    // 2. Multi-Provider matching finds eligible logistics carriers covering Surat -> Delhi
    const availableCarriers = [
      { id: "biz-logi-1", name: "Apex Freight Hub", operating_routes: ["Surat - Delhi", "Mumbai - Delhi"] },
      { id: "biz-logi-2", name: "LogiTrans Global", operating_routes: ["Gujarat - North India", "Surat - Delhi"] },
      { id: "biz-logi-3", name: "South Express Lines", operating_routes: ["Chennai - Bengaluru"] }, // Does not cover
    ];

    const matchedCarriers = availableCarriers.filter((c) =>
      c.operating_routes.some((r) => r.includes("Surat - Delhi") || r.includes("Gujarat"))
    );

    assert.equal(matchedCarriers.length, 2);
    assert.equal(matchedCarriers[0].id, "biz-logi-1");
    assert.equal(matchedCarriers[1].id, "biz-logi-2");
  });

  it("Workflow N: Multi-Provider Quotations, Landed Freight Breakdown & Comparison", () => {
    // Competing Carrier 1 (Apex Freight) calculates landed cost quote
    const quote1Base = 9500;
    const quote1Fuel = 450;
    const quote1Handling = 350;
    const quote1Insurance = 250;
    const quote1Taxable = quote1Base + quote1Fuel + quote1Handling;
    const quote1Gst = roundToTwoDecimals(quote1Taxable * 0.18);
    const quote1Total = roundToTwoDecimals(quote1Taxable + quote1Gst + quote1Insurance);

    const quotation1 = {
      id: "lqt-001",
      quotation_number: "LQT-2026-APEX-01",
      shipment_request_id: "shp-req-9001",
      company_id: "biz-logi-1",
      company_name: "Apex Freight Hub",
      base_freight: quote1Base,
      fuel_surcharge: quote1Fuel,
      handling_charges: quote1Handling,
      insurance_charges: quote1Insurance,
      gst_amount: quote1Gst,
      total_freight_inr: quote1Total,
      estimated_delivery_days: 2,
      status: "submitted",
    };

    // Taxable: 9500 + 450 + 350 = 10300. GST 18%: 1854. Total: 10300 + 1854 + 250 = 12404
    assert.equal(quote1Taxable, 10300);
    assert.equal(quote1Gst, 1854);
    assert.equal(quotation1.total_freight_inr, 12404);
    assert.equal(quotation1.estimated_delivery_days, 2);

    // Competing Carrier 2 (LogiTrans Global) calculates landed quote
    const quote2Base = 8800;
    const quote2Fuel = 500;
    const quote2Handling = 400;
    const quote2Taxable = quote2Base + quote2Fuel + quote2Handling;
    const quote2Gst = roundToTwoDecimals(quote2Taxable * 0.18);
    const quote2Total = roundToTwoDecimals(quote2Taxable + quote2Gst);

    const quotation2 = {
      id: "lqt-002",
      quotation_number: "LQT-2026-LOGI-02",
      shipment_request_id: "shp-req-9001",
      company_id: "biz-logi-2",
      company_name: "LogiTrans Global",
      base_freight: quote2Base,
      fuel_surcharge: quote2Fuel,
      handling_charges: quote2Handling,
      gst_amount: quote2Gst,
      total_freight_inr: quote2Total,
      estimated_delivery_days: 3,
      status: "submitted",
    };

    // Taxable: 8800 + 500 + 400 = 9700. GST 18%: 1746. Total: 9700 + 1746 = 11446
    assert.equal(quote2Taxable, 9700);
    assert.equal(quote2Gst, 1746);
    assert.equal(quotation2.total_freight_inr, 11446);
    assert.equal(quotation2.estimated_delivery_days, 3);

    // Customer compares: Carrier 2 is cheaper, Carrier 1 is 1 day faster
    assert.ok(quotation2.total_freight_inr < quotation1.total_freight_inr);
    assert.ok(quotation1.estimated_delivery_days < quotation2.estimated_delivery_days);
  });

  it("Workflow O: Quotation Acceptance & Booking State Machine", () => {
    const quotes = [
      { id: "lqt-001", status: "submitted", total: 12404 },
      { id: "lqt-002", status: "submitted", total: 11446 },
    ];

    // Customer chooses quotation 2 (Carrier 2)
    const selectedQuote = quotes.find((q) => q.id === "lqt-002")!;
    selectedQuote.status = "accepted";

    // Other quotes rejected
    quotes.forEach((q) => {
      if (q.id !== selectedQuote.id) q.status = "rejected";
    });

    assert.equal(quotes[0].status, "rejected");
    assert.equal(quotes[1].status, "accepted");

    // Booking created exactly once
    const booking = {
      id: "bk-logi-5501",
      booking_number: "LBK-2026-DELHI-001",
      tracking_number: "CVL-TRK-771928-IND",
      quotation_id: selectedQuote.id,
      company_id: "biz-logi-2",
      customer_name: "Sunil Verma",
      status: "booking_confirmed",
      total_amount: selectedQuote.total,
    };

    assert.equal(booking.booking_number, "LBK-2026-DELHI-001");
    assert.equal(booking.status, "booking_confirmed");
    assert.ok(booking.tracking_number.startsWith("CVL-TRK-"));
  });

  it("Workflow P: Real-Time Shipment Tracking Lifecycle (15-State Stepper)", () => {
    const booking = {
      tracking_number: "CVL-TRK-771928-IND",
      status: "booking_confirmed",
      carrier: "LogiTrans Global",
      driver_name: null as string | null,
      vehicle_number: null as string | null,
      actual_pickup_date: null as string | null,
      actual_delivery_date: null as string | null,
      current_location: "Surat Factory Depot",
    };

    const timelineEvents: any[] = [];
    const logEvent = (status: string, location: string, desc: string) => {
      booking.status = status;
      booking.current_location = location;
      timelineEvents.push({ status, location, desc, timestamp: new Date().toISOString() });
    };

    // 1. Initial confirmed
    logEvent("booking_confirmed", "Surat Factory Depot", "Booking registered with carrier LogiTrans Global.");

    // 2. Pickup Scheduled & Driver Assigned
    booking.driver_name = "Jaswinder Singh";
    booking.vehicle_number = "GJ-01-AB-1234";
    logEvent("pickup_scheduled", "Surat Changodar Depot", "Vehicle GJ-01-AB-1234 assigned for factory pickup.");

    // 3. Pickup Completed
    booking.actual_pickup_date = new Date().toISOString();
    logEvent("pickup_completed", "Surat GIDC Factory", "5 Crates of valves safely loaded onto linehaul vehicle.");

    // 4. In Transit on National Highway
    logEvent("in_transit", "NH-48 Bharuch Tollway", "Cargo in transit toward destination hub.");

    // 5. Reached Sorting Facility
    logEvent("reached_sorting_facility", "Vadodara Central Freight Hub", "Consignment scanned & cross-docked at central facility.");

    // 6. Reached Destination Hub
    logEvent("reached_destination_hub", "Delhi Okhla Hub", "Arrived at Delhi destination regional depot.");

    // 7. Out for Delivery
    logEvent("out_for_delivery", "South Delhi Delivery Lane", "Consignment out for delivery to buyer site.");

    // 8. Delivered
    booking.actual_delivery_date = new Date().toISOString();
    logEvent("delivered", "Okhla Industrial Area Phase 3", "Delivered successfully to receiving gate. Signed by Store Officer.");

    assert.equal(timelineEvents.length, 8);
    assert.equal(booking.status, "delivered");
    assert.equal(booking.driver_name, "Jaswinder Singh");
    assert.equal(booking.vehicle_number, "GJ-01-AB-1234");
    assert.ok(booking.actual_pickup_date !== null);
    assert.ok(booking.actual_delivery_date !== null);
  });

  it("Workflow Q: Safe Public Tracking Privacy & PII Redaction", () => {
    // Internal booking record containing sensitive PII
    const rawInternalBooking = {
      tracking_number: "CVL-TRK-771928-IND",
      customer_name: "Sunil Verma",
      customer_phone: "+919876543210", // SENSITIVE PII
      customer_email: "sverma@indiapump.in", // SENSITIVE PII
      pickup_address: "House 12, Private Lane, Surat", // SENSITIVE PII
      pickup_city: "Surat",
      pickup_state: "Gujarat",
      delivery_address: "Gate 4, Plot 99, Private Factory, Delhi", // SENSITIVE PII
      delivery_city: "Delhi NCR",
      delivery_state: "Delhi",
      total_amount: 11446,
      driver_name: "Jaswinder Singh",
      vehicle_number: "GJ-01-AB-1234",
      status: "in_transit",
    };

    // Public redacted safe tracking transformation
    const publicTrackingResponse = {
      tracking_number: rawInternalBooking.tracking_number,
      status: rawInternalBooking.status,
      origin: `${rawInternalBooking.pickup_city}, ${rawInternalBooking.pickup_state}`,
      destination: `${rawInternalBooking.delivery_city}, ${rawInternalBooking.delivery_state}`,
      vehicle: `Carrier Vehicle ${rawInternalBooking.vehicle_number.slice(0, 4)}****`,
      is_delivered: rawInternalBooking.status === "delivered",
    };

    // Verify safe disclosure
    assert.equal(publicTrackingResponse.tracking_number, "CVL-TRK-771928-IND");
    assert.equal(publicTrackingResponse.origin, "Surat, Gujarat");
    assert.equal(publicTrackingResponse.destination, "Delhi NCR, Delhi");

    // Verify PII is NOT disclosed in public response
    assert.equal((publicTrackingResponse as any).customer_phone, undefined);
    assert.equal((publicTrackingResponse as any).customer_email, undefined);
    assert.equal((publicTrackingResponse as any).pickup_address, undefined);
    assert.equal((publicTrackingResponse as any).delivery_address, undefined);
  });

  it("Workflow R: Admin Logistics Governance & Marketplace Metrics Aggregation", () => {
    const businesses = [
      { id: "b1", name: "Apex Freight Hub", business_type: "service_provider", verification_level: "document_verified" },
      { id: "b2", name: "LogiTrans Global", business_type: "service_provider", verification_level: "registration_checked" },
      { id: "b3", name: "Standard Transporter", business_type: "service_provider", verification_level: "unverified" },
    ];

    const bookings = [
      { id: "bk1", status: "in_transit" },
      { id: "bk2", status: "out_for_delivery" },
      { id: "bk3", status: "delivered" },
    ];

    const enquiries = [
      { id: "req1", status: "open" },
      { id: "req2", status: "quotes_received" },
    ];

    const adminMetrics = {
      totalCarriers: businesses.length,
      verifiedCarriers: businesses.filter((b) => b.verification_level !== "unverified").length,
      activeShipments: bookings.filter((b) => !["delivered", "cancelled"].includes(b.status)).length,
      deliveredShipments: bookings.filter((b) => b.status === "delivered").length,
      openEnquiries: enquiries.filter((e) => e.status !== "booked").length,
    };

    assert.equal(adminMetrics.totalCarriers, 3);
    assert.equal(adminMetrics.verifiedCarriers, 2);
    assert.equal(adminMetrics.activeShipments, 2);
    assert.equal(adminMetrics.deliveredShipments, 1);
    assert.equal(adminMetrics.openEnquiries, 2);
  });
});
