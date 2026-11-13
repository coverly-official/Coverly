import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import type { BusinessService, BusinessServiceCategory } from "@/types";
import {
  FileCheck,
  Calculator,
  Megaphone,
  Factory,
  Truck,
  Cpu,
  Briefcase,
  ShieldCheck,
  Building2,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const categoryIconMap: Record<string, React.ReactNode> = {
  "business-registration-legal": <FileCheck className="w-6 h-6" />,
  "accounting-finance": <Calculator className="w-6 h-6" />,
  "branding-marketing": <Megaphone className="w-6 h-6" />,
  "manufacturing-product-development": <Factory className="w-6 h-6" />,
  "logistics-supply-chain": <Truck className="w-6 h-6" />,
  "technology-it": <Cpu className="w-6 h-6" />,
  "business-consulting": <Briefcase className="w-6 h-6" />,
};

export const ServiceCategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [categories, setCategories] = useState<BusinessServiceCategory[]>([]);
  const [services, setServices] = useState<BusinessService[]>([]);
  const [selectedSub, setSelectedSub] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/business-services/categories`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setCategories(data.data);
      })
      .catch(() => {});
  }, []);

  const currentCategory = categories.find((c) => c.slug === slug);

  useEffect(() => {
    if (!currentCategory) return;
    setIsLoading(true);

    const params = new URLSearchParams();
    params.set("category", currentCategory.id);
    if (selectedSub) params.set("subcategory", selectedSub);

    fetch(`${API_BASE}/business-services?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setServices(data.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [currentCategory, selectedSub]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav className="flex items-center gap-2 text-xs text-stone-500 mb-6">
        <Link to="/" className="hover:text-stone-900">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/services" className="hover:text-stone-900">Business Services</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-stone-900">{currentCategory?.name || slug}</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center">
            {slug && categoryIconMap[slug] ? categoryIconMap[slug] : <Briefcase className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              {currentCategory?.name || "Service Category"}
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              {currentCategory?.description || "Browse verified business services in this domain"}
            </p>
          </div>
        </div>

        {/* Subcategories Pills */}
        {currentCategory?.subcategories && currentCategory.subcategories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-6 border-t border-stone-100 text-xs no-scrollbar">
            <button
              onClick={() => setSelectedSub("")}
              className={`px-3 py-1.5 rounded-full border whitespace-nowrap transition ${
                !selectedSub
                  ? "bg-stone-900 text-white font-semibold border-stone-900"
                  : "bg-white text-stone-700 border-stone-200 hover:border-stone-400"
              }`}
            >
              All {currentCategory.name}
            </button>
            {currentCategory.subcategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSub(sub.id)}
                className={`px-3 py-1.5 rounded-full border whitespace-nowrap transition ${
                  selectedSub === sub.id
                    ? "bg-stone-900 text-white font-semibold border-stone-900"
                    : "bg-white text-stone-700 border-stone-200 hover:border-stone-400"
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-2xl p-6 h-64 animate-pulse" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-16 bg-white border border-stone-200 rounded-2xl">
          <Briefcase className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-800">No service listings found in this category</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
            Need this service? Submit a custom inquiry and our concierge team will match you with a certified partner.
          </p>
          <div className="mt-4">
            <Link
              to="/services/request"
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition"
            >
              Post a Service Request
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
                <div className="flex items-center justify-between text-[11px] text-stone-500 mb-2.5">
                  <span className="font-semibold text-stone-700 uppercase tracking-wider">
                    {serv.business_service_subcategories?.name || currentCategory?.name}
                  </span>
                  {serv.businesses?.verification_level && serv.businesses.verification_level !== "unverified" && (
                    <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-semibold">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
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
                    Details
                  </Link>
                  <Link
                    to={`/services/request?service_id=${serv.id}&provider_business_id=${serv.business_id}&title=${encodeURIComponent(serv.title)}`}
                    className="text-xs font-semibold px-3 py-1.5 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition"
                  >
                    Inquire
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
