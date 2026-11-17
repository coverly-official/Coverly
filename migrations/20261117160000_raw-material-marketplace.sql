-- ====================================================================
-- COVERLY B2B Wholesale Platform — Raw Material Supplier Marketplace
-- Migration: 20261117160000_raw_material_marketplace.sql
-- ====================================================================

-- 1. Extend user_roles check constraint to include raw_material_supplier
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check 
  CHECK (role IN (
    'buyer', 'manufacturer', 'wholesaler', 'distributor',
    'buyer_supplier', 'service_provider', 'sales_agent', 'sales_manager',
    'raw_material_supplier', 'admin', 'verification_admin', 'support_admin', 'finance_admin'
  ));

-- 2. Raw Material Categories & Subcategories
CREATE TABLE IF NOT EXISTS public.raw_material_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.raw_material_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id TEXT NOT NULL REFERENCES public.raw_material_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed 9 Core Raw Material Categories
INSERT INTO public.raw_material_categories (id, name, slug, description, icon, display_order)
VALUES
  ('rm-cat-agri', 'Agricultural Raw Materials', 'agricultural-raw-materials', 'Grains, oilseeds, cotton, pulses, sugarcane, spices, and agro commodities', 'Wheat', 1),
  ('rm-cat-food', 'Food Processing Raw Materials', 'food-processing-raw-materials', 'Flour, starch, edible oils, food ingredients, sugar, salt, and dehydrated inputs', 'Utensils', 2),
  ('rm-cat-industrial', 'Industrial Raw Materials', 'industrial-raw-materials', 'Iron, steel, aluminium, copper, alloys, industrial minerals, rubber, and chemicals', 'Factory', 3),
  ('rm-cat-polymers', 'Plastic and Polymer Materials', 'plastic-and-polymer-materials', 'Virgin granules, PET resin, PVC, HDPE, LDPE, PP, and engineering polymers', 'Layers', 4),
  ('rm-cat-textiles', 'Textile Raw Materials', 'textile-raw-materials', 'Cotton yarn, synthetic filament yarn, raw fibres, fabrics, and processing dyes', 'Scissors', 5),
  ('rm-cat-construction', 'Construction Raw Materials', 'construction-raw-materials', 'Cement, aggregates, sand, TMT steel rebars, bricks, tiles, and structural inputs', 'HardHat', 6),
  ('rm-cat-packaging', 'Paper and Packaging Raw Materials', 'paper-and-packaging-raw-materials', 'Kraft paper rolls, corrugated fluting sheets, cardboard, and barrier films', 'Package', 7),
  ('rm-cat-wood', 'Wood and Furniture Materials', 'wood-and-furniture-materials', 'Hardwood timber, commercial plywood, MDF boards, veneer, and lumber', 'TreePine', 8),
  ('rm-cat-electronics', 'Electronics and Electrical Materials', 'electronics-and-electrical-materials', 'Copper winding wire, multi-core cables, semiconductors, and passive components', 'Cpu', 9)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- 3. Raw Material Supplier Profiles
CREATE TABLE IF NOT EXISTS public.raw_material_supplier_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  supplier_type TEXT NOT NULL CHECK (supplier_type IN (
    'manufacturer', 'raw_material_trader', 'wholesaler', 'distributor',
    'importer', 'exporter', 'agricultural_commodity_supplier'
  )),
  headline TEXT,
  description TEXT,
  operating_states TEXT[] DEFAULT '{}',
  operating_cities TEXT[] DEFAULT '{}',
  material_categories TEXT[] DEFAULT '{}',
  warehouses JSONB DEFAULT '[]'::jsonb,
  supply_capacity_monthly TEXT,
  certifications TEXT[] DEFAULT '{}',
  moq_policy TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN (
    'pending', 'verified', 'rejected', 'suspended'
  )),
  verification_notes TEXT,
  verified_at TIMESTAMPTZ,
  rating NUMERIC(3, 2) DEFAULT 4.80,
  total_deals_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_rm_supplier_business UNIQUE (business_id)
);
CREATE INDEX IF NOT EXISTS idx_rm_suppliers_biz ON public.raw_material_supplier_profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_rm_suppliers_status ON public.raw_material_supplier_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_rm_suppliers_type ON public.raw_material_supplier_profiles(supplier_type);

-- 4. Raw Material Product Listings
CREATE TABLE IF NOT EXISTS public.raw_material_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.raw_material_supplier_profiles(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES public.raw_material_categories(id),
  subcategory TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  material_grade TEXT,
  origin TEXT,
  quality_standards TEXT[] DEFAULT '{}',
  specifications JSONB DEFAULT '{}'::jsonb,
  unit_of_measurement TEXT NOT NULL DEFAULT 'kg',
  moq NUMERIC(12, 2) NOT NULL DEFAULT 1,
  max_order_quantity NUMERIC(12, 2),
  base_price NUMERIC(14, 2) NOT NULL,
  bulk_pricing_tiers JSONB DEFAULT '[]'::jsonb,
  maintains_inventory BOOLEAN NOT NULL DEFAULT FALSE,
  stock_quantity NUMERIC(12, 2) DEFAULT 0,
  available_quantity NUMERIC(12, 2) DEFAULT 0,
  reserved_quantity NUMERIC(12, 2) DEFAULT 0,
  lead_time_days INTEGER DEFAULT 5,
  packaging_details TEXT,
  supply_locations TEXT[] DEFAULT '{}',
  delivery_available BOOLEAN DEFAULT TRUE,
  images TEXT[] DEFAULT '{}',
  documents JSONB DEFAULT '[]'::jsonb,
  moderation_status TEXT NOT NULL DEFAULT 'approved' CHECK (moderation_status IN ('draft', 'pending', 'approved', 'rejected', 'archived')),
  moderation_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rm_products_supplier ON public.raw_material_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_rm_products_category ON public.raw_material_products(category_id);
CREATE INDEX IF NOT EXISTS idx_rm_products_status ON public.raw_material_products(moderation_status, is_active);
CREATE INDEX IF NOT EXISTS idx_rm_products_slug ON public.raw_material_products(slug);

-- 5. Raw Material RFQs
CREATE TABLE IF NOT EXISTS public.raw_material_rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_number TEXT NOT NULL UNIQUE,
  buyer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  guest_company TEXT,
  material_name TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES public.raw_material_categories(id),
  required_quantity NUMERIC(12, 2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  material_grade TEXT,
  required_specifications JSONB DEFAULT '{}'::jsonb,
  packaging_requirements TEXT,
  delivery_city TEXT NOT NULL,
  delivery_state TEXT NOT NULL,
  delivery_pincode TEXT,
  target_delivery_date DATE,
  budget NUMERIC(14, 2),
  target_supplier_id UUID REFERENCES public.raw_material_supplier_profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'under_review', 'dispatched_to_suppliers', 'quotes_received', 'accepted', 'closed', 'cancelled'
  )),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rm_rfqs_buyer ON public.raw_material_rfqs(buyer_id);
CREATE INDEX IF NOT EXISTS idx_rm_rfqs_category ON public.raw_material_rfqs(category_id);
CREATE INDEX IF NOT EXISTS idx_rm_rfqs_status ON public.raw_material_rfqs(status);
CREATE INDEX IF NOT EXISTS idx_rm_rfqs_email ON public.raw_material_rfqs(guest_email);

-- 6. RFQ Recipients (Eligible Dispatched Suppliers)
CREATE TABLE IF NOT EXISTS public.raw_material_rfq_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES public.raw_material_rfqs(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.raw_material_supplier_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'quoted', 'declined')),
  declined_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_rm_rfq_recipient UNIQUE (rfq_id, supplier_id)
);
CREATE INDEX IF NOT EXISTS idx_rm_recipients_supplier ON public.raw_material_rfq_recipients(supplier_id);
CREATE INDEX IF NOT EXISTS idx_rm_recipients_rfq ON public.raw_material_rfq_recipients(rfq_id);

-- 7. Raw Material Quotations
CREATE TABLE IF NOT EXISTS public.raw_material_quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number TEXT NOT NULL UNIQUE,
  rfq_id UUID NOT NULL REFERENCES public.raw_material_rfqs(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.raw_material_supplier_profiles(id) ON DELETE CASCADE,
  supplier_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.raw_material_products(id) ON DELETE SET NULL,
  quantity NUMERIC(12, 2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  unit_price NUMERIC(14, 2) NOT NULL,
  bulk_discount_amount NUMERIC(14, 2) DEFAULT 0,
  packaging_charges NUMERIC(14, 2) DEFAULT 0,
  loading_charges NUMERIC(14, 2) DEFAULT 0,
  freight_charges NUMERIC(14, 2) DEFAULT 0,
  insurance_charges NUMERIC(14, 2) DEFAULT 0,
  gst_rate NUMERIC(5, 4) DEFAULT 0.18,
  gst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_estimated_cost NUMERIC(14, 2) NOT NULL,
  effective_unit_cost NUMERIC(14, 2) NOT NULL,
  lead_time_days INTEGER NOT NULL DEFAULT 5,
  valid_until DATE NOT NULL,
  terms_and_conditions TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'under_review', 'accepted', 'rejected', 'expired', 'withdrawn'
  )),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rm_quotations_rfq ON public.raw_material_quotations(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rm_quotations_supplier ON public.raw_material_quotations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_rm_quotations_status ON public.raw_material_quotations(status);

-- 8. Raw Material Orders
CREATE TABLE IF NOT EXISTS public.raw_material_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  quotation_id UUID NOT NULL REFERENCES public.raw_material_quotations(id) ON DELETE RESTRICT,
  rfq_id UUID NOT NULL REFERENCES public.raw_material_rfqs(id) ON DELETE RESTRICT,
  buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  supplier_id UUID NOT NULL REFERENCES public.raw_material_supplier_profiles(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'order_created' CHECK (status IN (
    'order_created', 'supplier_confirmation_pending', 'confirmed', 'processing',
    'preparing_for_dispatch', 'ready_for_dispatch', 'dispatched', 'in_transit',
    'delivered', 'completed', 'cancelled', 'disputed'
  )),
  total_amount NUMERIC(14, 2) NOT NULL,
  delivery_city TEXT NOT NULL,
  delivery_address TEXT,
  dispatch_date DATE,
  estimated_delivery_date DATE,
  carrier_name TEXT,
  tracking_number TEXT,
  invoice_url TEXT,
  dispatch_document_url TEXT,
  buyer_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rm_orders_buyer ON public.raw_material_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_rm_orders_supplier ON public.raw_material_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_rm_orders_status ON public.raw_material_orders(status);

-- 9. Raw Material Order Audit History
CREATE TABLE IF NOT EXISTS public.raw_material_order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.raw_material_orders(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES public.users(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rm_order_hist_order ON public.raw_material_order_history(order_id);

-- 10. Raw Material Complaints & Disputes
CREATE TABLE IF NOT EXISTS public.raw_material_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.raw_material_orders(id) ON DELETE CASCADE,
  complainant_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  against_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_arbitration', 'resolved', 'closed')),
  admin_resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rm_complaints_order ON public.raw_material_complaints(order_id);

-- 11. Enable Row Level Security (RLS)
ALTER TABLE public.raw_material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_material_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_material_supplier_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_material_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_material_rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_material_rfq_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_material_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_material_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_material_order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_material_complaints ENABLE ROW LEVEL SECURITY;

-- 12. Public & Member RLS Policies
CREATE POLICY "Public read active rm categories" ON public.raw_material_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read rm subcategories" ON public.raw_material_subcategories
  FOR SELECT USING (true);

CREATE POLICY "Public read verified rm suppliers" ON public.raw_material_supplier_profiles
  FOR SELECT USING (verification_status = 'verified');

CREATE POLICY "Public read approved rm products" ON public.raw_material_products
  FOR SELECT USING (moderation_status = 'approved' AND is_active = true);

CREATE POLICY "Buyer read own rm rfqs" ON public.raw_material_rfqs
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Buyer create rm rfqs" ON public.raw_material_rfqs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Buyer read quotations on their rfqs" ON public.raw_material_quotations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.raw_material_rfqs
      WHERE raw_material_rfqs.id = raw_material_quotations.rfq_id
      AND raw_material_rfqs.buyer_id = auth.uid()
    )
  );

CREATE POLICY "Supplier manage own rm products" ON public.raw_material_products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.raw_material_supplier_profiles
      WHERE raw_material_supplier_profiles.id = raw_material_products.supplier_id
      AND raw_material_supplier_profiles.user_id = auth.uid()
    )
  );
