import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { ServiceRequest } from "@/types";
import { Inbox, ArrowRight } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const ProviderInquiriesPage: React.FC = () => {
  const { business } = useAuth();
  const [inquiries, setInquiries] = useState<ServiceRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!business) return;
    setIsLoading(true);

    const url =
      statusFilter === "all"
        ? `${API_BASE}/business-services/requests?provider_business_id=${business.id}`
        : `${API_BASE}/business-services/requests?provider_business_id=${business.id}&status=${statusFilter}`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setInquiries(data.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [business, statusFilter]);

  const tabs = [
    { id: "all", label: "All Inquiries" },
    { id: "submitted", label: "New (Unviewed)" },
    { id: "quoted", label: "Quoted" },
    { id: "accepted", label: "Accepted" },
    { id: "completed", label: "Completed" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Incoming Client Inquiries</h1>
        <p className="text-xs text-stone-500 mt-1">
          Review business requirements, provide formal fee proposals, and manage project lifecycles
        </p>
      </div>

      <div className="flex gap-2 border-b border-stone-200 pb-2 text-xs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              statusFilter === tab.id
                ? "bg-stone-900 text-white font-semibold"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-stone-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-16">
            <Inbox className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-stone-800">No inquiries in this tab</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
              New client inquiries will appear here as soon as submitted.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold uppercase tracking-wider text-stone-700">
              <tr>
                <th className="py-3.5 px-4">Inquiry Title & ID</th>
                <th className="py-3.5 px-4">Service</th>
                <th className="py-3.5 px-4">Target Timeline</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Received Date</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {inquiries.map((inq) => (
                <tr key={inq.id} className="hover:bg-stone-50/70 transition">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-stone-900">{inq.title}</div>
                    <div className="text-[10px] text-stone-400 font-mono">{inq.request_number}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-stone-800">
                    {inq.business_services?.title || "Custom Service"}
                  </td>
                  <td className="py-3 px-4 text-stone-600">
                    {inq.target_timeline || "Flexible"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                        inq.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : inq.status === "quoted"
                          ? "bg-purple-100 text-purple-800"
                          : inq.status === "accepted"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {inq.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-stone-500">
                    {new Date(inq.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/provider/inquiries/${inq.id}/quote`}
                      className="px-3 py-1 bg-stone-900 text-white rounded text-xs font-semibold hover:bg-stone-800 transition inline-flex items-center gap-1"
                    >
                      Review & Quote <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
