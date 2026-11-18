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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const AUTH_CACHE_TTL_MS = 15_000;
const AUTH_USER_CACHE = new Map<string, { user: AuthenticatedUser; expiresAt: number }>();

export function invalidateAuthCache(userId?: string) {
  if (userId) AUTH_USER_CACHE.delete(userId);
  else AUTH_USER_CACHE.clear();
}

function extractUserIdFromTokenOrHeader(authHeader?: string, xUserId?: string): string | null {
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (UUID_RE.test(token)) {
      return token;
    }
    // Extract `sub` UUID from InsForge JWT payload when Bearer token is a JWT
    const parts = token.split(".");
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
        if (typeof payload?.sub === "string" && UUID_RE.test(payload.sub)) {
          return payload.sub;
        }
      } catch {
        // Fallback to x-user-id
      }
    }
  }

  if (xUserId && UUID_RE.test(xUserId.trim())) {
    return xUserId.trim();
  }

  return null;
}

/**
 * Validates authentication via Bearer token (JWT or user UUID) or x-user-id header.
 * Verifies account existence, active status, and assigns roles.
 */
export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const xUserId = req.headers["x-user-id"] as string | undefined;

  const userId = extractUserIdFromTokenOrHeader(authHeader, xUserId);

  if (!userId) {
    return sendError(res, "Authentication required. Please provide a valid session or token.", 401, "UNAUTHORIZED");
  }

  // Fast-path: serve recently verified active user from short 15s TTL memory cache
  const cached = AUTH_USER_CACHE.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    if (!cached.user.is_active) {
      return sendError(res, "Account has been suspended. Please contact customer support.", 403, "ACCOUNT_SUSPENDED");
    }
    req.user = cached.user;
    return next();
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");
  }

  try {
    // Run user profile + roles lookup in a single parallel network round-trip
    const [profileRes, rolesRes] = await Promise.all([
      insforge.database
        .from("users")
        .select("id, email, full_name, phone, is_active")
        .eq("id", userId)
        .single(),
      insforge.database
        .from("user_roles")
        .select("role, is_primary")
        .eq("user_id", userId),
    ]);

    const { data: userProfile, error: userError } = profileRes;
    if (userError || !userProfile) {
      AUTH_USER_CACHE.delete(userId);
      return sendError(res, "User profile not found or invalid session.", 401, "INVALID_SESSION");
    }

    if (!userProfile.is_active) {
      AUTH_USER_CACHE.delete(userId);
      return sendError(res, "Account has been suspended. Please contact customer support.", 403, "ACCOUNT_SUSPENDED");
    }

    const roles = rolesRes.data || [];
    const userRoles = roles.map((r: any) => r.role);
    const activeRole = roles.find((r: any) => r.is_primary)?.role || userRoles[0] || "buyer";

    const authenticated: AuthenticatedUser = {
      id: userProfile.id,
      email: userProfile.email,
      full_name: userProfile.full_name,
      phone: userProfile.phone,
      is_active: userProfile.is_active,
      roles: userRoles.length > 0 ? userRoles : [activeRole],
      activeRole,
    };

    AUTH_USER_CACHE.set(userId, { user: authenticated, expiresAt: Date.now() + AUTH_CACHE_TTL_MS });
    req.user = authenticated;

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

  const userId = extractUserIdFromTokenOrHeader(authHeader, xUserId);
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
 * Complete set of administrative and platform governance employee roles.
 */
export const ALL_ADMIN_ROLES = [
  "admin",
  "super_admin",
  "verification_admin",
  "verification_manager",
  "marketplace_manager",
  "procurement_operations_manager",
  "order_operations_manager",
  "logistics_operations_manager",
  "finance_admin",
  "finance_accounts_staff",
  "support_admin",
  "support_executive",
  "compliance_manager",
  "quality_operations_manager",
];

export function isPlatformAdmin(user?: AuthenticatedUser | null): boolean {
  if (!user) return false;
  const roles = Array.isArray(user.roles) ? user.roles : [];
  const activeRole = typeof user.activeRole === "string" ? user.activeRole : "";
  return (
    roles.some(
      (r) =>
        ALL_ADMIN_ROLES.includes(r) ||
        (typeof r === "string" && (r.includes("admin") || r.endsWith("_admin"))) ||
        r === "super_admin"
    ) ||
    ALL_ADMIN_ROLES.includes(activeRole) ||
    (activeRole ? activeRole.includes("admin") : false)
  );
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
      isPlatformAdmin(req.user) ||
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
 * Restricts access to administrative roles.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return sendError(res, "Authentication required.", 401, "UNAUTHORIZED");
  }

  if (!isPlatformAdmin(req.user)) {
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
    if (isPlatformAdmin(req.user)) {
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
