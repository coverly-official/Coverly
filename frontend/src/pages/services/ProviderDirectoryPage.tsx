import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Business } from "@/types";
import { Building2, ShieldCheck, MapPin, Search, ArrowRight, Briefcase } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const ProviderDirectoryPage: React.FC = () => {
  const [providers, setProviders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (cityFilter) params.set("city", cityFilter);

    fetch(`${API_BASE}/business-services/providers?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setProviders(data.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [search, cityFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
          Professional Service Provider Directory
        </h1>
        <p className="text-sm text-stone-600 mt-1">
          Discover verified Chartered Accountants, corporate law consultants, logistics networks, branding agencies, and software architects.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs mb-8 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search providers by firm name or specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
          />
        </div>

        <div className="sm:w-64">
          <input
            type="text"
            placeholder="Filter by city (e.g. Mumbai, Delhi)..."
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
          />
        </div>
      </div>

      {/* Provider Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-2xl p-6 h-52 animate-pulse" />
          ))}
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-16 bg-white border border-stone-200 rounded-2xl">
          <Building2 className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-800">No service providers found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
            Are you a professional services firm? List your company to start receiving buyer inquiries.
          </p>
          <div className="mt-4">
            <Link
              to="/provider/onboarding"
              className="inline-flex items-center text-xs font-semibold px-4 py-2 rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition"
            >
              List Your Firm
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {providers.map((p) => {
            const profile = Array.isArray(p.service_provider_profiles)
              ? p.service_provider_profiles[0]
              : p.service_provider_profiles;

            return (
              <Link
                key={p.id}
                to={`/services/providers/${p.id}`}
                className="group bg-white border border-stone-200 hover:border-stone-400 rounded-2xl p-6 transition shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                      Professional Firm
                    </span>
                    {p.verification_level && p.verification_level !== "unverified" && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-stone-900 group-hover:text-stone-700 transition mb-1">
                    {p.name}
                  </h3>

                  <p className="text-xs text-stone-500 flex items-center gap-1 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    {p.city}, {p.state}
                  </p>

                  {profile?.headline && (
                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      "{profile.headline}"
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-stone-900">
                  <span>View Services & Portfolio</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
