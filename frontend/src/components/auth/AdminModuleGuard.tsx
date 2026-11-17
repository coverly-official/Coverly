import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  canAccessAdminModule,
  formatAdminRoleLabel,
  type AdminModuleKey,
} from "@/lib/admin-permissions";
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react";

interface AdminModuleGuardProps {
  module: AdminModuleKey;
  children: React.ReactNode;
}

/**
 * Enforces fine-grained Role-Based Access Control inside the Admin Control Center.
 * Super Admin and Admin have full access; operational admin employees can only view
 * and operate modules authorized for their specific role.
 */
export const AdminModuleGuard: React.FC<AdminModuleGuardProps> = ({ module, children }) => {
  const { user, activeRole } = useAuth();

  const hasAccess = canAccessAdminModule(user?.roles, activeRole, module);

  if (!hasAccess) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white border border-stone-200 rounded-2xl p-8 shadow-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 text-red-700 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[11px] font-bold uppercase tracking-wider mb-3">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          Restricted Admin Module
        </div>
        <h2 className="text-lg font-bold text-stone-900">
          Insufficient Administrative Permissions
        </h2>
        <p className="text-xs text-stone-600 mt-2 leading-relaxed">
          Your current role (
          <span className="font-semibold text-stone-900">
            {formatAdminRoleLabel(activeRole || user?.roles?.[0])}
          </span>
          ) is not authorized to access the{" "}
          <span className="font-mono font-semibold text-stone-900">
            {module.replace(/_/g, " ")}
          </span>{" "}
          module. Contact a Super Admin to update your role permissions.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
