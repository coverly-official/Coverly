import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { BusinessService, BusinessServiceCategory } from "@/types";
import { Search, Filter, ShieldCheck, ArrowRight, Building2, Clock, Briefcase, Tag } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const AllServicesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState<BusinessService[]>([]);
  const [categories, setCategories] = useState<BusinessServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const selectedCategory = searchParams.get("category") || "";
  const selectedSubcategory = searchParams.get("subcategory") || "";
  const searchQuery = searchParams.get("search") || "";
  const cityFilter = searchParams.get("city") || "";
  const sortBy = searchParams.get("sort") || "newest";

  useEffect(() => {
    fetch(`${API_BASE}/business-services/categories`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCategories(d.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedSubcategory) params.set("subcategory", selectedSubcategory);
    if (searchQuery) params.set("search", searchQuery);
    if (cityFilter) params.set("city", cityFilter);
    if (sortBy) params.set("sort", sortBy);

    fetch(`${API_BASE}/business-services?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setServices(data.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [selectedCategory, selectedSubcategory, searchQuery, cityFilter, sortBy]);

  const activeCategoryObj = categories.find((c) => c.id === selectedCategory || c.slug === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
          Professional Business Services Directory
        </h1>
        <p className="text-sm text-stone-600 mt-1">
          Explore legal incorporation, tax filings, industrial R&D, commercial branding, and logistics services.
        </p>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search services by keyword, scope, or provider..."
            value={searchQuery}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams);
              if (e.target.value) next.set("search", e.target.value);
              else next.delete("search");
              setSearchParams(next);
            }}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams);
              if (e.target.value) {
                next.set("category", e.target.value);
                next.delete("subcategory");
              } else {
                next.delete("category");
                next.delete("subcategory");
              }
              setSearchParams(next);
            }}
            className="text-xs sm:text-sm border border-stone-200 rounded-lg px-3 py-2 bg-white text-stone-700"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams);
              next.set("sort", e.target.value);
              setSearchParams(next);
            }}
            className="text-xs sm:text-sm border border-stone-200 rounded-lg px-3 py-2 bg-white text-stone-700"
          >
            <option value="newest">Sort by Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Subcategory Pills if category selected */}
      {activeCategoryObj?.subcategories && activeCategoryObj.subcategories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 text-xs no-scrollbar">
          <button
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete("subcategory");
              setSearchParams(next);
            }}
            className={`px-3 py-1.5 rounded-full border whitespace-nowrap transition ${
              !selectedSubcategory
                ? "bg-stone-900 text-white font-semibold border-stone-900"
                : "bg-white text-stone-700 border-stone-200 hover:border-stone-400"
            }`}
          >
            All in {activeCategoryObj.name}
          </button>
          {activeCategoryObj.subcategories.map((sub) => (
            <button
              key={sub.id}
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                if (selectedSubcategory === sub.id) next.delete("subcategory");
                else next.set("subcategory", sub.id);
                setSearchParams(next);
              }}
              className={`px-3 py-1.5 rounded-full border whitespace-nowrap transition ${
                selectedSubcategory === sub.id
                  ? "bg-stone-900 text-white font-semibold border-stone-900"
                  : "bg-white text-stone-700 border-stone-200 hover:border-stone-400"
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}

      {/* Service Listings Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-2xl p-6 h-64 animate-pulse" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-16 bg-white border border-stone-200 rounded-2xl">
          <Briefcase className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-800">No service listings found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
            Try adjusting your search query or selecting another professional category.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              to="/services/request"
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition"
            >
              Post a Custom Service Request
            </Link>
            <Link
              to="/provider/onboarding"
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-white border border-stone-300 text-stone-800 hover:bg-stone-50 transition"
            >
              List as Service Provider
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((serv) => (
            <div
              key={serv.id}
              className="group bg-white border border-stone-200 hover:border-stone-400 rounded-2xl p-6 transition shadow-xs flex flex-col justify-between"
            >
              <div>
                {/* Category & Badge */}
                <div className="flex items-center justify-between text-[11px] text-stone-500 mb-2.5">
                  <span className="font-semibold text-stone-700 uppercase tracking-wider">
                    {serv.business_service_categories?.name || "Professional Service"}
                  </span>
                  {serv.businesses?.verification_level && serv.businesses.verification_level !== "unverified" && (
                    <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-semibold">
                      <ShieldCheck className="w-3 h-3" />
                      Verified Firm
                    </span>
                  )}
                </div>

                <Link to={`/services/${serv.id}`} className="block">
                  <h3 className="font-bold text-base text-stone-900 group-hover:text-stone-700 transition line-clamp-2 mb-2">
                    {serv.title}
                  </h3>
                </Link>

                <p className="text-xs text-stone-500 leading-relaxed line-clamp-2 mb-4">
                  {serv.short_description}
                </p>

                {serv.businesses && (
                  <div className="flex items-center gap-1.5 text-xs text-stone-600 mb-4">
                    <Building2 className="w-3.5 h-3.5 text-stone-400" />
                    <span className="font-medium truncate">{serv.businesses.name}</span>
                    <span>•</span>
                    <span className="text-stone-400">{serv.businesses.city}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-stone-400 uppercase tracking-wider">Pricing</div>
                  <div className="text-sm font-bold text-stone-900">
                    {serv.pricing_model === "custom_quote" ? (
                      <span className="text-xs text-stone-600 font-medium">Custom Quote</span>
                    ) : (
                      <>
                        ₹{Number(serv.starting_price || 0).toLocaleString("en-IN")}
                        {serv.pricing_model === "starting_at" && (
                          <span className="text-[10px] font-normal text-stone-400 ml-1">onwards</span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/services/${serv.id}`}
                    className="text-xs font-semibold px-3 py-1.5 bg-stone-100 text-stone-800 rounded-lg hover:bg-stone-200 transition"
                  >
                    View Details
                  </Link>
                  <Link
                    to={`/services/request?service_id=${serv.id}&provider_business_id=${serv.business_id}&title=${encodeURIComponent(serv.title)}`}
                    className="text-xs font-semibold px-3 py-1.5 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition"
                  >
                    Send Inquiry
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
