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

// Official Paytm AES-128-CBC fixed IV specified in Paytm Checksum documentation
const PAYTM_IV = "@@@@&&&&####$$$$";

function resolvePaytmEnv(modeOverride?: PaymentEnvironment): PaymentEnvironment {
  const raw = (modeOverride || process.env.PAYTM_ENVIRONMENT || "sandbox").trim().toLowerCase();
  return raw === "production" || raw === "prod" ? "production" : "sandbox";
}

function getPaytmBaseUrl(mode: PaymentEnvironment): string {
  return mode === "production"
    ? "https://securegw.paytm.in"
    : "https://securegw-stage.paytm.in";
}

function normalizePaytmKey16(merchantKey: string): Buffer {
  // AES-128-CBC requires a 16-byte key (standard Paytm merchant keys are 16 chars)
  const buf = Buffer.from(merchantKey, "utf8");
  if (buf.length === 16) return buf;
  if (buf.length > 16) return buf.subarray(0, 16);
  const padded = Buffer.alloc(16, 0);
  buf.copy(padded);
  return padded;
}

/**
 * Generates an official Paytm Checksum signature (SHA-256 + random 4-char salt encrypted with AES-128-CBC).
 */
export function generatePaytmSignature(payload: string, merchantKey: string): string {
  const salt = crypto.randomBytes(3).toString("base64").replace(/[^a-zA-Z0-9]/g, "A").slice(0, 4);
  const hash = crypto.createHash("sha256").update(`${payload}|${salt}`, "utf8").digest("hex");
  const hashWithSalt = `${hash}${salt}`;
  const cipher = crypto.createCipheriv("aes-128-cbc", normalizePaytmKey16(merchantKey), Buffer.from(PAYTM_IV, "utf8"));
  let encrypted = cipher.update(hashWithSalt, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
}

/**
 * Verifies an official Paytm Checksum signature using timing-safe hash comparison.
 */
export function verifyPaytmSignature(payload: string, merchantKey: string, checksum: string): boolean {
  try {
    const decipher = crypto.createDecipheriv(
      "aes-128-cbc",
      normalizePaytmKey16(merchantKey),
      Buffer.from(PAYTM_IV, "utf8")
    );
    let decrypted = decipher.update(checksum, "base64", "utf8");
    decrypted += decipher.final("utf8");
    if (decrypted.length < 68) return false;
    const salt = decrypted.slice(-4);
    const embeddedHash = decrypted.slice(0, -4);
    const computedHash = crypto.createHash("sha256").update(`${payload}|${salt}`, "utf8").digest("hex");
    const a = Buffer.from(embeddedHash, "utf8");
    const b = Buffer.from(computedHash, "utf8");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function buildSortedParamString(params: Record<string, any>): string {
  return Object.keys(params)
    .filter((k) => k !== "CHECKSUMHASH" && params[k] !== undefined && params[k] !== null)
    .sort()
    .map((k) => {
      const val = String(params[k]);
      return val.toLowerCase() === "null" ? "" : val;
    })
    .join("|");
}

function mapPaytmStatus(status?: string | null): PaymentLifecycleStatus {
  const s = String(status || "").toUpperCase();
  if (s === "TXN_SUCCESS") return "SUCCESS";
  if (s === "PENDING") return "PENDING";
  if (s === "TXN_FAILURE") return "FAILED";
  return "PROCESSING";
}

export class PaytmProvider implements PaymentProviderAdapter {
  readonly provider = "paytm" as const;
  readonly displayName = "Paytm for Business";
  readonly apiVersionLabel = "Paytm All-in-One Payment Gateway API v1/v3";
  readonly supportedMethods: PaymentMethodCode[] = ["upi", "card", "netbanking", "wallet"];
  readonly splitSettlementProduct = "Paytm Marketplace Settlement (requires separate business agreement & onboarding)";

  private getCredentials(modeOverride?: PaymentEnvironment) {
    const mid = (process.env.PAYTM_MID || "").trim();
    const merchantKey = (process.env.PAYTM_MERCHANT_KEY || "").trim();
    const envRaw = (process.env.PAYTM_ENVIRONMENT || "sandbox").trim().toLowerCase();
    const environmentFromEnv: PaymentEnvironment =
      envRaw === "production" || envRaw === "prod" ? "production" : "sandbox";
    const effectiveMode = resolvePaytmEnv(modeOverride);
    return { mid, merchantKey, environmentFromEnv, effectiveMode };
  }

  getConfigStatus(modeOverride?: PaymentEnvironment): ProviderCredentialStatus {
    const { mid, merchantKey, environmentFromEnv } = this.getCredentials(modeOverride);
    const missingEnvVars: string[] = [];
    const configuredEnvVars: string[] = [];

    if (mid) configuredEnvVars.push("PAYTM_MID");
    else missingEnvVars.push("PAYTM_MID");

    if (merchantKey) configuredEnvVars.push("PAYTM_MERCHANT_KEY");
    else missingEnvVars.push("PAYTM_MERCHANT_KEY");

    if (process.env.PAYTM_ENVIRONMENT) configuredEnvVars.push("PAYTM_ENVIRONMENT");

    const environmentMismatchError =
      modeOverride && modeOverride !== environmentFromEnv
        ? `Paytm environment mismatch: server env PAYTM_ENVIRONMENT="${environmentFromEnv}" does not match requested "${modeOverride}" mode.`
        : undefined;

    return {
      provider: this.provider,
      displayName: this.displayName,
      configured: Boolean(mid && merchantKey),
      missingEnvVars,
      configuredEnvVars,
      environmentFromEnv,
      environmentMismatchError,
      // Paytm signs callbacks/webhooks with PAYTM_MERCHANT_KEY
      webhookSecretConfigured: Boolean(merchantKey),
      webhookUrlPath: "/api/payments/webhooks/paytm",
      supportedMethods: this.supportedMethods,
      splitSettlementProduct: this.splitSettlementProduct,
      apiVersionLabel: this.apiVersionLabel,
    };
  }

  async testConnection(modeOverride?: PaymentEnvironment): Promise<TestConnectionResult> {
    const checkedAt = new Date().toISOString();
    const cfg = this.getConfigStatus(modeOverride);
    const { mid, merchantKey, effectiveMode } = this.getCredentials(modeOverride);

    if (!cfg.configured) {
      return {
        connected: false,
        status: "missing_credentials",
        environment: effectiveMode,
        message: `Paytm credentials not configured. Missing: ${cfg.missingEnvVars.join(", ")}.`,
        missingEnvVars: cfg.missingEnvVars,
        checkedAt,
      };
    }

    if (cfg.environmentMismatchError) {
      return {
        connected: false,
        status: "failed",
        environment: effectiveMode,
        message: cfg.environmentMismatchError,
        checkedAt,
      };
    }

    try {
      // Read-only order status probe: invalid MID/checksum returns 2005/330/401, valid auth returns order-not-found (331/501/etc.)
      const reqBody = { mid, orderId: "COVERLY_CONN_PROBE_0" };
      const signature = generatePaytmSignature(JSON.stringify(reqBody), merchantKey);

      const res = await fetch(`${getPaytmBaseUrl(effectiveMode)}/v3/order/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ body: reqBody, head: { signature } }),
      });

      const data = await res.json().catch(() => ({}));
      const resultCode = String(data?.body?.resultInfo?.resultCode || "");
      const resultMsg = String(data?.body?.resultInfo?.resultMsg || "");
      const authFailed =
        !res.ok ||
        resultCode === "2005" ||
        /invalid\s+(mid|checksum|signature)|unauthorized/i.test(resultMsg);

      if (!authFailed) {
        return {
          connected: true,
          status: "connected",
          environment: effectiveMode,
          message: `Paytm ${effectiveMode} Gateway authenticated successfully.`,
          httpStatus: res.status,
          checkedAt,
        };
      }

      return {
        connected: false,
        status: "failed",
        environment: effectiveMode,
        message: resultMsg || `Paytm authentication failed (HTTP ${res.status}).`,
        httpStatus: res.status,
        checkedAt,
      };
    } catch (err: any) {
      return {
        connected: false,
        status: "failed",
        environment: effectiveMode,
        message: `Unable to reach Paytm ${effectiveMode} API: ${err?.message || "network error"}.`,
        checkedAt,
      };
    }
  }

  async createPaymentOrder(input: CreateProviderOrderInput): Promise<CreateProviderOrderResult> {
    const { mid, merchantKey, effectiveMode } = this.getCredentials(input.modeOverride);
    if (!mid || !merchantKey) {
      return {
        success: false,
        error: "Paytm credentials (PAYTM_MID / PAYTM_MERCHANT_KEY) are not configured.",
        errorCode: "MISSING_CREDENTIALS",
      };
    }

    const reqBody = {
      requestType: "Payment",
      mid,
      websiteName: effectiveMode === "production" ? "DEFAULT" : "WEBSTAGING",
      orderId: input.paymentReference,
      callbackUrl: input.returnUrl,
      txnAmount: {
        value: paiseToRupeesString(input.amountPaise),
        currency: input.currency || "INR",
      },
      userInfo: {
        custId: input.customer.id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48) || "coverly_buyer",
        email: input.customer.email,
        mobile: input.customer.phone.replace(/[^\d]/g, "").slice(-10) || undefined,
      },
    };

    try {
      const signature = generatePaytmSignature(JSON.stringify(reqBody), merchantKey);
      const url = `${getPaytmBaseUrl(effectiveMode)}/theia/api/v1/initiateTransaction?mid=${encodeURIComponent(mid)}&orderId=${encodeURIComponent(input.paymentReference)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ body: reqBody, head: { signature } }),
      });

      const data = await res.json().catch(() => ({}));
      const txnToken = data?.body?.txnToken;
      if (!res.ok || !txnToken) {
        return {
          success: false,
          error: data?.body?.resultInfo?.resultMsg || `Paytm initiateTransaction failed (HTTP ${res.status}).`,
          errorCode: data?.body?.resultInfo?.resultCode || "PAYTM_INIT_FAILED",
        };
      }

      return {
        success: true,
        providerOrderId: input.paymentReference,
        providerSessionId: String(txnToken),
        rawStatus: String(data?.body?.resultInfo?.resultStatus || "S"),
        checkoutPayload: {
          provider: "paytm",
          environment: effectiveMode,
          mid,
          orderId: input.paymentReference,
          txnToken,
          amount: paiseToRupeesString(input.amountPaise),
          sdk_url: `${getPaytmBaseUrl(effectiveMode)}/merchantpgpui/checkoutjs/merchants/${encodeURIComponent(mid)}.js`,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Paytm network error: ${err?.message || "request failed"}`,
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
    const { mid, merchantKey, effectiveMode } = this.getCredentials(input.modeOverride);
    if (!mid || !merchantKey) {
      return {
        success: false,
        verified: false,
        status: "PENDING",
        error: "Paytm credentials are not configured.",
        errorCode: "MISSING_CREDENTIALS",
      };
    }

    try {
      const orderId = input.providerOrderId || input.paymentReference;
      const reqBody = { mid, orderId };
      const signature = generatePaytmSignature(JSON.stringify(reqBody), merchantKey);

      const res = await fetch(`${getPaytmBaseUrl(effectiveMode)}/v3/order/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ body: reqBody, head: { signature } }),
      });

      const data = await res.json().catch(() => ({}));
      const resultStatus = data?.body?.resultInfo?.resultStatus;
      if (!res.ok || !resultStatus) {
        return {
          success: false,
          verified: false,
          status: "PENDING",
          error: data?.body?.resultInfo?.resultMsg || `Paytm status check failed (HTTP ${res.status}).`,
          errorCode: "PAYTM_STATUS_ERROR",
        };
      }

      const mapped = mapPaytmStatus(resultStatus);
      return {
        success: true,
        verified: mapped === "SUCCESS",
        status: mapped,
        providerOrderId: orderId,
        providerPaymentId: data?.body?.txnId ? String(data.body.txnId) : undefined,
        paymentMethod: data?.body?.paymentMode ? String(data.body.paymentMode).toLowerCase() : undefined,
        amountPaise: data?.body?.txnAmount !== undefined ? rupeesToPaise(data.body.txnAmount) : undefined,
        rawStatus: String(resultStatus),
        failureReason: mapped === "FAILED" ? String(data?.body?.resultInfo?.resultMsg || "") : undefined,
      };
    } catch (err: any) {
      return {
        success: false,
        verified: false,
        status: "PENDING",
        error: `Paytm status network error: ${err?.message || "request failed"}`,
        errorCode: "NETWORK_ERROR",
      };
    }
  }

  async verifyPayment(input: VerifyProviderPaymentInput): Promise<ProviderPaymentStatusResult> {
    return this.fetchTransactionStatus({
      paymentReference: input.paymentReference,
      providerOrderId: input.providerOrderId,
      providerPaymentId: input.providerPaymentId,
      modeOverride: input.modeOverride,
    });
  }

  async processWebhook(input: ProcessWebhookInput): Promise<ProcessWebhookResult> {
    const { merchantKey } = this.getCredentials(input.modeOverride);
    const body = input.parsedBody || {};
    const orderId = String(body.ORDERID || body.orderId || "");
    const txnId = String(body.TXNID || body.txnId || "");
    const statusStr = String(body.STATUS || body.status || "");
    const eventType = `paytm.${statusStr.toLowerCase() || "event"}`;
    const providerEventId = String(
      input.headers["x-paytm-event-id"] || (txnId ? `${txnId}:${statusStr}` : `${orderId}:${statusStr}`)
    );

    const checksum = String(body.CHECKSUMHASH || input.headers["x-paytm-signature"] || "").trim();
    if (!merchantKey || !checksum) {
      return {
        signatureValid: false,
        providerEventId,
        eventType,
        error: "Missing Paytm merchant key or CHECKSUMHASH signature.",
      };
    }

    const sortedParams = buildSortedParamString(body);
    const valid =
      verifyPaytmSignature(sortedParams, merchantKey, checksum) ||
      verifyPaytmSignature(input.rawBody, merchantKey, checksum);

    if (!valid) {
      return {
        signatureValid: false,
        providerEventId,
        eventType,
        error: "Invalid Paytm webhook checksum signature.",
      };
    }

    return {
      signatureValid: true,
      providerEventId,
      eventType,
      paymentReference: orderId || undefined,
      providerOrderId: orderId || undefined,
      providerPaymentId: txnId || undefined,
      mappedStatus: mapPaytmStatus(statusStr),
      failureReason: body.RESPMSG ? String(body.RESPMSG) : undefined,
    };
  }

  async initiateRefund(input: InitiateRefundInput): Promise<ProviderRefundResult> {
    const { mid, merchantKey, effectiveMode } = this.getCredentials(input.modeOverride);
    if (!mid || !merchantKey) {
      return {
        success: false,
        status: "FAILED",
        error: "Paytm credentials are not configured.",
        errorCode: "MISSING_CREDENTIALS",
      };
    }
    if (!input.providerPaymentId) {
      return {
        success: false,
        status: "FAILED",
        error: "Paytm txnId (provider_payment_id) is required to initiate a refund.",
        errorCode: "MISSING_PAYMENT_ID",
      };
    }

    const reqBody = {
      mid,
      txnType: "REFUND",
      orderId: input.providerOrderId || input.paymentReference,
      txnId: input.providerPaymentId,
      refId: input.refundReference,
      refundAmount: paiseToRupeesString(input.amountPaise),
    };

    try {
      const signature = generatePaytmSignature(JSON.stringify(reqBody), merchantKey);
      const res = await fetch(`${getPaytmBaseUrl(effectiveMode)}/refund/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ body: reqBody, head: { signature } }),
      });
      const data = await res.json().catch(() => ({}));
      const rs = String(data?.body?.resultInfo?.resultStatus || "");
      if (!res.ok || rs === "TXN_FAILURE") {
        return {
          success: false,
          status: "FAILED",
          error: data?.body?.resultInfo?.resultMsg || `Paytm refund failed (HTTP ${res.status}).`,
          errorCode: data?.body?.resultInfo?.resultCode || "PAYTM_REFUND_FAILED",
        };
      }

      return {
        success: true,
        status: rs === "TXN_SUCCESS" ? "SUCCESS" : "PROCESSING",
        providerRefundId: String(data?.body?.refundId || input.refundReference),
        rawStatus: rs,
      };
    } catch (err: any) {
      return {
        success: false,
        status: "FAILED",
        error: `Paytm refund network error: ${err?.message || "request failed"}`,
        errorCode: "NETWORK_ERROR",
      };
    }
  }

  async fetchRefundStatus(input: FetchRefundStatusInput): Promise<ProviderRefundResult> {
    const { mid, merchantKey, effectiveMode } = this.getCredentials(input.modeOverride);
    if (!mid || !merchantKey || !input.providerOrderId) {
      return {
        success: false,
        status: "FAILED",
        error: "Paytm credentials and orderId are required.",
        errorCode: "MISSING_PARAMETERS",
      };
    }

    const reqBody = {
      mid,
      orderId: input.providerOrderId,
      refId: input.refundReference,
    };

    try {
      const signature = generatePaytmSignature(JSON.stringify(reqBody), merchantKey);
      const res = await fetch(`${getPaytmBaseUrl(effectiveMode)}/v2/refund/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ body: reqBody, head: { signature } }),
      });
      const data = await res.json().catch(() => ({}));
      const rs = String(data?.body?.resultInfo?.resultStatus || "");
      if (!res.ok) {
        return {
          success: false,
          status: "FAILED",
          error: data?.body?.resultInfo?.resultMsg || `Paytm refund status failed (HTTP ${res.status}).`,
          errorCode: "PAYTM_REFUND_STATUS_FAILED",
        };
      }

      return {
        success: true,
        status: rs === "TXN_SUCCESS" ? "SUCCESS" : rs === "TXN_FAILURE" ? "FAILED" : "PROCESSING",
        providerRefundId: String(data?.body?.refundId || input.providerRefundId || input.refundReference),
        rawStatus: rs,
      };
    } catch (err: any) {
      return {
        success: false,
        status: "FAILED",
        error: `Paytm refund status network error: ${err?.message || "request failed"}`,
        errorCode: "NETWORK_ERROR",
      };
    }
  }
}
