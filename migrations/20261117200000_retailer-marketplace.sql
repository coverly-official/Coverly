-- ====================================================================
-- COVERLY B2B Wholesale Platform — Retailer Marketplace System
-- Migration: 20261117200000_retailer_marketplace.sql
-- ====================================================================

-- 1. Extend user_roles check constraint to include retailer
DO $$
BEGIN
  ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
  ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check 
    CHECK (role IN (
      'buyer', 'manufacturer', 'wholesaler', 'distributor',
      'buyer_supplier', 'service_provider', 'sales_agent', 'sales_manager',
      'raw_material_supplier', 'packaging_supplier',
      'importer', 'exporter', 'importer_exporter',
      'retailer',
      'admin', 'verification_admin', 'support_admin', 'finance_admin'
    ));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 2. Extend businesses business_type check constraint to include retailer
DO $$
BEGIN
  ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_business_type_check;
  ALTER TABLE public.businesses ADD CONSTRAINT businesses_business_type_check 
    CHECK (business_type IN (
      'manufacturer', 'wholesaler', 'distributor', 'buyer', 'service_provider', 'retailer'
    ));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 3. Extend business_members role constraint to include store_manager
DO $$
BEGIN
  ALTER TABLE public.business_members DROP CONSTRAINT IF EXISTS business_members_role_in_business_check;
  ALTER TABLE public.business_members ADD CONSTRAINT business_members_role_in_business_check 
    CHECK (role_in_business IN (
      'owner', 'business_manager', 'procurement_manager', 'store_manager',
      'purchase_executive', 'accounts_executive', 'staff', 'admin', 'sales', 'procurement', 'viewer'
    ));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 4. Retailer Categories & Subcategories
CREATE TABLE IF NOT EXISTS public.retail_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.retail_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id TEXT NOT NULL REFERENCES public.retail_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_retail_subcategory UNIQUE (category_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_retail_subcategories_cat ON public.retail_subcategories(category_id);

-- Seed Initial Retail Categories & Subcategories
INSERT INTO public.retail_categories (id, name, slug, description, icon, display_order)
VALUES 
  ('grocery_fmcg', 'Grocery & FMCG', 'grocery-fmcg', 'Food staples, packaged foods, beverages and household products', 'ShoppingBag', 1),
  ('electronics', 'Electronics & Accessories', 'electronics', 'Mobile accessories, consumer electronics and electricals', 'Tv', 2),
  ('fashion_garments', 'Fashion & Garments', 'fashion-garments', 'Clothing, footwear, bags, accessories and fabrics', 'Shirt', 3),
  ('hardware_construction', 'Hardware & Construction', 'hardware-construction', 'Cement, paint, tools, plumbing and electrical hardware', 'Wrench', 4),
  ('general_retail', 'General Retail', 'general-retail', 'Stationery, toys, kitchen, home and personal care', 'Package', 5)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description;

INSERT INTO public.retail_subcategories (category_id, name, slug, display_order)
VALUES
  -- Grocery & FMCG
  ('grocery_fmcg', 'Rice', 'rice', 1),
  ('grocery_fmcg', 'Wheat & Flour', 'wheat-flour', 2),
  ('grocery_fmcg', 'Pulses & Lentils', 'pulses-lentils', 3),
  ('grocery_fmcg', 'Edible Oils & Ghee', 'edible-oils', 4),
  ('grocery_fmcg', 'Sugar & Sweeteners', 'sugar-sweeteners', 5),
  ('grocery_fmcg', 'Salt & Spices', 'salt-spices', 6),
  ('grocery_fmcg', 'Packaged Foods', 'packaged-foods', 7),
  ('grocery_fmcg', 'Snacks & Confectionery', 'snacks-confectionery', 8),
  ('grocery_fmcg', 'Beverages & Tea/Coffee', 'beverages', 9),
  ('grocery_fmcg', 'Household & Cleaning', 'household-cleaning', 10),

  -- Electronics
  ('electronics', 'Mobile Accessories', 'mobile-accessories', 1),
  ('electronics', 'Consumer Electronics', 'consumer-electronics', 2),
  ('electronics', 'Electrical Accessories', 'electrical-accessories', 3),
  ('electronics', 'Computer Accessories', 'computer-accessories', 4),

  -- Fashion & Garments
  ('fashion_garments', 'Men & Women Clothing', 'clothing', 1),
  ('fashion_garments', 'Footwear', 'footwear', 2),
  ('fashion_garments', 'Bags & Luggage', 'bags-luggage', 3),
  ('fashion_garments', 'Fashion Accessories', 'fashion-accessories', 4),
  ('fashion_garments', 'Fabrics & Textiles', 'fabrics', 5),

  -- Hardware & Construction
  ('hardware_construction', 'Cement & Aggregates', 'cement', 1),
  ('hardware_construction', 'Paints & Primers', 'paints', 2),
  ('hardware_construction', 'Hand & Power Tools', 'tools', 3),
  ('hardware_construction', 'Plumbing & Pipes', 'plumbing', 4),
  ('hardware_construction', 'Electrical Wires & Switches', 'electrical-materials', 5),

  -- General Retail
  ('general_retail', 'Stationery & Office Supplies', 'stationery', 1),
  ('general_retail', 'Toys & Games', 'toys', 2),
  ('general_retail', 'Home & Storage Products', 'home-products', 3),
  ('general_retail', 'Kitchenware & Cookware', 'kitchenware', 4),
  ('general_retail', 'Personal Care & Hygiene', 'personal-care', 5)
ON CONFLICT (category_id, slug) DO NOTHING;

-- 5. Retailer Profiles
CREATE TABLE IF NOT EXISTS public.retailer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  owner_name TEXT NOT NULL,
  shop_name TEXT NOT NULL,
  retail_type TEXT NOT NULL CHECK (retail_type IN (
    'individual_shop', 'kirana', 'grocery', 'supermarket', 'departmental', 
    'electronics', 'garments_fashion', 'hardware', 'medical_general', 
    'restaurant_hotel', 'multi_branch', 'other'
  )),
  shop_logo_url TEXT,
  description TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  store_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  gstin TEXT,
  pan TEXT,
  trade_license_number TEXT,
  fssai_license TEXT,
  drug_license_number TEXT,
  is_multi_branch BOOLEAN NOT NULL DEFAULT FALSE,
  purchasing_categories TEXT[] DEFAULT '{}',
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN (
    'unverified', 'pending', 'verified', 'rejected'
  )),
  verification_notes TEXT,
  verified_by UUID REFERENCES public.users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retailer_profiles_user ON public.retailer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_retailer_profiles_biz ON public.retailer_profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_retailer_profiles_status ON public.retailer_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_retailer_profiles_type ON public.retailer_profiles(retail_type);

-- 6. Retailer Branches (for Multi-Branch Store Networks)
CREATE TABLE IF NOT EXISTS public.retailer_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_profile_id UUID NOT NULL REFERENCES public.retailer_profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  branch_name TEXT NOT NULL,
  store_code TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  manager_name TEXT,
  manager_phone TEXT,
  manager_email TEXT,
  is_main_branch BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retailer_branches_profile ON public.retailer_branches(retailer_profile_id);
CREATE INDEX IF NOT EXISTS idx_retailer_branches_biz ON public.retailer_branches(business_id);

-- 7. Retailer Purchase Lists (Wholesale Sourcing Lists)
CREATE TABLE IF NOT EXISTS public.retailer_purchase_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  retailer_profile_id UUID REFERENCES public.retailer_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  notes TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retailer_purchase_lists_user ON public.retailer_purchase_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_retailer_purchase_lists_profile ON public.retailer_purchase_lists(retailer_profile_id);

CREATE TABLE IF NOT EXISTS public.retailer_purchase_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.retailer_purchase_lists(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  category TEXT,
  quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'kg',
  target_unit_price NUMERIC(12, 2),
  preferred_supplier_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retailer_purchase_list_items_list ON public.retailer_purchase_list_items(list_id);

-- 8. Retailer Reorder Rules & Reminders
CREATE TABLE IF NOT EXISTS public.retailer_reorder_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  retailer_profile_id UUID REFERENCES public.retailer_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  purchase_list_id UUID REFERENCES public.retailer_purchase_lists(id) ON DELETE SET NULL,
  quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'kg',
  preferred_supplier_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  frequency_days INTEGER NOT NULL DEFAULT 15 CHECK (frequency_days > 0),
  last_ordered_at TIMESTAMPTZ,
  next_reminder_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reorder_rules_user ON public.retailer_reorder_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_reorder_rules_next ON public.retailer_reorder_rules(next_reminder_date);

CREATE TABLE IF NOT EXISTS public.retailer_reorder_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.retailer_reorder_rules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reminder_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'due' CHECK (status IN ('due', 'acknowledged', 'rfq_created', 'dismissed')),
  rfq_id UUID REFERENCES public.rfqs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reorder_reminders_user ON public.retailer_reorder_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reorder_reminders_status ON public.retailer_reorder_reminders(status);

-- 9. Retailer Saved Products
CREATE TABLE IF NOT EXISTS public.retailer_saved_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_retailer_saved_product UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_retailer_saved_products_user ON public.retailer_saved_products(user_id);

-- 10. Retailer Documents Vault
CREATE TABLE IF NOT EXISTS public.retailer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  retailer_profile_id UUID REFERENCES public.retailer_profiles(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN (
    'shop_photo', 'trade_license', 'gst_certificate', 'fssai_license', 
    'drug_license', 'utility_bill', 'other'
  )),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_key TEXT NOT NULL,
  file_size_bytes BIGINT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_notes TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retailer_documents_user ON public.retailer_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_retailer_documents_profile ON public.retailer_documents(retailer_profile_id);

-- 11. Enable Row Level Security (RLS)
ALTER TABLE public.retail_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retail_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retailer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retailer_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retailer_purchase_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retailer_purchase_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retailer_reorder_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retailer_reorder_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retailer_saved_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retailer_documents ENABLE ROW LEVEL SECURITY;

-- 12. RLS Policies
CREATE POLICY "Public read active retail categories" ON public.retail_categories 
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read active retail subcategories" ON public.retail_subcategories 
  FOR SELECT USING (true);

CREATE POLICY "Public read verified retailer profiles" ON public.retailer_profiles 
  FOR SELECT USING (verification_status = 'verified' OR auth.uid() = user_id);

CREATE POLICY "Retailer manage own profile" ON public.retailer_profiles 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public read retailer branches" ON public.retailer_branches 
  FOR SELECT USING (is_active = true);

CREATE POLICY "Retailer manage own branches" ON public.retailer_branches 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.retailer_profiles 
      WHERE id = retailer_branches.retailer_profile_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Retailer manage own purchase lists" ON public.retailer_purchase_lists 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Retailer manage own purchase list items" ON public.retailer_purchase_list_items 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.retailer_purchase_lists 
      WHERE id = retailer_purchase_list_items.list_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Retailer manage own reorder rules" ON public.retailer_reorder_rules 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Retailer manage own reorder reminders" ON public.retailer_reorder_reminders 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Retailer manage saved products" ON public.retailer_saved_products 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Retailer manage own documents" ON public.retailer_documents 
  FOR ALL USING (auth.uid() = user_id);
