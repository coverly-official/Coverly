import { Router } from "express";
import { authenticateUser, requireAdmin } from "../../middleware/auth.js";
import { requirePaymentAdmin } from "./payment.validation.js";
import {
  getActiveGatewayHandler,
  getAdminPaymentsDashboardHandler,
  getOrderCheckoutSummaryHandler,
  initiateCheckoutHandler,
  initiateRefundHandler,
  listAdminGatewaysHandler,
  syncRefundStatusHandler,
  testAdminGatewayHandler,
  updateAdminGatewayHandler,
  verifyPaymentHandler,
} from "./payment.controller.js";
import { handleProviderWebhook } from "./payment.webhook.js";

const router = Router();

// Publicly callable provider webhooks (authenticated strictly via cryptographic provider signature!)
router.post("/payments/webhooks/:provider", handleProviderWebhook);

// Authenticated Buyer / Business Checkout Routes
router.get("/payments/active-gateway", authenticateUser, getActiveGatewayHandler);
router.get("/payments/orders/:orderId/summary", authenticateUser, getOrderCheckoutSummaryHandler);
router.post("/payments/checkout", authenticateUser, initiateCheckoutHandler);
router.post("/payments/:paymentId/verify", authenticateUser, verifyPaymentHandler);

// Super Admin & Finance Admin Payment Gateway Settings & Operations
router.get("/payments/admin/gateways", authenticateUser, requireAdmin, requirePaymentAdmin, listAdminGatewaysHandler);
router.post(
  "/payments/admin/gateways/:provider/test",
  authenticateUser,
  requireAdmin,
  requirePaymentAdmin,
  testAdminGatewayHandler
);
router.patch(
  "/payments/admin/gateways/:provider",
  authenticateUser,
  requireAdmin,
  requirePaymentAdmin,
  updateAdminGatewayHandler
);
router.get(
  "/payments/admin/dashboard",
  authenticateUser,
  requireAdmin,
  requirePaymentAdmin,
  getAdminPaymentsDashboardHandler
);
router.post(
  "/payments/admin/:paymentId/refund",
  authenticateUser,
  requireAdmin,
  requirePaymentAdmin,
  initiateRefundHandler
);
router.post(
  "/payments/admin/refunds/:refundId/sync",
  authenticateUser,
  requireAdmin,
  requirePaymentAdmin,
  syncRefundStatusHandler
);

export default router;
