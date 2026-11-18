import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedUser } from "../../middleware/auth.js";
import { sendError } from "../../utils/response.js";
import {
  ALLOWED_PAYMENT_PROVIDERS,
  type PaymentEnvironment,
  type PaymentMethodCode,
  type PaymentProviderCode,
  type ProviderCredentialStatus,
  rupeesToPaise,
} from "./payment.interface.js";

const PAYMENT_ADMIN_ROLES = new Set(["super_admin", "admin", "finance_admin"]);

export function canManagePaymentGateways(user: AuthenticatedUser | undefined | null): boolean {
  if (!user) return false;
  const roles = Array.isArray(user.roles) ? [...user.roles] : [];
  if (user.activeRole && !roles.includes(user.activeRole)) {
    roles.push(user.activeRole);
  }
  return roles.some((r) => PAYMENT_ADMIN_ROLES.has(r));
}

export function requirePaymentAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return sendError(res, "Authentication required.", 401, "UNAUTHORIZED");
  }
  if (!canManagePaymentGateways(req.user)) {
    return sendError(
      res,
      "Access denied. Only Super Admin or Finance Admin roles may modify payment gateway settings or issue refunds.",
      403,
      "PAYMENT_ADMIN_FORBIDDEN"
    );
  }
  return next();
}

export function isValidProviderCode(value: unknown): value is PaymentProviderCode {
  return typeof value === "string" && (ALLOWED_PAYMENT_PROVIDERS as readonly string[]).includes(value);
}

export function isValidEnvironment(value: unknown): value is PaymentEnvironment {
  return value === "sandbox" || value === "production";
}

export function validateCheckoutInitiationPayload(body: Record<string, any>): {
  valid: boolean;
  error?: string;
  orderId?: string;
  paymentMethod?: PaymentMethodCode;
  idempotencyKey?: string;
  taxPaise?: number;
  freightPaise?: number;
  otherChargesPaise?: number;
} {
  const orderId = typeof body.order_id === "string" ? body.order_id.trim() : "";
  if (!orderId) {
    return { valid: false, error: "order_id is required to initiate checkout." };
  }

  const allowedMethods: PaymentMethodCode[] = ["upi", "card", "netbanking", "wallet"];
  const rawMethod = typeof body.payment_method === "string" ? body.payment_method.trim().toLowerCase() : "";
  const paymentMethod = allowedMethods.includes(rawMethod as PaymentMethodCode)
    ? (rawMethod as PaymentMethodCode)
    : undefined;

  if (rawMethod && !paymentMethod) {
    return {
      valid: false,
      error: `Unsupported payment_method "${rawMethod}". Allowed: ${allowedMethods.join(", ")}.`,
    };
  }

  const idempotencyKey =
    typeof body.idempotency_key === "string" && body.idempotency_key.trim().length >= 8
      ? body.idempotency_key.trim().slice(0, 128)
      : undefined;

  let taxPaise = 0;
  let freightPaise = 0;
  let otherChargesPaise = 0;
  try {
    if (body.tax_amount !== undefined) taxPaise = Math.max(0, rupeesToPaise(body.tax_amount));
    if (body.freight_amount !== undefined) freightPaise = Math.max(0, rupeesToPaise(body.freight_amount));
    if (body.other_charges !== undefined) otherChargesPaise = Math.max(0, rupeesToPaise(body.other_charges));
  } catch (e: any) {
    return { valid: false, error: e.message || "Invalid monetary charge amount." };
  }

  return {
    valid: true,
    orderId,
    paymentMethod,
    idempotencyKey,
    taxPaise,
    freightPaise,
    otherChargesPaise,
  };
}

export function validateRefundRequest(params: {
  paymentStatus: string;
  amountPaise: number;
  refundedPaise: number;
  requestedAmount?: string | number;
  refundType?: string;
  reason?: string;
}): {
  valid: boolean;
  error?: string;
  refundType?: "full" | "partial";
  refundAmountPaise?: number;
  reason?: string;
} {
  const { paymentStatus, amountPaise, refundedPaise, requestedAmount, refundType, reason } = params;

  if (!["SUCCESS", "PARTIALLY_REFUNDED"].includes(paymentStatus)) {
    return {
      valid: false,
      error: `Payment in status "${paymentStatus}" is not eligible for a refund. Only verified SUCCESS or PARTIALLY_REFUNDED payments can be refunded.`,
    };
  }

  const remainingPaise = amountPaise - refundedPaise;
  if (remainingPaise <= 0) {
    return { valid: false, error: "This payment has already been fully refunded." };
  }

  const cleanReason = typeof reason === "string" ? reason.trim() : "";
  if (cleanReason.length < 5) {
    return { valid: false, error: "A clear refund reason (minimum 5 characters) is mandatory." };
  }

  const normalizedType = refundType === "partial" ? "partial" : "full";
  let refundAmountPaise = remainingPaise;

  if (normalizedType === "partial") {
    if (requestedAmount === undefined || requestedAmount === null || String(requestedAmount).trim() === "") {
      return { valid: false, error: "Partial refund requires a valid positive amount." };
    }
    try {
      refundAmountPaise = rupeesToPaise(requestedAmount);
    } catch {
      return { valid: false, error: "Invalid partial refund amount format." };
    }
    if (refundAmountPaise <= 0) {
      return { valid: false, error: "Refund amount must be greater than zero." };
    }
    if (refundAmountPaise > remainingPaise) {
      return {
        valid: false,
        error: `Requested refund exceeds remaining refundable balance (${(remainingPaise / 100).toFixed(2)} INR).`,
      };
    }
  }

  return {
    valid: true,
    refundType: refundAmountPaise === remainingPaise && refundedPaise === 0 ? "full" : normalizedType,
    refundAmountPaise,
    reason: cleanReason,
  };
}

export function validateGatewayActivation(params: {
  credStatus: ProviderCredentialStatus;
  requestedMode: PaymentEnvironment;
  lastConnectionStatus?: string | null;
  requireConnectionVerified?: boolean;
}): { valid: boolean; error?: string } {
  const { credStatus, requestedMode, lastConnectionStatus, requireConnectionVerified = true } = params;

  if (!credStatus.configured) {
    return {
      valid: false,
      error: `Cannot enable ${credStatus.displayName}. Missing server environment variables: ${credStatus.missingEnvVars.join(", ")}.`,
    };
  }

  if (credStatus.environmentMismatchError) {
    return { valid: false, error: credStatus.environmentMismatchError };
  }

  if (requestedMode === "production" && credStatus.environmentFromEnv !== "production") {
    return {
      valid: false,
      error: `Environment separation violation: ${credStatus.displayName} server credentials are configured for "${credStatus.environmentFromEnv}" mode and cannot be enabled in "production" mode.`,
    };
  }

  if (requestedMode === "production" && !credStatus.webhookSecretConfigured) {
    return {
      valid: false,
      error: `Production mode requires webhook signature verification secret to be configured for ${credStatus.displayName}.`,
    };
  }

  if (requireConnectionVerified && lastConnectionStatus !== "connected") {
    return {
      valid: false,
      error: `Test Connection must succeed for ${credStatus.displayName} before enabling it for live checkout.`,
    };
  }

  return { valid: true };
}
