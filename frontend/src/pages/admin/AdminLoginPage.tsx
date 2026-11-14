import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles } from "lucide-react";

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState("admin@coverly.com");
  const [password, setPassword] = useState("Password@123");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    const res = await login(email, password);
    if (!res.success) {
      setErrorMsg(res.error || "Authentication failed. Please verify credentials.");
      setIsSubmitting(false);
      return;
    }

    localStorage.setItem("coverly_active_role", "admin");
    navigate("/admin/dashboard");
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-stone-900 text-white mb-3 shadow-sm">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 tracking-tight">COVERLY Admin Portal</h2>
        <p className="text-xs text-stone-500 mt-1">Platform Governance, Verification & Support Queue</p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Quick Demo Credentials Box */}
      <div className="mb-4 p-3 rounded-lg bg-stone-50 border border-stone-200">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-stone-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Default Administrator Account
          </span>
          <button
            type="button"
            onClick={() => {
              setEmail("admin@coverly.com");
              setPassword("Password@123");
            }}
            className="text-[10px] text-stone-600 hover:text-stone-900 underline font-medium cursor-pointer"
          >
            Reset Fields
          </button>
        </div>
        <div className="text-[11px] text-stone-600 space-y-0.5 font-mono">
          <div><span className="text-stone-400">Email:</span> admin@coverly.com</div>
          <div><span className="text-stone-400">Password:</span> Password@123</div>
        </div>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Admin Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
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
