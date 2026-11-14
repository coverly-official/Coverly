import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getWorkspaceRoute } from "@/lib/role-routing";
import { Lock, Mail, ArrowRight, ShieldCheck, Factory, ShoppingBag, Briefcase, Sparkles } from "lucide-react";
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

  const performLogin = async (loginEmail: string, loginPass: string, forcedRole?: UserRole) => {
    setIsSubmitting(true);
    setErrorMsg("");

    const res = await login(loginEmail, loginPass);
    if (!res.success) {
      setErrorMsg(res.error || "Invalid credentials.");
      setIsSubmitting(false);
      return;
    }

    if (forcedRole) {
      localStorage.setItem("coverly_active_role", forcedRole);
    }

    if (redirect) {
      navigate(redirect);
    } else {
      const activeRole = forcedRole || (localStorage.getItem("coverly_active_role") as UserRole) || "buyer";
      navigate(getWorkspaceRoute(activeRole));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  const demoAccounts = [
    {
      role: "admin" as UserRole,
      title: "Admin",
      email: "admin@coverly.com",
      password: "Password@123",
      icon: ShieldCheck,
      badge: "Platform Admin",
      color: "text-purple-600 bg-purple-50 border-purple-200",
    },
    {
      role: "manufacturer" as UserRole,
      title: "Manufacturer",
      email: "supplier@texcraft.in",
      password: "Password@123",
      icon: Factory,
      badge: "TexCraft Mills",
      color: "text-amber-700 bg-amber-50 border-amber-200",
    },
    {
      role: "buyer" as UserRole,
      title: "Buyer",
      email: "buyer@bharatretail.in",
      password: "Password@123",
      icon: ShoppingBag,
      badge: "Bharat Retail",
      color: "text-blue-700 bg-blue-50 border-blue-200",
    },
    {
      role: "service_provider" as UserRole,
      title: "Services",
      email: "legal@taxadvisor.in",
      password: "Password@123",
      icon: Briefcase,
      badge: "TaxKraft CA",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
  ];

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-stone-900 tracking-tight">Sign In to COVERLY</h2>
        <p className="text-xs text-stone-500 mt-1">Access your buyer, supplier or admin workspace</p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      {/* 1-Click Demo Accounts Selector */}
      <div className="mb-5 p-3 rounded-xl bg-stone-50 border border-stone-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-stone-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> 1-Click Demo Logins
          </span>
          <span className="text-[10px] text-stone-500">Instant Access</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {demoAccounts.map((d) => {
            const Icon = d.icon;
            return (
              <button
                type="button"
                key={d.email}
                onClick={() => {
                  setEmail(d.email);
                  setPassword(d.password);
                  performLogin(d.email, d.password, d.role);
                }}
                disabled={isSubmitting}
                className="p-2 rounded-lg border border-stone-200 bg-white hover:border-stone-400 hover:shadow-xs text-left transition flex items-center gap-2 cursor-pointer group disabled:opacity-50"
              >
                <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 border ${d.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-stone-900 leading-tight group-hover:text-stone-700">
                    {d.title}
                  </div>
                  <div className="text-[9px] text-stone-500 truncate">{d.badge}</div>
                </div>
              </button>
            );
          })}
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
              placeholder="you@company.com"
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
          className="w-full py-2.5 px-4 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? "Authenticating..." : "Sign In"}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      <div className="mt-3 flex items-center justify-between text-[11px]">
        <Link to="/auth/forgot-password" className="text-stone-500 hover:text-stone-800">
          Forgot password?
        </Link>
        <Link to="/admin/login" className="text-stone-800 font-semibold hover:underline flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-stone-700" /> Admin Portal
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
