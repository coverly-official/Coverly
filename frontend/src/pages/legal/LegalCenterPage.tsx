import React from "react";
import { Link } from "react-router-dom";
import { LEGAL_DOCUMENTS } from "@/lib/legal-documents";
import { ShieldCheck, FileText, ArrowRight, Scale, AlertCircle } from "lucide-react";

const CATEGORIES = [
  "Core Governance",
  "Marketplace Terms",
  "Orders & Logistics",
  "Rights & Compliance",
] as const;

export const LegalCenterPage: React.FC = () => {
  return (
    <div className="bg-[#FAF9F5] min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-blue-950 text-white rounded-2xl p-8 sm:p-10 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/35 text-amber-300 text-[11px] font-bold uppercase tracking-wider mb-4">
            <Scale className="w-3.5 h-3.5" />
            COVERLY Legal & Compliance Center
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Platform Policies, Terms & Data Protection
          </h1>
          <p className="text-sm text-slate-300 mt-3 max-w-2xl leading-relaxed">
            Transparent governance documentation covering COVERLY&apos;s B2B discovery, sourcing,
            supplier verification, business services, logistics, privacy and grievance redressal
            frameworks.
          </p>
        </div>

        {/* Honest Draft Legal Review Banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Legal Review Status:</span> All policies below are
            structured to accurately reflect COVERLY&apos;s technical and operational workflows and
            include clearly marked placeholders for final corporate entity, GSTIN/CIN, registered
            office and Grievance Officer details pending final review by qualified legal counsel.
          </div>
        </div>

        {/* Categorized Legal Document Directory */}
        {CATEGORIES.map((cat) => {
          const docs = LEGAL_DOCUMENTS.filter((d) => d.category === cat);
          return (
            <section key={cat} className="space-y-4">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-stone-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-900" />
                {cat}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.map((doc) => (
                  <Link
                    key={doc.slug}
                    to={doc.path}
                    className="bg-white border border-stone-200 hover:border-blue-900/40 rounded-xl p-5 shadow-2xs transition flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <FileText className="w-4 h-4 text-blue-900" />
                        <span className="text-[10px] font-mono text-stone-400">
                          Updated {doc.lastUpdated}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-stone-900 group-hover:text-blue-950">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                        {doc.summary}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-blue-900">
                      <span>Read Policy</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
