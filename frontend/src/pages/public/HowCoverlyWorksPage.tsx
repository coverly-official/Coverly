import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, Search, BarChart3, ShieldCheck, Truck } from "lucide-react";

const steps = [
  {
    title: "Discover verified buyers and suppliers",
    description: "Search broad categories, trusted business profiles, and live procurement opportunities across India.",
    icon: Search,
  },
  {
    title: "Compare landed-cost offers",
    description: "Review RFQs, compare active quotations, and evaluate freight, GST, and delivery economics side-by-side.",
    icon: BarChart3,
  },
  {
    title: "Manage orders and compliance",
    description: "Track fulfillment, verification status, and business workflows from one secure workspace.",
    icon: Truck,
  },
];

export const HowCoverlyWorksPage: React.FC = () => (
  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div className="mb-10 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">How COVERLY works</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-stone-900">A simpler way to buy, sell, and scale B2B trade</h1>
      <p className="mt-3 max-w-2xl mx-auto text-sm text-stone-600">
        COVERLY combines sourcing, verification, quotation management, and operational visibility into one platform built for modern wholesale teams.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      {steps.map(({ title, description, icon: Icon }, index) => (
        <div key={title} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-stone-900 text-white">
            <Icon className="h-5 w-5" />
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Step {index + 1}</div>
          <h3 className="mt-2 text-lg font-semibold text-stone-900">{title}</h3>
          <p className="mt-2 text-sm text-stone-600">{description}</p>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-stone-900 mb-4">
          <BadgeCheck className="h-4 w-4 text-emerald-600" />
          Built for trust and action
        </div>
        <ul className="space-y-3 text-sm text-stone-600">
          <li className="flex gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600" /><span>Verified supplier and buyer profiles with compliance-aware onboarding.</span></li>
          <li className="flex gap-3"><BadgeCheck className="mt-0.5 h-4 w-4 text-emerald-600" /><span>Transparent vendor comparison across quantity, freight, tax, and lead time.</span></li>
          <li className="flex gap-3"><Truck className="mt-0.5 h-4 w-4 text-emerald-600" /><span>Order visibility from RFQ to dispatch, delivery, and post-purchase milestones.</span></li>
        </ul>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
        <h3 className="text-lg font-semibold text-stone-900 mb-4">Typical workflow</h3>
        <div className="space-y-4">
          {[
            "Create an RFQ with your quantity, destination city, and delivery expectations.",
            "Receive competitive quotations and compare landed costs with trusted suppliers.",
            "Approve a quote, place the order, and track dispatch through completion.",
          ].map((item, index) => (
            <div key={item} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-[10px] font-bold text-white">{index + 1}</div>
              <p className="text-sm text-stone-600">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="text-center">
      <Link to="/auth/register?role=buyer" className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-5 py-3 text-xs font-semibold text-white hover:bg-stone-800 transition">
        Start sourcing today <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  </div>
);
