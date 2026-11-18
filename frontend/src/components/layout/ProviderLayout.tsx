import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { WorkspaceSwitcher } from "@/components/navigation/WorkspaceSwitcher";
import { VerificationBanner } from "@/components/verification/VerificationBanner";
import { BrandLogo } from "@/components/ui/BrandLogo";
import {
  LayoutDashboard,
  Briefcase,
  PlusCircle,
  Inbox,
  FolderKanban,
  CheckCircle,
  Building,
  LogOut,
  Bell,
  ArrowRightLeft,
  ShieldCheck,
} from "lucide-react";

export const ProviderLayout: React.FC = () => {
  const { user, activeRole, setActiveRole, business, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { label: "Dashboard", href: "/provider/dashboard", icon: LayoutDashboard },
    { label: "Incoming Inquiries", href: "/provider/inquiries", icon: Inbox },
    { label: "Active Projects", href: "/provider/projects", icon: FolderKanban },
    { label: "Service Listings", href: "/provider/services", icon: Briefcase },
    { label: "Add New Service", href: "/provider/services/new", icon: PlusCircle },
    { label: "Verification Center", href: "/provider/verification", icon: ShieldCheck },
    { label: "Firm Profile", href: "/provider/profile", icon: Building },
  ];

  return (
    <div className="min-h-screen flex bg-[#FAF9F5] text-stone-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-stone-200 bg-[#F4F1EA]/70 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          <div className="h-16 flex items-center px-4 border-b border-stone-200/80 sticky top-0 bg-[#F4F1EA] z-10">
            <BrandLogo linkTo="/provider/dashboard" size="sm" subtitle="Services Hub" badge="Provider" />
          </div>

          {business && (
            <div className="px-5 py-3 border-b border-stone-200/60 bg-stone-200/30">
              <div className="text-xs font-semibold truncate text-stone-900">{business.name}</div>
              <div className="text-[10px] text-stone-500 capitalize">{business.city}, {business.state}</div>
            </div>
          )}

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

        {/* User / Workspace Switcher footer */}
        <div className="p-4 border-t border-stone-200/80 space-y-3">
          <div className="w-full">
            <WorkspaceSwitcher />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="truncate">
              <div className="text-xs font-semibold truncate">{user?.full_name}</div>
              <div className="text-[10px] text-stone-500 truncate">{user?.email}</div>
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-stone-200 bg-[#FAF9F5]/90 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Link to="/services" className="text-xs text-stone-500 hover:text-stone-900 transition flex items-center gap-1">
              ← View Services Marketplace
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <WorkspaceSwitcher />
            <Link
              to="/provider/services/new"
              className="text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 px-3 py-1.5 rounded-lg shadow-sm transition"
            >
              + List New Service
            </Link>
            <Link
              to="/notifications"
              className="p-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition relative"
            >
              <Bell className="w-4 h-4" />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <VerificationBanner />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
