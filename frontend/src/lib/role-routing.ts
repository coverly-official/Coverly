import type { UserRole } from "@/types";

export const getWorkspaceRoute = (role?: UserRole | null): string => {
  switch (role) {
    case "service_provider":
      return "/provider/dashboard";
    case "manufacturer":
    case "wholesaler":
    case "distributor":
      return "/supplier/dashboard";
    case "admin":
    case "verification_admin":
    case "support_admin":
      return "/admin/dashboard";
    case "buyer_supplier":
      return "/buyer/dashboard";
    case "buyer":
    default:
      return "/buyer/dashboard";
  }
};
