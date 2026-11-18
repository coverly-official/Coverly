import { createAdminClient } from "@insforge/sdk";

const baseUrl = process.env.INSFORGE_BASE_URL || "";
const apiKey = process.env.INSFORGE_API_KEY || "";
if (!baseUrl || !apiKey) {
  throw new Error("INSFORGE_BASE_URL and INSFORGE_API_KEY environment variables are required.");
}

const insforge = createAdminClient({ baseUrl, apiKey });

async function fullAudit() {
  console.log("=== COMPREHENSIVE INSFORGE DATABASE AUDIT ===");

  // Candidate tables to check
  const candidateTables = [
    // Core Identity & Auth
    "users",
    "user_roles",
    "businesses",
    "business_members",
    "business_roles",
    "business_branches",
    "business_employees",
    "supplier_profiles",
    "supplier_verifications",
    "verification_documents",

    // Catalog & Marketplace
    "product_categories",
    "categories",
    "subcategories",
    "products",
    "product_images",
    "supplier_offers",
    "saved_products",
    "saved_suppliers",

    // Sourcing, RFQs & Quotations
    "concierge_leads",
    "rfqs",
    "rfq_items",
    "rfq_recipients",
    "quotations",
    "quotation_items",
    "quotation_costs",
    "sourcing_lists",
    "sourcing_list_items",

    // Procurement & Orders
    "purchase_requests",
    "purchase_request_items",
    "purchase_orders",
    "purchase_order_items",
    "orders",
    "order_items",
    "order_status_history",

    // Specialized Marketplaces
    "raw_materials",
    "raw_material_grades",
    "packaging_products",
    "packaging_categories",
    "international_products",
    "trade_party_profiles",
    "retailer_profiles",
    "retailer_branches",
    "retailer_reorders",

    // Logistics & Transport
    "logistics_partners",
    "transporters",
    "transporter_profiles",
    "vehicles",
    "drivers",
    "transport_trips",
    "shipments",
    "proof_of_deliveries",

    // Business Services
    "business_services",
    "service_categories",
    "service_subcategories",
    "service_provider_profiles",
    "service_portfolios",
    "service_packages",
    "service_requests",
    "service_request_quotations",
    "service_projects",
    "service_project_milestones",
    "service_project_deliverables",
    "service_reviews",
    "service_complaints",

    // Sales Agent & CRM
    "sales_agents",
    "sales_agent_profiles",
    "sales_leads",
    "sales_activities",
    "commission_records",

    // Operations, Support & Finance
    "invoices",
    "purchase_expenses",
    "support_tickets",
    "ticket_messages",
    "notifications",
    "admin_audit_logs",
    "business_relationships",
    "contracts"
  ];

  const existingTables = {};
  const missingTables = [];

  for (const table of candidateTables) {
    try {
      const { count, error } = await insforge.database
        .from(table)
        .select("*", { count: "exact", head: true });
      if (error) {
        missingTables.push(table);
      } else {
        existingTables[table] = count;
      }
    } catch (e) {
      missingTables.push(table);
    }
  }

  console.log("\n--- EXISTING TABLES & ROW COUNTS ---");
  console.log(JSON.stringify(existingTables, null, 2));

  console.log("\n--- UNINSTANTIATED / MISSING TABLES ---");
  console.log(JSON.stringify(missingTables, null, 2));

  // Storage Buckets check
  console.log("\n--- STORAGE BUCKETS ---");
  try {
    if (insforge.storage && insforge.storage.listBuckets) {
      const { data: buckets, error: bErr } = await insforge.storage.listBuckets();
      console.log("Buckets:", buckets || bErr);
    } else {
      console.log("Storage client does not expose listBuckets.");
    }
  } catch (e) {
    console.log("Storage check exception:", e.message);
  }
}

fullAudit().catch(console.error);
