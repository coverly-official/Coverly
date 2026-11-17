import type { UserRole } from "@/types";

export interface WorkspaceItem {
  role: UserRole;
  label: string;
  category: "buyer" | "supplier" | "service" | "logistics" | "trade" | "internal";
  route: string;
  description: string;
}

export const WORKSPACE_REGISTRY: Record<string, WorkspaceItem> = {
  buyer: {
    role: "buyer",
    label: "Buyer Workspace",
    category: "buyer",
    route: "/buyer/dashboard",
    description: "Manage RFQs, compare quotations, purchase orders & teams",
  },
  retailer: {
    role: "retailer",
    label: "Retailer Workspace",
    category: "buyer",
    route: "/retailer/dashboard",
    description: "Multi-branch store inventory, reorders & wholesale purchases",
  },
  buyer_supplier: {
    role: "buyer_supplier",
    label: "Buyer & Supplier Console",
    category: "buyer",
    route: "/buyer/dashboard",
    description: "Combined procurement & product supplying workspace",
  },
  manufacturer: {
    role: "manufacturer",
    label: "Manufacturer Hub",
    category: "supplier",
    route: "/supplier/dashboard",
    description: "Manage factory catalogue, wholesale RFQs & incoming orders",
  },
  wholesaler: {
    role: "wholesaler",
    label: "Wholesaler Hub",
    category: "supplier",
    route: "/supplier/dashboard",
    description: "Bulk inventory, distribution quotes & trade orders",
  },
  distributor: {
    role: "distributor",
    label: "Distributor Hub",
    category: "supplier",
    route: "/supplier/dashboard",
    description: "Regional distribution, retail supply & fulfillment",
  },
  raw_material_supplier: {
    role: "raw_material_supplier",
    label: "Raw Materials Workspace",
    category: "supplier",
    route: "/raw-material-supplier/dashboard",
    description: "Grade specs, mill certificates, MOQ tiers & contracts",
  },
  packaging_supplier: {
    role: "packaging_supplier",
    label: "Packaging Workspace",
    category: "supplier",
    route: "/packaging-supplier/dashboard",
    description: "Custom cartons, labels, dielectric pouches & bulk crates",
  },
  importer: {
    role: "importer",
    label: "Importer Trade Hub",
    category: "trade",
    route: "/trade/dashboard",
    description: "Port clearance, customs compliance & overseas consignments",
  },
  exporter: {
    role: "exporter",
    label: "Exporter Trade Hub",
    category: "trade",
    route: "/trade/dashboard",
    description: "Global buyer enquiries, Incoterms, multi-currency quotes",
  },
  importer_exporter: {
    role: "importer_exporter",
    label: "International Trade Hub",
    category: "trade",
    route: "/trade/dashboard",
    description: "Cross-border container shipments, letters of credit & trade",
  },
  service_provider: {
    role: "service_provider",
    label: "Business Services Workspace",
    category: "service",
    route: "/provider/dashboard",
    description: "Consulting proposals, deliverables, milestone payments",
  },
  logistics_partner: {
    role: "logistics_partner",
    label: "Logistics Partner Console",
    category: "logistics",
    route: "/logistics-partner",
    description: "Freight quotes, fleet routing, multi-modal container tracking",
  },
  transporter: {
    role: "transporter",
    label: "Transporter Fleet Console",
    category: "logistics",
    route: "/transporter",
    description: "Vehicle trips, e-way bill verification, electronic POD",
  },
  sales_agent: {
    role: "sales_agent",
    label: "Sales Agent Console",
    category: "service",
    route: "/agent/dashboard",
    description: "Buyer leads, verified quotations, client sourcing & commissions",
  },
  sales_manager: {
    role: "sales_manager",
    label: "Sales Manager Console",
    category: "service",
    route: "/agent/dashboard",
    description: "Territory agents, commission payouts & deal pipeline",
  },
  procurement_manager: {
    role: "procurement_manager",
    label: "Procurement Manager",
    category: "internal",
    route: "/buyer/dashboard",
    description: "Approve purchase requisitions, PO authority & vendor reviews",
  },
  purchase_staff: {
    role: "purchase_staff",
    label: "Purchase Staff Desk",
    category: "internal",
    route: "/buyer/dashboard",
    description: "Create sourcing lists, initiate RFQs & track delivery",
  },
  finance_accounts_staff: {
    role: "finance_accounts_staff",
    label: "Finance & Accounts Desk",
    category: "internal",
    route: "/buyer/invoices",
    description: "3-way match, vendor invoice verification & payment release",
  },
  super_admin: {
    role: "super_admin",
    label: "Super Admin Control Center",
    category: "internal",
    route: "/admin/dashboard",
    description: "Supreme platform governance, security, audit & role hierarchy",
  },
  admin: {
    role: "admin",
    label: "Admin Control Center",
    category: "internal",
    route: "/admin/dashboard",
    description: "Full marketplace governance, verification, audit & roles",
  },
  finance_admin: {
    role: "finance_admin",
    label: "Finance Admin Console",
    category: "internal",
    route: "/admin/dashboard",
    description: "System financial transactions, commissions & billing",
  },
  verification_admin: {
    role: "verification_admin",
    label: "Verification Admin Console",
    category: "internal",
    route: "/admin/verifications",
    description: "GSTIN, IEC, MSME & company document checks",
  },
  verification_manager: {
    role: "verification_manager",
    label: "Verification Manager Desk",
    category: "internal",
    route: "/admin/verifications",
    description: "Enterprise compliance, vendor licenses & factory audits",
  },
  marketplace_manager: {
    role: "marketplace_manager",
    label: "Marketplace Manager Desk",
    category: "internal",
    route: "/admin/products",
    description: "Product moderation, categories, listings & supplier directory",
  },
  procurement_operations_manager: {
    role: "procurement_operations_manager",
    label: "Procurement Ops Manager",
    category: "internal",
    route: "/admin/rfqs",
    description: "Cross-marketplace RFQs, bulk tenders & guest sourcing leads",
  },
  order_operations_manager: {
    role: "order_operations_manager",
    label: "Order Operations Manager",
    category: "internal",
    route: "/admin/orders",
    description: "Fulfillment monitoring, PO tracking & dispute escalations",
  },
  logistics_operations_manager: {
    role: "logistics_operations_manager",
    label: "Logistics Ops Manager",
    category: "internal",
    route: "/admin/logistics",
    description: "Transporter fleets, waybills, consignment telemetry",
  },
  support_admin: {
    role: "support_admin",
    label: "Support Admin Console",
    category: "internal",
    route: "/admin/support",
    description: "Dispute resolution, tickets & mediation",
  },
  support_executive: {
    role: "support_executive",
    label: "Support Executive Desk",
    category: "internal",
    route: "/admin/support",
    description: "Customer service tickets, mediation & complaints",
  },
  compliance_manager: {
    role: "compliance_manager",
    label: "Compliance Manager Desk",
    category: "internal",
    route: "/admin/audit-logs",
    description: "Regulatory compliance, tamper logs & safety audits",
  },
  quality_operations_manager: {
    role: "quality_operations_manager",
    label: "Quality Ops Manager Desk",
    category: "internal",
    route: "/admin/verifications",
    description: "Product quality reviews, supplier standards & inspections",
  },
};

export const ALL_ADMIN_ROLES: UserRole[] = [
  "super_admin",
  "admin",
  "verification_admin",
  "verification_manager",
  "marketplace_manager",
  "procurement_operations_manager",
  "order_operations_manager",
  "logistics_operations_manager",
  "finance_admin",
  "support_admin",
  "support_executive",
  "compliance_manager",
  "quality_operations_manager",
];

export const isAdminRole = (role?: string | null): boolean => {
  if (!role) return false;
  return (
    ALL_ADMIN_ROLES.includes(role as UserRole) ||
    role.includes("admin") ||
    role.endsWith("_admin") ||
    role === "super_admin"
  );
};

export const getWorkspaceRoute = (role?: UserRole | null): string => {
  if (!role) return "/buyer/dashboard";
  if (isAdminRole(role)) return "/admin/dashboard";
  const item = WORKSPACE_REGISTRY[role];
  return item ? item.route : "/buyer/dashboard";
};

export const getWorkspaceItem = (role?: UserRole | null): WorkspaceItem => {
  if (!role || !WORKSPACE_REGISTRY[role]) {
    return WORKSPACE_REGISTRY.buyer;
  }
  return WORKSPACE_REGISTRY[role];
};
