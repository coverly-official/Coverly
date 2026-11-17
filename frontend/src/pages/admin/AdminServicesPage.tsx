import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Briefcase,
  Layers,
  Plus,
  ShieldCheck,
  Ban,
  CheckCircle,
  FolderPlus,
  AlertCircle,
  RefreshCw,
  Building2,
  FileCheck,
  FolderKanban,
  AlertTriangle,
  ChevronRight,
  Eye,
  Star,
  FileText,
  Clock,
  CheckSquare,
  HelpCircle,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const AdminServicesPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalServices: 0,
    totalProviders: 0,
    totalRequests: 0,
    totalQuotations: 0,
    totalProjects: 0,
    totalCategories: 11,
    totalComplaints: 0,
    pendingVerifications: 0,
  });

  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "services"
    | "providers"
    | "categories"
    | "enquiries"
    | "quotations"
    | "projects"
    | "reviews"
    | "complaints"
    | "audit_logs"
  >("overview");

  const [services, setServices] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Verification Modal State
  const [selectedProviderForVerify, setSelectedProviderForVerify] = useState<any | null>(null);
  const [verifyStatus, setVerifyStatus] = useState("fully_verified");
  const [verifyReason, setVerifyReason] = useState("");
  const [providerDocuments, setProviderDocuments] = useState<any[]>([]);

  // Complaint Resolution Modal State
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Category & Subcategory Form States
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("FileCheck");
  const [selectedCatId, setSelectedCatId] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [newSubDesc, setNewSubDesc] = useState("");

  const fetchAdminData = () => {
    setIsLoading(true);
    Promise.all([
      fetch(`${API_BASE}/business-services/admin/stats`).then((r) => r.json()).catch(() => ({})),
      fetch(`${API_BASE}/business-services?limit=100`).then((r) => r.json()).catch(() => ({})),
      fetch(`${API_BASE}/business-services/admin/providers`).then((r) => r.json()).catch(() => ({})),
      fetch(`${API_BASE}/business-services/categories`).then((r) => r.json()).catch(() => ({})),
      fetch(`${API_BASE}/business-services/admin/requests`).then((r) => r.json()).catch(() => ({})),
      fetch(`${API_BASE}/business-services/admin/quotations`).then((r) => r.json()).catch(() => ({})),
      fetch(`${API_BASE}/business-services/admin/projects`).then((r) => r.json()).catch(() => ({})),
      fetch(`${API_BASE}/business-services/admin/reviews`).then((r) => r.json()).catch(() => ({})),
      fetch(`${API_BASE}/business-services/admin/complaints`).then((r) => r.json()).catch(() => ({})),
      fetch(`${API_BASE}/business-services/admin/audit-logs`).then((r) => r.json()).catch(() => ({})),
    ])
      .then(([statsRes, servRes, provRes, catRes, enqRes, quotRes, projRes, revRes, compRes, auditRes]) => {
        if (statsRes.success && statsRes.data) setStats(statsRes.data);
        if (servRes.success && servRes.data) setServices(servRes.data);
        if (provRes.success && provRes.data) setProviders(provRes.data);
        if (catRes.success && catRes.data) {
          setCategories(catRes.data);
          if (catRes.data.length > 0 && !selectedCatId) {
            setSelectedCatId(catRes.data[0].id);
          }
        }
        if (enqRes.success && enqRes.data) setEnquiries(enqRes.data);
        if (quotRes.success && quotRes.data) setQuotations(quotRes.data);
        if (projRes.success && projRes.data) setProjects(projRes.data);
        if (revRes.success && revRes.data) setReviews(revRes.data);
        if (compRes.success && compRes.data) setComplaints(compRes.data);
        if (auditRes.success && auditRes.data) setAuditLogs(auditRes.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleServiceStatus = async (serviceId: string, currentStatus: boolean) => {
    if (!user) return;
    const reason = prompt(
      `Enter reason for ${!currentStatus ? "approving" : "suspending"} this service listing:`
    );
    if (reason === null) return;

    try {
      const res = await fetch(`${API_BASE}/business-services/admin/services/${serviceId}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_active: !currentStatus,
          admin_id: user.id,
          reason,
        }),
      });
      const data = await res.json();
      if (data.success) fetchAdminData();
    } catch {
      alert("Failed to moderate service listing.");
    }
  };

  const handleOpenProviderVerify = async (provider: any) => {
    setSelectedProviderForVerify(provider);
    setVerifyStatus(provider.verification_level || "fully_verified");
    try {
      const res = await fetch(`${API_BASE}/business-services/providers/${provider.id}/documents`);
      const d = await res.json();
      if (d.success) setProviderDocuments(d.data || []);
      else setProviderDocuments([]);
    } catch {
      setProviderDocuments([]);
    }
  };

  const handleVerifyProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProviderForVerify) return;

    try {
      const res = await fetch(`${API_BASE}/business-services/admin/providers/${selectedProviderForVerify.id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verification_level: verifyStatus,
          admin_id: user.id,
          reason: verifyReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedProviderForVerify(null);
        setVerifyReason("");
        fetchAdminData();
      } else {
        alert(data.error || "Failed to update verification.");
      }
    } catch {
      alert("Network error.");
    }
  };

  const handleToggleReviewVerified = async (reviewId: string, currentVerified: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/business-services/admin/reviews/${reviewId}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_verified: !currentVerified }),
      });
      const data = await res.json();
      if (data.success) fetchAdminData();
    } catch {
      alert("Failed to update review status.");
    }
  };

  const handleResolveComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedComplaint) return;

    try {
      const res = await fetch(`${API_BASE}/business-services/admin/complaints/${selectedComplaint.id}/resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          resolution_notes: resolutionNotes,
          admin_id: user.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedComplaint(null);
        setResolutionNotes("");
        fetchAdminData();
      } else {
        alert(data.error || "Failed to resolve complaint.");
      }
    } catch {
      alert("Network error.");
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/business-services/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName.trim(),
          description: newCatDesc.trim() || null,
          icon: newCatIcon,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewCatName("");
        setNewCatDesc("");
        fetchAdminData();
      }
    } catch {
      alert("Failed to create category.");
    }
  };

  const handleCreateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatId || !newSubName.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/business-services/subcategories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: selectedCatId,
          name: newSubName.trim(),
          description: newSubDesc.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewSubName("");
        setNewSubDesc("");
        fetchAdminData();
      }
    } catch {
      alert("Failed to create subcategory.");
    }
  };

  return (
    <div className="bg-stone-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-stone-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-amber-400" />
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  Business Services Marketplace Governance
                </h1>
              </div>
              <p className="text-xs text-stone-400">
                End-to-end administration: 11 core categories, service providers verification, listings moderation, RFQ enquiries, quotations, projects, and dispute arbitration.
              </p>
            </div>
            <button
              onClick={fetchAdminData}
              className="py-2 px-3.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 self-start md:self-auto border border-stone-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Tab Navigation (10 Main Ecosystem Modules) */}
        <div className="flex items-center gap-2 border-b border-stone-200 pb-3 overflow-x-auto text-xs font-bold no-scrollbar">
          {[
            { id: "overview", label: "Overview & KPIs" },
            { id: "categories", label: `Categories (${categories.length})` },
            { id: "providers", label: `Providers (${providers.length})` },
            { id: "services", label: `Services (${services.length})` },
            { id: "enquiries", label: `Enquiries (${enquiries.length})` },
            { id: "quotations", label: `Quotations (${quotations.length})` },
            { id: "projects", label: `Projects (${projects.length})` },
            { id: "reviews", label: `Reviews (${reviews.length})` },
            { id: "complaints", label: `Disputes (${complaints.length})` },
            { id: "audit_logs", label: `Audit Logs (${auditLogs.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-3.5 rounded-xl whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "bg-stone-900 text-white shadow-xs"
                  : "bg-white text-stone-600 hover:bg-stone-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW METRICS */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
                <span className="text-stone-500 text-xs font-semibold uppercase tracking-wider block">
                  Total Service Providers
                </span>
                <div className="text-2xl font-black text-stone-900 mt-2">{stats.totalProviders || providers.length}</div>
                <div className="text-[11px] text-amber-600 font-medium mt-1">
                  Pending Review: {stats.pendingVerifications || providers.filter((p) => p.verification_level === "unverified").length}
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
                <span className="text-stone-500 text-xs font-semibold uppercase tracking-wider block">
                  Active Service Listings
                </span>
                <div className="text-2xl font-black text-blue-700 mt-2">{stats.totalServices || services.length}</div>
                <div className="text-[11px] text-stone-500 font-medium mt-1">Multi-tier packages enabled</div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
                <span className="text-stone-500 text-xs font-semibold uppercase tracking-wider block">
                  Total Enquiries (RFQ)
                </span>
                <div className="text-2xl font-black text-stone-900 mt-2">{stats.totalRequests || enquiries.length}</div>
                <div className="text-[11px] text-stone-500 font-medium mt-1">Guest & authenticated leads</div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
                <span className="text-stone-500 text-xs font-semibold uppercase tracking-wider block">
                  Active Projects
                </span>
                <div className="text-2xl font-black text-purple-700 mt-2">{stats.totalProjects || projects.length}</div>
                <div className="text-[11px] text-stone-500 font-medium mt-1">Milestone execution phase</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
                <span className="text-stone-500 text-xs font-semibold uppercase tracking-wider block">
                  Service Quotations
                </span>
                <div className="text-2xl font-black text-stone-900 mt-2">{stats.totalQuotations || quotations.length}</div>
                <div className="text-[11px] text-stone-500 font-medium mt-1">Submitted proposals</div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
                <span className="text-stone-500 text-xs font-semibold uppercase tracking-wider block">
                  Verified Categories (A to K)
                </span>
                <div className="text-2xl font-black text-emerald-700 mt-2">{stats.totalCategories || 11}</div>
                <div className="text-[11px] text-stone-500 font-medium mt-1">Comprehensive B2B domains</div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
                <span className="text-stone-500 text-xs font-semibold uppercase tracking-wider block">
                  Open Complaints / Disputes
                </span>
                <div className="text-2xl font-black text-amber-600 mt-2">{stats.totalComplaints || complaints.length}</div>
                <div className="text-[11px] text-stone-500 font-medium mt-1">Active arbitration queue</div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
                <span className="text-stone-500 text-xs font-semibold uppercase tracking-wider block">
                  Published Reviews
                </span>
                <div className="text-2xl font-black text-stone-900 mt-2">{reviews.length}</div>
                <div className="text-[11px] text-emerald-600 font-medium mt-1">Verified buyer sign-offs</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CATEGORIES & SUBCATEGORIES */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Create Category */}
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="font-bold text-base text-stone-900">Add Service Category</h3>
                <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">Category Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Environmental Consulting"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full p-2.5 border border-stone-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="w-full p-2.5 border border-stone-200 rounded-lg"
                    />
                  </div>
                  <button type="submit" className="py-2 px-5 bg-stone-900 text-white font-bold rounded-xl">
                    Create Category
                  </button>
                </form>
              </div>

              {/* Create Subcategory */}
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="font-bold text-base text-stone-900">Add Subcategory</h3>
                <form onSubmit={handleCreateSubcategory} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">Parent Category *</label>
                    <select
                      value={selectedCatId}
                      onChange={(e) => setSelectedCatId(e.target.value)}
                      className="w-full p-2.5 border border-stone-200 rounded-lg bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">Subcategory Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Carbon Footprint Auditing"
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      className="w-full p-2.5 border border-stone-200 rounded-lg"
                    />
                  </div>
                  <button type="submit" className="py-2 px-5 bg-stone-900 text-white font-bold rounded-xl">
                    Create Subcategory
                  </button>
                </form>
              </div>
            </div>

            {/* List all 11 Categories & their Subcategories */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
              <h3 className="font-extrabold text-base text-stone-900 pb-3 border-b border-stone-100 mb-4">
                Core Category Hierarchy ({categories.length})
              </h3>
              <div className="space-y-4">
                {categories.map((cat, idx) => (
                  <div key={cat.id || idx} className="border border-stone-200 rounded-xl p-4 bg-stone-50/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-sm text-stone-900 flex items-center gap-2">
                          <span className="text-xs bg-stone-200 text-stone-700 px-2 py-0.5 rounded font-mono">
                            #{cat.sort_order || idx + 1}
                          </span>
                          {cat.name}
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">{cat.description}</p>
                      </div>
                      <span className="text-xs font-semibold text-stone-600 bg-white px-2.5 py-1 rounded-lg border border-stone-200 self-start sm:self-auto">
                        {cat.subcategories?.length || 0} Subcategories
                      </span>
                    </div>

                    {cat.subcategories && cat.subcategories.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-stone-200/60 flex flex-wrap gap-1.5">
                        {cat.subcategories.map((sub: any) => (
                          <span
                            key={sub.id}
                            className="bg-white border border-stone-200 px-2.5 py-1 rounded text-[11px] text-stone-700"
                          >
                            {sub.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PROVIDERS & VERIFICATION */}
        {activeTab === "providers" && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
            <h3 className="font-extrabold text-base text-stone-900 pb-3 border-b border-stone-100 mb-4">
              Registered Service Providers ({providers.length})
            </h3>
            {providers.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">No service providers registered.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Business / Firm Name</th>
                      <th className="py-3 px-3">Location</th>
                      <th className="py-3 px-3">Verification Level</th>
                      <th className="py-3 px-3">Registered On</th>
                      <th className="py-3 px-3 text-right">Governance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {providers.map((p) => (
                      <tr key={p.id} className="hover:bg-stone-50">
                        <td className="py-3 px-3 font-bold text-stone-900">{p.name}</td>
                        <td className="py-3 px-3 text-stone-600">{p.city}, {p.state}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              p.verification_level === "fully_verified" || p.verification_level === "verified"
                                ? "bg-emerald-100 text-emerald-800"
                                : p.verification_level === "basic_verified"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {p.verification_level}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-stone-500 font-mono text-[11px]">
                          {new Date(p.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleOpenProviderVerify(p)}
                            className="py-1 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-lg transition"
                          >
                            Audit Verification
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SERVICES MODERATION */}
        {activeTab === "services" && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
            <h3 className="font-extrabold text-base text-stone-900 pb-3 border-b border-stone-100 mb-4">
              Published Service Listings Moderation ({services.length})
            </h3>
            {services.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">No service listings found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Service Title</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Provider Firm</th>
                      <th className="py-3 px-3">Pricing Model</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Moderation Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {services.map((s) => (
                      <tr key={s.id} className="hover:bg-stone-50">
                        <td className="py-3 px-3 font-bold text-stone-900">{s.title}</td>
                        <td className="py-3 px-3 text-stone-600">{s.business_service_categories?.name || "Services"}</td>
                        <td className="py-3 px-3 font-semibold text-stone-800">{s.businesses?.name}</td>
                        <td className="py-3 px-3 capitalize">{s.pricing_model?.replace(/_/g, " ")}</td>
                        <td className="py-3 px-3">
                          {s.is_active ? (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              Active
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-100 text-red-800">
                              Suspended
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleToggleServiceStatus(s.id, s.is_active)}
                            className={`py-1 px-3 rounded-lg text-xs font-bold transition ${
                              s.is_active
                                ? "bg-red-50 text-red-700 hover:bg-red-100"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {s.is_active ? "Suspend Listing" : "Approve Listing"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: ENQUIRIES & RFQs */}
        {activeTab === "enquiries" && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
            <h3 className="font-extrabold text-base text-stone-900 pb-3 border-b border-stone-100 mb-4">
              Customer Enquiries & RFQ Tracking ({enquiries.length})
            </h3>
            {enquiries.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">No service enquiries found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Request #</th>
                      <th className="py-3 px-3">Requirement Title</th>
                      <th className="py-3 px-3">Target Provider / Category</th>
                      <th className="py-3 px-3">Client Contact</th>
                      <th className="py-3 px-3">Budget</th>
                      <th className="py-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {enquiries.map((e) => (
                      <tr key={e.id} className="hover:bg-stone-50">
                        <td className="py-3 px-3 font-mono font-bold text-stone-900">{e.request_number}</td>
                        <td className="py-3 px-3 font-semibold text-stone-800">{e.title}</td>
                        <td className="py-3 px-3 text-stone-600">{e.businesses?.name || e.business_service_categories?.name || "Broadcast"}</td>
                        <td className="py-3 px-3 text-stone-600">{e.guest_email || e.guest_name || "Registered User"}</td>
                        <td className="py-3 px-3 font-bold text-stone-900">
                          {e.budget ? `₹${Number(e.budget).toLocaleString("en-IN")}` : "Flexible"}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                            {e.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: QUOTATIONS */}
        {activeTab === "quotations" && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
            <h3 className="font-extrabold text-base text-stone-900 pb-3 border-b border-stone-100 mb-4">
              Submitted Service Quotations ({quotations.length})
            </h3>
            {quotations.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">No quotations logged.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Quotation #</th>
                      <th className="py-3 px-3">Provider Firm</th>
                      <th className="py-3 px-3">Scope / SOW</th>
                      <th className="py-3 px-3">Price</th>
                      <th className="py-3 px-3">Turnaround</th>
                      <th className="py-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {quotations.map((q) => (
                      <tr key={q.id} className="hover:bg-stone-50">
                        <td className="py-3 px-3 font-mono font-bold text-stone-900">{q.quotation_number}</td>
                        <td className="py-3 px-3 font-semibold text-stone-800">{q.businesses?.name || "Provider"}</td>
                        <td className="py-3 px-3 text-stone-600 line-clamp-1">{q.scope_of_work}</td>
                        <td className="py-3 px-3 font-bold text-stone-900">₹{Number(q.quoted_price).toLocaleString("en-IN")}</td>
                        <td className="py-3 px-3 text-stone-600">{q.turnaround_days} Days</td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            q.status === "accepted" ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-700"
                          }`}>
                            {q.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: PROJECTS */}
        {activeTab === "projects" && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
            <h3 className="font-extrabold text-base text-stone-900 pb-3 border-b border-stone-100 mb-4">
              Active & Completed Service Projects ({projects.length})
            </h3>
            {projects.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">No projects currently tracked.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Project #</th>
                      <th className="py-3 px-3">Project Title</th>
                      <th className="py-3 px-3">Provider Firm</th>
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Agreed Price</th>
                      <th className="py-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {projects.map((proj) => (
                      <tr key={proj.id} className="hover:bg-stone-50">
                        <td className="py-3 px-3 font-mono font-bold text-stone-900">{proj.project_number}</td>
                        <td className="py-3 px-3 font-semibold text-stone-800">{proj.title}</td>
                        <td className="py-3 px-3 text-stone-600">{proj.businesses?.name || "Provider"}</td>
                        <td className="py-3 px-3 text-stone-600">{proj.users?.full_name || "Customer"}</td>
                        <td className="py-3 px-3 font-bold text-stone-900">₹{Number(proj.agreed_price).toLocaleString("en-IN")}</td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            proj.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                          }`}>
                            {proj.status.replace("_", " ")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 8: REVIEWS MODERATION */}
        {activeTab === "reviews" && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
            <h3 className="font-extrabold text-base text-stone-900 pb-3 border-b border-stone-100 mb-4">
              Verified Customer Reviews Moderation ({reviews.length})
            </h3>
            {reviews.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">No customer reviews submitted.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Rating</th>
                      <th className="py-3 px-3">Review Feedback</th>
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Provider Firm</th>
                      <th className="py-3 px-3">Verified Status</th>
                      <th className="py-3 px-3 text-right">Moderation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {reviews.map((rev) => (
                      <tr key={rev.id} className="hover:bg-stone-50">
                        <td className="py-3 px-3 font-bold text-amber-500">★ {rev.rating}/5</td>
                        <td className="py-3 px-3 text-stone-700 italic max-w-xs">{rev.review_text}</td>
                        <td className="py-3 px-3 text-stone-600">{rev.users?.full_name || "Buyer"}</td>
                        <td className="py-3 px-3 text-stone-600">{rev.businesses?.name || "Provider"}</td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            rev.is_verified ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {rev.is_verified ? "Verified" : "Unverified"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleToggleReviewVerified(rev.id, rev.is_verified)}
                            className="py-1 px-3 border border-stone-300 rounded text-stone-700 hover:bg-stone-100 font-bold text-xs"
                          >
                            {rev.is_verified ? "Flag / Hide" : "Verify Review"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 9: COMPLAINTS & DISPUTES */}
        {activeTab === "complaints" && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
            <h3 className="font-extrabold text-base text-stone-900 pb-3 border-b border-stone-100 mb-4">
              Disputes & Complaints Queue ({complaints.length})
            </h3>
            {complaints.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">No active complaints logged.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Complaint #</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Provider Firm</th>
                      <th className="py-3 px-3">Complainant</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Arbitration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {complaints.map((c) => (
                      <tr key={c.id} className="hover:bg-stone-50">
                        <td className="py-3 px-3 font-mono font-bold text-stone-900">{c.complaint_number}</td>
                        <td className="py-3 px-3 font-semibold text-stone-800">{c.complaint_type}</td>
                        <td className="py-3 px-3 text-stone-600">{c.businesses?.name || "Provider"}</td>
                        <td className="py-3 px-3 text-stone-600">{c.users?.full_name || "Client"}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              c.status === "resolved"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setSelectedComplaint(c)}
                            className="py-1 px-3 bg-stone-900 text-white font-bold text-xs rounded-lg"
                          >
                            Resolve Dispute
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 10: AUDIT LOGS */}
        {activeTab === "audit_logs" && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
            <h3 className="font-extrabold text-base text-stone-900 pb-3 border-b border-stone-100 mb-4">
              Governance & Verification Audit Trail ({auditLogs.length})
            </h3>
            {auditLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">No administrative audit records logged.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Timestamp</th>
                      <th className="py-3 px-3">Target Provider</th>
                      <th className="py-3 px-3">Administrative Action</th>
                      <th className="py-3 px-3">State Change</th>
                      <th className="py-3 px-3">Reason / Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-stone-50">
                        <td className="py-3 px-3 font-mono text-stone-500 text-[11px]">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-semibold text-stone-900">{log.businesses?.name || "Business"}</td>
                        <td className="py-3 px-3 font-bold text-stone-800">{log.action}</td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-mono">
                            {log.previous_status || "none"} → {log.new_status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-stone-600">{log.reason || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MODAL: AUDIT VERIFICATION */}
        {selectedProviderForVerify && (
          <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="font-bold text-base text-stone-900">
                Audit Provider: {selectedProviderForVerify.name}
              </h3>

              {/* Uploaded Documents List */}
              {providerDocuments.length > 0 && (
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-2">
                  <div className="text-[10px] font-bold text-stone-500 uppercase">Uploaded Compliance Documents</div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {providerDocuments.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-stone-200">
                        <span className="font-medium text-stone-800">{doc.document_type}</span>
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <Eye className="w-3 h-3" /> View
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleVerifyProvider} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">
                    Verification Level
                  </label>
                  <select
                    value={verifyStatus}
                    onChange={(e) => setVerifyStatus(e.target.value)}
                    className="w-full p-2.5 border border-stone-200 rounded-lg bg-white"
                  >
                    <option value="fully_verified">Fully Verified (Full Trust Badge)</option>
                    <option value="basic_verified">Basic Verified (Identity & GST Confirmed)</option>
                    <option value="unverified">Unverified (Pending Documentation)</option>
                    <option value="suspended">Suspended (Restricted Access)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">
                    Audit Note / Reason
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Enter compliance verification remarks..."
                    value={verifyReason}
                    onChange={(e) => setVerifyReason(e.target.value)}
                    className="w-full p-2.5 border border-stone-200 rounded-lg"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProviderForVerify(null)}
                    className="py-2 px-4 bg-stone-100 text-stone-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-5 bg-stone-900 text-white font-bold rounded-xl"
                  >
                    Save Verification
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: RESOLVE COMPLAINT */}
        {selectedComplaint && (
          <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="font-bold text-base text-stone-900">
                Arbitrate Dispute: {selectedComplaint.complaint_number}
              </h3>
              <p className="text-xs text-stone-600 bg-stone-50 p-3 rounded-lg">
                <strong>Description:</strong> {selectedComplaint.description}
              </p>
              <form onSubmit={handleResolveComplaint} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">
                    Administrative Resolution Notes *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Detail the agreed resolution, refunds or deliverables adjustment..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="w-full p-2.5 border border-stone-200 rounded-lg"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedComplaint(null)}
                    className="py-2 px-4 bg-stone-100 text-stone-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-5 bg-emerald-700 text-white font-bold rounded-xl"
                  >
                    Confirm Resolution
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
