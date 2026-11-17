import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  Package,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Globe,
  Truck,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const AdminAnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [reports, setReports] = useState<any>(null);
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
      fetch(`${API_BASE}/admin/reports`, { headers }).then((r) => r.json()).catch(() => null),
    ])
      .then(([mRes, rRes]) => {
        if (mRes?.success) setMetrics(mRes.data);
        if (rRes?.success) setReports(rRes.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          Ecosystem Analytics & Telemetry
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Real-time analytics across all 12 B2B categories, active suppliers, RFQ conversions, and fulfillment speed.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
            Total Catalog Products
          </span>
          <p className="text-3xl font-extrabold text-stone-900 mt-2">
            {metrics?.totalProducts || 0}
          </p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">
            {metrics?.activeProducts || 0} active in marketplace
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
            Registered Enterprises
          </span>
          <p className="text-3xl font-extrabold text-stone-900 mt-2">
            {metrics?.totalBusinesses || 0}
          </p>
          <p className="text-[11px] text-blue-700 font-medium mt-1">
            {metrics?.verifiedSuppliers || 0} verified suppliers
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
            Procurement Demands
          </span>
          <p className="text-3xl font-extrabold text-stone-900 mt-2">
            {metrics?.totalEnquiries || 0}
          </p>
          <p className="text-[11px] text-purple-700 font-medium mt-1">
            {metrics?.totalRfqs || 0} formal RFQs submitted
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
            Active Verticals
          </span>
          <p className="text-3xl font-extrabold text-stone-900 mt-2">
            {metrics?.activeCategories || 12}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">
            Taxonomy verticals configured
          </p>
        </div>
      </div>

      {/* Conversion Funnel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-stone-900">Procurement Liquidity Funnel</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-stone-700">1. Guest Sourcing Requirements</span>
                <span className="font-bold text-stone-900">{metrics?.totalConciergeLeads || 0}</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full w-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-stone-700">2. Formal Enterprise RFQs</span>
                <span className="font-bold text-stone-900">{metrics?.totalRfqs || 0}</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full w-4/5" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-stone-700">3. Issued Quotations</span>
                <span className="font-bold text-stone-900">{reports?.totalQuotations || 0}</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-2">
                <div className="bg-amber-600 h-2 rounded-full w-3/5" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-stone-700">4. Confirmed Purchase Orders</span>
                <span className="font-bold text-stone-900">{metrics?.totalOrders || 0}</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-2">
                <div className="bg-emerald-600 h-2 rounded-full w-2/5" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-stone-900">Platform Verification Distribution</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
              <span className="text-xs font-semibold text-emerald-950">GSTIN / Tax Verified</span>
              <span className="text-xs font-bold text-emerald-800">{metrics?.verifiedSuppliers || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
              <span className="text-xs font-semibold text-amber-950">Pending Verification Queue</span>
              <span className="text-xs font-bold text-amber-800">{metrics?.pendingVerifications || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-200">
              <span className="text-xs font-semibold text-stone-800">Support Dispute Tickets</span>
              <span className="text-xs font-bold text-stone-800">{metrics?.openTickets || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-100">
              <span className="text-xs font-semibold text-purple-950">Professional Business Services</span>
              <span className="text-xs font-bold text-purple-800">{metrics?.totalBusinessServices || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
