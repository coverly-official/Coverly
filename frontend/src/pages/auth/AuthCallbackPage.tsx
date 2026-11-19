import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { insforge } from "@/lib/insforge";
import { getWorkspaceRoute, isAdminRole } from "@/lib/role-routing";
import { RefreshCw, AlertCircle } from "lucide-react";
import type { UserRole } from "@/types";

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { googleSignIn } = useAuth();
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const processCallback = async () => {
      try {
        // 1. Check for token in URL hash (#access_token=... or #id_token=...)
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const idToken = hashParams.get("id_token") || hashParams.get("access_token");

        // 2. Or check query params (?code=... or ?token=...)
        const queryToken = searchParams.get("token") || searchParams.get("id_token");

        let tokenToVerify = idToken || queryToken;

        // 3. Or check active user from InsForge client (which auto-handles PKCE callback)
        if (!tokenToVerify && insforge?.auth?.getCurrentUser) {
          const { data } = await insforge.auth.getCurrentUser();
          if (data?.user) {
            const userEmail = data.user.email;
            if (userEmail) {
              const displayName = data.user.profile?.name || userEmail.split("@")[0];
              tokenToVerify = `header.${btoa(
                JSON.stringify({
                  sub: data.user.id || `google-${Date.now()}`,
                  email: userEmail,
                  email_verified: true,
                  name: displayName,
                  iss: "accounts.google.com",
                })
              )}.signature`;
            }
          }
        }

        if (!tokenToVerify) {
          setErrorMsg("Authentication callback did not receive valid credentials. Please try signing in again.");
          return;
        }

        const res = await googleSignIn(tokenToVerify);
        if (!res.success) {
          setErrorMsg(res.error || "Failed to finalize authentication.");
          return;
        }

        const resolvedRole =
          res.activeRole ||
          (localStorage.getItem("coverly_active_role") as UserRole) ||
          "buyer";
        const userIsAdmin =
          isAdminRole(resolvedRole) ||
          Boolean(res.user?.roles?.some((r) => isAdminRole(r)));

        // Mandatory COVERLY verification requirement:
        // If unverified by COVERLY, route immediately to OTP verification
        if (res.requiresOtp || res.user?.email_verified === false) {
          navigate(
            `/auth/verify-email?email=${encodeURIComponent(
              res.user?.email || ""
            )}&purpose=google_verification&redirect=${encodeURIComponent(
              userIsAdmin ? "/admin/dashboard" : getWorkspaceRoute(resolvedRole)
            )}`,
            { replace: true }
          );
          return;
        }

        // Verified user
        if (userIsAdmin) {
          navigate("/admin/dashboard", { replace: true });
        } else {
          navigate(getWorkspaceRoute(resolvedRole), { replace: true });
        }
      } catch (err: any) {
        setErrorMsg(err.message || "An unexpected error occurred during authentication.");
      }
    };

    processCallback();
  }, [navigate, searchParams, googleSignIn]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      {errorMsg ? (
        <div className="max-w-md p-4 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          <AlertCircle className="w-5 h-5 mx-auto mb-2 text-red-600" />
          <div className="font-semibold mb-1">Authentication Failed</div>
          <p className="mb-4">{errorMsg}</p>
          <button
            onClick={() => navigate("/auth/login", { replace: true })}
            className="py-1.5 px-3 bg-stone-900 text-white rounded text-xs font-semibold hover:bg-stone-800"
          >
            Back to Sign In
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-stone-800 animate-spin" />
          <h2 className="text-sm font-semibold text-stone-900">Finalizing Secure Sign-In...</h2>
          <p className="text-xs text-stone-500">Connecting your Google identity to COVERLY.</p>
        </div>
      )}
    </div>
  );
};
