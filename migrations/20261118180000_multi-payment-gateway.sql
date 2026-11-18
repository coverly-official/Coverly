-- ============================================================================
-- COVERLY Multi-Payment Gateway Production Integration (Additive Migration)
-- Providers: Cashfree Payments, Razorpay, PayU, Paytm for Business
-- Strictly additive: preserves all existing tables, orders, users & records.
-- Never stores card numbers, CVV, UPI PINs, or raw API secrets in DB columns.
-- ============================================================================

-- 1. Gateway Configurations (metadata & mode only — secrets stay in server env)
CREATE TABLE IF NOT EXISTS public.payment_gateway_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE CHECK (provider IN ('cashfree', 'razorpay', 'payu', 'paytm')),
  display_name TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'sandbox' CHECK (mode IN ('sandbox', 'production')),
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  is_active_primary BOOLEAN NOT NULL DEFAULT false,
  supported_methods JSONB NOT NULL DEFAULT '["upi","card","netbanking","wallet"]'::jsonb,
  split_settlement_supported BOOLEAN NOT NULL DEFAULT false,
  split_settlement_approved BOOLEAN NOT NULL DEFAULT false,
  split_settlement_product TEXT,
  last_connection_status TEXT NOT NULL DEFAULT 'not_tested' CHECK (last_connection_status IN ('not_tested', 'connected', 'failed', 'missing_credentials')),
  last_connection_message TEXT,
  last_verified_at TIMESTAMPTZ,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed all 4 providers strictly DISABLED in sandbox mode by default
INSERT INTO public.payment_gateway_configs (
  provider, display_name, mode, is_enabled, is_active_primary,
  supported_methods, split_settlement_supported, split_settlement_approved, split_settlement_product
)
VALUES
  ('cashfree', 'Cashfree Payments', 'sandbox', false, false, '["upi","card","netbanking","wallet"]'::jsonb, true, false, 'Cashfree Easy Split'),
  ('razorpay', 'Razorpay', 'sandbox', false, false, '["upi","card","netbanking","wallet"]'::jsonb, true, false, 'Razorpay Route'),
  ('payu', 'PayU', 'sandbox', false, false, '["upi","card","netbanking","wallet"]'::jsonb, true, false, 'PayU Split Settlements'),
  ('paytm', 'Paytm for Business', 'sandbox', false, false, '["upi","card","netbanking","wallet"]'::jsonb, true, false, 'Paytm Marketplace Settlement')
ON CONFLICT (provider) DO NOTHING;

-- 2. Payments (Decimal-safe integer paise + NUMERIC(14,2) columns)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_reference TEXT NOT NULL UNIQUE,
  idempotency_key TEXT NOT NULL UNIQUE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  order_number TEXT NOT NULL,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  buyer_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  supplier_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL CHECK (provider IN ('cashfree', 'razorpay', 'payu', 'paytm')),
  environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  currency TEXT NOT NULL DEFAULT 'INR',
  subtotal_paise BIGINT NOT NULL DEFAULT 0 CHECK (subtotal_paise >= 0),
  tax_paise BIGINT NOT NULL DEFAULT 0 CHECK (tax_paise >= 0),
  freight_paise BIGINT NOT NULL DEFAULT 0 CHECK (freight_paise >= 0),
  other_charges_paise BIGINT NOT NULL DEFAULT 0 CHECK (other_charges_paise >= 0),
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  amount_decimal NUMERIC(14,2) NOT NULL CHECK (amount_decimal > 0),
  gateway_fee_paise BIGINT NOT NULL DEFAULT 0 CHECK (gateway_fee_paise >= 0),
  platform_commission_paise BIGINT NOT NULL DEFAULT 0 CHECK (platform_commission_paise >= 0),
  refunded_paise BIGINT NOT NULL DEFAULT 0 CHECK (refunded_paise >= 0),
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN (
    'CREATED',
    'PENDING',
    'PROCESSING',
    'SUCCESS',
    'FAILED',
    'CANCELLED',
    'EXPIRED',
    'REFUND_PENDING',
    'PARTIALLY_REFUNDED',
    'REFUNDED'
  )),
  provider_order_id TEXT,
  provider_payment_id TEXT,
  provider_session_id TEXT,
  invoice_reference TEXT,
  failure_reason TEXT,
  verified_source TEXT CHECK (verified_source IN ('provider_api', 'webhook', NULL)),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  paid_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_buyer_id ON public.payments(buyer_id);
CREATE INDEX IF NOT EXISTS idx_payments_supplier_biz ON public.payments(supplier_business_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_status ON public.payments(provider, status);
CREATE INDEX IF NOT EXISTS idx_payments_provider_order_id ON public.payments(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

-- 3. Payment Attempts (supports retries without creating duplicate orders)
CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  attempt_number INT NOT NULL DEFAULT 1 CHECK (attempt_number >= 1),
  provider TEXT NOT NULL CHECK (provider IN ('cashfree', 'razorpay', 'payu', 'paytm')),
  payment_method TEXT,
  provider_order_id TEXT,
  provider_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN (
    'CREATED', 'PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED'
  )),
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_payment_id ON public.payment_attempts(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_order_id ON public.payment_attempts(order_id);

-- 4. Payment Events (immutable transition & verification audit log)
CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  source TEXT NOT NULL CHECK (source IN ('checkout', 'provider_api', 'webhook', 'admin', 'system')),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_payment_id ON public.payment_events(payment_id, created_at DESC);

-- 5. Payment Refunds (full & partial refunds executed only via provider APIs)
CREATE TABLE IF NOT EXISTS public.payment_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_reference TEXT NOT NULL UNIQUE,
  idempotency_key TEXT NOT NULL UNIQUE,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL CHECK (provider IN ('cashfree', 'razorpay', 'payu', 'paytm')),
  refund_type TEXT NOT NULL CHECK (refund_type IN ('full', 'partial')),
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  amount_decimal NUMERIC(14,2) NOT NULL CHECK (amount_decimal > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'REFUND_PENDING' CHECK (status IN ('REFUND_PENDING', 'PROCESSING', 'SUCCESS', 'FAILED')),
  provider_refund_id TEXT,
  provider_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  initiated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_refunds_payment_id ON public.payment_refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_status ON public.payment_refunds(status);

-- 6. Payment Webhook Events (signature validation, replay & duplicate guard)
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('cashfree', 'razorpay', 'payu', 'paytm')),
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  signature_valid BOOLEAN NOT NULL DEFAULT false,
  payload_hash TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'received' CHECK (processing_status IN ('received', 'processed', 'duplicate_ignored', 'rejected_invalid_signature', 'failed')),
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  error_message TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  UNIQUE (provider, provider_event_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_webhook_provider_received ON public.payment_webhook_events(provider, received_at DESC);

-- 7. Settlement Records (honest ledger — never fabricates supplier payouts prior to split approval)
CREATE TABLE IF NOT EXISTS public.settlement_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_reference TEXT NOT NULL UNIQUE,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  supplier_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL CHECK (provider IN ('cashfree', 'razorpay', 'payu', 'paytm')),
  gross_amount_paise BIGINT NOT NULL CHECK (gross_amount_paise >= 0),
  gateway_fee_paise BIGINT NOT NULL DEFAULT 0 CHECK (gateway_fee_paise >= 0),
  platform_commission_paise BIGINT NOT NULL DEFAULT 0 CHECK (platform_commission_paise >= 0),
  refunded_deduction_paise BIGINT NOT NULL DEFAULT 0 CHECK (refunded_deduction_paise >= 0),
  net_supplier_payable_paise BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  settlement_mode TEXT NOT NULL DEFAULT 'manual_ledger_only' CHECK (settlement_mode IN ('manual_ledger_only', 'provider_split_settlement')),
  settlement_status TEXT NOT NULL DEFAULT 'PENDING_PROVIDER_SPLIT_APPROVAL' CHECK (settlement_status IN (
    'PENDING_PROVIDER_SPLIT_APPROVAL',
    'ELIGIBLE_FOR_MANUAL_SETTLEMENT',
    'SETTLEMENT_INITIATED',
    'SETTLED',
    'ON_HOLD_DISPUTE',
    'REVERSED_REFUND'
  )),
  provider_settlement_id TEXT,
  notes TEXT,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_settlement_records_payment_id ON public.settlement_records(payment_id);
CREATE INDEX IF NOT EXISTS idx_settlement_records_supplier ON public.settlement_records(supplier_business_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.payment_gateway_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_records ENABLE ROW LEVEL SECURITY;

-- Public/authenticated read of non-secret gateway availability (active/methods only)
DROP POLICY IF EXISTS "gateway_configs_read_authenticated" ON public.payment_gateway_configs;
CREATE POLICY "gateway_configs_read_authenticated"
  ON public.payment_gateway_configs FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Payments: Buyer or Supplier business member can view their own order payments
DROP POLICY IF EXISTS "payments_owner_select" ON public.payments;
CREATE POLICY "payments_owner_select"
  ON public.payments FOR SELECT
  USING (
    buyer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.business_members bm
      WHERE bm.business_id = payments.supplier_business_id
        AND bm.user_id = auth.uid()
    )
  );

-- Payment Attempts: visible to payment owner
DROP POLICY IF EXISTS "payment_attempts_owner_select" ON public.payment_attempts;
CREATE POLICY "payment_attempts_owner_select"
  ON public.payment_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.payments p
      WHERE p.id = payment_attempts.payment_id AND p.buyer_id = auth.uid()
    )
  );

-- Payment Events: visible to payment owner
DROP POLICY IF EXISTS "payment_events_owner_select" ON public.payment_events;
CREATE POLICY "payment_events_owner_select"
  ON public.payment_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.payments p
      WHERE p.id = payment_events.payment_id AND p.buyer_id = auth.uid()
    )
  );

-- Payment Refunds: visible to buyer or supplier business member
DROP POLICY IF EXISTS "payment_refunds_owner_select" ON public.payment_refunds;
CREATE POLICY "payment_refunds_owner_select"
  ON public.payment_refunds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.payments p
      WHERE p.id = payment_refunds.payment_id
        AND (
          p.buyer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.business_members bm
            WHERE bm.business_id = p.supplier_business_id AND bm.user_id = auth.uid()
          )
        )
    )
  );

-- Settlement Records: visible to supplier business member
DROP POLICY IF EXISTS "settlement_records_supplier_select" ON public.settlement_records;
CREATE POLICY "settlement_records_supplier_select"
  ON public.settlement_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.business_members bm
      WHERE bm.business_id = settlement_records.supplier_business_id
        AND bm.user_id = auth.uid()
    )
  );

-- Note: Webhook events & admin mutations run via server-side service role client
-- with strict Express RBAC middleware (Super Admin / Finance Admin only).
