-- ====================================================================
-- COVERLY B2B Platform — Transporter Marketplace Schema
-- Migration: 20261117130000_transporter_marketplace.sql
-- ====================================================================

-- 1. Transporter Profiles (Individual Truck Operators & Fleet Owners)
CREATE TABLE IF NOT EXISTS public.transporter_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  transporter_type TEXT NOT NULL DEFAULT 'individual' CHECK (transporter_type IN ('individual', 'fleet_owner')),
  operator_name TEXT NOT NULL,
  driving_license_number TEXT,
  license_validity DATE,
  experience_years INTEGER DEFAULT 1,
  operating_routes TEXT[] DEFAULT '{}',
  serviceable_districts TEXT[] DEFAULT '{}',
  serviceable_states TEXT[] DEFAULT '{}',
  total_vehicles INTEGER DEFAULT 1,
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'document_verified', 'registration_checked')),
  rating NUMERIC(3, 2) DEFAULT 4.8,
  total_trips_completed INTEGER DEFAULT 0,
  gstin TEXT,
  pan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transporter_profiles_biz ON public.transporter_profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_transporter_profiles_type ON public.transporter_profiles(transporter_type);

-- 2. Transporter Commercial Vehicles (Asset Registry)
CREATE TABLE IF NOT EXISTS public.transporter_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transporter_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  vehicle_number TEXT NOT NULL UNIQUE,
  vehicle_category TEXT NOT NULL CHECK (
    vehicle_category IN (
      'mini_truck', 'tata_ace', 'pickup', 'lcv', 'mcv', 'heavy_truck',
      'multi_axle', 'trailer', 'container_truck', 'refrigerated_truck',
      'tanker', 'flatbed', 'other'
    )
  ),
  vehicle_model TEXT NOT NULL,
  capacity_tons NUMERIC(6, 2) NOT NULL,
  body_type TEXT NOT NULL DEFAULT 'closed_container' CHECK (
    body_type IN ('closed_container', 'open_body', 'high_bed', 'flatbed', 'reefer', 'tanker')
  ),
  dimensions_feet JSONB DEFAULT '{"length": 0, "width": 0, "height": 0}'::jsonb,
  fuel_type TEXT DEFAULT 'diesel' CHECK (fuel_type IN ('diesel', 'cng', 'electric', 'petrol')),
  permit_type TEXT DEFAULT 'national_permit' CHECK (permit_type IN ('state_permit', 'national_permit')),
  insurance_validity DATE,
  fitness_validity DATE,
  pollution_cert_validity DATE,
  status TEXT NOT NULL DEFAULT 'verified' CHECK (
    status IN ('pending_verification', 'verified', 'active', 'unavailable', 'under_maintenance', 'suspended', 'expired_documents')
  ),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  current_location TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transporter_vehicles_biz ON public.transporter_vehicles(transporter_business_id);
CREATE INDEX IF NOT EXISTS idx_transporter_vehicles_cat ON public.transporter_vehicles(vehicle_category);
CREATE INDEX IF NOT EXISTS idx_transporter_vehicles_avail ON public.transporter_vehicles(is_available, status);

-- 3. Transporter Authorized Drivers
CREATE TABLE IF NOT EXISTS public.transporter_drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transporter_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  driver_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  driving_license_number TEXT NOT NULL,
  license_validity DATE NOT NULL,
  license_doc_url TEXT,
  assigned_vehicle_id UUID REFERENCES public.transporter_vehicles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_trip', 'unavailable', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transporter_drivers_biz ON public.transporter_drivers(transporter_business_id);
CREATE INDEX IF NOT EXISTS idx_transporter_drivers_veh ON public.transporter_drivers(assigned_vehicle_id);

-- 4. Customer / Guest Transport Load Enquiries
CREATE TABLE IF NOT EXISTS public.transport_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  pickup_address TEXT NOT NULL,
  pickup_city TEXT NOT NULL,
  pickup_state TEXT NOT NULL,
  pickup_pincode TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_city TEXT NOT NULL,
  delivery_state TEXT NOT NULL,
  delivery_pincode TEXT NOT NULL,
  pickup_date DATE NOT NULL,
  goods_category TEXT NOT NULL,
  goods_description TEXT NOT NULL,
  weight_tons NUMERIC(8, 2) NOT NULL,
  packages_count INTEGER DEFAULT 1,
  vehicle_category_required TEXT,
  load_type TEXT NOT NULL DEFAULT 'ftl' CHECK (load_type IN ('ftl', 'ptl', 'bulk', 'machinery', 'agriculture', 'construction', 'general')),
  loading_help_required BOOLEAN DEFAULT FALSE,
  unloading_help_required BOOLEAN DEFAULT FALSE,
  special_instructions TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'quotes_received', 'booked', 'cancelled', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transport_enq_num ON public.transport_enquiries(enquiry_number);
CREATE INDEX IF NOT EXISTS idx_transport_enq_status ON public.transport_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_transport_enq_origin ON public.transport_enquiries(pickup_city);
CREATE INDEX IF NOT EXISTS idx_transport_enq_dest ON public.transport_enquiries(delivery_city);

-- 5. Multi-Transporter Matching Associations
CREATE TABLE IF NOT EXISTS public.transport_enquiry_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transport_enquiry_id UUID NOT NULL REFERENCES public.transport_enquiries(id) ON DELETE CASCADE,
  transporter_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'viewed', 'quoted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transport_recip_enq ON public.transport_enquiry_recipients(transport_enquiry_id);
CREATE INDEX IF NOT EXISTS idx_transport_recip_biz ON public.transport_enquiry_recipients(transporter_business_id);

-- 6. Transporter Load Quotations
CREATE TABLE IF NOT EXISTS public.transport_quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number TEXT NOT NULL UNIQUE,
  transport_enquiry_id UUID NOT NULL REFERENCES public.transport_enquiries(id) ON DELETE CASCADE,
  transporter_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.transporter_vehicles(id) ON DELETE SET NULL,
  base_freight NUMERIC(12, 2) NOT NULL,
  per_km_charge NUMERIC(10, 2) DEFAULT 0,
  loading_charges NUMERIC(12, 2) DEFAULT 0,
  unloading_charges NUMERIC(12, 2) DEFAULT 0,
  toll_charges NUMERIC(12, 2) DEFAULT 0,
  fuel_surcharge NUMERIC(12, 2) DEFAULT 0,
  other_charges NUMERIC(12, 2) DEFAULT 0,
  gst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_estimated_cost NUMERIC(12, 2) NOT NULL,
  estimated_pickup_time TEXT,
  estimated_delivery_time TEXT,
  terms_and_conditions TEXT,
  valid_until DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'accepted', 'rejected', 'withdrawn', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transport_quotes_enq ON public.transport_quotations(transport_enquiry_id);
CREATE INDEX IF NOT EXISTS idx_transport_quotes_biz ON public.transport_quotations(transporter_business_id);
CREATE INDEX IF NOT EXISTS idx_transport_quotes_status ON public.transport_quotations(status);

-- 7. Confirmed Transport Trip Bookings
CREATE TABLE IF NOT EXISTS public.transport_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference TEXT NOT NULL UNIQUE,
  tracking_number TEXT NOT NULL UNIQUE,
  transport_enquiry_id UUID NOT NULL REFERENCES public.transport_enquiries(id) ON DELETE CASCADE,
  quotation_id UUID NOT NULL REFERENCES public.transport_quotations(id) ON DELETE RESTRICT,
  transporter_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  assigned_vehicle_id UUID REFERENCES public.transporter_vehicles(id) ON DELETE SET NULL,
  assigned_driver_id UUID REFERENCES public.transporter_drivers(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'booking_confirmed' CHECK (
    status IN (
      'booking_confirmed', 'vehicle_assigned', 'driver_assigned', 'pickup_scheduled',
      'reached_pickup_location', 'goods_loaded', 'trip_started', 'in_transit',
      'reached_destination', 'goods_unloaded', 'delivered', 'delivery_attempt_failed',
      'cancelled', 'delayed'
    )
  ),
  total_freight_amount NUMERIC(12, 2) NOT NULL,
  pickup_date DATE NOT NULL,
  current_location TEXT,
  pickup_proof_url TEXT,
  delivery_proof_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transport_bk_track ON public.transport_bookings(tracking_number);
CREATE INDEX IF NOT EXISTS idx_transport_bk_biz ON public.transport_bookings(transporter_business_id);
CREATE INDEX IF NOT EXISTS idx_transport_bk_cust ON public.transport_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_transport_bk_status ON public.transport_bookings(status);

-- 8. 14-State Shipment Tracking Milestones
CREATE TABLE IF NOT EXISTS public.transport_trip_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.transport_bookings(id) ON DELETE CASCADE,
  tracking_number TEXT NOT NULL,
  status TEXT NOT NULL,
  location TEXT,
  description TEXT NOT NULL,
  proof_doc_url TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_source TEXT DEFAULT 'manual' CHECK (event_source IN ('manual', 'gps_api', 'driver_app')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trip_events_bk ON public.transport_trip_events(booking_id);
CREATE INDEX IF NOT EXISTS idx_trip_events_track ON public.transport_trip_events(tracking_number);

-- 9. Transporter Complaints & Claims
CREATE TABLE IF NOT EXISTS public.transporter_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  booking_id UUID NOT NULL REFERENCES public.transport_bookings(id) ON DELETE CASCADE,
  raised_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('delay', 'damage', 'overcharge', 'driver_behavior', 'missing_goods', 'cancellation')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_investigation', 'resolved', 'escalated')),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transporter_complaints_bk ON public.transporter_complaints(booking_id);

-- 10. Enable Row Level Security (RLS)
ALTER TABLE public.transporter_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transporter_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transporter_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_enquiry_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_trip_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transporter_complaints ENABLE ROW LEVEL SECURITY;

-- 11. Public Discovery RLS Policies (Safe Read-Only)
DROP POLICY IF EXISTS "Allow public read of active transporter profiles" ON public.transporter_profiles;
CREATE POLICY "Allow public read of active transporter profiles" ON public.transporter_profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public read of available verified vehicles" ON public.transporter_vehicles;
CREATE POLICY "Allow public read of available verified vehicles" ON public.transporter_vehicles FOR SELECT
  USING (status IN ('verified', 'active') AND is_available = true);

DROP POLICY IF EXISTS "Allow public read of safe trip tracking events" ON public.transport_trip_events;
CREATE POLICY "Allow public read of safe trip tracking events" ON public.transport_trip_events FOR SELECT
  USING (true);

-- 12. Transporter Isolation Policies
DROP POLICY IF EXISTS "Allow transporters to manage their vehicles" ON public.transporter_vehicles;
CREATE POLICY "Allow transporters to manage their vehicles" ON public.transporter_vehicles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.business_members bm
      WHERE bm.business_id = transporter_vehicles.transporter_business_id
        AND bm.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Allow transporters to manage their quotations" ON public.transport_quotations;
CREATE POLICY "Allow transporters to manage their quotations" ON public.transport_quotations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.business_members bm
      WHERE bm.business_id = transport_quotations.transporter_business_id
        AND bm.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );
