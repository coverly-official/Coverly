import React, { useEffect, useState } from "react";
import { GitBranch, Plus, Store, MapPin, Phone, Mail, CheckCircle2, Trash2 } from "lucide-react";
import { RetailerBranch } from "@/types";

export const RetailerBranchesPage: React.FC = () => {
  const [branches, setBranches] = useState<RetailerBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Form
  const [branchName, setBranchName] = useState("");
  const [storeCode, setStoreCode] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerPhone, setManagerPhone] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [isMainBranch, setIsMainBranch] = useState(false);

  useEffect(() => {
    loadBranches();
  }, []);

  async function loadBranches() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/retailer/branches", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setBranches(json.data);
      }
    } catch (err) {
      console.error("Load branches error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBranch(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/retailer/branches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          branch_name: branchName,
          store_code: storeCode,
          address,
          city,
          state,
          pincode,
          manager_name: managerName,
          manager_phone: managerPhone,
          manager_email: managerEmail,
          is_main_branch: isMainBranch,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setStatusMsg({ text: "Store branch created successfully." });
        setShowModal(false);
        resetForm();
        loadBranches();
      } else {
        setStatusMsg({ text: json.error || "Failed to create branch.", isError: true });
      }
    } catch {
      setStatusMsg({ text: "Error creating store branch.", isError: true });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBranch(id: string) {
    if (!window.confirm("Are you sure you want to deactivate this store branch?")) return;
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/retailer/branches/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        loadBranches();
      }
    } catch (err) {
      console.error("Delete branch error:", err);
    }
  }

  function resetForm() {
    setBranchName("");
    setStoreCode("");
    setAddress("");
    setCity("");
    setState("");
    setPincode("");
    setManagerName("");
    setManagerPhone("");
    setManagerEmail("");
    setIsMainBranch(false);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
            <GitBranch className="w-6 h-6 text-emerald-700" />
            Multi-Branch Store Management
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Centrally manage wholesale purchasing across your retail outlets with branch-specific delivery coordinates.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition flex items-center gap-2 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Store Branch
        </button>
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

      {/* Branches List */}
      {loading ? (
        <div className="text-center py-20 text-stone-500 text-xs">Loading store network...</div>
      ) : branches.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-stone-200 p-12 text-center">
          <Store className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-stone-900">No Branch Locations Configured</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
            You currently operate on your primary shop address. Add secondary outlets, warehouses, or neighborhood store locations to route deliveries directly.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium"
          >
            Add Branch Outlet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branches.map((b) => (
            <div
              key={b.id}
              className={`bg-white rounded-xl p-5 border shadow-sm relative ${
                b.is_main_branch ? "border-emerald-300 ring-1 ring-emerald-200" : "border-stone-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-stone-900">{b.branch_name}</h3>
                    {b.is_main_branch && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Main Store
                      </span>
                    )}
                  </div>
                  {b.store_code && (
                    <span className="text-[10px] text-stone-500 font-mono">Store Code: {b.store_code}</span>
                  )}
                </div>

                {!b.is_main_branch && (
                  <button
                    onClick={() => handleDeleteBranch(b.id)}
                    title="Deactivate branch"
                    className="text-stone-400 hover:text-rose-600 p-1 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-stone-600 mt-3 pt-3 border-t border-stone-100">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                  <span>
                    {b.address}, {b.city}, {b.state} - {b.pincode}
                  </span>
                </div>

                {b.manager_name && (
                  <div className="flex items-center gap-2 text-stone-700 font-medium">
                    <Store className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>Manager: {b.manager_name}</span>
                  </div>
                )}

                {b.manager_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>{b.manager_phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Branch Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="text-base font-bold text-stone-900">Add Retail Store Branch</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-stone-400 hover:text-stone-700 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Branch / Store Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="e.g. Gupta Super Kirana (College Road Outlet)"
                    className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Store Code
                  </label>
                  <input
                    type="text"
                    value={storeCode}
                    onChange={(e) => setStoreCode(e.target.value)}
                    placeholder="STR-002"
                    className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isMainBranch}
                      onChange={(e) => setIsMainBranch(e.target.checked)}
                      className="rounded border-stone-300 text-emerald-600"
                    />
                    Mark as Main Outlet
                  </label>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Delivery Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Shop 2, Opposite HPT College, Thatte Nagar"
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
                    placeholder="Nashik"
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
                    placeholder="Maharashtra"
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
                    placeholder="422005"
                    className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Branch Store Manager
                  </label>
                  <input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="e.g. Suresh Patil"
                    className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Manager Contact Phone
                  </label>
                  <input
                    type="text"
                    value={managerPhone}
                    onChange={(e) => setManagerPhone(e.target.value)}
                    placeholder="+91 98111 55667"
                    className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition disabled:opacity-50"
                >
                  {saving ? "Adding..." : "Add Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
