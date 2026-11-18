import React, { useState, useMemo } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { CoverlyLogo } from "@/components/brand/CoverlyLogo";
import {
  canAccessAdminModule,
  formatAdminRoleLabel,
  type AdminModuleKey,
} from "@/lib/admin-permissions";
import {
  ShieldAlert,
  Users,
  CheckCircle,
  FileText,
  ShoppingBag,
  HelpCircle,
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
  CreditCard,
  PackageCheck,
  Search,
  Bell,
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
  LayoutDashboard,
  Clock,
  ChevronDown,
  Warehouse,
  Package,
  Activity,
} from "lucide-react";

interface SidebarChildLink {
  label: string;
  href: string;
}

interface ExpandableGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  module: AdminModuleKey;
  basePath: string;
  children: SidebarChildLink[];
}

const OVERVIEW_LINKS: {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  module: AdminModuleKey;
}[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, module: "overview" },
  { label: "Platform Overview", href: "/admin/overview", icon: Globe, module: "overview" },
  { label: "Activity Monitor", href: "/admin/activity", icon: Activity, module: "overview" },
  { label: "Reports & Analytics", href: "/admin/analytics", icon: BarChart3, module: "overview" },
];

const ECOSYSTEM_GROUPS: ExpandableGroup[] = [
  {
    id: "buyer_mgmt",
    label: "Buyer Management",
    icon: Store,
    module: "buyers",
    basePath: "/admin/buyers",
    children: [
      { label: "All Buyers", href: "/admin/buyers" },
      { label: "Buyer Profiles", href: "/admin/buyers?tab=profiles" },
      { label: "Buyer Businesses", href: "/admin/buyers?tab=businesses" },
      { label: "Buyer RFQs", href: "/admin/rfqs?scope=buyer" },
      { label: "Buyer Quotations", href: "/admin/quotations?scope=buyer" },
      { label: "Buyer Purchase Orders", href: "/admin/orders?scope=buyer" },
      { label: "Buyer Transactions", href: "/admin/finance?scope=buyer" },
    ],
  },
  {
    id: "retailer_mgmt",
    label: "Retailer Management",
    icon: ShoppingBag,
    module: "retailers",
    basePath: "/admin/retailers",
    children: [
      { label: "All Retailers", href: "/admin/retailers" },
      { label: "Retailer Shops", href: "/admin/retailers?tab=shops" },
      { label: "Shop Branches", href: "/admin/retailers?tab=branches" },
      { label: "Retailer Employees", href: "/admin/retailers?tab=employees" },
      { label: "Retailer Inventory", href: "/admin/retailers?tab=inventory" },
      { label: "Retailer Purchase Orders", href: "/admin/retailers?tab=orders" },
      { label: "Retailer Analytics", href: "/admin/retailers?tab=analytics" },
    ],
  },
  {
    id: "manufacturer_mgmt",
    label: "Manufacturer Management",
    icon: Factory,
    module: "manufacturers",
    basePath: "/admin/manufacturers",
    children: [
      { label: "All Manufacturers", href: "/admin/manufacturers" },
      { label: "Factory Profiles", href: "/admin/manufacturers?tab=profiles" },
      { label: "Factory Verification", href: "/admin/manufacturers?tab=verification" },
      { label: "Manufacturer Products", href: "/admin/manufacturers?tab=products" },
      { label: "Manufacturing Capabilities", href: "/admin/manufacturers?tab=capabilities" },
      { label: "Production Capacity", href: "/admin/manufacturers?tab=capabilities" },
      { label: "Manufacturing Enquiries", href: "/admin/manufacturers?tab=enquiries" },
      { label: "Manufacturing Orders", href: "/admin/manufacturers?tab=orders" },
    ],
  },
  {
    id: "wholesaler_mgmt",
    label: "Wholesaler Management",
    icon: Building2,
    module: "wholesalers",
    basePath: "/admin/wholesalers",
    children: [
      { label: "All Wholesalers", href: "/admin/wholesalers" },
      { label: "Wholesale Businesses", href: "/admin/wholesalers?tab=businesses" },
      { label: "Product Catalogue", href: "/admin/wholesalers?tab=catalogue" },
      { label: "Wholesale Offers", href: "/admin/wholesalers?tab=offers" },
      { label: "MOQ & Pricing", href: "/admin/wholesalers?tab=offers" },
      { label: "Wholesaler RFQs", href: "/admin/wholesalers?tab=rfqs" },
      { label: "Wholesale Orders", href: "/admin/wholesalers?tab=orders" },
    ],
  },
  {
    id: "distributor_mgmt",
    label: "Distributor Management",
    icon: Truck,
    module: "distributors",
    basePath: "/admin/distributors",
    children: [
      { label: "All Distributors", href: "/admin/distributors" },
      { label: "Brand Management", href: "/admin/distributors?tab=brands" },
      { label: "Authorization Documents", href: "/admin/distributors?tab=brands" },
      { label: "Distribution Territories", href: "/admin/distributors?tab=territories" },
      { label: "Dealer Management", href: "/admin/distributors?tab=dealers" },
      { label: "Distributor Orders", href: "/admin/distributors?tab=orders" },
    ],
  },
  {
    id: "raw_materials_mgmt",
    label: "Raw Material Suppliers",
    icon: Layers,
    module: "raw_materials",
    basePath: "/admin/raw-materials",
    children: [
      { label: "All Suppliers", href: "/admin/raw-materials" },
      { label: "Material Catalogue", href: "/admin/raw-materials?tab=catalogue" },
      { label: "Grades & Specifications", href: "/admin/raw-materials?tab=specs" },
      { label: "Supplier Offers", href: "/admin/raw-materials?tab=offers" },
      { label: "Material Enquiries", href: "/admin/raw-materials?tab=enquiries" },
      { label: "Quotations", href: "/admin/raw-materials?tab=quotations" },
    ],
  },
  {
    id: "packaging_mgmt",
    label: "Packaging Suppliers",
    icon: Package,
    module: "packaging",
    basePath: "/admin/packaging",
    children: [
      { label: "All Packaging Suppliers", href: "/admin/packaging" },
      { label: "Packaging Categories", href: "/admin/packaging?tab=categories" },
      { label: "Product Specifications", href: "/admin/packaging?tab=specs" },
      { label: "Custom Packaging", href: "/admin/packaging?tab=custom" },
      { label: "Design Files", href: "/admin/packaging?tab=designs" },
      { label: "Packaging Enquiries", href: "/admin/packaging?tab=enquiries" },
      { label: "Quotations", href: "/admin/packaging?tab=quotations" },
    ],
  },
  {
    id: "import_export_mgmt",
    label: "Importer & Exporter",
    icon: Globe,
    module: "import_export",
    basePath: "/admin/import-export",
    children: [
      { label: "Importers", href: "/admin/import-export?tab=importers" },
      { label: "Exporters", href: "/admin/import-export?tab=exporters" },
      { label: "Countries & Trade Regions", href: "/admin/import-export?tab=regions" },
      { label: "Trade Enquiries", href: "/admin/import-export?tab=enquiries" },
      { label: "International Quotations", href: "/admin/import-export?tab=quotations" },
      { label: "Trade Documents", href: "/admin/import-export?tab=documents" },
      { label: "Import / Export Orders", href: "/admin/import-export?tab=orders" },
    ],
  },
  {
    id: "logistics_mgmt",
    label: "Logistics Management",
    icon: Truck,
    module: "logistics",
    basePath: "/admin/logistics",
    children: [
      { label: "Logistics Partners", href: "/admin/logistics" },
      { label: "Freight Services", href: "/admin/logistics?tab=freight" },
      { label: "Routes", href: "/admin/logistics?tab=routes" },
      { label: "Logistics Quotations", href: "/admin/logistics?tab=quotations" },
      { label: "Shipments", href: "/admin/shipments" },
      { label: "Delivery Status", href: "/admin/logistics?tab=delivery" },
    ],
  },
  {
    id: "transport_mgmt",
    label: "Transport Management",
    icon: Truck,
    module: "transporters",
    basePath: "/admin/transporters",
    children: [
      { label: "Transporters", href: "/admin/transporters" },
      { label: "Fleet Management", href: "/admin/transporters?tab=fleet" },
      { label: "Vehicles", href: "/admin/transporters?tab=vehicles" },
      { label: "Drivers", href: "/admin/transporters?tab=drivers" },
      { label: "Trip Assignments", href: "/admin/transporters?tab=trips" },
      { label: "Transport Bookings", href: "/admin/transporters?tab=bookings" },
      { label: "Delivery Proof", href: "/admin/transporters?tab=pod" },
    ],
  },
  {
    id: "services_mgmt",
    label: "Business Services",
    icon: Briefcase,
    module: "services",
    basePath: "/admin/services",
    children: [
      { label: "Service Providers", href: "/admin/services" },
      { label: "Service Categories", href: "/admin/services?tab=categories" },
      { label: "Service Listings", href: "/admin/services?tab=listings" },
      { label: "Service Enquiries", href: "/admin/services?tab=enquiries" },
      { label: "Service Quotations", href: "/admin/services?tab=quotations" },
      { label: "Projects & Milestones", href: "/admin/services?tab=projects" },
      { label: "Deliverables", href: "/admin/services?tab=deliverables" },
      { label: "Reviews", href: "/admin/reviews" },
    ],
  },
  {
    id: "sales_agents_mgmt",
    label: "Sales Agent Management",
    icon: UserCheck,
    module: "sales_agents",
    basePath: "/admin/sales-agents",
    children: [
      { label: "All Agents", href: "/admin/sales-agents" },
      { label: "Agent Profiles", href: "/admin/sales-agents?tab=profiles" },
      { label: "Territories", href: "/admin/sales-agents?tab=territories" },
      { label: "Leads", href: "/admin/sales-agents?tab=leads" },
      { label: "Follow-ups", href: "/admin/sales-agents?tab=followups" },
      { label: "Assigned Businesses", href: "/admin/sales-agents?tab=businesses" },
      { label: "Commission Records", href: "/admin/sales-agents?tab=commissions" },
    ],
  },
];

const OPERATIONS_GROUPS: ExpandableGroup[] = [
  {
    id: "marketplace_ops",
    label: "Marketplace Management",
    icon: ShoppingBag,
    module: "marketplace",
    basePath: "/admin/products",
    children: [
      { label: "Product Catalogue", href: "/admin/products" },
      { label: "Categories", href: "/admin/categories" },
      { label: "Published Listings", href: "/admin/products?status=active" },
      { label: "Pending Listings", href: "/admin/products?status=pending" },
      { label: "Supplier Offers", href: "/admin/businesses" },
      { label: "Featured Businesses", href: "/admin/businesses?featured=true" },
      { label: "Marketplace Moderation", href: "/admin/reviews" },
    ],
  },
  {
    id: "procurement_ops",
    label: "Procurement Management",
    icon: FileText,
    module: "procurement",
    basePath: "/admin/rfqs",
    children: [
      { label: "All RFQs", href: "/admin/rfqs" },
      { label: "All Quotations", href: "/admin/quotations" },
      { label: "Quotation Comparisons", href: "/admin/quotations?view=comparisons" },
      { label: "Negotiations", href: "/admin/rfqs?view=negotiations" },
      { label: "Purchase Requests", href: "/admin/procurement" },
      { label: "Purchase Orders", href: "/admin/orders?type=po" },
    ],
  },
  {
    id: "order_ops",
    label: "Order Management",
    icon: PackageCheck,
    module: "orders",
    basePath: "/admin/orders",
    children: [
      { label: "All Orders", href: "/admin/orders" },
      { label: "Pending Orders", href: "/admin/orders?status=pending" },
      { label: "Confirmed Orders", href: "/admin/orders?status=confirmed" },
      { label: "Processing Orders", href: "/admin/orders?status=processing" },
      { label: "Dispatched Orders", href: "/admin/orders?status=shipped" },
      { label: "Delivered Orders", href: "/admin/orders?status=delivered" },
      { label: "Cancelled Orders", href: "/admin/orders?status=cancelled" },
      { label: "Returns & Replacements", href: "/admin/orders?status=returned" },
    ],
  },
  {
    id: "warehouse_ops",
    label: "Warehouse & Inventory",
    icon: Warehouse,
    module: "warehouse",
    basePath: "/admin/warehouse",
    children: [
      { label: "Warehouses", href: "/admin/warehouse?tab=warehouses" },
      { label: "Inventory Records", href: "/admin/warehouse?tab=inventory" },
      { label: "Stock Movements", href: "/admin/warehouse?tab=movements" },
      { label: "Quality Inspection", href: "/admin/warehouse?tab=qc" },
      { label: "Inventory Reports", href: "/admin/warehouse?tab=reports" },
    ],
  },
  {
    id: "finance_ops",
    label: "Finance & Accounts",
    icon: CreditCard,
    module: "finance",
    basePath: "/admin/finance",
    children: [
      { label: "Financial Records", href: "/admin/finance" },
      { label: "Payments Dashboard", href: "/admin/payments" },
      { label: "Payment Gateways", href: "/admin/payment-gateways" },
      { label: "Invoices", href: "/admin/finance?tab=invoices" },
      { label: "Expenses", href: "/admin/finance?tab=expenses" },
      { label: "Transaction Status", href: "/admin/finance?tab=transactions" },
      { label: "Platform Revenue", href: "/admin/finance?tab=revenue" },
      { label: "Subscription Records", href: "/admin/finance?tab=subscriptions" },
    ],
  },
  {
    id: "user_ops",
    label: "User Management",
    icon: Users,
    module: "users",
    basePath: "/admin/users",
    children: [
      { label: "All Users", href: "/admin/users" },
      { label: "User Profiles", href: "/admin/users?view=profiles" },
      { label: "Business Memberships", href: "/admin/businesses" },
      { label: "Employee Accounts", href: "/admin/employees" },
      { label: "Roles & Permissions", href: "/admin/roles" },
      { label: "Account Status", href: "/admin/users?view=status" },
    ],
  },
  {
    id: "verification_ops",
    label: "Verification & Compliance",
    icon: CheckCircle,
    module: "verification",
    basePath: "/admin/verifications",
    children: [
      { label: "Business Verification", href: "/admin/verifications" },
      { label: "KYC Documents", href: "/admin/verifications?tab=kyc" },
      { label: "Product Verification", href: "/admin/products?status=pending" },
      { label: "Supplier Verification", href: "/admin/verifications?tab=suppliers" },
      { label: "Service Provider Verification", href: "/admin/services?tab=verification" },
      { label: "Compliance Records", href: "/admin/audit-logs?filter=compliance" },
    ],
  },
  {
    id: "support_ops",
    label: "Support & Disputes",
    icon: HelpCircle,
    module: "support",
    basePath: "/admin/support",
    children: [
      { label: "Support Tickets", href: "/admin/support" },
      { label: "Complaints", href: "/admin/disputes?tab=complaints" },
      { label: "Disputes", href: "/admin/disputes" },
      { label: "Resolution Records", href: "/admin/support?status=resolved" },
      { label: "Customer Feedback", href: "/admin/reviews" },
    ],
  },
  {
    id: "system_admin",
    label: "System Administration",
    icon: Settings,
    module: "system_admin",
    basePath: "/admin/settings",
    children: [
      { label: "Admin Employees", href: "/admin/employees" },
      { label: "Admin Roles", href: "/admin/roles" },
      { label: "Platform Settings", href: "/admin/settings" },
      { label: "Notification Settings", href: "/admin/notifications" },
      { label: "Audit Logs", href: "/admin/audit-logs" },
      { label: "System Health", href: "/admin/settings?tab=health" },
    ],
  },
];

export const AdminLayout: React.FC = () => {
  const { user, activeRole, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const authorizedOverview = useMemo(
    () => OVERVIEW_LINKS.filter((item) => canAccessAdminModule(user?.roles, activeRole, item.module)),
    [user?.roles, activeRole]
  );

  const authorizedEcosystem = useMemo(
    () => ECOSYSTEM_GROUPS.filter((g) => canAccessAdminModule(user?.roles, activeRole, g.module)),
    [user?.roles, activeRole]
  );

  const authorizedOperations = useMemo(
    () => OPERATIONS_GROUPS.filter((g) => canAccessAdminModule(user?.roles, activeRole, g.module)),
    [user?.roles, activeRole]
  );

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isGroupActive = (group: ExpandableGroup) => {
    return location.pathname === group.basePath || location.pathname.startsWith(`${group.basePath}/`);
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = globalSearch.trim().toLowerCase();
    if (!q) return;

    if (q.includes("manufactur")) navigate("/admin/manufacturers");
    else if (q.includes("wholesal")) navigate("/admin/wholesalers");
    else if (q.includes("distribut")) navigate("/admin/distributors");
    else if (q.includes("retail")) navigate("/admin/retailers");
    else if (q.includes("buyer")) navigate("/admin/buyers");
    else if (q.includes("raw")) navigate("/admin/raw-materials");
    else if (q.includes("packag")) navigate("/admin/packaging");
    else if (q.includes("import") || q.includes("export") || q.includes("trade")) navigate("/admin/import-export");
    else if (q.includes("logistic") || q.includes("shipment")) navigate("/admin/logistics");
    else if (q.includes("transport") || q.includes("truck") || q.includes("fleet")) navigate("/admin/transporters");
    else if (q.includes("service")) navigate("/admin/services");
    else if (q.includes("agent")) navigate("/admin/sales-agents");
    else if (q.includes("warehouse") || q.includes("inventory")) navigate("/admin/warehouse");
    else if (q.includes("user")) navigate("/admin/users");
    else if (q.includes("order") || q.includes("po")) navigate("/admin/orders");
    else if (q.includes("quote") || q.includes("bid")) navigate("/admin/quotations");
    else if (q.includes("rfq") || q.includes("lead")) navigate("/admin/rfqs");
    else if (q.includes("product")) navigate("/admin/products");
    else if (q.includes("verify") || q.includes("kyc") || q.includes("gst")) navigate("/admin/verifications");
    else if (q.includes("finance") || q.includes("invoice")) navigate("/admin/finance");
    else if (q.includes("support") || q.includes("dispute") || q.includes("ticket")) navigate("/admin/support");
    else navigate(`/admin/businesses?search=${encodeURIComponent(q)}`);
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  const getBreadcrumbTitle = () => {
    const path = location.pathname;
    if (path.includes("/admin/dashboard")) return "Dashboard";
    if (path.includes("/admin/overview")) return "Platform Overview";
    if (path.includes("/admin/activity")) return "Activity Monitor";
    if (path.includes("/admin/analytics")) return "Reports & Analytics";
    if (path.includes("/admin/buyers")) return "Buyer Management";
    if (path.includes("/admin/retailers")) return "Retailer Management";
    if (path.includes("/admin/manufacturers")) return "Manufacturer Management";
    if (path.includes("/admin/wholesalers")) return "Wholesaler Management";
    if (path.includes("/admin/distributors")) return "Distributor Management";
    if (path.includes("/admin/raw-materials")) return "Raw Material Supplier Management";
    if (path.includes("/admin/packaging")) return "Packaging Supplier Management";
    if (path.includes("/admin/import-export") || path.includes("/admin/trade")) return "Importer & Exporter Management";
    if (path.includes("/admin/logistics") || path.includes("/admin/shipments")) return "Logistics Management";
    if (path.includes("/admin/transporters")) return "Transport Management";
    if (path.includes("/admin/services")) return "Business Services Management";
    if (path.includes("/admin/sales-agents")) return "Sales Agent Management";
    if (path.includes("/admin/warehouse")) return "Warehouse & Inventory";
    if (path.includes("/admin/orders")) return "Order Management";
    if (path.includes("/admin/quotations")) return "Quotation Management";
    if (path.includes("/admin/products")) return "Marketplace Product Catalogue";
    if (path.includes("/admin/categories")) return "Categories";
    if (path.includes("/admin/businesses") || path.includes("/admin/suppliers")) return "Business & Supplier Directory";
    if (path.includes("/admin/verifications")) return "Verification & Compliance";
    if (path.includes("/admin/rfqs")) return "Procurement & RFQs";
    if (path.includes("/admin/finance")) return "Finance & Accounts";
    if (path.includes("/admin/reviews")) return "Reviews & Moderation";
    if (path.includes("/admin/employees") || path.includes("/admin/roles")) return "Admin Employees & Roles";
    if (path.includes("/admin/users")) return "User Management";
    if (path.includes("/admin/support") || path.includes("/admin/disputes")) return "Support & Disputes";
    if (path.includes("/admin/settings")) return "Platform Settings";
    if (path.includes("/admin/notifications")) return "Notification Center";
    if (path.includes("/admin/audit-logs")) return "Audit Logs";
    return "Admin Control Center";
  };

  const renderExpandableSection = (sectionTitle: string, groups: ExpandableGroup[]) => {
    if (groups.length === 0) return null;
    return (
      <div className="space-y-1">
        <div className="px-3 pt-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
          {sectionTitle}
        </div>
        {groups.map((group) => {
          const Icon = group.icon;
          const active = isGroupActive(group);
          const isOpen = expandedGroups[group.id] ?? active;

          return (
            <div key={group.id} className="space-y-0.5">
              <div className="flex items-center">
                <Link
                  to={group.basePath}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex-1 flex items-center gap-2.5 px-3 py-1.5 rounded-l-lg text-xs font-medium transition ${
                    active
                      ? "bg-stone-900 text-white font-semibold"
                      : "text-stone-700 hover:bg-stone-200/70 hover:text-stone-950"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{group.label}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-label={`Toggle ${group.label}`}
                  className={`px-2 py-1.5 rounded-r-lg transition ${
                    active
                      ? "bg-stone-900 text-stone-300 hover:text-white"
                      : "text-stone-400 hover:bg-stone-200/70 hover:text-stone-800"
                  }`}
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-0" : "-rotate-90"}`}
                  />
                </button>
              </div>

              {isOpen && (
                <div className="ml-4 pl-2.5 border-l border-stone-300/80 space-y-0.5 py-0.5">
                  {group.children.map((child, idx) => {
                    const fullPath = `${location.pathname}${location.search}`;
                    const childActive = fullPath === child.href;
                    return (
                      <Link
                        key={`${group.id}-${idx}`}
                        to={child.href}
                        onClick={() => setMobileSidebarOpen(false)}
                        className={`block px-2.5 py-1 rounded-md text-[11px] transition truncate ${
                          childActive
                            ? "bg-amber-100 text-stone-950 font-bold"
                            : "text-stone-600 hover:text-stone-950 hover:bg-stone-200/60"
                        }`}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderSidebarNav = () => (
    <nav className="flex-1 p-3 space-y-2 overflow-y-auto custom-scrollbar">
      {/* A. OVERVIEW */}
      {authorizedOverview.length > 0 && (
        <div className="space-y-0.5">
          <div className="px-3 pt-1 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
            Overview
          </div>
          {authorizedOverview.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? "bg-stone-900 text-white font-semibold shadow-2xs"
                    : "text-stone-700 hover:bg-stone-200/70 hover:text-stone-950"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* B. BUSINESS ECOSYSTEM MANAGEMENT */}
      {renderExpandableSection("Business Ecosystem Management", authorizedEcosystem)}

      {/* C. PLATFORM OPERATIONS */}
      {renderExpandableSection("Platform Operations", authorizedOperations)}
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-[#FAF9F5] text-stone-900 font-sans antialiased">
      {/* 1. Dedicated Admin Control Center Desktop Sidebar */}
      <aside className="w-68 border-r border-stone-200 bg-[#F4F1EA] flex-col justify-between hidden lg:flex shrink-0 h-screen sticky top-0">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Admin Brand Header */}
          <div className="h-16 flex items-center px-4 border-b border-stone-200/90 gap-2.5 shrink-0 bg-white/80">
            <Link to="/admin/dashboard" className="flex items-center min-w-0 hover:opacity-90 transition">
              <CoverlyLogo variant="horizontal" size="sm" subtitle="Admin Center" />
            </Link>
            <span className="ml-auto text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-900 text-emerald-400 font-mono shrink-0">
              Live
            </span>
          </div>

          {renderSidebarNav()}

          {/* Admin Identity Footer */}
          <div className="p-3 border-t border-stone-200/90 bg-white/70 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-bold text-stone-900 truncate">
                  {user?.full_name || "Administrator"}
                </div>
                <div className="text-[10px] text-amber-800 font-mono font-semibold truncate">
                  {formatAdminRoleLabel(activeRole || user?.roles?.[0])}
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Sign Out from Admin Control Center"
                className="p-1.5 rounded-lg text-stone-500 hover:text-red-700 hover:bg-red-50 transition shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Main Admin Workspace Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Dedicated Admin Topbar (Zero Public Marketplace Elements or Workspace Switchers) */}
        <header className="h-16 border-b border-stone-200 bg-white px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 sticky top-0 z-30 shadow-2xs">
          {/* Left: Mobile Drawer Toggle, Title & Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100"
              aria-label="Open Admin Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium min-w-0">
              <Link
                to="/admin/dashboard"
                className="hover:text-stone-950 transition flex items-center gap-1.5 font-bold text-stone-800 shrink-0"
              >
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">Admin Control Center</span>
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="font-bold text-stone-950 truncate">{getBreadcrumbTitle()}</span>
            </div>
          </div>

          {/* Center: Global Admin Search */}
          <form onSubmit={handleGlobalSearch} className="hidden md:flex items-center w-72 lg:w-96 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search manufacturers, retailers, RFQs, orders, KYC..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-100 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-800 focus:bg-white"
            />
          </form>

          {/* Right: Notifications, Admin Profile Menu & Logout */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/admin/notifications"
              className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition relative"
              title="Admin Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 absolute top-2 right-2" />
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs transition"
              >
                <div className="w-6 h-6 rounded-full bg-stone-900 text-amber-400 font-bold text-[10px] flex items-center justify-center uppercase">
                  {(user?.full_name || "A").charAt(0)}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <div className="font-bold text-stone-900 max-w-[120px] truncate">
                    {user?.full_name || "Admin"}
                  </div>
                  <div className="text-[10px] text-stone-500 max-w-[120px] truncate">
                    {formatAdminRoleLabel(activeRole || user?.roles?.[0])}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl border border-stone-200 shadow-lg py-1.5 z-50 text-xs">
                  <div className="px-3.5 py-2 border-b border-stone-100">
                    <div className="font-bold text-stone-900 truncate">{user?.full_name}</div>
                    <div className="text-[11px] text-stone-500 truncate">{user?.email}</div>
                  </div>
                  {canAccessAdminModule(user?.roles, activeRole, "system_admin") && (
                    <Link
                      to="/admin/settings"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-stone-700 hover:bg-stone-50"
                    >
                      <Settings className="w-3.5 h-3.5 text-stone-500" />
                      Platform Settings
                    </Link>
                  )}
                  {canAccessAdminModule(user?.roles, activeRole, "overview") && (
                    <Link
                      to="/admin/audit-logs"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-stone-700 hover:bg-stone-50"
                    >
                      <Clock className="w-3.5 h-3.5 text-stone-500" />
                      Audit Logs
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-red-700 hover:bg-red-50 font-semibold border-t border-stone-100 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:text-red-700 hover:border-red-200 hover:bg-red-50 text-xs font-semibold transition"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* 3. Main Admin Content Area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* 4. Mobile Admin Drawer Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#FAF9F5] shadow-2xl border-r border-stone-200">
            <div className="h-16 flex items-center justify-between px-4 border-b border-stone-200 bg-white">
              <CoverlyLogo variant="horizontal" size="sm" subtitle="Admin Center" />
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 rounded-md text-stone-500 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderSidebarNav()}
          </div>
        </div>
      )}
    </div>
  );
};
