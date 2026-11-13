import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { BusinessServiceCategory } from "@/types";
import { Plus, Trash2, ArrowRight } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const ProviderServiceAddPage: React.FC = () => {
  const { business } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<BusinessServiceCategory[]>([]);
  const [selectedCatId, setSelectedCatId] = useState("");
  const [selectedSubId, setSelectedSubId] = useState("");
  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [fullDesc, setFullDesc] = useState("");
  const [pricingModel, setPricingModel] = useState<"fixed" | "starting_at" | "custom_quote">("starting_at");
  const [startingPrice, setStartingPrice] = useState("");
  const [turnaroundDays, setTurnaroundDays] = useState("3");
  const [deliverables, setDeliverables] = useState<string[]>(["Initial Consultation & Requirement Audit", "Drafting & Statutory Filing"]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/business-services/categories`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data.length > 0) {
          setCategories(d.data);
          setSelectedCatId(d.data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const activeCategory = categories.find((c) => c.id === selectedCatId);

  const handleAddDeliverable = () => {
    setDeliverables([...deliverables, ""]);
  };

  const handleRemoveDeliverable = (idx: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== idx));
  };

  const handleDeliverableChange = (idx: number, val: string) => {
    const updated = [...deliverables];
    updated[idx] = val;
    setDeliverables(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/business-services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: business.id,
          category_id: selectedCatId,
          subcategory_id: selectedSubId || null,
          title: title.trim(),
          short_description: shortDesc.trim(),
          full_description: fullDesc.trim() || null,
          deliverables: deliverables.filter((d) => d.trim().length > 0),
          pricing_model: pricingModel,
          starting_price: startingPrice ? Number.parseFloat(startingPrice) : null,
          turnaround_days: Number.parseInt(turnaroundDays, 10) || 3,
        }),
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.error || "Failed to create service listing.");
      }

      navigate("/provider/services");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to publish service listing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">List Professional Service</h1>
        <p className="text-xs text-stone-500 mt-1">
          Publish a structured service package to attract client inquiries across the COVERLY network
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
            Category & Classification
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Primary Category</label>
              <select
                value={selectedCatId}
                onChange={(e) => {
                  setSelectedCatId(e.target.value);
                  setSelectedSubId("");
                }}
                className="w-full text-xs p-2.5 border border-stone-200 rounded-lg bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Specialization / Subcategory</label>
              <select
                value={selectedSubId}
                onChange={(e) => setSelectedSubId(e.target.value)}
                className="w-full text-xs p-2.5 border border-stone-200 rounded-lg bg-white"
              >
                <option value="">General Specialization</option>
                {activeCategory?.subcategories?.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Service Listing Title</label>
            <input
              type="text"
              required
              placeholder="e.g. End-to-End GST Registration & Monthly Return Filing Setup"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs p-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Short Summary (1–2 sentences)</label>
            <input
              type="text"
              required
              placeholder="e.g. Complete regulatory filing with guaranteed ARN generation within 3 business days."
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              className="w-full text-xs p-2.5 border border-stone-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Full Scope of Work</label>
            <textarea
              rows={4}
              placeholder="Detail the complete procedure, statutory requirements, documentation checklist, and advisory support..."
              value={fullDesc}
              onChange={(e) => setFullDesc(e.target.value)}
              className="w-full text-xs p-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-800"
            />
          </div>
        </div>

        {/* Pricing & Commercials */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
            Commercial Model & Timelines
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Pricing Model</label>
              <select
                value={pricingModel}
                onChange={(e) => setPricingModel(e.target.value as any)}
                className="w-full text-xs p-2.5 border border-stone-200 rounded-lg bg-white"
              >
                <option value="starting_at">Starting Price (Onwards)</option>
                <option value="fixed">Fixed Package Price</option>
                <option value="custom_quote">Custom Quote Only</option>
              </select>
            </div>

            {pricingModel !== "custom_quote" && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Base Price (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 4500"
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-200 rounded-lg"
                />
              </div>
            )}

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
          </div>
        </div>

        {/* Milestone Deliverables */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
              Deliverables Checklist
            </h3>
            <button
              type="button"
              onClick={handleAddDeliverable}
              className="inline-flex items-center gap-1 text-xs font-semibold text-stone-900"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Deliverable
            </button>
          </div>

          <div className="space-y-2">
            {deliverables.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleDeliverableChange(idx, e.target.value)}
                  placeholder="e.g. Final Certificate PDF & Credentials Handover"
                  className="flex-1 text-xs p-2 border border-stone-200 rounded-lg"
                />
                {deliverables.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDeliverable(idx)}
                    className="p-1.5 text-stone-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
        >
          {isSubmitting ? "Publishing Service..." : "Publish Service Listing"}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
