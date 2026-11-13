import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Building2, MapPin, Factory, ShieldCheck, ArrowRight } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const OnboardingPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") || "buyer";

  const [formData, setFormData] = useState({
    name: "",
    legal_name: "",
    business_type: (["manufacturer", "wholesaler", "distributor"].includes(initialRole)
      ? initialRole
      : "buyer") as "buyer" | "manufacturer" | "wholesaler" | "distributor",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    pan: "",
    factory_size_sqft: "",
    production_capacity_monthly: "",
    export_ready: false,
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/directory/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: formData.name,
          business_type: formData.business_type,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          gstin: formData.gstin || undefined,
          pan: formData.pan || undefined,
          factory_size_sqft: formData.factory_size_sqft ? Number(formData.factory_size_sqft) : undefined,
          production_capacity_monthly: formData.production_capacity_monthly || undefined,
          export_ready: formData.export_ready,
        }),
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.error || "Failed to complete onboarding.");
      }

      await refreshUser();

      if (formData.business_type === "buyer") {
        navigate("/buyer/dashboard");
      } else {
        navigate("/supplier/dashboard");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to complete business registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSupplier = formData.business_type !== "buyer";

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-stone-900 tracking-tight">Business Profile Setup</h2>
        <p className="text-xs text-stone-500 mt-1">Configure your organization identity on COVERLY</p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Company / Brand Name</label>
          <input
            type="text"
            required
            placeholder="e.g. Tiruppur Knits & Apparel"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 focus:ring-1 focus:ring-stone-800"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Business Classification</label>
          <select
            value={formData.business_type}
            onChange={(e) => setFormData({ ...formData, business_type: e.target.value as any })}
            className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 bg-white focus:ring-1 focus:ring-stone-800"
          >
            <option value="buyer">Procurement Enterprise / Buyer</option>
            <option value="manufacturer">Direct Factory / Manufacturer</option>
            <option value="wholesaler">Bulk Wholesaler / Trader</option>
            <option value="distributor">Authorized Brand Distributor</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">City</label>
            <input
              type="text"
              required
              placeholder="e.g. Surat"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 focus:ring-1 focus:ring-stone-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">State</label>
            <input
              type="text"
              required
              placeholder="e.g. Gujarat"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 focus:ring-1 focus:ring-stone-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Pincode (for freight calculations)</label>
          <input
            type="text"
            required
            placeholder="e.g. 395002"
            value={formData.pincode}
            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
            className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 focus:ring-1 focus:ring-stone-800"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">GSTIN (Optional)</label>
            <input
              type="text"
              placeholder="24ABCDE1234F1Z5"
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
              className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 focus:ring-1 focus:ring-stone-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">PAN (Optional)</label>
            <input
              type="text"
              placeholder="ABCDE1234F"
              value={formData.pan}
              onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
              className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 focus:ring-1 focus:ring-stone-800"
            />
          </div>
        </div>

        {/* Extra Fields for Supplier / Manufacturer */}
        {isSupplier && (
          <div className="pt-3 border-t border-stone-100 space-y-3">
            <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Facility Specifications
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-stone-700 mb-1">Plant Size (sq.ft)</label>
                <input
                  type="number"
                  placeholder="25000"
                  value={formData.factory_size_sqft}
                  onChange={(e) => setFormData({ ...formData, factory_size_sqft: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-stone-700 mb-1">Monthly Capacity</label>
                <input
                  type="text"
                  placeholder="100,000 units"
                  value={formData.production_capacity_monthly}
                  onChange={(e) => setFormData({ ...formData, production_capacity_monthly: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="export_ready"
                checked={formData.export_ready}
                onChange={(e) => setFormData({ ...formData, export_ready: e.target.checked })}
                className="rounded border-stone-300 text-stone-900 focus:ring-stone-800"
              />
              <label htmlFor="export_ready" className="text-xs text-stone-700">
                Facility holds IEC & is export ready
              </label>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
        >
          {isSubmitting ? "Finalizing Workspace..." : "Complete Setup & Enter Dashboard"}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
