import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { WORKSPACE_REGISTRY } from "@/lib/role-routing";
import { WorkspaceSwitcher } from "@/components/navigation/WorkspaceSwitcher";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { VerificationCenterPage } from "./VerificationCenterPage";

export const AccountVerificationShell: React.FC = () => {
  const { user, activeRole, logout } = useAuth();
  const homeRoute = WORKSPACE_REGISTRY[activeRole]?.route || "/buyer/dashboard";

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-stone-900 font-sans">
      <header className="h-16 border-b border-stone-200 bg-white/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            to={homeRoute}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Workspace</span>
          </Link>
          <span className="text-stone-300">|</span>
          <BrandLogo linkTo="/" size="xs" subtitle="Verification Center" badge="KYC" />
        </div>
        <div className="flex items-center gap-3">
          <WorkspaceSwitcher />
          <span className="text-xs text-stone-600 hidden sm:inline">
            {user?.full_name || user?.email}
          </span>
          <button
            type="button"
            onClick={logout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-stone-500 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <VerificationCenterPage />
      </main>
    </div>
  );
};
