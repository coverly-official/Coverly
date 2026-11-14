import { createAdminClient } from "@insforge/sdk";

const BASE_URL = "https://4vwfw2w8.ap-southeast.insforge.app";
const API_KEY = "ik_1d1fb7f3feb4e7723e653ef844b24492486caa96de0940f2e658c2f30cd392a1";

// Database client that is NEVER signed into
function getDb() {
  return createAdminClient({ baseUrl: BASE_URL, apiKey: API_KEY }).database;
}

// Temporary auth client for signups
function getAuth() {
  return createAdminClient({ baseUrl: BASE_URL, apiKey: API_KEY }).auth;
}

async function seed() {
  console.log("🚀 Starting COVERLY Realistic Demo Data Seeding...");
  const db = getDb();
  const auth = getAuth();

  const demoUsers = [
    {
      email: "admin@coverly.com",
      password: "Password@123",
      full_name: "Coverly System Administrator",
      phone: "+919999900001",
      role: "admin",
    },
    {
      email: "supplier@texcraft.in",
      password: "Password@123",
      full_name: "Vikram Singhania",
      phone: "+919876500001",
      role: "manufacturer",
      business: {
        name: "TexCraft Mills & Garments Pvt Ltd",
        slug: "texcraft-mills-garments",
        business_type: "manufacturer",
        city: "Surat",
        state: "Gujarat",
        pincode: "395002",
        gstin: "24AAACT1234F1Z8",
        pan: "AAACT1234F",
        verification_level: "registration_checked",
        factory_size_sqft: 45000,
        production_capacity_monthly: "250,000 units",
        export_ready: true,
      },
    },
    {
      email: "wholesaler@apexdistrib.in",
      password: "Password@123",
      full_name: "Ramesh Gupta",
      phone: "+919876500002",
      role: "wholesaler",
      business: {
        name: "Apex Wholesale Goods & Logistics Hub",
        slug: "apex-wholesale-goods-hub",
        business_type: "wholesaler",
        city: "Delhi",
        state: "Delhi",
        pincode: "110006",
        gstin: "07AAACR5678G1Z2",
        pan: "AAACR5678G",
        verification_level: "document_verified",
        factory_size_sqft: 20000,
        production_capacity_monthly: "75,000 cartons",
        export_ready: false,
      },
    },
    {
      email: "buyer@bharatretail.in",
      password: "Password@123",
      full_name: "Ananya Sharma",
      phone: "+919876500003",
      role: "buyer",
      business: {
        name: "Bharat Retail Stores & Sourcing Corp",
        slug: "bharat-retail-stores-sourcing",
        business_type: "buyer",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        gstin: "27AAACB9012H1Z5",
        pan: "AAACB9012H",
        verification_level: "document_verified",
      },
    },
    {
      email: "legal@taxadvisor.in",
      password: "Password@123",
      full_name: "Pooja Mehta, CA",
      phone: "+919876500004",
      role: "service_provider",
      business: {
        name: "TaxKraft Corporate Legal & CA Advisors",
        slug: "taxkraft-corporate-legal-ca",
        business_type: "service_provider",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
        gstin: "29AAACT3456J1Z9",
        pan: "AAACT3456J",
        verification_level: "registration_checked",
      },
    },
  ];

  const businessIds = {};

  for (const u of demoUsers) {
    console.log(`Processing user: ${u.email}...`);
    let userId = null;

    // Check if user exists in auth
    const { data: signInData } = await auth.signInWithPassword({
      email: u.email,
      password: u.password,
    });

    if (signInData?.user?.id) {
      userId = signInData.user.id;
    } else {
      const { data: signUpData } = await auth.signUp({
        email: u.email,
        password: u.password,
      });
      if (signUpData?.user?.id) {
        userId = signUpData.user.id;
      }
    }

    if (!userId) {
      console.error(`Could not initialize auth user for ${u.email}`);
      continue;
    }

    // Check if in public.users
    const { data: existingPublicUser } = await db
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!existingPublicUser) {
      await db.from("users").insert([
        {
          id: userId,
          email: u.email,
          full_name: u.full_name,
          phone: u.phone,
          is_active: true,
        },
      ]);
    }

    // Role assignment
    const { data: existingRole } = await db
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", u.role)
      .maybeSingle();

    if (!existingRole) {
      await db.from("user_roles").insert([
        {
          user_id: userId,
          role: u.role,
          is_primary: true,
        },
      ]);
    }

    // Setup Business using CLEAN db client
    if (u.business) {
      let bId = null;
      const { data: existingBus } = await db
        .from("businesses")
        .select("id")
        .eq("slug", u.business.slug)
        .maybeSingle();

      if (existingBus) {
        bId = existingBus.id;
      } else {
        const { data: newBus, error: bErr } = await db
          .from("businesses")
          .insert([
            {
              name: u.business.name,
              slug: u.business.slug,
              business_type: u.business.business_type,
              city: u.business.city,
              state: u.business.state,
              pincode: u.business.pincode,
              gstin: u.business.gstin,
              pan: u.business.pan,
              verification_level: u.business.verification_level,
              is_active: true,
            },
          ])
          .select("id")
          .single();

        if (bErr) {
          console.error("Error creating business:", bErr.message);
        } else {
          bId = newBus.id;
        }
      }

      if (bId) {
        businessIds[u.business.slug] = bId;

        // Member
        const { data: existingMember } = await db
          .from("business_members")
          .select("id")
          .eq("business_id", bId)
          .eq("user_id", userId)
          .maybeSingle();

        if (!existingMember) {
          await db.from("business_members").insert([
            {
              business_id: bId,
              user_id: userId,
              role_in_business: "owner",
            },
          ]);
        }

        // Specific profiles
        if (u.business.business_type === "manufacturer" || u.business.business_type === "wholesaler") {
          const { data: existingSupp } = await db
            .from("supplier_profiles")
            .select("id")
            .eq("business_id", bId)
            .maybeSingle();

          if (!existingSupp) {
            await db.from("supplier_profiles").insert([
              {
                business_id: bId,
                factory_size_sqft: u.business.factory_size_sqft,
                production_capacity_monthly: u.business.production_capacity_monthly,
                export_ready: u.business.export_ready,
              },
            ]);
          }
        } else if (u.business.business_type === "buyer") {
          const { data: existingBuyer } = await db
            .from("buyer_profiles")
            .select("id")
            .eq("business_id", bId)
            .maybeSingle();

          if (!existingBuyer) {
            await db.from("buyer_profiles").insert([
              {
                business_id: bId,
              },
            ]);
          }
        }
      }
    }
  }

  const texcraftId = businessIds["texcraft-mills-garments"];
  const apexId = businessIds["apex-wholesale-goods-hub"];
  const taxkraftId = businessIds["taxkraft-corporate-legal-ca"];

  console.log("Resolved Business IDs:", { texcraftId, apexId, taxkraftId });

  // 2. Seed Realistic Products
  if (texcraftId && apexId) {
    console.log("Seeding wholesale products...");
    const products = [
      {
        business_id: texcraftId,
        category_id: "cotton-tshirts",
        title: "100% Combed Cotton Plain T-Shirts (Round Neck, 180 GSM)",
        slug: "100-combed-cotton-plain-t-shirts-round-neck-180-gsm",
        description: "Export-grade 100% combed cotton round-neck plain T-shirts, 180 GSM pre-shrunk fabric, bio-washed with double-needle stitching on sleeves and bottom hems. Ideal for brand merchandising, corporate uniforms, and bulk retail across India.",
        moq: 500,
        unit: "pieces",
        indicative_price: 145.0,
        tiered_pricing: [
          { min_qty: 500, price: 145.0 },
          { min_qty: 2000, price: 132.0 },
          { min_qty: 5000, price: 118.0 },
        ],
        specifications: {
          gsm: 180,
          fabric: "100% Combed Compact Cotton",
          wash: "Bio-Washed & Silicon Softened",
          colors_available: 24,
          sizes: "S, M, L, XL, XXL",
          shrinkage: "Under 3%",
        },
        hs_code: "61091000",
        is_active: true,
      },
      {
        business_id: apexId,
        category_id: "corrugated-boxes",
        title: "Heavy-Duty 5-Ply Corrugated Shipping Boxes (12x10x8 inch)",
        slug: "heavy-duty-5-ply-corrugated-shipping-boxes-12x10x8",
        description: "Industrial grade 5-ply corrugated packing boxes engineered for e-commerce dispatch, heavy storage, and export freight. Bursting strength 14 kg/sq.cm, made with premium virgin kraft paper liners.",
        moq: 1000,
        unit: "boxes",
        indicative_price: 24.0,
        tiered_pricing: [
          { min_qty: 1000, price: 24.0 },
          { min_qty: 5000, price: 21.5 },
          { min_qty: 20000, price: 18.5 },
        ],
        specifications: {
          ply: 5,
          dimensions: "12 x 10 x 8 inches",
          bursting_factor: "18 BF",
          material: "Kraft Flute B + C",
          holding_capacity: "Up to 15 kg",
        },
        hs_code: "48191010",
        is_active: true,
      },
      {
        business_id: texcraftId,
        category_id: "mild-steel-rods",
        title: "Fe-550D TMT Rebar Rods (12mm High Ductility, Primary Billet)",
        slug: "fe-550d-tmt-rebar-rods-12mm-high-ductility",
        description: "BIS certified Grade Fe-550D Thermo-Mechanically Treated (TMT) steel rebars. Superior earthquake resistance, corrosion protection, and optimal bendability for infrastructure and commercial RCC framing.",
        moq: 5,
        unit: "Metric Tons",
        indicative_price: 54000.0,
        tiered_pricing: [
          { min_qty: 5, price: 54000.0 },
          { min_qty: 25, price: 51500.0 },
          { min_qty: 100, price: 49000.0 },
        ],
        specifications: {
          diameter: "12 mm",
          grade: "Fe-550D",
          standard: "IS 1786:2008",
          yield_strength: "550 MPa",
          elongation: "14.5%",
        },
        hs_code: "72142090",
        is_active: true,
      },
      {
        business_id: apexId,
        category_id: "cotton-tshirts",
        title: "Heavy-Duty Cut-Resistant Industrial Nitrile Work Gloves",
        slug: "heavy-duty-cut-resistant-industrial-nitrile-work-gloves",
        description: "EN388 Level 5 cut-resistant protective gloves with textured micro-foam nitrile palm coating. Excellent grip in oily conditions and abrasion resistance for manufacturing floor operators.",
        moq: 250,
        unit: "pairs",
        indicative_price: 68.0,
        tiered_pricing: [
          { min_qty: 250, price: 68.0 },
          { min_qty: 1000, price: 58.0 },
        ],
        specifications: {
          cut_level: "EN388 Level 5",
          coating: "Sandy Nitrile",
          gauge: "13 Gauge HPPE liner",
        },
        hs_code: "61161000",
        is_active: true,
      },
      {
        business_id: texcraftId,
        category_id: "corrugated-boxes",
        title: "Vitrified Glazed Floor Tiles (600x600mm, High Gloss Finish)",
        slug: "vitrified-glazed-floor-tiles-600x600mm",
        description: "Premium double charge glazed vitrified floor tiles with nano-polished scratch resistance. Zero water absorption, stain-proof, and designed for high-traffic commercial establishments.",
        moq: 150,
        unit: "boxes",
        indicative_price: 420.0,
        tiered_pricing: [
          { min_qty: 150, price: 420.0 },
          { min_qty: 500, price: 385.0 },
        ],
        specifications: {
          size: "600 x 600 mm",
          coverage_per_box: "15.5 sq.ft (4 tiles)",
          finish: "High Gloss Nano Polish",
          water_absorption: "< 0.05%",
        },
        hs_code: "69072100",
        is_active: true,
      },
    ];

    for (const p of products) {
      const { data: existingProd } = await db
        .from("products")
        .select("id")
        .eq("slug", p.slug)
        .maybeSingle();

      if (!existingProd) {
        const { error: pErr } = await db.from("products").insert([p]);
        if (pErr) console.error("Error inserting product:", p.title, pErr.message);
        else console.log("✓ Inserted product:", p.title);
      } else {
        console.log("Product already exists:", p.title);
      }
    }
  }

  // 3. Seed Realistic Business Services
  if (taxkraftId) {
    console.log("Seeding business services...");
    const services = [
      {
        business_id: taxkraftId,
        category_id: "0610ec8a-72ac-49cc-afdb-29e6e4ec3580", // Business Registration & Legal
        subcategory_id: "62838b3a-e44a-42c8-bd58-16881b9cf7c6", // Company Registration
        title: "Private Limited Company Incorporation Package (All-Inclusive)",
        slug: "private-limited-company-incorporation-package",
        short_description: "End-to-end MCA filing including DIN, DSC, RUN name approval, PAN, TAN, and certificate of incorporation.",
        full_description: "Complete incorporation service for startups and SMEs. Our team of experienced Chartered Accountants and Company Secretaries handles name reservation, SPICe+ form filings, Articles of Association (AOA), Memorandum of Association (MOA), and bank account setup guidance within 7 business days.",
        deliverables: [
          "Certificate of Incorporation (COI)",
          "2 Director Identification Numbers (DIN)",
          "Digital Signature Certificates (DSC Class 3)",
          "Company PAN & TAN Cards",
          "Draft MOA & AOA",
          "Free First Year MCA Compliance Consultation",
        ],
        pricing_model: "fixed",
        starting_price: 6499.0,
        turnaround_days: 7,
        is_active: true,
      },
      {
        business_id: taxkraftId,
        category_id: "0610ec8a-72ac-49cc-afdb-29e6e4ec3580",
        subcategory_id: "7c6f7c9b-8872-4a2f-9402-e2dc9d215bbd", // GST Registration
        title: "Fast-Track GST Registration with 100% Approval Guarantee",
        slug: "fast-track-gst-registration-with-guarantee",
        short_description: "Hassle-free GSTIN issuance for manufacturers, wholesalers, and e-commerce sellers within 3 working days.",
        full_description: "Get your business GST registered with complete documentation assistance. We review your rent agreements, electricity bills, and NOCs to ensure instant approval without tax department queries.",
        deliverables: [
          "GST Identification Number (GSTIN) Certificate",
          "HSN / SAC Code Mapping for all Products",
          "Invoicing Setup Guidance & E-Way Bill Activation",
          "First Month GSTR-1 & GSTR-3B Filing Included",
        ],
        pricing_model: "fixed",
        starting_price: 1999.0,
        turnaround_days: 3,
        is_active: true,
      },
      {
        business_id: taxkraftId,
        category_id: "2181d3a5-2038-4385-90cb-1464c7e7a9a1", // Accounting & Finance
        subcategory_id: "3af4ee89-bef4-4d8a-8a1c-28b9fef1c6a1", // GST Return Filing
        title: "Monthly Corporate Bookkeeping & GST Return Filing Retainer",
        slug: "monthly-corporate-bookkeeping-gst-return-filing",
        short_description: "Dedicated CA team managing Tally/Zoho ledger entry, ITC reconciliation, and timely GSTR-1/3B filing.",
        full_description: "Outsource your accounting headaches. We handle monthly ledger entries, bank reconciliations, vendor invoice verification, 2B ITC mismatch resolution, and statutory compliance so you never pay GST late fees.",
        deliverables: [
          "Monthly Profit & Loss and Balance Sheet Statements",
          "Timely GSTR-1 and GSTR-3B Filings",
          "GSTR-2B Input Tax Credit (ITC) Reconciliation",
          "Dedicated Account Manager & Phone Support",
        ],
        pricing_model: "hourly",
        starting_price: 3499.0,
        turnaround_days: 5,
        is_active: true,
      },
    ];

    for (const s of services) {
      const { data: existingServ } = await db
        .from("business_services")
        .select("id")
        .eq("slug", s.slug)
        .maybeSingle();

      if (!existingServ) {
        const { error: sErr } = await db.from("business_services").insert([s]);
        if (sErr) console.error("Error inserting service:", s.title, sErr.message);
        else console.log("✓ Inserted service:", s.title);
      } else {
        console.log("Service already exists:", s.title);
      }
    }
  }

  console.log("🎉 All Demo Data Seeding Completed Successfully!");
}

seed().catch(console.error);
