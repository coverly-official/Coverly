import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, Upload, CheckCircle2, FileText, ArrowRight } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const SupplierVerificationPage: React.FC = () => {
  const { business } = useAuth();
  const [tier, setTier] = useState<string>("document_verified");
  const [docType, setDocType] = useState<string>("gstin_cert");
  const [fileUrl, setFileUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/verifications/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: business.id,
          verification_tier: tier,
          documents: [
            {
              doc_type: docType,
              file_url: fileUrl.trim() || `https://storage.coverly.in/docs/${business.id}/${docType}.pdf`,
              file_key: `${business.id}/${docType}.pdf`,
            },
          ],
        }),
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.error || "Failed to submit verification request.");
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit verification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Business Verification Center</h1>
        <p className="text-xs text-stone-500 mt-1">
          Submit official regulatory documents to unlock verified badges and receive priority RFQ matching
        </p>
      </div>

      {/* Current Status Card */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs mb-8 flex items-center justify-between">
        <div>
          <div className="text-[11px] text-stone-500 uppercase tracking-wider font-semibold">
            Current Verification Tier
          </div>
          <div className="text-lg font-bold text-stone-900 mt-1 capitalize flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            {business?.verification_level.replace("_", " ") || "Unverified"}
          </div>
        </div>

        <div className="text-right text-xs text-stone-500 max-w-xs">
          Distinct tiers: Phone Verified, Email Verified, Document Verified, Registration Checked.
        </div>
      </div>

      {submitted ? (
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center shadow-xs">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-900">Verification Submitted</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 mb-4">
            Our verification compliance team has received your documents. Applications are audited within 12 business hours.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="text-xs font-semibold text-stone-900 underline"
          >
            Submit Another Document
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
            Submit Compliance Audit Request
          </h3>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Target Verification Tier</label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className="w-full text-xs p-2.5 border border-stone-200 rounded-lg bg-white"
            >
              <option value="document_verified">Document Verified (GSTIN & PAN Certification)</option>
              <option value="registration_checked">Registration Checked (Factory License / MSME Udyam)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Document Category</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full text-xs p-2.5 border border-stone-200 rounded-lg bg-white"
            >
              <option value="gstin_cert">GSTIN Registration Certificate (Form REG-06)</option>
              <option value="pan_card">Company PAN Card</option>
              <option value="factory_license">Factory Manufacturing License</option>
              <option value="msme_udyam">MSME Udyam Certificate</option>
              <option value="iec">Import Export Code (IEC)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Document Cloud URL or Storage Path
            </label>
            <input
              type="text"
              placeholder="e.g. https://storage.coverly.in/documents/gstin-cert.pdf"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="w-full text-xs p-2.5 border border-stone-200 rounded-lg"
            />
            <span className="text-[10px] text-stone-400 mt-1 block">
              Leave blank to submit with standard verified account registry reference.
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? "Submitting for Audit..." : "Submit Documents for Verification"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  );
};
