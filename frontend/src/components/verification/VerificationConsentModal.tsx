import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Lock, AlertCircle, X, FileCheck2 } from "lucide-react";

interface VerificationConsentModalProps {
  open: boolean;
  documentType: string;
  documentLabel: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (consentPayload: {
    consent_accepted: boolean;
    consent_policy_version: string;
    aadhaar_alternative_disclosed: boolean;
  }) => void;
}

const POLICY_VERSION = "2026-11-18-v1";

export const VerificationConsentModal: React.FC<VerificationConsentModalProps> = ({
  open,
  documentType,
  documentLabel,
  isSubmitting = false,
  onClose,
  onConfirm,
}) => {
  const [consentChecked, setConsentChecked] = useState(false);
  const [aadhaarAltChecked, setAadhaarAltChecked] = useState(false);

  if (!open) return null;

  const isAadhaar = documentType === "aadhaar_offline";
  const canProceed = consentChecked && (!isAadhaar || aadhaarAltChecked) && !isSubmitting;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kyc-consent-title"
    >
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 id="kyc-consent-title" className="text-sm font-bold">
                Document Verification &amp; Privacy Consent
              </h3>
              <p className="text-[11px] text-stone-300">
                Submitting: {documentLabel} &middot; Policy {POLICY_VERSION}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-stone-700 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-950">How COVERLY processes this document</p>
              <ul className="list-disc pl-4 mt-1 space-y-1 text-[11px] text-emerald-900">
                <li>
                  Your document is stored in private, non-public storage accessible only to you and authorized COVERLY compliance reviewers.
                </li>
                <li>
                  Verification is performed via <strong>COVERLY Manual Compliance Review</strong> (unless a licensed verification partner is explicitly configured). We never misrepresent manual review as live government database integration.
                </li>
                <li>
                  Your consent timestamp, policy version, and review audit trail are recorded strictly for legal and fraud-prevention compliance.
                </li>
              </ul>
            </div>
          </div>

          {isAadhaar && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="font-semibold text-amber-950">
                  Voluntary Aadhaar Offline Verification Disclosure
                </p>
                <p className="text-[11px] text-amber-900">
                  Submitting Aadhaar Offline XML / Secure QR is <strong>100% voluntary</strong>. You may choose an alternative Government ID (PAN, Passport, Driving Licence, or Voter ID) instead without losing access to verification.
                </p>
                <p className="text-[11px] text-amber-900">
                  COVERLY <strong>never collects or stores raw 12-digit Aadhaar numbers</strong>. Only masked reference indicators (last 4 digits at most) and verification outcome metadata are retained.
                </p>
              </div>
            </div>
          )}

          {/* Policy Links */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-stone-500 pt-1">
            <Link to="/kyc-privacy-notice" target="_blank" className="text-emerald-800 underline hover:text-emerald-950">
              KYC Privacy Notice
            </Link>
            <Link to="/identity-verification-consent" target="_blank" className="text-emerald-800 underline hover:text-emerald-950">
              Identity Verification Consent
            </Link>
            {isAadhaar && (
              <Link
                to="/aadhaar-offline-verification-notice"
                target="_blank"
                className="text-emerald-800 underline hover:text-emerald-950"
              >
                Aadhaar Offline Notice
              </Link>
            )}
            <Link to="/document-retention-policy" target="_blank" className="text-emerald-800 underline hover:text-emerald-950">
              Document Retention Policy
            </Link>
            <Link to="/verification-terms" target="_blank" className="text-emerald-800 underline hover:text-emerald-950">
              Verification Terms
            </Link>
          </div>

          {/* Checkboxes */}
          <div className="space-y-2.5 pt-2 border-t border-stone-100">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-stone-300 text-emerald-700 focus:ring-emerald-600"
              />
              <span className="text-[11px] text-stone-800">
                I voluntarily submit this authentic <strong>{documentLabel}</strong> for identity/business compliance verification and consent to COVERLY processing it under the KYC Privacy Notice and Document Retention Policy. <span className="text-red-600">*</span>
              </span>
            </label>

            {isAadhaar && (
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aadhaarAltChecked}
                  onChange={(e) => setAadhaarAltChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-stone-300 text-emerald-700 focus:ring-emerald-600"
                />
                <span className="text-[11px] text-stone-800">
                  I acknowledge that Aadhaar Offline verification is voluntary, that alternative Government IDs are available, and that I have not uploaded an unmasked raw Aadhaar number in plain text. <span className="text-red-600">*</span>
                </span>
              </label>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canProceed}
            onClick={() =>
              onConfirm({
                consent_accepted: true,
                consent_policy_version: POLICY_VERSION,
                aadhaar_alternative_disclosed: isAadhaar ? aadhaarAltChecked : false,
              })
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition disabled:opacity-40 cursor-pointer"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            {isSubmitting ? "Submitting..." : "Consent & Submit for Review"}
          </button>
        </div>
      </div>
    </div>
  );
};
