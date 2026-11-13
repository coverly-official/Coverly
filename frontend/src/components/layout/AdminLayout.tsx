import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldAlert,
  Users,
  CheckCircle,
  FileText,
  ShoppingBag,
  HelpCircle,
  List,
  LogOut,
  BarChart,
  Settings,
} from "lucide-react";

export const AdminLayout: React.FC = () => {
  const { user, activeRole, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { label: "Overview", href: "/admin/dashboard", icon: BarChart },
    { label: "User Governance", href: "/admin/users", icon: Users },
    { label: "Verification Queue", href: "/admin/verifications", icon: CheckCircle },
    { label: "Support Desk", href: "/admin/support", icon: HelpCircle },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: List },
  ];

  return (
    <div className="min-h-screen flex bg-[#FAF9F5] text-stone-900 font-sans">
      <aside className="w-64 border-r border-stone-200 bg-[#F4F1EA]/80 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-stone-200/80 gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-900 flex items-center justify-center text-white font-bold text-xs">
                C
              </div>
              <span className="font-semibold text-base tracking-tight">COVERLY</span>
            </Link>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-800">
              Admin
            </span>
          </div>

          <nav className="p-4 space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? "bg-stone-900 text-white font-semibold shadow-sm"
                      : "text-stone-700 hover:bg-stone-200/60 hover:text-stone-900"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-stone-200/80">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <div className="text-xs font-semibold truncate">{user?.full_name}</div>
              <div className="text-[10px] text-red-700 font-medium capitalize">{activeRole.replace("_", " ")}</div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-stone-200 bg-[#FAF9F5]/90 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs text-stone-500 hover:text-stone-900 transition">
              ← View Public Site
            </Link>
          </div>
          <div className="text-xs font-mono bg-stone-100 px-2 py-1 rounded text-stone-600 border border-stone-200">
            SYSTEM STATUS: HEALTHY
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
