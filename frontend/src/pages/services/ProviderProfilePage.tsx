import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import type { BusinessService, ServiceProviderProfile, Business } from "@/types";
import {
  Building2,
  ShieldCheck,
  MapPin,
  Globe,
  Briefcase,
  ArrowRight,
  Clock,
  CheckCircle2,
  Send,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const ProviderProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [providerData, setProviderData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_BASE}/business-services/providers/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setProviderData(data.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return <div className="max-w-6xl mx-auto px-4 py-16 animate-pulse">Loading firm profile...</div>;
  }

  if (!providerData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-stone-900 mb-2">Provider Not Found</h2>
        <Link to="/services/providers" className="text-xs text-stone-900 underline">
          Browse Provider Directory
        </Link>
      </div>
    );
  }

  const profile: ServiceProviderProfile = providerData.profile;
  const services: BusinessService[] = providerData.services || [];
  const portfolio = providerData.portfolio || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Card */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded bg-stone-100 text-stone-700">
                Service Provider
              </span>
              {providerData.verification_level && providerData.verification_level !== "unverified" && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Firm
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              {providerData.name}
            </h1>

            {profile?.headline && (
              <p className="text-sm font-medium text-stone-700 mt-1">
                {profile.headline}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 mt-4">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-stone-400" />
                {providerData.city}, {providerData.state} ({providerData.pincode})
              </span>
              {providerData.website && (
                <a
                  href={providerData.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-stone-800 hover:underline"
                >
                  <Globe className="w-4 h-4 text-stone-400" />
                  {providerData.website}
                </a>
              )}
              {profile?.experience_years ? (
                <span>• {profile.experience_years} Years in Practice</span>
              ) : null}
            </div>
          </div>

          <Link
            to={`/services/request?provider_business_id=${providerData.id}&title=Custom Consultation with ${encodeURIComponent(providerData.name)}`}
            className="inline-flex items-center justify-center gap-2 text-xs font-semibold px-5 py-2.5 bg-stone-900 text-white hover:bg-stone-800 rounded-xl transition shadow-xs self-start"
          >
            Direct Inquiry
            <Send className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Bio */}
        {profile?.bio && (
          <div className="pt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
              About the Firm
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed whitespace-pre-line">
              {profile.bio}
            </p>
          </div>
        )}
      </div>

      {/* Services Offered */}
      <div>
        <h2 className="text-xl font-bold text-stone-900 mb-4">
          Offered Business Services ({services.length})
        </h2>

        {services.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-xs text-stone-500">
            No public service listings published by this provider yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <div
                key={s.id}
                className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-bold text-sm text-stone-900 mb-1">{s.title}</h4>
                  <p className="text-xs text-stone-500 line-clamp-2 mb-3">
                    {s.short_description}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 block">Pricing</span>
                    <span className="font-bold text-stone-900">
                      {s.pricing_model === "custom_quote"
                        ? "Custom Quote"
                        : `₹${Number(s.starting_price || 0).toLocaleString("en-IN")}`}
                    </span>
                  </div>

                  <Link
                    to={`/services/${s.id}`}
                    className="font-semibold text-stone-900 hover:underline flex items-center gap-1"
                  >
                    View <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Portfolio Work Samples */}
      {portfolio.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-stone-900 mb-4">Work Portfolio ({portfolio.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {portfolio.map((item: any) => (
              <div key={item.id} className="border border-stone-200 rounded-xl overflow-hidden bg-white text-xs">
                <img src={item.image_url} alt={item.title} className="w-full h-32 object-cover" />
                <div className="p-2.5">
                  <div className="font-semibold text-stone-900 truncate">{item.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
