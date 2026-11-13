import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { ServiceRequest } from "@/types";
import { Send, MapPin, Calendar, Plus, Trash2, ArrowRight } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const ProviderQuoteBuilderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // request id
  const { user, business } = useAuth();
  const navigate = useNavigate();

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [quotedPrice, setQuotedPrice] = useState("");
  const [scopeOfWork, setScopeOfWork] = useState("");
  const [turnaroundDays, setTurnaroundDays] = useState("5");
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [terms, setTerms] = useState("50% retainer upon engagement; 50% upon final certificate/deliverable handover.");
  const [deliverables, setDeliverables] = useState<string[]>([
    "Statutory Documentation Preparation",
    "Government Portal Submission & ARN",
    "Final Certificate Handover",
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/business-services/requests/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setRequest(data.data);
          setScopeOfWork(`In response to your inquiry regarding ${data.data.title}, we will handle complete execution including all filings, compliance audits, and advisory assistance.`);
          if (data.data.budget) {
            setQuotedPrice(String(data.data.budget));
          }
        }
      })
      .catch(() => {});
  }, [id]);

  const handleAddDeliverable = () => setDeliverables([...deliverables, ""]);
  const handleRemoveDeliverable = (idx: number) => setDeliverables(deliverables.filter((_, i) => i !== idx));
  const handleDeliverableChange = (idx: number, val: string) => {
    const updated = [...deliverables];
    updated[idx] = val;
    setDeliverables(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !business || !request) return;
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/business-services/quotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: request.id,
          provider_business_id: business.id,
          provider_user_id: user.id,
          quoted_price: Number.parseFloat(quotedPrice),
          scope_of_work: scopeOfWork.trim(),
          deliverables: deliverables.filter((d) => d.trim().length > 0),
          turnaround_days: Number.parseInt(turnaroundDays, 10) || 3,
          valid_until: validUntil,
          terms: terms.trim() || undefined,
        }),
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.error || "Failed to submit quotation.");
      }

      navigate("/provider/inquiries");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit quotation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!request) {
    return <div className="py-12 text-center text-xs text-stone-500">Loading inquiry specifications...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <div>
        <Link to="/provider/inquiries" className="text-xs text-stone-500 hover:text-stone-900">
          ← Back to Inquiries
        </Link>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight mt-1">
          Prepare Formal Service Quotation
        </h1>
        <p className="text-xs text-stone-500">
          For requirement: <span className="font-semibold text-stone-800">{request.title}</span> ({request.request_number})
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-lg">
          {errorMsg}
        </div>
      )}

      {/* Customer Requirement Summary */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 text-xs text-stone-700 space-y-2">
        <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wider">Client Requirements</h3>
        <p className="whitespace-pre-line text-stone-600 leading-relaxed">{request.requirements}</p>
        <div className="pt-2 flex flex-wrap gap-4 text-stone-500 text-[11px]">
          {request.delivery_city && <span>Location: <strong>{request.delivery_city}</strong></span>}
          {request.target_timeline && <span>Timeline: <strong>{request.target_timeline}</strong></span>}
          {request.budget && <span>Budget: <strong>₹{Number(request.budget).toLocaleString("en-IN")}</strong></span>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
          Formal Proposal Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Total Fee / Quoted Price (₹)</label>
            <input
              type="number"
              required
              placeholder="e.g. 12500"
              value={quotedPrice}
              onChange={(e) => setQuotedPrice(e.target.value)}
              className="w-full text-xs p-2.5 border border-stone-200 rounded-lg font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Turnaround Days</label>
            <input
              type="number"
              required
              min="1"
              value={turnaroundDays}
              onChange={(e) => setTurnaroundDays(e.target.value)}
              className="w-full text-xs p-2.5 border border-stone-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Quote Validity Date</label>
            <input
              type="date"
              required
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full text-xs p-2.5 border border-stone-200 rounded-lg bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Scope of Work</label>
          <textarea
            required
            rows={3}
            value={scopeOfWork}
            onChange={(e) => setScopeOfWork(e.target.value)}
            className="w-full text-xs p-2.5 border border-stone-200 rounded-lg"
          />
        </div>

        {/* Deliverables Checklist */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-stone-700">Milestone Deliverables</label>
            <button
              type="button"
              onClick={handleAddDeliverable}
              className="inline-flex items-center gap-1 text-xs font-semibold text-stone-900"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          <div className="space-y-2">
            {deliverables.map((d, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={d}
                  onChange={(e) => handleDeliverableChange(idx, e.target.value)}
                  className="flex-1 text-xs p-2 border border-stone-200 rounded-lg"
                />
                {deliverables.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDeliverable(idx)}
                    className="p-1.5 text-stone-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Commercial Terms & Payment Milestones</label>
          <input
            type="text"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            className="w-full text-xs p-2.5 border border-stone-200 rounded-lg"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
        >
          {isSubmitting ? "Submitting Quotation..." : "Submit Formal Service Quotation"}
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
