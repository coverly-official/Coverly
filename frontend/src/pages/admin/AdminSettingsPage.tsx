import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Settings,
  Shield,
  Save,
  CheckCircle,
  AlertTriangle,
  Lock,
  Globe,
  Bell,
  Cpu,
} from "lucide-react";

export const AdminSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [platformName, setPlatformName] = useState("COVERLY Enterprise");
  const [requireGstinVerification, setRequireGstinVerification] = useState(true);
  const [autoExpireQuotesDays, setAutoExpireQuotesDays] = useState(30);
  const [allowGuestEnquiries, setAllowGuestEnquiries] = useState(true);
  const [maxRfqAttachmentMb, setMaxRfqAttachmentMb] = useState(25);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          Platform Governance & Security Settings
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Compliance rules, quotation expiry windows, guest rate limits, and verification requirements.
        </p>
      </div>

      {isSaved && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          Platform configuration settings updated successfully.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Verification & Compliance */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-stone-900 font-bold text-sm border-b border-stone-100 pb-3">
            <Shield className="w-4 h-4 text-blue-700" />
            Verification & Regulatory Compliance
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requireGstinVerification}
                onChange={(e) => setRequireGstinVerification(e.target.checked)}
                className="w-4 h-4 rounded text-blue-900 border-stone-300 focus:ring-blue-900"
              />
              <span className="text-xs font-semibold text-stone-800">
                Enforce Mandatory GSTIN / IEC Verification before Supplier Listing Publication
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowGuestEnquiries}
                onChange={(e) => setAllowGuestEnquiries(e.target.checked)}
                className="w-4 h-4 rounded text-blue-900 border-stone-300 focus:ring-blue-900"
              />
              <span className="text-xs font-semibold text-stone-800">
                Allow Unregistered Guest Sourcing Enquiries (with cryptographic reference tokens)
              </span>
            </label>
          </div>
        </div>

        {/* Section 2: Quotation & RFQ Life-Cycle */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-stone-900 font-bold text-sm border-b border-stone-100 pb-3">
            <Globe className="w-4 h-4 text-emerald-700" />
            RFQ & Quotation Lifetimes
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Quotation Validity Duration (Days)
              </label>
              <input
                type="number"
                min={1}
                max={90}
                value={autoExpireQuotesDays}
                onChange={(e) => setAutoExpireQuotesDays(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800 bg-stone-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Max Document Attachment Size (MB)
              </label>
              <input
                type="number"
                min={5}
                max={100}
                value={maxRfqAttachmentMb}
                onChange={(e) => setMaxRfqAttachmentMb(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800 bg-stone-50"
              />
            </div>
          </div>
        </div>

        {/* Save CTA */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Save className="w-4 h-4" />
            Save Governance Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
