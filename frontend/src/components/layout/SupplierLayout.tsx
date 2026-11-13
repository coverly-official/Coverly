import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Building,
  ShieldCheck,
  Package,
  PlusCircle,
  Inbox,
  Send,
  ShoppingBag,
  TrendingUp,
  Settings,
  LogOut,
  Bell,
  Briefcase,
} from "lucide-react";

export const SupplierLayout: React.FC = () => {
  const { user, activeRole, setActiveRole, business, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { label: "Dashboard", href: "/supplier/dashboard", icon: LayoutDashboard },
    { label: "Products", href: "/supplier/products", icon: Package },
    { label: "Incoming RFQs", href: "/supplier/rfqs", icon: Inbox },
    { label: "Quotations", href: "/supplier/quotations", icon: Send },
    { label: "Orders", href: "/supplier/orders", icon: ShoppingBag },
    { label: "Verification", href: "/supplier/verification", icon: ShieldCheck },
    { label: "Business Profile", href: "/supplier/profile", icon: Building },
    { label: "Business Services", href: "/services", icon: Briefcase },
    { label: "Notifications", href: "/notifications", icon: Bell },
    { label: "Analytics", href: "/supplier/analytics", icon: TrendingUp },
    { label: "Settings", href: "/supplier/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-[#FAF9F5] text-stone-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-stone-200 bg-[#F4F1EA]/70 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          {/* Header */}
          <div className="h-16 flex items-center px-6 border-b border-stone-200/80 gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center text-white font-bold text-xs">
                C
              </div>
              <span className="font-semibold text-base tracking-tight">COVERLY</span>
            </Link>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Supplier
            </span>
          </div>

          {/* Business card header if present */}
          {business && (
            <div className="px-5 py-3 border-b border-stone-200/60 bg-stone-200/30">
              <div className="text-xs font-semibold truncate text-stone-900">{business.name}</div>
              <div className="text-[10px] text-stone-500 capitalize">{business.business_type} • {business.city}</div>
            </div>
          )}

          {/* Navigation Items */}
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

        {/* Dual Role Switcher & User Profile */}
        <div className="p-4 border-t border-stone-200/80 space-y-3">
          {user?.roles.includes("buyer_supplier") && (
            <div className="bg-stone-200/70 p-2 rounded-lg">
              <div className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider mb-1">
                Workspace
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setActiveRole("buyer");
                    navigate("/buyer/dashboard");
                  }}
                  className="flex-1 py-1 rounded text-xs text-stone-600 hover:text-stone-900"
                >
                  Buyer
                </button>
                <button
                  onClick={() => {
                    setActiveRole("manufacturer");
                    navigate("/supplier/dashboard");
                  }}
                  className="flex-1 py-1 rounded text-xs font-semibold bg-white text-stone-900 shadow-xs"
                >
                  Supplier
                </button>
              </div>
            </div>
          )}

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
            <Link to="/" className="text-xs text-stone-500 hover:text-stone-900 transition flex items-center gap-1">
              ← Back to Marketplace
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/supplier/products/new"
              className="text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 px-3 py-1.5 rounded-lg shadow-sm transition"
            >
              + Add Product
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
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
