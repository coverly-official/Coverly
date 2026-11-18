import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldAlert, ArrowRight, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const VerificationBanner: React.FC = () => {
  const { user, business } = useAuth();
  const location = useLocation();
  const [dismissed, setDismissed] = useState(false);
  const [status, setStatus] = useState<{
    overall_status: string;
    completion_percent: number;
  } | null>(null);

  const isOnVerificationPage = location.pathname.includes("/verification");

  useEffect(() => {
    if (!user?.id || isOnVerificationPage) return;
    let active = true;
    const query = business?.id ? `?business_id=${encodeURIComponent(business.id)}` : "";
    fetch(`${API_BASE}/kyc/overview${query}`, {
      headers: {
        "x-user-id": user.id,
        ...(localStorage.getItem("auth_token")
          ? { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
          : {}),
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (!active || !body?.success || !body?.data?.profile) return;
        setStatus({
          overall_status: body.data.profile.overall_status || "not_started",
          completion_percent: body.data.profile.completion_percent || 0,
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user?.id, business?.id, isOnVerificationPage]);

  if (!user || isOnVerificationPage || dismissed) return null;
  if (status && status.overall_status === "verified") return null;

  const pct = status?.completion_percent ?? 0;

  return (
    <div className="mb-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-stone-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-semibold text-stone-900">
            Complete your profile and business verification to unlock eligible platform features.
          </p>
          <p className="text-[11px] text-stone-600 mt-0.5">
            Verification progress: <strong className="text-emerald-800">{pct}%</strong> &middot; Verify mobile, email, and role-specific KYC documents in the Verification Center.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          to="/account/verification"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition"
        >
          <span>Verification Center</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss verification banner"
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
