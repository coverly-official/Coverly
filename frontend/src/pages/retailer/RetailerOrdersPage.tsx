import React, { useEffect, useState } from "react";
import { ShoppingBag, Truck, Printer, CheckCircle, Clock, MapPin, Building2, Eye } from "lucide-react";

export const RetailerOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/retailer/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setOrders(json.data);
      }
    } catch (err) {
      console.error("Load orders error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function openOrderDetail(orderId: string) {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/retailer/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSelectedOrder(json.data);
        setShowDetailModal(true);
      }
    } catch (err) {
      console.error("Open order detail error:", err);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-emerald-700" />
            Wholesale Orders & Delivery Tracking
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Monitor wholesale purchase orders, fulfillment progress, carrier dispatches, and delivery milestones.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-stone-500 text-xs">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-stone-200 p-12 text-center">
          <ShoppingBag className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-stone-900">No Wholesale Orders Yet</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
            Once you accept an incoming supplier quotation, your formal order and purchase order will automatically appear here with live tracking.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[10px] border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Date Placed</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Carrier & Tracking</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-stone-50/60">
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                      {ord.order_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-stone-900">{ord.businesses?.name || "Wholesale Partner"}</p>
                      <p className="text-[10px] text-stone-500">{ord.businesses?.city || "India"}</p>
                    </td>
                    <td className="py-3.5 px-4 text-stone-600">
                      {new Date(ord.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                        {ord.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {ord.tracking_number ? (
                        <div>
                          <p className="font-mono text-[11px] text-stone-900 font-semibold">{ord.tracking_number}</p>
                          <p className="text-[10px] text-stone-500">{ord.carrier || "COVERLY Logistics"}</p>
                        </div>
                      ) : (
                        <span className="text-stone-400">Awaiting Dispatch</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-stone-900">
                      ₹{Number(ord.total_amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openOrderDetail(ord.id)}
                        className="px-3 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium inline-flex items-center gap-1 text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail & Tracking Stepper Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-stone-200 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  Wholesale Purchase Order
                </span>
                <h2 className="text-lg font-bold text-stone-900 mt-1">
                  Order {selectedOrder.order_number}
                </h2>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-stone-400 hover:text-stone-700 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Tracking Stepper */}
            <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-700" />
                Live Logistics & Fulfillment Progression
              </h3>

              <div className="space-y-2 pt-2">
                {selectedOrder.tracking_stages?.map((stage: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        stage.status === "completed"
                          ? "bg-emerald-600 text-white"
                          : "bg-stone-200 text-stone-500"
                      }`}
                    >
                      {stage.status === "completed" ? "✓" : idx + 1}
                    </div>
                    <span
                      className={`font-medium ${
                        stage.status === "completed" ? "text-stone-900" : "text-stone-400"
                      }`}
                    >
                      {stage.name}
                    </span>
                    {stage.tracking && (
                      <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                        {stage.tracking}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Order Items Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Purchased Items
              </h3>
              <div className="border border-stone-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3">Qty</th>
                      <th className="py-2 px-3">Unit Price</th>
                      <th className="py-2 px-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {selectedOrder.order_items?.map((item: any, i: number) => (
                      <tr key={i}>
                        <td className="py-2.5 px-3 font-semibold text-stone-900">{item.item_name}</td>
                        <td className="py-2.5 px-3">{item.quantity} {item.unit}</td>
                        <td className="py-2.5 px-3">₹{item.unit_price}</td>
                        <td className="py-2.5 px-3 font-bold text-right">₹{item.total_price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-3 text-xs border-t border-stone-100">
                <span className="font-semibold text-stone-600">Total Purchase Value:</span>
                <span className="text-base font-bold text-stone-900">
                  ₹{Number(selectedOrder.total_amount || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print Purchase Order
              </button>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
