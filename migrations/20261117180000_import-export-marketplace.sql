-- ====================================================================
-- COVERLY B2B Wholesale Platform — Importer & Exporter Marketplace
-- Migration: 20261117180000_import_export_marketplace.sql
-- ====================================================================

-- 1. Extend user_roles check constraint to include international trade roles
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check 
  CHECK (role IN (
    'buyer', 'manufacturer', 'wholesaler', 'distributor',
    'buyer_supplier', 'service_provider', 'sales_agent', 'sales_manager',
    'raw_material_supplier', 'packaging_supplier',
    'importer', 'exporter', 'importer_exporter',
    'admin', 'verification_admin', 'support_admin', 'finance_admin'
  ));

-- 2. Trade Product Categories & Subcategories
CREATE TABLE IF NOT EXISTS public.trade_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.trade_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id TEXT NOT NULL REFERENCES public.trade_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed 8 Core International Trade Categories
INSERT INTO public.trade_categories (id, name, slug, description, icon, display_order)
VALUES
  ('trd-cat-agri', 'Agricultural Products & Grains', 'agricultural-products', 'Basmati rice, non-basmati rice, wheat, maize, pulses, soybean, cotton, tea, coffee, spices and oilseeds', 'Wheat', 1),
  ('trd-cat-food', 'Food & Processed Products', 'food-processed-products', 'Packaged food, ready-to-eat snacks, dehydrated onion/garlic, food ingredients, edible oils and confectionery', 'Utensils', 2),
  ('trd-cat-industrial', 'Industrial Products & Machinery', 'industrial-machinery', 'Steel bars, aluminium ingots, copper cathodes, CNC machines, industrial equipment, components and spare parts', 'Factory', 3),
  ('trd-cat-chemicals', 'Chemicals & Materials', 'chemicals-and-materials', 'Specialty chemicals, polymers, virgin plastic resins, dyes, pigments and industrial raw chemicals', 'Layers', 4),
  ('trd-cat-textiles', 'Textiles & Apparel', 'textiles-and-apparel', '100% combed cotton yarn, greige fabric, garments, home textiles, terry towels, denim and technical textiles', 'Scissors', 5),
  ('trd-cat-packaging', 'Packaging Products', 'packaging-products', 'Barrier pouches, corrugated shipping cartons, FIBC bulk bags, roll labels, film reels and closures', 'Package', 6),
  ('trd-cat-electronics', 'Electronics & Electricals', 'electronics-and-electrical', 'Semiconductors, copper winding wire, industrial cables, electronic components and switchgears', 'Cpu', 7),
  ('trd-cat-construction', 'Construction Materials', 'construction-materials', 'Portland cement, vitrified ceramic tiles, sanitaryware, structural steel beams, granites and marble', 'Building', 8)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- Seed Trade Subcategories
INSERT INTO public.trade_subcategories (category_id, name, slug, display_order)
VALUES
  -- Agricultural Products
  ('trd-cat-agri', 'Basmati & Non-Basmati Rice', 'rice', 1),
  ('trd-cat-agri', 'Wheat & Grains', 'wheat-grains', 2),
  ('trd-cat-agri', 'Whole & Ground Spices', 'spices', 3),
  ('trd-cat-agri', 'Tea & Coffee Beans', 'tea-coffee', 4),
  ('trd-cat-agri', 'Raw Cotton & Fibres', 'raw-cotton', 5),
  ('trd-cat-agri', 'Oilseeds & Meals', 'oilseeds', 6),

  -- Food & Processed
  ('trd-cat-food', 'Dehydrated Vegetables & Powders', 'dehydrated-food', 1),
  ('trd-cat-food', 'Edible Vegetable Oils', 'edible-oils', 2),
  ('trd-cat-food', 'Snack Foods & Namkeen', 'snacks', 3),
  ('trd-cat-food', 'Processed Fruit Pulps & Purees', 'fruit-pulps', 4),

  -- Industrial & Machinery
  ('trd-cat-industrial', 'Steel Billets, Coils & Plates', 'steel-products', 1),
  ('trd-cat-industrial', 'Aluminium & Copper Non-Ferrous', 'non-ferrous-metals', 2),
  ('trd-cat-industrial', 'Industrial Machinery & CNC', 'machinery-equipment', 3),
  ('trd-cat-industrial', 'Pumps, Valves & Pipe Fittings', 'pumps-valves', 4),

  -- Chemicals & Materials
  ('trd-cat-chemicals', 'Polymers & Plastic Granules', 'polymers-resins', 1),
  ('trd-cat-chemicals', 'Dyes, Pigments & Intermediates', 'dyes-pigments', 2),
  ('trd-cat-chemicals', 'Agrochemicals & Fertilizers', 'agrochemicals', 3),

  -- Textiles & Apparel
  ('trd-cat-textiles', 'Cotton & Blended Spun Yarn', 'cotton-yarn', 1),
  ('trd-cat-textiles', 'Woven & Knitted Fabrics', 'fabrics', 2),
  ('trd-cat-textiles', 'Home Textiles & Bed Linens', 'home-textiles', 3),
  ('trd-cat-textiles', 'Readymade Garments', 'garments', 4),

  -- Packaging
  ('trd-cat-packaging', 'FIBC Bulk Bags (Jumbo Bags)', 'fibc-bags', 1),
  ('trd-cat-packaging', 'Flexible Printed Barrier Pouches', 'flexible-pouches', 2),
  ('trd-cat-packaging', 'Corrugated Master Cartons', 'corrugated-cartons', 3),

  -- Electronics
  ('trd-cat-electronics', 'Copper Enamelled Winding Wire', 'copper-wire', 1),
  ('trd-cat-electronics', 'Industrial Power Cables', 'power-cables', 2),
  ('trd-cat-electronics', 'Electrical Transformers & Switchgear', 'transformers', 3),

  -- Construction
  ('trd-cat-construction', 'Ceramic & Vitrified Floor Tiles', 'ceramic-tiles', 1),
  ('trd-cat-construction', 'Portland Pozzolana Cement', 'cement', 2),
  ('trd-cat-construction', 'Natural Granite & Marble Slabs', 'granite-marble', 3);

-- 3. Importer & Exporter Business Profiles (Combined capability supported)
CREATE TABLE IF NOT EXISTS public.trade_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  party_type TEXT NOT NULL CHECK (party_type IN ('importer', 'exporter', 'importer_exporter')),
  headline TEXT,
  description TEXT,
  country_code TEXT NOT NULL DEFAULT 'IN', -- ISO Alpha-2 e.g. IN, AE, US, DE
  country_name TEXT NOT NULL DEFAULT 'India',
  operating_cities TEXT[] DEFAULT '{}',
  iec_code TEXT, -- 10-digit Indian Import Export Code (DGFT)
  authorized_dealer_code TEXT, -- AD Code for port customs
  gstin TEXT,
  business_registration_number TEXT,
  export_markets TEXT[] DEFAULT '{}', -- e.g. ["Middle East", "Europe", "North America", "Southeast Asia"]
  sourcing_countries TEXT[] DEFAULT '{}', -- e.g. ["China", "Vietnam", "Indonesia", "Germany"]
  product_categories TEXT[] DEFAULT '{}',
  annual_trade_turnover TEXT,
  typical_shipment_modes TEXT[] DEFAULT '{FCL,LCL,Air}', -- FCL, LCL, Air Cargo, Break Bulk
  certifications TEXT[] DEFAULT '{}', -- e.g. ["AEO Tier 1", "RCMC APEDA", "FIEO Member", "ISO 9001:2015", "HALAL", "US FDA"]
  primary_loading_ports TEXT[] DEFAULT '{}', -- e.g. ["Nhava Sheva (JNPT)", "Mundra Port", "Chennai Port"]
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN (
    'pending', 'verified', 'rejected', 'suspended'
  )),
  verification_notes TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.users(id),
  rating NUMERIC(3, 2) DEFAULT 4.90,
  total_export_deals_completed INTEGER DEFAULT 0,
  is_public_discovery_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_trade_party_business UNIQUE (business_id)
);
CREATE INDEX IF NOT EXISTS idx_trade_parties_biz ON public.trade_parties(business_id);
CREATE INDEX IF NOT EXISTS idx_trade_parties_type ON public.trade_parties(party_type);
CREATE INDEX IF NOT EXISTS idx_trade_parties_country ON public.trade_parties(country_code);
CREATE INDEX IF NOT EXISTS idx_trade_parties_status ON public.trade_parties(verification_status);

-- 4. International Trade Product Listings (Published by Exporters)
CREATE TABLE IF NOT EXISTS public.international_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES public.trade_parties(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES public.trade_categories(id),
  subcategory TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  hs_code TEXT, -- 6 to 8 digit Harmonized System Tariff Code (e.g. 1006.30.20)
  origin_country TEXT NOT NULL DEFAULT 'India',
  origin_state TEXT,
  material_grade TEXT,
  specifications JSONB DEFAULT '{}'::jsonb,
  quality_certifications TEXT[] DEFAULT '{}',
  unit_of_measurement TEXT NOT NULL DEFAULT 'metric_ton', -- metric_ton, kg, container_20ft, container_40ft, pieces
  moq INTEGER NOT NULL DEFAULT 20, -- e.g. 20 MT or 1 FCL
  max_supply_capacity_monthly TEXT,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'INR', 'AED', 'GBP', 'JPY', 'CNY', 'SGD')),
  base_price_fob NUMERIC(14, 2) NOT NULL, -- Standard FOB basis or indicated incoterm
  incoterm_basis TEXT NOT NULL DEFAULT 'FOB' CHECK (incoterm_basis IN (
    'EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'
  )),
  pricing_tiers JSONB DEFAULT '[]'::jsonb, -- [{ min_qty, max_qty, price_per_unit, currency }]
  export_lead_time_days INTEGER NOT NULL DEFAULT 15,
  packaging_details TEXT, -- e.g. "50kg HDPE/PP bags with inner liner in 20ft FCL"
  loading_port TEXT, -- e.g. "Nhava Sheva Port, India"
  eligible_destination_countries TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  compliance_documents JSONB DEFAULT '[]'::jsonb,
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  moderation_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intl_prods_party ON public.international_products(party_id);
CREATE INDEX IF NOT EXISTS idx_intl_prods_cat ON public.international_products(category_id);
CREATE INDEX IF NOT EXISTS idx_intl_prods_origin ON public.international_products(origin_country);
CREATE INDEX IF NOT EXISTS idx_intl_prods_status ON public.international_products(moderation_status);

-- 5. Trade Requirements & Export Enquiries (RFQs)
CREATE TABLE IF NOT EXISTS public.trade_rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_number TEXT NOT NULL UNIQUE, -- "TRD-RFQ-YYYYMMDD-XXXX"
  direction TEXT NOT NULL DEFAULT 'import' CHECK (direction IN ('import', 'export')),
  buyer_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- nullable for guest
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  guest_company TEXT,
  guest_country TEXT DEFAULT 'India',
  category_id TEXT REFERENCES public.trade_categories(id),
  product_id UUID REFERENCES public.international_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  hs_code_preference TEXT,
  required_specifications JSONB DEFAULT '{}'::jsonb,
  origin_country_preference TEXT,
  destination_country TEXT NOT NULL,
  destination_port TEXT NOT NULL, -- e.g. "Jebel Ali Port, Dubai, UAE" or "Rotterdam, Netherlands"
  preferred_incoterm TEXT NOT NULL DEFAULT 'CIF' CHECK (preferred_incoterm IN (
    'EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'
  )),
  required_quantity NUMERIC(14, 2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'metric_ton',
  packaging_preference TEXT,
  target_currency TEXT NOT NULL DEFAULT 'USD',
  target_budget NUMERIC(14, 2),
  target_delivery_date DATE,
  payment_terms_preferred TEXT, -- e.g. "100% Irrevocable Confirmed L/C at Sight" or "30% Advance, 70% against BL scan"
  inspection_agency TEXT, -- e.g. "SGS", "Bureau Veritas", "Intertek"
  additional_instructions TEXT,
  reference_files JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'matched', 'quotes_received', 'accepted', 'expired', 'cancelled'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trade_rfqs_buyer ON public.trade_rfqs(buyer_id);
CREATE INDEX IF NOT EXISTS idx_trade_rfqs_cat ON public.trade_rfqs(category_id);
CREATE INDEX IF NOT EXISTS idx_trade_rfqs_dir ON public.trade_rfqs(direction);
CREATE INDEX IF NOT EXISTS idx_trade_rfqs_status ON public.trade_rfqs(status);
CREATE INDEX IF NOT EXISTS idx_trade_rfqs_dest ON public.trade_rfqs(destination_country);

-- 6. Trade RFQ Recipients (Matched Exporters/Suppliers)
CREATE TABLE IF NOT EXISTS public.trade_rfq_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES public.trade_rfqs(id) ON DELETE CASCADE,
  party_id UUID NOT NULL REFERENCES public.trade_parties(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'quoted', 'declined')),
  declined_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_trade_rfq_recipient UNIQUE (rfq_id, party_id)
);
CREATE INDEX IF NOT EXISTS idx_trade_recipients_party ON public.trade_rfq_recipients(party_id);
CREATE INDEX IF NOT EXISTS idx_trade_recipients_rfq ON public.trade_rfq_recipients(rfq_id);

-- 7. International Trade Quotations
CREATE TABLE IF NOT EXISTS public.trade_quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number TEXT NOT NULL UNIQUE, -- "TRD-QT-YYYYMMDD-XXXX"
  rfq_id UUID NOT NULL REFERENCES public.trade_rfqs(id) ON DELETE CASCADE,
  party_id UUID NOT NULL REFERENCES public.trade_parties(id) ON DELETE CASCADE,
  seller_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.international_products(id) ON DELETE SET NULL,
  quantity NUMERIC(14, 2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'metric_ton',
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'INR', 'AED', 'GBP', 'JPY', 'CNY', 'SGD')),
  indicative_exchange_rate_to_inr NUMERIC(10, 4) NOT NULL DEFAULT 86.50,
  exchange_rate_source TEXT NOT NULL DEFAULT 'Reserve Bank of India Reference Rate',
  exchange_rate_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unit_price NUMERIC(14, 2) NOT NULL,
  subtotal NUMERIC(14, 2) NOT NULL,
  incoterm TEXT NOT NULL DEFAULT 'CIF' CHECK (incoterm IN (
    'EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'
  )),
  named_port_of_loading TEXT NOT NULL, -- e.g. "Nhava Sheva (JNPT), India"
  named_port_of_discharge TEXT NOT NULL, -- e.g. "Jebel Ali Port, Dubai"
  inland_freight NUMERIC(14, 2) DEFAULT 0,
  international_ocean_air_freight NUMERIC(14, 2) DEFAULT 0,
  marine_transit_insurance NUMERIC(14, 2) DEFAULT 0,
  customs_documentation_charges NUMERIC(14, 2) DEFAULT 0,
  inspection_charges NUMERIC(14, 2) DEFAULT 0,
  total_amount NUMERIC(14, 2) NOT NULL,
  indicative_inr_total NUMERIC(14, 2) NOT NULL,
  effective_unit_cost NUMERIC(14, 2) NOT NULL,
  payment_terms TEXT NOT NULL, -- e.g. "30% Advance TT, 70% against Bill of Lading scan"
  production_dispatch_lead_days INTEGER NOT NULL DEFAULT 15,
  estimated_ocean_transit_days INTEGER NOT NULL DEFAULT 7,
  valid_until DATE NOT NULL,
  terms_and_conditions TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'under_review', 'accepted', 'rejected', 'expired', 'withdrawn'
  )),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trade_quotes_rfq ON public.trade_quotations(rfq_id);
CREATE INDEX IF NOT EXISTS idx_trade_quotes_party ON public.trade_quotations(party_id);
CREATE INDEX IF NOT EXISTS idx_trade_quotes_status ON public.trade_quotations(status);

-- 8. International Trade Orders & Shipment Lifecycle (16-State State Machine)
CREATE TABLE IF NOT EXISTS public.trade_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE, -- "TRD-ORD-YYYYMMDD-XXXX"
  quotation_id UUID NOT NULL REFERENCES public.trade_quotations(id) ON DELETE RESTRICT,
  rfq_id UUID NOT NULL REFERENCES public.trade_rfqs(id) ON DELETE RESTRICT,
  buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  party_id UUID NOT NULL REFERENCES public.trade_parties(id) ON DELETE RESTRICT, -- seller / exporter
  order_status TEXT NOT NULL DEFAULT 'order_confirmed' CHECK (order_status IN (
    'rfq_submitted', 'quotation_received', 'quotation_accepted', 'order_confirmed',
    'production_procurement', 'ready_for_dispatch', 'export_documentation', 'customs_processing',
    'shipment_booked', 'in_transit', 'arrived_at_destination', 'import_customs_processing',
    'delivered', 'completed', 'cancelled', 'disputed'
  )),
  currency TEXT NOT NULL DEFAULT 'USD',
  total_amount NUMERIC(14, 2) NOT NULL,
  indicative_inr_total NUMERIC(14, 2) NOT NULL,
  agreed_unit_price NUMERIC(14, 2) NOT NULL,
  quantity NUMERIC(14, 2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'metric_ton',
  incoterm TEXT NOT NULL DEFAULT 'CIF',
  port_of_loading TEXT NOT NULL,
  port_of_discharge TEXT NOT NULL,
  container_numbers TEXT[] DEFAULT '{}',
  bl_awb_number TEXT,
  shipping_line_airline TEXT,
  vessel_flight_details TEXT,
  estimated_departure_date DATE,
  actual_departure_date DATE,
  estimated_arrival_date DATE,
  actual_arrival_date DATE,
  delivery_date DATE,
  transporter_id UUID, -- connected to existing transporter module
  logistics_booking_id UUID, -- connected to existing logistics module
  buyer_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trade_orders_buyer ON public.trade_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_trade_orders_party ON public.trade_orders(party_id);
CREATE INDEX IF NOT EXISTS idx_trade_orders_status ON public.trade_orders(order_status);

-- 9. International Trade Documents Management
CREATE TABLE IF NOT EXISTS public.trade_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.trade_orders(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'commercial_invoice', 'proforma_invoice', 'packing_list', 'certificate_of_origin',
    'bill_of_lading', 'air_waybill', 'shipping_bill', 'bill_of_entry',
    'insurance_certificate', 'inspection_certificate', 'phytosanitary_certificate', 'other'
  )),
  document_name TEXT NOT NULL,
  document_number TEXT,
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  issuing_authority TEXT,
  issue_date DATE,
  expiry_date DATE,
  verification_status TEXT NOT NULL DEFAULT 'submitted' CHECK (verification_status IN (
    'submitted', 'verified_by_ops', 'rejected', 'archived'
  )),
  verification_notes TEXT,
  verified_by UUID REFERENCES public.users(id),
  uploaded_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trade_docs_order ON public.trade_documents(order_id);
CREATE INDEX IF NOT EXISTS idx_trade_docs_type ON public.trade_documents(document_type);

-- 10. Trade Order Audit History
CREATE TABLE IF NOT EXISTS public.trade_order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.trade_orders(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES public.users(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trade_hist_order ON public.trade_order_history(order_id);

-- 11. Trade Complaints & Arbitration
CREATE TABLE IF NOT EXISTS public.trade_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.trade_orders(id) ON DELETE CASCADE,
  complainant_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  against_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dispute_category TEXT NOT NULL CHECK (dispute_category IN (
    'quality_defect', 'quantity_shortage', 'shipping_delay', 'documentation_discrepancy', 'payment_dispute'
  )),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_arbitration', 'resolved', 'closed')),
  admin_resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trade_complaints_order ON public.trade_complaints(order_id);

-- 12. Enable Row Level Security (RLS)
ALTER TABLE public.trade_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.international_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_rfq_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_complaints ENABLE ROW LEVEL SECURITY;

-- 13. Public & Member RLS Policies
CREATE POLICY "Public read active trade categories" ON public.trade_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read trade subcategories" ON public.trade_subcategories
  FOR SELECT USING (true);

CREATE POLICY "Public read verified trade parties" ON public.trade_parties
  FOR SELECT USING (verification_status = 'verified' AND is_public_discovery_enabled = true);

CREATE POLICY "Public read approved international products" ON public.international_products
  FOR SELECT USING (moderation_status = 'approved' AND is_active = true);

CREATE POLICY "Buyer read own trade rfqs" ON public.trade_rfqs
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Buyer create trade rfqs" ON public.trade_rfqs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Buyer read quotations on their trade rfqs" ON public.trade_quotations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trade_rfqs
      WHERE trade_rfqs.id = trade_quotations.rfq_id
      AND trade_rfqs.buyer_id = auth.uid()
    )
  );

CREATE POLICY "Party manage own international products" ON public.international_products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.trade_parties
      WHERE trade_parties.id = international_products.party_id
      AND trade_parties.user_id = auth.uid()
    )
  );
