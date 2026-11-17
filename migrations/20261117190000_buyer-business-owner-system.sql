-- ====================================================================
-- COVERLY B2B Wholesale Platform — Buyer & Business Owner System
-- Migration: 20261117190000_buyer_business_owner_system.sql
-- ====================================================================

-- 1. Extend business_members role constraint and add team management columns
DO $$
BEGIN
  ALTER TABLE public.business_members DROP CONSTRAINT IF EXISTS business_members_role_in_business_check;
  ALTER TABLE public.business_members ADD CONSTRAINT business_members_role_in_business_check CHECK (
    role_in_business IN (
      'owner', 'business_manager', 'procurement_manager', 'purchase_executive', 
      'accounts_executive', 'staff', 'admin', 'sales', 'procurement', 'viewer'
    )
  );
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.business_members ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{"view"}';
ALTER TABLE public.business_members ADD COLUMN IF NOT EXISTS spending_limit NUMERIC(14, 2);
ALTER TABLE public.business_members ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.business_members ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.business_members ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES public.users(id);

-- 2. Enhance buyer_profiles with account type & company details
ALTER TABLE public.buyer_profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id);
ALTER TABLE public.buyer_profiles ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'business' CHECK (account_type IN ('individual', 'business'));
ALTER TABLE public.buyer_profiles ADD COLUMN IF NOT EXISTS industry_type TEXT;
ALTER TABLE public.buyer_profiles ADD COLUMN IF NOT EXISTS purchasing_categories TEXT[] DEFAULT '{}';
ALTER TABLE public.buyer_profiles ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));
ALTER TABLE public.buyer_profiles ADD COLUMN IF NOT EXISTS verification_notes TEXT;
ALTER TABLE public.buyer_profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.buyer_profiles ADD COLUMN IF NOT EXISTS company_logo_url TEXT;

-- 3. Business Branches & Warehouses
CREATE TABLE IF NOT EXISTS public.business_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  branch_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  gstin TEXT,
  is_headquarters BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_business_branches_business_id ON public.business_branches(business_id);

-- 4. Business Company Documents
CREATE TABLE IF NOT EXISTS public.business_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  doc_type TEXT NOT NULL CHECK (doc_type IN (
    'gstin_cert', 'pan_card', 'incorporation_cert', 'msme_udyam', 'cancelled_cheque', 'fssai_license', 'iec_cert', 'other'
  )),
  doc_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_key TEXT NOT NULL,
  file_size_bytes BIGINT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_notes TEXT,
  verified_by UUID REFERENCES public.users(id),
  verified_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_business_docs_business_id ON public.business_documents(business_id);

-- 5. Business Employee Invitations
CREATE TABLE IF NOT EXISTS public.business_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  invited_by_user_id UUID NOT NULL REFERENCES public.users(id),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role_in_business TEXT NOT NULL CHECK (
    role_in_business IN (
      'business_manager', 'procurement_manager', 'purchase_executive', 
      'accounts_executive', 'staff', 'admin', 'viewer'
    )
  ),
  permissions TEXT[] NOT NULL DEFAULT '{"view"}',
  department TEXT,
  spending_limit NUMERIC(14, 2),
  invitation_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_pending_invitation UNIQUE (business_id, email, status)
);
CREATE INDEX IF NOT EXISTS idx_business_invitations_email ON public.business_invitations(email);
CREATE INDEX IF NOT EXISTS idx_business_invitations_token ON public.business_invitations(invitation_token);

-- 6. Buyer Sourcing Lists & Custom Shortlists
CREATE TABLE IF NOT EXISTS public.buyer_sourcing_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_private BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sourcing_lists_business_id ON public.buyer_sourcing_lists(business_id);
CREATE INDEX IF NOT EXISTS idx_sourcing_lists_user_id ON public.buyer_sourcing_lists(user_id);

CREATE TABLE IF NOT EXISTS public.buyer_sourcing_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.buyer_sourcing_lists(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('supplier', 'product')),
  supplier_business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sourcing_list_items_list_id ON public.buyer_sourcing_list_items(list_id);

-- 7. Buyer Saved Products
CREATE TABLE IF NOT EXISTS public.buyer_saved_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_saved_product UNIQUE (user_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_buyer_saved_products_user ON public.buyer_saved_products(user_id);

-- 8. Business Approval Policies (Configurable Purchasing Thresholds)
CREATE TABLE IF NOT EXISTS public.business_approval_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  policy_name TEXT NOT NULL,
  min_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  max_amount NUMERIC(14, 2),
  required_role TEXT NOT NULL CHECK (
    required_role IN ('owner', 'business_manager', 'procurement_manager')
  ),
  requires_owner_approval BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_approval_policies_business_id ON public.business_approval_policies(business_id);

-- 9. Purchase Requests (Internal Purchasing Requisitions)
CREATE TABLE IF NOT EXISTS public.purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_number TEXT NOT NULL UNIQUE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.users(id),
  title TEXT NOT NULL,
  department TEXT,
  category_id TEXT,
  estimated_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN (
    'draft', 'pending_approval', 'approved', 'rejected', 'converted_to_rfq', 'converted_to_po', 'cancelled'
  )),
  justification TEXT,
  target_delivery_date DATE,
  rfq_id UUID REFERENCES public.rfqs(id) ON DELETE SET NULL,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_business_id ON public.purchase_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_requester ON public.purchase_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON public.purchase_requests(status);

CREATE TABLE IF NOT EXISTS public.purchase_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_request_id UUID NOT NULL REFERENCES public.purchase_requests(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'pc',
  estimated_unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  specifications JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_purchase_request_items_pr_id ON public.purchase_request_items(purchase_request_id);

CREATE TABLE IF NOT EXISTS public.purchase_request_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_request_id UUID NOT NULL REFERENCES public.purchase_requests(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES public.users(id),
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'reassigned')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pr_approvals_pr_id ON public.purchase_request_approvals(purchase_request_id);

-- 10. Purchase Orders (Official B2B POs)
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT NOT NULL UNIQUE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  buyer_user_id UUID NOT NULL REFERENCES public.users(id),
  supplier_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE RESTRICT,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
  purchase_request_id UUID REFERENCES public.purchase_requests(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  po_status TEXT NOT NULL DEFAULT 'issued' CHECK (po_status IN (
    'draft', 'issued', 'accepted_by_supplier', 'amendment_requested', 'cancelled', 'fulfilled'
  )),
  currency TEXT NOT NULL DEFAULT 'INR',
  subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
  freight NUMERIC(12, 2) NOT NULL DEFAULT 0,
  packaging NUMERIC(12, 2) NOT NULL DEFAULT 0,
  gst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  delivery_address TEXT NOT NULL,
  delivery_city TEXT NOT NULL,
  delivery_state TEXT NOT NULL,
  delivery_pincode TEXT NOT NULL,
  expected_delivery_date DATE,
  payment_terms TEXT,
  terms_and_conditions TEXT,
  authorized_by UUID REFERENCES public.users(id),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_business_id ON public.purchase_orders(business_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_business_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_status ON public.purchase_orders(po_status);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'pc',
  unit_price NUMERIC(12, 2) NOT NULL,
  total_price NUMERIC(12, 2) NOT NULL,
  specifications JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_po_items_po_id ON public.purchase_order_items(purchase_order_id);

-- 11. Quotation Negotiations & Clarification Messages
CREATE TABLE IF NOT EXISTS public.quotation_negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id),
  message TEXT NOT NULL,
  proposed_price NUMERIC(12, 2),
  proposed_delivery_days INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quote_negotiations_quote_id ON public.quotation_negotiations(quotation_id);

-- 12. Buyer Document Repository
CREATE TABLE IF NOT EXISTS public.buyer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  doc_type TEXT NOT NULL CHECK (doc_type IN (
    'purchase_order', 'quotation', 'invoice', 'delivery_note', 'specification', 'compliance', 'other'
  )),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_key TEXT NOT NULL,
  file_size_bytes BIGINT,
  reference_id TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_buyer_documents_business ON public.buyer_documents(business_id);

-- 13. Add guest enquiry columns to rfqs if not present
ALTER TABLE public.rfqs ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE public.rfqs ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE public.rfqs ADD COLUMN IF NOT EXISTS guest_phone TEXT;
ALTER TABLE public.rfqs ADD COLUMN IF NOT EXISTS guest_company TEXT;
ALTER TABLE public.rfqs ADD COLUMN IF NOT EXISTS is_guest_submission BOOLEAN DEFAULT FALSE;

-- 14. Enable RLS
ALTER TABLE public.business_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_sourcing_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_sourcing_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_saved_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_approval_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_request_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_documents ENABLE ROW LEVEL SECURITY;

-- 15. RLS Policies
CREATE POLICY "Public read buyer business branches" ON public.business_branches FOR SELECT USING (is_active = true);
CREATE POLICY "Public read approval policies for business" ON public.business_approval_policies FOR SELECT USING (is_active = true);
