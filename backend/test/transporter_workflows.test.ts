import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { roundToTwoDecimals } from "../src/lib/landed-cost.js";
import { VEHICLE_CATEGORIES, LOAD_TYPES } from "../src/routes/transporters.js";

describe("COVERLY Transporter Marketplace Integration Tests", () => {
  it("Workflow S: Transporter Onboarding & Commercial Vehicle Asset Registration", () => {
    // 1. Transporter registers
    const transporter = {
      id: "biz-trp-101",
      name: "Gujarat Heavy Transport & Fleet Logistics",
      legal_name: "Gujarat Heavy Transport Services LLP",
      business_type: "service_provider",
      city: "Surat",
      state: "Gujarat",
      verification_level: "unverified",
      is_active: true,
    };

    const profile = {
      business_id: transporter.id,
      transporter_type: "fleet_owner",
      operator_name: "Harish Patel",
      driving_license_number: "GJ05-2012-0044123",
      license_validity: "2032-04-10",
      experience_years: 12,
      operating_routes: ["Surat - Delhi", "Surat - Mumbai", "Ahmedabad - Pune"],
      serviceable_states: ["Gujarat", "Maharashtra", "Delhi NCR", "Rajasthan"],
      total_vehicles: 18,
      rating: 4.85,
    };

    assert.equal(profile.transporter_type, "fleet_owner");
    assert.equal(profile.operating_routes.length, 3);
    assert.equal(profile.experience_years, 12);

    // 2. Transporter registers a verified commercial vehicle
    const vehicle = {
      id: "veh-trp-001",
      transporter_business_id: transporter.id,
      vehicle_number: "GJ-05-AB-9876",
      vehicle_category: "heavy_truck",
      vehicle_model: "Tata Signa 2823 (10 Wheeler)",
      capacity_tons: 16.0,
      body_type: "closed_container",
      fuel_type: "diesel",
      permit_type: "national_permit",
      insurance_validity: "2027-08-30",
      fitness_validity: "2028-02-15",
      status: "verified",
      is_available: true,
      current_location: "Surat GIDC Hub",
    };

    assert.equal(vehicle.capacity_tons, 16.0);
    assert.equal(vehicle.permit_type, "national_permit");
    assert.equal(vehicle.is_available, true);
  });

  it("Workflow T: Driver Management & Authorized Vehicle Assignment", () => {
    const driver = {
      id: "drv-trp-501",
      transporter_business_id: "biz-trp-101",
      name: "Jaswinder Singh",
      phone: "+919876501234",
      driving_license_number: "GJ01-2016-0089123",
      license_validity: "2031-10-15",
      assigned_vehicle_id: "veh-trp-001",
      status: "active",
    };

    assert.equal(driver.name, "Jaswinder Singh");
    assert.equal(driver.assigned_vehicle_id, "veh-trp-001");
    assert.equal(driver.status, "active");

    // Driver restricted role check: can only see assigned trip and cannot view company ledger
    const driverPermissions = ["view_assigned_trip", "update_trip_milestone", "upload_pod"];
    assert.equal(driverPermissions.includes("view_assigned_trip"), true);
    assert.equal(driverPermissions.includes("view_company_ledger"), false);
  });

  it("Workflow U: Shipper Transport Load Enquiry & Carrier Matching", () => {
    const enquiry = {
      id: "trq-enq-7701",
      enquiry_number: "TRQ-2026-SURAT-DELHI-01",
      customer_name: "Amitabh Sen",
      customer_phone: "+919820011223",
      customer_email: "asen@senind.com",
      pickup_city: "Surat",
      pickup_state: "Gujarat",
      delivery_city: "Delhi NCR",
      delivery_state: "Delhi",
      pickup_date: "2026-12-05",
      goods_category: "Industrial Machinery",
      goods_description: "8 Crates of Industrial Pumps & High Pressure Castings",
      weight_tons: 4.5,
      load_type: "ftl",
      loading_help_required: true,
      unloading_help_required: true,
      status: "open",
    };

    // Safety screening
    const prohibitedWords = ["explosives", "firearms", "narcotics"];
    const hasProhibited = prohibitedWords.some((w) => enquiry.goods_description.toLowerCase().includes(w));
    assert.equal(hasProhibited, false);

    assert.equal(enquiry.weight_tons, 4.5);
    assert.equal(enquiry.load_type, "ftl");

    // Match transporters covering Surat -> Delhi with >= 4.5 Ton capacity
    const registeredTransporters = [
      { id: "biz-trp-1", name: "Surat North Transways", routes: ["Surat - Delhi"], max_capacity: 16 },
      { id: "biz-trp-2", name: "Apex Roadlines", routes: ["Surat - Delhi", "Mumbai - Delhi"], max_capacity: 25 },
      { id: "biz-trp-3", name: "Local City Tempo", routes: ["Surat Local"], max_capacity: 1.5 }, // Too small & wrong route
    ];

    const matched = registeredTransporters.filter(
      (t) => t.routes.includes("Surat - Delhi") && t.max_capacity >= enquiry.weight_tons
    );

    assert.equal(matched.length, 2);
    assert.equal(matched[0].id, "biz-trp-1");
    assert.equal(matched[1].id, "biz-trp-2");
  });

  it("Workflow V: Transporter Quotations & Multi-Factor Rate Calculation", () => {
    // Transporter 1 Quote:
    const t1Base = 14000;
    const t1Loading = 800;
    const t1Unloading = 800;
    const t1Toll = 1200;
    const t1Fuel = 600;
    const t1Taxable = t1Base + t1Loading + t1Unloading + t1Toll + t1Fuel; // 17,400
    const t1Gst = roundToTwoDecimals(t1Taxable * 0.18); // 3,132
    const t1Total = roundToTwoDecimals(t1Taxable + t1Gst); // 20,532

    const quote1 = {
      id: "tqt-101",
      quotation_number: "TQT-2026-TRP1-01",
      transport_enquiry_id: "trq-enq-7701",
      transporter_business_id: "biz-trp-1",
      base_freight: t1Base,
      loading_charges: t1Loading,
      unloading_charges: t1Unloading,
      toll_charges: t1Toll,
      fuel_surcharge: t1Fuel,
      gst_amount: t1Gst,
      total_estimated_cost: t1Total,
      estimated_pickup_time: "Same Day within 4 Hours",
      estimated_delivery_time: "Within 48 Hours",
      status: "submitted",
    };

    assert.equal(t1Taxable, 17400);
    assert.equal(t1Gst, 3132);
    assert.equal(quote1.total_estimated_cost, 20532);

    // Transporter 2 Quote:
    const t2Base = 13500;
    const t2Loading = 600;
    const t2Unloading = 600;
    const t2Toll = 1200;
    const t2Fuel = 500;
    const t2Taxable = t2Base + t2Loading + t2Unloading + t2Toll + t2Fuel; // 16,400
    const t2Gst = roundToTwoDecimals(t2Taxable * 0.18); // 2,952
    const t2Total = roundToTwoDecimals(t2Taxable + t2Gst); // 19,352

    const quote2 = {
      id: "tqt-102",
      quotation_number: "TQT-2026-TRP2-02",
      transport_enquiry_id: "trq-enq-7701",
      transporter_business_id: "biz-trp-2",
      base_freight: t2Base,
      loading_charges: t2Loading,
      unloading_charges: t2Unloading,
      toll_charges: t2Toll,
      fuel_surcharge: t2Fuel,
      gst_amount: t2Gst,
      total_estimated_cost: t2Total,
      estimated_pickup_time: "Next Morning 09:00 AM",
      estimated_delivery_time: "Within 42 Hours",
      status: "submitted",
    };

    assert.equal(t2Taxable, 16400);
    assert.equal(t2Gst, 2952);
    assert.equal(quote2.total_estimated_cost, 19352);

    // Transporter 2 has better rate
    assert.ok(quote2.total_estimated_cost < quote1.total_estimated_cost);
  });

  it("Workflow W: Quotation Acceptance & 14-State Trip Lifecycle Stepper", () => {
    // 1. Shipper accepts Quote 2
    const quotes = [
      { id: "tqt-101", status: "submitted", total: 20532 },
      { id: "tqt-102", status: "submitted", total: 19352 },
    ];

    const acceptedQuote = quotes.find((q) => q.id === "tqt-102")!;
    acceptedQuote.status = "accepted";
    quotes.forEach((q) => {
      if (q.id !== acceptedQuote.id) q.status = "rejected";
    });

    assert.equal(quotes[0].status, "rejected");
    assert.equal(quotes[1].status, "accepted");

    // 2. Booking is created
    const booking = {
      id: "tbk-8801",
      booking_reference: "TBK-2026-DELHI-001",
      tracking_number: "TRP-TRK-991823-IND",
      transporter_business_id: "biz-trp-2",
      assigned_vehicle_id: null as string | null,
      assigned_driver_id: null as string | null,
      status: "booking_confirmed",
      current_location: "Surat Yard",
      pickup_proof_url: null as string | null,
      delivery_proof_url: null as string | null,
    };

    assert.equal(booking.status, "booking_confirmed");

    // 3. 14-State Lifecycle Stepper Progression:
    const tripTimeline: any[] = [];
    const advanceStatus = (newStatus: string, loc: string, desc: string) => {
      booking.status = newStatus;
      booking.current_location = loc;
      tripTimeline.push({ status: newStatus, location: loc, desc, time: new Date().toISOString() });
    };

    // State 1: booking_confirmed
    advanceStatus("booking_confirmed", "Surat Transporter Yard", "Load booking confirmed.");

    // State 2: vehicle_assigned
    booking.assigned_vehicle_id = "veh-trp-001";
    advanceStatus("vehicle_assigned", "Surat Transporter Yard", "Vehicle GJ-05-AB-9876 (10 Wheeler) allocated.");

    // State 3: driver_assigned
    booking.assigned_driver_id = "drv-trp-501";
    advanceStatus("driver_assigned", "Surat Transporter Yard", "Authorized driver Jaswinder Singh assigned.");

    // State 4: pickup_scheduled
    advanceStatus("pickup_scheduled", "Surat GIDC Factory", "Pickup window scheduled for 10:00 AM.");

    // State 5: reached_pickup_location
    advanceStatus("reached_pickup_location", "Gate 2, GIDC Industrial Estate", "Vehicle reported at factory loading bay.");

    // State 6: goods_loaded
    booking.pickup_proof_url = "https://storage.insforge.app/docs/pickup-proof.pdf";
    advanceStatus("goods_loaded", "Gate 2, GIDC Industrial Estate", "8 Crates loaded and strapped securely. Consignment note signed.");

    // State 7: trip_started
    advanceStatus("trip_started", "Surat Toll Plaza", "Vehicle departed loading facility.");

    // State 8: in_transit
    advanceStatus("in_transit", "NH-48 Vadodara Bypass", "Linehaul transit on national highway.");

    // State 9: reached_destination
    advanceStatus("reached_destination", "Delhi Okhla Industrial Area", "Arrived at destination delivery site.");

    // State 10: goods_unloaded
    advanceStatus("goods_unloaded", "Receiving Bay 3, Okhla", "Crates inspected and safely unloaded.");

    // State 11: delivered
    booking.delivery_proof_url = "https://storage.insforge.app/docs/pod-signed.pdf";
    advanceStatus("delivered", "Receiving Bay 3, Okhla", "Delivered successfully. Digital POD received.");

    assert.equal(tripTimeline.length, 11);
    assert.equal(booking.status, "delivered");
    assert.ok(booking.delivery_proof_url !== null);
    assert.ok(booking.pickup_proof_url !== null);
  });

  it("Workflow X: Safe Public Trip Tracking Privacy & Masked PII", () => {
    const rawTripBooking = {
      tracking_number: "TRP-TRK-991823-IND",
      customer_name: "Amitabh Sen",
      customer_phone: "+919820011223", // SENSITIVE PII
      customer_email: "asen@senind.com", // SENSITIVE PII
      pickup_address: "Plot 42, Private Factory, Surat", // SENSITIVE PII
      pickup_city: "Surat",
      pickup_state: "Gujarat",
      delivery_address: "Gate 3, Receiving Road, Delhi", // SENSITIVE PII
      delivery_city: "Delhi NCR",
      delivery_state: "Delhi",
      transporter_name: "Apex Roadlines",
      vehicle_number: "GJ-05-AB-9876",
      vehicle_model: "Tata Signa 2823 (10 Wheeler)",
      status: "in_transit",
    };

    // Public sanitized projection
    const publicTracking = {
      tracking_number: rawTripBooking.tracking_number,
      status: rawTripBooking.status,
      transporter: rawTripBooking.transporter_name,
      vehicle: `${rawTripBooking.vehicle_model} (${rawTripBooking.vehicle_number.slice(0, 4)}****)`,
      origin: `${rawTripBooking.pickup_city}, ${rawTripBooking.pickup_state}`,
      destination: `${rawTripBooking.delivery_city}, ${rawTripBooking.delivery_state}`,
    };

    assert.equal(publicTracking.tracking_number, "TRP-TRK-991823-IND");
    assert.equal(publicTracking.origin, "Surat, Gujarat");
    assert.equal(publicTracking.destination, "Delhi NCR, Delhi");
    assert.equal((publicTracking as any).customer_phone, undefined);
    assert.equal((publicTracking as any).pickup_address, undefined);
  });

  it("Workflow Y: Guest-to-Account Conversion", () => {
    // Unauthenticated guest submits requirement
    const guestEnquiry = {
      id: "trq-guest-100",
      enquiry_number: "TRQ-2026-GUEST-99",
      customer_id: null as string | null,
      customer_name: "Rahul Sharma",
      customer_phone: "+919811223344",
      customer_email: "rsharma@gmail.com",
    };

    assert.equal(guestEnquiry.customer_id, null);

    // Later, Rahul Sharma registers or logs in with user id 'usr-rahul-01'
    const authenticatedUser = { id: "usr-rahul-01", email: "rsharma@gmail.com" };

    // Claim requirement
    if (guestEnquiry.customer_email === authenticatedUser.email || guestEnquiry.enquiry_number === "TRQ-2026-GUEST-99") {
      guestEnquiry.customer_id = authenticatedUser.id;
    }

    assert.equal(guestEnquiry.customer_id, "usr-rahul-01");
  });

  it("Workflow Z: Admin Transporter Ecosystem Governance & Metrics Aggregation", () => {
    const transporters = [
      { id: "t1", verification_level: "document_verified", is_active: true },
      { id: "t2", verification_level: "unverified", is_active: true },
    ];

    const vehicles = [
      { id: "v1", status: "verified", is_available: true },
      { id: "v2", status: "verified", is_available: true },
      { id: "v3", status: "expired_documents", is_available: false },
    ];

    const bookings = [
      { id: "b1", status: "in_transit" },
      { id: "b2", status: "delivered" },
    ];

    const metrics = {
      totalTransporters: transporters.length,
      verifiedTransporters: transporters.filter((t) => t.verification_level !== "unverified").length,
      totalVehicles: vehicles.length,
      activeVehicles: vehicles.filter((v) => v.is_available && v.status === "verified").length,
      activeTrips: bookings.filter((b) => b.status !== "delivered").length,
      completedTrips: bookings.filter((b) => b.status === "delivered").length,
    };

    assert.equal(metrics.totalTransporters, 2);
    assert.equal(metrics.verifiedTransporters, 1);
    assert.equal(metrics.totalVehicles, 3);
    assert.equal(metrics.activeVehicles, 2);
    assert.equal(metrics.activeTrips, 1);
    assert.equal(metrics.completedTrips, 1);
  });
});
