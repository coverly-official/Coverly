-- ====================================================================
-- COVERLY B2B Wholesale Platform — Packaging Supplier Marketplace
-- Migration: 20261117170000_packaging_supplier_marketplace.sql
-- ====================================================================

-- 1. Extend user_roles check constraint to include packaging_supplier
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check 
  CHECK (role IN (
    'buyer', 'manufacturer', 'wholesaler', 'distributor',
    'buyer_supplier', 'service_provider', 'sales_agent', 'sales_manager',
    'raw_material_supplier', 'packaging_supplier', 'admin', 'verification_admin', 'support_admin', 'finance_admin'
  ));

-- 2. Packaging Categories & Subcategories
CREATE TABLE IF NOT EXISTS public.packaging_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.packaging_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id TEXT NOT NULL REFERENCES public.packaging_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed 9 Core Packaging Categories
INSERT INTO public.packaging_categories (id, name, slug, description, icon, display_order)
VALUES
  ('pkg-cat-flexible', 'Flexible Packaging', 'flexible-packaging', 'Stand-up pouches, zipper pouches, flat pouches, vacuum pouches, rolls and barrier films', 'Layers', 1),
  ('pkg-cat-rigid', 'Rigid Packaging', 'rigid-packaging', 'Plastic containers, HDPE/PET bottles, jars, tubs, drums, buckets and industrial containers', 'Box', 2),
  ('pkg-cat-paper', 'Paper Packaging', 'paper-packaging', 'Kraft paper bags, pouches, paper boxes, paper cartons, paper tubes and rolls', 'FileText', 3),
  ('pkg-cat-corrugated', 'Corrugated Packaging', 'corrugated-packaging', 'Shipping cartons, 3-ply, 5-ply, 7-ply multi-layer boxes, heavy duty boxes and mailers', 'Package', 4),
  ('pkg-cat-food', 'Food Packaging', 'food-packaging', 'Snack packaging, dry fruit bags, spice pouches, rice and grain sacks, bakery and frozen food boxes', 'Utensils', 5),
  ('pkg-cat-industrial', 'Industrial Packaging', 'industrial-packaging', 'FIBC bulk bags, HDPE bags, PP woven bags, industrial sacks, pallet wraps and strapping', 'Factory', 6),
  ('pkg-cat-labels', 'Labels and Printing', 'labels-and-printing', 'Product labels, roll stickers, barcode labels, custom printed packaging and shrink sleeves', 'Tag', 7),
  ('pkg-cat-protective', 'Protective Packaging', 'protective-packaging', 'Bubble wraps, foam packaging, air cushions, edge protectors and custom protective inserts', 'ShieldCheck', 8),
  ('pkg-cat-accessories', 'Packaging Accessories', 'packaging-accessories', 'Caps, closures, induction seals, tapes, strapping bands, packaging handles and liners', 'Component', 9)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- Seed Subcategories for Each Domain
INSERT INTO public.packaging_subcategories (category_id, name, slug, display_order)
VALUES
  -- Flexible Packaging
  ('pkg-cat-flexible', 'Stand-up Pouches', 'stand-up-pouches', 1),
  ('pkg-cat-flexible', 'Zipper Pouches', 'zipper-pouches', 2),
  ('pkg-cat-flexible', 'Flat Pouches', 'flat-pouches', 3),
  ('pkg-cat-flexible', 'Vacuum Pouches', 'vacuum-pouches', 4),
  ('pkg-cat-flexible', 'Laminated Pouches', 'laminated-pouches', 5),
  ('pkg-cat-flexible', 'Packaging Rolls', 'packaging-rolls', 6),
  ('pkg-cat-flexible', 'Food Packaging Films', 'food-packaging-films', 7),
  ('pkg-cat-flexible', 'Shrink & Stretch Films', 'shrink-stretch-films', 8),

  -- Rigid Packaging
  ('pkg-cat-rigid', 'Plastic Containers', 'plastic-containers', 1),
  ('pkg-cat-rigid', 'PET & HDPE Bottles', 'bottles', 2),
  ('pkg-cat-rigid', 'Jars & Tubs', 'jars-tubs', 3),
  ('pkg-cat-rigid', 'Drums & Barrels', 'drums-barrels', 4),
  ('pkg-cat-rigid', 'Buckets & Pails', 'buckets-pails', 5),
  ('pkg-cat-rigid', 'Industrial Rigid Containers', 'industrial-rigid-containers', 6),

  -- Paper Packaging
  ('pkg-cat-paper', 'Kraft Paper Bags', 'kraft-paper-bags', 1),
  ('pkg-cat-paper', 'Paper Pouches', 'paper-pouches', 2),
  ('pkg-cat-paper', 'Paper Boxes & Cartons', 'paper-boxes-cartons', 3),
  ('pkg-cat-paper', 'Paper Tubes & Cores', 'paper-tubes-cores', 4),
  ('pkg-cat-paper', 'Paper Packaging Rolls', 'paper-packaging-rolls', 5),

  -- Corrugated Packaging
  ('pkg-cat-corrugated', '3-Ply Corrugated Boxes', '3-ply-corrugated-boxes', 1),
  ('pkg-cat-corrugated', '5-Ply Shipping Cartons', '5-ply-shipping-cartons', 2),
  ('pkg-cat-corrugated', '7-Ply Heavy-Duty Boxes', '7-ply-heavy-duty-boxes', 3),
  ('pkg-cat-corrugated', 'E-commerce Shipping Boxes', 'ecommerce-shipping-boxes', 4),
  ('pkg-cat-corrugated', 'Die-Cut Corrugated Trays', 'die-cut-corrugated-trays', 5),

  -- Food Packaging
  ('pkg-cat-food', 'Snack & Chips Packaging', 'snack-chips-packaging', 1),
  ('pkg-cat-food', 'Dry Fruit & Nut Bags', 'dry-fruit-nut-bags', 2),
  ('pkg-cat-food', 'Spice & Seasoning Pouches', 'spice-seasoning-pouches', 3),
  ('pkg-cat-food', 'Rice & Grain Sacks', 'rice-grain-sacks', 4),
  ('pkg-cat-food', 'Bakery & Confectionery Boxes', 'bakery-confectionery-boxes', 5),
  ('pkg-cat-food', 'Frozen Food Barrier Packaging', 'frozen-food-barrier-packaging', 6),
  ('pkg-cat-food', 'Beverage Bottles & Cartons', 'beverage-bottles-cartons', 7),

  -- Industrial Packaging
  ('pkg-cat-industrial', 'FIBC Bulk Bags (Jumbo Bags)', 'fibc-bulk-bags', 1),
  ('pkg-cat-industrial', 'HDPE & PP Woven Bags', 'hdpe-pp-woven-bags', 2),
  ('pkg-cat-industrial', 'Multiwall Paper Sacks', 'multiwall-paper-sacks', 3),
  ('pkg-cat-industrial', 'Pallet Packaging & Stretch Hoods', 'pallet-packaging-stretch-hoods', 4),
  ('pkg-cat-industrial', 'Heavy Industrial Sacks', 'heavy-industrial-sacks', 5),

  -- Labels and Printing
  ('pkg-cat-labels', 'Custom Roll Labels', 'custom-roll-labels', 1),
  ('pkg-cat-labels', 'Barcode & Thermal Labels', 'barcode-thermal-labels', 2),
  ('pkg-cat-labels', 'Waterproof Stickers', 'waterproof-stickers', 3),
  ('pkg-cat-labels', 'Shrink Sleeves', 'shrink-sleeves', 4),
  ('pkg-cat-labels', 'Printed Product Sleeves', 'printed-product-sleeves', 5),

  -- Protective Packaging
  ('pkg-cat-protective', 'Bubble Wrap Rolls', 'bubble-wrap-rolls', 1),
  ('pkg-cat-protective', 'EPE Foam Sheets & Inserts', 'epe-foam-sheets-inserts', 2),
  ('pkg-cat-protective', 'Air Cushion Pillows', 'air-cushion-pillows', 3),
  ('pkg-cat-protective', 'Cardboard Edge Protectors', 'edge-protectors', 4),
  ('pkg-cat-protective', 'Protective Dunnage', 'protective-dunnage', 5),

  -- Packaging Accessories
  ('pkg-cat-accessories', 'Plastic & Metal Caps', 'caps-closures', 1),
  ('pkg-cat-accessories', 'Induction Heat Seals', 'induction-heat-seals', 2),
  ('pkg-cat-accessories', 'BOPP Packaging Tapes', 'bopp-packaging-tapes', 3),
  ('pkg-cat-accessories', 'PP / PET Strapping Bands', 'strapping-bands', 4),
  ('pkg-cat-accessories', 'Handles & Liners', 'handles-liners', 5);

-- 3. Packaging Supplier Profiles
CREATE TABLE IF NOT EXISTS public.packaging_supplier_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  supplier_type TEXT NOT NULL CHECK (supplier_type IN (
    'packaging_manufacturer', 'packaging_material_supplier', 'packaging_trader',
    'packaging_wholesaler', 'printing_company', 'custom_packaging_manufacturer', 'packaging_distributor'
  )),
  headline TEXT,
  description TEXT,
  registered_address TEXT,
  factory_locations JSONB DEFAULT '[]'::jsonb,
  serviceable_locations TEXT[] DEFAULT '{}',
  packaging_categories TEXT[] DEFAULT '{}',
  manufacturing_capabilities TEXT[] DEFAULT '{}',
  printing_capabilities TEXT[] DEFAULT '{}',
  production_capacity TEXT,
  moq_policy TEXT,
  typical_lead_time_days INTEGER DEFAULT 7,
  certifications TEXT[] DEFAULT '{}',
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN (
    'pending', 'verified', 'rejected', 'suspended'
  )),
  verification_notes TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.users(id),
  rating NUMERIC(3, 2) DEFAULT 4.85,
  total_orders_completed INTEGER DEFAULT 0,
  is_public_discovery_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_pkg_supplier_business UNIQUE (business_id)
);
CREATE INDEX IF NOT EXISTS idx_pkg_suppliers_biz ON public.packaging_supplier_profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_pkg_suppliers_status ON public.packaging_supplier_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_pkg_suppliers_type ON public.packaging_supplier_profiles(supplier_type);

-- 4. Packaging Product Listings
CREATE TABLE IF NOT EXISTS public.packaging_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.packaging_supplier_profiles(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES public.packaging_categories(id),
  subcategory TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  material_type TEXT NOT NULL,
  dimensions JSONB DEFAULT '{}'::jsonb, -- { length, width, height, gusset, neck_size }
  thickness TEXT,
  weight_gsm TEXT,
  capacity TEXT,
  colour TEXT,
  shape TEXT,
  packaging_type TEXT,
  printing_options JSONB DEFAULT '[]'::jsonb,
  customization_options JSONB DEFAULT '[]'::jsonb,
  category_specifications JSONB DEFAULT '{}'::jsonb,
  unit_of_measurement TEXT NOT NULL DEFAULT 'piece',
  moq INTEGER NOT NULL DEFAULT 500,
  max_order_quantity INTEGER,
  base_price NUMERIC(14, 2) NOT NULL,
  bulk_pricing_tiers JSONB DEFAULT '[]'::jsonb,
  lead_time_days INTEGER NOT NULL DEFAULT 7,
  available_supply_locations TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  technical_documents JSONB DEFAULT '[]'::jsonb,
  maintains_inventory BOOLEAN NOT NULL DEFAULT FALSE,
  stock_quantity INTEGER DEFAULT 0,
  available_quantity INTEGER DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN (
    'pending', 'approved', 'rejected'
  )),
  moderation_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pkg_products_supplier ON public.packaging_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_pkg_products_cat ON public.packaging_products(category_id);
CREATE INDEX IF NOT EXISTS idx_pkg_products_status ON public.packaging_products(moderation_status);
CREATE INDEX IF NOT EXISTS idx_pkg_products_price ON public.packaging_products(base_price);
CREATE INDEX IF NOT EXISTS idx_pkg_products_moq ON public.packaging_products(moq);

-- 5. Packaging RFQs & Custom Packaging Requirements
CREATE TABLE IF NOT EXISTS public.packaging_rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_number TEXT NOT NULL UNIQUE,
  buyer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  guest_company TEXT,
  category_id TEXT REFERENCES public.packaging_categories(id),
  product_id UUID REFERENCES public.packaging_products(id) ON DELETE SET NULL,
  product_being_packed TEXT,
  packaging_type TEXT,
  material_preference TEXT,
  required_dimensions JSONB DEFAULT '{}'::jsonb,
  required_capacity TEXT,
  required_quantity INTEGER NOT NULL,
  unit TEXT NOT NULL DEFAULT 'piece',
  printing_required BOOLEAN DEFAULT TRUE,
  printing_details TEXT,
  branding_details TEXT,
  custom_finishing TEXT,
  food_contact_grade BOOLEAN DEFAULT FALSE,
  target_budget NUMERIC(14, 2),
  target_delivery_date DATE,
  delivery_city TEXT NOT NULL,
  delivery_state TEXT NOT NULL,
  delivery_pincode TEXT,
  additional_instructions TEXT,
  reference_files JSONB DEFAULT '[]'::jsonb,
  is_sample_requested BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'matched', 'quotes_received', 'partially_quoted', 'accepted', 'expired', 'cancelled'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pkg_rfqs_buyer ON public.packaging_rfqs(buyer_id);
CREATE INDEX IF NOT EXISTS idx_pkg_rfqs_category ON public.packaging_rfqs(category_id);
CREATE INDEX IF NOT EXISTS idx_pkg_rfqs_status ON public.packaging_rfqs(status);
CREATE INDEX IF NOT EXISTS idx_pkg_rfqs_email ON public.packaging_rfqs(guest_email);

-- 6. RFQ Recipients (Matched Suppliers)
CREATE TABLE IF NOT EXISTS public.packaging_rfq_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES public.packaging_rfqs(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.packaging_supplier_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'quoted', 'declined')),
  declined_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_pkg_rfq_recipient UNIQUE (rfq_id, supplier_id)
);
CREATE INDEX IF NOT EXISTS idx_pkg_recipients_supplier ON public.packaging_rfq_recipients(supplier_id);
CREATE INDEX IF NOT EXISTS idx_pkg_recipients_rfq ON public.packaging_rfq_recipients(rfq_id);

-- 7. Packaging Quotations
CREATE TABLE IF NOT EXISTS public.packaging_quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number TEXT NOT NULL UNIQUE,
  rfq_id UUID NOT NULL REFERENCES public.packaging_rfqs(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.packaging_supplier_profiles(id) ON DELETE CASCADE,
  supplier_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  quotation_type TEXT NOT NULL DEFAULT 'custom_packaging' CHECK (quotation_type IN (
    'ready_made_packaging', 'custom_packaging', 'printing_only', 'design_and_packaging'
  )),
  product_id UUID REFERENCES public.packaging_products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL DEFAULT 'piece',
  unit_price NUMERIC(14, 2) NOT NULL,
  subtotal NUMERIC(14, 2) NOT NULL,
  bulk_discount_amount NUMERIC(14, 2) DEFAULT 0,
  printing_charges NUMERIC(14, 2) DEFAULT 0,
  plate_cylinder_charges NUMERIC(14, 2) DEFAULT 0,
  design_charges NUMERIC(14, 2) DEFAULT 0,
  packaging_charges NUMERIC(14, 2) DEFAULT 0,
  freight_charges NUMERIC(14, 2) DEFAULT 0,
  gst_rate NUMERIC(5, 4) DEFAULT 0.18,
  gst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_estimated_cost NUMERIC(14, 2) NOT NULL,
  effective_unit_cost NUMERIC(14, 2) NOT NULL,
  production_lead_time_days INTEGER NOT NULL DEFAULT 10,
  valid_until DATE NOT NULL,
  sample_available BOOLEAN DEFAULT TRUE,
  sample_charges NUMERIC(14, 2) DEFAULT 0,
  sample_lead_time_days INTEGER DEFAULT 5,
  payment_terms TEXT,
  terms_and_conditions TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'under_review', 'accepted', 'rejected', 'expired', 'withdrawn'
  )),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pkg_quotations_rfq ON public.packaging_quotations(rfq_id);
CREATE INDEX IF NOT EXISTS idx_pkg_quotations_supplier ON public.packaging_quotations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_pkg_quotations_status ON public.packaging_quotations(status);

-- 8. Packaging Sample Requests & Approval Workflow
CREATE TABLE IF NOT EXISTS public.packaging_sample_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_number TEXT NOT NULL UNIQUE,
  quotation_id UUID NOT NULL REFERENCES public.packaging_quotations(id) ON DELETE CASCADE,
  rfq_id UUID NOT NULL REFERENCES public.packaging_rfqs(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.packaging_supplier_profiles(id) ON DELETE CASCADE,
  sample_type TEXT NOT NULL DEFAULT 'custom_printed_sample',
  specifications JSONB DEFAULT '{}'::jsonb,
  sample_charges NUMERIC(14, 2) DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('free', 'pending', 'paid')),
  status TEXT NOT NULL DEFAULT 'sample_requested' CHECK (status IN (
    'sample_requested', 'sample_in_preparation', 'sample_dispatched', 'sample_delivered',
    'sample_reviewed', 'sample_approved', 'sample_revision_requested', 'sample_rejected'
  )),
  carrier_name TEXT,
  tracking_number TEXT,
  dispatched_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  buyer_feedback TEXT,
  revision_notes TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pkg_samples_quote ON public.packaging_sample_requests(quotation_id);
CREATE INDEX IF NOT EXISTS idx_pkg_samples_status ON public.packaging_sample_requests(status);

-- 9. Packaging Orders & Production Lifecycle
CREATE TABLE IF NOT EXISTS public.packaging_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  quotation_id UUID NOT NULL REFERENCES public.packaging_quotations(id) ON DELETE RESTRICT,
  rfq_id UUID NOT NULL REFERENCES public.packaging_rfqs(id) ON DELETE RESTRICT,
  sample_id UUID REFERENCES public.packaging_sample_requests(id) ON DELETE SET NULL,
  buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  supplier_id UUID NOT NULL REFERENCES public.packaging_supplier_profiles(id) ON DELETE RESTRICT,
  order_status TEXT NOT NULL DEFAULT 'order_created' CHECK (order_status IN (
    'order_created', 'supplier_confirmation_pending', 'specifications_awaiting_approval',
    'sample_pending', 'sample_approved', 'production_scheduled', 'production_in_progress',
    'quality_inspection', 'ready_for_dispatch', 'dispatched', 'delivered', 'completed',
    'cancelled', 'disputed'
  )),
  total_amount NUMERIC(14, 2) NOT NULL,
  agreed_unit_price NUMERIC(14, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL DEFAULT 'piece',
  delivery_city TEXT NOT NULL,
  delivery_state TEXT NOT NULL,
  delivery_address TEXT,
  delivery_pincode TEXT,
  estimated_delivery_date DATE,
  dispatch_date DATE,
  carrier_name TEXT,
  tracking_number TEXT,
  transporter_id UUID,
  quality_inspection_passed BOOLEAN DEFAULT FALSE,
  quality_documents JSONB DEFAULT '[]'::jsonb,
  dispatch_documents JSONB DEFAULT '[]'::jsonb,
  buyer_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pkg_orders_buyer ON public.packaging_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_pkg_orders_supplier ON public.packaging_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_pkg_orders_status ON public.packaging_orders(order_status);

-- 10. Packaging Production Milestones
CREATE TABLE IF NOT EXISTS public.packaging_order_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.packaging_orders(id) ON DELETE CASCADE,
  milestone_name TEXT NOT NULL,
  milestone_status TEXT NOT NULL DEFAULT 'pending' CHECK (milestone_status IN ('pending', 'in_progress', 'completed')),
  completion_percentage INTEGER NOT NULL DEFAULT 0,
  target_date DATE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  proof_documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pkg_milestones_order ON public.packaging_order_milestones(order_id);

-- 11. Packaging Order History & Audit Trail
CREATE TABLE IF NOT EXISTS public.packaging_order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.packaging_orders(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES public.users(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pkg_hist_order ON public.packaging_order_history(order_id);

-- 12. Packaging Complaints & Disputes
CREATE TABLE IF NOT EXISTS public.packaging_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.packaging_orders(id) ON DELETE CASCADE,
  complainant_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  against_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_investigation', 'resolved', 'closed')),
  admin_resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pkg_complaints_order ON public.packaging_complaints(order_id);

-- 13. Enable Row Level Security (RLS)
ALTER TABLE public.packaging_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packaging_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packaging_supplier_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packaging_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packaging_rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packaging_rfq_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packaging_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packaging_sample_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packaging_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packaging_order_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packaging_order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packaging_complaints ENABLE ROW LEVEL SECURITY;

-- 14. Public & Member RLS Policies
CREATE POLICY "Public read active packaging categories" ON public.packaging_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read packaging subcategories" ON public.packaging_subcategories
  FOR SELECT USING (true);

CREATE POLICY "Public read verified packaging suppliers" ON public.packaging_supplier_profiles
  FOR SELECT USING (verification_status = 'verified' AND is_public_discovery_enabled = true);

CREATE POLICY "Public read approved packaging products" ON public.packaging_products
  FOR SELECT USING (moderation_status = 'approved' AND is_active = true);

CREATE POLICY "Buyer read own packaging rfqs" ON public.packaging_rfqs
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Buyer create packaging rfqs" ON public.packaging_rfqs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Buyer read quotations on their packaging rfqs" ON public.packaging_quotations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.packaging_rfqs
      WHERE packaging_rfqs.id = packaging_quotations.rfq_id
      AND packaging_rfqs.buyer_id = auth.uid()
    )
  );

CREATE POLICY "Supplier manage own packaging products" ON public.packaging_products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.packaging_supplier_profiles
      WHERE packaging_supplier_profiles.id = packaging_products.supplier_id
      AND packaging_supplier_profiles.user_id = auth.uid()
    )
  );
