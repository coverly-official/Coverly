import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user, activeRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Handle buyer_supplier dual role: can access both buyer and supplier workspaces
  const isAuthorized =
    allowedRoles.includes(activeRole) ||
    (activeRole.includes("admin") && allowedRoles.includes("admin")) ||
    (user.roles.includes("buyer_supplier") &&
      (allowedRoles.includes("buyer") ||
        allowedRoles.includes("manufacturer") ||
        allowedRoles.includes("wholesaler") ||
        allowedRoles.includes("distributor")));

  if (!isAuthorized) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
};
