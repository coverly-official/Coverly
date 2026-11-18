import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LEGAL_DOCUMENTS, getLegalDocumentByPath } from "@/lib/legal-documents";
import { useAuth } from "@/context/AuthContext";
import { NotFoundPage } from "@/pages/shared/NotFoundPage";
import {
  ChevronRight,
  AlertCircle,
  FileText,
  CheckCircle2,
  Shield,
  SlidersHorizontal,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const LegalDocumentPage: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const doc = getLegalDocumentByPath(location.pathname);

  const [reqType, setReqType] = useState<"account_deletion" | "data_export" | "consent_withdrawal">(
    "account_deletion"
  );
  const [reqReason, setReqReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reqResult, setReqResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (!doc) {
    return <NotFoundPage resourceLabel="legal policy document" />;
  }

  const showPrivacyRequestTool =
    doc.slug === "account-deletion-policy" || doc.slug === "privacy-policy";

  const handlePrivacyRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setReqResult(null);
    try {
      const res = await fetch(`${API_BASE}/auth/privacy-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({ request_type: reqType, reason: reqReason }),
      });
      const json = await res.json();
      if (json.success) {
        setReqResult({
          ok: true,
          message: `Request recorded (Reference: ${json.data?.reference_id || "Logged"}). Our privacy team will process it per policy timelines.`,
        });
        setReqReason("");
      } else {
        setReqResult({ ok: false, message: json.error || "Unable to submit request right now." });
      }
    } catch {
      setReqResult({ ok: false, message: "Network error while submitting privacy request." });
    } finally {
      setSubmitting(false);
    }
  };

  const openCookiePreferences = () => {
    window.dispatchEvent(new CustomEvent("coverly:open-cookie-settings"));
  };

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-stone-500 mb-6">
          <Link to="/" className="hover:text-stone-900">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/legal" className="hover:text-stone-900">Legal Center</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-stone-900">{doc.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Legal Navigation */}
          <aside className="lg:col-span-4 xl:col-span-3 bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs lg:sticky lg:top-24">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 px-2 pb-2 border-b border-stone-100 mb-2">
              Legal Documentation
            </div>
            <nav className="space-y-0.5 max-h-[65vh] overflow-y-auto">
              {LEGAL_DOCUMENTS.map((item) => {
                const active = item.slug === doc.slug;
                return (
                  <Link
                    key={item.slug}
                    to={item.path}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition ${
                      active
                        ? "bg-blue-950 text-white font-bold"
                        : "text-stone-700 hover:bg-stone-100"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0 opacity-80" />
                    <span className="truncate">{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Right Main Document */}
          <article className="lg:col-span-8 xl:col-span-9 bg-white border border-stone-200 rounded-2xl p-6 sm:p-10 shadow-2xs space-y-6">
            <header className="border-b border-stone-200 pb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-bold uppercase tracking-wider mb-3">
                {doc.category}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-950 tracking-tight">
                {doc.title}
              </h1>
              <p className="text-xs text-stone-500 mt-2 font-mono">
                Version: {doc.version} • Last Updated: {doc.lastUpdated}
              </p>

              <div className="mt-4 flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Draft notice: Bracketed placeholders denote corporate legal details to be verified
                  and finalized by legal counsel prior to commercial publication.
                </span>
              </div>
            </header>

            <div className="space-y-6">
              {doc.sections.map((sec) => (
                <section key={sec.heading} className="space-y-2.5">
                  <h2 className="text-base font-bold text-stone-900">{sec.heading}</h2>
                  {sec.body.map((paragraph, i) => (
                    <p key={i} className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </section>
              ))}
            </div>

            {doc.slug === "cookie-policy" && (
              <div className="pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={openCookiePreferences}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 text-white text-xs font-semibold transition"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Manage Cookie Preferences
                </button>
              </div>
            )}

            {showPrivacyRequestTool && (
              <div className="mt-8 pt-6 border-t border-stone-200 bg-stone-50 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-900" />
                  <h3 className="text-sm font-bold text-stone-900">
                    Submit a Privacy, Consent Withdrawal or Account Deletion Request
                  </h3>
                </div>
                {!user ? (
                  <p className="text-xs text-stone-600">
                    Please{" "}
                    <Link to="/auth/login" className="font-bold text-blue-900 hover:underline">
                      sign in to your COVERLY account
                    </Link>{" "}
                    to submit an authenticated account deletion, consent withdrawal or data export
                    request.
                  </p>
                ) : (
                  <form onSubmit={handlePrivacyRequest} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Request Type
                        </label>
                        <select
                          value={reqType}
                          onChange={(e) => setReqType(e.target.value as any)}
                          className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900"
                        >
                          <option value="account_deletion">Account Deletion Request</option>
                          <option value="data_export">Personal Data Summary / Export</option>
                          <option value="consent_withdrawal">Withdraw Optional Marketing Consent</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Additional Details (Optional)
                        </label>
                        <input
                          type="text"
                          value={reqReason}
                          onChange={(e) => setReqReason(e.target.value)}
                          placeholder="Reason or reference details"
                          className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900"
                        />
                      </div>
                    </div>

                    {reqResult && (
                      <div
                        className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                          reqResult.ok
                            ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                            : "bg-red-50 border border-red-200 text-red-700"
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{reqResult.message}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold disabled:opacity-50"
                    >
                      {submitting ? "Submitting Request..." : "Submit Privacy Request"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </article>
        </div>
      </div>
    </div>
  );
};
