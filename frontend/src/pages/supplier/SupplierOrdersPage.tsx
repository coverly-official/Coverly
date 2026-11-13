import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { Order } from "@/types";
import { ShoppingBag, Truck, CheckCircle2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const SupplierOrdersPage: React.FC = () => {
  const { user, business } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Status update modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState("in_production");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [note, setNote] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOrders = () => {
    if (!business) return;
    setIsLoading(true);

    fetch(`${API_BASE}/orders?supplier_business_id=${business.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setOrders(data.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [business]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedOrder) return;
    setIsUpdating(true);

    try {
      const res = await fetch(`${API_BASE}/orders/${selectedOrder.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_status: newStatus,
          changed_by: user.id,
          note: note.trim() || undefined,
          tracking_number: trackingNumber.trim() || undefined,
          carrier: carrier.trim() || undefined,
        }),
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.error || "Failed to update status.");
      }

      setSelectedOrder(null);
      fetchOrders();
    } catch (err: any) {
      alert(err.message || "Failed to update order.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Order Management</h1>
        <p className="text-xs text-stone-500 mt-1">
          Manage production schedules, logistics dispatch numbers, and order delivery milestones
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
            <h3 className="text-sm font-semibold text-stone-800">No orders received yet</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
              When buyers accept your quotations, the resulting orders will appear here for fulfillment.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold uppercase tracking-wider text-stone-700">
              <tr>
                <th className="py-3.5 px-4">Order Number</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Consignment Value</th>
                <th className="py-3.5 px-4">Carrier / Tracking</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-stone-50/70 transition">
                  <td className="py-3 px-4 font-mono font-semibold text-stone-900">
                    {ord.order_number}
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
                  <td className="py-3 px-4 text-stone-600">
                    {ord.tracking_number ? (
                      <span className="font-mono">{ord.carrier}: {ord.tracking_number}</span>
                    ) : (
                      <span className="text-stone-400">Pending Dispatch</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-stone-500">
                    {new Date(ord.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedOrder(ord);
                        setNewStatus(ord.status === "pending_deposit" ? "in_production" : "shipped");
                      }}
                      className="px-2.5 py-1 bg-stone-900 text-white rounded text-xs font-semibold hover:bg-stone-800 transition"
                    >
                      Update Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Update Status Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-lg border border-stone-200">
            <h3 className="font-bold text-base text-stone-900 mb-1">
              Update Order {selectedOrder.order_number}
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Transition production status and supply consignment tracking identifiers
            </p>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Next Milestone Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2 border border-stone-200 rounded-lg bg-white"
                >
                  <option value="in_production">In Production</option>
                  <option value="quality_check">Quality Check (QC)</option>
                  <option value="shipped">Shipped / Dispatched</option>
                  <option value="delivered">Delivered to Buyer</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {newStatus === "shipped" && (
                <>
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">Carrier Name</label>
                    <input
                      type="text"
                      placeholder="e.g. VRL Logistics, Safechem, Delhivery"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      className="w-full p-2 border border-stone-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">Tracking / Docket Number</label>
                    <input
                      type="text"
                      placeholder="e.g. DKT-8849201"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full p-2 border border-stone-200 rounded-lg"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Internal Note / Comment</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Batch completed inspection; dispatched 2 pallets via road transit."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-2 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 py-2 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2 rounded-lg bg-stone-900 text-white font-semibold hover:bg-stone-800 transition disabled:opacity-50"
                >
                  {isUpdating ? "Saving..." : "Save Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
