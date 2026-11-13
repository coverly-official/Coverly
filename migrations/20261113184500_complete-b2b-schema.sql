-- ====================================================================
-- COVERLY B2B Wholesale Platform — Complete Relational Schema
-- Migration: 20261113184500_complete_b2b_schema.sql
-- ====================================================================

-- 1. Users Profile (Extends InsForge Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. User Roles (Supports 9 roles and dual-role switching)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN (
    'buyer', 'manufacturer', 'wholesaler', 'distributor',
    'buyer_supplier', 'admin', 'verification_admin', 'support_admin'
  )),
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_role UNIQUE (user_id, role)
);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- 3. Businesses (Buyer, Manufacturer, Wholesaler, Distributor)
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  slug TEXT NOT NULL UNIQUE,
  business_type TEXT NOT NULL CHECK (business_type IN ('manufacturer', 'wholesaler', 'distributor', 'buyer')),
  gstin TEXT,
  pan TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  verification_level TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_level IN (
    'unverified', 'phone_verified', 'email_verified', 'document_verified', 'registration_checked'
  )),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_type ON public.businesses(business_type);
CREATE INDEX IF NOT EXISTS idx_businesses_city ON public.businesses(city);

-- 4. Business Members
CREATE TABLE IF NOT EXISTS public.business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_in_business TEXT NOT NULL DEFAULT 'owner' CHECK (role_in_business IN ('owner', 'admin', 'sales', 'procurement', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_business_member UNIQUE (business_id, user_id)
);

-- 5. Buyer Profiles
CREATE TABLE IF NOT EXISTS public.buyer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  annual_sourcing_budget NUMERIC(14, 2),
  primary_categories TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Supplier Profiles
CREATE TABLE IF NOT EXISTS public.supplier_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  factory_size_sqft INTEGER,
  production_capacity_monthly TEXT,
  export_ready BOOLEAN NOT NULL DEFAULT FALSE,
  certifications TEXT[] DEFAULT '{}',
  lead_time_days INTEGER DEFAULT 7,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Supplier Verifications
CREATE TABLE IF NOT EXISTS public.supplier_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  verification_tier TEXT NOT NULL CHECK (verification_tier IN (
    'phone_verified', 'email_verified', 'document_verified', 'registration_checked'
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'more_info_requested')),
  reviewer_id UUID REFERENCES public.users(id),
  review_notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON public.supplier_verifications(status);

-- 8. Verification Documents
CREATE TABLE IF NOT EXISTS public.verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES public.supplier_verifications(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN (
    'gstin_cert', 'pan_card', 'factory_license', 'msme_udyam', 'iec', 'iso_cert', 'other'
  )),
  file_url TEXT NOT NULL,
  file_key TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Categories & Subcategories
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sync existing product_categories with categories
INSERT INTO public.categories (id, name, slug, description)
SELECT id, label, id, 'Sourcing category'
FROM public.product_categories
ON CONFLICT (id) DO NOTHING;

-- 10. Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES public.product_categories(id),
  subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  moq INTEGER NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'pc',
  indicative_price NUMERIC(12, 2) NOT NULL,
  tiered_pricing JSONB DEFAULT '[]'::jsonb,
  specifications JSONB DEFAULT '{}'::jsonb,
  hs_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_business_id ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- 11. Product Images
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_key TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);

-- 12. RFQs (Request For Quotations)
CREATE TABLE IF NOT EXISTS public.rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_number TEXT NOT NULL UNIQUE,
  buyer_id UUID NOT NULL REFERENCES public.users(id),
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES public.product_categories(id),
  delivery_city TEXT NOT NULL,
  delivery_pincode TEXT NOT NULL,
  target_delivery_date DATE,
  dispatch_mode TEXT NOT NULL DEFAULT 'broadcast' CHECK (dispatch_mode IN ('direct', 'broadcast', 'managed')),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'draft', 'submitted', 'in_review', 'matched', 'quotes_received', 'accepted', 'closed', 'cancelled'
  )),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rfqs_buyer_id ON public.rfqs(buyer_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON public.rfqs(status);
CREATE INDEX IF NOT EXISTS idx_rfqs_category_id ON public.rfqs(category_id);

-- 13. RFQ Items
CREATE TABLE IF NOT EXISTS public.rfq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'pc',
  target_unit_price NUMERIC(12, 2),
  specifications JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_rfq_items_rfq_id ON public.rfq_items(rfq_id);

-- 14. RFQ Recipients (Direct or Broadcast Dispatched Suppliers)
CREATE TABLE IF NOT EXISTS public.rfq_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  supplier_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'quoted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_rfq_recipient UNIQUE (rfq_id, supplier_business_id)
);
CREATE INDEX IF NOT EXISTS idx_rfq_recipients_supplier ON public.rfq_recipients(supplier_business_id);

-- 15. Quotations
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  supplier_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  supplier_user_id UUID NOT NULL REFERENCES public.users(id),
  quotation_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'under_review', 'accepted', 'rejected', 'expired')),
  valid_until DATE NOT NULL,
  lead_time_days INTEGER NOT NULL DEFAULT 7,
  terms_and_conditions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quotations_rfq_id ON public.quotations(rfq_id);
CREATE INDEX IF NOT EXISTS idx_quotations_supplier_business_id ON public.quotations(supplier_business_id);

-- 16. Quotation Items
CREATE TABLE IF NOT EXISTS public.quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  rfq_item_id UUID REFERENCES public.rfq_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL DEFAULT 'pc',
  unit_price NUMERIC(12, 2) NOT NULL,
  total_price NUMERIC(12, 2) NOT NULL
);

-- 17. Quotation Landed Cost Breakdown
CREATE TABLE IF NOT EXISTS public.quotation_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL UNIQUE REFERENCES public.quotations(id) ON DELETE CASCADE,
  subtotal NUMERIC(12, 2) NOT NULL,
  freight NUMERIC(12, 2) NOT NULL DEFAULT 0,
  packaging NUMERIC(12, 2) NOT NULL DEFAULT 0,
  insurance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  gst_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.18,
  gst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_landed_cost NUMERIC(12, 2) NOT NULL,
  effective_landed_unit_cost NUMERIC(12, 2) NOT NULL
);

-- 18. Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  quotation_id UUID NOT NULL REFERENCES public.quotations(id),
  buyer_id UUID NOT NULL REFERENCES public.users(id),
  buyer_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  supplier_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending_deposit' CHECK (status IN (
    'pending_deposit', 'deposit_paid', 'in_production', 'quality_check', 'shipped', 'delivered', 'completed', 'disputed', 'cancelled'
  )),
  total_amount NUMERIC(14, 2) NOT NULL,
  tracking_number TEXT,
  carrier TEXT,
  dispatch_date DATE,
  delivery_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_supplier_business_id ON public.orders(supplier_business_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- 19. Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL DEFAULT 'pc',
  unit_price NUMERIC(12, 2) NOT NULL,
  total_price NUMERIC(12, 2) NOT NULL
);

-- 20. Order Status Audit History
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES public.users(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. Saved Suppliers
CREATE TABLE IF NOT EXISTS public.saved_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  supplier_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_saved_supplier UNIQUE (user_id, supplier_business_id)
);

-- 22. In-App Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);

-- 23. Support Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('order', 'payment', 'verification', 'listing', 'account', 'other')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);

-- 24. Ticket Messages
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 25. Reports & Complaints
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('product', 'business', 'rfq', 'user')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 26. Admin Immutable Audit Logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

-- Enable Row Level Security across all new tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Basic Public / Member RLS Policies
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read subcategories" ON public.subcategories FOR SELECT USING (true);
CREATE POLICY "Public read active businesses" ON public.businesses FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Public read product images" ON public.product_images FOR SELECT USING (true);
