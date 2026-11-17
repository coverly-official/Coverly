import fs from "node:fs";
import path from "node:path";

const migrationsDir = "migrations";
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).sort();

console.log(`Found ${files.length} migration files.\n`);

for (const file of files) {
  const content = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
  const createTables = [];
  const alterTables = [];
  
  const createRegex = /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+([a-zA-Z0-9_."]+)/gi;
  let m;
  while ((m = createRegex.exec(content)) !== null) {
    createTables.push(m[1].replace(/public\./g, "").replace(/"/g, ""));
  }

  const alterRegex = /ALTER\s+TABLE(?:\s+IF\s+EXISTS)?\s+([a-zA-Z0-9_."]+)/gi;
  while ((m = alterRegex.exec(content)) !== null) {
    alterTables.push(m[1].replace(/public\./g, "").replace(/"/g, ""));
  }

  console.log(`[${file}]`);
  console.log(`  CREATE TABLE (${createTables.length}):`, createTables.join(", ") || "none");
  console.log(`  ALTER TABLE (${alterTables.length}):`, [...new Set(alterTables)].join(", ") || "none");
  console.log(`  File size: ${(content.length / 1024).toFixed(1)} KB\n`);
}
