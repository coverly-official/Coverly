import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { WorkspaceSwitcher } from "@/components/navigation/WorkspaceSwitcher";
import { VerificationBanner } from "@/components/verification/VerificationBanner";
import { CoverlyLogo } from "@/components/brand/CoverlyLogo";
import {
  LayoutDashboard,
  Store,
  Search,
  Building2,
  ListOrdered,
  Bookmark,
  Heart,
  FileText,
  ArrowRightLeft,
  ShoppingBag,
  RotateCcw,
  GitBranch,
  BarChart3,
  FolderOpen,
  Bell,
  Settings,
  LifeBuoy,
  ShieldCheck,
} from "lucide-react";

export const RetailerLayout: React.FC = () => {
  const { user, activeRole, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { label: "Dashboard", href: "/retailer/dashboard", icon: LayoutDashboard },
    { label: "Wholesale Catalog", href: "/retailer/wholesale", icon: Search },
    { label: "Supplier Directory", href: "/retailer/suppliers", icon: Building2 },
    { label: "Purchase Lists", href: "/retailer/purchase-lists", icon: ListOrdered },
    { label: "Saved Products", href: "/retailer/saved-products", icon: Heart },
    { label: "Saved Suppliers", href: "/retailer/saved-suppliers", icon: Bookmark },
    { label: "My RFQs", href: "/retailer/rfqs", icon: FileText },
    { label: "Quotations", href: "/retailer/rfqs", icon: ArrowRightLeft },
    { label: "Orders & Tracking", href: "/retailer/orders", icon: ShoppingBag },
    { label: "Reorder Reminders", href: "/retailer/reorder", icon: RotateCcw },
    { label: "Shop Profile", href: "/retailer/profile", icon: Store },
    { label: "Store Branches", href: "/retailer/branches", icon: GitBranch },
    { label: "Procurement Analytics", href: "/retailer/analytics", icon: BarChart3 },
    { label: "Compliance Documents", href: "/retailer/documents", icon: FolderOpen },
    { label: "Verification Center", href: "/retailer/verification", icon: ShieldCheck },
    { label: "Notifications", href: "/notifications", icon: Bell },
    { label: "Settings", href: "/retailer/settings", icon: Settings },
    { label: "Support", href: "/retailer/support", icon: LifeBuoy },
  ];

  return (
    <div className="min-h-screen flex bg-[#FAF9F5] text-stone-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-stone-200 bg-[#F4F1EA]/80 flex flex-col justify-between hidden md:flex shrink-0">
        <div className="overflow-y-auto max-h-[calc(100vh-140px)]">
          {/* Brand header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-stone-200/80 gap-2 sticky top-0 bg-[#F4F1EA] z-10">
            <Link to="/" className="flex items-center hover:opacity-90 transition">
              <CoverlyLogo variant="horizontal" size="sm" />
            </Link>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200 shrink-0">
              Retailer
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-0.5">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? "bg-emerald-950 text-white font-semibold shadow-sm"
                      : "text-stone-700 hover:bg-stone-200/70 hover:text-stone-900"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-300" : "text-stone-500"}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-stone-200 bg-[#EFECE4]/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center text-white font-medium text-xs">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "R"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-stone-900">{user?.full_name || "Shop Owner"}</p>
              <p className="text-[10px] text-stone-500 truncate capitalize">{activeRole || "Retailer"}</p>
            </div>
            <button
              onClick={() => logout()}
              title="Logout"
              className="text-stone-400 hover:text-stone-700 text-xs p-1"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-stone-200/80 bg-white/70 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <h1 className="text-sm font-semibold text-stone-800 tracking-tight">Retailer Sourcing Workspace</h1>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <WorkspaceSwitcher />
            <Link
              to="/retailer/wholesale"
              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium transition shadow-sm"
            >
              Browse Wholesalers
            </Link>
          </div>
        </header>

        <main className="p-6 md:p-8 flex-1">
          <VerificationBanner />
          <Outlet />
        </main>
      </div>
    </div>
  );
};
