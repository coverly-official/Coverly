import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { BusinessService } from "@/types";
import { PlusCircle, Briefcase, ArrowRight } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const ProviderServicesPage: React.FC = () => {
  const { business } = useAuth();
  const [services, setServices] = useState<BusinessService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!business) return;
    setIsLoading(true);

    fetch(`${API_BASE}/business-services?business_id=${business.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setServices(data.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [business]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Service Listings</h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage your firm's professional services, deliverable scopes, and commercial packages
          </p>
        </div>

        <Link
          to="/provider/services/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition shadow-xs self-start"
        >
          <PlusCircle className="w-4 h-4" />
          List New Service
        </Link>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-stone-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-stone-800">No services listed yet</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
              Add your firm's services (e.g. GST Registration, Trademark Filing, ERP, Warehousing) to start receiving client inquiries.
            </p>
            <Link
              to="/provider/services/new"
              className="text-xs font-semibold px-4 py-2 bg-stone-900 text-white rounded-lg inline-block"
            >
              Add First Service
            </Link>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold uppercase tracking-wider text-stone-700">
              <tr>
                <th className="py-3.5 px-4">Service Title</th>
                <th className="py-3.5 px-4">Pricing Model</th>
                <th className="py-3.5 px-4">Starting Price</th>
                <th className="py-3.5 px-4">Turnaround</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-stone-50/70 transition">
                  <td className="py-3 px-4 font-semibold text-stone-900">{s.title}</td>
                  <td className="py-3 px-4 capitalize">{s.pricing_model.replace("_", " ")}</td>
                  <td className="py-3 px-4 font-bold text-stone-900">
                    {s.pricing_model === "custom_quote"
                      ? "Custom Quote"
                      : `₹${Number(s.starting_price || 0).toLocaleString("en-IN")}`}
                  </td>
                  <td className="py-3 px-4 text-stone-600">{s.turnaround_days} Days</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/services/${s.id}`}
                      className="font-semibold text-stone-900 hover:underline inline-flex items-center gap-1"
                    >
                      View Live <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
