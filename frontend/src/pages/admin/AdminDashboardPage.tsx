import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  Building2,
  Store,
  ShoppingBag,
  Factory,
  Truck,
  Briefcase,
  CheckCircle,
  Package,
  FileText,
  MessageSquare,
  PackageCheck,
  Navigation,
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowRight,
  BarChart3,
  ShieldCheck,
  ListChecks,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const SUMMARY_CACHE_KEY = "coverly_admin_dash_summary_v1";
const ACTIVITY_CACHE_KEY = "coverly_admin_dash_activity_v1";

function readSessionCache(key: string) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(() => readSessionCache(SUMMARY_CACHE_KEY));
  const [activity, setActivity] = useState<any>(() => readSessionCache(ACTIVITY_CACHE_KEY));
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(() => !readSessionCache(SUMMARY_CACHE_KEY));
  const [isActivityLoading, setIsActivityLoading] = useState<boolean>(() => !readSessionCache(ACTIVITY_CACHE_KEY));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isLoading = isSummaryLoading || isActivityLoading;
  const metrics = { ...(summary || {}), ...(activity || {}) };

  const loadDashboard = (forceRefresh = false) => {
    setErrorMsg(null);
    if (forceRefresh || !summary) setIsSummaryLoading(true);
    if (forceRefresh || !activity) setIsActivityLoading(true);

    const userId = user?.id || localStorage.getItem("coverly_user_id") || "";
    const token = localStorage.getItem("auth_token") || "";
    const authHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "x-user-id": userId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const qs = forceRefresh ? "?refresh=1" : "";

    // Stream 1: Ultra-Fast KPI Summary, Charts & Pending Actions
    fetch(`${API_BASE}/admin/metrics/summary${qs}`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setSummary(data.data);
          try {
            sessionStorage.setItem(SUMMARY_CACHE_KEY, JSON.stringify(data.data));
          } catch {}
        } else {
          setErrorMsg(data.error || "Unable to load live platform metrics.");
        }
      })
      .catch((err) => {
        setErrorMsg(err.message || "Failed to connect to Admin API.");
      })
      .finally(() => setIsSummaryLoading(false));

    // Stream 2: Independent Verification Queue & Recent Admin Activities
    fetch(`${API_BASE}/admin/metrics/activity${qs}`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setActivity(data.data);
          try {
            sessionStorage.setItem(ACTIVITY_CACHE_KEY, JSON.stringify(data.data));
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setIsActivityLoading(false));
  };

  useEffect(() => {
    loadDashboard(false);
  }, [user?.id]);

  const kpiCards = [
    { label: "Total Users", value: metrics?.totalUsers ?? 0, href: "/admin/users", icon: Users, accent: "text-blue-600" },
    { label: "Total Businesses", value: metrics?.totalBusinesses ?? 0, href: "/admin/businesses", icon: Building2, accent: "text-stone-800" },
    { label: "Total Buyers", value: metrics?.totalBuyers ?? metrics?.activeBuyers ?? 0, href: "/admin/buyers", icon: Store, accent: "text-emerald-700" },
    { label: "Total Retailers", value: metrics?.totalRetailers ?? metrics?.activeRetailers ?? 0, href: "/admin/retailers", icon: ShoppingBag, accent: "text-teal-700" },
    { label: "Total Manufacturers", value: metrics?.totalManufacturers ?? 0, href: "/admin/manufacturers", icon: Factory, accent: "text-indigo-700" },
    { label: "Total Wholesalers", value: metrics?.totalWholesalers ?? 0, href: "/admin/wholesalers", icon: Building2, accent: "text-violet-700" },
    { label: "Total Distributors", value: metrics?.totalDistributors ?? 0, href: "/admin/distributors", icon: Truck, accent: "text-amber-700" },
    { label: "Service Providers", value: metrics?.totalServiceProviders ?? 0, href: "/admin/services", icon: Briefcase, accent: "text-purple-700" },
    { label: "Logistics Partners", value: metrics?.totalLogisticsPartners ?? 0, href: "/admin/logistics", icon: Navigation, accent: "text-sky-700" },
    { label: "Total Transporters", value: metrics?.totalTransporters ?? 0, href: "/admin/transporters", icon: Truck, accent: "text-cyan-700" },
    { label: "Pending Verifications", value: metrics?.pendingVerifications ?? 0, href: "/admin/verifications", icon: CheckCircle, accent: "text-amber-600" },
    { label: "Published Products", value: metrics?.publishedProducts ?? metrics?.activeProducts ?? 0, href: "/admin/products", icon: Package, accent: "text-emerald-600" },
    { label: "Active RFQs", value: metrics?.activeRfqs ?? 0, href: "/admin/rfqs", icon: FileText, accent: "text-blue-700" },
    { label: "Pending Quotations", value: metrics?.pendingQuotations ?? 0, href: "/admin/quotations", icon: MessageSquare, accent: "text-orange-600" },
    { label: "Active Orders", value: metrics?.activeOrders ?? 0, href: "/admin/orders", icon: PackageCheck, accent: "text-emerald-800" },
    { label: "Active Shipments", value: metrics?.activeShipments ?? 0, href: "/admin/shipments", icon: Truck, accent: "text-indigo-600" },
    { label: "Open Complaints", value: metrics?.openComplaints ?? metrics?.openTickets ?? 0, href: "/admin/support", icon: AlertTriangle, accent: "text-red-600" },
  ];

  const businessGrowth: { month: string; count: number }[] = metrics?.businessGrowth || [];
  const userRegistrations: { month: string; count: number }[] = metrics?.userRegistrations || [];
  const ordersOverview: Record<string, number> = metrics?.ordersOverview || {};
  const rfqActivity: Record<string, number> = metrics?.rfqActivity || {};
  const verificationQueue: any[] = metrics?.verificationQueue || [];
  const recentActivities: any[] = metrics?.recentActivities || [];

  const maxBizGrowth = Math.max(1, ...businessGrowth.map((b) => b.count));
  const maxUserReg = Math.max(1, ...userRegistrations.map((u) => u.count));

  const pendingActions = [
    {
      label: "Pending Business & KYC Verifications",
      count: metrics?.pendingVerifications ?? 0,
      href: "/admin/verifications",
      tone: "text-amber-800 bg-amber-50 border-amber-200",
    },
    {
      label: "Pending Product Moderation Approvals",
      count: metrics?.pendingProducts ?? 0,
      href: "/admin/products?status=pending",
      tone: "text-blue-800 bg-blue-50 border-blue-200",
    },
    {
      label: "Pending Quotations Awaiting Review",
      count: metrics?.pendingQuotations ?? 0,
      href: "/admin/quotations",
      tone: "text-indigo-800 bg-indigo-50 border-indigo-200",
    },
    {
      label: "Open Support Tickets & Complaints",
      count: metrics?.openComplaints ?? 0,
      href: "/admin/support",
      tone: "text-red-800 bg-red-50 border-red-200",
    },
    {
      label: "Pending Distributor Product Offers",
      count: metrics?.pendingDistributorOffers ?? 0,
      href: "/admin/distributors?tab=dealers",
      tone: "text-stone-800 bg-stone-100 border-stone-200",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Admin Control Center Dashboard
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Real-time InsForge PostgreSQL telemetry across all COVERLY business ecosystems and platform operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadDashboard(true)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-lg transition shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Live Metrics
          </button>
          <Link
            to="/admin/analytics"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg transition shadow-xs"
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
            Reports & Analytics
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
          {errorMsg}
        </div>
      )}

      {/* All 17 Live Database Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.href}
              className="bg-white border border-stone-200 hover:border-stone-400 rounded-xl p-4 shadow-2xs transition flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 leading-tight">
                  {card.label}
                </span>
                <Icon className={`w-4 h-4 shrink-0 ${card.accent}`} />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-stone-950 font-mono">
                  {isSummaryLoading && !summary ? (
                    <span className="inline-block h-6 w-12 rounded bg-stone-100 animate-pulse align-middle" />
                  ) : (
                    card.value.toLocaleString("en-IN")
                  )}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-700 transition" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Growth Charts Row (100% Real DB Timestamps) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Business Growth Chart */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-stone-900">Business Growth (Last 6 Months)</h2>
              <p className="text-[11px] text-stone-500">New businesses onboarded per month</p>
            </div>
            <Link to="/admin/businesses" className="text-xs font-semibold text-amber-800 hover:underline">
              Directory &rarr;
            </Link>
          </div>
          {businessGrowth.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-xs text-stone-400">
              No business registration data yet.
            </div>
          ) : (
            <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2">
              {businessGrowth.map((b) => {
                const heightPct = Math.max(8, Math.round((b.count / maxBizGrowth) * 100));
                return (
                  <div key={b.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[11px] font-bold font-mono text-stone-800">{b.count}</span>
                    <div
                      className="w-full max-w-[44px] bg-stone-900 rounded-t-md transition-all"
                      style={{ height: `${heightPct}%` }}
                      title={`${b.month}: ${b.count} businesses`}
                    />
                    <span className="text-[10px] font-medium text-stone-500">{b.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* User Registration Chart */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-stone-900">User Registrations (Last 6 Months)</h2>
              <p className="text-[11px] text-stone-500">New user accounts created per month</p>
            </div>
            <Link to="/admin/users" className="text-xs font-semibold text-amber-800 hover:underline">
              All Users &rarr;
            </Link>
          </div>
          {userRegistrations.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-xs text-stone-400">
              No user registration data yet.
            </div>
          ) : (
            <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2">
              {userRegistrations.map((u) => {
                const heightPct = Math.max(8, Math.round((u.count / maxUserReg) * 100));
                return (
                  <div key={u.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[11px] font-bold font-mono text-stone-800">{u.count}</span>
                    <div
                      className="w-full max-w-[44px] bg-amber-600 rounded-t-md transition-all"
                      style={{ height: `${heightPct}%` }}
                      title={`${u.month}: ${u.count} users`}
                    />
                    <span className="text-[10px] font-medium text-stone-500">{u.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Orders Overview, RFQ Activity & Pending Action List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Orders Overview */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-stone-900">Orders Overview</h2>
            <Link to="/admin/orders" className="text-xs font-semibold text-amber-800 hover:underline">
              Manage &rarr;
            </Link>
          </div>
          <div className="text-xs text-stone-500 mb-3">
            Total GMV:{" "}
            <span className="font-mono font-bold text-stone-950">
              ₹{Number(metrics?.totalGmv || 0).toLocaleString("en-IN")}
            </span>{" "}
            ({metrics?.totalOrders ?? 0} total orders)
          </div>
          <div className="space-y-2">
            {Object.keys(ordersOverview).length === 0 ? (
              <div className="text-xs text-stone-400 py-6 text-center">No orders recorded yet.</div>
            ) : (
              Object.entries(ordersOverview).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-xs py-1 border-b border-stone-100 last:border-0">
                  <span className="capitalize text-stone-700 font-medium">{status.replace(/_/g, " ")}</span>
                  <span className="font-mono font-bold text-stone-950 px-2 py-0.5 rounded bg-stone-100">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RFQ Activity */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-stone-900">RFQ Activity</h2>
            <Link to="/admin/rfqs" className="text-xs font-semibold text-amber-800 hover:underline">
              All RFQs &rarr;
            </Link>
          </div>
          <div className="text-xs text-stone-500 mb-3">
            Total Enquiries:{" "}
            <span className="font-mono font-bold text-stone-950">{metrics?.totalEnquiries ?? 0}</span>{" "}
            ({metrics?.totalRfqs ?? 0} RFQs • {metrics?.quotationsSubmitted ?? 0} quotes)
          </div>
          <div className="space-y-2">
            {Object.keys(rfqActivity).length === 0 ? (
              <div className="text-xs text-stone-400 py-6 text-center">No RFQs submitted yet.</div>
            ) : (
              Object.entries(rfqActivity).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-xs py-1 border-b border-stone-100 last:border-0">
                  <span className="capitalize text-stone-700 font-medium">{status.replace(/_/g, " ")}</span>
                  <span className="font-mono font-bold text-stone-950 px-2 py-0.5 rounded bg-stone-100">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Action List */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-stone-900">Pending Action List</h2>
          </div>
          <div className="space-y-2">
            {pendingActions.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="flex items-center justify-between p-2.5 rounded-lg border border-stone-200 hover:bg-stone-50 transition text-xs"
              >
                <span className="font-medium text-stone-800 pr-2">{item.label}</span>
                <span className={`font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${item.tone}`}>
                  {item.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Verification Queue & Recent Admin Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Verification Queue */}
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Live Verification Queue
            </h2>
            <Link to="/admin/verifications" className="text-xs font-semibold text-amber-800 hover:underline">
              Review All &rarr;
            </Link>
          </div>
          <div className="divide-y divide-stone-100">
            {isActivityLoading && !activity ? (
              <div className="p-5 space-y-2.5">
                <div className="h-10 rounded-lg bg-stone-100 animate-pulse" />
                <div className="h-10 rounded-lg bg-stone-100 animate-pulse" />
                <div className="h-10 rounded-lg bg-stone-100 animate-pulse" />
              </div>
            ) : verificationQueue.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500">
                No pending business verifications in queue.
              </div>
            ) : (
              verificationQueue.map((item) => (
                <div key={item.id} className="px-5 py-3 flex items-center justify-between text-xs hover:bg-stone-50">
                  <div>
                    <div className="font-bold text-stone-900">
                      {item.businesses?.name || item.business_id}
                    </div>
                    <div className="text-[11px] text-stone-500 capitalize">
                      {String(item.businesses?.business_type || "business").replace(/_/g, " ")} •{" "}
                      {String(item.document_type || "KYC Document").replace(/_/g, " ")}
                    </div>
                  </div>
                  <Link
                    to="/admin/verifications"
                    className="px-2.5 py-1 rounded-md bg-stone-900 text-white text-[11px] font-semibold hover:bg-stone-800"
                  >
                    Review
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Admin Activities */}
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-stone-700" />
              Recent Admin Activities
            </h2>
            <Link to="/admin/audit-logs" className="text-xs font-semibold text-amber-800 hover:underline">
              Full Audit Trail &rarr;
            </Link>
          </div>
          <div className="divide-y divide-stone-100">
            {isActivityLoading && !activity ? (
              <div className="p-5 space-y-2.5">
                <div className="h-10 rounded-lg bg-stone-100 animate-pulse" />
                <div className="h-10 rounded-lg bg-stone-100 animate-pulse" />
                <div className="h-10 rounded-lg bg-stone-100 animate-pulse" />
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500">
                No administrative audit events recorded yet.
              </div>
            ) : (
              recentActivities.map((act) => (
                <div key={act.id} className="px-5 py-3 flex items-center justify-between text-xs hover:bg-stone-50">
                  <div className="min-w-0 pr-3">
                    <div className="font-semibold text-stone-900 truncate">
                      {String(act.action || "ADMIN_ACTION").replace(/_/g, " ")}
                    </div>
                    <div className="text-[11px] text-stone-500 truncate">
                      {act.users?.full_name || act.users?.email || "Admin"} • {act.target_type || "platform"}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400 shrink-0">
                    {act.created_at ? new Date(act.created_at).toLocaleString() : ""}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
