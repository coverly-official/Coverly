import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ALL_ADMIN_ROLES, isAdminRole } from "@/lib/role-routing";
import type { UserRole } from "@/types";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user, activeRole, setActiveRole, isLoading } = useAuth();
  const location = useLocation();

  const userRoles = (user?.roles && user.roles.length > 0)
    ? user.roles
    : (activeRole && activeRole !== "guest" ? [activeRole] : []);

  const isUserAdmin = userRoles.some((r) => isAdminRole(r));
  const isSuperAdmin = userRoles.includes("super_admin" as UserRole) || userRoles.includes("admin" as UserRole);
  const routeRequiresAdmin = allowedRoles.some((r) => isAdminRole(r));

  // Auto-synchronize activeRole when an authorized admin visits an admin route
  useEffect(() => {
    if (isUserAdmin && routeRequiresAdmin && !isAdminRole(activeRole)) {
      const primaryAdminRole = (userRoles.find((r) => isAdminRole(r)) || "admin") as UserRole;
      setActiveRole(primaryAdminRole);
    }
  }, [isUserAdmin, routeRequiresAdmin, activeRole, userRoles, setActiveRole]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/auth/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Super Admin & Admin have full oversight over all platform workspaces
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // Admin employee accessing an admin-protected route
  if (isUserAdmin && routeRequiresAdmin) {
    // Only allow if employee's exact role is in allowedRoles (never blanket bypass for restricted employees)
    const hasAdminPerm =
      userRoles.some((r) => allowedRoles.includes(r as UserRole)) ||
      allowedRoles.includes(activeRole);

    if (hasAdminPerm) {
      return <>{children}</>;
    }
  }

  // Standard multi-role and active-role evaluation
  const isAuthorized =
    allowedRoles.includes(activeRole) ||
    userRoles.some((r) => allowedRoles.includes(r as UserRole)) ||
    (userRoles.includes("buyer_supplier" as UserRole) &&
      (allowedRoles.includes("buyer") ||
        allowedRoles.includes("manufacturer") ||
        allowedRoles.includes("wholesaler") ||
        allowedRoles.includes("distributor"))) ||
    (userRoles.includes("importer_exporter" as UserRole) &&
      (allowedRoles.includes("importer" as UserRole) || allowedRoles.includes("exporter" as UserRole)));

  if (!isAuthorized) {
    return <Navigate to={`/access-denied?attempted=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
};
