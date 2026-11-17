-- ====================================================================
-- COVERLY B2B Wholesale Platform — Employee Role & Governance System
-- Migration: 20261117210000_employee_role_management.sql
-- ====================================================================

-- 1. Extend business_members role_in_business check constraint
DO $$
BEGIN
  ALTER TABLE public.business_members DROP CONSTRAINT IF EXISTS business_members_role_in_business_check;
  ALTER TABLE public.business_members ADD CONSTRAINT business_members_role_in_business_check CHECK (
    role_in_business IN (
      'owner', 'business_manager', 
      'procurement_manager', 
      'purchase_staff', 'purchase_executive', 
      'finance_staff', 'accounts_executive', 
      'store_manager', 'staff', 'admin', 'sales', 'procurement', 'viewer'
    )
  );
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 2. Add branch_id to business_members and business_invitations
ALTER TABLE public.business_members 
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.business_branches(id) ON DELETE SET NULL;

ALTER TABLE public.business_invitations 
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.business_branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_business_members_branch ON public.business_members(branch_id);

-- 3. Extend business_invitations role check constraint
DO $$
BEGIN
  ALTER TABLE public.business_invitations DROP CONSTRAINT IF EXISTS business_invitations_role_in_business_check;
  ALTER TABLE public.business_invitations ADD CONSTRAINT business_invitations_role_in_business_check CHECK (
    role_in_business IN (
      'business_manager', 
      'procurement_manager', 
      'purchase_staff', 'purchase_executive', 
      'finance_staff', 'accounts_executive', 
      'store_manager', 'staff', 'admin', 'viewer'
    )
  );
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 4. Employee Activity Audit Log Table
CREATE TABLE IF NOT EXISTS public.employee_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.business_branches(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emp_act_business ON public.employee_activity_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_emp_act_user ON public.employee_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_emp_act_type ON public.employee_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_emp_act_created ON public.employee_activity_logs(created_at DESC);

-- 5. Purchase Invoices Table (Managed by Finance / Accounts Staff)
CREATE TABLE IF NOT EXISTS public.purchase_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  supplier_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE RESTRICT,
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  currency TEXT NOT NULL DEFAULT 'INR',
  subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
  freight_charges NUMERIC(12, 2) NOT NULL DEFAULT 0,
  additional_charges NUMERIC(12, 2) NOT NULL DEFAULT 0,
  gst_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.18,
  gst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid', 'disputed')),
  amount_paid NUMERIC(14, 2) NOT NULL DEFAULT 0,
  payment_reference TEXT,
  file_url TEXT,
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_invoices_biz ON public.purchase_invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_po ON public.purchase_invoices(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_status ON public.purchase_invoices(payment_status);

-- 6. Purchase Expenses Table (Freight, Packaging, Storage, Customs Charges)
CREATE TABLE IF NOT EXISTS public.purchase_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.purchase_invoices(id) ON DELETE SET NULL,
  expense_category TEXT NOT NULL CHECK (expense_category IN (
    'freight', 'packaging', 'insurance', 'loading_unloading', 'customs_duty', 'storage_warehouse', 'other'
  )),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  vendor_name TEXT,
  payment_reference TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_expenses_biz ON public.purchase_expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_purchase_expenses_po ON public.purchase_expenses(purchase_order_id);

-- 7. Enable RLS on New Tables
ALTER TABLE public.employee_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_expenses ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies
CREATE POLICY "Admins full read on employee activity" ON public.employee_activity_logs 
  FOR SELECT USING (true);

CREATE POLICY "Business members read own activity logs" ON public.employee_activity_logs 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.business_members 
      WHERE business_id = employee_activity_logs.business_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Business members read purchase invoices" ON public.purchase_invoices 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.business_members 
      WHERE business_id = purchase_invoices.business_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Business members manage purchase invoices" ON public.purchase_invoices 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.business_members 
      WHERE business_id = purchase_invoices.business_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Business members read purchase expenses" ON public.purchase_expenses 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.business_members 
      WHERE business_id = purchase_expenses.business_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Business members manage purchase expenses" ON public.purchase_expenses 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.business_members 
      WHERE business_id = purchase_expenses.business_id AND user_id = auth.uid()
    )
  );
