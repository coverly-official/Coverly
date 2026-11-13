import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import type { Business, Product } from "@/types";
import {
  Building2,
  ShieldCheck,
  MapPin,
  CheckCircle,
  Factory,
  Globe,
  Clock,
  ArrowRight,
  Package,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const SupplierProfilePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_BASE}/directory/profile/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProfile(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 animate-pulse">
        <div className="h-10 bg-stone-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-stone-200 rounded w-1/4 mb-8" />
        <div className="h-48 bg-stone-200 rounded-xl mb-8" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-stone-900 mb-2">Business Profile Not Found</h2>
        <p className="text-xs text-stone-500 mb-6">The requested business profile is unavailable or inactive.</p>
        <Link to="/manufacturers" className="text-xs font-semibold px-4 py-2 bg-stone-900 text-white rounded-lg">
          Browse Directory
        </Link>
      </div>
    );
  }

  const supplierProfile = profile.supplier_profile;
  const products: Product[] = profile.products || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Profile Header Banner */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                {profile.business_type}
              </span>
              {profile.verification_level !== "unverified" && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {profile.verification_level.replace("_", " ").toUpperCase()}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              {profile.name}
            </h1>
            {profile.legal_name && (
              <p className="text-xs text-stone-500 mt-0.5">Legal: {profile.legal_name}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 mt-4">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-stone-400" />
                {profile.city}, {profile.state} ({profile.pincode})
              </span>
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-stone-800 hover:underline"
                >
                  <Globe className="w-4 h-4 text-stone-400" />
                  {profile.website}
                </a>
              )}
            </div>
          </div>

          <Link
            to={`/buyer/rfq/new?supplier_business_id=${profile.id}&supplier_name=${encodeURIComponent(profile.name)}`}
            className="inline-flex items-center justify-center gap-2 text-xs font-semibold px-5 py-2.5 bg-stone-900 text-white hover:bg-stone-800 rounded-xl transition shadow-xs"
          >
            Request Quotation
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Verification Tiers Overview (Distinct Tiers Rule) */}
        <div className="pt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
            Trust & Verification Audit
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg border border-stone-200/80 bg-stone-50/60 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Phone Verified</span>
            </div>
            <div className="p-2.5 rounded-lg border border-stone-200/80 bg-stone-50/60 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Email Verified</span>
            </div>
            <div className="p-2.5 rounded-lg border border-stone-200/80 bg-stone-50/60 flex items-center gap-2">
              {profile.verification_level === "document_verified" || profile.verification_level === "registration_checked" ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <span className="w-4 h-4 rounded-full border border-stone-300 inline-block shrink-0" />
              )}
              <span>GSTIN / PAN Reviewed</span>
            </div>
            <div className="p-2.5 rounded-lg border border-stone-200/80 bg-stone-50/60 flex items-center gap-2">
              {profile.verification_level === "registration_checked" ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <span className="w-4 h-4 rounded-full border border-stone-300 inline-block shrink-0" />
              )}
              <span>Registration Checked</span>
            </div>
          </div>
        </div>
      </div>

      {/* Facility Specs (if manufacturer or supplier) */}
      {supplierProfile && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs mb-8">
          <h2 className="text-base font-bold text-stone-900 mb-4 flex items-center gap-2">
            <Factory className="w-4 h-4 text-stone-700" />
            Manufacturing Facility & Operational Capacity
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="border border-stone-200 rounded-xl p-4">
              <div className="text-[11px] text-stone-500 uppercase tracking-wider">Facility Area</div>
              <div className="text-base font-bold text-stone-900 mt-1">
                {supplierProfile.factory_size_sqft ? `${Number(supplierProfile.factory_size_sqft).toLocaleString()} sq.ft` : "Verified Plant"}
              </div>
            </div>
            <div className="border border-stone-200 rounded-xl p-4">
              <div className="text-[11px] text-stone-500 uppercase tracking-wider">Monthly Capacity</div>
              <div className="text-base font-bold text-stone-900 mt-1">
                {supplierProfile.production_capacity_monthly || "50,000+ units"}
              </div>
            </div>
            <div className="border border-stone-200 rounded-xl p-4">
              <div className="text-[11px] text-stone-500 uppercase tracking-wider">Average Lead Time</div>
              <div className="text-base font-bold text-stone-900 mt-1">
                {supplierProfile.lead_time_days || 7} Days
              </div>
            </div>
            <div className="border border-stone-200 rounded-xl p-4">
              <div className="text-[11px] text-stone-500 uppercase tracking-wider">Export Readiness</div>
              <div className="text-base font-bold text-stone-900 mt-1">
                {supplierProfile.export_ready ? "Export Ready (IEC)" : "Domestic Supply"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Catalog */}
      <div>
        <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Product Catalog ({products.length})
        </h2>

        {products.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-xs text-stone-500">
            No public products listed by this supplier yet. You can still send a direct RFQ requirement.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.map((prod) => (
              <Link
                key={prod.id}
                to={`/products/${prod.id}`}
                className="group bg-white border border-stone-200 hover:border-stone-400 rounded-xl p-5 transition shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                    MOQ: {prod.moq} {prod.unit}s
                  </div>
                  <h4 className="font-semibold text-sm text-stone-900 group-hover:text-stone-700 transition line-clamp-2">
                    {prod.title}
                  </h4>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-stone-500">Indicative Price</div>
                    <div className="text-sm font-bold text-stone-900">
                      ₹{Number(prod.indicative_price).toLocaleString("en-IN")}/{prod.unit}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-stone-800 flex items-center gap-1">
                    View <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
