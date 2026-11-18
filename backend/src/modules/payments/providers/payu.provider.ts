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

function resolvePayuEnv(modeOverride?: PaymentEnvironment): PaymentEnvironment {
  const raw = (modeOverride || process.env.PAYU_ENVIRONMENT || "sandbox").trim().toLowerCase();
  return raw === "production" || raw === "prod" ? "production" : "sandbox";
}

function getPayuCheckoutUrl(mode: PaymentEnvironment): string {
  return mode === "production"
    ? "https://secure.payu.in/_payment"
    : "https://test.payu.in/_payment";
}

function getPayuPostserviceUrl(mode: PaymentEnvironment): string {
  return mode === "production"
    ? "https://info.payu.in/merchant/postservice?form=2"
    : "https://test.payu.in/merchant/postservice?form=2";
}

function sha512Hex(value: string): string {
  return crypto.createHash("sha512").update(value, "utf8").digest("hex");
}

function mapPayuStatus(status?: string | null): PaymentLifecycleStatus {
  const s = String(status || "").toLowerCase();
  if (s === "success" || s === "captured") return "SUCCESS";
  if (s === "pending" || s === "in progress" || s === "initiated") return "PENDING";
  if (s === "usercancelled" || s === "dropped" || s === "bounced") return "CANCELLED";
  if (s === "expired") return "EXPIRED";
  if (s === "failure" || s === "failed") return "FAILED";
  return "PROCESSING";
}

export function computePayuCheckoutHash(params: {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  salt: string;
}): string {
  const seq = [
    params.key,
    params.txnid,
    params.amount,
    params.productinfo,
    params.firstname,
    params.email,
    params.udf1 || "",
    params.udf2 || "",
    params.udf3 || "",
    params.udf4 || "",
    params.udf5 || "",
    "",
    "",
    "",
    "",
    "",
    params.salt,
  ].join("|");
  return sha512Hex(seq);
}

export function computePayuReverseHash(params: {
  salt: string;
  status: string;
  additionalCharges?: string;
  udf5?: string;
  udf4?: string;
  udf3?: string;
  udf2?: string;
  udf1?: string;
  email: string;
  firstname: string;
  productinfo: string;
  amount: string;
  txnid: string;
  key: string;
}): string {
  const baseSeq = [
    params.salt,
    params.status,
    "",
    "",
    "",
    "",
    "",
    params.udf5 || "",
    params.udf4 || "",
    params.udf3 || "",
    params.udf2 || "",
    params.udf1 || "",
    params.email,
    params.firstname,
    params.productinfo,
    params.amount,
    params.txnid,
    params.key,
  ].join("|");
  const fullSeq = params.additionalCharges ? `${params.additionalCharges}|${baseSeq}` : baseSeq;
  return sha512Hex(fullSeq);
}

export class PayUProvider implements PaymentProviderAdapter {
  readonly provider = "payu" as const;
  readonly displayName = "PayU";
  readonly apiVersionLabel = "PayU India Hosted Checkout & Postservice API v2";
  readonly supportedMethods: PaymentMethodCode[] = ["upi", "card", "netbanking", "wallet"];
  readonly splitSettlementProduct = "PayU Split Settlements (requires merchant account enablement)";

  private getCredentials(modeOverride?: PaymentEnvironment) {
    const merchantKey = (process.env.PAYU_MERCHANT_KEY || "").trim();
    const merchantSalt = (process.env.PAYU_MERCHANT_SALT || "").trim();
    const webhookSecret = (process.env.PAYU_WEBHOOK_SECRET || "").trim();
    const envRaw = (process.env.PAYU_ENVIRONMENT || "sandbox").trim().toLowerCase();
    const environmentFromEnv: PaymentEnvironment =
      envRaw === "production" || envRaw === "prod" ? "production" : "sandbox";
    const effectiveMode = resolvePayuEnv(modeOverride);
    return { merchantKey, merchantSalt, webhookSecret, environmentFromEnv, effectiveMode };
  }

  getConfigStatus(modeOverride?: PaymentEnvironment): ProviderCredentialStatus {
    const { merchantKey, merchantSalt, webhookSecret, environmentFromEnv } = this.getCredentials(modeOverride);
    const missingEnvVars: string[] = [];
    const configuredEnvVars: string[] = [];

    if (merchantKey) configuredEnvVars.push("PAYU_MERCHANT_KEY");
    else missingEnvVars.push("PAYU_MERCHANT_KEY");

    if (merchantSalt) configuredEnvVars.push("PAYU_MERCHANT_SALT");
    else missingEnvVars.push("PAYU_MERCHANT_SALT");

    if (webhookSecret) configuredEnvVars.push("PAYU_WEBHOOK_SECRET");
    if (process.env.PAYU_ENVIRONMENT) configuredEnvVars.push("PAYU_ENVIRONMENT");

    const environmentMismatchError =
      modeOverride && modeOverride !== environmentFromEnv
        ? `PayU environment mismatch: server env PAYU_ENVIRONMENT="${environmentFromEnv}" does not match requested "${modeOverride}" mode.`
        : undefined;

    return {
      provider: this.provider,
      displayName: this.displayName,
      configured: Boolean(merchantKey && merchantSalt),
      missingEnvVars,
      configuredEnvVars,
      environmentFromEnv,
      environmentMismatchError,
      // PayU reverse SHA-512 hash uses PAYU_MERCHANT_SALT (and optional PAYU_WEBHOOK_SECRET)
      webhookSecretConfigured: Boolean(merchantSalt || webhookSecret),
      webhookUrlPath: "/api/payments/webhooks/payu",
      supportedMethods: this.supportedMethods,
      splitSettlementProduct: this.splitSettlementProduct,
      apiVersionLabel: this.apiVersionLabel,
    };
  }

  private async postCommand(
    mode: PaymentEnvironment,
    key: string,
    salt: string,
    command: string,
    var1: string,
    extraParams?: Record<string, string>
  ) {
    const hash = sha512Hex(`${key}|${command}|${var1}|${salt}`);
    const form = new URLSearchParams({
      key,
      command,
      var1,
      hash,
      ...(extraParams || {}),
    });

    const res = await fetch(getPayuPostserviceUrl(mode), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: form.toString(),
    });
    const text = await res.text();
    let parsed: any = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }
    return { status: res.status, ok: res.ok, body: parsed };
  }

  async testConnection(modeOverride?: PaymentEnvironment): Promise<TestConnectionResult> {
    const checkedAt = new Date().toISOString();
    const cfg = this.getConfigStatus(modeOverride);
    const { merchantKey, merchantSalt, effectiveMode } = this.getCredentials(modeOverride);

    if (!cfg.configured) {
      return {
        connected: false,
        status: "missing_credentials",
        environment: effectiveMode,
        message: `PayU credentials not configured. Missing: ${cfg.missingEnvVars.join(", ")}.`,
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
      // Read-only verify_payment probe for a synthetic non-existent txnid; valid credentials return JSON status=0/1 without auth error
      const { status, ok, body } = await this.postCommand(
        effectiveMode,
        merchantKey,
        merchantSalt,
        "verify_payment",
        "COVERLY_CONN_PROBE_0"
      );

      const msg = String(body?.msg || "");
      const authFailed =
        !ok ||
        /invalid\s+(key|hash|merchant)|unauthorized/i.test(msg);

      if (!authFailed) {
        return {
          connected: true,
          status: "connected",
          environment: effectiveMode,
          message: `PayU ${effectiveMode} Postservice API authenticated successfully.`,
          httpStatus: status,
          checkedAt,
        };
      }

      return {
        connected: false,
        status: "failed",
        environment: effectiveMode,
        message: msg || `PayU authentication failed (HTTP ${status}).`,
        httpStatus: status,
        checkedAt,
      };
    } catch (err: any) {
      return {
        connected: false,
        status: "failed",
        environment: effectiveMode,
        message: `Unable to reach PayU ${effectiveMode} API: ${err?.message || "network error"}.`,
        checkedAt,
      };
    }
  }

  async createPaymentOrder(input: CreateProviderOrderInput): Promise<CreateProviderOrderResult> {
    const { merchantKey, merchantSalt, effectiveMode } = this.getCredentials(input.modeOverride);
    if (!merchantKey || !merchantSalt) {
      return {
        success: false,
        error: "PayU credentials (PAYU_MERCHANT_KEY / PAYU_MERCHANT_SALT) are not configured.",
        errorCode: "MISSING_CREDENTIALS",
      };
    }

    const amountStr = paiseToRupeesString(input.amountPaise);
    const productinfo = `COVERLY Order ${input.orderNumber}`.slice(0, 96);
    const firstname = (input.customer.name || "Buyer").replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 60) || "Buyer";
    const email = input.customer.email;
    const phone = input.customer.phone.replace(/[^\d]/g, "").slice(-10) || "9999999999";

    const hash = computePayuCheckoutHash({
      key: merchantKey,
      txnid: input.paymentReference,
      amount: amountStr,
      productinfo,
      firstname,
      email,
      udf1: input.orderNumber,
      salt: merchantSalt,
    });

    // Hosted form parameters (NEVER includes merchantSalt!)
    return {
      success: true,
      providerOrderId: input.paymentReference,
      rawStatus: "CREATED",
      checkoutPayload: {
        provider: "payu",
        environment: effectiveMode,
        action_url: getPayuCheckoutUrl(effectiveMode),
        form_fields: {
          key: merchantKey,
          txnid: input.paymentReference,
          amount: amountStr,
          productinfo,
          firstname,
          email,
          phone,
          surl: input.returnUrl,
          furl: input.returnUrl,
          udf1: input.orderNumber,
          hash,
        },
      },
    };
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
    const { merchantKey, merchantSalt, effectiveMode } = this.getCredentials(input.modeOverride);
    if (!merchantKey || !merchantSalt) {
      return {
        success: false,
        verified: false,
        status: "PENDING",
        error: "PayU credentials are not configured.",
        errorCode: "MISSING_CREDENTIALS",
      };
    }

    try {
      const txnid = input.providerOrderId || input.paymentReference;
      const { ok, status, body } = await this.postCommand(
        effectiveMode,
        merchantKey,
        merchantSalt,
        "verify_payment",
        txnid
      );

      if (!ok || body?.status !== 1) {
        return {
          success: false,
          verified: false,
          status: "PENDING",
          error: body?.msg || `PayU verify_payment failed (HTTP ${status}).`,
          errorCode: "PAYU_VERIFY_FAILED",
        };
      }

      const txn = body?.transaction_details?.[txnid];
      if (!txn) {
        return {
          success: true,
          verified: false,
          status: "PENDING",
          rawStatus: "NOT_FOUND",
        };
      }

      const mapped = mapPayuStatus(txn.status);
      return {
        success: true,
        verified: mapped === "SUCCESS",
        status: mapped,
        providerOrderId: txnid,
        providerPaymentId: txn.mihpayid ? String(txn.mihpayid) : undefined,
        paymentMethod: txn.mode ? String(txn.mode).toLowerCase() : undefined,
        amountPaise: txn.amt !== undefined ? rupeesToPaise(txn.amt) : undefined,
        rawStatus: String(txn.status || ""),
        failureReason: txn.error_Message || undefined,
      };
    } catch (err: any) {
      return {
        success: false,
        verified: false,
        status: "PENDING",
        error: `PayU verify network error: ${err?.message || "request failed"}`,
        errorCode: "NETWORK_ERROR",
      };
    }
  }

  async verifyPayment(input: VerifyProviderPaymentInput): Promise<ProviderPaymentStatusResult> {
    // Always verify via authoritative server-to-server PayU verify_payment API
    return this.fetchTransactionStatus({
      paymentReference: input.paymentReference,
      providerOrderId: input.providerOrderId,
      providerPaymentId: input.providerPaymentId,
      modeOverride: input.modeOverride,
    });
  }

  async processWebhook(input: ProcessWebhookInput): Promise<ProcessWebhookResult> {
    const { merchantKey, merchantSalt, webhookSecret } = this.getCredentials(input.modeOverride);
    const body = input.parsedBody || {};
    const txnid = String(body.txnid || body.merchantTransactionId || "");
    const mihpayid = String(body.mihpayid || body.payuMoneyId || "");
    const statusStr = String(body.status || "");
    const eventType = `payu.${statusStr.toLowerCase() || "event"}`;
    const providerEventId = String(
      input.headers["x-payu-event-id"] ||
        (mihpayid ? `${mihpayid}:${statusStr}` : `${txnid}:${statusStr}`)
    );

    if (!merchantKey || !merchantSalt) {
      return {
        signatureValid: false,
        providerEventId,
        eventType,
        error: "PayU merchant credentials not configured for webhook verification.",
      };
    }

    // Option A: Optional HMAC webhook header if PAYU_WEBHOOK_SECRET configured & header supplied
    const hmacHeader = String(input.headers["x-payu-signature"] || "").trim();
    if (webhookSecret && hmacHeader) {
      const expectedHmac = crypto
        .createHmac("sha256", webhookSecret)
        .update(input.rawBody)
        .digest("hex");
      const a = Buffer.from(hmacHeader, "utf8");
      const b = Buffer.from(expectedHmac, "utf8");
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return {
          signatureValid: false,
          providerEventId,
          eventType,
          error: "Invalid PayU HMAC webhook signature.",
        };
      }
    } else {
      // Option B: Official PayU reverse SHA-512 hash validation
      const receivedHash = String(body.hash || "").trim().toLowerCase();
      if (!receivedHash) {
        return {
          signatureValid: false,
          providerEventId,
          eventType,
          error: "Missing PayU reverse hash in webhook payload.",
        };
      }
      const expectedReverseHash = computePayuReverseHash({
        salt: merchantSalt,
        status: statusStr,
        additionalCharges: body.additionalCharges ? String(body.additionalCharges) : undefined,
        udf5: String(body.udf5 || ""),
        udf4: String(body.udf4 || ""),
        udf3: String(body.udf3 || ""),
        udf2: String(body.udf2 || ""),
        udf1: String(body.udf1 || ""),
        email: String(body.email || ""),
        firstname: String(body.firstname || ""),
        productinfo: String(body.productinfo || ""),
        amount: String(body.amount || ""),
        txnid,
        key: String(body.key || merchantKey),
      }).toLowerCase();

      const a = Buffer.from(receivedHash, "utf8");
      const b = Buffer.from(expectedReverseHash, "utf8");
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return {
          signatureValid: false,
          providerEventId,
          eventType,
          error: "Invalid PayU reverse SHA-512 hash.",
        };
      }
    }

    return {
      signatureValid: true,
      providerEventId,
      eventType,
      paymentReference: txnid || undefined,
      providerOrderId: txnid || undefined,
      providerPaymentId: mihpayid || undefined,
      mappedStatus: mapPayuStatus(statusStr),
      failureReason: body.error_Message ? String(body.error_Message) : undefined,
    };
  }

  async initiateRefund(input: InitiateRefundInput): Promise<ProviderRefundResult> {
    const { merchantKey, merchantSalt, effectiveMode } = this.getCredentials(input.modeOverride);
    if (!merchantKey || !merchantSalt) {
      return {
        success: false,
        status: "FAILED",
        error: "PayU credentials are not configured.",
        errorCode: "MISSING_CREDENTIALS",
      };
    }
    if (!input.providerPaymentId) {
      return {
        success: false,
        status: "FAILED",
        error: "PayU mihpayid (provider_payment_id) is required to initiate a refund.",
        errorCode: "MISSING_PAYMENT_ID",
      };
    }

    try {
      const { ok, status, body } = await this.postCommand(
        effectiveMode,
        merchantKey,
        merchantSalt,
        "cancel_refund_transaction",
        input.providerPaymentId,
        {
          var2: input.refundReference,
          var3: paiseToRupeesString(input.amountPaise),
        }
      );

      if (!ok || body?.status !== 1) {
        return {
          success: false,
          status: "FAILED",
          error: body?.msg || `PayU refund failed (HTTP ${status}).`,
          errorCode: "PAYU_REFUND_FAILED",
        };
      }

      return {
        success: true,
        status: "PROCESSING",
        providerRefundId: String(body.request_id || input.refundReference),
        rawStatus: String(body.msg || "QUEUED"),
      };
    } catch (err: any) {
      return {
        success: false,
        status: "FAILED",
        error: `PayU refund network error: ${err?.message || "request failed"}`,
        errorCode: "NETWORK_ERROR",
      };
    }
  }

  async fetchRefundStatus(input: FetchRefundStatusInput): Promise<ProviderRefundResult> {
    const { merchantKey, merchantSalt, effectiveMode } = this.getCredentials(input.modeOverride);
    if (!merchantKey || !merchantSalt || !input.providerRefundId) {
      return {
        success: false,
        status: "FAILED",
        error: "PayU credentials and refund request_id are required.",
        errorCode: "MISSING_PARAMETERS",
      };
    }

    try {
      const { ok, status, body } = await this.postCommand(
        effectiveMode,
        merchantKey,
        merchantSalt,
        "check_action_status",
        input.providerRefundId
      );

      if (!ok || body?.status !== 1) {
        return {
          success: false,
          status: "FAILED",
          error: body?.msg || `PayU refund status check failed (HTTP ${status}).`,
          errorCode: "PAYU_REFUND_STATUS_FAILED",
        };
      }

      const detailMap = body?.transaction_details?.[input.providerRefundId] || {};
      const firstEntry: any = Object.values(detailMap)[0] || {};
      const raw = String(firstEntry.status || "queued").toLowerCase();
      return {
        success: true,
        status: raw === "success" ? "SUCCESS" : raw === "failure" ? "FAILED" : "PROCESSING",
        providerRefundId: input.providerRefundId,
        rawStatus: raw,
      };
    } catch (err: any) {
      return {
        success: false,
        status: "FAILED",
        error: `PayU refund status network error: ${err?.message || "request failed"}`,
        errorCode: "NETWORK_ERROR",
      };
    }
  }
}
