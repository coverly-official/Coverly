import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Search,
  FileText,
  PlusCircle,
  BarChart3,
  ShoppingBag,
  Bookmark,
  Settings,
  LogOut,
  Building2,
  Bell,
  ArrowRightLeft,
} from "lucide-react";

export const BuyerLayout: React.FC = () => {
  const { user, activeRole, setActiveRole, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { label: "Dashboard", href: "/buyer/dashboard", icon: LayoutDashboard },
    { label: "Discover Products", href: "/products", icon: Search },
    { label: "Find Suppliers", href: "/manufacturers", icon: Building2 },
    { label: "My RFQs", href: "/buyer/rfqs", icon: FileText },
    { label: "Create RFQ", href: "/buyer/rfq/new", icon: PlusCircle },
    { label: "My Orders", href: "/buyer/orders", icon: ShoppingBag },
    { label: "Saved Suppliers", href: "/buyer/saved", icon: Bookmark },
    { label: "Settings", href: "/buyer/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-[#FAF9F5] text-stone-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-stone-200 bg-[#F4F1EA]/70 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          {/* Brand header */}
          <div className="h-16 flex items-center px-6 border-b border-stone-200/80 gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center text-white font-bold text-xs">
                C
              </div>
              <span className="font-semibold text-base tracking-tight">COVERLY</span>
            </Link>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-200 text-stone-700">
              Buyer
            </span>
          </div>

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
                  className="flex-1 py-1 rounded text-xs font-semibold bg-white text-stone-900 shadow-xs"
                >
                  Buyer
                </button>
                <button
                  onClick={() => {
                    setActiveRole("manufacturer");
                    navigate("/supplier/dashboard");
                  }}
                  className="flex-1 py-1 rounded text-xs text-stone-600 hover:text-stone-900"
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
        {/* Top Header */}
        <header className="h-16 border-b border-stone-200 bg-[#FAF9F5]/90 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs text-stone-500 hover:text-stone-900 transition flex items-center gap-1">
              ← Back to Marketplace
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/buyer/rfq/new"
              className="text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 px-3 py-1.5 rounded-lg shadow-sm transition"
            >
              + Create RFQ
            </Link>
            <Link
              to="/notifications"
              className="p-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition relative"
            >
              <Bell className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
