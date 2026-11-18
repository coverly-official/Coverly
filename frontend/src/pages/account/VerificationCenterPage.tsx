import React, { useCallback, useEffect, useState } from "react";
import {
  ShieldCheck,
  Smartphone,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  FileCheck2,
  ExternalLink,
  History,
  Info,
  Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { LiquidUploadCard, type UploadedKycDoc } from "@/components/verification/LiquidUploadCard";
import { VerificationConsentModal } from "@/components/verification/VerificationConsentModal";
import { VerificationBadges, type VerificationBadgeState } from "@/components/verification/VerificationBadges";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

interface RoleRequirement {
  document_type: string;
  display_name: string;
  description?: string;
  category?: string;
  is_required: boolean;
  allowed_extensions: string[];
  max_size_mb: number;
  instructions?: string;
}

interface SubmissionRecord {
  id: string;
  document_type: string;
  verification_method: string;
  status: string;
  masked_identifier?: string | null;
  rejection_reason?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  expires_at?: string | null;
  updated_at?: string | null;
}

interface HistoryRecord {
  id: string;
  submission_id: string;
  actor_role: string;
  previous_status: string | null;
  new_status: string;
  public_note: string | null;
  created_at: string;
}

interface OverviewData {
  profile: {
    overall_status: string;
    completion_percent: number;
    mobile_verified: boolean;
    email_verified: boolean;
    role_code: string;
  };
  role: string;
  requirements: RoleRequirement[];
  submissions: SubmissionRecord[];
  documents: (UploadedKycDoc & { submission_id?: string | null })[];
  history: HistoryRecord[];
  badges: VerificationBadgeState;
}

const STATUS_BADGE_MAP: Record<string, { label: string; cls: string }> = {
  not_started: { label: "Not Started", cls: "bg-stone-100 text-stone-600 border-stone-200" },
  draft: { label: "Draft", cls: "bg-stone-100 text-stone-700 border-stone-200" },
  uploaded: { label: "Uploaded", cls: "bg-sky-50 text-sky-800 border-sky-200" },
  submitted: { label: "Submitted", cls: "bg-blue-50 text-blue-800 border-blue-200" },
  pending_verification: { label: "Pending Verification", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  under_review: { label: "Under Review", cls: "bg-indigo-50 text-indigo-800 border-indigo-200" },
  partially_verified: { label: "Partially Verified", cls: "bg-teal-50 text-teal-800 border-teal-200" },
  verified: { label: "Verified", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  rejected: { label: "Rejected", cls: "bg-red-50 text-red-800 border-red-200" },
  resubmission_required: { label: "Resubmission Required", cls: "bg-orange-50 text-orange-800 border-orange-200" },
  expired: { label: "Expired", cls: "bg-rose-50 text-rose-800 border-rose-200" },
  suspended: { label: "Suspended", cls: "bg-red-100 text-red-900 border-red-300" },
};

function getAuthHeaders(): Record<string, string> {
  const userId = localStorage.getItem("coverly_user_id") || "";
  const token = localStorage.getItem("auth_token") || "";
  return {
    ...(userId ? { "x-user-id": userId } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getIdentifierMeta(docType: string): { label: string; placeholder: string; hint: string } | null {
  switch (docType) {
    case "pan":
      return {
        label: "PAN Number (Optional Format Pre-Check)",
        placeholder: "e.g., ABCDE1234F",
        hint: "Stored masked (e.g., AB*****34F). Verified via COVERLY Manual Compliance Review.",
      };
    case "gst_certificate":
      return {
        label: "15-Character GSTIN",
        placeholder: "e.g., 27ABCDE1234F1Z5",
        hint: "Format validated before manual compliance verification.",
      };
    case "udyam_certificate":
      return {
        label: "Udyam Registration Number",
        placeholder: "e.g., UDYAM-MH-01-0012345",
        hint: "Optional for micro/small/medium enterprises.",
      };
    case "iec_certificate":
      return {
        label: "Import Export Code (IEC)",
        placeholder: "10-character IEC code",
        hint: "Required for international importers & exporters.",
      };
    default:
      return null;
  }
}

export const VerificationCenterPage: React.FC = () => {
  const { user, business, activeRole } = useAuth();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local uploaded docs & identifier values keyed by document_type
  const [uploadedByType, setUploadedByType] = useState<Record<string, UploadedKycDoc>>({});
  const [identifierByType, setIdentifierByType] = useState<Record<string, string>>({});
  const [consentTarget, setConsentTarget] = useState<RoleRequirement | null>(null);
  const [submittingDoc, setSubmittingDoc] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Mobile & Email OTP state
  const [countryCode, setCountryCode] = useState("+91");
  const [mobileInput, setMobileInput] = useState(user?.phone || "");
  const [mobileChallengeId, setMobileChallengeId] = useState<string | null>(null);
  const [mobileOtp, setMobileOtp] = useState("");
  const [mobileCooldown, setMobileCooldown] = useState(0);
  const [mobileFeedback, setMobileFeedback] = useState<string | null>(null);
  const [mobileBusy, setMobileBusy] = useState(false);

  const [emailInput, setEmailInput] = useState(user?.email || "");
  const [emailChallengeId, setEmailChallengeId] = useState<string | null>(null);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [emailFeedback, setEmailFeedback] = useState<string | null>(null);
  const [emailBusy, setEmailBusy] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  useEffect(() => {
    document.title = "Verification Center | COVERLY";
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "noindex, nofollow");
  }, []);

  useEffect(() => {
    if (mobileCooldown <= 0) return;
    const t = setTimeout(() => setMobileCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [mobileCooldown]);

  useEffect(() => {
    if (emailCooldown <= 0) return;
    const t = setTimeout(() => setEmailCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [emailCooldown]);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (business?.id) params.set("business_id", business.id);
      if (activeRole && activeRole !== "guest") params.set("role", activeRole);
      const res = await fetch(`${API_BASE}/kyc/overview?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error || "Failed to load verification profile.");
      } else {
        setOverview(body.data);
        const unsubmitted: Record<string, UploadedKycDoc> = {};
        for (const doc of body.data.documents || []) {
          if (doc.upload_status === "uploaded" && !unsubmitted[doc.document_type]) {
            unsubmitted[doc.document_type] = doc;
          }
        }
        setUploadedByType((prev) => ({ ...unsubmitted, ...prev }));
      }
    } catch {
      setError("Unable to reach COVERLY verification service.");
    } finally {
      setLoading(false);
    }
  }, [business?.id, activeRole]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const sendOtp = async (channel: "mobile" | "email") => {
    const isMobile = channel === "mobile";
    const destination = isMobile ? mobileInput.trim() : emailInput.trim();
    if (!destination) {
      if (isMobile) setMobileFeedback("Enter your mobile number first.");
      else setEmailFeedback("Enter your email address first.");
      return;
    }

    if (isMobile) {
      setMobileBusy(true);
      setMobileFeedback(null);
    } else {
      setEmailBusy(true);
      setEmailFeedback(null);
    }

    try {
      const res = await fetch(`${API_BASE}/kyc/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          channel,
          destination,
          country_code: isMobile ? countryCode : undefined,
          website_url_hp: honeypot,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        const msg = body.error || "Unable to send OTP.";
        if (isMobile) {
          setMobileFeedback(msg);
          if (body.retry_after_seconds) setMobileCooldown(body.retry_after_seconds);
        } else {
          setEmailFeedback(msg);
          if (body.retry_after_seconds) setEmailCooldown(body.retry_after_seconds);
        }
      } else {
        const cooldown = body.data?.cooldown_seconds || 60;
        if (isMobile) {
          setMobileChallengeId(body.data?.challenge_id || null);
          setMobileCooldown(cooldown);
          setMobileFeedback(body.message || "OTP sent.");
        } else {
          setEmailChallengeId(body.data?.challenge_id || null);
          setEmailCooldown(cooldown);
          setEmailFeedback(body.message || "OTP sent.");
        }
      }
    } catch {
      if (isMobile) setMobileFeedback("Network error sending mobile OTP.");
      else setEmailFeedback("Network error sending email OTP.");
    } finally {
      if (isMobile) setMobileBusy(false);
      else setEmailBusy(false);
    }
  };

  const verifyOtp = async (channel: "mobile" | "email") => {
    const isMobile = channel === "mobile";
    const challengeId = isMobile ? mobileChallengeId : emailChallengeId;
    const code = isMobile ? mobileOtp.trim() : emailOtp.trim();
    if (!challengeId || !/^\d{6}$/.test(code)) {
      if (isMobile) setMobileFeedback("Enter the 6-digit OTP code.");
      else setEmailFeedback("Enter the 6-digit OTP code.");
      return;
    }
    if (isMobile) setMobileBusy(true);
    else setEmailBusy(true);

    try {
      const res = await fetch(`${API_BASE}/kyc/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          challenge_id: challengeId,
          channel,
          otp_code: code,
          business_id: business?.id || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        if (isMobile) setMobileFeedback(body.error || "Verification failed.");
        else setEmailFeedback(body.error || "Verification failed.");
      } else {
        if (isMobile) {
          setMobileFeedback("Mobile number verified.");
          setMobileOtp("");
          setMobileChallengeId(null);
        } else {
          setEmailFeedback("Email address verified.");
          setEmailOtp("");
          setEmailChallengeId(null);
        }
        await fetchOverview();
      }
    } catch {
      if (isMobile) setMobileFeedback("Network error verifying OTP.");
      else setEmailFeedback("Network error verifying OTP.");
    } finally {
      if (isMobile) setMobileBusy(false);
      else setEmailBusy(false);
    }
  };

  const handleConfirmSubmit = async (consentPayload: {
    consent_accepted: boolean;
    consent_policy_version: string;
    aadhaar_alternative_disclosed: boolean;
  }) => {
    if (!consentTarget) return;
    const doc = uploadedByType[consentTarget.document_type];
    if (!doc?.id) {
      setToastMsg({ type: "error", text: "Please upload the document file before submitting." });
      setConsentTarget(null);
      return;
    }

    setSubmittingDoc(true);
    setToastMsg(null);
    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const res = await fetch(`${API_BASE}/kyc/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          business_id: business?.id || null,
          document_type: consentTarget.document_type,
          document_id: doc.id,
          identifier_value: identifierByType[consentTarget.document_type]?.trim() || undefined,
          consent_accepted: consentPayload.consent_accepted,
          consent_text_version: `kyc-consent-${consentPayload.consent_policy_version}`,
          privacy_policy_version: consentPayload.consent_policy_version,
          terms_version: consentPayload.consent_policy_version,
          alternative_route_disclosed: consentPayload.aadhaar_alternative_disclosed,
          idempotency_key: idempotencyKey,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setToastMsg({ type: "error", text: body.error || "Failed to submit document for verification." });
      } else {
        setToastMsg({
          type: "success",
          text: `${consentTarget.display_name} submitted for compliance review.`,
        });
        setUploadedByType((prev) => {
          const next = { ...prev };
          delete next[consentTarget.document_type];
          return next;
        });
        setConsentTarget(null);
        await fetchOverview();
      }
    } catch {
      setToastMsg({ type: "error", text: "Network error submitting document." });
    } finally {
      setSubmittingDoc(false);
    }
  };

  const openPrivateDocument = async (docId: string) => {
    try {
      const res = await fetch(`${API_BASE}/kyc/documents/${docId}/access`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        setToastMsg({ type: "error", text: "Unable to open private document." });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setToastMsg({ type: "error", text: "Error loading private document." });
    }
  };

  if (loading && !overview) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="h-32 rounded-2xl bg-stone-100 animate-pulse mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-44 rounded-xl bg-stone-100 animate-pulse" />
          <div className="h-44 rounded-xl bg-stone-100 animate-pulse" />
        </div>
      </div>
    );
  }

  const profile = overview?.profile;
  const overallMeta = STATUS_BADGE_MAP[profile?.overall_status || "not_started"] || STATUS_BADGE_MAP.not_started;
  const requiredDocs = (overview?.requirements || []).filter((r) => r.is_required);
  const optionalDocs = (overview?.requirements || []).filter((r) => !r.is_required);

  const latestSubmissionByType = new Map<string, SubmissionRecord>();
  for (const sub of overview?.submissions || []) {
    if (!latestSubmissionByType.has(sub.document_type)) {
      latestSubmissionByType.set(sub.document_type, sub);
    }
  }

  const renderDocumentCard = (req: RoleRequirement) => {
    const sub = latestSubmissionByType.get(req.document_type);
    const stagedDoc = uploadedByType[req.document_type] || null;
    const submittedDoc = overview?.documents?.find((d) => d.submission_id === sub?.id) || null;
    const statusKey = sub?.status || (stagedDoc ? "uploaded" : "not_started");
    const statusMeta = STATUS_BADGE_MAP[statusKey] || STATUS_BADGE_MAP.not_started;
    const idMeta = getIdentifierMeta(req.document_type);
    const canUploadOrResubmit =
      !sub || ["rejected", "resubmission_required", "expired", "not_started", "draft"].includes(sub.status);

    return (
      <div
        key={req.document_type}
        className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-stone-900">{req.display_name}</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                  req.is_required
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-600 border border-stone-200"
                }`}
              >
                {req.is_required ? "Required" : "Optional"}
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-1">{req.description}</p>
            {req.instructions && (
              <p className="text-[11px] text-stone-500 mt-1 flex items-start gap-1">
                <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                <span>{req.instructions}</span>
              </p>
            )}
          </div>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 ${statusMeta.cls}`}
          >
            {statusKey === "verified" ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <Clock className="w-3.5 h-3.5" />
            )}
            {statusMeta.label}
          </span>
        </div>

        {/* Rejection / Resubmission Reason Banner */}
        {sub?.rejection_reason && ["rejected", "resubmission_required"].includes(sub.status) && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-800">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Action Required from Compliance Review:</p>
              <p className="text-[11px] mt-0.5">{sub.rejection_reason}</p>
            </div>
          </div>
        )}

        {/* Submitted Metadata Summary */}
        {sub && !canUploadOrResubmit && (
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="space-y-0.5">
              <p className="font-semibold text-stone-900">
                Verification Method:{" "}
                <span className="text-emerald-800">
                  {sub.verification_method === "manual_admin_review"
                    ? "COVERLY Manual Compliance Review"
                    : sub.verification_method.replace(/_/g, " ")}
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
                {sub.masked_identifier && <span>Reference: {sub.masked_identifier}</span>}
                {sub.submitted_at && (
                  <span>Submitted: {new Date(sub.submitted_at).toLocaleDateString()}</span>
                )}
                {sub.reviewed_at && (
                  <span>Reviewed: {new Date(sub.reviewed_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>
            {submittedDoc && (
              <button
                type="button"
                onClick={() => openPrivateDocument(submittedDoc.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 text-[11px] font-semibold transition cursor-pointer shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Uploaded File
              </button>
            )}
          </div>
        )}

        {/* Active Upload + Consent Submit Flow */}
        {canUploadOrResubmit && (
          <div className="space-y-3">
            {idMeta && (
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  {idMeta.label}
                </label>
                <input
                  type="text"
                  value={identifierByType[req.document_type] || ""}
                  onChange={(e) =>
                    setIdentifierByType((prev) => ({
                      ...prev,
                      [req.document_type]: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder={idMeta.placeholder}
                  className="w-full sm:max-w-sm text-xs px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
                <p className="text-[10px] text-stone-500 mt-1">{idMeta.hint}</p>
              </div>
            )}

            <LiquidUploadCard
              documentType={req.document_type}
              documentLabel={req.display_name}
              allowedExtensions={req.allowed_extensions}
              maxSizeMb={req.max_size_mb}
              businessId={business?.id || null}
              existingDocument={stagedDoc}
              onUploaded={(doc) =>
                setUploadedByType((prev) => ({ ...prev, [req.document_type]: doc }))
              }
              onRemoved={() =>
                setUploadedByType((prev) => {
                  const next = { ...prev };
                  delete next[req.document_type];
                  return next;
                })
              }
            />

            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-stone-500 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-700" />
                Private vault storage &middot; Explicit legal consent required before submission
              </p>
              <button
                type="button"
                disabled={!stagedDoc}
                onClick={() => setConsentTarget(req)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition disabled:opacity-40 cursor-pointer"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                {sub ? "Consent & Resubmit" : "Review Consent & Submit"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Progress Header Card */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-950 text-emerald-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-stone-900">COVERLY Verification Center</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${overallMeta.cls}`}>
                  {overallMeta.label}
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-1">
                Centralized Identity &amp; Business KYC for your{" "}
                <strong className="capitalize">{(overview?.role || activeRole).replace(/_/g, " ")}</strong>{" "}
                account{business?.name ? ` (${business.name})` : ""}.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchOverview}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition cursor-pointer self-start"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Status
          </button>
        </div>

        {/* Completion Bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-stone-700">Overall Verification Progress</span>
            <span className="text-emerald-800 tabular-nums">{profile?.completion_percent ?? 0}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-stone-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 transition-all duration-500"
              style={{ width: `${profile?.completion_percent ?? 0}%` }}
            />
          </div>
        </div>

        {/* 7 Individual Badges */}
        {overview?.badges && <VerificationBadges badges={overview.badges} />}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {toastMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            toastMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <span>{toastMsg.text}</span>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-[11px] font-semibold underline ml-3 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Hidden Honeypot Input for Anti-Bot OTP Abuse Protection */}
      <input
        type="text"
        name="website_url_hp"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      {/* Step 1: Mobile & Email OTP Verification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mobile OTP */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-stone-900">Mobile Verification (OTP)</h2>
            </div>
            {profile?.mobile_verified ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Verified
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                Action Needed
              </span>
            )}
          </div>

          {!profile?.mobile_verified ? (
            <div className="space-y-2.5">
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="text-xs px-2 py-2 rounded-lg border border-stone-200 bg-stone-50 font-medium"
                >
                  <option value="+91">+91 (IN)</option>
                  <option value="+1">+1 (US)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+971">+971 (AE)</option>
                  <option value="+65">+65 (SG)</option>
                </select>
                <input
                  type="tel"
                  value={mobileInput}
                  onChange={(e) => setMobileInput(e.target.value)}
                  placeholder="9876543210"
                  className="flex-1 text-xs px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
                <button
                  type="button"
                  disabled={mobileBusy || mobileCooldown > 0}
                  onClick={() => sendOtp("mobile")}
                  className="px-3 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition disabled:opacity-45 shrink-0 cursor-pointer"
                >
                  {mobileCooldown > 0 ? `Resend (${mobileCooldown}s)` : "Send OTP"}
                </button>
              </div>

              {mobileChallengeId && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={mobileOtp}
                    onChange={(e) => setMobileOtp(e.target.value.replace(/[^\d]/g, ""))}
                    placeholder="Enter 6-digit OTP"
                    className="flex-1 text-xs px-3 py-2 rounded-lg border border-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-700 tracking-widest font-mono"
                  />
                  <button
                    type="button"
                    disabled={mobileBusy || mobileOtp.length !== 6}
                    onClick={() => verifyOtp("mobile")}
                    className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition disabled:opacity-45 cursor-pointer"
                  >
                    Verify
                  </button>
                </div>
              )}

              {mobileFeedback && (
                <p className="text-[11px] text-stone-600 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5">
                  {mobileFeedback}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-emerald-800">
              Your mobile number is verified and secured for account recovery and B2B trust alerts.
            </p>
          )}
        </div>

        {/* Email OTP */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-stone-900">Email Verification (OTP)</h2>
            </div>
            {profile?.email_verified ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Verified
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                Action Needed
              </span>
            )}
          </div>

          {!profile?.email_verified ? (
            <div className="space-y-2.5">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@company.com"
                  className="flex-1 text-xs px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
                <button
                  type="button"
                  disabled={emailBusy || emailCooldown > 0}
                  onClick={() => sendOtp("email")}
                  className="px-3 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition disabled:opacity-45 shrink-0 cursor-pointer"
                >
                  {emailCooldown > 0 ? `Resend (${emailCooldown}s)` : "Send Code"}
                </button>
              </div>

              {emailChallengeId && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.replace(/[^\d]/g, ""))}
                    placeholder="Enter 6-digit code"
                    className="flex-1 text-xs px-3 py-2 rounded-lg border border-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-700 tracking-widest font-mono"
                  />
                  <button
                    type="button"
                    disabled={emailBusy || emailOtp.length !== 6}
                    onClick={() => verifyOtp("email")}
                    className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition disabled:opacity-45 cursor-pointer"
                  >
                    Verify
                  </button>
                </div>
              )}

              {emailFeedback && (
                <p className="text-[11px] text-stone-600 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5">
                  {emailFeedback}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-emerald-800">
              Your business email is verified for RFQ notifications and compliance updates.
            </p>
          )}
        </div>
      </div>

      {/* Required Role Documents */}
      {requiredDocs.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-bold text-stone-900">Required Role Documents</h2>
            <p className="text-xs text-stone-500">
              Complete these required verification documents for your{" "}
              <span className="capitalize">{(overview?.role || activeRole).replace(/_/g, " ")}</span> workspace.
            </p>
          </div>
          <div className="space-y-4">{requiredDocs.map(renderDocumentCard)}</div>
        </section>
      )}

      {/* Optional / Voluntary Documents */}
      {optionalDocs.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-bold text-stone-900">Optional &amp; Voluntary Trust Documents</h2>
            <p className="text-xs text-stone-500">
              Upload optional credentials (such as GSTIN, MSME/Udyam, or voluntary Aadhaar Offline XML/QR) to earn additional verified trust badges. Unregistered proprietorships are never forced to submit GST or CIN.
            </p>
          </div>
          <div className="space-y-4">{optionalDocs.map(renderDocumentCard)}</div>
        </section>
      )}

      {/* Verification History Timeline */}
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-700" />
          <h2 className="text-sm font-bold text-stone-900">Verification History</h2>
        </div>
        {(overview?.history || []).length === 0 ? (
          <p className="text-xs text-stone-500">
            No verification submissions recorded yet. Upload your first document above to begin.
          </p>
        ) : (
          <div className="divide-y divide-stone-100">
            {overview!.history.map((item) => (
              <div key={item.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <div>
                  <span className="font-semibold text-stone-900 capitalize">
                    {(item.previous_status || "new").replace(/_/g, " ")} &rarr;{" "}
                    {item.new_status.replace(/_/g, " ")}
                  </span>
                  {item.public_note && <p className="text-[11px] text-stone-600 mt-0.5">{item.public_note}</p>}
                </div>
                <span className="text-[11px] text-stone-400 shrink-0">
                  {new Date(item.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Dedicated Legal Consent Modal */}
      <VerificationConsentModal
        open={Boolean(consentTarget)}
        documentType={consentTarget?.document_type || ""}
        documentLabel={consentTarget?.display_name || ""}
        isSubmitting={submittingDoc}
        onClose={() => !submittingDoc && setConsentTarget(null)}
        onConfirm={handleConfirmSubmit}
      />
    </div>
  );
};
