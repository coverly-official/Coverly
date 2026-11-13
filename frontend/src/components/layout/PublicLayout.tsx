import React, { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Layers, Building2, Package, LogOut, Briefcase, Menu, X, Info, Mail } from "lucide-react";

export const PublicLayout: React.FC = () => {
  const { user, activeRole, setActiveRole, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: "/", label: "Home", icon: Layers },
    { to: "/products", label: "Products", icon: Package },
    { to: "/manufacturers", label: "Manufacturers", icon: Building2 },
    { to: "/wholesalers", label: "Wholesalers", icon: Building2 },
    { to: "/distributors", label: "Distributors", icon: Building2 },
    { to: "/services", label: "Business Services", icon: Briefcase },
    { to: "/how-it-works", label: "How it Works", icon: Info },
    { to: "/about", label: "About", icon: Info },
    { to: "/contact", label: "Contact", icon: Mail },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7F5] text-stone-900 font-sans antialiased">
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#F5F7F5]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-[#173a2a] flex items-center justify-center text-white font-bold text-sm tracking-wider">
                C
              </div>
              <span className="font-semibold text-lg tracking-tight text-stone-900 group-hover:text-stone-700 transition">
                COVERLY
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-stone-600">
              {navItems.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} className="flex items-center gap-1.5 hover:text-stone-900 transition">
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {user.roles.includes("buyer_supplier") && (
                  <div className="hidden sm:flex items-center bg-stone-200/70 p-1 rounded-lg text-xs font-medium">
                    <button
                      onClick={() => {
                        setActiveRole("buyer");
                        navigate("/buyer/dashboard");
                      }}
                      className={`px-2.5 py-1 rounded-md transition ${
                        activeRole === "buyer" ? "bg-white text-stone-900 shadow-sm font-semibold" : "text-stone-600 hover:text-stone-900"
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
                        activeRole !== "buyer" && !activeRole.includes("admin") ? "bg-white text-stone-900 shadow-sm font-semibold" : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      Supplier
                    </button>
                  </div>
                )}

                <Link
                  to={
                    activeRole.includes("admin")
                      ? "/admin/dashboard"
                      : activeRole === "buyer"
                        ? "/buyer/dashboard"
                        : "/supplier/dashboard"
                  }
                  className="hidden sm:inline-flex text-xs font-semibold px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 transition"
                >
                  Dashboard
                </Link>

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
                <Link to="/auth/login" className="text-xs font-semibold text-stone-700 hover:text-stone-900 px-3 py-1.5 rounded-lg transition">
                  Login
                </Link>
                <Link to="/auth/register?role=buyer" className="hidden sm:inline-flex text-xs font-medium text-white bg-[#173a2a] hover:bg-[#214d3c] px-3.5 py-1.5 rounded-lg shadow-sm transition">
                  Register
                </Link>
                <button
                  type="button"
                  className="md:hidden p-2 rounded-lg border border-stone-200 bg-white text-stone-700"
                  onClick={() => setMobileOpen((value) => !value)}
                  aria-label="Toggle menu"
                >
                  {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-stone-200 bg-white">
            <nav className="max-w-7xl mx-auto px-4 py-4 space-y-3 text-sm font-medium text-stone-700">
              {navItems.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-stone-50">
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
              {!user && (
                <div className="pt-2 border-t border-stone-200 space-y-2">
                  <Link to="/auth/register?role=buyer" onClick={() => setMobileOpen(false)} className="block rounded-lg bg-[#173a2a] text-white px-3 py-2 text-center">
                    Start Sourcing
                  </Link>
                  <Link to="/auth/login" onClick={() => setMobileOpen(false)} className="block rounded-lg border border-stone-200 px-3 py-2 text-center">
                    Sign In
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

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
