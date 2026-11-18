# COVERLY — Multi-Payment Gateway Production Integration Report

**Date:** 2026-11-18
**Production URL:** `https://coverly-indol.vercel.app`
**Linked Database:** InsForge PostgreSQL (`Coverly` — `https://4vwfw2w8.ap-southeast.insforge.app`)
**Scope:** Provider-independent multi-payment gateway architecture supporting Cashfree Payments, Razorpay, PayU, and Paytm for Business with strict webhook signature verification, decimal-safe financial accounting, full/partial refunds, honest split-settlement tracking, Admin Gateway Settings, Admin Payments Dashboard, and unified Buyer Checkout.

---

## 1. Implemented Payment Providers & Official APIs

All four providers implement the unified `PaymentProviderAdapter` contract in `backend/src/modules/payments/payment.interface.ts`:

| Provider | Adapter File | Official Documented API / Protocol | Supported Checkout Methods | Webhook Endpoint |
|---|---|---|---|---|
| **Cashfree Payments** | `providers/cashfree.provider.ts` | Cashfree PG REST API `v2023-08-01` (`/pg/orders`, `/pg/orders/{id}/refunds`) | UPI, Cards, Net Banking, Wallets | `POST /api/payments/webhooks/cashfree` |
| **Razorpay** | `providers/razorpay.provider.ts` | Razorpay Orders & Payments REST API `v1` (`/v1/orders`, `/v1/payments/{id}/refund`) | UPI, Cards, Net Banking, Wallets | `POST /api/payments/webhooks/razorpay` |
| **PayU** | `providers/payu.provider.ts` | PayU Hosted Checkout (`/_payment`) + Postservice API v2 (`verify_payment`, `cancel_refund_transaction`, `check_action_status`) | UPI, Cards, Net Banking, Wallets | `POST /api/payments/webhooks/payu` |
| **Paytm for Business** | `providers/paytm.provider.ts` | Paytm All-in-One Gateway (`/theia/api/v1/initiateTransaction`, `/v3/order/status`, `/refund/apply`, `/v2/refund/status`) | UPI, Cards, Net Banking, Wallets | `POST /api/payments/webhooks/paytm` |

---

## 2. Credentials Configured Status (Zero Secrets Exposed)

All provider credentials are read exclusively from backend server environment variables (documented in `.env.example`) and are **never** exposed to frontend code, logged, or requested via browser forms.

| Provider | Required Server Environment Variables | Current Server Status | Gateway Initial State |
|---|---|---|---|
| **Cashfree Payments** | `CASHFREE_CLIENT_ID`, `CASHFREE_CLIENT_SECRET`, `CASHFREE_ENVIRONMENT`, `CASHFREE_WEBHOOK_SECRET` | **Not yet configured** (pending merchant onboarding & Vercel env setup) | Disabled (`sandbox`) |
| **Razorpay** | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | **Not yet configured** (pending merchant onboarding & Vercel env setup) | Disabled (`sandbox`) |
| **PayU** | `PAYU_MERCHANT_KEY`, `PAYU_MERCHANT_SALT`, `PAYU_ENVIRONMENT`, `PAYU_WEBHOOK_SECRET` (optional) | **Not yet configured** (pending merchant onboarding & Vercel env setup) | Disabled (`sandbox`) |
| **Paytm for Business** | `PAYTM_MID`, `PAYTM_MERCHANT_KEY`, `PAYTM_ENVIRONMENT` | **Not yet configured** (pending merchant onboarding & Vercel env setup) | Disabled (`sandbox`) |

> All 4 gateways default strictly to **Disabled (`is_enabled = false`) in Sandbox Mode** in `payment_gateway_configs`. Activation is programmatically blocked until server credentials are configured, environment separation matches (`sandbox` vs `production`), and **Test Connection** succeeds.

---

## 3. Database Schema (Additive Migration Applied Live)

Applied live to the existing InsForge PostgreSQL database via `migrations/20261118180000_multi-payment-gateway.sql` without altering any existing tables or records:
- `payment_gateway_configs` (gateway metadata, mode, enabled/primary flags, connection test status — zero raw secrets)
- `payments` (integer `amount_paise BIGINT` + `NUMERIC(14,2)`, itemized `subtotal_paise`, `tax_paise`, `freight_paise`, `other_charges_paise`, `gateway_fee_paise`, `platform_commission_paise`, `refunded_paise`, 10-state `status`, `idempotency_key UNIQUE`, linked to `orders(id)`, `buyer_id`, `supplier_business_id`)
- `payment_attempts` (supports safe payment retries on the same `order_id` without creating duplicate orders)
- `payment_events` (immutable audit trail of every status transition & verification source)
- `payment_refunds` (full/partial refund tracking linked to provider refund IDs)
- `payment_webhook_events` (`UNIQUE (provider, provider_event_id)` replay/duplicate guard + signature audit log)
- `settlement_records` (decimal-safe supplier payable ledger)

All monetary calculations use integer-paise / `BigInt` math (`rupeesToPaise`, `paiseToRupeesString`, `sumPaise`, `subtractPaise`, `calculateBasisPointsPaise`) — zero floating-point arithmetic. Card numbers, CVVs, and UPI PINs are never collected or stored (provider-hosted checkout / tokenization only).

---

## 4. Payment Lifecycle & Order Synchronization

Implemented all 10 required states with strict state-machine transition guards (`canTransitionPaymentStatus`):
`CREATED` → `PENDING` → `PROCESSING` → `SUCCESS` / `FAILED` / `CANCELLED` / `EXPIRED` → `REFUND_PENDING` → `PARTIALLY_REFUNDED` / `REFUNDED`.

- Browser redirect alone never confirms a payment.
- Orders transition from `pending_deposit` → `deposit_paid` (with `order_status_history` audit entry) **only** upon authoritative provider API verification (`POST /api/payments/:paymentId/verify`) or verified cryptographic webhook (`POST /api/payments/webhooks/:provider`).
- Amount mismatch between expected order `amount_paise` and provider-confirmed amount automatically fails verification and blocks order marking.

---

## 5. Webhook Security

- Raw HTTP request body (`req.rawBody`) captured before parsing in `backend/src/app.ts` for both JSON and URL-encoded webhook payloads.
- **Cashfree:** Verifies Base64 `HMAC-SHA256(secret, x-webhook-timestamp + rawBody)` with 10-minute replay-window enforcement.
- **Razorpay:** Verifies Hex `HMAC-SHA256(RAZORPAY_WEBHOOK_SECRET, rawBody)` via `crypto.timingSafeEqual`.
- **PayU:** Verifies official reverse `SHA-512` hash (and optional `PAYU_WEBHOOK_SECRET` HMAC header).
- **Paytm:** Verifies official AES-128-CBC + SHA-256 `CHECKSUMHASH` signature.
- Invalid signatures return `HTTP 401` and log `rejected_invalid_signature` in `payment_webhook_events`.
- Duplicate/replayed event IDs are ignored idempotently via `UNIQUE (provider, provider_event_id)`.

---

## 6. Refunds & Marketplace Split Settlement Capability

### Refunds
- Authorized Super Admin / Finance Admin users can issue **Full** or **Partial** refunds from `/admin/payments` with mandatory reason and exact remaining-balance enforcement.
- Refund execution calls the actual provider refund API (`POST /orders/{id}/refunds`, `POST /v1/payments/{id}/refund`, `cancel_refund_transaction`, `/refund/apply`). Refunds are never displayed as `SUCCESS` before provider confirmation and support manual `Sync` via `POST /api/payments/admin/refunds/:refundId/sync`.

### Marketplace Split Settlement (Honest Ledger Status)
COVERLY's B2B marketplace model involves buyer collection, platform commission recording, supplier settlement, and refund adjustments. Because standard merchant gateway accounts do **not** include automated split payouts by default:
- **Cashfree Easy Split**, **Razorpay Route**, **PayU Split Settlements**, and **Paytm Marketplace Settlement** all remain marked `split_settlement_approved = false`.
- Upon verified payment success, `settlement_records` records the accounting split (`gross_amount_paise`, `gateway_fee_paise`, `platform_commission_paise`, `net_supplier_payable_paise`) with honest status `PENDING_PROVIDER_SPLIT_APPROVAL` and `settlement_mode = manual_ledger_only`. Automated supplier payouts are **not** executed or pretended until formal merchant onboarding, nodal/escrow compliance, and provider approval are completed.

---

## 7. Sandbox & Automated Test Results

Unit & integration test suite (`backend/test/payment_gateways.test.ts`) verified:
- Decimal-safe paise arithmetic & zero float drift
- 10-state payment lifecycle & regression guards
- Missing credentials returning `missing_credentials` across all 4 providers (zero fabricated success)
- Cryptographic webhook signature validation & replay protection for Cashfree, Razorpay, PayU, and Paytm
- PayU SHA-512 sandbox checkout payload generation without leaking merchant salt
- Full & partial refund balance validation & ineligible-status blocking
- RBAC restriction (`super_admin`, `admin`, `finance_admin` allowed; `support_admin`, `verification_admin`, `buyer` blocked)
- Sandbox vs Production environment separation & untested-activation blocking
- Additive migration schema & unique replay constraint presence

*(Zero real-money transactions were executed during testing.)*

---

## 8. Outstanding Provider Approvals & Production Readiness Checklist

Before enabling **Production Mode** on any gateway:
1. Complete merchant KYC & business onboarding with the selected provider(s) (Cashfree / Razorpay / PayU / Paytm).
2. Add production credentials and webhook secrets in **Vercel Project Settings → Environment Variables** (never in GitHub or frontend env vars).
3. Configure the provider dashboard webhook URL to `https://coverly-indol.vercel.app/api/payments/webhooks/{provider}`.
4. In `/admin/payment-gateways`, test connection in **Sandbox Mode** first and run end-to-end sandbox checkout + refund + webhook verification.
5. Switch mode to **Production**, re-run **Test Connection**, and activate the approved primary gateway.
6. Separately apply for marketplace split-settlement approval (Easy Split / Route / PayU Split / Paytm Marketplace) before enabling automated supplier payouts.
