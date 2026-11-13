import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { ProductCategory } from "@/types";
import { Plus, Trash2, ArrowRight, Layers, MapPin, Calendar, Send } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const RfqCreatePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const prefillTitle = searchParams.get("title") || "";
  const prefillCategory = searchParams.get("category") || "cotton-tshirts";
  const prefillMoq = searchParams.get("moq") || "500";

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [title, setTitle] = useState(prefillTitle ? `Requirement for ${prefillTitle}` : "");
  const [category, setCategory] = useState(prefillCategory);
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [dispatchMode, setDispatchMode] = useState<"broadcast" | "direct">("broadcast");
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState([
    {
      item_name: prefillTitle || "Primary Item",
      quantity: prefillMoq,
      unit: "pc",
      target_unit_price: "",
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/categories`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setCategories(data.data);
      })
      .catch(() => {});
  }, []);

  const handleAddItem = () => {
    setItems([
      ...items,
      { item_name: "", quantity: "100", unit: "pc", target_unit_price: "" },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, val: string) => {
    const updated = [...items];
    (updated[index] as any)[field] = val;
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/rfqs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_id: user.id,
          title: title.trim(),
          category_id: category,
          delivery_city: city.trim(),
          delivery_pincode: pincode.trim(),
          target_delivery_date: targetDate || null,
          dispatch_mode: dispatchMode,
          notes: notes?.trim() || null,
          items: items.map((it) => ({
            item_name: it.item_name.trim(),
            quantity: Number.parseInt(it.quantity, 10) || 1,
            unit: it.unit,
            target_unit_price: it.target_unit_price ? Number.parseFloat(it.target_unit_price) : null,
          })),
        }),
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.error || "Failed to create RFQ.");
      }

      navigate(`/buyer/rfqs/${body.data.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit RFQ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Create Sourcing RFQ</h1>
        <p className="text-xs text-stone-500 mt-1">
          Specify your bulk procurement line items to receive competitive landed-cost proposals.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic RFQ Info */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
            Requirement Overview
          </h3>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">RFQ Title</label>
            <input
              type="text"
              required
              placeholder="e.g. 5,000 Pcs Combed Cotton T-Shirts for Export"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-stone-800"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Target Delivery Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-stone-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Destination City</label>
              <input
                type="text"
                required
                placeholder="e.g. Mumbai"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Delivery Pincode (Freight origin calculation)</label>
              <input
                type="text"
                required
                placeholder="e.g. 400001"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
              Procurement Line Items
            </h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 text-xs font-semibold text-stone-900 hover:text-stone-700"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Line Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="p-3 border border-stone-200/80 rounded-lg bg-stone-50/50 flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">Item Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 180 GSM Round Neck Black"
                    value={item.item_name}
                    onChange={(e) => handleItemChange(idx, "item_name", e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded border border-stone-200 bg-white"
                  />
                </div>

                <div className="w-24">
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">Qty</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded border border-stone-200 bg-white"
                  />
                </div>

                <div className="w-20">
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">Unit</label>
                  <select
                    value={item.unit}
                    onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                    className="w-full text-xs px-2 py-1.5 rounded border border-stone-200 bg-white"
                  >
                    <option value="pc">pc</option>
                    <option value="kg">kg</option>
                    <option value="box">box</option>
                    <option value="meter">meter</option>
                  </select>
                </div>

                <div className="w-28">
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">Target Price (₹)</label>
                  <input
                    type="number"
                    placeholder="Optional"
                    value={item.target_unit_price}
                    onChange={(e) => handleItemChange(idx, "target_unit_price", e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded border border-stone-200 bg-white"
                  />
                </div>

                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 text-stone-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Dispatch Mode & Notes */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
            Dispatch Configuration
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setDispatchMode("broadcast")}
              className={`p-3 rounded-lg border text-left transition ${
                dispatchMode === "broadcast"
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-stone-50 text-stone-700"
              }`}
            >
              <div className="text-xs font-bold">Broadcast Sourcing</div>
              <div className={`text-[10px] mt-0.5 ${dispatchMode === "broadcast" ? "text-stone-300" : "text-stone-500"}`}>
                Invite all verified suppliers in this category
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDispatchMode("direct")}
              className={`p-3 rounded-lg border text-left transition ${
                dispatchMode === "direct"
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-stone-50 text-stone-700"
              }`}
            >
              <div className="text-xs font-bold">Direct Sourcing</div>
              <div className={`text-[10px] mt-0.5 ${dispatchMode === "direct" ? "text-stone-300" : "text-stone-500"}`}>
                Dispatch exclusively to selected verified vendor
              </div>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Additional Technical Specs / Notes</label>
            <textarea
              rows={3}
              placeholder="Specify quality test standards, custom packaging, or branding requirements..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
        >
          {isSubmitting ? "Dispatching RFQ..." : "Publish & Dispatch Sourcing RFQ"}
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
