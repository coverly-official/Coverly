import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  FileText,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Building2,
  Calendar,
  IndianRupee,
  RefreshCw,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const AdminQuotationsPage: React.FC = () => {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "x-user-id": user?.id || localStorage.getItem("coverly_user_id") || "",
  });

  const loadQuotations = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("limit", "50");

      const res = await fetch(`${API_BASE}/admin/quotations?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setQuotations(data.data.items || []);
        setTotalCount(data.data.total || 0);
      }
    } catch (err) {
      console.error("Failed to load quotations", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, [statusFilter]);

  const filteredQuotes = quotations.filter((q) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      q.quotation_number?.toLowerCase().includes(term) ||
      q.rfqs?.rfq_number?.toLowerCase().includes(term) ||
      q.rfqs?.title?.toLowerCase().includes(term) ||
      q.businesses?.name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Supplier Quotations & Bids
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Audit B2B vendor quotations, unit price tenders, validity windows, and accepted contracts.
          </p>
        </div>
        <button
          onClick={loadQuotations}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-200 text-stone-700 text-xs font-semibold rounded-lg hover:bg-stone-50 transition shadow-2xs self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Quotes
        </button>
      </div>

      {/* KPI Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
            Total Quotations
          </span>
          <p className="text-2xl font-extrabold text-stone-900 mt-1">{totalCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
            Pending / Under Review
          </span>
          <p className="text-2xl font-extrabold text-amber-900 mt-1">
            {quotations.filter((q) => q.status === "pending").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            Accepted / Contracted
          </span>
          <p className="text-2xl font-extrabold text-emerald-900 mt-1">
            {quotations.filter((q) => q.status === "accepted").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-red-700 uppercase tracking-wider">
            Rejected / Expired
          </span>
          <p className="text-2xl font-extrabold text-red-900 mt-1">
            {quotations.filter((q) => ["rejected", "expired"].includes(q.status)).length}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by quote number, RFQ title, or supplier enterprise..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-800"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-stone-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-stone-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="text-center py-16 text-xs text-stone-500">
            <FileText className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            No supplier quotations found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold uppercase tracking-wider text-stone-700">
                <tr>
                  <th className="py-3.5 px-4">Quote Number</th>
                  <th className="py-3.5 px-4">RFQ Title</th>
                  <th className="py-3.5 px-4">Supplier Business</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4">Lead Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Validity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                      {q.quotation_number || `QT-${q.id.substring(0, 8)}`}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-stone-900 truncate max-w-xs">
                        {q.rfqs?.title || "Direct Sourcing RFQ"}
                      </div>
                      <div className="text-[11px] font-mono text-stone-400">
                        {q.rfqs?.rfq_number || "Direct"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-stone-400" />
                        {q.businesses?.name || "Manufacturing Facility"}
                      </div>
                      <div className="text-[11px] text-stone-400">{q.businesses?.city}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-stone-900">
                      ₹{Number(q.total_amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4">
                      {q.lead_time_days ? `${q.lead_time_days} days` : "Immediate"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          q.status === "accepted"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : q.status === "rejected"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-stone-500 font-mono text-[11px]">
                      {q.valid_until ? new Date(q.valid_until).toLocaleDateString() : "30 Days"}
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
