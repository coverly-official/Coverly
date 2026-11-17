import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Clock,
  CheckCircle,
  Truck,
  Bookmark,
  ShoppingBag,
  RotateCcw,
  PlusCircle,
  ArrowRight,
  Store,
  ShieldCheck,
  AlertCircle,
  ListOrdered,
} from "lucide-react";

interface RetailerStats {
  totalEnquiries: number;
  activeRfqs: number;
  pendingQuotations: number;
  acceptedQuotations: number;
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  pendingDeliveries: number;
  savedSuppliers: number;
  savedProducts: number;
  purchaseLists: number;
  purchaseRequests: number;
  reorderReminders: number;
}

export const RetailerDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<RetailerStats>({
    totalEnquiries: 0,
    activeRfqs: 0,
    pendingQuotations: 0,
    acceptedQuotations: 0,
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    pendingDeliveries: 0,
    savedSuppliers: 0,
    savedProducts: 0,
    purchaseLists: 0,
    purchaseRequests: 0,
    reorderReminders: 0,
  });
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch Stats
      const statsRes = await fetch("/api/retailer/stats", { headers });
      const statsJson = await statsRes.json();
      if (statsJson.success && statsJson.data) {
        setStats(statsJson.data);
      }

      // 2. Fetch Recent RFQs
      const rfqRes = await fetch("/api/retailer/rfqs", { headers });
      const rfqJson = await rfqRes.json();
      if (rfqJson.success && rfqJson.data) {
        setRfqs(rfqJson.data.slice(0, 5));
      }

      // 3. Fetch Orders
      const ordRes = await fetch("/api/retailer/orders", { headers });
      const ordJson = await ordRes.json();
      if (ordJson.success && ordJson.data) {
        setOrders(ordJson.data.slice(0, 5));
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleClaimGuestEnquiries() {
    setClaiming(true);
    setClaimMessage(null);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/retailer/claim-guest-inquiries", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setClaimMessage(json.message);
        loadDashboardData();
      } else {
        setClaimMessage(json.error || "Failed to link enquiries.");
      }
    } catch {
      setClaimMessage("Network error claiming guest enquiries.");
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-stone-900 to-stone-950 text-white rounded-2xl p-6 md:p-8 shadow-sm border border-emerald-800/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <Store className="w-3.5 h-3.5" />
              Retail Wholesale Command Hub
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-stone-100">
              Retailer Sourcing Dashboard
            </h1>
            <p className="text-stone-300 text-xs md:text-sm max-w-xl">
              Source FMCG, grocery, electronics, fashion, and hardware directly from verified manufacturers, wholesalers, and distributors with landed-cost clarity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/retailer/purchase-lists"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center gap-2 shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              New Purchase List
            </Link>
            <Link
              to="/retailer/reorder"
              className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition flex items-center gap-2 border border-stone-700"
            >
              <RotateCcw className="w-4 h-4" />
              Restock Reminders ({stats.reorderReminders})
            </Link>
          </div>
        </div>

        {/* Guest enquiry linking notice */}
        <div className="mt-6 pt-5 border-t border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-stone-300">
            <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Have previous inquiries submitted before creating your account?</span>
          </div>
          <button
            onClick={handleClaimGuestEnquiries}
            disabled={claiming}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-600/50 transition self-start sm:self-auto disabled:opacity-50"
          >
            {claiming ? "Syncing..." : "Sync Previous Guest Enquiries"}
          </button>
        </div>
        {claimMessage && (
          <p className="mt-2 text-xs font-medium text-emerald-300 bg-emerald-950/60 p-2 rounded border border-emerald-700/50">
            {claimMessage}
          </p>
        )}
      </div>

      {/* Primary KPI Grid (11 Actual Database Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active RFQs</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-stone-900">{stats.activeRfqs}</p>
          <p className="text-[10px] text-stone-500 mt-0.5">{stats.totalEnquiries} total inquiries</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Quotations</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-stone-900">{stats.pendingQuotations}</p>
          <p className="text-[10px] text-emerald-600 mt-0.5">{stats.acceptedQuotations} accepted</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Orders</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-stone-900">{stats.activeOrders}</p>
          <p className="text-[10px] text-stone-500 mt-0.5">{stats.pendingDeliveries} in transit</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Completed</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-stone-900">{stats.completedOrders}</p>
          <p className="text-[10px] text-stone-500 mt-0.5">lifetime fulfilled</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Purchase Lists</span>
            <ListOrdered className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-stone-900">{stats.purchaseLists}</p>
          <p className="text-[10px] text-stone-500 mt-0.5">{stats.savedProducts} saved products</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Restock Alerts</span>
            <RotateCcw className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-stone-900">{stats.reorderReminders}</p>
          <p className="text-[10px] text-stone-500 mt-0.5">{stats.savedSuppliers} saved suppliers</p>
        </div>
      </div>

      {/* Two Column Layout: Recent RFQs & Active Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Wholesale RFQs */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-stone-900">Recent Wholesale RFQs</h2>
              <p className="text-xs text-stone-500">Quotes received from wholesale suppliers</p>
            </div>
            <Link
              to="/retailer/rfqs"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {rfqs.length === 0 ? (
            <div className="text-center py-10 bg-stone-50/60 rounded-xl border border-dashed border-stone-200">
              <FileText className="w-8 h-8 text-stone-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-stone-700">No purchase RFQs yet.</p>
              <p className="text-[11px] text-stone-500 mt-0.5">Prepare a purchase list or create your first wholesale RFQ.</p>
              <Link
                to="/retailer/purchase-lists"
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-medium"
              >
                Create Purchase List
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {rfqs.map((rfq) => (
                <div key={rfq.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate">{rfq.title}</p>
                    <p className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                      <span>{rfq.rfq_number}</span>
                      <span>•</span>
                      <span>{rfq.delivery_city}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-medium">
                        {rfq.quotes_count || 0} quotes received
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                      {rfq.status}
                    </span>
                    <Link
                      to={`/retailer/rfqs`}
                      className="text-xs px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium"
                    >
                      Compare
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Wholesale Orders */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-stone-900">Active Wholesale Orders</h2>
              <p className="text-xs text-stone-500">Fulfillment and carrier dispatch status</p>
            </div>
            <Link
              to="/retailer/orders"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-10 bg-stone-50/60 rounded-xl border border-dashed border-stone-200">
              <ShoppingBag className="w-8 h-8 text-stone-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-stone-700">No orders placed yet.</p>
              <p className="text-[11px] text-stone-500 mt-0.5">Accept an incoming wholesale quotation to generate a formal purchase order.</p>
              <Link
                to="/retailer/wholesale"
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-medium"
              >
                Browse Wholesale Products
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {orders.map((ord) => (
                <div key={ord.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate">
                      {ord.order_number}
                    </p>
                    <p className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                      <span>{ord.businesses?.name || "Wholesale Supplier"}</span>
                      <span>•</span>
                      <span className="font-semibold text-stone-900">
                        ₹{Number(ord.total_amount || 0).toLocaleString("en-IN")}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                      {ord.status.replace("_", " ")}
                    </span>
                    <Link
                      to={`/retailer/orders`}
                      className="text-xs px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium"
                    >
                      Track
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
