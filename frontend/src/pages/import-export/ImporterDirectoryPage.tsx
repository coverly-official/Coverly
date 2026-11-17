import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Globe,
  Search,
  Filter,
  CheckCircle2,
  Ship,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  MapPin,
  Building2,
  DollarSign,
  Send,
  Boxes,
  Briefcase,
} from "lucide-react";
import { TradeParty, TradeCategory } from "../../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const ImporterDirectoryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [importers, setImporters] = useState<TradeParty[]>([]);
  const [categories, setCategories] = useState<TradeCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get("country") || "all");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");

  useEffect(() => {
    fetch(`${API_BASE}/import-export/categories`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setCategories(json.data || []);
      })
      .catch((err) => console.error(err));
  }, []);

  const loadImporters = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (selectedCountry !== "all") params.append("country", selectedCountry);
      if (selectedCategory !== "all") params.append("category", selectedCategory);

      const res = await fetch(`${API_BASE}/import-export/importers?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setImporters(json.data || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadImporters();
  }, [selectedCountry, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadImporters();
  };

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-4">
          <Link to="/" className="hover:text-stone-900">Home</Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <Link to="/import-export" className="hover:text-stone-900">Import & Export</Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <span className="font-semibold text-stone-800">Verified Importers Directory</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                Verified Global Buyers & Importers
              </span>
              <span className="text-xs text-stone-500 font-mono">Customs & IEC Verified</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-1">
              Active Importers & Cross-Border Buyers
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
              Discover licensed Indian and international importers actively seeking raw materials, machinery, FMCG, and industrial products with established import credit and customs clearance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/import-export/rfq"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
              Post Sourcing Requirement
            </Link>
            <Link
              to="/import-export/dashboard"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 transition-colors"
            >
              <Briefcase className="w-4 h-4 text-blue-600" />
              Trader Portal
            </Link>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white border border-stone-200 rounded-xl p-4 my-6 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search by company name, country, or procurement category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
            <div className="sm:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter by category"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
              >
                <option value="all">All Sourcing Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                aria-label="Filter by country"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
              >
                <option value="all">All Countries</option>
                <option value="IN">India (IN)</option>
                <option value="AE">UAE (AE)</option>
                <option value="US">United States (US)</option>
                <option value="DE">Germany (DE)</option>
                <option value="SG">Singapore (SG)</option>
                <option value="VN">Vietnam (VN)</option>
                <option value="GB">United Kingdom (GB)</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button
                type="submit"
                className="w-full py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition-colors flex items-center justify-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" />
                Filter
              </button>
            </div>
          </form>
        </div>

        {/* Content List */}
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-stone-300 border-t-amber-500 mb-3" />
            <p className="text-xs text-stone-500">Loading verified importer directory...</p>
          </div>
        ) : importers.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-xl p-12 text-center my-6">
            <Building2 className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-800">No importers found matching criteria</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search terms or filters to discover other active importers.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedCountry("all");
                setSelectedCategory("all");
              }}
              className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {importers.map((importer) => {
              const biz = importer.businesses;
              return (
                <div
                  key={importer.id}
                  className="bg-white border border-stone-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-base text-stone-900">
                            {biz?.name || importer.headline || "Verified Importer"}
                          </span>
                          {importer.verification_status === "verified" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                              <ShieldCheck className="w-3 h-3 text-blue-600" />
                              Customs Verified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-stone-500 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-stone-400" />
                            {biz?.city ? `${biz.city}, ` : ""}{importer.country_name || "India"}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-stone-600">
                            IEC: {importer.iec_code || "DGFT-REG"}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                        {importer.party_type === "importer_exporter" ? "Import-Export" : "Importer"}
                      </span>
                    </div>

                    {/* Headline */}
                    {importer.headline && (
                      <p className="text-xs text-stone-600 mt-2.5 font-medium line-clamp-2">
                        {importer.headline}
                      </p>
                    )}

                    {/* Key Attributes */}
                    <div className="mt-4 pt-3 border-t border-stone-100 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[11px] text-stone-500 flex items-center gap-1 mb-1">
                          <Globe className="w-3 h-3 text-stone-400" />
                          Sourcing Origins:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {(importer.sourcing_countries && importer.sourcing_countries.length > 0) ? (
                            importer.sourcing_countries.slice(0, 3).map((c, idx) => (
                              <span key={idx} className="bg-stone-50 text-stone-700 px-1.5 py-0.5 rounded border border-stone-200 text-[11px]">
                                {c}
                              </span>
                            ))
                          ) : (
                            <span className="text-stone-400 text-[11px]">Global Markets</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] text-stone-500 flex items-center gap-1 mb-1">
                          <Boxes className="w-3 h-3 text-stone-400" />
                          Target Categories:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {(importer.product_categories && importer.product_categories.length > 0) ? (
                            importer.product_categories.slice(0, 2).map((cat, idx) => (
                              <span key={idx} className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200 text-[11px]">
                                {cat}
                              </span>
                            ))
                          ) : (
                            <span className="text-stone-400 text-[11px]">General Cargo</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Shipment modes & Turnover */}
                    <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                      <div className="flex items-center gap-1">
                        <Ship className="w-3.5 h-3.5 text-stone-400" />
                        <span>Shipment Modes:</span>
                        <span className="font-semibold text-stone-700">
                          {importer.typical_shipment_modes?.join(", ") || "FCL Ocean, LCL, Air"}
                        </span>
                      </div>
                      {importer.annual_trade_turnover && (
                        <div className="text-[11px] font-mono text-stone-600 bg-stone-50 px-2 py-0.5 rounded border border-stone-200">
                          {importer.annual_trade_turnover}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-stone-500">
                      Status: <span className="font-semibold text-emerald-700">Verified Buyer</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/import-export/rfq?importer_id=${importer.id}&importer_name=${encodeURIComponent(biz?.name || "Importer")}`}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        Send Offer
                      </Link>
                      <Link
                        to={`/import-export/parties/${importer.id}`}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-1"
                      >
                        Profile
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
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
