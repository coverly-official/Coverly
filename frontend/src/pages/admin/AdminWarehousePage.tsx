import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Warehouse,
  Package,
  ArrowLeftRight,
  ClipboardCheck,
  BarChart3,
  RefreshCw,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const TABS = [
  { key: "warehouses", label: "Warehouses & Branches", icon: Warehouse },
  { key: "inventory", label: "Inventory Records", icon: Package },
  { key: "movements", label: "Stock Movements", icon: ArrowLeftRight },
  { key: "qc", label: "Quality Inspection", icon: ClipboardCheck },
  { key: "reports", label: "Inventory Reports", icon: BarChart3 },
];

export const AdminWarehousePage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "warehouses";
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/warehouse`, {
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || localStorage.getItem("coverly_user_id") || "",
        },
      });
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error("Failed to fetch warehouse telemetry", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const stats = data?.stats || {
    totalWarehouses: 0,
    trackedSkus: 0,
    activeInventoryItems: 0,
    qualityInspections: 0,
    stockMovements: 0,
    restockLists: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center shrink-0">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">
              Warehouse & Inventory Operations
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Centralized oversight of registered warehouse branches, SKU inventory, stock dispatch movements & quality checks.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-2xs self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Live Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase text-stone-400">Warehouses / Branches</div>
          <div className="text-xl font-extrabold text-stone-900 mt-1">{stats.totalWarehouses}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase text-stone-400">Tracked SKUs</div>
          <div className="text-xl font-extrabold text-stone-900 mt-1">{stats.trackedSkus}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase text-emerald-600">Active Listings</div>
          <div className="text-xl font-extrabold text-emerald-700 mt-1">{stats.activeInventoryItems}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase text-amber-600">QC Queue</div>
          <div className="text-xl font-extrabold text-amber-700 mt-1">{stats.qualityInspections}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase text-blue-600">Stock Movements</div>
          <div className="text-xl font-extrabold text-blue-700 mt-1">{stats.stockMovements}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase text-stone-400">Restock Lists</div>
          <div className="text-xl font-extrabold text-stone-900 mt-1">{stats.restockLists}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-stone-200">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSearchParams({ tab: tab.key })}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === tab.key
                  ? "bg-stone-900 text-white"
                  : "text-stone-600 hover:bg-stone-200/70 hover:text-stone-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="bg-white border border-stone-200 rounded-xl p-12 text-center text-xs text-stone-500">
          Loading warehouse & inventory telemetry...
        </div>
      ) : activeTab === "warehouses" ? (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Facility / Branch</th>
                <th className="px-4 py-3 font-semibold">Business</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {(data?.warehouses || []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-stone-500">
                    No warehouse or branch locations recorded in the database yet.
                  </td>
                </tr>
              ) : (
                (data?.warehouses || []).map((w: any) => (
                  <tr key={w.id} className="hover:bg-stone-50/70">
                    <td className="px-4 py-3 font-semibold text-stone-900">{w.branch_name}</td>
                    <td className="px-4 py-3 text-stone-700">{w.businesses?.name || "—"}</td>
                    <td className="px-4 py-3 text-stone-600">
                      {[w.city, w.state].filter(Boolean).join(", ") || w.address || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {w.is_active === false ? "Inactive" : "Operational"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : activeTab === "inventory" || activeTab === "reports" ? (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 font-semibold">SKU / Item</th>
                <th className="px-4 py-3 font-semibold">Supplier</th>
                <th className="px-4 py-3 font-semibold">MOQ</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {(data?.inventoryRecords || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-stone-500">
                    No inventory items recorded yet.
                  </td>
                </tr>
              ) : (
                (data?.inventoryRecords || []).map((p: any) => (
                  <tr key={p.id} className="hover:bg-stone-50/70">
                    <td className="px-4 py-3 font-semibold text-stone-900">{p.title}</td>
                    <td className="px-4 py-3 text-stone-600">{p.businesses?.name || "—"}</td>
                    <td className="px-4 py-3 font-mono">{p.moq || 1} {p.unit || "units"}</td>
                    <td className="px-4 py-3 font-mono font-semibold">
                      {p.indicative_price ? `₹${Number(p.indicative_price).toLocaleString("en-IN")}` : "Quote"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-800">
                        {p.is_active ? "Active Stock" : "Archived"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : activeTab === "qc" ? (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Order #</th>
                <th className="px-4 py-3 font-semibold">Inspection Stage</th>
                <th className="px-4 py-3 font-semibold">Order Value</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {(data?.qualityInspections || []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-stone-500">
                    No orders currently in production or quality inspection stage.
                  </td>
                </tr>
              ) : (
                (data?.qualityInspections || []).map((o: any) => (
                  <tr key={o.id} className="hover:bg-stone-50/70">
                    <td className="px-4 py-3 font-mono font-semibold text-stone-900">
                      {o.order_number || o.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 capitalize font-semibold text-amber-800">
                      {String(o.status || "qc").replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      ₹{Number(o.total_amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-stone-500">
                      {o.updated_at ? new Date(o.updated_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Consignment / Order #</th>
                <th className="px-4 py-3 font-semibold">Movement State</th>
                <th className="px-4 py-3 font-semibold">Value</th>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {(data?.stockMovements || []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-stone-500">
                    No outbound dispatch or stock movement records yet.
                  </td>
                </tr>
              ) : (
                (data?.stockMovements || []).map((o: any) => (
                  <tr key={o.id} className="hover:bg-stone-50/70">
                    <td className="px-4 py-3 font-mono font-semibold text-stone-900">
                      {o.order_number || o.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 capitalize font-semibold text-blue-800">
                      {String(o.status || "dispatched").replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      ₹{Number(o.total_amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-stone-500">
                      {o.updated_at ? new Date(o.updated_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
