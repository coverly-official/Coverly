# COVERLY – ROLE & PERMISSION MATRIX (RBAC)
## Phase 1: Platform Roles, Business Roles & Action Permissions

---

## 1. System Platform Roles Matrix

| System Role | Portal Access | Product Catalog | RFQ / Enquiry | Quotations | Orders & POs | Logistics & Trips | Services | Admin Console |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Guest** | Public `/` | View Public | Submit Lead | View Public | None | None | View Public | None |
| **Buyer** | `/buyer/*` | Search & Save | Create & Manage | Compare & Accept | Issue & Track | Select Carrier | Hire | None |
| **Retailer** | `/retailer/*` | Wholesale Search | Create RFQ | Compare & Accept | Reorder & Track | Track Delivery | None | None |
| **Manufacturer** | `/supplier/*` | Manage Factory | Bid RFQ | Submit Quotes | Fulfill Orders | Request Freight | Hire | None |
| **Wholesaler** | `/supplier/*` | Manage Bulk | Bid Wholesale | Submit Quotes | Bulk Fulfill | Hire Transporter| None | None |
| **Distributor** | `/supplier/*` | Territory Offers | Bid Retail | Submit Quotes | Fulfill Dealers | Local Delivery | None | None |
| **Raw Mat Supplier** | `/raw-material-supplier/*` | Manage Grades | Bid Bulk Specs | Submit Quotes | Mill Fulfill | Freight Coordination| None | None |
| **Packaging Supplier**| `/packaging-supplier/*` | Custom Packaging | Bid Custom RFQ | Submit Quotes | Sample & Batch | Freight Coordination| None | None |
| **Importer / Exporter**| `/trade/*` | Global Catalog | International RFQ | Multi-Currency | Trade Orders | Customs & Freight| Hire | None |
| **Service Provider** | `/provider/*` | None (Services) | Client Inquiries | Submit Proposal | Active Projects | None | Deliverables | None |
| **Logistics Partner**| `/logistics-partner/*` | None | Freight Requests | Freight Quotes | Assign Trips | Fleet Routing | None | None |
| **Transporter** | `/transporter/*` | None | Transport Leads | Transport Quotes| Trip Stepper | Vehicles & Drivers | None | None |
| **Sales Agent** | `/agent/*` | Search All | Lead Facilitation | Quote Assistance| Conversion Track | None | None | None |
| **Super Admin** | `/admin/*` | All-Access | Full Moderation | Full Audit | Full Audit | Full Control | Full Control | Full Governance |
| **Verification Admin**| `/admin/*` | View | None | None | None | None | None | KYC / GSTIN |
| **Finance Admin** | `/admin/*` | View | None | Audit | Invoices & Payouts| Freight Audit | Commission Pay | Financial Ops |
| **Support Admin** | `/admin/*` | View | Support Tickets | Dispute Mediation| Return Review | Logistics Dispute | Project Dispute | Tickets & Disputes |

---

## 2. Business Internal Roles & Granular Permissions Matrix

Within a single enterprise tenant account (`businesses`), employees hold specific business-internal roles:

| Action / Entity | Business Owner | Business Manager | Procurement Manager | Purchase Staff | Finance / Accounts Staff | Store / Branch Manager | Warehouse / Inventory Mgr | Quality Inspector | General Staff |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Manage Business Info & Legal** | Full | Edit | View | View | View | View | None | None | None |
| **Invite & Revoke Employees** | Full | Manage | View | None | None | None | None | None | None |
| **Create Sourcing Lists & Inquiries**| Full | Full | Full | Full | View | Full | View | None | View |
| **Draft Purchase Requisition (PR)** | Full | Full | Full | Full | View | Full | View | None | None |
| **Approve PR within Threshold** | Full | Full | Approve (Up to Limit)| None | None | Branch Only | None | None | None |
| **Approve PR exceeding Threshold**| Full | Approve | Escalate | None | None | None | None | None | None |
| **Issue Official Purchase Order (PO)**| Full | Full | Issue | None | None | None | None | None | None |
| **Accept Supplier Quotation** | Full | Full | Accept | None | None | None | None | None | None |
| **Record Vendor Tax Invoice** | Full | View | View | None | Full | None | None | None | None |
| **Perform 3-Way Match Verification**| Full | View | View | None | Full | None | None | None | None |
| **Authorize Vendor Payment Release** | Full | View | View | None | Authorize | None | None | None | None |
| **Record Inward Goods Receipt (GRN)**| Full | Full | View | View | View | Full | Full | View | None |
| **Conduct Quality Check & Inspection**| Full | View | View | None | None | View | View | Full | None |
| **Manage Inventory Stock Levels** | Full | Manage | View | None | View | Branch Stock | Full | None | None |
| **Dispatch / Receive Shipments** | Full | Full | View | View | View | Full | Full | None | None |
| **File Returns & Disputes** | Full | Full | Full | Create | Create | Branch Return | Report Damage | Quality Report | None |

---

## 3. Enforcement Architecture

1. **Authentication Layer**: Token validated -> `req.user` populated.
2. **Business Membership Layer**: Query `business_members` where `user_id = req.user.id` and `business_id = req.params.business_id`.
   - If membership is absent or `is_active === false`, abort with HTTP 403 Forbidden.
3. **Role Permission Guard**: Checks role permission bitmask.
   - For example: if `action === "approve_pr"`, checks `user.role in ["owner", "business_manager", "procurement_manager"]` AND `pr.amount <= membership.spending_limit`.
4. **Database Row Level Security (RLS)**: Enforces `auth.uid() = user_id` and membership scoping directly inside PostgreSQL.
