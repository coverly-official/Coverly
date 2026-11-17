import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { RFQ, Order } from "@/types";
import {
  FileText,
  ShoppingBag,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  Bookmark,
  Heart,
  Users,
  ClipboardList,
  FileCheck,
  AlertCircle,
  Sparkles,
  Building2,
  Send,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const BuyerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({
    total_rfqs: 0,
    active_rfqs: 0,
    received_quotations: 0,
    accepted_quotations: 0,
    active_orders: 0,
    completed_orders: 0,
    total_orders: 0,
    saved_suppliers: 0,
    saved_products: 0,
    pending_purchase_requests: 0,
  });

  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [buyerProfile, setBuyerProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [claimStatus, setClaimStatus] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);

    const headers = {
      "Content-Type": "application/json",
      "x-user-id": user.id,
    };

    try {
      const [statsRes, profRes, rfqRes, ordRes] = await Promise.all([
        fetch(`${API_BASE}/buyer/stats`, { headers }).then((r) => r.json()).catch(() => null),
        fetch(`${API_BASE}/buyer/profile`, { headers }).then((r) => r.json()).catch(() => null),
        fetch(`${API_BASE}/rfqs?buyer_id=${user.id}`).then((r) => r.json()).catch(() => null),
        fetch(`${API_BASE}/orders?buyer_id=${user.id}`).then((r) => r.json()).catch(() => null),
      ]);

      if (statsRes?.success) setStats(statsRes.data);
      if (profRes?.success) setBuyerProfile(profRes.data);
      if (rfqRes?.success) setRfqs(rfqRes.data || []);
      if (ordRes?.success) setOrders(ordRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleClaimGuestEnquiries = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/buyer/guest-claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
      });
      const json = await res.json();
      if (json.success) {
        setClaimStatus(`Linked ${json.claimed_count || 0} historical enquiries to your account!`);
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-900 text-white">
              {buyerProfile?.business?.name || "Procurement Workspace"}
            </span>
            <span className="text-xs text-stone-500 font-mono">
              Role: {buyerProfile?.role_in_business?.replace(/_/g, " ").toUpperCase() || "OWNER"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-1">
            Welcome back, {user?.full_name}
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage your procurement pipeline, incoming quotations, purchase approvals, and orders.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/buyer/rfq/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-stone-950 rounded-lg text-xs font-bold hover:bg-amber-400 transition shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            Create RFQ
          </Link>
          <Link
            to="/buyer/purchase-requests"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition"
          >
            <ClipboardList className="w-4 h-4" />
            New Purchase Request
          </Link>
        </div>
      </div>

      {/* Guest Linking Banner */}
      {claimStatus ? (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{claimStatus}</span>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Submitted enquiries as a guest previously? Link them to your verified company account.</span>
          </div>
          <button
            onClick={handleClaimGuestEnquiries}
            className="px-3 py-1 bg-amber-500 text-stone-950 font-bold rounded-lg hover:bg-amber-400 transition text-[11px] shrink-0"
          >
            Check & Link Enquiries
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold uppercase">Active RFQs</span>
            <FileText className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-stone-900 font-mono">{stats.active_rfqs}</div>
          <div className="text-[10px] text-stone-400 mt-1">{stats.total_rfqs} total posted</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold uppercase">Active Orders</span>
            <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-stone-900 font-mono">{stats.active_orders}</div>
          <div className="text-[10px] text-stone-400 mt-1">In fulfillment pipeline</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold uppercase">Completed Orders</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">{stats.completed_orders}</div>
          <div className="text-[10px] text-stone-400 mt-1">Delivered & confirmed</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold uppercase">Pending PRs</span>
            <ClipboardList className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700 font-mono">{stats.pending_purchase_requests}</div>
          <div className="text-[10px] text-stone-400 mt-1">Awaiting approval</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold uppercase">Saved Suppliers</span>
            <Bookmark className="w-3.5 h-3.5 text-stone-400" />
          </div>
          <div className="text-2xl font-black text-stone-900 font-mono">{stats.saved_suppliers}</div>
          <div className="text-[10px] text-stone-400 mt-1">Shortlisted partners</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold uppercase">Saved Products</span>
            <Heart className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 font-mono">{stats.saved_products}</div>
          <div className="text-[10px] text-stone-400 mt-1">Bookmarked items</div>
        </div>
      </div>

      {/* Sourcing & Team Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/buyer/purchase-requests"
          className="bg-white border border-stone-200 rounded-xl p-5 hover:border-amber-400 hover:shadow-xs transition flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-purple-600" />
              Internal Requisitions & Approvals
            </div>
            <p className="text-[11px] text-stone-500 mt-1">Review and approve team purchase requests within company spending limits.</p>
          </div>
          <ArrowRight className="w-4 h-4 text-stone-400" />
        </Link>

        <Link
          to="/buyer/purchase-orders"
          className="bg-white border border-stone-200 rounded-xl p-5 hover:border-amber-400 hover:shadow-xs transition flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              Purchase Orders (POs)
            </div>
            <p className="text-[11px] text-stone-500 mt-1">Generate official POs, review supplier confirmations, and print order invoices.</p>
          </div>
          <ArrowRight className="w-4 h-4 text-stone-400" />
        </Link>

        <Link
          to="/buyer/team"
          className="bg-white border border-stone-200 rounded-xl p-5 hover:border-amber-400 hover:shadow-xs transition flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              Team & Permissions
            </div>
            <p className="text-[11px] text-stone-500 mt-1">Invite procurement managers, buyers, and assign purchasing permissions.</p>
          </div>
          <ArrowRight className="w-4 h-4 text-stone-400" />
        </Link>
      </div>

      {/* Pipeline Sections: Recent RFQs & Active Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent RFQs */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900">Active Procurement RFQs</h3>
            <Link to="/buyer/rfqs" className="text-xs text-amber-700 font-semibold hover:underline">
              View All ({rfqs.length})
            </Link>
          </div>

          {rfqs.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400">
              No RFQs submitted yet. Click 'Create RFQ' to broadcast your first requirement.
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {rfqs.slice(0, 5).map((r) => (
                <div key={r.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-semibold text-xs text-stone-900 block">{r.title}</span>
                    <span className="text-[10px] text-stone-500 font-mono">
                      {r.rfq_number} • {r.delivery_city}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      r.status === "quotes_received"
                        ? "bg-amber-100 text-amber-800"
                        : r.status === "accepted"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-stone-100 text-stone-700"
                    }`}>
                      {r.status.replace(/_/g, " ")}
                    </span>
                    <Link
                      to={`/buyer/rfqs/${r.id}`}
                      className="p-1 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-100"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Orders */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900">Fulfillment & Orders Pipeline</h3>
            <Link to="/buyer/orders" className="text-xs text-amber-700 font-semibold hover:underline">
              View All ({orders.length})
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400">
              No orders placed yet. Accepted quotations will generate live orders here.
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {orders.slice(0, 5).map((o) => (
                <div key={o.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-mono font-bold text-xs text-stone-900 block">{o.order_number}</span>
                    <span className="text-[10px] text-stone-500">
                      ₹{o.total_amount?.toLocaleString()} • {o.carrier || "Standard Dispatch"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      o.status === "completed"
                        ? "bg-emerald-100 text-emerald-800"
                        : o.status === "shipped"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {o.status.replace(/_/g, " ")}
                    </span>
                    <Link
                      to={`/buyer/orders/${o.id}`}
                      className="p-1 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-100"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
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
