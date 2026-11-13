import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Shield, Calculator, ArrowRight } from "lucide-react";

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
          Re-architecting B2B Wholesale Procurement
        </h1>
        <p className="mt-4 text-base text-stone-600 leading-relaxed">
          COVERLY connects buyers directly with certified manufacturers, wholesalers, and distributors across India, eliminating guesswork through real-time landed-cost comparison.
        </p>
      </div>

      {/* The Core Problem & Our Solution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-xs">
          <h3 className="text-lg font-bold text-stone-900 mb-3">The Traditional Challenge</h3>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Wholesale sourcing has historically been fragmented across informal WhatsApp channels, opaque ex-factory quotes, unpredictable freight surcharges, and unaccounted GST variations that lead to surprise cost overruns at delivery.
          </p>
        </div>

        <div className="bg-stone-900 text-white rounded-2xl p-8 shadow-xs">
          <h3 className="text-lg font-bold mb-3">The COVERLY Solution</h3>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            COVERLY computes the <strong>True Landed Cost per Unit</strong> by synthesizing base unit price, tiered volume discounts, freight logistics from factory pincode, and exact GST rates into one transparent side-by-side comparison matrix.
          </p>
        </div>
      </div>

      {/* 4 Pillars */}
      <div className="mb-16">
        <h2 className="text-xl font-bold text-stone-900 text-center mb-8">
          The Four Pillars of COVERLY
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border border-stone-200 bg-white rounded-xl p-6">
            <div className="text-xs font-bold text-stone-400 mb-2">01</div>
            <h4 className="font-bold text-sm text-stone-900 mb-1">DISCOVER</h4>
            <p className="text-xs text-stone-600">Access verified factory directories and transparent catalogs.</p>
          </div>
          <div className="border border-stone-200 bg-white rounded-xl p-6">
            <div className="text-xs font-bold text-stone-400 mb-2">02</div>
            <h4 className="font-bold text-sm text-stone-900 mb-1">CONNECT</h4>
            <p className="text-xs text-stone-600">Submit multi-item structured RFQs directly or via broadcast matching.</p>
          </div>
          <div className="border border-stone-200 bg-white rounded-xl p-6">
            <div className="text-xs font-bold text-stone-400 mb-2">03</div>
            <h4 className="font-bold text-sm text-stone-900 mb-1">COMPARE</h4>
            <p className="text-xs text-stone-600">Analyze itemized landed costs with freight and GST pre-calculated.</p>
          </div>
          <div className="border border-stone-200 bg-white rounded-xl p-6">
            <div className="text-xs font-bold text-stone-400 mb-2">04</div>
            <h4 className="font-bold text-sm text-stone-900 mb-1">MANAGE</h4>
            <p className="text-xs text-stone-600">One-click quotation conversion, milestone tracking, and dispatch proof.</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-stone-100 rounded-2xl p-8 text-center">
        <h3 className="text-lg font-bold text-stone-900 mb-2">Ready to streamline your business procurement?</h3>
        <p className="text-xs text-stone-600 max-w-md mx-auto mb-6">
          Join thousands of enterprises and verified factories optimizing their supply chain on COVERLY.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/auth/register?role=buyer"
            className="text-xs font-semibold px-4 py-2.5 bg-stone-900 text-white hover:bg-stone-800 rounded-lg transition"
          >
            Start Sourcing as Buyer
          </Link>
          <Link
            to="/auth/register?role=manufacturer"
            className="text-xs font-semibold px-4 py-2.5 bg-white border border-stone-300 text-stone-800 hover:bg-stone-50 rounded-lg transition"
          >
            Register as Supplier
          </Link>
        </div>
      </div>
    </div>
  );
};
