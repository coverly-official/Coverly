import crypto from "node:crypto";
import {
  type CreateProviderOrderInput,
  type CreateProviderOrderResult,
  type FetchRefundStatusInput,
  type InitiateRefundInput,
  type PaymentEnvironment,
  type PaymentLifecycleStatus,
  type PaymentMethodCode,
  type PaymentProviderAdapter,
  type ProcessWebhookInput,
  type ProcessWebhookResult,
  type ProviderCredentialStatus,
  type ProviderPaymentStatusResult,
  type ProviderRefundResult,
  type TestConnectionResult,
  type VerifyProviderPaymentInput,
} from "../payment.interface.js";

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

function detectRazorpayKeyEnvironment(keyId: string): PaymentEnvironment {
  if (keyId.startsWith("rzp_live_")) return "production";
  return "sandbox";
}

function mapRazorpayPaymentStatus(status?: string | null): PaymentLifecycleStatus {
  const s = String(status || "").toLowerCase();
  if (s === "captured") return "SUCCESS";
  if (s === "authorized") return "PROCESSING";
  if (s === "created") return "PENDING";
  if (s === "failed") return "FAILED";
  if (s === "refunded") return "REFUNDED";
  return "PENDING";
}

export class RazorpayProvider implements PaymentProviderAdapter {
  readonly provider = "razorpay" as const;
  readonly displayName = "Razorpay";
  readonly apiVersionLabel = "Razorpay Orders & Payments REST API v1";
  readonly supportedMethods: PaymentMethodCode[] = ["upi", "card", "netbanking", "wallet"];
  readonly splitSettlementProduct = "Razorpay Route (requires separate activation & linked account KYC)";

  private getCredentials() {
    const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
    const webhookSecret = (process.env.RAZORPAY_WEBHOOK_SECRET || "").trim();
    const environmentFromEnv = detectRazorpayKeyEnvironment(keyId);
    return { keyId, keySecret, webhookSecret, environmentFromEnv };
  }

  private getAuthHeader(keyId: string, keySecret: string): string {
    return `Basic ${Buffer.from(`${keyId}:${keySecret}`, "utf8").toString("base64")}`;
  }

  getConfigStatus(modeOverride?: PaymentEnvironment): ProviderCredentialStatus {
    const { keyId, keySecret, webhookSecret, environmentFromEnv } = this.getCredentials();
    const missingEnvVars: string[] = [];
    const configuredEnvVars: string[] = [];

    if (keyId) configuredEnvVars.push("RAZORPAY_KEY_ID");
    else missingEnvVars.push("RAZORPAY_KEY_ID");

    if (keySecret) configuredEnvVars.push("RAZORPAY_KEY_SECRET");
    else missingEnvVars.push("RAZORPAY_KEY_SECRET");

    if (webhookSecret) configuredEnvVars.push("RAZORPAY_WEBHOOK_SECRET");
    else missingEnvVars.push("RAZORPAY_WEBHOOK_SECRET");

    let environmentMismatchError: string | undefined;
    if (keyId && modeOverride === "production" && !keyId.startsWith("rzp_live_")) {
      environmentMismatchError =
        'Razorpay environment mismatch: production mode requires a "rzp_live_*" key ID, not a test key.';
    } else if (keyId && modeOverride === "sandbox" && keyId.startsWith("rzp_live_")) {
      environmentMismatchError =
        'Razorpay environment mismatch: sandbox mode must not use a live "rzp_live_*" key ID.';
    }

    return {
      provider: this.provider,
      displayName: this.displayName,
      configured: Boolean(keyId && keySecret),
      missingEnvVars,
      configuredEnvVars,
      environmentFromEnv,
      environmentMismatchError,
      webhookSecretConfigured: Boolean(webhookSecret),
      webhookUrlPath: "/api/payments/webhooks/razorpay",
      supportedMethods: this.supportedMethods,
      splitSettlementProduct: this.splitSettlementProduct,
      apiVersionLabel: this.apiVersionLabel,
    };
  }

  async testConnection(modeOverride?: PaymentEnvironment): Promise<TestConnectionResult> {
    const checkedAt = new Date().toISOString();
    const status = this.getConfigStatus(modeOverride);
    const { keyId, keySecret, environmentFromEnv } = this.getCredentials();
    const env = modeOverride || environmentFromEnv;

    if (!status.configured) {
      return {
        connected: false,
        status: "missing_credentials",
        environment: env,
        message: `Razorpay credentials not configured. Missing: ${status.missingEnvVars.join(", ")}.`,
        missingEnvVars: status.missingEnvVars,
        checkedAt,
      };
    }

    if (status.environmentMismatchError) {
      return {
        connected: false,
        status: "failed",
        environment: env,
        message: status.environmentMismatchError,
        checkedAt,
      };
    }

    try {
      // Read-only probe: GET /v1/orders?count=1 authenticates credentials cleanly without side effects
      const res = await fetch(`${RAZORPAY_API_BASE}/orders?count=1`, {
        method: "GET",
        headers: {
          Authorization: this.getAuthHeader(keyId, keySecret),
          Accept: "application/json",
        },
      });

      if (res.ok) {
        return {
          connected: true,
          status: "connected",
          environment: environmentFromEnv,
          message: `Razorpay ${environmentFromEnv} API authenticated successfully (REST v1).`,
          httpStatus: res.status,
          checkedAt,
        };
      }

      const body = await res.json().catch(() => ({}));
      return {
        connected: false,
        status: "failed",
        environment: environmentFromEnv,
        message: body?.error?.description || `Razorpay authentication failed (HTTP ${res.status}).`,
        httpStatus: res.status,
        checkedAt,
      };
    } catch (err: any) {
      return {
        connected: false,
        status: "failed",
        environment: environmentFromEnv,
        message: `Unable to reach Razorpay API: ${err?.message || "network error"}.`,
        checkedAt,
      };
    }
  }

  async createPaymentOrder(input: CreateProviderOrderInput): Promise<CreateProviderOrderResult> {
    const { keyId, keySecret, environmentFromEnv } = this.getCredentials();
    if (!keyId || !keySecret) {
      return {
        success: false,
        error: "Razorpay credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are not configured.",
        errorCode: "MISSING_CREDENTIALS",
      };
    }

    const statusCheck = this.getConfigStatus(input.modeOverride);
    if (statusCheck.environmentMismatchError) {
      return {
        success: false,
        error: statusCheck.environmentMismatchError,
        errorCode: "ENVIRONMENT_MISMATCH",
      };
    }

    try {
      const res = await fetch(`${RAZORPAY_API_BASE}/orders`, {
        method: "POST",
        headers: {
          Authorization: this.getAuthHeader(keyId, keySecret),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          amount: input.amountPaise, // Razorpay requires integer paise
          currency: input.currency || "INR",
          receipt: input.paymentReference.slice(0, 40),
          notes: {
            payment_reference: input.paymentReference,
            order_number: input.orderNumber,
            ...(input.notes || {}),
          },
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.id) {
        return {
          success: false,
          error: body?.error?.description || `Razorpay order creation failed (HTTP ${res.status}).`,
          errorCode: body?.error?.code || "RAZORPAY_ORDER_FAILED",
        };
      }

      return {
        success: true,
        providerOrderId: String(body.id),
        rawStatus: String(body.status || "created"),
        // Only public key_id is returned to checkout — NEVER key_secret!
        checkoutPayload: {
          provider: "razorpay",
          environment: environmentFromEnv,
          key_id: keyId,
          razorpay_order_id: body.id,
          amount_paise: body.amount,
          currency: body.currency,
          name: "COVERLY B2B Procurement",
          description: `Order ${input.orderNumber}`,
          prefill: {
            name: input.customer.name,
            email: input.customer.email,
            contact: input.customer.phone,
          },
          sdk_url: "https://checkout.razorpay.com/v1/checkout.js",
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Razorpay network error: ${err?.message || "request failed"}`,
        errorCode: "NETWORK_ERROR",
      };
    }
  }

  async initiateCheckout(input: CreateProviderOrderInput): Promise<CreateProviderOrderResult> {
    return this.createPaymentOrder(input);
  }

  async verifyPayment(input: VerifyProviderPaymentInput): Promise<ProviderPaymentStatusResult> {
    const { keyId, keySecret } = this.getCredentials();
    if (!keyId || !keySecret) {
      return {
        success: false,
        verified: false,
        status: "PENDING",
        error: "Razorpay credentials are not configured.",
        errorCode: "MISSING_CREDENTIALS",
      };
    }

    // 1. If Razorpay Checkout signature provided, verify HMAC-SHA256(order_id + "|" + payment_id)
    if (input.providerOrderId && input.providerPaymentId && input.providerSignature) {
      const expected = crypto
        .createHmac("sha256", keySecret)
        .update(`${input.providerOrderId}|${input.providerPaymentId}`)
        .digest("hex");

      const sigBuf = Buffer.from(input.providerSignature.trim(), "utf8");
      const expBuf = Buffer.from(expected, "utf8");
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return {
          success: false,
          verified: false,
          status: "FAILED",
          error: "Invalid Razorpay payment signature.",
          errorCode: "INVALID_SIGNATURE",
        };
      }
    }

    // 2. Always confirm authoritative captured status via Razorpay Payments API
    return this.fetchTransactionStatus({
      paymentReference: input.paymentReference,
      providerOrderId: input.providerOrderId,
      providerPaymentId: input.providerPaymentId,
      modeOverride: input.modeOverride,
    });
  }

  async fetchTransactionStatus(input: {
    paymentReference: string;
    providerOrderId?: string;
    providerPaymentId?: string;
    modeOverride?: PaymentEnvironment;
  }): Promise<ProviderPaymentStatusResult> {
    const { keyId, keySecret } = this.getCredentials();
    if (!keyId || !keySecret) {
      return {
        success: false,
        verified: false,
        status: "PENDING",
        error: "Razorpay credentials are not configured.",
        errorCode: "MISSING_CREDENTIALS",
      };
    }

    try {
      const endpoint = input.providerPaymentId
        ? `${RAZORPAY_API_BASE}/payments/${encodeURIComponent(input.providerPaymentId)}`
        : `${RAZORPAY_API_BASE}/orders/${encodeURIComponent(input.providerOrderId || "")}`;

      const res = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: this.getAuthHeader(keyId, keySecret),
          Accept: "application/json",
        },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          verified: false,
          status: "PENDING",
          error: body?.error?.description || `Razorpay lookup failed (HTTP ${res.status}).`,
          errorCode: body?.error?.code || "RAZORPAY_STATUS_ERROR",
        };
      }

      if (input.providerPaymentId) {
        const mapped = mapRazorpayPaymentStatus(body.status);
        return {
          success: true,
          verified: mapped === "SUCCESS",
          status: mapped,
          providerOrderId: body.order_id ? String(body.order_id) : input.providerOrderId,
          providerPaymentId: String(body.id),
          paymentMethod: body.method ? String(body.method) : undefined,
          gatewayFeePaise: typeof body.fee === "number" ? body.fee : undefined,
          amountPaise: typeof body.amount === "number" ? body.amount : undefined,
          rawStatus: String(body.status || ""),
          failureReason: body.error_description ? String(body.error_description) : undefined,
        };
      }

      const orderStatus = String(body.status || "").toLowerCase();
      const mapped: PaymentLifecycleStatus = orderStatus === "paid" ? "SUCCESS" : "PENDING";
      return {
        success: true,
        verified: mapped === "SUCCESS",
        status: mapped,
        providerOrderId: String(body.id),
        amountPaise: typeof body.amount === "number" ? body.amount : undefined,
        rawStatus: orderStatus,
      };
    } catch (err: any) {
      return {
        success: false,
        verified: false,
        status: "PENDING",
        error: `Razorpay network error: ${err?.message || "lookup failed"}`,
        errorCode: "NETWORK_ERROR",
      };
    }
  }

  async processWebhook(input: ProcessWebhookInput): Promise<ProcessWebhookResult> {
    const { webhookSecret } = this.getCredentials();
    const signature = String(input.headers["x-razorpay-signature"] || "").trim();
    const eventId = String(
      input.headers["x-razorpay-event-id"] ||
        `${input.parsedBody?.event || "unknown"}:${input.parsedBody?.payload?.payment?.entity?.id || Date.now()}`
    );
    const eventType = String(input.parsedBody?.event || "unknown");

    if (!webhookSecret || !signature) {
      return {
        signatureValid: false,
        providerEventId: eventId,
        eventType,
        error: "Missing Razorpay webhook secret or x-razorpay-signature header.",
      };
    }

    const expectedSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(input.rawBody)
      .digest("hex");

    const sigBuf = Buffer.from(signature, "utf8");
    const expBuf = Buffer.from(expectedSig, "utf8");
    const valid = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);

    if (!valid) {
      return {
        signatureValid: false,
        providerEventId: eventId,
        eventType,
        error: "Invalid Razorpay webhook signature.",
      };
    }

    const paymentEntity = input.parsedBody?.payload?.payment?.entity || {};
    const orderEntity = input.parsedBody?.payload?.order?.entity || {};
    const refundEntity = input.parsedBody?.payload?.refund?.entity || {};

    let mappedStatus: PaymentLifecycleStatus | undefined;
    if (eventType === "payment.captured" || eventType === "order.paid") mappedStatus = "SUCCESS";
    else if (eventType === "payment.failed") mappedStatus = "FAILED";
    else if (eventType === "payment.authorized") mappedStatus = "PROCESSING";

    let refundStatus: "REFUND_PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | undefined;
    if (eventType === "refund.processed") refundStatus = "SUCCESS";
    else if (eventType === "refund.failed") refundStatus = "FAILED";
    else if (eventType === "refund.created") refundStatus = "PROCESSING";

    return {
      signatureValid: true,
      providerEventId: eventId,
      eventType,
      paymentReference:
        paymentEntity.notes?.payment_reference ||
        orderEntity.notes?.payment_reference ||
        orderEntity.receipt ||
        undefined,
      providerOrderId: paymentEntity.order_id || orderEntity.id || undefined,
      providerPaymentId: paymentEntity.id || refundEntity.payment_id || undefined,
      mappedStatus,
      refundId: refundEntity.id || undefined,
      refundStatus,
      gatewayFeePaise: typeof paymentEntity.fee === "number" ? paymentEntity.fee : undefined,
      failureReason: paymentEntity.error_description || undefined,
    };
  }

  async initiateRefund(input: InitiateRefundInput): Promise<ProviderRefundResult> {
    const { keyId, keySecret } = this.getCredentials();
    if (!keyId || !keySecret) {
      return {
        success: false,
        status: "FAILED",
        error: "Razorpay credentials are not configured.",
        errorCode: "MISSING_CREDENTIALS",
      };
    }
    if (!input.providerPaymentId) {
      return {
        success: false,
        status: "FAILED",
        error: "Razorpay provider_payment_id (pay_*) is required to initiate a refund.",
        errorCode: "MISSING_PAYMENT_ID",
      };
    }

    try {
      const res = await fetch(
        `${RAZORPAY_API_BASE}/payments/${encodeURIComponent(input.providerPaymentId)}/refund`,
        {
          method: "POST",
          headers: {
            Authorization: this.getAuthHeader(keyId, keySecret),
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            amount: input.amountPaise,
            receipt: input.refundReference.slice(0, 40),
            notes: {
              refund_reference: input.refundReference,
              reason: input.reason.slice(0, 200),
            },
          }),
        }
      );

      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.id) {
        return {
          success: false,
          status: "FAILED",
          error: body?.error?.description || `Razorpay refund failed (HTTP ${res.status}).`,
          errorCode: body?.error?.code || "RAZORPAY_REFUND_FAILED",
        };
      }

      const raw = String(body.status || "pending").toLowerCase();
      return {
        success: true,
        status: raw === "processed" ? "SUCCESS" : raw === "failed" ? "FAILED" : "PROCESSING",
        providerRefundId: String(body.id),
        rawStatus: raw,
      };
    } catch (err: any) {
      return {
        success: false,
        status: "FAILED",
        error: `Razorpay refund network error: ${err?.message || "request failed"}`,
        errorCode: "NETWORK_ERROR",
      };
    }
  }

  async fetchRefundStatus(input: FetchRefundStatusInput): Promise<ProviderRefundResult> {
    const { keyId, keySecret } = this.getCredentials();
    if (!keyId || !keySecret || !input.providerPaymentId || !input.providerRefundId) {
      return {
        success: false,
        status: "FAILED",
        error: "Razorpay credentials, payment ID, and refund ID are required.",
        errorCode: "MISSING_PARAMETERS",
      };
    }

    try {
      const res = await fetch(
        `${RAZORPAY_API_BASE}/payments/${encodeURIComponent(input.providerPaymentId)}/refunds/${encodeURIComponent(input.providerRefundId)}`,
        {
          method: "GET",
          headers: {
            Authorization: this.getAuthHeader(keyId, keySecret),
            Accept: "application/json",
          },
        }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          status: "FAILED",
          error: body?.error?.description || `Razorpay refund lookup failed (HTTP ${res.status}).`,
          errorCode: body?.error?.code || "RAZORPAY_REFUND_STATUS_FAILED",
        };
      }
      const raw = String(body.status || "pending").toLowerCase();
      return {
        success: true,
        status: raw === "processed" ? "SUCCESS" : raw === "failed" ? "FAILED" : "PROCESSING",
        providerRefundId: String(body.id),
        rawStatus: raw,
      };
    } catch (err: any) {
      return {
        success: false,
        status: "FAILED",
        error: `Razorpay refund lookup error: ${err?.message || "request failed"}`,
        errorCode: "NETWORK_ERROR",
      };
    }
  }
}
