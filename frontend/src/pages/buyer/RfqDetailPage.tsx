import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import type { RFQ, Quotation } from "@/types";
import {
  FileText,
  MapPin,
  Calendar,
  Layers,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  Clock,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const RfqDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_BASE}/rfqs/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRfq(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-stone-200 rounded w-1/3" />
        <div className="h-32 bg-stone-200 rounded-xl" />
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="text-center py-16 bg-white border border-stone-200 rounded-xl">
        <h3 className="text-sm font-semibold text-stone-800">RFQ not found</h3>
        <Link to="/buyer/rfqs" className="text-xs text-stone-900 underline mt-2 inline-block">
          Return to RFQs
        </Link>
      </div>
    );
  }

  const quotations: Quotation[] = rfq.quotations || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
              {rfq.rfq_number}
            </span>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                rfq.status === "quotes_received"
                  ? "bg-emerald-100 text-emerald-800"
                  : rfq.status === "accepted"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-stone-100 text-stone-700"
              }`}
            >
              {rfq.status.replace("_", " ")}
            </span>
          </div>

          <h1 className="text-xl font-bold text-stone-900">{rfq.title}</h1>
          <p className="text-xs text-stone-500 flex items-center gap-2 mt-1">
            <MapPin className="w-3.5 h-3.5" />
            Destination: {rfq.delivery_city} ({rfq.delivery_pincode}) • Mode: {rfq.dispatch_mode}
          </p>
        </div>

        {quotations.length > 0 && (
          <Link
            to={`/buyer/rfqs/${rfq.id}/compare`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition shadow-xs self-start"
          >
            <BarChart3 className="w-4 h-4" />
            Compare Landed Costs ({quotations.length} Quotes)
          </Link>
        )}
      </div>

      {/* Line Items */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700 mb-4">
          Requested Line Items
        </h3>
        <div className="divide-y divide-stone-100">
          {rfq.items?.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold text-stone-900">{item.item_name}</div>
                {item.target_unit_price && (
                  <div className="text-[11px] text-stone-500">
                    Target: ₹{item.target_unit_price}/{item.unit}
                  </div>
                )}
              </div>
              <div className="font-bold text-stone-900">
                {item.quantity} {item.unit}s
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Received Quotations */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
            Received Supplier Quotations ({quotations.length})
          </h3>
          {quotations.length > 1 && (
            <Link
              to={`/buyer/rfqs/${rfq.id}/compare`}
              className="text-xs font-semibold text-stone-900 hover:underline flex items-center gap-1"
            >
              Side-by-side Matrix <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {quotations.length === 0 ? (
          <div className="text-center py-8 text-xs text-stone-500">
            Suppliers are reviewing your RFQ specifications. Quotations will appear here as soon as submitted.
          </div>
        ) : (
          <div className="space-y-3">
            {quotations.map((q) => {
              const cost = q.quotation_costs;
              return (
                <div
                  key={q.id}
                  className="p-4 border border-stone-200 rounded-lg hover:border-stone-400 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-stone-900">
                        {q.businesses?.name || "Verified Supplier"}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">{q.quotation_number}</span>
                      {q.businesses?.verification_level && q.businesses.verification_level !== "unverified" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                          <ShieldCheck className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-1">
                      Lead time: {q.lead_time_days} days • Valid until: {q.valid_until}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[10px] text-stone-500 uppercase tracking-wider">
                        Effective Landed / Unit
                      </div>
                      <div className="text-sm font-bold text-stone-900">
                        ₹{Number(cost?.effective_landed_unit_cost || 0).toLocaleString("en-IN")}
                      </div>
                      <div className="text-[10px] text-stone-500">
                        Total: ₹{Number(cost?.total_landed_cost || 0).toLocaleString("en-IN")} (incl. Freight & GST)
                      </div>
                    </div>

                    <Link
                      to={`/buyer/rfqs/${rfq.id}/compare`}
                      className="px-3 py-1.5 bg-stone-900 text-white rounded text-xs font-semibold hover:bg-stone-800 transition"
                    >
                      Inspect
                    </Link>
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
