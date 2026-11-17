import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";

const router = Router();

// ====================================================================
// Exact 11 Business Service Categories (A to K) & Subcategories Fallback
// ====================================================================
export const DEFAULT_CATEGORIES = [
  {
    id: "cat-reg-01",
    name: "Business Registration & Compliance",
    slug: "business-registration-compliance",
    icon: "FileCheck",
    description: "Company & LLP incorporation, MSME, GST, FSSAI, Shop & Establishment, Business Licences and Trademark Registration.",
    sort_order: 1,
    is_active: true,
    subcategories: [
      { id: "sub-reg-01", name: "Company Registration", slug: "company-registration", sort_order: 1, is_active: true },
      { id: "sub-reg-02", name: "LLP Registration", slug: "llp-registration", sort_order: 2, is_active: true },
      { id: "sub-reg-03", name: "Proprietorship Registration", slug: "proprietorship-registration", sort_order: 3, is_active: true },
      { id: "sub-reg-04", name: "GST Registration", slug: "gst-registration", sort_order: 4, is_active: true },
      { id: "sub-reg-05", name: "MSME / Udyam Registration", slug: "msme-udyam-registration", sort_order: 5, is_active: true },
      { id: "sub-reg-06", name: "FSSAI Registration", slug: "fssai-registration", sort_order: 6, is_active: true },
      { id: "sub-reg-07", name: "Shop & Establishment Registration", slug: "shop-establishment-registration", sort_order: 7, is_active: true },
      { id: "sub-reg-08", name: "Business Licence Assistance", slug: "business-licence-assistance", sort_order: 8, is_active: true },
      { id: "sub-reg-09", name: "Trademark Registration", slug: "trademark-registration", sort_order: 9, is_active: true },
      { id: "sub-reg-10", name: "Compliance Services", slug: "compliance-services", sort_order: 10, is_active: true },
    ],
  },
  {
    id: "cat-leg-02",
    name: "Legal Services",
    slug: "legal-services",
    icon: "Scale",
    description: "Legal consultation, corporate contracts, business agreements, IP protection, and regulatory dispute advisory.",
    sort_order: 2,
    is_active: true,
    subcategories: [
      { id: "sub-leg-01", name: "Legal Consultation", slug: "legal-consultation", sort_order: 1, is_active: true },
      { id: "sub-leg-02", name: "Business Agreements", slug: "business-agreements", sort_order: 2, is_active: true },
      { id: "sub-leg-03", name: "Partnership Agreements", slug: "partnership-agreements", sort_order: 3, is_active: true },
      { id: "sub-leg-04", name: "Contract Drafting", slug: "contract-drafting", sort_order: 4, is_active: true },
      { id: "sub-leg-05", name: "Trademark Legal Assistance", slug: "trademark-legal-assistance", sort_order: 5, is_active: true },
      { id: "sub-leg-06", name: "Company Compliance", slug: "company-compliance", sort_order: 6, is_active: true },
      { id: "sub-leg-07", name: "Intellectual Property Services", slug: "intellectual-property-services", sort_order: 7, is_active: true },
    ],
  },
  {
    id: "cat-fin-03",
    name: "Accounting & Finance",
    slug: "accounting-finance",
    icon: "Calculator",
    description: "Bookkeeping, GST & Income Tax filing, statutory auditing, payroll management, and corporate financial advisory.",
    sort_order: 3,
    is_active: true,
    subcategories: [
      { id: "sub-fin-01", name: "Accounting Services", slug: "accounting-services", sort_order: 1, is_active: true },
      { id: "sub-fin-02", name: "Bookkeeping", slug: "bookkeeping", sort_order: 2, is_active: true },
      { id: "sub-fin-03", name: "GST Filing", slug: "gst-filing", sort_order: 3, is_active: true },
      { id: "sub-fin-04", name: "Income Tax Filing", slug: "income-tax-filing", sort_order: 4, is_active: true },
      { id: "sub-fin-05", name: "Financial Auditing", slug: "financial-auditing", sort_order: 5, is_active: true },
      { id: "sub-fin-06", name: "Payroll Management", slug: "payroll-management", sort_order: 6, is_active: true },
      { id: "sub-fin-07", name: "Financial Consultancy", slug: "financial-consultancy", sort_order: 7, is_active: true },
      { id: "sub-fin-08", name: "Business Financial Reports", slug: "business-financial-reports", sort_order: 8, is_active: true },
    ],
  },
  {
    id: "cat-mkt-04",
    name: "Branding & Marketing",
    slug: "branding-marketing",
    icon: "Megaphone",
    description: "Brand identity, packaging design, digital marketing, SEO, advertising campaigns, and industrial product photography.",
    sort_order: 4,
    is_active: true,
    subcategories: [
      { id: "sub-mkt-01", name: "Logo Design", slug: "logo-design", sort_order: 1, is_active: true },
      { id: "sub-mkt-02", name: "Brand Identity", slug: "brand-identity", sort_order: 2, is_active: true },
      { id: "sub-mkt-03", name: "Packaging Design", slug: "packaging-design", sort_order: 3, is_active: true },
      { id: "sub-mkt-04", name: "Social Media Management", slug: "social-media-management", sort_order: 4, is_active: true },
      { id: "sub-mkt-05", name: "Digital Marketing", slug: "digital-marketing", sort_order: 5, is_active: true },
      { id: "sub-mkt-06", name: "SEO", slug: "seo", sort_order: 6, is_active: true },
      { id: "sub-mkt-07", name: "Google Business Profile Management", slug: "google-business-profile-management", sort_order: 7, is_active: true },
      { id: "sub-mkt-08", name: "Advertising Campaigns", slug: "advertising-campaigns", sort_order: 8, is_active: true },
      { id: "sub-mkt-09", name: "Product Photography", slug: "product-photography", sort_order: 9, is_active: true },
      { id: "sub-mkt-10", name: "Video Production", slug: "video-production", sort_order: 10, is_active: true },
    ],
  },
  {
    id: "cat-tech-05",
    name: "Technology & IT",
    slug: "technology-it",
    icon: "Cpu",
    description: "Enterprise ERP, CRM, custom web & mobile apps, billing software, and factory inventory automation.",
    sort_order: 5,
    is_active: true,
    subcategories: [
      { id: "sub-tech-01", name: "Website Development", slug: "website-development", sort_order: 1, is_active: true },
      { id: "sub-tech-02", name: "E-commerce Website", slug: "ecommerce-website", sort_order: 2, is_active: true },
      { id: "sub-tech-03", name: "Mobile App Development", slug: "mobile-app-development", sort_order: 3, is_active: true },
      { id: "sub-tech-04", name: "Custom Software", slug: "custom-software", sort_order: 4, is_active: true },
      { id: "sub-tech-05", name: "ERP Development", slug: "erp-development", sort_order: 5, is_active: true },
      { id: "sub-tech-06", name: "CRM Development", slug: "crm-development", sort_order: 6, is_active: true },
      { id: "sub-tech-07", name: "Inventory Management Software", slug: "inventory-management-software", sort_order: 7, is_active: true },
      { id: "sub-tech-08", name: "Billing Software", slug: "billing-software", sort_order: 8, is_active: true },
      { id: "sub-tech-09", name: "Business Automation", slug: "business-automation", sort_order: 9, is_active: true },
      { id: "sub-tech-10", name: "IT Support", slug: "it-support", sort_order: 10, is_active: true },
    ],
  },
  {
    id: "cat-mfg-06",
    name: "Manufacturing & Product Development",
    slug: "manufacturing-product-development",
    icon: "Factory",
    description: "Product engineering, rapid prototyping, contract manufacturing, OEM & ODM consulting, and formulation.",
    sort_order: 6,
    is_active: true,
    subcategories: [
      { id: "sub-mfg-01", name: "Product Research", slug: "product-research", sort_order: 1, is_active: true },
      { id: "sub-mfg-02", name: "Product Development", slug: "product-development", sort_order: 2, is_active: true },
      { id: "sub-mfg-03", name: "Prototype Development", slug: "prototype-development", sort_order: 3, is_active: true },
      { id: "sub-mfg-04", name: "Contract Manufacturing", slug: "contract-manufacturing", sort_order: 4, is_active: true },
      { id: "sub-mfg-05", name: "Private Label Manufacturing", slug: "private-label-manufacturing", sort_order: 5, is_active: true },
      { id: "sub-mfg-06", name: "OEM / ODM Services", slug: "oem-odm-services", sort_order: 6, is_active: true },
      { id: "sub-mfg-07", name: "Product Formulation", slug: "product-formulation", sort_order: 7, is_active: true },
      { id: "sub-mfg-08", name: "Manufacturing Consultancy", slug: "manufacturing-consultancy", sort_order: 8, is_active: true },
    ],
  },
  {
    id: "cat-pkg-07",
    name: "Packaging & Printing",
    slug: "packaging-printing",
    icon: "Boxes",
    description: "Custom cartons, flexible pouches, commercial offset printing, container packaging, and barcode labels.",
    sort_order: 7,
    is_active: true,
    subcategories: [
      { id: "sub-pkg-01", name: "Custom Packaging Design", slug: "custom-packaging-design", sort_order: 1, is_active: true },
      { id: "sub-pkg-02", name: "Packaging Manufacturing", slug: "packaging-manufacturing", sort_order: 2, is_active: true },
      { id: "sub-pkg-03", name: "Label Design", slug: "label-design", sort_order: 3, is_active: true },
      { id: "sub-pkg-04", name: "Label Printing", slug: "label-printing", sort_order: 4, is_active: true },
      { id: "sub-pkg-05", name: "Carton Manufacturing", slug: "carton-manufacturing", sort_order: 5, is_active: true },
      { id: "sub-pkg-06", name: "Pouch Manufacturing", slug: "pouch-manufacturing", sort_order: 6, is_active: true },
      { id: "sub-pkg-07", name: "Bottle & Container Packaging", slug: "bottle-container-packaging", sort_order: 7, is_active: true },
      { id: "sub-pkg-08", name: "Branding & Packaging Consultancy", slug: "branding-packaging-consultancy", sort_order: 8, is_active: true },
    ],
  },
  {
    id: "cat-tst-08",
    name: "Testing & Quality",
    slug: "testing-quality",
    icon: "CheckCheck",
    description: "NABL accredited laboratory testing, food & chemical safety, BIS certification, and factory QC inspection.",
    sort_order: 8,
    is_active: true,
    subcategories: [
      { id: "sub-tst-01", name: "Laboratory Testing", slug: "laboratory-testing", sort_order: 1, is_active: true },
      { id: "sub-tst-02", name: "Food Testing", slug: "food-testing", sort_order: 2, is_active: true },
      { id: "sub-tst-03", name: "Product Quality Inspection", slug: "product-quality-inspection", sort_order: 3, is_active: true },
      { id: "sub-tst-04", name: "Material Testing", slug: "material-testing", sort_order: 4, is_active: true },
      { id: "sub-tst-05", name: "Packaging Testing", slug: "packaging-testing", sort_order: 5, is_active: true },
      { id: "sub-tst-06", name: "Quality Control Consultancy", slug: "quality-control-consultancy", sort_order: 6, is_active: true },
      { id: "sub-tst-07", name: "Certification Assistance", slug: "certification-assistance", sort_order: 7, is_active: true },
    ],
  },
  {
    id: "cat-imp-09",
    name: "Import & Export Services",
    slug: "import-export-services",
    icon: "Globe",
    description: "Cross-border trade advisory, customs clearance coordination, shipping documentation, and international sourcing.",
    sort_order: 9,
    is_active: true,
    subcategories: [
      { id: "sub-imp-01", name: "Import Consultancy", slug: "import-consultancy", sort_order: 1, is_active: true },
      { id: "sub-imp-02", name: "Export Consultancy", slug: "export-consultancy", sort_order: 2, is_active: true },
      { id: "sub-imp-03", name: "Documentation Assistance", slug: "documentation-assistance", sort_order: 3, is_active: true },
      { id: "sub-imp-04", name: "Customs Clearance Coordination", slug: "customs-clearance-coordination", sort_order: 4, is_active: true },
      { id: "sub-imp-05", name: "International Sourcing", slug: "international-sourcing", sort_order: 5, is_active: true },
      { id: "sub-imp-06", name: "Trade Compliance Assistance", slug: "trade-compliance-assistance", sort_order: 6, is_active: true },
      { id: "sub-imp-07", name: "Freight Consultancy", slug: "freight-consultancy", sort_order: 7, is_active: true },
    ],
  },
  {
    id: "cat-log-10",
    name: "Logistics & Supply Chain Consultancy",
    slug: "logistics-supply-chain-consultancy",
    icon: "Truck",
    description: "Warehousing design, inventory optimization, distribution planning, and logistics cost analysis.",
    sort_order: 10,
    is_active: true,
    subcategories: [
      { id: "sub-log-01", name: "Supply Chain Planning", slug: "supply-chain-planning", sort_order: 1, is_active: true },
      { id: "sub-log-02", name: "Warehouse Consultancy", slug: "warehouse-consultancy", sort_order: 2, is_active: true },
      { id: "sub-log-03", name: "Inventory Planning", slug: "inventory-planning", sort_order: 3, is_active: true },
      { id: "sub-log-04", name: "Transportation Planning", slug: "transportation-planning", sort_order: 4, is_active: true },
      { id: "sub-log-05", name: "Distribution Strategy", slug: "distribution-strategy", sort_order: 5, is_active: true },
      { id: "sub-log-06", name: "Logistics Cost Analysis", slug: "logistics-cost-analysis", sort_order: 6, is_active: true },
    ],
  },
  {
    id: "cat-cns-11",
    name: "Business Consulting",
    slug: "business-consulting",
    icon: "Briefcase",
    description: "Startup mentorship, corporate growth strategy, market research, franchise advisory, and business expansion planning.",
    sort_order: 11,
    is_active: true,
    subcategories: [
      { id: "sub-cns-01", name: "Business Planning", slug: "business-planning", sort_order: 1, is_active: true },
      { id: "sub-cns-02", name: "Market Research", slug: "market-research", sort_order: 2, is_active: true },
      { id: "sub-cns-03", name: "Business Strategy", slug: "business-strategy", sort_order: 3, is_active: true },
      { id: "sub-cns-04", name: "Financial Planning", slug: "financial-planning", sort_order: 4, is_active: true },
      { id: "sub-cns-05", name: "Franchise Consultancy", slug: "franchise-consultancy", sort_order: 5, is_active: true },
      { id: "sub-cns-06", name: "Startup Consultancy", slug: "startup-consultancy", sort_order: 6, is_active: true },
      { id: "sub-cns-07", name: "Business Expansion Planning", slug: "business-expansion-planning", sort_order: 7, is_active: true },
    ],
  },
];

// Helper to generate slugs
function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ====================================================================
// 1. Categories & Subcategories
// ====================================================================

// GET /api/business-services/categories
router.get("/business-services/categories", async (_req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.json({ success: true, data: DEFAULT_CATEGORIES });
  }

  try {
    const { data: categories, error: catError } = await insforge.database
      .from("business_service_categories")
      .select("id, name, slug, icon, description, sort_order, is_active")
      .order("sort_order", { ascending: true });

    if (catError || !categories || categories.length === 0) {
      return res.json({ success: true, data: DEFAULT_CATEGORIES });
    }

    const { data: subcategories } = await insforge.database
      .from("business_service_subcategories")
      .select("id, category_id, name, slug, description, sort_order, is_active")
      .order("sort_order", { ascending: true });

    const categoriesWithSubs = (categories || []).map((cat: any) => ({
      ...cat,
      subcategories: (subcategories || []).filter((sub: any) => sub.category_id === cat.id),
    }));

    return res.json({
      success: true,
      data: categoriesWithSubs.length > 0 ? categoriesWithSubs : DEFAULT_CATEGORIES,
    });
  } catch (_err) {
    return res.json({ success: true, data: DEFAULT_CATEGORIES });
  }
});

// POST /api/business-services/categories (Admin create)
router.post("/business-services/categories", async (req, res) => {
  const { name, icon, description, sort_order = 0 } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ success: false, error: "Category name is required." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database unavailable." });

  try {
    const slug = slugify(name);
    const { data, error } = await insforge.database
      .from("business_service_categories")
      .insert([{ name: name.trim(), slug, icon: icon || null, description: description?.trim() || null, sort_order }])
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/business-services/categories/:id (Admin update)
router.put("/business-services/categories/:id", async (req, res) => {
  const { id } = req.params;
  const { name, icon, description, sort_order, is_active } = req.body;

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database unavailable." });

  try {
    const updates: Record<string, any> = {};
    if (name !== undefined) {
      updates.name = name.trim();
      updates.slug = slugify(name);
    }
    if (icon !== undefined) updates.icon = icon;
    if (description !== undefined) updates.description = description?.trim() || null;
    if (sort_order !== undefined) updates.sort_order = Number(sort_order);
    if (is_active !== undefined) updates.is_active = Boolean(is_active);

    const { data, error } = await insforge.database
      .from("business_service_categories")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/business-services/categories/:id/status (Admin toggle status)
router.patch("/business-services/categories/:id/status", async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("business_service_categories")
      .update({ is_active: Boolean(is_active) })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/business-services/subcategories (Admin create)
router.post("/business-services/subcategories", async (req, res) => {
  const { category_id, name, description, sort_order = 0 } = req.body;
  if (!category_id || !name?.trim()) {
    return res.status(400).json({ success: false, error: "Category ID and subcategory name are required." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database unavailable." });

  try {
    const slug = slugify(name);
    const { data, error } = await insforge.database
      .from("business_service_subcategories")
      .insert([{ category_id, name: name.trim(), slug, description: description?.trim() || null, sort_order }])
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/business-services/subcategories/:id (Admin update)
router.put("/business-services/subcategories/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, sort_order, is_active } = req.body;

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database unavailable." });

  try {
    const updates: Record<string, any> = {};
    if (name !== undefined) {
      updates.name = name.trim();
      updates.slug = slugify(name);
    }
    if (description !== undefined) updates.description = description?.trim() || null;
    if (sort_order !== undefined) updates.sort_order = Number(sort_order);
    if (is_active !== undefined) updates.is_active = Boolean(is_active);

    const { data, error } = await insforge.database
      .from("business_service_subcategories")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/business-services/subcategories/:id/status (Admin toggle status)
router.patch("/business-services/subcategories/:id/status", async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("business_service_subcategories")
      .update({ is_active: Boolean(is_active) })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 2. Services Listings & Multi-Tier Packages
// ====================================================================

// GET /api/business-services (List & Search with Filters)
router.get("/business-services", async (req, res) => {
  const {
    category,
    subcategory,
    search,
    city,
    business_id,
    pricing_model,
    sort,
    minPrice,
    maxPrice,
  } = req.query as {
    category?: string;
    subcategory?: string;
    search?: string;
    city?: string;
    business_id?: string;
    pricing_model?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  };

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    let query = insforge.database
      .from("business_services")
      .select(
        "id, business_id, category_id, subcategory_id, title, slug, short_description, full_description, deliverables, pricing_model, starting_price, turnaround_days, is_active, moderation_status, service_location, remote_on_site, requirements_from_customer, portfolio_images, supporting_documents, created_at, businesses(id, name, slug, city, state, verification_level), business_service_categories(id, name, slug), business_service_subcategories(id, name, slug)"
      )
      .eq("is_active", true);

    if (business_id) {
      query = query.eq("business_id", business_id);
    }
    if (category?.trim()) {
      query = query.eq("category_id", category.trim());
    }
    if (subcategory?.trim()) {
      query = query.eq("subcategory_id", subcategory.trim());
    }
    if (pricing_model?.trim()) {
      query = query.eq("pricing_model", pricing_model.trim());
    }
    if (search?.trim()) {
      query = query.or(`title.ilike.%${search.trim()}%,short_description.ilike.%${search.trim()}%`);
    }
    if (minPrice) {
      query = query.gte("starting_price", Number.parseFloat(minPrice));
    }
    if (maxPrice) {
      query = query.lte("starting_price", Number.parseFloat(maxPrice));
    }

    if (sort === "price_asc") {
      query = query.order("starting_price", { ascending: true });
    } else if (sort === "price_desc") {
      query = query.order("starting_price", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data: services, error } = await query;
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    // Filter by city in application memory if specified
    let filtered = services || [];
    if (city?.trim()) {
      const targetCity = city.trim().toLowerCase();
      filtered = filtered.filter((s: any) =>
        s.businesses?.city?.toLowerCase().includes(targetCity)
      );
    }

    return res.json({
      success: true,
      data: filtered,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/business-services/:id (Details with Packages & Reviews)
router.get("/business-services/:id", async (req, res) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database client unavailable." });
  }

  try {
    const { data: service, error } = await insforge.database
      .from("business_services")
      .select(
        "id, business_id, category_id, subcategory_id, title, slug, short_description, full_description, deliverables, pricing_model, starting_price, turnaround_days, is_active, moderation_status, service_location, remote_on_site, requirements_from_customer, portfolio_images, supporting_documents, created_at, businesses(id, name, slug, city, state, phone, email, website, verification_level), business_service_categories(id, name, slug), business_service_subcategories(id, name, slug)"
      )
      .eq("id", id)
      .single();

    if (error || !service) {
      return res.status(404).json({ success: false, error: "Service listing not found." });
    }

    // Fetch packages
    const { data: packages } = await insforge.database
      .from("business_service_packages")
      .select("id, service_id, package_tier, name, description, price, turnaround_days, deliverables, sort_order, is_active")
      .eq("service_id", id)
      .order("sort_order", { ascending: true });

    // Fetch portfolio items
    const { data: portfolio } = await insforge.database
      .from("business_service_portfolios")
      .select("id, title, image_url, description, created_at")
      .or(`service_id.eq.${id},business_id.eq.${service.business_id}`)
      .limit(10);

    // Fetch provider profile
    const { data: providerProfile } = await insforge.database
      .from("service_provider_profiles")
      .select("headline, bio, experience_years, service_areas, certifications, website_url")
      .eq("business_id", service.business_id)
      .single();

    // Fetch verified reviews
    const { data: reviews } = await insforge.database
      .from("service_reviews")
      .select("id, rating, review_text, is_verified, created_at, users(id, full_name, email)")
      .eq("service_id", id)
      .order("created_at", { ascending: false });

    return res.json({
      success: true,
      data: {
        ...service,
        packages: packages || [],
        portfolio: portfolio || [],
        provider_profile: providerProfile || null,
        reviews: reviews || [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Failed to load service details." });
  }
});

// POST /api/business-services (Provider creates new service listing)
router.post("/business-services", async (req, res) => {
  const {
    business_id,
    category_id,
    subcategory_id,
    title,
    short_description,
    full_description,
    deliverables = [],
    pricing_model = "custom_quote",
    starting_price,
    turnaround_days = 3,
    service_location,
    remote_on_site = "remote",
    requirements_from_customer,
    portfolio_images = [],
    supporting_documents = [],
    packages = [],
  } = req.body;

  if (!business_id || !category_id || !title?.trim() || !short_description?.trim()) {
    return res.status(400).json({
      success: false,
      error: "Business ID, category, title, and short description are required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const slug = `${slugify(title)}-${Math.random().toString(36).substring(2, 6)}`;

    const { data: service, error } = await insforge.database
      .from("business_services")
      .insert([
        {
          business_id,
          category_id,
          subcategory_id: subcategory_id || null,
          title: title.trim(),
          slug,
          short_description: short_description.trim(),
          full_description: full_description?.trim() || null,
          deliverables: Array.isArray(deliverables) ? deliverables : [],
          pricing_model,
          starting_price: starting_price ? Number.parseFloat(starting_price) : null,
          turnaround_days: Number.parseInt(turnaround_days, 10) || 3,
          service_location: service_location?.trim() || null,
          remote_on_site,
          requirements_from_customer: requirements_from_customer?.trim() || null,
          portfolio_images: Array.isArray(portfolio_images) ? portfolio_images : [],
          supporting_documents: Array.isArray(supporting_documents) ? supporting_documents : [],
          is_active: true,
          moderation_status: "approved",
        },
      ])
      .select()
      .single();

    if (error || !service) {
      return res.status(500).json({ success: false, error: error?.message || "Failed to create service listing." });
    }

    // Insert packages if provided
    if (Array.isArray(packages) && packages.length > 0) {
      const packageRows = packages.map((pkg, idx) => ({
        service_id: service.id,
        package_tier: pkg.package_tier || "basic",
        name: pkg.name || `${pkg.package_tier || "Package"} Tier`,
        description: pkg.description || null,
        price: Number.parseFloat(pkg.price) || 0,
        turnaround_days: Number.parseInt(pkg.turnaround_days, 10) || 3,
        deliverables: Array.isArray(pkg.deliverables) ? pkg.deliverables : [],
        sort_order: idx + 1,
        is_active: true,
      }));

      await insforge.database.from("business_service_packages").insert(packageRows);
    }

    return res.status(201).json({
      success: true,
      message: "Business service listed successfully.",
      data: service,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Failed to create service listing." });
  }
});

// PATCH /api/business-services/:id (Provider updates service)
router.patch("/business-services/:id", async (req, res) => {
  const { id } = req.params;
  const {
    title,
    short_description,
    full_description,
    deliverables,
    pricing_model,
    starting_price,
    turnaround_days,
    service_location,
    remote_on_site,
    requirements_from_customer,
    is_active,
  } = req.body;

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title.trim();
    if (short_description !== undefined) updates.short_description = short_description.trim();
    if (full_description !== undefined) updates.full_description = full_description?.trim() || null;
    if (deliverables !== undefined) updates.deliverables = Array.isArray(deliverables) ? deliverables : [];
    if (pricing_model !== undefined) updates.pricing_model = pricing_model;
    if (starting_price !== undefined) updates.starting_price = starting_price ? Number.parseFloat(starting_price) : null;
    if (turnaround_days !== undefined) updates.turnaround_days = Number.parseInt(turnaround_days, 10);
    if (service_location !== undefined) updates.service_location = service_location;
    if (remote_on_site !== undefined) updates.remote_on_site = remote_on_site;
    if (requirements_from_customer !== undefined) updates.requirements_from_customer = requirements_from_customer;
    if (is_active !== undefined) updates.is_active = Boolean(is_active);

    const { data, error } = await insforge.database
      .from("business_services")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, message: "Service listing updated.", data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/business-services/:id (Soft-delete / deactivate service)
router.delete("/business-services/:id", async (req, res) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { error } = await insforge.database
      .from("business_services")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, message: "Service deactivated successfully." });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 3. Service Providers & Profiles
// ====================================================================

// GET /api/business-services/providers (Directory of verified providers)
router.get("/business-services/providers", async (req, res) => {
  const { category, city, verification, search } = req.query as {
    category?: string;
    city?: string;
    verification?: string;
    search?: string;
  };

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    let query = insforge.database
      .from("businesses")
      .select("id, name, slug, logo_url, city, state, pincode, verification_level, created_at, service_provider_profiles(headline, bio, experience_years, service_areas, certifications, website_url)")
      .eq("business_type", "service_provider")
      .eq("is_active", true);

    if (verification) {
      query = query.eq("verification_level", verification);
    }
    if (city) {
      query = query.ilike("city", `%${city.trim()}%`);
    }
    if (search) {
      query = query.ilike("name", `%${search.trim()}%`);
    }

    const { data: providers, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.json({
      success: true,
      data: providers || [],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/business-services/providers/:id (Provider Detail with Services & Reviews)
router.get("/business-services/providers/:id", async (req, res) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data: provider, error } = await insforge.database
      .from("businesses")
      .select("id, name, slug, logo_url, city, state, pincode, gstin, pan, email, phone, website, verification_level, created_at, service_provider_profiles(*)")
      .eq("id", id)
      .single();

    if (error || !provider) {
      return res.status(404).json({ success: false, error: "Provider not found." });
    }

    // Active services
    const { data: services } = await insforge.database
      .from("business_services")
      .select("id, title, slug, short_description, starting_price, pricing_model, turnaround_days, business_service_categories(name)")
      .eq("business_id", id)
      .eq("is_active", true);

    // Reviews
    const { data: reviews } = await insforge.database
      .from("service_reviews")
      .select("id, rating, review_text, created_at, users(full_name)")
      .eq("provider_business_id", id)
      .order("created_at", { ascending: false });

    // Documents
    const { data: documents } = await insforge.database
      .from("service_provider_documents")
      .select("id, document_type, file_name, file_url, verification_status, uploaded_at")
      .eq("business_id", id);

    return res.json({
      success: true,
      data: {
        ...provider,
        services: services || [],
        reviews: reviews || [],
        documents: documents || [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/business-services/providers/onboarding (Register / Setup Provider)
router.post("/business-services/providers/onboarding", async (req, res) => {
  const {
    userId,
    name,
    provider_type = "consultant",
    city,
    state,
    pincode,
    gstin,
    pan,
    headline,
    bio,
    experience_years,
    service_areas = [],
    website_url,
  } = req.body;

  if (!userId || !name?.trim() || !city?.trim() || !state?.trim() || !pincode?.trim()) {
    return res.status(400).json({
      success: false,
      error: "User ID, company/firm name, city, state, and pincode are required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const slug = `${slugify(name)}-${Math.random().toString(36).substring(2, 6)}`;

    // 1. Create Business
    const { data: bizData, error: bizError } = await insforge.database
      .from("businesses")
      .insert([
        {
          name: name.trim(),
          slug,
          business_type: "service_provider",
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          gstin: gstin?.trim() || null,
          pan: pan?.trim() || null,
          verification_level: "unverified",
          is_active: true,
        },
      ])
      .select()
      .single();

    if (bizError || !bizData) {
      return res.status(500).json({ success: false, error: bizError?.message || "Failed to create business." });
    }

    const businessId = bizData.id;

    // 2. Link member
    await insforge.database.from("business_members").insert([
      {
        business_id: businessId,
        user_id: userId,
        role_in_business: "owner",
      },
    ]);

    // 3. Add service provider profile
    await insforge.database.from("service_provider_profiles").insert([
      {
        business_id: businessId,
        headline: headline?.trim() || `${name.trim()} - Professional Services`,
        bio: bio?.trim() || null,
        experience_years: Number.parseInt(experience_years, 10) || 0,
        service_areas: Array.isArray(service_areas) ? service_areas : [],
        website_url: website_url?.trim() || null,
      },
    ]);

    // 4. Assign role in user_roles
    await insforge.database.from("user_roles").insert([
      {
        user_id: userId,
        role: "service_provider",
        is_primary: false,
      },
    ]);

    return res.status(201).json({
      success: true,
      message: "Service Provider onboarding completed.",
      data: bizData,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/business-services/providers/documents (Upload verification document)
router.post("/business-services/providers/documents", async (req, res) => {
  const { business_id, document_type, file_url, file_name, file_key } = req.body;
  if (!business_id || !document_type || !file_url) {
    return res.status(400).json({
      success: false,
      error: "Business ID, document type, and file URL are required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("service_provider_documents")
      .insert([
        {
          business_id,
          document_type,
          file_url,
          file_name: file_name || `${document_type}.pdf`,
          file_key: file_key || null,
          verification_status: "pending",
        },
      ])
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, message: "Document uploaded successfully.", data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/business-services/providers/:id/documents
router.get("/business-services/providers/:id/documents", async (req, res) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("service_provider_documents")
      .select("*")
      .eq("business_id", id)
      .order("uploaded_at", { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/business-services/providers/documents/:id (Admin verify/reject document)
router.patch("/business-services/providers/documents/:id", async (req, res) => {
  const { id } = req.params;
  const { verification_status, admin_notes } = req.body;

  if (!["pending", "verified", "rejected"].includes(verification_status)) {
    return res.status(400).json({ success: false, error: "Invalid verification status." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("service_provider_documents")
      .update({ verification_status, admin_notes: admin_notes || null })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, message: `Document ${verification_status}.`, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/business-services/providers/:id/verification (Admin update provider badge/status)
router.patch("/business-services/providers/:id/verification", async (req, res) => {
  const { id } = req.params;
  const { verification_level, admin_id, reason } = req.body;

  const validLevels = ["unverified", "basic_verified", "fully_verified", "rejected", "suspended"];
  if (!validLevels.includes(verification_level) || !admin_id) {
    return res.status(400).json({
      success: false,
      error: "Valid verification_level and admin_id are required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data: currentBiz } = await insforge.database
      .from("businesses")
      .select("verification_level")
      .eq("id", id)
      .single();

    const previous_status = currentBiz?.verification_level || "unverified";

    const { data, error } = await insforge.database
      .from("businesses")
      .update({ verification_level })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    // History record
    await insforge.database.from("service_provider_verification_history").insert([
      {
        business_id: id,
        admin_id,
        previous_status,
        new_status: verification_level,
        action: `VERIFICATION_${verification_level.toUpperCase()}`,
        reason: reason?.trim() || null,
      },
    ]);

    return res.json({
      success: true,
      message: `Provider status set to ${verification_level}.`,
      data,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/business-services/admin/providers/:id/verify (Alias for admin verification)
router.patch("/business-services/admin/providers/:id/verify", async (req, res) => {
  const { id } = req.params;
  const { verification_level, admin_id, reason } = req.body;

  const validLevels = ["unverified", "basic_verified", "fully_verified", "verified", "rejected", "suspended"];
  const mappedLevel = verification_level === "verified" ? "fully_verified" : verification_level;

  if (!validLevels.includes(verification_level) || !admin_id) {
    return res.status(400).json({
      success: false,
      error: "Valid verification_level and admin_id are required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data: currentBiz } = await insforge.database
      .from("businesses")
      .select("verification_level")
      .eq("id", id)
      .single();

    const previous_status = currentBiz?.verification_level || "unverified";

    const { data, error } = await insforge.database
      .from("businesses")
      .update({ verification_level: mappedLevel })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    await insforge.database.from("service_provider_verification_history").insert([
      {
        business_id: id,
        admin_id,
        previous_status,
        new_status: mappedLevel,
        action: `VERIFICATION_${mappedLevel.toUpperCase()}`,
        reason: reason?.trim() || null,
      },
    ]);

    return res.json({
      success: true,
      message: `Provider status set to ${mappedLevel}.`,
      data,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/business-services/admin/providers (Admin list alias)
router.get("/business-services/admin/providers", async (req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data: providers, error } = await insforge.database
      .from("businesses")
      .select("id, name, slug, logo_url, city, state, pincode, verification_level, is_active, created_at, service_provider_profiles(headline, bio, experience_years, service_areas, certifications, website_url)")
      .eq("business_type", "service_provider")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: providers || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/business-services/admin/complaints (Admin list alias)
router.get("/business-services/admin/complaints", async (_req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("service_complaints")
      .select("*, businesses(id, name), users(id, full_name, email)")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/business-services/providers/:id/dashboard-metrics (8 Real DB KPI Metrics)
router.get("/business-services/providers/:id/dashboard-metrics", async (req, res) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    // 1. Total Requests / Inquiries
    const { count: activeRequests } = await insforge.database
      .from("service_requests")
      .select("*", { count: "exact", head: true })
      .eq("provider_business_id", id)
      .in("status", ["submitted", "viewed", "quoted"]);

    // 2. Submitted Quotes
    const { count: submittedQuotes } = await insforge.database
      .from("service_request_quotations")
      .select("*", { count: "exact", head: true })
      .eq("provider_business_id", id);

    // 3. Active Projects
    const { count: activeProjects } = await insforge.database
      .from("service_projects")
      .select("*", { count: "exact", head: true })
      .eq("provider_business_id", id)
      .in("status", ["project_created", "awaiting_start", "in_progress", "waiting_for_customer", "under_review", "revision_requested"]);

    // 4. Completed Projects
    const { data: completedProjects } = await insforge.database
      .from("service_projects")
      .select("agreed_price")
      .eq("provider_business_id", id)
      .eq("status", "completed");

    const completedCount = completedProjects?.length || 0;

    // 5. Total Revenue from Completed Projects
    const totalRevenue = (completedProjects || []).reduce(
      (sum: number, p: any) => sum + (Number(p.agreed_price) || 0),
      0
    );

    // 6. Reviews & Rating
    const { data: reviews } = await insforge.database
      .from("service_reviews")
      .select("rating")
      .eq("provider_business_id", id);

    const totalReviews = reviews?.length || 0;
    const avgRating =
      totalReviews > 0
        ? Number(
            (
              reviews!.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) /
              totalReviews
            ).toFixed(1)
          )
        : 5.0;

    // 7. Pending Milestones
    const { count: pendingMilestones } = await insforge.database
      .from("service_project_milestones")
      .select("id, service_projects!inner(provider_business_id)", { count: "exact", head: true })
      .eq("service_projects.provider_business_id", id)
      .in("status", ["pending", "in_progress"]);

    return res.json({
      success: true,
      data: {
        activeRequests: activeRequests || 0,
        submittedQuotes: submittedQuotes || 0,
        activeProjects: activeProjects || 0,
        completedProjects: completedCount,
        totalRevenue,
        avgRating,
        totalReviews,
        pendingMilestones: pendingMilestones || 0,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 4. Service Requests (Inquiries, Broadcast & Guest Claim)
// ====================================================================

// POST /api/business-services/requests (Customer / Guest submits inquiry)
router.post("/business-services/requests", async (req, res) => {
  const {
    customer_id,
    customer_business_id,
    service_id,
    provider_business_id,
    provider_business_ids = [],
    category_id,
    title,
    requirements,
    delivery_city,
    target_timeline,
    budget,
    supporting_files = [],
    // Guest fields
    guest_name,
    guest_email,
    guest_phone,
    guest_business_name,
  } = req.body;

  // Validation: If no customer_id, guest contact details are mandatory
  if (!customer_id && (!guest_name?.trim() || !guest_email?.trim() || !guest_phone?.trim())) {
    return res.status(400).json({
      success: false,
      error: "For guest enquiries, full name, email, and phone number are required.",
    });
  }

  if (!title?.trim() || !requirements?.trim()) {
    return res.status(400).json({
      success: false,
      error: "Requirement title and details are mandatory.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const requestNumber = `BS-ENQ-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const { data: requestRecord, error: reqError } = await insforge.database
      .from("service_requests")
      .insert([
        {
          request_number: requestNumber,
          customer_id: customer_id || null,
          customer_business_id: customer_business_id || null,
          service_id: service_id || null,
          provider_business_id: provider_business_id || null,
          category_id: category_id || null,
          title: title.trim(),
          requirements: requirements.trim(),
          delivery_city: delivery_city?.trim() || null,
          target_timeline: target_timeline?.trim() || null,
          budget: budget ? Number.parseFloat(budget) : null,
          supporting_files: Array.isArray(supporting_files) ? supporting_files : [],
          guest_name: guest_name?.trim() || null,
          guest_email: guest_email?.trim() || null,
          guest_phone: guest_phone?.trim() || null,
          guest_business_name: guest_business_name?.trim() || null,
          status: "submitted",
        },
      ])
      .select()
      .single();

    if (reqError || !requestRecord) {
      return res.status(500).json({ success: false, error: reqError?.message || "Failed to submit request." });
    }

    // Handle Multi-Provider Broadcast association
    const targetProviders: string[] = [];
    if (provider_business_id) targetProviders.push(provider_business_id);
    if (Array.isArray(provider_business_ids)) {
      provider_business_ids.forEach((pId: string) => {
        if (pId && !targetProviders.includes(pId)) targetProviders.push(pId);
      });
    }

    if (targetProviders.length > 0) {
      const recipients = targetProviders.map((pId) => ({
        enquiry_id: requestRecord.id,
        provider_business_id: pId,
        status: "pending",
      }));
      await insforge.database.from("service_enquiry_recipients").insert(recipients);
    }

    // Insert Status History
    await insforge.database.from("service_request_status_history").insert([
      {
        request_id: requestRecord.id,
        new_status: "submitted",
        changed_by: customer_id || "00000000-0000-0000-0000-000000000000",
        note: customer_id ? "Service inquiry submitted by customer." : "Guest inquiry submitted with ref: " + requestNumber,
      },
    ]);

    return res.status(201).json({
      success: true,
      message: "Service inquiry submitted successfully.",
      data: requestRecord,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/business-services/guest-claim (Claim guest inquiries when registering / logging in)
router.post("/business-services/guest-claim", async (req, res) => {
  const { user_id, email, request_number } = req.body;
  if (!user_id || (!email && !request_number)) {
    return res.status(400).json({
      success: false,
      error: "User ID and either email or request_number are required to claim enquiries.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    let query = insforge.database
      .from("service_requests")
      .update({ customer_id: user_id, updated_at: new Date().toISOString() })
      .is("customer_id", null);

    if (request_number) {
      query = query.eq("request_number", request_number.trim());
    } else if (email) {
      query = query.ilike("guest_email", email.trim());
    }

    const { data: updated, error } = await query.select();
    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.json({
      success: true,
      message: `Successfully linked ${updated?.length || 0} enquiry(ies) to user account.`,
      claimed_count: updated?.length || 0,
      data: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/business-services/requests (Filter by customer_id or provider_business_id)
router.get("/business-services/requests", async (req, res) => {
  const { customer_id, provider_business_id, status } = req.query as {
    customer_id?: string;
    provider_business_id?: string;
    status?: string;
  };

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    let query = insforge.database
      .from("service_requests")
      .select("*, businesses(id, name, city, verification_level), business_services(id, title), business_service_categories(id, name)")
      .order("created_at", { ascending: false });

    if (customer_id) {
      query = query.eq("customer_id", customer_id);
    }
    if (provider_business_id) {
      query = query.eq("provider_business_id", provider_business_id);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/business-services/requests/:id (Details with Quotations)
router.get("/business-services/requests/:id", async (req, res) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data: request, error: reqErr } = await insforge.database
      .from("service_requests")
      .select("*, businesses(id, name, city, state, verification_level), business_services(id, title, pricing_model, starting_price), business_service_categories(id, name)")
      .eq("id", id)
      .single();

    if (reqErr || !request) {
      return res.status(404).json({ success: false, error: "Service request not found." });
    }

    // Quotations for this request
    const { data: quotations } = await insforge.database
      .from("service_request_quotations")
      .select("*, businesses(id, name, city, verification_level)")
      .eq("request_id", id)
      .order("created_at", { ascending: false });

    // Status History
    const { data: history } = await insforge.database
      .from("service_request_status_history")
      .select("*")
      .eq("request_id", id)
      .order("created_at", { ascending: true });

    return res.json({
      success: true,
      data: {
        ...request,
        quotations: quotations || [],
        history: history || [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/business-services/requests/:id/status (Lifecycle Update)
router.patch("/business-services/requests/:id/status", async (req, res) => {
  const { id } = req.params;
  const { new_status, changed_by, note } = req.body;

  const validStatuses = [
    "submitted", "viewed", "quoted", "accepted", "rejected", "in_progress", "completed", "cancelled"
  ];

  if (!new_status || !validStatuses.includes(new_status) || !changed_by) {
    return res.status(400).json({
      success: false,
      error: "Valid new_status and changed_by user ID are required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data: currentReq } = await insforge.database
      .from("service_requests")
      .select("status")
      .eq("id", id)
      .single();

    const previous_status = currentReq?.status || null;

    const { data: updated, error } = await insforge.database
      .from("service_requests")
      .update({
        status: new_status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    // History
    await insforge.database.from("service_request_status_history").insert([
      {
        request_id: id,
        previous_status,
        new_status,
        changed_by,
        note: note?.trim() || null,
      },
    ]);

    return res.json({
      success: true,
      message: `Service request updated to ${new_status}.`,
      data: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 5. Service Quotations & Negotiations
// ====================================================================

// POST /api/business-services/quotations (Provider submits quotation)
router.post("/business-services/quotations", async (req, res) => {
  const {
    request_id,
    provider_business_id,
    provider_user_id,
    quoted_price,
    scope_of_work,
    deliverables = [],
    turnaround_days = 3,
    valid_until,
    terms,
  } = req.body;

  if (!request_id || !provider_business_id || !provider_user_id || !quoted_price || !scope_of_work) {
    return res.status(400).json({
      success: false,
      error: "Request ID, provider details, quoted price, and scope of work are required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const quotationNumber = `SQT-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const { data: quotation, error: quoteError } = await insforge.database
      .from("service_request_quotations")
      .insert([
        {
          quotation_number: quotationNumber,
          request_id,
          provider_business_id,
          provider_user_id,
          quoted_price: Number.parseFloat(quoted_price),
          scope_of_work: scope_of_work.trim(),
          deliverables: Array.isArray(deliverables) ? deliverables : [],
          turnaround_days: Number.parseInt(turnaround_days, 10) || 3,
          valid_until: valid_until || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          terms: terms?.trim() || null,
          status: "submitted",
        },
      ])
      .select()
      .single();

    if (quoteError || !quotation) {
      return res.status(500).json({ success: false, error: quoteError?.message || "Failed to submit quotation." });
    }

    // Update request status to quoted
    await insforge.database
      .from("service_requests")
      .update({ status: "quoted", updated_at: new Date().toISOString() })
      .eq("id", request_id);

    // Insert history
    await insforge.database.from("service_request_status_history").insert([
      {
        request_id,
        previous_status: "submitted",
        new_status: "quoted",
        changed_by: provider_user_id,
        note: `Provider sent quotation ${quotationNumber} for ₹${Number(quoted_price).toLocaleString("en-IN")}.`,
      },
    ]);

    return res.status(201).json({
      success: true,
      message: "Service quotation submitted successfully.",
      data: quotation,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/business-services/quotations/:id/negotiations (Chat / counter-offers)
router.get("/business-services/quotations/:id/negotiations", async (req, res) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("service_quotation_negotiations")
      .select("*, users(id, full_name, email)")
      .eq("quotation_id", id)
      .order("created_at", { ascending: true });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/business-services/quotations/:id/negotiations (Send counter-offer / negotiation message)
router.post("/business-services/quotations/:id/negotiations", async (req, res) => {
  const { id } = req.params;
  const { sender_id, sender_role = "customer", message, proposed_price, proposed_turnaround_days } = req.body;

  if (!sender_id || !message?.trim()) {
    return res.status(400).json({ success: false, error: "Sender ID and message are required." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("service_quotation_negotiations")
      .insert([
        {
          quotation_id: id,
          sender_id,
          sender_role,
          message: message.trim(),
          proposed_price: proposed_price ? Number.parseFloat(proposed_price) : null,
          proposed_turnaround_days: proposed_turnaround_days ? Number.parseInt(proposed_turnaround_days, 10) : null,
        },
      ])
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/business-services/quotations/:id/respond (Customer accepts/rejects; accept creates project!)
router.post("/business-services/quotations/:id/respond", async (req, res) => {
  const { id } = req.params;
  const { customer_id, action } = req.body as { customer_id: string; action: "accept" | "reject" };

  if (!customer_id || !["accept", "reject"].includes(action)) {
    return res.status(400).json({
      success: false,
      error: "Customer ID and valid action (accept/reject) are required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data: quotation, error: quoteErr } = await insforge.database
      .from("service_request_quotations")
      .select("id, request_id, quotation_number, provider_business_id, quoted_price, scope_of_work, deliverables, turnaround_days")
      .eq("id", id)
      .single();

    if (quoteErr || !quotation) {
      return res.status(404).json({ success: false, error: "Quotation not found." });
    }

    const nextQuoteStatus = action === "accept" ? "accepted" : "rejected";
    const nextRequestStatus = action === "accept" ? "accepted" : "rejected";

    // 1. Update quotation
    await insforge.database
      .from("service_request_quotations")
      .update({ status: nextQuoteStatus, updated_at: new Date().toISOString() })
      .eq("id", id);

    // 2. Update request
    await insforge.database
      .from("service_requests")
      .update({ status: nextRequestStatus, updated_at: new Date().toISOString() })
      .eq("id", quotation.request_id);

    // 3. Status History
    await insforge.database.from("service_request_status_history").insert([
      {
        request_id: quotation.request_id,
        previous_status: "quoted",
        new_status: nextRequestStatus,
        changed_by: customer_id,
        note: `Customer ${action === "accept" ? "accepted" : "rejected"} quotation ${quotation.quotation_number}.`,
      },
    ]);

    // 4. If accepted: Atomically initialize Service Project & initial milestone
    let project = null;
    if (action === "accept") {
      const projectNumber = `PRJ-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

      // Fetch request title
      const { data: reqData } = await insforge.database
        .from("service_requests")
        .select("title, service_id")
        .eq("id", quotation.request_id)
        .single();

      const { data: newProj, error: projErr } = await insforge.database
        .from("service_projects")
        .insert([
          {
            project_number: projectNumber,
            request_id: quotation.request_id,
            quotation_id: quotation.id,
            customer_id,
            provider_business_id: quotation.provider_business_id,
            service_id: reqData?.service_id || null,
            title: reqData?.title || "Professional Business Service Project",
            scope_of_work: quotation.scope_of_work,
            agreed_price: quotation.quoted_price,
            status: "project_created",
            start_date: new Date().toISOString().split("T")[0],
            target_completion_date: new Date(Date.now() + (quotation.turnaround_days || 7) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          },
        ])
        .select()
        .single();

      if (!projErr && newProj) {
        project = newProj;

        // Initialize Milestone 1
        await insforge.database.from("service_project_milestones").insert([
          {
            project_id: newProj.id,
            title: "Project Initiation & Requirement Review",
            description: "Initial alignment, document exchange, and project kickoff.",
            amount: quotation.quoted_price,
            due_date: newProj.target_completion_date,
            status: "in_progress",
          },
        ]);

        // Record Project History
        await insforge.database.from("service_project_status_history").insert([
          {
            project_id: newProj.id,
            new_status: "project_created",
            changed_by: customer_id,
            note: `Project initialized upon acceptance of quotation ${quotation.quotation_number}.`,
          },
        ]);
      }
    }

    return res.json({
      success: true,
      message: `Quotation ${action === "accept" ? "accepted and project created" : "rejected"}.`,
      project,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 6. Service Projects, Milestones & Deliverables
// ====================================================================

// GET /api/business-services/projects (Customer or Provider list)
router.get("/business-services/projects", async (req, res) => {
  const { customer_id, provider_business_id, status } = req.query as {
    customer_id?: string;
    provider_business_id?: string;
    status?: string;
  };

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    let query = insforge.database
      .from("service_projects")
      .select("*, businesses(id, name, city, verification_level), users(id, full_name, email)")
      .order("created_at", { ascending: false });

    if (customer_id) query = query.eq("customer_id", customer_id);
    if (provider_business_id) query = query.eq("provider_business_id", provider_business_id);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/business-services/projects/:id (Details with Milestones, Deliverables & History)
router.get("/business-services/projects/:id", async (req, res) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data: project, error: projErr } = await insforge.database
      .from("service_projects")
      .select("*, businesses(id, name, city, state, phone, email, verification_level), users(id, full_name, email)")
      .eq("id", id)
      .single();

    if (projErr || !project) {
      return res.status(404).json({ success: false, error: "Project not found." });
    }

    // Milestones
    const { data: milestones } = await insforge.database
      .from("service_project_milestones")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: true });

    // Deliverables
    const { data: deliverables } = await insforge.database
      .from("service_project_deliverables")
      .select("*")
      .eq("project_id", id)
      .order("submitted_at", { ascending: false });

    // Status History
    const { data: history } = await insforge.database
      .from("service_project_status_history")
      .select("*, users(full_name)")
      .eq("project_id", id)
      .order("created_at", { ascending: true });

    // Review if exists
    const { data: review } = await insforge.database
      .from("service_reviews")
      .select("*")
      .eq("project_id", id)
      .maybeSingle();

    return res.json({
      success: true,
      data: {
        ...project,
        milestones: milestones || [],
        deliverables: deliverables || [],
        history: history || [],
        review: review || null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/business-services/projects/:id/status (Lifecycle Progression)
router.patch("/business-services/projects/:id/status", async (req, res) => {
  const { id } = req.params;
  const { new_status, changed_by, note } = req.body;

  const validStatuses = [
    "project_created", "awaiting_start", "in_progress", "waiting_for_customer",
    "under_review", "revision_requested", "completed", "cancelled", "disputed"
  ];

  if (!new_status || !validStatuses.includes(new_status) || !changed_by) {
    return res.status(400).json({
      success: false,
      error: "Valid new_status and changed_by user ID are required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data: currentProj } = await insforge.database
      .from("service_projects")
      .select("status")
      .eq("id", id)
      .single();

    const previous_status = currentProj?.status || null;

    const updates: Record<string, any> = {
      status: new_status,
      updated_at: new Date().toISOString(),
    };
    if (new_status === "completed") {
      updates.completed_at = new Date().toISOString();
    }

    const { data: updated, error } = await insforge.database
      .from("service_projects")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    // History
    await insforge.database.from("service_project_status_history").insert([
      {
        project_id: id,
        previous_status,
        new_status,
        changed_by,
        note: note?.trim() || `Project status updated to ${new_status}.`,
      },
    ]);

    return res.json({
      success: true,
      message: `Project transitioned to ${new_status}.`,
      data: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/business-services/projects/:id/milestones
router.post("/business-services/projects/:id/milestones", async (req, res) => {
  const { id } = req.params;
  const { title, description, amount, due_date } = req.body;

  if (!title?.trim()) {
    return res.status(400).json({ success: false, error: "Milestone title is required." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("service_project_milestones")
      .insert([
        {
          project_id: id,
          title: title.trim(),
          description: description?.trim() || null,
          amount: amount ? Number.parseFloat(amount) : 0,
          due_date: due_date || null,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, message: "Milestone created.", data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/business-services/milestones/:id (Update milestone status)
router.patch("/business-services/milestones/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["pending", "in_progress", "completed", "approved"].includes(status)) {
    return res.status(400).json({ success: false, error: "Invalid milestone status." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const updates: Record<string, any> = { status };
    if (status === "completed" || status === "approved") {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await insforge.database
      .from("service_project_milestones")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, message: `Milestone status set to ${status}.`, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/business-services/projects/:id/deliverables (Provider uploads deliverable)
router.post("/business-services/projects/:id/deliverables", async (req, res) => {
  const { id } = req.params;
  const { milestone_id, title, file_url, file_key, description } = req.body;

  if (!title?.trim() || !file_url) {
    return res.status(400).json({ success: false, error: "Deliverable title and file URL are required." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("service_project_deliverables")
      .insert([
        {
          project_id: id,
          milestone_id: milestone_id || null,
          title: title.trim(),
          file_url,
          file_key: file_key || null,
          description: description?.trim() || null,
          status: "submitted",
        },
      ])
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    // Move project to 'under_review'
    await insforge.database
      .from("service_projects")
      .update({ status: "under_review", updated_at: new Date().toISOString() })
      .eq("id", id);

    return res.status(201).json({
      success: true,
      message: "Deliverable uploaded for customer review.",
      data,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/business-services/deliverables/:id/review (Customer reviews deliverable)
router.patch("/business-services/deliverables/:id/review", async (req, res) => {
  const { id } = req.params;
  const { status, customer_feedback } = req.body;

  if (!["approved", "revision_requested"].includes(status)) {
    return res.status(400).json({ success: false, error: "Status must be 'approved' or 'revision_requested'." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("service_project_deliverables")
      .update({
        status,
        customer_feedback: customer_feedback?.trim() || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    // Update parent project status
    if (data?.project_id) {
      const nextProjStatus = status === "approved" ? "in_progress" : "revision_requested";
      await insforge.database
        .from("service_projects")
        .update({ status: nextProjStatus, updated_at: new Date().toISOString() })
        .eq("id", data.project_id);
    }

    return res.json({ success: true, message: `Deliverable ${status}.`, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 7. Verified Reviews & Dispute Complaints
// ====================================================================

// POST /api/business-services/reviews (Verified Customer Review - Guarded)
router.post("/business-services/reviews", async (req, res) => {
  const { project_id, customer_id, rating, review_text } = req.body;

  if (!project_id || !customer_id || !rating || !review_text?.trim()) {
    return res.status(400).json({
      success: false,
      error: "Project ID, customer ID, rating (1-5), and review text are required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    // 1. Verify project exists and is in 'completed' status
    const { data: project, error: projErr } = await insforge.database
      .from("service_projects")
      .select("id, status, customer_id, provider_business_id, service_id")
      .eq("id", project_id)
      .single();

    if (projErr || !project) {
      return res.status(404).json({ success: false, error: "Associated service project not found." });
    }

    if (project.status !== "completed") {
      return res.status(400).json({
        success: false,
        error: "Verified reviews can only be submitted after project completion.",
      });
    }

    if (project.customer_id !== customer_id) {
      return res.status(403).json({
        success: false,
        error: "Only the verified customer of this project can submit a review.",
      });
    }

    // 2. Insert verified review
    const { data, error } = await insforge.database
      .from("service_reviews")
      .insert([
        {
          project_id,
          service_id: project.service_id,
          customer_id,
          provider_business_id: project.provider_business_id,
          rating: Number.parseInt(rating, 10),
          review_text: review_text.trim(),
          is_verified: true,
        },
      ])
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({
      success: true,
      message: "Verified review submitted successfully.",
      data,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/business-services/reviews
router.get("/business-services/reviews", async (req, res) => {
  const { service_id, provider_business_id } = req.query as {
    service_id?: string;
    provider_business_id?: string;
  };

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    let query = insforge.database
      .from("service_reviews")
      .select("*, users(id, full_name)")
      .order("created_at", { ascending: false });

    if (service_id) query = query.eq("service_id", service_id);
    if (provider_business_id) query = query.eq("provider_business_id", provider_business_id);

    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/business-services/complaints (Log dispute/complaint)
router.post("/business-services/complaints", async (req, res) => {
  const {
    project_id,
    request_id,
    complainant_user_id,
    provider_business_id,
    complaint_type,
    description,
  } = req.body;

  if (!complainant_user_id || !provider_business_id || !complaint_type || !description?.trim()) {
    return res.status(400).json({
      success: false,
      error: "Complainant ID, provider ID, complaint type, and description are required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const complaintNumber = `DISP-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const { data, error } = await insforge.database
      .from("service_complaints")
      .insert([
        {
          complaint_number: complaintNumber,
          project_id: project_id || null,
          request_id: request_id || null,
          complainant_user_id,
          provider_business_id,
          complaint_type,
          description: description.trim(),
          status: "open",
        },
      ])
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    // Flag project as disputed if linked
    if (project_id) {
      await insforge.database
        .from("service_projects")
        .update({ status: "disputed", updated_at: new Date().toISOString() })
        .eq("id", project_id);
    }

    return res.status(201).json({
      success: true,
      message: "Complaint registered for arbitration.",
      data,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/business-services/complaints
router.get("/business-services/complaints", async (req, res) => {
  const { provider_business_id, status } = req.query as {
    provider_business_id?: string;
    status?: string;
  };

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    let query = insforge.database
      .from("service_complaints")
      .select("*, businesses(id, name), users(id, full_name, email)")
      .order("created_at", { ascending: false });

    if (provider_business_id) query = query.eq("provider_business_id", provider_business_id);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/business-services/complaints/:id/resolve (Admin arbitration)
router.patch("/business-services/complaints/:id/resolve", async (req, res) => {
  const { id } = req.params;
  const { status, resolution_notes, admin_id } = req.body;

  if (!["resolved", "dismissed"].includes(status) || !admin_id) {
    return res.status(400).json({
      success: false,
      error: "Status ('resolved' or 'dismissed') and admin_id are required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("service_complaints")
      .update({
        status,
        resolution_notes: resolution_notes?.trim() || null,
        admin_id,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, message: `Dispute marked as ${status}.`, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 8. Admin Panel Ecosystem Management (17 Subsections)
// ====================================================================

// GET /api/business-services/admin/stats
router.get("/business-services/admin/stats", async (_req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { count: totalServices } = await insforge.database
      .from("business_services")
      .select("*", { count: "exact", head: true });

    const { count: totalProviders } = await insforge.database
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .eq("business_type", "service_provider");

    const { count: totalRequests } = await insforge.database
      .from("service_requests")
      .select("*", { count: "exact", head: true });

    const { count: totalQuotations } = await insforge.database
      .from("service_request_quotations")
      .select("*", { count: "exact", head: true });

    const { count: totalProjects } = await insforge.database
      .from("service_projects")
      .select("*", { count: "exact", head: true });

    const { count: totalCategories } = await insforge.database
      .from("business_service_categories")
      .select("*", { count: "exact", head: true });

    const { count: totalComplaints } = await insforge.database
      .from("service_complaints")
      .select("*", { count: "exact", head: true });

    const { count: pendingVerifications } = await insforge.database
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .eq("business_type", "service_provider")
      .eq("verification_level", "unverified");

    return res.json({
      success: true,
      data: {
        totalServices: totalServices || 0,
        totalProviders: totalProviders || 0,
        totalRequests: totalRequests || 0,
        totalQuotations: totalQuotations || 0,
        totalProjects: totalProjects || 0,
        totalCategories: totalCategories || 11,
        totalComplaints: totalComplaints || 0,
        pendingVerifications: pendingVerifications || 0,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/business-services/admin/services/:id/moderate
router.patch("/business-services/admin/services/:id/moderate", async (req, res) => {
  const { id } = req.params;
  const { is_active, moderation_status = "approved", admin_id, reason } = req.body;

  if (typeof is_active !== "boolean" || !admin_id) {
    return res.status(400).json({ success: false, error: "is_active boolean and admin_id are required." });
  }

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("business_services")
      .update({
        is_active,
        moderation_status,
        moderation_notes: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    // Audit log
    await insforge.database.from("admin_audit_logs").insert([
      {
        admin_id,
        action: is_active ? "SERVICE_APPROVED" : "SERVICE_SUSPENDED",
        target_type: "business_service",
        target_id: id,
        metadata: { reason: reason || null, moderation_status },
      },
    ]);

    return res.json({ success: true, message: `Service listing status updated to ${is_active ? "active" : "suspended"}.`, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/business-services/admin/requests (Admin Enquiries & RFQ)
router.get("/business-services/admin/requests", async (req, res) => {
  const { status, search } = req.query as { status?: string; search?: string };
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    let query = insforge.database
      .from("service_requests")
      .select("*, businesses(id, name, city), business_services(id, title), business_service_categories(id, name)")
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (search) query = query.or(`request_number.ilike.%${search.trim()}%,title.ilike.%${search.trim()}%`);

    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/business-services/admin/quotations
router.get("/business-services/admin/quotations", async (req, res) => {
  const { status } = req.query as { status?: string };
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    let query = insforge.database
      .from("service_request_quotations")
      .select("*, businesses(id, name, city), service_requests(id, request_number, title)")
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/business-services/admin/projects
router.get("/business-services/admin/projects", async (req, res) => {
  const { status } = req.query as { status?: string };
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    let query = insforge.database
      .from("service_projects")
      .select("*, businesses(id, name, city), users(id, full_name, email)")
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/business-services/admin/reviews
router.get("/business-services/admin/reviews", async (_req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("service_reviews")
      .select("*, businesses(id, name), business_services(id, title), users(id, full_name, email)")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/business-services/admin/reviews/:id/moderate
router.patch("/business-services/admin/reviews/:id/moderate", async (req, res) => {
  const { id } = req.params;
  const { is_verified } = req.body;

  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("service_reviews")
      .update({ is_verified: Boolean(is_verified) })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, message: `Review verification status set to ${is_verified}.`, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/business-services/admin/audit-logs
router.get("/business-services/admin/audit-logs", async (_req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) return res.status(503).json({ success: false, error: "Database client unavailable." });

  try {
    const { data, error } = await insforge.database
      .from("service_provider_verification_history")
      .select("*, businesses(id, name)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
