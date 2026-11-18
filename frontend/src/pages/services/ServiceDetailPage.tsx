import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import type { BusinessService } from "@/types";
import { NotFoundPage } from "@/pages/shared/NotFoundPage";
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
  Star,
  Package,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const ServiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_BASE}/business-services/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setService(data.data);
          if (data.data?.packages && data.data.packages.length > 0) {
            setSelectedPackage(data.data.packages[0]);
          }
        }
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
    return <NotFoundPage resourceLabel="business service listing" />;
  }

  const provider = service.businesses;
  const profile = service.provider_profile;
  const packages = service.packages || [];
  const reviews = service.reviews || [];

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
                {service.full_description || "Comprehensive end-to-end execution compliant with regulatory standards. Request a formal quotation to align scope, deliverables, and service turnaround."}
              </p>
            </div>

            {/* Multi-Tier Package Selection if available */}
            {packages.length > 0 ? (
              <div className="mb-8 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                  Available Service Packages ({packages.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {packages.map((pkg: any) => {
                    const isSelected = selectedPackage?.id === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPackage(pkg)}
                        className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                          isSelected
                            ? "border-stone-900 bg-stone-50 ring-2 ring-stone-900/10"
                            : "border-stone-200 bg-white hover:border-stone-400"
                        }`}
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-200 text-stone-800">
                            {pkg.package_tier}
                          </span>
                          <div className="font-bold text-sm text-stone-900 mt-2">{pkg.name}</div>
                          <div className="text-lg font-black text-stone-900 mt-1">
                            ₹{Number(pkg.price).toLocaleString("en-IN")}
                          </div>
                          {pkg.description && (
                            <p className="text-[11px] text-stone-500 mt-1 line-clamp-2">{pkg.description}</p>
                          )}
                        </div>

                        <div className="mt-3 pt-3 border-t border-stone-200/60 text-[10px] text-stone-500 flex items-center justify-between">
                          <span>{pkg.turnaround_days} Days</span>
                          <span className={isSelected ? "font-bold text-stone-900" : ""}>
                            {isSelected ? "Selected ✓" : "Select"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Included Milestone Deliverables */}
            {service.deliverables && service.deliverables.length > 0 && (
              <div className="mb-8 p-5 bg-stone-50 border border-stone-200/80 rounded-xl">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-900 mb-3">
                  Included Milestone Deliverables
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-700">
                  {service.deliverables.map((d: string, idx: number) => (
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
              <span>Standard Execution Schedule: <strong>{selectedPackage ? selectedPackage.turnaround_days : service.turnaround_days} Business Days</strong></span>
            </div>
          </div>

          {/* Verified Customer Reviews Section */}
          {reviews.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  Verified Client Reviews ({reviews.length})
                </h3>
              </div>

              <div className="space-y-3">
                {reviews.map((rev: any) => (
                  <div key={rev.id} className="p-3.5 bg-stone-50 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900">{rev.users?.full_name || "Verified Client"}</span>
                      <div className="flex text-amber-500">
                        {[...Array(rev.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-stone-600 leading-relaxed">{rev.review_text}</p>
                    <div className="text-[10px] text-stone-400 font-mono">
                      {new Date(rev.created_at).toLocaleDateString()}
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
              {selectedPackage ? (
                <div>
                  <div className="text-3xl font-extrabold text-stone-900">
                    ₹{Number(selectedPackage.price).toLocaleString("en-IN")}
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5">
                    Package: <strong>{selectedPackage.name}</strong> ({selectedPackage.turnaround_days} Days)
                  </div>
                </div>
              ) : service.pricing_model === "custom_quote" ? (
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
              to={`/services/request?service_id=${service.id}&provider_business_id=${service.business_id}&title=${encodeURIComponent(
                selectedPackage ? `${service.title} (${selectedPackage.name})` : service.title
              )}`}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-stone-900 text-white font-semibold text-xs rounded-xl hover:bg-stone-800 transition shadow-xs text-center"
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
