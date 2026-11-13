# COVERLY - Screen Specification Inventory & Interface Contract

This document provides the exhaustive specification for all planned screen views (~75 screens) across COVERLY. Each specification fulfills the mandatory 20-point contract:

1. **Screen Name** | 2. **Route URL** | 3. **User Roles Allowed** | 4. **Purpose** | 5. **Layout Structure** | 6. **Navbar/Sidebar** | 7. **Cards and Sections** | 8. **Buttons** | 9. **Button Actions** | 10. **Form Fields** | 11. **Field Validation** | 12. **API Endpoint** | 13. **Database Tables** | 14. **Loading State** | 15. **Empty State** | 16. **Error State** | 17. **Success State** | 18. **Responsive / Mobile Layout** | 19. **Navigation After Actions** | 20. **Permission Requirements**

---

# Group A: Public Website (Screens 1 – 12)

### 1. Home Page
- **Route**: `/`
- **Roles**: All (Guest, Buyer, Supplier, Admin)
- **Purpose**: Brand hook, dual-layout hero, core proposition, interactive demo, trust verification, and concierge lead generation.
- **Layout**: Single-column vertical scroll with sticky public header and global footer.
- **Nav/Sidebar**: Public Navbar (`Navbar.tsx`) with Logo, Products, Wholesalers, Manufacturers, About, and Login/CTA.
- **Cards/Sections**: Hero Section (Split Asymmetric with StatCards & LineChart), How It Works (3-step timeline), WhatsApp AI Parser demo, Interactive RFQ Simulator (`LiveDemo.tsx`), Ground-Truth Trust Network, Sourcing Concierge Lead Form (`Footer.tsx`).
- **Buttons**:
  - `Explore Live RFQ`: Scrolls smoothly to `#live-demo`.
  - `Get Verified Quotes`: Scrolls to `#contact`.
  - `Login`: Navigates to `/login`.
  - `Generate Comparison`: Computes real-time landed costs for selected parameters.
  - `Submit for 48h Concierge Match`: Submits lead form.
  - `Chat on WhatsApp Directly`: Opens official WhatsApp API link.
- **Button Actions**: Dynamic calculation state update, form POST dispatch, smooth anchor scrolling.
- **Form Fields**: Concierge lead inputs: Name, Business Name, WhatsApp Number, Product Category, Sourcing Requirement.
- **Validation**: Name required; Business required; Mobile must match `^[0-9+\s-]{10,14}$`; Requirement non-empty.
- **API Endpoints**: `GET /api/suppliers`, `POST /api/concierge-leads`.
- **Database Tables**: `public.product_categories`, `public.suppliers`, `public.concierge_leads`.
- **Loading State**: Skeleton pills for supplier category select; button spinner on submit.
- **Empty State**: Fallback to bundled local fixture data if backend is initializing.
- **Error State**: Red outline on invalid inputs, alert badge for network failure.
- **Success State**: Concierge form replaces form inputs with verified confirmation card and reset button.
- **Responsive Layout**: Hero collapses into single column on `< 1024px`; table gains horizontal scroll on `< 640px`.
- **Navigation After Actions**: Form submission remains in-place displaying submission confirmation.
- **Permissions**: Publicly accessible.

### 2. Product Categories
- **Route**: `/categories`
- **Roles**: All
- **Purpose**: Comprehensive taxonomy directory allowing buyers to explore raw materials, textiles, packaging, and metals.
- **Layout**: Grid layout (3 columns on desktop, 1 on mobile) with search header.
- **Nav/Sidebar**: Public Navbar.
- **Cards/Sections**: Category search bar, Top Category Cards (icon, title, product count, supplier count, starting MOQ), Subcategory chips.
- **Buttons**: `Browse Category`, `Request Custom Category`.
- **Button Actions**: Navigate to `/categories/:categoryId` or open custom category request modal.
- **Form Fields**: Category filter input.
- **Validation**: Text search sanitized against XSS.
- **API Endpoints**: `GET /api/categories`.
- **Database Tables**: `public.categories`, `public.subcategories`, `public.products`.
- **Loading State**: Shimmer grid of 6 category cards.
- **Empty State**: "No categories match your search term."
- **Error State**: Toast notification with retry button.
- **Success State**: Filtered category grid rendered.
- **Responsive Layout**: Stacks to 2-columns on tablets, 1-column on mobile phones.
- **Navigation After Actions**: Clicking a category routes to `/categories/:id`.
- **Permissions**: Public.

### 3. Category Details Page
- **Route**: `/categories/:categoryId`
- **Roles**: All
- **Purpose**: In-depth view of a specific industry vertical with subcategories, featured suppliers, and popular RFQs.
- **Layout**: Left-rail filter sidebar with main catalog grid.
- **Nav/Sidebar**: Public Navbar.
- **Cards/Sections**: Category Hero banner, Subcategory filter pills, Verified Suppliers in Category, Top Products list, Benchmark Price index.
- **Buttons**: `Create RFQ in Category`, `Filter by Verified Only`, `Filter by State`.
- **Button Actions**: Route to `/buyer/rfq/new?category=:id`, toggle query params.
- **Form Fields**: Min price, Max price, Min MOQ, City filter.
- **Validation**: Numerical checks (Min $\le$ Max).
- **API Endpoints**: `GET /api/categories/:id`, `GET /api/products?categoryId=:id`.
- **Database Tables**: `public.categories`, `public.products`, `public.suppliers`.
- **Loading State**: Skeleton card placeholders.
- **Empty State**: "No products currently listed in this category."
- **Error State**: 404 page if category invalid.
- **Success State**: Dynamic product listing loaded.
- **Responsive Layout**: Filters collapse into a slide-over mobile drawer.
- **Navigation After Actions**: Subcategory click filters the list in-place.
- **Permissions**: Public.

### 4. Product Marketplace
- **Route**: `/marketplace`
- **Roles**: All
- **Purpose**: Global searchable B2B product showcase displaying bulk listings from all verified vendors.
- **Layout**: Dual-pane: left facet filters, right paginated product card grid.
- **Nav/Sidebar**: Public Navbar.
- **Cards/Sections**: Filter facet bar, Search input with auto-suggest, Product Cards (Image, Title, Supplier Name, Verified Badge, Unit Price, MOQ, City).
- **Buttons**: `Request Quote`, `View Product Details`, `Reset Filters`.
- **Button Actions**: Open RFQ modal or navigate to product details.
- **Form Fields**: Search query, Category select, Price range, Location radius.
- **Validation**: Debounced search query (300ms).
- **API Endpoints**: `GET /api/products`, `GET /api/search/suggestions`.
- **Database Tables**: `public.products`, `public.suppliers`, `public.product_images`.
- **Loading State**: Animated skeleton grid.
- **Empty State**: "No products match your criteria. Try loosening your filters."
- **Error State**: Error banner with "Reload Marketplace" button.
- **Success State**: Product items rendered with active pagination controls.
- **Responsive Layout**: Desktop 3-col grid, Tablet 2-col, Mobile 1-col with bottom filter button.
- **Navigation After Actions**: Clicking product card opens `/products/:id`.
- **Permissions**: Public.

### 5. Product Search Results
- **Route**: `/search?q=:query`
- **Roles**: All
- **Purpose**: Search result page for text and semantic queries.
- **Layout**: Single-column results stream with facet counts on top.
- **Nav/Sidebar**: Public Navbar.
- **Cards/Sections**: Query summary ("Showing 24 wholesale results for Cotton Yarn"), Search tabs (All, Products, Manufacturers, Wholesalers), Result list items.
- **Buttons**: `Sort by Landed Cost`, `Sort by MOQ`, `Sort by Distance`.
- **Button Actions**: Update sort URL query parameter.
- **Form Fields**: Refine search input.
- **Validation**: Non-empty query string.
- **API Endpoints**: `GET /api/search?q=:query`.
- **Database Tables**: `public.products`, `public.businesses`, `public.categories`.
- **Loading State**: Pulsing skeleton list items.
- **Empty State**: "Zero suppliers or products found. Submit a Concierge Sourcing Request."
- **Error State**: Friendly error view with link to concierge form.
- **Success State**: Highlighted match terms in results.
- **Responsive Layout**: Full width horizontal cards on mobile.
- **Navigation After Actions**: Click leads to `/products/:id` or `/suppliers/:id`.
- **Permissions**: Public.

### 6. Product Details Page
- **Route**: `/products/:productId`
- **Roles**: All
- **Purpose**: Full technical specification, MOQ tiers, supplier credentials, and landed cost calculator for a single product.
- **Layout**: 2-column detail view: left image carousel, right purchase and quotation specifications.
- **Nav/Sidebar**: Public Navbar.
- **Cards/Sections**: High-res image gallery, Specification table (Material, Dimensions, Grade, HSN Code, GST Rate), Indicative Price tiers, Supplier snapshot card, Interactive Landed Cost Estimator widget.
- **Buttons**: `Request a Quote for This Product`, `Save Product`, `Contact Supplier`.
- **Button Actions**: Route to `/buyer/rfq/new?productId=:id` (or prompt login if guest).
- **Form Fields**: Quantity input, Destination City picker.
- **Validation**: Quantity $\ge$ MOQ.
- **API Endpoints**: `GET /api/products/:id`, `POST /api/rfq/calculate`.
- **Database Tables**: `public.products`, `public.suppliers`, `public.product_images`.
- **Loading State**: Full-page skeleton with gallery spinner.
- **Empty State**: 404 Not Found if product ID missing or unlisted.
- **Error State**: "Product unavailable" message.
- **Success State**: Loaded product with active landed cost calculations.
- **Responsive Layout**: Gallery and specs stack vertically on mobile screens.
- **Navigation After Actions**: `Request a Quote` redirects guest to `/login?redirect=/buyer/rfq/new`.
- **Permissions**: Public.

### 7. Manufacturer Directory
- **Route**: `/manufacturers`
- **Roles**: All
- **Purpose**: Directory dedicated strictly to primary producers and factories with verified production lines.
- **Layout**: Top filters + 2-column factory profile cards.
- **Nav/Sidebar**: Public Navbar.
- **Cards/Sections**: Industrial Cluster highlights (Bhilai Steel, Tiruppur Garments, Surat Textiles), Manufacturer Cards (Factory photo, Installed machinery, Production capacity, GSTIN status, Verified level).
- **Buttons**: `Audit Dossier`, `Send Factory RFQ`.
- **Button Actions**: Navigate to supplier business profile.
- **Form Fields**: Factory city, machinery type, minimum annual capacity.
- **Validation**: Standard dropdown filters.
- **API Endpoints**: `GET /api/manufacturers`.
- **Database Tables**: `public.businesses`, `public.supplier_profiles`, `public.supplier_verifications`.
- **Loading State**: Card shimmer loading effect.
- **Empty State**: "No manufacturers found matching this industrial criteria."
- **Error State**: Error banner with reload action.
- **Success State**: Verified factory cards rendered.
- **Responsive Layout**: Single column layout on mobile with compact metric badges.
- **Navigation After Actions**: Click card opens `/suppliers/:id`.
- **Permissions**: Public.

### 8. Wholesaler Directory
- **Route**: `/wholesalers`
- **Roles**: All
- **Purpose**: Directory of regional bulk traders and stockists offering ready-to-ship consignments.
- **Layout**: Top location filters + grid of stockist cards.
- **Nav/Sidebar**: Public Navbar.
- **Cards/Sections**: Ready-to-dispatch filters, Wholesaler Cards (Warehouse square footage, Available inventory categories, Fleet delivery coverage, Average dispatch SLA).
- **Buttons**: `View Stockist Catalog`, `Request Spot Quotation`.
- **Button Actions**: Route to `/suppliers/:id` with wholesaler tab active.
- **Form Fields**: Warehouse city, inventory category.
- **Validation**: Location string sanitization.
- **API Endpoints**: `GET /api/wholesalers`.
- **Database Tables**: `public.businesses`, `public.supplier_profiles`.
- **Loading State**: Skeleton card grid.
- **Empty State**: "No wholesalers registered in this territory yet."
- **Error State**: System notification card.
- **Success State**: Wholesaler cards populated with inventory metrics.
- **Responsive Layout**: Responsive flex grid wrapping cleanly on small viewports.
- **Navigation After Actions**: Direct link to profile.
- **Permissions**: Public.

### 9. Distributor Directory
- **Route**: `/distributors`
- **Roles**: All
- **Purpose**: Directory of authorized brand channel partners and master distributors.
- **Layout**: Brand-centric directory grid.
- **Nav/Sidebar**: Public Navbar.
- **Cards/Sections**: Authorized Brand logo strip, Distributor Cards (Brands represented, Territorial exclusivity, Trade credit policy, Minimum billing amount).
- **Buttons**: `Verify Brand Authorization`, `Contact Master Distributor`.
- **Button Actions**: Inspect brand authorization certificate or open inquiry.
- **Form Fields**: Brand name search, territory state dropdown.
- **Validation**: Text search filtering.
- **API Endpoints**: `GET /api/distributors`.
- **Database Tables**: `public.businesses`, `public.supplier_profiles`.
- **Loading State**: Shimmer cards with brand logo placeholders.
- **Empty State**: "No authorized distributors listed for this brand."
- **Error State**: Warning card.
- **Success State**: Populated distributor grid with verified brand tags.
- **Responsive Layout**: Mobile stacks brand badges below distributor title.
- **Navigation After Actions**: Direct routing to `/suppliers/:id`.
- **Permissions**: Public.

### 10. Supplier Business Profile (Public View)
- **Route**: `/suppliers/:supplierId`
- **Roles**: All
- **Purpose**: Public trust storefront for any manufacturer, wholesaler, or distributor.
- **Layout**: Header cover banner, company summary, tabbed body (Catalog, Capabilities, Ground-Truth Verification, Reviews).
- **Nav/Sidebar**: Public Navbar.
- **Cards/Sections**: Company Banner (Name, Business Type, Location, Verification Badges), Summary Metrics (Years in operation, Total quotes issued, Order fulfillment rate), Catalog tab, Verification Dossier tab (Public certificates only), Factory Photos gallery.
- **Buttons**: `Submit Custom RFQ`, `Save Supplier`, `Download Company Profile`.
- **Button Actions**: Route to RFQ creation pre-targeted to this supplier.
- **Form Fields**: None.
- **Validation**: None.
- **API Endpoints**: `GET /api/suppliers/:id`, `GET /api/products?supplierId=:id`.
- **Database Tables**: `public.businesses`, `public.supplier_profiles`, `public.supplier_verifications`, `public.products`.
- **Loading State**: Full-page layout skeleton with avatar placeholder.
- **Empty State**: 404 page if supplier inactive or missing.
- **Error State**: Error alert with return button.
- **Success State**: Tabbed supplier dashboard displaying live catalog.
- **Responsive Layout**: Profile header info collapses into centered stack on mobile.
- **Navigation After Actions**: `Submit Custom RFQ` navigates to `/buyer/rfq/new?supplierId=:id`.
- **Permissions**: Public.

### 11. About COVERLY
- **Route**: `/about`
- **Roles**: All
- **Purpose**: Company mission, founding story, incubator affiliation (Rungta University Business Incubator), leadership, and MSME manifesto.
- **Layout**: Clean editorial article layout with milestone cards.
- **Nav/Sidebar**: Public Navbar.
- **Cards/Sections**: Mission Manifesto, Sourcing Reality vs Coverly Vision, Incubation Badge & Institutional Backing, Regional Focus (Chhattisgarh & Industrial Corridors), Security Commitments.
- **Buttons**: `Join as Buyer`, `Register Factory`.
- **Button Actions**: Route to `/register`.
- **Form Fields**: None.
- **Validation**: None.
- **API Endpoints**: None (Static content).
- **Database Tables**: None.
- **Loading State**: Fast static render.
- **Empty State**: N/A.
- **Error State**: N/A.
- **Success State**: Complete document rendered.
- **Responsive Layout**: Single column reading view with fluid typography.
- **Navigation After Actions**: Direct link to `/register`.
- **Permissions**: Public.

### 12. Contact / Support Page
- **Route**: `/contact`
- **Roles**: All
- **Purpose**: Direct customer assistance, office addresses (Bhilai / Raipur), and ticket dispatch for non-registered visitors.
- **Layout**: Two columns: left contact details and map coordinates, right general inquiry form.
- **Nav/Sidebar**: Public Navbar.
- **Cards/Sections**: Office Locations card, WhatsApp Business concierge card, Support ticket inquiry form.
- **Buttons**: `Send Message`, `Open Live WhatsApp`.
- **Button Actions**: Dispatch inquiry POST request.
- **Form Fields**: Name, Email, Phone, Subject, Message.
- **Validation**: All fields required; Email regex; Phone regex.
- **API Endpoints**: `POST /api/support/public-inquiry`.
- **Database Tables**: `public.support_tickets`.
- **Loading State**: Button spinner during dispatch.
- **Empty State**: Form initial state.
- **Error State**: Form error alert message.
- **Success State**: Success banner with support ticket reference token.
- **Responsive Layout**: Columns stack vertically on mobile.
- **Navigation After Actions**: Form resets with success confirmation.
- **Permissions**: Public.

---

# Group B: Authentication & Onboarding (Screens 13 – 19)

### 13. Registration Page
- **Route**: `/register`
- **Roles**: Guest
- **Purpose**: New user account creation with email, mobile phone, and password.
- **Layout**: Centered card on canvas background (`#F9DCD8` gradient).
- **Nav/Sidebar**: Minimalist header with Coverly logo and `Already have an account? Log in`.
- **Cards/Sections**: Registration Form card, Value bullets (Zero setup fee, Instant verified quotes).
- **Buttons**: `Create Account`, `Sign Up with Google`.
- **Button Actions**: Calls InsForge auth signup endpoint.
- **Form Fields**: Full Name, Email, Mobile Number, Password, Confirm Password, Terms Agreement checkbox.
- **Validation**: Name $\ge 2$ chars; Email valid; Mobile 10 digits; Password $\ge 8$ chars with 1 number and 1 symbol; Passwords match; Terms checked.
- **API Endpoints**: `POST /api/auth/register` (InsForge Auth SDK).
- **Database Tables**: `auth.users`, `public.users`.
- **Loading State**: Submitting spinner, disabled inputs.
- **Empty State**: Clean form.
- **Error State**: Error banner detailing existing email or weak password.
- **Success State**: Redirect to role selection or verification notice.
- **Responsive Layout**: Card spans full width with 16px margins on mobile.
- **Navigation After Actions**: Redirects to `/onboarding/role-selection`.
- **Permissions**: Anonymous only.

### 14. Login Page
- **Route**: `/login`
- **Roles**: Guest
- **Purpose**: Authenticate returning users via password or magic link OTP.
- **Layout**: Centered auth card on canvas gradient.
- **Nav/Sidebar**: Minimalist header.
- **Cards/Sections**: Login Form card, Toggle between Password and Phone OTP login.
- **Buttons**: `Sign In`, `Send OTP`, `Forgot Password?`, `Create an account`.
- **Button Actions**: Dispatches session creation to InsForge Auth.
- **Form Fields**: Email/Phone, Password (or OTP code).
- **Validation**: Email or 10-digit mobile required; Password non-empty.
- **API Endpoints**: `POST /api/auth/login`, `POST /api/auth/otp`.
- **Database Tables**: `auth.users`, `public.user_roles`.
- **Loading State**: Button spinner and locked input fields.
- **Empty State**: Initial login form.
- **Error State**: "Invalid credentials. Please verify your email and password."
- **Success State**: Session token persisted, user dispatched to designated workspace.
- **Responsive Layout**: Padding adjusts from 32px (desktop) to 16px (mobile).
- **Navigation After Actions**: Checks user role; routes to `/buyer/dashboard`, `/supplier/dashboard`, or `/admin/dashboard`.
- **Permissions**: Anonymous only.

### 15. Forgot Password Page
- **Route**: `/forgot-password`
- **Roles**: Guest
- **Purpose**: Initiate secure password recovery via email reset link.
- **Layout**: Centered auth card.
- **Nav/Sidebar**: Minimalist header with Back to Login link.
- **Cards/Sections**: Instruction card with Email input.
- **Buttons**: `Send Password Reset Link`.
- **Button Actions**: Calls password reset email dispatch.
- **Form Fields**: Registered Email Address.
- **Validation**: Valid email format.
- **API Endpoints**: `POST /api/auth/forgot-password`.
- **Database Tables**: `auth.users`.
- **Loading State**: Button spinner.
- **Empty State**: Clean form.
- **Error State**: Inline error message.
- **Success State**: Card updates to: "Check your inbox. A reset link has been dispatched."
- **Responsive Layout**: Centered card adapts to mobile width.
- **Navigation After Actions**: Remains on page with confirmation state and link back to `/login`.
- **Permissions**: Anonymous only.

### 16. Reset Password Page
- **Route**: `/reset-password?token=:token`
- **Roles**: Guest (with valid recovery token)
- **Purpose**: Enter and confirm new password following secure link retrieval.
- **Layout**: Centered auth card.
- **Nav/Sidebar**: Minimalist header.
- **Cards/Sections**: New password submission card.
- **Buttons**: `Update Password and Log In`.
- **Button Actions**: Updates credentials in InsForge auth.
- **Form Fields**: New Password, Confirm New Password.
- **Validation**: Password criteria ($\ge 8$ chars, symbol, number); Passwords match.
- **API Endpoints**: `POST /api/auth/reset-password`.
- **Database Tables**: `auth.users`.
- **Loading State**: Button spinner.
- **Empty State**: Form with token validation in progress.
- **Error State**: "This reset token has expired or is invalid. Request a new one."
- **Success State**: "Password updated successfully. Redirecting to login..."
- **Responsive Layout**: Mobile-optimized centered card.
- **Navigation After Actions**: Navigates to `/login` after 2-second delay.
- **Permissions**: Valid token required.

### 17. Role Selection Page
- **Route**: `/onboarding/role-selection`
- **Roles**: Authenticated user without confirmed profile
- **Purpose**: Explicit selection of the user's primary operating persona on Coverly.
- **Layout**: 4-card interactive grid selection layout.
- **Nav/Sidebar**: Onboarding header with progress bar (Step 1 of 3).
- **Cards/Sections**:
  - `Buyer Card`: "I want to source raw materials, compare quotations, and purchase goods."
  - `Manufacturer Card`: "I operate a factory/plant and produce custom or bulk goods."
  - `Wholesaler Card`: "I hold wholesale stock and sell ready-to-ship lots."
  - `Distributor Card`: "I hold authorized brand distribution rights for specific regions."
  - `Buyer + Supplier Toggle`: "I buy materials AND supply finished goods."
- **Buttons**: `Continue to Business Details`.
- **Button Actions**: Saves temporary role choice to session state.
- **Form Fields**: Radio card selection, dual-role checkbox.
- **Validation**: Exactly one primary role selected.
- **API Endpoints**: `POST /api/users/role-intent`.
- **Database Tables**: `public.user_roles`.
- **Loading State**: Spinner during role registration.
- **Empty State**: Buyer selected by default.
- **Error State**: Alert if role update fails.
- **Success State**: Smooth transition to step 2.
- **Responsive Layout**: 2x2 grid collapses to single column on mobile.
- **Navigation After Actions**: Routes to `/onboarding/business-details`.
- **Permissions**: Authenticated user.

### 18. Business Onboarding Page
- **Route**: `/onboarding/business-details`
- **Roles**: Authenticated user
- **Purpose**: Collect verified company identification, GSTIN, registered office address, and catalog intentions.
- **Layout**: Multi-step structured form card with progress indicators.
- **Nav/Sidebar**: Onboarding header (Step 2 of 3).
- **Cards/Sections**: Company Identification, Legal Entity Type (Proprietorship, Partnership, Pvt Ltd), Tax Identifiers (GSTIN, PAN), Registered Address, Industrial Segment.
- **Buttons**: `Save & Continue`, `Back to Role Selection`.
- **Button Actions**: Validates GSTIN format and creates business entity.
- **Form Fields**: Business Legal Name, Trade Name, GSTIN (optional for micro-buyers), PAN, Pincode, City, State, Primary Category.
- **Validation**: GSTIN regex `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`; Pincode 6 digits.
- **API Endpoints**: `POST /api/businesses/onboard`.
- **Database Tables**: `public.businesses`, `public.business_members`, `public.buyer_profiles`, `public.supplier_profiles`.
- **Loading State**: Button spinner during business record creation.
- **Empty State**: Pre-populated with user name and phone if available.
- **Error State**: Field errors highlighted in coral.
- **Success State**: Business created in InsForge database.
- **Responsive Layout**: Form fields stack into single column on mobile screens.
- **Navigation After Actions**: Routes to `/onboarding/complete`.
- **Permissions**: Authenticated user.

### 19. Onboarding Completion Page
- **Route**: `/onboarding/complete`
- **Roles**: Authenticated user
- **Purpose**: Welcome screen confirming account creation and presenting next actionable step.
- **Layout**: Centered celebration card with checklist.
- **Nav/Sidebar**: Minimal header.
- **Cards/Sections**: Welcome banner, Next Steps checklist (Complete profile, Verify phone, Submit first RFQ / Add first product).
- **Buttons**: `Go to My Dashboard`, `Submit Verification Documents Now`.
- **Button Actions**: Directs user to their dedicated portal.
- **Form Fields**: None.
- **Validation**: None.
- **API Endpoints**: `GET /api/users/me`.
- **Database Tables**: `public.users`, `public.businesses`.
- **Loading State**: Smooth fade-in animation.
- **Empty State**: N/A.
- **Error State**: N/A.
- **Success State**: Confetti trigger and personalized welcome greeting.
- **Responsive Layout**: Fluid centered card on all devices.
- **Navigation After Actions**: Navigates to `/buyer/dashboard` or `/supplier/dashboard`.
- **Permissions**: Authenticated user.

---

# Group C: Buyer Application (Screens 20 – 40)

### 20. Buyer Dashboard
- **Route**: `/buyer/dashboard`
- **Roles**: Buyer, Buyer + Supplier, Admin
- **Purpose**: Command center for procurement activities, pending quotes, active orders, and quick RFQ generation.
- **Layout**: Sidebar navigation layout with top metric strip and dual-column activity stream.
- **Nav/Sidebar**: Buyer Sidebar (`Dashboard, Discover, RFQs, Quotes, Orders, Saved, Settings`).
- **Cards/Sections**:
  - `Metric Cards`: Active RFQs, Pending Quotations, Orders In-Transit, Total Estimated Sourcing Savings.
  - `Recent Quotes Received`: Top 3 quotes awaiting review with landed cost comparisons.
  - `Live Order Tracker`: Active PO fulfillment progress bar.
  - `Quick RFQ Launcher`: Inline 3-field requirement submitter.
- **Buttons**: `Create New RFQ`, `Review All Quotes`, `Track Order`.
- **Button Actions**: Quick routing to respective buyer workflows.
- **Form Fields**: Quick RFQ input (Item title, quantity, target city).
- **Validation**: Positive integer for quantity.
- **API Endpoints**: `GET /api/buyer/dashboard-summary`.
- **Database Tables**: `public.rfqs`, `public.quotations`, `public.orders`.
- **Loading State**: Skeleton metric cards and shimmering table rows.
- **Empty State**: Zero-state illustration with "Launch your first RFQ to receive competitive landed quotes."
- **Error State**: Toast alert with manual refresh button.
- **Success State**: Real-time aggregated metrics loaded from InsForge.
- **Responsive Layout**: Sidebar collapses into bottom navigation bar on `< 768px`.
- **Navigation After Actions**: Direct routing to `/buyer/rfq/new`.
- **Permissions**: Role `buyer` or `buyer_supplier`.

### 21. Discover Products (Buyer View)
- **Route**: `/buyer/discover/products`
- **Roles**: Buyer, Buyer + Supplier
- **Purpose**: Authenticated product catalog with buyer-specific pricing, MOQ filters, and 1-click RFQ bundling.
- **Layout**: Sidebar layout with multi-facet filters and product cards.
- **Nav/Sidebar**: Buyer Sidebar.
- **Cards/Sections**: Category pills, Supplier tier filters, Product Cards with "Add to RFQ Basket".
- **Buttons**: `Add to RFQ Basket`, `Request Custom Quote`, `Filter by State`.
- **Button Actions**: Appends product item to multi-item RFQ builder context.
- **Form Fields**: Search bar, MOQ slider, Price ceiling.
- **Validation**: Valid integer bounds.
- **API Endpoints**: `GET /api/products?buyerContext=true`.
- **Database Tables**: `public.products`, `public.suppliers`.
- **Loading State**: Grid shimmer cards.
- **Empty State**: "No products match criteria."
- **Error State**: Inline retry notice.
- **Success State**: Loaded product cards with quantity selectors.
- **Responsive Layout**: 2 columns on tablet, 1 on mobile.
- **Navigation After Actions**: Bottom sticky bar appears: "3 items in RFQ draft $\to$ Proceed to RFQ".
- **Permissions**: Buyer role.

### 22. Find Manufacturers
- **Route**: `/buyer/discover/manufacturers`
- **Roles**: Buyer, Buyer + Supplier
- **Purpose**: Filtered directory focused on primary OEMs and industrial factories.
- **Layout**: Sidebar layout with map/list toggle view.
- **Nav/Sidebar**: Buyer Sidebar.
- **Cards/Sections**: Industrial Corridor selector (Raipur, Bhilai, Ludhiana, Surat, Tiruppur), Factory audit level badges, Direct RFQ broadcast trigger.
- **Buttons**: `Broadcast RFQ to Filtered Manufacturers`, `View Audit Dossier`.
- **Button Actions**: Open multi-recipient RFQ modal.
- **Form Fields**: Factory certification filter, Minimum monthly capacity.
- **Validation**: Form inputs sanitized.
- **API Endpoints**: `GET /api/manufacturers?verifiedOnly=true`.
- **Database Tables**: `public.businesses`, `public.supplier_profiles`, `public.supplier_verifications`.
- **Loading State**: Shimmer manufacturer cards.
- **Empty State**: "No verified manufacturers in this corridor."
- **Error State**: Error alert banner.
- **Success State**: List of audited manufacturers with verified checkmarks.
- **Responsive Layout**: Map view hides on mobile; cards stack vertically.
- **Navigation After Actions**: Card click routes to `/buyer/suppliers/:id`.
- **Permissions**: Buyer role.

### 23. Find Wholesalers
- **Route**: `/buyer/discover/wholesalers`
- **Roles**: Buyer, Buyer + Supplier
- **Purpose**: Locate bulk stockists offering fast dispatch and local warehousing.
- **Layout**: Sidebar layout with radius search.
- **Nav/Sidebar**: Buyer Sidebar.
- **Cards/Sections**: Distance radius slider, Inventory category tags, Wholesaler Cards with dispatch turnaround times.
- **Buttons**: `Request Immediate Lot Price`, `Save to Preferred Suppliers`.
- **Button Actions**: Pre-populates RFQ with target wholesaler.
- **Form Fields**: Destination pincode, Max lead time (days).
- **Validation**: 6-digit Indian pincode.
- **API Endpoints**: `GET /api/wholesalers?pincode=:code`.
- **Database Tables**: `public.businesses`, `public.supplier_profiles`.
- **Loading State**: Skeleton card placeholders.
- **Empty State**: "No stockists within selected radius. Broaden search."
- **Error State**: Error notification.
- **Success State**: Nearby stockist cards populated.
- **Responsive Layout**: Stacked view with sticky distance filter on mobile.
- **Navigation After Actions**: Routes to RFQ creation.
- **Permissions**: Buyer role.

### 24. Find Distributors
- **Route**: `/buyer/discover/distributors`
- **Roles**: Buyer, Buyer + Supplier
- **Purpose**: Access authorized brand channel partners for branded commercial procurement.
- **Layout**: Sidebar layout with brand directory alphabetizer.
- **Nav/Sidebar**: Buyer Sidebar.
- **Cards/Sections**: Brand selector, Territory authorization check, Distributor listings.
- **Buttons**: `Request Trade Pricing`, `Inspect Authorization Certificate`.
- **Button Actions**: Opens brand certificate preview modal.
- **Form Fields**: Brand name, Category.
- **Validation**: Non-empty filter.
- **API Endpoints**: `GET /api/distributors`.
- **Database Tables**: `public.businesses`, `public.supplier_profiles`.
- **Loading State**: Skeleton distributor cards.
- **Empty State**: "No authorized distributors for this brand."
- **Error State**: System alert message.
- **Success State**: Verified distributor listings.
- **Responsive Layout**: Fluid single-column on mobile.
- **Navigation After Actions**: View supplier profile.
- **Permissions**: Buyer role.

### 25. Supplier Search Results (Buyer View)
- **Route**: `/buyer/search/suppliers`
- **Roles**: Buyer, Buyer + Supplier
- **Purpose**: Search result listing tailored to buyer purchasing history and saved criteria.
- **Layout**: Filter rail on left, paginated search results on right.
- **Nav/Sidebar**: Buyer Sidebar.
- **Cards/Sections**: Active filters summary, Sort bar (Relevance, True landed cost average, Verification level), Results cards.
- **Buttons**: `Select for Multi-RFQ`, `Compare Profiles`.
- **Button Actions**: Checkbox selection for mass RFQ dispatch.
- **Form Fields**: Search refinements.
- **Validation**: Query text checks.
- **API Endpoints**: `GET /api/search/suppliers`.
- **Database Tables**: `public.businesses`, `public.supplier_profiles`.
- **Loading State**: Skeleton search stream.
- **Empty State**: "No matching suppliers. Try altering location or terms."
- **Error State**: Retry banner.
- **Success State**: Filtered results list.
- **Responsive Layout**: Checkbox selections collapse into mobile bottom action bar.
- **Navigation After Actions**: "Dispatch RFQ to 3 Selected" navigates to `/buyer/rfq/new`.
- **Permissions**: Buyer role.

### 26. Supplier Profile (Buyer Authenticated View)
- **Route**: `/buyer/suppliers/:supplierId`
- **Roles**: Buyer, Buyer + Supplier
- **Purpose**: Deep supplier analysis displaying past buyer fulfillment history, verified capacity, and catalog.
- **Layout**: Full-width header with detailed tabbed content panels.
- **Nav/Sidebar**: Buyer Sidebar.
- **Cards/Sections**: Verification Audit strip, Factory & Warehouse facilities, Full Catalog with bulk MOQ discounts, Past Transaction Performance rating.
- **Buttons**: `Send Direct RFQ`, `Bookmark Supplier`, `Ask a Question`.
- **Button Actions**: Opens contextual inquiry modal or RFQ form.
- **Form Fields**: Message input in inquiry modal.
- **Validation**: Message $> 10$ characters.
- **API Endpoints**: `GET /api/suppliers/:id`, `POST /api/support/inquiry`.
- **Database Tables**: `public.businesses`, `public.supplier_profiles`, `public.supplier_verifications`.
- **Loading State**: Full-page skeleton.
- **Empty State**: 404 view if supplier not found.
- **Error State**: Toast alert.
- **Success State**: Loaded profile with audited credentials.
- **Responsive Layout**: Tabs become horizontally scrollable on mobile.
- **Navigation After Actions**: Routes to `/buyer/rfq/new?supplierId=:id`.
- **Permissions**: Buyer role.

### 27. Product Details (Buyer View)
- **Route**: `/buyer/products/:productId`
- **Roles**: Buyer, Buyer + Supplier
- **Purpose**: Authenticated product inspection with live landed cost estimator for buyer's default shipping address.
- **Layout**: 2-column detailed view with interactive cost breakdown.
- **Nav/Sidebar**: Buyer Sidebar.
- **Cards/Sections**: Product specifications, Tiered volume pricing, Real-time Landed Cost Calculator pre-filled with buyer's registered delivery pincode, Supplier credibility card.
- **Buttons**: `Add to RFQ`, `Order Sample`, `Calculate Custom Delivery`.
- **Button Actions**: Updates landed cost calculation; opens RFQ draft.
- **Form Fields**: Quantity counter, Alternative destination pincode.
- **Validation**: Quantity $\ge$ MOQ.
- **API Endpoints**: `GET /api/products/:id`, `POST /api/rfq/calculate`.
- **Database Tables**: `public.products`, `public.suppliers`.
- **Loading State**: Detail shimmer.
- **Empty State**: Product unavailable view.
- **Error State**: Error alert.
- **Success State**: Live interactive landed cost calculation rendered.
- **Responsive Layout**: Calculator stacks under specifications on mobile.
- **Navigation After Actions**: Routes to `/buyer/rfq/new`.
- **Permissions**: Buyer role.

### 28. Create RFQ Page
- **Route**: `/buyer/rfq/new`
- **Roles**: Buyer, Buyer + Supplier
- **Purpose**: Primary sourcing form for submitting detailed product requirements and logistics parameters.
- **Layout**: Multi-step wizard form (1. Requirement, 2. Quantities & Specs, 3. Delivery & Timeline, 4. Supplier Selection).
- **Nav/Sidebar**: Buyer Sidebar with wizard progress bar.
- **Cards/Sections**: Product Specifications card, Quantity & Packaging requirements, Delivery destination (Pincode, City, State, Unloading dock availability), Supplier Matching options (Open Match vs Handpicked).
- **Buttons**: `Save as Draft`, `Proceed to Review`, `Add Another Item`.
- **Button Actions**: Validates form stage and advances wizard.
- **Form Fields**: Item Name, Category, Detailed Technical Specs (GSM, dimensions, grade), Quantity, Unit (pc, kg, meter, ton), Target Unit Price (optional), Target Delivery Date, Delivery Address, Matching Preference.
- **Validation**: Title required; Category required; Quantity $> 0$; Delivery date in future ($\ge 48$ hours); Pincode 6 digits.
- **API Endpoints**: `POST /api/rfqs` (draft), `GET /api/categories`.
- **Database Tables**: `public.rfqs`, `public.rfq_items`.
- **Loading State**: Submit button spinner; auto-save indicator.
- **Empty State**: Clean initial wizard.
- **Error State**: Field-level validation messages in coral.
- **Success State**: Draft saved indicator; advance to review.
- **Responsive Layout**: Form fields stack into single column on mobile.
- **Navigation After Actions**: Navigates to `/buyer/rfq/review/:rfqId`.
- **Permissions**: Buyer role.

### 29. RFQ Review & Submission
- **Route**: `/buyer/rfq/review/:rfqId`
- **Roles**: Buyer, Buyer + Supplier
- **Purpose**: Final verification of all RFQ parameters, recipient preview, and formal broadcast dispatch.
- **Layout**: Centered summary card with itemized requirement table.
- **Nav/Sidebar**: Buyer Sidebar.
- **Cards/Sections**: RFQ Summary card, Delivery destination card, Matching preview (Displays list of verified suppliers set to receive the RFQ), Terms agreement.
- **Buttons**: `Confirm & Dispatch RFQ`, `Edit Requirements`, `Discard Draft`.
- **Button Actions**: Finalizes RFQ, transitions status to `submitted`, and triggers supplier notification alerts.
- **Form Fields**: Confirmation checkbox.
- **Validation**: Checkbox must be checked.
- **API Endpoints**: `POST /api/rfqs/:id/submit`.
- **Database Tables**: `public.rfqs`, `public.rfq_items`, `public.rfq_recipients`.
- **Loading State**: Dispatching spinner modal ("Matching audited suppliers...").
- **Empty State**: N/A.
- **Error State**: Submission failure alert with retry button.
- **Success State**: "RFQ #8492 Successfully Dispatched to 6 Verified Suppliers."
- **Responsive Layout**: Fluid single-column card on mobile devices.
- **Navigation After Actions**: Navigates to `/buyer/rfqs`.
- **Permissions**: RFQ owner only.

### 30. My RFQs (List View)
- **Route**: `/buyer/rfqs`
- **Roles**: Buyer, Buyer + Supplier
- **Purpose**: Manage, filter, and track all submitted, active, and completed RFQs.
- **Layout**: Data table with status filter tabs and search bar.
- **Nav/Sidebar**: Buyer Sidebar.
- **Cards/Sections**: Status Filter Tabs (`All, Active, Responses Received, Closed, Draft`), RFQs Data Table (RFQ ID, Created Date, Category, Quantity, Recipient Count, Quotes Received, Status Badge, Actions).
- **Buttons**: `Create New RFQ`, `View Quotes`, `Close RFQ`.
- **Button Actions**: Directs to quote comparison or detail view.
- **Form Fields**: RFQ search input, Status filter dropdown.
- **Validation**: None.
- **API Endpoints**: `GET /api/buyer/rfqs`.
- **Database Tables**: `public.rfqs`, `public.quotations`.
- **Loading State**: Shimmering table rows.
- **Empty State**: "You have no active RFQs. Click 'Create New RFQ' to receive quotes."
- **Error State**: Table error notification with reload button.
- **Success State**: Populated table with live quote counters.
- **Responsive Layout**: Table converts to card stack on mobile screens (`< 768px`).
- **Navigation After Actions**: Row click opens `/buyer/rfqs/:id`.
- **Permissions**: Buyer role.

### 31. RFQ Details View
- **Route**: `/buyer/rfqs/:rfqId`
- **Roles**: Buyer, Buyer + Supplier
- **Purpose**: Comprehensive status tracker for a specific RFQ including recipient delivery status and received quotes.
- **Layout**: Left requirement column (1/3), right activity and response stream (2/3).
- **Nav/Sidebar**: Buyer Sidebar.
- **Cards/Sections**: RFQ Specification card, Recipient Status list (Sent, Viewed, Quoted, Declined), Incoming Quotations preview cards with landed cost snippets.
- **Buttons**: `Compare All Quotes`, `Extend RFQ Deadline`, `Cancel RFQ`.
- **Button Actions**: Routes to Compare Quotes or updates RFQ status.
- **Form Fields**: Deadline extension date picker.
- **Validation**: Extended date must be later than current deadline.
- **API Endpoints**: `GET /api/rfqs/:id`, `GET /api/rfqs/:id/recipients`.
- **Database Tables**: `public.rfqs`, `public.rfq_items`, `public.rfq_recipients`, `public.quotations`.
- **Loading State**: Multi-card skeleton.
- **Empty State**: "Awaiting first supplier response. Quoting turnaround averages 14 hours."
- **Error State**: Error alert.
- **Success State**: Live quotation notifications.
- **Responsive Layout**: Columns stack vertically on mobile.
- **Navigation After Actions**: `Compare All Quotes` opens `/buyer/rfqs/:id/compare`.
- **Permissions**: RFQ owner.

### 32. Received Quotations
- **Route**: `/buyer/quotations`
- **Roles**: Buyer, Buyer + Supplier
- **Purpose**: Central inbox for all incoming quotations across all active RFQs.
- **Layout**: Sortable data table with landed cost badges.
- **Nav/Sidebar**: Buyer Sidebar.
- **Cards/Sections**: Filters (By RFQ, By Supplier, By Status), Quotations Table (Quote ID, RFQ Reference, Supplier Name, Sticker Price, Estimated Landed Cost, Lead Time, Validity, Actions).
- **Buttons**: `Compare Quotes`, `Accept Quote`, `Decline Quote`.
- **Button Actions**: Initiates PO creation or opens comparison view.
- **Form Fields**: Table filter select.
- **Validation**: None.
- **API Endpoints**: `GET /api/buyer/quotations`.
- **Database Tables**: `public.quotations`, `public.rfqs`, `public.suppliers`.
- **Loading State**: Skeleton table.
- **Empty State**: "No quotations received yet."
- **Error State**: Table reload prompt.
- **Success State**: Loaded quotation list with highlighted "Best Landed" pills.
- **Responsive Layout**: Mobile view displays individual quotation summary cards.
- **Navigation After Actions**: Click opens `/buyer/quotations/:id`.
- **Permissions**: Buyer role.

### 33. Quotation Details Page
- **Route**: `/buyer/quotations/:quoteId`
- **Roles**: Buyer, Buyer + Supplier
- **Purpose**: Deep dive into a single quotation's itemized costs, payment terms, and validity.
- **Layout**: 2-column layout: left quote breakdown, right supplier credibility and acceptance panel.
- **Nav/Sidebar**: Buyer Sidebar.
- **Cards/Sections**: Itemized Cost Breakdown card (Base price, Freight, Packaging, GST 5%/12%/18%, Transit insurance), Landed Cost Formula card, Commercial Terms card (Payment terms, Advance %, Dispatch timeline, Validity expiry countdown), Supplier Verification Dossier summary.
- **Buttons**: `Accept Quote & Create Order`, `Ask Supplier Question`, `Reject Quote`.
- **Button Actions**: Advances to order creation flow or opens messaging.
- **Form Fields**: Rejection reason dropdown (optional).
- **Validation**: Confirmation modal required before acceptance.
- **API Endpoints**: `GET /api/quotations/:id`, `POST /api/quotations/:id/accept`.
- **Database Tables**: `public.quotations`, `public.quotation_items`, `public.quotation_costs`.
- **Loading State**: Shimmer card loading.
- **Empty State**: 404 view if quote ID invalid.
- **Error State**: Error notification.
- **Success State**: Complete quote breakdown rendered.
- **Responsive Layout**: Single column on mobile; acceptance CTA sticky at bottom.
- **Navigation After Actions**: Acceptance routes to `/buyer/orders/:orderId`.
- **Permissions**: Buyer who owns the associated RFQ.

### 34. Compare Quotations (Signature Feature)
- **Route**: `/buyer/rfqs/:rfqId/compare`
- **Roles**: Buyer, Buyer + Supplier
- **Purpose**: Side-by-side multi-vendor comparison unmasking sticker price illusions and highlighting true landed cost.
- **Layout**: Horizontal comparative matrix (up to 4 quotes side-by-side) with sticky comparison parameters.
- **Nav/Sidebar**: Buyer Sidebar.
- **Cards/Sections**:
  - `Illusion Callout Banner`: Explains why the lowest sticker vendor may be more expensive than an alternative due to freight.
  - `Comparison Matrix`: Rows for Base Unit Price, MOQ, Transport Lane Freight, Applicable GST Rate, Taxes in INR, Other Fees, Net Landed Cost per Unit, Total Lot Cost, Delivery SLA, Supplier Verification Level.
- **Buttons**: `Select & Accept This Quote` (on each quote column), `Export Comparison PDF`, `Request Counter Quote`.
- **Button Actions**: Triggers quotation acceptance transaction for the chosen column.
- **Form Fields**: None.
- **Validation**: Confirmation dialog before acceptance.
- **API Endpoints**: `GET /api/rfqs/:id/comparison`.
- **Database Tables**: `public.rfqs`, `public.quotations`, `public.quotation_costs`, `public.suppliers`.
- **Loading State**: Comparative skeleton columns.
- **Empty State**: "Need at least 2 quotations to run side-by-side comparison."
- **Error State**: Error banner with reload action.
- **Success State**: Winning landed cost highlighted in coral with "Lowest Landed Cost" ribbon.
- **Responsive Layout**: On mobile, quotes swipe horizontally as cards with a persistent parameter toggle.
- **Navigation After Actions**: Quote acceptance navigates to `/buyer/orders/:orderId`.
- **Permissions**: RFQ owner.

### 35. Inquiry Communication (RFQ Messaging)
- **Route**: `/buyer/inquiries/:rfqId/:supplierId`
- **Roles**: Buyer, Buyer + Supplier
- **Purpose**: Contextual direct messaging between buyer and a specific supplier tied to an active RFQ.
- **Layout**: Chat thread layout with RFQ summary sidebar.
- **Nav/Sidebar**: Buyer Sidebar.
- **Cards/Sections**: RFQ Context Header (RFQ #, Item, Qty, Target City), Threaded Chat stream, Message composer with attachment uploader.
- **Buttons**: `Send Message`, `Attach Specification PDF`, `View Live Quote`.
- **Button Actions**: Dispatches message to database and notifies supplier.
- **Form Fields**: Text message input, file attachment.
- **Validation**: Message non-empty; attachment $\le 10\text{MB}$ (PDF, JPG, PNG).
- **API Endpoints**: `GET /api/inquiries/:rfqId/:supplierId`, `POST /api/inquiries/message`.
- **Database Tables**: `public.inquiries`, `public.inquiry_messages`.
- **Loading State**: Chat bubble placeholders.
- **Empty State**: "No messages yet. Send an inquiry regarding packaging, delivery, or specifications."
- **Error State**: Toast error on send failure with retry.
- **Success State**: Message appended to live thread with timestamp and read receipt.
- **Responsive Layout**: Sidebar collapses; chat view occupies full screen height.
- **Navigation After Actions**: Stays in chat thread.
- **Permissions**: Buyer and designated Supplier only.

### 36. Saved Suppliers
- **Route**: `/buyer/saved-suppliers`
- **Roles**: Buyer, Buyer + Supplier
- **Purpose**: Directory of bookmarked, frequently used, or preferred suppliers.
- **Layout**: Grid of supplier summary cards with quick-action buttons.
- **Nav/Sidebar**: Buyer Sidebar.
- **Cards/Sections**: Supplier cards (Name, Primary Category, Location, Verification Badge, Internal Note, Last Order Date).
- **Buttons**: `Create RFQ for Supplier`, `Remove from Saved`, `Add Note`.
- **Button Actions**: Initiates targeted RFQ or toggles bookmark state.
- **Form Fields**: Supplier search input.
- **Validation**: None.
- **API Endpoints**: `GET /api/buyer/saved-suppliers`, `DELETE /api/buyer/saved-suppliers/:id`.
- **Database Tables**: `public.saved_suppliers`, `public.businesses`.
- **Loading State**: Shimmer cards.
- **Empty State**: "You have not bookmarked any suppliers yet. Explore the directory to save verified partners."
- **Error State**: Toast alert.
- **Success State**: Filtered bookmark grid.
- **Responsive Layout**: Stacks to 1 column on mobile.
- **Navigation After Actions**: Removing supplier animates card removal.
- **Permissions**: Buyer role.

### 37. My Orders (Buyer View)
- **Route**: `/buyer/orders`
- **Roles**: Buyer, Buyer + Supplier
- **Purpose**: Master ledger of all confirmed Purchase Orders, active deliveries, and historical fulfillments.
- **Layout**: Table view with status filter tabs.
- **Nav/Sidebar**: Buyer Sidebar.
- **Cards/Sections**: Status Tabs (`All, Pending Confirmation, Processing, In-Transit, Delivered, Completed, Cancelled`), Orders Table (PO #, Date, Supplier, Items, Final Landed Amount, Status Badge, Actions).
- **Buttons**: `Track Consignment`, `View PO Details`, `Download Tax Invoice`.
- **Button Actions**: Directs to tracking screen or generates invoice PDF.
- **Form Fields**: PO search input, Date range picker.
- **Validation**: None.
- **API Endpoints**: `GET /api/buyer/orders`.
- **Database Tables**: `public.orders`, `public.order_items`, `public.businesses`.
- **Loading State**: Shimmering table rows.
- **Empty State**: "No orders found. Accept a quotation to create your first order."
- **Error State**: Table reload button.
- **Success State**: Populated order records with active milestone chips.
- **Responsive Layout**: Mobile converts table rows to card blocks.
- **Navigation After Actions**: Row click opens `/buyer/orders/:id`.
- **Permissions**: Buyer role.

### 38. Order Details Page
- **Route**: `/buyer/orders/:orderId`
- **Roles**: Buyer, Buyer + Supplier
- **Purpose**: Comprehensive Purchase Order overview including terms, payment milestones, delivery address, and invoice downloads.
- **Layout**: Two columns: left PO line items and terms, right live status tracker and supplier communications.
- **Nav/Sidebar**: Buyer Sidebar.
- **Cards/Sections**: Purchase Order Header (PO #, Creation Date, Quoted Landed Total), Line Items table, Commercial & Payment Terms, Consignment Tracking snippet, Contact Supplier button.
- **Buttons**: `Confirm Delivery & Sign-off`, `Download Signed PO`, `Report Issue / Open Dispute`.
- **Button Actions**: Updates order milestone or opens dispute ticket.
- **Form Fields**: Delivery confirmation feedback notes.
- **Validation**: Confirmation dialog.
- **API Endpoints**: `GET /api/orders/:id`, `POST /api/orders/:id/confirm-delivery`.
- **Database Tables**: `public.orders`, `public.order_items`, `public.order_status_history`.
- **Loading State**: Full-page skeleton.
- **Empty State**: 404 if order missing.
- **Error State**: Alert notification.
- **Success State**: Loaded order details.
- **Responsive Layout**: Stacks into single column on mobile.
- **Navigation After Actions**: Delivery sign-off transitions status to `completed`.
- **Permissions**: Order buyer.

### 39. Order Tracking View
- **Route**: `/buyer/orders/:orderId/tracking`
- **Roles**: Buyer, Buyer + Supplier
- **Purpose**: Visual milestone stepper tracking production, packaging, dispatch, and carrier transport.
- **Layout**: Centered timeline stepper card with carrier metadata panel.
- **Nav/Sidebar**: Buyer Sidebar.
- **Cards/Sections**: Milestone Timeline (Confirmed $\to$ Processing $\to$ Quality Check $\to$ Dispatched $\to$ Out for Delivery $\to$ Delivered), Transport Logistics card (Carrier name, E-way bill number, Vehicle registration, Driver contact, Expected ETA).
- **Buttons**: `Refresh Status`, `Call Transport Desk`, `Download E-Way Bill`.
- **Button Actions**: Refreshes live tracking telemetry.
- **Form Fields**: None.
- **Validation**: None.
- **API Endpoints**: `GET /api/orders/:id/tracking`.
- **Database Tables**: `public.orders`, `public.order_status_history`.
- **Loading State**: Timeline shimmer.
- **Empty State**: "Carrier details will appear once the supplier dispatches the consignment."
- **Error State**: System alert message.
- **Success State**: Real-time progress bar highlighted to current milestone.
- **Responsive Layout**: Timeline renders vertically on mobile devices.
- **Navigation After Actions**: In-place status refresh.
- **Permissions**: Order buyer.

### 40. Buyer Profile & Settings
- **Route**: `/buyer/settings`
- **Roles**: Buyer, Buyer + Supplier
- **Purpose**: Manage buyer company details, shipping addresses, GSTIN credentials, and notification preferences.
- **Layout**: Left settings navigation tabs, right configuration form panels.
- **Nav/Sidebar**: Buyer Sidebar.
- **Cards/Sections**: Company Profile, Saved Delivery Locations, GSTIN & Tax Settings, Notification Matrix (Email/WhatsApp/In-app), Security & Password.
- **Buttons**: `Save Changes`, `Add New Shipping Address`, `Change Password`.
- **Button Actions**: Updates business and user profile records.
- **Form Fields**: Trade Name, GSTIN, Default Delivery Address, City, State, Pincode, Phone, Email.
- **Validation**: GSTIN regex; Pincode 6 digits.
- **API Endpoints**: `PUT /api/buyer/profile`, `PUT /api/users/settings`.
- **Database Tables**: `public.businesses`, `public.buyer_profiles`, `public.users`.
- **Loading State**: Button spinner during save.
- **Empty State**: Pre-populated with active profile.
- **Error State**: Field errors highlighted.
- **Success State**: Green toast: "Profile updated successfully."
- **Responsive Layout**: Navigation tabs collapse into dropdown on mobile.
- **Navigation After Actions**: Remains on settings page.
- **Permissions**: Buyer role.

---

# Group D: Supplier Application (Screens 41 – 60)

### 41. Supplier Dashboard
- **Route**: `/supplier/dashboard`
- **Roles**: Manufacturer, Wholesaler, Distributor, Buyer + Supplier, Admin
- **Purpose**: Business performance dashboard displaying incoming RFQs, pending quote submissions, active orders, and revenue metrics.
- **Layout**: Sidebar layout with KPI stat cards, RFQ alert queue, and order fulfillment tracker.
- **Nav/Sidebar**: Supplier Sidebar (`Dashboard, Catalog, Verification, RFQs, Quotes, Orders, Stats, Settings`).
- **Cards/Sections**:
  - `KPI Cards`: New RFQs (Last 24h), Submitted Quotes, Active Orders in Production, Monthly Gross Sourced Value.
  - `Incoming RFQ Priority Queue`: Urgent RFQs matching supplier's category and delivery region.
  - `Recent Orders Awaiting Dispatch`: Orders in processing milestone.
  - `Verification Level Card`: Current badge status (Level 1–4) with action to upgrade.
- **Buttons**: `Quote Urgent RFQ`, `Add New Product`, `Upgrade Verification`.
- **Button Actions**: Directs to quote form, product creation, or verification wizard.
- **Form Fields**: None.
- **Validation**: None.
- **API Endpoints**: `GET /api/supplier/dashboard-summary`.
- **Database Tables**: `public.rfq_recipients`, `public.quotations`, `public.orders`, `public.businesses`.
- **Loading State**: Skeleton metric cards and shimmering tables.
- **Empty State**: "No incoming RFQs matching your category right now. Add more product keywords."
- **Error State**: Alert notification.
- **Success State**: Live dashboard metrics rendered.
- **Responsive Layout**: Sidebar collapses to mobile bottom drawer on small screens.
- **Navigation After Actions**: `Quote Urgent RFQ` opens `/supplier/rfqs/:id/quote`.
- **Permissions**: Supplier roles (`manufacturer`, `wholesaler`, `distributor`, `buyer_supplier`).

### 42. Business Profile Management
- **Route**: `/supplier/profile`
- **Roles**: Supplier roles
- **Purpose**: Manage factory/warehouse specifications, machinery lists, service locations, and business descriptions.
- **Layout**: Multi-tab profile editor (General, Facilities, Coverage, Certifications).
- **Nav/Sidebar**: Supplier Sidebar.
- **Cards/Sections**: General Business Info card, Factory/Warehouse Details card (Floor area, Plant address, Year established), Manufacturing Capabilities (Machinery list, Monthly output capacity, Testing equipment), Regional Logistics Coverage.
- **Buttons**: `Update Profile`, `Add Machinery Item`, `Upload Plant Photo`.
- **Button Actions**: Dispatches profile update to backend.
- **Form Fields**: Company Bio, Factory Address, Machinery Type, Installed Capacity, Operating Shifts, Logistics Lanes.
- **Validation**: Required fields non-empty; numeric capacity $> 0$.
- **API Endpoints**: `PUT /api/supplier/profile`.
- **Database Tables**: `public.businesses`, `public.supplier_profiles`.
- **Loading State**: Button spinner during save.
- **Empty State**: Initial pre-filled state.
- **Error State**: Field validation errors.
- **Success State**: Toast alert: "Business profile updated successfully."
- **Responsive Layout**: Tabs convert to accordion on mobile.
- **Navigation After Actions**: Remains on profile page.
- **Permissions**: Supplier business owner.

### 43. Business Verification Submission
- **Route**: `/supplier/verification/submit`
- **Roles**: Supplier roles
- **Purpose**: Upload official documentation (GSTIN, Udyam, PAN, Electricity bill, Factory photos) to earn higher verification badges.
- **Layout**: Document upload checklist with drag-and-drop file zones.
- **Nav/Sidebar**: Supplier Sidebar.
- **Cards/Sections**: Verification Level Guide (Level 1 Phone $\to$ Level 4 Premise Audited), Document Upload cards (GSTIN Certificate, Udyam MSME, Business PAN, Factory Electricity Bill, Geo-tagged Plant Photos).
- **Buttons**: `Upload Document`, `Submit for Admin Audit`, `Save Draft`.
- **Button Actions**: Uploads files to private InsForge storage and submits audit request.
- **Form Fields**: Document type select, File dropzone, Document reference number.
- **Validation**: File types: PDF, JPG, PNG; Max file size: $10\text{MB}$; Required document count $\ge 2$.
- **API Endpoints**: `POST /api/supplier/verification/upload`, `POST /api/supplier/verification/submit`.
- **Database Tables**: `public.supplier_verifications`, `public.verification_documents`.
- **Loading State**: File upload percentage progress bars.
- **Empty State**: Clean upload cards.
- **Error State**: File format/size validation error toast.
- **Success State**: "Verification submitted. Auditing turnaround averages 24 to 48 hours."
- **Responsive Layout**: Upload dropzones adapt to mobile touch targets.
- **Navigation After Actions**: Navigates to `/supplier/verification/status`.
- **Permissions**: Supplier business owner.

### 44. Verification Status Tracker
- **Route**: `/supplier/verification/status`
- **Roles**: Supplier roles
- **Purpose**: View current verification badge level, audit log notes, and respond to administrator document requests.
- **Layout**: Status stepper card with administrator feedback panel.
- **Nav/Sidebar**: Supplier Sidebar.
- **Cards/Sections**: Current Badge Tier (e.g. Level 3: Business Documents Reviewed), Verification History Timeline, Admin Remarks card (if additional documents requested), Document Review status table.
- **Buttons**: `Upload Additional Documents`, `Re-apply for Level 4 Premise Audit`.
- **Button Actions**: Opens document re-upload modal.
- **Form Fields**: Additional document file input.
- **Validation**: Valid file type.
- **API Endpoints**: `GET /api/supplier/verification/status`.
- **Database Tables**: `public.supplier_verifications`, `public.verification_documents`.
- **Loading State**: Shimmer loading effect.
- **Empty State**: "No active verification submission. Submit documents to earn verified trust badges."
- **Error State**: Error alert.
- **Success State**: Live verification badges and audit history.
- **Responsive Layout**: Stepper renders vertically on mobile devices.
- **Navigation After Actions**: In-place status update.
- **Permissions**: Supplier role.

### 45. My Products (Supplier Catalog)
- **Route**: `/supplier/products`
- **Roles**: Supplier roles
- **Purpose**: Manage active wholesale catalog items, inventory status, indicative unit prices, and MOQ tiers.
- **Layout**: Data table with product thumbnail, stock status toggle, and batch actions.
- **Nav/Sidebar**: Supplier Sidebar.
- **Cards/Sections**: Catalog Summary (Total listed, Active, Inactive, Low stock), Product Data Table (Thumbnail, Title, Category, Base Price, MOQ, Stock Status, Actions).
- **Buttons**: `Add New Product`, `Bulk CSV Upload`, `Edit Product`, `Toggle Active`.
- **Button Actions**: Routes to creation form or toggles product visibility.
- **Form Fields**: Search catalog input, Category filter.
- **Validation**: None.
- **API Endpoints**: `GET /api/supplier/products`, `PATCH /api/products/:id/status`.
- **Database Tables**: `public.products`, `public.product_images`.
- **Loading State**: Shimmering table rows.
- **Empty State**: "Your catalog is empty. Click 'Add New Product' to start receiving RFQs."
- **Error State**: Error notification with reload button.
- **Success State**: Loaded product inventory.
- **Responsive Layout**: Converts to mobile card view on small viewports.
- **Navigation After Actions**: `Add New Product` opens `/supplier/products/new`.
- **Permissions**: Supplier business owner.

### 46. Add Product Page
- **Route**: `/supplier/products/new`
- **Roles**: Supplier roles
- **Purpose**: Create a new wholesale product listing with bulk pricing tiers, MOQ, HSN code, and high-res photos.
- **Layout**: 2-column form: left product details and images, right pricing and tax settings.
- **Nav/Sidebar**: Supplier Sidebar.
- **Cards/Sections**: Basic Details (Title, Description, Category), Technical Specifications (Material, Grade, Dimensions), Media Upload (Up to 5 images), Commercial Tiers (Base unit price, MOQ, HSN Code, Applicable GST slab: 5%, 12%, 18%, 28%).
- **Buttons**: `Publish Product`, `Save as Draft`, `Cancel`.
- **Button Actions**: Dispatches product creation payload to backend.
- **Form Fields**: Product Name, Category ID, Description, MOQ, Base Price, Unit, HSN Code, GST Rate, Image Dropzone.
- **Validation**: Name $\ge 3$ chars; MOQ $> 0$; Price $> 0$; GST Rate valid slab; At least 1 image.
- **API Endpoints**: `POST /api/products`.
- **Database Tables**: `public.products`, `public.product_images`.
- **Loading State**: Button spinner during upload and record creation.
- **Empty State**: Clean form.
- **Error State**: Field errors highlighted in coral.
- **Success State**: Toast alert: "Product published successfully."
- **Responsive Layout**: Form fields stack into single column on mobile.
- **Navigation After Actions**: Redirects to `/supplier/products`.
- **Permissions**: Supplier role.

### 47. Edit Product Page
- **Route**: `/supplier/products/:productId/edit`
- **Roles**: Supplier roles
- **Purpose**: Modify an existing product's specifications, indicative prices, MOQ, and photos.
- **Layout**: 2-column editor matching product creation layout.
- **Nav/Sidebar**: Supplier Sidebar.
- **Cards/Sections**: Pre-populated product data cards, Image manager with reorder and delete options.
- **Buttons**: `Save Changes`, `Delete Product`, `Cancel`.
- **Button Actions**: Updates product record or confirms deletion.
- **Form Fields**: Same as Add Product.
- **Validation**: Same as Add Product.
- **API Endpoints**: `GET /api/products/:id`, `PUT /api/products/:id`, `DELETE /api/products/:id`.
- **Database Tables**: `public.products`, `public.product_images`.
- **Loading State**: Skeleton form while loading existing product.
- **Empty State**: 404 view if product ID missing.
- **Error State**: Error notification.
- **Success State**: "Product updated successfully."
- **Responsive Layout**: Stacks on mobile screens.
- **Navigation After Actions**: Redirects to `/supplier/products`.
- **Permissions**: Product owner only.

### 48. Product Listing Management
- **Route**: `/supplier/products/listings`
- **Roles**: Supplier roles
- **Purpose**: Batch inventory updates, stock availability toggles, and bulk price adjustments.
- **Layout**: Editable spreadsheet-style data grid.
- **Nav/Sidebar**: Supplier Sidebar.
- **Cards/Sections**: Batch Actions bar (Update prices by $\pm X\%$, Mark selected Out of Stock), Editable Grid.
- **Buttons**: `Save All Changes`, `Export Catalog Excel`, `Discard Edits`.
- **Button Actions**: Dispatches batch PATCH request.
- **Form Fields**: Editable table cells for Price, MOQ, Stock Status.
- **Validation**: Positive numerical values.
- **API Endpoints**: `PATCH /api/supplier/products/batch`.
- **Database Tables**: `public.products`.
- **Loading State**: Grid spinner.
- **Empty State**: "No products listed."
- **Error State**: Cell-level validation highlights.
- **Success State**: Toast: "24 listings updated successfully."
- **Responsive Layout**: Horizontal scroll with frozen product title column.
- **Navigation After Actions**: Changes persist in-place.
- **Permissions**: Supplier role.

### 49. Supplier Product Categories
- **Route**: `/supplier/categories`
- **Roles**: Supplier roles
- **Purpose**: Manage the industry verticals and subcategories under which the supplier is indexed.
- **Layout**: Checkbox taxonomy selection tree with keyword tags.
- **Nav/Sidebar**: Supplier Sidebar.
- **Cards/Sections**: Primary Category selector, Secondary Verticals checklist, Custom Tag generator (e.g., "180 GSM Combed Cotton", "TMT Fe 550D").
- **Buttons**: `Update Category Indexing`.
- **Button Actions**: Updates supplier profile search indexing tags.
- **Form Fields**: Category checkboxes, Tag input field.
- **Validation**: At least one category selected.
- **API Endpoints**: `PUT /api/supplier/categories`.
- **Database Tables**: `public.supplier_profiles`, `public.categories`.
- **Loading State**: Button spinner.
- **Empty State**: Pre-populated with current settings.
- **Error State**: Error alert.
- **Success State**: "Categories updated. You will now receive RFQs for these segments."
- **Responsive Layout**: Fluid single column on mobile.
- **Navigation After Actions**: Remains on category settings.
- **Permissions**: Supplier role.

### 50. Incoming RFQs (Opportunity Feed)
- **Route**: `/supplier/rfqs`
- **Roles**: Supplier roles
- **Purpose**: Dedicated feed of incoming buyer RFQs matched to supplier's category and delivery region.
- **Layout**: Filterable card stream with countdown timers for RFQ deadlines.
- **Nav/Sidebar**: Supplier Sidebar.
- **Cards/Sections**: Filter pills (`All, Matching Category, Direct RFQs, Urgent < 24h`), RFQ Opportunity Cards (RFQ #, Buyer Business Type, Target Item, Quantity, Destination City, Submission Deadline, Quoting SLA).
- **Buttons**: `Prepare Quotation`, `Decline Opportunity`, `Ask Buyer a Question`.
- **Button Actions**: Opens quotation creation form or declines recipient record.
- **Form Fields**: Search opportunity keywords.
- **Validation**: None.
- **API Endpoints**: `GET /api/supplier/incoming-rfqs`.
- **Database Tables**: `public.rfq_recipients`, `public.rfqs`, `public.rfq_items`.
- **Loading State**: Shimmer cards with pulsing countdown placeholders.
- **Empty State**: "No pending RFQs right now. You will be notified via WhatsApp/Email when a new match arrives."
- **Error State**: Feed error alert with reload button.
- **Success State**: Dynamic RFQ stream populated.
- **Responsive Layout**: Cards stack vertically with large touch actions on mobile.
- **Navigation After Actions**: `Prepare Quotation` routes to `/supplier/rfqs/:id/quote`.
- **Permissions**: Supplier role.

### 51. RFQ Details (Supplier View)
- **Route**: `/supplier/rfqs/:rfqId`
- **Roles**: Supplier roles
- **Purpose**: Inspect full buyer technical requirements, delivery address, and sample requests before quoting.
- **Layout**: 2-column view: left specifications, right buyer credibility and action box.
- **Nav/Sidebar**: Supplier Sidebar.
- **Cards/Sections**: Technical Requirements card (Dimensions, material, tolerance), Delivery & Logistics card (Destination Pincode, Unloading dock, Target delivery date), Buyer Verified Credentials card, Quoting Deadline countdown.
- **Buttons**: `Submit Formal Quotation`, `Decline RFQ`, `Ask Clarification`.
- **Button Actions**: Navigates to quotation form or opens inquiry.
- **Form Fields**: Decline reason dropdown (Optional: Capacity full, Outside delivery area, Minimum order too high).
- **Validation**: None.
- **API Endpoints**: `GET /api/supplier/rfqs/:id`.
- **Database Tables**: `public.rfqs`, `public.rfq_items`, `public.rfq_recipients`.
- **Loading State**: Multi-card skeleton.
- **Empty State**: 404 view if RFQ expired or removed.
- **Error State**: System alert.
- **Success State**: Full RFQ dossier loaded.
- **Responsive Layout**: Stacks vertically on mobile.
- **Navigation After Actions**: `Submit Formal Quotation` routes to `/supplier/rfqs/:id/quote`.
- **Permissions**: Supplier who received the RFQ.

### 52. Submit Quotation Page
- **Route**: `/supplier/rfqs/:rfqId/quote`
- **Roles**: Supplier roles
- **Purpose**: Formal quotation builder allowing suppliers to input unit price, freight, GST, lead time, and commercial terms.
- **Layout**: 2-column layout: left RFQ requirement reference, right interactive quotation builder with live preview.
- **Nav/Sidebar**: Supplier Sidebar.
- **Cards/Sections**: Item Pricing (Base unit price, Offered MOQ), Logistics & Freight (Freight type: Included / Excluded, Lane freight charge, Insurance), Tax Information (GST rate: 5%, 12%, 18%, 28%, Tax inclusive toggle), Commercial Terms (Payment terms: 100% advance, 30-70, Net 30; Production lead time in days; Quote validity expiry date).
- **Buttons**: `Preview Quotation`, `Submit Formal Quote`, `Save Draft`.
- **Button Actions**: Computes estimated landed cost and submits quotation to buyer.
- **Form Fields**: Unit Price, MOQ, Freight Amount, GST Rate, Extra Charges, Advance %, Lead Time Days, Validity Date, Special Notes.
- **Validation**: Unit Price $> 0$; Freight $\ge 0$; MOQ $> 0$; Validity $\ge$ today; Lead time $> 0$.
- **API Endpoints**: `POST /api/quotations`.
- **Database Tables**: `public.quotations`, `public.quotation_items`, `public.quotation_costs`.
- **Loading State**: Button spinner during submission.
- **Empty State**: Pre-populated with default category freight estimates.
- **Error State**: Field errors highlighted in coral.
- **Success State**: "Quotation #Q-4102 Submitted. Buyer notified."
- **Responsive Layout**: Form stacks on mobile; live cost preview floats at bottom.
- **Navigation After Actions**: Redirects to `/supplier/quotations`.
- **Permissions**: Supplier who received the RFQ.

### 53. Submitted Quotations (Supplier View)
- **Route**: `/supplier/quotations`
- **Roles**: Supplier roles
- **Purpose**: Master table of all sent quotations, tracking buyer review status, acceptances, and expirations.
- **Layout**: Data table with status filter tabs (`All, Under Review, Accepted, Declined, Expired`).
- **Nav/Sidebar**: Supplier Sidebar.
- **Cards/Sections**: Quotations Table (Quote ID, RFQ Reference, Buyer Business Name, Quoted Unit Price, Total Landed Value, Validity Expiry, Status Badge, Actions).
- **Buttons**: `View Quotation Details`, `Withdraw Quote`, `Follow-up with Buyer`.
- **Button Actions**: Directs to quotation view or sends prompt message.
- **Form Fields**: Search input.
- **Validation**: None.
- **API Endpoints**: `GET /api/supplier/quotations`.
- **Database Tables**: `public.quotations`, `public.rfqs`, `public.businesses`.
- **Loading State**: Shimmering table rows.
- **Empty State**: "You have not submitted any quotations yet."
- **Error State**: Table reload button.
- **Success State**: Populated quotation list with active status pills.
- **Responsive Layout**: Converts to mobile card view on small screens.
- **Navigation After Actions**: Row click opens `/supplier/quotations/:id`.
- **Permissions**: Supplier role.

### 54. Quotation Details (Supplier View)
- **Route**: `/supplier/quotations/:quoteId`
- **Roles**: Supplier roles
- **Purpose**: Detailed audit of a sent quotation including buyer engagement status (Viewed, Compared, Accepted).
- **Layout**: 2-column review layout: left cost breakdown, right buyer activity telemetry.
- **Nav/Sidebar**: Supplier Sidebar.
- **Cards/Sections**: Quotation Dossier card (Itemized unit price, freight, GST, and terms), Buyer Telemetry card (Quote viewed timestamp, Buyer compared flag, Current RFQ status), In-line chat shortcut.
- **Buttons**: `Revise Quote (if under review)`, `Withdraw Quote`, `Message Buyer`.
- **Button Actions**: Opens revision modal or prompts withdrawal confirmation.
- **Form Fields**: None.
- **Validation**: Confirm dialog for withdrawal.
- **API Endpoints**: `GET /api/quotations/:id`, `POST /api/quotations/:id/withdraw`.
- **Database Tables**: `public.quotations`, `public.quotation_costs`.
- **Loading State**: Shimmer card loading.
- **Empty State**: 404 view if quote ID invalid.
- **Error State**: Error alert.
- **Success State**: Complete quotation breakdown loaded.
- **Responsive Layout**: Stacks on mobile viewports.
- **Navigation After Actions**: Withdrawal transitions status to `withdrawn`.
- **Permissions**: Quote owner only.

### 55. Buyer Follow-ups & Inquiries
- **Route**: `/supplier/inquiries`
- **Roles**: Supplier roles
- **Purpose**: Unified messaging hub for all active buyer questions regarding RFQs and active orders.
- **Layout**: Master-detail inbox layout: left conversation list, right active chat stream.
- **Nav/Sidebar**: Supplier Sidebar.
- **Cards/Sections**: Conversation List (Buyer Name, RFQ #, Last message preview, Timestamp, Unread badge), Active Chat thread with RFQ metadata chip, Quick Response templates (e.g., "Ready in 48h", "Sample available", "Freight locked").
- **Buttons**: `Send Reply`, `Attach Parchi / Spec`, `Insert Quote Shortcut`.
- **Button Actions**: Dispatches message and notifies buyer.
- **Form Fields**: Message text input, file attachment.
- **Validation**: Message non-empty.
- **API Endpoints**: `GET /api/supplier/inquiries`, `POST /api/inquiries/message`.
- **Database Tables**: `public.inquiries`, `public.inquiry_messages`.
- **Loading State**: Chat bubble placeholders.
- **Empty State**: "No active buyer inquiries."
- **Error State**: Error toast.
- **Success State**: Live message dispatch.
- **Responsive Layout**: Master list and chat toggle view on mobile.
- **Navigation After Actions**: Remains in chat thread.
- **Permissions**: Supplier role.

### 56. Order Management (Supplier View)
- **Route**: `/supplier/orders`
- **Roles**: Supplier roles
- **Purpose**: Production and fulfillment pipeline for all orders accepted by buyers.
- **Layout**: Kanban board or Data table toggle (Columns: Confirmed, In Production, Quality Check, Ready to Dispatch, Dispatched, Delivered).
- **Nav/Sidebar**: Supplier Sidebar.
- **Cards/Sections**: Pipeline View Toggle, Order Cards / Table Rows (Order #, Buyer Name, Product, Quantity, Total Amount, Due Date, Status Chip, Update Status CTA).
- **Buttons**: `Update Status`, `View PO Details`, `Generate Shipping Label`.
- **Button Actions**: Opens status update modal or routes to details.
- **Form Fields**: Search orders input, Status filter.
- **Validation**: None.
- **API Endpoints**: `GET /api/supplier/orders`.
- **Database Tables**: `public.orders`, `public.order_items`, `public.order_status_history`.
- **Loading State**: Kanban column shimmer.
- **Empty State**: "No active orders. Submit competitive quotations to win orders."
- **Error State**: Error banner with reload button.
- **Success State**: Populated order pipeline.
- **Responsive Layout**: Table view converts to card stack on mobile.
- **Navigation After Actions**: Card click opens `/supplier/orders/:id`.
- **Permissions**: Supplier role.

### 57. Order Details (Supplier View)
- **Route**: `/supplier/orders/:orderId`
- **Roles**: Supplier roles
- **Purpose**: Deep view into a specific purchase order including buyer delivery destination, payment terms, and milestone logs.
- **Layout**: 2-column layout: left order specifications and packaging list, right milestone management panel.
- **Nav/Sidebar**: Supplier Sidebar.
- **Cards/Sections**: Purchase Order Header (PO #, Acceptance Date, Landed Total), Line Item Breakdown, Shipping Destination (Buyer warehouse address, Pincode, Unloading contact), Milestone Audit Log.
- **Buttons**: `Advance Order Status`, `Print Packaging Slip`, `Upload E-Way Bill`.
- **Button Actions**: Advances order fulfillment stage.
- **Form Fields**: E-way bill number, Carrier name, Vehicle number (when dispatching).
- **Validation**: Vehicle number and E-way bill required when moving to `dispatched`.
- **API Endpoints**: `GET /api/orders/:id`, `PATCH /api/orders/:id/status`.
- **Database Tables**: `public.orders`, `public.order_items`, `public.order_status_history`.
- **Loading State**: Shimmer skeleton.
- **Empty State**: 404 view if order not found.
- **Error State**: Alert notification.
- **Success State**: Loaded order details.
- **Responsive Layout**: Stacks on mobile devices.
- **Navigation After Actions**: Status change updates view in-place.
- **Permissions**: Order supplier only.

### 58. Update Order Status Modal / Screen
- **Route**: `/supplier/orders/:orderId/update-status`
- **Roles**: Supplier roles
- **Purpose**: Controlled transition of order lifecycle state with mandatory audit proof and logistics telemetry.
- **Layout**: Centered modal or dedicated mobile transition screen.
- **Nav/Sidebar**: Supplier Sidebar.
- **Cards/Sections**: Current Status indicator, Next Status selection, Logistics Metadata form (Carrier, Tracking URL, Driver Mobile, Estimated Delivery Date).
- **Buttons**: `Confirm Status Update`, `Cancel`.
- **Button Actions**: Executes atomic status transition in PostgreSQL.
- **Form Fields**: Status dropdown (Processing, Ready for Dispatch, Dispatched, Delivered), Logistics Provider, Tracking ID, Vehicle Number, Notes.
- **Validation**: Valid forward status transition according to state machine rules.
- **API Endpoints**: `POST /api/orders/:id/status-transition`.
- **Database Tables**: `public.orders`, `public.order_status_history`.
- **Loading State**: Button spinner.
- **Empty State**: N/A.
- **Error State**: Error alert detailing invalid transition.
- **Success State**: Status updated; buyer notified via WhatsApp/In-app.
- **Responsive Layout**: Centered modal adapts to full screen on mobile.
- **Navigation After Actions**: Closes modal and refreshes order view.
- **Permissions**: Order supplier only.

### 59. Business Statistics & Analytics
- **Route**: `/supplier/statistics`
- **Roles**: Supplier roles
- **Purpose**: Quantitative analytics tracking quoting win rates, landed cost competitiveness, and fulfillment metrics.
- **Layout**: Grid of chart cards and analytics tables.
- **Nav/Sidebar**: Supplier Sidebar.
- **Cards/Sections**:
  - `Quoting Win Rate Card`: % of submitted quotes accepted by buyers.
  - `Landed Cost Competitiveness Graph`: How supplier's freight + unit price compares against regional averages.
  - `Fulfillment Velocity Card`: Average days from order confirmation to dispatch.
  - `Revenue & Sourced Value Chart`: Monthly gross volume.
- **Buttons**: `Export Analytics CSV`, `Change Date Range`.
- **Button Actions**: Updates chart date filter (30d, 90d, 1y).
- **Form Fields**: Date range dropdown.
- **Validation**: None.
- **API Endpoints**: `GET /api/supplier/analytics`.
- **Database Tables**: `public.quotations`, `public.orders`, `public.rfq_recipients`.
- **Loading State**: Chart shimmer cards.
- **Empty State**: "Analytics will populate after your first 3 quotation submissions."
- **Error State**: Chart error notification.
- **Success State**: Interactive SVG charts populated with live database metrics.
- **Responsive Layout**: Grid collapses into single column on mobile.
- **Navigation After Actions**: In-place chart redraw.
- **Permissions**: Supplier role.

### 60. Supplier Account Settings
- **Route**: `/supplier/settings`
- **Roles**: Supplier roles
- **Purpose**: Manage business bank account details, team member access, notification webhooks, and security.
- **Layout**: Tabbed settings layout.
- **Nav/Sidebar**: Supplier Sidebar.
- **Cards/Sections**: Bank Account Details (for payment settlement), Team Access (Add staff member with quote-only access), WhatsApp Notification Numbers, Security & Password.
- **Buttons**: `Save Settings`, `Invite Team Member`, `Deactivate Account`.
- **Button Actions**: Dispatches settings update.
- **Form Fields**: Bank Name, Account Number, IFSC Code, Beneficiary Name, Team Email, Team Role.
- **Validation**: IFSC code regex `^[A-Z]{4}0[A-Z0-9]{6}$`; Account number valid.
- **API Endpoints**: `PUT /api/supplier/settings`, `POST /api/businesses/invite`.
- **Database Tables**: `public.businesses`, `public.business_members`, `public.users`.
- **Loading State**: Button spinner.
- **Empty State**: Pre-populated with current business settings.
- **Error State**: Field errors highlighted.
- **Success State**: Toast alert: "Settings saved successfully."
- **Responsive Layout**: Mobile accordion view.
- **Navigation After Actions**: Remains on settings page.
- **Permissions**: Supplier business owner.

---

# Group E: Admin Application (Screens 61 – 75)

### 61. Admin Dashboard
- **Route**: `/admin/dashboard`
- **Roles**: Admin, Verification Admin, Support Admin
- **Purpose**: Platform-wide monitoring hub tracking real-time user registrations, active RFQs, verification queue, and platform volume.
- **Layout**: Admin Sidebar layout with live KPI ribbon, system alert feed, and quick-action shortcuts.
- **Nav/Sidebar**: Admin Sidebar (`Dashboard, Users, Buyers, Suppliers, Verification, Catalog, RFQs, Quotes, Orders, Reports, Support, Analytics, Logs, Settings`).
- **Cards/Sections**:
  - `Platform KPIs`: Total Active Businesses, Daily RFQ Volume, Pending Verification Dossiers, Monthly Gross Platform Volume.
  - `Urgent Audit Queue`: Businesses awaiting Level 3/4 verification.
  - `Dispute & Report Alerts`: Active buyer-supplier complaints.
  - `System Health Card`: InsForge PostgreSQL connection, Storage quota, API latency.
- **Buttons**: `Review Verification Queue`, `Inspect Flagged Orders`, `Broadcast Platform Notice`.
- **Button Actions**: Directs to respective admin console views.
- **Form Fields**: None.
- **Validation**: None.
- **API Endpoints**: `GET /api/admin/dashboard-summary`.
- **Database Tables**: `public.users`, `public.businesses`, `public.rfqs`, `public.orders`, `public.supplier_verifications`.
- **Loading State**: Skeleton metric widgets.
- **Empty State**: N/A.
- **Error State**: Red banner with immediate diagnostic code.
- **Success State**: Real-time aggregated platform metrics.
- **Responsive Layout**: Sidebar collapses on tablet/mobile with hamburger trigger.
- **Navigation After Actions**: Direct link to `/admin/verifications`.
- **Permissions**: Admin roles only.

### 62. User Management
- **Route**: `/admin/users`
- **Roles**: Admin
- **Purpose**: Platform-wide user directory with role assignment, status management, and session revocation.
- **Layout**: Data table with advanced filtering and batch actions.
- **Nav/Sidebar**: Admin Sidebar.
- **Cards/Sections**: User Search & Filter bar, Users Table (User ID, Name, Email, Phone, Primary Role, Assigned Business, Created Date, Status Badge: Active/Suspended, Actions).
- **Buttons**: `Suspend User`, `Reactivate User`, `Assign Role`, `Export User CSV`.
- **Button Actions**: Opens role modal or triggers suspension confirmation.
- **Form Fields**: User search, Role filter dropdown, Status dropdown.
- **Validation**: Suspension requires non-empty audit reason.
- **API Endpoints**: `GET /api/admin/users`, `PATCH /api/admin/users/:id/status`.
- **Database Tables**: `public.users`, `public.user_roles`, `public.admin_audit_logs`.
- **Loading State**: Shimmering table rows.
- **Empty State**: "No users found matching query."
- **Error State**: Error alert with reload button.
- **Success State**: Populated user directory.
- **Responsive Layout**: Mobile card list view.
- **Navigation After Actions**: Row update updates status chip in-place.
- **Permissions**: Superadmin only.

### 63. Buyer Management
- **Route**: `/admin/buyers`
- **Roles**: Admin
- **Purpose**: Moderate buyer business profiles, sourcing volume, and creditworthiness.
- **Layout**: Data table with buyer performance metrics.
- **Nav/Sidebar**: Admin Sidebar.
- **Cards/Sections**: Buyer Summary (Total buyers, Active RFQ creators, High-volume accounts), Buyers Table (Business Name, Trade Name, GSTIN, Total RFQs, Total Orders Placed, Account Manager, Actions).
- **Buttons**: `View Buyer Sourcing History`, `Assign Account Manager`, `Flag Account`.
- **Button Actions**: Navigates to buyer audit history.
- **Form Fields**: Search buyer business name, City filter.
- **Validation**: None.
- **API Endpoints**: `GET /api/admin/buyers`.
- **Database Tables**: `public.businesses`, `public.buyer_profiles`, `public.rfqs`.
- **Loading State**: Shimmer table rows.
- **Empty State**: "No buyers found."
- **Error State**: System error notification.
- **Success State**: Loaded buyer list.
- **Responsive Layout**: Table converts to cards on mobile.
- **Navigation After Actions**: Row click opens buyer detail modal.
- **Permissions**: Admin role.

### 64. Supplier Management
- **Route**: `/admin/suppliers`
- **Roles**: Admin, Verification Admin
- **Purpose**: Oversee supplier network, business types (Manufacturer/Wholesaler/Distributor), and verification levels.
- **Layout**: Data table with verification level indicators and catalog counts.
- **Nav/Sidebar**: Admin Sidebar.
- **Cards/Sections**: Supplier Network Summary, Suppliers Table (Company Name, Entity Type, City, Industrial Segment, Active Catalog Count, Current Verification Level, Actions).
- **Buttons**: `Inspect Full Dossier`, `Adjust Verification Level`, `Suspend Supplier`.
- **Button Actions**: Directs to verification review or opens level adjustment modal.
- **Form Fields**: Business type filter, Verification level filter, Location filter.
- **Validation**: Level adjustment requires admin reason.
- **API Endpoints**: `GET /api/admin/suppliers`.
- **Database Tables**: `public.businesses`, `public.supplier_profiles`, `public.supplier_verifications`.
- **Loading State**: Skeleton table rows.
- **Empty State**: "No suppliers matching criteria."
- **Error State**: Reload button.
- **Success State**: Populated supplier directory.
- **Responsive Layout**: Mobile card view.
- **Navigation After Actions**: Opens verification review for selected supplier.
- **Permissions**: Admin, Verification Admin.

### 65. Business Verification Management (Audit Queue)
- **Route**: `/admin/verifications`
- **Roles**: Admin, Verification Admin
- **Purpose**: Ground-truth verification hub to inspect uploaded legal documents, cross-reference GST filings, and assign trust badges.
- **Layout**: 2-column audit console: left pending submission queue, right deep document inspection pane.
- **Nav/Sidebar**: Admin Sidebar.
- **Cards/Sections**: Verification Queue list (Supplier Name, Business Type, Submission Date, Documents Uploaded), Document Inspector (Embedded PDF/Image viewer with zoom and rotation), GSTIN Cross-reference Checklist (Active status, Filing regularity, Match legal name), Audit Decision Box.
- **Buttons**: `Approve Level 3 (Documents Reviewed)`, `Approve Level 4 (Premise Audited)`, `Reject with Reason`, `Request Additional Info`.
- **Button Actions**: Updates verification record, assigns badge, logs audit entry, and notifies supplier.
- **Form Fields**: Audit Decision notes, Rejection reason select, Missing document checkboxes.
- **Validation**: Rejection or Request Info requires detailed note $\ge 15$ characters.
- **API Endpoints**: `GET /api/admin/verifications`, `POST /api/admin/verifications/:id/decision`.
- **Database Tables**: `public.supplier_verifications`, `public.verification_documents`, `public.admin_audit_logs`.
- **Loading State**: Document viewer shimmer.
- **Empty State**: "Verification queue is empty. All submitted dossiers have been audited."
- **Error State**: Error notification.
- **Success State**: Audit decision logged; queue advances to next supplier.
- **Responsive Layout**: On mobile, queue and document inspector switch via tabs.
- **Navigation After Actions**: Auto-loads next pending verification in queue.
- **Permissions**: Verification Admin, Superadmin.

### 66. Product Management
- **Route**: `/admin/products`
- **Roles**: Admin
- **Purpose**: Content moderation of product listings, category adherence, and policy compliance.
- **Layout**: Data table with thumbnail preview, supplier badge, and moderation flags.
- **Nav/Sidebar**: Admin Sidebar.
- **Cards/Sections**: Product Moderation Queue (Reported listings, New products), Products Table (Thumbnail, Title, Supplier, Category, MOQ, Listed Price, Status, Moderation Action).
- **Buttons**: `Approve Listing`, `Delist / Remove Product`, `Edit Category`.
- **Button Actions**: Updates product active/delisted status.
- **Form Fields**: Delist reason dropdown (Counterfeit, Inappropriate content, Deceptive pricing).
- **Validation**: Delist reason required.
- **API Endpoints**: `GET /api/admin/products`, `PATCH /api/admin/products/:id/moderate`.
- **Database Tables**: `public.products`, `public.admin_audit_logs`.
- **Loading State**: Shimmering table rows.
- **Empty State**: "No products requiring moderation."
- **Error State**: System alert message.
- **Success State**: Product status updated.
- **Responsive Layout**: Table converts to card stack on mobile.
- **Navigation After Actions**: In-place status update.
- **Permissions**: Admin role.

### 67. Category Management
- **Route**: `/admin/categories`
- **Roles**: Admin
- **Purpose**: Create, update, reorder, and structure product taxonomy and benchmark units.
- **Layout**: Hierarchical category tree view on left, category editor form on right.
- **Nav/Sidebar**: Admin Sidebar.
- **Cards/Sections**: Category Hierarchy Tree, Add/Edit Category Form (Title, Slug, Icon, Benchmark Unit: pc/kg/ton/meter, Default Order Quantity, Active Status).
- **Buttons**: `Add Primary Category`, `Add Subcategory`, `Save Category`, `Delete Category`.
- **Button Actions**: Creates or alters category entity in PostgreSQL.
- **Form Fields**: Category Name, Slug, Description, Unit, Default Qty, Icon Identifier.
- **Validation**: Title required; Slug unique and alphanumeric.
- **API Endpoints**: `GET /api/categories`, `POST /api/categories`, `PUT /api/categories/:id`, `DELETE /api/categories/:id`.
- **Database Tables**: `public.categories`, `public.subcategories`.
- **Loading State**: Category tree skeleton.
- **Empty State**: "No categories defined. Click 'Add Primary Category' to initialize taxonomy."
- **Error State**: Error alert with retry button.
- **Success State**: Tree re-renders with new node highlighted.
- **Responsive Layout**: Stacks vertically on mobile.
- **Navigation After Actions**: Tree updates in-place.
- **Permissions**: Admin role.

### 68. RFQ Management (Platform Oversight)
- **Route**: `/admin/rfqs`
- **Roles**: Admin
- **Purpose**: Global monitoring of all buyer RFQs, match rates, and quotation turnaround SLAs.
- **Layout**: Data table with live status chips and matching metrics.
- **Nav/Sidebar**: Admin Sidebar.
- **Cards/Sections**: RFQ Volume KPIs (Total Dispatched, Response Rate %, Median Time to First Quote), RFQs Table (RFQ ID, Buyer Business, Category, Qty, Target City, Recipient Count, Quotes Ingested, Status).
- **Buttons**: `Inspect RFQ Details`, `Manual Match Supplier`, `Cancel Stale RFQ`.
- **Button Actions**: Opens manual matching drawer or detail view.
- **Form Fields**: Search RFQs, Category filter, Date range.
- **Validation**: None.
- **API Endpoints**: `GET /api/admin/rfqs`.
- **Database Tables**: `public.rfqs`, `public.rfq_items`, `public.rfq_recipients`.
- **Loading State**: Table shimmer.
- **Empty State**: "No RFQs logged."
- **Error State**: Reload button.
- **Success State**: Populated RFQ ledger.
- **Responsive Layout**: Mobile card stream.
- **Navigation After Actions**: Row click opens RFQ audit modal.
- **Permissions**: Admin role.

### 69. Quotation Monitoring
- **Route**: `/admin/quotations`
- **Roles**: Admin
- **Purpose**: Oversee quotation integrity, verify freight calculations, and detect anomalous price gouging or dumping.
- **Layout**: Data table with landed cost breakdown columns.
- **Nav/Sidebar**: Admin Sidebar.
- **Cards/Sections**: Quotations Ledger (Quote ID, RFQ #, Supplier, Unit Price, Freight, GST Rate, Estimated Landed Cost, Landed vs Sticker Variance %, Status).
- **Buttons**: `Inspect Mathematical Breakdown`, `Flag Anomalous Quote`.
- **Button Actions**: Opens detailed calculation audit modal.
- **Form Fields**: Search quotes, Filter by high variance ($> 25\%$).
- **Validation**: None.
- **API Endpoints**: `GET /api/admin/quotations`.
- **Database Tables**: `public.quotations`, `public.quotation_costs`.
- **Loading State**: Shimmer table rows.
- **Empty State**: "No quotations submitted."
- **Error State**: Error alert.
- **Success State**: Loaded quotation audit table.
- **Responsive Layout**: Mobile card view.
- **Navigation After Actions**: In-place modal display.
- **Permissions**: Admin role.

### 70. Order Monitoring
- **Route**: `/admin/orders`
- **Roles**: Admin, Support Admin
- **Purpose**: Platform-wide transaction ledger tracking order progress, delayed dispatches, and fulfillment compliance.
- **Layout**: Data table with milestone filter tabs.
- **Nav/Sidebar**: Admin Sidebar.
- **Cards/Sections**: Order Milestone Summary (Confirmed, Processing, In-Transit, Delivered, Delayed Dispatches), Orders Table (PO #, Date, Buyer, Supplier, Landed Total, Carrier, Current Milestone, SLA Status).
- **Buttons**: `View Order Audit Log`, `Intervene in Order`, `Contact Parties`.
- **Button Actions**: Opens administrative intervention console.
- **Form Fields**: Search PO #, Status filter.
- **Validation**: None.
- **API Endpoints**: `GET /api/admin/orders`.
- **Database Tables**: `public.orders`, `public.order_status_history`.
- **Loading State**: Table shimmer.
- **Empty State**: "No orders recorded."
- **Error State**: Reload button.
- **Success State**: Live order monitoring ledger.
- **Responsive Layout**: Mobile card list view.
- **Navigation After Actions**: Opens order detail view.
- **Permissions**: Admin, Support Admin.

### 71. Reports & Complaints
- **Route**: `/admin/reports`
- **Roles**: Admin, Support Admin
- **Purpose**: Triage and resolve user reports regarding fake listings, off-platform solicitations, or unfulfilled orders.
- **Layout**: 2-column triage layout: left complaints queue, right evidence and resolution panel.
- **Nav/Sidebar**: Admin Sidebar.
- **Cards/Sections**: Reports Queue (Reporter, Accused Party, Issue Category, Severity, Date), Evidence Panel (Submitted screenshots, Chat logs, PO reference), Resolution Box.
- **Buttons**: `Take Action (Warn/Suspend)`, `Dismiss Report`, `Escalate to Superadmin`.
- **Button Actions**: Dispatches resolution status and notifies involved parties.
- **Form Fields**: Administrative resolution notes, Action select (No action, Warning issued, Account suspended, Listing deleted).
- **Validation**: Resolution note required ($\ge 20$ chars).
- **API Endpoints**: `GET /api/admin/reports`, `POST /api/admin/reports/:id/resolve`.
- **Database Tables**: `public.reports`, `public.admin_audit_logs`.
- **Loading State**: Shimmer loading.
- **Empty State**: "No unresolved reports or complaints."
- **Error State**: System alert.
- **Success State**: Report marked resolved; removed from active triage.
- **Responsive Layout**: Queue and evidence switch via tabs on mobile.
- **Navigation After Actions**: Advances to next report in queue.
- **Permissions**: Admin, Support Admin.

### 72. Support Management
- **Route**: `/admin/support`
- **Roles**: Admin, Support Admin
- **Purpose**: Ticketing console for platform inquiries, concierge pilot requests, and customer assistance.
- **Layout**: Kanban or Table ticketing view (`New, In-Progress, Awaiting Customer, Closed`).
- **Nav/Sidebar**: Admin Sidebar.
- **Cards/Sections**: Ticket List (Ticket #, Requester, Subject, Category, SLA Countdown, Priority), Active Ticket Conversation thread, Internal Staff Notes panel.
- **Buttons**: `Reply to Ticket`, `Assign to Staff`, `Close Ticket`.
- **Button Actions**: Sends official email/in-app response and updates ticket status.
- **Form Fields**: Reply message, Internal note, Status dropdown, Priority selector.
- **Validation**: Reply non-empty.
- **API Endpoints**: `GET /api/admin/support/tickets`, `POST /api/admin/support/tickets/:id/reply`.
- **Database Tables**: `public.support_tickets`, `public.support_messages`.
- **Loading State**: Shimmer ticket thread.
- **Empty State**: "Support queue is clear."
- **Error State**: Error notification.
- **Success State**: Reply dispatched; ticket status updated.
- **Responsive Layout**: Mobile list and detail view toggle.
- **Navigation After Actions**: Stays in ticket conversation.
- **Permissions**: Support Admin, Superadmin.

### 73. Marketplace Analytics
- **Route**: `/admin/analytics`
- **Roles**: Admin
- **Purpose**: Platform health analytics calculated directly from live database tables (no hardcoded mock statistics).
- **Layout**: Grid of metric cards, trend charts, and industrial corridor breakdown tables.
- **Nav/Sidebar**: Admin Sidebar.
- **Cards/Sections**:
  - `Ecosystem Metrics`: Registered Businesses (Buyers vs Suppliers), Monthly Gross Sourced Value, Sourcing Conversion Rate.
  - `Landed Cost Alpha`: Average % savings realized by buyers comparing quotes vs. sticker price.
  - `Regional Sourcing Map`: Volume breakdown across Raipur, Bhilai, Ludhiana, Surat, Tiruppur.
  - `Supplier Responsiveness`: Distribution of quote submission turnaround times.
- **Buttons**: `Export Analytics Report`, `Select Date Range (7d/30d/90d/YTD)`.
- **Button Actions**: Triggers backend analytical aggregation query.
- **Form Fields**: Date range picker.
- **Validation**: Start date $\le$ End date.
- **API Endpoints**: `GET /api/admin/analytics`.
- **Database Tables**: `public.users`, `public.businesses`, `public.rfqs`, `public.quotations`, `public.orders`.
- **Loading State**: Chart shimmer cards.
- **Empty State**: "Insufficient data for selected timeframe."
- **Error State**: Chart error toast.
- **Success State**: Interactive charts rendered with live telemetry.
- **Responsive Layout**: Grid collapses into single column on mobile.
- **Navigation After Actions**: In-place chart reload.
- **Permissions**: Superadmin only.

### 74. Admin Audit Logs
- **Route**: `/admin/audit-logs`
- **Roles**: Admin
- **Purpose**: Immutable security audit trail recording all administrative actions, verification approvals, user suspensions, and policy changes.
- **Layout**: Filterable chronological log table.
- **Nav/Sidebar**: Admin Sidebar.
- **Cards/Sections**: Filter bar (By Admin User, By Action Type, By Date), Audit Logs Table (Log ID, Timestamp, Admin Name, Action Type, Target Entity, IP Address, Metadata JSON, Diff View).
- **Buttons**: `Inspect Payload JSON`, `Export Audit Log`.
- **Button Actions**: Opens raw JSON diff modal.
- **Form Fields**: Action type filter, Admin user select.
- **Validation**: None.
- **API Endpoints**: `GET /api/admin/audit-logs`.
- **Database Tables**: `public.admin_audit_logs`.
- **Loading State**: Shimmering log rows.
- **Empty State**: "No audit logs recorded for this timeframe."
- **Error State**: Error notification.
- **Success State**: Loaded chronological audit log.
- **Responsive Layout**: Horizontal scroll on small viewports.
- **Navigation After Actions**: Modal popup on row click.
- **Permissions**: Superadmin only.

### 75. Platform Settings
- **Route**: `/admin/settings`
- **Roles**: Admin
- **Purpose**: Configure global marketplace operational parameters, concierge SLA targets, default GST slabs, and security policies.
- **Layout**: 2-column configuration settings layout with save controls.
- **Nav/Sidebar**: Admin Sidebar.
- **Cards/Sections**: General Marketplace Parameters (Platform name, Support hotline, Concierge response SLA hours), Quotation Rules (Max RFQ lifetime days, Default quote validity days, Min supplier quoting buffer), Security & Session (Session timeout minutes, Failed login attempt lockout), Maintenance Mode toggle.
- **Buttons**: `Save Platform Settings`, `Flush System Cache`, `Trigger Database Backup`.
- **Button Actions**: Writes configuration to database and logs audit record.
- **Form Fields**: SLA hours input, RFQ lifetime days input, Support email, Maintenance mode toggle.
- **Validation**: Numerical parameters $> 0$; Email valid.
- **API Endpoints**: `GET /api/admin/settings`, `PUT /api/admin/settings`.
- **Database Tables**: `public.platform_settings`, `public.admin_audit_logs`.
- **Loading State**: Button spinner during save.
- **Empty State**: Pre-populated with active configuration.
- **Error State**: Validation error alert.
- **Success State**: Toast alert: "Platform settings updated and broadcast."
- **Responsive Layout**: Stacks vertically on mobile screens.
- **Navigation After Actions**: Remains on settings page.
- **Permissions**: Superadmin only.

---

# Group F: Reusable Shared Views & Components

### 76. In-App Notifications Drawer / Page
- **Route**: `/notifications` (or slide-out drawer)
- **Roles**: All authenticated roles
- **Purpose**: Unified real-time notification feed tracking RFQ dispatches, received quotes, order milestones, and verification updates.
- **Layout**: Chronological notification card stream with filter tabs (`All, Unread, RFQs, Orders, Account`).
- **Cards/Sections**: Notification items with icon, title, description snippet, timestamp, and unread marker.
- **Buttons**: `Mark All as Read`, `Open Notification Target`, `Clear Read`.
- **Button Actions**: Marks notifications as read and routes to target screen.
- **API Endpoints**: `GET /api/notifications`, `PATCH /api/notifications/:id/read`.
- **Database Tables**: `public.notifications`.

### 77. Shared Profile & Account Settings
- **Route**: `/settings/profile`
- **Roles**: All authenticated roles
- **Purpose**: Unified user credentials, phone verification, and personal preferences.
- **Layout**: Centered settings card.
- **Form Fields**: Full Name, Email, Mobile Phone, Current Password, New Password, Language Preference.
- **API Endpoints**: `PUT /api/users/me`.
- **Database Tables**: `public.users`.

### 78. Access Denied (403) Page
- **Route**: `/access-denied`
- **Roles**: All
- **Purpose**: Clear, friendly explanation when a user attempts to access a role-restricted route (e.g. Buyer accessing Admin panel).
- **Cards/Sections**: Shield alert graphic, explanation message, Role Switcher shortcut (if user holds `buyer_supplier` dual role), and Back to Dashboard button.
- **Buttons**: `Switch to Supplier Workspace`, `Back to My Dashboard`.

### 79. Not Found (404) Page
- **Route**: `*`
- **Roles**: All
- **Purpose**: Catch-all for invalid URLs with search bar and links to marketplace, categories, and home.
- **Buttons**: `Back to Home`, `Search Marketplace`.

### 80. Global Confirmation Modal System
- **Component**: `<ConfirmDialog />`
- **Purpose**: Reusable modal for destructive actions (Order cancellations, quote rejections, business suspensions) requiring explicit confirmation before executing.
