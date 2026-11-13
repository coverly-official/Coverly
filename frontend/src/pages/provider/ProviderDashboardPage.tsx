import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { ServiceRequest } from "@/types";
import {
  Inbox,
  FolderKanban,
  Briefcase,
  CheckCircle2,
  PlusCircle,
  ArrowRight,
  Clock,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const ProviderDashboardPage: React.FC = () => {
  const { business } = useAuth();
  const [inquiries, setInquiries] = useState<ServiceRequest[]>([]);
  const [servicesCount, setServicesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!business) {
      setIsLoading(false);
      return;
    }

    Promise.all([
      fetch(`${API_BASE}/business-services/requests?provider_business_id=${business.id}`).then((r) => r.json()),
      fetch(`${API_BASE}/business-services?business_id=${business.id}`).then((r) => r.json()),
    ])
      .then(([reqRes, servRes]) => {
        if (reqRes.success) setInquiries(reqRes.data);
        if (servRes.success) setServicesCount(servRes.data.length);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [business]);

  const pendingInquiries = inquiries.filter((i) => i.status === "submitted" || i.status === "viewed");
  const activeProjects = inquiries.filter((i) => i.status === "in_progress" || i.status === "accepted");
  const completedProjects = inquiries.filter((i) => i.status === "completed");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            {business?.name || "Service Provider Workspace"}
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Professional Practice Dashboard • Manage incoming client inquiries, deliverable quotes, and project milestones
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/provider/services/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Add New Service
          </Link>
          <Link
            to="/services/all"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-stone-200 text-stone-800 rounded-lg text-xs font-semibold hover:bg-stone-50 transition"
          >
            Public Marketplace
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Inquiries</span>
            <Inbox className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{pendingInquiries.length}</div>
          <div className="text-[11px] text-stone-500 mt-1">Awaiting your quotation</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Projects</span>
            <FolderKanban className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{activeProjects.length}</div>
          <div className="text-[11px] text-stone-500 mt-1">In progress & milestone tracking</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Completed Deliveries</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{completedProjects.length}</div>
          <div className="text-[11px] text-stone-500 mt-1">Successfully confirmed by clients</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Published Services</span>
            <Briefcase className="w-4 h-4 text-stone-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{servicesCount}</div>
          <div className="text-[11px] text-stone-500 mt-1">Live in marketplace catalog</div>
        </div>
      </div>

      {/* Recent Inquiries Section */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-stone-900">Recent Customer Inquiries</h3>
          <Link to="/provider/inquiries" className="text-xs font-semibold text-stone-700 hover:text-stone-900 flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-stone-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-8 text-xs text-stone-500">
            No inquiries received yet. Ensure your services and practice profile are published.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {inquiries.slice(0, 5).map((inq) => (
              <div key={inq.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-stone-900">{inq.title}</span>
                    <span className="text-[10px] text-stone-400 font-mono">{inq.request_number}</span>
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    Target Timeline: {inq.target_timeline || "Flexible"} • Received: {new Date(inq.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                      inq.status === "completed"
                        ? "bg-emerald-100 text-emerald-800"
                        : inq.status === "quoted"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {inq.status.replace("_", " ")}
                  </span>
                  <Link
                    to={`/provider/inquiries/${inq.id}/quote`}
                    className="px-3 py-1 bg-stone-900 text-white rounded text-xs font-semibold hover:bg-stone-800 transition"
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
