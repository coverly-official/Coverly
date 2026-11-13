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
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const BuyerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);

    Promise.all([
      fetch(`${API_BASE}/rfqs?buyer_id=${user.id}`).then((r) => r.json()),
      fetch(`${API_BASE}/orders?buyer_id=${user.id}`).then((r) => r.json()),
    ])
      .then(([rfqRes, orderRes]) => {
        if (rfqRes.success) setRfqs(rfqRes.data);
        if (orderRes.success) setOrders(orderRes.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [user]);

  const activeRfqsCount = rfqs.filter((r) => !["closed", "cancelled"].includes(r.status)).length;
  const activeOrdersCount = orders.filter((o) => !["completed", "cancelled"].includes(o.status)).length;
  const quotesReceivedCount = rfqs.filter((r) => r.status === "quotes_received").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Welcome back, {user?.full_name}
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Buyer Workspace • Manage your RFQ pipeline and wholesale orders
          </p>
        </div>

        <Link
          to="/buyer/rfq/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition shadow-xs self-start"
        >
          <PlusCircle className="w-4 h-4" />
          Create New RFQ
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active RFQs</span>
            <FileText className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{activeRfqsCount}</div>
          <div className="text-[11px] text-stone-500 mt-1">
            {quotesReceivedCount} RFQs have incoming quotes ready
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Orders</span>
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{activeOrdersCount}</div>
          <div className="text-[11px] text-stone-500 mt-1">In production or fulfillment</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Orders</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{orders.length}</div>
          <div className="text-[11px] text-stone-500 mt-1">Cumulative procurement history</div>
        </div>
      </div>

      {/* Recent RFQs Section */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-stone-900">Recent RFQ Requirements</h3>
          <Link to="/buyer/rfqs" className="text-xs font-semibold text-stone-700 hover:text-stone-900 flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-stone-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : rfqs.length === 0 ? (
          <div className="text-center py-8 text-xs text-stone-500">
            No RFQs posted yet. Click "+ Create New RFQ" to request customized quotes from verified suppliers.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {rfqs.slice(0, 5).map((rfq) => (
              <div key={rfq.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-stone-900">{rfq.title}</span>
                    <span className="text-[10px] text-stone-400 font-mono">{rfq.rfq_number}</span>
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    Delivery to {rfq.delivery_city} • Dispatched: {new Date(rfq.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                      rfq.status === "quotes_received"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-stone-100 text-stone-700"
                    }`}
                  >
                    {rfq.status.replace("_", " ")}
                  </span>
                  <Link
                    to={`/buyer/rfqs/${rfq.id}`}
                    className="text-xs font-semibold text-stone-700 hover:text-stone-900"
                  >
                    Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
