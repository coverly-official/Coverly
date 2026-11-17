import { describe, it, expect } from "vitest";
import { canAccessAdminModule, ALL_ADMIN_MODULES } from "./admin-permissions";
import { ALL_ADMIN_ROLES, getWorkspaceRoute, isAdminRole } from "./role-routing";

describe("Admin Control Center RBAC & Routing", () => {
  it("routes every Admin role directly to /admin/dashboard and never to Guest Marketplace", () => {
    for (const role of ALL_ADMIN_ROLES) {
      expect(isAdminRole(role)).toBe(true);
      expect(getWorkspaceRoute(role)).toBe("/admin/dashboard");
    }
  });

  it("grants Super Admin and Admin access to every Admin Control Center module", () => {
    for (const mod of ALL_ADMIN_MODULES) {
      expect(canAccessAdminModule(["super_admin"], "super_admin", mod)).toBe(true);
      expect(canAccessAdminModule(["admin"], "admin", mod)).toBe(true);
    }
  });

  it("enforces module-level boundaries for specialized operational Admin roles", () => {
    // Verification Manager
    expect(canAccessAdminModule(["verification_manager"], "verification_manager", "verification")).toBe(true);
    expect(canAccessAdminModule(["verification_manager"], "verification_manager", "manufacturers")).toBe(true);
    expect(canAccessAdminModule(["verification_manager"], "verification_manager", "finance")).toBe(false);
    expect(canAccessAdminModule(["verification_manager"], "verification_manager", "system_admin")).toBe(false);

    // Marketplace Manager
    expect(canAccessAdminModule(["marketplace_manager"], "marketplace_manager", "marketplace")).toBe(true);
    expect(canAccessAdminModule(["marketplace_manager"], "marketplace_manager", "wholesalers")).toBe(true);
    expect(canAccessAdminModule(["marketplace_manager"], "marketplace_manager", "finance")).toBe(false);

    // Procurement Operations Manager
    expect(canAccessAdminModule(["procurement_operations_manager"], "procurement_operations_manager", "procurement")).toBe(true);
    expect(canAccessAdminModule(["procurement_operations_manager"], "procurement_operations_manager", "buyers")).toBe(true);
    expect(canAccessAdminModule(["procurement_operations_manager"], "procurement_operations_manager", "system_admin")).toBe(false);

    // Order Operations Manager
    expect(canAccessAdminModule(["order_operations_manager"], "order_operations_manager", "orders")).toBe(true);
    expect(canAccessAdminModule(["order_operations_manager"], "order_operations_manager", "warehouse")).toBe(true);
    expect(canAccessAdminModule(["order_operations_manager"], "order_operations_manager", "system_admin")).toBe(false);

    // Logistics Operations Manager
    expect(canAccessAdminModule(["logistics_operations_manager"], "logistics_operations_manager", "logistics")).toBe(true);
    expect(canAccessAdminModule(["logistics_operations_manager"], "logistics_operations_manager", "transporters")).toBe(true);
    expect(canAccessAdminModule(["logistics_operations_manager"], "logistics_operations_manager", "finance")).toBe(false);

    // Finance / Accounts Staff
    expect(canAccessAdminModule(["finance_accounts_staff"], "finance_accounts_staff", "finance")).toBe(true);
    expect(canAccessAdminModule(["finance_accounts_staff"], "finance_accounts_staff", "system_admin")).toBe(false);

    // Support Executive
    expect(canAccessAdminModule(["support_executive"], "support_executive", "support")).toBe(true);
    expect(canAccessAdminModule(["support_executive"], "support_executive", "finance")).toBe(false);

    // Compliance Manager
    expect(canAccessAdminModule(["compliance_manager"], "compliance_manager", "verification")).toBe(true);
    expect(canAccessAdminModule(["compliance_manager"], "compliance_manager", "system_admin")).toBe(true);
    expect(canAccessAdminModule(["compliance_manager"], "compliance_manager", "finance")).toBe(false);

    // Quality Operations Manager
    expect(canAccessAdminModule(["quality_operations_manager"], "quality_operations_manager", "warehouse")).toBe(true);
    expect(canAccessAdminModule(["quality_operations_manager"], "quality_operations_manager", "marketplace")).toBe(true);
    expect(canAccessAdminModule(["quality_operations_manager"], "quality_operations_manager", "finance")).toBe(false);
  });

  it("denies non-admin and guest users access to every Admin Control Center module", () => {
    for (const role of ["guest", "buyer", "retailer", "manufacturer", "wholesaler", "distributor"]) {
      for (const mod of ALL_ADMIN_MODULES) {
        expect(canAccessAdminModule([role], role, mod)).toBe(false);
      }
    }
  });
});
