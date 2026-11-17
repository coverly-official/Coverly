import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Building2,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  FileCheck,
  ClipboardList,
  Users,
  ChevronRight,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const AdminBuyersPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({
    total_buyers: 0,
    total_businesses: 0,
    verified_businesses: 0,
    pending_verification: 0,
    total_purchase_orders: 0,
    total_purchase_requests: 0,
  });

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Verification Modal
  const [selectedBiz, setSelectedBiz] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [auditNotes, setAuditNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    ...(user ? { "x-user-id": user.id } : {}),
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, bizRes] = await Promise.all([
        fetch(`${API_BASE}/admin/buyers/stats`, { headers: getHeaders() }).then((r) => r.json()),
        fetch(`${API_BASE}/admin/buyers`, { headers: getHeaders() }).then((r) => r.json()),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (bizRes.success) setBusinesses(bizRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBiz) return;
    setIsProcessing(true);

    try {
      const res = await fetch(`${API_BASE}/admin/buyers/${selectedBiz.id}/verify`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ action: actionType, notes: auditNotes }),
      });

      const json = await res.json();
      if (json.success) {
        setSelectedBiz(null);
        setAuditNotes("");
        await loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-stone-500">
        <Link to="/admin" className="hover:text-stone-900">Admin</Link>
        <ChevronRight className="w-3 h-3 text-stone-400" />
        <span className="font-semibold text-stone-800">Buyer & Business Owner Management</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Buyer Accounts & Enterprise Verification</h1>
          <p className="text-xs text-stone-500 mt-1">
            Monitor registered companies, verify commercial GST credentials, and oversee enterprise purchasing teams.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 uppercase block">Total Buyers</span>
          <span className="text-2xl font-black text-stone-900 font-mono mt-1 block">{stats.total_buyers}</span>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 uppercase block">Businesses</span>
          <span className="text-2xl font-black text-stone-900 font-mono mt-1 block">{stats.total_businesses}</span>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 uppercase block">Verified Co.</span>
          <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">{stats.verified_businesses}</span>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 uppercase block">Pending Audit</span>
          <span className="text-2xl font-black text-amber-600 font-mono mt-1 block">{stats.pending_verification}</span>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 uppercase block">Purchase Orders</span>
          <span className="text-2xl font-black text-blue-600 font-mono mt-1 block">{stats.total_purchase_orders}</span>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 uppercase block">Requisitions</span>
          <span className="text-2xl font-black text-purple-700 font-mono mt-1 block">{stats.total_purchase_requests}</span>
        </div>
      </div>

      {/* Businesses Table */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900">Registered Business Directory</h3>
          <span className="text-xs text-stone-500">{businesses.length} Enterprises Enrolled</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-stone-400">Loading business accounts...</div>
        ) : businesses.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400">No registered businesses found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="p-3">Company Name</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">GSTIN</th>
                  <th className="p-3">Team Size</th>
                  <th className="p-3">Verification Tier</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {businesses.map((biz) => {
                  const isVer = biz.verification_level === "document_verified";
                  return (
                    <tr key={biz.id} className="hover:bg-stone-50/50">
                      <td className="p-3">
                        <div className="font-bold text-stone-900">{biz.name}</div>
                        <div className="text-[11px] text-stone-500">{biz.email || "No email"}</div>
                      </td>
                      <td className="p-3 text-stone-600">{biz.city}, {biz.state}</td>
                      <td className="p-3 font-mono font-bold text-stone-800">{biz.gstin || "—"}</td>
                      <td className="p-3 text-stone-600">
                        {biz.business_members?.length || 1} members
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isVer ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {biz.verification_level}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedBiz(biz);
                            setActionType("approve");
                            setAuditNotes("");
                          }}
                          className="px-3 py-1 bg-stone-900 text-white font-semibold rounded text-xs hover:bg-stone-800"
                        >
                          Audit & Verify
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Modal */}
      {selectedBiz && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-base font-bold text-stone-900">Audit Enterprise Credentials</h3>
              <button onClick={() => setSelectedBiz(null)} className="text-stone-400 hover:text-stone-600 font-bold">
                ✕
              </button>
            </div>

            <div className="text-xs bg-stone-50 p-3 rounded-lg border border-stone-200 space-y-1">
              <div>Company: <strong>{selectedBiz.name}</strong></div>
              <div>Legal Name: <span>{selectedBiz.legal_name || "Same"}</span></div>
              <div>GSTIN: <span className="font-mono font-bold">{selectedBiz.gstin || "None"}</span></div>
              <div>Current Level: <span className="uppercase font-semibold">{selectedBiz.verification_level}</span></div>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-3">
              <div>
                <label className="text-xs text-stone-600 block mb-1 font-medium">Verification Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActionType("approve")}
                    className={`p-2 rounded text-xs font-bold border transition ${
                      actionType === "approve"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-stone-700 border-stone-200"
                    }`}
                  >
                    Grant Verification
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType("reject")}
                    className={`p-2 rounded text-xs font-bold border transition ${
                      actionType === "reject"
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-white text-stone-700 border-stone-200"
                    }`}
                  >
                    Reject / Revoke
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-stone-600 block mb-1 font-medium">Audit Notes</label>
                <textarea
                  rows={2}
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  placeholder="Enter MCA / GST portal verification remarks..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBiz(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400"
                >
                  {isProcessing ? "Saving..." : "Save Verification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
