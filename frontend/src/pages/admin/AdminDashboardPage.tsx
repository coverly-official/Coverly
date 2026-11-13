import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  ShoppingBag,
  FileText,
  Building2,
  CheckCircle,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/admin/metrics`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setMetrics(data.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          Executive Platform Governance
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Live marketplace liquidity, transaction volume, supplier verification queues, and audit telemetry
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Gross Platform GMV</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900">
            ₹{Number(metrics?.totalGmv || 0).toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Delivered & confirmed transactions</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active RFQs</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900">
            {metrics?.totalRfqs || 0}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Dispatched to verified suppliers</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Registered Businesses</span>
            <Building2 className="w-4 h-4 text-stone-600" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900">
            {metrics?.totalBusinesses || 0}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Buyers & verified suppliers</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Verifications</span>
            <CheckCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-900">
            {metrics?.pendingVerifications || 0}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Awaiting compliance audit review</div>
        </div>
      </div>

      {/* Quick Admin Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/admin/verifications"
          className="bg-white border border-stone-200 hover:border-stone-400 rounded-xl p-5 shadow-xs transition flex items-center justify-between"
        >
          <div>
            <h3 className="font-bold text-sm text-stone-900">Verification Review Queue</h3>
            <p className="text-xs text-stone-500 mt-0.5">Audit GSTIN, PAN, and factory licenses</p>
          </div>
          <ArrowRight className="w-4 h-4 text-stone-400" />
        </Link>

        <Link
          to="/admin/users"
          className="bg-white border border-stone-200 hover:border-stone-400 rounded-xl p-5 shadow-xs transition flex items-center justify-between"
        >
          <div>
            <h3 className="font-bold text-sm text-stone-900">User Account Governance</h3>
            <p className="text-xs text-stone-500 mt-0.5">Review accounts & handle suspensions</p>
          </div>
          <ArrowRight className="w-4 h-4 text-stone-400" />
        </Link>

        <Link
          to="/admin/audit-logs"
          className="bg-white border border-stone-200 hover:border-stone-400 rounded-xl p-5 shadow-xs transition flex items-center justify-between"
        >
          <div>
            <h3 className="font-bold text-sm text-stone-900">Immutable Audit Logs</h3>
            <p className="text-xs text-stone-500 mt-0.5">Track administrative and security events</p>
          </div>
          <ArrowRight className="w-4 h-4 text-stone-400" />
        </Link>
      </div>
    </div>
  );
};
