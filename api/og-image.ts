import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateOgPngBuffer } from "../backend/src/lib/og-image-generator.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const wasmFilePath = path.join(currentDir, "_assets", "resvg.wasm");
const fontFilePath = path.join(currentDir, "_assets", "Geist-Regular.ttf");

let cachedWasm: Buffer | null = null;
let cachedFont: Buffer | null = null;

function loadBundledAssets() {
  if (!cachedWasm && fs.existsSync(wasmFilePath)) {
    cachedWasm = fs.readFileSync(wasmFilePath);
  }
  if (!cachedFont && fs.existsSync(fontFilePath)) {
    cachedFont = fs.readFileSync(fontFilePath);
  }
  return {
    wasmBytes: cachedWasm || undefined,
    fontBytes: cachedFont || undefined,
  };
}

export default async function handler(req: any, res: any) {
  try {
    const parsed = new URL(req.url || "/api/og-image", "https://coverly-indol.vercel.app");
    const getParam = (k: string) =>
      (typeof req.query?.[k] === "string" ? req.query[k] : parsed.searchParams.get(k)) || undefined;

    const pngBuffer = await generateOgPngBuffer(
      {
        type: getParam("type") || "home",
        title: getParam("title"),
        subtitle: getParam("subtitle"),
        meta: getParam("meta"),
        badge: getParam("badge"),
      },
      loadBundledAssets()
    );

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.status(200).send(pngBuffer);
  } catch (err) {
    console.error("OG PNG generation error:", err);
    res.setHeader("Location", "https://coverly-indol.vercel.app/og/coverly-home.png");
    return res.status(302).end();
  }
}
