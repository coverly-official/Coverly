import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  ShieldCheck,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  DollarSign,
  Calendar,
  Phone,
  Video,
  Building,
  Mail,
  Search,
  Filter,
  ArrowRight,
  PlusCircle,
  Check,
  X,
  Send,
  Eye,
  Edit,
} from "lucide-react";
import { SalesLead, SalesLeadFollowup, SalesCommissionRecord } from "../../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const AgentDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "leads" | "followups" | "commissions">("overview");
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [followups, setFollowups] = useState<SalesLeadFollowup[]>([]);
  const [commissions, setCommissions] = useState<SalesCommissionRecord[]>([]);
  const [metrics, setMetrics] = useState({
    totalLeads: 12,
    activeLeads: 7,
    convertedLeads: 4,
    pendingCommissions: 45000,
    paidCommissions: 92500,
  });

  const [isLoading, setIsLoading] = useState(true);

  // Status Update Modal State
  const [selectedLeadForStatus, setSelectedLeadForStatus] = useState<SalesLead | null>(null);
  const [newStatus, setNewStatus] = useState<string>("contacted");
  const [statusNotes, setStatusNotes] = useState("");
  const [lostReason, setLostReason] = useState("");

  // Follow-up Modal State
  const [selectedLeadForFollowup, setSelectedLeadForFollowup] = useState<SalesLead | null>(null);
  const [followupType, setFollowupType] = useState<string>("phone_call");
  const [scheduledAt, setScheduledAt] = useState("");
  const [followupNotes, setFollowupNotes] = useState("");

  // Conversion Modal State
  const [selectedLeadForConversion, setSelectedLeadForConversion] = useState<SalesLead | null>(null);
  const [conversionValue, setConversionValue] = useState("");
  const [orderId, setOrderId] = useState("");

  // Filter States
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fallbackLeads: SalesLead[] = [
    {
      id: "lead-01",
      lead_number: "SA-LEAD-KM72-501",
      guest_name: "Karan Singhania",
      guest_company: "Singhania Packaging Works",
      guest_email: "karan@singhaniapack.in",
      guest_phone: "+91 98111 88776",
      requirement_category: "Packaging Materials",
      product_or_service: "3-Ply & 5-Ply Corrugated Cartons",
      quantity: "50,000 Boxes / month",
      budget: 1500000,
      location_city: "Faridabad",
      location_state: "Haryana",
      description: "Need recurring monthly consignment for auto parts packaging with burst test factor > 16.",
      priority: "urgent",
      status: "negotiation",
      lead_source: "guest_form",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "lead-02",
      lead_number: "SA-LEAD-BL99-204",
      guest_name: "Vikram Malhotra",
      guest_company: "Malhotra Heavy Textiles",
      guest_email: "vikram@malhotratex.com",
      guest_phone: "+91 98201 12345",
      requirement_category: "Industrial Machinery",
      product_or_service: "Automatic Rapier Loom Machines",
      quantity: "4 Units",
      budget: 3200000,
      location_city: "Surat",
      location_state: "Gujarat",
      description: "Looking for high-speed electronic rapier looms with installation support and 1 year warranty.",
      priority: "high",
      status: "quotation_requested",
      lead_source: "guest_form",
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      id: "lead-03",
      lead_number: "SA-LEAD-HD11-881",
      guest_name: "Devendra Patel",
      guest_company: "Apex Precision Castings",
      guest_email: "patel@apexcast.in",
      guest_phone: "+91 98790 44321",
      requirement_category: "Raw Materials",
      product_or_service: "Cast Iron Scrap Grade A",
      quantity: "100 MT",
      budget: 2800000,
      location_city: "Rajkot",
      location_state: "Gujarat",
      description: "Foundry scrap required for casting plant, monthly repeat orders if quality matches specification.",
      priority: "medium",
      status: "converted",
      converted_transaction_value: 2750000,
      lead_source: "buyer_portal",
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
  ];

  const fallbackFollowups: SalesLeadFollowup[] = [
    {
      id: "fup-01",
      lead_id: "lead-01",
      agent_id: "agent-me",
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      followup_type: "phone_call",
      outcome_notes: "Confirm final per-unit quotation for 5-ply cartons",
      next_action: "Send formal revision over email",
      is_completed: false,
      created_at: new Date().toISOString(),
    },
    {
      id: "fup-02",
      lead_id: "lead-02",
      agent_id: "agent-me",
      scheduled_at: new Date(Date.now() + 86400000 * 2).toISOString(),
      followup_type: "factory_visit",
      outcome_notes: "On-site machine inspection with client engineering team",
      next_action: "Provide electrical load diagram",
      is_completed: false,
      created_at: new Date().toISOString(),
    },
  ];

  const fallbackCommissions: SalesCommissionRecord[] = [
    {
      id: "com-01",
      commission_number: "COM-77A-901",
      agent_id: "agent-me",
      lead_id: "lead-03",
      qualifying_transaction_value: 2750000,
      calculated_commission: 55000,
      status: "approved",
      payout_reference: "NEFT-HDFC-9928174",
      paid_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
      id: "com-02",
      commission_number: "COM-88B-102",
      agent_id: "agent-me",
      lead_id: "lead-01",
      qualifying_transaction_value: 1500000,
      calculated_commission: 37500,
      status: "pending_verification",
      created_at: new Date().toISOString(),
    },
  ];

  useEffect(() => {
    setIsLoading(true);
    const token = localStorage.getItem("auth_token") || localStorage.getItem("coverly_user_id") || "";

    fetch(`${API_BASE}/sales-agent/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          if (data.data.leads && data.data.leads.length > 0) {
            setLeads(data.data.leads);
          } else {
            setLeads(fallbackLeads);
          }
          if (data.data.followups && data.data.followups.length > 0) {
            setFollowups(data.data.followups);
          } else {
            setFollowups(fallbackFollowups);
          }
          if (data.data.commissions && data.data.commissions.length > 0) {
            setCommissions(data.data.commissions);
          } else {
            setCommissions(fallbackCommissions);
          }
          if (data.data.metrics) {
            setMetrics(data.data.metrics);
          }
        } else {
          setLeads(fallbackLeads);
          setFollowups(fallbackFollowups);
          setCommissions(fallbackCommissions);
        }
      })
      .catch(() => {
        setLeads(fallbackLeads);
        setFollowups(fallbackFollowups);
        setCommissions(fallbackCommissions);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForStatus) return;

    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("coverly_user_id") || "";
      await fetch(`${API_BASE}/sales-agent/leads/${selectedLeadForStatus.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          notes: statusNotes,
          lost_reason: newStatus === "lost" ? lostReason : undefined,
        }),
      });

      setLeads((prev) =>
        prev.map((l) =>
          l.id === selectedLeadForStatus.id ? { ...l, status: newStatus as any } : l
        )
      );
      setSelectedLeadForStatus(null);
      setStatusNotes("");
      setLostReason("");
    } catch {
      // optimistic update
      setLeads((prev) =>
        prev.map((l) =>
          l.id === selectedLeadForStatus.id ? { ...l, status: newStatus as any } : l
        )
      );
      setSelectedLeadForStatus(null);
    }
  };

  const handleCreateFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForFollowup) return;

    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("coverly_user_id") || "";
      const res = await fetch(
        `${API_BASE}/sales-agent/leads/${selectedLeadForFollowup.id}/followups`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            followup_type: followupType,
            scheduled_at: scheduledAt || new Date().toISOString(),
            outcome_notes: followupNotes,
          }),
        }
      );
      const json = await res.json();
      if (json.success && json.data) {
        setFollowups((prev) => [json.data, ...prev]);
      } else {
        setFollowups((prev) => [
          {
            id: `fup-${Date.now()}`,
            lead_id: selectedLeadForFollowup.id,
            agent_id: "agent-me",
            scheduled_at: scheduledAt || new Date().toISOString(),
            followup_type: followupType as any,
            outcome_notes: followupNotes,
            is_completed: false,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
      setSelectedLeadForFollowup(null);
      setFollowupNotes("");
    } catch {
      setSelectedLeadForFollowup(null);
    }
  };

  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForConversion) return;

    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("coverly_user_id") || "";
      const res = await fetch(
        `${API_BASE}/sales-agent/leads/${selectedLeadForConversion.id}/convert`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            order_id: orderId || undefined,
            converted_transaction_value: parseFloat(conversionValue) || 100000,
          }),
        }
      );
      const json = await res.json();
      if (json.success && json.data) {
        setCommissions((prev) => [json.data.commission, ...prev]);
        setLeads((prev) =>
          prev.map((l) =>
            l.id === selectedLeadForConversion.id ? { ...l, status: "converted" } : l
          )
        );
      }
      setSelectedLeadForConversion(null);
      setConversionValue("");
      setOrderId("");
    } catch {
      setSelectedLeadForConversion(null);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      lead.product_or_service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.lead_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.guest_name && lead.guest_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Top Banner */}
      <section className="bg-slate-900 text-white py-8 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Sales Agent Workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Representative Sales Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Manage commercial buyer leads, log customer follow-ups, and track commission claims.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/sales-agents"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
            >
              Public Directory
            </Link>
            <Link
              to="/sales-agents/requirement"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
            >
              + Create Sourcing Lead
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Assigned Leads
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{leads.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Commercial opportunities</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              In Negotiation
            </div>
            <div className="text-2xl font-bold text-indigo-600 mt-1">
              {leads.filter((l) => ["interested", "quotation_requested", "negotiation"].includes(l.status)).length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Active dialogue</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Deals Converted
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {leads.filter((l) => l.status === "converted").length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Won transactions</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Commissions Earned
            </div>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              ₹
              {commissions
                .reduce((acc, c) => acc + (c.calculated_commission || 0), 0)
                .toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Approved & paid payouts</div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-slate-200 flex items-center gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 transition-colors border-b-2 ${
              activeTab === "overview"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Overview & Activity
          </button>
          <button
            onClick={() => setActiveTab("leads")}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "leads"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            My Assigned Leads ({leads.length})
          </button>
          <button
            onClick={() => setActiveTab("followups")}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "followups"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Scheduled Follow-ups ({followups.filter((f) => !f.is_completed).length})
          </button>
          <button
            onClick={() => setActiveTab("commissions")}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "commissions"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Commission Ledger ({commissions.length})
          </button>
        </div>
      </section>

      {/* Main Tab Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Active Pipeline Preview */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900">
                    High Priority Sourcing Leads
                  </h3>
                  <button
                    onClick={() => setActiveTab("leads")}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    View All Leads →
                  </button>
                </div>
                <div className="space-y-3">
                  {leads.slice(0, 3).map((lead) => (
                    <div
                      key={lead.id}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-600">
                            {lead.lead_number}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                              lead.priority === "urgent"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {lead.priority}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">
                          {lead.product_or_service}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {lead.guest_name} • {lead.location_city}, {lead.location_state} • Est. Budget: ₹
                          {lead.budget ? lead.budget.toLocaleString("en-IN") : "Unspecified"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedLeadForStatus(lead);
                            setNewStatus(lead.status);
                          }}
                          className="px-3 py-1.5 bg-white border border-slate-300 hover:border-indigo-500 rounded text-xs font-medium text-slate-700"
                        >
                          Update Status
                        </button>
                        <button
                          onClick={() => setSelectedLeadForFollowup(lead)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold"
                        >
                          Log Call
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Upcoming Actions */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  Upcoming Follow-ups
                </h3>
                {followups.length === 0 ? (
                  <p className="text-xs text-slate-500">No pending follow-ups scheduled.</p>
                ) : (
                  <div className="space-y-3">
                    {followups.map((fup) => (
                      <div
                        key={fup.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 capitalize flex items-center gap-1">
                            {fup.followup_type === "phone_call" ? (
                              <Phone className="w-3.5 h-3.5 text-indigo-600" />
                            ) : (
                              <Building className="w-3.5 h-3.5 text-amber-600" />
                            )}
                            {fup.followup_type.replace("_", " ")}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(fup.scheduled_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-600">{fup.outcome_notes}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Leads Table */}
        {activeTab === "leads" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search leads by product or buyer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                >
                  <option value="all">All Statuses (10-States)</option>
                  <option value="new">New</option>
                  <option value="assigned">Assigned</option>
                  <option value="contacted">Contacted</option>
                  <option value="interested">Interested</option>
                  <option value="followup_required">Follow-up Required</option>
                  <option value="quotation_requested">Quotation Requested</option>
                  <option value="negotiation">In Negotiation</option>
                  <option value="converted">Converted / Won</option>
                  <option value="lost">Lost</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Lead Number</th>
                    <th className="py-3 px-4">Product / Category</th>
                    <th className="py-3 px-4">Buyer / Enterprise</th>
                    <th className="py-3 px-4">Est. Budget</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                        {lead.lead_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{lead.product_or_service}</div>
                        <div className="text-[11px] text-slate-400">{lead.requirement_category}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{lead.guest_name}</div>
                        <div className="text-[11px] text-slate-500">{lead.location_city}, {lead.location_state}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {lead.budget ? `₹${lead.budget.toLocaleString("en-IN")}` : "Negotiable"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            lead.status === "converted"
                              ? "bg-emerald-100 text-emerald-700"
                              : lead.status === "negotiation"
                              ? "bg-amber-100 text-amber-700"
                              : lead.status === "lost"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {lead.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedLeadForStatus(lead);
                              setNewStatus(lead.status);
                            }}
                            className="px-2.5 py-1 bg-white border border-slate-300 hover:border-indigo-400 text-slate-700 rounded text-[11px] font-semibold"
                          >
                            Status
                          </button>
                          <button
                            onClick={() => setSelectedLeadForFollowup(lead)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold"
                          >
                            Follow-up
                          </button>
                          {lead.status !== "converted" && (
                            <button
                              onClick={() => {
                                setSelectedLeadForConversion(lead);
                                setConversionValue(lead.budget ? lead.budget.toString() : "100000");
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold"
                            >
                              Convert Deal
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Followups */}
        {activeTab === "followups" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Follow-up Action Items & Communication Logs
            </h3>
            <div className="space-y-3">
              {followups.map((fup) => (
                <div
                  key={fup.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 capitalize">
                        {fup.followup_type.replace("_", " ")}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(fup.scheduled_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{fup.outcome_notes}</p>
                  </div>
                  <div>
                    {fup.is_completed ? (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                        Completed
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setFollowups((prev) =>
                            prev.map((f) => (f.id === fup.id ? { ...f, is_completed: true } : f))
                          );
                        }}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded"
                      >
                        Mark Done
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Commissions */}
        {activeTab === "commissions" && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Commission ID</th>
                  <th className="py-3 px-4">Transaction Value</th>
                  <th className="py-3 px-4">Commission Earned</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Payout Reference</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commissions.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {c.commission_number}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      ₹{c.qualifying_transaction_value.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">
                      ₹{c.calculated_commission.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.status === "paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : c.status === "approved"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {c.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {c.payout_reference || "Pending Payout Batch"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal: Status Update */}
      {selectedLeadForStatus && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Advance Lead Lifecycle
              </h3>
              <button
                onClick={() => setSelectedLeadForStatus(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Updating status for <strong className="text-slate-800">{selectedLeadForStatus.lead_number}</strong> ({selectedLeadForStatus.product_or_service}).
            </p>
            <form onSubmit={handleUpdateStatus} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target State (10-State Pipeline) *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="contacted">Contacted Buyer</option>
                  <option value="interested">Buyer Interested</option>
                  <option value="followup_required">Follow-up Required</option>
                  <option value="quotation_requested">Quotation Requested</option>
                  <option value="negotiation">In Commercial Negotiation</option>
                  <option value="converted">Converted / Deal Closed</option>
                  <option value="lost">Lost</option>
                  <option value="closed">Closed / Inactive</option>
                </select>
              </div>

              {newStatus === "lost" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reason for Loss *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Budget mismatch, competitor chosen, canceled project"
                    value={lostReason}
                    onChange={(e) => setLostReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Activity Audit Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Document key points discussed with buyer or supplier..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLeadForStatus(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Schedule Follow-up */}
      {selectedLeadForFollowup && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Schedule Buyer Follow-up</h3>
              <button
                onClick={() => setSelectedLeadForFollowup(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateFollowup} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Communication Channel *
                </label>
                <select
                  value={followupType}
                  onChange={(e) => setFollowupType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="phone_call">Phone Call</option>
                  <option value="video_meeting">Video Conference</option>
                  <option value="factory_visit">Factory / Site Visit</option>
                  <option value="whatsapp_email">WhatsApp / Email Follow-up</option>
                  <option value="quotation_review">Quotation Review Meeting</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Agenda & Objective
                </label>
                <textarea
                  rows={2}
                  placeholder="State target deliverables for this follow-up..."
                  value={followupNotes}
                  onChange={(e) => setFollowupNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLeadForFollowup(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                >
                  Confirm Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Convert Lead & Claim Commission */}
      {selectedLeadForConversion && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Record Deal Conversion</h3>
              <button
                onClick={() => setSelectedLeadForConversion(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Record final purchase order or contract value for{" "}
              <strong>{selectedLeadForConversion.lead_number}</strong>. This initiates commission verification.
            </p>
            <form onSubmit={handleConvertLead} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Qualifying Order / Transaction Value (₹) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1500000"
                  value={conversionValue}
                  onChange={(e) => setConversionValue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-indigo-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Linked Order ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ORD-2026-9021"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLeadForConversion(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  Submit Conversion Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
