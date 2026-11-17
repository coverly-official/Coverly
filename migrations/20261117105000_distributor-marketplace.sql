-- ====================================================================
-- COVERLY B2B Platform — Distributor, Territory & Product Offer Schema
-- Migration: 20261117105000_distributor_marketplace.sql
-- ====================================================================

-- 1. Distributor Profiles
CREATE TABLE IF NOT EXISTS public.distributor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  distribution_categories TEXT[] DEFAULT '{}',
  brands_distributed TEXT[] DEFAULT '{}',
  warehouse_locations TEXT[] DEFAULT '{}',
  authorized_distribution BOOLEAN DEFAULT FALSE,
  dealer_network_size INTEGER DEFAULT 0,
  supply_capacity_monthly TEXT,
  minimum_order_value NUMERIC(12, 2) DEFAULT 0,
  payment_terms TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Distributor Territories (State, District, City, Pincode coverage)
CREATE TABLE IF NOT EXISTS public.distributor_territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  state TEXT NOT NULL,
  district TEXT,
  city TEXT,
  pincode_ranges TEXT,
  warehouse_location TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_distributor_territories_biz ON public.distributor_territories(business_id);
CREATE INDEX IF NOT EXISTS idx_distributor_territories_state ON public.distributor_territories(state);
CREATE INDEX IF NOT EXISTS idx_distributor_territories_city ON public.distributor_territories(city);

-- 3. Distributor Product Offers (Multi-Distributor product supply linkage)
CREATE TABLE IF NOT EXISTS public.distributor_product_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distributor_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  brand_name TEXT,
  title TEXT NOT NULL,
  selling_price NUMERIC(12, 2) NOT NULL,
  dealer_price NUMERIC(12, 2),
  moq INTEGER NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'pc',
  available_stock INTEGER DEFAULT 0,
  stock_status TEXT NOT NULL DEFAULT 'available' CHECK (stock_status IN ('available', 'limited', 'out_of_stock', 'on_request')),
  supply_territory TEXT,
  delivery_lead_time_days INTEGER DEFAULT 3,
  moderation_status TEXT NOT NULL DEFAULT 'approved' CHECK (moderation_status IN ('draft', 'pending', 'approved', 'rejected', 'archived')),
  moderation_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_distributor_offers_biz ON public.distributor_product_offers(distributor_business_id);
CREATE INDEX IF NOT EXISTS idx_distributor_offers_prod ON public.distributor_product_offers(product_id);
CREATE INDEX IF NOT EXISTS idx_distributor_offers_status ON public.distributor_product_offers(moderation_status);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.distributor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distributor_territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distributor_product_offers ENABLE ROW LEVEL SECURITY;

-- 5. Public Discovery Policies (Read-Only)
DROP POLICY IF EXISTS "Allow public read of distributor profiles" ON public.distributor_profiles;
CREATE POLICY "Allow public read of distributor profiles"
  ON public.distributor_profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public read of active distributor territories" ON public.distributor_territories;
CREATE POLICY "Allow public read of active distributor territories"
  ON public.distributor_territories FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Allow public read of approved distributor offers" ON public.distributor_product_offers;
CREATE POLICY "Allow public read of approved distributor offers"
  ON public.distributor_product_offers FOR SELECT
  USING (is_active = true AND moderation_status = 'approved');

-- 6. Distributor Business Member & Admin Management Policies
DROP POLICY IF EXISTS "Allow distributor members to manage their profiles" ON public.distributor_profiles;
CREATE POLICY "Allow distributor members to manage their profiles"
  ON public.distributor_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.business_members bm
      WHERE bm.business_id = distributor_profiles.business_id
        AND bm.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Allow distributor members to manage their territories" ON public.distributor_territories;
CREATE POLICY "Allow distributor members to manage their territories"
  ON public.distributor_territories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.business_members bm
      WHERE bm.business_id = distributor_territories.business_id
        AND bm.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Allow distributor members to manage their product offers" ON public.distributor_product_offers;
CREATE POLICY "Allow distributor members to manage their product offers"
  ON public.distributor_product_offers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.business_members bm
      WHERE bm.business_id = distributor_product_offers.distributor_business_id
        AND bm.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );
