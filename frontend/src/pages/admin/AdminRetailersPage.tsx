import React, { useEffect, useState } from "react";
import { Store, ShieldCheck, CheckCircle2, XCircle, Search, Filter, Building2, MapPin, Eye } from "lucide-react";

export const AdminRetailersPage: React.FC = () => {
  const [retailers, setRetailers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRetailer, setSelectedRetailer] = useState<any | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadRetailers();
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/admin/retailer-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setStats(json.data);
      }
    } catch (err) {
      console.error("Load retailer stats error:", err);
    }
  }

  async function loadRetailers() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const params = new URLSearchParams();
      if (typeFilter) params.append("retail_type", typeFilter);
      if (statusFilter) params.append("verification_status", statusFilter);
      if (search) params.append("city", search);

      const res = await fetch(`/api/admin/retailers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setRetailers(json.data);
      }
    } catch (err) {
      console.error("Load retailers error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(status: "verified" | "rejected") {
    if (!selectedRetailer) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/admin/retailers/${selectedRetailer.id}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          notes: verifyNotes || `Admin audit action: ${status}`,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowVerifyModal(false);
        setVerifyNotes("");
        loadRetailers();
        loadStats();
      }
    } catch (err) {
      console.error("Verify retailer error:", err);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
            <Store className="w-6 h-6 text-red-700" />
            Retailer & Shop Owner Governance
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Administer registered kirana stores, supermarkets, departmental retailers, multi-branch store networks, and verify business credentials.
          </p>
        </div>
      </div>

      {/* Admin KPI Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Total Retailers</p>
            <p className="text-2xl font-bold text-stone-900 mt-1">{stats.totalRetailers}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Verified Stores</p>
            <p className="text-2xl font-bold text-emerald-900 mt-1">{stats.verifiedRetailers}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Pending Review</p>
            <p className="text-2xl font-bold text-amber-900 mt-1">{stats.pendingVerification}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Kirana Outlets</p>
            <p className="text-2xl font-bold text-stone-900 mt-1">{stats.kiranaStores}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Supermarkets</p>
            <p className="text-2xl font-bold text-purple-900 mt-1">{stats.supermarkets}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Multi-Branch Networks</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{stats.multiBranchBusinesses}</p>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadRetailers()}
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-red-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs p-2.5 rounded-lg border border-stone-300 bg-white"
          >
            <option value="">All Retail Types</option>
            <option value="kirana">Kirana Store</option>
            <option value="grocery">Grocery Store</option>
            <option value="supermarket">Supermarket</option>
            <option value="departmental">Departmental Store</option>
            <option value="electronics">Electronics Store</option>
            <option value="garments_fashion">Fashion & Garments</option>
            <option value="hardware">Hardware & Construction</option>
            <option value="multi_branch">Multi-Branch Network</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-2.5 rounded-lg border border-stone-300 bg-white"
          >
            <option value="">All Verification Statuses</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending Audit</option>
            <option value="unverified">Unverified</option>
            <option value="rejected">Rejected</option>
          </select>

          <button
            onClick={loadRetailers}
            className="px-4 py-2.5 rounded-lg bg-red-800 hover:bg-red-900 text-white text-xs font-semibold transition"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Retailers Table */}
      {loading ? (
        <div className="text-center py-20 text-stone-500 text-xs">Loading retailers directory...</div>
      ) : retailers.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-stone-200 p-12 text-center">
          <Store className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-stone-900">No Retailers Found</h3>
          <p className="text-xs text-stone-500 mt-1">No store accounts matching criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[10px] border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Shop & Owner</th>
                  <th className="py-3 px-4">Store Type</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Tax / Licensing</th>
                  <th className="py-3 px-4">Branches</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {retailers.map((ret) => (
                  <tr key={ret.id} className="hover:bg-stone-50/60">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-stone-900">{ret.shop_name}</p>
                      <p className="text-[11px] text-stone-500">
                        {ret.owner_name} • {ret.phone}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 capitalize text-stone-700 font-medium">
                      {ret.retail_type?.replace("_", " ")}
                    </td>
                    <td className="py-3.5 px-4 text-stone-600">
                      {ret.city}, {ret.state}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {ret.gstin ? (
                        <span className="text-stone-900">{ret.gstin}</span>
                      ) : ret.fssai_license ? (
                        <span className="text-stone-600">FSSAI: {ret.fssai_license}</span>
                      ) : (
                        <span className="text-stone-400">Exempt / Kirana</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-semibold text-stone-800">
                        {ret.retailer_branches?.length || 1} outlets
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          ret.verification_status === "verified"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : ret.verification_status === "pending"
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : ret.verification_status === "rejected"
                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                            : "bg-stone-100 text-stone-600 border border-stone-200"
                        }`}
                      >
                        {ret.verification_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedRetailer(ret);
                          setShowVerifyModal(true);
                        }}
                        className="px-3 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium inline-flex items-center gap-1 text-xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Audit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Verification Audit Modal */}
      {showVerifyModal && selectedRetailer && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="text-base font-bold text-stone-900">Audit Retailer Verification</h2>
              <button onClick={() => setShowVerifyModal(false)} className="text-stone-400 hover:text-stone-700 text-sm">
                ✕
              </button>
            </div>

            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-1 text-xs">
              <p className="font-bold text-stone-900 text-sm">{selectedRetailer.shop_name}</p>
              <p className="text-stone-600">Owner: {selectedRetailer.owner_name} • Phone: {selectedRetailer.phone}</p>
              <p className="text-stone-600">Address: {selectedRetailer.store_address}, {selectedRetailer.city} - {selectedRetailer.pincode}</p>
              <p className="text-stone-600 font-mono">
                GSTIN: {selectedRetailer.gstin || "N/A"} | FSSAI: {selectedRetailer.fssai_license || "N/A"}
              </p>
              {selectedRetailer.verification_notes && (
                <p className="text-stone-500 pt-1 italic">Notes: {selectedRetailer.verification_notes}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Audit Feedback & Verification Remarks
              </label>
              <textarea
                rows={3}
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                placeholder="Enter audit notes (e.g. Validated Shop Act / FSSAI certificate against state portal)..."
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleVerify("rejected")}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition disabled:opacity-50 flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleVerify("verified")}
                className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition disabled:opacity-50 flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve Verified Store
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
