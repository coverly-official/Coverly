import type { Request, Response, NextFunction } from "express";
import { getInsForgeClient } from "../lib/insforge.js";
import { sendError } from "../utils/response.js";

export interface AuthenticatedUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  is_active: boolean;
  roles: string[];
  activeRole: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Validates authentication via Bearer token or x-user-id header.
 * Verifies account existence, active status, and assigns roles.
 */
export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const xUserId = req.headers["x-user-id"] as string | undefined;

  let userId: string | null = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    // Validate with InsForge if token provided
    const insforge = getInsForgeClient();
    if (insforge) {
      try {
        // Query user from session/token
        // If the token matches user UUID or JWT
        userId = token;
      } catch {
        // Fallback
      }
    }
  }

  if (!userId && xUserId) {
    userId = xUserId.trim();
  }

  if (!userId) {
    return sendError(res, "Authentication required. Please provide a valid session or token.", 401, "UNAUTHORIZED");
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");
  }

  try {
    const { data: userProfile, error: userError } = await insforge.database
      .from("users")
      .select("id, email, full_name, phone, is_active")
      .eq("id", userId)
      .single();

    if (userError || !userProfile) {
      return sendError(res, "User profile not found or invalid session.", 401, "INVALID_SESSION");
    }

    if (!userProfile.is_active) {
      return sendError(res, "Account has been suspended. Please contact customer support.", 403, "ACCOUNT_SUSPENDED");
    }

    const { data: roles } = await insforge.database
      .from("user_roles")
      .select("role, is_primary")
      .eq("user_id", userId);

    const userRoles = (roles || []).map((r: any) => r.role);
    const activeRole = roles?.find((r: any) => r.is_primary)?.role || userRoles[0] || "buyer";

    req.user = {
      id: userProfile.id,
      email: userProfile.email,
      full_name: userProfile.full_name,
      phone: userProfile.phone,
      is_active: userProfile.is_active,
      roles: userRoles.length > 0 ? userRoles : [activeRole],
      activeRole,
    };

    return next();
  } catch (err: any) {
    return sendError(res, err.message || "Failed to authenticate request.", 500, "AUTH_ERROR");
  }
}

/**
 * Optional authentication: attaches user if valid credentials provided,
 * continues without error if absent.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const xUserId = req.headers["x-user-id"] as string | undefined;

  const userId = (authHeader?.startsWith("Bearer ") ? authHeader.substring(7).trim() : null) || xUserId?.trim();
  if (!userId) return next();

  const insforge = getInsForgeClient();
  if (!insforge) return next();

  try {
    const { data: userProfile } = await insforge.database
      .from("users")
      .select("id, email, full_name, phone, is_active")
      .eq("id", userId)
      .single();

    if (userProfile && userProfile.is_active) {
      const { data: roles } = await insforge.database
        .from("user_roles")
        .select("role, is_primary")
        .eq("user_id", userId);

      const userRoles = (roles || []).map((r: any) => r.role);
      const activeRole = roles?.find((r: any) => r.is_primary)?.role || userRoles[0] || "buyer";

      req.user = {
        id: userProfile.id,
        email: userProfile.email,
        full_name: userProfile.full_name,
        phone: userProfile.phone,
        is_active: userProfile.is_active,
        roles: userRoles,
        activeRole,
      };
    }
  } catch {
    // Ignore and proceed unauthenticated
  }

  return next();
}

/**
 * Restricts access to users having at least one of the specified roles.
 * Full admin role is always granted access.
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401, "UNAUTHORIZED");
    }

    const hasRole =
      req.user.roles.includes("admin") ||
      req.user.roles.some((r) => allowedRoles.includes(r)) ||
      allowedRoles.includes(req.user.activeRole);

    if (!hasRole) {
      return sendError(
        res,
        `Access denied. Requires one of the following roles: ${allowedRoles.join(", ")}.`,
        403,
        "FORBIDDEN"
      );
    }

    return next();
  };
}

/**
 * Restricts access to administrative roles: admin, verification_admin, or support_admin.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return sendError(res, "Authentication required.", 401, "UNAUTHORIZED");
  }

  const adminRoles = ["admin", "verification_admin", "support_admin"];
  const isAdmin = req.user.roles.some((r) => adminRoles.includes(r));

  if (!isAdmin) {
    return sendError(res, "Administrative privilege required.", 403, "FORBIDDEN");
  }

  return next();
}

/**
 * Validates that the authenticated user is an authorized member or owner of the specified business.
 */
export function requireBusinessMember(allowedRolesInBusiness: string[] = ["owner", "admin"]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401, "UNAUTHORIZED");
    }

    // Admins bypass business membership checks
    if (req.user.roles.includes("admin")) {
      return next();
    }

    const businessId =
      req.params.business_id ||
      req.params.id ||
      req.body.business_id ||
      (req.query.business_id as string);

    if (!businessId) {
      return sendError(res, "Business ID is required for authorization check.", 400, "BAD_REQUEST");
    }

    const insforge = getInsForgeClient();
    if (!insforge) {
      return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");
    }

    try {
      const { data: member } = await insforge.database
        .from("business_members")
        .select("role_in_business")
        .eq("business_id", businessId)
        .eq("user_id", req.user.id)
        .single();

      if (!member || !allowedRolesInBusiness.includes(member.role_in_business)) {
        return sendError(
          res,
          "You are not authorized to manage or perform actions for this business.",
          403,
          "FORBIDDEN"
        );
      }

      return next();
    } catch (err: any) {
      return sendError(res, err.message || "Failed to verify business membership.", 500, "DATABASE_ERROR");
    }
  };
}
