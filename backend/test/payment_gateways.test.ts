import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  ALL_PAYMENT_STATUSES,
  calculateBasisPointsPaise,
  canTransitionPaymentStatus,
  paiseToRupeesString,
  rupeesToPaise,
  subtractPaise,
  sumPaise,
} from "../src/modules/payments/payment.interface.js";
import {
  canManagePaymentGateways,
  validateCheckoutInitiationPayload,
  validateGatewayActivation,
  validateRefundRequest,
} from "../src/modules/payments/payment.validation.js";
import { CashfreeProvider } from "../src/modules/payments/providers/cashfree.provider.js";
import { RazorpayProvider } from "../src/modules/payments/providers/razorpay.provider.js";
import {
  PayUProvider,
  computePayuCheckoutHash,
  computePayuReverseHash,
} from "../src/modules/payments/providers/payu.provider.js";
import {
  PaytmProvider,
  generatePaytmSignature,
  verifyPaytmSignature,
} from "../src/modules/payments/providers/paytm.provider.js";

const ENV_KEYS = [
  "CASHFREE_CLIENT_ID",
  "CASHFREE_CLIENT_SECRET",
  "CASHFREE_ENVIRONMENT",
  "CASHFREE_WEBHOOK_SECRET",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "PAYU_MERCHANT_KEY",
  "PAYU_MERCHANT_SALT",
  "PAYU_ENVIRONMENT",
  "PAYU_WEBHOOK_SECRET",
  "PAYTM_MID",
  "PAYTM_MERCHANT_KEY",
  "PAYTM_ENVIRONMENT",
];

describe("COVERLY Multi-Payment Gateway Production Architecture", () => {
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of ENV_KEYS) {
      savedEnv[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
  });

  describe("1. Decimal-Safe Monetary Arithmetic & 10-State Payment Lifecycle", () => {
    it("avoids floating-point drift across rupees/paise conversion and summation", () => {
      // Classic IEEE-754 trap: 0.1 + 0.2 !== 0.3 in floats; integer paise is exact
      const p1 = rupeesToPaise("0.10");
      const p2 = rupeesToPaise("0.20");
      assert.equal(sumPaise(p1, p2), 30);
      assert.equal(paiseToRupeesString(sumPaise(p1, p2)), "0.30");

      const total = rupeesToPaise("145999.99");
      assert.equal(total, 14599999);
      assert.equal(paiseToRupeesString(total), "145999.99");
      assert.equal(subtractPaise(total, rupeesToPaise("45999.99")), 10000000);
      assert.equal(calculateBasisPointsPaise(100000, 150), 1500); // 1.50% of ₹1000.00 = ₹15.00
    });

    it("enforces all 10 lifecycle states and blocks invalid status regressions", () => {
      assert.equal(ALL_PAYMENT_STATUSES.length, 10);
      assert.equal(canTransitionPaymentStatus("CREATED", "PENDING"), true);
      assert.equal(canTransitionPaymentStatus("PENDING", "PROCESSING"), true);
      assert.equal(canTransitionPaymentStatus("PROCESSING", "SUCCESS"), true);
      assert.equal(canTransitionPaymentStatus("PENDING", "FAILED"), true);
      assert.equal(canTransitionPaymentStatus("SUCCESS", "REFUND_PENDING"), true);
      assert.equal(canTransitionPaymentStatus("SUCCESS", "PARTIALLY_REFUNDED"), true);
      assert.equal(canTransitionPaymentStatus("PARTIALLY_REFUNDED", "REFUNDED"), true);
      // Guard against regression
      assert.equal(canTransitionPaymentStatus("SUCCESS", "FAILED"), false);
      assert.equal(canTransitionPaymentStatus("SUCCESS", "PENDING"), false);
      assert.equal(canTransitionPaymentStatus("REFUNDED", "SUCCESS"), false);
      assert.equal(canTransitionPaymentStatus("FAILED", "SUCCESS"), false);
    });
  });

  describe("2. Missing Credentials & Honest Gateway Connection Tests (Zero Fabrication)", () => {
    it("reports missing_credentials honestly across all 4 providers when env vars are unset", async () => {
      const providers = [
        new CashfreeProvider(),
        new RazorpayProvider(),
        new PayUProvider(),
        new PaytmProvider(),
      ];

      for (const p of providers) {
        const cfg = p.getConfigStatus("sandbox");
        assert.equal(cfg.configured, false, `${p.provider} must report configured=false`);
        assert.ok(cfg.missingEnvVars.length >= 2, `${p.provider} must list missing env vars`);

        const conn = await p.testConnection("sandbox");
        assert.equal(conn.connected, false, `${p.provider} must never fabricate connected=true`);
        assert.equal(conn.status, "missing_credentials");
      }
    });
  });

  describe("3. Webhook Cryptographic Signature Verification & Replay Protection", () => {
    it("verifies Cashfree Base64 HMAC-SHA256 webhook signature and rejects tampered or stale replays", async () => {
      process.env.CASHFREE_CLIENT_ID = "cf_test_id";
      process.env.CASHFREE_CLIENT_SECRET = "cf_test_secret";
      process.env.CASHFREE_WEBHOOK_SECRET = "cf_wh_secret_123";

      const cf = new CashfreeProvider();
      const payload = {
        type: "PAYMENT_SUCCESS_WEBHOOK",
        data: {
          order: { order_id: "CVP_TEST_1001", cf_order_id: "123456" },
          payment: { cf_payment_id: "998877", payment_status: "SUCCESS" },
        },
      };
      const rawBody = JSON.stringify(payload);
      const nowTs = String(Date.now());
      const validSig = crypto
        .createHmac("sha256", "cf_wh_secret_123")
        .update(`${nowTs}${rawBody}`)
        .digest("base64");

      const okRes = await cf.processWebhook({
        rawBody,
        parsedBody: payload,
        headers: {
          "x-webhook-timestamp": nowTs,
          "x-webhook-signature": validSig,
          "x-idempotency-key": "evt_cf_001",
        },
      });
      assert.equal(okRes.signatureValid, true);
      assert.equal(okRes.mappedStatus, "SUCCESS");
      assert.equal(okRes.paymentReference, "CVP_TEST_1001");

      // Invalid signature rejected
      const badSigRes = await cf.processWebhook({
        rawBody,
        parsedBody: payload,
        headers: { "x-webhook-timestamp": nowTs, "x-webhook-signature": "tampered_sig" },
      });
      assert.equal(badSigRes.signatureValid, false);

      // Replay attack with 30-minute old timestamp rejected
      const staleTs = String(Date.now() - 30 * 60 * 1000);
      const staleSig = crypto
        .createHmac("sha256", "cf_wh_secret_123")
        .update(`${staleTs}${rawBody}`)
        .digest("base64");
      const staleRes = await cf.processWebhook({
        rawBody,
        parsedBody: payload,
        headers: { "x-webhook-timestamp": staleTs, "x-webhook-signature": staleSig },
      });
      assert.equal(staleRes.signatureValid, false);
      assert.match(staleRes.error || "", /replay/i);
    });

    it("verifies Razorpay Hex HMAC-SHA256 webhook signature and rejects invalid signatures", async () => {
      process.env.RAZORPAY_KEY_ID = "rzp_test_abc123";
      process.env.RAZORPAY_KEY_SECRET = "rzp_secret_xyz";
      process.env.RAZORPAY_WEBHOOK_SECRET = "rzp_wh_secret_456";

      const rzp = new RazorpayProvider();
      const payload = {
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: "pay_Test001",
              order_id: "order_Test001",
              fee: 2360,
              notes: { payment_reference: "CVP_RZP_001" },
            },
          },
        },
      };
      const rawBody = JSON.stringify(payload);
      const validSig = crypto
        .createHmac("sha256", "rzp_wh_secret_456")
        .update(rawBody)
        .digest("hex");

      const okRes = await rzp.processWebhook({
        rawBody,
        parsedBody: payload,
        headers: { "x-razorpay-signature": validSig, "x-razorpay-event-id": "evt_rzp_1" },
      });
      assert.equal(okRes.signatureValid, true);
      assert.equal(okRes.mappedStatus, "SUCCESS");
      assert.equal(okRes.paymentReference, "CVP_RZP_001");
      assert.equal(okRes.gatewayFeePaise, 2360);

      const badRes = await rzp.processWebhook({
        rawBody,
        parsedBody: payload,
        headers: { "x-razorpay-signature": "0000deadbeef" },
      });
      assert.equal(badRes.signatureValid, false);
    });

    it("computes PayU SHA-512 sandbox checkout payload without leaking salt and verifies reverse webhook hash", async () => {
      process.env.PAYU_MERCHANT_KEY = "gtKFFx";
      process.env.PAYU_MERCHANT_SALT = "test_salt_secret_val";
      process.env.PAYU_ENVIRONMENT = "sandbox";

      const payu = new PayUProvider();
      const checkout = await payu.initiateCheckout({
        paymentReference: "CVP_PAYU_001",
        orderNumber: "ORD-2026-001",
        amountPaise: 250000,
        currency: "INR",
        customer: { id: "u1", name: "Rajesh", email: "rajesh@test.com", phone: "9876543210" },
        returnUrl: "https://coverly-indol.vercel.app/buyer/orders/1/checkout",
        notifyUrl: "https://coverly-indol.vercel.app/api/payments/webhooks/payu",
        productSummary: "Industrial Steel Coils",
        modeOverride: "sandbox",
      });
      assert.equal(checkout.success, true);
      assert.equal(checkout.checkoutPayload?.action_url, "https://test.payu.in/_payment");
      // Ensure salt is NEVER leaked in checkout form fields
      assert.equal(JSON.stringify(checkout.checkoutPayload).includes("test_salt_secret_val"), false);
      const expectedForward = computePayuCheckoutHash({
        key: "gtKFFx",
        txnid: "CVP_PAYU_001",
        amount: "2500.00",
        productinfo: "COVERLY Order ORD-2026-001",
        firstname: "Rajesh",
        email: "rajesh@test.com",
        udf1: "ORD-2026-001",
        salt: "test_salt_secret_val",
      });
      assert.equal(checkout.checkoutPayload?.form_fields?.hash, expectedForward);

      // Reverse webhook hash verification
      const revHash = computePayuReverseHash({
        salt: "test_salt_secret_val",
        status: "success",
        udf1: "ORD-2026-001",
        email: "rajesh@test.com",
        firstname: "Rajesh",
        productinfo: "COVERLY Order ORD-2026-001",
        amount: "2500.00",
        txnid: "CVP_PAYU_001",
        key: "gtKFFx",
      });
      const whPayload = {
        key: "gtKFFx",
        txnid: "CVP_PAYU_001",
        mihpayid: "403993715520001",
        amount: "2500.00",
        productinfo: "COVERLY Order ORD-2026-001",
        firstname: "Rajesh",
        email: "rajesh@test.com",
        udf1: "ORD-2026-001",
        status: "success",
        hash: revHash,
      };
      const validWh = await payu.processWebhook({
        rawBody: JSON.stringify(whPayload),
        parsedBody: whPayload,
        headers: {},
      });
      assert.equal(validWh.signatureValid, true);
      assert.equal(validWh.mappedStatus, "SUCCESS");

      const tamperedWh = await payu.processWebhook({
        rawBody: JSON.stringify({ ...whPayload, amount: "1.00" }),
        parsedBody: { ...whPayload, amount: "1.00" },
        headers: {},
      });
      assert.equal(tamperedWh.signatureValid, false);
    });

    it("generates and verifies Paytm AES-128-CBC + SHA-256 webhook checksums", async () => {
      process.env.PAYTM_MID = "TEST_MID_123";
      process.env.PAYTM_MERCHANT_KEY = "1234567890123456";
      process.env.PAYTM_ENVIRONMENT = "sandbox";

      const sample = "ORDER123|TXN456|TXN_SUCCESS";
      const sig = generatePaytmSignature(sample, "1234567890123456");
      assert.equal(verifyPaytmSignature(sample, "1234567890123456", sig), true);
      assert.equal(verifyPaytmSignature("TAMPERED", "1234567890123456", sig), false);

      const paytm = new PaytmProvider();
      const bodyParams = {
        MID: "TEST_MID_123",
        ORDERID: "CVP_PAYTM_001",
        STATUS: "TXN_SUCCESS",
        TXNAMOUNT: "1500.00",
        TXNID: "202611180001",
      };
      const sorted = "TEST_MID_123|CVP_PAYTM_001|TXN_SUCCESS|1500.00|202611180001";
      const checksum = generatePaytmSignature(sorted, "1234567890123456");

      const okRes = await paytm.processWebhook({
        rawBody: JSON.stringify({ ...bodyParams, CHECKSUMHASH: checksum }),
        parsedBody: { ...bodyParams, CHECKSUMHASH: checksum },
        headers: {},
      });
      assert.equal(okRes.signatureValid, true);
      assert.equal(okRes.mappedStatus, "SUCCESS");
      assert.equal(okRes.paymentReference, "CVP_PAYTM_001");

      const badRes = await paytm.processWebhook({
        rawBody: JSON.stringify({ ...bodyParams, CHECKSUMHASH: "invalid_checksum" }),
        parsedBody: { ...bodyParams, CHECKSUMHASH: "invalid_checksum" },
        headers: {},
      });
      assert.equal(badRes.signatureValid, false);
    });
  });

  describe("4. Refunds, Authorization, Gateway Switching & Production Environment Separation", () => {
    it("validates full and partial refunds strictly and blocks over-refunds or ineligible statuses", () => {
      // Full refund eligible
      const fullOk = validateRefundRequest({
        paymentStatus: "SUCCESS",
        amountPaise: 500000,
        refundedPaise: 0,
        refundType: "full",
        reason: "Supplier cancelled dispatch",
      });
      assert.equal(fullOk.valid, true);
      assert.equal(fullOk.refundAmountPaise, 500000);

      // Partial refund eligible
      const partialOk = validateRefundRequest({
        paymentStatus: "SUCCESS",
        amountPaise: 500000,
        refundedPaise: 100000,
        refundType: "partial",
        requestedAmount: "1500.50",
        reason: "Short quantity delivered on batch #2",
      });
      assert.equal(partialOk.valid, true);
      assert.equal(partialOk.refundAmountPaise, 150050);

      // Over-refund rejected
      const overRef = validateRefundRequest({
        paymentStatus: "PARTIALLY_REFUNDED",
        amountPaise: 500000,
        refundedPaise: 400000,
        refundType: "partial",
        requestedAmount: "1500.00",
        reason: "Exceeds balance",
      });
      assert.equal(overRef.valid, false);
      assert.match(overRef.error || "", /exceeds remaining/i);

      // Pending payment cannot be refunded
      const ineligible = validateRefundRequest({
        paymentStatus: "PENDING",
        amountPaise: 500000,
        refundedPaise: 0,
        refundType: "full",
        reason: "Attempt before settlement",
      });
      assert.equal(ineligible.valid, false);
    });

    it("restricts payment gateway administration strictly to Super Admin and Finance Admin", () => {
      assert.equal(
        canManagePaymentGateways({ id: "1", email: "a@c.com", full_name: "SA", roles: ["super_admin"], activeRole: "super_admin" }),
        true
      );
      assert.equal(
        canManagePaymentGateways({ id: "2", email: "f@c.com", full_name: "FA", roles: ["finance_admin"], activeRole: "finance_admin" }),
        true
      );
      assert.equal(
        canManagePaymentGateways({ id: "3", email: "s@c.com", full_name: "Sup", roles: ["support_admin"], activeRole: "support_admin" }),
        false
      );
      assert.equal(
        canManagePaymentGateways({ id: "4", email: "v@c.com", full_name: "Ver", roles: ["verification_admin"], activeRole: "verification_admin" }),
        false
      );
      assert.equal(
        canManagePaymentGateways({ id: "5", email: "b@c.com", full_name: "Buyer", roles: ["buyer"], activeRole: "buyer" }),
        false
      );
    });

    it("enforces strict sandbox vs production environment separation and blocks untested activation", () => {
      process.env.RAZORPAY_KEY_ID = "rzp_test_12345";
      process.env.RAZORPAY_KEY_SECRET = "secret_test";
      process.env.RAZORPAY_WEBHOOK_SECRET = "wh_test";

      const rzp = new RazorpayProvider();
      const prodCheck = rzp.getConfigStatus("production");
      assert.ok(prodCheck.environmentMismatchError, "Must block rzp_test_* key in production mode");

      const activateProd = validateGatewayActivation({
        credStatus: prodCheck,
        requestedMode: "production",
        lastConnectionStatus: "connected",
      });
      assert.equal(activateProd.valid, false);

      // Even in sandbox, enabling before Test Connection passes must be blocked
      const sandboxCfg = rzp.getConfigStatus("sandbox");
      const untestedCheck = validateGatewayActivation({
        credStatus: sandboxCfg,
        requestedMode: "sandbox",
        lastConnectionStatus: "not_tested",
      });
      assert.equal(untestedCheck.valid, false);
      assert.match(untestedCheck.error || "", /Test Connection/i);

      // Passes once sandbox credentials match and Test Connection succeeded
      const verifiedCheck = validateGatewayActivation({
        credStatus: sandboxCfg,
        requestedMode: "sandbox",
        lastConnectionStatus: "connected",
      });
      assert.equal(verifiedCheck.valid, true);
    });

    it("validates checkout payload cleanly and rejects unsupported payment methods", () => {
      const ok = validateCheckoutInitiationPayload({
        order_id: "ord-uuid-123",
        payment_method: "upi",
        idempotency_key: "chk_order_12345678",
      });
      assert.equal(ok.valid, true);

      const badMethod = validateCheckoutInitiationPayload({
        order_id: "ord-uuid-123",
        payment_method: "crypto_coin",
      });
      assert.equal(badMethod.valid, false);
    });

    it("includes additive migration with all 7 payment tables, RLS, and UNIQUE webhook replay constraint", () => {
      const migPath = path.resolve(
        process.cwd(),
        "..",
        "migrations",
        "20261118180000_multi-payment-gateway.sql"
      );
      assert.equal(fs.existsSync(migPath), true);
      const sql = fs.readFileSync(migPath, "utf8");
      const tables = [
        "payment_gateway_configs",
        "payments",
        "payment_attempts",
        "payment_events",
        "payment_refunds",
        "payment_webhook_events",
        "settlement_records",
      ];
      for (const t of tables) {
        assert.ok(sql.includes(`CREATE TABLE IF NOT EXISTS public.${t}`), `Missing table ${t}`);
        assert.ok(sql.includes(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY`), `Missing RLS for ${t}`);
      }
      assert.ok(sql.includes("UNIQUE (provider, provider_event_id)"), "Webhook replay UNIQUE index required");
    });
  });
});
