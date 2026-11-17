import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2,
  Package,
  FileText,
  Search,
  Filter,
  Eye,
  TrendingUp,
  Truck,
  Printer,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const AdminPackagingPage: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"metrics" | "suppliers" | "products" | "rfqs">("metrics");
  const [stats, setStats] = useState<any>({
    total_suppliers: 0,
    verified_suppliers: 0,
    pending_verification: 0,
    active_products: 0,
    pending_product_approval: 0,
    total_rfqs: 0,
    total_quotations: 0,
    total_orders: 0,
    completed_orders: 0,
  });

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Verification modal / prompt state
  const [actionSupplier, setActionSupplier] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "suspend">("approve");
  const [auditNotes, setAuditNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(user ? { "x-user-id": user.id } : {}),
      };

      const [statsRes, supRes, prodRes] = await Promise.all([
        fetch(`${API_BASE}/admin/packaging/stats`, { headers }),
        fetch(`${API_BASE}/admin/packaging/suppliers`, { headers }),
        fetch(`${API_BASE}/admin/packaging/products`, { headers }),
      ]);

      if (statsRes.ok) {
        const json = await statsRes.json();
        if (json.success) setStats(json.data);
      }
      if (supRes.ok) {
        const json = await supRes.json();
        if (json.success) setSuppliers(json.data || []);
      }
      if (prodRes.ok) {
        const json = await prodRes.json();
        if (json.success) setProducts(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [user]);

  const handleVerifySupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionSupplier) return;
    setIsProcessing(true);

    try {
      const res = await fetch(`${API_BASE}/admin/packaging/suppliers/${actionSupplier.id}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user ? { "x-user-id": user.id } : {}),
        },
        body: JSON.stringify({
          action: actionType,
          notes: auditNotes,
        }),
      });

      if (res.ok) {
        setActionSupplier(null);
        setAuditNotes("");
        loadAdminData();
      } else {
        const json = await res.json();
        alert(json.error || "Failed to update supplier verification status.");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleModerateProduct = async (productId: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`${API_BASE}/admin/packaging/products/${productId}/moderate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user ? { "x-user-id": user.id } : {}),
        },
        body: JSON.stringify({
          action,
          notes: `Listing ${action}d by compliance admin`,
        }),
      });

      if (res.ok) {
        loadAdminData();
      } else {
        const json = await res.json();
        alert(json.error || "Failed to update product moderation.");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-red-900" />
            Packaging Marketplace Governance & Verification
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Audit packaging converters, moderate custom specifications, review food-contact licenses and oversee production orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/packaging"
            className="px-3 py-1.5 border border-stone-300 rounded-lg text-xs font-semibold hover:bg-stone-100 transition"
          >
            Public Marketplace
          </Link>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex gap-2 border-b border-stone-200 text-xs font-bold pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("metrics")}
          className={`px-3 py-1.5 rounded-lg transition ${
            activeTab === "metrics" ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          Marketplace KPIs
        </button>
        <button
          onClick={() => setActiveTab("suppliers")}
          className={`px-3 py-1.5 rounded-lg transition ${
            activeTab === "suppliers" ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          Converter Accreditations ({suppliers.length})
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`px-3 py-1.5 rounded-lg transition ${
            activeTab === "products" ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          Product Listing Moderation ({products.length})
        </button>
      </div>

      {/* TAB 1: Metrics */}
      {activeTab === "metrics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Total Converters</span>
              <div className="text-2xl font-black text-stone-900 mt-1">{stats.total_suppliers}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Verified Plants</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{stats.verified_suppliers}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Active Listings</span>
              <div className="text-2xl font-black text-blue-900 mt-1">{stats.active_products}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Total RFQs</span>
              <div className="text-2xl font-black text-indigo-700 mt-1">{stats.total_rfqs}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Total Orders</span>
              <div className="text-2xl font-black text-purple-700 mt-1">{stats.total_orders}</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Supplier Verification */}
      {activeTab === "suppliers" && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-stone-900">Packaging Supplier Accreditation Queue</h2>

          {suppliers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 text-stone-600 border-b border-stone-200">
                    <th className="p-3 font-bold">Converter Business</th>
                    <th className="p-3 font-bold">Supplier Type</th>
                    <th className="p-3 font-bold">Capacity</th>
                    <th className="p-3 font-bold">Status</th>
                    <th className="p-3 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {suppliers.map((sup) => (
                    <tr key={sup.id} className="hover:bg-stone-50/50">
                      <td className="p-3">
                        <div className="font-bold text-stone-900">{sup.businesses?.name || sup.headline}</div>
                        <div className="text-[11px] text-stone-500">{sup.businesses?.city}, {sup.businesses?.state}</div>
                      </td>
                      <td className="p-3 capitalize">{sup.supplier_type?.replace(/_/g, " ")}</td>
                      <td className="p-3 font-medium text-stone-700">{sup.production_capacity || "N/A"}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            sup.verification_status === "verified"
                              ? "bg-emerald-50 text-emerald-800"
                              : sup.verification_status === "rejected"
                              ? "bg-red-50 text-red-800"
                              : "bg-amber-50 text-amber-800"
                          }`}
                        >
                          {sup.verification_status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setActionSupplier(sup);
                              setActionType("approve");
                            }}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-500"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setActionSupplier(sup);
                              setActionType("reject");
                            }}
                            className="px-2.5 py-1 bg-red-600 text-white rounded font-bold hover:bg-red-500"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => {
                              setActionSupplier(sup);
                              setActionType("suspend");
                            }}
                            className="px-2.5 py-1 bg-stone-700 text-white rounded font-bold hover:bg-stone-600"
                          >
                            Suspend
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-stone-500 py-6 text-center">No converters pending audit.</p>
          )}
        </div>
      )}

      {/* TAB 3: Product Moderation */}
      {activeTab === "products" && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-stone-900">Packaging Listing Moderation Queue</h2>

          {products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 text-stone-600 border-b border-stone-200">
                    <th className="p-3 font-bold">Item Title</th>
                    <th className="p-3 font-bold">Converter</th>
                    <th className="p-3 font-bold">Base Price</th>
                    <th className="p-3 font-bold">MOQ</th>
                    <th className="p-3 font-bold">Moderation</th>
                    <th className="p-3 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-stone-50/50">
                      <td className="p-3 font-bold text-stone-900">{p.name}</td>
                      <td className="p-3 text-stone-600">{p.packaging_supplier_profiles?.businesses?.name || "Converter"}</td>
                      <td className="p-3 font-bold text-blue-950">₹{p.base_price.toFixed(2)}</td>
                      <td className="p-3 text-stone-700">{p.moq}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-100 text-stone-800">
                          {p.moderation_status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleModerateProduct(p.id, "approve")}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-500"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleModerateProduct(p.id, "reject")}
                            className="px-2.5 py-1 bg-red-600 text-white rounded font-bold hover:bg-red-500"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-stone-500 py-6 text-center">No listings pending moderation.</p>
          )}
        </div>
      )}

      {/* Verification Audit Modal */}
      {actionSupplier && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-stone-900">
              Confirm {actionType.toUpperCase()}: {actionSupplier.businesses?.name}
            </h3>
            <form onSubmit={handleVerifySupplier} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Compliance Audit Notes</label>
                <textarea
                  rows={3}
                  required
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  placeholder="Enter audit rationale, verified GSTIN, factory license or rejection reasons..."
                  className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setActionSupplier(null)}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 bg-stone-900 text-white font-bold rounded-lg text-xs hover:bg-stone-800 disabled:opacity-50"
                >
                  {isProcessing ? "Updating..." : "Confirm Action"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPackagingPage;
