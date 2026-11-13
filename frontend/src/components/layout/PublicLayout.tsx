import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Layers,
  Search,
  Building2,
  Package,
  User,
  LogOut,
  ArrowRightLeft,
  ChevronDown,
  Briefcase,
} from "lucide-react";

export const PublicLayout: React.FC = () => {
  const { user, activeRole, setActiveRole, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-stone-900 font-sans antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#FAF9F5]/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-white font-bold text-sm tracking-wider">
                C
              </div>
              <span className="font-semibold text-lg tracking-tight group-hover:text-stone-700 transition">
                COVERLY
              </span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
              <Link to="/products" className="hover:text-stone-900 transition flex items-center gap-1.5">
                <Package className="w-4 h-4" />
                Products
              </Link>
              <Link to="/categories" className="hover:text-stone-900 transition flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                Categories
              </Link>
              <Link to="/manufacturers" className="hover:text-stone-900 transition flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                Manufacturers
              </Link>
              <Link to="/services" className="hover:text-stone-900 transition flex items-center gap-1.5 text-stone-900 font-semibold">
                <Briefcase className="w-4 h-4 text-stone-700" />
                Services
              </Link>
              <Link to="/wholesalers" className="hover:text-stone-900 transition">
                Wholesalers
              </Link>
              <Link to="/distributors" className="hover:text-stone-900 transition">
                Distributors
              </Link>
            </nav>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Role Switcher for Dual Role */}
                {user.roles.includes("buyer_supplier") && (
                  <div className="flex items-center bg-stone-200/60 p-1 rounded-lg text-xs font-medium">
                    <button
                      onClick={() => {
                        setActiveRole("buyer");
                        navigate("/buyer/dashboard");
                      }}
                      className={`px-2.5 py-1 rounded-md transition ${
                        activeRole === "buyer"
                          ? "bg-white text-stone-900 shadow-sm font-semibold"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      Buyer
                    </button>
                    <button
                      onClick={() => {
                        setActiveRole("manufacturer");
                        navigate("/supplier/dashboard");
                      }}
                      className={`px-2.5 py-1 rounded-md transition ${
                        activeRole !== "buyer" && !activeRole.includes("admin")
                          ? "bg-white text-stone-900 shadow-sm font-semibold"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      Supplier
                    </button>
                  </div>
                )}

                {/* Dashboard Shortcut */}
                <Link
                  to={
                    activeRole.includes("admin")
                      ? "/admin/dashboard"
                      : activeRole === "buyer"
                      ? "/buyer/dashboard"
                      : "/supplier/dashboard"
                  }
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 transition"
                >
                  Dashboard
                </Link>

                {/* User menu / Logout */}
                <div className="flex items-center gap-2 border-l border-stone-200 pl-3">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-semibold text-stone-900">{user.full_name}</div>
                    <div className="text-[10px] text-stone-500 capitalize">{activeRole.replace("_", " ")}</div>
                  </div>
                  <button
                    onClick={logout}
                    title="Sign Out"
                    className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/auth/login"
                  className="text-xs font-semibold text-stone-700 hover:text-stone-900 px-3 py-1.5 rounded-lg transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth/register?role=buyer"
                  className="text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 px-3.5 py-1.5 rounded-lg shadow-sm transition"
                >
                  Start Sourcing
                </Link>
                <Link
                  to="/auth/register?role=manufacturer"
                  className="hidden sm:inline-block text-xs font-medium text-stone-700 bg-stone-200 hover:bg-stone-300 px-3 py-1.5 rounded-lg transition"
                >
                  Become a Supplier
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Slot */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Global Footer */}
      <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-stone-800">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded bg-white text-stone-900 font-bold text-xs flex items-center justify-center">
                  C
                </div>
                <span className="text-white font-semibold text-base tracking-tight">COVERLY</span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed mb-3">
                India's unified B2B Wholesale Discovery, Sourcing & Landed-Cost Procurement Platform.
              </p>
              <div className="text-[11px] text-stone-500">
                DISCOVER → CONNECT → COMPARE → MANAGE
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-200 mb-3">
                Marketplace
              </h4>
              <ul className="space-y-2 text-xs text-stone-400">
                <li><Link to="/products" className="hover:text-white transition">All Products</Link></li>
                <li><Link to="/categories" className="hover:text-white transition">Product Categories</Link></li>
                <li><Link to="/manufacturers" className="hover:text-white transition">Manufacturer Directory</Link></li>
                <li><Link to="/wholesalers" className="hover:text-white transition">Wholesalers</Link></li>
                <li><Link to="/distributors" className="hover:text-white transition">Distributors</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-200 mb-3">
                Solutions & Services
              </h4>
              <ul className="space-y-2 text-xs text-stone-400">
                <li><Link to="/buyer/rfq/new" className="hover:text-white transition">Request for Quotation</Link></li>
                <li><Link to="/services" className="hover:text-white transition font-medium text-amber-200">Business Services Hub</Link></li>
                <li><Link to="/services/providers" className="hover:text-white transition">Service Providers Directory</Link></li>
                <li><Link to="/provider/onboarding" className="hover:text-white transition">Become a Service Partner</Link></li>
                <li><Link to="/about" className="hover:text-white transition">Landed Cost Engine</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-200 mb-3">
                Platform
              </h4>
              <ul className="space-y-2 text-xs text-stone-400">
                <li><Link to="/about" className="hover:text-white transition">About COVERLY</Link></li>
                <li><Link to="/contact" className="hover:text-white transition">Contact & Support</Link></li>
                <li><Link to="/auth/login" className="hover:text-white transition">Portal Login</Link></li>
                <li><Link to="/admin/dashboard" className="hover:text-white transition">Admin Console</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
            <div>© {new Date().getFullYear()} COVERLY Sourcing Technologies. All rights reserved.</div>
            <div className="flex gap-6">
              <span className="hover:text-stone-400 transition cursor-pointer">Privacy Policy</span>
              <span className="hover:text-stone-400 transition cursor-pointer">Terms of Service</span>
              <span className="hover:text-stone-400 transition cursor-pointer">GST Compliance</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
