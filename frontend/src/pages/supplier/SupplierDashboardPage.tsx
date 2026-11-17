import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Inbox,
  ShoppingBag,
  Package,
  ShieldCheck,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  Building,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const SupplierDashboardPage: React.FC = () => {
  const { user, business } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "x-user-id": user?.id || localStorage.getItem("coverly_user_id") || "",
    };
    if (business?.id) {
      authHeaders["x-business-id"] = business.id;
    }

    fetch(`${API_BASE}/wholesaler/dashboard`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setMetrics(data.data);
        }
      })
      .catch((err) => console.error("Failed to load wholesaler dashboard metrics", err))
      .finally(() => setIsLoading(false));
  }, [user, business]);

  const bizName = metrics?.business?.name || business?.name || "Wholesaler Enterprise";
  const bizType = (metrics?.business?.business_type || business?.business_type || "wholesaler").toUpperCase();
  const verification = metrics?.verificationStatus || business?.verification_level || "unverified";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">{bizName}</h1>
          <p className="text-xs text-stone-500 mt-1">
            {bizType} • {business?.city || "India"}, {business?.state || ""} • Verification:{" "}
            <span className="font-semibold text-stone-700 capitalize">
              {verification.replace("_", " ")}
            </span>
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/supplier/products/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Add Wholesale Product
          </Link>
          <Link
            to="/supplier/verification"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-stone-200 text-stone-800 rounded-lg text-xs font-semibold hover:bg-stone-50 transition"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Verification Center
          </Link>
        </div>
      </div>

      {/* Verification Notice Banner if unverified */}
      {verification === "unverified" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div>
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              Increase buyer trust by completing enterprise verification
            </div>
            <div className="text-[11px] text-amber-700 mt-0.5">
              Submit your GSTIN or factory documents to earn the "Verified Supplier" badge and auto-approved catalog listings.
            </div>
          </div>
          <Link
            to="/supplier/verification"
            className="px-3 py-1.5 bg-amber-800 text-white rounded-lg font-semibold text-[11px] self-start sm:self-auto hover:bg-amber-900 transition"
          >
            Submit Documents
          </Link>
        </div>
      )}

      {/* 4-KPI Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Catalog Products */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Catalog Products</span>
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold text-stone-900">
              {metrics?.totalProducts || 0}
            </div>
          </div>
          <div className="text-[11px] text-stone-500 mt-2 flex items-center justify-between pt-2 border-t border-stone-100">
            <span className="text-emerald-700 font-medium">
              {metrics?.activeProducts || 0} active
            </span>
            <span className="text-stone-400">
              {metrics?.pendingApprovalProducts || 0} pending review
            </span>
          </div>
        </div>

        {/* Card 2: Enquiries & Concierge Leads */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Guest Enquiries</span>
              <MessageSquare className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-stone-900">
              {metrics?.enquiriesReceived || 0}
            </div>
          </div>
          <div className="text-[11px] text-stone-500 mt-2 flex items-center justify-between pt-2 border-t border-stone-100">
            <span className="text-amber-700 font-medium">
              {metrics?.unansweredEnquiries || 0} unanswered
            </span>
            <span className="text-stone-400">Direct product leads</span>
          </div>
        </div>

        {/* Card 3: Quotations Submitted */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Quotations Submitted</span>
              <Send className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-stone-900">
              {metrics?.quotationsSubmitted || 0}
            </div>
          </div>
          <div className="text-[11px] text-stone-500 mt-2 pt-2 border-t border-stone-100">
            Active landed-cost proposals
          </div>
        </div>

        {/* Card 4: Active Orders */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Orders</span>
              <ShoppingBag className="w-4 h-4 text-stone-700" />
            </div>
            <div className="text-2xl font-extrabold text-stone-900">
              {metrics?.activeOrders || 0}
            </div>
          </div>
          <div className="text-[11px] text-stone-500 mt-2 flex items-center justify-between pt-2 border-t border-stone-100">
            <span className="text-emerald-700 font-medium">
              {metrics?.completedOrders || 0} fulfilled
            </span>
            <span className="text-stone-400">Production / Shipped</span>
          </div>
        </div>
      </div>

      {/* Recent Enquiries Received */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900">Recent Guest Sourcing Enquiries</h3>
            <p className="text-xs text-stone-500">
              Leads received directly from marketplace visitors viewing your products
            </p>
          </div>
          <Link
            to="/supplier/rfqs"
            className="text-xs font-semibold text-stone-700 hover:text-stone-900 flex items-center gap-1"
          >
            View All Enquiries <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3 py-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-stone-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !metrics?.recentEnquiries || metrics.recentEnquiries.length === 0 ? (
          <div className="text-center py-8 text-xs text-stone-500">
            No customer enquiries received yet. Make sure your products are published to start receiving leads.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {metrics.recentEnquiries.map((enq: any) => (
              <div key={enq.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-stone-900">{enq.name}</span>
                    <span className="text-[11px] text-stone-500">• {enq.business || "Buyer"}</span>
                    <span className="text-[10px] font-mono text-stone-400">({enq.phone})</span>
                  </div>
                  <div className="text-xs text-stone-700 line-clamp-1 mt-0.5">
                    {enq.products?.title ? (
                      <span className="font-medium text-stone-900">[{enq.products.title}] </span>
                    ) : null}
                    {enq.requirement}
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">
                    Received: {new Date(enq.created_at).toLocaleString("en-IN")}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                      enq.status === "contacted"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {enq.status}
                  </span>
                  <Link
                    to="/supplier/rfqs"
                    className="px-3 py-1.5 bg-stone-900 text-white rounded text-xs font-semibold hover:bg-stone-800 transition"
                  >
                    Respond
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
