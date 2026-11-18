import { getPublicInsForgeClient } from "../backend/src/lib/insforge.js";
import { PUBLIC_SITE_URL } from "../backend/src/lib/seo-meta.js";
import { DEFAULT_CATEGORIES as DEFAULT_SERVICE_CATEGORIES } from "../backend/src/routes/business-services.js";

function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq: "daily" | "weekly" | "monthly";
  priority: string;
}

const STATIC_PUBLIC_PATHS: { path: string; changefreq: "daily" | "weekly" | "monthly"; priority: string }[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/products", changefreq: "daily", priority: "0.9" },
  { path: "/categories", changefreq: "weekly", priority: "0.9" },
  { path: "/manufacturers", changefreq: "daily", priority: "0.9" },
  { path: "/wholesalers", changefreq: "daily", priority: "0.9" },
  { path: "/distributors", changefreq: "daily", priority: "0.8" },
  { path: "/services", changefreq: "daily", priority: "0.9" },
  { path: "/services/all", changefreq: "daily", priority: "0.8" },
  { path: "/services/providers", changefreq: "weekly", priority: "0.8" },
  { path: "/logistics", changefreq: "weekly", priority: "0.8" },
  { path: "/transporters", changefreq: "weekly", priority: "0.8" },
  { path: "/raw-materials", changefreq: "weekly", priority: "0.8" },
  { path: "/packaging", changefreq: "weekly", priority: "0.8" },
  { path: "/import-export", changefreq: "weekly", priority: "0.8" },
  { path: "/sales-agents", changefreq: "weekly", priority: "0.7" },
  { path: "/wholesale", changefreq: "daily", priority: "0.8" },
  // High-intent B2B SEO landing pages
  { path: "/verified-manufacturers-india", changefreq: "weekly", priority: "0.8" },
  { path: "/wholesale-suppliers-india", changefreq: "weekly", priority: "0.8" },
  { path: "/industrial-raw-material-suppliers", changefreq: "weekly", priority: "0.8" },
  { path: "/packaging-material-manufacturers", changefreq: "weekly", priority: "0.8" },
  { path: "/b2b-procurement-platform", changefreq: "weekly", priority: "0.8" },
  { path: "/bulk-product-sourcing", changefreq: "weekly", priority: "0.8" },
  { path: "/indian-wholesale-marketplace", changefreq: "weekly", priority: "0.8" },
  { path: "/business-services-for-manufacturers", changefreq: "weekly", priority: "0.8" },
  { path: "/b2b-logistics-transport-services", changefreq: "weekly", priority: "0.8" },
  // Trust & Guide pages
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/how-it-works", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/buyer-guide", changefreq: "monthly", priority: "0.7" },
  { path: "/supplier-guide", changefreq: "monthly", priority: "0.7" },
  { path: "/help-center", changefreq: "monthly", priority: "0.6" },
  { path: "/faq", changefreq: "monthly", priority: "0.7" },
  { path: "/verification-info", changefreq: "monthly", priority: "0.6" },
  // Legal Center
  { path: "/legal", changefreq: "monthly", priority: "0.5" },
  { path: "/privacy-policy", changefreq: "monthly", priority: "0.5" },
  { path: "/terms-and-conditions", changefreq: "monthly", priority: "0.5" },
  { path: "/cookie-policy", changefreq: "monthly", priority: "0.4" },
  { path: "/disclaimer", changefreq: "monthly", priority: "0.4" },
  { path: "/acceptable-use-policy", changefreq: "monthly", priority: "0.4" },
  { path: "/buyer-terms", changefreq: "monthly", priority: "0.4" },
  { path: "/supplier-terms", changefreq: "monthly", priority: "0.4" },
  { path: "/business-services-terms", changefreq: "monthly", priority: "0.4" },
  { path: "/shipping-and-logistics-policy", changefreq: "monthly", priority: "0.4" },
  { path: "/cancellation-policy", changefreq: "monthly", priority: "0.4" },
  { path: "/returns-and-disputes-policy", changefreq: "monthly", priority: "0.4" },
  { path: "/refund-policy", changefreq: "monthly", priority: "0.4" },
  { path: "/intellectual-property-policy", changefreq: "monthly", priority: "0.4" },
  { path: "/account-deletion-policy", changefreq: "monthly", priority: "0.4" },
  { path: "/grievance-redressal-policy", changefreq: "monthly", priority: "0.4" },
];

export default async function handler(_req: any, res: any) {
  const today = new Date().toISOString().slice(0, 10);
  const entries: SitemapEntry[] = STATIC_PUBLIC_PATHS.map((item) => ({
    loc: item.path === "/" ? `${PUBLIC_SITE_URL}/` : `${PUBLIC_SITE_URL}${item.path}`,
    lastmod: today,
    changefreq: item.changefreq,
    priority: item.priority,
  }));

  // Add service category URLs
  for (const sc of DEFAULT_SERVICE_CATEGORIES) {
    entries.push({
      loc: `${PUBLIC_SITE_URL}/services/category/${encodeURIComponent(sc.slug)}`,
      lastmod: today,
      changefreq: "weekly",
      priority: "0.7",
    });
  }

  // Dynamically include active public records using RLS-enforced public client
  const insforge = getPublicInsForgeClient();
  if (insforge) {
    try {
      const [productsRes, businessesRes, categoriesRes, servicesRes] = await Promise.all([
        insforge.database
          .from("products")
          .select("id, updated_at, created_at")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(500),
        insforge.database
          .from("businesses")
          .select("slug, business_type, updated_at, created_at")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(500),
        insforge.database
          .from("product_categories")
          .select("id, created_at")
          .limit(100),
        insforge.database
          .from("business_services")
          .select("id, updated_at, created_at")
          .eq("is_active", true)
          .limit(200),
      ]);

      for (const p of productsRes.data || []) {
        entries.push({
          loc: `${PUBLIC_SITE_URL}/products/${encodeURIComponent(p.id)}`,
          lastmod: String(p.updated_at || p.created_at || today).slice(0, 10),
          changefreq: "weekly",
          priority: "0.8",
        });
      }

      for (const b of businessesRes.data || []) {
        if (!b.slug) continue;
        const segment =
          b.business_type === "manufacturer"
            ? "manufacturers"
            : b.business_type === "wholesaler"
            ? "wholesalers"
            : b.business_type === "distributor"
            ? "distributors"
            : "suppliers";
        entries.push({
          loc: `${PUBLIC_SITE_URL}/${segment}/${encodeURIComponent(b.slug)}`,
          lastmod: String(b.updated_at || b.created_at || today).slice(0, 10),
          changefreq: "weekly",
          priority: "0.8",
        });
      }

      for (const c of categoriesRes.data || []) {
        entries.push({
          loc: `${PUBLIC_SITE_URL}/products?category=${encodeURIComponent(c.id)}`,
          lastmod: String(c.created_at || today).slice(0, 10),
          changefreq: "weekly",
          priority: "0.7",
        });
      }

      for (const s of servicesRes.data || []) {
        entries.push({
          loc: `${PUBLIC_SITE_URL}/services/${encodeURIComponent(s.id)}`,
          lastmod: String(s.updated_at || s.created_at || today).slice(0, 10),
          changefreq: "weekly",
          priority: "0.7",
        });
      }
    } catch {
      // Return static + category sitemap cleanly if DB unreachable
    }
  }

  // Deduplicate by loc
  const uniqueMap = new Map<string, SitemapEntry>();
  for (const e of entries) {
    if (!uniqueMap.has(e.loc)) uniqueMap.set(e.loc, e);
  }

  const xmlBody = Array.from(uniqueMap.values())
    .map(
      (e) =>
        `  <url>\n    <loc>${escapeXml(e.loc)}</loc>\n    <lastmod>${escapeXml(e.lastmod || today)}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlBody}\n</urlset>\n`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  return res.status(200).send(xml);
}
