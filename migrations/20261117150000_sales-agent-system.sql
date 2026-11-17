-- ====================================================================
-- COVERLY B2B Wholesale Platform — Sales Agent & Business Representative System
-- Migration: 20261117150000_sales_agent_system.sql
-- ====================================================================

-- 1. Extend user_roles check constraint to include sales_agent and sales_manager
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check 
  CHECK (role IN (
    'buyer', 'manufacturer', 'wholesaler', 'distributor',
    'buyer_supplier', 'service_provider', 'sales_agent', 'sales_manager',
    'admin', 'verification_admin', 'support_admin', 'finance_admin'
  ));

-- 2. Sales Agent & Representative Profiles
CREATE TABLE IF NOT EXISTS public.sales_agent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  agent_type TEXT NOT NULL DEFAULT 'independent' CHECK (agent_type IN ('independent', 'company_representative')),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  bio TEXT,
  profile_photo_url TEXT,
  affiliated_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  product_categories TEXT[] DEFAULT '{}',
  service_categories TEXT[] DEFAULT '{}',
  operating_cities TEXT[] DEFAULT '{}',
  operating_states TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  experience_years INT NOT NULL DEFAULT 0,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
  is_public_discovery_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  slug TEXT UNIQUE,
  total_leads_assigned INT NOT NULL DEFAULT 0,
  total_conversions INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sa_user ON public.sales_agent_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_sa_business ON public.sales_agent_profiles(affiliated_business_id);
CREATE INDEX IF NOT EXISTS idx_sa_verification ON public.sales_agent_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_sa_public ON public.sales_agent_profiles(is_public_discovery_enabled);

-- 3. Sales Leads & Business Requirements
CREATE TABLE IF NOT EXISTS public.sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  guest_company TEXT,
  requirement_category TEXT NOT NULL,
  product_or_service TEXT NOT NULL,
  quantity TEXT,
  budget NUMERIC(14, 2),
  location_city TEXT,
  location_state TEXT,
  description TEXT NOT NULL,
  assigned_agent_id UUID REFERENCES public.sales_agent_profiles(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN (
    'new', 'assigned', 'contacted', 'interested', 'followup_required',
    'quotation_requested', 'negotiation', 'converted', 'lost', 'closed'
  )),
  lead_source TEXT NOT NULL DEFAULT 'guest_web',
  target_supplier_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  linked_rfq_id UUID REFERENCES public.rfqs(id) ON DELETE SET NULL,
  linked_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  converted_transaction_value NUMERIC(14, 2) DEFAULT 0,
  converted_at TIMESTAMPTZ,
  lost_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sl_agent ON public.sales_leads(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_sl_status ON public.sales_leads(status);
CREATE INDEX IF NOT EXISTS idx_sl_category ON public.sales_leads(requirement_category);

-- 4. Sales Lead Follow-ups
CREATE TABLE IF NOT EXISTS public.sales_lead_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.sales_leads(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.sales_agent_profiles(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  followup_type TEXT NOT NULL DEFAULT 'phone_call' CHECK (followup_type IN ('phone_call', 'video_meeting', 'factory_visit', 'whatsapp_email', 'quotation_review')),
  outcome_notes TEXT,
  next_action TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_slf_lead ON public.sales_lead_followups(lead_id);
CREATE INDEX IF NOT EXISTS idx_slf_agent ON public.sales_lead_followups(agent_id);

-- 5. Sales Lead Activity Audit Trail
CREATE TABLE IF NOT EXISTS public.sales_lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.sales_leads(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.users(id),
  activity_type TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sla_lead ON public.sales_lead_activities(lead_id);

-- 6. Configurable Sales Commission Rules
CREATE TABLE IF NOT EXISTS public.sales_commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  commission_type TEXT NOT NULL DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed_amount')),
  commission_rate NUMERIC(6, 2) NOT NULL DEFAULT 2.00, -- default 2%
  fixed_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  applicable_category TEXT NOT NULL DEFAULT 'all',
  min_transaction_value NUMERIC(12, 2) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default standard rules
INSERT INTO public.sales_commission_rules (rule_name, commission_type, commission_rate, applicable_category, min_transaction_value)
VALUES 
  ('Standard Industrial Goods Commission', 'percentage', 2.00, 'all', 50000),
  ('High-Value Machinery & Plant Commission', 'percentage', 1.50, 'Industrial Machinery', 500000),
  ('Business Registration & Compliance Retainer', 'fixed_amount', 1500, 'Business Registration & Compliance', 10000)
ON CONFLICT DO NOTHING;

-- 7. Sales Commission Records
CREATE TABLE IF NOT EXISTS public.sales_commission_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_number TEXT NOT NULL UNIQUE,
  agent_id UUID NOT NULL REFERENCES public.sales_agent_profiles(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.sales_leads(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  qualifying_transaction_value NUMERIC(14, 2) NOT NULL,
  calculated_commission NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_verification' CHECK (status IN (
    'not_eligible', 'pending_verification', 'approved', 'rejected', 'payable', 'paid'
  )),
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMPTZ,
  payout_reference TEXT,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scr_agent ON public.sales_commission_records(agent_id);
CREATE INDEX IF NOT EXISTS idx_scr_status ON public.sales_commission_records(status);

-- 8. Enable Row Level Security
ALTER TABLE public.sales_agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_lead_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_commission_records ENABLE ROW LEVEL SECURITY;

-- 9. Public Read Policies
CREATE POLICY "Public read verified agents" ON public.sales_agent_profiles 
  FOR SELECT USING (is_public_discovery_enabled = true AND verification_status = 'verified');

CREATE POLICY "Public read active commission rules" ON public.sales_commission_rules 
  FOR SELECT USING (is_active = true);
