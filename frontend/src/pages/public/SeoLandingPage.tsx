import React from "react";
import { Link, useLocation } from "react-router-dom";
import { NotFoundPage } from "@/pages/shared/NotFoundPage";
import {
  Factory,
  Building2,
  Layers,
  Package,
  FileText,
  ShoppingBag,
  Store,
  Briefcase,
  Truck,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

interface LandingContent {
  path: string;
  badge: string;
  h1: string;
  intro: string;
  icon: React.ComponentType<{ className?: string }>;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  highlights: { title: string; detail: string }[];
  workflowSteps: string[];
  relatedLinks: { label: string; href: string }[];
}

const LANDING_DATA: Record<string, LandingContent> = {
  "/verified-manufacturers-india": {
    path: "/verified-manufacturers-india",
    badge: "VERIFIED MANUFACTURERS IN INDIA",
    h1: "Source Direct from Verified Indian Manufacturers",
    intro:
      "Connect directly with Indian factories across industrial steel, polymers, packaging, machinery, textiles, chemicals and healthcare supplies. Compare factory-direct pricing, MOQ tiers and GST-inclusive landed costs without middlemen.",
    icon: Factory,
    primaryCta: { label: "Browse Manufacturers Directory", href: "/manufacturers" },
    secondaryCta: { label: "Explore Wholesale Products", href: "/products" },
    highlights: [
      {
        title: "Document-Reviewed Business Profiles",
        detail: "Inspect each manufacturer's city, state, verification tier and active product catalogue before issuing an RFQ.",
      },
      {
        title: "Structured Multi-Item RFQs",
        detail: "Send exact technical specifications, target quantities and delivery destinations directly to relevant factories.",
      },
      {
        title: "Transparent Landed-Cost Comparison",
        detail: "Evaluate supplier quotes side-by-side with unit rate, MOQ, GST and freight estimates in one view.",
      },
    ],
    workflowSteps: [
      "Search manufacturers by product category, material specification or Indian industrial hub.",
      "Review active product catalogues, indicative tiered pricing and verification indicators.",
      "Submit a structured RFQ and compare landed-cost quotations before placing a purchase order.",
    ],
    relatedLinks: [
      { label: "Industrial Raw Material Suppliers", href: "/industrial-raw-material-suppliers" },
      { label: "Packaging Material Manufacturers", href: "/packaging-material-manufacturers" },
      { label: "How Verification Works", href: "/verification-info" },
    ],
  },
  "/wholesale-suppliers-india": {
    path: "/wholesale-suppliers-india",
    badge: "WHOLESALE SUPPLIERS IN INDIA",
    h1: "Wholesale Suppliers & Regional Distributors Across India",
    intro:
      "Discover verified bulk wholesalers and authorized distributors offering ready stock, tiered MOQ pricing and reliable pan-India dispatch for retailers, supermarkets and institutional buyers.",
    icon: Building2,
    primaryCta: { label: "Browse Wholesalers", href: "/wholesalers" },
    secondaryCta: { label: "Browse Distributors", href: "/distributors" },
    highlights: [
      {
        title: "Tiered MOQ & Volume Pricing",
        detail: "Compare indicative bulk pricing slabs across multiple wholesalers for recurring restock cycles.",
      },
      {
        title: "Multi-Branch Retail Procurement",
        detail: "Organize purchase lists, reorder reminders and branch delivery allocations inside the Retailer Workspace.",
      },
      {
        title: "Direct Trade Communication",
        detail: "Clarify packing sizes, GST billing and dispatch timelines directly with verified wholesale partners.",
      },
    ],
    workflowSteps: [
      "Filter wholesalers and distributors by product category and operating city/state.",
      "Shortlist verified suppliers and request bulk quotations for your target volume.",
      "Compare delivered landed cost and track fulfillment through to delivery.",
    ],
    relatedLinks: [
      { label: "Indian Wholesale Marketplace", href: "/indian-wholesale-marketplace" },
      { label: "Bulk Product Sourcing", href: "/bulk-product-sourcing" },
      { label: "Buyer Sourcing Guide", href: "/buyer-guide" },
    ],
  },
  "/industrial-raw-material-suppliers": {
    path: "/industrial-raw-material-suppliers",
    badge: "INDUSTRIAL RAW MATERIALS",
    h1: "Mill-Direct Industrial Raw Material Suppliers in India",
    intro:
      "Procure CRCA steel sheets, TMT rods, virgin polypropylene granules, industrial chemicals, yarns and bulk agricultural inputs with grade specifications and HS code clarity.",
    icon: Layers,
    primaryCta: { label: "Explore Raw Materials Hub", href: "/raw-materials" },
    secondaryCta: { label: "Submit Bulk Raw Material RFQ", href: "/raw-materials/rfq" },
    highlights: [
      {
        title: "Grade & Specification Clarity",
        detail: "Review technical standards (IS grades, MFI ratings, tensile specs) and packaging formats upfront.",
      },
      {
        title: "Bulk Tonnage RFQs",
        detail: "Broadcast bulk raw material tenders to matched mills and authorized raw material suppliers.",
      },
      {
        title: "Integrated Commercial Freight",
        detail: "Pair heavy bulk orders with verified commercial truck transporters and pan-India logistics partners.",
      },
    ],
    workflowSteps: [
      "Browse raw material grades and technical specifications in the Raw Materials Marketplace.",
      "Submit your tonnage, delivery pincode and quality requirements via Bulk RFQ.",
      "Compare landed cost including GST and heavy freight before confirming supply.",
    ],
    relatedLinks: [
      { label: "Verified Manufacturers in India", href: "/verified-manufacturers-india" },
      { label: "B2B Logistics & Transport Services", href: "/b2b-logistics-transport-services" },
      { label: "Raw Materials Catalog", href: "/products?category=raw-materials" },
    ],
  },
  "/packaging-material-manufacturers": {
    path: "/packaging-material-manufacturers",
    badge: "PACKAGING MATERIAL MANUFACTURERS",
    h1: "Custom & Bulk Packaging Material Manufacturers in India",
    intro:
      "Source 5-ply corrugated boxes, flexible pouches, rigid cartons, labels, shrink wraps and export pallets directly from Indian packaging suppliers.",
    icon: Package,
    primaryCta: { label: "Explore Packaging Hub", href: "/packaging" },
    secondaryCta: { label: "Request Custom Packaging Quote", href: "/packaging/rfq" },
    highlights: [
      {
        title: "Custom Dimensions & Printing Specs",
        detail: "Specify GSM, ply count, flute profile, lamination and print colors in custom packaging RFQs.",
      },
      {
        title: "Direct Factory MOQ Tiers",
        detail: "Compare unit economics across 1,000, 10,000 and bulk carton runs transparently.",
      },
      {
        title: "Packaging Design Services",
        detail: "Pair packaging manufacturing with verified branding and packaging design agencies on COVERLY.",
      },
    ],
    workflowSteps: [
      "Explore standard packaging categories or open the custom requirement form.",
      "Share box/pouch dimensions, material specs and target order quantity.",
      "Compare factory quotations and schedule repeat production runs.",
    ],
    relatedLinks: [
      { label: "Packaging Products Catalog", href: "/products?category=packaging-materials" },
      { label: "Business Services for Manufacturers", href: "/business-services-for-manufacturers" },
      { label: "Verified Manufacturers in India", href: "/verified-manufacturers-india" },
    ],
  },
  "/b2b-procurement-platform": {
    path: "/b2b-procurement-platform",
    badge: "ENTERPRISE B2B PROCUREMENT",
    h1: "Unified B2B Procurement, RFQ & Landed-Cost Platform",
    intro:
      "Manage your entire sourcing lifecycle in one workspace: discover verified suppliers, issue multi-item RFQs, run internal team approvals, compare true landed costs and track purchase orders.",
    icon: FileText,
    primaryCta: { label: "Explore Marketplace", href: "/products" },
    secondaryCta: { label: "How COVERLY Works", href: "/how-it-works" },
    highlights: [
      {
        title: "Role-Based Procurement Teams",
        detail: "Assign Procurement Manager, Purchase Staff and Finance / Accounts roles with branch-level accountability.",
      },
      {
        title: "True Landed-Cost Normalization",
        detail: "Eliminate hidden pricing surprises by comparing base rate, MOQ, GST and freight side-by-side.",
      },
      {
        title: "End-to-End Audit Trail",
        detail: "Keep purchase requisitions, supplier quotes, purchase orders and dispatch milestones organized.",
      },
    ],
    workflowSteps: [
      "Create your buyer or corporate account and configure branches and team roles.",
      "Issue structured RFQs and review comparative landed-cost quotation tables.",
      "Approve purchase requests, generate official POs and track delivery to completion.",
    ],
    relatedLinks: [
      { label: "Buyer Sourcing Guide", href: "/buyer-guide" },
      { label: "Bulk Product Sourcing", href: "/bulk-product-sourcing" },
      { label: "Frequently Asked Questions", href: "/faq" },
    ],
  },
  "/bulk-product-sourcing": {
    path: "/bulk-product-sourcing",
    badge: "BULK PRODUCT SOURCING",
    h1: "Bulk Product Sourcing for Retailers, Traders & Enterprises",
    intro:
      "Streamline high-volume product sourcing with verified Indian manufacturers and wholesalers. Compare MOQ pricing slabs, evaluate freight impact and build repeat restock pipelines.",
    icon: ShoppingBag,
    primaryCta: { label: "Browse All Bulk Products", href: "/products" },
    secondaryCta: { label: "Browse All Categories", href: "/categories" },
    highlights: [
      {
        title: "15+ Industrial & Commercial Verticals",
        detail: "Source across steel, polymers, healthcare disposables, textiles, food, agriculture and machinery.",
      },
      {
        title: "Direct RFQ Without Registration Friction",
        detail: "Post a sourcing requirement directly and convert it seamlessly into a full buyer account.",
      },
      {
        title: "Repeat Order Efficiency",
        detail: "Bookmark reliable suppliers, maintain sourcing shortlists and streamline recurring bulk reorders.",
      },
    ],
    workflowSteps: [
      "Search products by category, city, MOQ or indicative price range.",
      "Inspect product specifications, HS code and tiered bulk pricing.",
      "Request competing quotations and select the optimal landed-cost offer.",
    ],
    relatedLinks: [
      { label: "Wholesale Suppliers in India", href: "/wholesale-suppliers-india" },
      { label: "B2B Procurement Platform", href: "/b2b-procurement-platform" },
      { label: "Retailer Wholesale Catalog", href: "/wholesale" },
    ],
  },
  "/indian-wholesale-marketplace": {
    path: "/indian-wholesale-marketplace",
    badge: "INDIAN WHOLESALE MARKETPLACE",
    h1: "India's Connected B2B Wholesale & Industrial Marketplace",
    intro:
      "COVERLY unites buyers, retail store chains, factories, wholesalers, distributors, raw material suppliers, packaging makers, logistics carriers and business service providers in one transparent ecosystem.",
    icon: Store,
    primaryCta: { label: "Explore All Categories", href: "/categories" },
    secondaryCta: { label: "Register Your Business", href: "/auth/register" },
    highlights: [
      {
        title: "Every B2B Role Connected",
        detail: "Dedicated workspaces for buyers, retailers, suppliers, transporters and professional service providers.",
      },
      {
        title: "GST-Ready Trade Transparency",
        detail: "Clear GST rate visibility, HS codes and structured B2B quotation formats built for Indian MSMEs.",
      },
      {
        title: "Public Discovery, Protected Data",
        detail: "Public catalogues stay searchable while private quotes, KYC documents and purchase orders remain isolated.",
      },
    ],
    workflowSteps: [
      "Browse verified public directories across products, factories, wholesalers and services.",
      "Compare multiple quotes transparently before committing to any purchase.",
      "Coordinate dispatch, commercial transport and compliance services on one platform.",
    ],
    relatedLinks: [
      { label: "Verified Manufacturers in India", href: "/verified-manufacturers-india" },
      { label: "Wholesale Suppliers in India", href: "/wholesale-suppliers-india" },
      { label: "Supplier Onboarding Guide", href: "/supplier-guide" },
    ],
  },
  "/business-services-for-manufacturers": {
    path: "/business-services-for-manufacturers",
    badge: "BUSINESS SERVICES FOR MANUFACTURERS",
    h1: "Professional Business Services for Indian Factories & MSMEs",
    intro:
      "Hire verified agencies, CAs, legal advisors, branding studios and IT teams for company & GST registration, statutory audits, factory compliance, packaging design and ERP automation.",
    icon: Briefcase,
    primaryCta: { label: "Explore Business Services", href: "/services" },
    secondaryCta: { label: "Post a Service Requirement", href: "/services/request" },
    highlights: [
      {
        title: "11 Specialized B2B Service Categories",
        detail: "Covering registration & compliance, legal, accounting/CA, branding, technology/IT and supply chain.",
      },
      {
        title: "Structured Proposals & Milestones",
        detail: "Compare clear scopes of work, deliverable timelines and milestone-based engagements.",
      },
      {
        title: "Verified Provider Profiles",
        detail: "Review provider specializations, cities served and completed project feedback before hiring.",
      },
    ],
    workflowSteps: [
      "Select a business service category or post your custom corporate requirement.",
      "Receive and compare structured proposals from relevant agencies and professionals.",
      "Track deliverables, revisions and completion milestones in your workspace.",
    ],
    relatedLinks: [
      { label: "Accounting & Finance Services", href: "/services/category/accounting-finance" },
      { label: "Registration & Compliance", href: "/services/category/business-registration-compliance" },
      { label: "Business Services Terms", href: "/business-services-terms" },
    ],
  },
  "/b2b-logistics-transport-services": {
    path: "/b2b-logistics-transport-services",
    badge: "B2B LOGISTICS & TRANSPORT",
    h1: "Pan-India B2B Freight Logistics & Commercial Truck Booking",
    intro:
      "Compare multi-modal freight rates, book verified commercial transporters and track industrial consignments with live status updates and electronic Proof of Delivery (e-POD).",
    icon: Truck,
    primaryCta: { label: "Explore Logistics Marketplace", href: "/logistics" },
    secondaryCta: { label: "Book Commercial Transporters", href: "/transporters" },
    highlights: [
      {
        title: "FTL, PTL & Multi-Modal Freight",
        detail: "Connect with verified logistics partners covering major Indian industrial corridors and ports.",
      },
      {
        title: "Direct Commercial Fleet Access",
        detail: "Compare carrier quotations by vehicle capacity, route coverage and transit time.",
      },
      {
        title: "Public Consignment Tracking",
        detail: "Track shipment milestones securely while protecting private shipper and driver PII.",
      },
    ],
    workflowSteps: [
      "Enter origin, destination, cargo weight/volume and vehicle type requirements.",
      "Compare freight or commercial vehicle quotations from verified carriers.",
      "Confirm booking and track dispatch through to electronic Proof of Delivery.",
    ],
    relatedLinks: [
      { label: "Track Consignment", href: "/logistics/track" },
      { label: "Shipping & Logistics Policy", href: "/shipping-and-logistics-policy" },
      { label: "Import & Export Hub", href: "/import-export" },
    ],
  },
};

export const SeoLandingPage: React.FC = () => {
  const location = useLocation();
  const cleanPath = location.pathname.replace(/\/+$/, "");
  const data = LANDING_DATA[cleanPath];

  if (!data) {
    return <NotFoundPage />;
  }

  const Icon = data.icon;

  return (
    <div className="bg-[#FAF9F5] min-h-screen font-sans">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/35 text-amber-300 text-[11px] font-bold uppercase tracking-wider mb-5">
            <Icon className="w-3.5 h-3.5" />
            {data.badge}
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight max-w-3xl">
            {data.h1}
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            {data.intro}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to={data.primaryCta.href}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold transition"
            >
              {data.primaryCta.label}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to={data.secondaryCta.href}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition"
            >
              {data.secondaryCta.label}
            </Link>
          </div>
        </div>
      </section>

      {/* Key Capabilities */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {data.highlights.map((h) => (
            <div
              key={h.title}
              className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs"
            >
              <ShieldCheck className="w-5 h-5 text-blue-900 mb-3" />
              <h2 className="text-sm font-bold text-stone-900">{h.title}</h2>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">{h.detail}</p>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-2xs">
          <h2 className="text-lg font-bold text-stone-900 mb-4">
            How Sourcing Works on COVERLY
          </h2>
          <ol className="space-y-3">
            {data.workflowSteps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-stone-700">
                <span className="w-6 h-6 rounded-full bg-blue-950 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Internal SEO Cross-Links */}
        <div className="bg-stone-100/80 border border-stone-200 rounded-2xl p-6">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 mb-3">
            Related B2B Sourcing Resources
          </h2>
          <div className="flex flex-wrap gap-2.5">
            {data.relatedLinks.map((lnk) => (
              <Link
                key={lnk.href}
                to={lnk.href}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-stone-200 hover:border-blue-900/40 text-xs font-semibold text-stone-800 hover:text-blue-950 transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                {lnk.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
