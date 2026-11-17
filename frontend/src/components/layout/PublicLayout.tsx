import React, { useState } from "react";
import { Link, Navigate, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { GuestEnquiryModal } from "@/components/modals/GuestEnquiryModal";
import { WorkspaceSwitcher } from "@/components/navigation/WorkspaceSwitcher";
import { getWorkspaceRoute, isAdminRole } from "@/lib/role-routing";
import {
  Search,
  MapPin,
  ChevronDown,
  Layers,
  Building2,
  Package,
  Briefcase,
  PlusCircle,
  LogOut,
  User,
  ShieldCheck,
  Menu,
  X,
  PhoneCall,
  Sparkles,
  Truck,
  Factory,
  Globe,
} from "lucide-react";

const CITIES = [
  "All India",
  "Delhi NCR",
  "Mumbai",
  "Surat",
  "Ahmedabad",
  "Pune",
  "Bengaluru",
  "Hyderabad",
  "Rajkot",
  "Vadodara",
  "Chennai",
  "Kolkata",
  "Guntur",
  "Ludhiana",
];

export const PublicLayout: React.FC = () => {
  const { user, activeRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedCity, setSelectedCity] = useState("All India");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"products" | "suppliers" | "services">("products");
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthenticatedAdmin = Boolean(
    user && (isAdminRole(activeRole) || user.roles?.some((r) => isAdminRole(r)))
  );

  // Admins must never land on the Guest Marketplace homepage; route directly to Admin Control Center
  if (isAuthenticatedAdmin && location.pathname === "/") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    const cityParam = selectedCity !== "All India" ? `&city=${encodeURIComponent(selectedCity)}` : "";

    if (searchType === "products") {
      navigate(`/products?search=${encodeURIComponent(q)}${cityParam}`);
    } else if (searchType === "suppliers") {
      navigate(`/manufacturers?search=${encodeURIComponent(q)}${cityParam}`);
    } else if (searchType === "services") {
      navigate(`/services/all?search=${encodeURIComponent(q)}`);
    }
  };

  const tradeCategories = [
    { label: "Agriculture", href: "/products?category=agriculture-products" },
    { label: "Food & Beverages", href: "/products?category=food-beverages" },
    { label: "Packaging Materials", href: "/products?category=packaging-materials" },
    { label: "Industrial Machinery", href: "/products?category=industrial-machinery" },
    { label: "Electrical Equipment", href: "/products?category=electrical-equipment" },
    { label: "Construction & Steel", href: "/products?category=construction-materials" },
    { label: "Chemicals", href: "/products?category=chemicals" },
    { label: "Textiles", href: "/products?category=textiles" },
    { label: "Electronics", href: "/products?category=electronics" },
    { label: "Business Services", href: "/services", highlight: true },
    { label: "Logistics & Freight", href: "/logistics", highlight: true },
    { label: "Transporters & Trucks", href: "/transporters", highlight: true },
    { label: "Packaging Hub", href: "/packaging", highlight: true },
    { label: "Import & Export", href: "/import-export", highlight: true },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-stone-900 font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Micro Top Bar */}
      <div className="bg-stone-950 text-stone-300 text-[11px] py-1.5 px-4 sm:px-8 border-b border-stone-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-1.5 text-stone-300 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              Verified B2B Discovery, Sourcing & Landed-Cost Procurement
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-stone-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              100% Verified Indian Manufacturers & Wholesalers
            </span>
          </div>

          <div className="flex items-center gap-4 text-stone-300">
            <Link to="/how-it-works" className="hover:text-white transition hidden sm:inline">
              How it Works
            </Link>
            <Link to="/services" className="hover:text-amber-300 transition text-amber-400 font-medium hidden sm:inline flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Business Services Hub
            </Link>
            <Link to="/logistics/track" className="hover:text-amber-300 transition text-amber-300 font-medium hidden sm:inline-flex items-center gap-1">
              <Truck className="w-3 h-3 text-amber-300" />
              Track Consignment
            </Link>
            <Link to="/transporters" className="hover:text-blue-300 transition text-blue-300 font-medium hidden sm:inline-flex items-center gap-1">
              <Truck className="w-3 h-3 text-blue-300" />
              Transporters & Trucks
            </Link>
            <Link to="/auth/login?role=manufacturer" className="hover:text-white transition">
              Supplier Center
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main Header (Logo, Search Engine, Post Requirement CTA, Auth) */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4 md:gap-6">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-9 h-9 rounded-xl bg-blue-950 flex items-center justify-center text-white font-extrabold text-base tracking-wider shadow-sm group-hover:bg-blue-900 transition">
                C
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-blue-950 leading-none">
                  COVERLY
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-blue-700 mt-0.5">
                  B2B Sourcing
                </span>
              </div>
            </Link>

            {/* Universal Search Bar (IndiaMART / Justdial Inspired) */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-3xl items-center border-2 border-blue-900 rounded-xl overflow-hidden shadow-xs">
              {/* Type Switcher */}
              <div className="relative border-r border-stone-200 bg-stone-50">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as any)}
                  className="appearance-none bg-transparent pl-3 pr-7 py-2.5 text-xs font-semibold text-stone-800 focus:outline-none cursor-pointer"
                >
                  <option value="products">Products</option>
                  <option value="suppliers">Suppliers</option>
                  <option value="services">Services</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* City Filter */}
              <div className="relative border-r border-stone-200 bg-stone-50 hidden lg:block">
                <div className="flex items-center pl-2.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-800 shrink-0" />
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="appearance-none bg-transparent pl-1.5 pr-7 py-2.5 text-xs font-medium text-stone-700 focus:outline-none cursor-pointer"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Keyword Input */}
              <div className="flex-1 flex items-center px-3 bg-white">
                <input
                  type="text"
                  placeholder={
                    searchType === "products"
                      ? "Search wholesale products, raw materials, rebar, chemicals..."
                      : searchType === "suppliers"
                        ? "Search verified manufacturers, mills, distributors by name or city..."
                        : "Search legal registration, CA audit, branding, logistics services..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none py-2.5"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="bg-blue-900 hover:bg-blue-800 text-white px-5 py-2.5 text-xs font-bold flex items-center gap-1.5 transition shrink-0"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </form>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Post Requirement CTA Button */}
              <button
                type="button"
                onClick={() => setIsEnquiryModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-xl shadow-xs border border-amber-500 transition"
              >
                <PlusCircle className="w-3.5 h-3.5 text-stone-950" />
                Post Requirement
              </button>

              {user ? (
                <div className="flex items-center gap-2">
                  {isAuthenticatedAdmin ? (
                    <Link
                      to="/admin/dashboard"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white hover:bg-stone-800 text-xs font-semibold transition"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      Admin Control Center
                    </Link>
                  ) : (
                    <>
                      <WorkspaceSwitcher />
                      <Link
                        to={getWorkspaceRoute(activeRole)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-900/20 bg-blue-50/60 text-blue-950 hover:bg-blue-100 text-xs font-semibold transition"
                      >
                        <User className="w-3.5 h-3.5" />
                        Dashboard
                      </Link>
                    </>
                  )}

                  <button
                    onClick={logout}
                    title="Sign Out"
                    className="p-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/auth/login"
                    className="text-xs font-bold text-blue-950 hover:bg-stone-100 px-3 py-2 rounded-lg transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth/register?role=buyer"
                    className="inline-flex text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 px-3.5 py-2 rounded-lg shadow-xs transition"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-stone-700 hover:bg-stone-100"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <form onSubmit={handleSearch} className="md:hidden mt-3 flex items-center border border-stone-300 rounded-lg overflow-hidden">
            <input
              type="text"
              placeholder="Search products, suppliers, services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 text-xs focus:outline-none"
            />
            <button type="submit" className="bg-blue-900 text-white px-3 py-2">
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* 3. Secondary Category Navigation Bar */}
        <div className="border-t border-stone-200/80 bg-stone-50/60 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1 overflow-x-auto py-2 text-xs font-medium text-stone-700 no-scrollbar">
              <Link
                to="/categories"
                className="px-2.5 py-1 rounded-md text-stone-900 font-bold hover:bg-stone-200/70 transition shrink-0 flex items-center gap-1"
              >
                <Layers className="w-3.5 h-3.5 text-blue-900" />
                All Categories
              </Link>
              <span className="text-stone-300">|</span>

              {tradeCategories.map((cat) => (
                <Link
                  key={cat.label}
                  to={cat.href}
                  className={`px-2.5 py-1 rounded-md shrink-0 transition ${
                    cat.highlight
                      ? "text-blue-950 font-bold bg-blue-100/70 hover:bg-blue-200"
                      : "hover:text-blue-900 hover:bg-stone-200/50"
                  }`}
                >
                  {cat.label}
                </Link>
              ))}

              <div className="ml-auto shrink-0 flex items-center gap-3 text-stone-600 pl-4 border-l border-stone-200">
                <Link to="/manufacturers" className="hover:text-blue-900 transition flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  Manufacturers
                </Link>
                <Link to="/wholesalers" className="hover:text-blue-900 transition flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  Wholesalers
                </Link>
                <Link to="/sales-agents" className="hover:text-indigo-600 transition flex items-center gap-1 font-semibold text-indigo-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  Sales Reps
                </Link>
                <Link to="/raw-materials" className="hover:text-amber-800 transition flex items-center gap-1 font-bold text-amber-900">
                  <Factory className="w-3.5 h-3.5 text-amber-600" />
                  Raw Materials
                </Link>
                <Link to="/packaging" className="hover:text-blue-900 transition flex items-center gap-1 font-bold text-blue-950">
                  <Layers className="w-3.5 h-3.5 text-blue-700" />
                  Packaging
                </Link>
                <Link to="/import-export" className="hover:text-indigo-900 transition flex items-center gap-1 font-bold text-indigo-950">
                  <Globe className="w-3.5 h-3.5 text-indigo-700" />
                  Global Trade
                </Link>
              </div>
            </nav>
          </div>
        </div>

        {/* Mobile Slide-down Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200 bg-white p-4 space-y-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsEnquiryModalOpen(true);
              }}
              className="w-full py-2 bg-amber-400 text-stone-950 font-bold text-xs rounded-lg text-center"
            >
              Post Buy Requirement
            </button>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-stone-50 rounded font-medium">
                Browse Products
              </Link>
              <Link to="/manufacturers" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-stone-50 rounded font-medium">
                Manufacturers
              </Link>
              <Link to="/wholesalers" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-stone-50 rounded font-medium">
                Wholesalers
              </Link>
              <Link to="/services" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-blue-50 text-blue-950 rounded font-bold">
                Business Services
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Universal Sourcing Requirement Modal */}
      <GuestEnquiryModal
        isOpen={isEnquiryModalOpen}
        onClose={() => setIsEnquiryModalOpen(false)}
      />

      {/* 4. Professional B2B Footer */}
      <footer className="bg-stone-950 text-stone-300 border-t border-stone-800 pt-12 pb-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 pb-10 border-b border-stone-800">
            {/* Brand column */}
            <div className="md:col-span-2 pr-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-white font-bold text-sm">
                  C
                </div>
                <span className="text-white font-extrabold text-xl tracking-tight">COVERLY</span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed mb-4 max-w-sm">
                India's wholesale discovery, supplier verification & transparent landed-cost procurement marketplace. Connecting MSMEs, manufacturers, and bulk buyers with zero brokerage.
              </p>
              <div className="flex items-center gap-3 text-xs text-stone-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>GST Verified Suppliers • Factory-Direct Pricing</span>
              </div>
            </div>

            {/* Products & Directory */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                Wholesale Directory
              </h4>
              <ul className="space-y-2 text-xs text-stone-400">
                <li><Link to="/products" className="hover:text-white transition">All Wholesale Products</Link></li>
                <li><Link to="/categories" className="hover:text-white transition">Product Categories</Link></li>
                <li><Link to="/manufacturers" className="hover:text-white transition">Industrial Manufacturers</Link></li>
                <li><Link to="/wholesalers" className="hover:text-white transition">Bulk Wholesalers</Link></li>
                <li><Link to="/distributors" className="hover:text-white transition">Regional Distributors</Link></li>
              </ul>
            </div>

            {/* Business Services */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                Business Services
              </h4>
              <ul className="space-y-2 text-xs text-stone-400">
                <li><Link to="/services" className="hover:text-white transition">Services Marketplace</Link></li>
                <li><Link to="/services/category/business-registration-legal" className="hover:text-white transition">Company & GST Registration</Link></li>
                <li><Link to="/services/category/accounting-finance" className="hover:text-white transition">CA Audit & Bookkeeping</Link></li>
                <li><Link to="/services/category/logistics-supply-chain" className="hover:text-white transition">Pan-India Freight Logistics</Link></li>
                <li><Link to="/services/category/technology-it" className="hover:text-white transition">Factory ERP & Software</Link></li>
              </ul>
            </div>

            {/* Quick Actions & Governance */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                Procurement
              </h4>
              <ul className="space-y-2 text-xs text-stone-400">
                <li>
                  <button onClick={() => setIsEnquiryModalOpen(true)} className="hover:text-amber-400 transition text-left">
                    Post Sourcing Requirement
                  </button>
                </li>
                <li><Link to="/how-it-works" className="hover:text-white transition">How Sourcing Works</Link></li>
                <li><Link to="/transporters" className="hover:text-white transition">Book Commercial Trucks</Link></li>
                <li><Link to="/transporters/track" className="hover:text-white transition">Track Transport Trip</Link></li>
                <li><Link to="/transporter" className="hover:text-white transition">Transporter Portal</Link></li>
                <li><Link to="/sales-agents" className="hover:text-white transition">Sales Representatives</Link></li>
                <li><Link to="/agent/dashboard" className="hover:text-white transition">Agent Portal</Link></li>
                <li><Link to="/raw-materials" className="hover:text-white transition">Raw Material Marketplace</Link></li>
                <li><Link to="/raw-materials/suppliers" className="hover:text-white transition">Mill & Supplier Directory</Link></li>
                <li><Link to="/raw-materials/rfq" className="hover:text-amber-400 transition font-semibold">Bulk Raw Material RFQ</Link></li>
                <li><Link to="/raw-material-supplier/dashboard" className="hover:text-white transition">Raw Material Supplier Portal</Link></li>
                <li><Link to="/auth/login" className="hover:text-white transition">Buyer & Supplier Sign In</Link></li>
                <li><Link to="/admin/login" className="hover:text-white transition">Admin Portal</Link></li>
                <li><Link to="/contact" className="hover:text-white transition">Contact Support Desk</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-3">
            <div>
              © {new Date().getFullYear()} COVERLY Sourcing Technologies. All trade names and registered trademarks are properties of their respective owners.
            </div>
            <div className="flex gap-4">
              <span className="hover:text-stone-300 transition cursor-pointer">Privacy Policy</span>
              <span className="hover:text-stone-300 transition cursor-pointer">Terms of Platform Use</span>
              <span className="hover:text-stone-300 transition cursor-pointer">Anti-Spam Policy</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
