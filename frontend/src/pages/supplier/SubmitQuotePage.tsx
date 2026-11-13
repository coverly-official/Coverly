import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { RFQ } from "@/types";
import { calculateLandedCost } from "@/lib/landed-cost";
import { Send, MapPin, Calculator, Calendar, Clock } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const SubmitQuotePage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // RFQ ID
  const { user, business } = useAuth();
  const navigate = useNavigate();

  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [itemPrices, setItemPrices] = useState<Record<string, string>>({});
  const [freight, setFreight] = useState("3500");
  const [packaging, setPackaging] = useState("1000");
  const [insurance, setInsurance] = useState("500");
  const [gstRate, setGstRate] = useState("0.18");
  const [leadTimeDays, setLeadTimeDays] = useState("7");
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [terms, setTerms] = useState("50% advance upon order placement, 50% prior to dispatch.");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_BASE}/rfqs/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setRfq(data.data);
          const initialPrices: Record<string, string> = {};
          data.data.items?.forEach((it: any) => {
            initialPrices[it.id || it.item_name] = it.target_unit_price ? String(it.target_unit_price) : "200";
          });
          setItemPrices(initialPrices);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [id]);

  // Compute live landed cost
  let totalSubtotal = 0;
  let totalQuantity = 0;
  if (rfq?.items) {
    rfq.items.forEach((it) => {
      const q = it.quantity || 1;
      const p = Number.parseFloat(itemPrices[it.id || it.item_name] || "0") || 0;
      totalSubtotal += q * p;
      totalQuantity += q;
    });
  }

  const effectiveAvgPrice = totalQuantity > 0 ? totalSubtotal / totalQuantity : 0;
  const parsedFreight = Number.parseFloat(freight) || 0;
  const parsedPackaging = Number.parseFloat(packaging) || 0;
  const parsedInsurance = Number.parseFloat(insurance) || 0;
  const parsedGstRate = Number.parseFloat(gstRate) || 0.18;

  const baseCalc = calculateLandedCost({
    unitPrice: effectiveAvgPrice,
    quantity: totalQuantity,
    freight: parsedFreight,
    gstRate: parsedGstRate,
  });

  const totalDeliveredCost = baseCalc.totalCost + parsedPackaging + parsedInsurance;
  const effectiveDeliveredUnitCost =
    totalQuantity > 0 ? Math.round((totalDeliveredCost / totalQuantity) * 100) / 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !business || !rfq) return;
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const itemsPayload = rfq.items?.map((it) => ({
        rfq_item_id: it.id,
        item_name: it.item_name,
        quantity: it.quantity,
        unit: it.unit,
        unit_price: Number.parseFloat(itemPrices[it.id || it.item_name] || "0") || 0,
      }));

      const res = await fetch(`${API_BASE}/quotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfq_id: rfq.id,
          supplier_business_id: business.id,
          supplier_user_id: user.id,
          valid_until: validUntil,
          lead_time_days: Number.parseInt(leadTimeDays, 10) || 7,
          terms_and_conditions: terms,
          items: itemsPayload,
          freight: parsedFreight,
          packaging: parsedPackaging,
          insurance: parsedInsurance,
          gst_rate: parsedGstRate,
        }),
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.error || "Failed to submit quotation.");
      }

      navigate("/supplier/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit quotation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="py-12 text-center animate-pulse">Loading RFQ specifications...</div>;
  }

  if (!rfq) {
    return <div className="text-center py-16">RFQ not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <Link to="/supplier/rfqs" className="text-xs text-stone-500 hover:text-stone-900">
          ← Back to Incoming RFQs
        </Link>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight mt-1">
          Prepare & Submit Quotation
        </h1>
        <p className="text-xs text-stone-500">
          For requirement: <span className="font-semibold text-stone-800">{rfq.title}</span> ({rfq.rfq_number})
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* RFQ Destination & Terms Recap */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs text-stone-600 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-stone-500" />
            <span>Buyer Delivery Destination: <strong>{rfq.delivery_city} ({rfq.delivery_pincode})</strong></span>
          </div>
          <div>
            Required By: <strong>{rfq.target_delivery_date || "Standard Schedule"}</strong>
          </div>
        </div>

        {/* Item Pricing */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
            1. Unit Pricing per Line Item
          </h3>

          <div className="divide-y divide-stone-100">
            {rfq.items?.map((it) => {
              const itKey = it.id || it.item_name;
              return (
                <div key={itKey} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-stone-900">{it.item_name}</div>
                    <div className="text-stone-500">
                      Quantity: <strong>{it.quantity} {it.unit}s</strong>
                      {it.target_unit_price && ` • Buyer target: ₹${it.target_unit_price}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-stone-500">Ex-Factory Unit Price: ₹</span>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={itemPrices[itKey] || ""}
                      onChange={(e) => setItemPrices({ ...itemPrices, [itKey]: e.target.value })}
                      className="w-28 text-xs p-1.5 border border-stone-200 rounded bg-white font-bold"
                    />
                    <span className="text-stone-500">/{it.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Freight, Packaging & GST */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
            2. Logistics, Packaging & Tax Parameters
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-stone-700 mb-1">Freight (₹)</label>
              <input
                type="number"
                required
                value={freight}
                onChange={(e) => setFreight(e.target.value)}
                className="w-full text-xs p-2 border border-stone-200 rounded"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-700 mb-1">Packaging (₹)</label>
              <input
                type="number"
                value={packaging}
                onChange={(e) => setPackaging(e.target.value)}
                className="w-full text-xs p-2 border border-stone-200 rounded"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-700 mb-1">Transit Insurance (₹)</label>
              <input
                type="number"
                value={insurance}
                onChange={(e) => setInsurance(e.target.value)}
                className="w-full text-xs p-2 border border-stone-200 rounded"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-700 mb-1">GST Sourcing Bracket</label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(e.target.value)}
                className="w-full text-xs p-2 border border-stone-200 rounded bg-white"
              >
                <option value="0.05">5% GST (Textiles/Garments)</option>
                <option value="0.12">12% GST</option>
                <option value="0.18">18% GST (Steel/Packaging/General)</option>
                <option value="0.28">28% GST</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <label className="block text-[11px] font-medium text-stone-700 mb-1">Dispatch Lead Time (Days)</label>
              <input
                type="number"
                required
                min="1"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(e.target.value)}
                className="w-full text-xs p-2 border border-stone-200 rounded"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-700 mb-1">Quotation Validity Date</label>
              <input
                type="date"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full text-xs p-2 border border-stone-200 rounded bg-white"
              />
            </div>
          </div>
        </div>

        {/* Live Landed Cost Summary Box */}
        <div className="bg-stone-900 text-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
            <Calculator className="w-4 h-4 text-emerald-400" />
            Computed Landed Cost Preview (Buyer Matrix Display)
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-stone-800 text-xs">
            <div>
              <span className="text-stone-400 text-[10px]">Goods Subtotal:</span>
              <div className="font-bold text-sm mt-0.5">₹{totalSubtotal.toLocaleString("en-IN")}</div>
            </div>
            <div>
              <span className="text-stone-400 text-[10px]">Freight & Handling:</span>
              <div className="font-bold text-sm mt-0.5">₹{(parsedFreight + parsedPackaging + parsedInsurance).toLocaleString("en-IN")}</div>
            </div>
            <div>
              <span className="text-stone-400 text-[10px]">GST Amount ({parsedGstRate * 100}%):</span>
              <div className="font-bold text-sm mt-0.5">₹{baseCalc.gstAmount.toLocaleString("en-IN")}</div>
            </div>
            <div>
              <span className="text-emerald-400 text-[10px] font-bold">Total Landed Value:</span>
              <div className="font-extrabold text-base text-emerald-400 mt-0.5">₹{totalDeliveredCost.toLocaleString("en-IN")}</div>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between text-xs">
            <span className="text-stone-400">Effective Landed Cost Per Unit:</span>
            <span className="text-base font-bold text-white">
              ₹{effectiveDeliveredUnitCost.toLocaleString("en-IN")} / unit
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
        >
          {isSubmitting ? "Submitting Quotation..." : "Submit Quotation to Buyer"}
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
