import fs from "node:fs";
import path from "node:path";

const routesDir = "backend/src/routes";
const files = fs.readdirSync(routesDir).filter(f => f.endsWith(".ts"));

console.log(`Found ${files.length} route files.`);
const endpointCatalog = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(routesDir, file), "utf-8");
  const regex = /router\.(get|post|put|patch|delete)\(\s*["']([^"']+)["']/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    endpointCatalog.push({
      file,
      method: match[1].toUpperCase(),
      path: match[2]
    });
  }
}

console.log(`Total endpoints discovered: ${endpointCatalog.length}`);
console.log("\nSummary by file:");
const fileCounts = {};
for (const ep of endpointCatalog) {
  fileCounts[ep.file] = (fileCounts[ep.file] || 0) + 1;
}
console.log(JSON.stringify(fileCounts, null, 2));
