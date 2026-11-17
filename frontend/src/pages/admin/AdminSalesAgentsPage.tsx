import React, { useState, useEffect } from "react";
import {
  Users,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Search,
  Filter,
  Check,
  X,
  CreditCard,
  UserCheck,
  FileText,
  Clock,
  Briefcase,
  MapPin,
} from "lucide-react";
import { SalesAgentProfile, SalesLead, SalesCommissionRecord } from "../../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const AdminSalesAgentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"metrics" | "agents" | "leads" | "commissions">("metrics");
  const [agents, setAgents] = useState<SalesAgentProfile[]>([]);
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [commissions, setCommissions] = useState<SalesCommissionRecord[]>([]);
  const [metrics, setMetrics] = useState({
    total_agents: 18,
    verified_agents: 14,
    pending_agents: 4,
    total_leads: 52,
    active_leads: 28,
    converted_leads: 16,
    total_commission_value: 345000,
    pending_payouts_value: 82500,
  });

  const [isLoading, setIsLoading] = useState(true);

  // Verification modal state
  const [selectedAgentForVerify, setSelectedAgentForVerify] = useState<SalesAgentProfile | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<"verified" | "rejected" | "suspended">("verified");
  const [verifyNotes, setVerifyNotes] = useState("");

  // Allocation modal state
  const [selectedLeadForAssign, setSelectedLeadForAssign] = useState<SalesLead | null>(null);
  const [targetAgentId, setTargetAgentId] = useState("");

  // Payout modal state
  const [selectedCommissionForPayout, setSelectedCommissionForPayout] = useState<SalesCommissionRecord | null>(null);
  const [payoutRef, setPayoutRef] = useState("");

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");

  const fallbackAgents: SalesAgentProfile[] = [
    {
      id: "ag-01",
      user_id: "usr-01",
      agent_type: "independent",
      full_name: "Rajeshwar Rao",
      phone: "+91 98490 12345",
      email: "rajeshwar.rao@b2bagents.in",
      product_categories: ["Industrial Machinery", "Electrical Equipment"],
      service_categories: ["Machinery Maintenance"],
      operating_cities: ["Hyderabad", "Bengaluru"],
      operating_states: ["Telangana", "Karnataka"],
      languages: ["English", "Telugu", "Hindi"],
      experience_years: 14,
      verification_status: "verified",
      is_public_discovery_enabled: true,
      slug: "rajeshwar-rao",
      total_leads_assigned: 38,
      total_conversions: 29,
      created_at: new Date().toISOString(),
    },
    {
      id: "ag-02",
      user_id: "usr-02",
      agent_type: "company_representative",
      full_name: "Anita Deshmukh",
      phone: "+91 98220 54321",
      email: "anita.deshmukh@apexmetals.com",
      product_categories: ["Raw Materials", "Construction Materials"],
      service_categories: ["Custom Fabrication"],
      operating_cities: ["Mumbai", "Pune"],
      operating_states: ["Maharashtra"],
      languages: ["English", "Marathi", "Hindi"],
      experience_years: 8,
      verification_status: "pending",
      is_public_discovery_enabled: true,
      slug: "anita-deshmukh",
      total_leads_assigned: 12,
      total_conversions: 8,
      created_at: new Date().toISOString(),
      businesses: {
        id: "biz-01",
        name: "Apex Steel & Alloys Pvt Ltd",
        city: "Mumbai",
      },
    },
    {
      id: "ag-03",
      user_id: "usr-03",
      agent_type: "independent",
      full_name: "Vikramjit Singh",
      phone: "+91 98140 99887",
      email: "vikramjit.singh@punjabsourcing.in",
      product_categories: ["Agriculture Products", "Food & Beverages"],
      service_categories: ["Quality Inspection"],
      operating_cities: ["Ludhiana", "Amritsar", "Delhi NCR"],
      operating_states: ["Punjab", "Haryana", "Delhi"],
      languages: ["English", "Punjabi", "Hindi"],
      experience_years: 11,
      verification_status: "verified",
      is_public_discovery_enabled: true,
      slug: "vikramjit-singh",
      total_leads_assigned: 52,
      total_conversions: 41,
      created_at: new Date().toISOString(),
    },
  ];

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
      description: "Monthly consignment for auto parts export cartons.",
      priority: "urgent",
      status: "negotiation",
      lead_source: "guest_form",
      assigned_agent_id: "ag-01",
      created_at: new Date().toISOString(),
    },
    {
      id: "lead-02",
      lead_number: "SA-LEAD-BL99-204",
      guest_name: "Ramesh Khurana",
      guest_company: "Khurana Agrotech",
      guest_email: "khurana@agrotech.com",
      guest_phone: "+91 98765 11223",
      requirement_category: "Agriculture Products",
      product_or_service: "Basmati Rice 1121 Steam 50kg bags",
      quantity: "100 MT",
      budget: 8500000,
      location_city: "Karnal",
      location_state: "Haryana",
      description: "Export grade steam basmati rice needed for Gulf container shipment.",
      priority: "high",
      status: "new",
      lead_source: "guest_form",
      assigned_agent_id: undefined, // Unassigned!
      created_at: new Date().toISOString(),
    },
  ];

  const fallbackCommissions: SalesCommissionRecord[] = [
    {
      id: "com-01",
      commission_number: "COM-77A-901",
      agent_id: "ag-01",
      lead_id: "lead-01",
      qualifying_transaction_value: 2750000,
      calculated_commission: 55000,
      status: "pending_verification",
      sales_agent_profiles: {
        full_name: "Rajeshwar Rao",
        phone: "+91 98490 12345",
        email: "rajeshwar.rao@b2bagents.in",
      },
      sales_leads: {
        lead_number: "SA-LEAD-KM72-501",
        product_or_service: "Industrial Machinery Parts",
        requirement_category: "Industrial Machinery",
      },
      created_at: new Date().toISOString(),
    },
    {
      id: "com-02",
      commission_number: "COM-88B-102",
      agent_id: "ag-03",
      lead_id: "lead-02",
      qualifying_transaction_value: 3800000,
      calculated_commission: 95000,
      status: "approved",
      sales_agent_profiles: {
        full_name: "Vikramjit Singh",
        phone: "+91 98140 99887",
        email: "vikramjit.singh@punjabsourcing.in",
      },
      sales_leads: {
        lead_number: "SA-LEAD-BL99-204",
        product_or_service: "Basmati Rice Consignment",
        requirement_category: "Agriculture Products",
      },
      created_at: new Date().toISOString(),
    },
  ];

  useEffect(() => {
    setIsLoading(true);
    const token = localStorage.getItem("auth_token") || "";

    Promise.all([
      fetch(`${API_BASE}/admin/sales-agents/metrics`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/admin/sales-agents`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/admin/sales-agents/leads`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/admin/sales-agents/commissions`, { headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(async ([resMetrics, resAgents, resLeads, resCommissions]) => {
        const dMetrics = await resMetrics.json().catch(() => null);
        const dAgents = await resAgents.json().catch(() => null);
        const dLeads = await resLeads.json().catch(() => null);
        const dCommissions = await resCommissions.json().catch(() => null);

        if (dMetrics?.success && dMetrics.data) setMetrics(dMetrics.data);
        if (dAgents?.success && Array.isArray(dAgents.data) && dAgents.data.length > 0) {
          setAgents(dAgents.data);
        } else {
          setAgents(fallbackAgents);
        }
        if (dLeads?.success && Array.isArray(dLeads.data) && dLeads.data.length > 0) {
          setLeads(dLeads.data);
        } else {
          setLeads(fallbackLeads);
        }
        if (dCommissions?.success && Array.isArray(dCommissions.data) && dCommissions.data.length > 0) {
          setCommissions(dCommissions.data);
        } else {
          setCommissions(fallbackCommissions);
        }
      })
      .catch(() => {
        setAgents(fallbackAgents);
        setLeads(fallbackLeads);
        setCommissions(fallbackCommissions);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleVerifyAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentForVerify) return;

    try {
      const token = localStorage.getItem("auth_token") || "";
      await fetch(`${API_BASE}/admin/sales-agents/${selectedAgentForVerify.id}/verify`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: verifyStatus,
          verification_notes: verifyNotes,
        }),
      });

      setAgents((prev) =>
        prev.map((a) =>
          a.id === selectedAgentForVerify.id ? { ...a, verification_status: verifyStatus } : a
        )
      );
      setSelectedAgentForVerify(null);
      setVerifyNotes("");
    } catch {
      setAgents((prev) =>
        prev.map((a) =>
          a.id === selectedAgentForVerify.id ? { ...a, verification_status: verifyStatus } : a
        )
      );
      setSelectedAgentForVerify(null);
    }
  };

  const handleAssignLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForAssign || !targetAgentId) return;

    try {
      const token = localStorage.getItem("auth_token") || "";
      await fetch(`${API_BASE}/admin/sales-agents/leads/${selectedLeadForAssign.id}/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ agent_id: targetAgentId }),
      });

      setLeads((prev) =>
        prev.map((l) =>
          l.id === selectedLeadForAssign.id
            ? { ...l, assigned_agent_id: targetAgentId, status: "assigned" }
            : l
        )
      );
      setSelectedLeadForAssign(null);
      setTargetAgentId("");
    } catch {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === selectedLeadForAssign.id
            ? { ...l, assigned_agent_id: targetAgentId, status: "assigned" }
            : l
        )
      );
      setSelectedLeadForAssign(null);
    }
  };

  const handleApproveCommission = async (commissionId: string, status: "approved" | "rejected") => {
    try {
      const token = localStorage.getItem("auth_token") || "";
      await fetch(`${API_BASE}/admin/sales-agents/commissions/${commissionId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      setCommissions((prev) =>
        prev.map((c) => (c.id === commissionId ? { ...c, status } : c))
      );
    } catch {
      setCommissions((prev) =>
        prev.map((c) => (c.id === commissionId ? { ...c, status } : c))
      );
    }
  };

  const handleRecordPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommissionForPayout || !payoutRef) return;

    try {
      const token = localStorage.getItem("auth_token") || "";
      await fetch(
        `${API_BASE}/admin/sales-agents/commissions/${selectedCommissionForPayout.id}/payout`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ payout_reference: payoutRef }),
        }
      );

      setCommissions((prev) =>
        prev.map((c) =>
          c.id === selectedCommissionForPayout.id
            ? { ...c, status: "paid", payout_reference: payoutRef }
            : c
        )
      );
      setSelectedCommissionForPayout(null);
      setPayoutRef("");
    } catch {
      setSelectedCommissionForPayout(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Header */}
      <section className="bg-slate-900 text-white py-8 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              COVERLY Administration & Governance
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Sales Agents & Representatives Console
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Verify credentials, allocate sourcing leads, and audit commission payouts across the representative network.
            </p>
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Total Agents
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{agents.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {agents.filter((a) => a.verification_status === "pending").length} pending verification
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Total Sourcing Leads
            </div>
            <div className="text-2xl font-bold text-indigo-600 mt-1">{leads.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {leads.filter((l) => !l.assigned_agent_id).length} unallocated leads
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Converted Deals
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {leads.filter((l) => l.status === "converted").length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Successfully closed</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Commission Pool
            </div>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              ₹
              {commissions
                .reduce((acc, c) => acc + (c.calculated_commission || 0), 0)
                .toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {commissions.filter((c) => c.status === "pending_verification").length} pending approval
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-slate-200 flex items-center gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab("metrics")}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === "metrics"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Ecosystem Overview
          </button>
          <button
            onClick={() => setActiveTab("agents")}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "agents"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Agent Directory & Verification ({agents.length})
          </button>
          <button
            onClick={() => setActiveTab("leads")}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "leads"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Lead Allocation Queue ({leads.length})
          </button>
          <button
            onClick={() => setActiveTab("commissions")}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "commissions"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Commission & Payout Approvals ({commissions.length})
          </button>
        </div>
      </section>

      {/* Tab Contents */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Tab 1: Ecosystem Overview */}
        {activeTab === "metrics" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Representative Compliance Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg text-xs">
                  <span className="font-semibold text-emerald-800">Verified & Active Agents</span>
                  <span className="font-bold text-emerald-900">
                    {agents.filter((a) => a.verification_status === "verified").length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg text-xs">
                  <span className="font-semibold text-amber-800">Pending Credential Audit</span>
                  <span className="font-bold text-amber-900">
                    {agents.filter((a) => a.verification_status === "pending").length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-rose-50 rounded-lg text-xs">
                  <span className="font-semibold text-rose-800">Suspended / Rejected</span>
                  <span className="font-bold text-rose-900">
                    {agents.filter((a) => ["rejected", "suspended"].includes(a.verification_status)).length}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Commission Payout Reconciliation
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-xs">
                  <span className="font-semibold text-slate-700">Total Approved Payouts Dispatched</span>
                  <span className="font-bold text-slate-900">
                    ₹
                    {commissions
                      .filter((c) => c.status === "paid")
                      .reduce((acc, c) => acc + (c.calculated_commission || 0), 0)
                      .toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg text-xs">
                  <span className="font-semibold text-amber-800">Pending Administrative Sign-off</span>
                  <span className="font-bold text-amber-900">
                    ₹
                    {commissions
                      .filter((c) => c.status === "pending_verification")
                      .reduce((acc, c) => acc + (c.calculated_commission || 0), 0)
                      .toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Agents Table */}
        {activeTab === "agents" && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Representative</th>
                  <th className="py-3 px-4">Role / Typology</th>
                  <th className="py-3 px-4">Specialization</th>
                  <th className="py-3 px-4">Territory</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{agent.full_name}</div>
                      <div className="text-[11px] text-slate-400">{agent.email} • {agent.phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          agent.agent_type === "company_representative"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {agent.agent_type === "company_representative" ? "Company Rep" : "Independent"}
                      </span>
                      {agent.businesses?.name && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {agent.businesses.name}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {agent.product_categories?.slice(0, 2).join(", ") || "General"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {agent.operating_cities?.slice(0, 2).join(", ") || "Pan-India"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          agent.verification_status === "verified"
                            ? "bg-emerald-100 text-emerald-700"
                            : agent.verification_status === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {agent.verification_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedAgentForVerify(agent)}
                        className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded text-xs font-semibold"
                      >
                        Audit / Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Lead Allocation Queue */}
        {activeTab === "leads" && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Lead Number</th>
                  <th className="py-3 px-4">Product / Category</th>
                  <th className="py-3 px-4">Buyer Info</th>
                  <th className="py-3 px-4">Est. Budget</th>
                  <th className="py-3 px-4">Assigned Agent</th>
                  <th className="py-3 px-4 text-right">Allocation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => {
                  const assignedAgent = agents.find((a) => a.id === lead.assigned_agent_id);
                  return (
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
                        {assignedAgent ? (
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            {assignedAgent.full_name}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedLeadForAssign(lead)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold"
                        >
                          {assignedAgent ? "Reallocate" : "Assign Agent"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Commissions & Payouts */}
        {activeTab === "commissions" && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Commission ID</th>
                  <th className="py-3 px-4">Representative</th>
                  <th className="py-3 px-4">Transaction Value</th>
                  <th className="py-3 px-4">Commission</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Governance Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commissions.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {c.commission_number}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {c.sales_agent_profiles?.full_name || "Verified Agent"}
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
                    <td className="py-3.5 px-4 text-right">
                      {c.status === "pending_verification" && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApproveCommission(c.id, "approved")}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApproveCommission(c.id, "rejected")}
                            className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-xs font-semibold"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {c.status === "approved" && (
                        <button
                          onClick={() => setSelectedCommissionForPayout(c)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold flex items-center gap-1 ml-auto"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Record Payout
                        </button>
                      )}
                      {c.status === "paid" && (
                        <span className="font-mono text-[11px] text-slate-500">
                          {c.payout_reference}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal: Audit & Verify Agent */}
      {selectedAgentForVerify && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Review Representative Credentials</h3>
              <button onClick={() => setSelectedAgentForVerify(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Audit for <strong>{selectedAgentForVerify.full_name}</strong> ({selectedAgentForVerify.experience_years} years exp).
            </p>
            <form onSubmit={handleVerifyAgent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Verification Decision *
                </label>
                <select
                  value={verifyStatus}
                  onChange={(e) => setVerifyStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="verified">Approve & Verify (Grant Public Discovery)</option>
                  <option value="rejected">Reject Application</option>
                  <option value="suspended">Suspend Account</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Administrative Audit Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Record identity check or compliance justification..."
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAgentForVerify(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                >
                  Confirm Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Lead Allocation */}
      {selectedLeadForAssign && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Allocate Sourcing Lead</h3>
              <button onClick={() => setSelectedLeadForAssign(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Assign lead <strong>{selectedLeadForAssign.lead_number}</strong> ({selectedLeadForAssign.product_or_service}) to a verified agent.
            </p>
            <form onSubmit={handleAssignLead} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Verified Representative *
                </label>
                <select
                  required
                  value={targetAgentId}
                  onChange={(e) => setTargetAgentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                >
                  <option value="">-- Choose Agent --</option>
                  {agents
                    .filter((a) => a.verification_status === "verified")
                    .map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.full_name} ({agent.agent_type}) - {agent.product_categories?.join(", ")}
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLeadForAssign(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!targetAgentId}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Payout */}
      {selectedCommissionForPayout && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Record Commission Payout</h3>
              <button onClick={() => setSelectedCommissionForPayout(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Record payout of{" "}
              <strong className="text-emerald-700 font-bold">
                ₹{selectedCommissionForPayout.calculated_commission.toLocaleString("en-IN")}
              </strong>{" "}
              for commission {selectedCommissionForPayout.commission_number}.
            </p>
            <form onSubmit={handleRecordPayout} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank Reference / NEFT UTR Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NEFT-HDFC-99281746201"
                  value={payoutRef}
                  onChange={(e) => setPayoutRef(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCommissionForPayout(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  Confirm Payout Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
