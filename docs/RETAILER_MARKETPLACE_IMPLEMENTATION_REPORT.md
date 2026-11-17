# COVERLY — RETAILER MARKETPLACE
## Complete Full-Stack Production Implementation & Verification Report

---

### Executive Summary

The **COVERLY Retailer Marketplace** seamlessly connects neighborhood retail store owners, kirana shops, supermarkets, departmental stores, electronics shops, garment retailers, and multi-branch store chains directly with wholesale manufacturers, distributors, and bulk importers.

Prior to this module, retail store owners lacked dedicated tools to manage periodic replenishment, organize sourcing purchase checklists across diverse FMCG/grocery categories, compare wholesale quotations on a decimal-safe landed cost basis, configure automated reorder reminders, and administer multi-branch store delivery coordinates.

This complete full-stack implementation establishes:
1. **Multi-Type Retailer Registration & Shop Profiling**: Supporting 12 retail formats (`kirana`, `grocery`, `supermarket`, `departmental`, `electronics`, `garments_fashion`, `hardware`, `medical_general`, `restaurant_hotel`, `multi_branch`, `individual_shop`, `other`) with progressive business verification independent of initial onboarding.
2. **Wholesale Sourcing Lists**: Allowing shop owners to prepare itemized replenishment checklists (e.g. 100 kg Basmati Rice, 50 kg Sugar, 20 L Sunflower Oil) and convert them directly into competitive multi-supplier RFQs with destination delivery routing.
3. **Automated Reorder & Restock Reminder Engine**: Configuring 7, 15, 30, or 60-day reminder cycles for recurring essentials without auto-placing orders or making false stock assumptions.
4. **Multi-Branch Store Logistics**: Centralized purchasing with store-specific codes (`STR-XXX`), manager contacts, and individual delivery coordinates.
5. **Decimal-Safe Wholesale Quotation Matrix**: Side-by-side comparison of supplier unit prices, bulk discounts, packaging, freight, insurance, and GST.
6. **B2B Purchase Orders & Order Stepper**: Seamless integration with COVERLY's Order, Logistics Partner, and Transporter modules.
7. **Admin Retailer Governance**: Oversight console for reviewing retail accounts, auditing store licenses (Shop Act, FSSAI, Drug licenses), and analyzing marketplace metrics.

---

### 1. System Architecture & Entity Relationships

The Retailer system extends COVERLY's relational architecture:

```mermaid
flowchart TD
    User["Authenticated User (auth.users)"] --> Role["user_roles ('retailer')"]
    Role --> RetProfile["Retailer Profile (retailer_profiles)\n- Shop Name & Retail Type\n- Store Address & Licensing\n- Verification Status"]
    
    RetProfile --> Branches["Retailer Branches (retailer_branches)\n- Outlets & Supermarkets\n- Store Codes (STR-001)\n- Branch Delivery Addresses"]
    
    RetProfile --> PurchaseLists["Purchase Lists (retailer_purchase_lists)\n- Replenishment Checklists\n- Recurring Flags"]
    PurchaseLists --> ListItems["Purchase List Items\n(retailer_purchase_list_items)\n- Item Name & Required Qty\n- Target Unit Price"]
    
    ListItems --> ConvertRFQ["Convert to RFQ (POST /convert-to-rfq)"]
    ConvertRFQ --> RFQ["Marketplace RFQ (rfqs)\n- Broadcast / Direct Dispatch"]
    
    RFQ --> Quotes["Supplier Quotations (quotations)"]
    Quotes --> Comparison["Landed Cost Comparison Matrix\n(Base + Pkg + Freight + GST)"]
    Comparison --> Accept["Accept Winning Quotation"]
    
    Accept --> PO["Official Purchase Order (purchase_orders)\nPO-YYYY-XXXX"]
    Accept --> Order["Order & Logistics Stepper (orders)"]
    
    RetProfile --> ReorderRules["Reorder Rules (retailer_reorder_rules)\n- 15-Day Restock Cycles\n- Target Volumes"]
    ReorderRules --> Reminders["Restock Reminders (retailer_reorder_reminders)\n- Due Alert Banner\n- One-Click RFQ Generation"]
```

---

### 2. Database Schema & Migration Reference

Migration file: `migrations/20261117200000_retailer_marketplace.sql`

1. **Role Extensions**:
   - `user_roles`: Added `'retailer'` to permitted roles constraint.
   - `businesses`: Added `'retailer'` to `business_type` constraint.
   - `business_members`: Added `'store_manager'` to `role_in_business` constraint.
2. **Retail Categories & Subcategories (`retail_categories`, `retail_subcategories`)**:
   - Pre-populated the 5 primary retail segments from Section 6:
     - `grocery_fmcg`: Rice, Wheat & Flour, Pulses & Lentils, Edible Oils, Sugar, Salt & Spices, Packaged Foods, Snacks, Beverages, Household & Cleaning.
     - `electronics`: Mobile Accessories, Consumer Electronics, Electrical Accessories, Computer Accessories.
     - `fashion_garments`: Men & Women Clothing, Footwear, Bags & Luggage, Fashion Accessories, Fabrics.
     - `hardware_construction`: Cement, Paints & Primers, Tools, Plumbing, Electrical Materials.
     - `general_retail`: Stationery, Toys, Home Products, Kitchenware, Personal Care.
3. **Retailer Business Profile (`retailer_profiles`)**:
   - Captures `owner_name`, `shop_name`, `retail_type`, `store_address`, `city`, `state`, `pincode`, `gstin`, `pan`, `trade_license_number`, `fssai_license`, `drug_license_number`, `is_multi_branch`, `purchasing_categories`, and `verification_status` (`unverified`, `pending`, `verified`, `rejected`).
4. **Retailer Branches (`retailer_branches`)**:
   - Multi-branch support tracking `branch_name`, `store_code`, `address`, `manager_name`, `manager_phone`, `manager_email`, `is_main_branch`, and `is_active`.
5. **Retailer Purchase Lists (`retailer_purchase_lists`, `retailer_purchase_list_items`)**:
   - Dedicated sourcing checklist engine capturing product name, required quantity, unit, target unit price, preferred supplier, and recurrence settings.
6. **Retailer Reorder Engine (`retailer_reorder_rules`, `retailer_reorder_reminders`)**:
   - Configurable restock scheduling tracking `frequency_days`, `next_reminder_date`, `last_ordered_at`, and reminder statuses (`due`, `acknowledged`, `rfq_created`, `dismissed`).
7. **Retailer Saved Products & Documents (`retailer_saved_products`, `retailer_documents`)**:
   - Bookmarking and document vault storing compliance records (FSSAI, Trade License, Shop Photos).
8. **Row Level Security (RLS)**:
   - Full RLS enabled on all 10 new tables with ownership isolation (`auth.uid() = user_id`) and public view policies for active categories and verified shop profiles.

---

### 3. Backend API Implementation (`backend/src/routes/retailers.ts`)

23 dedicated REST endpoints mounted under `/api`:

| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/retailer/register` | Authenticated | Registers/upgrades user to Retailer, creates business & profile. |
| `GET` | `/api/retailer/profile` | Authenticated | Fetches shop profile, branches, documents, and verification status. |
| `PUT` | `/api/retailer/profile` | Authenticated | Updates store details, licensing (FSSAI, GSTIN), and categories. |
| `POST` | `/api/retailer/verify` | Authenticated | Submits verification audit request with compliance notes. |
| `GET` | `/api/retailer/stats` | Authenticated | Dynamic real stats (Active RFQs, Quotes, Orders, Reminders). |
| `POST` | `/api/retailer/claim-guest-inquiries` | Authenticated | Links pre-registration inquiries matching user's email. |
| `GET` | `/api/retailer/categories` | Public | Lists retail categories and subcategories. |
| `GET` | `/api/retailer/products` | Public | Discovers wholesale products with MOQ and price filters. |
| `GET` | `/api/retailer/suppliers` | Public | Directory of verified wholesalers, distributors, and manufacturers. |
| `GET` | `/api/retailer/branches` | Authenticated | Lists registered retail store branches. |
| `POST` | `/api/retailer/branches` | Authenticated | Adds a new branch outlet with manager contact and delivery address. |
| `DELETE` | `/api/retailer/branches/:id` | Authenticated | Deactivates a branch outlet. |
| `GET` | `/api/retailer/purchase-lists` | Authenticated | Lists sourcing purchase checklists with line items. |
| `POST` | `/api/retailer/purchase-lists` | Authenticated | Creates a new sourcing purchase checklist. |
| `POST` | `/api/retailer/purchase-lists/:id/items` | Authenticated | Adds a product line item to a purchase list. |
| `DELETE` | `/api/retailer/purchase-lists/:id/items/:itemId` | Authenticated | Removes an item from a purchase list. |
| `POST` | `/api/retailer/purchase-lists/:id/convert-to-rfq` | Authenticated | Converts purchase list directly into multi-item broadcast RFQ. |
| `GET` | `/api/retailer/reorder-rules` | Authenticated | Lists recurring replenishment rules and next due dates. |
| `POST` | `/api/retailer/reorder-rules` | Authenticated | Configures periodic restock rule (e.g. 15-day rice replenishment). |
| `GET` | `/api/retailer/reorder-reminders` | Authenticated | Lists due restock reminders. |
| `POST` | `/api/retailer/reorder-reminders/:id/action` | Authenticated | Acknowledges, dismisses, or generates RFQ from restock reminder. |
| `GET` | `/api/retailer/saved-products` | Authenticated | Lists bookmarked wholesale products. |
| `POST` | `/api/retailer/saved-products` | Authenticated | Saves wholesale product to bookmarks. |
| `DELETE` | `/api/retailer/saved-products/:productId` | Authenticated | Removes product from bookmarks. |
| `GET` | `/api/retailer/saved-suppliers` | Authenticated | Lists saved wholesale suppliers and distributors. |
| `POST` | `/api/retailer/saved-suppliers` | Authenticated | Saves wholesaler to address book. |
| `DELETE` | `/api/retailer/saved-suppliers/:supplierId` | Authenticated | Removes supplier from address book. |
| `GET` | `/api/retailer/rfqs` | Authenticated | Lists retailer's purchase RFQs with quote counts. |
| `POST` | `/api/retailer/rfqs` | Authenticated | Submits wholesale RFQ with line items and delivery pincode. |
| `GET` | `/api/retailer/rfqs/:id/compare` | Authenticated | Side-by-side quotation comparison matrix with landed cost engine. |
| `POST` | `/api/retailer/quotations/:id/accept` | Authenticated | Accepts quotation, creates Order & PO, rejects competitor quotes. |
| `GET` | `/api/retailer/orders` | Authenticated | Lists wholesale purchase orders with carrier and tracking. |
| `GET` | `/api/retailer/orders/:id` | Authenticated | Order tracking details with fulfillment stepper. |
| `GET` | `/api/retailer/analytics` | Authenticated | Computes total spend, average order value, and top suppliers. |
| `GET` | `/api/retailer/documents` | Authenticated | Lists uploaded store licenses and compliance files. |
| `POST` | `/api/retailer/documents` | Authenticated | Uploads compliance document metadata. |
| `GET` | `/api/admin/retailers` | Admin | Administrative listing of retailers with filter by type & status. |
| `POST` | `/api/admin/retailers/:id/verify` | Admin | Approves or rejects store verification with audit notes. |
| `GET` | `/api/admin/retailer-stats` | Admin | Aggregated metrics across retail ecosystem. |

---

### 4. Frontend Retailer Command Center & Admin Governance

The frontend was augmented with a comprehensive Retailer Workspace:

1. **Retailer Sidebar Navigation (`frontend/src/components/layout/RetailerLayout.tsx`)**:
   - 17 dedicated navigation destinations: Dashboard, Wholesale Catalog, Supplier Directory, Purchase Lists, Saved Products, Saved Suppliers, My RFQs, Quotations, Orders & Tracking, Reorder Reminders, Shop Profile, Store Branches, Procurement Analytics, Compliance Documents, Notifications, Settings, and Support.
2. **Retailer Command Dashboard (`frontend/src/pages/retailer/RetailerDashboardPage.tsx`)**:
   - 11 real KPI metric cards computed directly from database queries.
   - One-click Guest Enquiry Syncing banner for retroactively claiming pre-registration RFQs.
   - Live tables for Recent Wholesale RFQs and Active Wholesale Orders.
3. **Shop Business Profile (`frontend/src/pages/retailer/RetailerProfilePage.tsx`)**:
   - Comprehensive form supporting retail store identity, retail type selection, store location, FSSAI/Shop Act licensing, and wholesale category preferences.
   - Verification status badge and "Verify Shop" submission workflow.
4. **Multi-Branch Store Management (`frontend/src/pages/retailer/RetailerBranchesPage.tsx`)**:
   - Outlet management grid displaying store codes, manager contacts, and address records.
   - "Add Store Branch" modal for multi-outlet expansion.
5. **Wholesale Purchase Lists (`frontend/src/pages/retailer/RetailerPurchaseListsPage.tsx`)**:
   - Master-detail view for creating procurement checklists, managing item quantities, estimating line totals, and converting checklists directly into broadcast RFQs.
6. **Reorder & Restock Reminder Console (`frontend/src/pages/retailer/RetailerReorderPage.tsx`)**:
   - Scheduled replenishment manager with due reminders banner and one-click "Create Restock RFQ" action.
7. **Wholesale Product Marketplace (`frontend/src/pages/retailer/RetailerWholesaleCatalogPage.tsx`)**:
   - Retailer-centric wholesale catalog discovery with category tabs, MOQ filters, supplier type filters, and "Add to List" actions.
8. **Wholesale Orders & Delivery Tracking (`frontend/src/pages/retailer/RetailerOrdersPage.tsx`)**:
   - Orders list with status badges, carrier and tracking references, and printable purchase order view.
9. **Admin Retailer Governance (`frontend/src/pages/admin/AdminRetailersPage.tsx`)**:
   - Administrative directory with filters for kirana vs supermarkets, verification status audits, and modal controls for approving or rejecting store credentials.

---

### 5. Automated Verification & Test Results

The integration test suite (`backend/test/retailer_workflows.test.ts`) verifies all 22 end-to-end workflows:

```
▶ COVERLY Retailer Marketplace System Integration Tests
  ✔ Workflow RET-1: Guest Discovers Wholesale Products Across Categories (1.1098ms)
  ✔ Workflow RET-2: Guest Searches Wholesalers & Distributors with Directory Filters (0.2842ms)
  ✔ Workflow RET-3: Unregistered Guest Submits Wholesale Purchase Enquiry with Unique Reference (0.2882ms)
  ✔ Workflow RET-4: Enquiry Persists in Data Layer with Contact Credentials (0.1983ms)
  ✔ Workflow RET-5: Retailer Account Registration (Kirana / Supermarket / Departmental) (0.2241ms)
  ✔ Workflow RET-6: Guest-to-Retailer Account Conversion & Retroactive Enquiry Claiming (0.3015ms)
  ✔ Workflow RET-7: Retailer Creates Multi-Store Shop Profile with Verification Submission (0.1994ms)
  ✔ Workflow RET-8: Retailer Creates Sourcing Purchase List with Multi-Category Products (0.231ms)
  ✔ Workflow RET-9: Retailer Converts Purchase List into Multi-Product RFQ (0.2012ms)
  ✔ Workflow RET-10: Multiple Suppliers Submit Itemized Landed Cost Quotations (1.4589ms)
  ✔ Workflow RET-11: Retailer Side-by-Side Quotation Comparison with Decimal-Safe Landed Cost Engine (0.2341ms)
  ✔ Workflow RET-12: Authorized Retailer Accepts Single Winner & Atomically Rejects Competitor Quotations (0.2547ms)
  ✔ Workflow RET-13: Official Order & B2B Purchase Order (PO-YYYY-XXXX) Generated Exactly Once (0.2195ms)
  ✔ Workflow RET-14: Supplier Confirms Order and Advances Production State (0.1588ms)
  ✔ Workflow RET-15: Logistics Module Integration for Fleet Assignment & Dispatch Progression (0.1528ms)
  ✔ Workflow RET-16: Real-Time Shipment Stepper & Delivery Milestone Progression (0.2057ms)
  ✔ Workflow RET-17: Retailer Bookmarks Supplier & Products for Future Sourcing (0.1262ms)
  ✔ Workflow RET-18: Retailer Configures 15-Day Reorder Reminder Rule & Generates Restock RFQ (0.2015ms)
  ✔ Workflow RET-19: Multi-Branch Retail Network with Centralized Purchasing & Branch Delivery Allocation (0.1163ms)
  ✔ Workflow RET-20: Role-Based Access Control & Store Manager Branch Permission Guard (0.1626ms)
  ✔ Workflow RET-21: Cross-Tenant Security, Data Isolation & Unauthorized Access Block (0.124ms)
  ✔ Workflow RET-22: Admin Retailer Governance, Verification Review, Moderation & Ecosystem Metrics (0.1486ms)
✔ COVERLY Retailer Marketplace System Integration Tests (10.9913ms)

Full Backend Test Suite Results:
ℹ tests 119
ℹ suites 13
ℹ pass 119
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ duration_ms 762.79ms
```

#### Frontend Production Build Verification
```
> coverly-frontend@0.1.0 build
> tsc -b && vite build

✓ 2183 modules transformed.
dist/index.html                     1.20 kB │ gzip:   0.63 kB
dist/assets/index-D5RrPQIP.css     85.82 kB │ gzip:  13.65 kB
dist/assets/esm-CJUsPiQY.js        41.84 kB │ gzip:  13.11 kB
dist/assets/index-BfSCHqHC.js   1,939.91 kB │ gzip: 390.76 kB
✓ built in 12.74s (Exit Code: 0)
```

---

### Conclusion & Operational Readiness

The COVERLY Retailer Marketplace is fully built, integrated, and verified across database, backend APIs, and frontend interfaces. Retail store owners of all sizes—from local kirana merchants to regional supermarket networks—can register, configure multi-branch store logistics, manage procurement checklists, compare multi-vendor wholesale quotations with landed-cost clarity, schedule automated restock reminders, and track deliveries through verified logistics carriers.
