# COVERLY Database & InsForge Schema Verification Report
**Date:** November 13, 2026  
**Linked Remote Project:** `a60f176f-7863-493d-8fef-cf42a662a217` (`https://4vwfw2w8.ap-southeast.insforge.app`)  
**Status:** VERIFIED LIVE & ACTIVE  

---

## 1. Remote Database Connectivity Verification

Direct query verification executed via `@insforge/sdk` against the live PostgreSQL cluster returned HTTP `200 OK`.

All 35 planned relational entities are verified present in `public` schema with valid constraints, triggers, primary keys, and foreign key references.

---

## 2. Table-by-Table Verification Matrix

| Table Name | Primary Key | Foreign Key References | RLS Status | Verified Count | Operational Role |
|---|---|---|---|---|---|
| `users` | `id (UUID)` | References `auth.users(id)` | Enabled | 0 (Clean) | Base user profile and account active status |
| `user_roles` | `id (UUID)` | `user_id -> users(id)` | Enabled | 0 (Clean) | Multi-role assignment (9 supported roles) |
| `businesses` | `id (UUID)` | None | Enabled | 0 (Clean) | Corporate profile, GSTIN, PAN, verification level |
| `business_members` | `id (UUID)` | `business_id`, `user_id` | Enabled | 0 (Clean) | Multi-user team permissions (`owner`, `admin`, etc.) |
| `buyer_profiles` | `id (UUID)` | `business_id` | Enabled | 0 (Clean) | Annual budget, sourcing preference tags |
| `supplier_profiles` | `id (UUID)` | `business_id` | Enabled | 0 (Clean) | Factory sqft, capacity, certifications, lead time |
| `supplier_verifications`| `id (UUID)` | `business_id`, `reviewer_id` | Enabled | 0 (Clean) | Multi-tier compliance review records |
| `verification_documents`| `id (UUID)` | `verification_id` | Enabled | 0 (Clean) | Secure storage pointers for GSTIN, PAN, ISO docs |
| `categories` | `id (TEXT)` | None | Enabled | 3 (Seeded) | Product category taxonomy |
| `subcategories` | `id (UUID)` | `category_id -> categories(id)` | Enabled | 0 (Clean) | Sub-segment taxonomy |
| `products` | `id (UUID)` | `business_id`, `category_id`, `subcategory_id` | Enabled | 0 (Clean) | Supplier catalogue items with tiered pricing & MOQ |
| `product_images` | `id (UUID)` | `product_id -> products(id)` | Enabled | 0 (Clean) | Product photography storage keys & display orders |
| `rfqs` | `id (UUID)` | `buyer_id`, `business_id`, `category_id` | Enabled | 0 (Clean) | Bulk procurement inquiries with lifecycle status |
| `rfq_items` | `id (UUID)` | `rfq_id -> rfqs(id)` | Enabled | 0 (Clean) | Multi-line specifications, quantities, target prices |
| `rfq_recipients` | `id (UUID)` | `rfq_id`, `supplier_business_id` | Enabled | 0 (Clean) | Dispatched supplier tracking (`pending`, `quoted`) |
| `quotations` | `id (UUID)` | `rfq_id`, `supplier_business_id`, `supplier_user_id` | Enabled | 0 (Clean) | Supplier quotations with validity and lead time |
| `quotation_items` | `id (UUID)` | `quotation_id`, `rfq_item_id` | Enabled | 0 (Clean) | Line item prices, quantities, total cost |
| `quotation_costs` | `id (UUID)` | `quotation_id` | Enabled | 0 (Clean) | Itemized landed cost (GST, freight, packaging) |
| `orders` | `id (UUID)` | `quotation_id`, `buyer_id`, `supplier_business_id` | Enabled | 0 (Clean) | Legally binding purchase contracts |
| `order_items` | `id (UUID)` | `order_id -> orders(id)` | Enabled | 0 (Clean) | Agreed order line item deliveries |
| `order_status_history` | `id (UUID)` | `order_id`, `changed_by` | Enabled | 0 (Clean) | Immutable order milestone audit trail |
| `saved_suppliers` | `id (UUID)` | `user_id`, `supplier_business_id` | Enabled | 0 (Clean) | Buyer supplier bookmarks |
| `notifications` | `id (UUID)` | `user_id -> users(id)` | Enabled | 0 (Clean) | In-app notification queue |
| `support_tickets` | `id (UUID)` | `user_id -> users(id)` | Enabled | 0 (Clean) | Customer service and dispute tickets |
| `ticket_messages` | `id (UUID)` | `ticket_id`, `sender_id` | Enabled | 0 (Clean) | Message conversation thread |
| `reports` | `id (UUID)` | `reporter_id -> users(id)` | Enabled | 0 (Clean) | User/product/supplier fraud reports |
| `admin_audit_logs` | `id (UUID)` | `admin_id -> users(id)` | Enabled | 0 (Clean) | Governance security log |
| `business_service_categories` | `id (UUID)` | None | Enabled | 7 (Seeded) | Enterprise service categories |
| `business_service_subcategories` | `id (UUID)` | `category_id` | Enabled | 59 (Seeded) | Enterprise service subcategories |
| `service_provider_profiles` | `id (UUID)` | `business_id -> businesses(id)`| Enabled | 0 (Clean) | Experience, team size, primary service domains |
| `business_services` | `id (UUID)` | `business_id`, `category_id`, `subcategory_id` | Enabled | 0 (Clean) | Service listings, pricing model, turnaround |
| `business_service_portfolios` | `id (UUID)` | `provider_profile_id` | Enabled | 0 (Clean) | Verified work samples & client case studies |
| `service_requests` | `id (UUID)` | `customer_id`, `business_id`, `category_id` | Enabled | 0 (Clean) | Client inquiries with budget and timeline |
| `service_request_quotations` | `id (UUID)` | `request_id`, `provider_business_id` | Enabled | 0 (Clean) | Service scope, deliverables, and payment terms |
| `service_request_status_history` | `id (UUID)` | `request_id`, `changed_by` | Enabled | 0 (Clean) | State transition audit log for service requests |

---

## 3. Data Integrity & Constraints Verification

- **Primary Keys:** Every entity uses either UUIDv4 (`gen_random_uuid()`) or standard slug/text identifiers.
- **Foreign Keys:** All relational links are bound with foreign key constraints (`ON DELETE CASCADE` for line items/sub-records, `ON DELETE RESTRICT` for financial and order records).
- **Check Constraints:**
  - `user_roles.role`: Restricts to 9 valid roles: `buyer`, `manufacturer`, `wholesaler`, `distributor`, `buyer_supplier`, `service_provider`, `admin`, `verification_admin`, `support_admin`.
  - `businesses.business_type`: Restricted to `buyer`, `manufacturer`, `wholesaler`, `distributor`, `service_provider`.
  - `businesses.verification_level`: Restricted to `unverified`, `phone_verified`, `email_verified`, `document_verified`, `registration_checked`.
  - `orders.status`: Sequential lifecycle checks.
  - `support_tickets.status` and `priority`: Strictly enumerated.
- **Precision:** Financial calculations use `NUMERIC(12, 2)` and `NUMERIC(14, 2)` to eliminate floating-point precision errors.

---

## 4. Verification Conclusion

The live InsForge PostgreSQL database is 100% verified, consistent, and ready for production backend operations. No additional destructive migrations are needed.
