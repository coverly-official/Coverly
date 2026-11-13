import React from "react";
import { Mail, Phone, MapPin, Building2, ShieldCheck } from "lucide-react";

export const BuyerProfilePage: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-stone-900">Buyer Profile</h1>
      <p className="text-xs text-stone-500 mt-1">Business details for your procurement operations and sourcing account.</p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Procurement buyer</div>
            <h2 className="mt-2 text-xl font-bold text-stone-900">Apex Retail Ventures</h2>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800">
            <ShieldCheck className="h-3 w-3" /> Verified buyer
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-stone-600">
          <div className="flex items-center gap-3"><Building2 className="h-4 w-4 text-stone-500" />PROCUREMENT TEAM</div>
          <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-stone-500" />rajesh@apexretail.in</div>
          <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-stone-500" />+91 98765 43210</div>
          <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-stone-500" />Mumbai, Maharashtra</div>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Procurement profile</div>
        <div className="mt-4 space-y-3 text-sm text-stone-600">
          <div className="flex justify-between"><span>Avg. monthly RFQs</span><span className="font-semibold text-stone-900">18</span></div>
          <div className="flex justify-between"><span>Approved suppliers</span><span className="font-semibold text-stone-900">64</span></div>
          <div className="flex justify-between"><span>On-time delivery</span><span className="font-semibold text-stone-900">96%</span></div>
        </div>
      </div>
    </div>
  </div>
);
