import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  FileText,
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const AdminRfqsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"rfqs" | "enquiries">("rfqs");

  // RFQ State
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [rfqStatus, setRfqStatus] = useState("");
  const [rfqSearch, setRfqSearch] = useState("");
  const [rfqPage, setRfqPage] = useState(1);
  const [rfqTotalPages, setRfqTotalPages] = useState(1);
  const [rfqTotalCount, setRfqTotalCount] = useState(0);
  const [selectedRfq, setSelectedRfq] = useState<any | null>(null);

  // Enquiry / Concierge Lead State
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [enquiryStatus, setEnquiryStatus] = useState("");
  const [enquirySearch, setEnquirySearch] = useState("");
  const [enquiryPage, setEnquiryPage] = useState(1);
  const [enquiryTotalPages, setEnquiryTotalPages] = useState(1);
  const [enquiryTotalCount, setEnquiryTotalCount] = useState(0);
  const [selectedEnquiry, setSelectedEnquiry] = useState<any | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "x-user-id": user?.id || localStorage.getItem("coverly_user_id") || "",
  });

  // Fetch RFQs
  const fetchRfqs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", rfqPage.toString());
      params.set("limit", "15");
      if (rfqSearch) params.set("search", rfqSearch);
      if (rfqStatus) params.set("status", rfqStatus);

      const res = await fetch(`${API_BASE}/admin/rfqs?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setRfqs(data.data.rfqs || []);
        setRfqTotalPages(data.data.totalPages || 1);
        setRfqTotalCount(data.data.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch admin RFQs", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Enquiries
  const fetchEnquiries = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", enquiryPage.toString());
      params.set("limit", "15");
      if (enquirySearch) params.set("search", enquirySearch);
      if (enquiryStatus) params.set("status", enquiryStatus);

      const res = await fetch(`${API_BASE}/admin/enquiries?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setEnquiries(data.data.enquiries || []);
        setEnquiryTotalPages(data.data.totalPages || 1);
        setEnquiryTotalCount(data.data.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch admin enquiries", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "rfqs") {
      fetchRfqs();
    } else {
      fetchEnquiries();
    }
  }, [activeTab, rfqPage, rfqSearch, rfqStatus, enquiryPage, enquirySearch, enquiryStatus]);

  // Open RFQ Detail
  const handleOpenRfqDetail = async (rfqId: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/rfqs/${rfqId}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSelectedRfq(data.data);
      }
    } catch (err) {
      console.error("Failed to load RFQ detail", err);
    }
  };

  // Update RFQ Status
  const handleUpdateRfqStatus = async (rfqId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/rfqs/${rfqId}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchRfqs();
        if (selectedRfq && selectedRfq.id === rfqId) {
          setSelectedRfq({ ...selectedRfq, status: newStatus });
        }
      } else {
        alert(data.error || "Failed to update RFQ status.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update status.");
    }
  };

  // Update Enquiry Status
  const handleUpdateEnquiryStatus = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/enquiries/${leadId}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchEnquiries();
        if (selectedEnquiry && selectedEnquiry.id === leadId) {
          setSelectedEnquiry({ ...selectedEnquiry, status: newStatus });
        }
      } else {
        alert(data.error || "Failed to update enquiry status.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update enquiry status.");
    }
  };

  const getRfqStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            Open for Quotation
          </span>
        );
      case "under_review":
      case "in_review":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            In Review
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Awarded / Closed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-800 border border-red-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700 capitalize">
            {status}
          </span>
        );
    }
  };

  const getEnquiryStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            New Lead
          </span>
        );
      case "contacted":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            Contacted
          </span>
        );
      case "qualified":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
            Qualified
          </span>
        );
      case "converted":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Converted
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-600">
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700 capitalize">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          Procurement RFQ & Buyer Enquiry Console
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Monitor enterprise sourcing tenders, review incoming guest quotes, and track supplier quotation fulfillment.
        </p>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-stone-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("rfqs")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === "rfqs"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-400 hover:text-stone-700"
          }`}
        >
          <FileText className="w-4 h-4" />
          Procurement RFQs
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-stone-100 text-stone-700">
            {rfqTotalCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("enquiries")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === "enquiries"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-400 hover:text-stone-700"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Guest Sourcing Enquiries
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-stone-100 text-stone-700">
            {enquiryTotalCount}
          </span>
        </button>
      </div>

      {/* TAB 1: PROCUREMENT RFQs */}
      {activeTab === "rfqs" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="text"
                placeholder="Search RFQs by title or requirement..."
                value={rfqSearch}
                onChange={(e) => {
                  setRfqSearch(e.target.value);
                  setRfqPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
              />
            </div>

            <select
              value={rfqStatus}
              onChange={(e) => {
                setRfqStatus(e.target.value);
                setRfqPage(1);
              }}
              className="text-xs border border-stone-200 rounded-lg px-3 py-2 bg-white text-stone-700 focus:outline-none focus:border-stone-900"
            >
              <option value="">All RFQ Statuses</option>
              <option value="open">Open</option>
              <option value="under_review">Under Review</option>
              <option value="closed">Closed / Awarded</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4">RFQ Title</th>
                    <th className="py-3 px-4">Buyer Enterprise</th>
                    <th className="py-3 px-4">Target Budget</th>
                    <th className="py-3 px-4">Items / Scope</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-400">
                        <div className="inline-block animate-spin w-5 h-5 border-2 border-stone-300 border-t-stone-900 rounded-full mb-2"></div>
                        <p>Loading procurement RFQs...</p>
                      </td>
                    </tr>
                  ) : rfqs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-400">
                        No RFQs found matching the filters.
                      </td>
                    </tr>
                  ) : (
                    rfqs.map((rfq) => (
                      <tr key={rfq.id} className="hover:bg-stone-50/60 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-stone-900">{rfq.title}</div>
                          <div className="text-[10px] text-stone-400 font-mono">
                            ID: {rfq.id.slice(0, 8)}...
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium text-stone-900">
                            {rfq.buyer_business?.name || "Independent Buyer"}
                          </div>
                          <div className="text-[11px] text-stone-500">
                            {rfq.buyer_business?.city || "India"}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-stone-900">
                          {rfq.target_budget
                            ? `₹${Number(rfq.target_budget).toLocaleString("en-IN")}`
                            : "Negotiable"}
                        </td>

                        <td className="py-3.5 px-4 text-stone-700">
                          {rfq.items?.length || 0} line item(s)
                        </td>

                        <td className="py-3.5 px-4">{getRfqStatusBadge(rfq.status)}</td>

                        <td className="py-3.5 px-4 text-stone-500">
                          {new Date(rfq.created_at).toLocaleDateString("en-IN")}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <select
                              value={rfq.status}
                              onChange={(e) => handleUpdateRfqStatus(rfq.id, e.target.value)}
                              className="text-[11px] border border-stone-200 rounded px-2 py-1 bg-white"
                            >
                              <option value="open">Open</option>
                              <option value="under_review">Under Review</option>
                              <option value="closed">Closed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>

                            <button
                              onClick={() => handleOpenRfqDetail(rfq.id)}
                              className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
                              title="View Full RFQ Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-4 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-600">
              <div>
                Showing {(rfqPage - 1) * 15 + 1} to {Math.min(rfqPage * 15, rfqTotalCount)} of{" "}
                {rfqTotalCount} RFQs
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={rfqPage <= 1}
                  onClick={() => setRfqPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 font-medium">
                  {rfqPage} / {rfqTotalPages}
                </span>
                <button
                  disabled={rfqPage >= rfqTotalPages}
                  onClick={() => setRfqPage((p) => Math.min(rfqTotalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GUEST ENQUIRIES */}
      {activeTab === "enquiries" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="text"
                placeholder="Search leads by name, phone, company, or requirement..."
                value={enquirySearch}
                onChange={(e) => {
                  setEnquirySearch(e.target.value);
                  setEnquiryPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
              />
            </div>

            <select
              value={enquiryStatus}
              onChange={(e) => {
                setEnquiryStatus(e.target.value);
                setEnquiryPage(1);
              }}
              className="text-xs border border-stone-200 rounded-lg px-3 py-2 bg-white text-stone-700 focus:outline-none focus:border-stone-900"
            >
              <option value="">All Enquiry Statuses</option>
              <option value="pending">New Lead</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4">Contact Person & Company</th>
                    <th className="py-3 px-4">Contact Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Procurement Requirement</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Received</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-400">
                        <div className="inline-block animate-spin w-5 h-5 border-2 border-stone-300 border-t-stone-900 rounded-full mb-2"></div>
                        <p>Loading guest enquiries from database...</p>
                      </td>
                    </tr>
                  ) : enquiries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-400">
                        No guest inquiries found.
                      </td>
                    </tr>
                  ) : (
                    enquiries.map((lead) => (
                      <tr key={lead.id} className="hover:bg-stone-50/60 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-stone-900">{lead.name}</div>
                          <div className="text-[11px] text-stone-500">
                            {lead.business || "Individual Buyer"}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium text-stone-900">{lead.phone}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-700 capitalize">
                            {lead.category || "General"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="text-stone-800 line-clamp-2">{lead.requirement}</div>
                        </td>

                        <td className="py-3.5 px-4">{getEnquiryStatusBadge(lead.status)}</td>

                        <td className="py-3.5 px-4 text-stone-500">
                          {new Date(lead.created_at).toLocaleDateString("en-IN")}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <select
                              value={lead.status}
                              onChange={(e) => handleUpdateEnquiryStatus(lead.id, e.target.value)}
                              className="text-[11px] border border-stone-200 rounded px-2 py-1 bg-white"
                            >
                              <option value="pending">New Lead</option>
                              <option value="contacted">Contacted</option>
                              <option value="qualified">Qualified</option>
                              <option value="converted">Converted</option>
                              <option value="archived">Archived</option>
                            </select>

                            <button
                              onClick={() => setSelectedEnquiry(lead)}
                              className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
                              title="View Lead Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-4 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-600">
              <div>
                Showing {(enquiryPage - 1) * 15 + 1} to{" "}
                {Math.min(enquiryPage * 15, enquiryTotalCount)} of {enquiryTotalCount} enquiries
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={enquiryPage <= 1}
                  onClick={() => setEnquiryPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 font-medium">
                  {enquiryPage} / {enquiryTotalPages}
                </span>
                <button
                  disabled={enquiryPage >= enquiryTotalPages}
                  onClick={() => setEnquiryPage((p) => Math.min(enquiryTotalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW RFQ DETAIL */}
      {selectedRfq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-xl border border-stone-200 animate-in fade-in">
            <div className="flex items-start justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="font-bold text-base text-stone-900">{selectedRfq.title}</h3>
                <div className="mt-1">{getRfqStatusBadge(selectedRfq.status)}</div>
              </div>
              <button
                onClick={() => setSelectedRfq(null)}
                className="p-1 text-stone-400 hover:text-stone-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-stone-500 block">Buyer Organization:</span>
                  <strong className="text-stone-900 font-medium">
                    {selectedRfq.buyer_business?.name || "Independent Buyer"}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-500 block">Target Budget:</span>
                  <strong className="text-stone-900 font-medium">
                    {selectedRfq.target_budget
                      ? `₹${Number(selectedRfq.target_budget).toLocaleString("en-IN")}`
                      : "Open"}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-500 block">Delivery Location:</span>
                  <strong className="text-stone-900 font-medium">
                    {selectedRfq.delivery_city || selectedRfq.buyer_business?.city || "India"}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-500 block">Date Posted:</span>
                  <strong className="text-stone-900 font-medium">
                    {new Date(selectedRfq.created_at).toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>

              {selectedRfq.description && (
                <div>
                  <h4 className="font-bold text-stone-900 mb-1">Requirement Overview</h4>
                  <p className="text-stone-600 bg-stone-50 p-3 rounded-lg border border-stone-200">
                    {selectedRfq.description}
                  </p>
                </div>
              )}

              {/* Items */}
              <div>
                <h4 className="font-bold text-stone-900 mb-2">
                  Line Items ({selectedRfq.items?.length || 0})
                </h4>
                <div className="border border-stone-200 rounded-xl divide-y divide-stone-100">
                  {selectedRfq.items?.map((item: any) => (
                    <div key={item.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-stone-900">{item.item_name}</div>
                        <div className="text-[11px] text-stone-500">
                          Target: {item.target_price ? `₹${item.target_price}` : "Negotiable"}
                        </div>
                      </div>
                      <div className="font-bold text-stone-900">
                        {item.quantity} {item.unit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quotations Received */}
              <div>
                <h4 className="font-bold text-stone-900 mb-2">
                  Quotations Submitted ({selectedRfq.quotations?.length || 0})
                </h4>
                {selectedRfq.quotations && selectedRfq.quotations.length > 0 ? (
                  <div className="border border-stone-200 rounded-xl divide-y divide-stone-100">
                    {selectedRfq.quotations.map((q: any) => (
                      <div key={q.id} className="p-3 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-stone-900">
                            {q.supplier_business?.name || "Supplier Bid"}
                          </div>
                          <div className="text-[11px] text-stone-500">
                            Status: <span className="capitalize">{q.status}</span>
                          </div>
                        </div>
                        <div className="font-bold text-stone-900">
                          ₹{Number(q.total_amount).toLocaleString("en-IN")}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-stone-400 italic">No supplier quotations submitted yet.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setSelectedRfq(null)}
                className="px-4 py-2 border border-stone-200 rounded-lg text-xs font-medium text-stone-700 hover:bg-stone-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW GUEST ENQUIRY DETAIL */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 animate-in fade-in">
            <div className="flex items-start justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="font-bold text-base text-stone-900">{selectedEnquiry.name}</h3>
                <p className="text-xs text-stone-500">
                  {selectedEnquiry.business || "Individual Buyer"}
                </p>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="p-1 text-stone-400 hover:text-stone-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-2">
                <div className="flex items-center gap-2 text-stone-700">
                  <Phone className="w-4 h-4 text-stone-400" />
                  <span className="font-semibold">{selectedEnquiry.phone}</span>
                </div>
                {selectedEnquiry.category && (
                  <div className="flex items-center gap-2 text-stone-700">
                    <Layers className="w-4 h-4 text-stone-400" />
                    <span>Category: <strong>{selectedEnquiry.category}</strong></span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-stone-500 text-[11px]">
                  <Calendar className="w-4 h-4 text-stone-400" />
                  <span>Submitted {new Date(selectedEnquiry.created_at).toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Full Requirement Details
                </label>
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 whitespace-pre-wrap leading-relaxed">
                  {selectedEnquiry.requirement}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Update Status</label>
                <select
                  value={selectedEnquiry.status}
                  onChange={(e) => handleUpdateEnquiryStatus(selectedEnquiry.id, e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-stone-900"
                >
                  <option value="pending">New Lead</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="px-4 py-2 border border-stone-200 rounded-lg text-xs font-medium text-stone-700 hover:bg-stone-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
