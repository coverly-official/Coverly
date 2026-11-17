import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  ShoppingBag,
  Search,
  Filter,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
  Calendar,
  IndianRupee,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const AdminOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "x-user-id": user?.id || localStorage.getItem("coverly_user_id") || "",
  });

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("limit", "50");

      const res = await fetch(`${API_BASE}/admin/orders?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setOrders(data.data.orders || []);
        setTotalCount(data.data.total || 0);
      }
    } catch (err) {
      console.error("Failed to load orders", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const filteredOrders = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.order_number?.toLowerCase().includes(q) ||
      o.tracking_number?.toLowerCase().includes(q) ||
      o.businesses?.name?.toLowerCase().includes(q) ||
      o.users?.full_name?.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "shipped":
      case "in_transit":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "production":
      case "processing":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-stone-50 text-stone-700 border-stone-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Enterprise Orders & Fulfillment
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Global governance of B2B purchase orders, production progression, and consignment delivery.
          </p>
        </div>
        <button
          onClick={loadOrders}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-200 text-stone-700 text-xs font-semibold rounded-lg hover:bg-stone-50 transition shadow-2xs self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Orders
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
            Total Orders
          </span>
          <p className="text-2xl font-extrabold text-stone-900 mt-1">{totalCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
            In Production
          </span>
          <p className="text-2xl font-extrabold text-amber-900 mt-1">
            {orders.filter((o) => ["production", "processing"].includes(o.status)).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
            Dispatched / In Transit
          </span>
          <p className="text-2xl font-extrabold text-blue-900 mt-1">
            {orders.filter((o) => ["shipped", "in_transit"].includes(o.status)).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            Completed Orders
          </span>
          <p className="text-2xl font-extrabold text-emerald-900 mt-1">
            {orders.filter((o) => ["delivered", "completed"].includes(o.status)).length}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by PO number, buyer name, supplier, or tracking consignment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-800"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-stone-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-700 focus:outline-none"
          >
            <option value="all">All Lifecycle States</option>
            <option value="pending_deposit">Pending Deposit</option>
            <option value="production">In Production</option>
            <option value="qc_passed">QC Passed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-stone-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 text-xs text-stone-500">
            <ShoppingBag className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            No purchase orders matching the specified filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold uppercase tracking-wider text-stone-700">
                <tr>
                  <th className="py-3.5 px-4">PO Number</th>
                  <th className="py-3.5 px-4">Buyer Enterprise</th>
                  <th className="py-3.5 px-4">Supplier Manufacturer</th>
                  <th className="py-3.5 px-4 text-right">Order Value</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Logistics Consignment</th>
                  <th className="py-3.5 px-4 text-right">Order Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                      {order.order_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-stone-900">
                        {order.users?.full_name || "Enterprise Buyer"}
                      </div>
                      <div className="text-[11px] text-stone-400">{order.users?.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-stone-400" />
                        {order.businesses?.name || "Manufacturing Facility"}
                      </div>
                      <div className="text-[11px] text-stone-400">{order.businesses?.city}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-stone-900">
                      ₹{Number(order.total_amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                          order.status
                        )}`}
                      >
                        {order.status?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {order.tracking_number ? (
                        <div className="font-mono text-[11px] text-blue-700 font-semibold flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          {order.tracking_number}
                        </div>
                      ) : (
                        <span className="text-stone-400 text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right text-stone-500 font-mono text-[11px]">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
