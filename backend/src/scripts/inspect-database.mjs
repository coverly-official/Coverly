import { createAdminClient } from "@insforge/sdk";

const baseUrl = process.env.INSFORGE_BASE_URL || "";
const apiKey = process.env.INSFORGE_API_KEY || "";
if (!baseUrl || !apiKey) {
  throw new Error("INSFORGE_BASE_URL and INSFORGE_API_KEY environment variables are required.");
}

const insforge = createAdminClient({ baseUrl, apiKey });

const tables = [
  "users",
  "user_roles",
  "businesses",
  "business_members",
  "supplier_profiles",
  "supplier_verifications",
  "verification_documents",
  "product_categories",
  "categories",
  "subcategories",
  "products",
  "product_images",
  "rfqs",
  "rfq_items",
  "rfq_recipients",
  "quotations",
  "quotation_items",
  "quotation_costs",
  "orders",
  "order_items",
  "order_status_history",
  "notifications",
  "saved_suppliers",
  "support_tickets",
  "admin_audit_logs",
  "concierge_leads",
  "business_services",
  "service_requests",
  "service_request_quotations"
];

async function inspect() {
  console.log("=== INSPECTING INSFORGE DATABASE ===");
  const results = {};
  for (const table of tables) {
    try {
      const { count, error } = await insforge.database
        .from(table)
        .select("*", { count: "exact", head: true });
      if (error) {
        results[table] = `ERROR: ${error.message}`;
      } else {
        results[table] = count;
      }
    } catch (e) {
      results[table] = `EXCEPTION: ${e.message}`;
    }
  }
  console.log(JSON.stringify(results, null, 2));

  // Also inspect sample product columns
  const { data: sampleProduct } = await insforge.database.from("products").select("*").limit(1);
  console.log("Sample product keys:", sampleProduct ? Object.keys(sampleProduct[0] || {}) : "None");

  // Sample business columns
  const { data: sampleBiz } = await insforge.database.from("businesses").select("*").limit(1);
  console.log("Sample business keys:", sampleBiz ? Object.keys(sampleBiz[0] || {}) : "None");

  // Sample concierge_leads columns
  const { data: sampleLead } = await insforge.database.from("concierge_leads").select("*").limit(1);
  console.log("Sample concierge_leads keys:", sampleLead ? Object.keys(sampleLead[0] || {}) : "None");
}

inspect().catch(console.error);
