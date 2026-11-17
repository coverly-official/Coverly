import { createAdminClient } from "@insforge/sdk";
import { execSync } from "node:child_process";

const sql = `
ALTER TABLE products ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'approved';
ALTER TABLE products ADD COLUMN IF NOT EXISTS moderation_notes text;
ALTER TABLE concierge_leads ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE concierge_leads ADD COLUMN IF NOT EXISTS supplier_business_id uuid REFERENCES businesses(id) ON DELETE SET NULL;
ALTER TABLE concierge_leads ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE concierge_leads ADD COLUMN IF NOT EXISTS target_quantity numeric;
ALTER TABLE concierge_leads ADD COLUMN IF NOT EXISTS target_price numeric;
ALTER TABLE concierge_leads ADD COLUMN IF NOT EXISTS delivery_city text;
ALTER TABLE concierge_leads ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE concierge_leads ADD COLUMN IF NOT EXISTS quotation_id uuid;
ALTER TABLE concierge_leads ADD COLUMN IF NOT EXISTS responded_at timestamp with time zone;
ALTER TABLE concierge_leads ADD COLUMN IF NOT EXISTS response_notes text;
ALTER TABLE quotations ALTER COLUMN rfq_id DROP NOT NULL;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS enquiry_id uuid REFERENCES concierge_leads(id) ON DELETE SET NULL;
`;

const statements = sql
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

for (const stmt of statements) {
  console.log("Executing:", stmt);
  try {
    const res = execSync(`npx insforge db query "${stmt}"`, {
      env: { ...process.env, DO_NOT_TRACK: "1" },
      encoding: "utf-8",
    });
    console.log(res);
  } catch (err) {
    console.error("Failed statement:", stmt, err.message);
  }
}

console.log("Migration complete!");
