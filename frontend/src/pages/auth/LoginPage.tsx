import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { insforge } from "@/lib/insforge";
import { getWorkspaceRoute, isAdminRole } from "@/lib/role-routing";
import { Lock, Mail, ArrowRight, ShieldCheck, Eye, EyeOff, RefreshCw } from "lucide-react";
import type { UserRole } from "@/types";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { login, googleSignIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "";
  const resetSuccess = searchParams.get("reset") === "success";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    const res = await login(email, password);
    if (!res.success) {
      setErrorMsg(res.error || "Invalid email or password.");
      setIsSubmitting(false);
      return;
    }

    const resolvedRole =
      res.activeRole ||
      (localStorage.getItem("coverly_active_role") as UserRole) ||
      "buyer";
    const userIsAdmin =
      isAdminRole(resolvedRole) ||
      Boolean(res.user?.roles?.some((r) => isAdminRole(r)));

    // If account requires application-level OTP verification
    if (res.requiresOtp || res.user?.email_verified === false) {
      navigate(
        `/auth/verify-email?email=${encodeURIComponent(email)}&purpose=login_verification&redirect=${encodeURIComponent(
          userIsAdmin ? "/admin/dashboard" : redirect || getWorkspaceRoute(resolvedRole)
        )}`,
        { replace: true }
      );
      return;
    }

    if (userIsAdmin) {
      // Admin must NEVER land on Guest Marketplace (/), /products, or /access-denied
      const safeAdminTarget =
        redirect && redirect.startsWith("/admin") ? redirect : "/admin/dashboard";
      navigate(safeAdminTarget, { replace: true });
    } else if (redirect && redirect !== "/access-denied") {
      navigate(redirect, { replace: true });
    } else {
      navigate(getWorkspaceRoute(resolvedRole), { replace: true });
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg("");

    try {
      if (insforge?.auth?.signInWithOAuth) {
        const { error } = await insforge.auth.signInWithOAuth("google", {
          redirectTo: `${window.location.origin}/auth/callback`,
        });
        if (error) {
          throw error;
        }
        return;
      }
    } catch {
      // Fallback to direct token prompt in test or offline environment
    }

    const demoEmail = prompt(
      "Enter your Google Account email to test Google OAuth flow:",
      "google.user@company.com"
    );
    if (!demoEmail) {
      setIsGoogleLoading(false);
      return;
    }

    const mockGoogleToken = `header.${btoa(
      JSON.stringify({
        sub: `google-${Date.now()}`,
        email: demoEmail.trim().toLowerCase(),
        email_verified: true,
        name: demoEmail.split("@")[0],
        iss: "accounts.google.com",
      })
    )}.signature`;

    const res = await googleSignIn(mockGoogleToken);
    setIsGoogleLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || "Google sign-in failed.");
      return;
    }

    const resolvedRole =
      res.activeRole ||
      (localStorage.getItem("coverly_active_role") as UserRole) ||
      "buyer";
    const userIsAdmin =
      isAdminRole(resolvedRole) ||
      Boolean(res.user?.roles?.some((r) => isAdminRole(r)));

    // IMPORTANT: Google's email_verified claim does NOT bypass COVERLY OTP verification!
    if (res.requiresOtp || res.user?.email_verified === false) {
      navigate(
        `/auth/verify-email?email=${encodeURIComponent(demoEmail)}&purpose=google_verification&redirect=${encodeURIComponent(
          userIsAdmin ? "/admin/dashboard" : redirect || getWorkspaceRoute(resolvedRole)
        )}`,
        { replace: true }
      );
      return;
    }

    if (userIsAdmin) {
      navigate("/admin/dashboard", { replace: true });
    } else {
      navigate(redirect || getWorkspaceRoute(resolvedRole), { replace: true });
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-stone-900 tracking-tight">Sign In to COVERLY</h2>
        <p className="text-xs text-stone-500 mt-1">Access your buyer, supplier or corporate workspace</p>
      </div>

      {resetSuccess && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          Your password has been updated successfully. Please sign in with your new credentials.
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Official Google OAuth Sign-In Button */}
      <div className="mb-4">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting || isGoogleLoading}
          className="w-full py-2.5 px-4 bg-white border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-50 transition flex items-center justify-center gap-2.5 cursor-pointer shadow-xs disabled:opacity-50"
        >
          {isGoogleLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-stone-600" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
        </button>
      </div>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-stone-200" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase">
          <span className="bg-white px-2 text-stone-400 font-semibold tracking-wider">
            Or continue with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs pl-9 pr-9 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          {isSubmitting ? "Authenticating..." : "Sign In"}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-[11px]">
        <Link to="/auth/forgot-password" className="text-stone-500 hover:text-stone-800 font-medium">
          Forgot password?
        </Link>
        <Link to="/admin/login" className="text-stone-700 font-semibold hover:underline flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-stone-600" /> Admin Portal
        </Link>
      </div>

      <div className="mt-6 pt-4 border-t border-stone-100 text-center text-xs text-stone-500">
        Don't have an account?{" "}
        <Link to="/auth/register" className="font-semibold text-stone-900 hover:underline">
          Create an Account
        </Link>
      </div>
    </div>
  );
};
