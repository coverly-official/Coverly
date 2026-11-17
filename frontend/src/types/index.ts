export type UserRole =
  | "guest"
  | "buyer"
  | "manufacturer"
  | "wholesaler"
  | "distributor"
  | "buyer_supplier"
  | "service_provider"
  | "sales_agent"
  | "sales_manager"
  | "raw_material_supplier"
  | "packaging_supplier"
  | "importer"
  | "exporter"
  | "importer_exporter"
  | "retailer"
  | "logistics_partner"
  | "transporter"
  | "procurement_manager"
  | "purchase_staff"
  | "finance_accounts_staff"
  | "super_admin"
  | "admin"
  | "verification_admin"
  | "verification_manager"
  | "marketplace_manager"
  | "procurement_operations_manager"
  | "order_operations_manager"
  | "logistics_operations_manager"
  | "finance_admin"
  | "support_admin"
  | "support_executive"
  | "compliance_manager"
  | "quality_operations_manager";

export type VerificationTier =
  | "unverified"
  | "phone_verified"
  | "email_verified"
  | "document_verified"
  | "registration_checked";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  roles: UserRole[];
  activeRole: UserRole;
  is_active: boolean;
}

export interface Business {
  id: string;
  name: string;
  legal_name?: string;
  slug: string;
  business_type: "buyer" | "manufacturer" | "wholesaler" | "distributor" | "service_provider" | "retailer";
  city: string;
  state: string;
  pincode: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  verification_level: VerificationTier;
  is_active: boolean;
  created_at: string;
}

export interface BusinessServiceSubcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
}

export interface BusinessServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  subcategories?: BusinessServiceSubcategory[];
}

export interface ServiceProviderProfile {
  id: string;
  business_id: string;
  headline?: string;
  bio?: string;
  experience_years: number;
  service_areas: string[];
  certifications: string[];
  website_url?: string;
}

export interface BusinessServicePortfolio {
  id: string;
  service_id?: string;
  business_id: string;
  title: string;
  image_url: string;
  description?: string;
  created_at: string;
}

export interface BusinessService {
  id: string;
  business_id: string;
  category_id: string;
  subcategory_id?: string;
  title: string;
  slug: string;
  short_description: string;
  full_description?: string;
  deliverables?: string[];
  pricing_model: "fixed" | "starting_at" | "custom_quote";
  starting_price?: number;
  turnaround_days: number;
  is_active: boolean;
  created_at: string;
  businesses?: {
    id: string;
    name: string;
    slug?: string;
    city: string;
    state?: string;
    phone?: string;
    email?: string;
    website?: string;
    verification_level: VerificationTier;
  };
  business_service_categories?: {
    id: string;
    name: string;
    slug: string;
  };
  business_service_subcategories?: {
    id: string;
    name: string;
    slug: string;
  };
  portfolio?: BusinessServicePortfolio[];
  provider_profile?: ServiceProviderProfile;
}

export type ServiceRequestStatus =
  | "submitted"
  | "viewed"
  | "quoted"
  | "accepted"
  | "rejected"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface ServiceRequestQuotation {
  id: string;
  quotation_number: string;
  request_id: string;
  provider_business_id: string;
  provider_user_id: string;
  quoted_price: number;
  scope_of_work: string;
  deliverables?: string[];
  turnaround_days: number;
  valid_until: string;
  terms?: string;
  status: "submitted" | "accepted" | "rejected" | "expired";
  businesses?: Partial<Business>;
  created_at: string;
}

export interface ServiceRequest {
  id: string;
  request_number: string;
  customer_id: string;
  customer_business_id?: string;
  service_id?: string;
  provider_business_id: string;
  title: string;
  requirements: string;
  delivery_city?: string;
  target_timeline?: string;
  budget?: number;
  status: ServiceRequestStatus;
  created_at: string;
  businesses?: {
    id: string;
    name: string;
    city: string;
    phone?: string;
    email?: string;
    verification_level: VerificationTier;
  };
  business_services?: {
    title: string;
    pricing_model: string;
  };
  quotations?: ServiceRequestQuotation[];
  history?: Array<{
    id: string;
    previous_status?: string;
    new_status: string;
    note?: string;
    created_at: string;
  }>;
}

export interface ProductCategory {
  id: string;
  label?: string;
  name?: string;
  unit?: string;
  default_qty?: number;
  icon?: string;
  description?: string;
  display_order?: number;
  subcategories?: any[];
  created_at?: string;
}

export type Category = ProductCategory;

export interface Product {
  id: string;
  business_id: string;
  category_id: string;
  title: string;
  slug?: string;
  description?: string;
  moq: number;
  unit: string;
  indicative_price: number;
  tiered_pricing?: Array<{ minQty: number; maxQty?: number; unitPrice: number }>;
  specifications?: Record<string, string>;
  hs_code?: string;
  created_at: string;
  businesses?: {
    id?: string;
    name: string;
    slug?: string;
    city: string;
    state?: string;
    verification_level: VerificationTier;
  };
  images?: Array<{ id: string; image_url: string; is_primary?: boolean }>;
  product_images?: Array<{ id: string; image_url: string; is_primary?: boolean }>;
  supplier?: any;
  category?: any;
  subcategory?: any;
  is_active?: boolean;
}

export interface RFQItem {
  id?: string;
  item_name: string;
  quantity: number;
  unit: string;
  target_unit_price?: number;
  specifications?: Record<string, any>;
}

export interface RFQ {
  id: string;
  rfq_number: string;
  buyer_id: string;
  business_id?: string;
  title: string;
  category_id: string;
  delivery_city: string;
  delivery_pincode: string;
  target_delivery_date?: string;
  dispatch_mode: "direct" | "broadcast" | "managed";
  status: "draft" | "submitted" | "in_review" | "matched" | "quotes_received" | "accepted" | "closed" | "cancelled";
  notes?: string;
  created_at: string;
  items?: RFQItem[];
  quotations?: Array<any>;
}

export interface QuotationCost {
  subtotal: number;
  freight: number;
  packaging: number;
  insurance: number;
  gst_rate: number;
  gst_amount: number;
  total_landed_cost: number;
  effective_landed_unit_cost: number;
}

export interface Quotation {
  id: string;
  rfq_id: string;
  supplier_business_id: string;
  supplier_user_id: string;
  quotation_number: string;
  status: "draft" | "submitted" | "under_review" | "accepted" | "rejected" | "expired";
  valid_until: string;
  lead_time_days: number;
  terms_and_conditions?: string;
  created_at: string;
  quotation_costs?: QuotationCost;
  quotation_items?: Array<{
    id: string;
    item_name: string;
    quantity: number;
    unit: string;
    unit_price: number;
    total_price: number;
  }>;
  businesses?: {
    id: string;
    name: string;
    city: string;
    verification_level: VerificationTier;
  };
}

export interface Order {
  id: string;
  order_number: string;
  quotation_id: string;
  buyer_id: string;
  supplier_business_id: string;
  status: "pending_deposit" | "deposit_paid" | "in_production" | "quality_check" | "shipped" | "delivered" | "completed" | "disputed" | "cancelled";
  total_amount: number;
  tracking_number?: string;
  carrier?: string;
  dispatch_date?: string;
  delivery_date?: string;
  created_at: string;
  items?: Array<any>;
  history?: Array<any>;
  businesses?: {
    name: string;
    city: string;
    phone?: string;
    email?: string;
  };
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  subject: string;
  category: "order" | "payment" | "verification" | "listing" | "account" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "waiting_on_customer" | "resolved" | "closed";
  created_at: string;
}

export interface InAppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export type SalesAgentType = "independent" | "company_representative";
export type SalesAgentVerificationStatus = "pending" | "verified" | "rejected" | "suspended";

export interface SalesAgentProfile {
  id: string;
  user_id: string;
  agent_type: SalesAgentType;
  full_name: string;
  phone: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  affiliated_business_id?: string;
  product_categories: string[];
  service_categories: string[];
  operating_cities: string[];
  operating_states: string[];
  languages: string[];
  experience_years: number;
  verification_status: SalesAgentVerificationStatus;
  verification_notes?: string;
  verified_at?: string;
  is_public_discovery_enabled: boolean;
  slug: string;
  total_leads_assigned: number;
  total_conversions: number;
  created_at: string;
  businesses?: {
    id: string;
    name: string;
    city: string;
  };
}

export type SalesLeadStatus =
  | "new"
  | "assigned"
  | "contacted"
  | "interested"
  | "followup_required"
  | "quotation_requested"
  | "negotiation"
  | "converted"
  | "lost"
  | "closed";

export interface SalesLead {
  id: string;
  lead_number: string;
  customer_id?: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  guest_company?: string;
  requirement_category: string;
  product_or_service: string;
  quantity?: string;
  budget?: number;
  location_city?: string;
  location_state?: string;
  description: string;
  assigned_agent_id?: string;
  assigned_by?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: SalesLeadStatus;
  lead_source: "guest_form" | "buyer_portal" | "agent_sourced" | "admin_allocated";
  target_supplier_business_id?: string;
  linked_rfq_id?: string;
  linked_order_id?: string;
  converted_transaction_value?: number;
  converted_at?: string;
  lost_reason?: string;
  created_at: string;
  sales_agent_profiles?: {
    full_name: string;
    phone: string;
    email: string;
    agent_type: string;
  };
  businesses?: {
    id: string;
    name: string;
    city: string;
  };
}

export type FollowupType = "phone_call" | "video_meeting" | "factory_visit" | "whatsapp_email" | "quotation_review";

export interface SalesLeadFollowup {
  id: string;
  lead_id: string;
  agent_id: string;
  scheduled_at: string;
  followup_type: FollowupType;
  outcome_notes?: string;
  next_action?: string;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
}

export interface SalesCommissionRecord {
  id: string;
  commission_number: string;
  agent_id: string;
  lead_id: string;
  order_id?: string;
  qualifying_transaction_value: number;
  calculated_commission: number;
  status: "not_eligible" | "pending_verification" | "approved" | "rejected" | "payable" | "paid";
  rule_id?: string;
  approved_by?: string;
  approved_at?: string;
  payout_reference?: string;
  paid_at?: string;
  created_at: string;
  sales_agent_profiles?: {
    full_name: string;
    phone: string;
    email: string;
  };
  sales_leads?: {
    lead_number: string;
    product_or_service: string;
    requirement_category: string;
  };
}

// ====================================================================
// Raw Material Supplier Marketplace Types
// ====================================================================

export interface RawMaterialCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  display_order: number;
  is_active: boolean;
  raw_material_subcategories?: RawMaterialSubcategory[];
}

export interface RawMaterialSubcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string;
}

export type RawMaterialSupplierType =
  | "manufacturer"
  | "raw_material_trader"
  | "wholesaler"
  | "distributor"
  | "importer"
  | "exporter"
  | "agricultural_commodity_supplier";

export interface RawMaterialSupplierProfile {
  id: string;
  business_id: string;
  user_id: string;
  supplier_type: RawMaterialSupplierType;
  headline?: string;
  description?: string;
  operating_states: string[];
  operating_cities: string[];
  material_categories: string[];
  warehouses: Array<{
    name: string;
    city: string;
    state: string;
    capacity: string;
  }>;
  supply_capacity_monthly?: string;
  certifications: string[];
  moq_policy?: string;
  verification_status: "pending" | "verified" | "rejected" | "suspended";
  verification_notes?: string;
  verified_at?: string;
  rating: number;
  total_deals_completed: number;
  created_at: string;
  businesses?: Business;
  products?: RawMaterialProduct[];
}

export interface RawMaterialPricingTier {
  min_qty: number;
  max_qty: number;
  price_per_unit: number;
}

export interface RawMaterialProduct {
  id: string;
  supplier_id: string;
  business_id: string;
  category_id: string;
  subcategory?: string;
  name: string;
  slug: string;
  description?: string;
  material_grade?: string;
  origin?: string;
  quality_standards: string[];
  specifications: Record<string, any>;
  unit_of_measurement: string;
  moq: number;
  max_order_quantity?: number;
  base_price: number;
  bulk_pricing_tiers: RawMaterialPricingTier[];
  maintains_inventory: boolean;
  stock_quantity: number;
  available_quantity: number;
  reserved_quantity: number;
  lead_time_days: number;
  packaging_details?: string;
  supply_locations: string[];
  delivery_available: boolean;
  images: string[];
  documents?: any[];
  moderation_status: "draft" | "pending" | "approved" | "rejected" | "archived";
  moderation_notes?: string;
  is_active: boolean;
  created_at: string;
  raw_material_supplier_profiles?: {
    id: string;
    supplier_type: RawMaterialSupplierType;
    verification_status: string;
    rating: number;
    businesses?: {
      id: string;
      name: string;
      city: string;
      state: string;
      verification_level?: string;
    };
  };
}

export type RawMaterialRfqStatus =
  | "submitted"
  | "under_review"
  | "dispatched_to_suppliers"
  | "quotes_received"
  | "accepted"
  | "closed"
  | "cancelled";

export interface RawMaterialRfq {
  id: string;
  rfq_number: string;
  buyer_id?: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  guest_company?: string;
  material_name: string;
  category_id: string;
  required_quantity: number;
  unit: string;
  material_grade?: string;
  required_specifications: Record<string, any>;
  packaging_requirements?: string;
  delivery_city: string;
  delivery_state: string;
  delivery_pincode?: string;
  target_delivery_date?: string;
  budget?: number;
  target_supplier_id?: string;
  status: RawMaterialRfqStatus;
  notes?: string;
  created_at: string;
  raw_material_quotations?: RawMaterialQuotation[];
}

export interface RawMaterialQuotation {
  id: string;
  quotation_number: string;
  rfq_id: string;
  supplier_id: string;
  supplier_user_id: string;
  product_id?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  bulk_discount_amount: number;
  packaging_charges: number;
  loading_charges: number;
  freight_charges: number;
  insurance_charges: number;
  gst_rate: number;
  gst_amount: number;
  total_estimated_cost: number;
  effective_unit_cost: number;
  lead_time_days: number;
  valid_until: string;
  terms_and_conditions?: string;
  status: "submitted" | "under_review" | "accepted" | "rejected" | "expired" | "withdrawn";
  accepted_at?: string;
  created_at: string;
  raw_material_supplier_profiles?: {
    id: string;
    supplier_type: string;
    verification_status: string;
    rating: number;
    businesses?: {
      name: string;
      city: string;
      state: string;
      verification_level?: string;
    };
  };
  raw_material_rfqs?: RawMaterialRfq;
}

export type RawMaterialOrderStatus =
  | "order_created"
  | "supplier_confirmation_pending"
  | "confirmed"
  | "processing"
  | "preparing_for_dispatch"
  | "ready_for_dispatch"
  | "dispatched"
  | "in_transit"
  | "delivered"
  | "completed"
  | "cancelled"
  | "disputed";

export interface RawMaterialOrder {
  id: string;
  order_number: string;
  quotation_id: string;
  rfq_id: string;
  buyer_id: string;
  supplier_id: string;
  status: RawMaterialOrderStatus;
  total_amount: number;
  delivery_city: string;
  delivery_address?: string;
  dispatch_date?: string;
  estimated_delivery_date?: string;
  carrier_name?: string;
  tracking_number?: string;
  invoice_url?: string;
  dispatch_document_url?: string;
  buyer_confirmed_at?: string;
  created_at: string;
  raw_material_quotations?: RawMaterialQuotation;
  raw_material_rfqs?: RawMaterialRfq;
  raw_material_supplier_profiles?: {
    businesses?: {
      name: string;
      city: string;
    };
  };
  users?: {
    full_name: string;
    email: string;
    phone?: string;
  };
}

// ====================================================================
// Packaging Supplier Marketplace Types
// ====================================================================

export interface PackagingSubcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string;
  display_order?: number;
}

export interface PackagingCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  display_order: number;
  is_active: boolean;
  packaging_subcategories?: PackagingSubcategory[];
}

export interface PackagingPricingTier {
  min_qty: number;
  max_qty: number;
  price_per_unit: number;
  discount_pct?: number;
}

export interface PackagingSupplierProfile {
  id: string;
  business_id: string;
  user_id: string;
  supplier_type:
    | "packaging_manufacturer"
    | "packaging_material_supplier"
    | "packaging_trader"
    | "packaging_wholesaler"
    | "printing_company"
    | "custom_packaging_manufacturer"
    | "packaging_distributor";
  headline?: string;
  description?: string;
  registered_address?: string;
  factory_locations?: Array<{
    name: string;
    city: string;
    state: string;
    areaSqFt?: number;
  }>;
  serviceable_locations?: string[];
  packaging_categories?: string[];
  manufacturing_capabilities?: string[];
  printing_capabilities?: string[];
  production_capacity?: string;
  moq_policy?: string;
  typical_lead_time_days?: number;
  certifications?: string[];
  verification_status: "pending" | "verified" | "rejected" | "suspended";
  verification_notes?: string;
  verified_at?: string;
  rating?: number;
  total_orders_completed?: number;
  is_public_discovery_enabled: boolean;
  businesses?: Business;
  products?: PackagingProduct[];
}

export interface PackagingProduct {
  id: string;
  supplier_id: string;
  business_id: string;
  category_id: string;
  subcategory?: string;
  name: string;
  slug: string;
  description?: string;
  material_type: string;
  dimensions?: {
    length_mm?: number;
    width_mm?: number;
    height_mm?: number;
    bottom_gusset_mm?: number;
    neck_size?: string;
  };
  thickness?: string;
  weight_gsm?: string;
  capacity?: string;
  colour?: string;
  shape?: string;
  packaging_type?: string;
  printing_options?: string[];
  customization_options?: string[];
  category_specifications?: Record<string, any>;
  unit_of_measurement: string;
  moq: number;
  max_order_quantity?: number;
  base_price: number;
  bulk_pricing_tiers?: PackagingPricingTier[];
  lead_time_days: number;
  available_supply_locations?: string[];
  images?: string[];
  maintains_inventory?: boolean;
  stock_quantity?: number;
  available_quantity?: number;
  moderation_status: "pending" | "approved" | "rejected";
  moderation_notes?: string;
  is_active: boolean;
  packaging_supplier_profiles?: PackagingSupplierProfile;
  packaging_categories?: PackagingCategory;
}

export interface PackagingRfq {
  id: string;
  rfq_number: string;
  buyer_id?: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  guest_company?: string;
  category_id?: string;
  product_id?: string;
  product_being_packed?: string;
  packaging_type?: string;
  material_preference?: string;
  required_dimensions?: Record<string, any>;
  required_capacity?: string;
  required_quantity: number;
  unit: string;
  printing_required: boolean;
  printing_details?: string;
  branding_details?: string;
  custom_finishing?: string;
  food_contact_grade?: boolean;
  target_budget?: number;
  target_delivery_date?: string;
  delivery_city: string;
  delivery_state: string;
  delivery_pincode?: string;
  additional_instructions?: string;
  reference_files?: Array<{ name: string; url?: string; file_type?: string; size?: number }>;
  is_sample_requested?: boolean;
  status: "open" | "matched" | "quotes_received" | "partially_quoted" | "accepted" | "expired" | "cancelled";
  created_at: string;
  packaging_categories?: {
    id: string;
    name: string;
    slug: string;
  };
  quotations?: PackagingQuotation[];
}

export interface PackagingQuotation {
  id: string;
  quotation_number: string;
  rfq_id: string;
  supplier_id: string;
  supplier_user_id: string;
  quotation_type: "ready_made_packaging" | "custom_packaging" | "printing_only" | "design_and_packaging";
  product_id?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number;
  bulk_discount_amount: number;
  printing_charges: number;
  plate_cylinder_charges: number;
  design_charges: number;
  packaging_charges: number;
  freight_charges: number;
  gst_rate: number;
  gst_amount: number;
  total_estimated_cost: number;
  effective_unit_cost: number;
  production_lead_time_days: number;
  valid_until: string;
  sample_available?: boolean;
  sample_charges?: number;
  sample_lead_time_days?: number;
  payment_terms?: string;
  terms_and_conditions?: string;
  status: "submitted" | "under_review" | "accepted" | "rejected" | "expired" | "withdrawn";
  accepted_at?: string;
  created_at: string;
  packaging_supplier_profiles?: {
    id: string;
    supplier_type: string;
    rating: number;
    businesses?: {
      id: string;
      name: string;
      city: string;
      state: string;
    };
  };
}

export interface PackagingSampleRequest {
  id: string;
  sample_number: string;
  quotation_id: string;
  rfq_id: string;
  buyer_id: string;
  supplier_id: string;
  sample_type: string;
  specifications?: Record<string, any>;
  sample_charges: number;
  payment_status: "free" | "pending" | "paid";
  status:
    | "sample_requested"
    | "sample_in_preparation"
    | "sample_dispatched"
    | "sample_delivered"
    | "sample_reviewed"
    | "sample_approved"
    | "sample_revision_requested"
    | "sample_rejected";
  carrier_name?: string;
  tracking_number?: string;
  dispatched_at?: string;
  buyer_feedback?: string;
  approved_at?: string;
  created_at: string;
}

export type PackagingOrderStatus =
  | "order_created"
  | "supplier_confirmation_pending"
  | "specifications_awaiting_approval"
  | "sample_pending"
  | "sample_approved"
  | "production_scheduled"
  | "production_in_progress"
  | "quality_inspection"
  | "ready_for_dispatch"
  | "dispatched"
  | "delivered"
  | "completed"
  | "cancelled"
  | "disputed";

export interface PackagingOrderMilestone {
  id: string;
  order_id: string;
  milestone_name: string;
  milestone_status: "pending" | "in_progress" | "completed";
  completion_percentage: number;
  target_date?: string;
  completed_at?: string;
  notes?: string;
}

export interface PackagingOrder {
  id: string;
  order_number: string;
  quotation_id: string;
  rfq_id: string;
  sample_id?: string;
  buyer_id: string;
  supplier_id: string;
  order_status: PackagingOrderStatus;
  total_amount: number;
  agreed_unit_price: number;
  quantity: number;
  unit: string;
  delivery_city: string;
  delivery_state?: string;
  delivery_address?: string;
  delivery_pincode?: string;
  estimated_delivery_date?: string;
  dispatch_date?: string;
  carrier_name?: string;
  tracking_number?: string;
  quality_inspection_passed?: boolean;
  quality_documents?: any[];
  dispatch_documents?: any[];
  buyer_confirmed_at?: string;
  created_at: string;
  packaging_quotations?: PackagingQuotation;
  packaging_rfqs?: PackagingRfq;
  packaging_supplier_profiles?: PackagingSupplierProfile;
  packaging_order_milestones?: PackagingOrderMilestone[];
}

// ====================================================================
// International Trade (Importer & Exporter) Marketplace Types
// ====================================================================

export type TradeIncoterm =
  | "EXW"
  | "FCA"
  | "FOB"
  | "CFR"
  | "CIF"
  | "CPT"
  | "CIP"
  | "DAP"
  | "DPU"
  | "DDP";

export type TradeCurrency = "USD" | "EUR" | "INR" | "AED" | "GBP" | "JPY" | "CNY" | "SGD";

export interface TradeSubcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string;
  display_order?: number;
}

export interface TradeCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  display_order: number;
  is_active: boolean;
  trade_subcategories?: TradeSubcategory[];
}

export interface TradeParty {
  id: string;
  business_id: string;
  user_id: string;
  party_type: "importer" | "exporter" | "importer_exporter";
  headline?: string;
  description?: string;
  country_code: string;
  country_name: string;
  operating_cities?: string[];
  iec_code?: string;
  authorized_dealer_code?: string;
  gstin?: string;
  business_registration_number?: string;
  export_markets?: string[];
  sourcing_countries?: string[];
  product_categories?: string[];
  annual_trade_turnover?: string;
  typical_shipment_modes?: string[];
  certifications?: string[];
  primary_loading_ports?: string[];
  verification_status: "pending" | "verified" | "rejected" | "suspended";
  verification_notes?: string;
  verified_at?: string;
  rating?: number;
  total_export_deals_completed?: number;
  is_public_discovery_enabled: boolean;
  businesses?: Business;
  products?: InternationalProduct[];
}

export interface InternationalProduct {
  id: string;
  party_id: string;
  business_id: string;
  category_id: string;
  subcategory?: string;
  name: string;
  slug: string;
  description?: string;
  hs_code?: string;
  origin_country: string;
  origin_state?: string;
  material_grade?: string;
  specifications?: Record<string, any>;
  quality_certifications?: string[];
  unit_of_measurement: string;
  moq: number;
  max_supply_capacity_monthly?: string;
  currency: TradeCurrency;
  base_price_fob: number;
  incoterm_basis: TradeIncoterm;
  pricing_tiers?: Array<{ min_qty: number; max_qty: number; price_per_unit: number; currency: string }>;
  export_lead_time_days: number;
  packaging_details?: string;
  loading_port?: string;
  eligible_destination_countries?: string[];
  images?: string[];
  compliance_documents?: any[];
  moderation_status: "pending" | "approved" | "rejected";
  moderation_notes?: string;
  is_active: boolean;
  trade_parties?: TradeParty;
  trade_categories?: TradeCategory;
}

export interface TradeRfq {
  id: string;
  rfq_number: string;
  direction: "import" | "export";
  buyer_id?: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  guest_company?: string;
  guest_country?: string;
  category_id?: string;
  product_id?: string;
  product_name: string;
  hs_code_preference?: string;
  required_specifications?: Record<string, any>;
  origin_country_preference?: string;
  destination_country: string;
  destination_port: string;
  preferred_incoterm: TradeIncoterm;
  required_quantity: number;
  unit: string;
  packaging_preference?: string;
  target_currency: TradeCurrency;
  target_budget?: number;
  target_delivery_date?: string;
  payment_terms_preferred?: string;
  inspection_agency?: string;
  additional_instructions?: string;
  reference_files?: Array<{ name: string; url?: string; file_type?: string; size?: number }>;
  status: "open" | "matched" | "quotes_received" | "accepted" | "expired" | "cancelled";
  created_at: string;
  trade_categories?: {
    name: string;
    slug: string;
  };
  quotations?: TradeQuotation[];
}

export interface TradeQuotation {
  id: string;
  quotation_number: string;
  rfq_id: string;
  party_id: string;
  seller_user_id: string;
  product_id?: string;
  quantity: number;
  unit: string;
  currency: TradeCurrency;
  indicative_exchange_rate_to_inr: number;
  exchange_rate_source?: string;
  exchange_rate_timestamp?: string;
  unit_price: number;
  subtotal: number;
  incoterm: TradeIncoterm;
  named_port_of_loading: string;
  named_port_of_discharge: string;
  inland_freight?: number;
  international_ocean_air_freight?: number;
  marine_transit_insurance?: number;
  customs_documentation_charges?: number;
  inspection_charges?: number;
  total_amount: number;
  indicative_inr_total: number;
  effective_unit_cost: number;
  payment_terms: string;
  production_dispatch_lead_days: number;
  estimated_ocean_transit_days: number;
  valid_until: string;
  terms_and_conditions?: string;
  status: "submitted" | "under_review" | "accepted" | "rejected" | "expired" | "withdrawn";
  accepted_at?: string;
  created_at: string;
  trade_parties?: {
    id: string;
    party_type: string;
    country_name: string;
    rating: number;
    businesses?: {
      id: string;
      name: string;
      city: string;
      state: string;
    };
  };
}

export type TradeOrderStatus =
  | "rfq_submitted"
  | "quotation_received"
  | "quotation_accepted"
  | "order_confirmed"
  | "production_procurement"
  | "ready_for_dispatch"
  | "export_documentation"
  | "customs_processing"
  | "shipment_booked"
  | "in_transit"
  | "arrived_at_destination"
  | "import_customs_processing"
  | "delivered"
  | "completed"
  | "cancelled"
  | "disputed";

export interface TradeDocument {
  id: string;
  order_id: string;
  document_type:
    | "commercial_invoice"
    | "proforma_invoice"
    | "packing_list"
    | "certificate_of_origin"
    | "bill_of_lading"
    | "air_waybill"
    | "shipping_bill"
    | "bill_of_entry"
    | "insurance_certificate"
    | "inspection_certificate"
    | "phytosanitary_certificate"
    | "other";
  document_name: string;
  document_number?: string;
  file_url: string;
  file_size_bytes?: number;
  issuing_authority?: string;
  issue_date?: string;
  expiry_date?: string;
  verification_status: "submitted" | "verified_by_ops" | "rejected" | "archived";
  verification_notes?: string;
  created_at: string;
}

export interface TradeOrder {
  id: string;
  order_number: string;
  quotation_id: string;
  rfq_id: string;
  buyer_id: string;
  party_id: string;
  order_status: TradeOrderStatus;
  currency: TradeCurrency;
  total_amount: number;
  indicative_inr_total: number;
  agreed_unit_price: number;
  quantity: number;
  unit: string;
  incoterm: TradeIncoterm;
  port_of_loading: string;
  port_of_discharge: string;
  container_numbers?: string[];
  bl_awb_number?: string;
  shipping_line_airline?: string;
  vessel_flight_details?: string;
  estimated_departure_date?: string;
  actual_departure_date?: string;
  estimated_arrival_date?: string;
  actual_arrival_date?: string;
  delivery_date?: string;
  buyer_confirmed_at?: string;
  created_at: string;
  trade_quotations?: TradeQuotation;
  trade_rfqs?: TradeRfq;
  trade_parties?: TradeParty;
  trade_documents?: TradeDocument[];
}

// ====================================================================
// Buyer & Business Owner System Types
// ====================================================================

export type BusinessRole =
  | "owner"
  | "business_manager"
  | "procurement_manager"
  | "purchase_executive"
  | "accounts_executive"
  | "staff"
  | "admin"
  | "viewer";

export type BusinessPermission =
  | "view"
  | "create"
  | "edit"
  | "approve"
  | "reject"
  | "manage"
  | "export";

export interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role_in_business: BusinessRole;
  permissions: BusinessPermission[];
  spending_limit?: number;
  department?: string;
  is_active: boolean;
  created_at: string;
  users?: {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
    avatar_url?: string;
  };
}

export interface BusinessInvitation {
  id: string;
  business_id: string;
  invited_by_user_id: string;
  email: string;
  full_name: string;
  role_in_business: BusinessRole;
  permissions: BusinessPermission[];
  department?: string;
  spending_limit?: number;
  invitation_token: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  created_at: string;
}

export interface BusinessBranch {
  id: string;
  business_id: string;
  branch_name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
  email?: string;
  gstin?: string;
  is_headquarters: boolean;
  is_active: boolean;
  created_at: string;
}

export interface BuyerProfile {
  id: string;
  business_id?: string;
  user_id?: string;
  account_type: "individual" | "business";
  annual_sourcing_budget?: number;
  primary_categories: string[];
  purchasing_categories: string[];
  industry_type?: string;
  verification_status: "unverified" | "pending" | "verified" | "rejected";
  verification_notes?: string;
  verified_at?: string;
  company_logo_url?: string;
  created_at: string;
}

export interface PurchaseRequestItem {
  id?: string;
  item_name: string;
  quantity: number;
  unit: string;
  estimated_unit_price: number;
  total_price: number;
  specifications?: Record<string, any>;
}

export interface PurchaseRequest {
  id: string;
  pr_number: string;
  business_id: string;
  requester_id: string;
  title: string;
  department?: string;
  category_id?: string;
  estimated_amount: number;
  currency: string;
  priority: "low" | "medium" | "high" | "urgent";
  status:
    | "draft"
    | "pending_approval"
    | "approved"
    | "rejected"
    | "converted_to_rfq"
    | "converted_to_po"
    | "cancelled";
  justification?: string;
  target_delivery_date?: string;
  rfq_id?: string;
  quotation_id?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  purchase_request_items?: PurchaseRequestItem[];
  users?: {
    full_name: string;
    email: string;
  };
}

export interface PurchaseOrderItem {
  id?: string;
  item_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  specifications?: Record<string, any>;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  business_id: string;
  buyer_user_id: string;
  supplier_business_id: string;
  quotation_id?: string;
  purchase_request_id?: string;
  order_id?: string;
  po_status: "draft" | "issued" | "accepted_by_supplier" | "amendment_requested" | "cancelled" | "fulfilled";
  currency: string;
  subtotal: number;
  freight: number;
  packaging: number;
  gst_amount: number;
  total_amount: number;
  delivery_address: string;
  delivery_city: string;
  delivery_state: string;
  delivery_pincode: string;
  expected_delivery_date?: string;
  payment_terms?: string;
  terms_and_conditions?: string;
  authorized_by?: string;
  issued_at: string;
  created_at: string;
  updated_at: string;
  purchase_order_items?: PurchaseOrderItem[];
  businesses?: Business;
}

export interface BuyerSourcingList {
  id: string;
  business_id?: string;
  user_id: string;
  title: string;
  description?: string;
  category?: string;
  is_private: boolean;
  created_at: string;
  items?: Array<{
    id: string;
    item_type: "supplier" | "product";
    supplier_business_id?: string;
    product_id?: string;
    notes?: string;
    businesses?: Business;
    products?: Product;
  }>;
}

export type RetailType =
  | "individual_shop"
  | "kirana"
  | "grocery"
  | "supermarket"
  | "departmental"
  | "electronics"
  | "garments_fashion"
  | "hardware"
  | "medical_general"
  | "restaurant_hotel"
  | "multi_branch"
  | "other";

export interface RetailerProfile {
  id: string;
  user_id: string;
  business_id?: string;
  owner_name: string;
  shop_name: string;
  retail_type: RetailType;
  shop_logo_url?: string;
  description?: string;
  phone: string;
  email: string;
  store_address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  gstin?: string;
  pan?: string;
  trade_license_number?: string;
  fssai_license?: string;
  drug_license_number?: string;
  is_multi_branch: boolean;
  purchasing_categories: string[];
  verification_status: "unverified" | "pending" | "verified" | "rejected";
  verification_notes?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
  branches?: RetailerBranch[];
  documents?: RetailerDocument[];
  businesses?: Business;
}

export interface RetailerBranch {
  id: string;
  retailer_profile_id: string;
  business_id?: string;
  branch_name: string;
  store_code?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  manager_name?: string;
  manager_phone?: string;
  manager_email?: string;
  is_main_branch: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RetailCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  display_order: number;
  is_active: boolean;
  retail_subcategories?: RetailSubcategory[];
}

export interface RetailSubcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string;
  display_order: number;
}

export interface RetailerPurchaseListItem {
  id: string;
  list_id: string;
  product_id?: string;
  product_name: string;
  category?: string;
  quantity: number;
  unit: string;
  target_unit_price?: number;
  preferred_supplier_id?: string;
  notes?: string;
  created_at: string;
  products?: Product;
}

export interface RetailerPurchaseList {
  id: string;
  user_id: string;
  business_id?: string;
  retailer_profile_id?: string;
  title: string;
  category?: string;
  notes?: string;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
  retailer_purchase_list_items?: RetailerPurchaseListItem[];
}

export interface RetailerReorderRule {
  id: string;
  user_id: string;
  business_id?: string;
  retailer_profile_id?: string;
  title: string;
  product_name: string;
  product_id?: string;
  purchase_list_id?: string;
  quantity: number;
  unit: string;
  preferred_supplier_id?: string;
  frequency_days: number;
  last_ordered_at?: string;
  next_reminder_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  businesses?: Business;
}

export interface RetailerReorderReminder {
  id: string;
  rule_id: string;
  user_id: string;
  reminder_date: string;
  status: "due" | "acknowledged" | "rfq_created" | "dismissed";
  rfq_id?: string;
  created_at: string;
  retailer_reorder_rules?: RetailerReorderRule;
}

export interface RetailerDocument {
  id: string;
  user_id: string;
  retailer_profile_id: string;
  doc_type: "shop_photo" | "trade_license" | "gst_certificate" | "fssai_license" | "drug_license" | "utility_bill" | "other";
  file_name: string;
  file_url: string;
  file_key: string;
  file_size_bytes?: number;
  verification_status: "pending" | "verified" | "rejected";
  verification_notes?: string;
  uploaded_at: string;
}




