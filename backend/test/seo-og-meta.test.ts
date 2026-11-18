import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolvePageMeta,
  injectMetaIntoHtml,
  resolvePublicImageUrl,
  PUBLIC_SITE_URL,
} from "../src/lib/seo-meta.js";
import { generateOgPngBuffer } from "../src/lib/og-image-generator.js";

const SAMPLE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <!-- COVERLY_SEO_META_START -->
    <title>Default</title>
    <!-- COVERLY_SEO_META_END -->
  </head>
  <body><div id="root"></div></body>
</html>`;

describe("COVERLY Open Graph & WhatsApp Rich Preview System", () => {
  it("generates complete OG, Twitter, and Canonical tags for Homepage", async () => {
    const meta = await resolvePageMeta("/");
    const html = injectMetaIntoHtml(SAMPLE_HTML, meta);

    assert.equal(meta.url, `${PUBLIC_SITE_URL}/`);
    assert.equal(meta.image, `${PUBLIC_SITE_URL}/og/coverly-home.png`);
    assert.equal(meta.imageWidth, 1200);
    assert.equal(meta.imageHeight, 630);
    assert.equal(meta.siteName, "COVERLY");
    assert.match(html, /property="og:title"/);
    assert.match(html, /property="og:description"/);
    assert.match(html, /property="og:image" content="https:\/\/coverly-indol\.vercel\.app\/og\/coverly-home\.png"/);
    assert.match(html, /property="og:image:width" content="1200"/);
    assert.match(html, /property="og:image:height" content="630"/);
    assert.match(html, /property="og:site_name" content="COVERLY"/);
    assert.match(html, /name="twitter:card" content="summary_large_image"/);
    assert.match(html, /rel="canonical" href="https:\/\/coverly-indol\.vercel\.app\/"/);
  });

  it("generates dedicated metadata for Categories, Manufacturers, Wholesalers, Services, Logistics & Trade hubs", async () => {
    const routes = [
      { path: "/categories", expectedImg: "/og/coverly-categories.png" },
      { path: "/manufacturers", expectedImg: "/og/coverly-manufacturers.png" },
      { path: "/wholesalers", expectedImg: "/og/coverly-wholesalers.png" },
      { path: "/services", expectedImg: "/og/coverly-services.png" },
      { path: "/logistics", expectedImg: "/og/coverly-logistics.png" },
      { path: "/import-export", expectedImg: "/og/coverly-trade.png" },
      { path: "/products", expectedImg: "/og/coverly-products.png" },
    ];

    for (const r of routes) {
      const meta = await resolvePageMeta(r.path);
      assert.ok(meta.image.endsWith(r.expectedImg), `Expected ${r.path} image to end with ${r.expectedImg}, got ${meta.image}`);
      assert.equal(meta.url, `${PUBLIC_SITE_URL}${r.path}`);
      assert.equal(meta.robots, "index, follow");
    }
  });

  it("generates dynamic category-specific metadata for Business Services category pages", async () => {
    const meta = await resolvePageMeta("/services/category/accounting-finance");
    assert.match(meta.title, /Accounting & Finance/);
    assert.match(meta.image, /\/api\/og-image\?/);
    assert.match(meta.image, /type=service/);
    assert.equal(meta.url, `${PUBLIC_SITE_URL}/services/category/accounting-finance`);
  });

  it("never leaks private data and marks private/admin routes noindex, nofollow", async () => {
    for (const priv of ["/admin/dashboard", "/admin/finance", "/buyer/orders", "/retailer/dashboard", "/supplier/rfqs", "/auth/login"]) {
      const meta = await resolvePageMeta(priv);
      assert.equal(meta.robots, "noindex, nofollow");
      assert.equal(meta.image, `${PUBLIC_SITE_URL}/og/coverly-home.png`);
      assert.doesNotMatch(meta.description.toLowerCase(), /password|token|secret|gstin/);
    }
  });

  it("validates public raster HTTPS image URLs and rejects unsafe or non-WhatsApp-compatible URLs", () => {
    assert.equal(resolvePublicImageUrl("https://cdn.example.com/product.jpg"), "https://cdn.example.com/product.jpg");
    assert.equal(resolvePublicImageUrl("https://cdn.example.com/banner.png"), "https://cdn.example.com/banner.png");
    assert.equal(resolvePublicImageUrl("http://insecure.example.com/a.jpg"), null);
    assert.equal(resolvePublicImageUrl("https://localhost:5000/a.png"), null);
    assert.equal(resolvePublicImageUrl("https://cdn.example.com/logo.svg"), null);
    assert.equal(resolvePublicImageUrl("https://storage.example.com/private.png?token=secret123"), null);
    assert.equal(resolvePublicImageUrl(""), null);
  });

  it("renders a valid 1200x630 PNG buffer dynamically via Satori + Resvg WASM", async () => {
    const png = await generateOgPngBuffer({
      type: "product",
      badge: "RAW MATERIALS",
      title: "Cold Rolled Close Annealed Steel Sheets (CRCA Grade D, 1.2mm)",
      subtitle: "Supplied by Godavari Steel & Construction Formworks",
      meta: "INR 61,500 / Metric Tons • MOQ: 5 • Raipur, Chhattisgarh",
    });

    // Verify PNG signature (89 50 4E 47 0D 0A 1A 0A)
    assert.equal(png[0], 0x89);
    assert.equal(png[1], 0x50);
    assert.equal(png[2], 0x4e);
    assert.equal(png[3], 0x47);

    // Verify IHDR exact width (1200) and height (630)
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    assert.equal(width, 1200);
    assert.equal(height, 630);

    // Verify compressed size is WhatsApp-friendly (< 300 KB)
    assert.ok(png.length > 5_000 && png.length < 300_000, `Expected PNG between 5KB and 300KB, got ${png.length} bytes`);
  });

  it("returns real HTTP 404 metadata and noindex for /404 and unknown routes", async () => {
    const explicit404 = await resolvePageMeta("/404");
    assert.equal(explicit404.statusCode, 404);
    assert.equal(explicit404.robots, "noindex, follow");

    const unknownRoute = await resolvePageMeta("/totally-nonexistent-page-xyz-123");
    assert.equal(unknownRoute.statusCode, 404);
    assert.equal(unknownRoute.robots, "noindex, follow");
    assert.match(unknownRoute.title, /404/);
  });

  it("injects JSON-LD structured data for Homepage, SEO landing pages, Legal Center, and FAQ", async () => {
    const home = await resolvePageMeta("/");
    const homeHtml = injectMetaIntoHtml(SAMPLE_HTML, home);
    assert.match(homeHtml, /application\/ld\+json/);
    assert.match(homeHtml, /"Organization"/);
    assert.match(homeHtml, /"WebSite"/);

    const faq = await resolvePageMeta("/faq");
    const faqHtml = injectMetaIntoHtml(SAMPLE_HTML, faq);
    assert.equal(faq.statusCode, 200);
    assert.match(faqHtml, /"FAQPage"/);

    const landing = await resolvePageMeta("/verified-manufacturers-india");
    assert.equal(landing.statusCode, 200);
    assert.match(landing.title, /Verified Manufacturers in India/);

    const privacy = await resolvePageMeta("/privacy-policy");
    assert.equal(privacy.statusCode, 200);
    assert.match(privacy.title, /Privacy Policy/);
  });
});
