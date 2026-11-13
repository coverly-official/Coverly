import React from "react";
import { Building2, MapPin, Mail, Phone, ShieldCheck } from "lucide-react";

export const SupplierBusinessProfilePage: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-stone-900">Business Profile</h1>
      <p className="text-xs text-stone-500 mt-1">Manage your company profile, compliance details, and contact information.</p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Manufacturer</div>
            <h2 className="mt-2 text-xl font-bold text-stone-900">Sapphire Industrial Works</h2>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800">
            <ShieldCheck className="h-3 w-3" /> Verified
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-stone-600">
          <div className="flex items-center gap-3"><Building2 className="h-4 w-4 text-stone-500" />Manufacturing & Export</div>
          <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-stone-500" />Surat, Gujarat</div>
          <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-stone-500" />sales@sapphireworks.in</div>
          <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-stone-500" />+91 98765 12345</div>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Business highlights</div>
        <div className="mt-4 space-y-3 text-sm text-stone-600">
          <div className="flex justify-between"><span>Years in business</span><span className="font-semibold text-stone-900">12</span></div>
          <div className="flex justify-between"><span>Certifications</span><span className="font-semibold text-stone-900">ISO 9001</span></div>
          <div className="flex justify-between"><span>Avg. lead time</span><span className="font-semibold text-stone-900">18 days</span></div>
        </div>
      </div>
    </div>
  </div>
);
