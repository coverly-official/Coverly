import React, { useEffect, useState } from "react";
import { Store, ShieldCheck, CheckCircle2, AlertTriangle, Building, Save } from "lucide-react";
import { RetailerProfile, RetailType } from "@/types";

export const RetailerProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<RetailerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Form fields
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [retailType, setRetailType] = useState<RetailType>("kirana");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [tradeLicense, setTradeLicense] = useState("");
  const [fssaiLicense, setFssaiLicense] = useState("");
  const [drugLicense, setDrugLicense] = useState("");
  const [isMultiBranch, setIsMultiBranch] = useState(false);
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  const retailTypes: { value: RetailType; label: string }[] = [
    { value: "kirana", label: "Kirana Store (Daily Staples & FMCG)" },
    { value: "grocery", label: "Grocery Store" },
    { value: "supermarket", label: "Supermarket" },
    { value: "departmental", label: "Departmental Store" },
    { value: "electronics", label: "Electronics & Mobile Retailer" },
    { value: "garments_fashion", label: "Garment & Fashion Store" },
    { value: "hardware", label: "Hardware & Construction Store" },
    { value: "medical_general", label: "Medical & General Retail Store" },
    { value: "restaurant_hotel", label: "Restaurant & Hotel Purchaser" },
    { value: "multi_branch", label: "Multi-Branch Retail Network" },
    { value: "individual_shop", label: "Individual Shop Owner" },
    { value: "other", label: "Other Retail Store" },
  ];

  const categoryOptions = [
    "Grocery & FMCG",
    "Rice, Wheat & Pulses",
    "Edible Oils & Spices",
    "Snacks & Beverages",
    "Electronics & Accessories",
    "Fashion & Apparel",
    "Hardware & Building Materials",
    "Stationery & Toys",
    "Household & Cleaning",
  ];

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/retailer/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        setProfile(d);
        setShopName(d.shop_name || "");
        setOwnerName(d.owner_name || "");
        setRetailType(d.retail_type || "kirana");
        setPhone(d.phone || "");
        setEmail(d.email || "");
        setStoreAddress(d.store_address || "");
        setCity(d.city || "");
        setState(d.state || "");
        setPincode(d.pincode || "");
        setGstin(d.gstin || "");
        setPan(d.pan || "");
        setTradeLicense(d.trade_license_number || "");
        setFssaiLicense(d.fssai_license || "");
        setDrugLicense(d.drug_license_number || "");
        setIsMultiBranch(Boolean(d.is_multi_branch));
        setDescription(d.description || "");
        setCategories(d.purchasing_categories || []);
      }
    } catch (err) {
      console.error("Load retailer profile error:", err);
    } finally {
      setLoading(false);
    }
  }

  function toggleCategory(cat: string) {
    if (categories.includes(cat)) {
      setCategories(categories.filter((c) => c !== cat));
    } else {
      setCategories([...categories, cat]);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      const token = localStorage.getItem("token") || "";
      const endpoint = profile?.id ? "/api/retailer/profile" : "/api/retailer/register";
      const method = profile?.id ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shop_name: shopName,
          owner_name: ownerName,
          retail_type: retailType,
          phone,
          email,
          store_address: storeAddress,
          city,
          state,
          pincode,
          gstin: gstin || undefined,
          pan: pan || undefined,
          trade_license_number: tradeLicense || undefined,
          fssai_license: fssaiLicense || undefined,
          drug_license_number: drugLicense || undefined,
          is_multi_branch: isMultiBranch,
          description,
          purchasing_categories: categories,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setStatusMsg({ text: "Shop profile saved successfully." });
        loadProfile();
      } else {
        setStatusMsg({ text: json.error || "Failed to save profile.", isError: true });
      }
    } catch {
      setStatusMsg({ text: "Network error saving profile.", isError: true });
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitVerification() {
    setVerifying(true);
    setStatusMsg(null);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/retailer/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          notes: "Verification requested with updated store licensing details.",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setStatusMsg({ text: "Verification submission received. Admin will review your credentials." });
        loadProfile();
      } else {
        setStatusMsg({ text: json.error || "Failed to submit verification.", isError: true });
      }
    } catch {
      setStatusMsg({ text: "Error submitting verification.", isError: true });
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-stone-500 text-sm">Loading retailer profile...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
            <Store className="w-6 h-6 text-emerald-700" />
            Retail Shop Business Profile
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage your store registration, licensing, multi-branch setup, and purchasing categories.
          </p>
        </div>

        {/* Verification Status Badge */}
        <div className="flex items-center gap-3">
          {profile?.verification_status === "verified" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Verified Retailer
            </span>
          ) : profile?.verification_status === "pending" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Verification Pending Audit
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-300">
                <AlertTriangle className="w-3.5 h-3.5 text-stone-500" />
                Unverified Store
              </span>
              <button
                type="button"
                onClick={handleSubmitVerification}
                disabled={verifying}
                className="text-xs px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium transition disabled:opacity-50"
              >
                {verifying ? "Submitting..." : "Verify Shop"}
              </button>
            </div>
          )}
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-medium border ${
            statusMsg.isError
              ? "bg-rose-50 text-rose-800 border-rose-200"
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Basics */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider text-emerald-900 border-b border-stone-100 pb-2">
            1. Store Identity & Account Type
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Shop / Business Name *
              </label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Gupta Super Kirana Store"
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Owner / Authorized Person Name *
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Ramesh Gupta"
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Retail Business Type *
              </label>
              <select
                value={retailType}
                onChange={(e) => setRetailType(e.target.value as RetailType)}
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
              >
                {retailTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="relative flex items-center gap-2 text-xs font-medium text-stone-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMultiBranch}
                  onChange={(e) => setIsMultiBranch(e.target.checked)}
                  className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                Multi-Branch Retail Network (More than 1 store)
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Store Description & Sourcing Requirements
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Leading neighborhood supermarket sourcing weekly grocery, FMCG staples, packaged foods and confectioneries."
              className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>

        {/* Location & Contact */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider text-emerald-900 border-b border-stone-100 pb-2">
            2. Store Location & Contact Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Physical Store Address *
              </label>
              <input
                type="text"
                required
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="e.g. Shop 4 & 5, Market Yard Road"
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">City *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Nashik"
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">State *</label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Maharashtra"
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Pincode *</label>
              <input
                type="text"
                required
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="e.g. 422001"
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98200 44556"
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Licensing & Compliance (Optional for Kirana, subject to business type) */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider text-emerald-900 border-b border-stone-100 pb-2">
            3. Tax & Business Licensing (Where Applicable)
          </h2>
          <p className="text-xs text-stone-500">
            Individual shop owners and kirana stores are not strictly required to furnish GSTIN if turnover is below the threshold.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                GSTIN (Optional)
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                placeholder="27AABCG1234F1Z9"
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                PAN (Optional)
              </label>
              <input
                type="text"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                placeholder="AABCG1234F"
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Trade / Shop Act License
              </label>
              <input
                type="text"
                value={tradeLicense}
                onChange={(e) => setTradeLicense(e.target.value)}
                placeholder="e.g. SHOP-NSK-2024-889"
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                FSSAI Registration / License
              </label>
              <input
                type="text"
                value={fssaiLicense}
                onChange={(e) => setFssaiLicense(e.target.value)}
                placeholder="e.g. 11521012000456"
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Drug License (Medical Stores)
              </label>
              <input
                type="text"
                value={drugLicense}
                onChange={(e) => setDrugLicense(e.target.value)}
                placeholder="e.g. 20B/21B-4412"
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Purchasing Categories */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider text-emerald-900 border-b border-stone-100 pb-2">
            4. Wholesale Purchasing Categories
          </h2>
          <p className="text-xs text-stone-500">
            Select the product segments your store frequently procures from wholesalers.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {categoryOptions.map((cat) => {
              const selected = categories.includes(cat);
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`text-left text-xs p-2.5 rounded-lg border transition ${
                    selected
                      ? "bg-emerald-900 text-white font-semibold border-emerald-950"
                      : "bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving Store Profile..." : "Save Retailer Profile"}
          </button>
        </div>
      </form>
    </div>
  );
};
