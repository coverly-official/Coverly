if (!process.env.INSFORGE_BASE_URL) {
  process.env.INSFORGE_BASE_URL = "https://4vwfw2w8.ap-southeast.insforge.app";
}
if (!process.env.INSFORGE_ANON_KEY) {
  process.env.INSFORGE_ANON_KEY = "anon_9da4660d2d03cec83d7ea57032348bab48a951f8ddf8b2b9dccdfb4b77eefe58";
}

import fs from "node:fs";
import path from "node:path";
import { resolvePageMeta, injectMetaIntoHtml } from "../backend/src/lib/seo-meta.js";
import { BUILT_INDEX_HTML } from "./_index-html.js";

function loadIndexHtmlTemplate(): string {
  if (BUILT_INDEX_HTML && BUILT_INDEX_HTML.includes("<div id=\"root\">")) {
    return BUILT_INDEX_HTML;
  }
  const fallbackPaths = [
    path.resolve(process.cwd(), "frontend/dist/index.html"),
    path.resolve(process.cwd(), "dist/index.html"),
    path.resolve(process.cwd(), "frontend/index.html"),
  ];
  for (const p of fallbackPaths) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, "utf-8");
    }
  }
  return "<!doctype html><html lang=\"en\"><head></head><body><div id=\"root\"></div></body></html>";
}

function resolveRequestPathAndQuery(req: any): {
  pathname: string;
  query: Record<string, string | undefined>;
} {
  const parsedUrl = new URL(req.url || "/", "https://coverly-indol.vercel.app");
  const query: Record<string, string | undefined> = {};

  parsedUrl.searchParams.forEach((value, key) => {
    if (key !== "__path") {
      query[key] = value;
    }
  });

  if (req.query && typeof req.query === "object") {
    for (const [k, v] of Object.entries(req.query)) {
      if (k !== "__path" && typeof v === "string") {
        query[k] = v;
      }
    }
  }

  let pathname =
    (typeof req.query?.__path === "string" && req.query.__path) ||
    parsedUrl.searchParams.get("__path") ||
    (typeof req.headers?.["x-vercel-original-path"] === "string" && req.headers["x-vercel-original-path"]) ||
    parsedUrl.pathname;

  if (!pathname || pathname === "/api/render") {
    pathname = "/";
  }
  if (!pathname.startsWith("/")) {
    pathname = `/${pathname}`;
  }

  return { pathname, query };
}

export default async function handler(req: any, res: any) {
  try {
    const { pathname, query } = resolveRequestPathAndQuery(req);
    const meta = await resolvePageMeta(pathname, query);
    const template = loadIndexHtmlTemplate();
    const html = injectMetaIntoHtml(template, meta);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader(
      "Cache-Control",
      meta.robots.includes("noindex")
        ? "private, no-store, max-age=0"
        : "public, s-maxage=300, stale-while-revalidate=3600"
    );
    return res.status(200).send(html);
  } catch (err) {
    console.error("Metadata render fallback:", err);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(loadIndexHtmlTemplate());
  }
}
