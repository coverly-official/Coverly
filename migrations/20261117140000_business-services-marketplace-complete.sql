-- ====================================================================
-- COVERLY B2B Wholesale Platform — Complete Business Services Marketplace
-- Migration: 20261117140000_business_services_marketplace_complete.sql
-- ====================================================================

-- 1. Ensure all 10 Core Business Service Categories exist
DO $$
DECLARE
  cat_reg UUID := gen_random_uuid();
  cat_fin UUID := gen_random_uuid();
  cat_mkt UUID := gen_random_uuid();
  cat_tech UUID := gen_random_uuid();
  cat_mfg UUID := gen_random_uuid();
  cat_pkg UUID := gen_random_uuid();
  cat_tst UUID := gen_random_uuid();
  cat_imp UUID := gen_random_uuid();
  cat_log UUID := gen_random_uuid();
  cat_cns UUID := gen_random_uuid();
BEGIN
  -- 1. Business Registration & Compliance
  INSERT INTO public.business_service_categories (id, name, slug, icon, description, sort_order)
  VALUES (cat_reg, 'Business Registration & Compliance', 'business-registration-compliance', 'FileCheck', 'Company & LLP incorporation, MSME, GST, Trademark, IEC & Trade Licenses.', 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_reg;

  INSERT INTO public.business_service_subcategories (category_id, name, slug, sort_order) VALUES
    (cat_reg, 'Company Registration', 'company-registration-pvt', 1),
    (cat_reg, 'LLP Registration', 'llp-registration-inc', 2),
    (cat_reg, 'MSME Registration', 'msme-registration-udyam', 3),
    (cat_reg, 'GST Registration', 'gst-registration-services', 4),
    (cat_reg, 'Trademark Registration', 'trademark-registration-ip', 5),
    (cat_reg, 'Business Licenses', 'business-licenses-trade', 6),
    (cat_reg, 'Import Export Code (IEC)', 'import-export-code-cert', 7),
    (cat_reg, 'Legal Documentation & Drafting', 'legal-documentation-drafting', 8)
  ON CONFLICT (slug) DO NOTHING;

  -- 2. Accounting & Finance
  INSERT INTO public.business_service_categories (id, name, slug, icon, description, sort_order)
  VALUES (cat_fin, 'Accounting & Finance', 'accounting-finance', 'Calculator', 'Bookkeeping, GST & Income Tax return filing, auditing, and corporate financial advisory.', 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_fin;

  INSERT INTO public.business_service_subcategories (category_id, name, slug, sort_order) VALUES
    (cat_fin, 'Accounting Services', 'accounting-services-ca', 1),
    (cat_fin, 'Bookkeeping & Tally/Zoho', 'bookkeeping-cloud', 2),
    (cat_fin, 'GST Return Filing', 'gst-return-filing-tax', 3),
    (cat_fin, 'Income Tax Filing (ITR)', 'income-tax-filing-corp', 4),
    (cat_fin, 'Statutory & Internal Auditing', 'statutory-internal-auditing', 5),
    (cat_fin, 'Financial Consulting', 'financial-consulting-cfo', 6),
    (cat_fin, 'Business Financial Planning', 'business-financial-planning-cf', 7)
  ON CONFLICT (slug) DO NOTHING;

  -- 3. Branding & Marketing
  INSERT INTO public.business_service_categories (id, name, slug, icon, description, sort_order)
  VALUES (cat_mkt, 'Branding & Marketing', 'branding-marketing', 'Megaphone', 'Brand identity, packaging design, digital performance marketing, and industrial product photography.', 3)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_mkt;

  INSERT INTO public.business_service_subcategories (category_id, name, slug, sort_order) VALUES
    (cat_mkt, 'Logo & Visual Identity', 'logo-visual-identity', 1),
    (cat_mkt, 'Brand Identity Guidelines', 'brand-identity-guidelines', 2),
    (cat_mkt, 'Packaging & Box Design', 'packaging-box-design', 3),
    (cat_mkt, 'Digital Marketing & Lead Gen', 'digital-marketing-lead-gen', 4),
    (cat_mkt, 'Social Media Management', 'social-media-management-b2b', 5),
    (cat_mkt, 'SEO Services', 'seo-services-b2b', 6),
    (cat_mkt, 'Performance Marketing & PPC', 'performance-marketing-ppc', 7),
    (cat_mkt, 'Industrial Product Photography', 'industrial-product-photography', 8)
  ON CONFLICT (slug) DO NOTHING;

  -- 4. Technology & IT
  INSERT INTO public.business_service_categories (id, name, slug, icon, description, sort_order)
  VALUES (cat_tech, 'Technology & IT', 'technology-it', 'Cpu', 'Enterprise ERP, CRM, custom web & mobile apps, and factory inventory automation.', 4)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_tech;

  INSERT INTO public.business_service_subcategories (category_id, name, slug, sort_order) VALUES
    (cat_tech, 'Website Development', 'website-development-corp', 1),
    (cat_tech, 'E-commerce Development', 'ecommerce-development-b2b', 2),
    (cat_tech, 'Mobile App Development', 'mobile-app-development-native', 3),
    (cat_tech, 'Custom Software Engineering', 'custom-software-engineering', 4),
    (cat_tech, 'ERP and CRM Development', 'erp-crm-development-saas', 5),
    (cat_tech, 'Cloud Services & AWS/Azure', 'cloud-services-deployment', 6),
    (cat_tech, 'IT Consulting & Cybersecurity', 'it-consulting-cybersecurity', 7),
    (cat_tech, 'Website & Server Maintenance', 'website-server-maintenance', 8)
  ON CONFLICT (slug) DO NOTHING;

  -- 5. Manufacturing & Product Development
  INSERT INTO public.business_service_categories (id, name, slug, icon, description, sort_order)
  VALUES (cat_mfg, 'Manufacturing & Product Development', 'manufacturing-product-development', 'Factory', 'Product engineering, rapid prototyping, contract manufacturing, OEM & ODM consulting.', 5)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_mfg;

  INSERT INTO public.business_service_subcategories (category_id, name, slug, sort_order) VALUES
    (cat_mfg, 'Product Development & CAD', 'product-development-cad', 1),
    (cat_mfg, 'Prototype Development & 3D Print', 'prototype-development-3d', 2),
    (cat_mfg, 'Contract Manufacturing Sourcing', 'contract-manufacturing-sourcing', 3),
    (cat_mfg, 'OEM Manufacturing Support', 'oem-manufacturing-support', 4),
    (cat_mfg, 'ODM Design Services', 'odm-design-services', 5),
    (cat_mfg, 'Industrial Engineering Design', 'industrial-engineering-design', 6),
    (cat_mfg, 'Machinery Consulting & Setup', 'machinery-consulting-setup', 7)
  ON CONFLICT (slug) DO NOTHING;

  -- 6. Packaging & Printing
  INSERT INTO public.business_service_categories (id, name, slug, icon, description, sort_order)
  VALUES (cat_pkg, 'Packaging & Printing', 'packaging-printing', 'Boxes', 'Custom corrugated cartons, flexible pouches, commercial offset printing, and barcode labels.', 6)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_pkg;

  INSERT INTO public.business_service_subcategories (category_id, name, slug, sort_order) VALUES
    (cat_pkg, 'Product Packaging Fabrication', 'product-packaging-fabrication', 1),
    (cat_pkg, 'Label Design & Roll Printing', 'label-design-roll-printing', 2),
    (cat_pkg, 'Carton Manufacturing', 'carton-manufacturing-corrugated', 3),
    (cat_pkg, 'Flexible Pouch Packaging', 'flexible-pouch-packaging', 4),
    (cat_pkg, 'Commercial Offset Printing', 'commercial-offset-printing', 5),
    (cat_pkg, 'Barcode and RFID Label Solutions', 'barcode-rfid-label-solutions', 6)
  ON CONFLICT (slug) DO NOTHING;

  -- 7. Testing & Quality
  INSERT INTO public.business_service_categories (id, name, slug, icon, description, sort_order)
  VALUES (cat_tst, 'Testing & Quality', 'testing-quality', 'CheckCheck', 'NABL accredited laboratory testing, food & chemical safety, BIS certification, and factory QC inspection.', 7)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_tst;

  INSERT INTO public.business_service_subcategories (category_id, name, slug, sort_order) VALUES
    (cat_tst, 'Product Quality Testing', 'product-quality-testing-nabl', 1),
    (cat_tst, 'Laboratory Chemical Testing', 'laboratory-chemical-testing', 2),
    (cat_tst, 'Food & Beverage Testing', 'food-beverage-testing-fssai', 3),
    (cat_tst, 'Material & Tensile Testing', 'material-tensile-testing', 4),
    (cat_tst, 'Product Certification Assistance (BIS/CE)', 'product-certification-assistance', 5),
    (cat_tst, 'Third-Party Quality Control Inspection', 'third-party-qc-inspection', 6)
  ON CONFLICT (slug) DO NOTHING;

  -- 8. Import & Export
  INSERT INTO public.business_service_categories (id, name, slug, icon, description, sort_order)
  VALUES (cat_imp, 'Import & Export', 'import-export', 'Globe', 'Cross-border trade advisory, customs clearance, shipping documentation, and international sourcing.', 8)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_imp;

  INSERT INTO public.business_service_subcategories (category_id, name, slug, sort_order) VALUES
    (cat_imp, 'Import Export Consulting', 'import-export-consulting-trade', 1),
    (cat_imp, 'Customs Clearance Assistance', 'customs-clearance-assistance', 2),
    (cat_imp, 'Export Documentation & Compliance', 'export-documentation-compliance', 3),
    (cat_imp, 'International Sourcing Advisory', 'international-sourcing-advisory', 4),
    (cat_imp, 'Export Market Research', 'export-market-research-global', 5)
  ON CONFLICT (slug) DO NOTHING;

  -- 9. Logistics & Supply Chain Consulting
  INSERT INTO public.business_service_categories (id, name, slug, icon, description, sort_order)
  VALUES (cat_log, 'Logistics & Supply Chain Consulting', 'logistics-supply-chain-consulting', 'Truck', 'Warehousing design, inventory optimization, distribution planning, and multimodal freight optimization.', 9)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_log;

  INSERT INTO public.business_service_subcategories (category_id, name, slug, sort_order) VALUES
    (cat_log, 'Supply Chain Consulting', 'supply-chain-consulting-advisory', 1),
    (cat_log, 'Warehouse Layout & Design', 'warehouse-layout-design', 2),
    (cat_log, 'Inventory Planning & Optimization', 'inventory-planning-optimization', 3),
    (cat_log, 'Distribution Network Planning', 'distribution-network-planning', 4),
    (cat_log, 'Freight & 3PL Consulting', 'freight-3pl-consulting', 5)
  ON CONFLICT (slug) DO NOTHING;

  -- 10. Business Consulting
  INSERT INTO public.business_service_categories (id, name, slug, icon, description, sort_order)
  VALUES (cat_cns, 'Business Consulting', 'business-consulting-strategy', 'Briefcase', 'Startup mentorship, corporate growth strategy, market feasibility, and operational process re-engineering.', 10)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_cns;

  INSERT INTO public.business_service_subcategories (category_id, name, slug, sort_order) VALUES
    (cat_cns, 'Startup Advisory & Incorporation', 'startup-advisory-incorporation', 1),
    (cat_cns, 'Business Strategy & Scaling', 'business-strategy-scaling', 2),
    (cat_cns, 'Market Research & Feasibility', 'market-research-feasibility', 3),
    (cat_cns, 'Operations & Lean Consulting', 'operations-lean-consulting', 4),
    (cat_cns, 'Business Process Re-engineering', 'business-process-re-engineering', 5)
  ON CONFLICT (slug) DO NOTHING;

END $$;

-- 2. Business Service Packages Table (Multi-Tier Packages per Service)
CREATE TABLE IF NOT EXISTS public.business_service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.business_services(id) ON DELETE CASCADE,
  package_tier TEXT NOT NULL CHECK (package_tier IN ('basic', 'standard', 'premium', 'custom')),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  turnaround_days INT NOT NULL DEFAULT 3,
  deliverables JSONB DEFAULT '[]'::jsonb,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bs_pkg_service ON public.business_service_packages(service_id);

-- 3. Enhance Service Requests (Enquiries) to Support Unregistered Guests & Multi-Provider Dispatch
ALTER TABLE public.service_requests ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE public.service_requests ALTER COLUMN provider_business_id DROP NOT NULL;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS guest_phone TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS guest_business_name TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.business_service_categories(id);
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS supporting_files JSONB DEFAULT '[]'::jsonb;

-- 4. Service Enquiry Multi-Recipient Association
CREATE TABLE IF NOT EXISTS public.service_enquiry_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  provider_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'quoted', 'declined')),
  decline_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(enquiry_id, provider_business_id)
);
CREATE INDEX IF NOT EXISTS idx_ser_enquiry ON public.service_enquiry_recipients(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_ser_provider ON public.service_enquiry_recipients(provider_business_id);

-- 5. Service Projects Table (Created upon Quotation Acceptance)
CREATE TABLE IF NOT EXISTS public.service_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_number TEXT NOT NULL UNIQUE,
  request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL,
  quotation_id UUID REFERENCES public.service_request_quotations(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES public.users(id),
  provider_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.business_services(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  scope_of_work TEXT,
  agreed_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'project_created' CHECK (status IN (
    'project_created', 'awaiting_start', 'in_progress', 'waiting_for_customer',
    'under_review', 'revision_requested', 'completed', 'cancelled', 'disputed'
  )),
  start_date DATE,
  target_completion_date DATE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sproj_customer ON public.service_projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_sproj_provider ON public.service_projects(provider_business_id);
CREATE INDEX IF NOT EXISTS idx_sproj_status ON public.service_projects(status);

-- 6. Service Project Milestones
CREATE TABLE IF NOT EXISTS public.service_project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.service_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'approved')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sproj_milestones_proj ON public.service_project_milestones(project_id);

-- 7. Service Project Deliverables
CREATE TABLE IF NOT EXISTS public.service_project_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.service_projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.service_project_milestones(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  file_url TEXT,
  file_key TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'revision_requested', 'approved')),
  customer_feedback TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sproj_deliv_proj ON public.service_project_deliverables(project_id);

-- 8. Service Project Status History
CREATE TABLE IF NOT EXISTS public.service_project_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.service_projects(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES public.users(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sproj_history ON public.service_project_status_history(project_id);

-- 9. Service Customer Reviews (Eligible after project completion)
CREATE TABLE IF NOT EXISTS public.service_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.service_projects(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.business_services(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES public.users(id),
  provider_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_srev_provider ON public.service_reviews(provider_business_id);
CREATE INDEX IF NOT EXISTS idx_srev_service ON public.service_reviews(service_id);

-- 10. Service Complaints & Dispute Resolution
CREATE TABLE IF NOT EXISTS public.service_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_number TEXT NOT NULL UNIQUE,
  project_id UUID REFERENCES public.service_projects(id) ON DELETE SET NULL,
  request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL,
  complainant_user_id UUID NOT NULL REFERENCES public.users(id),
  provider_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  complaint_type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  resolution_notes TEXT,
  admin_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scomp_provider ON public.service_complaints(provider_business_id);
CREATE INDEX IF NOT EXISTS idx_scomp_user ON public.service_complaints(complainant_user_id);

-- 11. Service Provider Verification History (Admin Audit Log)
CREATE TABLE IF NOT EXISTS public.service_provider_verification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES public.users(id),
  previous_status TEXT,
  new_status TEXT NOT NULL,
  action TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sp_verif_hist_biz ON public.service_provider_verification_history(business_id);

-- 12. Service Communications & Messaging Threads
CREATE TABLE IF NOT EXISTS public.service_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.service_projects(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.users(id),
  provider_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.service_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.service_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id),
  sender_role TEXT NOT NULL CHECK (sender_role IN ('customer', 'provider', 'admin')),
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sm_conv ON public.service_messages(conversation_id);

-- 13. Enable RLS on New Entities
ALTER TABLE public.business_service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_enquiry_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_project_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_project_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_provider_verification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_messages ENABLE ROW LEVEL SECURITY;

-- 14. Public Read Policies for Published Packages and Reviews
CREATE POLICY "Public read bs packages" ON public.business_service_packages FOR SELECT USING (is_active = true);
CREATE POLICY "Public read bs reviews" ON public.service_reviews FOR SELECT USING (true);
