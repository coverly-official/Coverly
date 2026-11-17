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
  Layers,
  MessageSquare,
  ShieldCheck,
  Package,
  UserCog,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          Executive Platform Governance
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Live marketplace liquidity, transaction volume, supplier verification queues, and audit telemetry.
        </p>
      </div>

      {/* Primary KPI Grid (6 metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Metric 1: Products */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Wholesale Products</span>
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold text-stone-900">
              {metrics?.totalProducts || 0}
            </div>
          </div>
          <div className="text-[11px] text-stone-500 mt-2 flex items-center justify-between pt-2 border-t border-stone-100">
            <span className="text-emerald-700 font-medium">
              {metrics?.activeProducts || 0} active listings
            </span>
            <span className="text-stone-400">
              {metrics?.archivedProducts || 0} archived
            </span>
          </div>
        </div>

        {/* Metric 2: Registered Businesses */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Registered Enterprises</span>
              <Building2 className="w-4 h-4 text-stone-700" />
            </div>
            <div className="text-2xl font-extrabold text-stone-900">
              {metrics?.totalBusinesses || 0}
            </div>
          </div>
          <div className="text-[11px] text-stone-500 mt-2 flex items-center justify-between pt-2 border-t border-stone-100">
            <span>{metrics?.totalSuppliers || 0} suppliers</span>
            <span className="text-emerald-700 font-medium">
              {metrics?.verifiedSuppliers || 0} verified
            </span>
          </div>
        </div>

        {/* Metric 3: Pending Verifications */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Compliance</span>
              <ShieldCheck className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-amber-900">
              {metrics?.pendingVerifications || 0}
            </div>
          </div>
          <div className="text-[11px] text-stone-500 mt-2 pt-2 border-t border-stone-100">
            Awaiting GSTIN, PAN, and license verification
          </div>
        </div>

        {/* Metric 4: Sourcing RFQs & Enquiries */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Procurement Enquiries</span>
              <MessageSquare className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-stone-900">
              {metrics?.totalEnquiries || 0}
            </div>
          </div>
          <div className="text-[11px] text-stone-500 mt-2 flex items-center justify-between pt-2 border-t border-stone-100">
            <span>{metrics?.totalRfqs || 0} formal RFQs</span>
            <span>{metrics?.totalConciergeLeads || 0} guest leads</span>
          </div>
        </div>

        {/* Metric 5: Active Taxonomy Categories */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Industry Verticals</span>
              <FolderTree className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-extrabold text-stone-900">
              {metrics?.activeCategories || 0}
            </div>
          </div>
          <div className="text-[11px] text-stone-500 mt-2 pt-2 border-t border-stone-100">
            Active wholesale categories configured
          </div>
        </div>

        {/* Metric 6: Gross Platform GMV */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Gross Platform GMV</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-stone-900">
              ₹{Number(metrics?.totalGmv || 0).toLocaleString("en-IN")}
            </div>
          </div>
          <div className="text-[11px] text-stone-500 mt-2 flex items-center justify-between pt-2 border-t border-stone-100">
            <span>{metrics?.totalOrders || 0} confirmed orders</span>
            <span>{metrics?.openTickets || 0} open tickets</span>
          </div>
        </div>
      </div>

      {/* Governance & Control Navigation */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-3">
          Administrative Modules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/products"
            className="bg-white border border-stone-200 hover:border-stone-400 rounded-xl p-4 shadow-xs transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-stone-900 group-hover:text-blue-600 transition">
                Product Catalog
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Moderate items, update indicative prices, manage media and MOQ
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
              <span>{metrics?.totalProducts || 0} items</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          <Link
            to="/admin/categories"
            className="bg-white border border-stone-200 hover:border-stone-400 rounded-xl p-4 shadow-xs transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
                <FolderTree className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-stone-900 group-hover:text-teal-600 transition">
                Taxonomy & Categories
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Maintain industry categories and subcategory taxonomies
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
              <span>{metrics?.activeCategories || 0} verticals</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          <Link
            to="/admin/businesses"
            className="bg-white border border-stone-200 hover:border-stone-400 rounded-xl p-4 shadow-xs transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center mb-3">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-stone-900 group-hover:text-stone-700 transition">
                Business Directory
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Inspect manufacturer profiles, assign verification tiers, audit capabilities
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
              <span>{metrics?.totalBusinesses || 0} enterprises</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          <Link
            to="/admin/rfqs"
            className="bg-white border border-stone-200 hover:border-stone-400 rounded-xl p-4 shadow-xs transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-stone-900 group-hover:text-indigo-600 transition">
                RFQs & Guest Enquiries
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Track enterprise buyer tenders and guest sourcing leads
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
              <span>{metrics?.totalEnquiries || 0} tenders</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          <Link
            to="/admin/verifications"
            className="bg-white border border-stone-200 hover:border-stone-400 rounded-xl p-4 shadow-xs transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
                <CheckCircle className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-stone-900 group-hover:text-amber-600 transition">
                Verification Queue
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Review submitted GSTIN, PAN, and manufacturing factory documents
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
              <span className="text-amber-700">{metrics?.pendingVerifications || 0} pending</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          <Link
            to="/admin/services"
            className="bg-white border border-stone-200 hover:border-stone-400 rounded-xl p-4 shadow-xs transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-3">
                <Briefcase className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-stone-900 group-hover:text-purple-600 transition">
                Business Services
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Manage B2B service listings, provider onboarding, and client service requests
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
              <span>{metrics?.totalBusinessServices || 0} services</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          <Link
            to="/admin/users"
            className="bg-white border border-stone-200 hover:border-stone-400 rounded-xl p-4 shadow-xs transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center mb-3">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-stone-900 group-hover:text-stone-700 transition">
                User Governance
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Manage authentication credentials, role assignments, and account suspensions
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
              <span>{metrics?.totalUsers || 0} accounts</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          <Link
            to="/admin/employees"
            className="bg-white border border-stone-200 hover:border-stone-400 rounded-xl p-4 shadow-xs transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center mb-3">
                <UserCog className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-stone-900 group-hover:text-blue-700 transition">
                Employees & RBAC
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Procurement Managers, Purchasing Executives, Finance Teams & Authority
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
              <span>Role Governance</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          <Link
            to="/admin/audit-logs"
            className="bg-white border border-stone-200 hover:border-stone-400 rounded-xl p-4 shadow-xs transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-700 flex items-center justify-center mb-3">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-stone-900 group-hover:text-red-600 transition">
                Audit Logs
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Immutable security logs tracking all admin moderation and system events
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
              <span>Compliance audit</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
