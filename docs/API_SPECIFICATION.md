# COVERLY - REST API Architecture & Endpoint Specification

This document provides the complete technical specification for COVERLY's REST API layer served via Node.js Express. All endpoints require strict JSON payloads and return standardized envelope responses.

---

## 1. Global Standards & Error Envelopes

### Standard Success Response Envelope
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully.",
  "timestamp": "2026-11-13T18:30:00.000Z"
}
```

### Standard Error Response Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The unit price must be greater than zero.",
    "details": [
      { "field": "unit_price", "issue": "Must be greater than 0" }
    ]
  },
  "timestamp": "2026-11-13T18:30:00.000Z"
}
```

### Standard HTTP Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created in PostgreSQL.
- `400 Bad Request`: Validation failure or malformed payload.
- `401 Unauthorized`: Missing, expired, or invalid JWT.
- `403 Forbidden`: Authenticated identity lacks required role or ownership.
- `404 Not Found`: Entity does not exist.
- `409 Conflict`: Unique constraint violation (e.g. duplicate quote acceptance or order creation).
- `422 Unprocessable Entity`: Business logic rule violated (e.g. quantity below MOQ).
- `500 Internal Server Error`: Unhandled backend exception.

---

## 2. API Endpoint Groups

### Group 1: Authentication & Identity

#### `POST /api/auth/register`
- **Roles**: Public (Guest)
- **Request Body**:
  ```json
  {
    "full_name": "Ramesh Patel",
    "email": "ramesh@pateltextiles.in",
    "phone": "+919826012345",
    "password": "Password123!"
  }
  ```
- **Validation**: Email valid; Phone 10-14 digits; Password $\ge 8$ chars.
- **Operations**: Calls InsForge Auth `signUp`; inserts row into `public.users`.
- **Response**: `201 Created` with session token and user object.

#### `POST /api/auth/login`
- **Roles**: Public (Guest)
- **Request Body**:
  ```json
  {
    "email": "ramesh@pateltextiles.in",
    "password": "Password123!"
  }
  ```
- **Operations**: Validates credentials via InsForge Auth; fetches roles from `public.user_roles`.
- **Response**: `200 OK` with JWT, user identity, and active roles array.

#### `GET /api/users/me`
- **Roles**: All Authenticated Roles
- **Operations**: Retrieves current user, associated business memberships, and active role context.
- **Response**: `200 OK` with user profile.

---

### Group 2: Business Onboarding & Verification

#### `POST /api/businesses/onboard`
- **Roles**: Authenticated User
- **Request Body**:
  ```json
  {
    "legal_name": "Patel Textiles Private Limited",
    "trade_name": "Patel Textiles",
    "entity_type": "pvt_ltd",
    "gstin": "22AAAAA0000A1Z5",
    "pan": "AAAAA0000A",
    "registered_address": "Plot 14, Industrial Area",
    "city": "Raipur",
    "state": "Chhattisgarh",
    "pincode": "492001",
    "role": "manufacturer",
    "primary_category_id": "cotton-tshirts"
  }
  ```
- **Validation**: Valid GSTIN regex; Pincode 6 digits; Valid entity type.
- **Operations**: Atomic transaction: Inserts into `public.businesses`, `public.business_members`, and respective `buyer_profiles` or `supplier_profiles`.
- **Response**: `201 Created` with business ID and assigned role.

#### `POST /api/supplier/verification/upload`
- **Roles**: Supplier roles
- **Content-Type**: `multipart/form-data`
- **Payload**: `file` (PDF/JPG/PNG $\le 10\text{MB}$), `document_type` (`gstin_cert`, `udyam_cert`, `electricity_bill`, `plant_photo`).
- **Operations**: Persists file to private InsForge storage bucket `verification-docs`; logs entry in `public.verification_documents`.
- **Response**: `201 Created` with document ID, storage key, and verification reference.

#### `POST /api/supplier/verification/submit`
- **Roles**: Supplier roles
- **Request Body**:
  ```json
  {
    "requested_level": "level_3",
    "document_ids": ["uuid-1", "uuid-2"]
  }
  ```
- **Operations**: Sets `supplier_verifications.status = 'pending'`; triggers admin verification queue notification.
- **Response**: `200 OK` with submission status.

---

### Group 3: Products & Category Taxonomy

#### `GET /api/categories`
- **Roles**: Public
- **Response**: `200 OK` with active categories and subcategories list.

#### `GET /api/products`
- **Roles**: Public
- **Query Params**: `categoryId`, `city`, `minPrice`, `maxPrice`, `moq`, `page`, `limit`.
- **Operations**: Queries `public.products` joined with `public.businesses` and `public.product_images`.
- **Response**: `200 OK` with paginated product card items.

#### `POST /api/products`
- **Roles**: Supplier roles
- **Request Body**:
  ```json
  {
    "category_id": "cotton-tshirts",
    "title": "180 GSM Bio-Washed Cotton T-Shirts",
    "description": "Premium combed cotton round-neck t-shirts in bulk lots.",
    "hsn_code": "61091000",
    "gst_rate": 0.05,
    "base_unit_price": 205.00,
    "moq": 250,
    "unit": "pc",
    "image_keys": ["storage-key-1", "storage-key-2"]
  }
  ```
- **Validation**: Base price $> 0$; MOQ $> 0$; GST rate $\in \{0.05, 0.12, 0.18, 0.28\}$.
- **Operations**: Inserts into `public.products` and `public.product_images`.
- **Response**: `201 Created` with product record.

---

### Group 4: Requests for Quotation (RFQs)

#### `POST /api/rfqs`
- **Roles**: Buyer, Buyer + Supplier
- **Request Body**:
  ```json
  {
    "title": "500 pcs Cotton Round Neck T-Shirts",
    "category_id": "cotton-tshirts",
    "destination_city": "Raipur",
    "destination_pincode": "492001",
    "target_delivery_date": "2026-11-20",
    "matching_mode": "coverly_match",
    "items": [
      {
        "item_name": "180 GSM Round Neck Black",
        "quantity": 500,
        "unit": "pc",
        "technical_specs": { "color": "Black", "gsm": 180, "fabric": "100% Cotton" }
      }
    ],
    "target_supplier_ids": []
  }
  ```
- **Operations**: Inserts into `public.rfqs` and `public.rfq_items`.
- **Response**: `201 Created` with draft RFQ ID.

#### `POST /api/rfqs/:id/submit`
- **Roles**: Buyer (RFQ Owner)
- **Operations**: Executes supplier matching algorithm; creates `public.rfq_recipients` records; updates status to `submitted`; dispatches alerts.
- **Response**: `200 OK` with recipient count and delivery confirmation.

#### `GET /api/buyer/rfqs`
- **Roles**: Buyer, Buyer + Supplier
- **Query Params**: `status`, `page`, `limit`.
- **Response**: `200 OK` with buyer's RFQ list and live response counts.

---

### Group 5: Quotations & Landed Cost Engine

#### `POST /api/quotations`
- **Roles**: Supplier roles
- **Request Body**:
  ```json
  {
    "rfq_id": "uuid-rfq-8492",
    "production_lead_time_days": 5,
    "payment_terms": "30-70",
    "valid_until": "2026-11-30T23:59:59Z",
    "items": [
      {
        "rfq_item_id": "uuid-item-1",
        "unit_price": 205.00,
        "quoted_quantity": 500,
        "moq": 250
      }
    ],
    "freight": 2400.00,
    "freight_taxable": false,
    "gst_rate": 0.05,
    "packaging_charges": 0.00,
    "insurance_charges": 0.00
  }
  ```
- **Validation**: Quoted quantity $\ge$ MOQ; Lead time $> 0$; Validity date in future.
- **Operations**: Invokes Landed Cost Calculation Engine; inserts into `public.quotations`, `public.quotation_items`, and `public.quotation_costs`; updates RFQ status to `responses_received`.
- **Response**: `201 Created` with full quote breakdown and computed landed cost.

#### `GET /api/rfqs/:id/comparison`
- **Roles**: Buyer (RFQ Owner)
- **Operations**: Fetches all submitted quotations for the RFQ, normalizes calculations, and returns comparative matrix data.
- **Response**: `200 OK` with sorted quotes (lowest landed first) and sticker illusion metrics.

#### `POST /api/quotations/:id/accept`
- **Roles**: Buyer (RFQ Owner)
- **Operations**: Atomic transaction:
  1. Validates quotation status is `submitted` and not expired.
  2. Updates `quotation.status = 'accepted'`.
  3. Updates other quotations on same RFQ to `'rejected'`.
  4. Updates `rfq.status = 'closed'`.
  5. Inserts new Purchase Order record into `public.orders` and `public.order_items`.
  6. Inserts milestone into `public.order_status_history`.
- **Response**: `201 Created` with generated Purchase Order ID (`PO-2026-8492`).

---

### Group 6: Orders & Fulfillment Tracking

#### `GET /api/orders/:id`
- **Roles**: Buyer or Supplier associated with the order
- **Response**: `200 OK` with PO details, line items, and fulfillment history.

#### `POST /api/orders/:id/status-transition`
- **Roles**: Supplier or Buyer according to state machine rules
- **Request Body**:
  ```json
  {
    "new_status": "dispatched",
    "carrier_name": "V-Trans India",
    "vehicle_number": "CG04AB1234",
    "eway_bill_number": "221098765432",
    "tracking_url": "https://vtrans.in/track?lr=98765",
    "notes": "Consignment dispatched via 14ft tempo."
  }
  ```
- **Validation**: Status transition must adhere to state machine; mandatory logistics metadata required for `dispatched`.
- **Operations**: Updates `public.orders.status`; logs entry in `public.order_status_history`; triggers buyer notification.
- **Response**: `200 OK` with updated status.

---

### Group 7: Admin & Governance

#### `GET /api/admin/verifications`
- **Roles**: Superadmin, Verification Admin
- **Query Params**: `status=pending`
- **Response**: `200 OK` with queue of supplier verification dossiers.

#### `POST /api/admin/verifications/:id/decision`
- **Roles**: Superadmin, Verification Admin
- **Request Body**:
  ```json
  {
    "decision": "approved",
    "assigned_level": "level_3",
    "admin_remarks": "GSTIN verified active. Udyam certificate and factory premises validated."
  }
  ```
- **Operations**: Updates `public.supplier_verifications` and `public.businesses.verification_level`; records entry in `public.admin_audit_logs`.
- **Response**: `200 OK`.

#### `GET /api/admin/analytics`
- **Roles**: Superadmin
- **Response**: `200 OK` with live computed platform KPIs (Active users, RFQ response rates, Landed cost savings alpha).
