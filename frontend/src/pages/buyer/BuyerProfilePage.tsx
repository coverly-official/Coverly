import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Plus,
  Save,
  Globe,
  FileText,
  Briefcase,
  Layers,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const BuyerProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<any | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Edit fields
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [industryType, setIndustryType] = useState("");
  const [purchasingCategories, setPurchasingCategories] = useState("");

  // Branch Modal
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [branchName, setBranchName] = useState("");
  const [bAddress, setBAddress] = useState("");
  const [bCity, setBCity] = useState("");
  const [bState, setBState] = useState("");
  const [bPincode, setBPincode] = useState("");
  const [bPhone, setBPhone] = useState("");
  const [isHq, setIsHq] = useState(false);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    ...(user ? { "x-user-id": user.id } : {}),
  });

  const loadProfile = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [profRes, branchRes] = await Promise.all([
        fetch(`${API_BASE}/buyer/profile`, { headers: getHeaders() }).then((r) => r.json()),
        fetch(`${API_BASE}/buyer/branches`, { headers: getHeaders() }).then((r) => r.json()),
      ]);

      if (profRes.success && profRes.data) {
        setProfileData(profRes.data);
        const biz = profRes.data.business;
        const prof = profRes.data.profile;
        if (biz) {
          setName(biz.name || "");
          setLegalName(biz.legal_name || "");
          setGstin(biz.gstin || "");
          setPan(biz.pan || "");
          setCity(biz.city || "");
          setState(biz.state || "");
          setPincode(biz.pincode || "");
          setAddress(biz.address || "");
          setPhone(biz.phone || "");
          setWebsite(biz.website || "");
        }
        if (prof) {
          setIndustryType(prof.industry_type || "");
          setPurchasingCategories(prof.purchasing_categories?.join(", ") || "");
        }
      }

      if (branchRes.success) {
        setBranches(branchRes.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg("");
    try {
      const res = await fetch(`${API_BASE}/buyer/profile`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({
          business_name: name,
          legal_name: legalName,
          gstin,
          pan,
          city,
          state,
          pincode,
          address,
          phone,
          website,
          industry_type: industryType,
          purchasing_categories: purchasingCategories.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setStatusMsg("Profile updated successfully!");
        await loadProfile();
      }
    } catch (err: any) {
      setStatusMsg("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/buyer/branches`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          branch_name: branchName,
          address: bAddress,
          city: bCity,
          state: bState,
          pincode: bPincode,
          phone: bPhone,
          is_headquarters: isHq,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsBranchModalOpen(false);
        setBranchName("");
        setBAddress("");
        setBCity("");
        setBState("");
        setBPincode("");
        setBPhone("");
        await loadProfile();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs text-stone-500">
        Loading business profile...
      </div>
    );
  }

  const biz = profileData?.business;
  const prof = profileData?.profile;
  const isVerified = biz?.verification_level === "document_verified" || prof?.verification_status === "verified";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
              {prof?.account_type === "individual" ? "Individual Buyer" : "Corporate Account"}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              isVerified ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}>
              {isVerified ? "Verified Buyer" : "Verification Pending"}
            </span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 mt-1">
            {biz?.name || user?.full_name || "Company Profile"}
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage your legal enterprise details, GSTIN, and branch locations.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-6">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
            Enterprise Coordinates
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-stone-600 block mb-1 font-medium">Business / Trade Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-stone-600 block mb-1 font-medium">Legal Registered Name</label>
              <input
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-stone-600 block mb-1 font-medium">GSTIN (15 Digits)</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 font-mono uppercase"
              />
            </div>
            <div>
              <label className="text-xs text-stone-600 block mb-1 font-medium">PAN</label>
              <input
                type="text"
                value={pan}
                onChange={(e) => setPan(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 font-mono uppercase"
              />
            </div>
            <div>
              <label className="text-xs text-stone-600 block mb-1 font-medium">Industry Classification</label>
              <input
                type="text"
                value={industryType}
                onChange={(e) => setIndustryType(e.target.value)}
                placeholder="e.g. FMCG Retail, Manufacturing"
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-stone-600 block mb-1 font-medium">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
              />
            </div>
            <div>
              <label className="text-xs text-stone-600 block mb-1 font-medium">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
              />
            </div>
            <div>
              <label className="text-xs text-stone-600 block mb-1 font-medium">PIN Code</label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-stone-600 block mb-1 font-medium">Registered Office Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-stone-600 block mb-1 font-medium">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
              />
            </div>
            <div>
              <label className="text-xs text-stone-600 block mb-1 font-medium">Website</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-stone-600 block mb-1 font-medium">Target Sourcing Categories (Comma-separated)</label>
            <input
              type="text"
              value={purchasingCategories}
              onChange={(e) => setPurchasingCategories(e.target.value)}
              placeholder="Packaging, Raw Materials, Industrial Tools, Textiles"
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
            />
          </div>

          <div className="pt-3 border-t border-stone-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-lg bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? "Saving..." : "Save Business Profile"}
            </button>
          </div>
        </form>
      </div>

      {/* Branches & Delivery Warehouses */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-sm font-bold text-stone-900">Branch Locations & Delivery Hubs</h3>
            <p className="text-xs text-stone-500">Configure secondary warehouses and receiving facilities.</p>
          </div>
          <button
            onClick={() => setIsBranchModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Branch
          </button>
        </div>

        {branches.length === 0 ? (
          <div className="py-6 text-center text-xs text-stone-400">
            No secondary branches added yet. Delivery will default to registered office address.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {branches.map((b) => (
              <div key={b.id} className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-stone-900">{b.branch_name}</span>
                  {b.is_headquarters && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                      HQ
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-stone-600 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                  {b.address}, {b.city}, {b.state} - {b.pincode}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Branch Modal */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-base font-bold text-stone-900">Add Branch Location</h3>
              <button
                onClick={() => setIsBranchModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddBranchSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-stone-600 block mb-1 font-medium">Branch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune Regional Fulfillment Center"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
                />
              </div>

              <div>
                <label className="text-xs text-stone-600 block mb-1 font-medium">Address *</label>
                <input
                  type="text"
                  required
                  value={bAddress}
                  onChange={(e) => setBAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-stone-600 block mb-1 font-medium">City</label>
                  <input
                    type="text"
                    required
                    value={bCity}
                    onChange={(e) => setBCity(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded border border-stone-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-600 block mb-1 font-medium">State</label>
                  <input
                    type="text"
                    required
                    value={bState}
                    onChange={(e) => setBState(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded border border-stone-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-600 block mb-1 font-medium">PIN</label>
                  <input
                    type="text"
                    required
                    value={bPincode}
                    onChange={(e) => setBPincode(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded border border-stone-200 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-stone-900 text-white hover:bg-stone-800"
                >
                  Save Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
