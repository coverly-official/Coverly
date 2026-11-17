import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Globe,
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
  Ship,
  Anchor,
  ChevronRight,
  Send,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const AdminTradePage: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"metrics" | "traders" | "products">("metrics");
  const [stats, setStats] = useState<any>({
    total_parties: 0,
    verified_parties: 0,
    pending_verification: 0,
    active_products: 0,
    pending_product_approval: 0,
    total_rfqs: 0,
    total_quotations: 0,
    total_orders: 0,
    in_transit_shipments: 0,
    completed_orders: 0,
  });

  const [parties, setParties] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Trader Verification Modal
  const [actionParty, setActionParty] = useState<any | null>(null);
  const [partyActionType, setPartyActionType] = useState<"approve" | "reject" | "suspend">("approve");
  const [partyAuditNotes, setPartyAuditNotes] = useState("");
  const [isProcessingParty, setIsProcessingParty] = useState(false);

  // Product Moderation Modal
  const [actionProduct, setActionProduct] = useState<any | null>(null);
  const [productActionType, setProductActionType] = useState<"approve" | "reject">("approve");
  const [productAuditNotes, setProductAuditNotes] = useState("");
  const [isProcessingProduct, setIsProcessingProduct] = useState(false);

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    ...(user ? { "x-user-id": user.id } : {}),
  });

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      const [statsRes, partiesRes, prodsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/import-export/stats`, { headers }),
        fetch(`${API_BASE}/admin/import-export/parties`, { headers }),
        fetch(`${API_BASE}/admin/import-export/products`, { headers }),
      ]);

      if (statsRes.ok) {
        const json = await statsRes.json();
        if (json.success) setStats(json.data);
      }
      if (partiesRes.ok) {
        const json = await partiesRes.json();
        if (json.success) setParties(json.data || []);
      }
      if (prodsRes.ok) {
        const json = await prodsRes.json();
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

  // Handle Verify Party
  const handleVerifyPartySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionParty) return;
    setIsProcessingParty(true);
    try {
      const res = await fetch(`${API_BASE}/admin/import-export/parties/${actionParty.id}/verify`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action: partyActionType,
          notes: partyAuditNotes.trim() || undefined,
        }),
      });

      if (res.ok) {
        setActionParty(null);
        setPartyAuditNotes("");
        await loadAdminData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingParty(false);
    }
  };

  // Handle Moderate Product
  const handleModerateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionProduct) return;
    setIsProcessingProduct(true);
    try {
      const res = await fetch(`${API_BASE}/admin/import-export/products/${actionProduct.id}/moderate`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action: productActionType,
          notes: productAuditNotes.trim() || undefined,
        }),
      });

      if (res.ok) {
        setActionProduct(null);
        setProductAuditNotes("");
        await loadAdminData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingProduct(false);
    }
  };

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <Link to="/admin" className="hover:text-stone-900">Admin</Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <span className="font-semibold text-stone-800">Import & Export Governance</span>
        </div>

        {/* Header */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Customs & Foreign Trade Operations
              </span>
              <span className="text-xs text-stone-500 font-mono">DGFT / IEC Audit</span>
            </div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight mt-1">
              Global Trade Governance Console
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Verify DGFT IEC licenses, audit cross-border trade credentials, screen tariff HS codes, and regulate international shipments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/import-export"
              target="_blank"
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              Live Marketplace
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 gap-2">
          <button
            onClick={() => setActiveTab("metrics")}
            className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "metrics"
                ? "border-amber-500 text-stone-900 font-bold"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Platform Metrics
          </button>
          <button
            onClick={() => setActiveTab("traders")}
            className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "traders"
                ? "border-amber-500 text-stone-900 font-bold"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Trader Verifications
            {stats.pending_verification > 0 && (
              <span className="bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {stats.pending_verification}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "products"
                ? "border-amber-500 text-stone-900 font-bold"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Product Moderation
            {stats.pending_product_approval > 0 && (
              <span className="bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {stats.pending_product_approval}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Platform Metrics */}
        {activeTab === "metrics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                <span className="text-xs text-stone-500 block">Registered Traders</span>
                <span className="text-2xl font-black text-stone-900 font-mono mt-1 block">
                  {stats.total_parties}
                </span>
                <span className="text-[11px] text-emerald-600 block mt-1">
                  {stats.verified_parties} verified
                </span>
              </div>
              <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                <span className="text-xs text-stone-500 block">Pending Verification</span>
                <span className="text-2xl font-black text-amber-600 font-mono mt-1 block">
                  {stats.pending_verification}
                </span>
                <span className="text-[11px] text-stone-400 block mt-1">Requires review</span>
              </div>
              <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                <span className="text-xs text-stone-500 block">Active Listings</span>
                <span className="text-2xl font-black text-stone-900 font-mono mt-1 block">
                  {stats.active_products}
                </span>
                <span className="text-[11px] text-amber-600 block mt-1">
                  {stats.pending_product_approval} pending
                </span>
              </div>
              <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                <span className="text-xs text-stone-500 block">Trade RFQs</span>
                <span className="text-2xl font-black text-stone-900 font-mono mt-1 block">
                  {stats.total_rfqs}
                </span>
                <span className="text-[11px] text-stone-500 block mt-1">
                  {stats.total_quotations} quotes submitted
                </span>
              </div>
              <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                <span className="text-xs text-stone-500 block">Shipments In Transit</span>
                <span className="text-2xl font-black text-blue-600 font-mono mt-1 block">
                  {stats.in_transit_shipments}
                </span>
                <span className="text-[11px] text-emerald-600 block mt-1">
                  {stats.completed_orders} completed
                </span>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Cross-Border Regulatory Compliance
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed max-w-3xl">
                The COVERLY international trade engine verifies Directorate General of Foreign Trade (DGFT) Importer-Exporter Codes (IEC), Authorized Dealer (AD) codes, port loading credentials, and validates export pricing against benchmark reference exchange rates.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Trader Verifications Queue */}
        {activeTab === "traders" && (
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900">Trader Compliance Audit Queue</h3>
              <span className="text-xs text-stone-500">{parties.length} total trade entities</span>
            </div>

            {parties.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500">
                No trade entities found in verification queue.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider border-b border-stone-200">
                    <tr>
                      <th className="p-3">Company Name</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Country</th>
                      <th className="p-3">IEC Code</th>
                      <th className="p-3">AD Code</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {parties.map((p) => {
                      const biz = p.businesses;
                      return (
                        <tr key={p.id} className="hover:bg-stone-50/50">
                          <td className="p-3 font-semibold text-stone-900">
                            {biz?.name || p.headline || "Trader Entity"}
                          </td>
                          <td className="p-3 uppercase font-mono text-[11px]">
                            {p.party_type}
                          </td>
                          <td className="p-3">{p.country_name || "India"}</td>
                          <td className="p-3 font-mono font-bold text-stone-800">{p.iec_code || "—"}</td>
                          <td className="p-3 font-mono text-stone-600">{p.authorized_dealer_code || "—"}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              p.verification_status === "verified"
                                ? "bg-emerald-100 text-emerald-800"
                                : p.verification_status === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}>
                              {p.verification_status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                setActionParty(p);
                                setPartyActionType("approve");
                                setPartyAuditNotes(p.verification_notes || "");
                              }}
                              className="px-3 py-1 text-xs font-semibold rounded bg-stone-900 text-white hover:bg-stone-800 transition-colors"
                            >
                              Review
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
        )}

        {/* Tab 3: Product Moderation Queue */}
        {activeTab === "products" && (
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900">International Product Listings Moderation</h3>
              <span className="text-xs text-stone-500">{products.length} products listed</span>
            </div>

            {products.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500">
                No international products require moderation.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider border-b border-stone-200">
                    <tr>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">HS Code</th>
                      <th className="p-3">Base Price</th>
                      <th className="p-3">MOQ</th>
                      <th className="p-3">Loading Port</th>
                      <th className="p-3">Moderation</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {products.map((prod) => (
                      <tr key={prod.id} className="hover:bg-stone-50/50">
                        <td className="p-3 font-semibold text-stone-900">{prod.name}</td>
                        <td className="p-3 font-mono text-stone-600">{prod.hs_code || "—"}</td>
                        <td className="p-3 font-mono font-bold text-stone-900">
                          {prod.currency} {prod.base_price_fob.toLocaleString()}
                        </td>
                        <td className="p-3">{prod.moq} {prod.unit_of_measurement}</td>
                        <td className="p-3 text-stone-600">{prod.loading_port || "Nhava Sheva"}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            prod.moderation_status === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {prod.moderation_status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setActionProduct(prod);
                              setProductActionType("approve");
                              setProductAuditNotes(prod.moderation_notes || "");
                            }}
                            className="px-3 py-1 text-xs font-semibold rounded bg-stone-900 text-white hover:bg-stone-800 transition-colors"
                          >
                            Moderate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal: Review Trader Verification */}
        {actionParty && (
          <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <h3 className="text-base font-bold text-stone-900">Audit Trader Credentials</h3>
                <button
                  onClick={() => setActionParty(null)}
                  className="text-stone-400 hover:text-stone-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs space-y-2 bg-stone-50 p-3 rounded-lg border border-stone-200">
                <div>Company: <strong>{actionParty.businesses?.name || actionParty.headline}</strong></div>
                <div>IEC Code: <span className="font-mono font-bold">{actionParty.iec_code || "Not Provided"}</span></div>
                <div>AD Code: <span className="font-mono">{actionParty.authorized_dealer_code || "Not Provided"}</span></div>
                <div>Primary Ports: <span>{actionParty.primary_loading_ports?.join(", ") || "None"}</span></div>
              </div>

              <form onSubmit={handleVerifyPartySubmit} className="space-y-3">
                <div>
                  <label className="text-xs text-stone-600 block mb-1 font-medium">Compliance Decision</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPartyActionType("approve")}
                      className={`p-2 rounded text-xs font-bold border transition-all ${
                        partyActionType === "approve"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-stone-700 border-stone-200"
                      }`}
                    >
                      Verify
                    </button>
                    <button
                      type="button"
                      onClick={() => setPartyActionType("reject")}
                      className={`p-2 rounded text-xs font-bold border transition-all ${
                        partyActionType === "reject"
                          ? "bg-rose-600 text-white border-rose-600"
                          : "bg-white text-stone-700 border-stone-200"
                      }`}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => setPartyActionType("suspend")}
                      className={`p-2 rounded text-xs font-bold border transition-all ${
                        partyActionType === "suspend"
                          ? "bg-stone-800 text-white border-stone-800"
                          : "bg-white text-stone-700 border-stone-200"
                      }`}
                    >
                      Suspend
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-stone-600 block mb-1 font-medium">Audit Notes</label>
                  <textarea
                    rows={2}
                    value={partyAuditNotes}
                    onChange={(e) => setPartyAuditNotes(e.target.value)}
                    placeholder="Enter compliance verification remarks or rejection reason..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
                  />
                </div>

                <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActionParty(null)}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingParty}
                    className="px-5 py-2 text-xs font-bold rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400"
                  >
                    {isProcessingParty ? "Saving..." : "Submit Decision"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Moderate Product */}
        {actionProduct && (
          <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <h3 className="text-base font-bold text-stone-900">Moderate Product Listing</h3>
                <button
                  onClick={() => setActionProduct(null)}
                  className="text-stone-400 hover:text-stone-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs space-y-1 bg-stone-50 p-3 rounded-lg border border-stone-200">
                <div>Product: <strong>{actionProduct.name}</strong></div>
                <div>HS Code: <span className="font-mono">{actionProduct.hs_code || "None"}</span></div>
                <div>FOB Price: <span className="font-mono font-bold">{actionProduct.currency} {actionProduct.base_price_fob}</span></div>
              </div>

              <form onSubmit={handleModerateProductSubmit} className="space-y-3">
                <div>
                  <label className="text-xs text-stone-600 block mb-1 font-medium">Moderation Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setProductActionType("approve")}
                      className={`p-2 rounded text-xs font-bold border transition-all ${
                        productActionType === "approve"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-stone-700 border-stone-200"
                      }`}
                    >
                      Approve Listing
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductActionType("reject")}
                      className={`p-2 rounded text-xs font-bold border transition-all ${
                        productActionType === "reject"
                          ? "bg-rose-600 text-white border-rose-600"
                          : "bg-white text-stone-700 border-stone-200"
                      }`}
                    >
                      Reject Listing
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-stone-600 block mb-1 font-medium">Moderation Remarks</label>
                  <textarea
                    rows={2}
                    value={productAuditNotes}
                    onChange={(e) => setProductAuditNotes(e.target.value)}
                    placeholder="Enter compliance or tariff remarks..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
                  />
                </div>

                <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActionProduct(null)}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingProduct}
                    className="px-5 py-2 text-xs font-bold rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400"
                  >
                    {isProcessingProduct ? "Saving..." : "Save Moderation"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
