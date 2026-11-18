-- ============================================================================
-- COVERLY Centralized Identity & Business Document Verification System
-- Additive Migration Only (Preserves all existing tables, users & businesses)
-- ============================================================================

-- 1. Verification Profiles (Per User + Optional Business Membership)
CREATE TABLE IF NOT EXISTS public.verification_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  role_code TEXT NOT NULL DEFAULT 'buyer',
  overall_status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (overall_status IN (
      'not_started', 'not_submitted', 'uploading', 'uploaded', 'submitted',
      'pending_verification', 'under_review', 'verified', 'partially_verified',
      'rejected', 'resubmission_required', 'expired'
    )),
  completion_percent INTEGER NOT NULL DEFAULT 0 CHECK (completion_percent >= 0 AND completion_percent <= 100),
  mobile_verified BOOLEAN NOT NULL DEFAULT FALSE,
  mobile_verified_at TIMESTAMPTZ,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified_at TIMESTAMPTZ,
  identity_verified BOOLEAN NOT NULL DEFAULT FALSE,
  identity_verified_at TIMESTAMPTZ,
  pan_verified BOOLEAN NOT NULL DEFAULT FALSE,
  pan_verified_at TIMESTAMPTZ,
  gst_verified BOOLEAN NOT NULL DEFAULT FALSE,
  gst_verified_at TIMESTAMPTZ,
  udyam_verified BOOLEAN NOT NULL DEFAULT FALSE,
  udyam_verified_at TIMESTAMPTZ,
  business_verified BOOLEAN NOT NULL DEFAULT FALSE,
  business_verified_at TIMESTAMPTZ,
  risk_status TEXT NOT NULL DEFAULT 'low' CHECK (risk_status IN ('low', 'medium', 'high', 'flagged')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_ver_profiles_user ON public.verification_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_ver_profiles_business ON public.verification_profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_ver_profiles_status ON public.verification_profiles(overall_status);

-- 2. Admin-Configurable Role-Based Verification Requirements
CREATE TABLE IF NOT EXISTS public.verification_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_code TEXT NOT NULL,
  document_type TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  max_size_mb INTEGER NOT NULL DEFAULT 5 CHECK (max_size_mb >= 1 AND max_size_mb <= 15),
  allowed_extensions TEXT[] NOT NULL DEFAULT ARRAY['pdf','jpg','jpeg','png'],
  instructions TEXT,
  verification_method TEXT NOT NULL DEFAULT 'manual_admin_review',
  sort_order INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (role_code, document_type)
);

-- 3. Verification Submissions (Applications per Document Type)
CREATE TABLE IF NOT EXISTS public.verification_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.verification_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  role_code TEXT NOT NULL DEFAULT 'buyer',
  business_type TEXT,
  document_type TEXT NOT NULL,
  verification_method TEXT NOT NULL DEFAULT 'manual_admin_review'
    CHECK (verification_method IN (
      'manual_admin_review', 'document_validation', 'aadhaar_offline_xml',
      'aadhaar_secure_qr', 'pan_provider', 'gst_provider', 'udyam_check', 'mca_check'
    )),
  status TEXT NOT NULL DEFAULT 'not_submitted'
    CHECK (status IN (
      'not_started', 'not_submitted', 'uploading', 'uploaded', 'submitted',
      'pending_verification', 'under_review', 'verified', 'partially_verified',
      'rejected', 'resubmission_required', 'expired'
    )),
  masked_identifier TEXT,
  idempotency_key TEXT,
  risk_status TEXT NOT NULL DEFAULT 'low' CHECK (risk_status IN ('low', 'medium', 'high', 'flagged')),
  assigned_reviewer_id UUID REFERENCES public.users(id),
  rejection_reason TEXT,
  internal_notes TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ver_sub_user ON public.verification_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_ver_sub_business ON public.verification_submissions(business_id);
CREATE INDEX IF NOT EXISTS idx_ver_sub_status ON public.verification_submissions(status);
CREATE INDEX IF NOT EXISTS idx_ver_sub_doc_type ON public.verification_submissions(document_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ver_sub_idempotency
  ON public.verification_submissions(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- 4. Private KYC Document Metadata (References private InsForge Storage only)
CREATE TABLE IF NOT EXISTS public.kyc_verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES public.verification_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'kyc-private',
  storage_key TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
  sha256_hash TEXT NOT NULL,
  magic_bytes_verified BOOLEAN NOT NULL DEFAULT TRUE,
  upload_status TEXT NOT NULL DEFAULT 'uploaded'
    CHECK (upload_status IN ('uploading', 'uploaded', 'submitted', 'deleted', 'failed')),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_kyc_docs_user ON public.kyc_verification_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_docs_submission ON public.kyc_verification_documents(submission_id);

-- 5. Verification Results (Provider-Independent Verification Evidence)
CREATE TABLE IF NOT EXISTS public.verification_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.verification_submissions(id) ON DELETE CASCADE,
  verification_method TEXT NOT NULL,
  verification_source TEXT NOT NULL,
  result_status TEXT NOT NULL CHECK (result_status IN ('verified', 'rejected', 'mismatch', 'pending_manual', 'inconclusive')),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewer_or_provider TEXT NOT NULL,
  reference_id TEXT,
  mismatch_details JSONB DEFAULT '{}'::jsonb,
  evidence_reference TEXT
);

CREATE INDEX IF NOT EXISTS idx_ver_results_sub ON public.verification_results(submission_id);

-- 6. Verification Consents (Explicit Purpose-Bound Consent Records)
CREATE TABLE IF NOT EXISTS public.verification_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES public.verification_submissions(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL,
  consent_text_version TEXT NOT NULL,
  privacy_policy_version TEXT NOT NULL,
  terms_version TEXT NOT NULL,
  verification_method TEXT NOT NULL,
  provider_identity TEXT,
  alternative_route_disclosed BOOLEAN NOT NULL DEFAULT FALSE,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  withdrawn_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ver_consents_user ON public.verification_consents(user_id);

-- 7. Verification History (Immutable Status Transitions)
CREATE TABLE IF NOT EXISTS public.verification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.verification_submissions(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.users(id),
  actor_role TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  public_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ver_history_sub ON public.verification_history(submission_id);

-- 8. Verification Provider Logs (Zero Raw PII / Aadhaar / OTP)
CREATE TABLE IF NOT EXISTS public.verification_provider_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES public.verification_submissions(id) ON DELETE SET NULL,
  provider_name TEXT NOT NULL,
  verification_method TEXT NOT NULL,
  request_reference TEXT,
  response_status TEXT NOT NULL,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. OTP Challenges (Hashed OTPs only — NEVER plaintext)
CREATE TABLE IF NOT EXISTS public.otp_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('mobile', 'email')),
  destination_hash TEXT NOT NULL,
  masked_destination TEXT NOT NULL,
  otp_salt TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_dest_hash ON public.otp_challenges(destination_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_user ON public.otp_challenges(user_id, channel);

-- 10. Upload Sessions (Upload Throttling & Tracking)
CREATE TABLE IF NOT EXISTS public.upload_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  expected_size_bytes BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'completed', 'cancelled', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 11. Verification Audit Logs (Admin & Compliance Trail)
CREATE TABLE IF NOT EXISTS public.verification_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.users(id),
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ver_audit_created ON public.verification_audit_logs(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES — Strict User & Business Isolation
-- ============================================================================

ALTER TABLE public.verification_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_provider_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_audit_logs ENABLE ROW LEVEL SECURITY;

-- Public read only for non-sensitive verification_requirements definitions
DROP POLICY IF EXISTS "verification_requirements_read_active" ON public.verification_requirements;
CREATE POLICY "verification_requirements_read_active"
  ON public.verification_requirements FOR SELECT
  USING (is_active = TRUE);

-- Users can read their own verification profiles
DROP POLICY IF EXISTS "verification_profiles_owner_select" ON public.verification_profiles;
CREATE POLICY "verification_profiles_owner_select"
  ON public.verification_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can read their own submissions (internal_notes stripped at API layer)
DROP POLICY IF EXISTS "verification_submissions_owner_select" ON public.verification_submissions;
CREATE POLICY "verification_submissions_owner_select"
  ON public.verification_submissions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can read their own KYC document metadata only
DROP POLICY IF EXISTS "kyc_docs_owner_select" ON public.kyc_verification_documents;
CREATE POLICY "kyc_docs_owner_select"
  ON public.kyc_verification_documents FOR SELECT
  USING (auth.uid() = user_id);

-- Users can read their own consent records only
DROP POLICY IF EXISTS "verification_consents_owner_select" ON public.verification_consents;
CREATE POLICY "verification_consents_owner_select"
  ON public.verification_consents FOR SELECT
  USING (auth.uid() = user_id);

-- Users can read history for their own submissions
DROP POLICY IF EXISTS "verification_history_owner_select" ON public.verification_history;
CREATE POLICY "verification_history_owner_select"
  ON public.verification_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.verification_submissions s
      WHERE s.id = verification_history.submission_id
        AND s.user_id = auth.uid()
    )
  );

-- Strictly deny unauthenticated/direct client reads on OTP challenges, provider logs & admin audit logs
-- (Accessed exclusively via authenticated backend APIs with rate limiting and RBAC)
