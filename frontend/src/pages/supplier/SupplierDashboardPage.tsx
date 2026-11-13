import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { Order } from "@/types";
import {
  Inbox,
  ShoppingBag,
  Package,
  ShieldCheck,
  PlusCircle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const SupplierDashboardPage: React.FC = () => {
  const { user, business } = useAuth();
  const [incomingRfqs, setIncomingRfqs] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [productsCount, setProductsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!business) {
      setIsLoading(false);
      return;
    }

    Promise.all([
      fetch(`${API_BASE}/rfqs/supplier/incoming?business_id=${business.id}`).then((r) => r.json()),
      fetch(`${API_BASE}/orders?supplier_business_id=${business.id}`).then((r) => r.json()),
      fetch(`${API_BASE}/products?business_id=${business.id}`).then((r) => r.json()),
    ])
      .then(([rfqRes, orderRes, prodRes]) => {
        if (rfqRes.success) setIncomingRfqs(rfqRes.data);
        if (orderRes.success) setOrders(orderRes.data);
        if (prodRes.success) setProductsCount(prodRes.data.length);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [business]);

  const activeOrdersCount = orders.filter((o) => !["completed", "cancelled"].includes(o.status)).length;
  const pendingRfqsCount = incomingRfqs.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            {business?.name || "Supplier Workspace"}
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            {business?.business_type.toUpperCase()} • {business?.city}, {business?.state} • Verification:{" "}
            <span className="font-semibold text-stone-700 capitalize">
              {business?.verification_level.replace("_", " ")}
            </span>
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/supplier/products/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Add Product
          </Link>
          <Link
            to="/supplier/verification"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-stone-200 text-stone-800 rounded-lg text-xs font-semibold hover:bg-stone-50 transition"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Verification Center
          </Link>
        </div>
      </div>

      {/* Verification Notice Banner if unverified */}
      {business?.verification_level === "unverified" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div>
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              Increase buyer trust by completing business verification
            </div>
            <div className="text-[11px] text-amber-700 mt-0.5">
              Submit your GSTIN or factory documents to earn the "Verified Supplier" badge.
            </div>
          </div>
          <Link
            to="/supplier/verification"
            className="px-3 py-1.5 bg-amber-800 text-white rounded-lg font-semibold text-[11px] self-start sm:self-auto hover:bg-amber-900 transition"
          >
            Submit Documents
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Incoming RFQs</span>
            <Inbox className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{incomingRfqs.length}</div>
          <div className="text-[11px] text-stone-500 mt-1">
            {pendingRfqsCount} pending quotation submission
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Orders</span>
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{activeOrdersCount}</div>
          <div className="text-[11px] text-stone-500 mt-1">Orders in production or dispatch</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Catalog Products</span>
            <Package className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{productsCount}</div>
          <div className="text-[11px] text-stone-500 mt-1">Live in wholesale marketplace</div>
        </div>
      </div>

      {/* Incoming RFQs Queue */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-stone-900">Incoming Buyer RFQs</h3>
          <Link to="/supplier/rfqs" className="text-xs font-semibold text-stone-700 hover:text-stone-900 flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-stone-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : incomingRfqs.length === 0 ? (
          <div className="text-center py-8 text-xs text-stone-500">
            No incoming RFQ notifications yet. Make sure your business categories and products are up to date.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {incomingRfqs.slice(0, 5).map((item) => {
              const rfq = item.rfqs;
              if (!rfq) return null;
              return (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-stone-900">{rfq.title}</span>
                      <span className="text-[10px] text-stone-400 font-mono">{rfq.rfq_number}</span>
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      Delivery to {rfq.delivery_city} • Dispatched: {new Date(rfq.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <Link
                    to={`/supplier/rfqs/${rfq.id}/quote`}
                    className="px-3 py-1.5 bg-stone-900 text-white rounded text-xs font-semibold hover:bg-stone-800 transition"
                  >
                    Submit Quotation
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
