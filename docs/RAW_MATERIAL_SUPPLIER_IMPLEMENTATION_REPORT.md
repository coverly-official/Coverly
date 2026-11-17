# COVERLY — RAW MATERIAL SUPPLIER MARKETPLACE
## Guest + Raw Material Supplier + Admin | Complete Full-Stack Implementation Report

**Platform:** COVERLY B2B Wholesale, Manufacturing & Commodity Marketplace  
**Environment:** Production-ready Full-Stack Implementation  
**InsForge PostgreSQL:** `https://4vwfw2w8.ap-southeast.insforge.app`  
**Test Suite:** 66 / 66 Passing Tests across 9 suites (100% Pass Rate)

---

## 1. Executive Summary

The **Raw Material Supplier Marketplace** has been fully integrated into the COVERLY platform. This system bridges primary mills, agricultural syndicates, chemical refiners, textile spinners, polymer compounders, and metal stockists directly with manufacturing plants, converters, factories, and commercial buyers.

Key capabilities delivered:

1. **9 Standardized Raw Material Categories**:
   - Comprehensive taxonomies with category-specific technical specification blueprints (e.g. yield strength and elongation for steel, moisture and purity for agro commodities, melt flow index and density for polymers).
2. **Public Discovery & Technical Product Directory**:
   - Searchable product directory (`/raw-materials/products`) with real-time filtering across categories, subcategories, material grades, origin, lead times, and MOQ.
   - Interactive side-by-side technical comparison drawer permitting simultaneous evaluation of up to 4 raw material specifications.
3. **Supplier Directory & Warehouse Dossiers**:
   - Registered supplier index (`/raw-materials/suppliers`) with verification badges, warehouse locations (state, city, capacity, ISO compliance), and published material catalogs.
4. **Guest Bulk RFQ Submission & Identity-Preserving Conversion**:
   - Frictionless RFQ submission (`RM-RFQ-XXXX-XXX`) for unregistered buyers with material requirements, technical tolerances, required quantity, and delivery destination.
   - Seamless retrospective claiming (`POST /api/raw-materials/guest-claim`) linking unauthenticated RFQs to newly registered or logged-in buyer accounts.
5. **Itemized Landed Cost Quotation Engine**:
   - Formal quotations (`RM-QT-XXXX-XXX`) with transparent landed cost breakdowns: base unit price, tiered bulk discount, specialized packaging, loading/handling, freight charges, transit insurance, and decimal-safe 18% GST calculation.
6. **Atomic Single-Winner Order Generation**:
   - Buyer acceptance atomically confirms the chosen quotation, generates an official purchase order (`RM-ORD-XXXX-XXX`), locks inventory for tracked items, and marks competing quotes as rejected.
7. **12-State Order Progression Lifecycle**:
   - Stepper transitioning through `order_created` ➔ `confirmed` ➔ `processing` ➔ `preparing_for_dispatch` ➔ `dispatched` ➔ `in_transit` ➔ `out_for_delivery` ➔ `delivered` ➔ `inspection_passed` ➔ `completed` with tracking number and dispatch documentation logging.
8. **Admin Governance & Compliance Console**:
   - Dedicated portal (`/admin/raw-materials`) providing platform-wide commodity metrics, supplier accreditation verification (Approve / Reject / Suspend with audit logs), and technical listing moderation.

---

## 2. Database Schema & Architecture

Migration script: `migrations/20261117160000_raw_material_marketplace.sql`

```mermaid
erDiagram
    users ||--o| raw_material_supplier_profiles : operates
    businesses ||--o| raw_material_supplier_profiles : registers
    raw_material_categories ||--o{ raw_material_subcategories : contains
    raw_material_categories ||--o{ raw_material_products : classifies
    raw_material_supplier_profiles ||--o{ raw_material_products : manufactures_supplies
    raw_material_products ||--o{ raw_material_rfqs : references
    raw_material_rfqs ||--o{ raw_material_rfq_recipients : routes
    raw_material_supplier_profiles ||--o{ raw_material_rfq_recipients : receives
    raw_material_rfq_recipients ||--o| raw_material_quotations : submits
    raw_material_quotations ||--o| raw_material_orders : generates
    raw_material_orders ||--o{ raw_material_order_history : tracks
    raw_material_orders ||--o{ raw_material_complaints : audits
```

### Table Definitions:

1. **`raw_material_categories` & `raw_material_subcategories`**:
   - Seeded with 9 primary sectors and 27 subcategories.
   - Includes standard units of measurement (MT, KG, Litres, Barrels, Metres, Sq.Ft, Pieces) and dynamic specification attributes for each category.

2. **`raw_material_supplier_profiles`**:
   - `id`: UUID (Primary Key)
   - `business_id`: References `businesses(id)`
   - `user_id`: References `auth.users(id)`
   - `supplier_type`: Enum (`manufacturer`, `raw_material_trader`, `wholesaler`, `distributor`, `importer`, `exporter`, `agricultural_commodity_supplier`)
   - `warehouses`: JSONB array of storage locations `[{ name, city, state, capacity_sqft, cold_storage_available, temperature_controlled }]`
   - `certifications`: Text array (e.g. `ISO 9001:2015`, `FSSAI`, `REACH`, `RoHS`, `AGMARK`)
   - `supply_capacity_monthly`: Numeric quantity with unit of measurement
   - `verification_status`: Enum (`pending`, `verified`, `rejected`, `suspended`)
   - `verification_notes`, `verified_at`: Audit log details

3. **`raw_material_products`**:
   - `id`: UUID (Primary Key)
   - `supplier_id`: References `raw_material_supplier_profiles(id)`
   - `business_id`: References `businesses(id)`
   - `category_id`, `subcategory_id`: Taxonomy links
   - `material_grade`: Standard grade designation (e.g., `SS 304L`, `HDPE Virgin Grade 50MA180`, `100% Combed Cotton 40s Count`)
   - `origin`: Country/State of production (e.g. `Bhilai, Chhattisgarh, India`)
   - `quality_standards`: Text array of formal certifications (e.g., `ASTM A240`, `IS 2062`, `OEKO-TEX Standard 100`)
   - `specifications`: JSONB key-value map storing technical parameters
   - `unit_of_measurement`: Standard unit (MT, KG, etc.)
   - `moq`: Minimum Order Quantity
   - `base_price`: Base price per unit before volume discounts
   - `bulk_pricing_tiers`: JSONB array `[{ min_qty, max_qty, price_per_unit, discount_pct }]`
   - `maintains_inventory`: Boolean flag distinguishing stockists from make-to-order primary producers
   - `stock_quantity`, `available_quantity`: Physical and unreserved inventories
   - `lead_time_days`: Fulfillment lead time
   - `moderation_status`: Enum (`pending`, `approved`, `rejected`)

4. **`raw_material_rfqs`**:
   - `id`: UUID (Primary Key)
   - `rfq_number`: Unique reference (`RM-RFQ-YYYYMMDD-XXXX`)
   - `buyer_id`: Nullable foreign key to `auth.users(id)` (supports guest submissions)
   - `guest_name`, `guest_email`, `guest_phone`, `guest_company`: Guest contact information
   - `category_id`, `product_id`: Material reference
   - `material_name`, `grade_preference`: Requirement identifiers
   - `required_quantity`, `unit`: Sourcing volume
   - `target_price`: Optional buyer budget ceiling
   - `required_specifications`: JSONB technical tolerances requested
   - `delivery_city`, `delivery_state`, `delivery_pincode`: Destination
   - `target_delivery_date`: Desired receipt date
   - `status`: 7-state lifecycle (`open`, `matched`, `quotes_received`, `partially_quoted`, `accepted`, `expired`, `cancelled`)

5. **`raw_material_rfq_recipients`**:
   - Routes dispatched RFQs to eligible suppliers with statuses: `pending`, `viewed`, `quoted`, `declined`.

6. **`raw_material_quotations`**:
   - `id`: UUID (Primary Key)
   - `quotation_number`: Unique reference (`RM-QT-YYYYMMDD-XXXX`)
   - `rfq_id`, `supplier_id`: Relational links
   - `unit_price`, `quantity`, `subtotal`: Base financials
   - `bulk_discount_amount`: Tier-based savings
   - `packaging_charges`, `loading_charges`: Material handling fees
   - `freight_charges`, `insurance_charges`: Logistics and transit risk coverage
   - `gst_amount`: Decimal-safe 18% Goods & Services Tax
   - `total_landed_cost`: Net payable by buyer
   - `payment_terms`, `lead_time_days`, `valid_until`: Contract terms
   - `status`: Enum (`draft`, `submitted`, `accepted`, `rejected`, `expired`, `withdrawn`)

7. **`raw_material_orders`**:
   - `id`: UUID (Primary Key)
   - `order_number`: Unique reference (`RM-ORD-YYYYMMDD-XXXX`)
   - `quotation_id`, `rfq_id`, `supplier_id`, `buyer_id`: Cross-entity linkage
   - `agreed_price_per_unit`, `quantity`, `total_amount`: Finalized order value
   - `order_status`: 12-state lifecycle enum
   - `payment_status`: Enum (`pending`, `advance_paid`, `escrow_held`, `released`, `refunded`)
   - `dispatch_date`, `tracking_number`, `transporter_name`: Logistics tracking
   - `delivery_date`, `quality_inspection_notes`: Handover verification

---

## 3. The 9 Core Raw Material Categories & Specification Blueprints

| # | Category Domain | Typical Subcategories | Primary Units | Key Technical Specifications in JSONB |
|---|---|---|---|---|
| 1 | **Agricultural Commodities & Grains** | Grains & Cereals, Oilseeds, Pulses & Legumes | Metric Ton (MT), KG | Moisture %, Foreign Matter %, Purity %, Crop Year, Oil Content %, Admixture % |
| 2 | **Food Processing Ingredients** | Edible Oils, Sweeteners & Sugar, Spices & Oleoresins | Metric Ton, Litres, Drums | FFA (Free Fatty Acid) %, Iodine Value, Brix Value, Peroxide Value, Mesh Size |
| 3 | **Industrial Metals, Steel & Alloys** | Mild Steel (MS), Stainless Steel, Non-Ferrous | MT, KG | Tensile Strength (MPa), Yield Strength (MPa), Elongation %, Chemical Composition (C, Mn, Cr, Ni) |
| 4 | **Polymers, Resins & Plastics** | Polyethylene (HDPE/LDPE/LLDPE), Polypropylene, PVC | MT, KG | Melt Flow Index (MFI g/10min), Density (g/cm³), Tensile Modulus, Izod Impact Strength |
| 5 | **Textiles, Yarns & Raw Fabrics** | Cotton Fibers & Yarn, Synthetic Filaments, Greige Fabric | MT, KG, Metres | Yarn Count (Ne/Nm), CSP, Twist Per Inch (TPI), Tenacity (g/denier), GSM, Construction (EPI/PPI) |
| 6 | **Construction Raw Materials** | Portland Cement, Aggregates & Sand, Structural Timber | MT, Brass, Cubic Metres | Compressive Strength (28-day MPa), Fineness (Blaine), Specific Gravity, Sieve Analysis % Passing |
| 7 | **Packaging Raw Materials** | Kraft Paper, Duplex Board, Plastic Granules for Film | MT, Reams | GSM, Burst Factor (BF), Cobb Value (60s), Caliper Thickness (microns), Moisture % |
| 8 | **Wood, Timber & Engineered Board** | Raw Hardwood/Softwood Logs, Commercial Plywood, MDF | Cubic Metres, Cubic Feet, Sq.Ft | Moisture Content %, Density (kg/m³), Formaldehyde Emission Grade (E0/E1), Surface Finish |
| 9 | **Electronics & Semiconductor** | Copper Clad Laminates (CCL), Solder Materials, Pure Silicon | KG, Sq.Metres, Pieces | Copper Foil Thickness (oz), Glass Transition Temp (Tg), Solder Alloy Ratio (Sn/Pb/Ag), Purity % |

---

## 4. Pricing Models & Landed Cost Calculation Engine

The engine calculates landed costs with decimal precision to eliminate rounding drift across multi-ton commodity orders:

$$\text{Subtotal} = \text{Quantity} \times \text{Base Price}$$
$$\text{Bulk Discount} = \text{Subtotal} \times \left(\frac{\text{Tier Discount \%}}{100}\right)$$
$$\text{Taxable Base} = (\text{Subtotal} - \text{Bulk Discount}) + \text{Packaging} + \text{Loading} + \text{Freight} + \text{Transit Insurance}$$
$$\text{GST (18\%)} = \text{Taxable Base} \times 0.18$$
$$\text{Total Landed Cost} = \text{Taxable Base} + \text{GST}$$

### Inventory Control & Oversell Prevention
- **Inventory-Tracked Products (`maintains_inventory = true`)**:
  - The system checks available unreserved stock: `available_quantity = stock_quantity - reserved_quantity`.
  - When a buyer accepts an itemized quotation, `reserved_quantity` atomically increments by order quantity, locking stock.
  - If requested quantity exceeds available quantity, order placement is blocked.
- **Availability-Based Make-to-Order (`maintains_inventory = false`)**:
  - Primary mills and syndicates produce based on agreed production runs and lead times (e.g. 15–30 days) governed by `supply_capacity_monthly`.

---

## 5. RFQ & Order Lifecycle State Machines

```mermaid
stateDiagram-v2
    [*] --> open: Guest / Buyer Submits RFQ
    open --> matched: Auto-routed to Relevant Suppliers
    matched --> quotes_received: Suppliers Submit Quotations
    quotes_received --> accepted: Buyer Accepts Best Quote
    quotes_received --> expired: Quotation Window Lapses
    open --> cancelled: Buyer Withdraws RFQ

    accepted --> order_created: Auto-generate Purchase Order
    order_created --> confirmed: Supplier Confirms Order
    confirmed --> processing: Raw Material Milling / Batching
    processing --> preparing_for_dispatch: Quality Checks & Packaging
    preparing_for_dispatch --> dispatched: Handed to Logistics Carrier
    dispatched --> in_transit: Freight In Route
    in_transit --> out_for_delivery: Final Mile Delivery
    out_for_delivery --> delivered: Consignment Received at Warehouse
    delivered --> inspection_passed: Buyer Laboratory / Weight Gate Cleared
    inspection_passed --> completed: Final Invoicing & Settlement
    
    order_created --> cancelled: Pre-dispatch Cancellation
    delivered --> disputed: Specification Mismatch / Quality Rejection
```

---

## 6. API Reference (Backend Routes)

Mounted in `backend/src/routes/raw-materials.ts`:

### Public Discovery & Guest APIs
- `GET /api/raw-materials/categories`: Returns all 9 categories with nested subcategories and units.
- `GET /api/raw-materials/products`: Search and filter published products (keyword, category, grade, location, MOQ, page).
- `GET /api/raw-materials/products/:slug`: Complete product dossier including specifications, bulk pricing tiers, and supplier info.
- `GET /api/raw-materials/suppliers`: Directory of verified raw material mills, traders, and stockists.
- `GET /api/raw-materials/suppliers/:id`: Supplier profile, verified warehouses, certifications, and product catalog.
- `POST /api/raw-materials/rfqs`: Submit bulk RFQ (open to both unregistered guests and authenticated buyers).
- `GET /api/raw-materials/rfqs/:rfqNumber`: Lookup RFQ status and review received supplier quotations.
- `POST /api/raw-materials/guest-claim`: Retroactively link guest RFQs to an authenticated buyer account upon login.

### Raw Material Supplier Portal APIs
- `POST /api/raw-material-supplier/register`: Onboard as a raw material supplier with warehouse specifications and certifications.
- `GET /api/raw-material-supplier/profile`: Retrieve authenticated supplier dossier.
- `PUT /api/raw-material-supplier/profile`: Update contact details, warehouse locations, and monthly capacity.
- `GET /api/raw-material-supplier/products`: Fetch managed product listings with inventory counters.
- `POST /api/raw-material-supplier/products`: Publish a new raw material product with specifications JSON and bulk tiers.
- `PUT /api/raw-material-supplier/products/:id`: Update technical specifications, base price, tiers, or inventory.
- `GET /api/raw-material-supplier/rfqs`: View matched RFQs awaiting quotation.
- `POST /api/raw-material-supplier/quotations`: Submit itemized landed-cost quotation.
- `GET /api/raw-material-supplier/orders`: View customer orders and active fulfillment steppers.
- `PUT /api/raw-material-supplier/orders/:id/status`: Advance fulfillment status with tracking number and dispatch notes.

### Buyer Transaction APIs
- `POST /api/raw-materials/quotations/:id/accept`: Accept quotation, generate official purchase order, and reject rival quotes.
- `GET /api/raw-materials/orders/:orderNumber`: Retrieve order tracking details and dispatch history.

### Admin Governance APIs
- `GET /api/admin/raw-materials/stats`: Aggregate marketplace metrics (suppliers, products, RFQs, order volumes, gross GMV).
- `GET /api/admin/raw-materials/suppliers`: Review registered suppliers awaiting accreditation.
- `POST /api/admin/raw-materials/suppliers/:id/verify`: Approve, reject, or suspend supplier credentials with audit notes.
- `GET /api/admin/raw-materials/products`: Review product listings pending moderation.
- `POST /api/admin/raw-materials/products/:id/moderate`: Approve or reject product listings.

---

## 7. Frontend User Experience

All user interfaces adhere strictly to the existing Coverly design system, Tailwind CSS styling, responsive desktop/mobile layouts, and real backend connections:

1. **Guest Raw Materials Homepage (`/raw-materials`)**:
   - Hero search banner allowing multi-variable searches (Material Name, Category, Quantity, UOM, and City/State).
   - Category grid displaying all 9 core raw material sectors with live product count indicators.
   - Quick RFQ banner directing industrial buyers to submit instant bulk specifications.

2. **Technical Product Directory (`/raw-materials/products`)**:
   - Sidebar filters for Category, Subcategory, Material Grade, Origin, Minimum Order Quantity, and Verified Supplier status.
   - Grid cards displaying unit pricing, bulk discount tags, lead times, and MOQ.
   - Interactive **Specification Comparison Modal**: Allows comparing up to 4 materials side-by-side across Tensile Strength, Chemical Composition, Purity, Yield Strength, Origin, and Landed Price.

3. **Product Technical Dossier (`/raw-materials/products/:slug`)**:
   - Full technical specification matrix dynamically rendered based on category attributes.
   - Volume pricing table with savings percentages.
   - Warehouse location information and supplier credentials.
   - Instant "Request Bulk Quotation" modal pre-populating material details.

4. **Registered Supplier Directory & Dossiers (`/raw-materials/suppliers`, `/raw-materials/suppliers/:id`)**:
   - Verified supplier cards with warehouse capacities, ISO/FSSAI badges, and product categories.
   - Supplier profile page featuring tabbed navigation: Company Overview, Warehouse Locations (with cold storage indicators), Certifications, and Published Product Catalog.

5. **Guest Bulk RFQ Portal (`/raw-materials/rfq`)**:
   - Multi-step sourcing wizard for unregistered buyers and procurement managers.
   - Instant issue of tracking reference (`RM-RFQ-...`).

6. **Raw Material Supplier Portal Dashboard (`/raw-material-supplier/dashboard`)**:
   - 5 comprehensive management tabs:
     1. *Overview*: Revenue counters, active RFQs, processing orders, stock alerts.
     2. *Product Catalog*: Create/edit products, manage technical specifications JSON, adjust bulk pricing tiers, update stock levels.
     3. *RFQs & Leads*: Review incoming buyer RFQs, view technical tolerances, submit itemized landed-cost quotations.
     4. *Orders & Dispatch*: Track confirmed orders, advance fulfillment stepper (`confirmed` ➔ `dispatched` ➔ `delivered`), attach transporter name and consignment tracking numbers.
     5. *Warehouses & Profile*: Configure warehouse storage facilities, cold storage flags, and accredited quality certifications.

7. **Admin Governance Console (`/admin/raw-materials`)**:
   - 4 administrative tabs:
     1. *Marketplace Metrics*: Visual counters for active suppliers, catalog products, open RFQs, active orders, and gross platform GMV.
     2. *Supplier Verification*: Review supplier licenses, tax IDs, and warehouses with Approve, Reject, and Suspend actions.
     3. *Product Moderation*: Review new commodity listings and technical specifications before public discovery.
     4. *RFQ & Order Monitoring*: Track buyer RFQ activity and delivery fulfillment integrity.

---

## 8. Automated Test Suite & Verification

The integration test suite was developed in `backend/test/raw_materials_workflows.test.ts` using Node.js's native test runner (`tsx --test`), exercising all business workflows:

```
▶ COVERLY Raw Material Supplier Marketplace Integration Tests
  ✔ Workflow RM-1: Raw Material Supplier Onboarding & Multi-Warehouse Configuration (2.4331ms)
  ✔ Workflow RM-2: Specification-Driven Product Publishing & Multi-Tier Pricing (0.3208ms)
  ✔ Workflow RM-3: Stock Allocation & Oversell Prevention for Inventory-Tracked Items (0.2926ms)
  ✔ Workflow RM-4: Unregistered Guest Bulk RFQ Submission with Unique Reference (0.5897ms)
  ✔ Workflow RM-5: Guest-to-Buyer Conversion & Retroactive RFQ Association (0.3417ms)
  ✔ Workflow RM-6: Multi-Supplier Itemized Landed Cost Quotation Calculation (1.7026ms)
  ✔ Workflow RM-7: Quotation Acceptance Triggers Exactly-One Order & Competitor Cancellation (1.1564ms)
  ✔ Workflow RM-8: Supplier Order Progression Stepper & Shipment Handover (0.7462ms)
  ✔ Workflow RM-9: Admin Supplier Verification Audit & Listing Moderation (8.81ms)
✔ COVERLY Raw Material Supplier Marketplace Integration Tests (21.6407ms)
```

**Overall Platform Test Status:**
- Total Test Suites: **9**
- Total Tests: **66**
- Passing: **66**
- Failing: **0**
- Duration: **839 ms**

**Build Verifications:**
- Backend TypeScript compilation (`npm --prefix backend run build`): **Pass (Code 0)**
- Frontend TypeScript & Vite production build (`npm --prefix frontend run build`): **Pass (Code 0)**

---

## 9. Conclusion

The COVERLY Raw Material Supplier Marketplace is fully implemented, strictly database-connected, resilient to overselling, and fully equipped with granular technical specifications for heavy industrial and agricultural commodities. All existing database records, buyer accounts, and supplier workflows remain completely intact.
