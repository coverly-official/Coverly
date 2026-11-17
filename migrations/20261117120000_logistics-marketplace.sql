-- ====================================================================
-- COVERLY B2B Platform — Multi-Logistics Marketplace Schema
-- Migration: 20261117120000_logistics_marketplace.sql
-- ====================================================================

-- 1. Logistics Profiles (Company fleet, categories, modes, coverage)
CREATE TABLE IF NOT EXISTS public.logistics_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  company_name TEXT,
  tagline TEXT,
  logo_url TEXT,
  description TEXT,
  operating_routes TEXT[] DEFAULT '{}',
  serviceable_states TEXT[] DEFAULT '{}',
  serviceable_cities TEXT[] DEFAULT '{}',
  transport_modes TEXT[] DEFAULT '{road}',
  logistics_categories TEXT[] DEFAULT '{ftl,ptl}',
  fleet_size INTEGER DEFAULT 1,
  vehicle_types TEXT[] DEFAULT '{}',
  tracking_support TEXT DEFAULT 'manual' CHECK (tracking_support IN ('manual', 'api')),
  rating NUMERIC(3, 2) DEFAULT 4.8,
  total_shipments_delivered INTEGER DEFAULT 0,
  minimum_shipment_weight_kg NUMERIC(10, 2) DEFAULT 1,
  gstin TEXT,
  pan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_logistics_profiles_biz ON public.logistics_profiles(business_id);

-- 2. Published Logistics Services (FTL, PTL, Express, Bulk Cargo, Cold Chain, Warehousing)
CREATE TABLE IF NOT EXISTS public.logistics_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('ftl', 'ptl', 'parcel', 'bulk', 'express', 'cold_chain', 'warehousing', 'container', 'freight_forwarding', 'packers_movers')),
  transport_mode TEXT NOT NULL CHECK (transport_mode IN ('road', 'rail', 'air', 'sea', 'multimodal')),
  description TEXT,
  pricing_model TEXT NOT NULL CHECK (pricing_model IN ('per_kg', 'per_km', 'per_package', 'per_vehicle', 'fixed_rate', 'custom_quote')),
  base_rate NUMERIC(12, 2) NOT NULL DEFAULT 0,
  min_charge NUMERIC(12, 2) NOT NULL DEFAULT 0,
  fuel_surcharge_percent NUMERIC(5, 2) DEFAULT 0,
  handling_charges NUMERIC(12, 2) DEFAULT 0,
  insurance_rate_percent NUMERIC(5, 2) DEFAULT 0,
  transit_time_days INTEGER DEFAULT 3,
  moderation_status TEXT NOT NULL DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'archived')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_logistics_services_company ON public.logistics_services(company_id);
CREATE INDEX IF NOT EXISTS idx_logistics_services_cat ON public.logistics_services(category);
CREATE INDEX IF NOT EXISTS idx_logistics_services_status ON public.logistics_services(moderation_status);

-- 3. Logistics Operating Routes
CREATE TABLE IF NOT EXISTS public.logistics_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  origin_state TEXT NOT NULL,
  origin_city TEXT NOT NULL,
  destination_state TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  distance_km INTEGER,
  estimated_transit_hours INTEGER DEFAULT 48,
  rate_per_kg NUMERIC(10, 2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_logistics_routes_comp ON public.logistics_routes(company_id);
CREATE INDEX IF NOT EXISTS idx_logistics_routes_origin ON public.logistics_routes(origin_city);
CREATE INDEX IF NOT EXISTS idx_logistics_routes_dest ON public.logistics_routes(destination_city);

-- 4. Customer / Guest Shipment Requests
CREATE TABLE IF NOT EXISTS public.shipment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  pickup_address TEXT NOT NULL,
  pickup_city TEXT NOT NULL,
  pickup_state TEXT NOT NULL,
  pickup_pincode TEXT NOT NULL,
  pickup_contact_name TEXT NOT NULL,
  pickup_contact_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_city TEXT NOT NULL,
  delivery_state TEXT NOT NULL,
  delivery_pincode TEXT NOT NULL,
  delivery_contact_name TEXT NOT NULL,
  delivery_contact_phone TEXT NOT NULL,
  goods_category TEXT NOT NULL,
  goods_description TEXT NOT NULL,
  weight_kg NUMERIC(10, 2) NOT NULL,
  dimensions_cm JSONB DEFAULT '{"length": 0, "width": 0, "height": 0}'::jsonb,
  packages_count INTEGER NOT NULL DEFAULT 1,
  package_type TEXT NOT NULL DEFAULT 'Box',
  is_fragile BOOLEAN DEFAULT FALSE,
  is_hazardous BOOLEAN DEFAULT FALSE,
  is_temperature_controlled BOOLEAN DEFAULT FALSE,
  declared_value_inr NUMERIC(12, 2) DEFAULT 0,
  preferred_pickup_date DATE NOT NULL,
  service_type_preference TEXT DEFAULT 'standard',
  target_vehicle_type TEXT,
  special_instructions TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'quotes_received', 'booked', 'cancelled', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shipment_requests_num ON public.shipment_requests(request_number);
CREATE INDEX IF NOT EXISTS idx_shipment_requests_status ON public.shipment_requests(status);
CREATE INDEX IF NOT EXISTS idx_shipment_requests_pickup ON public.shipment_requests(pickup_city);
CREATE INDEX IF NOT EXISTS idx_shipment_requests_delivery ON public.shipment_requests(delivery_city);

-- 5. Multi-Provider Enquiry Matching
CREATE TABLE IF NOT EXISTS public.logistics_enquiry_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_request_id UUID NOT NULL REFERENCES public.shipment_requests(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'viewed', 'quoted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_logistics_recip_req ON public.logistics_enquiry_recipients(shipment_request_id);
CREATE INDEX IF NOT EXISTS idx_logistics_recip_comp ON public.logistics_enquiry_recipients(company_id);

-- 6. Logistics Quotations
CREATE TABLE IF NOT EXISTS public.logistics_quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number TEXT NOT NULL UNIQUE,
  shipment_request_id UUID NOT NULL REFERENCES public.shipment_requests(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.logistics_services(id) ON DELETE SET NULL,
  base_freight NUMERIC(12, 2) NOT NULL,
  fuel_surcharge NUMERIC(12, 2) DEFAULT 0,
  handling_charges NUMERIC(12, 2) DEFAULT 0,
  pickup_drop_charges NUMERIC(12, 2) DEFAULT 0,
  insurance_charges NUMERIC(12, 2) DEFAULT 0,
  gst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_freight_inr NUMERIC(12, 2) NOT NULL,
  estimated_delivery_days INTEGER NOT NULL DEFAULT 3,
  pickup_window TEXT,
  transport_mode TEXT NOT NULL DEFAULT 'road',
  vehicle_allocated TEXT,
  terms_and_conditions TEXT,
  valid_until DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'accepted', 'rejected', 'expired', 'withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_logistics_quotes_req ON public.logistics_quotations(shipment_request_id);
CREATE INDEX IF NOT EXISTS idx_logistics_quotes_comp ON public.logistics_quotations(company_id);
CREATE INDEX IF NOT EXISTS idx_logistics_quotes_status ON public.logistics_quotations(status);

-- 7. Confirmed Shipment Bookings
CREATE TABLE IF NOT EXISTS public.logistics_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number TEXT NOT NULL UNIQUE,
  tracking_number TEXT NOT NULL UNIQUE,
  shipment_request_id UUID NOT NULL REFERENCES public.shipment_requests(id) ON DELETE CASCADE,
  quotation_id UUID NOT NULL REFERENCES public.logistics_quotations(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'booking_confirmed' CHECK (
    status IN (
      'booking_requested', 'quotation_received', 'booking_confirmed', 'pickup_scheduled',
      'pickup_completed', 'in_transit', 'reached_sorting_facility', 'reached_destination_hub',
      'out_for_delivery', 'delivered', 'failed_attempt', 'returned_to_origin', 'cancelled', 'delayed'
    )
  ),
  total_amount NUMERIC(12, 2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'credit_terms', 'on_delivery')),
  pickup_scheduled_date DATE,
  actual_pickup_date TIMESTAMPTZ,
  estimated_delivery_date DATE,
  actual_delivery_date TIMESTAMPTZ,
  current_location TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  vehicle_number TEXT,
  pickup_proof_url TEXT,
  delivery_proof_url TEXT,
  delivery_signature_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_logistics_bk_track ON public.logistics_bookings(tracking_number);
CREATE INDEX IF NOT EXISTS idx_logistics_bk_comp ON public.logistics_bookings(company_id);
CREATE INDEX IF NOT EXISTS idx_logistics_bk_cust ON public.logistics_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_logistics_bk_status ON public.logistics_bookings(status);

-- 8. Amazon/Flipkart-Style Shipment Tracking Timeline Events
CREATE TABLE IF NOT EXISTS public.shipment_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.logistics_bookings(id) ON DELETE CASCADE,
  tracking_number TEXT NOT NULL,
  status TEXT NOT NULL,
  location TEXT,
  description TEXT NOT NULL,
  proof_doc_url TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_source TEXT DEFAULT 'manual' CHECK (event_source IN ('manual', 'carrier_api', 'system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shipment_events_bk ON public.shipment_tracking_events(booking_id);
CREATE INDEX IF NOT EXISTS idx_shipment_events_track ON public.shipment_tracking_events(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipment_events_time ON public.shipment_tracking_events(created_at);

-- 9. Logistics Complaints & Dispute Tickets
CREATE TABLE IF NOT EXISTS public.logistics_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  booking_id UUID NOT NULL REFERENCES public.logistics_bookings(id) ON DELETE CASCADE,
  raised_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('delay', 'damage', 'wrong_delivery', 'overcharge', 'service_issue')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'escalated')),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_logistics_complaints_bk ON public.logistics_complaints(booking_id);
CREATE INDEX IF NOT EXISTS idx_logistics_complaints_status ON public.logistics_complaints(status);

-- 10. Enable Row Level Security (RLS)
ALTER TABLE public.logistics_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_enquiry_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_complaints ENABLE ROW LEVEL SECURITY;

-- 11. Public Discovery RLS Policies (Safe Read-Only)
DROP POLICY IF EXISTS "Allow public read of active logistics profiles" ON public.logistics_profiles;
CREATE POLICY "Allow public read of active logistics profiles" ON public.logistics_profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public read of approved logistics services" ON public.logistics_services;
CREATE POLICY "Allow public read of approved logistics services" ON public.logistics_services FOR SELECT
  USING (is_active = true AND moderation_status = 'approved');

DROP POLICY IF EXISTS "Allow public read of active logistics routes" ON public.logistics_routes;
CREATE POLICY "Allow public read of active logistics routes" ON public.logistics_routes FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Allow public read of safe tracking events" ON public.shipment_tracking_events;
CREATE POLICY "Allow public read of safe tracking events" ON public.shipment_tracking_events FOR SELECT
  USING (true);

-- 12. Logistics Company Isolation Policies
DROP POLICY IF EXISTS "Allow logistics partners to manage their own services" ON public.logistics_services;
CREATE POLICY "Allow logistics partners to manage their own services" ON public.logistics_services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.business_members bm
      WHERE bm.business_id = logistics_services.company_id
        AND bm.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Allow logistics partners to manage their quotations" ON public.logistics_quotations;
CREATE POLICY "Allow logistics partners to manage their quotations" ON public.logistics_quotations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.business_members bm
      WHERE bm.business_id = logistics_quotations.company_id
        AND bm.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );
