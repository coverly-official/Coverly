-- ====================================================================
-- COVERLY B2B Wholesale Platform — Complete Business Services Marketplace v2
-- Migration: 20261117220000_business_services_marketplace_complete_v2.sql
-- ====================================================================

-- 1. Ensure all 11 Core Business Service Categories (A to K) with their complete subcategories
DO $$
DECLARE
  cat_reg UUID;
  cat_leg UUID;
  cat_fin UUID;
  cat_mkt UUID;
  cat_tech UUID;
  cat_mfg UUID;
  cat_pkg UUID;
  cat_tst UUID;
  cat_imp UUID;
  cat_log UUID;
  cat_cns UUID;
BEGIN
  -- A. Business Registration & Compliance
  INSERT INTO public.business_service_categories (name, slug, icon, description, sort_order)
  VALUES ('Business Registration & Compliance', 'business-registration-compliance', 'FileCheck', 'Company & LLP incorporation, MSME, GST, FSSAI, Shop & Establishment, Business Licences and Trademark Registration.', 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO cat_reg;

  INSERT INTO public.business_service_subcategories (category_id, name, slug, sort_order) VALUES
    (cat_reg, 'Company Registration', 'company-registration', 1),
    (cat_reg, 'LLP Registration', 'llp-registration', 2),
    (cat_reg, 'Proprietorship Registration', 'proprietorship-registration', 3),
    (cat_reg, 'GST Registration', 'gst-registration', 4),
    (cat_reg, 'MSME / Udyam Registration', 'msme-udyam-registration', 5),
    (cat_reg, 'FSSAI Registration', 'fssai-registration', 6),
    (cat_reg, 'Shop & Establishment Registration', 'shop-establishment-registration', 7),
    (cat_reg, 'Business Licence Assistance', 'business-licence-assistance', 8),
    (cat_reg, 'Trademark Registration', 'trademark-registration', 9),
    (cat_reg, 'Compliance Services', 'compliance-services', 10)
  ON CONFLICT (slug) DO NOTHING;

  -- B. Legal Services
  INSERT INTO public.business_service_categories (name, slug, icon, description, sort_order)
  VALUES ('Legal Services', 'legal-services', 'Scale', 'Legal consultation, corporate contracts, business agreements, IP protection, and regulatory dispute advisory.', 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO cat_leg;

  INSERT INTO public.business_service_subcategories (category_id, name, slug, sort_order) VALUES
    (cat_leg, 'Legal Consultation', 'legal-consultation', 1),
    (cat_leg, 'Business Agreements', 'business-agreements', 2),
    (cat_leg, 'Partnership Agreements', 'partnership-agreements', 3),
    (cat_leg, 'Contract Drafting', 'contract-drafting', 4),
    (cat_leg, 'Trademark Legal Assistance', 'trademark-legal-assistance', 5),
    (cat_leg, 'Company Compliance', 'company-compliance', 6),
    (cat_leg, 'Intellectual Property Services', 'intellectual-property-services', 7)
  ON CONFLICT (slug) DO NOTHING;

  -- C. Accounting & Finance
  INSERT INTO public.business_service_categories (name, slug, icon, description, sort_order)
  VALUES ('Accounting & Finance', 'accounting-finance', 'Calculator', 'Bookkeeping, GST & Income Tax filing, statutory auditing, payroll management, and corporate financial advisory.', 3)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO cat_fin;

  INSERT INTO public.business_service_subcategories (category_id, name, slug, sort_order) VALUES
    (cat_fin, 'Accounting Services', 'accounting-services', 1),
    (cat_fin, 'Bookkeeping', 'bookkeeping', 2),
    (cat_fin, 'GST Filing', 'gst-filing', 3),
    (cat_fin, 'Income Tax Filing', 'income-tax-filing', 4),
    (cat_fin, 'Financial Auditing', 'financial-auditing', 5),
    (cat_fin, 'Payroll Management', 'payroll-management', 6),
    (cat_fin, 'Financial Consultancy', 'financial-consultancy', 7),
    (cat_fin, 'Business Financial Reports', 'business-financial-reports', 8)
  ON CONFLICT (slug) DO NOTHING;

  -- D. Branding & Marketing
  INSERT INTO public.business_service_categories (name, slug, icon, description, sort_order)
  VALUES ('Branding & Marketing', 'branding-marketing', 'Megaphone', 'Brand identity, packaging design, digital marketing, SEO, advertising campaigns, and industrial product photography.', 4)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO cat_mkt;

  INSERT INTO public.business_service_subcategories (category_id, name, slug, sort_order) VALUES
    (cat_mkt, 'Logo Design', 'logo-design', 1),
    (cat_mkt, 'Brand Identity', 'brand-identity', 2),
    (cat_mkt, 'Packaging Design', 'packaging-design', 3),
    (cat_mkt, 'Social Media Management', 'social-media-management', 4),
    (cat_mkt, 'Digital Marketing', 'digital-marketing', 5),
    (cat_mkt, 'SEO', 'seo', 6),
    (cat_mkt, 'Google Business Profile Management', 'google-business-profile-management', 7),
    (cat_mkt, 'Advertising Campaigns', 'advertising-campaigns', 8),
    (cat_mkt, 'Product Photography', 'product-photography', 9),
    (cat_mkt, 'Video Production', 'video-production', 10)
  ON CONFLICT (slug) DO NOTHING;

  -- E. Technology & IT
  INSERT INTO public.business_service_categories (name, slug, icon, description, sort_order)
  VALUES ('Technology & IT', 'technology-it', 'Cpu', 'Enterprise ERP, CRM, custom web & mobile apps, billing software, and factory inventory automation.', 5)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO cat_tech;

  INSERT INTO public.business_service_subcategories (category_id, name, slug, sort_order) VALUES
    (cat_tech, 'Website Development', 'website-development', 1),
    (cat_tech, 'E-commerce Website', 'ecommerce-website', 2),
    (cat_tech, 'Mobile App Development', 'mobile-app-development', 3),
    (cat_tech, 'Custom Software', 'custom-software', 4),
    (cat_tech, 'ERP Development', 'erp-development', 5),
    (cat_tech, 'CRM Development', 'crm-development', 6),
    (cat_tech, 'Inventory Management Software', 'inventory-management-software', 7),
    (cat_tech, 'Billing Software', 'billing-software', 8),
    (cat_tech, 'Business Automation', 'business-automation', 9),
    (cat_tech, 'IT Support', 'it-support', 10)
  ON CONFLICT (slug) DO NOTHING;

  -- F. Manufacturing & Product Development
  INSERT INTO public.business_service_categories (name, slug, icon, description, sort_order)
  VALUES ('Manufacturing & Product Development', 'manufacturing-product-development', 'Factory', 'Product engineering, rapid prototyping, contract manufacturing, OEM & ODM consulting, and formulation.', 6)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO cat_mfg;

  INSERT INTO public.business_service_subcategories (category_id, name, slug, sort_order) VALUES
    (cat_mfg, 'Product Research', 'product-research', 1),
    (cat_mfg, 'Product Development', 'product-development', 2),
    (cat_mfg, 'Prototype Development', 'prototype-development', 3),
    (cat_mfg, 'Contract Manufacturing', 'contract-manufacturing', 4),
    (cat_mfg, 'Private Label Manufacturing', 'private-label-manufacturing', 5),
    (cat_mfg, 'OEM / ODM Services', 'oem-odm-services', 6),
    (cat_mfg, 'Product Formulation', 'product-formulation', 7),
    (cat_mfg, 'Manufacturing Consultancy', 'manufacturing-consultancy', 8)
  ON CONFLICT (slug) DO NOTHING;

  -- G. Packaging & Printing
  INSERT INTO public.business_service_categories (name, slug, icon, description, sort_order)
  VALUES ('Packaging & Printing', 'packaging-printing', 'Boxes', 'Custom cartons, flexible pouches, commercial offset printing, container packaging, and barcode labels.', 7)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO cat_pkg;

  INSERT INTO public.business_service_subcategories (category_id, name, slug, sort_order) VALUES
    (cat_pkg, 'Custom Packaging Design', 'custom-packaging-design', 1),
    (cat_pkg, 'Packaging Manufacturing', 'packaging-manufacturing', 2),
    (cat_pkg, 'Label Design', 'label-design', 3),
    (cat_pkg, 'Label Printing', 'label-printing', 4),
    (cat_pkg, 'Carton Manufacturing', 'carton-manufacturing', 5),
    (cat_pkg, 'Pouch Manufacturing', 'pouch-manufacturing', 6),
    (cat_pkg, 'Bottle & Container Packaging', 'bottle-container-packaging', 7),
    (cat_pkg, 'Branding & Packaging Consultancy', 'branding-packaging-consultancy', 8)
  ON CONFLICT (slug) DO NOTHING;

  -- H. Testing & Quality
  INSERT INTO public.business_service_categories (name, slug, icon, description, sort_order)
  VALUES ('Testing & Quality', 'testing-quality', 'CheckCheck', 'NABL accredited laboratory testing, food & chemical safety, BIS certification, and factory QC inspection.', 8)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO cat_tst;

  INSERT INTO public.business_service_subcategories (category_id, name, slug, sort_order) VALUES
    (cat_tst, 'Laboratory Testing', 'laboratory-testing', 1),
    (cat_tst, 'Food Testing', 'food-testing', 2),
    (cat_tst, 'Product Quality Inspection', 'product-quality-inspection', 3),
    (cat_tst, 'Material Testing', 'material-testing', 4),
    (cat_tst, 'Packaging Testing', 'packaging-testing', 5),
    (cat_tst, 'Quality Control Consultancy', 'quality-control-consultancy', 6),
    (cat_tst, 'Certification Assistance', 'certification-assistance', 7)
  ON CONFLICT (slug) DO NOTHING;

  -- I. Import & Export Services
  INSERT INTO public.business_service_categories (name, slug, icon, description, sort_order)
  VALUES ('Import & Export Services', 'import-export-services', 'Globe', 'Cross-border trade advisory, customs clearance coordination, shipping documentation, and international sourcing.', 9)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO cat_imp;

  INSERT INTO public.business_service_subcategories (category_id, name, slug, sort_order) VALUES
    (cat_imp, 'Import Consultancy', 'import-consultancy', 1),
    (cat_imp, 'Export Consultancy', 'export-consultancy', 2),
    (cat_imp, 'Documentation Assistance', 'documentation-assistance', 3),
    (cat_imp, 'Customs Clearance Coordination', 'customs-clearance-coordination', 4),
    (cat_imp, 'International Sourcing', 'international-sourcing', 5),
    (cat_imp, 'Trade Compliance Assistance', 'trade-compliance-assistance', 6),
    (cat_imp, 'Freight Consultancy', 'freight-consultancy', 7)
  ON CONFLICT (slug) DO NOTHING;

  -- J. Logistics & Supply Chain Consultancy
  INSERT INTO public.business_service_categories (name, slug, icon, description, sort_order)
  VALUES ('Logistics & Supply Chain Consultancy', 'logistics-supply-chain-consultancy', 'Truck', 'Warehousing design, inventory optimization, distribution planning, and logistics cost analysis.', 10)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO cat_log;

  INSERT INTO public.business_service_subcategories (category_id, name, slug, sort_order) VALUES
    (cat_log, 'Supply Chain Planning', 'supply-chain-planning', 1),
    (cat_log, 'Warehouse Consultancy', 'warehouse-consultancy', 2),
    (cat_log, 'Inventory Planning', 'inventory-planning', 3),
    (cat_log, 'Transportation Planning', 'transportation-planning', 4),
    (cat_log, 'Distribution Strategy', 'distribution-strategy', 5),
    (cat_log, 'Logistics Cost Analysis', 'logistics-cost-analysis', 6)
  ON CONFLICT (slug) DO NOTHING;

  -- K. Business Consulting
  INSERT INTO public.business_service_categories (name, slug, icon, description, sort_order)
  VALUES ('Business Consulting', 'business-consulting', 'Briefcase', 'Startup mentorship, corporate growth strategy, market research, franchise advisory, and business expansion planning.', 11)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO cat_cns;

  INSERT INTO public.business_service_subcategories (category_id, name, slug, sort_order) VALUES
    (cat_cns, 'Business Planning', 'business-planning', 1),
    (cat_cns, 'Market Research', 'market-research', 2),
    (cat_cns, 'Business Strategy', 'business-strategy', 3),
    (cat_cns, 'Financial Planning', 'financial-planning', 4),
    (cat_cns, 'Franchise Consultancy', 'franchise-consultancy', 5),
    (cat_cns, 'Startup Consultancy', 'startup-consultancy', 6),
    (cat_cns, 'Business Expansion Planning', 'business-expansion-planning', 7)
  ON CONFLICT (slug) DO NOTHING;

END $$;

-- 2. Enhance business_services table with complete metadata columns
ALTER TABLE public.business_services ADD COLUMN IF NOT EXISTS service_location TEXT;
ALTER TABLE public.business_services ADD COLUMN IF NOT EXISTS remote_on_site TEXT DEFAULT 'remote';
ALTER TABLE public.business_services ADD COLUMN IF NOT EXISTS requirements_from_customer TEXT;
ALTER TABLE public.business_services ADD COLUMN IF NOT EXISTS portfolio_images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.business_services ADD COLUMN IF NOT EXISTS supporting_documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.business_services ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved';
ALTER TABLE public.business_services ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

-- 3. Service Provider Registration Documents Table
CREATE TABLE IF NOT EXISTS public.service_provider_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_key TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  admin_notes TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_spd_business ON public.service_provider_documents(business_id);

-- 4. Service Quotation Negotiations / Messaging Table
CREATE TABLE IF NOT EXISTS public.service_quotation_negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES public.service_request_quotations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id),
  sender_role TEXT NOT NULL DEFAULT 'customer' CHECK (sender_role IN ('customer', 'provider', 'admin')),
  message TEXT NOT NULL,
  proposed_price NUMERIC(12, 2),
  proposed_turnaround_days INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sqn_quote ON public.service_quotation_negotiations(quotation_id);

-- 5. Enable RLS on New Tables
ALTER TABLE public.service_provider_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_quotation_negotiations ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
CREATE POLICY "Admins full read on provider docs" ON public.service_provider_documents FOR ALL USING (true);
CREATE POLICY "Public read bs quote negotiations" ON public.service_quotation_negotiations FOR ALL USING (true);
