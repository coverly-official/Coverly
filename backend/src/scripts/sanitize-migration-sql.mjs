import fs from "node:fs";
import path from "node:path";

const migrationsDir = "migrations";
const files = [
  "20261117120000_logistics-marketplace.sql",
  "20261117130000_transporter-marketplace.sql",
  "20261117140000_business-services-marketplace-complete.sql",
  "20261117150000_sales-agent-system.sql",
  "20261117160000_raw-material-marketplace.sql",
  "20261117170000_packaging-supplier-marketplace.sql",
  "20261117180000_import-export-marketplace.sql",
  "20261117190000_buyer-business-owner-system.sql",
  "20261117200000_retailer-marketplace.sql",
  "20261117210000_employee-role-management.sql",
  "20261117220000_business-services-marketplace-complete-v2.sql"
];

for (const file of files) {
  const filePath = path.join(migrationsDir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping missing file: ${file}`);
    continue;
  }
  let sql = fs.readFileSync(filePath, "utf-8");

  // 1. Replace CREATE POLICY IF NOT EXISTS "name" ON table
  sql = sql.replace(
    /CREATE\s+POLICY\s+IF\s+NOT\s+EXISTS\s+"([^"]+)"\s+ON\s+([a-zA-Z0-9_.]+)/gi,
    (match, policyName, tableName) => {
      return `DROP POLICY IF EXISTS "${policyName}" ON ${tableName};\nCREATE POLICY "${policyName}" ON ${tableName}`;
    }
  );

  // 2. Replace auth.users subqueries with public.user_roles subqueries
  sql = sql.replace(
    /\(SELECT\s+raw_user_meta_data->>'role'\s+FROM\s+auth\.users\s+WHERE\s+id\s*=\s*auth\.uid\(\)\)\s*=\s*'admin'/gi,
    "EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')"
  );

  sql = sql.replace(
    /\(SELECT\s+raw_user_meta_data->>'role'\s+FROM\s+auth\.users\s+WHERE\s+id\s*=\s*auth\.uid\(\)\)\s*IN\s*\(([^)]+)\)/gi,
    "EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ($1))"
  );

  // 3. Replace bm.role = 'admin' if any
  sql = sql.replace(
    /bm\.role\s*=\s*'admin'/gi,
    "EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')"
  );

  fs.writeFileSync(filePath, sql, "utf-8");
  console.log(`Sanitized: ${file}`);
}

console.log("All migration files sanitized!");
