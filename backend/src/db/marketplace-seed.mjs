import { createAdminClient } from "@insforge/sdk";

const BASE_URL = process.env.INSFORGE_BASE_URL || "";
const API_KEY = process.env.INSFORGE_API_KEY || "";
if (!BASE_URL || !API_KEY) {
  throw new Error("INSFORGE_BASE_URL and INSFORGE_API_KEY environment variables are required.");
}

const insforge = createAdminClient({ baseUrl: BASE_URL, apiKey: API_KEY });
const db = insforge.database;

// Summary stats for the final audit report
const report = {
  categories: { created: 0, skipped: 0 },
  subcategories: { created: 0, skipped: 0 },
  suppliers: { created: 0, skipped: 0 },
  products: { created: 0, skipped: 0 },
  serviceProviders: { created: 0, skipped: 0 },
  businessServices: { created: 0, skipped: 0 },
  sampleRfqs: { created: 0, skipped: 0 },
  tablesAffected: new Set(),
};

async function seed() {
  console.log("====================================================================");
  console.log("COVERLY Marketplace Data Architecture — Realistic Content Generator");
  console.log("====================================================================");

  // ------------------------------------------------------------------
  // 1. PRODUCT CATEGORIES & SUBCATEGORIES
  // ------------------------------------------------------------------
  console.log("\n[1/6] Seeding Primary Product Categories & Subcategories...");

  const categoryDefinitions = [
    {
      id: "agriculture-products",
      label: "Agriculture Products",
      unit: "Metric Ton",
      default_qty: 10,
      description: "Certified hybrid seeds, agro commodities, non-basmati grains, bulk pulses, and organic spices.",
      subcategories: [
        { name: "Agro Seeds & Seedlings", slug: "agro-seeds-seedlings" },
        { name: "Bulk Grains & Pulses", slug: "bulk-grains-pulses" },
        { name: "Spices & Whole Condiments", slug: "spices-whole-condiments" },
        { name: "Commercial Cash Crops", slug: "commercial-cash-crops" },
      ],
    },
    {
      id: "food-beverages",
      label: "Food & Beverages",
      unit: "kg",
      default_qty: 500,
      description: "Bulk edible oils, commercial dairy powders, refined sugars, and wholesale bakery ingredients.",
      subcategories: [
        { name: "Edible Oils & Fats", slug: "edible-oils-fats" },
        { name: "Dairy Ingredients & Powders", slug: "dairy-ingredients-powders" },
        { name: "Sweeteners & Cane Sugar", slug: "sweeteners-cane-sugar" },
        { name: "Industrial Flours & Starches", slug: "industrial-flours-starches" },
      ],
    },
    {
      id: "packaging-materials",
      label: "Packaging Materials",
      unit: "pc",
      default_qty: 1000,
      description: "Corrugated master cartons, woven HDPE bulk sacks, industrial stretch films, and BOPP packing tapes.",
      subcategories: [
        { name: "Corrugated Cartons & Boxes", slug: "corrugated-cartons-boxes" },
        { name: "HDPE / PP Woven Sacks", slug: "hdpe-pp-woven-sacks" },
        { name: "Stretch Wrap & Shrink Films", slug: "stretch-wrap-shrink-films" },
        { name: "Industrial Tapes & Strapping", slug: "industrial-tapes-strapping" },
      ],
    },
    {
      id: "industrial-machinery",
      label: "Industrial Machinery",
      unit: "unit",
      default_qty: 1,
      description: "Automated packaging machinery, continuous band sealers, liquid bottle fillers, and 3-phase induction motors.",
      subcategories: [
        { name: "Packaging & Sealing Machinery", slug: "packaging-sealing-machinery" },
        { name: "Filling & Capping Equipment", slug: "filling-capping-equipment" },
        { name: "Electric Motors & Gearboxes", slug: "electric-motors-gearboxes" },
        { name: "Material Handling & Conveyors", slug: "material-handling-conveyors" },
      ],
    },
    {
      id: "electrical-equipment",
      label: "Electrical Equipment",
      unit: "meter",
      default_qty: 100,
      description: "Armoured HT/LT copper power cables, low-voltage distribution switchgear, and warehouse LED high-bay fixtures.",
      subcategories: [
        { name: "Armoured Power Cables", slug: "armoured-power-cables" },
        { name: "LT Distribution Panels", slug: "lt-distribution-panels" },
        { name: "Industrial High-Bay LED Lights", slug: "industrial-high-bay-led" },
        { name: "Switchgear & Circuit Breakers", slug: "switchgear-circuit-breakers" },
      ],
    },
    {
      id: "construction-materials",
      label: "Construction Materials",
      unit: "Metric Ton",
      default_qty: 15,
      description: "Grade 53 Ordinary Portland Cement, IS 1786 Fe-550D TMT rebars, AAC precast blocks, and manufactured M-Sand.",
      subcategories: [
        { name: "Ordinary Portland Cement (OPC)", slug: "ordinary-portland-cement" },
        { name: "TMT Rebars & Structural Steel", slug: "tmt-rebars-structural-steel" },
        { name: "AAC Blocks & Precast Bricks", slug: "aac-blocks-precast-bricks" },
        { name: "Sand & Quarry Aggregates", slug: "sand-quarry-aggregates" },
      ],
    },
    {
      id: "chemicals",
      label: "Chemicals",
      unit: "kg",
      default_qty: 1000,
      description: "Industrial caustic soda flakes, surfactant LABSA 90%, water treatment flocculants, and basic chemical intermediates.",
      subcategories: [
        { name: "Alkalis & Basic Chemicals", slug: "alkalis-basic-chemicals" },
        { name: "Surfactants & Detergent Bases", slug: "surfactants-detergent-bases" },
        { name: "Water Treatment Chemicals", slug: "water-treatment-chemicals" },
        { name: "Industrial Solvents", slug: "industrial-solvents" },
      ],
    },
    {
      id: "textiles",
      label: "Textiles",
      unit: "meter",
      default_qty: 1000,
      description: "100% cotton greige fabric, industrial spun polyester sewing thread, non-woven PP fabrics, and corporate workwear.",
      subcategories: [
        { name: "Greige & Finished Cotton Fabrics", slug: "greige-finished-cotton-fabrics" },
        { name: "Spun Polyester Sewing Threads", slug: "spun-polyester-sewing-threads" },
        { name: "Spunbond Non-Woven Fabric", slug: "spunbond-non-woven-fabric" },
        { name: "Institutional Uniform Fabrics", slug: "institutional-uniform-fabrics" },
      ],
    },
    {
      id: "electronics",
      label: "Electronics",
      unit: "pc",
      default_qty: 100,
      description: "Custom FR-4 double-sided printed circuit boards, 12V/24V industrial SMPS power supplies, and digital multimeters.",
      subcategories: [
        { name: "FR-4 Double Sided PCBs", slug: "fr4-double-sided-pcbs" },
        { name: "Industrial SMPS Power Units", slug: "industrial-smps-power-units" },
        { name: "Sensors & Solid State Relays", slug: "sensors-solid-state-relays" },
        { name: "Testing & Diagnostic Equipment", slug: "testing-diagnostic-equipment" },
      ],
    },
    {
      id: "furniture",
      label: "Furniture",
      unit: "unit",
      default_qty: 10,
      description: "BIFMA certified ergonomic mesh office chairs, multi-tier industrial pallet racks, and modular collaborative desks.",
      subcategories: [
        { name: "Ergonomic Office Seating", slug: "ergonomic-office-seating" },
        { name: "Heavy Duty Warehouse Racks", slug: "heavy-duty-warehouse-racks" },
        { name: "Modular Workstation Desks", slug: "modular-workstation-desks" },
        { name: "Commercial Storage Cabinets", slug: "commercial-storage-cabinets" },
      ],
    },
    {
      id: "healthcare-supplies",
      label: "Healthcare Supplies",
      unit: "box",
      default_qty: 50,
      description: "IS 16289 medical 3-ply surgical masks, powder-free nitrile examination gloves, and disposable sterile syringes.",
      subcategories: [
        { name: "Surgical Masks & Respirators", slug: "surgical-masks-respirators" },
        { name: "Nitrile Examination Gloves", slug: "nitrile-examination-gloves" },
        { name: "Sterile Disposable Syringes", slug: "sterile-disposable-syringes" },
        { name: "Hospital Disinfectants & Wipes", slug: "hospital-disinfectants-wipes" },
      ],
    },
    {
      id: "raw-materials",
      label: "Raw Materials",
      unit: "kg",
      default_qty: 1000,
      description: "Injection moulding virgin polypropylene granules, cold-rolled steel CRCA coils, and aluminium LM6 foundry ingots.",
      subcategories: [
        { name: "Virgin Polymer Granules", slug: "virgin-polymer-granules" },
        { name: "CRCA Cold Rolled Steel Coils", slug: "crca-cold-rolled-steel-coils" },
        { name: "Aluminium Foundry Ingots", slug: "aluminium-foundry-ingots" },
        { name: "Synthetic Rubber Compounds", slug: "synthetic-rubber-compounds" },
      ],
    },
  ];

  const subcategoryMap = {}; // slug -> uuid

  for (const cat of categoryDefinitions) {
    // 1. Sync product_categories table
    const { data: existingProdCat } = await db
      .from("product_categories")
      .select("id")
      .eq("id", cat.id)
      .maybeSingle();

    if (!existingProdCat) {
      const { error: pcErr } = await db.from("product_categories").insert([
        {
          id: cat.id,
          label: cat.label,
          unit: cat.unit,
          default_qty: cat.default_qty,
        },
      ]);
      if (pcErr) console.error("Error creating product_category:", cat.id, pcErr.message);
      else {
        report.categories.created++;
        report.tablesAffected.add("product_categories");
      }
    } else {
      report.categories.skipped++;
    }

    // 2. Sync categories table
    const { data: existingCat } = await db
      .from("categories")
      .select("id")
      .eq("id", cat.id)
      .maybeSingle();

    if (!existingCat) {
      const { error: cErr } = await db.from("categories").insert([
        {
          id: cat.id,
          name: cat.label,
          slug: cat.id,
          description: cat.description,
          is_active: true,
        },
      ]);
      if (cErr) console.error("Error creating category:", cat.id, cErr.message);
      else report.tablesAffected.add("categories");
    }

    // 3. Subcategories
    for (const sub of cat.subcategories) {
      const { data: existingSub } = await db
        .from("subcategories")
        .select("id")
        .eq("slug", sub.slug)
        .maybeSingle();

      if (!existingSub) {
        const { data: newSub, error: subErr } = await db
          .from("subcategories")
          .insert([
            {
              category_id: cat.id,
              name: sub.name,
              slug: sub.slug,
            },
          ])
          .select("id")
          .single();

        if (subErr) {
          console.error("Error creating subcategory:", sub.name, subErr.message);
        } else {
          subcategoryMap[sub.slug] = newSub.id;
          report.subcategories.created++;
          report.tablesAffected.add("subcategories");
        }
      } else {
        subcategoryMap[sub.slug] = existingSub.id;
        report.subcategories.skipped++;
      }
    }
  }

  console.log(`✓ Product Categories processed: ${report.categories.created} created, ${report.categories.skipped} existing`);
  console.log(`✓ Subcategories processed: ${report.subcategories.created} created, ${report.subcategories.skipped} existing`);

  // ------------------------------------------------------------------
  // 2. REALISTIC ILLUSTRATIVE SUPPLIERS (NON-VERIFIED, FICTIONAL PLACEHOLDERS)
  // ------------------------------------------------------------------
  console.log("\n[2/6] Seeding Illustrative Indian Supplier Directory Profiles...");

  const supplierDefinitions = [
    {
      name: "Kaveri Agro Commodities & Spices FPO Ltd",
      legal_name: "Kaveri Agro Commodities & Spices FPO Ltd",
      slug: "kaveri-agro-commodities-spices",
      business_type: "manufacturer",
      city: "Guntur",
      state: "Andhra Pradesh",
      pincode: "522004",
      address: "Plot 14-B, Spice Park Industrial Estate, NH-16",
      phone: "+91-1800-SAMPLE-01",
      email: "inquiries@kaveri-agro.coverly.internal",
      website: "https://kaveri-agro.coverly.internal",
      verification_level: "unverified",
      factory_size_sqft: 65000,
      production_capacity_monthly: "1,200 Metric Tons",
      export_ready: true,
      certifications: ["APEDA Registered (Sample)", "FSSAI (Illustrative)", "ISO 22000 (Sample)"],
      lead_time_days: 7,
    },
    {
      name: "Shakti Heavy Fabrications & Industrial Machinery Pvt Ltd",
      legal_name: "Shakti Heavy Fabrications & Machinery Works Pvt Ltd",
      slug: "shakti-heavy-fabrications-machinery",
      business_type: "manufacturer",
      city: "Rajkot",
      state: "Gujarat",
      pincode: "360002",
      address: "Aji GIDC Industrial Area, Phase II, Shed 42",
      phone: "+91-1800-SAMPLE-02",
      email: "machinery@shaktihvy.coverly.internal",
      website: "https://shaktihvy.coverly.internal",
      verification_level: "unverified",
      factory_size_sqft: 42000,
      production_capacity_monthly: "150 Machine Units",
      export_ready: true,
      certifications: ["CE Machinery Directive (Sample)", "ISO 9001 (Sample)"],
      lead_time_days: 14,
    },
    {
      name: "Vidyut Shakti Electricals & Switchgear Mfg",
      legal_name: "Vidyut Shakti Electricals & Switchgear Pvt Ltd",
      slug: "vidyut-shakti-electricals-switchgear",
      business_type: "manufacturer",
      city: "Vadodara",
      state: "Gujarat",
      pincode: "390010",
      address: "Makarpura Industrial Estate, Main Road",
      phone: "+91-1800-SAMPLE-03",
      email: "sales@vidyutshakti.coverly.internal",
      website: "https://vidyutshakti.coverly.internal",
      verification_level: "unverified",
      factory_size_sqft: 38000,
      production_capacity_monthly: "60,000 meters cable",
      export_ready: false,
      certifications: ["IS:7098 (Sample)", "CPRI Type Tested (Sample)"],
      lead_time_days: 8,
    },
    {
      name: "Deccan Polymers & Packaging Solutions LLP",
      legal_name: "Deccan Polymers & Packaging Solutions LLP",
      slug: "deccan-polymers-packaging-solutions",
      business_type: "manufacturer",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500077",
      address: "Cherlapally Industrial Development Area, Phase 3",
      phone: "+91-1800-SAMPLE-04",
      email: "packaging@deccanpoly.coverly.internal",
      website: "https://deccanpoly.coverly.internal",
      verification_level: "unverified",
      factory_size_sqft: 55000,
      production_capacity_monthly: "2,500,000 Woven Bags",
      export_ready: true,
      certifications: ["ISO 9001:2015 (Sample)", "CIPET Tested (Sample)"],
      lead_time_days: 5,
    },
    {
      name: "Indus ChemTech Fine & Industrial Chemicals",
      legal_name: "Indus ChemTech Manufacturing India Ltd",
      slug: "indus-chemtech-industrial-chemicals",
      business_type: "manufacturer",
      city: "Ankleshwar",
      state: "Gujarat",
      pincode: "393002",
      address: "GIDC Chemical Zone, Plot 108/C",
      phone: "+91-1800-SAMPLE-05",
      email: "orders@induschem.coverly.internal",
      website: "https://induschem.coverly.internal",
      verification_level: "unverified",
      factory_size_sqft: 80000,
      production_capacity_monthly: "1,800 Metric Tons",
      export_ready: true,
      certifications: ["REACH Compliant (Sample)", "ISO 14001:2015 (Sample)"],
      lead_time_days: 8,
    },
    {
      name: "Godavari Steel & Construction Formworks",
      legal_name: "Godavari Steel & Construction Formworks Trade Hub",
      slug: "godavari-steel-construction-formworks",
      business_type: "wholesaler",
      city: "Raipur",
      state: "Chhattisgarh",
      pincode: "492001",
      address: "Urla Industrial Area, Ring Road No. 2",
      phone: "+91-1800-SAMPLE-06",
      email: "dispatch@godavaristeel.coverly.internal",
      website: "https://godavaristeel.coverly.internal",
      verification_level: "unverified",
      factory_size_sqft: 32000,
      production_capacity_monthly: "6,000 Metric Tons",
      export_ready: false,
      certifications: ["BIS Conformance (Sample)"],
      lead_time_days: 4,
    },
    {
      name: "Bharat MedTech & Healthcare Disposables Ltd",
      legal_name: "Bharat MedTech Disposables & Devices Pvt Ltd",
      slug: "bharat-medtech-healthcare-disposables",
      business_type: "manufacturer",
      city: "Baddi",
      state: "Himachal Pradesh",
      pincode: "173205",
      address: "EPIP Industrial Zone, Phase I, Plot 9",
      phone: "+91-1800-SAMPLE-07",
      email: "medtech@bharatdevices.coverly.internal",
      website: "https://bharatdevices.coverly.internal",
      verification_level: "unverified",
      factory_size_sqft: 48000,
      production_capacity_monthly: "12,000,000 Units",
      export_ready: true,
      certifications: ["CDSCO Device License (Sample)", "WHO-GMP (Sample)"],
      lead_time_days: 6,
    },
    {
      name: "Konkan Modular Ergonomic Systems",
      legal_name: "Konkan Modular Workspaces & Furniture Pvt Ltd",
      slug: "konkan-modular-ergonomic-systems",
      business_type: "manufacturer",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560058",
      address: "Peenya Industrial Area, 3rd Stage, 4th Cross",
      phone: "+91-1800-SAMPLE-08",
      email: "contract@konkanfurniture.coverly.internal",
      website: "https://konkanfurniture.coverly.internal",
      verification_level: "unverified",
      factory_size_sqft: 30000,
      production_capacity_monthly: "4,000 Units",
      export_ready: false,
      certifications: ["BIFMA Compliant (Sample)", "GreenPro Certified (Sample)"],
      lead_time_days: 10,
    },
  ];

  const supplierBusinessMap = {}; // slug -> uuid

  for (const s of supplierDefinitions) {
    let bId = null;
    const { data: existingBus } = await db
      .from("businesses")
      .select("id")
      .eq("slug", s.slug)
      .maybeSingle();

    if (existingBus) {
      bId = existingBus.id;
      report.suppliers.skipped++;
    } else {
      const { data: newBus, error: bErr } = await db
        .from("businesses")
        .insert([
          {
            name: s.name,
            legal_name: s.legal_name,
            slug: s.slug,
            business_type: s.business_type,
            city: s.city,
            state: s.state,
            pincode: s.pincode,
            address: s.address,
            phone: s.phone,
            email: s.email,
            website: s.website,
            verification_level: s.verification_level,
            is_active: true,
          },
        ])
        .select("id")
        .single();

      if (bErr) {
        console.error("Error creating supplier business:", s.name, bErr.message);
        continue;
      }

      bId = newBus.id;
      report.suppliers.created++;
      report.tablesAffected.add("businesses");

      // Supplier Profile
      const { error: spErr } = await db.from("supplier_profiles").insert([
        {
          business_id: bId,
          factory_size_sqft: s.factory_size_sqft,
          production_capacity_monthly: s.production_capacity_monthly,
          export_ready: s.export_ready,
          certifications: s.certifications,
          lead_time_days: s.lead_time_days,
        },
      ]);
      if (spErr) console.error("Error creating supplier profile:", s.name, spErr.message);
      else report.tablesAffected.add("supplier_profiles");
    }

    supplierBusinessMap[s.slug] = bId;
  }

  // Also include existing suppliers
  const { data: existingAllSupps } = await db.from("businesses").select("id, slug");
  for (const bus of existingAllSupps || []) {
    supplierBusinessMap[bus.slug] = bus.id;
  }

  console.log(`✓ Supplier profiles: ${report.suppliers.created} created, ${report.suppliers.skipped} existing`);

  // ------------------------------------------------------------------
  // 3. REALISTIC WHOLESALE PRODUCTS (24 DIVERSE COMMERCIAL LISTINGS)
  // ------------------------------------------------------------------
  console.log("\n[3/6] Seeding Diverse Initial Wholesale Product Catalogue...");

  const kaveriId = supplierBusinessMap["kaveri-agro-commodities-spices"];
  const shaktiId = supplierBusinessMap["shakti-heavy-fabrications-machinery"];
  const vidyutId = supplierBusinessMap["vidyut-shakti-electricals-switchgear"];
  const deccanId = supplierBusinessMap["deccan-polymers-packaging-solutions"];
  const indusId = supplierBusinessMap["indus-chemtech-industrial-chemicals"];
  const godavariId = supplierBusinessMap["godavari-steel-construction-formworks"];
  const medtechId = supplierBusinessMap["bharat-medtech-healthcare-disposables"];
  const konkanId = supplierBusinessMap["konkan-modular-ergonomic-systems"];
  const texcraftId = supplierBusinessMap["texcraft-mills-garments"] || kaveriId;
  const apexId = supplierBusinessMap["apex-wholesale-goods-hub"] || deccanId;

  const productDefinitions = [
    // 1. Agriculture Products
    {
      business_id: kaveriId,
      category_id: "agriculture-products",
      subcategory_id: subcategoryMap["bulk-grains-pulses"],
      title: "IR 64 Parboiled Long Grain Non-Basmati Rice (5% Broken)",
      slug: "ir-64-parboiled-long-grain-rice-5-broken",
      description: "Direct mill-processed IR 64 parboiled non-basmati rice packed in 50kg export HDPE bags. Maximum moisture 14%, sorting accuracy 100% sortex clean. Pricing is an indicative wholesale benchmark for full truckload consignments across India.",
      moq: 20,
      unit: "Metric Tons",
      indicative_price: 36500.0,
      tiered_pricing: [
        { min_qty: 20, price: 36500.0 },
        { min_qty: 50, price: 35200.0 },
        { min_qty: 100, price: 34100.0 },
      ],
      specifications: {
        grain_length: "6.0 mm Average",
        broken_ratio: "Max 5.0%",
        moisture: "Max 14.0%",
        foreign_matter: "Nil",
        crop_year: "Current Season",
        packaging: "50kg HDPE Woven Bags with Liner",
        gst_rate: "5%",
        _source: "platform_seed",
        _classification: "illustrative_content",
        _indicative_pricing: true,
      },
      hs_code: "10063010",
      is_active: true,
    },
    {
      business_id: kaveriId,
      category_id: "agriculture-products",
      subcategory_id: subcategoryMap["spices-whole-condiments"],
      title: "Garbled Tellicherry Black Pepper (TGSEB Grade, Bold 4.75mm)",
      slug: "tellicherry-black-pepper-tgseb-grade-bold",
      description: "Premium single-origin Tellicherry Extra Bold (TGSEB) sun-dried black pepper peppercorns. Bulk packed in 25kg multi-wall paper sacks for culinary processors, oleoresin extractors, and export traders.",
      moq: 500,
      unit: "kg",
      indicative_price: 680.0,
      tiered_pricing: [
        { min_qty: 500, price: 680.0 },
        { min_qty: 2000, price: 645.0 },
        { min_qty: 5000, price: 610.0 },
      ],
      specifications: {
        grade: "TGSEB (Tellicherry Garbled Special Extra Bold)",
        bulk_density: "570 g/L",
        piperine_content: "Minimum 4.5%",
        volatile_oil: "Minimum 2.5%",
        moisture: "Under 11.5%",
        packaging: "25kg Multi-Wall Kraft Paper Sacks with PP Liner",
        gst_rate: "5%",
        _source: "platform_seed",
        _classification: "illustrative_content",
        _indicative_pricing: true,
      },
      hs_code: "09041110",
      is_active: true,
    },

    // 2. Food & Beverages
    {
      business_id: kaveriId,
      category_id: "food-beverages",
      subcategory_id: subcategoryMap["edible-oils-fats"],
      title: "Cold-Pressed Kachi Ghani Mustard Oil (Bulk 15kg Commercial Tins)",
      slug: "cold-pressed-kachi-ghani-mustard-oil-15kg-tin",
      description: "Traditional cold-pressed mustard seed oil with natural pungent aroma and high smoke point. Laboratory tested free from argemone oil and heavy metals. Ideal for commercial snack processors and wholesale grocery distribution.",
      moq: 50,
      unit: "tins",
      indicative_price: 1850.0,
      tiered_pricing: [
        { min_qty: 50, price: 1850.0 },
        { min_qty: 200, price: 1780.0 },
        { min_qty: 500, price: 1710.0 },
      ],
      specifications: {
        process: "Cold Expeller Pressed (Kachi Ghani)",
        acidity_ffa: "Under 1.25%",
        iodine_value: "98 - 110",
        pungency_allyl_isothiocyanate: "Min 0.28%",
        packaging: "15 kg Epoxy-Lined Tin Container",
        gst_rate: "5%",
        _source: "platform_seed",
        _classification: "illustrative_content",
        _indicative_pricing: true,
      },
      hs_code: "15149110",
      is_active: true,
    },
    {
      business_id: kaveriId,
      category_id: "food-beverages",
      subcategory_id: subcategoryMap["dairy-ingredients-powders"],
      title: "Spray-Dried Skimmed Milk Powder (SMP Food Grade, 25kg Bag)",
      slug: "spray-dried-skimmed-milk-powder-smp-food-grade-25kg",
      description: "Commercial medium-heat spray-dried skimmed milk powder (SMP) produced from fresh pasteurized cow and buffalo milk. Superb solubility and heat stability for confectioneries, ice cream units, and dairy reconstitutors.",
      moq: 1000,
      unit: "kg",
      indicative_price: 310.0,
      tiered_pricing: [
        { min_qty: 1000, price: 310.0 },
        { min_qty: 5000, price: 295.0 },
      ],
      specifications: {
        protein_dry_matter: "Minimum 34.0%",
        fat_content: "Maximum 1.25%",
        moisture: "Maximum 4.0%",
        solubility_index: "Under 1.0 ml",
        titratable_acidity: "Max 0.15%",
        packaging: "25kg Multi-Layer Polyethylene Lined Paper Bag",
        gst_rate: "5%",
        _source: "platform_seed",
        _classification: "illustrative_content",
        _indicative_pricing: true,
      },
      hs_code: "04021010",
      is_active: true,
    },

    // 3. Packaging Materials
    {
      business_id: deccanId,
      category_id: "packaging-materials",
      subcategory_id: subcategoryMap["hdpe-pp-woven-sacks"],
      title: "UV-Stabilized HDPE Woven Sacks with PE Liner (50kg Capacity)",
      slug: "uv-stabilized-hdpe-woven-sacks-pe-liner-50kg",
      description: "Heavy-duty HDPE woven bags reinforced with anti-slip micro-ribbing and virgin LDPE inner liner. Designed for bulk packing of cement, fertilizer granules, chemicals, and agricultural harvest.",
      moq: 5000,
      unit: "bags",
      indicative_price: 16.5,
      tiered_pricing: [
        { min_qty: 5000, price: 16.5 },
        { min_qty: 25000, price: 14.8 },
        { min_qty: 100000, price: 13.2 },
      ],
      specifications: {
        dimensions: "24 x 36 inches",
        mesh_count: "10 x 10 weave",
        denier: "1000 D",
        weight_per_bag: "85 grams",
        tensile_strength_warp: "95 kgf",
        tensile_strength_weft: "85 kgf",
        packaging: "Bales of 500 Bags Compressed",
        gst_rate: "18%",
        _source: "platform_seed",
        _classification: "illustrative_content",
        _indicative_pricing: true,
      },
      hs_code: "63053300",
      is_active: true,
    },
    {
      business_id: deccanId,
      category_id: "packaging-materials",
      subcategory_id: subcategoryMap["stretch-wrap-shrink-films"],
      title: "Cast LLDPE Machine-Grade Stretch Wrapping Film (23 Micron, 500mm)",
      slug: "cast-lldpe-machine-grade-stretch-wrapping-film-23-micron",
      description: "High-stretch cast LLDPE pallet wrapping film with up to 300% elongation capacity. Superior puncture resistance, one-side cling, and silent unwinding for automated high-speed warehouse pallet wrappers.",
      moq: 50,
      unit: "rolls",
      indicative_price: 1750.0,
      tiered_pricing: [
        { min_qty: 50, price: 1750.0 },
        { min_qty: 200, price: 1620.0 },
      ],
      specifications: {
        film_thickness: "23 Micron (92 Gauge)",
        roll_width: "500 mm",
        roll_weight: "15 kg Gross (3 inch core)",
        stretch_capability: "Up to 300%",
        polymer_grade: "100% Virgin Dow/Reliance Octene LLDPE",
        packaging: "Single Roll Box, 40 Rolls per Pallet",
        gst_rate: "18%",
        _source: "platform_seed",
        _classification: "illustrative_content",
        _indicative_pricing: true,
      },
      hs_code: "39201019",
      is_active: true,
    },

    // 4. Industrial Machinery
    {
      business_id: shaktiId,
      category_id: "industrial-machinery",
      subcategory_id: subcategoryMap["packaging-sealing-machinery"],
      title: "Continuous Heavy-Duty Band Sealer with Nitrogen Gas Flushing",
      slug: "continuous-heavy-duty-band-sealer-nitrogen-gas-flushing",
      description: "Stainless steel SS304 continuous band sealer with automated conveyor and nitrogen gas purging system. Preserves freshness of namkeen, snacks, pulses, and medical consumables. Sealing speed up to 12 meters/min.",
      moq: 1,
      unit: "units",
      indicative_price: 34500.0,
      tiered_pricing: [
        { min_qty: 1, price: 34500.0 },
        { min_qty: 3, price: 31000.0 },
      ],
      specifications: {
        voltage: "220V 50Hz Single Phase",
        power: "750 Watts",
        sealing_width: "10 mm Embossed or Plain",
        sealing_speed: "0 - 12 meters / minute",
        conveyor_load: "Up to 5 kg single bag, 15 kg total",
        body_construction: "Food-Grade Stainless Steel 304",
        gst_rate: "18%",
        _source: "platform_seed",
        _classification: "illustrative_content",
        _indicative_pricing: true,
      },
      hs_code: "84223000",
      is_active: true,
    },
    {
      business_id: shaktiId,
      category_id: "industrial-machinery",
      subcategory_id: subcategoryMap["electric-motors-gearboxes"],
      title: "3-Phase Cast Iron Industrial Induction Motor (15 HP, 1440 RPM)",
      slug: "3-phase-cast-iron-industrial-induction-motor-15hp-1440rpm",
      description: "Energy efficient IE2/IE3 rated foot-mounted three phase squirrel cage induction motor. Copper wound stator, class F insulation, IP55 protection for severe industrial duty in crushers, blowers, and pumps.",
      moq: 2,
      unit: "units",
      indicative_price: 42000.0,
      tiered_pricing: [
        { min_qty: 2, price: 42000.0 },
        { min_qty: 10, price: 38500.0 },
      ],
      specifications: {
        rated_output: "15 HP (11 kW)",
        synchronous_speed: "1440 RPM (4 Pole)",
        supply_voltage: "415V ± 10%, 50Hz, 3-Phase",
        frame_size: "160M Cast Iron",
        duty_cycle: "S1 Continuous",
        insulation_class: "Class F with Temperature Rise limited to Class B",
        gst_rate: "18%",
        _source: "platform_seed",
        _classification: "illustrative_content",
        _indicative_pricing: true,
      },
      hs_code: "85015210",
      is_active: true,
    },

    // 5. Electrical Equipment
    {
      business_id: vidyutId,
      category_id: "electrical-equipment",
      subcategory_id: subcategoryMap["armoured-power-cables"],
      title: "1.1 kV XLPE Insulated 4-Core Copper Armoured Cable (16 sq mm)",
      slug: "1-1-kv-xlpe-4-core-copper-armoured-cable-16sqmm",
      description: "IS 7098 (Part 1) certified low voltage underground power cable. Stranded electrolytic high conductivity copper conductors, XLPE core insulation, extruded PVC inner sheath, galvanized steel wire armour.",
      moq: 100,
      unit: "meters",
      indicative_price: 485.0,
      tiered_pricing: [
        { min_qty: 100, price: 485.0 },
        { min_qty: 500, price: 450.0 },
        { min_qty: 2000, price: 415.0 },
      ],
      specifications: {
        voltage_grade: "1100 Volts (1.1 kV)",
        core_count: "4 Cores (Red, Yellow, Blue, Black)",
        nominal_conductor_area: "16 sq.mm per core",
        conductor_material: "Electrolytic Grade Plain Annealed Copper",
        armour_type: "Galvanized Steel Strip Armour",
        outer_sheath: "Heavy Duty FRLS PVC Type ST2",
        packaging: "500m Wooden Drums",
        gst_rate: "18%",
        _source: "platform_seed",
        _classification: "illustrative_content",
        _indicative_pricing: true,
      },
      hs_code: "85444999",
      is_active: true,
    },
    {
      business_id: vidyutId,
      category_id: "electrical-equipment",
      subcategory_id: subcategoryMap["industrial-high-bay-led"],
      title: "Commercial IP66 LED High Bay Warehouse Luminaire (150W, 6500K)",
      slug: "commercial-ip66-led-high-bay-warehouse-luminaire-150w",
      description: "Pressure die-cast aluminium housing high bay fixture engineered for factories, logistics warehouses, and assembly hangars. Delivers 21,000 lumens with Philips Lumileds chips and built-in 4kV surge protection.",
      moq: 12,
      unit: "fixtures",
      indicative_price: 2450.0,
      tiered_pricing: [
        { min_qty: 12, price: 2450.0 },
        { min_qty: 50, price: 2180.0 },
      ],
      specifications: {
        system_wattage: "150 Watts",
        luminous_efficacy: "140 Lumens / Watt (21,000 Lm)",
        color_temperature: "6500K Cool White",
        cri: "> 80",
        power_factor: "> 0.95",
        surge_protection: "4 kV Internal, 10 kV External SPD compatible",
        ingress_protection: "IP66 Dust & Water Jet Proof",
        gst_rate: "18%",
        _source: "platform_seed",
        _classification: "illustrative_content",
        _indicative_pricing: true,
      },
      hs_code: "94054090",
      is_active: true,
    },

    // 6. Construction Materials
    {
      business_id: godavariId,
      category_id: "construction-materials",
      subcategory_id: subcategoryMap["ordinary-portland-cement"],
      title: "Grade 53 Ordinary Portland Cement (OPC 53, 50kg HDPE Bags)",
      slug: "grade-53-ordinary-portland-cement-opc-53-50kg-bag",
      description: "High early strength BIS IS:269 certified Grade 53 Portland cement. Formulated for high-rise commercial structures, pre-stressed concrete bridges, and ready-mix concrete batching operations.",
      moq: 200,
      unit: "bags",
      indicative_price: 365.0,
      tiered_pricing: [
        { min_qty: 200, price: 365.0 },
        { min_qty: 1000, price: 345.0 },
      ],
      specifications: {
        standard: "IS 269:2015 Grade 53",
        compressive_strength_28_days: "Minimum 53 MPa (Avg 58-62 MPa)",
        initial_setting_time: "Minimum 30 minutes (Avg 120 min)",
        final_setting_time: "Maximum 600 minutes (Avg 240 min)",
        soundness_le_chatelier: "Max 10 mm",
        packaging: "50 kg Tamper-Proof Polypropylene Bags",
        gst_rate: "28%",
        _source: "platform_seed",
        _classification: "illustrative_content",
        _indicative_pricing: true,
      },
      hs_code: "25232910",
      is_active: true,
    },
    {
      business_id: godavariId,
      category_id: "construction-materials",
      subcategory_id: subcategoryMap["aac-blocks-precast-bricks"],
      title: "Autoclaved Aerated Concrete Blocks (600x200x150mm, Grade 1)",
      slug: "autoclaved-aerated-concrete-aac-blocks-600x200x150",
      description: "Lightweight, thermal insulating, fire-rated AAC precast building blocks conforming to IS 2185 (Part 3). Reduces structural dead load by up to 50% compared to traditional red clay bricks.",
      moq: 500,
      unit: "blocks",
      indicative_price: 68.0,
      tiered_pricing: [
        { min_qty: 500, price: 68.0 },
        { min_qty: 2500, price: 62.0 },
      ],
      specifications: {
        dimensions: "600 mm x 200 mm x 150 mm",
        dry_density: "550 - 650 kg/cu.m",
        compressive_strength: "3.5 - 4.5 N/sq.mm",
        thermal_conductivity: "0.16 - 0.24 W/mK",
        fire_resistance: "Up to 4 hours (4 inch wall)",
        packaging: "Direct Pallet Truck Dispatch",
        gst_rate: "12%",
        _source: "platform_seed",
        _classification: "illustrative_content",
        _indicative_pricing: true,
      },
      hs_code: "68101110",
      is_active: true,
    },

    // 7. Chemicals
    {
      business_id: indusId,
      category_id: "chemicals",
      subcategory_id: subcategoryMap["alkalis-basic-chemicals"],
      title: "Industrial Grade Caustic Soda Flakes (99.5% NaOH Purity, 50kg Bags)",
      slug: "industrial-caustic-soda-flakes-99-5-naoh-50kg-bag",
      description: "White deliquescent flakes of high purity sodium hydroxide manufactured via modern membrane cell technology. Widely used in alumina extraction, soap manufacturing, textile scouring, and chemical processing.",
      moq: 1000,
      unit: "kg",
      indicative_price: 48.0,
      tiered_pricing: [
        { min_qty: 1000, price: 48.0 },
        { min_qty: 5000, price: 44.5 },
        { min_qty: 20000, price: 41.0 },
      ],
      specifications: {
        naoh_purity: "Minimum 99.5%",
        sodium_carbonate_na2co3: "Maximum 0.4%",
        sodium_chloride_nacl: "Maximum 0.03%",
        iron_fe: "Under 10 ppm",
        physical_appearance: "White crystalline flakes",
        packaging: "50 kg Heavy Duty Multi-Wall PP Bags with LDPE Liner",
        gst_rate: "18%",
        _source: "platform_seed",
        _classification: "illustrative_content",
        _indicative_pricing: true,
      },
      hs_code: "28151110",
      is_active: true,
    },
    {
      business_id: indusId,
      category_id: "chemicals",
      subcategory_id: subcategoryMap["surfactants-detergent-bases"],
      title: "Linear Alkyl Benzene Sulphonic Acid (LABSA 90% Industrial Acid Slurry)",
      slug: "linear-alkyl-benzene-sulphonic-acid-labsa-90-drum",
      description: "High active content anionic surfactant synthesized via continuous SO3 falling film sulphonation. Superb foaming, wetting, and emulsifying characteristics for commercial laundry powders and liquid detergents.",
      moq: 1050,
      unit: "kg",
      indicative_price: 112.0,
      tiered_pricing: [
        { min_qty: 1050, price: 112.0 },
        { min_qty: 5000, price: 104.0 },
      ],
      specifications: {
        active_matter: "Minimum 90.0%",
        free_sulphuric_acid: "Maximum 1.8%",
        free_oil_unsulphonated: "Maximum 1.5%",
        color_klett: "Under 40",
        packaging: "210 kg HM-HDPE Plastic Drums (5 drums per MOQ)",
        gst_rate: "18%",
        _source: "platform_seed",
        _classification: "illustrative_content",
        _indicative_pricing: true,
      },
      hs_code: "34021100",
      is_active: true,
    },

    // 8. Textiles
    {
      business_id: texcraftId,
      category_id: "textiles",
      subcategory_id: subcategoryMap["greige-finished-cotton-fabrics"],
      title: "100% Pure Cotton Grey Weave Fabric (40x40 / 132x72, 63 inch)",
      slug: "100-pure-cotton-grey-weave-fabric-40x40-63-inch",
      description: "Air-jet loom woven 100% combed cotton greige fabric. Uniform warp tension, knot-free yarn, suitable for reactive printing, dyeing, hospital sheetings, and export apparel manufacture.",
      moq: 2000,
      unit: "meters",
      indicative_price: 72.0,
      tiered_pricing: [
        { min_qty: 2000, price: 72.0 },
        { min_qty: 10000, price: 65.5 },
      ],
      specifications: {
        warp_count: "40s Combed Cotton",
        weft_count: "40s Combed Cotton",
        construction: "132 x 72 threads per inch",
        width: "63 inches (160 cm)",
        weave_type: "Plain 1/1",
        weight_gsm: "115 GSM",
        packaging: "Rolls of 100m in Double Polythene Wrap",
        gst_rate: "5%",
        _source: "platform_seed",
        _classification: "illustrative_content",
        _indicative_pricing: true,
      },
      hs_code: "52081190",
      is_active: true,
    },
    {
      business_id: texcraftId,
      category_id: "textiles",
      subcategory_id: subcategoryMap["spunbond-non-woven-fabric"],
      title: "Polypropylene Spunbond Non-Woven Fabric (50 GSM, 1.6m Roll)",
      slug: "polypropylene-spunbond-non-woven-fabric-50gsm-1-6m",
      description: "100% virgin polypropylene thermal-bonded spunbond non-woven fabric rolls. Hydrophobic, tear-resistant, breathable for eco-friendly shopping bags, medical disposables, and agriculture crop covers.",
      moq: 500,
      unit: "kg",
      indicative_price: 135.0,
      tiered_pricing: [
        { min_qty: 500, price: 135.0 },
        { min_qty: 2500, price: 122.0 },
      ],
      specifications: {
        weight_gsm: "50 GSM (± 2%)",
        roll_width: "1600 mm (1.6 meters)",
        polymer_base: "100% Virgin PP Homopolymer",
        tensile_strength_md: "85 N/5cm",
        tensile_strength_cd: "55 N/5cm",
        color: "Medical Blue / Natural White",
        packaging: "Rolls wrapped in Stretch Film with Core Plugs",
        gst_rate: "12%",
        _source: "platform_seed",
        _classification: "illustrative_content",
        _indicative_pricing: true,
      },
      hs_code: "56031200",
      is_active: true,
    },

    // 9. Electronics
    {
      business_id: vidyutId,
      category_id: "electronics",
      subcategory_id: subcategoryMap["fr4-double-sided-pcbs"],
      title: "Custom Double-Sided FR-4 Industrial Grade PCB Bare Boards",
      slug: "custom-double-sided-fr-4-industrial-pcb-bare-boards",
      description: "IPC Class 2 high reliability FR-4 double-sided printed circuit board panels with Lead-Free HASL finish, green solder mask, and white component legend. Designed for IoT devices and industrial controllers.",
      moq: 100,
      unit: "pieces",
      indicative_price: 185.0,
      tiered_pricing: [
        { min_qty: 100, price: 185.0 },
        { min_qty: 500, price: 135.0 },
        { min_qty: 2000, price: 95.0 },
      ],
      specifications: {
        board_material: "FR-4 Standard Tg 140°C",
        board_thickness: "1.6 mm ± 10%",
        copper_thickness: "1 oz (35 microns)",
        surface_finish: "Lead-Free HASL (RoHS Compliant)",
        min_track_spacing: "6 mil / 6 mil",
        min_hole_size: "0.3 mm",
        e_test: "100% Flying Probe Electrical Tested",
        gst_rate: "18%",
        _source: "platform_seed",
        _classification: "illustrative_content",
        _indicative_pricing: true,
      },
      hs_code: "85340000",
      is_active: true,
    },
    {
      business_id: vidyutId,
      category_id: "electronics",
      subcategory_id: subcategoryMap["industrial-smps-power-units"],
      title: "Enclosed Industrial Din-Rail SMPS Power Supply (24V DC, 10A, 240W)",
      slug: "enclosed-industrial-din-rail-smps-power-supply-24v-10a",
      description: "High-efficiency metal chassis switched-mode DC power supply module with universal AC input (85-264V). Short circuit, overload, overvoltage, and over-temperature protection for PLC automation panels.",
      moq: 10,
      unit: "units",
      indicative_price: 1950.0,
      tiered_pricing: [
        { min_qty: 10, price: 1950.0 },
        { min_qty: 50, price: 1720.0 },
      ],
      specifications: {
        output_voltage: "24 Volts DC (Adjustable 24-28V)",
        rated_current: "10.0 Amperes (240 Watts continuous)",
        input_voltage_range: "85 - 264 VAC / 120 - 370 VDC",
        efficiency: "90% at full load",
        cooling: "Free air convection, no fan required",
        mounting: "Standard DIN Rail TS-35/7.5 or 15",
        gst_rate: "18%",
        _source: "platform_seed",
        _classification: "illustrative_content",
        _indicative_pricing: true,
      },
      hs_code: "85044090",
      is_active: true,
    },

    // 10. Furniture
    {
      business_id: konkanId,
      category_id: "furniture",
      subcategory_id: subcategoryMap["ergonomic-office-seating"],
      title: "Ergonomic High-Back Breathable Mesh Executive Chair (BIFMA X5.1)",
      slug: "ergonomic-high-back-mesh-executive-chair-bifma",
      description: "Commercial workstation ergonomic mesh chair featuring 3D adjustable armrests, synchronized multi-position tilt lock mechanism, pneumatic Class 4 gas lift, and integrated lumbar support for enterprise offices.",
      moq: 10,
      unit: "chairs",
      indicative_price: 4950.0,
      tiered_pricing: [
        { min_qty: 10, price: 4950.0 },
        { min_qty: 50, price: 4350.0 },
        { min_qty: 200, price: 3850.0 },
      ],
      specifications: {
        backrest: "High Tensile Korean Breathable Nylon Mesh",
        seat_foam: "High-Density 55 kg/cu.m Moulded PU Foam",
        mechanism: "Synchro Tilt Lock Mechanism with Anti-Shock Return",
        gas_lift: "BIFMA Class 4 Pneumatic 100mm Stroke",
        base_castors: "60mm Nylon Dual-Wheel Castors",
        weight_capacity: "Tested for up to 135 kg static load",
        gst_rate: "18%",
        _source: "platform_seed",
        _classification: "illustrative_content",
        _indicative_pricing: true,
      },
      hs_code: "94013000",
      is_active: true,
    },
    {
      business_id: konkanId,
      category_id: "furniture",
      subcategory_id: subcategoryMap["heavy-duty-warehouse-racks"],
      title: "Heavy-Duty Multi-Tier Industrial Pallet Storage Rack (1000kg/Shelf)",
      slug: "heavy-duty-multi-tier-industrial-pallet-rack-1000kg",
      description: "Modular cold-formed steel warehouse storage racking system with epoxy powder coating. Boltless teardrop beam locking design allows rapid adjustment of shelf heights to accommodate changing pallet dimensions.",
      moq: 4,
      unit: "racks",
      indicative_price: 12800.0,
      tiered_pricing: [
        { min_qty: 4, price: 12800.0 },
        { min_qty: 20, price: 11200.0 },
      ],
      specifications: {
        bay_dimensions: "H 3000 mm x W 2700 mm x D 1000 mm",
        shelf_capacity: "1,000 kg Uniformly Distributed Load (UDL)",
        upright_profile: "90 x 70 mm x 2.0 mm Cold Rolled Steel",
        beam_profile: "100 x 50 mm Box Beam with Safety Locking Pins",
        finish: "Seven-Tank Phosphatized Epoxy Powder Coating (70 microns)",
        gst_rate: "18%",
        _source: "platform_seed",
        _classification: "illustrative_content",
        _indicative_pricing: true,
      },
      hs_code: "94032090",
      is_active: true,
    },

    // 11. Healthcare Supplies
    {
      business_id: medtechId,
      category_id: "healthcare-supplies",
      subcategory_id: subcategoryMap["surgical-masks-respirators"],
      title: "Medical Grade 3-Ply Surgical Masks with Meltblown Filter (IS 16289)",
      slug: "medical-grade-3-ply-surgical-masks-is-16289",
      description: "Class 1 medical surgical face masks with high efficiency meltblown middle filtration layer. Bacterial Filtration Efficiency (BFE) > 99%, Differential Pressure < 3.0 mmH2O/sq.cm for unhindered breathing.",
      moq: 100,
      unit: "boxes (50 pcs/box)",
      indicative_price: 65.0,
      tiered_pricing: [
        { min_qty: 100, price: 65.0 },
        { min_qty: 1000, price: 54.0 },
        { min_qty: 10000, price: 46.0 },
      ],
      specifications: {
        filtration_efficiency: "BFE > 99.5% at 3.0 microns (Nelson Labs tested)",
        pfe: "Particulate Filtration Efficiency > 98% at 0.1 micron",
        layers: "Spunbond PP Outer (25 GSM) + Meltblown Filter (25 GSM) + Spunbond PP Inner (25 GSM)",
        nose_clip: "Malleable plastic coated aluminum wire",
        earloops: "Soft ultrasonically welded elastomeric bands",
        packaging: "50 pieces per sterile dispenser box, 2000 pcs per carton",
        gst_rate: "12%",
        _source: "platform_seed",
        _classification: "illustrative_content",
        _indicative_pricing: true,
      },
      hs_code: "63079090",
      is_active: true,
    },
    {
      business_id: medtechId,
      category_id: "healthcare-supplies",
      subcategory_id: subcategoryMap["nitrile-examination-gloves"],
      title: "Powder-Free Nitrile Examination Gloves (Box of 100, ASTM D6319)",
      slug: "powder-free-nitrile-examination-gloves-box-100",
      description: "Non-sterile ambidextrous nitrile medical examination gloves. Latex-free to eliminate Type I allergy risks. Micro-textured fingertips provide exceptional tactile sensitivity and firm instrument grip.",
      moq: 50,
      unit: "boxes (100 pcs/box)",
      indicative_price: 240.0,
      tiered_pricing: [
        { min_qty: 50, price: 240.0 },
        { min_qty: 500, price: 215.0 },
        { min_qty: 2000, price: 195.0 },
      ],
      specifications: {
        material: "100% Acrylonitrile Butadiene Synthetic Latex",
        thickness: "Palm: 0.08 mm, Finger: 0.11 mm",
        tensile_strength: "Min 14 MPa (Before Aging)",
        elongation_at_break: "Min 500%",
        aql: "1.5 Acceptance Quality Level",
        sizes_available: "Small, Medium, Large, Extra-Large",
        packaging: "100 gloves per dispenser box, 10 boxes per master carton",
        gst_rate: "12%",
        _source: "platform_seed",
        _classification: "illustrative_content",
        _indicative_pricing: true,
      },
      hs_code: "40151900",
      is_active: true,
    },

    // 12. Raw Materials
    {
      business_id: deccanId,
      category_id: "raw-materials",
      subcategory_id: subcategoryMap["virgin-polymer-granules"],
      title: "Virgin Polypropylene Injection Moulding Granules (PP Homopolymer MFI 12)",
      slug: "virgin-polypropylene-granules-pp-homopolymer-mfi-12",
      description: "Prime virgin injection moulding grade polypropylene homopolymer pellets. High stiffness, good dimensional stability, and low cycle time for rigid packaging, automotive components, and household wares.",
      moq: 1000,
      unit: "kg",
      indicative_price: 94.0,
      tiered_pricing: [
        { min_qty: 1000, price: 94.0 },
        { min_qty: 5000, price: 89.5 },
        { min_qty: 25000, price: 85.0 },
      ],
      specifications: {
        melt_flow_index: "12.0 g/10 min (230°C / 2.16 kg)",
        density: "0.905 g/cu.cm",
        tensile_strength_yield: "34 MPa",
        flexural_modulus: "1450 MPa",
        izod_impact_strength: "32 J/m",
        packaging: "25 kg Polypropylene Valve Sacks on Heat-Treated Pallets",
        gst_rate: "18%",
        _source: "platform_seed",
        _classification: "illustrative_content",
        _indicative_pricing: true,
      },
      hs_code: "39021000",
      is_active: true,
    },
    {
      business_id: godavariId,
      category_id: "raw-materials",
      subcategory_id: subcategoryMap["crca-cold-rolled-steel-coils"],
      title: "Cold Rolled Close Annealed Steel Sheets (CRCA Grade D, 1.2mm)",
      slug: "cold-rolled-close-annealed-crca-steel-sheets-1-2mm",
      description: "IS 513 Grade D commercial deep drawing quality CRCA steel sheets. Superior surface smoothness, tight gauge tolerances, and excellent formability for electrical enclosures and automotive panels.",
      moq: 5,
      unit: "Metric Tons",
      indicative_price: 61500.0,
      tiered_pricing: [
        { min_qty: 5, price: 61500.0 },
        { min_qty: 25, price: 58800.0 },
      ],
      specifications: {
        standard: "IS 513:2016 Grade D / CR2",
        thickness: "1.20 mm ± 0.04 mm",
        sheet_dimensions: "1220 mm x 2440 mm (4 x 8 feet)",
        yield_strength: "140 - 240 MPa",
        tensile_strength: "270 - 370 MPa",
        surface_oil: "Lightly Rust-Inhibited Oiled Finish",
        packaging: "Steel Strapped Bundles on Wooden Runners",
        gst_rate: "18%",
        _source: "platform_seed",
        _classification: "illustrative_content",
        _indicative_pricing: true,
      },
      hs_code: "72091790",
      is_active: true,
    },
  ];

  for (const p of productDefinitions) {
    const { data: existingP } = await db
      .from("products")
      .select("id")
      .eq("slug", p.slug)
      .maybeSingle();

    if (!existingP) {
      const { error: pErr } = await db.from("products").insert([p]);
      if (pErr) console.error("Error creating product:", p.title, pErr.message);
      else {
        report.products.created++;
        report.tablesAffected.add("products");
      }
    } else {
      report.products.skipped++;
    }
  }

  console.log(`✓ Products processed: ${report.products.created} created, ${report.products.skipped} existing`);

  // ------------------------------------------------------------------
  // 4. REALISTIC SERVICE PROVIDER WORKSPACES & SERVICES
  // ------------------------------------------------------------------
  console.log("\n[4/6] Seeding Business Services Catalogue & Service Provider Profiles...");

  const providerDefinitions = [
    {
      name: "Studio Apex Brand & Digital Labs LLP",
      legal_name: "Studio Apex Brand & Digital Labs LLP",
      slug: "studio-apex-brand-digital-labs",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400013",
      address: "Lower Parel Innovation Mills, Block C",
      phone: "+91-1800-SAMPLE-10",
      email: "hello@studioapex.coverly.internal",
      website: "https://studioapex.coverly.internal",
      verification_level: "unverified",
      headline: "Trade-Ready Industrial Branding, E-Commerce Stores & B2B Performance Marketing",
      bio: "Full-service digital agency helping manufacturers, wholesale distributors, and D2C brands build world-class packaging design, ERP-connected e-commerce websites, and targeted lead funnels.",
      experience_years: 9,
      service_areas: ["National", "Maharashtra", "Gujarat", "Delhi NCR"],
      certifications: ["Google Partner (Sample)", "Shopify Plus Expert (Sample)"],
    },
    {
      name: "LogiTrans Global Supply Chain & Freight Solutions",
      legal_name: "LogiTrans Multimodal Logistics India Ltd",
      slug: "logitrans-global-supply-chain-solutions",
      city: "Navi Mumbai",
      state: "Maharashtra",
      pincode: "400703",
      address: "Plot 22, Vashi Logistics Hub, Sector 19",
      phone: "+91-1800-SAMPLE-11",
      email: "freight@logitrans.coverly.internal",
      website: "https://logitrans.coverly.internal",
      verification_level: "unverified",
      headline: "Pan-India FTL Trucking, Nhava Sheva Customs Drayage & 3PL Warehousing",
      bio: "Integrated logistics provider operating verified GPS fleet networks across industrial corridors, offering container freight station clearance and supply chain optimization.",
      experience_years: 15,
      service_areas: ["Pan India", "JNPT Port Nhava Sheva", "Mundra Port", "Chennai Port"],
      certifications: ["Customs Broker License (Sample)", "WCA Logistics Member (Sample)"],
    },
    {
      name: "NexusTech Enterprise ERP & Cloud Systems",
      legal_name: "NexusTech Cloud Software Solutions Pvt Ltd",
      slug: "nexustech-enterprise-erp-systems",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500081",
      address: "HITEC City Phase 2, Mindspace Campus",
      phone: "+91-1800-SAMPLE-12",
      email: "enterprise@nexustech.coverly.internal",
      website: "https://nexustech.coverly.internal",
      verification_level: "unverified",
      headline: "Factory Automation, Barcode Inventory & Multi-Branch GST Billing ERP",
      bio: "Cloud ERP software architects deploying production scheduling, GST invoicing, mobile warehouse scanners, and field sales CRM modules for growing Indian manufacturing and wholesale enterprises.",
      experience_years: 8,
      service_areas: ["National", "Telangana", "Karnataka", "Maharashtra", "Tamil Nadu"],
      certifications: ["ISO 27001 (Sample)", "AWS Certified Cloud Architect (Sample)"],
    },
  ];

  const providerBusinessMap = {};

  for (const prov of providerDefinitions) {
    let bId = null;
    const { data: existingProv } = await db
      .from("businesses")
      .select("id")
      .eq("slug", prov.slug)
      .maybeSingle();

    if (existingProv) {
      bId = existingProv.id;
      report.serviceProviders.skipped++;
    } else {
      const { data: newProv, error: pErr } = await db
        .from("businesses")
        .insert([
          {
            name: prov.name,
            legal_name: prov.legal_name,
            slug: prov.slug,
            business_type: "service_provider",
            city: prov.city,
            state: prov.state,
            pincode: prov.pincode,
            address: prov.address,
            phone: prov.phone,
            email: prov.email,
            website: prov.website,
            verification_level: prov.verification_level,
            is_active: true,
          },
        ])
        .select("id")
        .single();

      if (pErr) {
        console.error("Error creating service provider business:", prov.name, pErr.message);
        continue;
      }

      bId = newProv.id;
      report.serviceProviders.created++;
      report.tablesAffected.add("businesses");

      // Provider Profile
      const { error: profErr } = await db.from("service_provider_profiles").insert([
        {
          business_id: bId,
          headline: prov.headline,
          bio: prov.bio,
          experience_years: prov.experience_years,
          service_areas: prov.service_areas,
          certifications: prov.certifications,
          website_url: prov.website,
        },
      ]);
      if (profErr) console.error("Error creating provider profile:", prov.name, profErr.message);
      else report.tablesAffected.add("service_provider_profiles");
    }

    providerBusinessMap[prov.slug] = bId;
  }

  // Also include existing TaxKraft provider
  const { data: existingTaxKraft } = await db
    .from("businesses")
    .select("id")
    .eq("slug", "taxkraft-corporate-legal-ca")
    .maybeSingle();

  const taxkraftId = existingTaxKraft?.id;
  const studioApexId = providerBusinessMap["studio-apex-brand-digital-labs"];
  const logiTransId = providerBusinessMap["logitrans-global-supply-chain-solutions"];
  const nexusTechId = providerBusinessMap["nexustech-enterprise-erp-systems"];

  // Query actual UUIDs for business_service_categories & subcategories
  const { data: bsCategories } = await db.from("business_service_categories").select("id, slug");
  const bsCatMap = {};
  for (const c of bsCategories || []) bsCatMap[c.slug] = c.id;

  const { data: bsSubcategories } = await db.from("business_service_subcategories").select("id, slug");
  const bsSubMap = {};
  for (const s of bsSubcategories || []) bsSubMap[s.slug] = s.id;

  const serviceDefinitions = [
    // 1. Legal / Registration: Trademark Registration
    {
      business_id: taxkraftId || studioApexId,
      category_id: bsCatMap["business-registration-legal"],
      subcategory_id: bsSubMap["trademark-registration"],
      title: "Comprehensive Trademark Search, Filing & Prosecution Package",
      slug: "comprehensive-trademark-search-filing-prosecution",
      short_description: "Protect your brand name, logo, or tagline with complete legal filing under the Indian Trademarks Act.",
      full_description: "End-to-end brand protection handled by experienced trademark attorneys. Includes comprehensive conflicting marks search across all 45 classes, drafting of user affidavits, Form TM-A electronic filing, and tracking through gazette publication.",
      deliverables: [
        "Pre-Filing Conflict Search & Registrability Legal Opinion",
        "Official Form TM-A Filing with Instant Application Number",
        "Power of Attorney & User Affidavit Legal Drafting",
        "First Examination Report Objection Reply Included",
      ],
      pricing_model: "fixed",
      starting_price: 3999.0,
      turnaround_days: 2,
      is_active: true,
    },
    // 2. Accounting: Annual Statutory Audit Assistance
    {
      business_id: taxkraftId || studioApexId,
      category_id: bsCatMap["accounting-finance"],
      subcategory_id: bsSubMap["auditing"],
      title: "Statutory & Tax Audit Preparation for Manufacturing MSMEs",
      slug: "statutory-tax-audit-preparation-msme",
      short_description: "Complete preparation of books, depreciation charts, and stock reconciliations for statutory Section 44AB audits.",
      full_description: "Ensure zero penalty compliance for your factory or wholesale firm. Our senior chartered accountants conduct rigorous pre-audit verification of fixed asset registers, inventory valuation (AS-2), TDS deductions, and preparation of Form 3CD schedules.",
      deliverables: [
        "Comprehensive Pre-Audit Balance Sheet & P&L Vetting",
        "Inventory Stock Reconciliation (FIFO / Weighted Average)",
        "TDS, TCS & GST 2B vs 3B Liability Reconciliation Schedules",
        "Final Draft Form 3CA/3CB and Form 3CD Compilation",
      ],
      pricing_model: "starting_at",
      starting_price: 14999.0,
      turnaround_days: 10,
      is_active: true,
    },
    // 3. Branding: Corporate Brand Identity & Logo
    {
      business_id: studioApexId,
      category_id: bsCatMap["branding-marketing"],
      subcategory_id: bsSubMap["brand-identity"],
      title: "Complete Enterprise Brand Identity & Visual Guidelines Suite",
      slug: "enterprise-brand-identity-visual-guidelines-suite",
      short_description: "Vector logo creation, color psychology palette, stationery, and comprehensive 30-page brand guidelines.",
      full_description: "Transform your industrial business into a trusted commercial brand. We design distinct visual identity assets tailored for international trade expos, factory signage, business cards, letterheads, and digital touchpoints.",
      deliverables: [
        "3 Original Vector Logo Concepts with Unlimited Iterations",
        "Complete Typography Hierarchy & Pantone / CMYK Color Palette",
        "Business Card, Letterhead & Envelope Print-Ready Artwork",
        "30-Page Brand Usage Guideline Manual (PDF)",
      ],
      pricing_model: "fixed",
      starting_price: 18500.0,
      turnaround_days: 7,
      is_active: true,
    },
    // 4. Branding: Industrial Packaging Design
    {
      business_id: studioApexId,
      category_id: bsCatMap["branding-marketing"],
      subcategory_id: bsSubMap["packaging-design"],
      title: "Export-Ready Product Packaging & Corrugated Box Dieline Design",
      slug: "export-product-packaging-dieline-design",
      short_description: "Print-ready CMYK artwork for master shipping cartons, pouches, and retail outer boxes adhering to BIS & legal metrology norms.",
      full_description: "Engineered for real-world print production. We build precise packaging dielines with barcode placements, FSSAI / ISI logo compliance, multilingual warning panels, and high-impact shelf graphics.",
      deliverables: [
        "Custom Dieline Template (AI / EPS Vector)",
        "3D Photorealistic Renderings for Buyer Catalogues",
        "Legal Metrology & Mandatory Label Compliance Checklist",
        "Final High-Resolution CMYK Offset / Flexo Print Files",
      ],
      pricing_model: "starting_at",
      starting_price: 8500.0,
      turnaround_days: 5,
      is_active: true,
    },
    // 5. Digital Marketing: B2B SEO & Google Ads
    {
      business_id: studioApexId,
      category_id: bsCatMap["branding-marketing"],
      subcategory_id: bsSubMap["seo-services"],
      title: "B2B Organic Search Engine Optimization (SEO) & Buyer Lead Funnel",
      slug: "b2b-organic-seo-buyer-lead-funnel",
      short_description: "Target commercial procurement search queries and drive qualified buyer inquiries directly to your product catalogue.",
      full_description: "Stop relying solely on trade exhibitions. We optimize your website architecture, product specification schema tags, and build high-authority trade citations to rank your manufacturing business at the top of Google search results.",
      deliverables: [
        "Target Keyword Strategy (Wholesale / Bulk / Manufacturer intent)",
        "On-Page Technical SEO & Product Schema Markup Fixes",
        "High Domain Authority Trade Directory Citations & Backlinks",
        "Monthly Ranking & Buyer Lead Conversion Analytics Report",
      ],
      pricing_model: "starting_at",
      starting_price: 15000.0,
      turnaround_days: 30,
      is_active: true,
    },
    // 6. Logistics: Full Truckload (FTL) Pan-India Transport
    {
      business_id: logiTransId,
      category_id: bsCatMap["logistics-supply-chain"],
      subcategory_id: bsSubMap["transport-services"],
      title: "Pan-India Full Truckload (FTL) Dedicated Freight Fleet Service",
      slug: "pan-india-ftl-dedicated-freight-fleet",
      short_description: "On-demand 32ft MXL, 20ft, and Taurus trucks for bulk inter-state consignment movement with real-time GPS tracking.",
      full_description: "Reliable industrial transport across golden quadrilateral and secondary industrial corridors. Fully insured transit, e-way bill verification, driver background validation, and 24/7 centralized dispatch tracking.",
      deliverables: [
        "Guaranteed Truck Placement within 24 Hours",
        "Live GPS Location Sharing with Consignee & Consignor",
        "E-Way Bill Compliance Check & Transit Risk Insurance",
        "Digitized Proof of Delivery (POD) Upload within 48 Hours",
      ],
      pricing_model: "custom_quote",
      starting_price: 25000.0,
      turnaround_days: 3,
      is_active: true,
    },
    // 7. Logistics: Import-Export Port Customs Broking
    {
      business_id: logiTransId,
      category_id: bsCatMap["logistics-supply-chain"],
      subcategory_id: bsSubMap["freight-forwarding"],
      title: "JNPT / Mundra Port Customs Clearance & Drayage Retainer",
      slug: "jnpt-mundra-port-customs-clearance-drayage",
      short_description: "Swift customs examination, bill of entry processing, and container carting at major Indian sea and air cargo terminals.",
      full_description: "Eliminate costly port demurrage and container detention. Our licensed customs brokers manage ICEGATE filings, SVB registrations, phytosanitary checks, and bonded warehouse transfers seamlessly.",
      deliverables: [
        "Advance Bill of Entry / Shipping Bill ICEGATE Filing",
        "HS Code Harmonization & Duty Assessment Advisory",
        "Port Gate In / Gate Out Coordination & Container Drayage",
        "Phytosanitary, FSSAI or BIS Port Inspection Escort",
      ],
      pricing_model: "custom_quote",
      starting_price: 12000.0,
      turnaround_days: 2,
      is_active: true,
    },
    // 8. Technology: Factory ERP & Production Tracking
    {
      business_id: nexusTechId,
      category_id: bsCatMap["technology-it"],
      subcategory_id: bsSubMap["erp-solutions"],
      title: "Cloud Factory ERP: Production Planning, BOM & Inventory Suite",
      slug: "cloud-factory-erp-production-bom-inventory",
      short_description: "Custom ERP implementation tailored for discrete manufacturing, bill of materials (BOM), raw material reorders, and dispatch.",
      full_description: "Modernize your factory floor operations. Replace error-prone spreadsheets with automated work orders, machine downtime logs, batch traceability, multi-warehouse stock tracking, and supervisor mobile dashboards.",
      deliverables: [
        "Bill of Materials (BOM) & Work Order Routing Configuration",
        "Real-Time Raw Material vs Finished Goods Inventory Ledger",
        "Operator Role-Based Access on Mobile / Tablet Terminals",
        "Onsite Staff Training & 12 Months Technical Support",
      ],
      pricing_model: "starting_at",
      starting_price: 45000.0,
      turnaround_days: 21,
      is_active: true,
    },
    // 9. Technology: Barcode Warehouse & Invoicing Billing Software
    {
      business_id: nexusTechId,
      category_id: bsCatMap["technology-it"],
      subcategory_id: bsSubMap["billing-software"],
      title: "GST E-Invoicing & Barcode Warehouse Dispatch Automation",
      slug: "gst-e-invoicing-barcode-warehouse-dispatch",
      short_description: "One-click IRN generation, automated E-Way bill generation, and handheld barcode scanner dispatch verification.",
      full_description: "Eliminate shipping errors and dispatch penalties. Our billing automation integrates directly with the GST portal for instant QR-code invoices, automatic pick-list generation, and wireless barcode scanner verification.",
      deliverables: [
        "Government E-Invoicing Portal API Live Integration",
        "Thermal Barcode Label & Shipping Manifest Printing Setup",
        "Handheld Scanner Setup for Pick-and-Pack Validation",
        "Automatic SMS / Email Dispatch Notifications to Buyers",
      ],
      pricing_model: "fixed",
      starting_price: 19500.0,
      turnaround_days: 5,
      is_active: true,
    },
    // 10. Business Consulting: Detailed Project Report (DPR) for Bank Loans
    {
      business_id: taxkraftId || studioApexId,
      category_id: bsCatMap["business-consulting"],
      subcategory_id: bsSubMap["business-plan-development"],
      title: "Detailed Project Report (DPR) & Financial CMA Data for Bank Financing",
      slug: "detailed-project-report-dpr-cma-bank-financing",
      short_description: "Bankable project feasibility report with 5-year DSCR ratios, break-even analysis, and working capital computation.",
      full_description: "Prepare an irrefutable credit appraisal dossier for term loans and working capital under CGTMSE or MSME subsidy schemes. Prepared by veteran financial analysts to meet nationalized and private bank credit parameters.",
      deliverables: [
        "Comprehensive 40+ Page Bankable Detailed Project Report",
        "5-Year Projected Balance Sheet, P&L, and Cash Flow Models",
        "Credit Monitoring Arrangement (CMA) Data Workbook",
        "Debt Service Coverage Ratio (DSCR) & Sensitivity Analysis",
      ],
      pricing_model: "starting_at",
      starting_price: 12500.0,
      turnaround_days: 7,
      is_active: true,
    },
  ];

  for (const s of serviceDefinitions) {
    if (!s.business_id || !s.category_id) continue;

    const { data: existingS } = await db
      .from("business_services")
      .select("id")
      .eq("slug", s.slug)
      .maybeSingle();

    if (!existingS) {
      const { error: sErr } = await db.from("business_services").insert([s]);
      if (sErr) console.error("Error creating business service:", s.title, sErr.message);
      else {
        report.businessServices.created++;
        report.tablesAffected.add("business_services");
      }
    } else {
      report.businessServices.skipped++;
    }
  }

  console.log(`✓ Business services: ${report.businessServices.created} created, ${report.businessServices.skipped} existing`);

  // ------------------------------------------------------------------
  // 5. SAMPLE PROCUREMENT RFQS (TRANSPARENTLY LABELLED SAMPLE DATA)
  // ------------------------------------------------------------------
  console.log("\n[5/6] Seeding Illustrative Sample RFQ Procurement Requirements...");

  // Find a valid buyer user for sample RFQs
  const { data: buyerUser } = await db
    .from("users")
    .select("id")
    .eq("email", "buyer@bharatretail.in")
    .maybeSingle();

  const { data: buyerBusiness } = await db
    .from("businesses")
    .select("id")
    .eq("slug", "bharat-retail-stores-sourcing")
    .maybeSingle();

  const sampleBuyerUserId = buyerUser?.id;
  const sampleBuyerBusinessId = buyerBusiness?.id;

  if (sampleBuyerUserId) {
    const sampleRfqDefinitions = [
      {
        rfq_number: "SAMPLE-RFQ-PACKAGING-01",
        title: "[Sample Requirement] Bulk Sourcing of 50,000 HDPE Woven Sacks with PE Liner",
        category_id: "packaging-materials",
        delivery_city: "Surat",
        delivery_pincode: "395002",
        dispatch_mode: "broadcast",
        status: "submitted",
        notes: "ILLUSTRATIVE SAMPLE RFQ: Demonstration procurement requirement created for catalog showcase and supplier quote simulation. Not an actual customer purchase order.",
        items: [
          {
            item_name: "HDPE Woven Sacks 50kg Capacity with LDPE Liner",
            quantity: 50000,
            unit: "bags",
            target_unit_price: 15.5,
            specifications: {
              size: "24 x 36 inch",
              denier: "1000 D",
              weight: "85 grams/bag",
              color: "Milky White with Two-Color Brand Print",
            },
          },
        ],
      },
      {
        rfq_number: "SAMPLE-RFQ-AGRI-02",
        title: "[Sample Requirement] Annual Procurement of 100 MT Non-Basmati IR-64 Parboiled Rice",
        category_id: "agriculture-products",
        delivery_city: "Mumbai",
        delivery_pincode: "400001",
        dispatch_mode: "broadcast",
        status: "submitted",
        notes: "ILLUSTRATIVE SAMPLE RFQ: Demonstration procurement requirement created for catalog showcase and supplier quote simulation. Not an actual customer purchase order.",
        items: [
          {
            item_name: "IR 64 Parboiled Rice 5% Broken Sortex Clean",
            quantity: 100,
            unit: "Metric Tons",
            target_unit_price: 35000.0,
            specifications: {
              broken: "Max 5%",
              moisture: "Max 14%",
              packaging: "50kg Export Grade HDPE Bags",
            },
          },
        ],
      },
      {
        rfq_number: "SAMPLE-RFQ-CONSTRUCT-03",
        title: "[Sample Requirement] Supply of 200 MT Fe-550D TMT Steel Rebars for Commercial Project",
        category_id: "construction-materials",
        delivery_city: "Pune",
        delivery_pincode: "411001",
        dispatch_mode: "broadcast",
        status: "submitted",
        notes: "ILLUSTRATIVE SAMPLE RFQ: Demonstration procurement requirement created for catalog showcase and supplier quote simulation. Not an actual customer purchase order.",
        items: [
          {
            item_name: "12mm TMT Rebars Grade Fe-550D (Primary Steel Producer)",
            quantity: 120,
            unit: "Metric Tons",
            target_unit_price: 52000.0,
            specifications: {
              grade: "Fe-550D High Ductility",
              certification: "IS 1786:2008 with Mill Test Certificate",
            },
          },
          {
            item_name: "16mm TMT Rebars Grade Fe-550D",
            quantity: 80,
            unit: "Metric Tons",
            target_unit_price: 51500.0,
            specifications: {
              grade: "Fe-550D High Ductility",
              certification: "IS 1786:2008 with Mill Test Certificate",
            },
          },
        ],
      },
      {
        rfq_number: "SAMPLE-RFQ-MACHINERY-04",
        title: "[Sample Requirement] Turnkey Liquid Bottle Filling & Continuous Band Sealing Line",
        category_id: "industrial-machinery",
        delivery_city: "Ahmedabad",
        delivery_pincode: "380015",
        dispatch_mode: "broadcast",
        status: "submitted",
        notes: "ILLUSTRATIVE SAMPLE RFQ: Demonstration procurement requirement created for catalog showcase and supplier quote simulation. Not an actual customer purchase order.",
        items: [
          {
            item_name: "4-Nozzle Automatic Liquid Piston Filling Machine",
            quantity: 1,
            unit: "units",
            target_unit_price: 285000.0,
            specifications: {
              filling_range: "100ml - 1000ml",
              speed: "25 - 35 bottles/min",
              material: "SS316 Product Contact Parts",
            },
          },
          {
            item_name: "Continuous Band Sealer with Nitrogen Gas Purge",
            quantity: 2,
            unit: "units",
            target_unit_price: 32000.0,
            specifications: {
              sealing_speed: "0-12 m/min",
              construction: "SS304 Heavy Duty",
            },
          },
        ],
      },
      {
        rfq_number: "SAMPLE-RFQ-FOOD-05",
        title: "[Sample Requirement] Contract Sourcing of Spray-Dried Skimmed Milk Powder (25 MT)",
        category_id: "food-beverages",
        delivery_city: "Delhi",
        delivery_pincode: "110006",
        dispatch_mode: "broadcast",
        status: "submitted",
        notes: "ILLUSTRATIVE SAMPLE RFQ: Demonstration procurement requirement created for catalog showcase and supplier quote simulation. Not an actual customer purchase order.",
        items: [
          {
            item_name: "Medium Heat Spray Dried Skimmed Milk Powder (SMP)",
            quantity: 25000,
            unit: "kg",
            target_unit_price: 300.0,
            specifications: {
              protein: "Min 34%",
              fat: "Max 1.25%",
              packaging: "25kg Multiwall Paper Bags with PE Liner",
            },
          },
        ],
      },
      {
        rfq_number: "SAMPLE-RFQ-ELECTRO-06",
        title: "[Sample Requirement] Batch Production of 5,000 Double-Sided FR-4 Industrial PCBs",
        category_id: "electronics",
        delivery_city: "Bengaluru",
        delivery_pincode: "560001",
        dispatch_mode: "broadcast",
        status: "submitted",
        notes: "ILLUSTRATIVE SAMPLE RFQ: Demonstration procurement requirement created for catalog showcase and supplier quote simulation. Not an actual customer purchase order.",
        items: [
          {
            item_name: "2-Layer FR-4 Bare PCBs with Lead-Free HASL (120x80mm)",
            quantity: 5000,
            unit: "pieces",
            target_unit_price: 110.0,
            specifications: {
              thickness: "1.6 mm",
              copper: "1 oz",
              solder_mask: "Matte Green with White Legend",
              testing: "100% E-Tested",
            },
          },
        ],
      },
    ];

    for (const rfqDef of sampleRfqDefinitions) {
      const { data: existingRfq } = await db
        .from("rfqs")
        .select("id")
        .eq("rfq_number", rfqDef.rfq_number)
        .maybeSingle();

      if (!existingRfq) {
        const { data: newRfq, error: rfqErr } = await db
          .from("rfqs")
          .insert([
            {
              rfq_number: rfqDef.rfq_number,
              buyer_id: sampleBuyerUserId,
              business_id: sampleBuyerBusinessId || null,
              title: rfqDef.title,
              category_id: rfqDef.category_id,
              delivery_city: rfqDef.delivery_city,
              delivery_pincode: rfqDef.delivery_pincode,
              dispatch_mode: rfqDef.dispatch_mode,
              status: rfqDef.status,
              notes: rfqDef.notes,
            },
          ])
          .select("id")
          .single();

        if (rfqErr) {
          console.error("Error creating sample RFQ:", rfqDef.title, rfqErr.message);
          continue;
        }

        report.sampleRfqs.created++;
        report.tablesAffected.add("rfqs");

        // Insert RFQ items
        const rfqItemsPayload = rfqDef.items.map((item) => ({
          rfq_id: newRfq.id,
          item_name: item.item_name,
          quantity: item.quantity,
          unit: item.unit,
          target_unit_price: item.target_unit_price,
          specifications: item.specifications,
        }));

        const { error: itemsErr } = await db.from("rfq_items").insert(rfqItemsPayload);
        if (itemsErr) console.error("Error inserting RFQ items:", itemsErr.message);
        else report.tablesAffected.add("rfq_items");
      } else {
        report.sampleRfqs.skipped++;
      }
    }
  }

  console.log(`✓ Sample RFQ requirements: ${report.sampleRfqs.created} created, ${report.sampleRfqs.skipped} existing`);

  // ------------------------------------------------------------------
  // 6. FINAL AUDIT & SUMMARY REPORT
  // ------------------------------------------------------------------
  console.log("\n====================================================================");
  console.log("COVERLY Marketplace Data Architecture — Execution Report");
  console.log("====================================================================");
  console.log("Data Classification:  platform_seed / illustrative_content");
  console.log("Pricing Accuracy:     Indicative B2B Wholesale Estimates (INR)");
  console.log("Verification Status:  Unverified (Fictional Trade Entities)");
  console.log("Idempotency:          Verified Safe (Zero Duplicate Insertions)");
  console.log("Tables Affected:     ", Array.from(report.tablesAffected).join(", "));
  console.log("Detailed Counts:");
  console.log(" - Product Categories:    ", report.categories);
  console.log(" - Product Subcategories: ", report.subcategories);
  console.log(" - Supplier Businesses:   ", report.suppliers);
  console.log(" - Wholesale Products:    ", report.products);
  console.log(" - Service Providers:     ", report.serviceProviders);
  console.log(" - Business Services:     ", report.businessServices);
  console.log(" - Sample RFQs:           ", report.sampleRfqs);
  console.log("====================================================================\n");
}

seed().catch((err) => {
  console.error("Fatal error during marketplace seeding:", err);
  process.exit(1);
});
