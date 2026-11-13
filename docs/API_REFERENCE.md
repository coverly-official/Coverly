# COVERLY REST API Reference Manual
**Version:** 1.0.0 (Production Verified)  
**Base URL:** `http://localhost:5000/api` (or configured API domain)  
**Database:** InsForge PostgreSQL Project `a60f176f-7863-493d-8fef-cf42a662a217`

---

## 1. Authentication & Session APIs

### 1.1 User Registration
- **Method:** `POST /api/auth/register`
- **Auth Required:** No (Public)
- **Permitted Roles:** `buyer`, `manufacturer`, `wholesaler`, `distributor`, `buyer_supplier`, `service_provider` (Admin self-granting is blocked).
- **Request Body:**
  ```json
  {
    "email": "procurement@acme.com",
    "password": "StrongPassword123!",
    "full_name": "Rajesh Kumar",
    "role": "buyer",
    "phone": "+919876543210"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Account registered successfully.",
    "data": {
      "user": {
        "id": "uuid",
        "email": "procurement@acme.com",
        "full_name": "Rajesh Kumar",
        "roles": ["buyer"],
        "activeRole": "buyer",
        "is_active": true
      },
      "accessToken": "jwt_token_string"
    }
  }
  ```

### 1.2 User Login
- **Method:** `POST /api/auth/login`
- **Auth Required:** No (Public)
- **Request Body:**
  ```json
  {
    "email": "procurement@acme.com",
    "password": "StrongPassword123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "data": {
      "user": { "id": "uuid", "email": "procurement@acme.com", "full_name": "Rajesh Kumar", "roles": ["buyer"], "activeRole": "buyer", "is_active": true },
      "business": { "id": "uuid", "name": "Acme Industries", "slug": "acme-industries" },
      "accessToken": "jwt_token_string"
    }
  }
  ```

### 1.3 Get Current User Session
- **Method:** `GET /api/auth/me`
- **Auth Required:** Yes (`Authorization: Bearer <token>` or `x-user-id: <uuid>`)
- **Response (200 OK):** Current user object with active roles and business record.

### 1.4 Update User Profile
- **Method:** `PATCH /api/auth/profile`
- **Auth Required:** Yes
- **Request Body:** `{ "full_name": "New Name", "phone": "+919876543211", "avatar_url": "url" }`

### 1.5 Switch Role (Dual-Role Accounts)
- **Method:** `POST /api/auth/switch-role`
- **Auth Required:** Yes
- **Request Body:** `{ "role": "manufacturer" }`

---

## 2. Business & Company Management APIs

### 2.1 Get Business Details
- **Method:** `GET /api/businesses/:id`
- **Auth Required:** No (Public profile)
- **Response (200 OK):** Business entity with embedded `buyer_profiles` or `supplier_profiles` or `service_provider_profiles`.

### 2.2 Update Business Profile
- **Method:** `PATCH /api/businesses/:id`
- **Auth Required:** Yes (Owner or Admin role in business)
- **Request Body:** Legal name, GSTIN, PAN, address, factory size, production capacity, lead time.

### 2.3 Team Members
- `GET /api/businesses/:id/members`: List team members.
- `POST /api/businesses/:id/members`: Invite/add team member (`user_email`, `role_in_business`).
- `DELETE /api/businesses/:id/members/:memberId`: Remove member.

---

## 3. Product Marketplace APIs

### 3.1 List Products
- **Method:** `GET /api/products`
- **Query Params:** `category`, `search`, `minMoq`, `maxMoq`, `minPrice`, `maxPrice`, `city`, `sort`, `page`, `limit`
- **Response (200 OK):** Paginated active products with supplier business details and images.

### 3.2 Product Details
- **Method:** `GET /api/products/:id`
- **Response (200 OK):** Full product specifications, tiered pricing, and photography array.

### 3.3 Create Product
- **Method:** `POST /api/products`
- **Auth Required:** Yes (Supplier member or Admin)
- **Request Body:** `business_id`, `category_id`, `title`, `indicative_price`, `moq`, `unit`, `specifications`, `hs_code`, `images`.

### 3.4 Update Product
- **Method:** `PATCH /api/products/:id`
- **Auth Required:** Yes (Supplier member or Admin)

### 3.5 Archive Product
- **Method:** `DELETE /api/products/:id`
- **Auth Required:** Yes (Soft-deletes product via `is_active = false`).

---

## 4. RFQ (Request For Quotation) APIs

### 4.1 Create RFQ
- **Method:** `POST /api/rfqs`
- **Auth Required:** Yes (Buyer or Admin)
- **Request Body:**
  ```json
  {
    "title": "5,000 Cotton Shirts Export Grade",
    "category_id": "cotton-tshirts",
    "delivery_city": "Tirupur",
    "delivery_pincode": "641604",
    "target_delivery_date": "2027-03-31",
    "dispatch_mode": "broadcast",
    "items": [
      { "item_name": "Cotton Polo M", "quantity": 2500, "unit": "pc", "target_unit_price": 220 },
      { "item_name": "Cotton Polo L", "quantity": 2500, "unit": "pc", "target_unit_price": 225 }
    ]
  }
  ```

### 4.2 List RFQs
- **Method:** `GET /api/rfqs`
- **Auth Required:** Yes (Buyer sees their RFQs with quote counts).

### 4.3 RFQ Details
- **Method:** `GET /api/rfqs/:id`
- **Auth Required:** Yes (Authorized buyer, recipient supplier, or admin).

### 4.4 Cancel RFQ
- **Method:** `PATCH /api/rfqs/:id/cancel`
- **Auth Required:** Yes (Buyer or Admin, permitted before acceptance).

### 4.5 Supplier Incoming RFQs
- **Method:** `GET /api/rfqs/supplier/incoming?business_id=:id`
- **Auth Required:** Yes (Supplier member).

---

## 5. Quotation & Landed Cost APIs

### 5.1 Landed Cost Simulator
- **Method:** `POST /api/landed-cost/calculate`
- **Auth Required:** No
- **Request Body:** `quantity`, `unitPrice`, `discount`, `packaging`, `freight`, `insurance`, `gstRate`.
- **Response (200 OK):** Itemized breakdown, GST calculation, total landed cost, and effective landed unit cost.

### 5.2 Submit Quotation
- **Method:** `POST /api/quotations`
- **Auth Required:** Yes (Supplier member)
- **Request Body:** `rfq_id`, `supplier_business_id`, `valid_until`, `lead_time_days`, `items`, `freight`, `packaging`, `gst_rate`.

### 5.3 Compare Quotations
- **Method:** `GET /api/quotations/compare/:rfqId`
- **Auth Required:** Yes (Buyer or Admin)
- **Response (200 OK):** All received quotations sorted by lowest landed unit cost.

### 5.4 Accept Quotation
- **Method:** `POST /api/quotations/:id/accept`
- **Auth Required:** Yes (Buyer who owns the RFQ)
- **Business Logic:**
  - Verifies buyer ownership.
  - Verifies quotation is not expired.
  - Updates quotation to `accepted`.
  - Rejects competing quotations.
  - Updates RFQ to `accepted`.
  - Atomically creates binding Purchase Order (`ORD-...`) in `orders` table.

### 5.5 Reject Quotation
- **Method:** `POST /api/quotations/:id/reject`
- **Auth Required:** Yes (Buyer).

---

## 6. Order Management APIs

### 6.1 List Orders
- **Method:** `GET /api/orders`
- **Auth Required:** Yes (Buyer, Supplier, or Admin). Supports status filter and pagination.

### 6.2 Order Details
- **Method:** `GET /api/orders/:id`
- **Auth Required:** Yes (Buyer, Supplier, or Admin). Returns agreed pricing, items, and status timeline.

### 6.3 Update Order Status
- **Method:** `PATCH /api/orders/:id/status`
- **Auth Required:** Yes
- **Allowed State Machine Transitions:**
  - `pending_deposit` -> `deposit_paid` (Buyer)
  - `deposit_paid` -> `in_production` (Supplier)
  - `in_production` -> `quality_check` (Supplier)
  - `quality_check` -> `shipped` (Supplier; requires `tracking_number`)
  - `shipped` -> `delivered` (Supplier)
  - `delivered` -> `completed` (Buyer sign-off)
  - Any state -> `disputed` or `cancelled` (Authorized actor)

---

## 7. Business Services Marketplace APIs

- `GET /api/business-services/categories`: List 7 core domains with nested subcategories.
- `GET /api/business-services`: Search & filter service listings.
- `GET /api/business-services/:id`: Full service listing details.
- `POST /api/business-services`: Service provider publishes listing.
- `POST /api/business-services/requests`: Customer submits service inquiry.
- `GET /api/business-services/requests`: List requests (customer or provider).
- `POST /api/business-services/quotations`: Service provider sends formal quotation.
- `POST /api/business-services/quotations/:id/respond`: Accept or reject quotation.

---

## 8. Verification & Governance APIs

- `POST /api/verifications/submit`: Supplier uploads compliance documents.
- `GET /api/admin/verifications`: Admin verification review queue.
- `PATCH /api/admin/verifications/:id`: Admin approves/rejects with review notes.
- `GET /api/admin/metrics`: Platform GMV, orders, active users, products, and queues.
- `GET /api/admin/users`: Search & filter users.
- `PATCH /api/admin/users/:id/status`: Suspend or reactivate user account.
- `PATCH /api/admin/users/:id/roles`: Assign/revoke roles.
- `GET /api/admin/audit-logs`: Query immutable administrative audit logs.

---

## 9. Support & Notifications APIs

- `GET /api/notifications`: List in-app notifications.
- `GET /api/notifications/unread-count`: Get unread count.
- `PATCH /api/notifications/mark-all-read`: Mark all notifications read.
- `POST /api/tickets`: Create customer support ticket.
- `GET /api/tickets`: List user tickets or all tickets for admin.
- `GET /api/tickets/:id`: Ticket details with message conversation thread.
- `POST /api/tickets/:id/reply`: Send ticket message reply.
- `POST /api/reports`: Submit complaint/fraud report for product, business, or user.
- `GET /api/admin/reports` & `PATCH /api/admin/reports/:id`: Admin moderation queue.
