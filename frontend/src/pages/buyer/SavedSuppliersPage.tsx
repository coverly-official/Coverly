import React from "react";
import { Link } from "react-router-dom";
import { Bookmark, MapPin, ShieldCheck, ArrowRight } from "lucide-react";

const savedSuppliers = [
  { name: "Tiruppur Knits", city: "Tiruppur", category: "Apparel", verified: true },
  { name: "Surat Textile House", city: "Surat", category: "Fabrics", verified: true },
  { name: "Metro Industrial Supply", city: "Delhi", category: "Packaging", verified: false },
];

export const SavedSuppliersPage: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Saved Suppliers</h1>
        <p className="text-xs text-stone-500 mt-1">Keep your preferred suppliers close for repeat orders and fast RFQ comparisons.</p>
      </div>
      <div className="inline-flex items-center gap-2 rounded-lg bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-700">
        <Bookmark className="h-4 w-4" /> 3 saved
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {savedSuppliers.map((supplier) => (
        <div key={supplier.name} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">{supplier.category}</div>
              <h3 className="mt-2 text-lg font-semibold text-stone-900">{supplier.name}</h3>
            </div>
            {supplier.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800">
                <ShieldCheck className="h-3 w-3" /> Verified
              </span>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-stone-600">
            <MapPin className="h-4 w-4 text-stone-400" />
            {supplier.city}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4">
            <Link to="/suppliers/tiruppur-knits" className="text-xs font-semibold text-stone-900 hover:underline">View profile</Link>
            <Link to="/buyer/rfq/new?title=Repeat%20Sourcing%20Requirement" className="inline-flex items-center gap-1 text-xs font-semibold text-stone-900">
              RFQ <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  </div>
);
