import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Truck,
  ShieldCheck,
  MapPin,
  Star,
  CheckCircle,
  Building2,
  Globe,
  Clock,
  ArrowRight,
  Send,
  Layers,
  Boxes,
  FileCheck,
  ChevronRight,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const LogisticsCompanyDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [company, setCompany] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_BASE}/logistics/companies/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setCompany(data.data);
        } else {
          setError(data.error || "Company not found.");
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load company profile.");
      })
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 animate-pulse">
        <div className="h-10 bg-stone-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-stone-200 rounded w-1/4 mb-8" />
        <div className="h-48 bg-stone-200 rounded-2xl mb-8" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-stone-900 mb-2">Logistics Carrier Not Found</h2>
        <p className="text-xs text-stone-500 mb-6">{error || "The requested profile is unavailable."}</p>
        <Link to="/logistics/companies" className="text-xs font-semibold px-4 py-2 bg-stone-900 text-white rounded-lg">
          Browse Directory
        </Link>
      </div>
    );
  }

  const p = company.logistics_profile;
  const services: any[] = company.services || [];
  const routes: any[] = company.routes || [];

  return (
    <div className="bg-stone-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-4">
          <Link to="/" className="hover:text-stone-900">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/logistics" className="hover:text-stone-900">Logistics</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/logistics/companies" className="hover:text-stone-900">Carriers</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-stone-900 font-medium truncate">{company.name}</span>
        </div>

        {/* Company Header Card */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {company.verification_level !== "unverified" && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    VERIFIED FREIGHT CARRIER
                  </span>
                )}
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100">
                  Fleet: {p?.fleet_size || 25}+ Trucks
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                {company.name}
              </h1>
              {company.legal_name && (
                <p className="text-xs text-stone-500 mt-0.5">Legal Entity: {company.legal_name}</p>
              )}
              <p className="text-xs font-medium text-blue-900 mt-1">{p?.tagline}</p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 mt-4">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-stone-400" />
                  {company.city}, {company.state} ({company.pincode})
                </span>
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-blue-900 hover:underline"
                  >
                    <Globe className="w-4 h-4 text-stone-400" />
                    {company.website}
                  </a>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-3">
              <div className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>{p?.rating || "4.8"} / 5.0</span>
                <span className="text-xs text-stone-500 font-normal">({p?.total_shipments_delivered || 450}+ Trips)</span>
              </div>

              <Link
                to={`/logistics/book?company_id=${company.id}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                <Send className="w-4 h-4" />
                Request Freight Quote
              </Link>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
            <div className="border border-stone-200/80 bg-stone-50/50 rounded-xl p-3.5">
              <div className="text-[11px] text-stone-500 uppercase tracking-wider">Fleet Size</div>
              <div className="text-base font-bold text-stone-900 mt-0.5">{p?.fleet_size || 25}+ Vehicles</div>
            </div>
            <div className="border border-stone-200/80 bg-stone-50/50 rounded-xl p-3.5">
              <div className="text-[11px] text-stone-500 uppercase tracking-wider">Min Cargo Weight</div>
              <div className="text-base font-bold text-stone-900 mt-0.5">{p?.minimum_shipment_weight_kg || 5} kg</div>
            </div>
            <div className="border border-stone-200/80 bg-stone-50/50 rounded-xl p-3.5">
              <div className="text-[11px] text-stone-500 uppercase tracking-wider">Tracking Support</div>
              <div className="text-base font-bold text-stone-900 mt-0.5 uppercase">{p?.tracking_support || "Manual & API"}</div>
            </div>
            <div className="border border-stone-200/80 bg-stone-50/50 rounded-xl p-3.5">
              <div className="text-[11px] text-stone-500 uppercase tracking-wider">Completed Trips</div>
              <div className="text-base font-bold text-stone-900 mt-0.5">{p?.total_shipments_delivered || 450}+ Deliveries</div>
            </div>
          </div>
        </div>

        {/* Published Services & Indicative Rates */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Published Freight Services & Rates</h2>
              <p className="text-xs text-stone-500 mt-0.5">Indicative base rates published by carrier. Final quotation confirmed upon enquiry.</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-900 rounded-lg">
              {services.length} Services Available
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
                  <th className="py-3 px-4 font-semibold">Service Name</th>
                  <th className="py-3 px-4 font-semibold">Mode</th>
                  <th className="py-3 px-4 font-semibold">Pricing Model</th>
                  <th className="py-3 px-4 font-semibold">Base Rate</th>
                  <th className="py-3 px-4 font-semibold">Min Charge</th>
                  <th className="py-3 px-4 font-semibold">Est. Transit</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {services.map((srv, idx) => (
                  <tr key={srv.id || idx} className="hover:bg-stone-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-stone-900">
                      <div>{srv.service_name}</div>
                      <div className="text-[11px] font-normal text-stone-500 mt-0.5 line-clamp-1">{srv.description}</div>
                    </td>
                    <td className="py-3.5 px-4 uppercase text-stone-600 font-semibold">{srv.transport_mode}</td>
                    <td className="py-3.5 px-4 text-stone-600">{srv.pricing_model?.replace("_", " ")}</td>
                    <td className="py-3.5 px-4 font-bold text-stone-900">
                      ₹{Number(srv.base_rate).toLocaleString("en-IN")}
                      <span className="text-[10px] text-stone-500 font-normal"> / {srv.pricing_model === "per_km" ? "km" : srv.pricing_model === "per_kg" ? "kg" : "unit"}</span>
                    </td>
                    <td className="py-3.5 px-4 text-stone-600">₹{Number(srv.min_charge).toLocaleString("en-IN")}</td>
                    <td className="py-3.5 px-4 text-stone-600">{srv.transit_time_days || 3} Days</td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/logistics/book?company_id=${company.id}&service_id=${srv.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold transition"
                      >
                        Book <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operating Corridors & Serviceable States */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-900" />
              Regular Freight Corridors
            </h3>
            <ul className="space-y-2 text-xs text-stone-700">
              {(p?.operating_routes || [`${company.city} - Delhi`, `${company.city} - Mumbai`]).map((r: string, idx: number) => (
                <li key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 border border-stone-200/60">
                  <span className="w-2 h-2 rounded-full bg-blue-900" />
                  <span className="font-medium">{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-900" />
              Serviceable States & Hubs
            </h3>
            <div className="flex flex-wrap gap-2 text-xs">
              {(p?.serviceable_states || [company.state, "Maharashtra", "Gujarat", "Delhi NCR", "Karnataka"]).map((st: string, idx: number) => (
                <span key={idx} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-900 font-semibold border border-blue-100">
                  {st}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
