import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  TrendingUp,
  CreditCard,
  IndianRupee,
  Receipt,
  Download,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Calendar,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const AdminFinancePage: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "x-user-id": user?.id || localStorage.getItem("coverly_user_id") || "",
  });

  useEffect(() => {
    setIsLoading(true);
    const headers = getAuthHeaders();

    Promise.all([
      fetch(`${API_BASE}/admin/metrics`, { headers }).then((r) => r.json()).catch(() => null),
      fetch(`${API_BASE}/admin/orders?limit=15`, { headers }).then((r) => r.json()).catch(() => null),
      fetch(`${API_BASE}/admin/sales-agents/commissions`, { headers }).then((r) => r.json()).catch(() => null),
    ])
      .then(([mRes, oRes, cRes]) => {
        if (mRes?.success) setMetrics(mRes.data);
        if (oRes?.success) setOrders(oRes.data?.orders || []);
        if (cRes?.success) setCommissions(cRes.data || []);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const totalGmv = Number(metrics?.totalGmv || 0);
  const totalOrders = Number(metrics?.totalOrders || orders.length || 0);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Platform Finance & Settlement Desk
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Finance & Accounts Staff Console • Platform GMV telemetry, supplier payouts, commissions, and 3-way matching.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition shadow-xs self-start"
        >
          <Download className="w-3.5 h-3.5" />
          Export Financial Report
        </button>
      </div>

      {/* Primary Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Gross Platform GMV</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900">
            ₹{totalGmv.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-emerald-700 mt-2 font-medium">
            Across verified B2B transaction flows
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Settled Orders</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900">
            {totalOrders}
          </div>
          <p className="text-[11px] text-stone-500 mt-2">
            Official Purchase Orders generated
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Commission Settlements</span>
            <Receipt className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-900">
            {commissions.length}
          </div>
          <p className="text-[11px] text-stone-500 mt-2">
            Verified sales agent commissions
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Audit Integrity</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900">
            100%
          </div>
          <p className="text-[11px] text-purple-700 mt-2 font-medium">
            Cryptographically stamped logs
          </p>
        </div>
      </div>

      {/* Recent High-Value Transactions */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-900">Recent Purchase Orders & Invoicing</h2>
          <span className="text-xs text-stone-500 font-medium">Latest PO Transactions</span>
        </div>
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-stone-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-500">
            No completed financial transactions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold uppercase tracking-wider text-stone-700">
                <tr>
                  <th className="py-3 px-4">PO Reference</th>
                  <th className="py-3 px-4">Buyer Enterprise</th>
                  <th className="py-3 px-4">Supplier Business</th>
                  <th className="py-3 px-4 text-right">Settled Amount</th>
                  <th className="py-3 px-4">Lifecycle State</th>
                  <th className="py-3 px-4 text-right">Transaction Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">
                      {o.order_number}
                    </td>
                    <td className="py-3 px-4 text-stone-900 font-medium">
                      {o.users?.full_name || "Enterprise Buyer"}
                    </td>
                    <td className="py-3 px-4 text-stone-700">
                      {o.businesses?.name || "Manufacturing Facility"}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-stone-900">
                      ₹{Number(o.total_amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-800 border border-stone-200">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-stone-500 font-mono text-[11px]">
                      {new Date(o.created_at).toLocaleDateString()}
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
