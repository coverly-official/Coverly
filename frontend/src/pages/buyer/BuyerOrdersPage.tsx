import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { Order } from "@/types";
import { ShoppingBag, ArrowRight } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const BuyerOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);

    fetch(`${API_BASE}/orders?buyer_id=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setOrders(data.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Procurement Orders</h1>
        <p className="text-xs text-stone-500 mt-1">
          Monitor order production, milestone dispatches, and delivery confirmation
        </p>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-stone-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-stone-800">No active orders</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
              Orders are generated when you accept a supplier's quotation in your RFQ dashboard.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold uppercase tracking-wider text-stone-700">
              <tr>
                <th className="py-3.5 px-4">Order Number</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Delivered Value</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-stone-50/70 transition">
                  <td className="py-3 px-4 font-mono font-semibold text-stone-900">
                    {ord.order_number}
                  </td>
                  <td className="py-3 px-4 font-medium text-stone-800">
                    {ord.businesses?.name || "Supplier"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                        ord.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : ord.status === "shipped"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {ord.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-stone-900">
                    ₹{Number(ord.total_amount).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 text-stone-500">
                    {new Date(ord.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/buyer/orders/${ord.id}`}
                      className="font-semibold text-stone-900 hover:underline inline-flex items-center gap-1"
                    >
                      Track <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
