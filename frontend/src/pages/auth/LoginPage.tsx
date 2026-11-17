import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getWorkspaceRoute, isAdminRole } from "@/lib/role-routing";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import type { UserRole } from "@/types";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "";

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

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-stone-900 tracking-tight">Sign In to COVERLY</h2>
        <p className="text-xs text-stone-500 mt-1">Access your buyer, supplier or corporate workspace</p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

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
          className="w-full py-2.5 px-4 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          {isSubmitting ? "Authenticating..." : "Sign In"}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-[11px]">
        <Link to="/auth/forgot-password" className="text-stone-500 hover:text-stone-800">
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
