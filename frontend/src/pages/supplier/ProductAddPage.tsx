import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { ProductCategory } from "@/types";
import { Package, ArrowRight, Plus, Trash2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const ProductAddPage: React.FC = () => {
  const { business } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    category_id: "cotton-tshirts",
    description: "",
    moq: "100",
    unit: "pc",
    indicative_price: "",
    hs_code: "",
  });

  const [tieredPricing, setTieredPricing] = useState<Array<{ minQty: number; maxQty?: number; unitPrice: number }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/categories`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCategories(d.data);
      })
      .catch(() => {});
  }, []);

  const handleAddTier = () => {
    setTieredPricing([
      ...tieredPricing,
      { minQty: 500, maxQty: 1000, unitPrice: 0 },
    ]);
  };

  const handleRemoveTier = (idx: number) => {
    setTieredPricing(tieredPricing.filter((_, i) => i !== idx));
  };

  const handleTierChange = (idx: number, field: string, val: any) => {
    const updated = [...tieredPricing];
    (updated[idx] as any)[field] = val;
    setTieredPricing(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: business.id,
          category_id: formData.category_id,
          title: formData.title.trim(),
          description: formData.description?.trim() || null,
          moq: Number.parseInt(formData.moq, 10) || 1,
          unit: formData.unit,
          indicative_price: Number.parseFloat(formData.indicative_price) || 0,
          hs_code: formData.hs_code?.trim() || null,
          tiered_pricing: tieredPricing,
        }),
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.error || "Failed to create product.");
      }

      navigate("/supplier/products");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add product listing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Add Wholesale Product</h1>
        <p className="text-xs text-stone-500 mt-1">
          Publish a new factory SKU with transparent MOQ and volume discount tiers
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">Product Specification</h3>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Product Title</label>
            <input
              type="text"
              required
              placeholder="e.g. 100% Organic Bio-Washed Single Jersey T-Shirt"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Category</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">HS Code (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 61091000"
                value={formData.hs_code}
                onChange={(e) => setFormData({ ...formData, hs_code: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Minimum Order Qty (MOQ)</label>
              <input
                type="number"
                required
                min="1"
                value={formData.moq}
                onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Unit of Measure</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 bg-white"
              >
                <option value="pc">Piece (pc)</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="box">Box (box)</option>
                <option value="meter">Meter (meter)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Indicative Base Price (₹)</label>
              <input
                type="number"
                required
                step="0.01"
                placeholder="210.00"
                value={formData.indicative_price}
                onChange={(e) => setFormData({ ...formData, indicative_price: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Detailed Description & Specs</label>
            <textarea
              rows={4}
              placeholder="Detail composition, GSM, dimensions, packaging standards, and color fastness..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
            />
          </div>
        </div>

        {/* Tiered Volume Discounts (Optional) */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
              Volume Discount Tiers (Optional)
            </h3>
            <button
              type="button"
              onClick={handleAddTier}
              className="inline-flex items-center gap-1 text-xs font-semibold text-stone-900"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Price Tier
            </button>
          </div>

          {tieredPricing.map((tier, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs">
              <div className="flex-1">
                <span className="text-[10px] text-stone-500 block mb-1">Min Qty</span>
                <input
                  type="number"
                  value={tier.minQty}
                  onChange={(e) => handleTierChange(idx, "minQty", Number(e.target.value))}
                  className="w-full text-xs p-1.5 border border-stone-200 rounded bg-white"
                />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-stone-500 block mb-1">Max Qty (optional)</span>
                <input
                  type="number"
                  value={tier.maxQty || ""}
                  onChange={(e) => handleTierChange(idx, "maxQty", e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full text-xs p-1.5 border border-stone-200 rounded bg-white"
                />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-stone-500 block mb-1">Discounted Unit Price (₹)</span>
                <input
                  type="number"
                  value={tier.unitPrice}
                  onChange={(e) => handleTierChange(idx, "unitPrice", Number(e.target.value))}
                  className="w-full text-xs p-1.5 border border-stone-200 rounded bg-white"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveTier(idx)}
                className="p-1.5 text-stone-400 hover:text-red-600 mt-4"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
        >
          {isSubmitting ? "Publishing SKU..." : "Publish Product to Wholesale Marketplace"}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
