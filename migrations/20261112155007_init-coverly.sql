-- Coverly initial InsForge PostgreSQL migration

-- 1. Product Categories
CREATE TABLE IF NOT EXISTS public.product_categories (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'pc',
  default_qty INTEGER NOT NULL DEFAULT 500,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id TEXT NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT TRUE,
  unit_price NUMERIC(12, 2) NOT NULL,
  moq INTEGER NOT NULL,
  freight NUMERIC(12, 2) NOT NULL,
  gst_rate NUMERIC(5, 4) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_category_id ON public.suppliers(category_id);

-- 3. Concierge Sourcing Leads (Footer Form)
CREATE TABLE IF NOT EXISTS public.concierge_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  business TEXT NOT NULL,
  phone TEXT NOT NULL,
  category TEXT NOT NULL,
  requirement TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_concierge_leads_created_at ON public.concierge_leads(created_at DESC);

-- 4. RFQ Calculation Logs
CREATE TABLE IF NOT EXISTS public.rfq_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  destination_city TEXT NOT NULL,
  best_supplier TEXT,
  best_landed_per_unit NUMERIC(12, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security Policies
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concierge_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read product_categories" ON public.product_categories;
CREATE POLICY "Public read product_categories" ON public.product_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read suppliers" ON public.suppliers;
CREATE POLICY "Public read suppliers" ON public.suppliers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert concierge_leads" ON public.concierge_leads;
CREATE POLICY "Public insert concierge_leads" ON public.concierge_leads
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public insert rfq_logs" ON public.rfq_logs;
CREATE POLICY "Public insert rfq_logs" ON public.rfq_logs
  FOR INSERT WITH CHECK (true);

-- Seed Initial Categories & Suppliers
INSERT INTO public.product_categories (id, label, unit, default_qty) VALUES
  ('cotton-tshirts', 'Cotton T-Shirts (Round Neck)', 'pc', 500),
  ('corrugated-boxes', 'Corrugated Boxes (5-ply, 12x10x8)', 'pc', 1000),
  ('mild-steel-rods', 'Mild Steel Rods (12mm TMT)', 'kg', 2000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.suppliers (category_id, name, city, verified, unit_price, moq, freight, gst_rate)
SELECT 'cotton-tshirts', 'Tiruppur Knits', 'Tiruppur', true, 212, 300, 3200, 0.05
WHERE NOT EXISTS (SELECT 1 FROM public.suppliers WHERE category_id = 'cotton-tshirts' AND name = 'Tiruppur Knits');

INSERT INTO public.suppliers (category_id, name, city, verified, unit_price, moq, freight, gst_rate)
SELECT 'cotton-tshirts', 'Surat Textile Hub', 'Surat', true, 196, 500, 9800, 0.05
WHERE NOT EXISTS (SELECT 1 FROM public.suppliers WHERE category_id = 'cotton-tshirts' AND name = 'Surat Textile Hub');

INSERT INTO public.suppliers (category_id, name, city, verified, unit_price, moq, freight, gst_rate)
SELECT 'cotton-tshirts', 'Ludhiana Garments Co', 'Ludhiana', true, 205, 250, 2400, 0.05
WHERE NOT EXISTS (SELECT 1 FROM public.suppliers WHERE category_id = 'cotton-tshirts' AND name = 'Ludhiana Garments Co');

INSERT INTO public.suppliers (category_id, name, city, verified, unit_price, moq, freight, gst_rate)
SELECT 'corrugated-boxes', 'Rajkot Packaging', 'Rajkot', true, 38, 1000, 4500, 0.18
WHERE NOT EXISTS (SELECT 1 FROM public.suppliers WHERE category_id = 'corrugated-boxes' AND name = 'Rajkot Packaging');

INSERT INTO public.suppliers (category_id, name, city, verified, unit_price, moq, freight, gst_rate)
SELECT 'corrugated-boxes', 'Nagpur Box Works', 'Nagpur', false, 42, 500, 1800, 0.18
WHERE NOT EXISTS (SELECT 1 FROM public.suppliers WHERE category_id = 'corrugated-boxes' AND name = 'Nagpur Box Works');

INSERT INTO public.suppliers (category_id, name, city, verified, unit_price, moq, freight, gst_rate)
SELECT 'corrugated-boxes', 'Indore Corr-Pack', 'Indore', true, 40, 300, 2200, 0.18
WHERE NOT EXISTS (SELECT 1 FROM public.suppliers WHERE category_id = 'corrugated-boxes' AND name = 'Indore Corr-Pack');

INSERT INTO public.suppliers (category_id, name, city, verified, unit_price, moq, freight, gst_rate)
SELECT 'mild-steel-rods', 'Raipur Steel Traders', 'Raipur', true, 58, 2000, 6200, 0.18
WHERE NOT EXISTS (SELECT 1 FROM public.suppliers WHERE category_id = 'mild-steel-rods' AND name = 'Raipur Steel Traders');

INSERT INTO public.suppliers (category_id, name, city, verified, unit_price, moq, freight, gst_rate)
SELECT 'mild-steel-rods', 'Bhilai Iron and Steel', 'Bhilai', true, 55, 5000, 3800, 0.18
WHERE NOT EXISTS (SELECT 1 FROM public.suppliers WHERE category_id = 'mild-steel-rods' AND name = 'Bhilai Iron and Steel');

INSERT INTO public.suppliers (category_id, name, city, verified, unit_price, moq, freight, gst_rate)
SELECT 'mild-steel-rods', 'Jamshedpur Metals', 'Jamshedpur', true, 52, 1000, 8900, 0.18
WHERE NOT EXISTS (SELECT 1 FROM public.suppliers WHERE category_id = 'mild-steel-rods' AND name = 'Jamshedpur Metals');
