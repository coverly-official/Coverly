import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
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
  BarChart3,
  Settings,
  Briefcase,
  Building2,
  Truck,
  UserCheck,
  Factory,
  Layers,
  Globe,
  Store,
  UserCog,
  CreditCard,
  Star,
  PackageCheck,
  Search,
  Bell,
  ChevronRight,
  Menu,
  X,
  Compass,
  Eye,
  ShieldCheck,
  ArrowRight,
  LayoutDashboard,
  Clock,
  ExternalLink,
  ChevronDown,
} from "lucide-react";

export const AdminLayout: React.FC = () => {
  const { user, activeRole, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [portalsExpanded, setPortalsExpanded] = useState(true);

  // Grouped Navigation Sections per Section 2 Specification
  const overviewLinks = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Platform Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Recent Activities", href: "/admin/audit-logs", icon: Clock },
  ];

  const portalQuickLinks = [
    { label: "All Portals Access Hub", href: "/admin/portals", icon: Compass, badge: "13 Portals", highlight: true },
    { label: "Guest Marketplace", href: "/admin/portals/guest/preview", icon: ShoppingBag },
    { label: "Buyer Workspace", href: "/admin/portals/buyer/preview", icon: Store },
    { label: "Retailer Workspace", href: "/admin/portals/retailer/preview", icon: Store },
    { label: "Manufacturer Workspace", href: "/admin/portals/manufacturer/preview", icon: Factory },
    { label: "Wholesaler Workspace", href: "/admin/portals/wholesaler/preview", icon: Building2 },
    { label: "Distributor Workspace", href: "/admin/portals/distributor/preview", icon: Truck },
    { label: "Raw Material Supplier", href: "/admin/portals/raw_material_supplier/preview", icon: Layers },
    { label: "Packaging Supplier", href: "/admin/portals/packaging_supplier/preview", icon: Layers },
    { label: "Importer / Exporter", href: "/admin/portals/importer_exporter/preview", icon: Globe },
    { label: "Logistics Partner", href: "/admin/portals/logistics_partner/preview", icon: Truck },
    { label: "Transporter Workspace", href: "/admin/portals/transporter/preview", icon: Truck },
    { label: "Business Service Provider", href: "/admin/portals/service_provider/preview", icon: Briefcase },
    { label: "Sales Agent Workspace", href: "/admin/portals/sales_agent/preview", icon: UserCheck },
  ];

  const platformManagementLinks = [
    { label: "User Management", href: "/admin/users", icon: Users },
    { label: "Business Management", href: "/admin/businesses", icon: Building2 },
    { label: "Business Verification", href: "/admin/verifications", icon: CheckCircle },
    { label: "Product Management", href: "/admin/products", icon: ShoppingBag },
    { label: "Category Management", href: "/admin/categories", icon: List },
    { label: "Supplier Management", href: "/admin/suppliers", icon: Factory },
    { label: "Service Management", href: "/admin/services", icon: Briefcase },
    { label: "RFQ Management", href: "/admin/rfqs", icon: FileText },
    { label: "Quotation Management", href: "/admin/quotations", icon: FileText },
    { label: "Order Management", href: "/admin/orders", icon: PackageCheck },
    { label: "Procurement Management", href: "/admin/procurement", icon: Store },
    { label: "Logistics Management", href: "/admin/logistics", icon: Truck },
    { label: "Shipment Management", href: "/admin/shipments", icon: Truck },
    { label: "Transport Management", href: "/admin/transporters", icon: Truck },
    { label: "Reviews & Ratings", href: "/admin/reviews", icon: Star },
    { label: "Complaints & Disputes", href: "/admin/disputes", icon: HelpCircle },
  ];

  const administrationLinks = [
    { label: "Admin Employees", href: "/admin/employees", icon: UserCog },
    { label: "Roles & Permissions", href: "/admin/roles", icon: ShieldCheck },
    { label: "Platform Settings", href: "/admin/settings", icon: Settings },
    { label: "Notifications Queue", href: "/admin/notifications", icon: Bell },
    { label: "Support Tickets", href: "/admin/support", icon: HelpCircle },
    { label: "Financial Records", href: "/admin/finance", icon: CreditCard },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: ShieldAlert },
  ];

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = globalSearch.trim().toLowerCase();
    if (!q) return;

    if (q.includes("user")) navigate("/admin/users");
    else if (q.includes("order") || q.includes("po")) navigate("/admin/orders");
    else if (q.includes("quote") || q.includes("bid")) navigate("/admin/quotations");
    else if (q.includes("rfq") || q.includes("lead")) navigate("/admin/rfqs");
    else if (q.includes("product") || q.includes("item")) navigate("/admin/products");
    else if (q.includes("portal") || q.includes("workspace")) navigate("/admin/portals");
    else if (q.includes("verify") || q.includes("gstin")) navigate("/admin/verifications");
    else navigate(`/admin/businesses?search=${encodeURIComponent(q)}`);
  };

  const getBreadcrumbTitle = () => {
    const path = location.pathname;
    if (path.includes("/admin/portals")) return "Workspace & Portal Access Hub";
    if (path.includes("/admin/dashboard")) return "Executive Operations Dashboard";
    if (path.includes("/admin/orders")) return "Orders & Fulfillment Governance";
    if (path.includes("/admin/quotations")) return "Quotations & Bidding Matrix";
    if (path.includes("/admin/products")) return "Product Moderation Catalog";
    if (path.includes("/admin/categories")) return "Taxonomy & Verticals";
    if (path.includes("/admin/businesses") || path.includes("/admin/suppliers")) return "Business Directory & Suppliers";
    if (path.includes("/admin/verifications")) return "Verification Review Queue";
    if (path.includes("/admin/services")) return "Business Services Governance";
    if (path.includes("/admin/rfqs")) return "RFQs & Enquiries Command";
    if (path.includes("/admin/finance")) return "Financial Telemetry & Settlements";
    if (path.includes("/admin/analytics")) return "Ecosystem Liquidity Analytics";
    if (path.includes("/admin/reviews")) return "Verified Customer Reviews";
    if (path.includes("/admin/employees") || path.includes("/admin/roles")) return "Employee RBAC & Access Control";
    if (path.includes("/admin/users")) return "User Identity Governance";
    if (path.includes("/admin/support") || path.includes("/admin/disputes")) return "Support Desk & Dispute Resolution";
    if (path.includes("/admin/settings")) return "Platform Security & SLA Rules";
    if (path.includes("/admin/notifications")) return "System Alerts & Notifications";
    if (path.includes("/admin/audit-logs")) return "Cryptographic Audit Trail";
    return "Platform Governance";
  };

  const renderNavGroup = (
    title: string,
    links: { label: string; href: string; icon: any; badge?: string; highlight?: boolean }[]
  ) => (
    <div className="space-y-1">
      <div className="px-3 pt-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
        {title}
      </div>
      {links.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => setMobileSidebarOpen(false)}
            className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              isActive
                ? "bg-stone-900 text-white font-semibold shadow-xs"
                : item.highlight
                ? "bg-amber-500/10 text-amber-900 font-semibold hover:bg-amber-500/20"
                : "text-stone-700 hover:bg-stone-200/70 hover:text-stone-900"
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </div>
            {item.badge && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-mono shrink-0">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#FAF9F5] text-stone-900 font-sans antialiased">
      {/* 1. Desktop Fixed Sidebar */}
      <aside className="w-64 border-r border-stone-200 bg-[#F4F1EA]/90 flex flex-col justify-between hidden lg:flex shrink-0 h-screen sticky top-0">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className="h-16 flex items-center px-5 border-b border-stone-200/80 gap-3 shrink-0">
            <Link to="/admin/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-stone-950 flex items-center justify-center text-white font-black text-sm tracking-wider shadow-sm">
                C
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm tracking-tight text-stone-950 leading-tight">
                  COVERLY
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-amber-700">
                  Control Center
                </span>
              </div>
            </Link>
            <span className="ml-auto text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-900 text-amber-400 font-mono">
              Live
            </span>
          </div>

          {/* Navigation Scrollable Body */}
          <nav className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
            {renderNavGroup("Overview", overviewLinks)}

            {/* Collapsible Workspace & Portal Access Section */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setPortalsExpanded(!portalsExpanded)}
                className="w-full flex items-center justify-between px-3 pt-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-800 hover:text-amber-950"
              >
                <div className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-amber-600" />
                  <span>Workspace & Portal Access</span>
                </div>
                <ChevronDown
                  className={`w-3 h-3 text-stone-400 transition-transform ${
                    portalsExpanded ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </button>

              {portalsExpanded && (
                <div className="space-y-0.5 pl-1.5 border-l-2 border-amber-200/80 ml-2.5 my-1">
                  {portalQuickLinks.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                          isActive
                            ? "bg-stone-900 text-white font-semibold shadow-xs"
                            : item.highlight
                            ? "bg-amber-100/80 text-amber-950 font-bold hover:bg-amber-200"
                            : "text-stone-700 hover:bg-stone-200/70 hover:text-stone-900"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Icon className="w-3 h-3 shrink-0 text-stone-500" />
                          <span className="truncate text-[11px]">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-300 text-stone-950 font-mono shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {renderNavGroup("Platform Management", platformManagementLinks)}
            {renderNavGroup("Administration", administrationLinks)}
          </nav>

          {/* User Footer Profile */}
          <div className="p-3 border-t border-stone-200/80 bg-white/50 shrink-0">
            <div className="flex items-center justify-between">
              <div className="truncate pr-2">
                <div className="text-xs font-bold text-stone-900 truncate">
                  {user?.full_name || "Admin User"}
                </div>
                <div className="text-[10px] text-amber-800 font-mono font-medium truncate capitalize">
                  {activeRole?.replace(/_/g, " ")} • Full Oversight
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Sign Out from Admin Control Center"
                className="p-1.5 rounded-lg text-stone-500 hover:text-red-700 hover:bg-red-50 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Professional Governance Header */}
        <header className="h-16 border-b border-stone-200 bg-white/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-2xs">
          {/* Left: Mobile Toggle & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-500 font-medium">
              <Link to="/admin/dashboard" className="hover:text-stone-900 transition flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-stone-700" />
                Admin Center
              </Link>
              <ChevronRight className="w-3 h-3 text-stone-400" />
              <span className="font-bold text-stone-900 truncate max-w-[200px] md:max-w-none">
                {getBreadcrumbTitle()}
              </span>
            </div>
          </div>

          {/* Center: Global Admin Search Bar */}
          <form onSubmit={handleGlobalSearch} className="hidden md:flex items-center w-72 lg:w-96 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search POs, RFQs, suppliers, portals, users..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-100 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-800 focus:bg-white"
            />
          </form>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* Dedicated Workspace & Portal Access Shortcut Button */}
            <Link
              to="/admin/portals"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition shadow-2xs"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Portal Hub</span>
            </Link>

            {/* Direct Public Site Preview Link */}
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium transition"
              title="Open Public Marketplace in a new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden xl:inline">Public Site</span>
            </Link>

            {/* Notifications */}
            <Link
              to="/admin/notifications"
              className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 absolute top-2 right-2" />
            </Link>
          </div>
        </header>

        {/* 3. Main Outlet Container */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* 4. Mobile Drawer Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#FAF9F5] shadow-2xl border-r border-stone-200">
            <div className="h-16 flex items-center justify-between px-5 border-b border-stone-200 bg-white">
              <span className="font-extrabold text-sm text-stone-950">COVERLY Control Center</span>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded-md text-stone-500 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {renderNavGroup("Overview", overviewLinks)}
              {renderNavGroup("Workspace & Portal Access", portalQuickLinks)}
              {renderNavGroup("Platform Management", platformManagementLinks)}
              {renderNavGroup("Administration", administrationLinks)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
