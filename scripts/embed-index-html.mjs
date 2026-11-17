import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distHtmlPath = path.resolve(__dirname, "../frontend/dist/index.html");
const targetModulePath = path.resolve(__dirname, "../api/_index-html.ts");

if (!fs.existsSync(distHtmlPath)) {
  console.error(`Expected compiled frontend HTML at ${distHtmlPath}. Run build:frontend first.`);
  process.exit(1);
}

const html = fs.readFileSync(distHtmlPath, "utf-8");
const content = `// Auto-generated during build from frontend/dist/index.html
export const BUILT_INDEX_HTML = ${JSON.stringify(html)};
`;

fs.writeFileSync(targetModulePath, content, "utf-8");
console.log(`Embedded frontend/dist/index.html (${html.length} bytes) into api/_index-html.ts`);
