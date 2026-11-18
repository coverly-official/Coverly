import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { isAdminRole } from "@/lib/role-routing";
import type { UserRole } from "@/types";
import { CoverlyLogo } from "@/components/brand/CoverlyLogo";
import { Lock, Mail, ArrowRight } from "lucide-react";

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, logout, setActiveRole } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    const res = await login(email, password);
    if (!res.success) {
      setErrorMsg(res.error || "Authentication failed. Please verify credentials.");
      setIsSubmitting(false);
      return;
    }

    const userRoles = res.user?.roles || [];
    const primaryAdminRole = (
      userRoles.find((r) => isAdminRole(r)) ||
      (isAdminRole(res.activeRole) ? res.activeRole : null)
    ) as UserRole | null;

    if (!primaryAdminRole) {
      logout();
      setErrorMsg("Access denied: This account does not hold administrative privileges.");
      setIsSubmitting(false);
      return;
    }

    setActiveRole(primaryAdminRole);
    navigate("/admin/dashboard", { replace: true });
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <Link to="/" className="inline-flex justify-center mb-3 hover:opacity-95 transition">
          <CoverlyLogo variant="stacked" size="lg" />
        </Link>
        <h2 className="text-xl font-bold text-stone-900 tracking-tight">COVERLY Admin Portal</h2>
        <p className="text-xs text-stone-500 mt-1">Platform Governance, Verification &amp; Support Queue</p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Admin Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              placeholder="admin@coverly.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Admin Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          {isSubmitting ? "Authenticating Admin..." : "Access Admin Dashboard"}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-stone-100 text-center text-xs text-stone-500">
        Looking for user login?{" "}
        <Link to="/auth/login" className="font-semibold text-stone-900 hover:underline">
          Go to Standard Sign In
        </Link>
      </div>
    </div>
  );
};
