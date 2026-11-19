-- ============================================================================
-- COVERLY Centralized Authentication, Google OAuth, Email OTP & Password Recovery
-- Migration: 20261119000000_centralized-auth-otp-recovery.sql
-- Strictly additive: preserves all existing tables, users, businesses & records.
-- Never stores plaintext OTPs, passwords, or raw tokens.
-- ============================================================================

-- 1. Extend public.users with email verification & Google OAuth link fields
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS google_id TEXT,
  ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'email'
    CHECK (auth_provider IN ('email', 'google', 'both', 'sso'));

CREATE INDEX IF NOT EXISTS idx_users_google_id ON public.users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON public.users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON public.users(auth_provider);

-- 2. Extend public.otp_challenges for purpose tagging & single-use password recovery tokens
ALTER TABLE public.otp_challenges
  ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'email_verification'
    CHECK (purpose IN ('email_verification', 'password_recovery', 'login_verification', 'email_change', 'mobile_verification')),
  ADD COLUMN IF NOT EXISTS resend_available_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS recovery_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS recovery_token_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_otp_challenges_dest_purpose
  ON public.otp_challenges(destination_hash, purpose, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_challenges_recovery
  ON public.otp_challenges(recovery_token_hash)
  WHERE recovery_token_hash IS NOT NULL;

-- 3. Branded Auth Email Delivery Log (Safe audit trail — NO secrets/passwords/OTPs)
CREATE TABLE IF NOT EXISTS public.auth_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  destination_hash TEXT NOT NULL,
  masked_destination TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN (
    'welcome_email',
    'email_verification_otp',
    'google_verification_otp',
    'forgot_password_otp',
    'password_changed',
    'email_changed',
    'security_alert'
  )),
  delivery_provider TEXT NOT NULL CHECK (delivery_provider IN ('insforge_emails', 'smtp', 'dev_mock')),
  delivery_status TEXT NOT NULL CHECK (delivery_status IN ('sent', 'failed', 'queued')),
  provider_message_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_email_logs_dest ON public.auth_email_logs(destination_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_email_logs_template ON public.auth_email_logs(template_type);

-- 4. Mark existing admin accounts and active operational users as email-verified
-- so platform administrators and active workspace members retain uninterrupted access.
UPDATE public.users u
SET email_verified = TRUE,
    email_verified_at = COALESCE(u.email_verified_at, NOW())
WHERE u.id IN (
  SELECT ur.user_id FROM public.user_roles ur
  WHERE ur.role IN ('admin', 'super_admin', 'platform_admin', 'support_admin', 'verification_admin')
)
AND u.email_verified = FALSE;

-- Also sync verification_profiles for admin users
UPDATE public.verification_profiles vp
SET email_verified = TRUE,
    email_verified_at = COALESCE(vp.email_verified_at, NOW())
WHERE vp.user_id IN (
  SELECT ur.user_id FROM public.user_roles ur
  WHERE ur.role IN ('admin', 'super_admin', 'platform_admin', 'support_admin', 'verification_admin')
)
AND vp.email_verified = FALSE;
