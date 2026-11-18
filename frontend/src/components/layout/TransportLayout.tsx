import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { VerificationBanner } from "@/components/verification/VerificationBanner";
import { Truck, Navigation, LogOut, ShieldCheck } from "lucide-react";

export const TransportLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isLogistics = location.pathname.startsWith("/logistics-partner");

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans antialiased">
      <header className="h-14 border-b border-stone-200 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-950 text-white flex items-center justify-center">
            {isLogistics ? <Navigation className="w-4 h-4 text-amber-400" /> : <Truck className="w-4 h-4 text-amber-400" />}
          </div>
          <div>
            <div className="text-sm font-bold text-stone-900 leading-tight">
              {isLogistics ? "COVERLY Logistics Partner Console" : "COVERLY Transporter Fleet Workspace"}
            </div>
            <div className="text-[10px] text-stone-500 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Dedicated Fleet & Dispatch Portal
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={isLogistics ? "/logistics-partner" : "/transporter"}
            className="text-xs font-semibold text-stone-700 hover:text-stone-950"
          >
            Console Home
          </Link>
          <Link
            to="/account/verification"
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Verification Center
          </Link>
          <span className="text-xs text-stone-400">|</span>
          <span className="text-xs font-medium text-stone-700 hidden sm:inline">
            {user?.full_name || user?.email}
          </span>
          <button
            type="button"
            onClick={logout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-stone-500 hover:text-red-700 hover:bg-red-50 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
        <VerificationBanner />
        {children || <Outlet />}
      </main>
    </div>
  );
};
