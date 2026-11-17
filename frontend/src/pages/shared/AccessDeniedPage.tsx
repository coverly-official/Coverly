import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { isAdminRole, getWorkspaceRoute } from "@/lib/role-routing";
import {
  ShieldAlert,
  ArrowLeft,
  LayoutDashboard,
  Home,
  LogOut,
  UserCheck,
  Lock,
} from "lucide-react";

export const AccessDeniedPage: React.FC = () => {
  const { user, activeRole, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const attemptedPath = searchParams.get("attempted") || "";

  const isUserAdmin = user?.roles?.some((r) => isAdminRole(r)) || isAdminRole(activeRole);
  const homeDashboardRoute = isUserAdmin ? "/admin/dashboard" : getWorkspaceRoute(activeRole);

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans antialiased text-stone-900">
      {/* Top Brand Header */}
      <div className="mb-6 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-blue-950 flex items-center justify-center text-white font-extrabold text-base tracking-wider shadow-sm">
          C
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-xl tracking-tight text-blue-950 leading-none">
            COVERLY
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-blue-700 mt-0.5">
            Security & Access Control
          </span>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-lg bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden">
        {/* Banner */}
        <div className="bg-red-50 border-b border-red-100 p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0 shadow-xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-red-950">
              Access Restricted
            </h1>
            <p className="text-xs text-red-700 mt-1">
              You do not have the required permissions or assigned role to view this workspace.
            </p>
          </div>
        </div>

        {/* Diagnostic Context */}
        <div className="p-6 space-y-4 text-xs">
          {attemptedPath && (
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="font-semibold text-stone-600 block text-[11px] uppercase tracking-wider mb-1">
                Attempted Route
              </span>
              <code className="text-stone-900 font-mono text-[11px] bg-stone-200/70 px-2 py-0.5 rounded break-all">
                {attemptedPath}
              </code>
            </div>
          )}

          {user ? (
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-medium">Logged in as:</span>
                <span className="font-semibold text-stone-900">{user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-medium">Active Workspace Role:</span>
                <span className="font-semibold uppercase tracking-wider text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[10px]">
                  {activeRole?.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-medium">Assigned Roles:</span>
                <div className="flex flex-wrap gap-1 justify-end max-w-[240px]">
                  {user.roles?.map((r) => (
                    <span
                      key={r}
                      className="px-1.5 py-0.5 rounded bg-stone-200 text-stone-700 text-[10px] font-medium"
                    >
                      {r.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0 text-amber-600" />
              <span>You are not currently authenticated. Please sign in to access protected workspaces.</span>
            </div>
          )}

          {/* Action Recovery Buttons */}
          <div className="pt-2 space-y-2">
            {user && (
              <Link
                to={homeDashboardRoute}
                className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 shadow-xs"
              >
                <LayoutDashboard className="w-4 h-4" />
                {isUserAdmin ? "Return to Admin Dashboard" : "Return to My Workspace"}
              </Link>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/"
                className="py-2.5 px-4 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5"
              >
                <Home className="w-3.5 h-3.5 text-stone-500" />
                Public Home
              </Link>

              {user ? (
                <button
                  type="button"
                  onClick={logout}
                  className="py-2.5 px-4 bg-white border border-stone-300 hover:bg-red-50 hover:text-red-700 text-stone-700 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              ) : (
                <Link
                  to="/auth/login"
                  className="py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Footer Help */}
        <div className="bg-stone-50 px-6 py-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
          <span>Need access elevation?</span>
          <Link to="/contact" className="font-semibold text-blue-700 hover:underline">
            Contact Admin Support &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};
