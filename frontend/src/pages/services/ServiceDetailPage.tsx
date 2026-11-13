import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import type { BusinessService } from "@/types";
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Briefcase,
  ArrowRight,
  Globe,
  ChevronRight,
  Send,
  MapPin,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const ServiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<BusinessService | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_BASE}/business-services/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setService(data.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-8 bg-stone-200 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 h-72 bg-stone-200 rounded-2xl" />
          <div className="h-72 bg-stone-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-stone-900 mb-2">Service Listing Not Found</h2>
        <p className="text-xs text-stone-500 mb-6">
          The service listing you requested is unavailable or has been archived.
        </p>
        <Link to="/services/all" className="text-xs font-semibold px-4 py-2 bg-stone-900 text-white rounded-lg">
          Browse All Services
        </Link>
      </div>
    );
  }

  const provider = service.businesses;
  const profile = service.provider_profile;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-stone-500 mb-6">
        <Link to="/" className="hover:text-stone-900">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/services" className="hover:text-stone-900">Business Services</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-stone-900 truncate max-w-xs">{service.title}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Left Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded bg-stone-100 text-stone-700">
                {service.business_service_categories?.name || "Professional Category"}
              </span>
              {service.business_service_subcategories && (
                <span className="text-xs text-stone-500">
                  • {service.business_service_subcategories.name}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mb-4">
              {service.title}
            </h1>

            <p className="text-sm text-stone-600 leading-relaxed mb-6 pb-6 border-b border-stone-100">
              {service.short_description}
            </p>

            {/* Scope / Full Description */}
            <div className="prose prose-sm text-stone-600 mb-8">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-900 mb-2">
                Detailed Scope of Work
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                {service.full_description || "Comprehensive end-to-end execution compliant with regulatory standards. Request a custom quotation to align scope, deliverables, and service turnaround."}
              </p>
            </div>

            {/* Deliverables Checklist */}
            {service.deliverables && service.deliverables.length > 0 && (
              <div className="mb-8 p-5 bg-stone-50 border border-stone-200/80 rounded-xl">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-900 mb-3">
                  Included Milestone Deliverables
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-700">
                  {service.deliverables.map((d, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Turnaround Time */}
            <div className="flex items-center gap-2 text-xs text-stone-600 pt-4 border-t border-stone-100">
              <Clock className="w-4 h-4 text-stone-400" />
              <span>Standard Execution Schedule: <strong>{service.turnaround_days} Business Days</strong></span>
            </div>
          </div>

          {/* Portfolio Samples if available */}
          {service.portfolio && service.portfolio.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs">
              <h3 className="text-base font-bold text-stone-900 mb-4">
                Work Portfolio & Previous Deliverables ({service.portfolio.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {service.portfolio.map((item) => (
                  <div key={item.id} className="border border-stone-200 rounded-xl overflow-hidden text-xs">
                    <img src={item.image_url} alt={item.title} className="w-full h-32 object-cover" />
                    <div className="p-2.5">
                      <div className="font-semibold text-stone-900 truncate">{item.title}</div>
                      {item.description && (
                        <div className="text-[11px] text-stone-500 truncate mt-0.5">{item.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Pricing & Provider Bio */}
        <div className="space-y-6">
          {/* Pricing & Inquiry Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-1">
              Commercial Terms
            </div>

            <div className="mb-6">
              {service.pricing_model === "custom_quote" ? (
                <div>
                  <div className="text-2xl font-extrabold text-stone-900">Custom Quotation</div>
                  <div className="text-xs text-stone-500 mt-0.5">Price determined by your specific project scope</div>
                </div>
              ) : (
                <div>
                  <div className="text-3xl font-extrabold text-stone-900">
                    ₹{Number(service.starting_price || 0).toLocaleString("en-IN")}
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5">
                    {service.pricing_model === "starting_at" ? "Starting price (excl. government fees/GST)" : "Fixed package price"}
                  </div>
                </div>
              )}
            </div>

            <Link
              to={`/services/request?service_id=${service.id}&provider_business_id=${service.business_id}&title=${encodeURIComponent(service.title)}`}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-stone-900 text-white font-semibold text-xs rounded-xl hover:bg-stone-800 transition shadow-xs"
            >
              Send Service Inquiry
              <Send className="w-3.5 h-3.5" />
            </Link>

            <div className="mt-4 text-[11px] text-stone-500 text-center">
              Direct connection with verified provider firm • Milestone tracked
            </div>
          </div>

          {/* Provider Business Profile Card */}
          {provider && (
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Service Provider
                </div>
                {provider.verification_level !== "unverified" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Firm
                  </span>
                )}
              </div>

              <h4 className="font-bold text-base text-stone-900 mb-1">{provider.name}</h4>
              <p className="text-xs text-stone-500 flex items-center gap-1 mb-3">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                {provider.city}, {provider.state}
              </p>

              {profile?.headline && (
                <div className="text-xs font-medium text-stone-700 mb-3 bg-stone-50 p-2.5 rounded-lg">
                  "{profile.headline}"
                </div>
              )}

              {profile?.bio && (
                <p className="text-xs text-stone-500 leading-relaxed line-clamp-3 mb-4">
                  {profile.bio}
                </p>
              )}

              <Link
                to={`/services/providers/${provider.id}`}
                className="block text-center text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 py-2 rounded-lg transition"
              >
                View Full Firm Profile & All Services
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
