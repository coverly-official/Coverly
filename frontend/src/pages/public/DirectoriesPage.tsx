import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GuestEnquiryModal } from "@/components/modals/GuestEnquiryModal";
import type { Business } from "@/types";
import {
  Building2,
  ShieldCheck,
  MapPin,
  Search,
  ArrowRight,
  Send,
  ExternalLink,
  Factory,
  Package,
  CheckCircle2,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const DirectoriesPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  let activeType = "all";
  if (path.includes("manufacturer")) activeType = "manufacturer";
  else if (path.includes("wholesaler")) activeType = "wholesaler";
  else if (path.includes("distributor")) activeType = "distributor";

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [cityFilter, setCityFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVerification, setSelectedVerification] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Enquiry modal
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (activeType !== "all") params.set("type", activeType);
    if (cityFilter.trim()) params.set("city", cityFilter.trim());
    if (searchQuery.trim()) params.set("query", searchQuery.trim());
    if (selectedVerification !== "all") params.set("verification", selectedVerification);

    fetch(`${API_BASE}/directory/search?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const items = Array.isArray(data.data) ? data.data : data.data?.items || [];
          setBusinesses(items);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [activeType, cityFilter, searchQuery, selectedVerification]);

  const openEnquiry = (biz: any) => {
    setSelectedSupplier({
      id: biz.id,
      name: biz.name,
      city: biz.city,
    });
    setIsModalOpen(true);
  };

  const cities = ["All Cities", "Delhi NCR", "Mumbai", "Surat", "Ahmedabad", "Pune", "Bengaluru", "Hyderabad", "Vadodara", "Raipur", "Rajkot", "Guntur", "Baddi"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-xs text-stone-500 mb-2">
          <Link to="/" className="hover:text-stone-900 transition">Home</Link>
          <span>/</span>
          <span className="text-stone-900 font-semibold">Supplier Directory</span>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
          Indian Verified Supplier Directory
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
          Connect directly with verified manufacturing plants, mills, master wholesalers, and regional distributors across India with no brokerage.
        </p>

        {/* Directory Navigation Tabs */}
        <div className="flex gap-2 border-b border-stone-200 mt-6 overflow-x-auto text-xs font-semibold">
          <Link
            to="/manufacturers"
            className={`pb-2.5 px-3 border-b-2 transition ${
              activeType === "manufacturer"
                ? "border-blue-900 text-blue-900 font-bold"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            Manufacturers
          </Link>
          <Link
            to="/wholesalers"
            className={`pb-2.5 px-3 border-b-2 transition ${
              activeType === "wholesaler"
                ? "border-blue-900 text-blue-900 font-bold"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            Wholesalers
          </Link>
          <Link
            to="/distributors"
            className={`pb-2.5 px-3 border-b-2 transition ${
              activeType === "distributor"
                ? "border-blue-900 text-blue-900 font-bold"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            Distributors
          </Link>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs mb-8 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search suppliers by business name, city, or product keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-blue-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs">
            <MapPin className="w-3.5 h-3.5 text-stone-400 mr-1.5 shrink-0" />
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value === "All Cities" ? "" : e.target.value)}
              className="bg-transparent text-xs font-medium text-stone-800 focus:outline-none cursor-pointer"
            >
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <select
            value={selectedVerification}
            onChange={(e) => setSelectedVerification(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:outline-none cursor-pointer"
          >
            <option value="all">All Verifications</option>
            <option value="document_verified">Document Verified</option>
            <option value="registration_checked">Registration Checked</option>
            <option value="unverified">Standard</option>
          </select>
        </div>
      </div>

      {/* Supplier Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-stone-100 rounded-2xl h-56" />
          ))}
        </div>
      ) : businesses.length === 0 ? (
        <div className="text-center py-16 bg-white border border-stone-200 rounded-2xl space-y-3">
          <Building2 className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-800">No Suppliers Found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            No businesses matched your search filters. Try resetting the city filter or search query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((biz) => {
            const isVerified = biz.verification_level && biz.verification_level !== "unverified";
            return (
              <div
                key={biz.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:shadow-lg hover:border-blue-800 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-950 text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                        {biz.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-stone-900 line-clamp-1">{biz.name}</h3>
                        <div className="flex items-center gap-1 text-[11px] text-stone-500 mt-0.5">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          {biz.city}, {biz.state}
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-800 shrink-0">
                      {biz.business_type}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 mt-4 line-clamp-2 leading-relaxed">
                    {biz.legal_name || "Commercial B2B supplier and wholesale aggregate stockist."}
                  </p>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <div className="text-stone-500 text-[11px]">
                      Status:{" "}
                      <span className="font-semibold text-stone-800 capitalize">
                        {biz.verification_level?.replace("_", " ") || "Registered"}
                      </span>
                    </div>

                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="text-stone-400 text-[11px]">Standard Account</span>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-stone-100 flex gap-2">
                  <Link
                    to={`/suppliers/${biz.slug}`}
                    className="flex-1 py-2 text-center rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-800 transition"
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={() => openEnquiry(biz)}
                    className="flex-1 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition"
                  >
                    Send Enquiry
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Guest Enquiry Modal */}
      <GuestEnquiryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        supplier={selectedSupplier}
      />
    </div>
  );
};
