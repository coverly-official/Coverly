import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, RefreshCw, Eye, EyeOff } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") || searchParams.get("recovery_token") || "";
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [recoveryToken, setRecoveryToken] = useState(token);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim()) {
      setErrorMsg("Please enter your account email.");
      return;
    }

    if (!recoveryToken.trim()) {
      setErrorMsg("A valid recovery token is required. Please request a new recovery link.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          recoveryToken: recoveryToken.trim(),
          newPassword,
          confirmPassword,
        }),
      });

      const body = await res.json();
      setIsLoading(false);

      if (!res.ok || !body.success) {
        setErrorMsg(body.error || "Failed to reset password. The link may have expired.");
        return;
      }

      setSuccessMsg("Password successfully reset! Redirecting to sign in...");
      setTimeout(() => {
        navigate("/auth/login?reset=success", { replace: true });
      }, 1500);
    } catch {
      setIsLoading(false);
      setErrorMsg("Connection error while communicating with server.");
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 text-stone-900 mb-3 shadow-xs">
          <ShieldCheck className="w-6 h-6 text-emerald-700" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 tracking-tight">Create a New Password</h2>
        <p className="text-xs text-stone-500 mt-1">Set a fresh, secure password for your COVERLY account.</p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!emailParam && (
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Account Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
            />
          </div>
        )}

        {!token && (
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Recovery Token</label>
            <input
              type="text"
              required
              value={recoveryToken}
              onChange={(e) => setRecoveryToken(e.target.value)}
              placeholder="Paste your 15-minute recovery token"
              className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 font-mono focus:outline-none focus:ring-1 focus:ring-stone-800"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">New Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
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
          {newPassword && (
            <div className="mt-1 flex items-center gap-1 text-[11px] text-stone-500">
              <span
                className={`font-semibold ${
                  newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword)
                    ? "text-emerald-600"
                    : newPassword.length >= 8
                    ? "text-amber-600"
                    : "text-red-500"
                }`}
              >
                {newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword)
                  ? "Strong password"
                  : newPassword.length >= 8
                  ? "Moderate password"
                  : "Must be at least 8 characters"}
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Confirm New Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your new password"
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || newPassword.length < 8 || newPassword !== confirmPassword}
          className="w-full py-2.5 px-4 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Updating Password...</span>
            </>
          ) : (
            <>
              <span>Update Password</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-stone-100 text-center text-xs text-stone-500">
        <Link to="/auth/login" className="font-semibold text-stone-900 hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
};
