import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { Order } from "@/types";
import {
  ShoppingBag,
  Truck,
  CheckCircle,
  Building2,
  Clock,
  FileCheck,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const BuyerOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOrder = () => {
    setIsLoading(true);
    fetch(`${API_BASE}/orders/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setOrder(data.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleConfirmDelivery = async () => {
    if (!user || !order) return;
    setIsUpdating(true);

    try {
      const res = await fetch(`${API_BASE}/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_status: "completed",
          changed_by: user.id,
          note: "Buyer signed off on delivery and quality inspection.",
        }),
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.error || "Failed to confirm delivery.");
      }

      fetchOrder();
    } catch (err: any) {
      alert(err.message || "Failed to update order status.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 animate-pulse space-y-4">
        <div className="h-8 bg-stone-200 rounded w-1/3" />
        <div className="h-48 bg-stone-200 rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16 bg-white border border-stone-200 rounded-xl">
        <h3 className="text-sm font-semibold text-stone-800">Order not found</h3>
        <Link to="/buyer/orders" className="text-xs text-stone-900 underline mt-2 inline-block">
          Return to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
              {order.order_number}
            </span>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                order.status === "completed"
                  ? "bg-emerald-100 text-emerald-800"
                  : order.status === "shipped"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {order.status.replace("_", " ")}
            </span>
          </div>
          <h1 className="text-xl font-bold text-stone-900">
            Total Sourcing Value: ₹{Number(order.total_amount).toLocaleString("en-IN")}
          </h1>
          <p className="text-xs text-stone-500 mt-1 flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5" />
            Supplier: {order.businesses?.name} • City: {order.businesses?.city}
          </p>
        </div>

        {order.status === "shipped" && (
          <button
            onClick={handleConfirmDelivery}
            disabled={isUpdating}
            className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 transition disabled:opacity-50 flex items-center gap-2 self-start"
          >
            <CheckCircle className="w-4 h-4" />
            {isUpdating ? "Confirming..." : "Confirm Delivery Received"}
          </button>
        )}
      </div>

      {/* Shipment & Tracking if dispatched */}
      {order.tracking_number && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-xs text-blue-900 flex items-center justify-between">
          <div>
            <div className="font-semibold flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-700" />
              Consignment Dispatched via {order.carrier || "Designated Freight Carrier"}
            </div>
            <div className="text-[11px] text-blue-700 mt-0.5">
              Docket / Tracking Number: <span className="font-mono font-bold">{order.tracking_number}</span>
            </div>
          </div>
          {order.dispatch_date && (
            <div className="text-[11px] text-blue-700">Dispatched: {order.dispatch_date}</div>
          )}
        </div>
      )}

      {/* Ordered Line Items */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700 mb-4">
          Order Line Items
        </h3>
        <div className="divide-y divide-stone-100 text-xs">
          {order.items?.map((it: any) => (
            <div key={it.id} className="py-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-stone-900">{it.item_name}</span>
                <span className="text-stone-500 ml-2">
                  (₹{Number(it.unit_price).toLocaleString("en-IN")}/{it.unit})
                </span>
              </div>
              <div className="text-right">
                <div className="font-bold text-stone-900">
                  {it.quantity} {it.unit}s
                </div>
                <div className="text-[11px] text-stone-500">
                  ₹{Number(it.total_price).toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Audit Timeline */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700 mb-4">
          Milestone Progression History
        </h3>
        <div className="space-y-4 text-xs">
          {order.history?.map((h: any, idx: number) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-stone-900 mt-1.5 shrink-0" />
              <div className="flex-1">
                <div className="font-semibold uppercase tracking-wider text-stone-800 text-[11px]">
                  {h.new_status.replace("_", " ")}
                </div>
                {h.note && <div className="text-stone-600 mt-0.5">{h.note}</div>}
                <div className="text-[10px] text-stone-400 mt-0.5">
                  {new Date(h.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
