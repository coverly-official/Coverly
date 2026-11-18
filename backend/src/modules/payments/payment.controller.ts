import type { Request, Response } from "express";
import { sendError, sendSuccess } from "../../utils/response.js";
import {
  getActiveGatewayForCheckout,
  getAdminPaymentDashboard,
  getGatewayConfigsForAdmin,
  getOrderCheckoutSummary,
  initiateOrderCheckout,
  initiatePaymentRefund,
  syncRefundStatusWithProvider,
  testGatewayConnection,
  updateGatewayConfig,
  verifyPaymentWithProvider,
} from "./payment.service.js";
import {
  isValidEnvironment,
  isValidProviderCode,
  validateCheckoutInitiationPayload,
} from "./payment.validation.js";
import type { PaymentEnvironment, PaymentMethodCode } from "./payment.interface.js";

// GET /api/payments/active-gateway
export async function getActiveGatewayHandler(_req: Request, res: Response) {
  try {
    const data = await getActiveGatewayForCheckout();
    return sendSuccess(res, data);
  } catch (err: any) {
    return sendError(res, err?.message || "Failed to load active gateway.", err?.status || 500);
  }
}

// GET /api/payments/orders/:orderId/summary
export async function getOrderCheckoutSummaryHandler(req: Request, res: Response) {
  try {
    const data = await getOrderCheckoutSummary(String(req.params.orderId), req.user!);
    return sendSuccess(res, data);
  } catch (err: any) {
    return sendError(res, err?.message || "Failed to load order checkout summary.", err?.status || 500, err?.code);
  }
}

// POST /api/payments/checkout
export async function initiateCheckoutHandler(req: Request, res: Response) {
  const validation = validateCheckoutInitiationPayload(req.body || {});
  if (!validation.valid) {
    return sendError(res, validation.error || "Invalid checkout payload.", 400, "VALIDATION_FAILED");
  }

  try {
    const data = await initiateOrderCheckout({
      orderId: validation.orderId!,
      paymentMethod: validation.paymentMethod,
      idempotencyKey: validation.idempotencyKey,
      user: req.user!,
    });
    return sendSuccess(res, data, "Payment checkout initialized.", 201);
  } catch (err: any) {
    return sendError(res, err?.message || "Failed to initiate payment checkout.", err?.status || 500, err?.code);
  }
}

// POST /api/payments/:paymentId/verify
export async function verifyPaymentHandler(req: Request, res: Response) {
  const { provider_order_id, provider_payment_id, provider_signature } = (req.body || {}) as {
    provider_order_id?: string;
    provider_payment_id?: string;
    provider_signature?: string;
  };

  try {
    const data = await verifyPaymentWithProvider({
      paymentId: String(req.params.paymentId),
      providerOrderId: provider_order_id,
      providerPaymentId: provider_payment_id,
      providerSignature: provider_signature,
      user: req.user!,
    });
    return sendSuccess(res, data, data.verified ? "Payment verified by provider." : "Payment status synced.");
  } catch (err: any) {
    return sendError(res, err?.message || "Payment verification failed.", err?.status || 500, err?.code);
  }
}

// GET /api/payments/admin/gateways
export async function listAdminGatewaysHandler(_req: Request, res: Response) {
  try {
    const gateways = await getGatewayConfigsForAdmin();
    return sendSuccess(res, { gateways });
  } catch (err: any) {
    return sendError(res, err?.message || "Failed to load gateway configurations.", 500);
  }
}

// POST /api/payments/admin/gateways/:provider/test
export async function testAdminGatewayHandler(req: Request, res: Response) {
  const provider = String(req.params.provider || "").trim().toLowerCase();
  if (!isValidProviderCode(provider)) {
    return sendError(res, "Unsupported payment provider.", 400, "INVALID_PROVIDER");
  }
  try {
    const result = await testGatewayConnection(provider, req.user!);
    return sendSuccess(res, result, result.message);
  } catch (err: any) {
    return sendError(res, err?.message || "Gateway connection test failed.", 500);
  }
}

// PATCH /api/payments/admin/gateways/:provider
export async function updateAdminGatewayHandler(req: Request, res: Response) {
  const provider = String(req.params.provider || "").trim().toLowerCase();
  if (!isValidProviderCode(provider)) {
    return sendError(res, "Unsupported payment provider.", 400, "INVALID_PROVIDER");
  }

  const { mode, is_enabled, is_active_primary, supported_methods } = (req.body || {}) as {
    mode?: PaymentEnvironment;
    is_enabled?: boolean;
    is_active_primary?: boolean;
    supported_methods?: PaymentMethodCode[];
  };

  if (mode !== undefined && !isValidEnvironment(mode)) {
    return sendError(res, 'Mode must be "sandbox" or "production".', 400, "INVALID_MODE");
  }

  try {
    const updated = await updateGatewayConfig(
      provider,
      { mode, is_enabled, is_active_primary, supported_methods },
      req.user!
    );
    return sendSuccess(res, updated, "Payment gateway configuration updated.");
  } catch (err: any) {
    return sendError(res, err?.message || "Failed to update payment gateway.", err?.status || 500, err?.code);
  }
}

// GET /api/payments/admin/dashboard
export async function getAdminPaymentsDashboardHandler(req: Request, res: Response) {
  const { provider, status, limit } = req.query as Record<string, string | undefined>;
  try {
    const data = await getAdminPaymentDashboard({
      provider,
      status,
      limit: limit ? Number(limit) : undefined,
    });
    return sendSuccess(res, data);
  } catch (err: any) {
    return sendError(res, err?.message || "Failed to load admin payments dashboard.", 500);
  }
}

// POST /api/payments/admin/:paymentId/refund
export async function initiateRefundHandler(req: Request, res: Response) {
  const { refund_type, amount, reason } = (req.body || {}) as {
    refund_type?: "full" | "partial";
    amount?: string | number;
    reason?: string;
  };

  try {
    const refund = await initiatePaymentRefund({
      paymentId: String(req.params.paymentId),
      refundType: refund_type === "partial" ? "partial" : "full",
      amount,
      reason: reason || "",
      admin: req.user!,
    });
    return sendSuccess(res, refund, "Refund request submitted to payment gateway.", 201);
  } catch (err: any) {
    return sendError(res, err?.message || "Failed to initiate refund.", err?.status || 500, err?.code);
  }
}

// POST /api/payments/admin/refunds/:refundId/sync
export async function syncRefundStatusHandler(req: Request, res: Response) {
  try {
    const data = await syncRefundStatusWithProvider(String(req.params.refundId), req.user!);
    return sendSuccess(res, data);
  } catch (err: any) {
    return sendError(res, err?.message || "Failed to sync refund status.", err?.status || 500, err?.code);
  }
}
