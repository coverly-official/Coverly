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
  paiseToRupeesString,
  rupeesToPaise,
} from "../payment.interface.js";

const CASHFREE_API_VERSION = "2023-08-01";
const MAX_WEBHOOK_AGE_MS = 10 * 60 * 1000; // 10-minute replay protection window

function resolveEnvMode(modeOverride?: PaymentEnvironment): PaymentEnvironment {
  const raw = (modeOverride || process.env.CASHFREE_ENVIRONMENT || "sandbox").trim().toLowerCase();
  return raw === "production" || raw === "prod" ? "production" : "sandbox";
}

function getBaseUrl(mode: PaymentEnvironment): string {
  return mode === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

function mapCashfreeStatus(cfStatus?: string | null): PaymentLifecycleStatus {
  const s = String(cfStatus || "").toUpperCase();
  if (s === "PAID" || s === "SUCCESS") return "SUCCESS";
  if (s === "ACTIVE" || s === "PENDING" || s === "FLAGGED") return "PENDING";
  if (s === "EXPIRED") return "EXPIRED";
  if (s === "TERMINATED" || s === "CANCELLED" || s === "USER_DROPPED") return "CANCELLED";
  if (s === "FAILED" || s === "VOID" || s === "NOT_ATTEMPTED") return "FAILED";
  return "PROCESSING";
}

export class CashfreeProvider implements PaymentProviderAdapter {
  readonly provider = "cashfree" as const;
  readonly displayName = "Cashfree Payments";
  readonly apiVersionLabel = `Cashfree PG REST API v${CASHFREE_API_VERSION}`;
  readonly supportedMethods: PaymentMethodCode[] = ["upi", "card", "netbanking", "wallet"];
  readonly splitSettlementProduct = "Cashfree Easy Split (requires separate merchant onboarding & approval)";

  private getCredentials(modeOverride?: PaymentEnvironment) {
    const clientId = (process.env.CASHFREE_CLIENT_ID || "").trim();
    const clientSecret = (process.env.CASHFREE_CLIENT_SECRET || "").trim();
    const webhookSecret = (process.env.CASHFREE_WEBHOOK_SECRET || "").trim();
    const envRaw = (process.env.CASHFREE_ENVIRONMENT || "sandbox").trim().toLowerCase();
    const environmentFromEnv: PaymentEnvironment =
      envRaw === "production" || envRaw === "prod" ? "production" : "sandbox";
    const effectiveMode = resolveEnvMode(modeOverride);
    return { clientId, clientSecret, webhookSecret, environmentFromEnv, effectiveMode };
  }

  getConfigStatus(modeOverride?: PaymentEnvironment): ProviderCredentialStatus {
    const { clientId, clientSecret, webhookSecret, environmentFromEnv } = this.getCredentials(modeOverride);
    const missingEnvVars: string[] = [];
    const configuredEnvVars: string[] = [];

    if (clientId) configuredEnvVars.push("CASHFREE_CLIENT_ID");
    else missingEnvVars.push("CASHFREE_CLIENT_ID");

    if (clientSecret) configuredEnvVars.push("CASHFREE_CLIENT_SECRET");
    else missingEnvVars.push("CASHFREE_CLIENT_SECRET");

    if (webhookSecret) configuredEnvVars.push("CASHFREE_WEBHOOK_SECRET");
    else missingEnvVars.push("CASHFREE_WEBHOOK_SECRET");

    if (process.env.CASHFREE_ENVIRONMENT) configuredEnvVars.push("CASHFREE_ENVIRONMENT");

    const environmentMismatchError =
      modeOverride && modeOverride !== environmentFromEnv
        ? `Cashfree environment mismatch: server env CASHFREE_ENVIRONMENT="${environmentFromEnv}" does not match requested "${modeOverride}" mode.`
        : undefined;

    return {
      provider: this.provider,
      displayName: this.displayName,
      configured: Boolean(clientId && clientSecret),
      missingEnvVars,
      configuredEnvVars,
      environmentFromEnv,
      environmentMismatchError,
      webhookSecretConfigured: Boolean(webhookSecret || clientSecret),
      webhookUrlPath: "/api/payments/webhooks/cashfree",
      supportedMethods: this.supportedMethods,
      splitSettlementProduct: this.splitSettlementProduct,
      apiVersionLabel: this.apiVersionLabel,
    };
  }

  async testConnection(modeOverride?: PaymentEnvironment): Promise<TestConnectionResult> {
    const checkedAt = new Date().toISOString();
    const status = this.getConfigStatus(modeOverride);
    const { clientId, clientSecret, effectiveMode } = this.getCredentials(modeOverride);

    if (!status.configured) {
      return {
        connected: false,
        status: "missing_credentials",
        environment: effectiveMode,
        message: `Cashfree credentials not configured. Missing: ${status.missingEnvVars.join(", ")}.`,
        missingEnvVars: status.missingEnvVars,
        checkedAt,
      };
    }

    if (status.environmentMismatchError) {
      return {
        connected: false,
        status: "failed",
        environment: effectiveMode,
        message: status.environmentMismatchError,
        checkedAt,
      };
    }

    try {
      // Probe official order-fetch endpoint with a synthetic non-existent probe ID.
      // HTTP 404 (order not found) with valid auth proves credentials & API reachability without creating money movement;
      // HTTP 401/403 indicates invalid credentials.
      const res = await fetch(`${getBaseUrl(effectiveMode)}/orders/coverly_conn_probe_0`, {
        method: "GET",
        headers: {
          "x-client-id": clientId,
          "x-client-secret": clientSecret,
          "x-api-version": CASHFREE_API_VERSION,
          Accept: "application/json",
        },
      });

      if (res.status === 200 || res.status === 404) {
        return {
          connected: true,
          status: "connected",
          environment: effectiveMode,
          message: `Cashfree ${effectiveMode} API authenticated successfully (v${CASHFREE_API_VERSION}).`,
          httpStatus: res.status,
          checkedAt,
        };
      }

      const body = await res.json().catch(() => ({}));
      return {
        connected: false,
        status: "failed",
        environment: effectiveMode,
        message: body?.message || `Cashfree authentication failed (HTTP ${res.status}).`,
        httpStatus: res.status,
        checkedAt,
      };
    } catch (err: any) {
      return {
        connected: false,
        status: "failed",
        environment: effectiveMode,
        message: `Unable to reach Cashfree ${effectiveMode} API: ${err?.message || "network error"}.`,
        checkedAt,
      };
    }
  }

  async createPaymentOrder(input: CreateProviderOrderInput): Promise<CreateProviderOrderResult> {
    const { clientId, clientSecret, effectiveMode } = this.getCredentials(input.modeOverride);
    if (!clientId || !clientSecret) {
      return {
        success: false,
        error: "Cashfree credentials (CASHFREE_CLIENT_ID / CASHFREE_CLIENT_SECRET) are not configured.",
        errorCode: "MISSING_CREDENTIALS",
      };
    }

    const orderAmountStr = paiseToRupeesString(input.amountPaise);
    const payload = {
      order_id: input.paymentReference,
      order_amount: Number(orderAmountStr),
      order_currency: input.currency || "INR",
      customer_details: {
        customer_id: input.customer.id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48) || "coverly_buyer",
        customer_name: input.customer.name.slice(0, 96),
        customer_email: input.customer.email,
        customer_phone: input.customer.phone.replace(/[^\d]/g, "").slice(-10) || "9999999999",
      },
      order_meta: {
        return_url: input.returnUrl,
        notify_url: input.notifyUrl,
      },
      order_note: `COVERLY Order ${input.orderNumber}`,
      order_tags: {
        coverly_order_number: input.orderNumber,
        ...(input.notes || {}),
      },
    };

    try {
      const res = await fetch(`${getBaseUrl(effectiveMode)}/orders`, {
        method: "POST",
        headers: {
          "x-client-id": clientId,
          "x-client-secret": clientSecret,
          "x-api-version": CASHFREE_API_VERSION,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.payment_session_id) {
        return {
          success: false,
          error: body?.message || `Cashfree order creation failed (HTTP ${res.status}).`,
          errorCode: body?.code || "CASHFREE_ORDER_FAILED",
        };
      }

      return {
        success: true,
        providerOrderId: String(body.cf_order_id || body.order_id || input.paymentReference),
        providerSessionId: String(body.payment_session_id),
        rawStatus: String(body.order_status || "ACTIVE"),
        checkoutPayload: {
          provider: "cashfree",
          environment: effectiveMode,
          payment_session_id: body.payment_session_id,
          cf_order_id: body.cf_order_id,
          order_id: body.order_id,
          sdk_url: "https://sdk.cashfree.com/js/v3/cashfree.js",
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Cashfree network error: ${err?.message || "request failed"}`,
        errorCode: "NETWORK_ERROR",
      };
    }
  }

  async initiateCheckout(input: CreateProviderOrderInput): Promise<CreateProviderOrderResult> {
    return this.createPaymentOrder(input);
  }

  async fetchTransactionStatus(input: {
    paymentReference: string;
    providerOrderId?: string;
    providerPaymentId?: string;
    modeOverride?: PaymentEnvironment;
  }): Promise<ProviderPaymentStatusResult> {
    const { clientId, clientSecret, effectiveMode } = this.getCredentials(input.modeOverride);
    if (!clientId || !clientSecret) {
      return {
        success: false,
        verified: false,
        status: "PENDING",
        error: "Cashfree credentials are not configured.",
        errorCode: "MISSING_CREDENTIALS",
      };
    }

    try {
      const orderId = encodeURIComponent(input.paymentReference);
      const res = await fetch(`${getBaseUrl(effectiveMode)}/orders/${orderId}`, {
        method: "GET",
        headers: {
          "x-client-id": clientId,
          "x-client-secret": clientSecret,
          "x-api-version": CASHFREE_API_VERSION,
          Accept: "application/json",
        },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          verified: false,
          status: "PENDING",
          error: body?.message || `Cashfree status lookup failed (HTTP ${res.status}).`,
          errorCode: body?.code || "CASHFREE_STATUS_ERROR",
        };
      }

      const mapped = mapCashfreeStatus(body.order_status);
      return {
        success: true,
        verified: mapped === "SUCCESS",
        status: mapped,
        providerOrderId: String(body.cf_order_id || body.order_id || input.paymentReference),
        amountPaise: body.order_amount !== undefined ? rupeesToPaise(body.order_amount) : undefined,
        rawStatus: String(body.order_status || ""),
      };
    } catch (err: any) {
      return {
        success: false,
        verified: false,
        status: "PENDING",
        error: `Cashfree network error: ${err?.message || "status check failed"}`,
        errorCode: "NETWORK_ERROR",
      };
    }
  }

  async verifyPayment(input: VerifyProviderPaymentInput): Promise<ProviderPaymentStatusResult> {
    // Always confirm via authoritative server-to-server Cashfree Order API (never trust browser return URL)
    return this.fetchTransactionStatus({
      paymentReference: input.paymentReference,
      providerOrderId: input.providerOrderId,
      providerPaymentId: input.providerPaymentId,
      modeOverride: input.modeOverride,
    });
  }

  async processWebhook(input: ProcessWebhookInput): Promise<ProcessWebhookResult> {
    const { webhookSecret, clientSecret } = this.getCredentials(input.modeOverride);
    // Cashfree PG webhooks sign using CASHFREE_WEBHOOK_SECRET (or client secret per Cashfree PG v2023-08-01 docs)
    const signingKey = webhookSecret || clientSecret;
    const timestamp = String(input.headers["x-webhook-timestamp"] || "").trim();
    const signature = String(input.headers["x-webhook-signature"] || "").trim();

    const dataObj = input.parsedBody?.data || {};
    const orderObj = dataObj.order || {};
    const paymentObj = dataObj.payment || {};
    const refundObj = dataObj.refund || {};
    const eventType = String(input.parsedBody?.type || "UNKNOWN_EVENT");
    const providerEventId = String(
      input.headers["x-idempotency-key"] ||
        paymentObj.cf_payment_id ||
        refundObj.cf_refund_id ||
        `${eventType}:${orderObj.order_id || "unknown"}:${timestamp}`
    );

    if (!signingKey || !timestamp || !signature) {
      return {
        signatureValid: false,
        providerEventId,
        eventType,
        error: "Missing Cashfree webhook signing key, timestamp, or signature header.",
      };
    }

    // Replay attack timestamp window check (if timestamp is numeric epoch ms/s)
    const numericTs = Number(timestamp);
    if (Number.isFinite(numericTs)) {
      const tsMs = numericTs > 1e12 ? numericTs : numericTs * 1000;
      if (Math.abs(Date.now() - tsMs) > MAX_WEBHOOK_AGE_MS) {
        return {
          signatureValid: false,
          providerEventId,
          eventType,
          error: "Cashfree webhook timestamp outside allowed replay window.",
        };
      }
    }

    // Official Cashfree PG signature: Base64(HMAC-SHA256(secret, timestamp + rawBody))
    const expectedSig = crypto
      .createHmac("sha256", signingKey)
      .update(`${timestamp}${input.rawBody}`)
      .digest("base64");

    const sigBuf = Buffer.from(signature, "utf8");
    const expBuf = Buffer.from(expectedSig, "utf8");
    const valid = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);

    if (!valid) {
      return {
        signatureValid: false,
        providerEventId,
        eventType,
        error: "Invalid Cashfree webhook signature.",
      };
    }

    let mappedStatus: PaymentLifecycleStatus | undefined;
    if (eventType === "PAYMENT_SUCCESS_WEBHOOK") mappedStatus = "SUCCESS";
    else if (eventType === "PAYMENT_FAILED_WEBHOOK") mappedStatus = "FAILED";
    else if (eventType === "PAYMENT_USER_DROPPED_WEBHOOK") mappedStatus = "CANCELLED";
    else if (paymentObj.payment_status) mappedStatus = mapCashfreeStatus(paymentObj.payment_status);

    let refundStatus: "REFUND_PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | undefined;
    if (eventType === "REFUND_STATUS_WEBHOOK" && refundObj.refund_status) {
      const rs = String(refundObj.refund_status).toUpperCase();
      refundStatus = rs === "SUCCESS" ? "SUCCESS" : rs === "PENDING" ? "PROCESSING" : "FAILED";
    }

    return {
      signatureValid: true,
      providerEventId,
      eventType,
      paymentReference: orderObj.order_id ? String(orderObj.order_id) : undefined,
      providerOrderId: orderObj.cf_order_id ? String(orderObj.cf_order_id) : undefined,
      providerPaymentId: paymentObj.cf_payment_id ? String(paymentObj.cf_payment_id) : undefined,
      mappedStatus,
      refundId: refundObj.refund_id ? String(refundObj.refund_id) : undefined,
      refundStatus,
      gatewayFeePaise:
        dataObj.charges_details?.service_charge !== undefined
          ? rupeesToPaise(dataObj.charges_details.service_charge)
          : undefined,
      failureReason: paymentObj.payment_message ? String(paymentObj.payment_message) : undefined,
    };
  }

  async initiateRefund(input: InitiateRefundInput): Promise<ProviderRefundResult> {
    const { clientId, clientSecret, effectiveMode } = this.getCredentials(input.modeOverride);
    if (!clientId || !clientSecret) {
      return {
        success: false,
        status: "FAILED",
        error: "Cashfree credentials are not configured.",
        errorCode: "MISSING_CREDENTIALS",
      };
    }

    try {
      const orderId = encodeURIComponent(input.paymentReference);
      const res = await fetch(`${getBaseUrl(effectiveMode)}/orders/${orderId}/refunds`, {
        method: "POST",
        headers: {
          "x-client-id": clientId,
          "x-client-secret": clientSecret,
          "x-api-version": CASHFREE_API_VERSION,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          refund_amount: Number(paiseToRupeesString(input.amountPaise)),
          refund_id: input.refundReference,
          refund_note: input.reason.slice(0, 200),
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          status: "FAILED",
          error: body?.message || `Cashfree refund initiation failed (HTTP ${res.status}).`,
          errorCode: body?.code || "CASHFREE_REFUND_FAILED",
        };
      }

      const raw = String(body.refund_status || "PENDING").toUpperCase();
      return {
        success: true,
        status: raw === "SUCCESS" ? "SUCCESS" : raw === "ONHOLD" || raw === "PENDING" ? "PROCESSING" : "REFUND_PENDING",
        providerRefundId: String(body.cf_refund_id || body.refund_id || input.refundReference),
        rawStatus: raw,
      };
    } catch (err: any) {
      return {
        success: false,
        status: "FAILED",
        error: `Cashfree refund network error: ${err?.message || "request failed"}`,
        errorCode: "NETWORK_ERROR",
      };
    }
  }

  async fetchRefundStatus(input: FetchRefundStatusInput): Promise<ProviderRefundResult> {
    const { clientId, clientSecret, effectiveMode } = this.getCredentials(input.modeOverride);
    if (!clientId || !clientSecret) {
      return {
        success: false,
        status: "FAILED",
        error: "Cashfree credentials are not configured.",
        errorCode: "MISSING_CREDENTIALS",
      };
    }

    try {
      const orderId = encodeURIComponent(input.providerOrderId || "");
      const refundId = encodeURIComponent(input.refundReference);
      const res = await fetch(`${getBaseUrl(effectiveMode)}/orders/${orderId}/refunds/${refundId}`, {
        method: "GET",
        headers: {
          "x-client-id": clientId,
          "x-client-secret": clientSecret,
          "x-api-version": CASHFREE_API_VERSION,
          Accept: "application/json",
        },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          status: "FAILED",
          error: body?.message || `Cashfree refund status lookup failed (HTTP ${res.status}).`,
          errorCode: body?.code || "CASHFREE_REFUND_STATUS_FAILED",
        };
      }

      const raw = String(body.refund_status || "PENDING").toUpperCase();
      return {
        success: true,
        status: raw === "SUCCESS" ? "SUCCESS" : raw === "CANCELLED" || raw === "FAILED" ? "FAILED" : "PROCESSING",
        providerRefundId: String(body.cf_refund_id || body.refund_id || input.refundReference),
        rawStatus: raw,
      };
    } catch (err: any) {
      return {
        success: false,
        status: "FAILED",
        error: `Cashfree refund status error: ${err?.message || "request failed"}`,
        errorCode: "NETWORK_ERROR",
      };
    }
  }
}
