# COVERLY – Multi-Logistics Marketplace Implementation Report
## Guest + Logistics Partner + Admin | Complete Full-Stack Architecture

**Platform:** COVERLY (`D:\project\Coverly-main`)  
**Backend:** Node.js, Express.js, TypeScript, InsForge PostgreSQL BaaS  
**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router v6  
**Module:** Multi-Vendor Logistics & Freight Marketplace  
**Date:** November 17, 2026  
**Status:** Implemented, Tested (32/32 Passed), Production Build Clean (Zero Errors)

---

## 1. Executive Summary & Architecture Overview

The **COVERLY Multi-Logistics Marketplace** is a full-stack, enterprise-grade B2B freight discovery, quotation comparison, and consignment tracking module seamlessly integrated into the existing COVERLY platform.

The system synthesizes three primary business paradigms:
1. **Amazon / Flipkart-Style Shipment Tracking**: A 15-state visual milestone timeline tracking parcels and bulk cargo from `booking_confirmed` through `pickup_scheduled`, `pickup_completed`, `in_transit` (linehaul highway corridors), `reached_sorting_facility`, `reached_destination_hub`, `out_for_delivery`, to `delivered` (with digital Proof of Delivery).
2. **IndiaMART-Style Carrier Discovery**: A public directory of independent Indian fleet operators, intermodal freight forwarders, and cold-chain carriers searchable by origin city, destination hub, category (FTL, PTL, Bulk, Parcel), and vehicle type.
3. **Multi-Carrier Competitive Quotation Engine**: A unified shipment booking wizard where customers submit cargo specifications and receive competing, itemized landed-cost quotations (base freight, fuel surcharge, handling, insurance, exact 18% GST). Customers can compare quotes side-by-side and accept one valid quotation.

```mermaid
flowchart TD
    Guest["Guest / Business Shipper"] -->|Explore Modes & Directory| MarketplaceHome["Logistics Marketplace Homepage (/logistics)"]
    MarketplaceHome -->|Search Carriers by Lane & Mode| Directory["Logistics Carrier Directory (/logistics/companies)"]
    MarketplaceHome -->|Submit Cargo Specs| BookingWizard["Shipment Booking Wizard (/logistics/book)"]
    
    BookingWizard -->|Persist Requirement| ShipmentReqs[("shipment_requests (PostgreSQL)")]
    ShipmentReqs -->|Multi-Provider Matching| Recips[("logistics_enquiry_recipients")]
    
    Recips -->|Notify Eligible Carriers| PartnerConsole["Logistics Partner Portal (/logistics-partner)"]
    PartnerConsole -->|Submit Landed Freight Quote| Quotes[("logistics_quotations")]
    
    Quotes -->|Side-by-Side Comparison| ShipperReview["Quotation Comparison View"]
    ShipperReview -->|Accept ONE Valid Quote| BookingConfirmed["Booking Created Exactly Once"]
    
    BookingConfirmed --> Bookings[("logistics_bookings")]
    Bookings -->|Generate Tracking ID| TrackingEvents[("shipment_tracking_events")]
    
    PartnerConsole -->|Advance Status & Proof| TrackingEvents
    TrackingEvents -->|Safe Public Tracking (Masked PII)| PublicTracking["Live Amazon/Flipkart-Style Tracking (/logistics/track)"]
    
    Admin["Admin Control Center (/admin/logistics)"] -->|Audit & Monitor| Bookings
    Admin -->|Resolve Complaints| Complaints[("logistics_complaints")]
```

---

## 2. Existing Architecture Audit

Prior to implementation, the codebase was audited:
- **Authentication**: InsForge JWT session handling in `backend/src/middleware/auth.ts`, supporting roles: `buyer`, `manufacturer`, `wholesaler`, `distributor`, `service_provider`, `admin`.
- **Database**: Remote InsForge PostgreSQL (`https://4vwfw2w8.ap-southeast.insforge.app`), with existing businesses, products, concierge leads, and audit logs.
- **Data Preservation Compliance**:
  - No existing database tables or records were modified, dropped, or deleted.
  - Zero mock APIs or fabricated success responses were added.
  - Transparent fallback queries ensure zero downtime even during schema transitions.

---

## 3. Database Schema & Migration Architecture

File: `migrations/20261117120000_logistics_marketplace.sql`

The migration defines 9 core relational tables, multi-column indexes, and Row Level Security (RLS) policies:

| Table Name | Primary Purpose | Key Fields |
| :--- | :--- | :--- |
| `logistics_profiles` | Carrier fleet specifications & corridors | `business_id`, `operating_routes`, `serviceable_states`, `transport_modes`, `fleet_size`, `vehicle_types`, `rating` |
| `logistics_services` | Published carrier services | `company_id`, `category` (FTL/PTL/Parcel/Bulk/Cold Chain), `transport_mode`, `pricing_model`, `base_rate`, `min_charge`, `transit_time_days` |
| `logistics_routes` | Operating origin-destination pairs | `company_id`, `origin_city`, `destination_city`, `distance_km`, `estimated_transit_hours` |
| `shipment_requests` | Customer / Guest cargo requirements | `request_number`, `pickup_address`, `pickup_city`, `delivery_address`, `delivery_city`, `weight_kg`, `goods_category`, `is_fragile`, `status` |
| `logistics_enquiry_recipients`| Multi-provider matching association | `shipment_request_id`, `company_id`, `status` (`sent`, `viewed`, `quoted`, `declined`) |
| `logistics_quotations` | Competing carrier landed-cost quotes | `quotation_number`, `shipment_request_id`, `company_id`, `base_freight`, `fuel_surcharge`, `handling_charges`, `gst_amount`, `total_freight_inr` |
| `logistics_bookings` | Confirmed bookings upon quote acceptance | `booking_number`, `tracking_number`, `quotation_id`, `company_id`, `customer_id`, `status`, `total_amount`, `vehicle_number`, `driver_name` |
| `shipment_tracking_events` | Granular Amazon-style milestone log | `booking_id`, `tracking_number`, `status`, `location`, `description`, `proof_doc_url`, `event_source`, `created_at` |
| `logistics_complaints` | Customer dispute & exception tickets | `ticket_number`, `booking_id`, `category`, `description`, `status`, `resolution_notes` |

### Row Level Security (RLS) Policies
- **Public Read Access**: Approved logistics services, active operating routes, and safe tracking events are publicly readable without authentication.
- **Provider Isolation**: Logistics companies can only access their own assigned enquiries, quotations, bookings, and service listings via `business_members` ownership checks.
- **Customer Privacy Protection**: Public tracking discloses carrier name, vehicle category, route, and milestone timeline, while strictly redacting customer phone numbers, street addresses, and financial payment details.
- **Admin Governance**: Platform administrators possess global audit, suspension, and moderation privileges.

---

## 4. Backend Implementation & API Documentation

File: `backend/src/routes/logistics.ts` (mounted under `/api` in `backend/src/app.ts`)

### A. Public Discovery & Tracking Endpoints
- `GET /api/logistics/categories`: Returns master logistics categories, transport modes, and standard vehicle types.
- `GET /api/logistics/companies`: Directory of verified carriers with pagination and filtering by `city`, `state`, `category`, and `verification`.
- `GET /api/logistics/companies/:slug`: Comprehensive carrier dossier (fleet size, vehicle models, operating corridors, published rate table).
- `GET /api/logistics/services`: Lists published freight services with transport mode filters.
- `POST /api/logistics/enquiries`: Validates cargo specifications, executes safety screening against prohibited cargo (explosives, narcotics, weapons), persists requirement, and matches eligible carriers.
- `GET /api/logistics/track/:trackingNumber`: Public safe tracking endpoint returning milestone progression and current location with strict PII masking.

### B. Customer / Shipper Endpoints
- `GET /api/logistics/my-requests`: Authenticated customer's shipment requests.
- `GET /api/logistics/my-requests/:id`: Request details with side-by-side competing carrier quotations.
- `POST /api/logistics/quotations/:id/accept`: Accepts ONE quotation. Transitions chosen quote to `accepted`, marks competitors as `rejected`, generates unique `LBK-...` booking and `CVL-TRK-...` tracking references, and records the initial tracking milestone.

### C. Logistics Partner Endpoints
- `GET /api/logistics/partner/profile` & `PATCH /api/logistics/partner/profile`: Manage fleet, operating routes, and serviceable states.
- `GET /api/logistics/partner/services` & `POST /api/logistics/partner/services`: Publish and manage freight services.
- `GET /api/logistics/partner/enquiries`: View incoming customer shipment requirements.
- `POST /api/logistics/partner/enquiries/:id/quotation`: Formulate transparent landed-cost quotations.
- `GET /api/logistics/partner/bookings`: Manage assigned confirmed bookings.
- `PATCH /api/logistics/partner/bookings/:id/status`: Advance shipment tracking through the 15-state lifecycle with location notes, driver contact, vehicle registration, and digital Proof of Delivery.
- `GET /api/logistics/partner/analytics`: Aggregates real metrics (total enquiries, quotes submitted, accepted quotes, active shipments, delivered shipments, revenue).

### D. Admin Governance Endpoints
- `GET /api/admin/logistics/metrics`: Aggregates real-time marketplace KPIs.
- `GET /api/admin/logistics/partners`: Review registered carriers and verification tiers.
- `GET /api/admin/logistics/bookings`: Monitor all active shipments across India.
- `GET /api/admin/logistics/complaints`: Oversee dispute resolution and customer complaints.

---

## 5. Frontend User Experience Implementation

All pages built using COVERLY design standards (Tailwind CSS, Lucide icons, responsive layout):

1. **Logistics Marketplace Homepage (`LogisticsHomePage.tsx` at `/logistics`)**:
   - Hero banner with quick freight estimation form (Pickup, Delivery, Category, Weight, Service Type).
   - Instant "Track Your Consignment" quick widget.
   - 9 Primary Service Categories (FTL, PTL, Parcel, Bulk, Cold Chain, Warehousing, Container, Packers & Movers, Freight Forwarding).
   - 5 Transportation Modes (Road Express, Rail Cargo, Air Cargo, Sea Freight, Multimodal).
   - "Why Book on COVERLY Logistics" value proposition.

2. **Carrier Directory (`LogisticsDirectoryPage.tsx` at `/logistics/companies`)**:
   - Filterable directory by operating city, logistics category, transport mode, and verification tier.
   - Carrier cards displaying fleet size, rating, key corridors, vehicle categories, and CTAs.

3. **Carrier Dossier (`LogisticsCompanyDetailPage.tsx` at `/logistics/companies/:slug`)**:
   - Verified carrier badges, rating breakdown, fleet metrics.
   - Published Freight Services & Rates table with base rates, minimum charges, and transit times.
   - Serviced states badges and regular freight corridors.

4. **Shipment Booking & Multi-Carrier Comparison (`LogisticsBookingPage.tsx` at `/logistics/book`)**:
   - **Step 1: Shipment Specs**: Detailed origin/destination addresses, contacts, cargo weight, dimensions, package types, hazardous/fragile flags, and declared value. Client-side prohibited goods validation.
   - **Step 2: Compare Matching Carriers**: Side-by-side carrier cards showing fleet size, route coverage, and estimated transit days. Shipper selects multiple carriers to receive competitive quotes.
   - **Step 3: Confirmation Dossier**: Displays unique `SHP-2026-...` reference and tracking instructions.

5. **Amazon / Flipkart-Style Shipment Tracking (`LogisticsTrackingPage.tsx` at `/logistics/track`)**:
   - Visual vertical timeline stepper showing exact milestone history (`booking_confirmed` &rarr; `pickup_scheduled` &rarr; `pickup_completed` &rarr; `in_transit` &rarr; `reached_sorting_facility` &rarr; `reached_destination_hub` &rarr; `out_for_delivery` &rarr; `delivered`).
   - Dynamic status pills, carrier details, current location, estimated delivery date.
   - Strict privacy safeguards: Customer personal phone numbers and financial details are completely concealed.

6. **Logistics Partner Portal (`PartnerDashboardPage.tsx` at `/logistics-partner`)**:
   - Analytics KPI ribbon: Enquiries, Quotes, Accepted Bookings, Active Shipments, Delivered, Conversion Rate.
   - Interactive tabs for Incoming Enquiries, Active Bookings, and Published Services.
   - Modal for formulating landed freight quotations.
   - Modal for advancing shipment milestones with driver/vehicle registration and proof of delivery.

7. **Admin Logistics Control Center (`AdminLogisticsPage.tsx` at `/admin/logistics`)**:
   - 7-metric real-time operational dashboard.
   - Tabbed consoles for Carriers Governance, Live Shipment Monitoring, and Disputes & Complaints.

8. **Navigation & Global Layout Integration (`PublicLayout.tsx`)**:
   - Added "Logistics & Freight" to primary category header.
   - Added "Track Consignment" direct shortcut button in top bar.

---

## 6. End-to-End Automated Workflow Tests Verification

File: `backend/test/logistics_workflows.test.ts` (executed alongside existing suites via `npm --prefix backend test`)

**Result: 32 tests passing across 5 suites, 0 failures**

```
▶ Smart Landed Cost Engine Tests (5 tests)
  ✔ calculates basic landed cost accurately with 18% GST
  ✔ handles percentage input for GST rate
  ✔ applies discounts before calculating GST taxable amount
  ✔ prevents negative values and handles zero quantities safely
  ✔ rounds decimal numbers to two places accurately
✔ Smart Landed Cost Engine Tests (4.47ms)

▶ COVERLY Multi-Logistics Marketplace Integration Tests (7 tests)
  ✔ Workflow L: Logistics Partner Onboarding, Fleet & Service Configuration
  ✔ Workflow M: Public Shipment Enquiry & Multi-Provider Matching
  ✔ Workflow N: Multi-Provider Quotations, Landed Freight Breakdown & Comparison
  ✔ Workflow O: Quotation Acceptance & Booking State Machine
  ✔ Workflow P: Real-Time Shipment Tracking Lifecycle (15-State Stepper)
  ✔ Workflow Q: Safe Public Tracking Privacy & PII Redaction
  ✔ Workflow R: Admin Logistics Governance & Marketplace Metrics Aggregation
✔ COVERLY Multi-Logistics Marketplace Integration Tests (4.20ms)

▶ RFQ & Order Lifecycle State Machine Tests (4 tests)
  ✔ permits standard forward progression
  ✔ blocks backward state jumps
  ✔ prevents cancellation once in production/shipped
  ✔ correctly identifies quotation expiry
✔ RFQ & Order Lifecycle State Machine Tests (6.66ms)

▶ Security & Authorization Middleware Tests (5 tests)
  ✔ allows access when user possesses required role
  ✔ blocks access and returns 403 when lacking role
  ✔ always grants access to admin role
  ✔ requireAdmin passes for support_admin and verification_admin
  ✔ requireAdmin rejects unauthenticated users with 403
✔ Security & Authorization Middleware Tests (3.95ms)

▶ COVERLY End-to-End Business Workflow Integration Tests (11 tests)
  ✔ Workflows A - K (Manufacturer, Wholesaler, Distributor & Admin)
✔ COVERLY End-to-End Business Workflow Integration Tests (11.63ms)

Total: 32 passing, 0 failing (722 ms)
```

---

## 7. Production Build Verification

- **Backend TypeScript Compilation**: `npm --prefix backend run build` (`tsc -p tsconfig.json`) &rarr; **0 errors, Exit code 0**.
- **Frontend Vite Bundle**: `npm --prefix frontend run build` (`tsc -b && vite build`) &rarr; **0 errors, 2,130 modules transformed, Exit code 0**.

---

## 8. Known Limitations & Pending External Integrations

1. **Third-Party Telematics / GPS Webhooks (Mode B Tracking)**:
   - Manual tracking (Mode A) is fully implemented and operational with 15 granular statuses.
   - Mode B (direct telematics webhooks from GPS vendors like WheelsEye, BlackBuck, or Fleetx) is architected via `event_source = 'carrier_api'`, ready to be activated once live production API keys and webhook credentials are provided by the client.
2. **Third-Party Payment Gateway for Freight Deposits**:
   - The booking state machine generates real bookings in `payment_status = 'pending'`. Direct integration with Stripe or Razorpay can be bound to the `/api/logistics/quotations/:id/accept` handler when payment credentials are confirmed.

---

## 9. Conclusion

The COVERLY Multi-Logistics Marketplace is fully implemented, verified across all layers (database migration, backend controllers, automated test suites, responsive frontend UI, and role-based access), and ready for deployment upon client authorization.
