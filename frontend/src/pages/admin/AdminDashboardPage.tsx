import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  TrendingUp,
  ShoppingBag,
  FileText,
  Building2,
  CheckCircle,
  ShieldAlert,
  ArrowRight,
  FolderTree,
  Briefcase,
  Users,
  HelpCircle,
  MessageSquare,
  ShieldCheck,
  Package,
  UserCog,
  Compass,
  Truck,
  Store,
  Factory,
  Clock,
  RefreshCw,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadMetrics = () => {
    setIsLoading(true);
    const authHeaders = {
      "Content-Type": "application/json",
      "x-user-id": user?.id || localStorage.getItem("coverly_user_id") || "",
    };

    fetch(`${API_BASE}/admin/metrics`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setMetrics(data.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load metrics", err);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadMetrics();
  }, [user]);

  const recentActivities: any[] = metrics?.recentActivities || [];

  return (
    <div className="space-y-8">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Executive Control Center
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Live platform metrics computed directly from InsForge PostgreSQL across all 13 connected B2B portals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadMetrics}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-lg transition shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Live Telemetry
          </button>
          <Link
            to="/admin/portals"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg transition shadow-xs"
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            Workspace & Portal Access
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid (All Live Ecosystem Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Users & Buyers */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Registered Users</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold text-stone-900">
              {metrics?.totalUsers ?? 0}
            </div>
          </div>
          <div className="text-[11px] text-stone-500 mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
            <span>{metrics?.activeBuyers ?? 0} active buyers</span>
            <span>{metrics?.activeRetailers ?? 0} retailers</span>
          </div>
        </div>

        {/* 2. Total Businesses & Suppliers */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Businesses</span>
              <Building2 className="w-4 h-4 text-stone-700" />
            </div>
            <div className="text-2xl font-extrabold text-stone-900">
              {metrics?.totalBusinesses ?? 0}
            </div>
          </div>
          <div className="text-[11px] text-stone-500 mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
            <span>{metrics?.totalSuppliers ?? 0} suppliers</span>
            <span className="text-emerald-700 font-semibold">{metrics?.verifiedSuppliers ?? 0} verified</span>
          </div>
        </div>

        {/* 3. Manufacturers & Wholesalers */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Supply Network</span>
              <Factory className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-stone-900">
              {(metrics?.totalManufacturers ?? 0) + (metrics?.totalWholesalers ?? 0)}
            </div>
          </div>
          <div className="text-[11px] text-stone-500 mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
            <span>{metrics?.totalManufacturers ?? 0} mfg</span>
            <span>{metrics?.totalWholesalers ?? 0} wholesalers</span>
            <span>{metrics?.totalDistributors ?? 0} dist.</span>
          </div>
        </div>

        {/* 4. Service Providers & Transporters */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Services & Fleet</span>
              <Truck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-extrabold text-stone-900">
              {(metrics?.totalServiceProviders ?? 0) + (metrics?.totalTransporters ?? 0)}
            </div>
          </div>
          <div className="text-[11px] text-stone-500 mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
            <span>{metrics?.totalServiceProviders ?? 0} providers</span>
            <span>{metrics?.totalTransporters ?? 0} transporters</span>
          </div>
        </div>

        {/* 5. Active Products */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Active Products</span>
              <Package className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-extrabold text-stone-900">
              {metrics?.activeProducts ?? 0}
            </div>
          </div>
          <div className="text-[11px] text-stone-500 mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
            <span>{metrics?.totalProducts ?? 0} total catalog</span>
            <span className="text-amber-700 font-medium">{metrics?.pendingProducts ?? 0} pending</span>
          </div>
        </div>

        {/* 6. RFQs & Quotations */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">RFQs & Quotations</span>
              <MessageSquare className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-stone-900">
              {metrics?.totalRfqs ?? 0}
            </div>
          </div>
          <div className="text-[11px] text-stone-500 mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
            <span>{metrics?.totalQuotations ?? metrics?.quotationsSubmitted ?? 0} quotations</span>
            <span>{metrics?.totalConciergeLeads ?? 0} guest leads</span>
          </div>
        </div>

        {/* 7. Orders, Shipments & GMV */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Active Orders & GMV</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-stone-900">
              ₹{Number(metrics?.totalGmv || 0).toLocaleString("en-IN")}
            </div>
          </div>
          <div className="text-[11px] text-stone-500 mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
            <span>{metrics?.activeOrders ?? 0} active orders</span>
            <span>{metrics?.activeShipments ?? 0} shipments</span>
          </div>
        </div>

        {/* 8. Compliance & Complaints */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Governance</span>
              <ShieldCheck className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-amber-900">
              {metrics?.pendingVerifications ?? 0}
            </div>
          </div>
          <div className="text-[11px] text-stone-500 mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
            <span>verifications</span>
            <span className="text-red-700 font-semibold">{metrics?.pendingComplaints ?? metrics?.openTickets ?? 0} complaints</span>
          </div>
        </div>
      </div>

      {/* Portal Access Quick Banner */}
      <div className="bg-stone-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border border-stone-800">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
            Centralized Ecosystem Switchboard
          </span>
          <h2 className="text-lg font-bold text-white mt-1">
            Preview & Test All 13 COVERLY User Portals Without Logging Out
          </h2>
          <p className="text-xs text-stone-300 mt-1 max-w-2xl">
            Open the read-only Portal Preview Sandbox, inspect onboarding/login flows, or jump into Buyer, Retailer, Manufacturer, Transporter, and Service Provider workspaces directly.
          </p>
        </div>
        <Link
          to="/admin/portals"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-xl transition shrink-0 shadow-xs"
        >
          <Compass className="w-4 h-4" />
          Open Portal Access Hub
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Main Split: Modules Grid + Recent Platform Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Governance & Control Navigation */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-stone-500">
            Core Platform Operations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/admin/products"
              className="bg-white border border-stone-200 hover:border-stone-400 rounded-xl p-4 shadow-2xs transition group flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-stone-900 group-hover:text-blue-700 transition">
                  Product Catalog Moderation
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Approve wholesale products, verify pricing tiers, and manage MOQ specs
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
                <span>{metrics?.totalProducts ?? 0} products</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </Link>

            <Link
              to="/admin/verifications"
              className="bg-white border border-stone-200 hover:border-stone-400 rounded-xl p-4 shadow-2xs transition group flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-stone-900 group-hover:text-amber-700 transition">
                  Business Verification Queue
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Audit submitted GSTIN, PAN, IEC, and factory manufacturing licenses
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
                <span className="text-amber-700 font-semibold">{metrics?.pendingVerifications ?? 0} pending</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </Link>

            <Link
              to="/admin/orders"
              className="bg-white border border-stone-200 hover:border-stone-400 rounded-xl p-4 shadow-2xs transition group flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-stone-900 group-hover:text-emerald-700 transition">
                  Orders & Fulfillment Desk
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Monitor PO production states, logistics dispatch, and completed deliveries
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
                <span>{metrics?.totalOrders ?? 0} total orders</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </Link>

            <Link
              to="/admin/rfqs"
              className="bg-white border border-stone-200 hover:border-stone-400 rounded-xl p-4 shadow-2xs transition group flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-stone-900 group-hover:text-indigo-700 transition">
                  RFQs & Guest Sourcing Leads
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Oversee enterprise buying tenders, quotations, and concierge enquiries
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
                <span>{metrics?.totalEnquiries ?? 0} total demands</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </Link>

            <Link
              to="/admin/users"
              className="bg-white border border-stone-200 hover:border-stone-400 rounded-xl p-4 shadow-2xs transition group flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center mb-3">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-stone-900 group-hover:text-stone-700 transition">
                  Users & Account Governance
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Manage platform user accounts, status controls, and assigned roles
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
                <span>{metrics?.totalUsers ?? 0} accounts</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </Link>

            <Link
              to="/admin/employees"
              className="bg-white border border-stone-200 hover:border-stone-400 rounded-xl p-4 shadow-2xs transition group flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-800 flex items-center justify-center mb-3">
                  <UserCog className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-stone-900 group-hover:text-purple-700 transition">
                  Employees & RBAC Controls
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Assign admin managers, procurement staff, finance permissions & limits
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
                <span>Granular RBAC</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </Link>
          </div>
        </div>

        {/* Right Column: Live Recent Platform Activity Feed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-stone-500">
              Recent Platform Activity
            </h2>
            <Link to="/admin/audit-logs" className="text-[11px] font-semibold text-blue-700 hover:underline">
              Full Audit Trail &rarr;
            </Link>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl shadow-2xs divide-y divide-stone-100 overflow-hidden">
            {recentActivities.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500">
                <Clock className="w-6 h-6 text-stone-300 mx-auto mb-2" />
                No recent audit events recorded yet.
              </div>
            ) : (
              recentActivities.map((act) => (
                <div key={act.id} className="p-3.5 hover:bg-stone-50/80 transition">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-stone-900 truncate">
                      {act.action}
                    </span>
                    <span className="text-[10px] text-stone-400 shrink-0 font-mono">
                      {new Date(act.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1 flex items-center justify-between">
                    <span className="truncate">
                      By: {act.users?.full_name || "Admin Actor"}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-mono">
                      {act.target_type}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
