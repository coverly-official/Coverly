import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateOgPngBuffer } from "../backend/src/lib/og-image-generator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../frontend/public/og");

fs.mkdirSync(outDir, { recursive: true });

const STATIC_BANNERS = [
  {
    filename: "coverly-home.png",
    type: "home",
    badge: "INDIA'S CONNECTED B2B ECOSYSTEM",
    title: "Compare True Landed Costs & Source Direct from Verified Suppliers",
    subtitle:
      "Connect with GST-verified Indian manufacturers, wholesalers, distributors, logistics partners & business services.",
    meta: "Unit Price + MOQ + GST + Freight  •  Zero Brokerage B2B Procurement",
  },
  {
    filename: "coverly-products.png",
    type: "product",
    badge: "WHOLESALE PRODUCT CATALOG",
    title: "Bulk Wholesale Products & Industrial Supplies Direct from Factories",
    subtitle:
      "Compare tiered MOQ pricing, technical specifications, HS codes & verified landed-cost quotations.",
    meta: "Raw Materials  •  Machinery  •  Packaging  •  Steel  •  Chemicals  •  Healthcare",
  },
  {
    filename: "coverly-manufacturers.png",
    type: "manufacturer",
    badge: "VERIFIED MANUFACTURERS",
    title: "Factory-Direct Sourcing from Verified Indian Manufacturers",
    subtitle:
      "Inspect production capabilities, certifications, GST verification & submit multi-item bulk RFQs.",
    meta: "Direct Factory Pricing  •  Verified MSME & Enterprise Manufacturers",
  },
  {
    filename: "coverly-wholesalers.png",
    type: "wholesaler",
    badge: "WHOLESALERS & DISTRIBUTORS",
    title: "Bulk Wholesalers & Authorized Regional Distributors Across India",
    subtitle:
      "Source ready wholesale stock for retail chains, supermarkets & commercial buyers with transparent MOQs.",
    meta: "Tiered Bulk Discounts  •  Multi-State Fulfillment  •  Verified Trade Partners",
  },
  {
    filename: "coverly-services.png",
    type: "service",
    badge: "BUSINESS SERVICES MARKETPLACE",
    title: "Hire Verified Legal, CA, Branding, IT & Supply Chain Professionals",
    subtitle:
      "Company & GST registration, statutory audits, packaging design, ERP software & corporate compliance.",
    meta: "Compare Proposals  •  Milestone-Based Deliverables  •  Verified Agencies",
  },
  {
    filename: "coverly-categories.png",
    type: "category",
    badge: "INDUSTRIAL & WHOLESALE CATEGORIES",
    title: "Explore All B2B Sourcing Categories & Wholesale Verticals",
    subtitle:
      "Agriculture, Food, Packaging, Machinery, Steel, Chemicals, Textiles, Electronics & Healthcare Supplies.",
    meta: "15+ Verified B2B Verticals  •  Instant Multi-Supplier RFQ Matching",
  },
  {
    filename: "coverly-logistics.png",
    type: "logistics",
    badge: "LOGISTICS & TRANSPORTERS",
    title: "Pan-India B2B Freight, Warehousing & Commercial Fleet Booking",
    subtitle:
      "Compare logistics quotes, book verified commercial trucks & track live consignments with e-POD.",
    meta: "FTL / PTL Freight  •  Verified Transporters  •  Real-Time Consignment Tracking",
  },
  {
    filename: "coverly-trade.png",
    type: "trade",
    badge: "RAW MATERIALS • PACKAGING • GLOBAL TRADE",
    title: "Industrial Raw Materials, Custom Packaging & Import-Export Hub",
    subtitle:
      "Mill-direct metals & polymers, custom printed cartons, Incoterms quotes & international trade compliance.",
    meta: "FOB / CIF Quotes  •  HS Code Verified  •  Domestic & Cross-Border B2B",
  },
];

async function run() {
  for (const b of STATIC_BANNERS) {
    const buf = await generateOgPngBuffer({
      type: b.type,
      badge: b.badge,
      title: b.title,
      subtitle: b.subtitle,
      meta: b.meta,
    });
    const outPath = path.join(outDir, b.filename);
    fs.writeFileSync(outPath, buf);
    console.log(`Generated ${b.filename} (${(buf.length / 1024).toFixed(1)} KB)`);
  }
}

run().catch((err) => {
  console.error("Failed to generate static OG images:", err);
  process.exit(1);
});
