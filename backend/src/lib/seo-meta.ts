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
  statusCode: number;
  jsonLd?: Record<string, any>[];
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
  "/sales-agents/dashboard",
  "/raw-material-supplier",
  "/packaging-supplier",
  "/trade",
  "/services/my-requests",
  "/manufacturer",
  "/wholesaler",
  "/distributor",
  "/dashboard",
  "/account",
  "/settings",
  "/notifications",
];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const SEO_LANDING_PAGES: Record<
  string,
  { title: string; description: string; image: string; badge: string }
> = {
  "/verified-manufacturers-india": {
    title: "Verified Manufacturers in India — Factory-Direct B2B Sourcing | COVERLY",
    description:
      "Connect directly with verified Indian manufacturers across steel, polymers, textiles, machinery, packaging & industrial goods. Compare MOQ, GST & landed costs.",
    image: `${PUBLIC_SITE_URL}/og/coverly-manufacturers.png`,
    badge: "VERIFIED MANUFACTURERS INDIA",
  },
  "/wholesale-suppliers-india": {
    title: "Wholesale Suppliers in India — Bulk B2B Procurement | COVERLY",
    description:
      "Source bulk wholesale stock from verified Indian wholesalers and distributors with transparent tiered MOQ pricing and pan-India delivery.",
    image: `${PUBLIC_SITE_URL}/og/coverly-wholesalers.png`,
    badge: "WHOLESALE SUPPLIERS INDIA",
  },
  "/industrial-raw-material-suppliers": {
    title: "Industrial Raw Material Suppliers India — Mill-Direct Sourcing | COVERLY",
    description:
      "Procure steel sheets, polymer granules, industrial chemicals, yarns & agricultural commodities directly from verified raw material suppliers.",
    image: `${PUBLIC_SITE_URL}/og/coverly-trade.png`,
    badge: "RAW MATERIAL SUPPLIERS",
  },
  "/packaging-material-manufacturers": {
    title: "Packaging Material Manufacturers India — Custom & Bulk Packaging | COVERLY",
    description:
      "Source corrugated boxes, flexible pouches, rigid cartons, labels & industrial pallets from verified Indian packaging manufacturers.",
    image: `${PUBLIC_SITE_URL}/og/coverly-trade.png`,
    badge: "PACKAGING MANUFACTURERS",
  },
  "/b2b-procurement-platform": {
    title: "B2B Procurement Platform India — RFQ, Quotations & Landed-Cost Comparison | COVERLY",
    description:
      "Streamline multi-supplier RFQs, compare true landed costs including GST & freight, manage internal approvals & track B2B purchase orders on COVERLY.",
    image: `${PUBLIC_SITE_URL}/og/coverly-home.png`,
    badge: "B2B PROCUREMENT PLATFORM",
  },
  "/bulk-product-sourcing": {
    title: "Bulk Product Sourcing for Retailers & Enterprises | COVERLY",
    description:
      "Post bulk sourcing requirements, receive competitive supplier quotations & manage multi-branch wholesale reorders with zero brokerage.",
    image: `${PUBLIC_SITE_URL}/og/coverly-products.png`,
    badge: "BULK PRODUCT SOURCING",
  },
  "/indian-wholesale-marketplace": {
    title: "Indian Wholesale Marketplace for MSMEs, Shops & Distributors | COVERLY",
    description:
      "Discover India's connected wholesale marketplace bridging buyers, retailers, factories, distributors, logistics & business services.",
    image: `${PUBLIC_SITE_URL}/og/coverly-wholesalers.png`,
    badge: "INDIAN WHOLESALE MARKETPLACE",
  },
  "/business-services-for-manufacturers": {
    title: "Business Services for Manufacturers & MSMEs — Legal, GST, CA & ERP | COVERLY",
    description:
      "Hire verified agencies and professionals for factory compliance, GST & statutory audit, trademark filing, packaging design & ERP software.",
    image: `${PUBLIC_SITE_URL}/og/coverly-services.png`,
    badge: "BUSINESS SERVICES",
  },
  "/b2b-logistics-transport-services": {
    title: "B2B Logistics & Commercial Transport Services Across India | COVERLY",
    description:
      "Compare pan-India freight quotes, book verified commercial fleets & track B2B consignments with electronic Proof of Delivery (e-POD).",
    image: `${PUBLIC_SITE_URL}/og/coverly-logistics.png`,
    badge: "B2B LOGISTICS & TRANSPORT",
  },
};

export const LEGAL_PAGE_META: Record<string, { title: string; description: string }> = {
  "/legal": {
    title: "Legal Center — Policies, Terms & Compliance | COVERLY",
    description:
      "Access COVERLY's Privacy Policy, Terms & Conditions, Cookie Policy, Buyer & Supplier Terms, Grievance Redressal Policy and compliance documentation.",
  },
  "/privacy-policy": {
    title: "Privacy Policy | COVERLY",
    description:
      "Understand how COVERLY collects, processes, protects and retains account, business, KYC and technical data across our B2B platform.",
  },
  "/terms-and-conditions": {
    title: "Terms & Conditions | COVERLY",
    description:
      "Read the Terms & Conditions governing use of the COVERLY B2B discovery, sourcing, RFQ, supplier and business services marketplace.",
  },
  "/cookie-policy": {
    title: "Cookie Policy | COVERLY",
    description:
      "Learn about essential session cookies, authentication storage and optional preference controls used on COVERLY.",
  },
  "/disclaimer": {
    title: "Platform Disclaimer | COVERLY",
    description:
      "Important legal disclaimers regarding COVERLY's role as a B2B intermediary marketplace, indicative pricing and third-party supplier listings.",
  },
  "/acceptable-use-policy": {
    title: "Acceptable Use Policy | COVERLY",
    description:
      "Prohibited activities, anti-spam rules, listing integrity standards and platform security obligations for COVERLY users.",
  },
  "/buyer-terms": {
    title: "Buyer Terms of Use | COVERLY",
    description:
      "Terms governing B2B buyers, retailers and procurement teams submitting RFQs, comparing quotations and issuing purchase orders on COVERLY.",
  },
  "/supplier-terms": {
    title: "Supplier Terms of Use | COVERLY",
    description:
      "Terms governing manufacturers, wholesalers, distributors, raw material and packaging suppliers listing products and submitting quotes on COVERLY.",
  },
  "/business-services-terms": {
    title: "Business Services Terms | COVERLY",
    description:
      "Terms governing service providers and business clients engaging through the COVERLY Business Services Marketplace.",
  },
  "/shipping-and-logistics-policy": {
    title: "Shipping & Logistics Policy | COVERLY",
    description:
      "Information on B2B dispatch responsibilities, freight quotation estimates, commercial transport bookings and delivery documentation on COVERLY.",
  },
  "/cancellation-policy": {
    title: "Cancellation Policy | COVERLY",
    description:
      "Guidelines for cancelling RFQs, purchase orders, custom manufacturing orders and service bookings on COVERLY.",
  },
  "/returns-and-disputes-policy": {
    title: "Returns & Disputes Policy | COVERLY",
    description:
      "B2B quality inspection claims, commercial return eligibility and platform dispute mediation procedures on COVERLY.",
  },
  "/refund-policy": {
    title: "Refund Policy | COVERLY",
    description:
      "Refund terms for applicable platform service fees and buyer-supplier commercial settlement arrangements on COVERLY.",
  },
  "/intellectual-property-policy": {
    title: "Intellectual Property Policy | COVERLY",
    description:
      "Trademark, copyright, brand authorization and IP infringement takedown procedures on COVERLY.",
  },
  "/account-deletion-policy": {
    title: "Account Deletion & Data Retention Policy | COVERLY",
    description:
      "How to request account deletion, consent withdrawal and data erasure while meeting statutory commercial record retention obligations.",
  },
  "/grievance-redressal-policy": {
    title: "Grievance Redressal Policy | COVERLY",
    description:
      "How to submit complaints, regulatory notices or privacy grievances and review COVERLY's resolution timelines.",
  },
  "/kyc-privacy-notice": {
    title: "KYC Privacy Notice | COVERLY",
    description:
      "How COVERLY collects, validates, privately stores, and governs identity and business verification documents across all 12 B2B roles.",
  },
  "/identity-verification-consent": {
    title: "Identity Verification Consent | COVERLY",
    description:
      "Explicit document-specific legal consent terms recorded before submitting identity or business KYC documents on COVERLY.",
  },
  "/aadhaar-offline-verification-notice": {
    title: "Aadhaar Offline Verification Notice | COVERLY",
    description:
      "Voluntary Aadhaar Offline XML/QR disclosure, non-Aadhaar alternative Government IDs, and zero raw Aadhaar number retention on COVERLY.",
  },
  "/document-retention-policy": {
    title: "KYC Document Retention Policy | COVERLY",
    description:
      "Retention lifecycles, unsubmitted file removal, audit log minimization, and secure deletion of private KYC documents on COVERLY.",
  },
  "/verification-terms": {
    title: "Verification Terms & Badge Governance | COVERLY",
    description:
      "Meaning and scope of individual COVERLY verification badges, resubmission rules, expiry, and anti-fraud enforcement.",
  },
};

export const TRUST_GUIDE_META: Record<string, { title: string; description: string }> = {
  "/buyer-guide": {
    title: "B2B Buyer Sourcing Guide — RFQs & Landed Cost Comparison | COVERLY",
    description:
      "Step-by-step guide for Indian buyers, retailers and procurement teams to discover suppliers, issue RFQs and compare true landed costs on COVERLY.",
  },
  "/supplier-guide": {
    title: "Supplier & Manufacturer Guide — Grow B2B Sales | COVERLY",
    description:
      "How verified Indian manufacturers, wholesalers and distributors list products, respond to bulk RFQs and manage purchase orders on COVERLY.",
  },
  "/help-center": {
    title: "Help Center & Platform Documentation | COVERLY",
    description:
      "Find answers on account registration, business verification, RFQ workflows, logistics tracking, privacy requests and support tickets on COVERLY.",
  },
  "/faq": {
    title: "Frequently Asked Questions (FAQ) | COVERLY",
    description:
      "Answers to common questions about COVERLY's B2B wholesale marketplace, landed-cost calculator, business verification and supplier onboarding.",
  },
  "/verification-info": {
    title: "Business Verification Information — How COVERLY Checks Suppliers | COVERLY",
    description:
      "Learn what each COVERLY verification tier means, which documents are reviewed, and how to evaluate supplier trust before transacting.",
  },
};

export const PUBLIC_FAQ_ITEMS = [
  {
    q: "What is COVERLY?",
    a: "COVERLY is a B2B discovery, wholesale sourcing, and landed-cost procurement platform connecting Indian buyers, retailers, manufacturers, wholesalers, distributors, logistics partners, transporters, and business service providers.",
  },
  {
    q: "How does landed-cost comparison work on COVERLY?",
    a: "When buyers request quotations (RFQs), suppliers submit structured quotes containing unit price, minimum order quantity (MOQ), applicable GST, and estimated freight so buyers can compare total delivered cost transparently.",
  },
  {
    q: "Does COVERLY manufacture or sell products directly?",
    a: "COVERLY operates as a B2B technology platform and marketplace intermediary. Products, wholesale lots, transport services, and professional services are listed and fulfilled directly by independent third-party businesses.",
  },
  {
    q: "What does a verification badge mean on COVERLY?",
    a: "Verification tiers indicate that a business has submitted supporting registration or business documents reviewed by COVERLY's verification team. Buyers should still conduct standard commercial due diligence prior to high-value transactions.",
  },
  {
    q: "How can I request account deletion or update my privacy preferences?",
    a: "Users can manage cookie preferences from the footer, review our Privacy Policy and Account Deletion Policy in the Legal Center, or submit a formal privacy/deletion request through their account settings or Grievance Redressal channel.",
  },
];

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

function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
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
    statusCode: 200,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "COVERLY",
        url: `${PUBLIC_SITE_URL}/`,
        logo: `${PUBLIC_SITE_URL}/og/coverly-home.png`,
        description:
          "India's B2B discovery, wholesale sourcing, supplier verification & landed-cost procurement platform.",
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "COVERLY",
        url: `${PUBLIC_SITE_URL}/`,
        potentialAction: {
          "@type": "SearchAction",
          target: `${PUBLIC_SITE_URL}/products?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

function makeMeta(
  partial: Partial<PageMeta> & { title: string; description: string; url: string }
): PageMeta {
  return {
    image: `${PUBLIC_SITE_URL}/og/coverly-home.png`,
    imageAlt: partial.title,
    imageWidth: 1200,
    imageHeight: 630,
    type: "website",
    siteName: SITE_NAME,
    twitterCard: "summary_large_image",
    robots: "index, follow",
    statusCode: 200,
    ...partial,
  };
}

export function getNotFoundMeta(url: string): PageMeta {
  return makeMeta({
    title: "404 — Looks like this route is out of stock | COVERLY",
    description:
      "The page you're looking for doesn't exist, may have moved, or is temporarily unavailable. Explore COVERLY's wholesale B2B marketplace instead.",
    image: `${PUBLIC_SITE_URL}/og/coverly-home.png`,
    imageAlt: "COVERLY — Route Not Found (404)",
    url,
    robots: "noindex, follow",
    statusCode: 404,
  });
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
 * Resolves Open Graph, Twitter Card, Canonical, JSON-LD & HTTP status metadata for any COVERLY URL.
 * Strictly uses the unauthenticated public InsForge client (RLS enforced).
 */
export async function resolvePageMeta(
  rawPathname: string,
  queryParams: Record<string, string | undefined> = {}
): Promise<PageMeta> {
  const normalizedPath = ("/" + String(rawPathname || "/").replace(/^\/+/, "")).replace(/\/+$/, "") || "/";
  const canonicalBase = normalizedPath === "/" ? `${PUBLIC_SITE_URL}/` : `${PUBLIC_SITE_URL}${normalizedPath}`;

  // 0. Explicit /404
  if (normalizedPath === "/404") {
    return getNotFoundMeta(`${PUBLIC_SITE_URL}/404`);
  }

  // 1. Private / Authenticated routes: NEVER query DB, return safe generic metadata + noindex
  if (PRIVATE_PREFIXES.some((prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`))) {
    return makeMeta({
      title: "COVERLY Workspace — Secure B2B Procurement Portal",
      description: "Sign in to access your COVERLY B2B procurement, supplier, or governance workspace.",
      image: `${PUBLIC_SITE_URL}/og/coverly-home.png`,
      imageAlt: "COVERLY B2B Platform",
      url: canonicalBase,
      robots: "noindex, nofollow",
      statusCode: 200,
    });
  }

  // 2. Homepage
  if (normalizedPath === "/") {
    return getHomepageMeta();
  }

  // 2b. Dedicated High-Intent B2B SEO Landing Pages
  if (normalizedPath in SEO_LANDING_PAGES) {
    const landing = SEO_LANDING_PAGES[normalizedPath];
    return makeMeta({
      title: landing.title,
      description: landing.description,
      image: landing.image,
      imageAlt: landing.title,
      url: canonicalBase,
      jsonLd: [
        buildBreadcrumbSchema([
          { name: "Home", url: `${PUBLIC_SITE_URL}/` },
          { name: landing.badge, url: canonicalBase },
        ]),
      ],
    });
  }

  // 2c. Dedicated Legal Center Routes
  if (normalizedPath in LEGAL_PAGE_META) {
    const legal = LEGAL_PAGE_META[normalizedPath];
    return makeMeta({
      title: legal.title,
      description: legal.description,
      image: `${PUBLIC_SITE_URL}/og/coverly-home.png`,
      url: canonicalBase,
      jsonLd: [
        buildBreadcrumbSchema([
          { name: "Home", url: `${PUBLIC_SITE_URL}/` },
          { name: "Legal Center", url: `${PUBLIC_SITE_URL}/legal` },
          ...(normalizedPath !== "/legal" ? [{ name: legal.title.replace(/\s*\|\s*COVERLY$/, ""), url: canonicalBase }] : []),
        ]),
      ],
    });
  }

  // 2d. Dedicated Trust & Guide Pages
  if (normalizedPath in TRUST_GUIDE_META) {
    const guide = TRUST_GUIDE_META[normalizedPath];
    const schemas: Record<string, any>[] = [
      buildBreadcrumbSchema([
        { name: "Home", url: `${PUBLIC_SITE_URL}/` },
        { name: guide.title.replace(/\s*\|\s*COVERLY$/, ""), url: canonicalBase },
      ]),
    ];
    if (normalizedPath === "/faq") {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: PUBLIC_FAQ_ITEMS.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      });
    }
    return makeMeta({
      title: guide.title,
      description: guide.description,
      image: `${PUBLIC_SITE_URL}/og/coverly-home.png`,
      url: canonicalBase,
      jsonLd: schemas,
    });
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

        const { data: prod, error } = await q.single();
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

          const productSchema: Record<string, any> = {
            "@context": "https://schema.org",
            "@type": "Product",
            name: prod.title,
            description: cleanDescription(prod.description, `Wholesale B2B product ${prod.title} on COVERLY.`),
            image: [ogImage],
            url: canonicalBase,
            brand: biz?.name ? { "@type": "Organization", name: biz.name } : undefined,
          };
          if (prod.indicative_price && !Number.isNaN(Number(prod.indicative_price))) {
            productSchema.offers = {
              "@type": "Offer",
              priceCurrency: "INR",
              price: String(Number(prod.indicative_price)),
              availability: "https://schema.org/InStock",
              url: canonicalBase,
            };
          }

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
            jsonLd: [
              productSchema,
              buildBreadcrumbSchema([
                { name: "Home", url: `${PUBLIC_SITE_URL}/` },
                { name: "Products", url: `${PUBLIC_SITE_URL}/products` },
                { name: prod.title, url: canonicalBase },
              ]),
            ],
          });
        }
        // Explicitly return 404 when DB confirms record does not exist
        if (error || !prod) {
          return getNotFoundMeta(canonicalBase);
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
            jsonLd: [
              buildBreadcrumbSchema([
                { name: "Home", url: `${PUBLIC_SITE_URL}/` },
                { name: "Categories", url: `${PUBLIC_SITE_URL}/categories` },
                { name: cat.label, url: canonicalWithCat },
              ]),
            ],
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
      jsonLd: [
        buildBreadcrumbSchema([
          { name: "Home", url: `${PUBLIC_SITE_URL}/` },
          { name: "Wholesale Products", url: canonicalBase },
        ]),
      ],
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
      jsonLd: [
        buildBreadcrumbSchema([
          { name: "Home", url: `${PUBLIC_SITE_URL}/` },
          { name: "Categories", url: canonicalBase },
        ]),
      ],
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

        const { data: biz, error } = await q.single();
        if (biz) {
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

          const businessSchema = {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: biz.name,
            url: canonicalBase,
            image: ogImage,
            address: {
              "@type": "PostalAddress",
              addressLocality: biz.city || undefined,
              addressRegion: biz.state || undefined,
              addressCountry: "IN",
            },
          };

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
            jsonLd: [
              businessSchema,
              buildBreadcrumbSchema([
                { name: "Home", url: `${PUBLIC_SITE_URL}/` },
                { name: routeSegment.charAt(0).toUpperCase() + routeSegment.slice(1), url: `${PUBLIC_SITE_URL}/${routeSegment}` },
                { name: biz.name, url: canonicalBase },
              ]),
            ],
          });
        }
        if (error || !biz) {
          return getNotFoundMeta(canonicalBase);
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
  if (
    normalizedPath === "/services" ||
    normalizedPath === "/services/all" ||
    normalizedPath === "/services/search" ||
    normalizedPath === "/services/providers" ||
    normalizedPath === "/services/request"
  ) {
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
    let catName = "";
    let catDesc = "";

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
          catDesc = cat.description || "";
        }
      } catch {}
    }

    if (!catName) {
      return getNotFoundMeta(canonicalBase);
    }

    return makeMeta({
      title: `${catName} — Business Services | COVERLY`,
      description: cleanDescription(
        catDesc,
        `Hire verified professionals and agencies for ${catName} on COVERLY Business Services Marketplace.`
      ),
      image: buildDynamicOgImageUrl({
        type: "service",
        title: catName,
        subtitle: "Verified Agencies, Consultants & Business Professionals",
        meta: "Compare Proposals, Milestones & Deliverables on COVERLY",
        badge: "BUSINESS SERVICE CATEGORY",
      }),
      imageAlt: `${catName} — COVERLY Business Services`,
      url: canonicalBase,
      jsonLd: [
        buildBreadcrumbSchema([
          { name: "Home", url: `${PUBLIC_SITE_URL}/` },
          { name: "Business Services", url: `${PUBLIC_SITE_URL}/services` },
          { name: catName, url: canonicalBase },
        ]),
      ],
    });
  }

  const serviceProviderMatch = normalizedPath.match(/^\/services\/providers\/([^/]+)$/);
  if (serviceProviderMatch) {
    const id = decodeURIComponent(serviceProviderMatch[1]);
    if (insforge) {
      try {
        const { data: prov, error } = await insforge.database
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
        if (error || !prov) return getNotFoundMeta(canonicalBase);
      } catch {}
    }
  }

  const serviceDetailMatch = normalizedPath.match(/^\/services\/([^/]+)$/);
  if (serviceDetailMatch) {
    const idOrSlug = decodeURIComponent(serviceDetailMatch[1]);
    if (insforge) {
      try {
        const isUuid = UUID_REGEX.test(idOrSlug);
        let q = insforge.database
          .from("business_services")
          .select("id, title, slug, short_description, description, base_price, cover_image_url, image_url, is_active")
          .eq("is_active", true);
        q = isUuid ? q.eq("id", idOrSlug) : q.eq("slug", idOrSlug);

        const { data: svc, error } = await q.single();
        if (svc) {
          const realImg =
            resolvePublicImageUrl((svc as any).cover_image_url) ||
            resolvePublicImageUrl((svc as any).image_url);
          const priceStr = svc.base_price
            ? `Starting from INR ${Number(svc.base_price).toLocaleString("en-IN")}`
            : "Request Custom Proposal";

          const ogImage =
            realImg ||
            buildDynamicOgImageUrl({
              type: "service",
              title: svc.title,
              subtitle: "Verified B2B Professional Service",
              meta: `${priceStr} • Milestone-Protected Engagement`,
              badge: "BUSINESS SERVICE",
            });

          return makeMeta({
            title: `${svc.title} | COVERLY Business Services`,
            description: cleanDescription(
              (svc as any).short_description || svc.description,
              `${svc.title} by verified B2B professionals on COVERLY. ${priceStr}.`
            ),
            image: ogImage,
            imageAlt: `${svc.title} — COVERLY Business Services`,
            type: "article",
            url: canonicalBase,
            jsonLd: [
              {
                "@context": "https://schema.org",
                "@type": "Service",
                name: svc.title,
                description: cleanDescription((svc as any).short_description || svc.description),
                areaServed: "IN",
                url: canonicalBase,
              },
              buildBreadcrumbSchema([
                { name: "Home", url: `${PUBLIC_SITE_URL}/` },
                { name: "Business Services", url: `${PUBLIC_SITE_URL}/services` },
                { name: svc.title, url: canonicalBase },
              ]),
            ],
          });
        }
        if (error || !svc) return getNotFoundMeta(canonicalBase);
      } catch {}
    }

    return makeMeta({
      title: "Business Service Details | COVERLY",
      description: "Compare verified B2B service packages, deliverables & proposals on COVERLY.",
      image: `${PUBLIC_SITE_URL}/og/coverly-services.png`,
      url: canonicalBase,
    });
  }

  // 9. Specialized Public Listings & Hubs
  const knownPublicPrefixes = [
    "/raw-materials",
    "/packaging",
    "/import-export",
    "/logistics",
    "/transporters",
    "/sales-agents",
    "/sales-agent",
    "/track",
    "/about",
    "/how-it-works",
    "/contact",
  ];

  const isKnownPrefix = knownPublicPrefixes.some(
    (p) => normalizedPath === p || normalizedPath.startsWith(`${p}/`)
  );

  if (!isKnownPrefix) {
    // Unknown public route -> real HTTP 404 status code + custom animated COVERLY 404 UI
    return getNotFoundMeta(canonicalBase);
  }

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
              meta:
                [formatPriceBadge(item.indicative_price, item.unit), item.moq ? `MOQ: ${item.moq} ${item.unit || ""}` : ""]
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

  if (normalizedPath.startsWith("/sales-agents") || normalizedPath.startsWith("/sales-agent")) {
    return makeMeta({
      title: "Verified B2B Sales Representatives & Sourcing Agents | COVERLY",
      description:
        "Partner with verified regional B2B sales agents and sourcing specialists to accelerate procurement and factory deals on COVERLY.",
      image: `${PUBLIC_SITE_URL}/og/coverly-manufacturers.png`,
      url: canonicalBase,
    });
  }

  const staticTitles: Record<string, string> = {
    "/about": "About COVERLY — India's Connected B2B Business Ecosystem",
    "/how-it-works": "How COVERLY Works — Landed-Cost B2B Procurement Explained",
    "/contact": "Contact COVERLY — Enterprise Sourcing & Support Desk",
  };
  return makeMeta({
    title: staticTitles[normalizedPath] || "COVERLY — Verified B2B Sourcing & Wholesale Marketplace",
    description:
      "Learn how COVERLY connects buyers, retailers, manufacturers, wholesalers, distributors, logistics partners & business services with transparent landed costs.",
    image: `${PUBLIC_SITE_URL}/og/coverly-home.png`,
    url: canonicalBase,
  });
}

export function buildMetaTagsHtml(meta: PageMeta): string {
  const t = escapeHtml(meta.title);
  const d = escapeHtml(meta.description);
  const img = escapeHtml(meta.image);
  const imgAlt = escapeHtml(meta.imageAlt);
  const url = escapeHtml(meta.url);
  const site = escapeHtml(meta.siteName);
  const robots = escapeHtml(meta.robots);

  const lines = [
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
  ];

  if (Array.isArray(meta.jsonLd) && meta.jsonLd.length > 0) {
    for (const schema of meta.jsonLd) {
      const safeJson = JSON.stringify(schema).replace(/</g, "\\u003c");
      lines.push(`<script type="application/ld+json">${safeJson}</script>`);
    }
  }

  return lines.join("\n    ");
}

export function injectMetaIntoHtml(htmlTemplate: string, meta: PageMeta): string {
  const metaBlock = buildMetaTagsHtml(meta);
  const markerRegex = /<!--\s*COVERLY_SEO_META_START\s*-->[\s\S]*?<!--\s*COVERLY_SEO_META_END\s*-->/i;

  if (markerRegex.test(htmlTemplate)) {
    return htmlTemplate.replace(
      markerRegex,
      `<!-- COVERLY_SEO_META_START -->\n    ${metaBlock}\n    <!-- COVERLY_SEO_META_END -->`
    );
  }

  let out = htmlTemplate.replace(/<title>[\s\S]*?<\/title>/i, "");
  out = out.replace(/<meta\s+name="description"[^>]*>/i, "");
  return out.replace(/<\/head>/i, `    ${metaBlock}\n  </head>`);
}
