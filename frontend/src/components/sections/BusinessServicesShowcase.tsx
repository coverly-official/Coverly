import React from "react";
import { Link } from "react-router-dom";
import {
  Scale,
  Calculator,
  Palette,
  Truck,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export const BusinessServicesShowcase: React.FC = () => {
  const highlights = [
    {
      icon: Scale,
      title: "Registration & Legal",
      desc: "Company registration, GST & MSME setup, trademarking, and regulatory licensing.",
      count: "11 Services",
      slug: "business-registration-legal",
    },
    {
      icon: Calculator,
      title: "Accounting & Tax",
      desc: "Bookkeeping, GST returns, income tax filings, audits, and business loans.",
      count: "8 Services",
      slug: "accounting-finance",
    },
    {
      icon: Palette,
      title: "Branding & Packaging",
      desc: "Logo design, packaging mockups, commercial product photography, and websites.",
      count: "10 Services",
      slug: "branding-marketing",
    },
    {
      icon: Truck,
      title: "Supply Chain & Logistics",
      desc: "Bulk freight forwarding, bonded warehousing, and customs clearance support.",
      count: "7 Services",
      slug: "logistics-supply-chain",
    },
  ];

  return (
    <section className="py-20 bg-[#F4F1EA]/60 border-y border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-200 text-stone-800 text-xs font-semibold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-stone-900" />
              Corporate Services Marketplace
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight">
              Essential Services to Start, Operate & Scale
            </h2>
            <p className="text-stone-600 text-sm max-w-2xl mt-2">
              Beyond raw materials and wholesale sourcing, discover verified professional partners
              for company compliance, taxation, private labelling, and supply chain logistics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              Explore Services Directory
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/provider/onboarding"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-stone-100 text-stone-900 text-xs font-semibold rounded-lg border border-stone-300 transition"
            >
              Partner with Us
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                to={`/services/category/${item.slug}`}
                className="group bg-white p-6 rounded-xl border border-stone-200 shadow-xs hover:shadow-md hover:border-stone-400 transition flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-stone-100 group-hover:bg-stone-900 group-hover:text-white transition flex items-center justify-center text-stone-800 mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-stone-900 text-sm mb-1.5 group-hover:text-stone-900">
                    {item.title}
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="font-medium text-stone-500">{item.count}</span>
                  <span className="text-stone-900 font-semibold group-hover:translate-x-0.5 transition flex items-center gap-1">
                    Browse →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Benefits bar */}
        <div className="mt-12 bg-white rounded-xl border border-stone-200 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-stone-700">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-stone-900 block">Verified Corporate Specialists</span>
              Strict qualification check of CAs, CSs, trademark attorneys & consultants.
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-stone-900 block">Transparent Upfront Quotations</span>
              Receive detailed deliverable breakdowns without hidden fee surprises.
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-stone-900 block">Integrated Milestones</span>
              Track service progress and deliverable sign-offs from your unified dashboard.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
