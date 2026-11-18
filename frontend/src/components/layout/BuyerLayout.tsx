import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { WorkspaceSwitcher } from "@/components/navigation/WorkspaceSwitcher";
import { VerificationBanner } from "@/components/verification/VerificationBanner";
import { CoverlyLogo } from "@/components/brand/CoverlyLogo";
import {
  LayoutDashboard,
  Search,
  FileText,
  PlusCircle,
  ShoppingBag,
  Bookmark,
  Settings,
  LogOut,
  Building2,
  Bell,
  ArrowRightLeft,
  Briefcase,
  Users,
  FolderOpen,
  ClipboardList,
  FileCheck,
  Receipt,
  Truck,
  Heart,
  ListOrdered,
  LifeBuoy,
  ShieldCheck,
} from "lucide-react";

export const BuyerLayout: React.FC = () => {
  const { user, activeRole, setActiveRole, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { label: "Overview", href: "/buyer/dashboard", icon: LayoutDashboard },
    { label: "Discover Products", href: "/products", icon: Search },
    { label: "Discover Suppliers", href: "/manufacturers", icon: Building2 },
    { label: "Saved Products", href: "/buyer/saved-products", icon: Heart },
    { label: "Saved Suppliers", href: "/buyer/saved", icon: Bookmark },
    { label: "Sourcing Lists", href: "/buyer/sourcing-lists", icon: ListOrdered },
    { label: "My RFQs", href: "/buyer/rfqs", icon: FileText },
    { label: "Quotations", href: "/buyer/rfqs", icon: ArrowRightLeft },
    { label: "Purchase Requests", href: "/buyer/purchase-requests", icon: ClipboardList },
    { label: "Purchase Orders (POs)", href: "/buyer/purchase-orders", icon: FileCheck },
    { label: "Invoices & Expenses", href: "/buyer/invoices", icon: Receipt },
    { label: "My Orders", href: "/buyer/orders", icon: ShoppingBag },
    { label: "Business Services", href: "/services", icon: Briefcase },
    { label: "Team Management", href: "/buyer/team", icon: Users },
    { label: "Documents Vault", href: "/buyer/documents", icon: FolderOpen },
    { label: "Verification Center", href: "/buyer/verification", icon: ShieldCheck },
    { label: "Notifications", href: "/notifications", icon: Bell },
    { label: "Business Profile", href: "/buyer/profile", icon: Building2 },
    { label: "Settings", href: "/buyer/settings", icon: Settings },
    { label: "Support", href: "/buyer/support", icon: LifeBuoy },
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
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
              Buyer
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
                      ? "bg-stone-900 text-white font-semibold shadow-sm"
                      : "text-stone-700 hover:bg-stone-200/70 hover:text-stone-900"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Workspace Switcher & User Profile */}
        <div className="p-4 border-t border-stone-200/80 space-y-3 bg-[#F4F1EA]">
          <div className="w-full">
            <WorkspaceSwitcher />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-stone-300 text-stone-700 font-bold text-xs flex items-center justify-center shrink-0">
                {user?.full_name?.charAt(0).toUpperCase() || "B"}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-stone-900 truncate">
                  {user?.full_name || "Buyer Account"}
                </div>
                <div className="text-[10px] text-stone-500 truncate">
                  {user?.email}
                </div>
              </div>
            </div>

            <button
              onClick={() => logout()}
              title="Sign Out"
              className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-200/60"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-stone-200/80 bg-[#FAF9F5]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs text-stone-500 hover:text-stone-900 transition flex items-center gap-1">
              ← Marketplace
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <WorkspaceSwitcher />
          </div>
        </header>
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <VerificationBanner />
          <Outlet />
        </div>
      </main>
    </div>
  );
};
