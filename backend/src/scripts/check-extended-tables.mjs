import { createAdminClient } from "@insforge/sdk";

const baseUrl = process.env.INSFORGE_BASE_URL || "https://4vwfw2w8.ap-southeast.insforge.app";
const apiKey = process.env.INSFORGE_API_KEY || "ik_1d1fb7f3feb4e7723e653ef844b24492486caa96de0940f2e658c2f30cd392a1";

const insforge = createAdminClient({ baseUrl, apiKey });

const exactTables = [
  "distributor_profiles",
  "distributor_territories",
  "distributor_product_offers",
  "logistics_profiles",
  "logistics_services",
  "logistics_routes",
  "shipment_requests",
  "transporter_profiles",
  "transporter_vehicles",
  "transporter_drivers",
  "transport_bookings",
  "transport_trip_events",
  "service_projects",
  "service_project_milestones",
  "service_project_deliverables",
  "service_reviews",
  "service_complaints",
  "sales_agent_profiles",
  "sales_leads",
  "sales_commission_records",
  "raw_material_categories",
  "raw_material_products",
  "raw_material_rfqs",
  "raw_material_quotations",
  "raw_material_orders",
  "packaging_categories",
  "packaging_products",
  "packaging_rfqs",
  "packaging_quotations",
  "packaging_orders",
  "trade_parties",
  "international_products",
  "trade_rfqs",
  "trade_quotations",
  "trade_orders",
  "trade_documents",
  "business_branches",
  "purchase_requests",
  "purchase_orders",
  "retailer_profiles",
  "retailer_branches",
  "retailer_purchase_lists",
  "employee_activity_logs",
  "purchase_invoices",
  "purchase_expenses"
];

async function verifyAllExact() {
  console.log(`=== VERIFYING ${exactTables.length} REMOTE TABLES ===`);
  const status = { live: 0, missing: 0, errors: {} };
  for (const table of exactTables) {
    try {
      const { count, error } = await insforge.database
        .from(table)
        .select("*", { count: "exact", head: true });
      if (error) {
        status.missing++;
        status.errors[table] = error.message;
      } else {
        status.live++;
      }
    } catch (e) {
      status.missing++;
      status.errors[table] = e.message;
    }
  }
  console.log(`Result: ${status.live} LIVE tables out of ${exactTables.length}. Missing: ${status.missing}`);
  if (status.missing > 0) {
    console.log("Errors:", JSON.stringify(status.errors, null, 2));
  }
}

verifyAllExact().catch(console.error);
