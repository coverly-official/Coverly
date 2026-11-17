import { getPublicInsForgeClient } from "./insforge.js";
import { DEFAULT_CATEGORIES as DEFAULT_SERVICE_CATEGORIES } from "../routes/business-services.js";

export const PUBLIC_SITE_URL = (
  process.env.PUBLIC_SITE_URL || "https://coverly-indol.vercel.app"
).replace(/\/+$/, "");

export const SITE_NAME = "COVERLY";

export interface PageMeta {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  type: "website" | "product" | "article" | "profile";
  url: string;
  siteName: string;
  twitterCard: "summary_large_image";
  robots: string;
}

const PRIVATE_PREFIXES = [
  "/admin",
  "/buyer",
  "/retailer",
  "/supplier",
  "/provider",
  "/auth",
  "/access-denied",
  "/logistics-partner",
  "/transporter",
  "/agent",
  "/sales-agent/dashboard",
  "/raw-material-supplier",
  "/packaging-supplier",
  "/trade",
  "/services/my-requests",
];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function escapeHtml(input: string): string {
  return String(input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function cleanDescription(raw?: string | null, fallback = "", maxLen = 165): string {
  const text = String(raw || fallback || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return fallback;
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1).trimEnd()}…`;
}

/**
 * Validates that an external image URL is safe, public HTTPS, and WhatsApp-compatible
 * (raster formats PNG/JPEG/WebP — not SVG, not localhost, not data URI, not signed-private).
 */
export function resolvePublicImageUrl(candidate?: string | null): string | null {
  if (!candidate || typeof candidate !== "string") return null;
  const trimmed = candidate.trim();
  if (!trimmed.startsWith("https://")) return null;
  const lower = trimmed.toLowerCase();
  if (
    lower.includes("localhost") ||
    lower.includes("127.0.0.1") ||
    lower.endsWith(".svg") ||
    lower.includes(".svg?") ||
    lower.includes("token=") ||
    lower.includes("signature=")
  ) {
    return null;
  }
  return trimmed;
}

export function buildDynamicOgImageUrl(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      sp.set(k, String(v).trim().slice(0, 140));
    }
  }
  return `${PUBLIC_SITE_URL}/api/og-image?${sp.toString()}`;
}

export function getHomepageMeta(): PageMeta {
  return {
    title: "COVERLY — Verified B2B Sourcing, Wholesale Marketplace & Landed-Cost Procurement",
    description:
      "Connect directly with verified Indian manufacturers, wholesalers, distributors, logistics partners & business service providers. Compare true landed costs with GST & freight.",
    image: `${PUBLIC_SITE_URL}/og/coverly-home.png`,
    imageAlt: "COVERLY — India's Connected B2B Sourcing & Wholesale Procurement Platform",
    imageWidth: 1200,
    imageHeight: 630,
    type: "website",
    url: `${PUBLIC_SITE_URL}/`,
    siteName: SITE_NAME,
    twitterCard: "summary_large_image",
    robots: "index, follow",
  };
}

function makeMeta(partial: Partial<PageMeta> & { title: string; description: string; url: string }): PageMeta {
  return {
    image: `${PUBLIC_SITE_URL}/og/coverly-home.png`,
    imageAlt: partial.title,
    imageWidth: 1200,
    imageHeight: 630,
    type: "website",
    siteName: SITE_NAME,
    twitterCard: "summary_large_image",
    robots: "index, follow",
    ...partial,
  };
}

function formatPriceBadge(price?: number | string | null, unit?: string | null): string {
  if (!price || Number.isNaN(Number(price))) return "";
  const formatted = `INR ${Number(price).toLocaleString("en-IN")}`;
  return unit ? `${formatted} / ${unit}` : formatted;
}

function formatBusinessTypeLabel(type?: string | null): string {
  const map: Record<string, string> = {
    manufacturer: "Verified Manufacturer",
    wholesaler: "Bulk Wholesaler",
    distributor: "Authorized Distributor",
    raw_material_supplier: "Raw Material Supplier",
    packaging_supplier: "Packaging Supplier",
    importer: "Verified Importer",
    exporter: "Verified Exporter",
    importer_exporter: "Global Importer & Exporter",
    service_provider: "Business Service Provider",
    logistics_partner: "Logistics Partner",
    transporter: "Verified Transporter",
  };
  return (type && map[type]) || "Verified B2B Supplier";
}

/**
 * Resolves Open Graph, Twitter Card & Canonical metadata for any COVERLY URL.
 * Strictly uses the unauthenticated public InsForge client (RLS enforced) and
 * never queries or leaks private/unapproved records.
 */
export async function resolvePageMeta(
  rawPathname: string,
  queryParams: Record<string, string | undefined> = {}
): Promise<PageMeta> {
  const normalizedPath = ("/" + String(rawPathname || "/").replace(/^\/+/, "")).replace(/\/+$/, "") || "/";
  const canonicalBase = normalizedPath === "/" ? `${PUBLIC_SITE_URL}/` : `${PUBLIC_SITE_URL}${normalizedPath}`;

  // 1. Private / Authenticated routes: NEVER query DB, return safe generic metadata + noindex
  if (PRIVATE_PREFIXES.some((prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`))) {
    return makeMeta({
      title: "COVERLY Workspace — Secure B2B Procurement Portal",
      description: "Sign in to access your COVERLY B2B procurement, supplier, or governance workspace.",
      image: `${PUBLIC_SITE_URL}/og/coverly-home.png`,
      imageAlt: "COVERLY B2B Platform",
      url: canonicalBase,
      robots: "noindex, nofollow",
    });
  }

  // 2. Homepage
  if (normalizedPath === "/") {
    return getHomepageMeta();
  }

  const insforge = getPublicInsForgeClient();

  // 3. Product Details: /products/:id
  const productMatch = normalizedPath.match(/^\/products\/([^/]+)$/);
  if (productMatch) {
    const idOrSlug = decodeURIComponent(productMatch[1]);
    if (insforge) {
      try {
        const isUuid = UUID_REGEX.test(idOrSlug);
        let q = insforge.database
          .from("products")
          .select(
            "id, title, slug, description, moq, unit, indicative_price, category_id, is_active, businesses(name, city, state, verification_level), product_images(image_url, sort_order)"
          )
          .eq("is_active", true);
        q = isUuid ? q.eq("id", idOrSlug) : q.eq("slug", idOrSlug);

        const { data: prod } = await q.single();
        if (prod) {
          const images = Array.isArray((prod as any).product_images)
            ? [...(prod as any).product_images].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            : [];
          const realImg = images.map((im: any) => resolvePublicImageUrl(im?.image_url)).find(Boolean);
          const biz = (prod as any).businesses;
          const location = [biz?.city, biz?.state].filter(Boolean).join(", ");
          const priceStr = formatPriceBadge(prod.indicative_price, prod.unit);
          const moqStr = prod.moq ? `MOQ: ${prod.moq} ${prod.unit || "units"}` : "";
          const metaLine = [priceStr, moqStr, location].filter(Boolean).join(" • ");

          const ogImage =
            realImg ||
            buildDynamicOgImageUrl({
              type: "product",
              title: prod.title,
              subtitle: biz?.name ? `Supplied by ${biz.name}` : "Wholesale B2B Listing on COVERLY",
              meta: metaLine || "Compare landed cost, GST & freight on COVERLY",
              badge: prod.category_id ? prod.category_id.replace(/-/g, " ").toUpperCase() : "WHOLESALE PRODUCT",
            });

          return makeMeta({
            title: `${prod.title} | COVERLY Wholesale`,
            description: cleanDescription(
              prod.description,
              `Source ${prod.title} wholesale on COVERLY. ${metaLine}`.trim()
            ),
            image: ogImage,
            imageAlt: `${prod.title} — COVERLY B2B Wholesale`,
            type: "product",
            url: canonicalBase,
          });
        }
      } catch {}
    }

    return makeMeta({
      title: "Wholesale Product Details | COVERLY B2B Marketplace",
      description:
        "View verified wholesale pricing, MOQ tiers, GST rates & factory-direct quotations on COVERLY.",
      image: `${PUBLIC_SITE_URL}/og/coverly-products.png`,
      url: canonicalBase,
      type: "product",
    });
  }

  // 4. Products Catalog & Category Filter: /products or /products?category=<slug>
  if (normalizedPath === "/products" || normalizedPath === "/wholesale") {
    const categorySlug = queryParams.category?.trim();
    if (categorySlug && insforge) {
      try {
        const { data: cat } = await insforge.database
          .from("product_categories")
          .select("id, label, unit, default_qty")
          .eq("id", categorySlug)
          .single();

        if (cat) {
          const canonicalWithCat = `${PUBLIC_SITE_URL}/products?category=${encodeURIComponent(cat.id)}`;
          return makeMeta({
            title: `${cat.label} — Wholesale Suppliers & Manufacturers | COVERLY`,
            description: `Browse verified Indian manufacturers and bulk wholesalers for ${cat.label}. Compare factory prices, MOQ (${cat.default_qty || 100} ${cat.unit || "units"}) and landed cost on COVERLY.`,
            image: buildDynamicOgImageUrl({
              type: "category",
              title: cat.label,
              subtitle: "Verified Wholesale Suppliers & Factory-Direct Catalog",
              meta: `Standard Unit: ${cat.unit || "Units"} • Compare GST & Landed Cost`,
              badge: "PRODUCT CATEGORY",
            }),
            imageAlt: `${cat.label} Wholesale Category — COVERLY`,
            url: canonicalWithCat,
          });
        }
      } catch {}
    }

    return makeMeta({
      title:
        normalizedPath === "/wholesale"
          ? "Wholesale Bulk Catalog for Retailers | COVERLY"
          : "Wholesale B2B Products Marketplace | COVERLY",
      description:
        "Discover bulk industrial products, raw materials, packaging & wholesale inventory directly from verified Indian manufacturers and distributors.",
      image: `${PUBLIC_SITE_URL}/og/coverly-products.png`,
      imageAlt: "COVERLY Wholesale B2B Products Marketplace",
      url: canonicalBase,
    });
  }

  // 5. Categories Hub: /categories
  if (normalizedPath === "/categories") {
    return makeMeta({
      title: "All B2B Wholesale & Industrial Categories | COVERLY",
      description:
        "Explore industrial machinery, raw materials, textiles, agriculture, packaging, construction steel, chemicals & healthcare categories on COVERLY.",
      image: `${PUBLIC_SITE_URL}/og/coverly-categories.png`,
      imageAlt: "COVERLY B2B Product Categories",
      url: canonicalBase,
    });
  }

  // 6. Business / Manufacturer / Wholesaler / Distributor Profiles
  const bizMatch = normalizedPath.match(/^\/(suppliers|manufacturers|wholesalers|distributors)\/([^/]+)$/);
  if (bizMatch) {
    const routeSegment = bizMatch[1];
    const slugOrId = decodeURIComponent(bizMatch[2]);

    if (insforge) {
      try {
        const isUuid = UUID_REGEX.test(slugOrId);
        let q = insforge.database
          .from("businesses")
          .select("id, name, legal_name, slug, business_type, city, state, verification_level")
          .eq("is_active", true);
        q = isUuid ? q.eq("id", slugOrId) : q.eq("slug", slugOrId);

        const { data: biz } = await q.single();
        if (biz) {
          // Optionally check if this business has an approved public product photo
          let realImg: string | null = null;
          try {
            const { data: bizProd } = await insforge.database
              .from("products")
              .select("product_images(image_url, sort_order)")
              .eq("business_id", biz.id)
              .eq("is_active", true)
              .limit(3);
            for (const p of bizProd || []) {
              const imgs = Array.isArray((p as any).product_images) ? (p as any).product_images : [];
              const found = imgs.map((im: any) => resolvePublicImageUrl(im?.image_url)).find(Boolean);
              if (found) {
                realImg = found;
                break;
              }
            }
          } catch {}

          const roleLabel = formatBusinessTypeLabel(biz.business_type || routeSegment.replace(/s$/, ""));
          const location = [biz.city, biz.state].filter(Boolean).join(", ") || "India";
          const verifiedLabel =
            biz.verification_level && biz.verification_level !== "unverified"
              ? `${String(biz.verification_level).replace(/_/g, " ")} • `
              : "";

          const ogImage =
            realImg ||
            buildDynamicOgImageUrl({
              type: biz.business_type === "wholesaler" ? "wholesaler" : "manufacturer",
              title: biz.name,
              subtitle: `${roleLabel} in ${location}`,
              meta: `${verifiedLabel}Request Bulk Quotations & Landed-Cost Estimates on COVERLY`,
              badge: roleLabel.toUpperCase(),
            });

          return makeMeta({
            title: `${biz.name} — ${roleLabel} | COVERLY`,
            description: cleanDescription(
              biz.legal_name && biz.legal_name !== biz.name
                ? `${biz.name} (${biz.legal_name}) — ${roleLabel} based in ${location}. Browse verified products and request bulk B2B quotations on COVERLY.`
                : `Connect directly with ${biz.name}, a ${roleLabel.toLowerCase()} based in ${location}. Browse verified products and request bulk B2B quotations on COVERLY.`
            ),
            image: ogImage,
            imageAlt: `${biz.name} — ${roleLabel} on COVERLY`,
            type: "profile",
            url: canonicalBase,
          });
        }
      } catch {}
    }

    const fallbackImg =
      routeSegment === "wholesalers"
        ? `${PUBLIC_SITE_URL}/og/coverly-wholesalers.png`
        : `${PUBLIC_SITE_URL}/og/coverly-manufacturers.png`;
    return makeMeta({
      title: `Verified ${routeSegment.charAt(0).toUpperCase() + routeSegment.slice(1)} Profile | COVERLY`,
      description: `Explore verified Indian ${routeSegment}, product catalogs, factory capabilities & bulk quotations on COVERLY.`,
      image: fallbackImg,
      type: "profile",
      url: canonicalBase,
    });
  }

  // 7. Directory Listings: /manufacturers, /wholesalers, /distributors
  if (normalizedPath === "/manufacturers") {
    return makeMeta({
      title: "Verified Indian Manufacturers Directory | COVERLY",
      description:
        "Source factory-direct from GST-verified Indian manufacturers across steel, polymers, textiles, machinery, packaging & industrial goods.",
      image: `${PUBLIC_SITE_URL}/og/coverly-manufacturers.png`,
      imageAlt: "COVERLY Verified Indian Manufacturers Directory",
      url: canonicalBase,
    });
  }
  if (normalizedPath === "/wholesalers" || normalizedPath === "/distributors") {
    const label = normalizedPath === "/wholesalers" ? "Bulk Wholesalers" : "Authorized Distributors";
    return makeMeta({
      title: `${label} Directory India | COVERLY`,
      description: `Connect with verified ${label.toLowerCase()} offering tiered MOQ pricing, regional supply networks & fast B2B fulfillment on COVERLY.`,
      image: `${PUBLIC_SITE_URL}/og/coverly-wholesalers.png`,
      imageAlt: `COVERLY ${label} Directory`,
      url: canonicalBase,
    });
  }

  // 8. Business Services Marketplace
  if (normalizedPath === "/services" || normalizedPath === "/services/all" || normalizedPath === "/services/search") {
    return makeMeta({
      title: "Business Services Marketplace — Legal, CA, Branding, IT & Logistics | COVERLY",
      description:
        "Hire verified business service providers across company registration, GST & CA audit, legal compliance, branding, ERP software & supply chain.",
      image: `${PUBLIC_SITE_URL}/og/coverly-services.png`,
      imageAlt: "COVERLY Business Services Marketplace",
      url: canonicalBase,
    });
  }

  const serviceCatMatch = normalizedPath.match(/^\/services\/category\/([^/]+)$/);
  if (serviceCatMatch) {
    const slug = decodeURIComponent(serviceCatMatch[1]);
    let catName = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    let catDesc = `Hire verified professionals and agencies for ${catName} on COVERLY Business Services Marketplace.`;

    const fallbackCat = DEFAULT_SERVICE_CATEGORIES.find((c) => c.slug === slug);
    if (fallbackCat) {
      catName = fallbackCat.name;
      catDesc = fallbackCat.description;
    } else if (insforge) {
      try {
        const { data: cat } = await insforge.database
          .from("service_categories")
          .select("name, description")
          .eq("slug", slug)
          .single();
        if (cat) {
          catName = cat.name;
          catDesc = cat.description || catDesc;
        }
      } catch {}
    }

    return makeMeta({
      title: `${catName} — Business Services | COVERLY`,
      description: cleanDescription(catDesc),
      image: buildDynamicOgImageUrl({
        type: "service",
        title: catName,
        subtitle: "Verified Agencies, Consultants & Business Professionals",
        meta: "Compare Proposals, Milestones & Deliverables on COVERLY",
        badge: "BUSINESS SERVICE CATEGORY",
      }),
      imageAlt: `${catName} — COVERLY Business Services`,
      url: canonicalBase,
    });
  }

  const serviceProviderMatch = normalizedPath.match(/^\/services\/providers\/([^/]+)$/);
  if (serviceProviderMatch) {
    const id = decodeURIComponent(serviceProviderMatch[1]);
    if (insforge) {
      try {
        const { data: prov } = await insforge.database
          .from("service_provider_profiles")
          .select("id, company_name, headline, bio, city, state, logo_url")
          .eq("id", id)
          .single();
        if (prov) {
          const realImg = resolvePublicImageUrl((prov as any).logo_url);
          const loc = [prov.city, prov.state].filter(Boolean).join(", ");
          return makeMeta({
            title: `${prov.company_name} — Verified Service Provider | COVERLY`,
            description: cleanDescription(
              prov.headline || prov.bio,
              `Hire ${prov.company_name}${loc ? ` (${loc})` : ""} on COVERLY Business Services Marketplace.`
            ),
            image:
              realImg ||
              buildDynamicOgImageUrl({
                type: "service",
                title: prov.company_name,
                subtitle: prov.headline || "Verified Business Service Provider",
                meta: loc ? `${loc} • Request Proposals on COVERLY` : "Request Proposals on COVERLY",
                badge: "SERVICE PROVIDER",
              }),
            imageAlt: `${prov.company_name} — COVERLY Service Provider`,
            type: "profile",
            url: canonicalBase,
          });
        }
      } catch {}
    }
  }

  const serviceDetailMatch = normalizedPath.match(/^\/services\/([^/]+)$/);
  if (serviceDetailMatch && !["providers", "request", "all", "search"].includes(serviceDetailMatch[1])) {
    const idOrSlug = decodeURIComponent(serviceDetailMatch[1]);
    if (insforge) {
      try {
        const isUuid = UUID_REGEX.test(idOrSlug);
        let q = insforge.database
          .from("business_services")
          .select("id, title, slug, short_description, description, base_price, cover_image_url, image_url, is_active")
          .eq("is_active", true);
        q = isUuid ? q.eq("id", idOrSlug) : q.eq("slug", idOrSlug);

        const { data: svc } = await q.single();
        if (svc) {
          const realImg =
            resolvePublicImageUrl((svc as any).cover_image_url) ||
            resolvePublicImageUrl((svc as any).image_url);
          const priceStr = svc.base_price
            ? `Starting from INR ${Number(svc.base_price).toLocaleString("en-IN")}`
            : "Request Custom Proposal";

          return makeMeta({
            title: `${svc.title} | COVERLY Business Services`,
            description: cleanDescription(
              (svc as any).short_description || svc.description,
              `${svc.title} by verified B2B professionals on COVERLY. ${priceStr}.`
            ),
            image:
              realImg ||
              buildDynamicOgImageUrl({
                type: "service",
                title: svc.title,
                subtitle: "Verified B2B Professional Service",
                meta: `${priceStr} • Milestone-Protected Engagement`,
                badge: "BUSINESS SERVICE",
              }),
            imageAlt: `${svc.title} — COVERLY Business Services`,
            type: "article",
            url: canonicalBase,
          });
        }
      } catch {}
    }

    return makeMeta({
      title: "Business Service Details | COVERLY",
      description: "Compare verified B2B service packages, deliverables & proposals on COVERLY.",
      image: `${PUBLIC_SITE_URL}/og/coverly-services.png`,
      url: canonicalBase,
    });
  }

  // 9. Specialized Public Listings: Raw Materials, Packaging, Import/Export, Logistics, Transporters, Sales Agents
  const rawMaterialMatch = normalizedPath.match(/^\/raw-materials\/products\/([^/]+)$/);
  if (rawMaterialMatch && insforge) {
    try {
      const slug = decodeURIComponent(rawMaterialMatch[1]);
      const { data: item } = await insforge.database
        .from("raw_material_products")
        .select("id, title, slug, grade, description, moq, unit, indicative_price, image_url")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();
      if (item) {
        const realImg = resolvePublicImageUrl((item as any).image_url);
        return makeMeta({
          title: `${item.title} | COVERLY Raw Materials`,
          description: cleanDescription(
            item.description,
            `Industrial raw material ${item.title}${item.grade ? ` (Grade: ${item.grade})` : ""} on COVERLY.`
          ),
          image:
            realImg ||
            buildDynamicOgImageUrl({
              type: "trade",
              title: item.title,
              subtitle: item.grade ? `Grade: ${item.grade} • Industrial Raw Material` : "Industrial Raw Material",
              meta: [formatPriceBadge(item.indicative_price, item.unit), item.moq ? `MOQ: ${item.moq} ${item.unit || ""}` : ""]
                .filter(Boolean)
                .join(" • ") || "Bulk Mill-Direct Sourcing on COVERLY",
              badge: "RAW MATERIALS",
            }),
          type: "product",
          url: canonicalBase,
        });
      }
    } catch {}
  }

  const packagingMatch = normalizedPath.match(/^\/packaging\/products\/([^/]+)$/);
  if (packagingMatch && insforge) {
    try {
      const slug = decodeURIComponent(packagingMatch[1]);
      const { data: item } = await insforge.database
        .from("packaging_products")
        .select("id, title, slug, description, moq, unit, indicative_price, image_url")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();
      if (item) {
        const realImg = resolvePublicImageUrl((item as any).image_url);
        return makeMeta({
          title: `${item.title} | COVERLY Packaging Hub`,
          description: cleanDescription(
            item.description,
            `Custom & bulk industrial packaging: ${item.title} from verified Indian suppliers on COVERLY.`
          ),
          image:
            realImg ||
            buildDynamicOgImageUrl({
              type: "product",
              title: item.title,
              subtitle: "Custom & Bulk Industrial Packaging",
              meta: formatPriceBadge(item.indicative_price, item.unit) || "Request Custom Packaging Quote on COVERLY",
              badge: "PACKAGING HUB",
            }),
          type: "product",
          url: canonicalBase,
        });
      }
    } catch {}
  }

  const tradeMatch = normalizedPath.match(/^\/import-export\/products\/([^/]+)$/);
  if (tradeMatch && insforge) {
    try {
      const slug = decodeURIComponent(tradeMatch[1]);
      const { data: item } = await insforge.database
        .from("international_products")
        .select("id, title, slug, description, hs_code, incoterm, image_url")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();
      if (item) {
        const realImg = resolvePublicImageUrl((item as any).image_url);
        return makeMeta({
          title: `${item.title} | COVERLY Global Trade`,
          description: cleanDescription(
            item.description,
            `Export-ready product ${item.title}${item.hs_code ? ` (HS ${item.hs_code})` : ""} on COVERLY Import & Export Marketplace.`
          ),
          image:
            realImg ||
            buildDynamicOgImageUrl({
              type: "trade",
              title: item.title,
              subtitle: item.hs_code ? `HS Code: ${item.hs_code} • International Trade` : "International Import & Export",
              meta: item.incoterm ? `Incoterms: ${item.incoterm} • Verified Global Trade` : "Verified Global Trade on COVERLY",
              badge: "IMPORT & EXPORT",
            }),
          type: "product",
          url: canonicalBase,
        });
      }
    } catch {}
  }

  const logisticsCompanyMatch = normalizedPath.match(/^\/logistics\/companies\/([^/]+)$/);
  if (logisticsCompanyMatch && insforge) {
    try {
      const slug = decodeURIComponent(logisticsCompanyMatch[1]);
      const { data: partner } = await insforge.database
        .from("logistics_partners")
        .select("id, company_name, slug, description, headquarters_city, logo_url")
        .eq("slug", slug)
        .single();
      if (partner) {
        const realImg = resolvePublicImageUrl((partner as any).logo_url);
        return makeMeta({
          title: `${partner.company_name} — Logistics Partner | COVERLY`,
          description: cleanDescription(
            partner.description,
            `Book verified freight, warehousing & pan-India logistics with ${partner.company_name} on COVERLY.`
          ),
          image:
            realImg ||
            buildDynamicOgImageUrl({
              type: "logistics",
              title: partner.company_name,
              subtitle: partner.headquarters_city
                ? `Verified Logistics Partner • ${partner.headquarters_city}`
                : "Verified Logistics & Freight Partner",
              meta: "Pan-India Freight, Multi-Modal & Consignment Tracking",
              badge: "LOGISTICS PARTNER",
            }),
          type: "profile",
          url: canonicalBase,
        });
      }
    } catch {}
  }

  const transporterMatch = normalizedPath.match(/^\/transporters\/([^/]+)$/);
  if (transporterMatch && !["directory", "book", "track"].includes(transporterMatch[1]) && insforge) {
    try {
      const slug = decodeURIComponent(transporterMatch[1]);
      const { data: tr } = await insforge.database
        .from("transporter_profiles")
        .select("id, company_name, slug, description, base_city, base_state, logo_url")
        .eq("slug", slug)
        .single();
      if (tr) {
        const realImg = resolvePublicImageUrl((tr as any).logo_url);
        const loc = [tr.base_city, tr.base_state].filter(Boolean).join(", ");
        return makeMeta({
          title: `${tr.company_name} — Fleet & Transporter | COVERLY`,
          description: cleanDescription(
            tr.description,
            `Book commercial trucks & verified fleet transport with ${tr.company_name}${loc ? ` (${loc})` : ""} on COVERLY.`
          ),
          image:
            realImg ||
            buildDynamicOgImageUrl({
              type: "logistics",
              title: tr.company_name,
              subtitle: loc ? `Commercial Fleet Transporter • ${loc}` : "Verified Commercial Fleet Transporter",
              meta: "Live Trip Tracking & Electronic POD on COVERLY",
              badge: "TRANSPORTER",
            }),
          type: "profile",
          url: canonicalBase,
        });
      }
    } catch {}
  }

  const salesAgentMatch = normalizedPath.match(/^\/sales-agents?\/([^/]+)$/);
  if (salesAgentMatch && salesAgentMatch[1] !== "requirement" && insforge) {
    try {
      const slug = decodeURIComponent(salesAgentMatch[1]);
      const { data: agent } = await insforge.database
        .from("sales_agents")
        .select("id, full_name, slug, bio, city, state, specialization, avatar_url")
        .eq("slug", slug)
        .single();
      if (agent) {
        const realImg = resolvePublicImageUrl((agent as any).avatar_url);
        const loc = [agent.city, agent.state].filter(Boolean).join(", ");
        return makeMeta({
          title: `${agent.full_name} — Verified B2B Sales Representative | COVERLY`,
          description: cleanDescription(
            agent.bio,
            `Connect with verified B2B sourcing representative ${agent.full_name}${loc ? ` in ${loc}` : ""} on COVERLY.`
          ),
          image:
            realImg ||
            buildDynamicOgImageUrl({
              type: "manufacturer",
              title: agent.full_name,
              subtitle: agent.specialization || "Verified B2B Sales & Sourcing Representative",
              meta: loc ? `${loc} • Direct Business Sourcing on COVERLY` : "Direct Business Sourcing on COVERLY",
              badge: "SALES REPRESENTATIVE",
            }),
          type: "profile",
          url: canonicalBase,
        });
      }
    } catch {}
  }

  // 10. Section Landing Hubs (Logistics, Transporters, Raw Materials, Packaging, Import/Export, Sales Agents, About, Contact)
  if (normalizedPath.startsWith("/logistics") || normalizedPath.startsWith("/transporters") || normalizedPath === "/track") {
    return makeMeta({
      title: "B2B Logistics, Freight & Commercial Transporters | COVERLY",
      description:
        "Compare freight quotes, book verified commercial trucks & track B2B consignments with electronic POD across India on COVERLY.",
      image: `${PUBLIC_SITE_URL}/og/coverly-logistics.png`,
      imageAlt: "COVERLY B2B Logistics & Transporters Hub",
      url: canonicalBase,
    });
  }
  if (
    normalizedPath.startsWith("/raw-materials") ||
    normalizedPath.startsWith("/packaging") ||
    normalizedPath.startsWith("/import-export")
  ) {
    const hubTitle = normalizedPath.startsWith("/raw-materials")
      ? "Raw Materials Marketplace — Mill-Direct Sourcing | COVERLY"
      : normalizedPath.startsWith("/packaging")
      ? "Industrial & Custom Packaging Marketplace | COVERLY"
      : "Import & Export Global Trade Marketplace | COVERLY";
    return makeMeta({
      title: hubTitle,
      description:
        "Source industrial raw materials, custom packaging & international export consignments directly from verified suppliers on COVERLY.",
      image: `${PUBLIC_SITE_URL}/og/coverly-trade.png`,
      imageAlt: hubTitle,
      url: canonicalBase,
    });
  }
  if (normalizedPath.startsWith("/sales-agents")) {
    return makeMeta({
      title: "Verified B2B Sales Representatives & Sourcing Agents | COVERLY",
      description:
        "Partner with verified regional B2B sales agents and sourcing specialists to accelerate procurement and factory deals on COVERLY.",
      image: `${PUBLIC_SITE_URL}/og/coverly-manufacturers.png`,
      url: canonicalBase,
    });
  }
  if (normalizedPath === "/about" || normalizedPath === "/how-it-works" || normalizedPath === "/contact") {
    const titleMap: Record<string, string> = {
      "/about": "About COVERLY — India's Connected B2B Business Ecosystem",
      "/how-it-works": "How COVERLY Works — Landed-Cost B2B Procurement Explained",
      "/contact": "Contact COVERLY — Enterprise Sourcing & Support Desk",
    };
    return makeMeta({
      title: titleMap[normalizedPath],
      description:
        "Learn how COVERLY connects buyers, retailers, manufacturers, wholesalers, distributors, logistics partners & business services with zero brokerage.",
      image: `${PUBLIC_SITE_URL}/og/coverly-home.png`,
      url: canonicalBase,
    });
  }

  // Fallback for any other public URL
  return makeMeta({
    title: "COVERLY — Verified B2B Sourcing & Wholesale Marketplace",
    description:
      "Discover verified Indian manufacturers, wholesale products, raw materials, logistics & business services on COVERLY.",
    image: `${PUBLIC_SITE_URL}/og/coverly-home.png`,
    url: canonicalBase,
  });
}

/**
 * Builds the complete Open Graph, Twitter Card, and Canonical HTML block.
 */
export function buildMetaTagsHtml(meta: PageMeta): string {
  const t = escapeHtml(meta.title);
  const d = escapeHtml(meta.description);
  const img = escapeHtml(meta.image);
  const imgAlt = escapeHtml(meta.imageAlt);
  const url = escapeHtml(meta.url);
  const site = escapeHtml(meta.siteName);
  const robots = escapeHtml(meta.robots);

  return [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<!-- Open Graph / WhatsApp / Facebook / LinkedIn -->`,
    `<meta property="og:type" content="${escapeHtml(meta.type)}" />`,
    `<meta property="og:site_name" content="${site}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:image" content="${img}" />`,
    `<meta property="og:image:secure_url" content="${img}" />`,
    `<meta property="og:image:type" content="image/png" />`,
    `<meta property="og:image:width" content="${meta.imageWidth}" />`,
    `<meta property="og:image:height" content="${meta.imageHeight}" />`,
    `<meta property="og:image:alt" content="${imgAlt}" />`,
    `<!-- Twitter / X -->`,
    `<meta name="twitter:card" content="${escapeHtml(meta.twitterCard)}" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${img}" />`,
    `<meta name="twitter:image:alt" content="${imgAlt}" />`,
  ].join("\n    ");
}

/**
 * Injects page-specific OG / Twitter / Canonical metadata into the compiled index.html shell,
 * cleanly replacing the default title/meta block between markers (or inside <head>).
 */
export function injectMetaIntoHtml(htmlTemplate: string, meta: PageMeta): string {
  const metaBlock = buildMetaTagsHtml(meta);
  const markerRegex = /<!--\s*COVERLY_SEO_META_START\s*-->[\s\S]*?<!--\s*COVERLY_SEO_META_END\s*-->/i;

  if (markerRegex.test(htmlTemplate)) {
    return htmlTemplate.replace(
      markerRegex,
      `<!-- COVERLY_SEO_META_START -->\n    ${metaBlock}\n    <!-- COVERLY_SEO_META_END -->`
    );
  }

  // Fallback if markers absent: replace <title> and inject before </head>
  let out = htmlTemplate.replace(/<title>[\s\S]*?<\/title>/i, "");
  out = out.replace(/<meta\s+name="description"[^>]*>/i, "");
  return out.replace(/<\/head>/i, `    ${metaBlock}\n  </head>`);
}
