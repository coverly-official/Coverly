import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { RFQ } from "@/types";
import { PlusCircle, FileText, ArrowRight, Layers } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const BuyerRfqsPage: React.FC = () => {
  const { user } = useAuth();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);

    const url =
      statusFilter === "all"
        ? `${API_BASE}/rfqs?buyer_id=${user.id}`
        : `${API_BASE}/rfqs?buyer_id=${user.id}&status=${statusFilter}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setRfqs(data.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [user, statusFilter]);

  const tabs = [
    { id: "all", label: "All RFQs" },
    { id: "submitted", label: "Submitted" },
    { id: "quotes_received", label: "Quotes Ready" },
    { id: "accepted", label: "Accepted" },
    { id: "closed", label: "Closed" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">My Sourcing RFQs</h1>
          <p className="text-xs text-stone-500 mt-1">
            Track inquiries, compare received landed costs, and finalize wholesale procurement
          </p>
        </div>

        <Link
          to="/buyer/rfq/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition shadow-xs self-start"
        >
          <PlusCircle className="w-4 h-4" />
          Create New RFQ
        </Link>
      </div>

      {/* Filter Tabs */}
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

      {/* RFQ List Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-stone-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : rfqs.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-stone-800">No RFQs found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
              Post an RFQ to invite quotations with verified landed costs.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold uppercase tracking-wider text-stone-700">
              <tr>
                <th className="py-3.5 px-4">RFQ Title & Number</th>
                <th className="py-3.5 px-4">Destination</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rfqs.map((rfq) => (
                <tr key={rfq.id} className="hover:bg-stone-50/70 transition">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-stone-900">{rfq.title}</div>
                    <div className="text-[10px] text-stone-400 font-mono">{rfq.rfq_number}</div>
                  </td>
                  <td className="py-3 px-4 text-stone-700">{rfq.delivery_city}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                        rfq.status === "quotes_received"
                          ? "bg-emerald-100 text-emerald-800"
                          : rfq.status === "accepted"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-stone-100 text-stone-700"
                      }`}
                    >
                      {rfq.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-stone-500">
                    {new Date(rfq.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/buyer/rfqs/${rfq.id}`}
                      className="font-semibold text-stone-900 hover:underline inline-flex items-center gap-1"
                    >
                      Manage <ArrowRight className="w-3.5 h-3.5" />
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
