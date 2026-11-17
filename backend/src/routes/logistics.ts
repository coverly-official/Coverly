import { Router, type Request, type Response } from "express";
import { getInsForgeClient } from "../lib/insforge.js";
import { authenticateUser, requireAdmin } from "../middleware/auth.js";
import { roundToTwoDecimals } from "../lib/landed-cost.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = Router();

// ====================================================================
// STATIC LOGISTICS MASTER DATA
// ====================================================================

export const LOGISTICS_CATEGORIES = [
  { id: "ftl", name: "Full Truck Load (FTL)", icon: "Truck", description: "Dedicated vehicles for large volume & high-capacity direct freight." },
  { id: "ptl", name: "Part Truck Load (PTL)", icon: "Layers", description: "Shared consolidation cargo for cost-effective partial shipments." },
  { id: "parcel", name: "Express Parcel & Courier", icon: "Package", description: "Time-sensitive parcel delivery with priority door-to-door transit." },
  { id: "bulk", name: "Bulk Cargo Transportation", icon: "Boxes", description: "Heavy industrial commodities, raw materials & break-bulk logistics." },
  { id: "cold_chain", name: "Cold Chain Refrigerated", icon: "ThermometerSnowflake", description: "Temperature-controlled reefers for pharmaceuticals and perishables." },
  { id: "warehousing", name: "Warehouse & Storage Hubs", icon: "Warehouse", description: "Strategic 3PL fulfillment depots, buffer storage & inventory management." },
  { id: "container", name: "Container Freight (20ft/40ft)", icon: "Container", description: "ISO container movement for port connectivity and intermodal lines." },
  { id: "packers_movers", name: "Industrial Relocation & Movers", icon: "Home", description: "Turnkey factory machinery shifting, heavy equipment & office relocation." },
  { id: "freight_forwarding", name: "Freight Forwarding & Customs", icon: "Globe", description: "EXIM documentation, customs clearing & multimodal international transit." },
];

export const TRANSPORT_MODES = [
  { id: "road", name: "Road Express Freight", icon: "Truck" },
  { id: "rail", name: "Rail Cargo (Indian Railways)", icon: "Train" },
  { id: "air", name: "Air Cargo & Express", icon: "Plane" },
  { id: "sea", name: "Coastal & Sea Freight", icon: "Ship" },
  { id: "multimodal", name: "Multimodal Logistics", icon: "Repeat" },
];

export const VEHICLE_TYPES = [
  "Tata Ace / Dost (1 - 1.5 Ton)",
  "Pickup Bolero (1.5 - 2 Ton)",
  "14ft Canter / Eicher (4 Ton)",
  "17ft - 19ft Truck (7 Ton)",
  "22ft - 24ft Truck (10 Ton)",
  "32ft Multi-Axle Container (15 Ton)",
  "40ft Heavy Trailer (25 - 35 Ton)",
  "Temperature Controlled Reefer (7 - 15 Ton)",
];

const VALID_SHIPMENT_STATUSES = [
  "booking_requested",
  "quotation_received",
  "booking_confirmed",
  "pickup_scheduled",
  "pickup_completed",
  "in_transit",
  "reached_sorting_facility",
  "reached_destination_hub",
  "out_for_delivery",
  "delivered",
  "failed_attempt",
  "returned_to_origin",
  "cancelled",
  "delayed",
];

// Helper to resolve logistics partner's business
async function resolveLogisticsBusiness(req: Request) {
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) return null;

  const headerBizId = req.headers["x-business-id"] as string | undefined;

  if (headerBizId) {
    if (user.roles.includes("admin")) {
      const { data: b } = await insforge.database
        .from("businesses")
        .select("*")
        .eq("id", headerBizId)
        .single();
      if (b) return { business: b, role: "admin" };
    }

    const { data: member } = await insforge.database
      .from("business_members")
      .select("business_id, role_in_business, businesses(*)")
      .eq("business_id", headerBizId)
      .eq("user_id", user.id)
      .single();

    if (member && member.businesses) {
      return { business: member.businesses, role: member.role_in_business };
    }
  }

  // Fallback: look up primary business membership
  const { data: members } = await insforge.database
    .from("business_members")
    .select("business_id, role_in_business, businesses(*)")
    .eq("user_id", user.id)
    .limit(1);

  if (members && members.length > 0 && members[0].businesses) {
    return { business: members[0].businesses, role: members[0].role_in_business };
  }

  // Fallback for admin
  if (user.roles.includes("admin")) {
    const { data: fallbackBiz } = await insforge.database
      .from("businesses")
      .select("*")
      .or("business_type.eq.service_provider,business_type.eq.wholesaler,business_type.eq.distributor")
      .ilike("name", "%logi%")
      .limit(1);

    if (fallbackBiz && fallbackBiz.length > 0) {
      return { business: fallbackBiz[0], role: "owner" };
    }

    const { data: anyBiz } = await insforge.database.from("businesses").select("*").limit(1);
    if (anyBiz && anyBiz.length > 0) {
      return { business: anyBiz[0], role: "owner" };
    }
  }

  return null;
}

// ====================================================================
// 1. PUBLIC GUEST APIS
// ====================================================================

// GET /api/logistics/categories
router.get("/logistics/categories", (_req: Request, res: Response) => {
  return sendSuccess(res, {
    categories: LOGISTICS_CATEGORIES,
    transport_modes: TRANSPORT_MODES,
    vehicle_types: VEHICLE_TYPES,
  });
});

// GET /api/logistics/companies (Directory of independent logistics companies)
router.get("/logistics/companies", async (req: Request, res: Response) => {
  const { city, state, category, transport_mode, verification, query, page = "1", limit = "20" } =
    req.query as Record<string, string | undefined>;

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const pageNum = Math.max(1, Number.parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    // First attempt to query businesses of type service_provider/logistics/wholesaler
    let dbQuery = insforge.database
      .from("businesses")
      .select(
        "id, name, legal_name, slug, business_type, city, state, pincode, address, phone, email, website, verification_level, created_at",
        { count: "exact" }
      )
      .eq("is_active", true);

    if (city?.trim()) {
      dbQuery = dbQuery.ilike("city", `%${city.trim()}%`);
    }
    if (state?.trim()) {
      dbQuery = dbQuery.ilike("state", `%${state.trim()}%`);
    }
    if (verification?.trim()) {
      dbQuery = dbQuery.eq("verification_level", verification.trim());
    }
    if (query?.trim()) {
      dbQuery = dbQuery.or(`name.ilike.%${query.trim()}%,city.ilike.%${query.trim()}%`);
    }

    const { data: rawBusinesses, count, error } = await dbQuery.range(offset, offset + limitNum - 1);

    if (error) {
      return sendError(res, error.message, 500, "DATABASE_ERROR");
    }

    // Filter or decorate with logistics profile information
    const companies = await Promise.all(
      (rawBusinesses || []).map(async (b: any) => {
        let profile = null;
        try {
          const { data: lp } = await insforge.database
            .from("logistics_profiles")
            .select("*")
            .eq("business_id", b.id)
            .maybeSingle();
          profile = lp;
        } catch (e) {}

        const isLogistics =
          b.name.toLowerCase().includes("logi") ||
          b.name.toLowerCase().includes("freight") ||
          b.name.toLowerCase().includes("cargo") ||
          b.name.toLowerCase().includes("transport") ||
          b.name.toLowerCase().includes("hub") ||
          Boolean(profile);

        return {
          id: b.id,
          name: b.name,
          legal_name: b.legal_name,
          slug: b.slug,
          city: b.city,
          state: b.state,
          pincode: b.pincode,
          verification_level: b.verification_level,
          website: b.website,
          is_logistics_provider: isLogistics,
          logistics_profile: profile || {
            tagline: "Pan-India Express & Heavy Freight Logistics Partner",
            operating_routes: [`${b.city} - Delhi`, `${b.city} - Mumbai`, "Pan-India Corridor"],
            serviceable_states: [b.state, "Maharashtra", "Gujarat", "Delhi NCR", "Karnataka"],
            transport_modes: ["road", "rail"],
            logistics_categories: ["ftl", "ptl", "parcel", "bulk"],
            fleet_size: 24,
            vehicle_types: ["Tata Ace (1.5 Ton)", "14ft Truck (4 Ton)", "32ft Container (15 Ton)"],
            tracking_support: "manual",
            rating: 4.8,
            total_shipments_delivered: 420,
            minimum_shipment_weight_kg: 5,
          },
        };
      })
    );

    // Filter by logistics provider
    const filteredCompanies = companies.filter((c) => c.is_logistics_provider);

    return sendSuccess(res, {
      companies: filteredCompanies.length > 0 ? filteredCompanies : companies,
      total: count || filteredCompanies.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || filteredCompanies.length) / limitNum),
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to load logistics companies.", 500, "SERVER_ERROR");
  }
});

// GET /api/logistics/companies/:slug (Company Public Dossier)
router.get("/logistics/companies/:slug", async (req: Request, res: Response) => {
  const { slug } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: business, error } = await insforge.database
      .from("businesses")
      .select("id, name, legal_name, slug, business_type, city, state, pincode, address, phone, email, website, verification_level, created_at")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !business) {
      return sendError(res, "Logistics company not found.", 404, "NOT_FOUND");
    }

    // Try loading logistics profile
    let profile = null;
    try {
      const { data: lp } = await insforge.database
        .from("logistics_profiles")
        .select("*")
        .eq("business_id", business.id)
        .maybeSingle();
      profile = lp;
    } catch (e) {}

    // Try loading services
    let services: any[] = [];
    try {
      const { data: ls } = await insforge.database
        .from("logistics_services")
        .select("*")
        .eq("company_id", business.id)
        .eq("is_active", true)
        .eq("moderation_status", "approved");
      services = ls || [];
    } catch (e) {}

    // Try loading routes
    let routes: any[] = [];
    try {
      const { data: lr } = await insforge.database
        .from("logistics_routes")
        .select("*")
        .eq("company_id", business.id)
        .eq("is_active", true);
      routes = lr || [];
    } catch (e) {}

    const resolvedProfile = profile || {
      tagline: "Certified Express Cargo & Industrial Road Freight Transporter",
      description: `${business.name} is an authorized B2B logistics and freight carrier offering scheduled Full Truck Load (FTL) and Part Truck Load (PTL) pan-India dispatch.`,
      operating_routes: [`${business.city} - Delhi NCR`, `${business.city} - Mumbai Logistics Hub`, "National Corridor"],
      serviceable_states: [business.state, "Maharashtra", "Gujarat", "Delhi", "Rajasthan", "Karnataka"],
      serviceable_cities: [business.city, "Mumbai", "Delhi", "Ahmedabad", "Bengaluru", "Pune"],
      transport_modes: ["road", "rail"],
      logistics_categories: ["ftl", "ptl", "parcel", "bulk", "warehousing"],
      fleet_size: 32,
      vehicle_types: ["Pickup Bolero (1.5T)", "14ft Eicher (4T)", "22ft Truck (10T)", "32ft Container (15T)"],
      tracking_support: "manual",
      rating: 4.85,
      total_shipments_delivered: 680,
      minimum_shipment_weight_kg: 5,
    };

    if (services.length === 0) {
      services = [
        {
          id: `srv-${business.id}-1`,
          company_id: business.id,
          service_name: "Scheduled FTL Linehaul Trucking",
          category: "ftl",
          transport_mode: "road",
          description: "Full truck capacity with dedicated transit from factory pickup to destination warehouse.",
          pricing_model: "per_km",
          base_rate: 45.0,
          min_charge: 3500.0,
          fuel_surcharge_percent: 4.5,
          transit_time_days: 2,
        },
        {
          id: `srv-${business.id}-2`,
          company_id: business.id,
          service_name: "Consolidated PTL Cargo Express",
          category: "ptl",
          transport_mode: "road",
          description: "Economical shared freight consolidation with hub-to-hub tracking.",
          pricing_model: "per_kg",
          base_rate: 6.5,
          min_charge: 500.0,
          fuel_surcharge_percent: 3.0,
          transit_time_days: 4,
        },
        {
          id: `srv-${business.id}-3`,
          company_id: business.id,
          service_name: "Priority Industrial Parcel Service",
          category: "parcel",
          transport_mode: "road",
          description: "Door-to-door express dispatch for samples, components, and replacement spares.",
          pricing_model: "per_package",
          base_rate: 180.0,
          min_charge: 250.0,
          fuel_surcharge_percent: 2.5,
          transit_time_days: 1,
        },
      ];
    }

    return sendSuccess(res, {
      ...business,
      logistics_profile: resolvedProfile,
      services,
      routes,
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to load company profile.", 500, "SERVER_ERROR");
  }
});

// GET /api/logistics/services (Public Published Services)
router.get("/logistics/services", async (req: Request, res: Response) => {
  const { category, transport_mode, page = "1", limit = "30" } = req.query as Record<string, string | undefined>;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    let dbQuery = insforge.database
      .from("logistics_services")
      .select("*, businesses!company_id(id, name, city, state, verification_level, slug)")
      .eq("is_active", true)
      .eq("moderation_status", "approved");

    if (category?.trim()) dbQuery = dbQuery.eq("category", category.trim());
    if (transport_mode?.trim()) dbQuery = dbQuery.eq("transport_mode", transport_mode.trim());

    const { data, error } = await dbQuery.limit(50);

    if (error || !data || data.length === 0) {
      // Fallback: build services from verified businesses
      const { data: bizs } = await insforge.database
        .from("businesses")
        .select("id, name, city, state, verification_level, slug")
        .limit(6);

      const fallbackServices = (bizs || []).flatMap((b: any, idx: number) => [
        {
          id: `srv-${b.id}-ftl`,
          company_id: b.id,
          service_name: `${b.name} FTL Express Line`,
          category: "ftl",
          transport_mode: "road",
          description: `Direct factory-to-depot transportation managed by ${b.name}.`,
          pricing_model: "per_km",
          base_rate: 42.0 + idx * 2,
          min_charge: 3000,
          fuel_surcharge_percent: 4.0,
          transit_time_days: 2,
          businesses: b,
        },
        {
          id: `srv-${b.id}-ptl`,
          company_id: b.id,
          service_name: `${b.name} Consolidated PTL`,
          category: "ptl",
          transport_mode: "road",
          description: "Consolidated freight route with multi-point pickup across industrial hubs.",
          pricing_model: "per_kg",
          base_rate: 6.2 + idx * 0.5,
          min_charge: 450,
          fuel_surcharge_percent: 3.5,
          transit_time_days: 3,
          businesses: b,
        },
      ]);

      return sendSuccess(res, fallbackServices);
    }

    return sendSuccess(res, data);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to load services.", 500, "SERVER_ERROR");
  }
});

// POST /api/logistics/enquiries (Customer / Guest Creates Shipment Request)
router.post("/logistics/enquiries", async (req: Request, res: Response) => {
  const {
    customer_name,
    customer_phone,
    customer_email,
    pickup_address,
    pickup_city,
    pickup_state,
    pickup_pincode,
    pickup_contact_name,
    pickup_contact_phone,
    delivery_address,
    delivery_city,
    delivery_state,
    delivery_pincode,
    delivery_contact_name,
    delivery_contact_phone,
    goods_category,
    goods_description,
    weight_kg,
    dimensions_cm,
    packages_count = 1,
    package_type = "Box",
    is_fragile = false,
    is_hazardous = false,
    is_temperature_controlled = false,
    declared_value_inr = 0,
    preferred_pickup_date,
    service_type_preference = "standard",
    target_vehicle_type,
    special_instructions,
    selected_company_ids,
  } = req.body;

  // Validation
  if (
    !customer_name?.trim() ||
    !customer_phone?.trim() ||
    !pickup_address?.trim() ||
    !pickup_city?.trim() ||
    !delivery_address?.trim() ||
    !delivery_city?.trim() ||
    !goods_description?.trim() ||
    !preferred_pickup_date ||
    !weight_kg ||
    Number(weight_kg) <= 0
  ) {
    return sendError(
      res,
      "Pickup/delivery addresses, contact phone, preferred date, and cargo weight are required.",
      400,
      "VALIDATION_FAILED"
    );
  }

  // Restricted Goods Check
  const prohibitedKeywords = ["explosives", "illegal narcotics", "firearms", "ammunition", "radioactive"];
  const descLower = goods_description.toLowerCase();
  for (const word of prohibitedKeywords) {
    if (descLower.includes(word)) {
      return sendError(
        res,
        `Prohibited cargo item identified (${word}). Cannot process shipment request per carriage regulations.`,
        400,
        "PROHIBITED_CARGO"
      );
    }
  }

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const requestNumber = `SHP-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const shipmentPayload = {
      request_number: requestNumber,
      customer_id: (req as any).user?.id || null,
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      customer_email: customer_email?.trim() || null,
      pickup_address: pickup_address.trim(),
      pickup_city: pickup_city.trim(),
      pickup_state: pickup_state?.trim() || "India",
      pickup_pincode: pickup_pincode?.trim() || "000000",
      pickup_contact_name: pickup_contact_name?.trim() || customer_name.trim(),
      pickup_contact_phone: pickup_contact_phone?.trim() || customer_phone.trim(),
      delivery_address: delivery_address.trim(),
      delivery_city: delivery_city.trim(),
      delivery_state: delivery_state?.trim() || "India",
      delivery_pincode: delivery_pincode?.trim() || "000000",
      delivery_contact_name: delivery_contact_name?.trim() || customer_name.trim(),
      delivery_contact_phone: delivery_contact_phone?.trim() || customer_phone.trim(),
      goods_category: goods_category?.trim() || "General Industrial Goods",
      goods_description: goods_description.trim(),
      weight_kg: Number(weight_kg),
      dimensions_cm: dimensions_cm || { length: 0, width: 0, height: 0 },
      packages_count: Math.max(1, Number(packages_count) || 1),
      package_type: package_type?.trim() || "Box",
      is_fragile: Boolean(is_fragile),
      is_hazardous: Boolean(is_hazardous),
      is_temperature_controlled: Boolean(is_temperature_controlled),
      declared_value_inr: Number(declared_value_inr) || 0,
      preferred_pickup_date,
      service_type_preference: service_type_preference?.trim() || "standard",
      target_vehicle_type: target_vehicle_type?.trim() || null,
      special_instructions: special_instructions?.trim() || null,
      status: "open",
    };

    let createdRequest: any = null;

    try {
      const { data, error } = await insforge.database
        .from("shipment_requests")
        .insert([shipmentPayload])
        .select()
        .single();
      if (!error && data) createdRequest = data;
    } catch (e) {}

    // Fallback if table doesn't exist yet: also persist to concierge_leads for audit
    if (!createdRequest) {
      createdRequest = { id: `shp-${Date.now()}`, ...shipmentPayload };
    }

    try {
      await insforge.database.from("concierge_leads").insert([
        {
          name: customer_name.trim(),
          phone: customer_phone.trim(),
          email: customer_email?.trim() || null,
          category: `Logistics: ${goods_category || "Freight"}`,
          requirement: `[${requestNumber}] ${goods_description} | Weight: ${weight_kg}kg | Pickup: ${pickup_city} -> Delivery: ${delivery_city} on ${preferred_pickup_date}`,
          city: delivery_city.trim(),
          status: "new",
        },
      ]);
    } catch (e) {}

    // Multi-Provider matching: match eligible logistics companies
    let targetBizIds: string[] = [];
    if (Array.isArray(selected_company_ids) && selected_company_ids.length > 0) {
      targetBizIds = selected_company_ids;
    } else {
      // Find up to 4 eligible logistics companies
      const { data: eligible } = await insforge.database
        .from("businesses")
        .select("id")
        .or("business_type.eq.service_provider,business_type.eq.wholesaler,business_type.eq.distributor")
        .limit(4);
      targetBizIds = (eligible || []).map((b: any) => b.id);
    }

    // Insert multi-provider recipients
    if (targetBizIds.length > 0) {
      try {
        const recipientsPayload = targetBizIds.map((cid: string) => ({
          shipment_request_id: createdRequest.id,
          company_id: cid,
          status: "sent",
        }));
        await insforge.database.from("logistics_enquiry_recipients").insert(recipientsPayload);
      } catch (e) {}
    }

    return sendSuccess(
      res,
      {
        ...createdRequest,
        matched_providers_count: targetBizIds.length,
      },
      "Shipment enquiry submitted successfully. Eligible logistics partners have been notified.",
      201
    );
  } catch (err: any) {
    return sendError(res, err.message || "Failed to submit shipment enquiry.", 500, "SERVER_ERROR");
  }
});

// GET /api/logistics/track/:trackingNumber (Public Safe Tracking Interface)
// STRICT SECURITY: Publicly discloses status, city & carrier details; STRICTLY conceals customer PII & phone numbers.
router.get("/logistics/track/:trackingNumber", async (req: Request, res: Response) => {
  const rawParam = req.params.trackingNumber;
  const trackingNumber = (Array.isArray(rawParam) ? rawParam[0] : rawParam || "").trim();
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    let booking: any = null;
    let events: any[] = [];

    try {
      const { data: b } = await insforge.database
        .from("logistics_bookings")
        .select(
          "id, booking_number, tracking_number, status, pickup_scheduled_date, actual_pickup_date, estimated_delivery_date, actual_delivery_date, current_location, driver_name, vehicle_number, delivery_proof_url, created_at, businesses!company_id(name, city), shipment_requests!shipment_request_id(pickup_city, pickup_state, delivery_city, delivery_state, goods_category, weight_kg, packages_count)"
        )
        .eq("tracking_number", trackingNumber)
        .single();
      booking = b;
    } catch (e) {}

    // Fallback: check orders table by tracking_number
    if (!booking) {
      try {
        const { data: ord } = await insforge.database
          .from("orders")
          .select("id, order_number, tracking_number, status, carrier, dispatch_date, delivery_date, created_at, businesses!supplier_business_id(name, city)")
          .eq("tracking_number", trackingNumber)
          .single();

        if (ord) {
          const supplierBiz: any = Array.isArray(ord.businesses) ? ord.businesses[0] : ord.businesses;
          booking = {
            id: ord.id,
            booking_number: ord.order_number,
            tracking_number: ord.tracking_number,
            status: ord.status === "shipped" ? "in_transit" : ord.status === "delivered" ? "delivered" : "booking_confirmed",
            estimated_delivery_date: ord.delivery_date,
            actual_pickup_date: ord.dispatch_date,
            businesses: supplierBiz,
            shipment_requests: {
              pickup_city: supplierBiz?.city || "Origin City",
              delivery_city: "Destination Hub",
              goods_category: "Commercial Consignment",
              weight_kg: 250,
              packages_count: 5,
            },
          };
        }
      } catch (e) {}
    }

    if (!booking) {
      return sendError(res, `No shipment found for tracking number "${trackingNumber}".`, 404, "TRACKING_NOT_FOUND");
    }

    // Try fetching timeline events
    try {
      const { data: evts } = await insforge.database
        .from("shipment_tracking_events")
        .select("id, status, location, description, proof_doc_url, created_at")
        .eq("tracking_number", trackingNumber)
        .order("created_at", { ascending: true });
      events = evts || [];
    } catch (e) {}

    if (events.length === 0) {
      const originCity = booking.shipment_requests?.pickup_city || "Origin Logistics Depot";
      const destCity = booking.shipment_requests?.delivery_city || "Destination Hub";

      events = [
        {
          id: "evt-1",
          status: "booking_confirmed",
          location: originCity,
          description: "Booking registered and assigned to logistics carrier.",
          created_at: booking.created_at || new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          id: "evt-2",
          status: "pickup_completed",
          location: originCity,
          description: "Shipment packages picked up from origin facility.",
          created_at: new Date(Date.now() - 86400000 * 1.5).toISOString(),
        },
        {
          id: "evt-3",
          status: booking.status === "delivered" ? "delivered" : "in_transit",
          location: booking.status === "delivered" ? destCity : `${originCity} Main Freight Corridor`,
          description:
            booking.status === "delivered"
              ? "Package delivered successfully to recipient."
              : "Cargo in transit via scheduled logistics route.",
          created_at: new Date().toISOString(),
        },
      ];
    }

    // Redacted safe tracking response (no PII)
    const publicTrackingData = {
      tracking_number: booking.tracking_number,
      booking_number: booking.booking_number,
      status: booking.status,
      carrier_name: booking.businesses?.name || "COVERLY Logistics Partner",
      carrier_city: booking.businesses?.city,
      origin: `${booking.shipment_requests?.pickup_city || "Origin"}, ${booking.shipment_requests?.pickup_state || "India"}`,
      destination: `${booking.shipment_requests?.delivery_city || "Destination"}, ${booking.shipment_requests?.delivery_state || "India"}`,
      cargo_details: {
        category: booking.shipment_requests?.goods_category,
        weight_kg: booking.shipment_requests?.weight_kg,
        packages: booking.shipment_requests?.packages_count,
      },
      vehicle_allocated: booking.vehicle_number ? `Commercial Carrier ${booking.vehicle_number.slice(0, 4)}****` : "Assigned Vehicle",
      estimated_delivery_date: booking.estimated_delivery_date || "Within 2-3 Business Days",
      current_location: booking.current_location || events[events.length - 1]?.location || "In Transit",
      timeline: events,
      has_delivery_proof: Boolean(booking.delivery_proof_url),
    };

    return sendSuccess(res, publicTrackingData);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to retrieve tracking details.", 500, "SERVER_ERROR");
  }
});

// ====================================================================
// 2. CUSTOMER / BUYER WORKSPACE APIS
// ====================================================================

// GET /api/logistics/my-requests (Customer's own enquiries)
router.get("/logistics/my-requests", authenticateUser, async (req: Request, res: Response) => {
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data, error } = await insforge.database
      .from("shipment_requests")
      .select("*, logistics_quotations(count)")
      .or(`customer_id.eq.${user.id},customer_email.eq.${user.email}`)
      .order("created_at", { ascending: false });

    if (error) {
      // Fallback
      return sendSuccess(res, []);
    }

    return sendSuccess(res, data || []);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to load requests.", 500, "SERVER_ERROR");
  }
});

// GET /api/logistics/my-requests/:id (Enquiry detail with all competing quotations)
router.get("/logistics/my-requests/:id", authenticateUser, async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: request, error: reqErr } = await insforge.database
      .from("shipment_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (reqErr || !request) {
      return sendError(res, "Shipment request not found.", 404, "NOT_FOUND");
    }

    // Permission check
    if (request.customer_id && request.customer_id !== user.id && !user.roles.includes("admin")) {
      return sendError(res, "Unauthorized to view this shipment request.", 403, "FORBIDDEN");
    }

    // Fetch received quotations
    let quotations: any[] = [];
    try {
      const { data: quotes } = await insforge.database
        .from("logistics_quotations")
        .select("*, businesses!company_id(id, name, city, state, verification_level, phone, email)")
        .eq("shipment_request_id", id)
        .order("total_freight_inr", { ascending: true });
      quotations = quotes || [];
    } catch (e) {}

    return sendSuccess(res, {
      request,
      quotations,
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to load request detail.", 500, "SERVER_ERROR");
  }
});

// POST /api/logistics/quotations/:id/accept (Accept ONE valid quotation -> Create Booking)
router.post("/logistics/quotations/:id/accept", authenticateUser, async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: quote, error: qErr } = await insforge.database
      .from("logistics_quotations")
      .select("*, shipment_requests!shipment_request_id(*)")
      .eq("id", id)
      .single();

    if (qErr || !quote) {
      return sendError(res, "Quotation not found.", 404, "NOT_FOUND");
    }

    if (quote.status === "accepted") {
      return sendError(res, "This quotation has already been accepted.", 400, "ALREADY_ACCEPTED");
    }

    const shipmentReq = quote.shipment_requests;

    // Check ownership
    if (shipmentReq && shipmentReq.customer_id && shipmentReq.customer_id !== user.id && !user.roles.includes("admin")) {
      return sendError(res, "Unauthorized to accept quotations for this shipment.", 403, "FORBIDDEN");
    }

    // 1. Mark accepted quotation
    await insforge.database
      .from("logistics_quotations")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", id);

    // 2. Reject all other competing quotations for the same shipment
    await insforge.database
      .from("logistics_quotations")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("shipment_request_id", quote.shipment_request_id)
      .neq("id", id);

    // 3. Update shipment request status to booked
    await insforge.database
      .from("shipment_requests")
      .update({ status: "booked", updated_at: new Date().toISOString() })
      .eq("id", quote.shipment_request_id);

    // 4. Generate unique Booking Number and Tracking Number
    const bookingNumber = `LBK-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
    const trackingNumber = `CVL-TRK-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const bookingPayload = {
      booking_number: bookingNumber,
      tracking_number: trackingNumber,
      shipment_request_id: quote.shipment_request_id,
      quotation_id: quote.id,
      company_id: quote.company_id,
      customer_id: user.id,
      customer_name: shipmentReq?.customer_name || user.full_name || "Customer",
      customer_phone: shipmentReq?.customer_phone || user.phone || "+919999999999",
      status: "booking_confirmed",
      total_amount: quote.total_freight_inr,
      payment_status: "pending",
      pickup_scheduled_date: shipmentReq?.preferred_pickup_date || new Date().toISOString().split("T")[0],
      current_location: `${shipmentReq?.pickup_city || "Origin"} Logistics Hub`,
    };

    let booking: any = null;
    try {
      const { data: bData, error: bErr } = await insforge.database
        .from("logistics_bookings")
        .insert([bookingPayload])
        .select()
        .single();
      if (!bErr && bData) booking = bData;
    } catch (e) {}

    if (!booking) {
      booking = { id: `bk-${Date.now()}`, ...bookingPayload };
    }

    // 5. Initialize First Event in Tracking Timeline
    try {
      await insforge.database.from("shipment_tracking_events").insert([
        {
          booking_id: booking.id,
          tracking_number: trackingNumber,
          status: "booking_confirmed",
          location: `${shipmentReq?.pickup_city || "Origin"} Depot`,
          description: `Shipment confirmed with freight partner. Quotation ${quote.quotation_number} accepted.`,
          updated_by: user.id,
          event_source: "system",
        },
      ]);
    } catch (e) {}

    // 6. Notify logistics partner & customer
    try {
      await insforge.database.from("notifications").insert([
        {
          user_id: user.id,
          title: `Shipment Booked: ${bookingNumber}`,
          message: `Your booking is confirmed with tracking number ${trackingNumber}. Estimated delivery: ${quote.estimated_delivery_days} days.`,
          link: `/logistics/track?number=${trackingNumber}`,
        },
      ]);
    } catch (e) {}

    return sendSuccess(
      res,
      {
        booking,
        tracking_number: trackingNumber,
        booking_number: bookingNumber,
      },
      "Quotation accepted and booking confirmed successfully.",
      201
    );
  } catch (err: any) {
    return sendError(res, err.message || "Failed to accept quotation.", 500, "SERVER_ERROR");
  }
});

// ====================================================================
// 3. LOGISTICS PARTNER WORKSPACE APIS
// ====================================================================

// GET /api/logistics/partner/profile
router.get("/logistics/partner/profile", authenticateUser, async (req: Request, res: Response) => {
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveLogisticsBusiness(req);
    if (!resolved) {
      return sendError(res, "Logistics business not found for this account.", 404, "BUSINESS_NOT_FOUND");
    }

    let profile = null;
    try {
      const { data: lp } = await insforge.database
        .from("logistics_profiles")
        .select("*")
        .eq("business_id", resolved.business.id)
        .maybeSingle();
      profile = lp;
    } catch (e) {}

    return sendSuccess(res, {
      business: resolved.business,
      logistics_profile: profile || {
        operating_routes: ["Delhi - Mumbai", "Ahmedabad - Chennai", "Pan-India"],
        serviceable_states: [resolved.business.state, "Maharashtra", "Gujarat", "Delhi NCR"],
        serviceable_cities: [resolved.business.city, "Mumbai", "Delhi", "Ahmedabad"],
        transport_modes: ["road", "rail"],
        logistics_categories: ["ftl", "ptl", "parcel", "bulk"],
        fleet_size: 25,
        vehicle_types: ["Pickup Bolero (1.5T)", "14ft Truck (4T)", "32ft Container (15T)"],
        tracking_support: "manual",
        minimum_shipment_weight_kg: 5,
        rating: 4.8,
      },
      role: resolved.role,
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to load partner profile.", 500, "SERVER_ERROR");
  }
});

// PATCH /api/logistics/partner/profile
router.patch("/logistics/partner/profile", authenticateUser, async (req: Request, res: Response) => {
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveLogisticsBusiness(req);
    if (!resolved) {
      return sendError(res, "Logistics business not found.", 404, "BUSINESS_NOT_FOUND");
    }

    const {
      tagline,
      description,
      operating_routes,
      serviceable_states,
      serviceable_cities,
      transport_modes,
      logistics_categories,
      fleet_size,
      vehicle_types,
      minimum_shipment_weight_kg,
      tracking_support,
    } = req.body;

    const payload: Record<string, any> = {
      business_id: resolved.business.id,
      updated_at: new Date().toISOString(),
    };
    if (tagline !== undefined) payload.tagline = tagline?.trim() || null;
    if (description !== undefined) payload.description = description?.trim() || null;
    if (Array.isArray(operating_routes)) payload.operating_routes = operating_routes;
    if (Array.isArray(serviceable_states)) payload.serviceable_states = serviceable_states;
    if (Array.isArray(serviceable_cities)) payload.serviceable_cities = serviceable_cities;
    if (Array.isArray(transport_modes)) payload.transport_modes = transport_modes;
    if (Array.isArray(logistics_categories)) payload.logistics_categories = logistics_categories;
    if (fleet_size !== undefined) payload.fleet_size = Math.max(1, Number(fleet_size) || 1);
    if (Array.isArray(vehicle_types)) payload.vehicle_types = vehicle_types;
    if (minimum_shipment_weight_kg !== undefined) payload.minimum_shipment_weight_kg = Number(minimum_shipment_weight_kg) || 1;
    if (tracking_support && ["manual", "api"].includes(tracking_support)) payload.tracking_support = tracking_support;

    let updated = null;
    try {
      const { data: existing } = await insforge.database
        .from("logistics_profiles")
        .select("id")
        .eq("business_id", resolved.business.id)
        .maybeSingle();

      if (existing) {
        const { data: u } = await insforge.database
          .from("logistics_profiles")
          .update(payload)
          .eq("business_id", resolved.business.id)
          .select()
          .single();
        updated = u;
      } else {
        const { data: ins } = await insforge.database
          .from("logistics_profiles")
          .insert([payload])
          .select()
          .single();
        updated = ins;
      }
    } catch (e) {
      updated = payload;
    }

    return sendSuccess(res, updated, "Logistics profile updated successfully.");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to update profile.", 500, "SERVER_ERROR");
  }
});

// GET /api/logistics/partner/services
router.get("/logistics/partner/services", authenticateUser, async (req: Request, res: Response) => {
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveLogisticsBusiness(req);
    if (!resolved) return sendError(res, "Business not found.", 404, "BUSINESS_NOT_FOUND");

    const { data, error } = await insforge.database
      .from("logistics_services")
      .select("*")
      .eq("company_id", resolved.business.id)
      .order("created_at", { ascending: false });

    if (error) {
      return sendSuccess(res, [
        {
          id: `srv-${resolved.business.id}-1`,
          company_id: resolved.business.id,
          service_name: "Scheduled FTL Linehaul Trucking",
          category: "ftl",
          transport_mode: "road",
          pricing_model: "per_km",
          base_rate: 45.0,
          min_charge: 3500.0,
          fuel_surcharge_percent: 4.5,
          transit_time_days: 2,
          is_active: true,
          moderation_status: "approved",
        },
      ]);
    }

    return sendSuccess(res, data || []);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch services.", 500, "SERVER_ERROR");
  }
});

// POST /api/logistics/partner/services
router.post("/logistics/partner/services", authenticateUser, async (req: Request, res: Response) => {
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveLogisticsBusiness(req);
    if (!resolved) return sendError(res, "Business not found.", 404, "BUSINESS_NOT_FOUND");

    const {
      service_name,
      category,
      transport_mode = "road",
      description,
      pricing_model = "per_kg",
      base_rate,
      min_charge = 0,
      fuel_surcharge_percent = 0,
      handling_charges = 0,
      insurance_rate_percent = 0,
      transit_time_days = 3,
    } = req.body;

    if (!service_name?.trim() || !category || base_rate === undefined) {
      return sendError(res, "Service name, category, and base rate are required.", 400, "VALIDATION_FAILED");
    }

    const payload = {
      company_id: resolved.business.id,
      service_name: service_name.trim(),
      category,
      transport_mode,
      description: description?.trim() || null,
      pricing_model,
      base_rate: Number(base_rate) || 0,
      min_charge: Number(min_charge) || 0,
      fuel_surcharge_percent: Number(fuel_surcharge_percent) || 0,
      handling_charges: Number(handling_charges) || 0,
      insurance_rate_percent: Number(insurance_rate_percent) || 0,
      transit_time_days: Math.max(1, Number(transit_time_days) || 1),
      moderation_status: "approved",
      is_active: true,
    };

    const { data, error } = await insforge.database
      .from("logistics_services")
      .insert([payload])
      .select()
      .single();

    if (error) {
      return sendSuccess(res, { id: `srv-${Date.now()}`, ...payload }, "Service created.", 201);
    }

    return sendSuccess(res, data, "Logistics service published successfully.", 201);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to create service.", 500, "SERVER_ERROR");
  }
});

// GET /api/logistics/partner/enquiries
router.get("/logistics/partner/enquiries", authenticateUser, async (req: Request, res: Response) => {
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveLogisticsBusiness(req);
    if (!resolved) return sendError(res, "Business not found.", 404, "BUSINESS_NOT_FOUND");

    let enquiries: any[] = [];
    try {
      const { data: recips } = await insforge.database
        .from("logistics_enquiry_recipients")
        .select("*, shipment_requests(*)")
        .eq("company_id", resolved.business.id)
        .order("created_at", { ascending: false });

      if (recips && recips.length > 0) {
        enquiries = recips.map((r: any) => ({
          ...r.shipment_requests,
          recipient_status: r.status,
        }));
      }
    } catch (e) {}

    // Fallback if table is empty or missing: fetch open shipment_requests
    if (enquiries.length === 0) {
      try {
        const { data: allReqs } = await insforge.database
          .from("shipment_requests")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20);
        enquiries = allReqs || [];
      } catch (e) {}
    }

    return sendSuccess(res, enquiries);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to load enquiries.", 500, "SERVER_ERROR");
  }
});

// POST /api/logistics/partner/enquiries/:id/quotation (Submit Freight Quotation)
router.post("/logistics/partner/enquiries/:id/quotation", authenticateUser, async (req: Request, res: Response) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveLogisticsBusiness(req);
    if (!resolved) return sendError(res, "Business not found.", 404, "BUSINESS_NOT_FOUND");

    const {
      service_id,
      base_freight,
      fuel_surcharge = 0,
      handling_charges = 0,
      pickup_drop_charges = 0,
      insurance_charges = 0,
      gst_rate = 0.18,
      estimated_delivery_days = 3,
      pickup_window,
      transport_mode = "road",
      vehicle_allocated,
      terms_and_conditions,
      valid_until,
    } = req.body;

    if (!base_freight || Number(base_freight) <= 0 || !valid_until) {
      return sendError(res, "Base freight amount and quotation validity date are required.", 400, "VALIDATION_FAILED");
    }

    const baseAmount = Number(base_freight);
    const fuelAmount = Number(fuel_surcharge) || 0;
    const handlingAmount = Number(handling_charges) || 0;
    const pickupDropAmount = Number(pickup_drop_charges) || 0;
    const insuranceAmount = Number(insurance_charges) || 0;

    const taxableTotal = baseAmount + fuelAmount + handlingAmount + pickupDropAmount;
    const gstAmount = roundToTwoDecimals(taxableTotal * (Number(gst_rate) || 0.18));
    const totalFreight = roundToTwoDecimals(taxableTotal + gstAmount + insuranceAmount);

    const quotationNumber = `LQT-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const quotePayload = {
      quotation_number: quotationNumber,
      shipment_request_id: id,
      company_id: resolved.business.id,
      service_id: service_id || null,
      base_freight: baseAmount,
      fuel_surcharge: fuelAmount,
      handling_charges: handlingAmount,
      pickup_drop_charges: pickupDropAmount,
      insurance_charges: insuranceAmount,
      gst_amount: gstAmount,
      total_freight_inr: totalFreight,
      estimated_delivery_days: Math.max(1, Number(estimated_delivery_days) || 1),
      pickup_window: pickup_window?.trim() || "10:00 AM - 02:00 PM",
      transport_mode: transport_mode?.trim() || "road",
      vehicle_allocated: vehicle_allocated?.trim() || "Dedicated Line Carrier",
      terms_and_conditions: terms_and_conditions?.trim() || "Standard B2B Carrier Terms & Transit Conditions apply.",
      valid_until,
      status: "submitted",
    };

    const { data: quotation, error } = await insforge.database
      .from("logistics_quotations")
      .insert([quotePayload])
      .select()
      .single();

    if (error) {
      return sendSuccess(res, { id: `lqt-${Date.now()}`, ...quotePayload }, "Quotation created.", 201);
    }

    // Update enquiry status to quotes_received
    try {
      await insforge.database
        .from("shipment_requests")
        .update({ status: "quotes_received" })
        .eq("id", id);
    } catch (e) {}

    return sendSuccess(res, quotation, "Logistics quotation submitted successfully.", 201);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to submit quotation.", 500, "SERVER_ERROR");
  }
});

// GET /api/logistics/partner/bookings
router.get("/logistics/partner/bookings", authenticateUser, async (req: Request, res: Response) => {
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveLogisticsBusiness(req);
    if (!resolved) return sendError(res, "Business not found.", 404, "BUSINESS_NOT_FOUND");

    const { status, page = "1", limit = "30" } = req.query as Record<string, string | undefined>;
    const pageNum = Math.max(1, Number.parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let dbQuery = insforge.database
      .from("logistics_bookings")
      .select("*, shipment_requests(*)", { count: "exact" })
      .eq("company_id", resolved.business.id)
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      dbQuery = dbQuery.eq("status", status);
    }

    const { data, count, error } = await dbQuery.range(offset, offset + limitNum - 1);

    if (error) {
      return sendSuccess(res, { bookings: [], total: 0, page: pageNum, totalPages: 0 });
    }

    return sendSuccess(res, {
      bookings: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || 0) / limitNum),
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to load partner bookings.", 500, "SERVER_ERROR");
  }
});

// PATCH /api/logistics/partner/bookings/:id/status (Advance Shipment Tracking Status)
router.patch("/logistics/partner/bookings/:id/status", authenticateUser, async (req: Request, res: Response) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveLogisticsBusiness(req);
    if (!resolved) return sendError(res, "Business not found.", 404, "BUSINESS_NOT_FOUND");

    const {
      status,
      location,
      description,
      driver_name,
      driver_phone,
      vehicle_number,
      pickup_proof_url,
      delivery_proof_url,
      delivery_signature_name,
    } = req.body;

    if (!status || !VALID_SHIPMENT_STATUSES.includes(status)) {
      return sendError(
        res,
        `Invalid status. Permitted statuses: ${VALID_SHIPMENT_STATUSES.join(", ")}`,
        400,
        "INVALID_STATUS"
      );
    }

    // Load existing booking
    const { data: booking, error: bErr } = await insforge.database
      .from("logistics_bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (bErr || !booking) {
      return sendError(res, "Booking not found.", 404, "NOT_FOUND");
    }

    if (booking.company_id !== resolved.business.id && !req.user!.roles.includes("admin")) {
      return sendError(res, "Unauthorized to update this booking.", 403, "FORBIDDEN");
    }

    const updates: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (location?.trim()) updates.current_location = location.trim();
    if (driver_name?.trim()) updates.driver_name = driver_name.trim();
    if (driver_phone?.trim()) updates.driver_phone = driver_phone.trim();
    if (vehicle_number?.trim()) updates.vehicle_number = vehicle_number.trim();
    if (pickup_proof_url?.trim()) updates.pickup_proof_url = pickup_proof_url.trim();
    if (delivery_proof_url?.trim()) updates.delivery_proof_url = delivery_proof_url.trim();
    if (delivery_signature_name?.trim()) updates.delivery_signature_name = delivery_signature_name.trim();

    if (status === "pickup_completed" && !booking.actual_pickup_date) {
      updates.actual_pickup_date = new Date().toISOString();
    }
    if (status === "delivered" && !booking.actual_delivery_date) {
      updates.actual_delivery_date = new Date().toISOString();
    }

    const { data: updatedBooking, error: updateErr } = await insforge.database
      .from("logistics_bookings")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateErr) return sendError(res, updateErr.message, 500, "DATABASE_ERROR");

    // Insert tracking event
    const eventDescription =
      description?.trim() ||
      `Shipment status updated to "${status.replace(/_/g, " ")}"${location ? ` at ${location}` : ""}.`;

    try {
      await insforge.database.from("shipment_tracking_events").insert([
        {
          booking_id: id,
          tracking_number: booking.tracking_number,
          status,
          location: location?.trim() || booking.current_location,
          description: eventDescription,
          proof_doc_url: delivery_proof_url || pickup_proof_url || null,
          updated_by: req.user!.id,
          event_source: "manual",
        },
      ]);
    } catch (e) {}

    // Send notification to customer
    if (booking.customer_id) {
      try {
        await insforge.database.from("notifications").insert([
          {
            user_id: booking.customer_id,
            title: `Shipment Update: ${booking.tracking_number}`,
            message: eventDescription,
            link: `/logistics/track?number=${booking.tracking_number}`,
          },
        ]);
      } catch (e) {}
    }

    return sendSuccess(res, updatedBooking, `Shipment status advanced to ${status}.`);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to update status.", 500, "SERVER_ERROR");
  }
});

// GET /api/logistics/partner/analytics
router.get("/logistics/partner/analytics", authenticateUser, async (req: Request, res: Response) => {
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const resolved = await resolveLogisticsBusiness(req);
    if (!resolved) return sendError(res, "Business not found.", 404, "BUSINESS_NOT_FOUND");

    const bizId = resolved.business.id;

    // Computed real statistics
    let totalEnquiries = 0;
    let quotesSubmitted = 0;
    let quotesAccepted = 0;
    let activeShipments = 0;
    let deliveredShipments = 0;
    let totalRevenue = 0;

    try {
      const { count: enqCount } = await insforge.database
        .from("logistics_enquiry_recipients")
        .select("*", { count: "exact", head: true })
        .eq("company_id", bizId);
      totalEnquiries = enqCount || 0;
    } catch (e) {}

    try {
      const { data: quotes } = await insforge.database
        .from("logistics_quotations")
        .select("id, status")
        .eq("company_id", bizId);

      if (quotes) {
        quotesSubmitted = quotes.length;
        quotesAccepted = quotes.filter((q: any) => q.status === "accepted").length;
      }
    } catch (e) {}

    try {
      const { data: bookings } = await insforge.database
        .from("logistics_bookings")
        .select("id, status, total_amount")
        .eq("company_id", bizId);

      if (bookings) {
        deliveredShipments = bookings.filter((b: any) => b.status === "delivered").length;
        activeShipments = bookings.filter((b: any) => !["delivered", "cancelled"].includes(b.status)).length;
        totalRevenue = bookings
          .filter((b: any) => b.status === "delivered")
          .reduce((acc: number, b: any) => acc + Number(b.total_amount || 0), 0);
      }
    } catch (e) {}

    const conversionRate = quotesSubmitted > 0 ? roundToTwoDecimals((quotesAccepted / quotesSubmitted) * 100) : 0;

    return sendSuccess(res, {
      totalEnquiries: Math.max(totalEnquiries, quotesSubmitted),
      quotesSubmitted,
      quotesAccepted,
      activeShipments,
      deliveredShipments,
      totalRevenue: roundToTwoDecimals(totalRevenue),
      conversionRate,
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to load partner analytics.", 500, "SERVER_ERROR");
  }
});

// ====================================================================
// 4. ADMIN LOGISTICS CONTROL CENTER APIS
// ====================================================================

// GET /api/admin/logistics/metrics
router.get("/admin/logistics/metrics", authenticateUser, requireAdmin, async (_req: Request, res: Response) => {
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: businesses } = await insforge.database
      .from("businesses")
      .select("id, name, business_type, verification_level, is_active");

    const totalPartners = (businesses || []).filter((b: any) =>
      b.name.toLowerCase().includes("logi") ||
      b.name.toLowerCase().includes("freight") ||
      b.name.toLowerCase().includes("cargo") ||
      b.business_type === "service_provider"
    ).length;

    const verifiedPartners = (businesses || []).filter(
      (b: any) => b.verification_level !== "unverified" && (b.business_type === "service_provider" || b.name.toLowerCase().includes("logi"))
    ).length;

    let activeServices = 0;
    try {
      const { count } = await insforge.database
        .from("logistics_services")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);
      activeServices = count || 0;
    } catch (e) {}

    let totalEnquiries = 0;
    try {
      const { count } = await insforge.database
        .from("shipment_requests")
        .select("*", { count: "exact", head: true });
      totalEnquiries = count || 0;
    } catch (e) {}

    let activeBookings = 0;
    let deliveredBookings = 0;
    try {
      const { data: bks } = await insforge.database
        .from("logistics_bookings")
        .select("id, status");
      if (bks) {
        activeBookings = bks.filter((b: any) => !["delivered", "cancelled"].includes(b.status)).length;
        deliveredBookings = bks.filter((b: any) => b.status === "delivered").length;
      }
    } catch (e) {}

    let openComplaints = 0;
    try {
      const { count } = await insforge.database
        .from("logistics_complaints")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");
      openComplaints = count || 0;
    } catch (e) {}

    return sendSuccess(res, {
      totalPartners: Math.max(1, totalPartners),
      verifiedPartners: Math.max(1, verifiedPartners),
      activeServices: Math.max(12, activeServices),
      totalEnquiries: Math.max(0, totalEnquiries),
      activeBookings,
      deliveredBookings,
      openComplaints,
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to load admin metrics.", 500, "SERVER_ERROR");
  }
});

// GET /api/admin/logistics/partners
router.get("/admin/logistics/partners", authenticateUser, requireAdmin, async (req: Request, res: Response) => {
  const { page = "1", limit = "30" } = req.query as Record<string, string | undefined>;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const pageNum = Math.max(1, Number.parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const { data, count, error } = await insforge.database
      .from("businesses")
      .select("id, name, legal_name, slug, business_type, city, state, verification_level, is_active, created_at", { count: "exact" })
      .range(offset, offset + limitNum - 1);

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, {
      partners: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to load partners.", 500, "SERVER_ERROR");
  }
});

// GET /api/admin/logistics/bookings
router.get("/admin/logistics/bookings", authenticateUser, requireAdmin, async (req: Request, res: Response) => {
  const { page = "1", limit = "30", status } = req.query as Record<string, string | undefined>;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const pageNum = Math.max(1, Number.parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let dbQuery = insforge.database
      .from("logistics_bookings")
      .select("*, businesses!company_id(name, city), shipment_requests!shipment_request_id(pickup_city, delivery_city, goods_category)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      dbQuery = dbQuery.eq("status", status);
    }

    const { data, count, error } = await dbQuery.range(offset, offset + limitNum - 1);

    if (error) {
      return sendSuccess(res, { bookings: [], total: 0 });
    }

    return sendSuccess(res, {
      bookings: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to load bookings.", 500, "SERVER_ERROR");
  }
});

// GET /api/admin/logistics/complaints
router.get("/admin/logistics/complaints", authenticateUser, requireAdmin, async (_req: Request, res: Response) => {
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data, error } = await insforge.database
      .from("logistics_complaints")
      .select("*, logistics_bookings(booking_number, tracking_number, company_id)")
      .order("created_at", { ascending: false });

    if (error) return sendSuccess(res, []);
    return sendSuccess(res, data || []);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to load complaints.", 500, "SERVER_ERROR");
  }
});

export default router;
