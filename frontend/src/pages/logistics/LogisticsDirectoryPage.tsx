import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Truck,
  ShieldCheck,
  MapPin,
  Search,
  Filter,
  ArrowRight,
  Package,
  Layers,
  Star,
  CheckCircle,
  Building2,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const LogisticsDirectoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "");
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedMode, setSelectedMode] = useState(searchParams.get("mode") || "");
  const [selectedVerification, setSelectedVerification] = useState(searchParams.get("verification") || "");

  const fetchCompanies = () => {
    setIsLoading(true);
    setError(null);

    const query = new URLSearchParams();
    if (searchQuery) query.set("query", searchQuery);
    if (selectedCity) query.set("city", selectedCity);
    if (selectedCategory) query.set("category", selectedCategory);
    if (selectedMode) query.set("transport_mode", selectedMode);
    if (selectedVerification) query.set("verification", selectedVerification);

    fetch(`${API_BASE}/logistics/companies?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.companies) {
          setCompanies(data.data.companies);
        } else {
          setCompanies([]);
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load logistics companies.");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchCompanies();
  }, [selectedCity, selectedCategory, selectedMode, selectedVerification]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCompanies();
  };

  return (
    <div className="bg-stone-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Breadcrumbs */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
            <Link to="/" className="hover:text-stone-900 transition">Home</Link>
            <span>/</span>
            <Link to="/logistics" className="hover:text-stone-900 transition">Logistics</Link>
            <span>/</span>
            <span className="text-stone-900 font-medium">Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Logistics Companies & Fleet Carriers Directory
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Discover verified Indian road freight transporters, rail cargo agents, and cold-chain operators.
          </p>
        </div>

        {/* Filter Bar & Search */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs mb-8">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search company or hub..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900"
              />
            </div>

            <div>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900 bg-white"
              >
                <option value="">All Operating Cities</option>
                <option value="Delhi">Delhi NCR</option>
                <option value="Mumbai">Mumbai / Navi Mumbai</option>
                <option value="Ahmedabad">Ahmedabad</option>
                <option value="Surat">Surat</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Pune">Pune</option>
                <option value="Raipur">Raipur</option>
              </select>
            </div>

            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900 bg-white"
              >
                <option value="">All Logistics Categories</option>
                <option value="ftl">Full Truck Load (FTL)</option>
                <option value="ptl">Part Truck Load (PTL)</option>
                <option value="parcel">Express Parcel & Courier</option>
                <option value="bulk">Bulk Industrial Cargo</option>
                <option value="cold_chain">Cold Chain Refrigerated</option>
                <option value="warehousing">Warehousing & 3PL</option>
              </select>
            </div>

            <div>
              <select
                value={selectedVerification}
                onChange={(e) => setSelectedVerification(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900 bg-white"
              >
                <option value="">All Verification Tiers</option>
                <option value="document_verified">Document Verified (GSTIN/Permit)</option>
                <option value="registration_checked">Registration Checked</option>
              </select>
            </div>

            <div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Filter className="w-3.5 h-3.5" />
                Apply Filters
              </button>
            </div>
          </form>
        </div>

        {/* Directory Listings */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-48 bg-stone-200 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center text-xs text-rose-600">
            {error}
          </div>
        ) : companies.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
            <Truck className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-900 mb-1">No Logistics Carriers Found</h3>
            <p className="text-xs text-stone-500 mb-4">
              Try adjusting your city filter or search terms to explore available carriers.
            </p>
            <button
              onClick={() => {
                setSelectedCity("");
                setSelectedCategory("");
                setSelectedVerification("");
                setSearchQuery("");
              }}
              className="text-xs font-semibold px-4 py-2 bg-stone-900 text-white rounded-lg"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {companies.map((c) => {
              const p = c.logistics_profile;
              return (
                <div
                  key={c.id}
                  className="bg-white border border-stone-200 hover:border-blue-900/50 rounded-2xl p-6 transition shadow-xs flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-100 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {c.verification_level !== "unverified" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              VERIFIED CARRIER
                            </span>
                          )}
                          <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                            Fleet: {p?.fleet_size || 20}+ Vehicles
                          </span>
                        </div>

                        <Link
                          to={`/logistics/companies/${c.slug}`}
                          className="text-base font-bold text-stone-900 hover:text-blue-900 transition line-clamp-1"
                        >
                          {c.name}
                        </Link>
                        <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          {c.city}, {c.state} ({c.pincode})
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {p?.rating || "4.8"}
                        </div>
                      </div>
                    </div>

                    {/* Operating Corridors */}
                    <div className="mb-4">
                      <div className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1.5">
                        Key Freight Corridors
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        {(p?.operating_routes || [`${c.city} - Delhi`, `${c.city} - Mumbai`]).map((route: string, idx: number) => (
                          <span key={idx} className="px-2.5 py-0.5 bg-stone-100 text-stone-700 rounded-md border border-stone-200/80">
                            {route}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Vehicle Types */}
                    <div className="mb-4">
                      <div className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1.5">
                        Supported Fleet
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-xs text-stone-600">
                        {(p?.vehicle_types || ["14ft Canter (4T)", "32ft Container (15T)"]).slice(0, 3).map((vt: string, idx: number) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-900 rounded border border-blue-100 text-[11px]">
                            <Truck className="w-3 h-3" /> {vt}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
                    <Link
                      to={`/logistics/book?company_id=${c.id}`}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold transition shadow-xs"
                    >
                      <span>Request Quote</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <Link
                      to={`/logistics/companies/${c.slug}`}
                      className="text-xs font-semibold text-stone-700 hover:text-stone-900 hover:underline"
                    >
                      View Rates & Profile &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
