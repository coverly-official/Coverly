import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedUser } from "./auth.js";
import { sendError } from "../utils/response.js";

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

/**
 * Role-based module authorization matrix for COVERLY Admin Control Center.
 * Super Admin and Admin hold full governance access; specialized operational
 * roles are strictly limited to their authorized modules.
 */
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

export function hasAdminModuleAccess(
  user: AuthenticatedUser | undefined | null,
  module: AdminModuleKey
): boolean {
  if (!user) return false;
  const roles = Array.isArray(user.roles) ? [...user.roles] : [];
  if (typeof user.activeRole === "string" && user.activeRole && !roles.includes(user.activeRole)) {
    roles.push(user.activeRole);
  }

  for (const role of roles) {
    const allowed = ADMIN_ROLE_PERMISSIONS[role];
    if (allowed && allowed.includes(module)) {
      return true;
    }
  }
  return false;
}

/**
 * Express middleware enforcing fine-grained Admin Control Center module permissions.
 * Unauthorized admin employees receive HTTP 403 FORBIDDEN.
 */
export function requireAdminModule(...modules: AdminModuleKey[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401, "UNAUTHORIZED");
    }

    const allowed = modules.some((mod) => hasAdminModuleAccess(req.user, mod));
    if (!allowed) {
      return sendError(
        res,
        `Access denied. Your administrative role does not permit access to: ${modules.join(", ")}.`,
        403,
        "MODULE_FORBIDDEN"
      );
    }

    return next();
  };
}
