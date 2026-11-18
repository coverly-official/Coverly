import React from "react";
import { Link, useLocation } from "react-router-dom";
import { NotFoundPage } from "@/pages/shared/NotFoundPage";
import {
  ShieldCheck,
  BookOpen,
  Factory,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  FileCheck,
  Scale,
} from "lucide-react";

const FAQS = [
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

export const TrustGuidesPage: React.FC = () => {
  const location = useLocation();
  const path = location.pathname.replace(/\/+$/, "");

  if (path === "/faq") {
    return (
      <div className="bg-[#FAF9F5] min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-blue-950 text-white rounded-2xl p-8">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-3">
              <HelpCircle className="w-3.5 h-3.5" />
              COVERLY Help & FAQ
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Frequently Asked Questions
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2">
              Honest answers on how COVERLY&apos;s B2B sourcing, verification, landed-cost RFQs and privacy controls operate.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((item) => (
              <div key={item.q} className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs">
                <h2 className="text-sm font-bold text-stone-900">{item.q}</h2>
                <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link to="/help-center" className="px-4 py-2.5 rounded-xl bg-blue-950 text-white text-xs font-bold">
              Visit Help Center
            </Link>
            <Link to="/legal" className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-800 text-xs font-semibold">
              Open Legal Center
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (path === "/buyer-guide") {
    return (
      <div className="bg-[#FAF9F5] min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-blue-950 text-white rounded-2xl p-8">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-3">
              <BookOpen className="w-3.5 h-3.5" />
              B2B Buyer Guide
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              How to Source & Compare Landed Costs on COVERLY
            </h1>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-4 text-xs sm:text-sm text-stone-700">
            <p>
              1. <strong>Discover Verified Suppliers:</strong> Search wholesale products, raw materials, packaging or manufacturers by category, specification and city.
            </p>
            <p>
              2. <strong>Submit a Structured RFQ:</strong> Specify required quantities, technical standards, packaging needs and delivery pincode.
            </p>
            <p>
              3. <strong>Compare True Landed Cost:</strong> Review competing quotations normalized across unit price, MOQ, applicable GST and estimated freight.
            </p>
            <p>
              4. <strong>Manage Internal Approvals & Orders:</strong> Configure Procurement Manager, Purchase Staff and Finance roles inside your Buyer or Retailer workspace.
            </p>
            <div className="pt-4 flex flex-wrap gap-3">
              <Link to="/products" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-950 text-white text-xs font-bold">
                Explore Marketplace <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link to="/buyer-terms" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-300 text-stone-800 text-xs font-semibold">
                Read Buyer Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (path === "/supplier-guide") {
    return (
      <div className="bg-[#FAF9F5] min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-blue-950 text-white rounded-2xl p-8">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-3">
              <Factory className="w-3.5 h-3.5" />
              Supplier & Manufacturer Guide
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              Grow Your B2B Wholesale & Factory Sales on COVERLY
            </h1>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-4 text-xs sm:text-sm text-stone-700">
            <p>
              1. <strong>Register & Onboard Your Business:</strong> Select Manufacturer, Wholesaler, Distributor, Raw Material, Packaging or Service Provider during registration.
            </p>
            <p>
              2. <strong>Complete Business Verification:</strong> Upload valid business registration and tax documents securely for review by COVERLY&apos;s verification team.
            </p>
            <p>
              3. <strong>Publish Detailed Catalogues:</strong> Add clear product specifications, HS codes, GST rates, tiered MOQ pricing and authentic product photos.
            </p>
            <p>
              4. <strong>Quote Structured RFQs & Fulfill Orders:</strong> Submit transparent landed-cost quotes and update order production, QC and dispatch milestones.
            </p>
            <div className="pt-4 flex flex-wrap gap-3">
              <Link to="/auth/register?role=manufacturer" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-950 text-white text-xs font-bold">
                Register as Supplier <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link to="/supplier-terms" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-300 text-stone-800 text-xs font-semibold">
                Read Supplier Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (path === "/verification-info") {
    return (
      <div className="bg-[#FAF9F5] min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-blue-950 text-white rounded-2xl p-8">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-3">
              <FileCheck className="w-3.5 h-3.5" />
              Trust & Verification Framework
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              How Business Verification Works on COVERLY
            </h1>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-4 text-xs sm:text-sm text-stone-700">
            <p>
              COVERLY clearly displays each supplier&apos;s actual database verification status — unverified profiles are never misrepresented as verified.
            </p>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span><strong>Unverified:</strong> Account registered; KYC/business documents have not yet been reviewed.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span><strong>Document Verified:</strong> Supporting registration documents (such as GSTIN/business registration) have been reviewed by our verification team.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span><strong>Factory / Enterprise Verified:</strong> Extended operational and manufacturing documentation reviewed.</span>
              </li>
            </ul>
            <p className="text-xs text-stone-500 pt-2 border-t border-stone-100">
              Note: Verification indicators reflect document review at the time of check and are not a government certification or financial guarantee. Always review samples and commercial terms prior to payment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (path === "/help-center") {
    return (
      <div className="bg-[#FAF9F5] min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-blue-950 text-white rounded-2xl p-8">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              COVERLY Help Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              Platform Guides, Policies & Support Channels
            </h1>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: "Buyer Sourcing Guide", desc: "Learn how to issue RFQs, compare landed costs & manage teams.", href: "/buyer-guide" },
              { title: "Supplier Guide", desc: "How factories, wholesalers & distributors onboard and quote.", href: "/supplier-guide" },
              { title: "Verification Info", desc: "Understand COVERLY verification tiers & document checks.", href: "/verification-info" },
              { title: "Frequently Asked Questions", desc: "Quick answers on workflows, privacy & intermediary scope.", href: "/faq" },
              { title: "Legal Center", desc: "Privacy Policy, Terms, Cookie Policy & Grievance Redressal.", href: "/legal" },
              { title: "Contact Support Desk", desc: "Reach COVERLY support for operational or account assistance.", href: "/contact" },
            ].map((card) => (
              <Link
                key={card.href}
                to={card.href}
                className="bg-white border border-stone-200 hover:border-blue-900/40 rounded-xl p-5 shadow-2xs transition flex flex-col justify-between"
              >
                <div>
                  <h2 className="text-sm font-bold text-stone-900">{card.title}</h2>
                  <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">{card.desc}</p>
                </div>
                <div className="mt-4 text-xs font-semibold text-blue-900 inline-flex items-center gap-1">
                  Open <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <NotFoundPage />;
};
