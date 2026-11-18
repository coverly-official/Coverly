export type PaymentProviderCode = "cashfree" | "razorpay" | "payu" | "paytm";

export type PaymentEnvironment = "sandbox" | "production";

export type PaymentMethodCode = "upi" | "card" | "netbanking" | "wallet";

export type PaymentLifecycleStatus =
  | "CREATED"
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUND_PENDING"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED";

export const ALL_PAYMENT_STATUSES: readonly PaymentLifecycleStatus[] = [
  "CREATED",
  "PENDING",
  "PROCESSING",
  "SUCCESS",
  "FAILED",
  "CANCELLED",
  "EXPIRED",
  "REFUND_PENDING",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
] as const;

export const ALLOWED_PAYMENT_PROVIDERS: readonly PaymentProviderCode[] = [
  "cashfree",
  "razorpay",
  "payu",
  "paytm",
] as const;

export interface ProviderCredentialStatus {
  provider: PaymentProviderCode;
  displayName: string;
  configured: boolean;
  missingEnvVars: string[];
  configuredEnvVars: string[];
  environmentFromEnv: PaymentEnvironment;
  environmentMismatchError?: string;
  webhookSecretConfigured: boolean;
  webhookUrlPath: string;
  supportedMethods: PaymentMethodCode[];
  splitSettlementProduct: string;
  apiVersionLabel: string;
}

export interface CreateProviderOrderInput {
  paymentReference: string;
  orderNumber: string;
  amountPaise: number;
  currency: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  returnUrl: string;
  notifyUrl: string;
  productSummary: string;
  modeOverride?: PaymentEnvironment;
  notes?: Record<string, string>;
}

export interface CreateProviderOrderResult {
  success: boolean;
  providerOrderId?: string;
  providerSessionId?: string;
  checkoutPayload?: Record<string, any>;
  rawStatus?: string;
  error?: string;
  errorCode?: string;
}

export interface VerifyProviderPaymentInput {
  paymentReference: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  providerSignature?: string;
  payload?: Record<string, any>;
  modeOverride?: PaymentEnvironment;
}

export interface ProviderPaymentStatusResult {
  success: boolean;
  verified: boolean;
  status: PaymentLifecycleStatus;
  providerOrderId?: string;
  providerPaymentId?: string;
  paymentMethod?: string;
  gatewayFeePaise?: number;
  amountPaise?: number;
  rawStatus?: string;
  failureReason?: string;
  error?: string;
  errorCode?: string;
}

export interface ProcessWebhookInput {
  rawBody: string;
  parsedBody: Record<string, any>;
  headers: Record<string, string | string[] | undefined>;
  modeOverride?: PaymentEnvironment;
}

export interface ProcessWebhookResult {
  signatureValid: boolean;
  providerEventId: string;
  eventType: string;
  paymentReference?: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  mappedStatus?: PaymentLifecycleStatus;
  refundId?: string;
  refundStatus?: "REFUND_PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
  gatewayFeePaise?: number;
  failureReason?: string;
  error?: string;
}

export interface InitiateRefundInput {
  paymentReference: string;
  refundReference: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  amountPaise: number;
  currency: string;
  reason: string;
  modeOverride?: PaymentEnvironment;
}

export interface ProviderRefundResult {
  success: boolean;
  status: "REFUND_PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
  providerRefundId?: string;
  rawStatus?: string;
  error?: string;
  errorCode?: string;
}

export interface FetchRefundStatusInput {
  providerOrderId?: string;
  providerPaymentId?: string;
  providerRefundId?: string;
  refundReference: string;
  modeOverride?: PaymentEnvironment;
}

export interface TestConnectionResult {
  connected: boolean;
  status: "connected" | "failed" | "missing_credentials";
  environment: PaymentEnvironment;
  message: string;
  httpStatus?: number;
  missingEnvVars?: string[];
  checkedAt: string;
}

export interface PaymentProviderAdapter {
  readonly provider: PaymentProviderCode;
  readonly displayName: string;
  readonly apiVersionLabel: string;
  readonly supportedMethods: PaymentMethodCode[];
  readonly splitSettlementProduct: string;

  getConfigStatus(modeOverride?: PaymentEnvironment): ProviderCredentialStatus;
  testConnection(modeOverride?: PaymentEnvironment): Promise<TestConnectionResult>;
  createPaymentOrder(input: CreateProviderOrderInput): Promise<CreateProviderOrderResult>;
  initiateCheckout(input: CreateProviderOrderInput): Promise<CreateProviderOrderResult>;
  verifyPayment(input: VerifyProviderPaymentInput): Promise<ProviderPaymentStatusResult>;
  processWebhook(input: ProcessWebhookInput): Promise<ProcessWebhookResult>;
  fetchTransactionStatus(input: {
    paymentReference: string;
    providerOrderId?: string;
    providerPaymentId?: string;
    modeOverride?: PaymentEnvironment;
  }): Promise<ProviderPaymentStatusResult>;
  initiateRefund(input: InitiateRefundInput): Promise<ProviderRefundResult>;
  fetchRefundStatus(input: FetchRefundStatusInput): Promise<ProviderRefundResult>;
}

// ============================================================================
// DECIMAL-SAFE MONETARY ARITHMETIC HELPERS (ZERO FLOATING-POINT MATH)
// ============================================================================

/**
 * Converts a rupee string or numeric decimal (e.g. "1234.56" or 1234.56)
 * into exact integer paise using string parsing to avoid IEEE-754 rounding drift.
 */
export function rupeesToPaise(input: string | number | null | undefined): number {
  if (input === null || input === undefined) return 0;
  const raw = String(input).trim();
  if (!raw) return 0;
  const negative = raw.startsWith("-");
  const cleaned = raw.replace(/^[+-]/, "").replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) {
    throw new Error(`Invalid monetary amount: "${input}"`);
  }
  const [wholePart, fracPart = ""] = cleaned.split(".");
  const paddedFrac = (fracPart + "00").slice(0, 2);
  // Round half-up if 3rd decimal digit >= 5
  const roundUp = fracPart.length > 2 && Number(fracPart[2]) >= 5 ? 1 : 0;
  const total = BigInt(wholePart) * 100n + BigInt(paddedFrac) + BigInt(roundUp);
  const signed = negative ? -total : total;
  if (signed > BigInt(Number.MAX_SAFE_INTEGER) || signed < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new Error("Monetary amount exceeds safe integer paise range.");
  }
  return Number(signed);
}

/**
 * Converts exact integer paise into a canonical 2-decimal string (e.g. 12345 -> "123.45").
 */
export function paiseToRupeesString(paise: number | bigint): string {
  const value = typeof paise === "bigint" ? paise : BigInt(Math.trunc(paise));
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const whole = abs / 100n;
  const frac = (abs % 100n).toString().padStart(2, "0");
  return `${negative ? "-" : ""}${whole.toString()}.${frac}`;
}

export function sumPaise(...values: (number | bigint)[]): number {
  let total = 0n;
  for (const v of values) {
    total += typeof v === "bigint" ? v : BigInt(Math.trunc(v || 0));
  }
  return Number(total);
}

export function subtractPaise(a: number | bigint, b: number | bigint): number {
  const bigA = typeof a === "bigint" ? a : BigInt(Math.trunc(a || 0));
  const bigB = typeof b === "bigint" ? b : BigInt(Math.trunc(b || 0));
  return Number(bigA - bigB);
}

/**
 * Computes exact basis-point fee/commission in paise using BigInt half-up rounding.
 * e.g. 200 bps = 2.00%
 */
export function calculateBasisPointsPaise(amountPaise: number | bigint, bps: number): number {
  const amt = typeof amountPaise === "bigint" ? amountPaise : BigInt(Math.trunc(amountPaise || 0));
  const basis = BigInt(Math.trunc(bps || 0));
  if (amt <= 0n || basis <= 0n) return 0;
  return Number((amt * basis + 5000n) / 10000n);
}

/**
 * Valid payment status state transitions to guard against regressions
 * (e.g., never regress a verified SUCCESS payment back to PENDING or FAILED).
 */
export const PAYMENT_STATUS_TRANSITIONS: Record<PaymentLifecycleStatus, PaymentLifecycleStatus[]> = {
  CREATED: ["PENDING", "PROCESSING", "SUCCESS", "FAILED", "CANCELLED", "EXPIRED"],
  PENDING: ["PROCESSING", "SUCCESS", "FAILED", "CANCELLED", "EXPIRED"],
  PROCESSING: ["SUCCESS", "FAILED", "CANCELLED", "EXPIRED"],
  SUCCESS: ["REFUND_PENDING", "PARTIALLY_REFUNDED", "REFUNDED"],
  FAILED: [],
  CANCELLED: [],
  EXPIRED: [],
  REFUND_PENDING: ["PARTIALLY_REFUNDED", "REFUNDED", "SUCCESS"],
  PARTIALLY_REFUNDED: ["REFUND_PENDING", "PARTIALLY_REFUNDED", "REFUNDED"],
  REFUNDED: [],
};

export function canTransitionPaymentStatus(
  from: PaymentLifecycleStatus,
  to: PaymentLifecycleStatus
): boolean {
  if (from === to) return true;
  return (PAYMENT_STATUS_TRANSITIONS[from] || []).includes(to);
}
