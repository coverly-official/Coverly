import React, { useCallback, useEffect, useState } from "react";
import {
  ShieldCheck,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  FileText,
  ExternalLink,
  Sliders,
  Eye,
  Lock,
  AlertTriangle,
  UserCheck,
  X,
  MessageSquarePlus,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

interface AdminMetrics {
  total: number;
  pending_review: number;
  under_review: number;
  verified: number;
  rejected: number;
  resubmission_required: number;
  expired: number;
}

interface AdminApplication {
  id: string;
  user_id: string;
  business_id?: string | null;
  role_code: string;
  business_type?: string | null;
  document_type: string;
  verification_method: string;
  status: string;
  risk_status?: string | null;
  masked_identifier?: string | null;
  rejection_reason?: string | null;
  internal_notes?: string | null;
  assigned_reviewer_id?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  expires_at?: string | null;
  created_at: string;
  users?: { id: string; full_name: string; email: string; phone?: string };
  businesses?: { id: string; name: string; business_type?: string; city?: string; state?: string; verification_level?: string };
  documents?: { id: string; document_type: string; original_filename: string; mime_type: string; file_size_bytes: number; uploaded_at: string }[];
  consents?: { id: string; document_type: string; consent_text_version: string; verification_method: string; accepted_at: string }[];
  history?: { id: string; actor_role: string; previous_status: string | null; new_status: string; public_note: string | null; created_at: string }[];
}

const ALL_ROLES = [
  "all",
  "buyer",
  "retailer",
  "manufacturer",
  "wholesaler",
  "distributor",
  "raw_material_supplier",
  "packaging_supplier",
  "importer_exporter",
  "logistics_partner",
  "transporter",
  "service_provider",
  "sales_agent",
];

const DOC_TYPES = [
  "all",
  "pan",
  "aadhaar_offline",
  "identity_alt",
  "gst_certificate",
  "udyam_certificate",
  "business_registration",
  "iec_certificate",
  "transport_license",
  "warehouse_license",
  "service_credential",
  "address_proof",
  "bank_proof",
];

const STATUS_OPTIONS = [
  "all",
  "pending_verification",
  "submitted",
  "under_review",
  "verified",
  "rejected",
  "resubmission_required",
  "expired",
];

const STATUS_STYLE: Record<string, string> = {
  pending_verification: "bg-amber-50 text-amber-800 border-amber-200",
  submitted: "bg-blue-50 text-blue-800 border-blue-200",
  under_review: "bg-indigo-50 text-indigo-800 border-indigo-200",
  verified: "bg-emerald-50 text-emerald-800 border-emerald-200",
  rejected: "bg-red-50 text-red-800 border-red-200",
  resubmission_required: "bg-orange-50 text-orange-800 border-orange-200",
  expired: "bg-rose-50 text-rose-800 border-rose-200",
};

function getAdminHeaders(): Record<string, string> {
  const userId = localStorage.getItem("coverly_user_id") || "";
  const token = localStorage.getItem("auth_token") || "";
  return {
    ...(userId ? { "x-user-id": userId } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const AdminVerificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"queue" | "config">("queue");
  const [metrics, setMetrics] = useState<AdminMetrics>({
    total: 0,
    pending_review: 0,
    under_review: 0,
    verified: 0,
    rejected: 0,
    resubmission_required: 0,
    expired: 0,
  });
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 6 Filters
  const [roleFilter, setRoleFilter] = useState("all");
  const [businessTypeFilter, setBusinessTypeFilter] = useState("all");
  const [docTypeFilter, setDocTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Selected application drawer
  const [selectedApp, setSelectedApp] = useState<AdminApplication | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [reasonInput, setReasonInput] = useState("");
  const [internalNoteInput, setInternalNoteInput] = useState("");
  const [expiryInput, setExpiryInput] = useState("");

  // Config tab state
  const [configData, setConfigData] = useState<any>(null);
  const [cfgRole, setCfgRole] = useState("manufacturer");
  const [cfgDocType, setCfgDocType] = useState("gst_certificate");
  const [cfgDisplayName, setCfgDisplayName] = useState("GST Registration Certificate");
  const [cfgRequired, setCfgRequired] = useState(false);
  const [cfgMaxMb, setCfgMaxMb] = useState(5);
  const [cfgInstructions, setCfgInstructions] = useState("");
  const [cfgSaving, setCfgSaving] = useState(false);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (businessTypeFilter !== "all") params.set("business_type", businessTypeFilter);
      if (docTypeFilter !== "all") params.set("document_type", docTypeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (riskFilter !== "all") params.set("risk_status", riskFilter);
      if (fromDateFilter) params.set("from_date", fromDateFilter);

      const res = await fetch(`${API_BASE}/kyc/admin/applications?${params.toString()}`, {
        headers: getAdminHeaders(),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error || "Unable to load verification queue.");
      } else {
        setMetrics(body.data.metrics || metrics);
        const list: AdminApplication[] = body.data.applications || [];
        setApplications(list);
        if (selectedApp) {
          const refreshed = list.find((a) => a.id === selectedApp.id);
          if (refreshed) setSelectedApp(refreshed);
        }
      }
    } catch {
      setError("Network error while loading verification queue.");
    } finally {
      setLoading(false);
    }
  }, [roleFilter, businessTypeFilter, docTypeFilter, statusFilter, riskFilter, fromDateFilter]);

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/kyc/admin/config`, { headers: getAdminHeaders() });
      const body = await res.json();
      if (res.ok && body.success) {
        setConfigData(body.data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    if (activeTab === "config") loadConfig();
  }, [activeTab, loadConfig]);

  const performAction = async (
    action: "approve" | "reject" | "request_resubmission" | "mark_under_review" | "add_internal_note" | "assign_reviewer"
  ) => {
    if (!selectedApp) return;
    if ((action === "reject" || action === "request_resubmission") && !reasonInput.trim()) {
      setFeedback({ type: "error", text: "A clear reason is mandatory when rejecting or requesting resubmission." });
      return;
    }
    if (action === "add_internal_note" && !internalNoteInput.trim()) {
      setFeedback({ type: "error", text: "Enter an internal compliance note first." });
      return;
    }

    setActionBusy(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/kyc/admin/applications/${selectedApp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAdminHeaders() },
        body: JSON.stringify({
          action,
          rejection_reason: reasonInput.trim() || undefined,
          internal_note: internalNoteInput.trim() || undefined,
          expires_at: expiryInput ? new Date(expiryInput).toISOString() : undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setFeedback({ type: "error", text: body.error || "Action failed." });
      } else {
        setFeedback({ type: "success", text: body.message || "Verification record updated." });
        if (action === "add_internal_note") setInternalNoteInput("");
        if (action === "reject" || action === "request_resubmission") setReasonInput("");
        await loadQueue();
      }
    } catch {
      setFeedback({ type: "error", text: "Network error updating verification record." });
    } finally {
      setActionBusy(false);
    }
  };

  const inspectPrivateDocument = async (docId: string) => {
    try {
      const res = await fetch(`${API_BASE}/kyc/documents/${docId}/access`, {
        headers: getAdminHeaders(),
      });
      if (!res.ok) {
        setFeedback({ type: "error", text: "Access denied or document unavailable in private vault." });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setFeedback({ type: "error", text: "Failed to stream private document." });
    }
  };

  const saveConfigRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setCfgSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/kyc/admin/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAdminHeaders() },
        body: JSON.stringify({
          role_code: cfgRole,
          document_type: cfgDocType,
          display_name: cfgDisplayName,
          is_required: cfgRequired,
          max_size_mb: cfgMaxMb,
          instructions: cfgInstructions,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setFeedback({ type: "error", text: body.error || "Failed to save rule." });
      } else {
        setFeedback({ type: "success", text: "Role verification requirement saved and audited." });
        await loadConfig();
      }
    } catch {
      setFeedback({ type: "error", text: "Network error saving configuration." });
    } finally {
      setCfgSaving(false);
    }
  };

  const filteredApps = applications.filter((a) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      a.users?.full_name?.toLowerCase().includes(q) ||
      a.users?.email?.toLowerCase().includes(q) ||
      a.businesses?.name?.toLowerCase().includes(q) ||
      a.document_type.toLowerCase().includes(q) ||
      a.role_code.toLowerCase().includes(q)
    );
  });

  const metricCards = [
    { label: "Total Applications", value: metrics.total, cls: "border-stone-200 text-stone-900" },
    { label: "Pending Review", value: metrics.pending_review, cls: "border-amber-200 text-amber-800 bg-amber-50/40" },
    { label: "Under Review", value: metrics.under_review, cls: "border-indigo-200 text-indigo-800 bg-indigo-50/40" },
    { label: "Verified", value: metrics.verified, cls: "border-emerald-200 text-emerald-800 bg-emerald-50/40" },
    { label: "Rejected", value: metrics.rejected, cls: "border-red-200 text-red-800 bg-red-50/40" },
    { label: "Resubmission Req.", value: metrics.resubmission_required, cls: "border-orange-200 text-orange-800 bg-orange-50/40" },
    { label: "Expired", value: metrics.expired, cls: "border-rose-200 text-rose-800 bg-rose-50/40" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            Admin Verification Center (Centralized KYC)
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Review identity &amp; business verification submissions across all 12 ecosystem roles with private vault inspection and full audit logging.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-stone-200 bg-white p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("queue")}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                activeTab === "queue" ? "bg-stone-900 text-white" : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Applications Queue
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("config")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md transition cursor-pointer ${
                activeTab === "config" ? "bg-stone-900 text-white" : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Rules &amp; Limits
            </button>
          </div>
          <button
            type="button"
            onClick={loadQueue}
            className="p-2 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 cursor-pointer"
            title="Refresh queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7 Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {metricCards.map((m) => (
          <div key={m.label} className={`rounded-xl border bg-white p-3.5 ${m.cls}`}>
            <div className="text-[11px] font-medium opacity-80 truncate">{m.label}</div>
            <div className="text-2xl font-bold mt-1 tabular-nums">{m.value}</div>
          </div>
        ))}
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-[11px] underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {activeTab === "queue" ? (
        <>
          {/* 6 Filters Bar + Search */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5 text-xs">
            <div className="relative lg:col-span-2">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search user, email, business..."
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-2 rounded-lg border border-stone-200 bg-white"
              aria-label="Filter by Role"
            >
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r === "all" ? "All Roles" : r.replace(/_/g, " ")}
                </option>
              ))}
            </select>

            <select
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
              className="px-2.5 py-2 rounded-lg border border-stone-200 bg-white"
              aria-label="Filter by Document Type"
            >
              {DOC_TYPES.map((d) => (
                <option key={d} value={d}>
                  {d === "all" ? "All Documents" : d.replace(/_/g, " ")}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-2 rounded-lg border border-stone-200 bg-white"
              aria-label="Filter by Status"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All Statuses" : s.replace(/_/g, " ")}
                </option>
              ))}
            </select>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-2.5 py-2 rounded-lg border border-stone-200 bg-white"
              aria-label="Filter by Risk Status"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>

            <input
              type="date"
              value={fromDateFilter}
              onChange={(e) => setFromDateFilter(e.target.value)}
              className="px-2.5 py-2 rounded-lg border border-stone-200 bg-white"
              aria-label="From Date"
            />
          </div>

          {/* Applications Table */}
          <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Applicant &amp; Business</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Document Type</th>
                    <th className="py-3 px-4">Masked Ref</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Submitted</th>
                    <th className="py-3 px-4 text-right">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-stone-400">
                        Loading verification applications...
                      </td>
                    </tr>
                  ) : filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-stone-500">
                        No verification applications match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredApps.map((app) => (
                      <tr key={app.id} className="hover:bg-stone-50/70 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-stone-900">
                            {app.users?.full_name || "Registered User"}
                          </div>
                          <div className="text-[11px] text-stone-500">
                            {app.businesses?.name || app.users?.email || app.user_id.slice(0, 8)}
                          </div>
                        </td>
                        <td className="py-3 px-4 capitalize text-stone-700">
                          {app.role_code.replace(/_/g, " ")}
                        </td>
                        <td className="py-3 px-4 font-medium text-stone-800 capitalize">
                          {app.document_type.replace(/_/g, " ")}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-stone-600">
                          {app.masked_identifier || "—"}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${
                              STATUS_STYLE[app.status] || "bg-stone-100 text-stone-700 border-stone-200"
                            }`}
                          >
                            {app.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-stone-500">
                          {app.submitted_at
                            ? new Date(app.submitted_at).toLocaleDateString()
                            : new Date(app.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedApp(app);
                              setReasonInput(app.rejection_reason || "");
                              setInternalNoteInput("");
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-semibold cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Configurable Rules & Limits Tab */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={saveConfigRule} className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-stone-900">Configure Role Requirement &amp; File Limit</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Customize whether a document is Required or Optional per role and adjust file upload limits (capped at platform ceiling {configData?.safe_platform_max_mb || 15} MB).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Role</label>
                <select
                  value={cfgRole}
                  onChange={(e) => setCfgRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white"
                >
                  {ALL_ROLES.filter((r) => r !== "all").map((r) => (
                    <option key={r} value={r}>
                      {r.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Document Type</label>
                <select
                  value={cfgDocType}
                  onChange={(e) => setCfgDocType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white"
                >
                  {DOC_TYPES.filter((d) => d !== "all").map((d) => (
                    <option key={d} value={d}>
                      {d.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={cfgDisplayName}
                  onChange={(e) => setCfgDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Max Size (MB, 1–15)</label>
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={cfgMaxMb}
                  onChange={(e) => setCfgMaxMb(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-semibold text-stone-700 mb-1">Instructions</label>
              <textarea
                rows={2}
                value={cfgInstructions}
                onChange={(e) => setCfgInstructions(e.target.value)}
                placeholder="Guidance shown to users in the Verification Center..."
                className="w-full px-3 py-2 rounded-lg border border-stone-200"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-stone-800 cursor-pointer">
              <input
                type="checkbox"
                checked={cfgRequired}
                onChange={(e) => setCfgRequired(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-emerald-700"
              />
              Mark as Required for this role (unchecked = Optional)
            </label>

            <button
              type="submit"
              disabled={cfgSaving}
              className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
            >
              {cfgSaving ? "Saving..." : "Save Configuration"}
            </button>
          </form>

          <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-3 text-xs">
            <h2 className="text-sm font-bold text-stone-900">Active Platform Safety Guardrails</h2>
            <div className="space-y-2 text-stone-700">
              <p>
                <strong>Platform Hard Upload Ceiling:</strong> {configData?.safe_platform_max_mb || 15} MB (magic-bytes verified, executables/HTML/SVG blocked).
              </p>
              <p>
                <strong>OTP Cooldown &amp; Abuse Protection:</strong>{" "}
                {configData?.otp_limits?.cooldownSeconds || 60}s resend cooldown &middot; Max{" "}
                {configData?.otp_limits?.maxPerHourPerDestination || 5} sends/hr per destination &middot; Max{" "}
                {configData?.otp_limits?.maxVerifyAttempts || 5} verify attempts.
              </p>
              <p>
                <strong>Private Storage Bucket:</strong> <code>kyc-private</code> (private non-public access, every admin inspection logged).
              </p>
            </div>
            {(configData?.custom_requirements || []).length > 0 && (
              <div className="pt-3 border-t border-stone-100">
                <p className="font-semibold text-stone-900 mb-2">Custom Overrides Saved:</p>
                <ul className="space-y-1.5">
                  {configData.custom_requirements.map((cr: any) => (
                    <li
                      key={`${cr.role_code}-${cr.document_type}`}
                      className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-200"
                    >
                      <span className="capitalize">
                        {cr.role_code.replace(/_/g, " ")} &middot; {cr.document_type.replace(/_/g, " ")}
                      </span>
                      <span className="text-[11px] font-semibold">
                        {cr.is_required ? "Required" : "Optional"} &middot; {cr.max_size_mb} MB
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Application Detail Review Drawer */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex justify-end bg-stone-950/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl h-full overflow-y-auto shadow-2xl border-l border-stone-200 flex flex-col">
            <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between sticky top-0 z-10">
              <div>
                <h2 className="text-sm font-bold capitalize">
                  {selectedApp.document_type.replace(/_/g, " ")} Review
                </h2>
                <p className="text-[11px] text-stone-300">
                  {selectedApp.users?.full_name} &middot; {selectedApp.role_code.replace(/_/g, " ")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 flex-1 text-xs">
              {/* Applicant & Business Metadata */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-stone-50 border border-stone-200">
                <div>
                  <span className="text-[10px] uppercase text-stone-400 font-semibold">Applicant</span>
                  <p className="font-bold text-stone-900">{selectedApp.users?.full_name || "—"}</p>
                  <p className="text-[11px] text-stone-500">{selectedApp.users?.email}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-stone-400 font-semibold">Business</span>
                  <p className="font-bold text-stone-900">{selectedApp.businesses?.name || "Individual / Personal"}</p>
                  <p className="text-[11px] text-stone-500 capitalize">
                    {selectedApp.businesses?.city || selectedApp.role_code.replace(/_/g, " ")}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-stone-400 font-semibold">Masked Identifier</span>
                  <p className="font-mono font-semibold text-stone-800">{selectedApp.masked_identifier || "None"}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-stone-400 font-semibold">Current Status</span>
                  <p className="font-semibold capitalize text-emerald-800">
                    {selectedApp.status.replace(/_/g, " ")}
                  </p>
                </div>
              </div>

              {/* Private Vault Documents */}
              <div className="space-y-2">
                <h3 className="font-bold text-stone-900 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-700" />
                  Private KYC Documents (Audited Access)
                </h3>
                {(selectedApp.documents || []).length === 0 ? (
                  <p className="text-stone-500">No attached documents found.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedApp.documents!.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 rounded-xl border border-stone-200 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-stone-900 truncate">{doc.original_filename}</p>
                            <p className="text-[11px] text-stone-500">
                              {doc.mime_type} &middot; {(doc.file_size_bytes / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => inspectPrivateDocument(doc.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold shrink-0 cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Document
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Legal Consents */}
              {(selectedApp.consents || []).length > 0 && (
                <div className="space-y-1.5">
                  <h3 className="font-bold text-stone-900">Recorded Legal Consents</h3>
                  {selectedApp.consents!.map((c) => (
                    <div key={c.id} className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 text-[11px]">
                      <span className="font-semibold text-emerald-950">{c.consent_text_version}</span> &middot;{" "}
                      {new Date(c.accepted_at).toLocaleString()}
                    </div>
                  ))}
                </div>
              )}

              {/* Compliance Review Actions */}
              <div className="space-y-3 pt-2 border-t border-stone-200">
                <h3 className="font-bold text-stone-900">Review Decision</h3>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Rejection / Resubmission Reason (Required for Reject or Request Resubmission)
                  </label>
                  <textarea
                    rows={2}
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    placeholder="e.g., Document image is blurry or GSTIN does not match business legal name..."
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Optional Verification Expiry Date
                  </label>
                  <input
                    type="date"
                    value={expiryInput}
                    onChange={(e) => setExpiryInput(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-stone-200"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => performAction("approve")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve (Manual Review)
                  </button>
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => performAction("mark_under_review")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Under Review
                  </button>
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => performAction("request_resubmission")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Request Resubmission
                  </button>
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => performAction("reject")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => performAction("assign_reviewer")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Assign to Me
                  </button>
                </div>
              </div>

              {/* Internal Admin-Only Notes (Strictly Never Exposed to End Users) */}
              <div className="space-y-2 pt-3 border-t border-stone-200">
                <h3 className="font-bold text-stone-900">Internal Compliance Notes (Admin-Only)</h3>
                {selectedApp.internal_notes && (
                  <pre className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-[11px] whitespace-pre-wrap font-sans text-stone-800">
                    {selectedApp.internal_notes}
                  </pre>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={internalNoteInput}
                    onChange={(e) => setInternalNoteInput(e.target.value)}
                    placeholder="Add internal reviewer note (hidden from user)..."
                    className="flex-1 px-3 py-2 rounded-lg border border-stone-200"
                  />
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => performAction("add_internal_note")}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-900 text-white font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    Save Note
                  </button>
                </div>
              </div>

              {/* History */}
              {(selectedApp.history || []).length > 0 && (
                <div className="space-y-1.5 pt-3 border-t border-stone-200">
                  <h3 className="font-bold text-stone-900">Audit &amp; Review History</h3>
                  <div className="space-y-1.5">
                    {selectedApp.history!.map((h) => (
                      <div key={h.id} className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-[11px]">
                        <div className="flex items-center justify-between font-semibold text-stone-800">
                          <span className="capitalize">
                            {(h.previous_status || "new").replace(/_/g, " ")} &rarr; {h.new_status.replace(/_/g, " ")}
                          </span>
                          <span className="text-stone-400">{new Date(h.created_at).toLocaleString()}</span>
                        </div>
                        {h.public_note && <p className="text-stone-600 mt-0.5">{h.public_note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
