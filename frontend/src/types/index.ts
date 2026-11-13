export type UserRole =
  | "guest"
  | "buyer"
  | "manufacturer"
  | "wholesaler"
  | "distributor"
  | "buyer_supplier"
  | "admin"
  | "verification_admin"
  | "support_admin";

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
  business_type: "buyer" | "manufacturer" | "wholesaler" | "distributor";
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

export interface ProductCategory {
  id: string;
  label: string;
  unit: string;
  default_qty: number;
  created_at?: string;
}

export interface Product {
  id: string;
  business_id: string;
  category_id: string;
  title: string;
  slug: string;
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
  images?: Array<{ id: string; image_url: string }>;
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
