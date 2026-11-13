import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Send, Building2, Briefcase, ArrowRight } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const RequestServicePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const prefillServiceId = searchParams.get("service_id") || "";
  const prefillProviderId = searchParams.get("provider_business_id") || "";
  const prefillTitle = searchParams.get("title") || "";

  const [title, setTitle] = useState(prefillTitle ? `Inquiry for ${prefillTitle}` : "");
  const [requirements, setRequirements] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [targetTimeline, setTargetTimeline] = useState("Within 2 weeks");
  const [budget, setBudget] = useState("");
  const [providerBusinessId, setProviderBusinessId] = useState(prefillProviderId);
  const [providers, setProviders] = useState<any[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // If no provider prefilled, fetch providers for select
    if (!prefillProviderId) {
      fetch(`${API_BASE}/business-services/providers`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setProviders(d.data);
        })
        .catch(() => {});
    }
  }, [prefillProviderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate(`/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    if (!providerBusinessId) {
      setErrorMsg("Please select a service provider firm.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/business-services/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: user.id,
          service_id: prefillServiceId || null,
          provider_business_id: providerBusinessId,
          title: title.trim(),
          requirements: requirements.trim(),
          delivery_city: deliveryCity.trim() || null,
          target_timeline: targetTimeline.trim() || null,
          budget: budget ? Number.parseFloat(budget) : null,
        }),
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.error || "Failed to submit request.");
      }

      navigate(`/services/my-requests/${body.data.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit inquiry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Request Professional Service</h1>
        <p className="text-xs text-stone-500 mt-1">
          Submit your scope of requirements to receive a formal quotation and execution milestones
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {!prefillProviderId && (
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Target Service Provider</label>
            <select
              value={providerBusinessId}
              onChange={(e) => setProviderBusinessId(e.target.value)}
              required
              className="w-full text-xs p-2.5 border border-stone-200 rounded-lg bg-white"
            >
              <option value="">Select a professional firm...</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.city})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Inquiry / Project Title</label>
          <input
            type="text"
            required
            placeholder="e.g. Private Limited Company Registration & GST Setup"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xs p-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-800"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Detailed Requirements & Scope</label>
          <textarea
            required
            rows={4}
            placeholder="Detail your requirements, current stage of business, any specific statutory deadlines, or deliverables required..."
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            className="w-full text-xs p-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-800"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">City / Region</label>
            <input
              type="text"
              placeholder="e.g. Mumbai, Maharashtra"
              value={deliveryCity}
              onChange={(e) => setDeliveryCity(e.target.value)}
              className="w-full text-xs p-2.5 border border-stone-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Target Timeline</label>
            <select
              value={targetTimeline}
              onChange={(e) => setTargetTimeline(e.target.value)}
              className="w-full text-xs p-2.5 border border-stone-200 rounded-lg bg-white"
            >
              <option value="Urgent (1-3 days)">Urgent (1–3 days)</option>
              <option value="Within 1 week">Within 1 week</option>
              <option value="Within 2 weeks">Within 2 weeks</option>
              <option value="Within 1 month">Within 1 month</option>
              <option value="Flexible">Flexible Schedule</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Estimated Budget (₹, Optional)</label>
            <input
              type="number"
              placeholder="e.g. 15000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full text-xs p-2.5 border border-stone-200 rounded-lg"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
        >
          {isSubmitting ? "Submitting Inquiry..." : "Submit Inquiry to Service Provider"}
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
