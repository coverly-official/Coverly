-- ====================================================================
-- COVERLY B2B Wholesale Platform — Business Services Marketplace Schema
-- Migration: 20261113211500_business-services-marketplace.sql
-- ====================================================================

-- 1. Expand constraints on businesses and user_roles to accommodate service_provider
ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_business_type_check;
ALTER TABLE public.businesses ADD CONSTRAINT businesses_business_type_check 
  CHECK (business_type IN ('manufacturer', 'wholesaler', 'distributor', 'buyer', 'service_provider'));

ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check 
  CHECK (role IN (
    'buyer', 'manufacturer', 'wholesaler', 'distributor',
    'buyer_supplier', 'service_provider', 'admin', 'verification_admin', 'support_admin'
  ));

-- 2. Business Service Categories
CREATE TABLE IF NOT EXISTS public.business_service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bs_categories_slug ON public.business_service_categories(slug);
CREATE INDEX IF NOT EXISTS idx_bs_categories_sort ON public.business_service_categories(sort_order);

-- 3. Business Service Subcategories
CREATE TABLE IF NOT EXISTS public.business_service_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.business_service_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bs_subcategories_cat ON public.business_service_subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_bs_subcategories_slug ON public.business_service_subcategories(slug);

-- 4. Service Provider Profiles
CREATE TABLE IF NOT EXISTS public.service_provider_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  headline TEXT,
  bio TEXT,
  experience_years INT NOT NULL DEFAULT 0,
  service_areas TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  website_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sp_profiles_business ON public.service_provider_profiles(business_id);

-- 5. Business Services Listings
CREATE TABLE IF NOT EXISTS public.business_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.business_service_categories(id) ON DELETE RESTRICT,
  subcategory_id UUID REFERENCES public.business_service_subcategories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  short_description TEXT NOT NULL,
  full_description TEXT,
  deliverables JSONB DEFAULT '[]'::jsonb,
  pricing_model TEXT NOT NULL DEFAULT 'custom_quote' CHECK (pricing_model IN ('fixed', 'starting_at', 'custom_quote')),
  starting_price NUMERIC(12, 2),
  turnaround_days INT DEFAULT 3,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bs_services_business ON public.business_services(business_id);
CREATE INDEX IF NOT EXISTS idx_bs_services_category ON public.business_services(category_id);
CREATE INDEX IF NOT EXISTS idx_bs_services_subcategory ON public.business_services(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_bs_services_active ON public.business_services(is_active);

-- 6. Business Service Portfolio Images & Work Samples
CREATE TABLE IF NOT EXISTS public.business_service_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.business_services(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_key TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bs_portfolio_service ON public.business_service_portfolios(service_id);
CREATE INDEX IF NOT EXISTS idx_bs_portfolio_business ON public.business_service_portfolios(business_id);

-- 7. Service Requests (Inquiries / Leads from Customers to Providers)
CREATE TABLE IF NOT EXISTS public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.users(id),
  customer_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.business_services(id) ON DELETE SET NULL,
  provider_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  requirements TEXT NOT NULL,
  delivery_city TEXT,
  target_timeline TEXT,
  budget NUMERIC(12, 2),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'viewed', 'quoted', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sr_requests_customer ON public.service_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_sr_requests_provider ON public.service_requests(provider_business_id);
CREATE INDEX IF NOT EXISTS idx_sr_requests_status ON public.service_requests(status);

-- 8. Service Request Quotations
CREATE TABLE IF NOT EXISTS public.service_request_quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number TEXT NOT NULL UNIQUE,
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  provider_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  provider_user_id UUID NOT NULL REFERENCES public.users(id),
  quoted_price NUMERIC(12, 2) NOT NULL,
  scope_of_work TEXT NOT NULL,
  deliverables JSONB DEFAULT '[]'::jsonb,
  turnaround_days INT NOT NULL DEFAULT 3,
  valid_until DATE NOT NULL,
  terms TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sr_quotes_request ON public.service_request_quotations(request_id);
CREATE INDEX IF NOT EXISTS idx_sr_quotes_provider ON public.service_request_quotations(provider_business_id);

-- 9. Service Request Status History
CREATE TABLE IF NOT EXISTS public.service_request_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES public.users(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sr_history_request ON public.service_request_status_history(request_id);

-- 10. Enable Row Level Security
ALTER TABLE public.business_service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_service_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_service_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_request_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_request_status_history ENABLE ROW LEVEL SECURITY;

-- 11. Public Read RLS Policies
CREATE POLICY "Public read bs categories" ON public.business_service_categories FOR SELECT USING (true);
CREATE POLICY "Public read bs subcategories" ON public.business_service_subcategories FOR SELECT USING (true);
CREATE POLICY "Public read active business services" ON public.business_services FOR SELECT USING (is_active = true);
CREATE POLICY "Public read sp profiles" ON public.service_provider_profiles FOR SELECT USING (true);
CREATE POLICY "Public read bs portfolios" ON public.business_service_portfolios FOR SELECT USING (true);
CREATE POLICY "Public read sr status history" ON public.service_request_status_history FOR SELECT USING (true);

-- 12. Seed the 7 Core Service Categories and 47 Subcategories
DO $$
DECLARE
  cat_reg_id UUID := gen_random_uuid();
  cat_fin_id UUID := gen_random_uuid();
  cat_mkt_id UUID := gen_random_uuid();
  cat_mfg_id UUID := gen_random_uuid();
  cat_log_id UUID := gen_random_uuid();
  cat_tech_id UUID := gen_random_uuid();
  cat_cns_id UUID := gen_random_uuid();
BEGIN
  -- Category A: Business Registration & Legal
  INSERT INTO public.business_service_categories (id, name, slug, icon, description, sort_order)
  VALUES (cat_reg_id, 'Business Registration & Legal', 'business-registration-legal', 'FileCheck', 'Entity incorporation, compliance licenses, trademarks, and legal contracts.', 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_reg_id;

  INSERT INTO public.business_service_subcategories (category_id, name, slug, sort_order) VALUES
    (cat_reg_id, 'Company Registration', 'company-registration', 1),
    (cat_reg_id, 'LLP Registration', 'llp-registration', 2),
    (cat_reg_id, 'Partnership Firm Registration', 'partnership-firm-registration', 3),
    (cat_reg_id, 'Proprietorship Registration Assistance', 'proprietorship-registration', 4),
    (cat_reg_id, 'GST Registration', 'gst-registration', 5),
    (cat_reg_id, 'MSME / Udyam Registration', 'msme-udyam-registration', 6),
    (cat_reg_id, 'Trademark Registration', 'trademark-registration', 7),
    (cat_reg_id, 'FSSAI License Assistance', 'fssai-license-assistance', 8),
    (cat_reg_id, 'Import Export Code (IEC)', 'import-export-code-iec', 9),
    (cat_reg_id, 'Business License Assistance', 'business-license-assistance', 10),
    (cat_reg_id, 'Legal Consultation', 'legal-consultation', 11)
  ON CONFLICT (slug) DO NOTHING;

  -- Category B: Accounting & Finance
  INSERT INTO public.business_service_categories (id, name, slug, icon, description, sort_order)
  VALUES (cat_fin_id, 'Accounting & Finance', 'accounting-finance', 'Calculator', 'Bookkeeping, GST & Income Tax compliance, financial audits, and debt financing.', 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_fin_id;

  INSERT INTO public.business_service_subcategories (category_id, name, slug, sort_order) VALUES
    (cat_fin_id, 'Accounting Services', 'accounting-services', 1),
    (cat_fin_id, 'Bookkeeping', 'bookkeeping', 2),
    (cat_fin_id, 'GST Return Filing', 'gst-return-filing', 3),
    (cat_fin_id, 'Income Tax Filing', 'income-tax-filing', 4),
    (cat_fin_id, 'Auditing', 'auditing', 5),
    (cat_fin_id, 'Financial Consultation', 'financial-consultation', 6),
    (cat_fin_id, 'Business Loan Consultation', 'business-loan-consultation', 7),
    (cat_fin_id, 'Insurance Consultation', 'insurance-consultation', 8)
  ON CONFLICT (slug) DO NOTHING;

  -- Category C: Branding & Marketing
  INSERT INTO public.business_service_categories (id, name, slug, icon, description, sort_order)
  VALUES (cat_mkt_id, 'Branding & Marketing', 'branding-marketing', 'Megaphone', 'Brand identity, package design, commercial photography, and omnichannel digital marketing.', 3)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_mkt_id;

  INSERT INTO public.business_service_subcategories (category_id, name, slug, sort_order) VALUES
    (cat_mkt_id, 'Logo Design', 'logo-design', 1),
    (cat_mkt_id, 'Brand Identity', 'brand-identity', 2),
    (cat_mkt_id, 'Packaging Design', 'packaging-design', 3),
    (cat_mkt_id, 'Product Photography', 'product-photography', 4),
    (cat_mkt_id, 'Website Development', 'website-development', 5),
    (cat_mkt_id, 'E-commerce Website', 'ecommerce-website', 6),
    (cat_mkt_id, 'Digital Marketing', 'digital-marketing', 7),
    (cat_mkt_id, 'Social Media Management', 'social-media-management', 8),
    (cat_mkt_id, 'SEO Services', 'seo-services', 9),
    (cat_mkt_id, 'Advertising Services', 'advertising-services', 10)
  ON CONFLICT (slug) DO NOTHING;

  -- Category D: Manufacturing & Product Development
  INSERT INTO public.business_service_categories (id, name, slug, icon, description, sort_order)
  VALUES (cat_mfg_id, 'Manufacturing & Product Development', 'manufacturing-product-development', 'Factory', 'R&D, lab testing, custom labeling, and private label production setup.', 4)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_mfg_id;

  INSERT INTO public.business_service_subcategories (category_id, name, slug, sort_order) VALUES
    (cat_mfg_id, 'Product Development', 'product-development', 1),
    (cat_mfg_id, 'Product Research', 'product-research', 2),
    (cat_mfg_id, 'Product Testing', 'product-testing', 3),
    (cat_mfg_id, 'Quality Testing', 'quality-testing', 4),
    (cat_mfg_id, 'Packaging Solutions', 'packaging-solutions', 5),
    (cat_mfg_id, 'Label Design', 'label-design', 6),
    (cat_mfg_id, 'Manufacturing Consultation', 'manufacturing-consultation', 7),
    (cat_mfg_id, 'Private Label Manufacturing', 'private-label-manufacturing', 8)
  ON CONFLICT (slug) DO NOTHING;

  -- Category E: Logistics & Supply Chain
  INSERT INTO public.business_service_categories (id, name, slug, icon, description, sort_order)
  VALUES (cat_log_id, 'Logistics & Supply Chain', 'logistics-supply-chain', 'Truck', 'Bulk road transport, bonded warehousing, freight forwarding, and 3PL dispatch solutions.', 5)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_log_id;

  INSERT INTO public.business_service_subcategories (category_id, name, slug, sort_order) VALUES
    (cat_log_id, 'Transport Services', 'transport-services', 1),
    (cat_log_id, 'Bulk Transportation', 'bulk-transportation', 2),
    (cat_log_id, 'Warehousing', 'warehousing', 3),
    (cat_log_id, 'Packaging & Shipping', 'packaging-shipping', 4),
    (cat_log_id, 'Freight Forwarding', 'freight-forwarding', 5),
    (cat_log_id, 'Import Export Assistance', 'import-export-assistance', 6),
    (cat_log_id, 'Supply Chain Consultation', 'supply-chain-consultation', 7)
  ON CONFLICT (slug) DO NOTHING;

  -- Category F: Technology & IT
  INSERT INTO public.business_service_categories (id, name, slug, icon, description, sort_order)
  VALUES (cat_tech_id, 'Technology & IT', 'technology-it', 'Cpu', 'ERP implementations, inventory management, billing software, CRM, and cloud engineering.', 6)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_tech_id;

  INSERT INTO public.business_service_subcategories (category_id, name, slug, sort_order) VALUES
    (cat_tech_id, 'Business Software', 'business-software', 1),
    (cat_tech_id, 'ERP Solutions', 'erp-solutions', 2),
    (cat_tech_id, 'Inventory Management Software', 'inventory-management-software', 3),
    (cat_tech_id, 'Billing Software', 'billing-software', 4),
    (cat_tech_id, 'CRM Solutions', 'crm-solutions', 5),
    (cat_tech_id, 'Mobile App Development', 'mobile-app-development', 6),
    (cat_tech_id, 'Custom Software Development', 'custom-software-development', 7),
    (cat_tech_id, 'IT Support', 'it-support', 8)
  ON CONFLICT (slug) DO NOTHING;

  -- Category G: Business Consulting
  INSERT INTO public.business_service_categories (id, name, slug, icon, description, sort_order)
  VALUES (cat_cns_id, 'Business Consulting', 'business-consulting', 'Briefcase', 'Advisory for business plan drafting, market expansion, franchising, and startup incubation.', 7)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_cns_id;

  INSERT INTO public.business_service_subcategories (category_id, name, slug, sort_order) VALUES
    (cat_cns_id, 'Business Plan Development', 'business-plan-development', 1),
    (cat_cns_id, 'Market Research', 'market-research', 2),
    (cat_cns_id, 'Financial Planning', 'financial-planning', 3),
    (cat_cns_id, 'Business Strategy', 'business-strategy', 4),
    (cat_cns_id, 'Franchise Consulting', 'franchise-consulting', 5),
    (cat_cns_id, 'Business Expansion Consulting', 'business-expansion-consulting', 6),
    (cat_cns_id, 'Startup Consulting', 'startup-consulting', 7)
  ON CONFLICT (slug) DO NOTHING;

END $$;
