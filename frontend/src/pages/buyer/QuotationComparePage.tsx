import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { Quotation } from "@/types";
import {
  CheckCircle,
  ShieldCheck,
  Building2,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingDown,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const QuotationComparePage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // RFQ ID
  const { user } = useAuth();
  const navigate = useNavigate();

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [bestQuoteId, setBestQuoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_BASE}/quotations/compare/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setQuotations(data.data);
          setBestQuoteId(data.bestQuoteId);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleAcceptQuote = async (quoteId: string) => {
    if (!user) return;
    setIsAccepting(quoteId);

    try {
      const res = await fetch(`${API_BASE}/quotations/${quoteId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyer_id: user.id }),
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.error || "Failed to accept quotation.");
      }

      navigate(`/buyer/orders/${body.data.id}`);
    } catch (err: any) {
      alert(err.message || "Failed to create order.");
      setIsAccepting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center animate-pulse">
        <div className="h-8 bg-stone-200 rounded w-1/3 mx-auto mb-4" />
        <div className="h-64 bg-stone-200 rounded-xl" />
      </div>
    );
  }

  if (quotations.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-stone-200 rounded-xl">
        <h3 className="text-sm font-semibold text-stone-800">No quotations to compare yet</h3>
        <p className="text-xs text-stone-500 mt-1">Quotations will populate once vendors submit their proposals.</p>
        <Link to={`/buyer/rfqs/${id}`} className="text-xs text-stone-900 underline mt-3 inline-block">
          Back to RFQ
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to={`/buyer/rfqs/${id}`} className="text-xs text-stone-500 hover:text-stone-900">
              ← RFQ Details
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Landed Cost Comparison Matrix
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Transparent side-by-side cost breakdown synthesized by COVERLY's verified calculation engine.
          </p>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quotations.map((q) => {
          const isBest = q.id === bestQuoteId;
          const cost = q.quotation_costs;
          const isProcessing = isAccepting === q.id;

          return (
            <div
              key={q.id}
              className={`bg-white rounded-2xl p-6 transition flex flex-col justify-between relative ${
                isBest
                  ? "border-2 border-emerald-600 shadow-md"
                  : "border border-stone-200 shadow-xs hover:border-stone-400"
              }`}
            >
              {isBest && (
                <div className="absolute -top-3 left-6 inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                  <Sparkles className="w-3 h-3" />
                  Lowest Landed Cost
                </div>
              )}

              <div>
                {/* Supplier Info */}
                <div className="flex items-start justify-between gap-2 mb-4 pt-1">
                  <div>
                    <h3 className="font-bold text-base text-stone-900">
                      {q.businesses?.name || "Verified Supplier"}
                    </h3>
                    <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5" />
                      {q.businesses?.city || "India"}
                    </p>
                  </div>

                  {q.businesses?.verification_level && q.businesses.verification_level !== "unverified" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>

                {/* Primary Metric Banner */}
                <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-4 text-center mb-6">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-stone-500">
                    Effective Landed Cost / Unit
                  </div>
                  <div className="text-2xl font-extrabold text-stone-900 mt-1">
                    ₹{Number(cost?.effective_landed_unit_cost || 0).toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    Total Delivered: ₹{Number(cost?.total_landed_cost || 0).toLocaleString("en-IN")}
                  </div>
                </div>

                {/* Breakdown Rows */}
                <div className="space-y-2 text-xs mb-6 divide-y divide-stone-100">
                  <div className="flex items-center justify-between pt-1.5">
                    <span className="text-stone-500">Base Goods Subtotal</span>
                    <span className="font-semibold text-stone-800">
                      ₹{Number(cost?.subtotal || 0).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1.5">
                    <span className="text-stone-500">Freight & Logistics</span>
                    <span className="font-semibold text-stone-800">
                      ₹{Number(cost?.freight || 0).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1.5">
                    <span className="text-stone-500">Packaging & Palletizing</span>
                    <span className="font-semibold text-stone-800">
                      ₹{Number(cost?.packaging || 0).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1.5">
                    <span className="text-stone-500">Transit Insurance</span>
                    <span className="font-semibold text-stone-800">
                      ₹{Number(cost?.insurance || 0).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1.5">
                    <span className="text-stone-500">GST ({Number(cost?.gst_rate || 0.18) * 100}%)</span>
                    <span className="font-semibold text-stone-800">
                      ₹{Number(cost?.gst_amount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-xs font-bold text-stone-900">
                    <span>Total Landed Sourcing Cost</span>
                    <span>₹{Number(cost?.total_landed_cost || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Fulfillment terms */}
                <div className="bg-stone-50 p-3 rounded-lg text-[11px] text-stone-600 space-y-1 mb-6">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>Lead Time: <strong>{q.lead_time_days} days to dispatch</strong></span>
                  </div>
                  <div>Valid until: <strong>{q.valid_until}</strong></div>
                  {q.terms_and_conditions && (
                    <div className="text-[10px] text-stone-400 italic">Terms: {q.terms_and_conditions}</div>
                  )}
                </div>
              </div>

              {/* Action */}
              {q.status === "accepted" ? (
                <div className="w-full py-2.5 text-center text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-xl border border-emerald-200">
                  ✓ Quotation Accepted
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleAcceptQuote(q.id)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                    isBest
                      ? "bg-stone-900 text-white hover:bg-stone-800 shadow-xs"
                      : "bg-stone-100 text-stone-800 hover:bg-stone-200"
                  }`}
                >
                  {isProcessing ? "Converting to Order..." : "Accept Quotation & Create Order"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
