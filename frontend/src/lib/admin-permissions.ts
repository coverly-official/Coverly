import type { UserRole } from "@/types";

export type AdminModuleKey =
  | "overview"
  | "buyers"
  | "retailers"
  | "manufacturers"
  | "wholesalers"
  | "distributors"
  | "raw_materials"
  | "packaging"
  | "import_export"
  | "logistics"
  | "transporters"
  | "services"
  | "sales_agents"
  | "marketplace"
  | "procurement"
  | "orders"
  | "warehouse"
  | "finance"
  | "users"
  | "verification"
  | "support"
  | "system_admin";

export const ALL_ADMIN_MODULES: AdminModuleKey[] = [
  "overview",
  "buyers",
  "retailers",
  "manufacturers",
  "wholesalers",
  "distributors",
  "raw_materials",
  "packaging",
  "import_export",
  "logistics",
  "transporters",
  "services",
  "sales_agents",
  "marketplace",
  "procurement",
  "orders",
  "warehouse",
  "finance",
  "users",
  "verification",
  "support",
  "system_admin",
];

export const ADMIN_ROLE_PERMISSIONS: Record<string, AdminModuleKey[]> = {
  super_admin: [...ALL_ADMIN_MODULES],
  admin: [...ALL_ADMIN_MODULES],
  verification_manager: [
    "overview",
    "verification",
    "buyers",
    "retailers",
    "manufacturers",
    "wholesalers",
    "distributors",
    "raw_materials",
    "packaging",
    "import_export",
    "services",
    "sales_agents",
    "users",
  ],
  verification_admin: [
    "overview",
    "verification",
    "buyers",
    "retailers",
    "manufacturers",
    "wholesalers",
    "distributors",
    "raw_materials",
    "packaging",
    "import_export",
    "services",
    "sales_agents",
    "users",
  ],
  marketplace_manager: [
    "overview",
    "marketplace",
    "manufacturers",
    "wholesalers",
    "distributors",
    "raw_materials",
    "packaging",
    "services",
  ],
  procurement_operations_manager: [
    "overview",
    "procurement",
    "buyers",
    "retailers",
    "manufacturers",
    "wholesalers",
    "raw_materials",
    "packaging",
    "import_export",
  ],
  order_operations_manager: [
    "overview",
    "orders",
    "procurement",
    "warehouse",
    "buyers",
    "retailers",
    "manufacturers",
    "wholesalers",
    "distributors",
    "import_export",
  ],
  logistics_operations_manager: [
    "overview",
    "logistics",
    "transporters",
    "warehouse",
    "orders",
    "import_export",
  ],
  finance_accounts_staff: [
    "overview",
    "finance",
    "orders",
    "procurement",
    "sales_agents",
  ],
  finance_admin: [
    "overview",
    "finance",
    "orders",
    "procurement",
    "sales_agents",
  ],
  support_executive: [
    "overview",
    "support",
    "users",
    "orders",
    "services",
  ],
  support_admin: [
    "overview",
    "support",
    "users",
    "orders",
    "services",
  ],
  compliance_manager: [
    "overview",
    "verification",
    "system_admin",
    "users",
    "import_export",
    "manufacturers",
    "distributors",
  ],
  quality_operations_manager: [
    "overview",
    "verification",
    "marketplace",
    "warehouse",
    "manufacturers",
    "services",
  ],
};

export const ADMIN_ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  verification_manager: "Verification Manager",
  verification_admin: "Verification Manager",
  marketplace_manager: "Marketplace Manager",
  procurement_operations_manager: "Procurement Operations Manager",
  order_operations_manager: "Order Operations Manager",
  logistics_operations_manager: "Logistics Operations Manager",
  finance_accounts_staff: "Finance / Accounts Staff",
  finance_admin: "Finance / Accounts Staff",
  support_executive: "Support Executive",
  support_admin: "Support Executive",
  compliance_manager: "Compliance Manager",
  quality_operations_manager: "Quality Operations Manager",
};

export function canAccessAdminModule(
  roles: (UserRole | string)[] | undefined,
  activeRole: UserRole | string | undefined,
  module: AdminModuleKey
): boolean {
  const combined = new Set<string>();
  if (Array.isArray(roles)) {
    roles.forEach((r) => r && combined.add(r));
  }
  if (activeRole && activeRole !== "guest") {
    combined.add(activeRole);
  }

  for (const role of combined) {
    const allowed = ADMIN_ROLE_PERMISSIONS[role];
    if (allowed && allowed.includes(module)) {
      return true;
    }
  }
  return false;
}

export function getAuthorizedModules(
  roles: (UserRole | string)[] | undefined,
  activeRole: UserRole | string | undefined
): AdminModuleKey[] {
  const result = new Set<AdminModuleKey>();
  const combined = new Set<string>();
  if (Array.isArray(roles)) {
    roles.forEach((r) => r && combined.add(r));
  }
  if (activeRole && activeRole !== "guest") {
    combined.add(activeRole);
  }

  for (const role of combined) {
    const allowed = ADMIN_ROLE_PERMISSIONS[role];
    if (allowed) {
      allowed.forEach((m) => result.add(m));
    }
  }
  return Array.from(result);
}

export function formatAdminRoleLabel(role?: string | null): string {
  if (!role) return "Administrator";
  return ADMIN_ROLE_LABELS[role] || role.replace(/_/g, " ");
}
