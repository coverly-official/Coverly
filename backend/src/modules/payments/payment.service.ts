import crypto from "node:crypto";
import { getInsForgeClient } from "../../lib/insforge.js";
import type { AuthenticatedUser } from "../../middleware/auth.js";
import { CashfreeProvider } from "./providers/cashfree.provider.js";
import { RazorpayProvider } from "./providers/razorpay.provider.js";
import { PayUProvider } from "./providers/payu.provider.js";
import { PaytmProvider } from "./providers/paytm.provider.js";
import {
  ALLOWED_PAYMENT_PROVIDERS,
  canTransitionPaymentStatus,
  calculateBasisPointsPaise,
  paiseToRupeesString,
  rupeesToPaise,
  subtractPaise,
  sumPaise,
  type PaymentEnvironment,
  type PaymentLifecycleStatus,
  type PaymentMethodCode,
  type PaymentProviderAdapter,
  type PaymentProviderCode,
  type ProviderCredentialStatus,
} from "./payment.interface.js";
import { validateGatewayActivation, validateRefundRequest } from "./payment.validation.js";

const PLATFORM_COMMISSION_BPS = 150; // 1.50% recorded in settlement ledger (no split payout until provider approved)

const PROVIDER_REGISTRY: Record<PaymentProviderCode, PaymentProviderAdapter> = {
  cashfree: new CashfreeProvider(),
  razorpay: new RazorpayProvider(),
  payu: new PayUProvider(),
  paytm: new PaytmProvider(),
};

// In-process concurrency lock map keyed by paymentId/orderId to prevent overlapping double-processing
const ACTIVE_LOCKS = new Set<string>();

async function withPaymentLock<T>(lockKey: string, fn: () => Promise<T>): Promise<T> {
  if (ACTIVE_LOCKS.has(lockKey)) {
    throw new Error("A payment operation for this record is already in progress. Please wait and retry.");
  }
  ACTIVE_LOCKS.add(lockKey);
  try {
    return await fn();
  } finally {
    ACTIVE_LOCKS.delete(lockKey);
  }
}

export function getPaymentProvider(provider: PaymentProviderCode): PaymentProviderAdapter {
  const adapter = PROVIDER_REGISTRY[provider];
  if (!adapter) {
    throw new Error(`Unsupported payment provider: ${provider}`);
  }
  return adapter;
}

export function listAllProviderCredentialStatuses(
  modeByProvider?: Partial<Record<PaymentProviderCode, PaymentEnvironment>>
): ProviderCredentialStatus[] {
  return ALLOWED_PAYMENT_PROVIDERS.map((code) =>
    PROVIDER_REGISTRY[code].getConfigStatus(modeByProvider?.[code])
  );
}

// ============================================================================
// 1. GATEWAY CONFIGURATION & ADMIN MANAGEMENT
// ============================================================================

export async function getGatewayConfigsForAdmin() {
  const insforge = getInsForgeClient();
  let dbRows: any[] = [];
  if (insforge) {
    const { data } = await insforge.database
      .from("payment_gateway_configs")
      .select("*")
      .order("provider", { ascending: true });
    dbRows = data || [];
  }

  const rowMap = new Map(dbRows.map((r: any) => [r.provider, r]));
  const siteBase = (process.env.PUBLIC_SITE_URL || "https://coverly-indol.vercel.app").replace(/\/+$/, "");

  return ALLOWED_PAYMENT_PROVIDERS.map((code) => {
    const adapter = PROVIDER_REGISTRY[code];
    const row = rowMap.get(code);
    const mode: PaymentEnvironment = row?.mode === "production" ? "production" : "sandbox";
    const credStatus = adapter.getConfigStatus(mode);

    return {
      provider: code,
      display_name: row?.display_name || adapter.displayName,
      api_version: adapter.apiVersionLabel,
      mode,
      is_enabled: Boolean(row?.is_enabled),
      is_active_primary: Boolean(row?.is_active_primary),
      credentials_configured: credStatus.configured,
      configured_env_vars: credStatus.configuredEnvVars,
      missing_env_vars: credStatus.missingEnvVars,
      environment_from_env: credStatus.environmentFromEnv,
      environment_mismatch_error: credStatus.environmentMismatchError || null,
      webhook_secret_configured: credStatus.webhookSecretConfigured,
      webhook_url: `${siteBase}${credStatus.webhookUrlPath}`,
      supported_methods: Array.isArray(row?.supported_methods)
        ? row.supported_methods
        : adapter.supportedMethods,
      split_settlement_supported: Boolean(row?.split_settlement_supported ?? true),
      split_settlement_approved: Boolean(row?.split_settlement_approved ?? false),
      split_settlement_product: row?.split_settlement_product || adapter.splitSettlementProduct,
      last_connection_status: row?.last_connection_status || "not_tested",
      last_connection_message: row?.last_connection_message || null,
      last_verified_at: row?.last_verified_at || null,
      updated_at: row?.updated_at || null,
    };
  });
}

export async function getActiveGatewayForCheckout() {
  const configs = await getGatewayConfigsForAdmin();
  const active =
    configs.find((c) => c.is_enabled && c.is_active_primary && c.credentials_configured) ||
    configs.find((c) => c.is_enabled && c.credentials_configured) ||
    null;

  if (!active) {
    return {
      available: false,
      active_gateway: null,
      message:
        "No payment gateway is currently enabled and configured. Please contact COVERLY support or configure a gateway in Admin Payment Gateways.",
    };
  }

  return {
    available: true,
    active_gateway: {
      provider: active.provider,
      display_name: active.display_name,
      mode: active.mode,
      supported_methods: active.supported_methods as PaymentMethodCode[],
    },
  };
}

export async function testGatewayConnection(provider: PaymentProviderCode, admin: AuthenticatedUser) {
  const insforge = getInsForgeClient();
  let mode: PaymentEnvironment = "sandbox";
  if (insforge) {
    const { data: cfg } = await insforge.database
      .from("payment_gateway_configs")
      .select("mode")
      .eq("provider", provider)
      .single();
    if (cfg?.mode === "production") mode = "production";
  }

  const adapter = getPaymentProvider(provider);
  const result = await adapter.testConnection(mode);

  if (insforge) {
    await insforge.database
      .from("payment_gateway_configs")
      .update({
        last_connection_status: result.status,
        last_connection_message: result.message,
        last_verified_at: result.connected ? result.checkedAt : null,
        updated_by: admin.id,
        updated_at: new Date().toISOString(),
      })
      .eq("provider", provider);

    try {
      await insforge.database.from("audit_logs").insert([
        {
          admin_id: admin.id,
          action: "PAYMENT_GATEWAY_TEST_CONNECTION",
          target_type: "payment_gateway",
          target_id: provider,
          metadata: {
            provider,
            environment: result.environment,
            status: result.status,
            connected: result.connected,
          },
        },
      ]);
    } catch {}
  }

  return result;
}

export async function updateGatewayConfig(
  provider: PaymentProviderCode,
  updates: {
    mode?: PaymentEnvironment;
    is_enabled?: boolean;
    is_active_primary?: boolean;
    supported_methods?: PaymentMethodCode[];
  },
  admin: AuthenticatedUser
) {
  const insforge = getInsForgeClient();
  if (!insforge) throw new Error("Database client unavailable.");

  const { data: current, error: fetchErr } = await insforge.database
    .from("payment_gateway_configs")
    .select("*")
    .eq("provider", provider)
    .single();

  if (fetchErr || !current) {
    throw new Error(`Payment gateway configuration for "${provider}" not found.`);
  }

  const nextMode: PaymentEnvironment = updates.mode || current.mode || "sandbox";
  const nextEnabled = typeof updates.is_enabled === "boolean" ? updates.is_enabled : Boolean(current.is_enabled);
  const nextPrimary =
    typeof updates.is_active_primary === "boolean"
      ? updates.is_active_primary
      : Boolean(current.is_active_primary);

  const adapter = getPaymentProvider(provider);
  const credStatus = adapter.getConfigStatus(nextMode);

  // Enforce strict guardrails when enabling or switching to production
  if (nextEnabled || nextPrimary) {
    const check = validateGatewayActivation({
      credStatus,
      requestedMode: nextMode,
      lastConnectionStatus: current.last_connection_status,
      requireConnectionVerified: true,
    });
    if (!check.valid) {
      const err: any = new Error(check.error);
      err.status = 400;
      err.code = "GATEWAY_ACTIVATION_BLOCKED";
      throw err;
    }
  }

  // If setting this provider as active primary, unset primary on other providers
  if (nextPrimary) {
    await insforge.database
      .from("payment_gateway_configs")
      .update({ is_active_primary: false, updated_at: new Date().toISOString() })
      .neq("provider", provider);
  }

  const patch: Record<string, any> = {
    mode: nextMode,
    is_enabled: nextPrimary ? true : nextEnabled,
    is_active_primary: nextEnabled === false ? false : nextPrimary,
    updated_by: admin.id,
    updated_at: new Date().toISOString(),
  };

  // Reset verification status if mode changed
  if (updates.mode && updates.mode !== current.mode) {
    patch.last_connection_status = "not_tested";
    patch.last_connection_message = `Mode switched to ${updates.mode}; re-test connection before enabling.`;
    patch.is_enabled = false;
    patch.is_active_primary = false;
  }

  if (Array.isArray(updates.supported_methods) && updates.supported_methods.length > 0) {
    const filtered = updates.supported_methods.filter((m) => adapter.supportedMethods.includes(m));
    if (filtered.length > 0) patch.supported_methods = filtered;
  }

  const { data: updated, error: updErr } = await insforge.database
    .from("payment_gateway_configs")
    .update(patch)
    .eq("provider", provider)
    .select("*")
    .single();

  if (updErr) throw new Error(updErr.message);

  try {
    await insforge.database.from("audit_logs").insert([
      {
        admin_id: admin.id,
        action: "PAYMENT_GATEWAY_CONFIG_UPDATED",
        target_type: "payment_gateway",
        target_id: provider,
        metadata: {
          provider,
          mode: patch.mode,
          is_enabled: patch.is_enabled,
          is_active_primary: patch.is_active_primary,
        },
      },
    ]);
  } catch {}

  return updated;
}

// ============================================================================
// 2. ORDER CHECKOUT, RETRY & AUTHORITATIVE VERIFICATION
// ============================================================================

export async function getOrderCheckoutSummary(orderId: string, user: AuthenticatedUser) {
  const insforge = getInsForgeClient();
  if (!insforge) throw new Error("Database client unavailable.");

  const { data: order, error } = await insforge.database
    .from("orders")
    .select(
      "id, order_number, quotation_id, buyer_id, buyer_business_id, supplier_business_id, status, total_amount, created_at, businesses!supplier_business_id(id, name, city, state), users!buyer_id(id, full_name, email, phone)"
    )
    .eq("id", orderId)
    .single();

  if (error || !order) {
    const err: any = new Error("Order not found.");
    err.status = 404;
    throw err;
  }

  const isAdmin = user.roles.some((r) => ["admin", "super_admin", "finance_admin"].includes(r));
  if (order.buyer_id !== user.id && !isAdmin) {
    const err: any = new Error("You are not authorized to access checkout for this order.");
    err.status = 403;
    throw err;
  }

  const { data: items } = await insforge.database
    .from("order_items")
    .select("id, item_name, quantity, unit, unit_price, total_price")
    .eq("order_id", orderId);

  const { data: existingPayments } = await insforge.database
    .from("payments")
    .select(
      "id, payment_reference, provider, status, amount_paise, amount_decimal, currency, payment_method, provider_order_id, provider_payment_id, paid_at, created_at"
    )
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  // Derive decimal-safe itemized totals (integer paise)
  const itemsList = items || [];
  let subtotalPaise = 0;
  for (const item of itemsList) {
    subtotalPaise = sumPaise(subtotalPaise, rupeesToPaise(item.total_price));
  }
  const orderTotalPaise = rupeesToPaise(order.total_amount);
  const effectiveSubtotalPaise = subtotalPaise > 0 && subtotalPaise <= orderTotalPaise ? subtotalPaise : orderTotalPaise;
  const residualPaise = Math.max(0, subtractPaise(orderTotalPaise, effectiveSubtotalPaise));

  // If quotation has tax/freight breakdown, load it cleanly without guessing
  let taxPaise = 0;
  let freightPaise = 0;
  let otherChargesPaise = residualPaise;
  if (order.quotation_id) {
    const { data: quote } = await insforge.database
      .from("quotations")
      .select("gst_amount, freight_cost, total_landed_cost")
      .eq("id", order.quotation_id)
      .single();
    if (quote) {
      taxPaise = rupeesToPaise(quote.gst_amount || 0);
      freightPaise = rupeesToPaise(quote.freight_cost || 0);
      const accounted = sumPaise(effectiveSubtotalPaise, taxPaise, freightPaise);
      otherChargesPaise = Math.max(0, subtractPaise(orderTotalPaise, accounted));
    }
  }

  const gatewayInfo = await getActiveGatewayForCheckout();

  return {
    order: {
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      supplier_name: (order as any).businesses?.name || "COVERLY Verified Supplier",
      supplier_city: (order as any).businesses?.city || null,
      currency: "INR",
      items: itemsList,
      subtotal_paise: effectiveSubtotalPaise,
      subtotal_decimal: paiseToRupeesString(effectiveSubtotalPaise),
      tax_paise: taxPaise,
      tax_decimal: paiseToRupeesString(taxPaise),
      freight_paise: freightPaise,
      freight_decimal: paiseToRupeesString(freightPaise),
      other_charges_paise: otherChargesPaise,
      other_charges_decimal: paiseToRupeesString(otherChargesPaise),
      total_amount_paise: orderTotalPaise,
      total_amount_decimal: paiseToRupeesString(orderTotalPaise),
    },
    gateway: gatewayInfo,
    existing_payments: existingPayments || [],
    already_paid: (existingPayments || []).some((p: any) => p.status === "SUCCESS"),
  };
}

export async function initiateOrderCheckout(params: {
  orderId: string;
  paymentMethod?: PaymentMethodCode;
  idempotencyKey?: string;
  user: AuthenticatedUser;
}) {
  const { orderId, paymentMethod, user } = params;
  const insforge = getInsForgeClient();
  if (!insforge) throw new Error("Database client unavailable.");

  return withPaymentLock(`order:${orderId}`, async () => {
    const summary = await getOrderCheckoutSummary(orderId, user);

    if (summary.already_paid) {
      const err: any = new Error("This order has already been paid and verified.");
      err.status = 409;
      err.code = "ORDER_ALREADY_PAID";
      throw err;
    }

    if (!summary.gateway.available || !summary.gateway.active_gateway) {
      const err: any = new Error(summary.gateway.message || "No active payment gateway is enabled.");
      err.status = 503;
      err.code = "NO_ACTIVE_GATEWAY";
      throw err;
    }

    const activeGw = summary.gateway.active_gateway;
    if (paymentMethod && !activeGw.supported_methods.includes(paymentMethod)) {
      const err: any = new Error(
        `Payment method "${paymentMethod}" is not supported by active gateway ${activeGw.display_name}.`
      );
      err.status = 400;
      err.code = "UNSUPPORTED_PAYMENT_METHOD";
      throw err;
    }

    const idempotencyKey =
      params.idempotencyKey || `chk_${orderId}_${activeGw.provider}_${crypto.randomUUID()}`;

    // Idempotency replay protection: if same idempotency_key already created, return existing payment safely
    const { data: existingIdem } = await insforge.database
      .from("payments")
      .select("*")
      .eq("idempotency_key", idempotencyKey)
      .single();

    if (existingIdem) {
      return {
        payment: existingIdem,
        idempotent_replay: true,
        checkout_payload: existingIdem.metadata?.checkout_payload || null,
      };
    }

    // Fetch full order buyer details
    const { data: orderRow } = await insforge.database
      .from("orders")
      .select("id, order_number, buyer_id, buyer_business_id, supplier_business_id, users!buyer_id(id, full_name, email, phone)")
      .eq("id", orderId)
      .single();

    if (!orderRow) throw new Error("Order not found.");

    const adapter = getPaymentProvider(activeGw.provider as PaymentProviderCode);
    const paymentReference = `CVP_${Date.now()}_${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const siteBase = (process.env.PUBLIC_SITE_URL || "https://coverly-indol.vercel.app").replace(/\/+$/, "");
    const buyerInfo = (orderRow as any).users || {};

    // Call official provider order/checkout creation API
    const providerRes = await adapter.initiateCheckout({
      paymentReference,
      orderNumber: summary.order.order_number,
      amountPaise: summary.order.total_amount_paise,
      currency: "INR",
      customer: {
        id: user.id,
        name: buyerInfo.full_name || user.full_name || "COVERLY Buyer",
        email: buyerInfo.email || user.email,
        phone: buyerInfo.phone || "9999999999",
      },
      returnUrl: `${siteBase}/buyer/orders/${orderId}/checkout?payment_ref=${encodeURIComponent(paymentReference)}`,
      notifyUrl: `${siteBase}/api/payments/webhooks/${activeGw.provider}`,
      productSummary: `COVERLY Order ${summary.order.order_number}`,
      modeOverride: activeGw.mode as PaymentEnvironment,
    });

    if (!providerRes.success) {
      const err: any = new Error(providerRes.error || "Failed to create payment order with gateway.");
      err.status = 502;
      err.code = providerRes.errorCode || "PROVIDER_INIT_FAILED";
      throw err;
    }

    const commissionPaise = calculateBasisPointsPaise(
      summary.order.total_amount_paise,
      PLATFORM_COMMISSION_BPS
    );
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const { data: paymentRow, error: payErr } = await insforge.database
      .from("payments")
      .insert([
        {
          payment_reference: paymentReference,
          idempotency_key: idempotencyKey,
          order_id: orderId,
          order_number: summary.order.order_number,
          buyer_id: orderRow.buyer_id,
          buyer_business_id: orderRow.buyer_business_id || null,
          supplier_business_id: orderRow.supplier_business_id,
          provider: activeGw.provider,
          environment: activeGw.mode,
          currency: "INR",
          subtotal_paise: summary.order.subtotal_paise,
          tax_paise: summary.order.tax_paise,
          freight_paise: summary.order.freight_paise,
          other_charges_paise: summary.order.other_charges_paise,
          amount_paise: summary.order.total_amount_paise,
          amount_decimal: summary.order.total_amount_decimal,
          platform_commission_paise: commissionPaise,
          payment_method: paymentMethod || null,
          status: "PENDING",
          provider_order_id: providerRes.providerOrderId || null,
          provider_session_id: providerRes.providerSessionId || null,
          invoice_reference: `INV-${summary.order.order_number}`,
          metadata: { checkout_payload: providerRes.checkoutPayload || {} },
          expires_at: expiresAt,
        },
      ])
      .select("*")
      .single();

    if (payErr || !paymentRow) {
      throw new Error(payErr?.message || "Failed to persist payment record.");
    }

    const attemptNumber = (summary.existing_payments?.length || 0) + 1;
    await insforge.database.from("payment_attempts").insert([
      {
        payment_id: paymentRow.id,
        order_id: orderId,
        attempt_number: attemptNumber,
        provider: activeGw.provider,
        payment_method: paymentMethod || null,
        provider_order_id: providerRes.providerOrderId || null,
        status: "PENDING",
      },
    ]);

    await insforge.database.from("payment_events").insert([
      {
        payment_id: paymentRow.id,
        event_type: "PAYMENT_CHECKOUT_INITIATED",
        previous_status: "CREATED",
        new_status: "PENDING",
        source: "checkout",
        actor_id: user.id,
        details: {
          provider: activeGw.provider,
          environment: activeGw.mode,
          attempt_number: attemptNumber,
          payment_method: paymentMethod || null,
        },
      },
    ]);

    return {
      payment: paymentRow,
      idempotent_replay: false,
      checkout_payload: providerRes.checkoutPayload || null,
    };
  });
}

/**
 * Transitions a payment cleanly, synchronizes the linked COVERLY order (without duplicates),
 * and creates an honest settlement ledger record upon verified SUCCESS.
 */
export async function applyVerifiedPaymentState(params: {
  payment: any;
  targetStatus: PaymentLifecycleStatus;
  source: "provider_api" | "webhook";
  providerPaymentId?: string;
  providerOrderId?: string;
  paymentMethod?: string;
  gatewayFeePaise?: number;
  failureReason?: string;
  actorId?: string | null;
}) {
  const { payment, targetStatus, source } = params;
  const insforge = getInsForgeClient();
  if (!insforge) throw new Error("Database client unavailable.");

  return withPaymentLock(`payment:${payment.id}`, async () => {
    const { data: fresh } = await insforge.database
      .from("payments")
      .select("*")
      .eq("id", payment.id)
      .single();
    const current = fresh || payment;
    const currentStatus = current.status as PaymentLifecycleStatus;

    if (!canTransitionPaymentStatus(currentStatus, targetStatus)) {
      return { updated: false, payment: current, reason: `Transition ${currentStatus} -> ${targetStatus} ignored.` };
    }

    const nowIso = new Date().toISOString();
    const patch: Record<string, any> = {
      status: targetStatus,
      verified_source: source,
      updated_at: nowIso,
    };
    if (params.providerPaymentId) patch.provider_payment_id = params.providerPaymentId;
    if (params.providerOrderId) patch.provider_order_id = params.providerOrderId;
    if (params.paymentMethod) patch.payment_method = params.paymentMethod;
    if (typeof params.gatewayFeePaise === "number" && params.gatewayFeePaise >= 0) {
      patch.gateway_fee_paise = params.gatewayFeePaise;
    }
    if (params.failureReason) patch.failure_reason = params.failureReason;
    if (targetStatus === "SUCCESS" && !current.paid_at) {
      patch.paid_at = nowIso;
      patch.failure_reason = null;
    }

    const { data: updatedPayment, error: updErr } = await insforge.database
      .from("payments")
      .update(patch)
      .eq("id", current.id)
      .select("*")
      .single();

    if (updErr) throw new Error(updErr.message);

    // Update latest attempt status
    await insforge.database
      .from("payment_attempts")
      .update({
        status: ["REFUND_PENDING", "PARTIALLY_REFUNDED", "REFUNDED"].includes(targetStatus)
          ? "SUCCESS"
          : targetStatus,
        provider_payment_id: params.providerPaymentId || current.provider_payment_id || null,
        error_message: params.failureReason || null,
        updated_at: nowIso,
      })
      .eq("payment_id", current.id);

    await insforge.database.from("payment_events").insert([
      {
        payment_id: current.id,
        event_type: `PAYMENT_${targetStatus}`,
        previous_status: currentStatus,
        new_status: targetStatus,
        source,
        actor_id: params.actorId || null,
        details: {
          provider: current.provider,
          provider_payment_id: params.providerPaymentId || current.provider_payment_id || null,
          failure_reason: params.failureReason || null,
        },
      },
    ]);

    // Synchronize linked COVERLY Order + Honest Settlement Ledger ONLY on verified SUCCESS
    if (targetStatus === "SUCCESS" && currentStatus !== "SUCCESS") {
      const { data: order } = await insforge.database
        .from("orders")
        .select("id, status")
        .eq("id", current.order_id)
        .single();

      if (order && order.status === "pending_deposit") {
        await insforge.database
          .from("orders")
          .update({ status: "deposit_paid", updated_at: nowIso })
          .eq("id", order.id);

        try {
          await insforge.database.from("order_status_history").insert([
            {
              order_id: order.id,
              previous_status: "pending_deposit",
              new_status: "deposit_paid",
              changed_by: params.actorId || current.buyer_id,
              note: `Payment ${current.payment_reference} verified via ${current.provider} (${source}).`,
            },
          ]);
        } catch {}
      }

      // Check whether provider split settlement is formally approved
      const { data: gwCfg } = await insforge.database
        .from("payment_gateway_configs")
        .select("split_settlement_approved, split_settlement_product")
        .eq("provider", current.provider)
        .single();

      const splitApproved = Boolean(gwCfg?.split_settlement_approved);
      const grossPaise = Number(updatedPayment.amount_paise);
      const feePaise = Number(updatedPayment.gateway_fee_paise || 0);
      const commPaise = Number(updatedPayment.platform_commission_paise || 0);
      const netSupplierPaise = Math.max(0, subtractPaise(grossPaise, sumPaise(feePaise, commPaise)));

      // Idempotent settlement record creation (never claims payout happened prior to split approval)
      const { data: existingSettle } = await insforge.database
        .from("settlement_records")
        .select("id")
        .eq("payment_id", current.id)
        .single();

      if (!existingSettle) {
        await insforge.database.from("settlement_records").insert([
          {
            settlement_reference: `STL_${current.payment_reference}`,
            payment_id: current.id,
            order_id: current.order_id,
            supplier_business_id: current.supplier_business_id,
            provider: current.provider,
            gross_amount_paise: grossPaise,
            gateway_fee_paise: feePaise,
            platform_commission_paise: commPaise,
            net_supplier_payable_paise: netSupplierPaise,
            currency: current.currency || "INR",
            settlement_mode: splitApproved ? "provider_split_settlement" : "manual_ledger_only",
            settlement_status: splitApproved
              ? "ELIGIBLE_FOR_MANUAL_SETTLEMENT"
              : "PENDING_PROVIDER_SPLIT_APPROVAL",
            notes: splitApproved
              ? `Eligible for settlement via ${gwCfg?.split_settlement_product}.`
              : `Recorded in accounting ledger only. Automated supplier payout disabled until ${gwCfg?.split_settlement_product || current.provider} merchant onboarding and compliance approval are completed.`,
          },
        ]);
      }

      // Notify buyer on verified payment
      try {
        await insforge.database.from("notifications").insert([
          {
            user_id: current.buyer_id,
            title: `Payment Verified for Order ${current.order_number}`,
            message: `Your payment of ₹${updatedPayment.amount_decimal} (${current.payment_reference}) has been verified.`,
            link: `/buyer/orders/${current.order_id}`,
          },
        ]);
      } catch {}
    }

    return { updated: true, payment: updatedPayment };
  });
}

export async function verifyPaymentWithProvider(params: {
  paymentId: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  providerSignature?: string;
  user: AuthenticatedUser;
}) {
  const insforge = getInsForgeClient();
  if (!insforge) throw new Error("Database client unavailable.");

  const { data: payment, error } = await insforge.database
    .from("payments")
    .select("*")
    .eq("id", params.paymentId)
    .single();

  if (error || !payment) {
    const err: any = new Error("Payment record not found.");
    err.status = 404;
    throw err;
  }

  const isAdmin = params.user.roles.some((r) => ["admin", "super_admin", "finance_admin"].includes(r));
  if (payment.buyer_id !== params.user.id && !isAdmin) {
    const err: any = new Error("Not authorized to verify this payment.");
    err.status = 403;
    throw err;
  }

  const adapter = getPaymentProvider(payment.provider as PaymentProviderCode);
  const verification = await adapter.verifyPayment({
    paymentReference: payment.payment_reference,
    providerOrderId: params.providerOrderId || payment.provider_order_id || undefined,
    providerPaymentId: params.providerPaymentId || payment.provider_payment_id || undefined,
    providerSignature: params.providerSignature,
    modeOverride: payment.environment as PaymentEnvironment,
  });

  if (!verification.success) {
    return {
      verified: false,
      payment,
      provider_message: verification.error || "Unable to verify payment status with provider.",
    };
  }

  // Amount mismatch defense: reject if provider reports a different paid amount than expected order total
  if (
    verification.verified &&
    typeof verification.amountPaise === "number" &&
    verification.amountPaise !== Number(payment.amount_paise)
  ) {
    await applyVerifiedPaymentState({
      payment,
      targetStatus: "FAILED",
      source: "provider_api",
      providerPaymentId: verification.providerPaymentId,
      failureReason: `Amount mismatch: expected ${payment.amount_paise} paise, provider reported ${verification.amountPaise} paise.`,
      actorId: params.user.id,
    });
    const err: any = new Error("Payment amount mismatch detected against provider confirmation.");
    err.status = 400;
    err.code = "AMOUNT_MISMATCH";
    throw err;
  }

  const result = await applyVerifiedPaymentState({
    payment,
    targetStatus: verification.status,
    source: "provider_api",
    providerOrderId: verification.providerOrderId,
    providerPaymentId: verification.providerPaymentId,
    paymentMethod: verification.paymentMethod,
    gatewayFeePaise: verification.gatewayFeePaise,
    failureReason: verification.failureReason,
    actorId: params.user.id,
  });

  return {
    verified: result.payment.status === "SUCCESS",
    payment: result.payment,
    provider_status: verification.rawStatus || verification.status,
  };
}

// ============================================================================
// 3. REFUNDS (EXECUTED STRICTLY VIA ACTUAL GATEWAY API)
// ============================================================================

export async function initiatePaymentRefund(params: {
  paymentId: string;
  refundType: "full" | "partial";
  amount?: string | number;
  reason: string;
  admin: AuthenticatedUser;
}) {
  const insforge = getInsForgeClient();
  if (!insforge) throw new Error("Database client unavailable.");

  return withPaymentLock(`refund:${params.paymentId}`, async () => {
    const { data: payment, error } = await insforge.database
      .from("payments")
      .select("*")
      .eq("id", params.paymentId)
      .single();

    if (error || !payment) {
      const err: any = new Error("Payment not found.");
      err.status = 404;
      throw err;
    }

    const validation = validateRefundRequest({
      paymentStatus: payment.status,
      amountPaise: Number(payment.amount_paise),
      refundedPaise: Number(payment.refunded_paise || 0),
      requestedAmount: params.amount,
      refundType: params.refundType,
      reason: params.reason,
    });

    if (!validation.valid) {
      const err: any = new Error(validation.error);
      err.status = 400;
      err.code = "REFUND_VALIDATION_FAILED";
      throw err;
    }

    const refundAmountPaise = validation.refundAmountPaise!;
    const refundRef = `RFD_${Date.now()}_${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const idempotencyKey = `rfd_${payment.id}_${refundAmountPaise}_${crypto.randomUUID()}`;

    const adapter = getPaymentProvider(payment.provider as PaymentProviderCode);
    const providerRes = await adapter.initiateRefund({
      paymentReference: payment.payment_reference,
      refundReference: refundRef,
      providerOrderId: payment.provider_order_id || undefined,
      providerPaymentId: payment.provider_payment_id || undefined,
      amountPaise: refundAmountPaise,
      currency: payment.currency || "INR",
      reason: validation.reason!,
      modeOverride: payment.environment as PaymentEnvironment,
    });

    const nowIso = new Date().toISOString();
    const refundDecimal = paiseToRupeesString(refundAmountPaise);

    // Record refund truthfully — NEVER display SUCCESS unless provider explicitly confirmed SUCCESS!
    const { data: refundRow, error: refErr } = await insforge.database
      .from("payment_refunds")
      .insert([
        {
          refund_reference: refundRef,
          idempotency_key: idempotencyKey,
          payment_id: payment.id,
          order_id: payment.order_id,
          provider: payment.provider,
          refund_type: validation.refundType,
          amount_paise: refundAmountPaise,
          amount_decimal: refundDecimal,
          currency: payment.currency || "INR",
          reason: validation.reason!,
          status: providerRes.success ? providerRes.status : "FAILED",
          provider_refund_id: providerRes.providerRefundId || null,
          provider_response: {
            raw_status: providerRes.rawStatus || null,
            error: providerRes.error || null,
            error_code: providerRes.errorCode || null,
          },
          initiated_by: params.admin.id,
          processed_at: providerRes.success && providerRes.status === "SUCCESS" ? nowIso : null,
        },
      ])
      .select("*")
      .single();

    if (refErr) throw new Error(refErr.message);

    if (!providerRes.success) {
      const err: any = new Error(
        providerRes.error || "Gateway rejected refund initiation. No funds were marked refunded."
      );
      err.status = 502;
      err.code = providerRes.errorCode || "PROVIDER_REFUND_FAILED";
      throw err;
    }

    // Update payment status strictly according to provider response
    const prevRefunded = Number(payment.refunded_paise || 0);
    const nextRefunded =
      providerRes.status === "SUCCESS" ? sumPaise(prevRefunded, refundAmountPaise) : prevRefunded;

    let nextPaymentStatus: PaymentLifecycleStatus = "REFUND_PENDING";
    if (providerRes.status === "SUCCESS") {
      nextPaymentStatus =
        nextRefunded >= Number(payment.amount_paise) ? "REFUNDED" : "PARTIALLY_REFUNDED";
    }

    await insforge.database
      .from("payments")
      .update({
        status: nextPaymentStatus,
        refunded_paise: nextRefunded,
        updated_at: nowIso,
      })
      .eq("id", payment.id);

    await insforge.database.from("payment_events").insert([
      {
        payment_id: payment.id,
        event_type: `REFUND_${providerRes.status}`,
        previous_status: payment.status,
        new_status: nextPaymentStatus,
        source: "admin",
        actor_id: params.admin.id,
        details: {
          refund_reference: refundRef,
          provider_refund_id: providerRes.providerRefundId || null,
          amount_paise: refundAmountPaise,
          reason: validation.reason,
        },
      },
    ]);

    return refundRow;
  });
}

export async function syncRefundStatusWithProvider(refundId: string, admin: AuthenticatedUser) {
  const insforge = getInsForgeClient();
  if (!insforge) throw new Error("Database client unavailable.");

  const { data: refund, error } = await insforge.database
    .from("payment_refunds")
    .select("*, payments(*)")
    .eq("id", refundId)
    .single();

  if (error || !refund) {
    const err: any = new Error("Refund record not found.");
    err.status = 404;
    throw err;
  }

  const payment = (refund as any).payments;
  const adapter = getPaymentProvider(refund.provider as PaymentProviderCode);
  const res = await adapter.fetchRefundStatus({
    providerOrderId: payment?.provider_order_id || payment?.payment_reference,
    providerPaymentId: payment?.provider_payment_id || undefined,
    providerRefundId: refund.provider_refund_id || undefined,
    refundReference: refund.refund_reference,
    modeOverride: payment?.environment as PaymentEnvironment,
  });

  if (!res.success) {
    return { synced: false, refund, message: res.error || "Unable to fetch refund status from provider." };
  }

  const nowIso = new Date().toISOString();
  const { data: updatedRefund } = await insforge.database
    .from("payment_refunds")
    .update({
      status: res.status,
      provider_refund_id: res.providerRefundId || refund.provider_refund_id,
      processed_at: res.status === "SUCCESS" ? nowIso : refund.processed_at,
      updated_at: nowIso,
    })
    .eq("id", refund.id)
    .select("*")
    .single();

  if (res.status === "SUCCESS" && refund.status !== "SUCCESS" && payment) {
    const newRefunded = sumPaise(Number(payment.refunded_paise || 0), Number(refund.amount_paise));
    const nextPayStatus: PaymentLifecycleStatus =
      newRefunded >= Number(payment.amount_paise) ? "REFUNDED" : "PARTIALLY_REFUNDED";

    await insforge.database
      .from("payments")
      .update({ status: nextPayStatus, refunded_paise: newRefunded, updated_at: nowIso })
      .eq("id", payment.id);

    await insforge.database.from("payment_events").insert([
      {
        payment_id: payment.id,
        event_type: "REFUND_CONFIRMED_BY_PROVIDER",
        previous_status: payment.status,
        new_status: nextPayStatus,
        source: "provider_api",
        actor_id: admin.id,
        details: { refund_reference: refund.refund_reference, provider_refund_id: res.providerRefundId },
      },
    ]);
  }

  return { synced: true, refund: updatedRefund || refund };
}

// ============================================================================
// 4. ADMIN PAYMENT DASHBOARD (REAL DB DATA ONLY — ZERO INVENTED METRICS)
// ============================================================================

export async function getAdminPaymentDashboard(filters: {
  provider?: string;
  status?: string;
  limit?: number;
}) {
  const insforge = getInsForgeClient();
  if (!insforge) throw new Error("Database client unavailable.");

  const limit = Math.min(200, Math.max(10, filters.limit || 100));

  let payQ = insforge.database
    .from("payments")
    .select(
      "*, users!payments_buyer_id_fkey(id, full_name, email), businesses!payments_supplier_business_id_fkey(id, name, city)"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.provider && filters.provider !== "all") payQ = payQ.eq("provider", filters.provider);
  if (filters.status && filters.status !== "all") payQ = payQ.eq("status", filters.status);

  const [payRes, allPayRes, refRes, settleRes, whRes] = await Promise.all([
    payQ,
    insforge.database
      .from("payments")
      .select("provider, status, amount_paise, gateway_fee_paise, platform_commission_paise, refunded_paise"),
    insforge.database
      .from("payment_refunds")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    insforge.database
      .from("settlement_records")
      .select("*, businesses!settlement_records_supplier_business_id_fkey(id, name)")
      .order("created_at", { ascending: false })
      .limit(100),
    insforge.database
      .from("payment_webhook_events")
      .select("id, provider, provider_event_id, event_type, signature_valid, processing_status, received_at")
      .order("received_at", { ascending: false })
      .limit(50),
  ]);

  const allRows = allPayRes.data || [];
  let totalVolumePaise = 0;
  let totalFeesPaise = 0;
  let totalCommissionPaise = 0;
  let totalRefundedPaise = 0;
  let successfulCount = 0;
  let pendingCount = 0;
  let failedCount = 0;
  let refundedCount = 0;

  const gatewayBreakdown: Record<
    string,
    { provider: string; count: number; success_count: number; volume_paise: number; volume_decimal: string }
  > = {};
  for (const code of ALLOWED_PAYMENT_PROVIDERS) {
    gatewayBreakdown[code] = {
      provider: code,
      count: 0,
      success_count: 0,
      volume_paise: 0,
      volume_decimal: "0.00",
    };
  }

  for (const row of allRows) {
    const amt = Number(row.amount_paise || 0);
    const fee = Number(row.gateway_fee_paise || 0);
    const comm = Number(row.platform_commission_paise || 0);
    const rfd = Number(row.refunded_paise || 0);
    const gw = gatewayBreakdown[row.provider];
    if (gw) gw.count += 1;

    if (["SUCCESS", "PARTIALLY_REFUNDED", "REFUNDED", "REFUND_PENDING"].includes(row.status)) {
      totalVolumePaise = sumPaise(totalVolumePaise, amt);
      totalFeesPaise = sumPaise(totalFeesPaise, fee);
      totalCommissionPaise = sumPaise(totalCommissionPaise, comm);
      successfulCount += 1;
      if (gw) {
        gw.success_count += 1;
        gw.volume_paise = sumPaise(gw.volume_paise, amt);
      }
    } else if (["CREATED", "PENDING", "PROCESSING"].includes(row.status)) {
      pendingCount += 1;
    } else if (["FAILED", "CANCELLED", "EXPIRED"].includes(row.status)) {
      failedCount += 1;
    }

    if (rfd > 0 || ["REFUNDED", "PARTIALLY_REFUNDED", "REFUND_PENDING"].includes(row.status)) {
      totalRefundedPaise = sumPaise(totalRefundedPaise, rfd);
      refundedCount += 1;
    }
  }

  for (const code of ALLOWED_PAYMENT_PROVIDERS) {
    gatewayBreakdown[code].volume_decimal = paiseToRupeesString(gatewayBreakdown[code].volume_paise);
  }

  return {
    metrics: {
      total_transactions: allRows.length,
      total_volume_paise: totalVolumePaise,
      total_volume_decimal: paiseToRupeesString(totalVolumePaise),
      successful_payments: successfulCount,
      pending_payments: pendingCount,
      failed_payments: failedCount,
      refunded_payments: refundedCount,
      total_refunded_paise: totalRefundedPaise,
      total_refunded_decimal: paiseToRupeesString(totalRefundedPaise),
      total_fees_paise: totalFeesPaise,
      total_fees_decimal: paiseToRupeesString(totalFeesPaise),
      total_commission_paise: totalCommissionPaise,
      total_commission_decimal: paiseToRupeesString(totalCommissionPaise),
      currency: "INR",
    },
    gateway_breakdown: Object.values(gatewayBreakdown),
    payments: payRes.data || [],
    refunds: refRes.data || [],
    settlements: settleRes.data || [],
    recent_webhooks: whRes.data || [],
  };
}
