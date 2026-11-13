import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import type { Business } from "@/types";
import { Building2, ShieldCheck, MapPin, Search, ArrowRight } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const DirectoriesPage: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  let businessType: "manufacturer" | "wholesaler" | "distributor" = "manufacturer";
  let title = "Manufacturer Directory";
  let subtitle = "Discover direct factories, manufacturing plants, and OEM production partners.";

  if (path.includes("wholesaler")) {
    businessType = "wholesaler";
    title = "Wholesaler Directory";
    subtitle = "Source bulk inventory and ready-stock lots from verified national wholesalers.";
  } else if (path.includes("distributor")) {
    businessType = "distributor";
    title = "Distributor Directory";
    subtitle = "Find authorized regional distributors with localized supply chains and prompt dispatch.";
  }

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [cityFilter, setCityFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    params.set("type", businessType);
    if (cityFilter) params.set("city", cityFilter);
    if (searchQuery) params.set("query", searchQuery);

    fetch(`${API_BASE}/directory/search?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBusinesses(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [businessType, cityFilter, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">{title}</h1>
        <p className="text-sm text-stone-600 mt-1">{subtitle}</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs mb-8 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by business name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
          />
        </div>

        <div className="sm:w-64">
          <input
            type="text"
            placeholder="Filter by city (e.g. Surat, Tiruppur)..."
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
          />
        </div>
      </div>

      {/* Business Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-xl p-6 h-48 animate-pulse" />
          ))}
        </div>
      ) : businesses.length === 0 ? (
        <div className="text-center py-16 bg-white border border-stone-200 rounded-xl">
          <Building2 className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-800">No businesses listed yet</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
            Are you a supplier in this domain? Register your business to start receiving verified buyer RFQs.
          </p>
          <div className="mt-4">
            <Link
              to={`/auth/register?role=${businessType}`}
              className="inline-flex items-center text-xs font-semibold px-4 py-2 rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition"
            >
              List Your Business
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {businesses.map((biz) => (
            <Link
              key={biz.id}
              to={`/suppliers/${biz.slug}`}
              className="group bg-white border border-stone-200 hover:border-stone-400 rounded-xl p-6 transition shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                    {biz.business_type}
                  </span>
                  {biz.verification_level !== "unverified" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-base text-stone-900 mb-1 group-hover:text-stone-700 transition">
                  {biz.name}
                </h3>

                <p className="text-xs text-stone-500 flex items-center gap-1 mt-2">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {biz.city}, {biz.state} ({biz.pincode})
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-stone-900">
                <span>View Facility Profile</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
